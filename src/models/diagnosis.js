import { createFormViewModel } from 'medisys-model'
import { getUserPreference, saveUserPreference } from '@/services/user'
import { USER_PREFERENCE_TYPE, SYSTEM_LANGUAGE } from '@/utils/constants'

export default createFormViewModel({
  namespace: 'diagnosis',
  config: {
    queryOnLoad: false,
  },
  param: {
    service: {},
    state: {
      default: {
        corDiagnosis: [{}],
      },
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
      })
    },
    effects: {
      *removeWidget({ payload }, { call, put, select }) {
        yield put({
          type: 'updateState',
          payload: {
            entity: false,
          },
        })
      },
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
      *getUserPreference({ payload }, { call, put, select }) {
        const codetable = yield select(st => st.codetable)
        const { userpreference = [] } = codetable
        const diagnosisPreference = userpreference.find(
          p => p.type == payload.type,
        )
        if (!diagnosisPreference) return
        const parsedFavouriteDiagnosisSetting = JSON.parse(
          diagnosisPreference.userPreferenceDetails,
        )
        let favouriteDiagnosis
        let favouriteDiagnosisCategory
        let favouriteDiagnosisLanguage
        let resultFavouriteDiagnosis = {
          favouriteDiagnosisLanguage: SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
        }
        if (payload.type === USER_PREFERENCE_TYPE.FAVOURITEDIAGNOSISSETTING) {
          favouriteDiagnosis = parsedFavouriteDiagnosisSetting.find(
            o => o.Identifier === 'FavouriteDiagnosis',
          )
          parsedFavouriteDiagnosisSetting.find(
            o => o.Identifier === 'FavouriteDiagnosisCategory',
          )

          resultFavouriteDiagnosis = {
            favouriteDiagnosis: favouriteDiagnosis
              ? favouriteDiagnosis.value
              : [],
            favouriteDiagnosisCategory: favouriteDiagnosisCategory
              ? favouriteDiagnosisCategory.value
              : [],
          }
        } else if (
          payload.type ===
          USER_PREFERENCE_TYPE.FAVOURITEDIAGNOSISLANGUAGESETTING
        ) {
          favouriteDiagnosisLanguage = parsedFavouriteDiagnosisSetting.find(
            o => o.Identifier === 'FavouriteDiagnosisLanguage',
          )
          resultFavouriteDiagnosis = {
            favouriteDiagnosisLanguage: favouriteDiagnosisLanguage
              ? favouriteDiagnosisLanguage.value
              : SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
          }
        }
        yield put({
          type: 'updateState',
          payload: resultFavouriteDiagnosis,
        })
        return resultFavouriteDiagnosis
      },
    },
    reducers: {},
  },
})
