import { createFormViewModel } from 'medisys-model'
import { queryFakeList, fakeSubmitForm } from '@/services/api'

export default createFormViewModel({
  namespace: 'inventoryMaster',
  config: {
    queryOnLoad: false,
  },
  param: {
    // service,
    state: {
      currentTab: 0,
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen((loct, method) => {
        const { pathname, search, query = {} } = loct
        if (pathname === '/inventory/master') {
          dispatch({
            type: 'inventoryMaster/updateState',
            payload: {
              currentTab: query.t,
            },
          })
        }
      })
    },
    effects: {
      *fetchList({ payload }, { call, put }) {
        const response = yield call(queryFakeList)
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(response) ? response : [],
          },
        })
      },
      *submit({ payload }, { call }) {
        return yield call(fakeSubmitForm, payload)
      },
    },
    reducers: {
      updateCollectPaymentList(state, { payload }) {
        return {
          ...state,
          collectPaymentList: [...payload],
        }
      },
    },
  },
})
