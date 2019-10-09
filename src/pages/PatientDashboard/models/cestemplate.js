import { createListViewModel } from 'medisys-model'
import router from 'umi/router'
import * as service from '../services/cestemplate'
import { sleep, getRemovedUrl } from '@/utils/utils'

export default createListViewModel({
  namespace: 'cestemplate',
  config: {},
  param: {
    service,
    state: {
      // currentId: '1',
    },
    subscriptions: ({ dispatch, history, ...restProps }) => {},
    effects: {
      *query ({ payload }, { call, put, select, take }) {
        const user = yield select((st) => st.user)
        const response = yield call(service.queryList, user.data.id)
        if (response.data) {
          yield put({
            type: 'updateState',
            payload: {
              list: response.data,
            },
          })
        }
      },

      *create ({ payload }, { call, put, select, take }) {
        const { name } = payload
        const consultation = yield select((st) => st.consultation)
        const user = yield select((st) => st.user)
        const { entity } = consultation
        delete entity.corPatientNoteVitalSign
        delete entity.visitConsultationTemplate
        delete entity.concurrencyToken
        const response = yield call(service.create, user.data.id, name, entity)
        if (response) {
          console.log(response)
          // yield put({
          //   type: 'updateState',
          //   payload: {
          //     list: response.data,
          //   },
          // })
        }
      },
    },
    reducers: {},
  },
})
