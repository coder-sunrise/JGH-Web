import { createListViewModel } from 'medisys-model'
// moment
import moment from 'moment'
import { subscribeNotification, sendNotification } from '@/utils/realtime'
import { notification } from '@/components'
import {
  StatusIndicator,
  VISIT_STATUS,
} from '@/pages/Reception/Queue/variables'
import { sendQueueNotification } from '@/pages/Reception/Queue/utils'
import Authorized from '@/utils/Authorized'
import { VALUE_KEYS } from '@/utils/constants'
import * as service from '../services/queue'
import { getUserPreference, saveUserPreference } from '@/services/user'

const InitialSessionInfo = {
  isClinicSessionClosed: undefined,
  id: '',
  // sessionNo: `${moment().format('YYMMDD')}-01`,
  sessionNo: 'N/A',
  sessionNoPrefix: '',
  sessionStartDate: '',
  sessionCloseDate: '',
}

const combineDateTime = (date, time) => {
  const appointmentDate = date.split('T')[0]
  return `${appointmentDate}T${time}`
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
      statusTagClicked: false,
      sessionInfo: { ...InitialSessionInfo },
      patientList: [],
      appointmentList: [],
      currentFilter: StatusIndicator.ALL,
      selfOnly: undefined,
      hideSelfOnlyFilter: false,
      _modifiedSelftOnly: false,
      error: {
        hasError: false,
        message: '',
      },
    },
    subscriptions: ({ history, dispatch, ...restProps }) => {
      history.listen(async location => {
        const { pathname } = location
        if (pathname === '/reception/queue') {
          dispatch({
            type: 'queueCalling/getExistingQueueCallList',
            payload: {
              keys: VALUE_KEYS.QUEUECALLING,
            },
          }).then(response => {
            const { value } = response
            const {
              lastUpdateDate: lastUpdateTime,
              concurrencyToken,
            } = response
            if (value) {
              const existingQCall = JSON.parse(value)
              dispatch({
                type: 'queueCalling/updateState',
                payload: {
                  lastUpdateDate: lastUpdateTime,
                  oriQCallList: existingQCall,
                  concurrencyToken,
                },
              })
            }
          })

          dispatch({
            type: 'getUserPreference',
            payload: {
              type: '9',
            },
          })
        }
      })
    },
    effects: {
      *initState(_, { select, put }) {
        let user = JSON.parse(
          sessionStorage.getItem('user') || localStorage.getItem('user'),
        ).data
        const queueLogState = yield select(state => state.queueLog)
        let {
          clinicianProfile: {
            userProfile: { role: userRole },
          },
        } = user
        if (userRole === undefined) {
          user = yield select(state => state.user.data)
          userRole = user.clinicianProfile.userProfile.role

          yield put({
            type: 'codetable/fetchCodes',
            payload: {
              code: 'clinicianprofile',
            },
          })
        }
        const startAndResumeRight = Authorized.check(
          'patientdashboard.startresumeconsultation',
        )
        let startConsultPermissionIsHidden = false
        if (startAndResumeRight && startAndResumeRight.rights === 'hidden') {
          startConsultPermissionIsHidden = true
        }

        const servePatientRight = Authorized.check('queue.servepatient')

        yield put({
          type: 'updateState',
          payload: {
            list: [],
            sessionInfo: { ...InitialSessionInfo },
            hideSelfOnlyFilter: startConsultPermissionIsHidden,
            selfOnly:
              queueLogState.selfOnly !== undefined &&
              queueLogState.selfOnly !== null
                ? queueLogState.selfOnly
                : userRole &&
                  ((userRole.clinicRoleFK === 1 &&
                    !startConsultPermissionIsHidden) ||
                    (userRole.clinicRoleFK === 6 &&
                      servePatientRight &&
                      servePatientRight.rights !== 'hidden')),
          },
        })
      },
      *startSession(_, { call, put }) {
        const response = yield call(service.startSession)

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
      *endSession({ sessionID }, { call, put }) {
        const response = yield call(service.endSession, sessionID)

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
      },
      *reopenLastSession(_, { call, put }) {
        const response = yield call(service.reopenLastSession)

        if (response) {
          // reopen session successfully
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
            message: 'Failed to reopen session.',
          },
        })
      },
      *getCurrentActiveSessionInfo(_, { call, put }) {
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
      *getSessionInfo(
        { payload = { shouldGetTodayAppointments: true } },
        { call, put, all, select, take },
      ) {
        let user = yield select(state => state.user.data)
        let {
          clinicianProfile: {
            userProfile: { role: userRole },
          },
        } = user

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
        InitialSessionInfo.isClinicSessionClosed = true

        yield put({
          type: 'updateSessionInfo',
          payload: { ...InitialSessionInfo },
        })
        return false
      },
      *getTodayAppointments({ payload }, { call, put, select }) {
        const { shouldGetTodayAppointments = true } = payload
        // TODO: integrate with new appointment listing api

        const doctorProperty =
          'Appointment_Resources.CalendarResourceFKNavigation.ClinicianProfile.Id'
        const viewOtherApptAccessRight = Authorized.check(
          'appointment.viewotherappointment',
        )
        const user = yield select(state => state.user)
        let doctor
        if (
          !viewOtherApptAccessRight ||
          viewOtherApptAccessRight.rights !== 'enable'
        ) {
          doctor = user.data.clinicianProfile.id
        }
        if (shouldGetTodayAppointments) {
          const today = moment().formatUTC()
          const queryPayload = {
            combineCondition: 'and',
            eql_appointmentDate: today,
            in_appointmentStatusFk: '1|5',
            [doctorProperty]: doctor,
          }
          const response = yield call(
            service.queryAppointmentListing,
            queryPayload,
          )
          if (response) {
            const {
              data: { data = [] },
            } = response
            yield put({
              type: 'updateState',
              payload: {
                appointmentList: data.map(item => ({
                  ...item,
                  visitStatus: VISIT_STATUS.UPCOMING_APPT,
                  appointmentTime: combineDateTime(
                    item.appointmentDate,
                    item.startTime,
                  ),
                })),
              },
            })
          }
        }
      },
      *getWorkItemDetailStatus({ payload }, { call, put, select }) {
        const r = yield call(service.workItemDetailStatus, payload)
        const { status, data = [] } = r
        if (status === '200') return data
        return []
      },
      *deleteQueueByQueueID({ payload }, { call, put }) {
        const result = yield call(service.deleteQueue, payload)
        if (result) {
          notification.success({
            message: 'Visit Deleted',
          })
          yield put({
            type: 'refresh',
          })
          sendQueueNotification({
            message: 'Visit deleted.',
            queueNo: payload.queueNo,
          })
        }
        return result
      },
      *refresh({ payload }, { put }) {
        yield put({
          type: 'updateState',
          payload: {
            list: [],
          },
        })
        yield put({
          type: 'getSessionInfo',
          payload,
        })
        return true
      },
      *searchPatient({ payload }, { take, put }) {
        const prefix = 'like_'
        const { searchQuery } = payload
        yield put({
          type: 'patientSearch/query',
          payload: {
            version: Date.now(),
            // [`${prefix}name`]: searchQuery,
            // [`${prefix}patientAccountNo`]: searchQuery,
            // [`${prefix}contactFkNavigation.contactNumber.number`]: searchQuery,
            // combineCondition: 'or',
            apiCriteria: {
              searchValue: searchQuery,
            },
          },
        })

        yield take('patientSearch/query/@@end')

        return true
      },
      *updateQueueListing({ payload }, { call, put }) {
        const response = yield call(service.updateQueueListing, payload)
        if (!response) {
          return false
        }
        return true
      },
      *setServingPerson({ payload }, { call, put }) {
        const response = yield call(service.setServingPerson, payload.visitFK)
        if (response) {
          yield put({
            type: 'getSessionInfo',
          })
        }
      },
      *saveUserPreference({ payload }, { call, put, select }) {
        const { queueFilterBar } = yield select(st => st.queueLog)
        const newDetail = {
          ...queueFilterBar,
          ...payload.userPreferenceDetails.value,
        }
        const r = yield call(saveUserPreference, {
          userPreferenceDetails: JSON.stringify({
            value: newDetail,
            Identifier: 'Queue',
          }),
          itemIdentifier: payload.itemIdentifier,
          type: payload.type,
        })
        if (r === 204) {
          window.g_app._store.dispatch({
            type: 'codetable/refreshCodes',
            payload: {
              code: 'userpreference',
              force: true,
            },
          })
          yield put({
            type: 'updateState',
            payload: {
              queueFilterBar: newDetail,
            },
          })
          return true
        }

        return false
      },
      *getUserPreference({ payload }, { call, put, select }) {
        const r = yield call(getUserPreference, payload.type)
        const { status, data } = r
        if (status === '200') {
          const clinicSettings = yield select(st => st.clinicSettings)
          const visitTypeSetting = JSON.parse(
            clinicSettings?.settings?.visitTypeSetting,
          )
          const activeVisitType = (visitTypeSetting || [])
            .filter(vt => vt.isEnabled === 'true')
            .map(vt => vt.id)

          let newVisitType = [-99, ...activeVisitType]
          let doctor = []
          if (data) {
            let user = JSON.parse(
              sessionStorage.getItem('user') || localStorage.getItem('user'),
            ).data
            let {
              clinicianProfile: {
                userProfile: { role: userRole },
              },
            } = user
            const filterBar = JSON.parse(data)
            let queueFilterBar
            if (payload.type === '9') {
              queueFilterBar = filterBar.find(o => o.Identifier === 'Queue')
            }
            const queue = queueFilterBar?.value || {}
            const { visitType } = queue
            doctor = queue.doctor || []

            if (visitType) {
              newVisitType = visitType.filter(
                vt => activeVisitType.indexOf(vt) >= 0,
              )
              if (newVisitType.length === activeVisitType.length) {
                newVisitType = [-99, ...newVisitType]
              }
            }
            let newPayload = {
              queueFilterBar: {
                ...queue,
                visitType: newVisitType,
                doctor: doctor,
              },
            }
            if (
              queue.selfOnly !== undefined &&
              queue.selfOnly !== null &&
              userRole &&
              (userRole.clinicRoleFK === 1 || userRole.clinicRoleFK === 6)
            ) {
              newPayload = {
                queueFilterBar: {
                  ...queue,
                  visitType: newVisitType,
                  doctor: doctor,
                },
                selfOnly: queue.selfOnly,
              }
            }
            yield put({
              type: 'updateState',
              payload: newPayload,
            })
          } else {
            yield put({
              type: 'updateState',
              payload: {
                queueFilterBar: {
                  visitType: newVisitType,
                  doctor: doctor,
                },
              },
            })
          }
        }
        return null
      },
    },
    reducers: {
      toggleSelfOnly(state) {
        return { ...state, selfOnly: !state.selfOnly, _modifiedSelftOnly: true }
      },
      toggleError(state, { error = {} }) {
        return { ...state, error: { ...error } }
      },
      updateSessionInfo(state, { payload }) {
        return { ...state, sessionInfo: { ...payload } }
      },
      showError(state, { payload }) {
        return { ...state, errorMessage: payload }
      },
      updateFilter(state, { status }) {
        return { ...state, currentFilter: status }
      },
    },
  },
})
