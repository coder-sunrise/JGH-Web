import { createFormViewModel } from 'medisys-model'
import service from '../services/masterPrintoutSetting'

export default createFormViewModel({
  namespace: 'masterPrintoutSetting',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      default: {},
    },
    subscriptions: ({ dispatch, history, searchField }) => {
      history.listen(loct => {
        const { pathname } = loct
        // if (pathname === '/setting') {
        //   dispatch({
        //     type: 'getPrintoutSetting',
        //     payload: {
        //       pagesize: 99999,
        //     },
        //   })
        // }
      })
    },

    effects: {
      // *getPrintoutSetting ({ payload }, { call, put }) {
      //   const response = yield call(service.query, payload)
      //   yield put({
      //     type: 'save',
      //     payload: response,
      //   })
      // },
    },
    reducers: {
      // save (state, { payload }) {
      //   const { data } = payload
      //   console.log({ data })
      //   const gst = {}
      //   return {
      //     gst,
      //   }
      // },
    },
  },
})
