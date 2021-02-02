import { createListViewModel } from 'medisys-model'
import * as service from '../services'

export default createListViewModel({
  namespace: 'chasClaimSubmissionRejected',
  config: {},
  param: {
    service,
    state: {
      fixedFilter: {
        status: 'Rejected',
        schemeCode: 'CHAS',
      },
      default: {},
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
      })
    },
    effects: {
      *reSubmitChasClaim ({ payload }, { put, call }) {
        const response = yield call(service.submitChasClaim, payload)
        const { data, status } = response
        if (status === '200') {
          return data
        }
        return false
      },
      *refreshPatientDetails ({payload},{put,call}){
        const response = yield call(service.refreshPatientDetails, payload)
        const { data, status } = response
        if (status === '200') {
          return data
        }
        return false
      },
    },
    reducers: {
      queryDone (st, { payload }) {
        const { data } = payload

        return {
          ...st,
          list: data.data,
        }
      },
    },
  },
})
