import { notification } from '@/components'
import { createListViewModel } from 'medisys-model'
import service from '../services'
import { getUserPreference, saveUserPreference } from '@/services/user'
import { MEDICALCHECKUP_WORKITEM_STATUS } from '@/utils/constants'

export default createListViewModel({
  namespace: 'medicalCheckupWorklist',
  config: { queryOnLoad: false },
  param: {
    service,
    state: {
      filterBar: {
        visitDoctor: [-99],
        isOnlyUrgent: false,
        isMyPatient: true,
      },
      selectedStatus: Object.values(MEDICALCHECKUP_WORKITEM_STATUS),
    },
    setting: {},
    subscriptions: ({ dispatch, history }) => {
      history.listen(async loct => {
        const { query = {}, pathname } = loct
        if (pathname === '/medicalcheckup/worklist') {
          dispatch({
            type: 'getUserPreference',
            payload: {
              type: '4',
            },
          }).then(response => {
            if (response) {
              const { medicalCheckupWorklistColumnSetting } = response
              dispatch({
                type: 'updateState',
                payload: {
                  medicalCheckupWorklistColumnSetting: medicalCheckupWorklistColumnSetting,
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
            let medicalCheckupWorklistColumnSetting
            if (payload.type === '4') {
              medicalCheckupWorklistColumnSetting = parsedColumnSetting.find(
                o => o.Identifier === 'MedicalCheckupWorklistColumnSetting',
              )
            }
            if (parsedColumnSetting.length > 0) {
              const resultFavPatDBColumnSetting = {
                medicalCheckupWorklistColumnSetting: medicalCheckupWorklistColumnSetting
                  ? medicalCheckupWorklistColumnSetting.value
                  : [],
              }
              return resultFavPatDBColumnSetting
            }
          }
        }
        return null
      },
      *queryLastReportData({ payload }, { call, put }) {
        const response = yield call(service.queryLastReportData, payload)
        return response
      },

      *generateAutoComment({ payload }, { call, put }) {
        const response = yield call(service.generateAutoComment, payload)
        return response
      },
    },
    reducers: {},
  },
})
