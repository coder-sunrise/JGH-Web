import { history } from 'umi'
import _ from 'lodash'
import { createFormViewModel } from 'medisys-model'
import { getUniqueId } from '@/utils/utils'
import { consultationDocumentTypes, formTypes } from '@/utils/codes'
import { sendQueueNotification } from '@/pages/Reception/Queue/utils'
import { orderTypes } from '@/pages/Consultation/utils'
import { getUserPreference, saveUserPreference } from '@/services/user'
import service from '../services/consultation'
import { USER_PREFERENCE_TYPE } from '@/utils/constants'

const getSequence = (sequence, maxSeq) => {
  if (sequence === 0) return sequence
  return sequence || maxSeq
}

const ParseEyeFormData = response => {
  const { corEyeRefractionForm, corEyeExaminationForm } = response
  let refractionFormData = {}
  let examinationFormData = {}
  if (corEyeRefractionForm && corEyeRefractionForm.formData) {
    refractionFormData = JSON.parse(corEyeRefractionForm.formData)
  }
  if (corEyeExaminationForm && corEyeExaminationForm.formData) {
    examinationFormData = JSON.parse(corEyeExaminationForm.formData)
  }

  const newResponse = {
    ...response,
    corEyeRefractionForm: corEyeRefractionForm
      ? {
          ...corEyeRefractionForm,
          formData: refractionFormData,
        }
      : undefined,
    corEyeExaminationForm: corEyeExaminationForm
      ? {
          ...corEyeExaminationForm,
          formData: examinationFormData,
        }
      : undefined,
  }
  return newResponse
}

const checkMultiplePendingPackages = (response = {}) => {
  const { pendingPackage } = response

  if (pendingPackage) {
    const packages = pendingPackage.reduce(
      (distinct, data) =>
        distinct.includes(data.patientPackageFK)
          ? [...distinct]
          : [...distinct, data.patientPackageFK],
      [],
    )

    if (packages && packages.length > 1) {
      return true
    }
  }
  return false
}

export default createFormViewModel({
  namespace: 'consultation',
  config: {},
  param: {
    service,
    state: {
      default: {
        corAttachment: [],
        corPatientNoteVitalSign: [],
        corAudiometryTest: [],
        corEyeExaminations: [],
      },
      selectedWidgets: ['1'],
      showSignOffModal: false,
      printData: [],
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct

        if (
          pathname.indexOf('/reception/queue/consultation') === 0 &&
          Number(query.cid)
        ) {
          dispatch({
            type: 'initState',
            payload: {
              version: Number(query.v) || undefined,
              consultationID: Number(query.cid),
              md: query.md2,
              queueID: Number(query.qid) || 0,
              patientID: Number(query.pid) || 0,
            },
          })
        }
      })
    },
    effects: {
      *initState({ payload }, { call, put, select, take }) {
        const { queueID, patientID, version } = payload

        let visit
        if (queueID) {
          yield put({
            type: 'visitRegistration/query',
            payload: { id: queueID, version },
          })
          yield take('visitRegistration/query/@@end')
          const visitRegistration = yield select(st => st.visitRegistration)
          visit = visitRegistration.entity.visit
          if (!visit) return
        } else {
          yield put({
            type: 'visitRegistration/reset',
          })
        }

        yield put({
          type: 'patient/query',
          payload: { id: patientID || visit.patientProfileFK, version },
        })

        yield take('patient/query/@@end')

        const { consultationID, md } = payload
        yield put({
          type: 'query',
          payload: {
            id: consultationID,
            version,
          },
        })
      },

      *start({ payload }, { call, put, select, take }) {
        yield put({
          type: 'updateState',
          payload: {
            entity: undefined,
            haveMultiplePendingPackages: false,
          },
        })
        const response = yield call(service.create, payload.id)

        const { id } = response
        if (id) {
          yield put({
            type: 'updateState',
            payload: {
              entity: response,
              version: payload.version,
              haveMultiplePendingPackages: checkMultiplePendingPackages(
                response,
              ),
            },
          })

          yield put({
            type: 'queryDone',
            payload: {
              data: response,
            },
          })

          // at this point visitRegistration state does not have any entity yet
          // so get queueNo from payload instead of visitRegistration model
          sendQueueNotification({
            message: 'Consultation started.',
            queueNo: payload.queueNo,
          })
        }
        return response
      },
      *pause({ payload }, { call, put, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.pause, payload)
        if (response) {
          sendQueueNotification({
            message: 'Consultation paused.',
            queueNo: entity.queueNo,
            visitID: entity.id,
          })
          // yield put({ type: 'closeModal' })
        }
        return response
      },

      *resume({ payload }, { call, put, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration
        yield put({
          type: 'updateState',
          payload: {
            entity: undefined,
          },
        })

        const response = yield call(service.resume, payload.id)
        if (response) {
          yield put({
            type: 'updateState',
            payload: {
              entity: response,
              version: payload.version,
            },
          })

          yield put({
            type: 'queryDone',
            payload: {
              data: response,
            },
          })
          if (entity) {
            sendQueueNotification({
              message: 'Consultation resumed.',
              queueNo: entity.queueNo,
              visitID: entity.id,
            })
          }
        }
        return response
      },
      *edit({ payload }, { call, put }) {
        const response = yield call(service.edit, payload.id)
        if (response) {
          yield put({
            type: 'updateState',
            payload: {
              entity: response,
              version: payload.version,
            },
          })

          yield put({
            type: 'queryDone',
            payload: {
              data: response,
            },
          })
        }
        return response
      },
      *overwrite({ payload }, { call, put }) {
        const response = yield call(service.overwrite, payload.id)
        if (response) {
          yield put({
            type: 'updateState',
            payload: {
              entity: response,
              version: payload.version,
            },
          })
          yield put({
            type: 'queryDone',
            payload: {
              data: response,
            },
          })
        }
        return response
      },
      *sign({ payload }, { call, put, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.sign, payload)
        if (response) {
          sendQueueNotification({
            message: 'Consultation signed-off.',
            queueNo: entity.queueNo,
            visitID: entity.id,
            isBillingSaved: payload.versionNumber > 1 ? false : undefined,
          })
        }
        return response
      },
      *discard({ payload }, { call, put, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.discardDetails, payload)

        if (response) {
          sendQueueNotification({
            message: 'Consultation discarded.',
            queueNo: entity.queueNo,
            visitID: entity.id,
          })
        }
        return response
      },
      *saveLayout({ payload }, { call, put, select }) {
        const user = yield select(st => st.user)
        const response = yield call(service.saveLayout, user.data.id, {
          userPreferenceDetails: JSON.stringify(payload),
        })

        return response
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
            const parsedFavouriteDiagnosisLanguage = JSON.parse(data)
            let favouriteDiagnosisLanguage
            if (
              payload.type ===
              USER_PREFERENCE_TYPE['FAVOURITEDIAGNOSISLANGUAGESETTING']
            ) {
              favouriteDiagnosisLanguage = parsedFavouriteDiagnosisLanguage.find(
                o => o.Identifier === 'FavouriteDiagnosisLanguage',
              )
            }
            let resultFavouriteDiagnosisLanguage = {
              favouriteDiagnosisLanguage: 'EN',
            }
            if (parsedFavouriteDiagnosisLanguage.length > 0) {
              resultFavouriteDiagnosisLanguage = {
                favouriteDiagnosisLanguage: favouriteDiagnosisLanguage
                  ? favouriteDiagnosisLanguage.value
                  : 'EN',
              }
            }
            yield put({
              type: 'updateState',
              payload: resultFavouriteDiagnosisLanguage,
            })
            return resultFavouriteDiagnosisLanguage
          }
        }
        return null
      },

      *editOrder({ payload }, { call, put, take }) {
        const response = yield call(service.editOrder, payload.id)
        const { queueID } = payload

        if (response) {
          if (queueID) {
            yield put({
              type: 'visitRegistration/query',
              payload: { id: queueID, version: Date.now() },
            })
            yield take('visitRegistration/query/@@end')
          }

          yield put({
            type: 'updateState',
            payload: {
              entity: response,
              version: payload.version,
              haveMultiplePendingPackages: checkMultiplePendingPackages(
                response,
              ),
            },
          })
          yield put({
            type: 'queryDone',
            payload: {
              data: response,
            },
          })
        }
        return response
      },
      *signOrder({ payload }, { call, put }) {
        const response = yield call(service.signOrder, payload)
        return response
      },
      *completeBillFirstOrder({ payload }, { call, put }) {
        const response = yield call(service.completeOrder, payload)
        return response
      },
      *closeModal({}, { call, put, take }) {
        yield put({
          type: 'global/updateAppState',
          payload: {
            disableSave: false,
            showConsultationPanel: false,
            fullscreen: false,
          },
        })
        yield take('global/updateAppState/@@end')

        history.push('/reception/queue')
      },
      *queryDone({ payload }, { call, put, select, take }) {
        const { data, page } = payload
        if (!data) return null
        let cdRows = []
        consultationDocumentTypes.forEach(p => {
          cdRows = cdRows.concat(
            (data[p.prop] || []).map(o => {
              const d = {
                uid: getUniqueId(),
                type: p.value,
                subject: p.getSubject ? p.getSubject(o) : '',
                ...o,
              }
              return p.convert ? p.convert(d) : d
            }),
          )
        })

        let formRows = []
        formTypes.forEach(p => {
          formRows = formRows.concat(
            (data[p.prop] || []).map(o => {
              const d = {
                uid: getUniqueId(),
                type: p.value,
                typeName: p.name,
                ...o,
                formData: JSON.parse(o.formData),
              }
              return d
            }),
          )
        })
        yield put({
          type: 'forms/updateState',
          payload: {
            rows: _.sortBy(formRows, 'sequence'),
          },
        })

        let oRows = []
        if (page !== 'edit order') {
          orderTypes.forEach(p => {
            const datas =
              (p.filter ? data[p.prop].filter(p.filter) : data[p.prop]) || []

            let maxSeq = 0
            if (datas && datas.length > 0)
              maxSeq = _.maxBy(datas, 'sequence').sequence

            oRows = oRows.concat(
              datas.map(o => {
                if (!o.sequence) maxSeq += 1
                const d = {
                  uid: getUniqueId(),
                  type: p.value,
                  subject: p.getSubject ? p.getSubject(o) : '',
                  ...o,
                  sequence: getSequence(o.sequence, maxSeq),
                  instruction: o.instruction || o.itemNotes,
                }

                let newObj = {
                  ...d,
                }
                let instructionArray = []
                if (d.corPrescriptionItemInstruction) {
                  instructionArray = d.corPrescriptionItemInstruction.map(
                    instruction => {
                      return {
                        ...instruction,
                        stepdose: instruction.stepdose || 'AND',
                      }
                    },
                  )
                  newObj = {
                    ...newObj,
                    corPrescriptionItemInstruction: instructionArray,
                  }
                }

                if (p.value === '2') {
                  // put auto generated certificate to document
                  newObj.corVaccinationCert = newObj.corVaccinationCert.map(
                    vc => {
                      return {
                        ...vc,
                        uid: getUniqueId(),
                        type: '3',
                        vaccinationUFK: newObj.uid,
                      }
                    },
                  )
                  cdRows = cdRows.concat(newObj.corVaccinationCert)
                }

                return p.convert ? p.convert(newObj) : newObj
              }),
            )
          })
        }

        yield put({
          type: 'consultationDocument/updateState',
          payload: {
            rows: _.sortBy(cdRows, 'sequence'),
          },
        })

        yield put({
          type: 'orders/updateState',
          payload: {
            type: '1',
            rows: _.sortBy(oRows, 'sequence'),
            _originalRows: _.sortBy(
              oRows.map(r => ({ ...r })),
              'sequence',
            ),
            finalAdjustments: data.corOrderAdjustment.map(o => ({
              ...o,
              uid: o.id,
            })),
            entity: undefined,
            isGSTInclusive: data.isGstInclusive,
            gstValue: data.gstValue,
            corPackage: data.corPackage,
            corVitalSign: data.corPatientNoteVitalSign || [],
            _originalIsGSTInclusive: data.isGstInclusive,
            _originalGstValue: data.gstValue,
          },
        })

        yield put({
          type: 'orders/calculateAmount',
          payload: {
            isGSTInclusive: data.isGstInclusive,
            gstValue: data.gstValue,
          },
        })

        data.corDiagnosis = data.corDiagnosis.map(diagnosis => {
          return {
            ...diagnosis,
            defaultIsPersist: diagnosis.isPersist,
            uid: getUniqueId(),
          }
        })

        data.corScribbleNotes = data.corScribbleNotes.map(scribbleNote => {
          return {
            ...scribbleNote,
            uid: getUniqueId(),
          }
        })

        yield put({
          type: 'diagnosis/updateState',
          payload: {
            rows: _.sortBy(data.corDiagnosis, 'sequence'),
          },
        })

        const corPatientNoteVitalSign = (data.corPatientNoteVitalSign || [])
          .length
          ? data.corPatientNoteVitalSign
          : [{}]
        data.corPatientNoteVitalSign = corPatientNoteVitalSign.map(vs => ({
          ...vs,
          visitPurposeFK: data.visitPurposeFK,
        }))

        data.corAudiometryTest = (data.corAudiometryTest || []).length
          ? data.corAudiometryTest
          : [{}]

        data.corEyeExaminations = (data.corEyeExaminations || []).length
          ? data.corEyeExaminations
          : [{}]

        let newResponse = ParseEyeFormData(data)
        const { corEyeRefractionForm, corEyeExaminationForm } = newResponse
        data.corEyeRefractionForm = corEyeRefractionForm
        data.corEyeExaminationForm = corEyeExaminationForm
        data.loaded = true
        return payload
      },
    },
    reducers: {
      showSignOffModal(state, { payload }) {
        return { ...state, ...payload }
      },
      closeSignOffModal(state) {
        return { ...state, showSignOffModal: false, printData: [] }
      },
    },
  },
})
