import { history } from 'umi'
import { createFormViewModel } from 'medisys-model'
import { sendQueueNotification } from '@/pages/Reception/Queue/utils'
import { notification } from '@/components'
import { getUniqueId, getTranslationValue, roundTo } from '@/utils/utils'
import service from '../services/dispense'
import Authorized from '@/utils/Authorized'

const getDispenseItems = (clinicSettings, entity = {}) => {
  const {
    primaryPrintoutLanguage = 'EN',
    secondaryPrintoutLanguage = '',
  } = clinicSettings

  let orderItems = []
  const defaultItem = (item, groupName) => {
    return {
      ...item,
      stockBalance: item.quantity,
      dispenseGroupId: groupName,
      countNumber: 1,
      rowspan: 1,
      uid: getUniqueId(),
    }
  }

  const getActiveInventoryStock = (inventoryStock = [], type, inventoryFK) => {
    let inventoryItemStock = []
    _.orderBy(inventoryStock, ['isDefault', 'expiryDate'], ['asc']).forEach(
      stockItem => {
        if (stockItem.isDefault) inventoryItemStock.push({ ...stockItem })
        //get exists dispense qty
        let dispenseQty = roundTo(
          _.sumBy(
            orderItems.filter(
              orderItem =>
                stockItem.id === orderItem.stockFK &&
                orderItem.type === type &&
                ((type === 'Consumable' &&
                  orderItem.inventoryConsumableFK == inventoryFK) ||
                  (type === 'Medication' &&
                    orderItem.inventoryMedicationFK == inventoryFK)),
            ),
            'dispenseQuantity',
          ) || 0,
        )
        const remainStock = roundTo(stockItem.stock - dispenseQty)

        if (remainStock > 0) {
          inventoryItemStock.push({ ...stockItem, remainStock })
        }
      },
    )
    return inventoryItemStock
  }

  const transactionDetails = item => {
    const {
      inventoryStockFK,
      batchNo,
      expiryDate,
      oldQty,
      transactionQty,
      uomDisplayValue,
      secondUOMDisplayValue,
    } = item
    return {
      dispenseQuantity: transactionQty,
      batchNo,
      expiryDate,
      stock: oldQty,
      stockFK: inventoryStockFK,
      uomDisplayValue,
      secondUOMDisplayValue,
    }
  }

  const generateFromTempDispenseInfo = (
    item,
    stock = 0,
    isDefault,
    primaryUOM,
    secondUOM,
  ) => {
    const { inventoryStockFK, batchNo, expiryDate, transactionQty } = item
    return {
      dispenseQuantity: transactionQty,
      batchNo,
      expiryDate,
      stock,
      stockFK: inventoryStockFK,
      uomDisplayValue: primaryUOM,
      secondUOMDisplayValue: secondUOM,
      isDefault,
      allowToDispense: true,
    }
  }

  const generateFromDrugmixture = (item, isForInvoiceReplacement) => {
    const drugMixtures = _.orderBy(
      item.prescriptionDrugMixture,
      ['sequence'],
      ['asc'],
    )
    drugMixtures.forEach(drugMixture => {
      const detaultDrugMixture = {
        ...defaultItem(item, `DrugMixture-${item.id}`),
        drugMixtureFK: drugMixture.id,
        inventoryMedicationFK: drugMixture.inventoryMedicationFK,
        code: drugMixture.drugCode,
        name: drugMixture.drugName,
        quantity: drugMixture.quantity,
        dispenseUOM: drugMixture.uomDisplayValue,
        isDispensedByPharmacy: drugMixture.isDispensedByPharmacy,
        drugMixtureName: item.name,
        stockBalance: drugMixture.quantity,
        uid: getUniqueId(),
        medicationStock: drugMixture.medication?.medicationStock || [],
      }
      if (isForInvoiceReplacement) {
        orderItems.push({
          ...detaultDrugMixture,
        })
      } else if (drugMixture.isDispensedByPharmacy) {
        if (drugMixture.dispenseItem.length) {
          drugMixture.dispenseItem.forEach((di, index) => {
            orderItems.push({
              ...detaultDrugMixture,
              ...transactionDetails(di),
              stockBalance:
                drugMixture.quantity -
                _.sumBy(drugMixture.dispenseItem, 'transactionQty'),
              countNumber: index === 0 ? 1 : 0,
              rowspan: index === 0 ? drugMixture.dispenseItem.length : 0,
              uid: getUniqueId(),
            })
          })
        } else {
          orderItems.push({
            ...detaultDrugMixture,
          })
        }
      } else {
        const primaryUOMDisplayValue = getTranslationValue(
          drugMixture.medication?.dispenseTranslationUOM || [],
          primaryPrintoutLanguage,
          'displayValue',
        )
        const secondUOMDisplayValue =
          secondaryPrintoutLanguage !== ''
            ? getTranslationValue(
                drugMixture.medication?.dispenseTranslationUOM || [],
                secondaryPrintoutLanguage,
                'displayValue',
              )
            : ''

        const tempDispenseItem = (item.tempDispenseItem || []).filter(
          t => t.inventoryFK === drugMixture.inventoryMedicationFK,
        )
        if (tempDispenseItem.length) {
          tempDispenseItem.forEach((di, index) => {
            const currentStock = (
              drugMixture.medication?.medicationStock || []
            ).find(s => s.id === di.inventoryStockFK)
            orderItems.push({
              ...detaultDrugMixture,
              ...generateFromTempDispenseInfo(
                di,
                currentStock?.stock,
                currentStock?.isDefault,
                primaryUOMDisplayValue,
                secondUOMDisplayValue,
              ),
              stockBalance:
                drugMixture.quantity -
                _.sumBy(tempDispenseItem, 'transactionQty'),
              countNumber: index === 0 ? 1 : 0,
              rowspan: index === 0 ? tempDispenseItem.length : 0,
              uid: getUniqueId(),
            })
          })
        } else {
          const inventoryItemStock = getActiveInventoryStock(
            drugMixture.medication?.medicationStock || [],
            detaultDrugMixture.type,
            detaultDrugMixture.inventoryMedicationFK,
          )
          let remainQty = drugMixture.quantity
          if (
            remainQty > 0 &&
            drugMixture.medication &&
            inventoryItemStock.length
          ) {
            inventoryItemStock.forEach((itemStock, index) => {
              const {
                id,
                batchNo,
                expiryDate,
                stock,
                isDefault,
                remainStock,
              } = itemStock
              if (remainQty > 0) {
                let dispenseQuantity = 0
                if (isDefault || remainQty <= remainStock) {
                  dispenseQuantity = remainQty
                  remainQty = -1
                } else {
                  dispenseQuantity = remainStock
                  remainQty = remainQty - remainStock
                }
                orderItems.push({
                  ...detaultDrugMixture,
                  dispenseQuantity: dispenseQuantity,
                  batchNo,
                  expiryDate,
                  stock,
                  stockFK: id,
                  uomDisplayValue: primaryUOMDisplayValue,
                  secondUOMDisplayValue: secondUOMDisplayValue,
                  isDefault,
                  stockBalance: 0,
                  countNumber: index === 0 ? 1 : 0,
                  rowspan: 0,
                  uid: getUniqueId(),
                  allowToDispense: true,
                })
              }
            })
            const firstItem = orderItems.find(
              i => i.drugMixtureFK === drugMixture.id && i.countNumber === 1,
            )
            firstItem.rowspan = orderItems.filter(
              i => i.drugMixtureFK === drugMixture.id,
            ).length
          } else {
            orderItems.push({
              ...detaultDrugMixture,
            })
          }
        }
      }
    })

    const groupItems = orderItems.filter(
      oi => oi.type === item.type && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const generateFromNormalMedication = (item, isForInvoiceReplacement) => {
    const groupName = 'NormalDispense'
    if (
      (item.isPreOrder && !item.isChargeToday) ||
      (!item.isPreOrder && item.hasPaid) ||
      isForInvoiceReplacement
    ) {
      orderItems.push({
        ...defaultItem(item, groupName),
        groupNumber: 1,
        groupRowSpan: 1,
      })
      return
    }

    if (item.isDispensedByPharmacy) {
      if (item.dispenseItem.length) {
        item.dispenseItem.forEach((di, index) => {
          orderItems.push({
            ...defaultItem(item, groupName),
            ...transactionDetails(di),
            stockBalance:
              item.quantity - _.sumBy(item.dispenseItem, 'transactionQty'),
            countNumber: index === 0 ? 1 : 0,
            rowspan: index === 0 ? item.dispenseItem.length : 0,
            uid: getUniqueId(),
            medicationStock: item.medication?.medicationStock || [],
          })
        })
      } else {
        orderItems.push(defaultItem(item, groupName))
      }
    } else {
      const primaryUOMDisplayValue = getTranslationValue(
        item.medication?.dispenseTranslationUOM || [],
        primaryPrintoutLanguage,
        'displayValue',
      )
      const secondUOMDisplayValue =
        secondaryPrintoutLanguage !== ''
          ? getTranslationValue(
              item.medication?.dispenseTranslationUOM || [],
              secondaryPrintoutLanguage,
              'displayValue',
            )
          : ''
      if (item.tempDispenseItem.length) {
        item.tempDispenseItem.forEach((di, index) => {
          const currentStock = (item.medication?.medicationStock || []).find(
            s => s.id === di.inventoryStockFK,
          )
          orderItems.push({
            ...defaultItem(item, groupName),
            ...generateFromTempDispenseInfo(
              di,
              currentStock?.stock,
              currentStock?.isDefault,
              primaryUOMDisplayValue,
              secondUOMDisplayValue,
            ),
            stockBalance:
              item.quantity - _.sumBy(item.tempDispenseItem, 'transactionQty'),
            countNumber: index === 0 ? 1 : 0,
            rowspan: index === 0 ? item.tempDispenseItem.length : 0,
            uid: getUniqueId(),
            medicationStock: item.medication?.medicationStock || [],
          })
        })
      } else {
        const inventoryItemStock = getActiveInventoryStock(
          item.medication?.medicationStock || [],
          item.type,
          item.inventoryMedicationFK,
        )
        let remainQty = item.quantity
        if (remainQty > 0 && item.medication && inventoryItemStock.length) {
          inventoryItemStock.forEach((itemStock, index) => {
            const {
              id,
              batchNo,
              expiryDate,
              stock,
              isDefault,
              remainStock,
            } = itemStock
            if (remainQty > 0) {
              let dispenseQuantity = 0
              if (isDefault || remainQty <= remainStock) {
                dispenseQuantity = remainQty
                remainQty = -1
              } else {
                dispenseQuantity = remainStock
                remainQty = remainQty - remainStock
              }
              orderItems.push({
                ...defaultItem(item, groupName),
                dispenseQuantity: dispenseQuantity,
                batchNo,
                expiryDate,
                stock,
                stockFK: id,
                uomDisplayValue: primaryUOMDisplayValue,
                secondUOMDisplayValue: secondUOMDisplayValue,
                isDefault,
                stockBalance: 0,
                countNumber: index === 0 ? 1 : 0,
                rowspan: 0,
                uid: getUniqueId(),
                allowToDispense: true,
                medicationStock: item.medication?.medicationStock || [],
              })
            }
          })
          const firstItem = orderItems.find(
            i =>
              i.type === item.type &&
              i.isDrugMixture === item.isDrugMixture &&
              i.id === item.id &&
              i.countNumber === 1,
          )
          firstItem.rowspan = orderItems.filter(
            i =>
              i.type === item.type &&
              i.isDrugMixture === item.isDrugMixture &&
              i.id === item.id,
          ).length
        } else {
          orderItems.push(defaultItem(item, groupName))
        }
      }
    }

    const groupItems = orderItems.filter(
      oi => oi.type === item.type && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const generateFromNormalConsumable = (item, isForInvoiceReplacement) => {
    const groupName = 'NormalDispense'
    if (
      (item.isPreOrder && !item.isChargeToday) ||
      (!item.isPreOrder && item.hasPaid) ||
      isForInvoiceReplacement
    ) {
      orderItems.push({
        ...defaultItem(item, groupName),
        groupNumber: 1,
        groupRowSpan: 1,
      })
      return
    }
    if (item.isDispensedByPharmacy) {
      if (item.dispenseItem.length) {
        item.dispenseItem.forEach((di, index) => {
          orderItems.push({
            ...defaultItem(item, groupName),
            ...transactionDetails(di),
            stockBalance:
              item.quantity - _.sumBy(item.dispenseItem, 'transactionQty'),
            countNumber: index === 0 ? 1 : 0,
            rowspan: index === 0 ? item.dispenseItem.length : 0,
            uid: getUniqueId(),
            consumableStock: item.consumable?.consumableStock,
          })
        })
      } else {
        orderItems.push(defaultItem(item, groupName))
      }
    } else {
      if (item.tempDispenseItem.length) {
        item.tempDispenseItem.forEach((di, index) => {
          const currentStock = (item.consumable?.consumableStock || []).find(
            s => s.id === di.inventoryStockFK,
          )
          orderItems.push({
            ...defaultItem(item, groupName),
            ...generateFromTempDispenseInfo(
              di,
              currentStock?.stock,
              currentStock?.isDefault,
              item.dispenseUOM,
            ),
            stockBalance:
              item.quantity - _.sumBy(item.tempDispenseItem, 'transactionQty'),
            countNumber: index === 0 ? 1 : 0,
            rowspan: index === 0 ? item.tempDispenseItem.length : 0,
            uid: getUniqueId(),
            consumableStock: item.consumable?.consumableStock,
          })
        })
      } else {
        const inventoryItemStock = getActiveInventoryStock(
          item.consumable?.consumableStock || [],
          item.type,
          item.inventoryConsumableFK,
        )
        let remainQty = item.quantity
        if (remainQty > 0 && item.consumable && inventoryItemStock.length) {
          inventoryItemStock.forEach((itemStock, index) => {
            const {
              id,
              batchNo,
              expiryDate,
              stock,
              isDefault,
              remainStock,
            } = itemStock
            if (remainQty > 0) {
              let dispenseQuantity = 0
              if (isDefault || remainQty <= remainStock) {
                dispenseQuantity = remainQty
                remainQty = -1
              } else {
                dispenseQuantity = remainStock
                remainQty = remainQty - remainStock
              }
              orderItems.push({
                ...defaultItem(item, groupName),
                dispenseQuantity: dispenseQuantity,
                batchNo,
                expiryDate,
                stock,
                stockFK: id,
                uomDisplayValue: item.dispenseUOM,
                isDefault,
                stockBalance: 0,
                countNumber: index === 0 ? 1 : 0,
                rowspan: 0,
                uid: getUniqueId(),
                allowToDispense: true,
                consumableStock: item.consumable?.consumableStock,
              })
            }
            const firstItem = orderItems.find(
              i =>
                i.type === item.type &&
                i.isDrugMixture === item.isDrugMixture &&
                i.id === item.id &&
                i.countNumber === 1,
            )
            firstItem.rowspan = orderItems.filter(
              i =>
                i.type === item.type &&
                i.isDrugMixture === item.isDrugMixture &&
                i.id === item.id,
            ).length
          })
        } else {
          orderItems.push(defaultItem(item, groupName))
        }
      }
    }
    const groupItems = orderItems.filter(
      oi => oi.type === item.type && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const generateFromNormalVaccination = (item, isForInvoiceReplacement) => {
    const groupName = 'NormalDispense'
    if (
      (item.isPreOrder && !item.isChargeToday) ||
      (!item.isPreOrder && item.hasPaid) ||
      isForInvoiceReplacement
    ) {
      orderItems.push({
        ...defaultItem(item, groupName),
        groupNumber: 1,
        groupRowSpan: 1,
      })
      return
    }
    if (item.tempDispenseItem.length) {
      item.tempDispenseItem.forEach((di, index) => {
        const currentStock = (item.vaccination?.vaccinationStock || []).find(
          s => s.id === di.inventoryStockFK,
        )
        orderItems.push({
          ...defaultItem(item, groupName),
          ...generateFromTempDispenseInfo(
            di,
            currentStock?.stock,
            currentStock?.isDefault,
            item.dispenseUOM,
          ),
          stockBalance:
            item.quantity - _.sumBy(item.tempDispenseItem, 'transactionQty'),
          countNumber: index === 0 ? 1 : 0,
          rowspan: index === 0 ? item.tempDispenseItem.length : 0,
          uid: getUniqueId(),
          vaccinationStock: item.vaccination?.vaccinationStock,
        })
      })
    } else {
      let inventoryItemStock = []
      _.orderBy(
        (item.vaccination?.vaccinationStock || []).map(t =>
          t.batchNo === item.batchNo ? { ...t, isChecked: true } : t,
        ),
        ['isChecked', 'isDefault', 'expiryDate'],
        ['asc'],
      ).forEach(stockItem => {
        if (stockItem.isDefault)
          inventoryItemStock.push({
            ...stockItem,
          })
        const remainStock =
          stockItem.stock -
          roundTo(
            _.sumBy(
              orderItems.filter(
                orderItem =>
                  stockItem.id === orderItem.stockFK &&
                  orderItem.invoiceItemTypeFK === item.invoiceItemTypeFK &&
                  orderItem.inventoryVaccinationFK ==
                    item.inventoryVaccinationFK,
              ),
              'dispenseQuantity',
            ) || 0,
          )
        if (remainStock >= item.quantity) {
          inventoryItemStock.push({
            ...stockItem,
            remainStock,
          })
        }
      })
      let remainQty = item.quantity
      if (remainQty > 0 && item.vaccination && inventoryItemStock.length) {
        const {
          id,
          batchNo,
          expiryDate,
          stock,
          isDefault,
        } = inventoryItemStock[0]
        orderItems.push({
          ...defaultItem(item, groupName),
          dispenseQuantity: item.quantity,
          batchNo,
          expiryDate,
          stock,
          stockFK: id,
          uomDisplayValue: item.dispenseUOM,
          isDefault,
          stockBalance: 0,
          allowToDispense: true,
          vaccinationStock: item.vaccination?.vaccinationStock,
        })
      } else {
        const { batchNo, expiryDate, ...restItem } = item
        orderItems.push(defaultItem(restItem, groupName))
      }
    }
    const groupItems = orderItems.filter(
      oi => oi.type === item.type && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const sortOrderItems = [
    ...(entity.prescription || [])
      .filter(item => item.type === 'Medication' && !item.isDrugMixture)
      .map(item => {
        return { ...item, quantity: item.orderedQuantity }
      }),
    ...(entity.vaccination || []),
    ...(entity.consumable || []),
    ...(entity.prescription || []).filter(
      item => item.type === 'Medication' && item.isDrugMixture,
    ),
    ...(entity.prescription || [])
      .filter(item => item.type === 'Open Prescription')
      .map(item => {
        return { ...item, quantity: item.orderedQuantity }
      }),
    ...(entity.externalPrescription || []).map(item => {
      return { ...item, quantity: item.dispensedQuanity }
    }),
  ]

  sortOrderItems.forEach(item => {
    if (item.type === 'Medication') {
      if (item.isDrugMixture) {
        generateFromDrugmixture(item, entity.isForInvoiceReplacement)
      } else {
        generateFromNormalMedication(item, entity.isForInvoiceReplacement)
      }
    } else if (
      item.type === 'Open Prescription' ||
      item.type === 'External Prescription'
    ) {
      orderItems.push({
        ...defaultItem(item, 'NoNeedToDispense'),
        groupNumber: 1,
        groupRowSpan: 1,
      })
    } else if (item.type === 'Vaccination') {
      generateFromNormalVaccination(item, entity.isForInvoiceReplacement)
    } else {
      generateFromNormalConsumable(item, entity.isForInvoiceReplacement)
    }
  })

  return orderItems
}

export default createFormViewModel({
  namespace: 'dispense',
  config: {},
  param: {
    service,
    state: {
      loadCount: 0,
      totalWithGST: 0,
      visitID: undefined,
      servingPersons: [],
      default: {
        corAttachment: [],
        corPatientNoteVitalSign: [],
        corAudiometryTest: [],
        corEyeExaminations: [],
        invoice: {
          isGSTInclusive: false,
          invoiceAdjustment: [],
          invoiceItem: [],
        },
      },
      selectedWidgets: ['1'],
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen((loct, method) => {
        const { pathname, search, query = {} } = loct

        if (
          (pathname === '/reception/queue/dispense' ||
            pathname === '/medicalcheckup/worklist/orderdetails') &&
          Number(query.vid)
        ) {
          dispatch({
            type: 'initState',
            payload: {
              version: Number(query.v) || undefined,
              visitID: Number(query.vid),
              pid: Number(query.pid),
              qid: Number(query.qid),
            },
          })
        }
      })
    },
    effects: {
      *initState({ payload }, { all, put, select, take }) {
        const { version, visitID, md2, qid } = payload
        const patientState = yield select(st => st.patient)

        yield put({
          type: 'updateState',
          payload: {
            visitID,
            patientID: payload.pid,
          },
        })
        if (payload.pid) {
          yield put({
            type: 'patient/query',
            payload: {
              id: payload.pid,
              version: Date.now(),
            },
          })
          yield take('patient/query/@@end')
        }

        if (qid)
          yield put({
            type: 'visitRegistration/query',
            payload: { id: payload.qid, version: payload.v },
          })

        yield put({
          type: 'query',
          payload: {
            id: visitID,
            version,
          },
        })
        yield take('query/@@end')
        yield put({
          type: 'getServingPersons',
          payload: { visitFK: visitID },
        })
      },

      *addActualize({ payload }, { call, put }) {
        const response = yield call(service.addActualize, payload)
        return response
      },

      *getActualize({ payload }, { call, put }) {
        const response = yield call(service.getActualize, payload)
        return response
      },

      *cancelActualize({ payload }, { call, put }) {
        const response = yield call(service.cancelActualize, payload)
        return response
      },

      *getServingPersons({ payload }, { call, put }) {
        const response = yield call(service.getServingPersons, payload)
        if (response)
          yield put({
            type: 'updateState',
            payload: {
              servingPersons: response.data,
            },
          })
      },

      *setServingPerson({ payload }, { call, put }) {
        const response = yield call(service.setServingPerson, payload)
        if (response)
          yield put({
            type: 'getServingPersons',
            payload: payload,
          })
      },

      *start({ payload }, { call, put }) {
        const response = yield call(service.create, payload)
        const { id } = response
        if (id) {
          //yield put({
          //  type: 'updateState',
          //  payload: {
          //entity: response,
          //version: payload.version,
          //  },
          //})

          sendQueueNotification({
            message: 'Ready for dispensing.',
            queueNo: payload.queueNo,
            visitID: id,
          })
        }
        return response
      },
      *refresh({ payload }, { call, put, select }) {
        yield put({
          type: 'query',
          payload: {
            id: payload,
          },
        })
      },

      *save({ payload }, { call }) {
        const response = yield call(service.save, payload)
        return response
      },
      *discard({ payload }, { call, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.remove, payload)
        if (response) {
          sendQueueNotification({
            message: 'Dispense discarded',
            queueNo: entity.queueNo,
            visitID: entity.id,
          })
        }
        return response
      },
      *finalize({ payload }, { call, put, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.finalize, payload)
        if (response)
          yield put({
            type: 'closeModal',
            payload: {
              toBillingPage: true,
            },
          })
        sendQueueNotification({
          message: 'Dispense finalized. Waiting for payment.',
          queueNo: entity.queueNo,
          visitID: entity.id,
        })
        return response
      },
      *unlock({ payload }, { call }) {
        const response = yield call(service.unlock, payload)
        return response
      },
      *closeModal({ payload = { toBillingPage: false } }, { call, put }) {
        const { toBillingPage = false } = payload

        yield put({
          type: 'global/updateAppState',
          payload: {
            disableSave: false,
            showDispensePanel: false,
            fullscreen: false,
          },
        })
        if (!toBillingPage) {
          yield put({
            type: 'updateState',
            payload: {
              entity: undefined,
            },
          })
          history.push('/reception/queue')
        }
      },

      *queryAddOrderDetails({ payload }, { call, put }) {
        const response = yield call(service.queryAddOrderDetails, {
          invoiceId: payload.invoiceId,
          isInitialLoading: payload.isInitialLoading,
        })

        if (response.status === '200') {
          yield put({
            type: 'getAddOrderDetails',
            payload: response,
          })
          return response.data
        }
        return false
      },

      *saveAddOrderDetails({ payload }, { call }) {
        const response = yield call(service.saveAddOrderDetails, payload)
        if (response === 204) {
          notification.success({ message: 'Saved' })
          return true
        }
        return false
      },

      *removeAddOrderDetails({ payload }, { call, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.removeAddOrderDetails, payload)
        return response === 204
      },
      *discardBillOrder({ payload }, { call, select }) {
        const visitRegistration = yield select(state => state.visitRegistration)
        const { entity } = visitRegistration

        const response = yield call(service.removeBillFirstVisit, payload)
        return response === 204
      },

      *updateShouldRefreshOrder({ payload }, { put, select }) {
        const user = yield select(state => state.user)
        const dispense = yield select(state => state.dispense)
        const { visitID, senderId } = payload
        const { entity = {} } = dispense || {}
        if (entity && entity.id === visitID && senderId !== user.data.id) {
          yield put({
            type: 'updateState',
            payload: {
              shouldRefreshOrder: true,
            },
          })
        }
      },

      *queryDone({ payload }, { put, select }) {
        const clinicSettings = yield select(st => st.clinicSettings)
        const dispense = yield select(st => st.dispense)
        let obj = dispense.entity
        const orderItems = getDispenseItems(clinicSettings.settings || {}, obj)
        const defaultExpandedGroups = _.uniqBy(
          orderItems,
          'dispenseGroupId',
        ).map(o => o.dispenseGroupId)
        yield put({
          type: 'updateState',
          payload: {
            entity: {
              ...obj,
              dispenseItems: orderItems,
              defaultExpandedGroups,
            },
          },
        })
      },
      *getSeparatedDrugInstructions({ payload }, { call, select, put, take }) {
        const result = yield call(service.getSeparatedDrugInstructions, payload)
        if (result.status === '200') {
          return result.data
        }
        return []
      },
    },
    reducers: {
      incrementLoadCount(state) {
        return { ...state, loadCount: state.loadCount + 1 }
      },
      getAddOrderDetails(state, { payload }) {
        const { data } = payload
        return {
          ...state,
          addOrderDetails: data,
        }
      },
    },
  },
})
