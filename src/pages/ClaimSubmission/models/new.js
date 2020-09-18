import { createListViewModel } from 'medisys-model'
import * as service from '../services'

export default createListViewModel({
  namespace: 'claimSubmissionNew',
  config: {},
  param: {
    service,
    state: {
      fixedFilter: {
        status: 'New',
        'PatientProfileFKNavigation.IsActive': true,
      },
      default: {},
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
      })
    },
    effects: {
      *submitChasClaim ({ payload }, { put, call }) {
        const response = yield call(service.submitChasClaim, payload)
        const { data, status } = response
        if (status === '200') {
          return data
        }
        return false
      },
      *refreshPatientDetails ({ payload }, { put, call }) {
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
