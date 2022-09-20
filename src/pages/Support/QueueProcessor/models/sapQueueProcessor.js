import { createListViewModel } from 'medisys-model'
import { notification } from '@/components'
import service from '../services/sapQueueProcessor.js'

export default createListViewModel({
  namespace: 'sapQueueProcessor',
  param: {
    service,
    state: {
      filter: { apiCriteria: {} },
    },
    effects: {
      *retrigger({ payload }, { call, put }) {
        const result = yield call(service.retrigger, payload)
        if (result === 204) {
          notification.success({
            message:
              'Queue item has been retrigger, waiting processor execute.',
          })
        }
      },
      *getDetails({ payload }, { call, put, select, take }) {
        const response = yield call(service.getDetails, payload)
        if (response.data) {
          return response.data
        }
        return null
      },
    },
    reducers: {
      queryDone(queuelisting, { payload }) {
        const { data } = payload
        return {
          ...queuelisting,
          list: data.data.map(o => {
            return {
              ...o,
            }
          }),
        }
      },
    },
  },
})
