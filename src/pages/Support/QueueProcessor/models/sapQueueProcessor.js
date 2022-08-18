import { createListViewModel } from 'medisys-model'
import { notification } from '@/components'
import service from '../services/sapQueueProcessor.js'

export default createListViewModel({
  namespace: 'sapQueueProcessor',
  param: {
    service,
    state: {
      default: {
        isUserMaintainable: true,
        description: '',
      },
    },
    effects: {},
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
