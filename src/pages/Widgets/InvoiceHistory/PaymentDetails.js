import React, { Component } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import { ReportViewer } from '@/components/_medisys'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
import { AddPayment } from 'medisys-components'

// material ui
import { withStyles } from '@material-ui/core'
// common components
import { CommonModal, notification } from '@/components'
// sub components
import Transfer from '@/pages/Finance/Invoice/components/modal/Transfer'
import WriteOff from '@/pages/Finance/Invoice/components/modal/WriteOff'
import PaymentCard from '@/pages/Finance/Invoice/Details/PaymentDetails/PaymentCard'
import DeleteConfirmation from '@/pages/Finance/Invoice/components/modal/DeleteConfirmation'
import TransferToDepositModal from '@/pages/Finance/Deposit/Modal'
// styles
import styles from '@/pages/Finance/Invoice/Details/PaymentDetails/styles'
import AddCrNote from './AddCrNote'

@connect(({ patient, clinicSettings, invoicePayment }) => ({
  patient,
  clinicSettings,
  invoicePayment,
}))
class PaymentDetails extends Component {
  state = {
    showAddPayment: false,
    showAddCrNote: false,
    showAddTransfer: false,
    showWriteOff: false,
    showDeleteConfirmation: false,
    onVoid: {},
    selectedInvoicePayerFK: undefined,
    showReport: false,
    reportPayload: {
      reportID: undefined,
      reportParameters: undefined,
    },
    invoicePayerName: undefined,
    invoicePayerPayment: {},
    showTransferToDeposit: false,
    outStanding: 0,
  }

  _validateOutstandingAmount = (invoicePayer, callback) => {
    if (invoicePayer.outStanding <= 0) {
      notification.error({
        message: 'This payer does not have any outstanding balance',
      })
    } else callback()
  }

  _validateOverpaidAmount = (invoicePayer, callback) => {
    if (invoicePayer.outStanding >= 0) {
      notification.error({
        message: 'This payer does not have any over paid amount.',
      })
    } else callback()
  }

  refresh = () => {
    const { refreshInvoiceHistoryDetails, invoiceDetail } = this.props

    if (refreshInvoiceHistoryDetails) {
      refreshInvoiceHistoryDetails(invoiceDetail.id)
    }
  }

  onAddPaymentClick = invoicePayerFK => {
    const { dispatch, invoicePayer = [], invoiceDetail } = this.props
    const currentPayer = invoicePayer.find(
      item => parseInt(item.id, 10) === parseInt(invoicePayerFK, 10),
    )

    const queryPatientProfileThenShowAddPayment = () => {
      if (currentPayer.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT)
        dispatch({
          type: 'patient/query',
          payload: { id: currentPayer.patientProfileFK },
        })
      const showAddPayment = () => {
        const invoicePayerPayment = {
          ...invoiceDetail,
          payerTypeFK: currentPayer.payerTypeFK,
          totalAftGst: currentPayer.payerDistributedAmt,
          outstandingBalance: currentPayer.outStanding,
          finalPayable: currentPayer.outStanding,
          totalClaims: undefined,
        }
        let invoicePayerName = ''
        if (currentPayer.payerTypeFK === 1)
          invoicePayerName = currentPayer.patientName
        if (currentPayer.payerTypeFK === 2)
          invoicePayerName = currentPayer.payerType
        if (currentPayer.payerTypeFK === 4)
          invoicePayerName = currentPayer.companyName
        this.setState({
          showAddPayment: true,
          selectedInvoicePayerFK: invoicePayerFK,
          invoicePayerName,
          invoicePayerPayment,
        })
      }
      showAddPayment()
    }
    this._validateOutstandingAmount(
      currentPayer,
      queryPatientProfileThenShowAddPayment,
    )
  }

  onWriteOffClick = invoicePayerFK => {
    const { invoicePayer } = this.props
    const currentPayer = invoicePayer.find(item => item.id === invoicePayerFK)
    const showWriteOffModal = () => {
      this.setState({
        showWriteOff: true,
        selectedInvoicePayerFK: invoicePayerFK,
      })
    }
    this._validateOutstandingAmount(currentPayer, showWriteOffModal)
  }

  closeAddCrNoteModal = () =>
    this.setState({ showAddCrNote: false, selectedInvoicePayerFK: undefined })

  closeAddTransferModal = () =>
    this.setState({ showAddTransfer: false, selectedInvoicePayerFK: undefined })

  closeWriteOffModal = () => {
    this.setState({ showWriteOff: false, selectedInvoicePayerFK: undefined })
  }

  closeDeleteConfirmationModal = () =>
    this.setState({ showDeleteConfirmation: false, onVoid: {} })

  closeAddPaymentModal = () =>
    this.setState({
      showAddPayment: false,
      selectedInvoicePayerFK: undefined,
      invoicePayerName: '',
      invoicePayerPayment: undefined,
    })

  onVoidClick = entity => {
    this.setState({
      showDeleteConfirmation: true,
      onVoid: { ...entity },
    })
  }

  onAddCrNoteClick = (invoicePayerFK, payerType) => {
    const { dispatch, invoiceDetail = {}, invoicePayer = [] } = this.props
    dispatch({
      type: 'invoiceCreditNote/mapCreditNote',
      payload: {
        payerType,
        invoicePayerFK,
        invoiceDetail: {
          ...invoiceDetail,
          gstValue: invoiceDetail.gstValue || 0,
        },
        invoicePaymentDetails: invoicePayer,
      },
    })
    this.setState({ showAddCrNote: true })
  }

  onPrinterClick = (
    type,
    itemID,
    copayerID,
    invoicePayerid,
    invoiceReportType,
  ) => {
    const { invoiceDetail } = this.props

    switch (type) {
      case 'Payment':
        this.onShowReport(29, { InvoicePaymentId: itemID }, 'Payment Receipt')
        break
      case 'Credit Note':
        this.onShowReport(18, { CreditNoteId: itemID }, 'Credit Note')
        break
      case 'TaxInvoice':
        this.onShowReport(
          15,
          {
            InvoiceId: invoiceDetail.id,
            CopayerId: copayerID,
            InvoicePayerid: invoicePayerid,
            printType: invoiceReportType,
            _key: invoiceDetail?.invoiceNo || '',
          },
          'Invoice',
        )
        break
      default:
        break
    }
  }

  onShowReport = (reportID, reportParameters, title) => {
    this.setState({
      showReport: true,
      showReportTitle: title,
      reportPayload: {
        reportID,
        reportParameters,
      },
    })
  }

  onCloseReport = () => {
    this.setState({
      showReport: false,
      reportPayload: {
        reportID: undefined,
        reportParameters: undefined,
      },
    })
  }

  // submitAddPayment
  onSubmitAddPayment = invoicePaymentList => {
    const { selectedInvoicePayerFK } = this.state
    this.props
      .dispatch({
        type: 'invoicePayment/submitAddPayment',
        payload: {
          invoicePayerFK: selectedInvoicePayerFK,
          invoicePaymentList,
        },
      })
      .then(r => {
        if (r) {
          this.refresh()
          this.closeAddPaymentModal()
        }
      })
  }

  onSubmitWriteOff = writeOffData => {
    const { selectedInvoicePayerFK } = this.state
    const { invoicePayer = [] } = this.props
    const payer = invoicePayer.find(
      item => parseInt(item.id, 10) === parseInt(selectedInvoicePayerFK, 10),
    )
    this.props
      .dispatch({
        type: 'invoicePayment/submitWriteOff',
        payload: {
          invoicePayerFK: selectedInvoicePayerFK,
          writeOffReason: writeOffData,
          writeOffAmount: payer.outStanding,
        },
      })
      .then(r => {
        if (r) {
          this.refresh()
          this.closeWriteOffModal()
        }
      })
  }

  onSubmitVoid = cancelReason => {
    const { onVoid } = this.state
    const { type } = onVoid
    let dispatchType
    switch (type) {
      case 'Payment':
        dispatchType = 'invoicePayment/submitVoidPayment'
        break
      case 'Write Off':
        dispatchType = 'invoicePayment/submitVoidWriteOff'
        break
      case 'Credit Note':
        dispatchType = 'invoicePayment/submitVoidCreditNote'
        break
      case 'Deposit':
        dispatchType = 'invoicePayment/submitVoidInvoicePayerDeposit'
        break
      default:
        break
    }

    if (dispatchType) {
      this.props
        .dispatch({
          type: dispatchType,
          payload: {
            ...onVoid,
            cancelReason,
          },
        })
        .then(r => {
          if (r) {
            this.refresh()
            this.closeDeleteConfirmationModal()
          }
        })
    }
  }

  onTransferClick = invoicePayerFK => {
    const { dispatch, invoiceDetail } = this.props
    dispatch({
      type: 'invoicePayment/query',
      payload: {
        id: invoiceDetail.id,
      },
    }).then(response => {
      if (response.length > 0) {
        const company = response.find(
          o => o.payerTypeFK === INVOICE_PAYER_TYPE.COMPANY,
        )
        if (company && company.statementInvoice.length > 0) {
          notification.warning({
            message: `Please remove the invoice from statement ${company.statementInvoice[0].statementNo} before transfer. `,
          })
          return
        }

        dispatch({
          type: 'invoicePayment/updateState',
          payload: {
            invoicePayerFK,
          },
        })
        this.setState({ showAddTransfer: true })
      }
    })
  }

  onTransferToDepositClick = async invoicePayerFK => {
    const { invoicePayer, dispatch, patient = {} } = this.props
    const { entity = {} } = patient
    const { patientDeposit } = entity
    const patientId = entity.id
    if (patientDeposit && patientDeposit.id > 0) {
      await dispatch({
        type: 'deposit/queryOne',
        payload: {
          id: patientDeposit.id,
        },
      })
    } else {
      dispatch({
        type: 'deposit/updateState',
        payload: {
          entity: {
            patientProfileFK: patientId,
          },
        },
      })
    }
    const selectedPayer = invoicePayer.find(item => item.id === invoicePayerFK)
    const showInvoicePayerDepositModal = () => {
      this.setState({
        showTransferToDeposit: true,
        selectedInvoicePayerFK: invoicePayerFK,
        outStanding: selectedPayer.outStanding,
      })
    }
    this._validateOverpaidAmount(selectedPayer, showInvoicePayerDepositModal)
  }

  closeTransferToDepositModal = () => {
    this.setState({
      showTransferToDeposit: false,
      selectedInvoicePayerFK: undefined,
      outStanding: 0,
    })
  }

  render() {
    const {
      classes,
      invoicePayer = [],
      readOnly,
      hasActiveSession,
      invoiceDetail,
      patientIsActive,
      clinicSettings,
      patientPayer,
      isClinicSessionClosed,
    } = this.props
    const paymentActionsProps = {
      handleAddPayment: this.onAddPaymentClick,
      handleAddCrNote: this.onAddCrNoteClick,
      handleWriteOff: this.onWriteOffClick,
      handleVoidClick: this.onVoidClick,
      handlePrinterClick: this.onPrinterClick,
      handleTransferClick: this.onTransferClick,
      handleTransferToDeposit: this.onTransferToDepositClick,
    }
    const {
      showAddPayment,
      showAddCrNote,
      showWriteOff,
      showDeleteConfirmation,
      onVoid,
      showReport,
      showReportTitle,
      reportPayload,
      invoicePayerName,
      invoicePayerPayment,
      showAddTransfer,
      showTransferToDeposit,
      selectedInvoicePayerFK,
      outStanding,
    } = this.state
    const {
      enableWriteOffinInvoice: isEnableWriteOffinInvoice,
    } = clinicSettings.settings
    const transferProps = {
      ...this.props,
    }

    return (
      <div className={classes.container}>
        {invoicePayer.length > 0
          ? invoicePayer
              .sort((a, b) => a.payerTypeFK - b.payerTypeFK)
              .map(ip => {
                return (
                  <PaymentCard
                    coPaymentSchemeFK={ip.coPaymentSchemeFK}
                    coPaymentSchemeName={ip.coPaymentSchemeName}
                    companyFK={ip.companyFK}
                    companyName={ip.companyName}
                    patientName={ip.patientName}
                    payerType={ip.payerType}
                    payerTypeFK={ip.payerTypeFK}
                    payments={ip.paymentTxnList}
                    isEnableWriteOffinInvoice={isEnableWriteOffinInvoice}
                    payerDistributedAmt={ip.payerDistributedAmt}
                    payerDistributedAmtBeforeGST={
                      ip.payerDistributedAmtBeforeGST
                    }
                    outstanding={ip.outStanding}
                    invoicePayerFK={ip.id}
                    actions={paymentActionsProps}
                    readOnly={readOnly}
                    hasActiveSession={hasActiveSession}
                    patientIsActive={patientIsActive}
                    visitOrderTemplateFK={invoiceDetail?.visitOrderTemplateFK}
                    isFromPastSession={isClinicSessionClosed}
                  />
                )
              })
          : ''}
        <CommonModal
          open={showAddPayment}
          title='Add Payment'
          onConfirm={this.closeAddPaymentModal}
          onClose={this.closeAddPaymentModal}
          observe='AddPaymentForm'
          maxWidth='lg'
        >
          <AddPayment
            handleSubmit={this.onSubmitAddPayment}
            onClose={this.closeAddPaymentModal}
            invoicePayerName={invoicePayerName}
            invoicePayment={[]}
            showPaymentDate
            invoice={{
              ...invoicePayerPayment,
            }}
            patientPayer={patientPayer}
          />
        </CommonModal>
        <CommonModal
          open={showAddCrNote}
          title='Add Credit Note'
          closeIconTooltip='Close Credit Note'
          onConfirm={this.closeAddCrNoteModal}
          onClose={this.closeAddCrNoteModal}
          maxWidth='lg'
        >
          <AddCrNote
            onRefresh={this.refresh}
            {...this.props}
            invoiceDetail={{
              ...invoiceDetail,
              gstValue: invoiceDetail.gstValue || 0,
            }}
          />
        </CommonModal>

        <CommonModal
          open={showWriteOff}
          title='Write Off'
          onConfirm={this.closeWriteOffModal}
          onClose={this.closeWriteOffModal}
          maxWidth='sm'
        >
          <WriteOff handleSubmit={this.onSubmitWriteOff} />
        </CommonModal>

        <CommonModal
          open={showDeleteConfirmation}
          title={`Void ${onVoid.type}`}
          onConfirm={this.closeDeleteConfirmationModal}
          onClose={this.closeDeleteConfirmationModal}
          maxWidth='sm'
        >
          <DeleteConfirmation handleSubmit={this.onSubmitVoid} {...onVoid} />
        </CommonModal>
        <CommonModal
          open={showReport}
          onClose={this.onCloseReport}
          title={showReportTitle}
          maxWidth='lg'
        >
          <ReportViewer
            reportID={reportPayload.reportID}
            reportParameters={reportPayload.reportParameters}
          />
        </CommonModal>

        <CommonModal
          open={showAddTransfer}
          title='Add Transfer'
          closeIconTooltip='Close Transfer'
          onConfirm={this.closeAddTransferModal}
          onClose={this.closeAddTransferModal}
          observe='TransferDetail'
        >
          <Transfer onRefresh={this.refresh} {...transferProps} />
        </CommonModal>

        <CommonModal
          open={showTransferToDeposit}
          title='Transfer to Deposit'
          onConfirm={() => {
            this.refresh()
            this.closeTransferToDepositModal()
          }}
          onClose={this.closeTransferToDepositModal}
          maxWidth='sm'
          observe='PatientDeposit'
        >
          <TransferToDepositModal
            isDeposit
            {...this.props}
            invoicePayerFK={selectedInvoicePayerFK}
            maxTranseferAmount={-(outStanding || 0)}
          />
        </CommonModal>
      </div>
    )
  }
}

export default withStyles(styles)(PaymentDetails)
