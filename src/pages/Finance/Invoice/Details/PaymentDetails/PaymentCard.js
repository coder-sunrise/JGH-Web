import React from 'react'
import moment from 'moment'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  CodeSelect,
  CardContainer,
  GridContainer,
  GridItem,
} from '@/components'
// sub component
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
import { ableToViewByAuthority } from '@/utils/utils'
import PaymentRow from './PaymentRow'
import PaymentActions from './PaymentActions'
import PaymentSummary from './PaymentSummary'
// styles
import styles from './styles'
import { PayerType } from './variables'

const DefaultPaymentInfo = {
  id: 0,
  type: 'Payment',
  itemID: 'N/A',
  date: 'N/A',
  amount: 'N/A',
  reason: 'N/A',
  isCancelled: false,
}

const payerTypeToString = {
  // [PayerType.PATIENT]: 'Patient',
  // [PayerType.COPAYER]: 'Co-Payer',
  [INVOICE_PAYER_TYPE.PATIENT]: 'Patient',
  [INVOICE_PAYER_TYPE.SCHEME]: 'Co-Payer',
  [INVOICE_PAYER_TYPE.PAYERACCOUNT]: 'Payer Account',
  [INVOICE_PAYER_TYPE.COMPANY]: 'Co-Payer',
  // [PayerType.GOVT_COPAYER]: 'Co-Payer',
}

const PaymentCard = ({
  classes,
  payerID = 'N/A',
  payerName = 'N/A',
  coPaymentSchemeFK = undefined,
  coPaymentSchemeName = '',
  companyFK = undefined,
  companyName = '',
  patientName = 'N/A',
  payerType = '',
  payerTypeFK = PayerType.PATIENT,
  payments = [],
  payerDistributedAmt,
  payerDistributedAmtBeforeGST,
  outstanding,
  invoicePayerFK,
  readOnly,
  patientIsActive,
  hasActiveSession,
  isEnableWriteOffinInvoice,
  visitOrderTemplateFK,
  isFromPastSession = false,
  actions: { handleVoidClick, handlePrinterClick, ...buttonActions },
}) => {
  let _payerName = (
    <p className={classes.title}>
      {payerTypeToString[payerTypeFK]} ({patientName})
    </p>
  )
  if (payerTypeFK === INVOICE_PAYER_TYPE.SCHEME) {
    // _payerName = (
    //   <p className={classes.title}>
    //     {payerTypeToString[payerTypeFK]} ({payerType})
    //   </p>
    // )
    _payerName = (
      <p
        className={classes.title}
        title={`Copayer: ${companyName}\n${coPaymentSchemeName &&
          'Scheme: ' + coPaymentSchemeName}`}
      >
        <span>
          {payerTypeToString[payerTypeFK]} ({companyName})
          {coPaymentSchemeName && ` - ${coPaymentSchemeName}`}
        </span>
      </p>
    )
  }
  if (payerTypeFK === INVOICE_PAYER_TYPE.PAYERACCOUNT) {
    _payerName = (
      <p className={classes.title}>
        {payerTypeToString[payerTypeFK]} ({payerName})
      </p>
    )
  }
  if (payerTypeFK === INVOICE_PAYER_TYPE.COMPANY) {
    _payerName = (
      <p
        className={classes.title}
        title={`Copayer: ${companyName}\n${coPaymentSchemeName &&
          'Scheme: ' + coPaymentSchemeName}`}
      >
        {payerTypeToString[payerTypeFK]} ({companyName})
        {coPaymentSchemeName && ` - ${coPaymentSchemeName}`}
      </p>
    )
  }
  const isEnableDeletePayment = () => {
    //can't delete payment for current session invoice
    if (!isFromPastSession) return false
    if (payerTypeFK === INVOICE_PAYER_TYPE.PATIENT) {
      return ableToViewByAuthority('finance.deletepastsessionpatientpayment')
    }
    return ableToViewByAuthority('finance.deletepastsessioncopayerpayment')
  }
  const isEnableDeleteCreditNote = () => {
    //can't delete credit note for current session invoice
    if (!isFromPastSession) return false
    if (payerTypeFK === INVOICE_PAYER_TYPE.PATIENT)
      return ableToViewByAuthority('finance.deletepatientcreditnote')
    return ableToViewByAuthority('finance.deletecopayercreditnote')
  }
  return (
    <CardContainer hideHeader>
      {_payerName}
      {(payments || []).length > 0 && (
        <CardContainer hideHeader size='sm'>
          {payments
            .sort((a, b) => moment(a.date) - moment(b.date))
            .map(payment => {
              return (
                <PaymentRow
                  {...payment}
                  isEnableWriteOffinInvoice={isEnableWriteOffinInvoice}
                  handleVoidClick={handleVoidClick}
                  handlePrinterClick={handlePrinterClick}
                  readOnly={readOnly || !patientIsActive}
                  isEnableDeletePayment={isEnableDeletePayment()}
                  isEnableDeleteCreditNote={isEnableDeleteCreditNote()}
                />
              )
            })}
        </CardContainer>
      )}
      <GridContainer alignItems='center'>
        <GridItem md={7}>
          <PaymentActions
            type={payerTypeFK}
            invoicePayerFK={invoicePayerFK}
            companyFK={companyFK}
            isEnableWriteOffinInvoice={isEnableWriteOffinInvoice}
            readOnly={readOnly || !patientIsActive}
            hasActiveSession={hasActiveSession}
            handlePrinterClick={handlePrinterClick}
            visitOrderTemplateFK={visitOrderTemplateFK}
            isFromPastSession={isFromPastSession}
            {...buttonActions}
          />
        </GridItem>
        <GridItem
          md={5}
          container
          direction='column'
          justify='center'
          alignItems='flex-end'
        >
          <PaymentSummary
            payerDistributedAmt={payerDistributedAmt}
            payerDistributedAmtBeforeGST={payerDistributedAmtBeforeGST}
            outstanding={outstanding}
          />
        </GridItem>
        <GridItem />
      </GridContainer>
    </CardContainer>
  )
}

export default withStyles(styles, { name: 'InvoicePaymentCard' })(PaymentCard)
