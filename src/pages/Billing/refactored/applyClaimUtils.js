import _ from 'lodash'
import numeral from 'numeral'
import { roundTo, getUniqueId } from '@/utils/utils'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'

const sumAll = (total, price) => total + price

export const convertAmountToPercentOrCurrency = (type, amount) =>
  type.toLowerCase() === 'percentage' ? `${amount}%` : `$${amount.toFixed(2)}`

export const getCoverageAmountAndType = (scheme, invoiceItem) => {
  let coverage = 0
  let schemeCoverageType = 'percentage'
  let schemeCoverage = 0

  if (_.isEmpty(scheme))
    return {
      coverage: convertAmountToPercentOrCurrency(
        invoiceItem.schemeCoverageType,
        invoiceItem.schemeCoverage,
      ),
      schemeCoverage: invoiceItem.schemeCoverage,
      schemeCoverageType: invoiceItem.schemeCoverageType,
    }

  // 1. first priority: coPaymentByItem
  // 2. second priority: coPaymentByCategory
  // 3. third priority: overall value
  const isSpecificDefined = scheme.coPaymentByItem.find(
    _coPaymentItem => _coPaymentItem.itemCode === invoiceItem.itemCode,
  )

  // If is drug mixture item, check if can claim
  if (invoiceItem.isDrugMixture && !invoiceItem.isClaimable) {
    schemeCoverageType = 'Percentage'
    coverage = convertAmountToPercentOrCurrency(schemeCoverageType, 0)
    schemeCoverage = 0
    return { coverage, schemeCoverage, schemeCoverageType }
  }

  if (isSpecificDefined) {
    const coPaymentItem = scheme.coPaymentByItem.find(
      _coPaymentItem => _coPaymentItem.itemCode === invoiceItem.itemCode,
    )

    coverage = convertAmountToPercentOrCurrency(
      coPaymentItem.itemValueType,
      coPaymentItem.itemValue,
    )
    schemeCoverage = coPaymentItem.itemValue
    schemeCoverageType = coPaymentItem.itemValueType
    return { coverage, schemeCoverage, schemeCoverageType }
  }

  if (scheme.coPaymentByCategory.length > 0) {
    const itemCategory = scheme.coPaymentByCategory.find(
      category => category.itemTypeFk === invoiceItem.invoiceItemTypeFK,
    )

    coverage = convertAmountToPercentOrCurrency(
      itemCategory.groupValueType,
      itemCategory.itemGroupValue,
    )
    schemeCoverage = itemCategory.itemGroupValue
    schemeCoverageType = itemCategory.groupValueType
  } else {
    coverage = convertAmountToPercentOrCurrency(
      scheme.overAllCoPaymentValue
        ? scheme.overAllCoPaymentValueType
        : 'Percentage',
      scheme.overAllCoPaymentValue || 100,
    )
    schemeCoverage = scheme.overAllCoPaymentValue || 100
    schemeCoverageType = scheme.overAllCoPaymentValue
      ? scheme.overAllCoPaymentValueType
      : 'Percentage'
  }

  return { coverage, schemeCoverage, schemeCoverageType }
}

export const getApplicableClaimAmount = (
  invoicePayerItem,
  scheme,
  remainingCoverageMaxCap,
  totalClaimableAmount,
) => {
  const {
    coPaymentByCategory,
    coPaymentByItem,
    isCoverageMaxCapCheckRequired,
    overAllCoPaymentValue,
    overAllCoPaymentValueType,
  } = scheme
  let returnClaimAmount = 0
  const payableBalance = roundTo(
    invoicePayerItem.totalBeforeGst - (invoicePayerItem._claimedAmount || 0),
  )

  if (payableBalance <= 0 || !scheme) return returnClaimAmount

  // If is drug mixture item, check if can claim
  if (invoicePayerItem.isDrugMixture && !invoicePayerItem.isClaimable) return 0

  const isSpecificDefined = coPaymentByItem.find(
    _coPaymentItem => _coPaymentItem.itemCode === invoicePayerItem.itemCode,
  )

  if (isSpecificDefined) {
    const specificItem = coPaymentByItem.find(
      _coPaymentItem => _coPaymentItem.itemCode === invoicePayerItem.itemCode,
    )
    // TODO get coverage amount from specific item object
    const itemRemainingAmount = payableBalance

    if (specificItem.itemValueType.toLowerCase() === 'percentage')
      returnClaimAmount = roundTo(
        itemRemainingAmount * (specificItem.itemValue / 100),
        2,
      )
    else {
      returnClaimAmount =
        specificItem.itemValue > itemRemainingAmount
          ? itemRemainingAmount
          : specificItem.itemValue
    }
  } else if (coPaymentByCategory.length > 0) {
    const itemCategory = coPaymentByCategory.find(
      category => category.itemTypeFk === invoicePayerItem.invoiceItemTypeFK,
    )
    const itemRemainingAmount = payableBalance
    if (itemCategory.groupValueType.toLowerCase() === 'percentage') {
      returnClaimAmount = roundTo(
        itemRemainingAmount * (itemCategory.itemGroupValue / 100),
        2,
      )
    } else {
      returnClaimAmount =
        itemCategory.itemGroupValue > itemRemainingAmount
          ? itemRemainingAmount
          : itemCategory.itemGroupValue
    }
  } else {
    const itemRemainingAmount = payableBalance
    const copaymentValue =
      overAllCoPaymentValueType.toLowerCase() === 'percentage'
        ? roundTo(itemRemainingAmount * (overAllCoPaymentValue / 100))
        : overAllCoPaymentValue

    returnClaimAmount =
      copaymentValue > itemRemainingAmount
        ? itemRemainingAmount
        : copaymentValue
  }

  if (
    remainingCoverageMaxCap >= 0 &&
    returnClaimAmount > remainingCoverageMaxCap
  ) {
    returnClaimAmount = remainingCoverageMaxCap
  }

  if (returnClaimAmount > payableBalance) returnClaimAmount = payableBalance

  if (returnClaimAmount > totalClaimableAmount)
    returnClaimAmount = totalClaimableAmount

  return roundTo(returnClaimAmount, 4)
}

export const getInvoiceItemsWithClaimAmount = (
  schemeConfig,
  originalInvoiceItems = [], // for medisave it's not all items, only items within scheme type
  currentInvoiceItems = [],
  shouldGenerateDummyID = false,
  allPayers,
) => {
  if (!schemeConfig || _.isEmpty(schemeConfig)) return []
  const {
    coverageMaxCap,
    patientMinCoPaymentAmount = 0,
    patientMinCoPaymentAmountType,
    isCoverageMaxCapCheckRequired,
    isConsumableCoverageMaxCapCheckRequired,
    isMedicationCoverageMaxCapCheckRequired,
    isServiceCoverageMaxCapCheckRequired,
    isVaccinationCoverageMaxCapCheckRequired,
    isOrderSetCoverageMaxCapCheckRequired,
    consumableCoverageMaxCap,
    medicationCoverageMaxCap,
    vaccinationCoverageMaxCap,
    serviceCoverageMaxCap,
    orderSetCoverageMaxCap,
  } = schemeConfig

  const totalInvoiceAmount = roundTo(
    originalInvoiceItems
      .map(item => {
        return (
          item.totalBeforeGst -
          (allPayers ? item._chasAmount || 0 : item._claimedAmount || 0)
        )
      }) // fixed value if cdmp, based on chas claimed
      .reduce(sumAll, 0),
  )

  const patientMinCoPaymentExactAmount =
    patientMinCoPaymentAmountType === 'ExactAmount'
      ? patientMinCoPaymentAmount
      : roundTo(totalInvoiceAmount * (patientMinCoPaymentAmount / 100))

  const totalClaimableAmount =
    totalInvoiceAmount < patientMinCoPaymentExactAmount
      ? 0
      : roundTo(totalInvoiceAmount - patientMinCoPaymentExactAmount)

  const invoiceItems = originalInvoiceItems.reduce((result, item) => {
    if (
      item.notClaimableBySchemeIds.includes(schemeConfig.id) ||
      item.totalBeforeGst <= 0
    )
      return [...result]

    const existedItem = currentInvoiceItems.find(
      curItem => curItem.invoiceItemFK === item.invoiceItemFK,
    )
    let {
      coverage, // for display purpose only, value will be $100 or 100%
      schemeCoverage, // for sending to backend
      schemeCoverageType, // for sending to backend
    } = getCoverageAmountAndType(schemeConfig, item)

    const { invoiceItemTypeFK } = item
    const pastItemClaimedAmount = roundTo(
      result.reduce((total, i) => total + i.claimAmountBeforeGST, 0),
    )

    // get claim amount of items based on other schemes
    const payers = allPayers
      ? allPayers
          .filter(
            a =>
              !a.isCancelled &&
              ['CDMP', 'Vaccination', 'Health Screening'].indexOf(
                a.medisaveVisitType,
              ) >= 0 &&
              a.invoicePayerItem.length > 0,
          )
          .reduce((items, p) => {
            p.invoicePayerItem.forEach(i => items.push(i))
            return items
          }, [])
      : []

    // get claim amount of items based on current scheme
    const pastSchemeClaimedAmount =
      payers.length > 0
        ? roundTo(
            payers.reduce((total, i) => total + i.claimAmountBeforeGST, 0),
          )
        : 0

    let remainingCoverageMaxCap
    if (isCoverageMaxCapCheckRequired) {
      remainingCoverageMaxCap = coverageMaxCap - pastItemClaimedAmount
    } else {
      const pastTypeClaimedAmount = roundTo(
        result
          .filter(x => x.invoiceItemTypeFK === invoiceItemTypeFK)
          .reduce((total, i) => total + i.claimAmountBeforeGST, 0),
      )
      if (invoiceItemTypeFK === 1) {
        if (isMedicationCoverageMaxCapCheckRequired)
          remainingCoverageMaxCap =
            medicationCoverageMaxCap - pastTypeClaimedAmount
      } else if (invoiceItemTypeFK === 2) {
        if (isConsumableCoverageMaxCapCheckRequired)
          remainingCoverageMaxCap =
            consumableCoverageMaxCap - pastTypeClaimedAmount
      } else if (invoiceItemTypeFK === 3) {
        if (isVaccinationCoverageMaxCapCheckRequired)
          remainingCoverageMaxCap =
            vaccinationCoverageMaxCap - pastTypeClaimedAmount
      } else if (invoiceItemTypeFK === 4) {
        if (isServiceCoverageMaxCapCheckRequired)
          remainingCoverageMaxCap =
            serviceCoverageMaxCap - pastTypeClaimedAmount
      } else if (invoiceItemTypeFK === 5) {
        if (isOrderSetCoverageMaxCapCheckRequired)
          remainingCoverageMaxCap =
            orderSetCoverageMaxCap - pastTypeClaimedAmount
      }
    }
    const remainingClaimableAmount =
      totalClaimableAmount - pastItemClaimedAmount - pastSchemeClaimedAmount <=
      0
        ? 0
        : roundTo(
            totalClaimableAmount -
              pastItemClaimedAmount -
              pastSchemeClaimedAmount,
          )

    const _claimAmount = getApplicableClaimAmount(
      item,
      schemeConfig,
      remainingCoverageMaxCap,
      remainingClaimableAmount,
    )

    if (existedItem)
      return [
        ...result,
        {
          ...existedItem,
          coverage,
          schemeCoverageType,
          schemeCoverage,
          itemName: existedItem.itemDescription,
          claimAmountBeforeGST: _claimAmount,
        },
      ]

    // if new item
    return [
      ...result,
      {
        ...item,
        id: item.invoiceItemFK ? item.id : getUniqueId(),
        invoiceItemFK: item.invoiceItemFK ? item.invoiceItemFK : item.id,
        invoiceItemTypeFK,
        payableBalance: item.totalBeforeGst,
        coverage,
        schemeCoverageType,
        schemeCoverage,
        itemName: item.itemDescription,
        claimAmountBeforeGST: _claimAmount,
      },
    ]
  }, [])
  return invoiceItems
}

export const computeTotalForAllSavedClaim = (sum, payer) =>
  payer._isConfirmed && !payer.isCancelled
    ? sum + payer.payerDistributedAmt
    : sum

export const updateOriginalInvoiceItemList = (
  invoiceItems,
  currentInvoicePayerList,
) => {
  const _resultInvoiceItems = invoiceItems.map(item => {
    const computeInvoicePayerSubtotal = (subtotal, invoicePayer) => {
      if (invoicePayer.isCancelled || invoicePayer._isEditing)
        return roundTo(subtotal)
      const _invoicePayerItem = invoicePayer.invoicePayerItem.find(payerItem =>
        payerItem.invoiceItemFK
          ? payerItem.invoiceItemFK === item.id
          : payerItem.id === item.id,
      )

      if (_invoicePayerItem) {
        return roundTo(subtotal + _invoicePayerItem.claimAmountBeforeGST)
      }
      return roundTo(subtotal)
    }

    // only one payer has chas amount in order to calculate cdmp total
    const computeInvoicePayerChasSubtotal = (subtotal, invoicePayer) => {
      if (
        invoicePayer.isCancelled ||
        invoicePayer._isEditing ||
        !invoicePayer.name.startsWith('CHAS')
      )
        return roundTo(subtotal)
      const _invoicePayerItem = invoicePayer.invoicePayerItem.find(payerItem =>
        payerItem.invoiceItemFK
          ? payerItem.invoiceItemFK === item.id
          : payerItem.id === item.id,
      )

      if (_invoicePayerItem) {
        return roundTo(subtotal + _invoicePayerItem._chasAmount || 0)
      }
      return roundTo(subtotal)
    }

    const _subtotal = currentInvoicePayerList.reduce(
      computeInvoicePayerSubtotal,
      0,
    )
    const _chasSubtotal = currentInvoicePayerList.reduce(
      computeInvoicePayerChasSubtotal,
      0,
    )

    return { ...item, _claimedAmount: _subtotal, _chasAmount: _chasSubtotal }
  })

  return _resultInvoiceItems
}

export const flattenInvoicePayersInvoiceItemList = (
  preInvoicePayerInvoiceItems,
  preInvoicePayer,
) =>
  preInvoicePayer.isCancelled
    ? [...preInvoicePayerInvoiceItems]
    : [...preInvoicePayerInvoiceItems, ...preInvoicePayer.invoicePayerItem]

export const validateInvoicePayerItems = invoicePayerItem => {
  const returnData = invoicePayerItem.map(item => {
    let maxAmount
    let type = 'Total Payable'
    if (item.schemeCoverageType.toLowerCase() === 'percentage') {
      maxAmount = roundTo((item.payableBalance * item.schemeCoverage) / 100, 2)
      type = 'Coverage Amount'
    } else if (item.schemeCoverageType.toLowerCase() === 'exactamount') {
      maxAmount = item.schemeCoverage
      type = 'Coverage Amount'
    } else maxAmount = item.payableBalance

    if (item.claimAmountBeforeGST > maxAmount) {
      return { ...item, error: `Claim Amount cannot exceed ${type}` }
    }

    return { ...item, error: undefined }
  })
  return returnData
}

const getItemTypeSubtotal = (list, type) =>
  roundTo(
    list.reduce(
      (subtotal, item) =>
        item.invoiceItemTypeFK === type
          ? subtotal + item.claimAmountBeforeGST
          : subtotal,
      0,
    ),
  )

const calculateTotalPaybable = (total, item) => {
  return total + item.payableBalance
}

export const getMedisaveVisitClaimableAmount = (items, medisaveItems) => {
  const {
    medisaveMedications,
    medisaveServices,
    medisaveVaccinations,
    healthScreenings,
  } = medisaveItems
  const claimableTotal = items.reduce((total, v) => {
    if (
      medisaveVaccinations.find(m => m.code === v.itemCode) ||
      healthScreenings.find(m => m.code === v.itemCode) ||
      medisaveServices.find(m => m.code === v.itemCode) ||
      medisaveMedications.find(m => m.code === v.itemCode)
    )
      return total + v.totalBeforeGst - v._chasAmount
    return total
  }, 0)
  return roundTo((claimableTotal * 15) / 100) // do not fix it
}

export const validateClaimAmount = (
  schemeRow,
  tempInvoicePayers,
  medisaveItems = [],
) => {
  let invalidMessage = []

  const {
    schemeConfig,
    invoicePayerItem,
    payerTypeFK,
    medisaveVisitType,
  } = schemeRow
  if (payerTypeFK === INVOICE_PAYER_TYPE.COMPANY || !schemeConfig) return []

  const {
    balance,
    isBalanceCheckRequired,
    coverageMaxCap,
    patientMinCoPaymentAmount,
    patientMinCoPaymentAmountType,
    medicationCoverageMaxCap,
    consumableCoverageMaxCap,
    serviceCoverageMaxCap,
    vaccinationCoverageMaxCap,
    orderSetCoverageMaxCap,

    isCoverageMaxCapCheckRequired,
    isMedicationCoverageMaxCapCheckRequired,
    isConsumableCoverageMaxCapCheckRequired,
    isVaccinationCoverageMaxCapCheckRequired,
    isServiceCoverageMaxCapCheckRequired,
    isOrderSetCoverageMaxCapCheckRequired,

    schemePayerFK,
  } = schemeConfig

  const listOfLimits = []

  if (isBalanceCheckRequired)
    listOfLimits.push({ type: 'Balance', value: balance })

  const totalClaimAmount = roundTo(
    invoicePayerItem.reduce(
      (totalClaim, item) => totalClaim + (item.claimAmountBeforeGST || 0),
      0,
    ),
  )

  const totalPayable = roundTo(
    invoicePayerItem.reduce(calculateTotalPaybable, 0),
  )

  const patientMinCoPaymentExactAmount =
    patientMinCoPaymentAmountType === 'ExactAmount'
      ? patientMinCoPaymentAmount
      : roundTo(totalPayable * (patientMinCoPaymentAmount / 100))

  const patientDistributedAmount =
    totalClaimAmount > 0
      ? roundTo(totalPayable - totalClaimAmount)
      : totalPayable

  if (patientMinCoPaymentExactAmount > 0) {
    if (schemePayerFK && medisaveVisitType === 'CDMP') {
      // for medisave
      const {
        medisaveMedications,
        medisaveServices,
        medisaveVaccinations,
        healthScreenings,
      } = medisaveItems

      const invoiceTotal = invoicePayerItem.reduce((total, v) => {
        if (
          medisaveVaccinations.find(m => m.code === v.itemCode) ||
          healthScreenings.find(m => m.code === v.itemCode) ||
          medisaveServices.find(m => m.code === v.itemCode) ||
          medisaveMedications.find(m => m.code === v.itemCode)
        )
          return total + v.totalBeforeGst - v._chasAmount
        return total
      }, 0)
      const claimedTotal = invoicePayerItem.reduce((total, v) => {
        if (
          medisaveVaccinations.find(m => m.code === v.itemCode) ||
          healthScreenings.find(m => m.code === v.itemCode) ||
          medisaveServices.find(m => m.code === v.itemCode) ||
          medisaveMedications.find(m => m.code === v.itemCode)
        )
          return total + v._claimedAmount - v._chasAmount
        return total
      }, 0)

      // 15% of all medisave items
      const cdmpMinCopay = getMedisaveVisitClaimableAmount(
        invoicePayerItem,
        medisaveItems,
      )

      const maxClaim = roundTo(invoiceTotal - claimedTotal - cdmpMinCopay)
      if (totalClaimAmount > maxClaim) {
        invalidMessage.push(
          `Current Claim Amount is: $${totalClaimAmount.toFixed(2)}`,
        )
        invalidMessage.push(
          `Total Claim Amount under Medisave 500/700 Visit is at most: $${maxClaim.toFixed(
            2,
          )}`,
        )
      }
    } else if (patientDistributedAmount < patientMinCoPaymentExactAmount) {
      invalidMessage.push(
        `Current Patient Min. Payment Amount is: $${patientDistributedAmount.toFixed(
          2,
        )}`,
      )
      invalidMessage.push(
        `Patient Min. Payment Amount must be at least: $${patientMinCoPaymentExactAmount.toFixed(
          2,
        )}`,
      )
    } else
      listOfLimits.push({
        type: 'Amount after Patient Min. Payable',
        value: totalPayable - patientMinCoPaymentExactAmount,
      })
  }
  if (isCoverageMaxCapCheckRequired) {
    if (coverageMaxCap > 0)
      listOfLimits.push({ type: 'Coverage Max Cap', value: coverageMaxCap })
  } else {
    // check for each item category
    // return isValid = false early
    const medicationTotalClaim = getItemTypeSubtotal(invoicePayerItem, 1)
    const consumableTotalClaim = getItemTypeSubtotal(invoicePayerItem, 2)
    const vaccinationTotalClaim = getItemTypeSubtotal(invoicePayerItem, 3)
    const serviceTotalClaim = getItemTypeSubtotal(invoicePayerItem, 4)
    const orderSetTotalClaim = getItemTypeSubtotal(invoicePayerItem, 5)

    if (
      isMedicationCoverageMaxCapCheckRequired &&
      medicationTotalClaim > medicationCoverageMaxCap
    )
      invalidMessage.push('Medication claim amount has exceed the max cap')

    if (
      isConsumableCoverageMaxCapCheckRequired &&
      consumableTotalClaim > consumableCoverageMaxCap
    )
      invalidMessage.push('Consumable claim amount has exceed the max cap')

    if (
      isVaccinationCoverageMaxCapCheckRequired &&
      vaccinationTotalClaim > vaccinationCoverageMaxCap
    )
      invalidMessage.push('Vaccination claim amount has exceed the max cap')

    if (
      isServiceCoverageMaxCapCheckRequired &&
      serviceTotalClaim > serviceCoverageMaxCap
    )
      invalidMessage.push('Service total claim amount has exceed the max cap')

    if (
      isOrderSetCoverageMaxCapCheckRequired &&
      orderSetTotalClaim > orderSetCoverageMaxCap
    )
      invalidMessage.push('Order Set total claim amount has exceed the max cap')

    const total =
      medicationTotalClaim +
      consumableTotalClaim +
      vaccinationTotalClaim +
      serviceTotalClaim +
      orderSetTotalClaim

    if (total <= 0)
      invalidMessage.push('Total Claim Amount must be at least $0.01')
  }

  const maximumLimit = listOfLimits.reduce(
    (min, limit) => (limit.value <= min.value ? limit : min),
    { type: '', value: 999999 },
  )

  maximumLimit.value = roundTo(maximumLimit.value)

  if (
    maximumLimit.type !== '' &&
    maximumLimit.value > 0 &&
    totalClaimAmount > maximumLimit.value
  ) {
    const _v = numeral(maximumLimit.value).format('$0,0.00')
    invalidMessage.push('Total claim amount has exceed the maximum limit:')
    invalidMessage.push(`${maximumLimit.type}: ${_v}`)
  }
  return invalidMessage
}

export const computeInvoiceItemPrevClaimedAmount = (invoiceItems, item) => {
  const _existed = invoiceItems.find(
    _i => _i.invoiceItemFK === item.invoiceItemFK,
  )
  if (!_existed)
    return [
      ...invoiceItems,
      { ...item, _prevClaimedAmount: item.claimAmountBeforeGST },
    ]
  return [
    ...invoiceItems.filter(_i => _i.invoiceItemFK !== item.invoiceItemFK),
    {
      ..._existed,
      _prevClaimedAmount: item.error
        ? _existed._prevClaimedAmount
        : _existed._prevClaimedAmount + item.claimAmountBeforeGST,
    },
  ]
}

export const updateInvoicePayerPayableBalance = (
         originalInvoiceItems,
         list,
         updatedIndex,
         autoApply = false,
         gstValue,
         invoice,
       ) => {
         const result = list.reduce((_payers, payer, index) => {
           // dp nothing when payer isCancelled
           if (payer.isCancelled) return [..._payers, payer]
           let { isModified } = payer
           // first payer use totalBeforeGst as payable balance
           if (index === 0) {
             const newInvoicePayerItem = payer.invoicePayerItem.map(item => {
               const original = originalInvoiceItems.find(
                 oriInvoiceItem => oriInvoiceItem.id === item.invoiceItemFK,
               )
               const newPayableBalance = original
                 ? original.totalBeforeGst
                 : item.payableBalance
               if (item.payableBalance !== newPayableBalance) {
                 isModified = true
               }

               return {
                 ...item,
                 payableBalance: newPayableBalance,
               }
             })
             let autoApplyMessage = {}
             const total = roundTo(
               payer.invoicePayerItem.reduce(
                 (total, item) => total + item.claimAmountBeforeGST,
                 0,
               ),
             )
             if (autoApply) {
               autoApplyMessage = {
                 payerDistributedAmtBeforeGST: total,
                 isModified: true,
                 _isConfirmed: true,
                 _isEditing: false,
                 _isDeleted: false,
               }
             }
             return [
               ..._payers,
               {
                 ...payer,
                 invoicePayerItem: newInvoicePayerItem,
                 isModified,
                 ...autoApplyMessage,
               },
             ]
           }

           // compute previous claimed amount up to current modify payer
           const prevIndexInvoiceItemsWithSubtotal = _payers
             .filter(p => !p.isCancelled)
             .reduce(flattenInvoicePayersInvoiceItemList, [])
             .reduce(computeInvoiceItemPrevClaimedAmount, [])
           // update payable balance according to the claimed amount
           const newInvoicePayerItem = payer.invoicePayerItem.map(item => {
             const _existed = prevIndexInvoiceItemsWithSubtotal.find(
               itemWithSubtotal =>
                 itemWithSubtotal.invoiceItemFK === item.invoiceItemFK,
             )

             let newPayableBalance
             if (!_existed) {
               const original = originalInvoiceItems.find(
                 oriInvoiceItem => oriInvoiceItem.id === item.invoiceItemFK,
               )
               newPayableBalance = original
                 ? original.totalBeforeGst
                 : item.payableBalance
             } else {
               newPayableBalance = _existed.error
                 ? item.payableBalance
                 : _existed.payableBalance - _existed._prevClaimedAmount
             }
             if (item.payableBalance !== newPayableBalance) {
               isModified = true
             }
             return {
               ...item,
               payableBalance: newPayableBalance,
             }
           })
           // if is initialising put as confirmed
           if (!payer._isEditing)
             return [
               ..._payers,
               {
                 ...payer,
                 invoicePayerItem: newInvoicePayerItem,
                 isModified,
                 _isConfirmed: true,
                 _isEditing: false,
               },
             ]
           return [
             ..._payers,
             {
               ...payer,
               isModified,
               invoicePayerItem: newInvoicePayerItem,
             },
           ]
         }, [])

         // recalculate GST
         result.forEach(payer => {
           payer.gstAmount = roundTo(
             (payer.payerDistributedAmtBeforeGST * gstValue) / 100,
           )
         })
         const isFullyClaimed =
           _.sumBy(
             result.filter(t => !t.isCancelled),
             'payerDistributedAmtBeforeGST',
           ) === invoice.totalAftAdj
         if (isFullyClaimed) {
           const lastGstAmount = _.last(result.filter(x => !x.isCancelled))
             .gstAmount
           _.last(result.filter(x => !x.isCancelled)).gstAmount =
             invoice.gstAmount -
             (_.sumBy(
               result.filter(x => !x.isCancelled),
               'gstAmount',
             ) -
               lastGstAmount)
         }
         result.forEach(payer => {
           if (!payer.isCancelled) {
             payer.payerOutstanding =
               payer.payerDistributedAmtBeforeGST + payer.gstAmount
             payer.payerDistributedAmt =
               payer.payerDistributedAmtBeforeGST + payer.gstAmount
           }
         })
         return result
       }

export const sortItemByID = (itemA, itemB) => {
  if (itemA.id > itemB.id) return 1
  if (itemA.id < itemB.id) return -1
  return 0
}
