import { createFormViewModel } from 'medisys-model'
import { useSelector } from 'dva'
import service from '../../services'

export default createFormViewModel({
  namespace: 'dispensaryDetails',
  config: {
    queryOnLoad: false,
  }, //TODO:: Remove this config later if needed to load
  param: {
    service,
    state: {
      patient: {},
    },
    subscriptions: ({ dispatch, history, searchField }) => {
      history.listen(loct => {
        const { pathname } = loct
      })
    },

    effects: {
      *initState({ payload }, { call, select, put, take }) {
        yield put({
          type: 'patient/query',
          payload: { id: 7 },
        })

        yield take('patient/query/@@end')
      },
    },
    reducers: {
      queryDone(st, { payload }) {},
    },
  },
})
