import { createFormViewModel } from 'medisys-model'
import { useSelector } from 'dva'
import { PHARMACY_STATUS, SYSTEM_LANGUAGE } from '@/utils/constants'
import { getTranslationValue, getUniqueId } from '@/utils/utils'
import service from '../../services'

const getPharmacyItems = (codetable, clinicSettings, entity = {}) => {
  const {
    primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
    secondaryPrintoutLanguage = '',
  } = clinicSettings
  let orderItems = []

  const defaultItem = (item, groupName) => {
    return {
      ...item,
      language: {
        value: primaryPrintoutLanguage,
        isShowFirstValue:
          primaryPrintoutLanguage === SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
      },
      statusFK: entity.statusFK,
      dispenseGroupId: groupName,
      stockBalance: item.quantity,
      remainQty: item.quantity,
      countNumber: 1,
      rowspan: 1,
      uid: getUniqueId(),
    }
  }

  const generateFromDrugmixture = item => {
    const drugMixtures = _.orderBy(
      item.prescriptionDrugMixture,
      ['sequence'],
      ['asc'],
    )
    drugMixtures.forEach(drugMixture => {
      const detaultDrugMixture = {
        ...defaultItem(item, `DrugMixture-${item.id}`),
        drugMixtureFK: drugMixture.id,
        inventoryFK: drugMixture.inventoryMedicationFK,
        itemCode: drugMixture.drugCode,
        itemName: drugMixture.drugName,
        quantity: drugMixture.quantity,
        dispenseUOM: drugMixture.uomDisplayValue,
        secondDispenseUOM: drugMixture.secondUOMDisplayValue,
        isDispensedByPharmacy: drugMixture.isDispensedByPharmacy,
        drugMixtureName: item.itemName,
        stockBalance: drugMixture.quantity,
        remainQty: drugMixture.quantity,
        uid: getUniqueId(),
        medicationStock: drugMixture.medication?.medicationStock || [],
        medicationInteraction:
          drugMixture.medication?.medicationInteraction || [],
        medicationContraIndication:
          drugMixture.medication?.medicationContraIndication || [],
      }
      if (!drugMixture.isDispensedByPharmacy) {
        orderItems.push({
          ...detaultDrugMixture,
        })
      } else {
        if (entity.statusFK === PHARMACY_STATUS.NEW) {
          const primaryUOMDisplayValue = getTranslationValue(
            drugMixture.medication?.dispenseTranslationUOM || [],
            SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
            'displayValue',
          )
          const secondUOMDisplayValue =
            primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
            secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
              ? getTranslationValue(
                  drugMixture.medication?.dispenseTranslationUOM || [],
                  SYSTEM_LANGUAGE.SECONDLANGUAGE,
                  'displayValue',
                )
              : ''
          const inventoryItemStock = _.orderBy(
            (drugMixture.medication?.medicationStock || []).filter(
              s => s.isDefault || s.stock > 0,
            ),
            ['isDefault', 'expiryDate'],
            ['asc'],
          )
          let remainQty = drugMixture.quantity
          if (
            remainQty > 0 &&
            drugMixture.medication &&
            inventoryItemStock.length
          ) {
            inventoryItemStock.forEach((itemStock, index) => {
              const { id, batchNo, expiryDate, stock, isDefault } = itemStock
              if (remainQty > 0) {
                let dispenseQuantity = 0
                if (isDefault || remainQty <= stock) {
                  dispenseQuantity = remainQty
                  remainQty = -1
                } else {
                  dispenseQuantity = stock
                  remainQty = remainQty - stock
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
        } else {
          const currentTransactionItems = _.orderBy(
            drugMixture.pharmacyOrderItemTransaction || [],
            ['expiryDate'],
            ['asc'],
          )
          if (currentTransactionItems.length) {
            currentTransactionItems.forEach((itemTransaction, index) => {
              const {
                stockFK,
                batchNo,
                expiryDate,
                oldQty,
                transactionQty,
                uomDisplayValue,
                secondUOMDisplayValue,
              } = itemTransaction
              orderItems.push({
                ...detaultDrugMixture,
                dispenseQuantity: transactionQty,
                batchNo,
                expiryDate,
                stock: oldQty,
                stockFK: stockFK,
                uomDisplayValue,
                secondUOMDisplayValue,
                drugMixtureName: item.itemName,
                stockBalance:
                  drugMixture.quantity -
                  _.sumBy(
                    drugMixture.pharmacyOrderItemTransaction,
                    'transactionQty',
                  ),
                countNumber: index === 0 ? 1 : 0,
                rowspan:
                  index === 0
                    ? drugMixture.pharmacyOrderItemTransaction.length
                    : 0,
                uid: getUniqueId(),
                allowToDispense: true,
              })
            })
          } else {
            orderItems.push({
              ...detaultDrugMixture,
            })
          }
        }
      }
    })

    const groupItems = orderItems.filter(
      oi =>
        oi.invoiceItemTypeFK === item.invoiceItemTypeFK && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const generateFromItemTransaction = (item, groupName) => {
    const currentTransactionItems = _.orderBy(
      item.pharmacyOrderItemTransaction || [],
      ['expiryDate'],
      ['asc'],
    )
    if (currentTransactionItems.length) {
      currentTransactionItems.forEach((itemTransaction, index) => {
        const {
          stockFK,
          batchNo,
          expiryDate,
          oldQty,
          transactionQty,
          uomDisplayValue,
          secondUOMDisplayValue,
        } = itemTransaction
        orderItems.push({
          ...defaultItem(item, groupName),
          dispenseQuantity: transactionQty,
          batchNo,
          expiryDate,
          stock: oldQty,
          stockFK: stockFK,
          uomDisplayValue,
          secondUOMDisplayValue,
          stockBalance:
            item.quantity -
            _.sumBy(item.pharmacyOrderItemTransaction, 'transactionQty'),
          countNumber: index === 0 ? 1 : 0,
          rowspan: index === 0 ? item.pharmacyOrderItemTransaction.length : 0,
          uid: getUniqueId(),
          allowToDispense: true,
          medicationStock: item.medication?.medicationStock || [],
          medicationInteraction: item.medication?.medicationInteraction || [],
          medicationContraIndication:
            item.medication?.medicationContraIndication || [],
        })
      })
    } else {
      orderItems.push({
        ...defaultItem(item, groupName),
        medicationStock: item.medication?.medicationStock || [],
        medicationInteraction: item.medication?.medicationInteraction || [],
        medicationContraIndication:
          item.medication?.medicationContraIndication || [],
      })
    }
  }

  const generateFromNormalMedication = item => {
    const groupName = 'NormalDispense'
    if (entity.statusFK === PHARMACY_STATUS.NEW) {
      const primaryUOMDisplayValue = getTranslationValue(
        item.medication?.dispenseTranslationUOM || [],
        SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
        'displayValue',
      )
      const secondUOMDisplayValue =
        primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
        secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
          ? getTranslationValue(
              item.medication?.dispenseTranslationUOM || [],
              SYSTEM_LANGUAGE.SECONDLANGUAGE,
              'displayValue',
            )
          : ''

      const inventoryItemStock = _.orderBy(
        (item.medication?.medicationStock || []).filter(
          s => s.isDefault || s.stock > 0,
        ),
        ['isDefault', 'expiryDate'],
        ['asc'],
      )
      let remainQty = item.quantity
      if (remainQty > 0 && item.medication && inventoryItemStock.length) {
        inventoryItemStock.forEach((itemStock, index) => {
          const { id, batchNo, expiryDate, stock, isDefault } = itemStock
          if (remainQty > 0) {
            let dispenseQuantity = 0
            if (isDefault || remainQty <= stock) {
              dispenseQuantity = remainQty
              remainQty = -1
            } else {
              dispenseQuantity = stock
              remainQty = remainQty - stock
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
              medicationInteraction:
                item.medication?.medicationInteraction || [],
              medicationContraIndication:
                item.medication?.medicationContraIndication || [],
            })
          }
        })
        const firstItem = orderItems.find(
          i =>
            i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
            i.isDrugMixture === item.isDrugMixture &&
            i.id === item.id &&
            i.countNumber === 1,
        )
        firstItem.rowspan = orderItems.filter(
          i =>
            i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
            i.isDrugMixture === item.isDrugMixture &&
            i.id === item.id,
        ).length
      } else {
        orderItems.push({
          ...defaultItem(item, groupName),
          medicationStock: item.medication?.medicationStock || [],
          medicationInteraction: item.medication?.medicationInteraction || [],
          medicationContraIndication:
            item.medication?.medicationContraIndication || [],
        })
      }
    } else {
      generateFromItemTransaction(item, groupName)
    }
    const groupItems = orderItems.filter(
      oi =>
        oi.invoiceItemTypeFK === item.invoiceItemTypeFK && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const generateFromNormalConsumable = item => {
    if (entity.statusFK === PHARMACY_STATUS.NEW) {
      const inventoryItemStock = _.orderBy(
        (item.consumable?.consumableStock || []).filter(
          s => s.isDefault || s.stock > 0,
        ),
        ['isDefault', 'expiryDate'],
        ['asc'],
      )
      let remainQty = item.quantity
      if (remainQty > 0 && item.consumable && inventoryItemStock.length) {
        inventoryItemStock.forEach((itemStock, index) => {
          const { id, batchNo, expiryDate, stock, isDefault } = itemStock
          if (remainQty > 0) {
            let dispenseQuantity = 0
            if (isDefault || remainQty <= stock) {
              dispenseQuantity = remainQty
              remainQty = -1
            } else {
              dispenseQuantity = stock
              remainQty = remainQty - stock
            }
            orderItems.push({
              ...defaultItem(item, 'NormalDispense'),
              dispenseQuantity: dispenseQuantity,
              batchNo,
              expiryDate,
              stock,
              stockFK: id,
              uomDisplayValue: item.consumable?.dispenseUOM,
              isDefault,
              stockBalance: 0,
              countNumber: index === 0 ? 1 : 0,
              rowspan: 0,
              uid: getUniqueId(),
              allowToDispense: true,
              consumableStock: item.consumable?.consumableStock || [],
            })
          }
          const firstItem = orderItems.find(
            i =>
              i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
              i.isDrugMixture === item.isDrugMixture &&
              i.id === item.id &&
              i.countNumber === 1,
          )
          firstItem.rowspan = orderItems.filter(
            i =>
              i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
              i.isDrugMixture === item.isDrugMixture &&
              i.id === item.id,
          ).length
        })
      } else {
        orderItems.push(defaultItem(item, 'NormalDispense'))
      }
    } else {
      generateFromItemTransaction(item, 'NormalDispense')
    }

    const groupItems = orderItems.filter(
      oi =>
        oi.invoiceItemTypeFK === item.invoiceItemTypeFK && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const pharmacyOrderItem = entity.pharmacyOrderItem || []
  const sortOrderItems = [
    ...pharmacyOrderItem.filter(
      item =>
        item.invoiceItemTypeFK === 1 &&
        item.inventoryFK &&
        !item.isExternalPrescription,
    ),
    ...pharmacyOrderItem.filter(item => item.invoiceItemTypeFK !== 1),
    ...pharmacyOrderItem.filter(
      item => item.invoiceItemTypeFK === 1 && item.isDrugMixture,
    ),
    ...pharmacyOrderItem.filter(
      item =>
        item.invoiceItemTypeFK === 1 &&
        (item.isExternalPrescription ||
          (!item.isDrugMixture && !item.inventoryFK)),
    ),
  ]
  sortOrderItems.forEach(item => {
    if (entity.statusFK === PHARMACY_STATUS.NEW) {
      if (item.invoiceItemTypeFK === 1) {
        if (item.isDrugMixture) {
          generateFromDrugmixture(item)
        } else if (!item.inventoryFK || item.isExternalPrescription) {
          orderItems.push({
            ...defaultItem(item, 'NoNeedToDispense'),
            groupNumber: 1,
            groupRowSpan: 1,
            medicationInteraction: item.medication?.medicationInteraction || [],
            medicationContraIndication:
              item.medication?.medicationContraIndication || [],
          })
        } else {
          generateFromNormalMedication(item)
        }
      } else {
        generateFromNormalConsumable(item)
      }
    } else {
      if (item.invoiceItemTypeFK === 1) {
        if (item.isDrugMixture) {
          generateFromDrugmixture(item)
        } else if (!item.inventoryFK || item.isExternalPrescription) {
          orderItems.push({
            ...defaultItem(item, 'NoNeedToDispense'),
            groupNumber: 1,
            groupRowSpan: 1,
            medicationInteraction: item.medication?.medicationInteraction || [],
            medicationContraIndication:
              item.medication?.medicationContraIndication || [],
          })
        } else {
          generateFromNormalMedication(item)
        }
      } else {
        generateFromNormalConsumable(item)
      }
    }
  })

  return orderItems
}

const getPartialPharmacyItems = (codetable, clinicSettings, entity = {}) => {
  const {
    primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
    secondaryPrintoutLanguage = '',
  } = clinicSettings
  let orderItems = []

  const defaultItem = (item, groupName) => {
    return {
      ...item,
      language: {
        value: primaryPrintoutLanguage,
        isShowFirstValue:
          primaryPrintoutLanguage === SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
      },
      statusFK: entity.statusFK,
      dispenseGroupId: groupName,
      stockBalance: item.quantity,
      remainQty: item.quantity,
      countNumber: 1,
      rowspan: 1,
      uid: getUniqueId(),
    }
  }

  const generateFromDrugmixture = item => {
    const drugMixtures = _.orderBy(
      item.prescriptionDrugMixture,
      ['sequence'],
      ['asc'],
    )
    drugMixtures.forEach(drugMixture => {
      const detaultDrugMixture = {
        ...defaultItem(item, `DrugMixture-${item.id}`),
        drugMixtureFK: drugMixture.id,
        inventoryFK: drugMixture.inventoryMedicationFK,
        itemCode: drugMixture.drugCode,
        itemName: drugMixture.drugName,
        quantity: drugMixture.quantity,
        dispenseUOM: drugMixture.uomDisplayValue,
        secondDispenseUOM: drugMixture.secondUOMDisplayValue,
        isDispensedByPharmacy: drugMixture.isDispensedByPharmacy,
        drugMixtureName: item.itemName,
        stockBalance: drugMixture.quantity,
        remainQty: drugMixture.quantity,
        uid: getUniqueId(),
        medicationStock: drugMixture.medication?.medicationStock,
        medicationInteraction:
          drugMixture.medication?.medicationInteraction || [],
        medicationContraIndication:
          drugMixture.medication?.medicationContraIndication || [],
      }
      const totalRemainQty =
        drugMixture.quantity -
        _.sumBy(drugMixture.pharmacyOrderItemTransaction, 'transactionQty')
      if (drugMixture.isDispensedByPharmacy && totalRemainQty > 0) {
        const primaryUOMDisplayValue = getTranslationValue(
          drugMixture.medication?.dispenseTranslationUOM || [],
          SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
          'displayValue',
        )
        const secondUOMDisplayValue =
          primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
          secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
            ? getTranslationValue(
                drugMixture.medication?.dispenseTranslationUOM || [],
                SYSTEM_LANGUAGE.SECONDLANGUAGE,
                'displayValue',
              )
            : ''
        const inventoryItemStock = _.orderBy(
          (drugMixture.medication?.medicationStock || []).filter(
            s => s.isDefault || s.stock > 0,
          ),
          ['isDefault', 'expiryDate'],
          ['asc'],
        )
        let remainQty = totalRemainQty
        if (drugMixture.medication && inventoryItemStock.length) {
          inventoryItemStock.forEach((itemStock, index) => {
            const { id, batchNo, expiryDate, stock, isDefault } = itemStock
            if (remainQty > 0) {
              let dispenseQuantity = 0
              if (isDefault || remainQty <= stock) {
                dispenseQuantity = remainQty
                remainQty = -1
              } else {
                dispenseQuantity = stock
                remainQty = remainQty - stock
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
                remainQty: totalRemainQty,
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
    })

    const groupItems = orderItems.filter(
      oi =>
        oi.invoiceItemTypeFK === item.invoiceItemTypeFK && oi.id === item.id,
    )
    if (groupItems.length) {
      groupItems[0].groupNumber = 1
      groupItems[0].groupRowSpan = groupItems.length
    }
  }

  const generateFromNormalMedication = item => {
    const totalRemainQty =
      item.quantity -
      _.sumBy(item.pharmacyOrderItemTransaction, 'transactionQty')
    if (totalRemainQty <= 0) return

    const groupName = 'NormalDispense'
    const primaryUOMDisplayValue = getTranslationValue(
      item.medication?.dispenseTranslationUOM || [],
      SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
      'displayValue',
    )
    const secondUOMDisplayValue =
      primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
      secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
        ? getTranslationValue(
            item.medication?.dispenseTranslationUOM || [],
            SYSTEM_LANGUAGE.SECONDLANGUAGE,
            'displayValue',
          )
        : ''

    const inventoryItemStock = _.orderBy(
      (item.medication?.medicationStock || []).filter(
        s => s.isDefault || s.stock > 0,
      ),
      ['isDefault', 'expiryDate'],
      ['asc'],
    )
    let remainQty = totalRemainQty
    if (item.medication && inventoryItemStock.length) {
      inventoryItemStock.forEach((itemStock, index) => {
        const { id, batchNo, expiryDate, stock, isDefault } = itemStock
        if (remainQty > 0) {
          let dispenseQuantity = 0
          if (isDefault || remainQty <= stock) {
            dispenseQuantity = remainQty
            remainQty = -1
          } else {
            dispenseQuantity = stock
            remainQty = remainQty - stock
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
            remainQty: totalRemainQty,
            countNumber: index === 0 ? 1 : 0,
            rowspan: 0,
            uid: getUniqueId(),
            allowToDispense: true,
            medicationStock: item.medication?.medicationStock || [],
            medicationInteraction: item.medication?.medicationInteraction || [],
            medicationContraIndication:
              item.medication?.medicationContraIndication || [],
          })
        }
      })
      const firstItem = orderItems.find(
        i =>
          i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
          i.isDrugMixture === item.isDrugMixture &&
          i.id === item.id &&
          i.countNumber === 1,
      )
      firstItem.rowspan = orderItems.filter(
        i =>
          i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
          i.isDrugMixture === item.isDrugMixture &&
          i.id === item.id,
      ).length
    } else {
      orderItems.push({
        ...defaultItem(item, groupName),
        medicationStock: item.medication?.medicationStock || [],
        medicationInteraction: item.medication?.medicationInteraction || [],
        medicationContraIndication:
          item.medication?.medicationContraIndication || [],
      })
    }
    const groupItems = orderItems.filter(
      oi =>
        oi.invoiceItemTypeFK === item.invoiceItemTypeFK && oi.id === item.id,
    )
    if (groupItems.length) {
      groupItems[0].groupNumber = 1
      groupItems[0].groupRowSpan = groupItems.length
    }
  }

  const generateFromNormalConsumable = item => {
    const totalRemainQty =
      item.quantity -
      _.sumBy(item.pharmacyOrderItemTransaction, 'transactionQty')
    if (totalRemainQty <= 0) return
    const inventoryItemStock = _.orderBy(
      (item.consumable?.consumableStock || []).filter(
        s => s.isDefault || s.stock > 0,
      ),
      ['isDefault', 'expiryDate'],
      ['asc'],
    )
    let remainQty = totalRemainQty
    if (item.consumable && inventoryItemStock.length) {
      inventoryItemStock.forEach((itemStock, index) => {
        const { id, batchNo, expiryDate, stock, isDefault } = itemStock
        if (remainQty > 0) {
          let dispenseQuantity = 0
          if (isDefault || remainQty <= stock) {
            dispenseQuantity = remainQty
            remainQty = -1
          } else {
            dispenseQuantity = stock
            remainQty = remainQty - stock
          }
          orderItems.push({
            ...defaultItem(item, 'NormalDispense'),
            dispenseQuantity: dispenseQuantity,
            batchNo,
            expiryDate,
            stock,
            stockFK: id,
            uomDisplayValue: item.consumable?.dispenseUOM,
            isDefault,
            stockBalance: 0,
            remainQty: totalRemainQty,
            countNumber: index === 0 ? 1 : 0,
            rowspan: 0,
            uid: getUniqueId(),
            allowToDispense: true,
            consumableStock: item.consumable?.consumableStock || [],
          })
        }
        const firstItem = orderItems.find(
          i =>
            i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
            i.isDrugMixture === item.isDrugMixture &&
            i.id === item.id &&
            i.countNumber === 1,
        )
        firstItem.rowspan = orderItems.filter(
          i =>
            i.invoiceItemTypeFK === item.invoiceItemTypeFK &&
            i.isDrugMixture === item.isDrugMixture &&
            i.id === item.id,
        ).length
      })
    } else {
      orderItems.push(defaultItem(item, 'NormalDispense'))
    }

    const groupItems = orderItems.filter(
      oi =>
        oi.invoiceItemTypeFK === item.invoiceItemTypeFK && oi.id === item.id,
    )
    if (groupItems.length) {
      groupItems[0].groupNumber = 1
      groupItems[0].groupRowSpan = groupItems.length
    }
  }

  const pharmacyOrderItem = entity.pharmacyOrderItem || []
  const sortOrderItems = [
    ...pharmacyOrderItem.filter(
      item =>
        item.invoiceItemTypeFK === 1 &&
        item.inventoryFK &&
        !item.isExternalPrescription,
    ),
    ...pharmacyOrderItem.filter(item => item.invoiceItemTypeFK !== 1),
    ...pharmacyOrderItem.filter(
      item => item.invoiceItemTypeFK === 1 && item.isDrugMixture,
    ),
  ]

  sortOrderItems.forEach(item => {
    if (item.invoiceItemTypeFK === 1) {
      if (item.isDrugMixture) {
        generateFromDrugmixture(item)
      } else {
        generateFromNormalMedication(item)
      }
    } else {
      generateFromNormalConsumable(item)
    }
  })

  return orderItems
}

export default createFormViewModel({
  namespace: 'pharmacyDetails',
  param: {
    service,
    state: {
      default: {},
    },
    subscriptions: ({ dispatch, history, searchField }) => {
      history.listen(loct => {
        const { pathname } = loct
      })
    },

    effects: {
      *queryDone({ payload }, { call, select, put, take }) {
        const pharmacyDetails = yield select(st => st.pharmacyDetails)
        if (pharmacyDetails.entity) {
          const codetable = yield select(st => st.codetable)
          const clinicSettings = yield select(st => st.clinicSettings)
          const orderItems = getPharmacyItems(
            codetable,
            clinicSettings.settings,
            pharmacyDetails.entity,
          )
          if (pharmacyDetails.fromModule === 'Main') {
            const defaultExpandedGroups = _.uniqBy(
              orderItems,
              'dispenseGroupId',
            ).map(o => o.dispenseGroupId)
            yield put({
              type: 'updateState',
              payload: {
                entity: {
                  ...pharmacyDetails.entity,
                  orderItems,
                  defaultExpandedGroups,
                  completedItems: [],
                },
              },
            })
          } else {
            const partialItems = getPartialPharmacyItems(
              codetable,
              clinicSettings.settings,
              pharmacyDetails.entity,
            )
            const defaultExpandedGroups = _.uniqBy(
              partialItems,
              'dispenseGroupId',
            ).map(o => o.dispenseGroupId)

            const completedExpandedGroups = _.uniqBy(
              orderItems,
              'dispenseGroupId',
            ).map(o => o.dispenseGroupId)
            yield put({
              type: 'updateState',
              payload: {
                entity: {
                  ...pharmacyDetails.entity,
                  orderItems: partialItems,
                  defaultExpandedGroups,
                  completedItems: orderItems,
                  completedExpandedGroups,
                },
              },
            })
          }

          yield put({
            type: 'patient/query',
            payload: { id: pharmacyDetails.entity.patientProfileFK },
          })
          yield take('patient/query/@@end')

          yield put({
            type: 'visitRegistration/query',
            payload: { id: pharmacyDetails.entity.visitFK },
          })
          yield take('visitRegistration/query/@@end')
        }
      },
      *queryJournalHistory({ payload }, { call, select, put, take }) {
        const result = yield call(service.queryJournalHistoryList, payload)
        if (result.status === '200') {
          yield put({
            type: 'updateState',
            payload: {
              journalHistoryList: result.data.data,
            },
          })
          return true
        }
        return false
      },
      *queryLeafletDrugList({ payload }, { call, select, put, take }) {
        const result = yield call(service.queryLeafletDrugList, payload)
        if (result.status === '200') {
          return result.data
        }
        return []
      },
      *printleaflet({ payload }, { call, select, put, take }) {
        const result = yield call(service.printleaflet, payload)
        if (result.status === '200') {
          return result.data
        }
        return []
      },
    },
    reducers: {},
  },
})
