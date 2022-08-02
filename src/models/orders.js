import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import _ from 'lodash'
import service from '@/pages/Inventory/InventoryAdjustment/services'

import { getUniqueId, maxReducer, calculateAmount } from '@/utils/utils'

const sharedMedicationValue = {
  isMinus: true,
  adjValue: 0,
  isExactAmount: true,
  corPrescriptionItemPrecaution: [
    {
      precaution: '',
      sequence: 0,
      uid: getUniqueId(),
    },
  ],
  corPrescriptionItemInstruction: [
    {
      sequence: 0,
      stepdose: 'AND',
      unitPrice: 0,
      uid: getUniqueId(),
    },
  ],
  corPrescriptionItemDrugMixture: [],
  isDrugMixture: false,
  isClaimable: true,
  isDispensedByPharmacy: false,
  isNurseActualizeRequired: false,
  isExclusive: false,
}
const initialState = {
  rows: [],
  finalAdjustments: [],
  summary: {},
  defaultMedication: {
    ...sharedMedicationValue,
  },
  defaultService: {
    editServiceId: undefined,
    isEdit: false,
    serviceItems: [],
    selectCategory: 'All',
    selectTag: 'All',
    filterService: '',
    isMinus: true,
    isExactAmount: true,
  },
  defaultVaccination: {
    vaccinationGivenDate: moment(),
    quantity: 1,
    unitPrice: 0,
    isMinus: true,
    adjValue: 0,
    isExactAmount: true,
    corVaccinationCert: [],
    isNurseActualizeRequired: false,
  },
  defaultConsumable: {
    quantity: 1,
    unitPrice: 0,
    isMinus: true,
    adjValue: 0,
    isExactAmount: true,
    isDispensedByPharmacy: false,
    isNurseActualizeRequired: false,
  },
  defaultOrderSet: {
    orderSetItems: [],
  },
  defaultTreatment: {},
  corPackage: [],
  defaultPackage: {
    packageItems: [],
  },
  defaultRadiology: {
    editServiceId: undefined,
    isEdit: false,
    radiologyItems: [],
    selectCategory: 'All',
    selectTag: 'All',
    filterService: '',
    isMinus: true,
    isExactAmount: true,
  },
  defaultLab: {
    editServiceId: undefined,
    isEdit: false,
    labItems: [],
    selectCategory: 'All',
    selectTag: 'All',
    filterService: '',
    isMinus: true,
    isExactAmount: true,
  },
}
export default createListViewModel({
  namespace: 'orders',
  config: {
    queryOnLoad: false,
  },
  param: {
    service: {},
    state: { ...initialState },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
        if (
          (pathname.indexOf('/reception/queue/consultation') === 0 &&
            Number(query.cid)) ||
          pathname.indexOf('/reception/queue/dispense') === 0 ||
          pathname.indexOf('/pharmacy/worklist') === 0
        ) {
        }
      })
    },
    effects: {
      *upsertRow({ payload }, { select, call, put, delay }) {
        const upsert = yield put({
          type: 'upsertRowState',
          payload,
        })
        const orders = yield select(st => st.orders)
        const consultationDocument = yield select(st => st.consultationDocument)
        const { rows } = consultationDocument
        const {
          entity: { corVaccinationCert = [] },
        } = orders
        const activeCORVaccinationCert = corVaccinationCert.find(
          vc => !vc.isDeleted,
        )
        if (
          activeCORVaccinationCert &&
          !rows.find(cd => cd.uid === activeCORVaccinationCert.uid)
        ) {
          yield put({
            type: 'consultationDocument/updateState',
            payload: {
              rows: [...rows, activeCORVaccinationCert],
            },
          })
        }

        yield put({
          type: 'calculateAmount',
        })

        if (upsert) {
          yield put({
            type: 'updateState',
            payload: {
              entity: undefined,
            },
          })
        }
      },
      *upsertRows({ payload }, { select, call, put, delay }) {
        const orders = yield select(st => st.orders)
        const { rows } = orders
        let newVaccinationCertificates = []
        const getCertificate = (vaccination, uid) => {
          const corVaccinationCert =
            vaccination.type === '2'
              ? (vaccination.corVaccinationCert || []).map(vc => {
                  return {
                    ...vc,
                    vaccinationUFK: uid,
                    uid: getUniqueId(),
                  }
                })
              : []
          newVaccinationCertificates = newVaccinationCertificates.concat(
            corVaccinationCert,
          )
          return corVaccinationCert
        }
        const newVaccinations = [
          ...rows,
          ...payload.map(v => {
            const uid = getUniqueId()
            return {
              ...v,
              uid,
              corVaccinationCert: getCertificate(v, uid),
            }
          }),
        ]

        yield put({
          type: 'updateState',
          payload: {
            rows: newVaccinations,
          },
        })

        // insert generate certificate
        if (newVaccinationCertificates.length > 0) {
          const consultationDocument = yield select(
            st => st.consultationDocument,
          )
          const { rows: documentRows } = consultationDocument
          yield put({
            type: 'consultationDocument/updateState',
            payload: {
              rows: [...documentRows, ...newVaccinationCertificates],
            },
          })
        }

        yield put({
          type: 'calculateAmount',
        })

        yield put({
          type: 'updateState',
          payload: {
            entity: undefined,
          },
        })
      },
      *addFinalAdjustment({ payload }, { select, call, put, delay }) {
        yield put({
          type: 'addFinalAdjustmentState',
          payload,
        })

        yield put({
          type: 'calculateAmount',
        })
      },

      *editFinalAdjustment({ payload }, { select, call, put, delay }) {
        yield put({
          type: 'editFinalAdjustmentState',
          payload,
        })

        yield put({
          type: 'calculateAmount',
        })
      },

      *deleteFinalAdjustment({ payload }, { select, call, put, delay }) {
        yield put({
          type: 'deleteFinalAdjustmentState',
          payload,
        })

        yield put({
          type: 'calculateAmount',
        })
      },

      *getStockDetails({ payload }, { call, put }) {
        const result = yield call(service.queryStockDetails, payload)
        return result
      },

      *deleteRow({ payload }, { put, select }) {
        const orders = yield select(st => st.orders)
        const consultationDocument = yield select(st => st.consultationDocument)
        let { finalAdjustments, rows, isGSTInclusive, gstValue } = orders
        const { rows: documentRows } = consultationDocument
        let tempRows = [...rows]
        if (payload) {
          const deleteRow = rows.find(o => o.uid === payload.uid)
          if (deleteRow) {
            // delete auto generated certificate
            if (deleteRow.type === '2') {
              const activeCertificate = deleteRow.corVaccinationCert.find(
                vc => !vc.isDeleted,
              )
              if (activeCertificate) {
                let newDocumentRows
                if (activeCertificate.id > 0) {
                  newDocumentRows = documentRows.map(d => {
                    if (activeCertificate.uid === d.uid)
                      return { ...d, isDeleted: true }
                    return d
                  })
                } else {
                  newDocumentRows = documentRows.filter(
                    d => d.uid !== activeCertificate.uid,
                  )
                }
                yield put({
                  type: 'consultationDocument/updateState',
                  payload: {
                    rows: newDocumentRows,
                  },
                })
              }
            }

            // delete order
            if (deleteRow.id > 0) {
              tempRows = rows.map(o => {
                if (!payload || o.uid === payload.uid) {
                  o.isDeleted = true
                  if (deleteRow.type === '2') {
                    o.corVaccinationCert = o.corVaccinationCert
                      .filter(vc => vc.id > 0)
                      .map(vc => {
                        return { ...vc, isDeleted: true }
                      })
                  }
                }
                return o
              })
            } else {
              tempRows = rows.filter(o => o.uid !== payload.uid)
            }
          }
        } else {
          tempRows = tempRows.map(o => ({
            ...o,
            isDeleted: true,
          }))
          finalAdjustments = finalAdjustments.map(o => ({
            ...o,
            isDeleted: true,
          }))
        }

        const amount = calculateAmount(tempRows, finalAdjustments, {
          isGSTInclusive,
          gstValue,
        })

        yield put({
          type: 'updateState',
          payload: {
            ...amount,
            rows: tempRows,
            finalAdjustments,
          },
        })
      },

      *addPackage({ payload }, { select, call, put, delay }) {
        yield put({
          type: 'addPackageState',
          payload,
        })
      },

      *deletePackageItem({ payload }, { select, call, put, delay }) {
        yield put({
          type: 'deletePackageItemState',
          payload,
        })
      },

      *updatePriority({ payload }, { put, select }) {
        const orders = yield select(st => st.orders)
        const { rows = [] } = orders
        const { uid, priority } = payload
        let tempRows = [...rows]
        tempRows = tempRows.map(o => ({
          ...o,
          priority: o.uid === uid ? priority : o.priority,
        }))
        yield put({
          type: 'updateState',
          payload: {
            rows: tempRows,
          },
        })
      },

      *updateRows({ payload }, { put, select }) {
        const { newRows } = payload
        const {
          rows,
          finalAdjustments,
          isGSTInclusive,
          gstValue,
        } = yield select(st => st.orders)
        const { rows: documents } = yield select(st => st.consultationDocument)
        let tempRows = [...rows]
        let tempDocuments = [...documents]
        tempRows
          .filter(item => item.isDeleted)
          .forEach(item => (item.visitOrderTemplateItemFK = undefined))
        newRows.forEach(item => {
          let oldRow = tempRows.find(oldItem => oldItem.uid === item.uid)
          if (item.isDeleted) {
            if (item.type === '2') {
              const activeCertificate = oldRow.corVaccinationCert.find(
                vc => !vc.isDeleted,
              )
              if (activeCertificate) {
                let deleteVacc = tempDocuments.find(
                  d => d.uid === activeCertificate.uid,
                )
                if (deleteVacc) {
                  if (deleteVacc.id) {
                    deleteVacc.isDeleted = true
                    activeCertificate.isDeleted = true
                  } else {
                    tempDocuments = tempDocuments.filter(
                      d => d.uid !== activeCertificate.uid,
                    )
                  }
                }
              }
            }
            if (oldRow.id) {
              oldRow.isDeleted = true
            } else {
              tempRows = tempRows.filter(x => x.uid !== item.id)
            }
          } else {
            if (item.uid) {
              tempRows = tempRows.map(oldItem =>
                oldItem.uid === item.uid ? { ...item } : oldItem,
              )
            } else {
              const uid = getUniqueId()
              if (item.corVaccinationCert && item.corVaccinationCert.length) {
                const newCORVaccinationCert = item.corVaccinationCert.map(
                  vc => ({
                    ...vc,
                    vaccinationUFK: uid,
                    uid: getUniqueId(),
                  }),
                )
                tempDocuments.push({ ...newCORVaccinationCert[0] })
                tempRows.push({
                  ...item,
                  uid,
                  corVaccinationCert: newCORVaccinationCert,
                })
              } else {
                tempRows.push({
                  ...item,
                  uid,
                })
              }
            }
          }
        })

        yield put({
          type: 'consultationDocument/updateState',
          payload: {
            rows: tempDocuments,
          },
        })
        const amount = calculateAmount(tempRows, finalAdjustments, {
          isGSTInclusive,
          gstValue,
        })

        yield put({
          type: 'updateState',
          payload: {
            ...amount,
            rows: tempRows,
            finalAdjustments,
          },
        })
      },
    },

    reducers: {
      reset() {
        return { ...initialState }
      },
      upsertRowState(state, { payload }) {
        let newRow
        let { rows, type } = state
        if (payload.type) {
          type = payload.type
        }
        const getCertificate = uid => {
          const corVaccinationCert =
            type === '2'
              ? payload.corVaccinationCert.map(vc => {
                  if (vc.uid) {
                    return { ...vc, vaccinationUFK: uid }
                  }
                  return {
                    ...vc,
                    vaccinationUFK: uid,
                    uid: getUniqueId(),
                  }
                })
              : []
          return corVaccinationCert
        }
        if (payload.uid) {
          rows = rows.map(row => {
            const n =
              row.uid === payload.uid
                ? {
                    ...row,
                    ...payload,
                    corVaccinationCert: getCertificate(row.uid),
                  }
                : row
            return n
          })
        } else {
          const uid = getUniqueId()
          newRow = {
            ...payload,
            type,
            uid,
            corVaccinationCert: getCertificate(uid),
          }
          rows.push(newRow)
        }
        return {
          ...state,
          rows,
          entity: newRow || rows.find(r => r.uid === payload.uid),
        }
      },

      // used by each order component
      adjustAmount(state, { payload }) {
        return {
          ...state,
          entity: {
            ...state.entity,
            ...payload,
            totalAfterItemAdjustment: payload.finalAmount,
          },
        }
      },

      calculateAmount(state, { payload = {} }) {
        let { finalAdjustments, rows, isGSTInclusive, gstValue } = state
        const amount = calculateAmount(rows, finalAdjustments, {
          isGSTInclusive,
          gstValue,
        })
        return {
          ...state,
          ...amount,
        }
      },

      // used by calc total amount
      addFinalAdjustmentState(state, { payload }) {
        let { finalAdjustments, rows } = state
        if (payload.uid) {
          finalAdjustments = finalAdjustments.map(row => {
            const n =
              row.uid === payload.uid
                ? {
                    ...row,
                    ...payload,
                  }
                : row
            return n
          })
        } else {
          finalAdjustments.push({
            ...payload,
            uid: getUniqueId(),
            sequence:
              finalAdjustments.map(o => o.sequence).reduce(maxReducer, 0) + 1,
          })
        }
        return {
          ...state,
          finalAdjustments,
        }
      },

      // used by calc total amount
      editFinalAdjustmentState(state, { payload }) {
        let { finalAdjustments, rows } = state
        if (payload.uid) {
          finalAdjustments = finalAdjustments.map(row => {
            const n =
              row.uid === payload.uid
                ? {
                    ...row,
                    ...payload,
                  }
                : row
            return n
          })
        } else {
          finalAdjustments.push({
            ...payload,
            uid: getUniqueId(),
            sequence:
              finalAdjustments.map(o => o.sequence).reduce(maxReducer, 0) + 1,
          })
        }
        return {
          ...state,
          finalAdjustments,
        }
      },

      deleteFinalAdjustmentState(state, { payload }) {
        const { finalAdjustments } = state

        return {
          ...state,
          finalAdjustments: finalAdjustments.map(o => {
            if (o.uid === payload.uid) o.isDeleted = true
            return o
          }),
        }
      },

      addPackageState(state, { payload }) {
        let { corPackage } = state
        corPackage.push({
          ...payload,
          uid: getUniqueId(),
        })
        return {
          ...state,
          corPackage,
        }
      },

      deletePackageItemState(state, { payload }) {
        let { corPackage, rows } = state

        const activePackageItems = rows.filter(
          item =>
            item.packageGlobalId === payload.packageGlobalId &&
            item.isDeleted === false,
        )
        const toBeUpdatedPackage = corPackage.find(
          p => p.packageGlobalId === payload.packageGlobalId,
        )
        if (toBeUpdatedPackage) {
          if (activePackageItems.length === 0) {
            toBeUpdatedPackage.isDeleted = true
          } else {
            toBeUpdatedPackage.totalPrice =
              _.sumBy(activePackageItems, 'totalAfterItemAdjustment') || 0
          }
        }

        return {
          ...state,
          corPackage,
        }
      },
    },
  },
})
