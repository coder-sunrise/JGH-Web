import { createFormViewModel } from 'medisys-model'
import { notification } from '@/components'
import service from '../../services'

export default createFormViewModel({
  namespace: 'worklistSpecimenDetails',
  config: {},
  param: {
    service,
    state: { entity: { specimenOrders: [] } },
    setting: {},
    subscriptions: ({ dispatch }) => {},
    effects: {
      *queryDone({ payload }, { call, select, put, take }) {
        const { entity: specimenDetails } = yield select(
          st => st.worklistSpecimenDetails,
        )

        yield put({
          type: 'patient/query',
          payload: { id: specimenDetails.patientProfileFK },
        })

        yield take('patient/query/@@end')
      },
      *startLabTest({ payload }, { call, put }) {
        const status = yield call(service.startLabTest, payload)

        if (status === 200 || status === 204) {
          notification.success({
            message: 'Manual tests started. Analyzer orders sent if any.',
          })
          return true
        }
        return status
      },
      *saveLabTest({ payload }, { call, put }) {
        const status = yield call(service.saveLabTest, payload)
        if (status === 200 || status === 204) {
          notification.success({
            message: 'Details have been saved.',
          })
          return true
        }
        return status
      },
      *retestSpecimen({ payload }, { call, put }) {
        const status = yield call(service.retestSpecimen, payload)
        if (status === 200 || status === 204) {
          notification.success({
            message: 'The specimen is ready for retest.',
          })
          return true
        }
        return status
      },
      *unlockSpecimen({ payload }, { call, put }) {
        const status = yield call(service.unlockSpecimen, payload)
        if (
          payload.from === 'labWorklist' &&
          (status === 200 || status === 204)
        ) {
          notification.success({
            message: 'The specimen is unlocked.',
          })
          return true
        }

        if (
          payload.from === 'labHistory' &&
          (status === 200 || status === 204)
        ) {
          notification.success({
            message: 'The specimen is unlocked and has been moved to worklist.',
          })
          return true
        }
        return status
      },
      *verifyLabTest({ payload }, { call, put }) {
        const status = yield call(service.verifyLabTest, payload)
        if (status === 200 || status === 204) {
          notification.success({
            message: 'Lab tests verified.',
          })
          return true
        }
        return status
      },
      *resendOrder({ payload }, { call, put }) {
        const status = yield call(service.resendOrder, payload)
        if (status === 200 || status === 204) {
          notification.success({
            message: 'Order has resent to analyzer.',
          })
          return true
        }
        return status
      },
    },
    reducers: {},
  },
})
