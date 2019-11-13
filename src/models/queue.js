import { createListViewModel } from 'medisys-model'
// moment
import moment from 'moment'
import { subscribeNotification } from '@/utils/realtime'
import * as service from '../services/queue'
import {
  StatusIndicator,
  VISIT_STATUS,
} from '@/pages/Reception/Queue/variables'

const InitialSessionInfo = {
  isClinicSessionClosed: true,
  id: '',
  // sessionNo: `${moment().format('YYMMDD')}-01`,
  sessionNo: 'N/A',
  sessionNoPrefix: '',
  sessionStartDate: '',
  sessionCloseDate: '',
}

export default createListViewModel({
  namespace: 'queueLog',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      list: [],
      sessionInfo: { ...InitialSessionInfo },
      patientList: [],
      appointmentList: [],
      currentFilter: StatusIndicator.ALL,
      selfOnly: false,
      error: {
        hasError: false,
        message: '',
      },
    },
    subscriptions: ({ dispatch }) => {
      subscribeNotification('QueueListing', {
        callback: () => {
          dispatch({ type: 'refresh' })
        },
      })
    },
    effects: {
      *initState (_, { select, put, take }) {
        let user = yield select((state) => state.user.data)

        let { clinicianProfile: { userProfile: { role: userRole } } } = user
        if (userRole === undefined) {
          yield take('user/fetchCurrent/@@end')
          user = yield select((state) => state.user.data)
          userRole = user.clinicianProfile.userProfile.role

          yield put({
            type: 'codetable/fetchCodes',
            payload: {
              code: 'clinicianprofile',
            },
          })
        }
        yield put({
          type: 'updateState',
          payload: {
            list: [],
            selfOnly: userRole && userRole.clinicRoleFK === 1,
          },
        })
      },
      *startSession (_, { call, put }) {
        const response = yield call(service.startSession)
        console.log('start session', { response })

        if (response) {
          // start session successfully
          yield put({
            type: 'updateSessionInfo',
            payload: { ...response },
          })
          yield put({
            type: 'query',
            payload: {
              'VisitFKNavigation.BizSessionFK': response.id,
            },
          })
        }
        return yield put({
          type: 'toggleError',
          error: {
            hasError: true,
            message: 'Failed to start session.',
          },
        })
      },
      *endSession ({ sessionID }, { call, put }) {
        const response = yield call(service.endSession, sessionID)
        console.log({ response })
        if (response) {
          yield put({
            type: 'updateState',
            payload: {
              sessionInfo: {
                isClinicSessionClosed: true,
                id: '',
                // sessionNo: `${moment().format('YYMMDD')}-01`,
                sessionNo: 'N/A',
                sessionNoPrefix: '',
                sessionStartDate: '',
                sessionCloseDate: '',
              },
            },
          })
        }
        return response
        // const { status } = response

        // if (status >= 204 && status < 400) {
        //   // end session successfully, reset session info
        //   // yield put({
        //   //   type: 'updateSessionInfo',
        //   //   payload: { ...InitialSessionInfo },
        //   // })
        //   // yield put({
        //   //   type: 'global/sendNotification',
        //   //   payload: {
        //   //     type: 'QueueListing',
        //   //     data: {
        //   //       sender: 'End Session',
        //   //       message: 'Session has been ended',
        //   //     },
        //   //   },
        //   // })
        // }

        // return response
      },
      *getCurrentActiveSessionInfo (_, { call, put }) {
        const bizSessionPayload = {
          IsClinicSessionClosed: false,
        }
        const response = yield call(service.getBizSession, bizSessionPayload)
        const { data } = response
        if (data && data.totalRecords === 1) {
          const { data: sessionData } = data
          yield put({
            type: 'updateSessionInfo',
            payload: { ...sessionData[0] },
          })
        }
      },
      *getSessionInfo (
        { payload = { shouldGetTodayAppointments: true } },
        { call, put, all, select, take },
      ) {
        let user = yield select((state) => state.user.data)
        let { clinicianProfile: { userProfile: { role: userRole } } } = user

        const { shouldGetTodayAppointments = true } = payload
        const bizSessionPayload = {
          IsClinicSessionClosed: false,
        }
        const response = yield call(service.getBizSession, bizSessionPayload)

        const { data } = response
        // data = null when get session failed
        if (data && data.totalRecords === 1) {
          const { data: sessionData } = data

          yield all([
            put({
              type: 'query',
              payload: {
                pagesize: 999,
                'VisitFKNavigation.BizSessionFK': sessionData[0].id,
              },
            }),
            put({
              type: 'updateSessionInfo',
              payload: { ...sessionData[0] },
            }),
            put({
              type: 'getTodayAppointments',
              payload: {
                shouldGetTodayAppointments,
              },
            }),
          ])

          return true
        }
        return false
      },
      *getTodayAppointments ({ payload }, { call, put }) {
        const { shouldGetTodayAppointments = true } = payload
        // TODO: integrate with new appointment listing api
        if (shouldGetTodayAppointments) {
          const today = moment().formatUTC()
          const queryPayload = {
            combineCondition: 'and',
            eql_appointmentDate: today,
            in_appointmentStatusFk: '1|5',
          }
          const response = yield call(
            service.queryAppointmentListing,
            queryPayload,
          )
          if (response) {
            const { data: { data = [] } } = response
            yield put({
              type: 'updateState',
              payload: {
                appointmentList: data.map((item) => ({
                  ...item,
                  visitStatus: VISIT_STATUS.UPCOMING_APPT,
                })),
              },
            })
          }
        }
      },
      *deleteQueueByQueueID ({ payload }, { call, put }) {
        const result = yield call(service.deleteQueue, payload)
        yield put({
          type: 'refresh',
        })
        return result
      },
      *refresh ({ payload }, { put }) {
        yield put({
          type: 'getSessionInfo',
          payload,
        })
        return true
      },
      *searchPatient ({ payload }, { take, put }) {
        const prefix = 'like_'
        const { searchQuery } = payload
        yield put({
          type: 'patientSearch/query',
          payload: {
            version: Date.now(),
            [`${prefix}name`]: searchQuery,
            [`${prefix}patientAccountNo`]: searchQuery,
            [`${prefix}contactFkNavigation.contactNumber.number`]: searchQuery,
            combineCondition: 'or',
          },
        })

        yield take('patientSearch/query/@@end')

        return true
      },
    },
    reducers: {
      toggleSelfOnly (state) {
        return { ...state, selfOnly: !state.selfOnly }
      },
      toggleError (state, { error = {} }) {
        return { ...state, error: { ...error } }
      },
      updateSessionInfo (state, { payload }) {
        return { ...state, sessionInfo: { ...payload } }
      },
      showError (state, { payload }) {
        return { ...state, errorMessage: payload }
      },
      updateFilter (state, { status }) {
        return { ...state, currentFilter: status }
      },
    },
  },
})
