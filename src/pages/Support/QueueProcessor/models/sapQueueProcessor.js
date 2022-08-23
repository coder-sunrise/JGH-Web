import { createListViewModel } from 'medisys-model'
import { notification } from '@/components'
import service from '../services/sapQueueProcessor.js'

export default createListViewModel({
  namespace: 'sapQueueProcessor',
  param: {
    service,
    state: {},
    effects: {
      *retrigger({ payload }, { call, put }) {
        const result = yield call(service.retrigger, payload)
        console.log('result', result)
        if (result === 204) {
          notification.success({
            message:
              'Queue item has been retrigger, waiting processor execute.',
          })
        }
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
