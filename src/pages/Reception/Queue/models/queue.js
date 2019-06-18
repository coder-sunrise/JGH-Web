// import { queryFakeList, fakeSubmitForm } from '@/services/api'
import moment from 'moment'
import { createListViewModel } from 'medisys-model'
import * as service from '../services'
import { notification } from '@/components'
import Error, { showErrorNotification } from '@/utils/error'
import { StatusIndicator } from '../variables'

const MessageWrapper = ({ children }) => (
  <div>
    <h3>An error occured</h3>
    <h4>{children}</h4>
  </div>
)

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
      sessionInfo: { ...InitialSessionInfo },
      patientList: [],
      queueListing: [],
      visitPatientInfo: {},
      currentFilter: StatusIndicator.ALL,
    },
    subscriptions: (props) => {
      console.log('subscriptions props', { props })
    },
    effects: {
      *startSession (_, { call, put }) {
        const response = yield call(service.startSession)
        const { data } = response
        if (data && data.id) {
          // start session successfully
          return yield put({
            type: 'updateSessionInfo',
            payload: { ...data },
          })
        }
        return yield put({
          type: 'updateSessionInfo',
          payload: { ...InitialSessionInfo },
        })
      },
      *endSession ({ sessionID }, { call, put }) {
        const response = yield call(service.endSession, sessionID)
        const { status } = response
        if (status >= 204)
          // end session successfully, reset session info
          yield put({
            type: 'updateSessionInfo',
            payload: { ...InitialSessionInfo },
          })
        return status >= 204
      },
      *getSessionInfo (_, { call, put }) {
        const response = yield call(service.getActiveSession)
        const { data } = response
        // data = null when get session failed

        if (data && data.totalRecords === 1) {
          const { data: sessionData } = data

          const queueListingResponse = yield call(
            service.getQueueListing,
            sessionData[0].id,
          )

          yield put({
            type: 'updateQueueListing',
            payload: { ...queueListingResponse },
          })

          return yield put({
            type: 'updateSessionInfo',
            payload: { ...sessionData[0] },
          })
        }

        return yield put({
          type: 'updateSessionInfo',
          payload: { ...InitialSessionInfo },
        })
      },
      *fetchQueueListing ({ sessionID }, { call, put }) {
        const response = yield call(service.getQueueListing, sessionID)
        const { status, data } = response
        console.log({ response })
        return yield put({
          type: 'updateQueueListing',
          queueListing: [],
        })
      },
      *fetchPatientListByName ({ payload }, { call, put }) {
        try {
          const response = !payload
            ? yield call(service.fetchPatientList)
            : yield call(service.fetchPatientListByName, payload)
          const { data } = response
          return yield put({
            type: 'updatePatientList',
            payload: [
              ...data.data,
            ],
          })
        } catch (error) {
          notification.error({
            message: (
              <MessageWrapper>Failed to retrieve patient list</MessageWrapper>
            ),
            duration: 0,
          })
          return yield put({
            type: 'updatePatientList',
            payload: [],
          })
        }
      },
      *fetchPatientInfoByPatientID ({ payload }, { call, put }) {
        const response = yield call(
          service.fetchPatientInfoByPatientID,
          payload.patientID,
        )
        return yield put({
          type: 'updateVisitPatientInfo',
          payload: {
            ...response.data,
          },
        })
      },
      *registerVisitInfo ({ payload }, { call, put }) {
        const response = yield call(service.registerVisit, payload.visitInfo)
        return yield put({
          type: 'registerVisit',
          payload: {
            ...response.data.entities,
          },
        })
      },
    },
    reducers: {
      updateSessionInfo (state, { payload }) {
        return { ...state, sessionInfo: { ...payload } }
      },
      updateVisitPatientInfo (state, { payload }) {
        return {
          ...state,
          visitPatientInfo: { ...payload },
        }
      },
      updatePatientList (state, { payload }) {
        return {
          ...state,
          patientList: [
            ...payload,
          ],
        }
      },
      updateQueueListing (state, { queueListing }) {
        return { ...state }
      },
      registerVisit (state, { payload }) {
        return { ...state }
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
