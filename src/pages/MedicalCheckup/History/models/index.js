import { notification } from '@/components'
import { createListViewModel } from 'medisys-model'
import service from '../services'
import { getUserPreference, saveUserPreference } from '@/services/user'

export default createListViewModel({
  namespace: 'medicalCheckupWorklistHistory',
  config: { queryOnLoad: false },
  param: {
    service,
    state: {},
    setting: {},
    subscriptions: ({ dispatch, history }) => {
      history.listen(async loct => {
        const { query = {}, pathname } = loct
        if (pathname === '/medicalcheckup/history') {
          dispatch({
            type: 'getUserPreference',
            payload: {
              type: '4',
            },
          }).then(response => {
            if (response) {
              const { medicalCheckupWorklistHistoryColumnSetting } = response
              dispatch({
                type: 'updateState',
                payload: {
                  medicalCheckupWorklistHistoryColumnSetting: medicalCheckupWorklistHistoryColumnSetting,
                },
              })
            }
          })
        }
      })
    },
    effects: {
      *saveUserPreference({ payload }, { call, put, select }) {
        const r = yield call(saveUserPreference, {
          userPreferenceDetails: JSON.stringify(payload.userPreferenceDetails),
          itemIdentifier: payload.itemIdentifier,
          type: payload.type,
        })
        if (r === 204) {
          window.g_app._store.dispatch({
            type: 'codetable/refreshCodes',
            payload: {
              code: 'userpreference',
              force: true,
            },
          })
          return true
        }

        return false
      },
      *getUserPreference({ payload }, { call, put }) {
        const r = yield call(getUserPreference, payload.type)
        const { status, data } = r
        if (status === '200') {
          if (data) {
            const parsedColumnSetting = JSON.parse(data)
            let medicalCheckupWorklistHistoryColumnSetting
            if (payload.type === '4') {
              medicalCheckupWorklistHistoryColumnSetting = parsedColumnSetting.find(
                o =>
                  o.Identifier === 'MedicalCheckupWorklistHistoryColumnSetting',
              )
            }
            if (parsedColumnSetting.length > 0) {
              const resultFavPatDBColumnSetting = {
                medicalCheckupWorklistHistoryColumnSetting: medicalCheckupWorklistHistoryColumnSetting
                  ? medicalCheckupWorklistHistoryColumnSetting.value
                  : [],
              }
              return resultFavPatDBColumnSetting
            }
          }
        }
        return null
      },
      *revert({ payload }, { call, put }) {
        const response = yield call(service.revert, payload)
        return response
      },
    },
    reducers: {},
  },
})
