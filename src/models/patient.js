import { history } from 'umi'
import { createFormViewModel } from 'medisys-model'
import moment from 'moment'
import service from '@/services/patient'
import { getUserPreference, saveUserPreference } from '@/services/user'
import { USER_PREFERENCE_TYPE } from '@/utils/constants'
import {
  getRemovedUrl,
  getAppendUrl,
  getRefreshChasBalanceStatus,
  getRefreshMedisaveBalanceStatus,
} from '@/utils/utils'

const defaultPatientEntity = {
  effectiveStartDate: moment().formatUTC(),
  effectiveEndDate: moment('2099-12-31').formatUTC(),
  patientAccountNo: '',
  patientEmergencyContact: [],
  patientAllergy: [],
  patientMedicalHistory: {
    medicalHistory: '',
    socialHistory: '',
    familyHistory: '',
  },
  patientAllergyMetaData: [],
  patientMedicalAlert: [],
  patientScheme: [],
  schemePayer: [],
  referredBy: '',
  // dob: new Date(),
  contact: {
    contactAddress: [
      {
        // Id: getUniqueGUID(),
        countryFK: undefined,
        isPrimary: true,
        isMailing: true,
      },
    ],
    contactEmailAddress: {
      emailAddress: '',
    },
    mobileContactNumber: {
      number: undefined,
      countryCodeFK: 1,
    },
    homeContactNumber: {
      number: '',
      countryCodeFK: 1,
    },
    officeContactNumber: {
      number: '',
      countryCodeFK: 1,
    },
    faxContactNumber: {
      number: '',
      countryCodeFK: 1,
    },
    contactWebsite: {
      website: '',
    },
  },
  patientPdpaConsent: [
    {
      pdpaConsentTypeFK: 1,
      isConsent: true,
    },
    {
      pdpaConsentTypeFK: 2,
      isConsent: false,
    },
    {
      pdpaConsentTypeFK: 3,
      isConsent: false,
    },
  ],
  patientPackage: [],
  pendingPreOrderItem: [],
}

export default createFormViewModel({
  namespace: 'patient',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      menuErrors: {},
      currentComponent: '1',
      default: defaultPatientEntity,
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async loct => {
        const { query = {}, pathname } = loct
        if (pathname === '/patient') {
          dispatch({
            type: 'getUserPreference',
            payload: {
              type: '4',
            },
          }).then(response => {
            if (response) {
              const { favPatDBColumnSetting } = response
              dispatch({
                type: 'updateState',
                payload: {
                  favPatDBColumnSetting: favPatDBColumnSetting,
                },
              })
            }
          })
        }
        setTimeout(() => {
          if (query.md === 'pt' && query.cmt) {
            dispatch({
              type: 'updateState',
              payload: {
                currentComponent: query.cmt,
              },
            })
            dispatch({
              type: 'initState',
              payload: {
                md: query.md,
                newPatient: query.new,
                version: Number(query.v) || undefined,
                currentId: Number(query.pid) || undefined,
              },
            })
          }
        }, 1)
      })
    },
    effects: {
      *initState({ payload }, { put, select, take }) {
        yield put({ type: 'initAllergyCodetable' })
        yield put({ type: 'initSchemeCodetable' })
        let { currentId, version, md, newPatient } = payload
        if (newPatient) {
          yield put({ type: 'updateState', payload: { entity: null } })
        }

        const patient = yield select(state => state.patient)
        if (
          !newPatient &&
          Number(currentId) &&
          (patient.version !== version || patient.entity?.id !== currentId)
        ) {
          yield put({
            type: 'query',
            payload: {
              id: currentId,
              version,
            },
          })
          yield take('patient/query/@@end')
        }
        if (md === 'pt')
          yield put({
            type: 'global/updateState',
            payload: {
              fullscreen: true,
              showPatientInfoPanel: true,
            },
          })
      },
      *initAllergyCodetable(_, { put }) {
        yield put({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'ctdrugallergy',
            filter: {
              isActive: true,
            },
          },
        })
      },
      *initSchemeCodetable(_, { put }) {
        yield put({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'ctschemetype',
            filter: {
              isActive: true,
            },
          },
        })

        yield put({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'copaymentscheme',
            force: true,
            filter: {
              isActive: undefined,
            },
          },
        })
      },
      *waitLoadComplete(_, { take }) {
        yield take('patient/query/@@end')
        return ''
      },
      *closePatientModal({ payload }, { all, put, select }) {
        const patientState = yield select(st => st.patient)

        if (patientState.shouldQueryOnClose) {
          yield put({
            type: 'updateState',
            payload: {
              shouldQueryOnClose: false,
              onRefresh: true,
            },
          })
        }

        // do not remove PID query in these URLs
        const exceptionalPaths = [
          'billing',
          'dispense',
          'consultation',
          'patientdashboard',
          'reportingdetails',
        ]

        const matchesExceptionalPath =
          history &&
          exceptionalPaths.reduce(
            (matched, url) =>
              history.location.pathname.indexOf(url) > 0 ? true : matched,
            false,
          )

        let shouldRemoveQueries = ['md', 'cmt', 'pid', 'new', 'qid', 'v']
        if (matchesExceptionalPath) {
          shouldRemoveQueries = ['md', 'cmt', 'new']
        }
        history.push(getRemovedUrl(shouldRemoveQueries))

        return yield all([
          yield put({
            type: 'global/updateAppState',
            payload: {
              disableSave: false,
              showPatientInfoPanel: false,
              fullscreen: false,
              currentPatientId: null,
            },
          }),
          yield put({
            type: 'consultation/updateState',
            payload: {
              patientMedicalHistory: undefined,
            },
          }),
          // reset patient model state to default state
          yield put({
            type: 'updateState',
            payload: {
              callback: undefined,
              default: defaultPatientEntity,
              menuErrors: {},
            },
          }),
        ])
      },
      *openPatientModal({ payload = { callback: undefined } }, { put }) {
        if (payload.callback) {
          yield put({
            type: 'updateState',
            payload: { callback: payload.callback },
          })
        }
        history.push(
          getAppendUrl({
            md: 'pt',
            cmt: '1',
            new: 1,
          }),
        )
      },
      *refreshChasBalance({ payload }, { call }) {
        const {
          patientAccountNo,
          patientCoPaymentSchemeFK,
          isSaveToDb = false,
          patientProfileId,
        } = payload
        const newPayload = {
          patientNric: patientAccountNo,
          patientCoPaymentSchemeFK,
          year: moment().year(),
          isSaveToDb,
          patientProfileId,
        }

        const response = yield call(service.requestChasBalance, newPayload)

        const { data } = response
        let result = { isSuccessful: false }

        if (data) {
          const status = getRefreshChasBalanceStatus(data.status)
          return { ...data, ...status }
        }

        return result
      },
      *refreshMedisaveBalance({ payload }, { call }) {
        const {
          patientAccountNo,
          isSaveToDb = false,
          patientProfileId,
          schemePayer,
        } = payload
        const newPayload = {
          patientNric: patientAccountNo,
          year: moment().year(),
          isSaveToDb,
          patientProfileId,
          schemePayers: schemePayer,
        }

        const response = yield call(service.requestMedisaveBalance, newPayload)
        const { data } = response
        if (data) {
          const status = getRefreshMedisaveBalanceStatus(data)
          return { ...data, ...status }
        }

        return data
      },
      *queryDone({ payload }, { put }) {
        const { data } = payload
        data.patientScheme.forEach(ps => {
          if (ps.validFrom && ps.validTo)
            ps.validRange = [ps.validFrom, ps.validTo]
          if (ps.coPaymentSchemeFK === null) {
            ps.coPaymentSchemeFK = undefined
          }

          ps.preSchemeTypeFK = ps.schemeTypeFK
        })
        data.patientMedicalHistory =
          data.patientMedicalHistory ||
          defaultPatientEntity.patientMedicalHistory
        yield put({
          type: 'updateState',
          payload: {
            entity: data,
          },
        })
      },
      *queryDeposit({ payload }, { select, call, put }) {
        const response = yield call(service.queryDeposit, payload)
        if (response && response.status === '200') {
          const { data = {} } = response
          const codetable = yield select(state => state.codetable)
          const { ltdeposittransactiontype: codetbs = [] } = codetable

          const newTransaction = (data.patientDepositTransaction || []).reduce(
            (pre, cur) => {
              const ltType = codetbs.find(f => f.id === cur.transactionTypeFK)
              return [
                ...pre,
                {
                  ...cur,
                  transactionTypeName: ltType ? ltType.name || '' : '',
                },
              ]
            },
            [],
          )
          data.patientDepositTransaction = newTransaction

          yield put({
            type: 'updateState',
            payload: {
              deposit: data,
            },
          })
        }
      },
      *queryForNewVisit({ payload }, { select, call, put }) {
        console.log(payload, 12)
        const response = yield call(service.queryForNewVisit, payload)
        if (response && response.status === '200') {
          const { data = {} } = response
          this.props.dispatch({
            type: 'patientSearch/updateState',
            payload: {
              filter: payload,
              list: data,
            },
          })
        }
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
      *getUserPreference({ payload }, { call, put }) {
        const r = yield call(getUserPreference, payload.type)
        const { status, data } = r
        if (status === '200') {
          if (data) {
            const parsedFavPatDBColumnSetting = JSON.parse(data)
            let favPatDBColumnSetting
            if (payload.type === '4') {
              favPatDBColumnSetting = parsedFavPatDBColumnSetting.find(
                o => o.Identifier === 'PatientDatabaseColumnSetting',
              )
            }
            if (parsedFavPatDBColumnSetting.length > 0) {
              const resultFavPatDBColumnSetting = {
                favPatDBColumnSetting: favPatDBColumnSetting
                  ? favPatDBColumnSetting.value
                  : [],
              }
              return resultFavPatDBColumnSetting
            }
          }
        }
        return null
      },
      *getStickyNotes({ payload }, { call, put }) {
        const r = yield call(service.queryStickyNotes, payload)
        const { status, data = [] } = r
        yield put({
          type: 'updateState',
          payload: {
            patientStickyNotes: data,
          },
        })
        return data
      },
      *saveStickyNotes({ payload }, { call, put }) {
        let r = {}
        if (payload.id) {
          r = yield call(service.upsertStickyNotes, payload)
        } else {
          r = yield call(service.createStickyNotes, payload)
        }
        return r
      },
      *getFamilyMembersInfo({ payload }, { call, put }) {
        const r = yield call(service.getFamilyMembersInfo, payload)
        const { status, data = [] } = r
        if (status === '200') return data
        return null
      },
    },
    reducers: {
      updateDefaultEntity(state, { payload }) {
        const { patientName } = payload
        return {
          ...state,
          default: {
            ...defaultPatientEntity,
            ...payload,
            // name: patientName,
            // callingName: patientName,
          },
        }
      },
      // queryDone (st, { payload }) {
      //   const { data } = payload
      //   // console.log(payload)
      //   data.patientScheme.forEach((ps) => {
      //     if (ps.validFrom && ps.validTo)
      //       ps.validRange = [
      //         ps.validFrom,
      //         ps.validTo,
      //       ]
      //     if (ps.coPaymentSchemeFK === null) {
      //       ps.coPaymentSchemeFK = undefined
      //     }
      //     ps.preSchemeTypeFK = ps.schemeTypeFK
      //   })
      //   return {
      //     ...st,
      //     entity: data,
      //   }
      // },
    },
  },
})
