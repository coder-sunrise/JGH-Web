import moment from 'moment'
import { notification } from '@/components'
import { INVOICE_ITEM_TYPE, INVOICE_PAYER_TYPE } from '@/utils/constants'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { SCHEME_TYPE } from '@/utils/constants'
import { roundTo } from '@/utils/utils'

export const constructPayload = values => {
  const {
    concurrencyToken,
    visitId,
    visitPurposeFK,
    visitStatus = VISIT_STATUS.BILLING,
    invoice,
    invoicePayer = [],
    invoicePayment = [],
    mode,
    visitOrderTemplateFK,
    visitGroup,
    signatureName,
    signature,
  } = values
  const { invoiceItems, ...restInvoice } = invoice
  let _invoicePayer = invoicePayer.filter(payer => {
    if (payer.id === undefined && payer.isCancelled) return false
    return true
  })

  _invoicePayer = _invoicePayer.filter(payer =>
    payer.id ? payer.isModified : true,
  )
  _invoicePayer = _invoicePayer.map((payer, index) => {
    const {
      schemeConfig,
      _indexInClaimableSchemes,
      _isConfirmed,
      claimableSchemes,
      _isDeleted,
      _isEditing,
      _isValid,
      isModified,
      ...restPayer
    } = payer
    // let invoicePayerGstAmount = 0
    const _payer = {
      ...restPayer,
      isModified: restPayer.id ? isModified : false,
      invoicePayerItem: payer.invoicePayerItem.map(item => {
        if (typeof item.id !== 'string') {
          return {
            ...item,
          }
        }
        const {
          invoiceItemFK,
          _claimedAmount,
          disabled,
          itemCode,
          rowIndex,
          notClaimableBySchemeIds,
          invoiceItemTypeFK,
          itemDescription,
          coverage,
          id,
          ...restItem
        } = item
        const _invoicePayerItem = {
          ...restItem,
          invoiceItemFK,
          invoiceItemTypeFK,
          itemName: itemDescription,
        }
        return _invoicePayerItem
      }),
    }

    return _payer
  })

  const payload = {
    visitPurposeFK,
    mode,
    concurrencyToken,
    visitId,
    visitOrderTemplateFK,
    visitStatus,
    invoicePayment: invoicePayment
      .filter(item => {
        if (item.id && item.isCancelled) return true
        if (!item.id) return true
        return false
      })
      .map(item => ({
        ...item,
        invoicePayerFK: undefined,
      })),
    invoice: restInvoice,
    invoicePayer: _invoicePayer,
    visitGroup,
  }
  return payload
}

export const reCalculateInvoicePayerGst = (invoicePayer, invoice) => {
  const gstValue = invoice.gstValue
  let _invoicePayer = invoicePayer.filter(payer => {
    if (payer.id === undefined && payer.isCancelled) return false
    return true
  })

  let newsequence = -1
  for (let index = 0; index < _invoicePayer.length; index++) {
    if (_invoicePayer[index].id) {
      newsequence = _invoicePayer[index].sequence
    } else {
      newsequence += 1
      _invoicePayer[index].sequence = newsequence
    }
  }
  // let copayerTotalGstAmount = 0
  // let copayerTotalClaimedAmount = 0
  const isInvoiceFullyClaimed =
    _.sumBy(
      _invoicePayer.filter(t => !t.isCancelled),
      'payerDistributedAmtBeforeGST',
    ) === invoice.totalAftAdj
  invoice.invoiceItems.forEach(item => {
    item._itemTotalGST = 0
    item._itemTotalClaimedBeforeGST = 0
  })
  _invoicePayer = _invoicePayer.map((payer, index) => {
    if (payer.isCancelled) {
      return payer
    }
    const _payer = {
      ...payer,
      invoicePayerItem: payer.invoicePayerItem
        .filter(item => item.claimAmountBeforeGST > 0)
        .map(item => {
          let actualGstAmount = roundTo(
            (item.claimAmountBeforeGST * gstValue) / 100,
          )
          const curr_invoiceItem = invoice.invoiceItems.find(
            x => x.id === item.invoiceItemFK,
          )
          const invocieItemGstAmount = curr_invoiceItem.gstAmount
          curr_invoiceItem._itemTotalClaimedBeforeGST = roundTo(
            curr_invoiceItem._itemTotalClaimedBeforeGST +
              item.claimAmountBeforeGST,
          )
          if (
            roundTo(curr_invoiceItem._itemTotalGST + actualGstAmount) >
            invocieItemGstAmount
          ) {
            actualGstAmount = roundTo(
              invocieItemGstAmount - curr_invoiceItem._itemTotalGST,
            )
          } else if (
            curr_invoiceItem._itemTotalClaimedBeforeGST ==
            curr_invoiceItem.totalBeforeGst
          ) {
            actualGstAmount = roundTo(
              invocieItemGstAmount - curr_invoiceItem._itemTotalGST,
            )
          }
          curr_invoiceItem._itemTotalGST = roundTo(
            curr_invoiceItem._itemTotalGST + actualGstAmount,
          )

          if (typeof item.id !== 'string') {
            // invoicePayerGstAmount += actualGstAmount
            return {
              ...item,
              claimAmount: roundTo(item.claimAmountBeforeGST + actualGstAmount),
              outstanding: roundTo(item.claimAmountBeforeGST + actualGstAmount),
              _gstamount: actualGstAmount,
            }
          }
          // invoicePayerGstAmount += gstItemAmount
          const _invoicePayerItem = {
            ...item,
            claimAmount: roundTo(item.claimAmountBeforeGST + actualGstAmount),
            outstanding: roundTo(item.claimAmountBeforeGST + actualGstAmount),
            _gstamount: actualGstAmount,
          }
          return _invoicePayerItem
        }),
    }
    const payerGSTAmountChanged =
      roundTo(_.sumBy(_payer.invoicePayerItem, '_gstamount')) !==
      _payer.gstAmount
    if (payerGSTAmountChanged) {
      _payer.gstAmount = roundTo(_.sumBy(_payer.invoicePayerItem, '_gstamount'))
      _payer.isModified = true
    }
    _payer.payerDistributedAmtBeforeGST = roundTo(
      _.sumBy(_payer.invoicePayerItem, 'claimAmountBeforeGST'),
    )
    _payer.payerDistributedAmt = roundTo(
      _payer.gstAmount + _payer.payerDistributedAmtBeforeGST,
    )
    _payer.payerOutstanding = _payer.payerDistributedAmt
    return _payer
  })
  return _invoicePayer
}
const getPatientCorporateScheme = patient => {
  const today = moment()
  return patient.patientScheme
    .filter(ps => {
      const isExpired = today.isAfter(moment(ps.validTo))
      return (
        !isExpired &&
        [SCHEME_TYPE.CORPORATE, SCHEME_TYPE.INSURANCE].indexOf(
          ps.schemeTypeFK,
        ) >= 0
      )
    })
    .map(item => {
      return item.coPaymentSchemeFK
    })
}

const getPatientGovernmentScheme = ({
  patient,
  ctcopaymentscheme,
  ctschemetype,
}) => {
  const today = moment()
  return patient.patientScheme.reduce((result, ps) => {
    const isExpired = today.isAfter(moment(ps.validTo))
    if (
      [SCHEME_TYPE.CORPORATE, SCHEME_TYPE.INSURANCE].indexOf(ps.schemeTypeFK) <
        0 &&
      !isExpired
    ) {
      const schemeType = ctschemetype.find(st => st.id === ps.schemeTypeFK)
      const copaymentschemes = ctcopaymentscheme.filter(
        cs => cs.schemeTypeName === schemeType.name,
      )

      return [...result, ...copaymentschemes.map(i => i.id)]
    }
    return [...result]
  }, [])
}

export const validateApplySchemesWithPatientSchemes = props => {
  const {
    invoicePayers = [],
    ctcopaymentscheme = [],
    ctschemetype = [],
    patient = {},
  } = props

  try {
    const _appliedSchemes = invoicePayers.filter(
      payer =>
        payer.payerTypeFK === INVOICE_PAYER_TYPE.SCHEME && !payer.isCancelled,
    )
    const schemePayers = _appliedSchemes.map(item => item.copaymentSchemeFK)
    const patientCorporateSchemes = getPatientCorporateScheme(patient)
    const patientGovernmentSchemes = getPatientGovernmentScheme({
      ctcopaymentscheme,
      ctschemetype,
      patient,
    })
    const patientSchemes = [
      ...patientCorporateSchemes,
      ...patientGovernmentSchemes,
    ]

    const checkIfPatientSchemesIncludesAppliedScheme = (result, schemeFK) => {
      if (!patientSchemes.includes(schemeFK)) return true
      return result
    }
    const doesNotMatch = schemePayers.reduce(
      checkIfPatientSchemesIncludesAppliedScheme,
      false,
    )

    let schemes = { patient: [], billing: [] }

    if (doesNotMatch) {
      const mapPatientSchemeForValidation = ps => {
        const isExpired = moment().isAfter(moment(ps.validTo))
        if (
          [SCHEME_TYPE.CORPORATE, SCHEME_TYPE.INSURANCE].indexOf(
            ps.schemeTypeFK,
          ) >= 0
        ) {
          const _scheme = ctcopaymentscheme.find(
            scheme => scheme.id === ps.coPaymentSchemeFK,
          )
          return { name: _scheme.name, isExpired }
        }

        const _scheme = ctschemetype.find(
          scheme => scheme.id === ps.schemeTypeFK,
        )
        return { name: _scheme.name, isExpired }
      }
      schemes = {
        patient: patient.patientScheme.map(mapPatientSchemeForValidation),
        billing: _appliedSchemes.map(ps => ({
          name: ps.name,
          isExpired: false,
          isDeleted: !patientSchemes.includes(ps.copaymentSchemeFK),
        })),
      }
    }

    return { doesNotMatch, schemes }
  } catch (error) {
    notification.error({
      message: 'Failed to validate schemes',
    })
    throw error
  }
}
