import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import service from '../services'

export default createListViewModel({
  namespace: 'claimHistory',
  param: {
    service,
    state: {
      default: {},
      list: [],
    },
    subscriptions: {},
    effects: {},
    reducers: {
      queryOneDone(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          entity: {
            ...data,
            balanceDays: data.dueDate
              ? moment(data.dueDate).startOf('day') > moment().startOf('day')
                ? Math.floor(
                    (moment(data.dueDate).startOf('day') -
                      moment().startOf('day')) /
                      (24 * 3600 * 1000),
                  )
                : 0
              : undefined,
          },
        }
      },
    },
  },
})
