import { createListViewModel } from 'medisys-model'
import { VISIT_TYPE } from '@/utils/constants'
import { formTypes } from '@/utils/codes'
import { getUserPreference, saveUserPreference } from '@/services/user'
import service from '../services/patientHistory'

const ParseEyeFormData = response => {
  const { corEyeRefractionForm = {}, corEyeExaminationForm = {} } = response
  let refractionFormData = {}
  let examinationFormData = {}
  if (corEyeRefractionForm.formData) {
    refractionFormData = JSON.parse(corEyeRefractionForm.formData)
  }

  if (corEyeExaminationForm.formData) {
    examinationFormData = JSON.parse(corEyeExaminationForm.formData)
  }

  const newResponse = {
    ...response,
    corEyeRefractionForm: {
      ...corEyeRefractionForm,
      formData: refractionFormData,
    },
    corEyeExaminationForm: {
      ...corEyeExaminationForm,
      formData: examinationFormData,
    },
  }
  return newResponse
}

export default createListViewModel({
  namespace: 'patientHistory',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      default: {},
      ableToEditConsultation: true,
      invoiceHistory: {
        list: [],
      },
      patientReferralHistory: {
        entity: { data: [] },
      },
      patientDiansiosHistoryList: {
        list: [],
      },
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
        // if patient history open from any consultation(cid) then disallow to edit consultation
        dispatch({
          type: 'updateState',
          payload: {
            ableToEditConsultation: !(
              pathname.indexOf('/reception/queue/consultation') === 0 &&
              Number(query.cid) &&
              Number(query.pid)
            ),
          },
        })
        // const { pathname, search, query = {} } = loct
        // if (
        //   pathname.indexOf('/reception/queue/patientdashboard') === 0 ||
        //   query.md === 'pt'
        // ) {
        //   dispatch({
        //     type: 'initState',
        //     payload: {
        //       queueID: Number(query.qid) || 0,
        //       version: Number(query.v) || undefined,
        //       visitID: query.visit,
        //       patientID: Number(query.pid) || 0,
        //     },
        //   })
        // }
      })
    },
    effects: {
      *initState({ payload }, { call, put, select, take }) {
        let { queueID, version, patientID, mode } = payload
        if (!patientID) {
          yield put({
            type: 'visitRegistration/query',
            payload: { id: queueID, version },
          })
          yield take('visitRegistration/query/@@end')
          const visitRegistration = yield select(st => st.visitRegistration)
          const { visit } = visitRegistration.entity
          if (!visit) return
          patientID = visit.patientProfileFK
          yield
        }

        yield put({
          type: 'updateState',
          payload: {
            queueID,
            patientID,
            version,
          },
        })
      },

      *queryPatientHistoy({ payload }, { call, put }) {
        const { patientID, version } = payload
        yield put({
          type: 'query',
          payload: {
            patientProfileFK: patientID,
            sorting: [
              {
                columnName: 'VisitDate',
                direction: 'desc',
              },
            ],
            version,
            'neql_VisitStatusFKNavigation.Status': 'WAITING',
          },
        })
      },

      *queryVisitHistory({ payload }, { call }) {
        const response = yield call(service.queryVisitHistory, payload)
        if (response.status === '200') {
          return {
            list: (response.data.data || []).map(item => {
              if (item.visitPurposeFK === VISIT_TYPE.OTC || item.isNurseNote)
                return item
              let newEntity = ParseEyeFormData(item.patientHistoryDetail)
              newEntity = {
                ...newEntity,
                forms: newEntity.forms.map(o => {
                  return {
                    ...o,
                    typeName: formTypes.find(
                      type => parseInt(type.value, 10) === o.type,
                    ).name,
                  }
                }),
              }
              return {
                ...item,
                patientHistoryDetail: newEntity,
              }
            }),
            totalVisits: response.data.totalRecords,
          }
        }
        return false
      },
      *queryDispenseHistory({ payload }, { call, put }) {
        const response = yield call(service.queryDispenseHistory, payload)
        if (response.status === '200') {
          yield put({
            type: 'updateState',
            payload: {
              dispenseHistory: response.data,
            },
          })
          return response.data
        }
        return false
      },
      *queryDiagnosisHistory({ payload }, { call, put }) {
        const response = yield call(service.queryDiagnosisHistory, payload)

        if (response.status === '200') {
          yield put({
            type: 'getDiagnosisHistory',
            payload: response,
          })
          return response
        }
        return false
      },
      *queryRetailHistory({ payload }, { call, put }) {
        const response = yield call(service.queryRetailHistory, payload)

        if (response.status === '200') {
          yield put({
            type: 'getRetailHistory',
            payload: response,
          })
          return response
        }
        return false
      },

      *queryInvoiceHistory({ payload }, { call, put }) {
        const response = yield call(service.queryInvoiceHistory, payload)

        if (response.status === '200') {
          yield put({
            type: 'getInvoiceHistory',
            payload: response,
          })
          return response
        }
        return false
      },
      *queryInvoiceHistoryDetails({ payload }, { call, put }) {
        const response = yield call(service.queryInvoiceHistoryDetails, payload)

        if (response.status === '200') {
          yield put({
            type: 'getInvoiceHistoryDetails',
            payload: response,
          })
          return response
        }
        return false
      },
      *saveUserPreference({ payload }, { call, put, select }) {
        const r = yield call(saveUserPreference, {
          ...payload,
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
        const r = yield call(getUserPreference, 5)
        const { status, data } = r

        if (status === '200') {
          if (data) {
            const usePreference = JSON.parse(data)
            if (usePreference.length > 0) {
              yield put({
                type: 'updateState',
                payload: { preference: usePreference },
              })
              return usePreference
            }
          }
        }
        return null
      },

      *queryReferralHistory({ payload }, { call, put }) {
        const response = yield call(service.queryReferralHistory, payload)
        if (response.status === '200') {
          yield put({
            type: 'getReferalHistory',
            payload: response,
          })
          return response
        }
        return false
      },

      *saveReferralHistory({ payload }, { call, put, select }) {
        const r = yield call(service.saveReferralHistory, payload)
        if (r === 204) return true

        return false
      },

      *queryPersistentDiagnosis({ payload }, { call, put }) {
        const response = yield call(service.queryPersistentDiagnosis, payload)
        if (response.status === '200') {
          // yield put({
          //   type: 'getReferalHistory',
          //   payload: response,
          // })
          return response
        }
        return false
      },
    },
    reducers: {
      queryDone(st, { payload }) {
        // const { data } = payload
        st.list = st.list.map(item => {
          if (
            item.visitPurposeFK === VISIT_TYPE.OTC ||
            !item.coHistory ||
            item.coHistory.length === 0
          )
            return item
          let newEntity = ParseEyeFormData(item.patientHistoryDetail)
          newEntity = {
            ...newEntity,
            forms: newEntity.forms.map(o => {
              return {
                ...o,
                typeName: formTypes.find(
                  type => parseInt(type.value, 10) === o.type,
                ).name,
              }
            }),
          }
          return {
            ...item,
            patientHistoryDetail: newEntity,
          }
        })
        return {
          ...st,
        }
      },
      queryOneDone(st, { payload }) {
        // const { data } = payload
        const { entity } = st
        st.entity = ParseEyeFormData(entity)

        st.entity = {
          ...st.entity,
          forms: st.entity.forms.map(o => {
            return {
              ...o,
              typeName: formTypes.find(
                type => parseInt(type.value, 10) === o.type,
              ).name,
            }
          }),
        }

        return {
          ...st,
        }
      },
      getRetailHistory(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          entity: data,
        }
      },
      getReferalHistory(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          patientReferralHistory: {
            entity: data,
          },
        }
      },
      getInvoiceHistory(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          invoiceHistory: {
            entity: data,
            list: data.data.map(o => {
              return { ...o, invoicePayer: [], invoiceDetail: {} }
            }),
          },
        }
      },
      getInvoiceHistoryDetails(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          invoiceHistory: {
            ...st.invoiceHistory,
            list: st.invoiceHistory.list.map(s => {
              if (s.id === data.id) {
                return {
                  ...s,
                  invoiceTotalAftGST: data.invoiceTotalAftGST,
                  totalPayment: data.totalPayment,
                  patientOutstanding: data.patientOutstanding,
                  isLoad: true,
                  invoiceDetail: { ...data.invoiceDetail },
                  invoicePayer: data.invoicePayer.map(ip => {
                    let paymentTxnList = []
                    const {
                      invoicePayment,
                      invoicePayerWriteOff,
                      creditNote,
                      statementInvoice,
                      patientDepositTransaction,
                    } = ip

                    // Payment
                    paymentTxnList = (paymentTxnList || []).concat(
                      (invoicePayment || []).map(z => {
                        return {
                          ...z,
                          // id: z.id,
                          type: 'Payment',
                          itemID: z.receiptNo,
                          date: z.paymentReceivedDate,
                          amount: z.totalAmtPaid,
                          isCancelled: z.isCancelled,
                        }
                      }),
                    )

                    // Write-Off
                    paymentTxnList = (paymentTxnList || []).concat(
                      (invoicePayerWriteOff || []).map(z => {
                        return {
                          ...z,
                          // id: z.id,
                          type: 'Write Off',
                          itemID: z.writeOffCode,
                          date: z.writeOffDate,
                          amount: z.writeOffAmount,
                          reason: z.writeOffReason,
                          isCancelled: z.isCancelled,
                        }
                      }),
                    )

                    // Credit Note
                    paymentTxnList = (paymentTxnList || []).concat(
                      (creditNote || []).map(z => {
                        return {
                          ...z,
                          // id: z.id,
                          type: 'Credit Note',
                          itemID: z.creditNoteNo,
                          date: z.generatedDate,
                          amount: z.totalAftGST,
                          reason: z.remark,
                          isCancelled: z.isCancelled,
                        }
                      }),
                    )

                    // Invoice PayerDepposit
                    paymentTxnList = (paymentTxnList || []).concat(
                      (patientDepositTransaction || []).map(z => {
                        return {
                          ...z,
                          type: 'Deposit',
                          itemID: z.depositTransactionNo,
                          date: z.transactionDate,
                          reason: z.remarks,
                        }
                      }),
                    )

                    // Statement Corporate Charges
                    paymentTxnList = (paymentTxnList || []).concat(
                      (statementInvoice || [])
                        .filter(x => x.adminCharge > 0)
                        .map(z => {
                          return {
                            ...z,
                            // id: z.id,
                            type: 'Corporate Charges',
                            itemID: z.statementNo,
                            date: z.statementDate,
                            amount: z.adminCharge,
                            reason: '',
                            isCancelled: undefined,
                          }
                        }),
                    )

                    // Statement Adjustment
                    paymentTxnList = (paymentTxnList || []).concat(
                      (statementInvoice || [])
                        .filter(
                          x =>
                            x.statementAdjustment && x.statementAdjustment > 0,
                        )
                        .map(z => {
                          return {
                            ...z,
                            // id: z.id,
                            type: 'Statement Adjustment',
                            itemID: z.statementNo,
                            date: z.statementDate,
                            amount: z.statementAdjustment,
                            reason: '',
                            isCancelled: undefined,
                          }
                        }),
                    )
                    return {
                      ...ip,
                      paymentTxnList,
                    }
                  }),
                }
              } else {
                return { ...s }
              }
            }),
          },
        }
      },
      getDiagnosisHistory(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          patientDiansiosHistoryList: {
            list: data,
          },
        }
      },
    },
  },
})
