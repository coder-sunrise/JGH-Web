import { createListViewModel } from 'medisys-model'
import service from '../services'

export default createListViewModel({
  namespace: 'smsAppointment',
  config: {},
  param: {
    service,
    state: {
      default: {},
    },
    // subscriptions: ({ dispatch, history }) => {
    //   history.listen(async (loct, method) => {
    //     const { pathname, search, query = {} } = loct
    //   })
    // },
    effects: {},
    reducers: {},
  },
})
