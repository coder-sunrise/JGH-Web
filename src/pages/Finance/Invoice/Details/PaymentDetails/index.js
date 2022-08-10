import React, { Component } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import { AddPayment } from 'medisys-components'

// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  CommonModal,
  withFormik,
  WarningSnackbar,
  notification,
} from '@/components'
// sub components
import { ReportViewer } from '@/components/_medisys'
import { getBizSession } from '@/services/queue'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
import TransferToDepositModal from '@/pages/Finance/Deposit/Modal'
import AddCrNote from '../../components/modal/AddCrNote'
import Transfer from '../../components/modal/Transfer'
import WriteOff from '../../components/modal/WriteOff'
import PaymentCard from './PaymentCard'
import DeleteConfirmation from '../../components/modal/DeleteConfirmation'
// styles
import styles from './styles'

@connect(({ invoiceDetail, invoicePayment, patient, clinicSettings }) => ({
  invoiceDetail,
  invoicePayment,
  patient,
  clinicSettings,
}))
@withFormik({
  name: 'invoicePayment',
  enableReinitialize: true,
  mapPropsToValues: ({ invoicePayment, invoiceDetail }) => {
    return invoicePayment.entity || {}
  },
})
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
    hasActiveSession: false,
    invoicePayerName: undefined,
    invoicePayerPayment: {},
    showTransferToDeposit: false,
    outStanding: 0,
  }

  componentDidMount = () => {
    this.checkHasActiveSession()
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

  checkHasActiveSession = async () => {
    try {
      const bizSessionPayload = {
        IsClinicSessionClosed: false,
      }
      const result = await getBizSession(bizSessionPayload)
      const { data } = result.data

      this.setState(() => {
        return {
          hasActiveSession: data.length > 0,
        }
      })
    } catch (error) {
      console.log({ error })
    }
  }

  refresh = () => {
    const {
      dispatch,
      invoiceDetail,
      invoicePayment,
      refreshInvoiceList,
    } = this.props

    if (refreshInvoiceList) {
      refreshInvoiceList()
    }
    dispatch({
      type: 'invoiceDetail/query',
      payload: {
        id: invoiceDetail.currentId || invoicePayment.currentId,
      },
    })
    dispatch({
      type: 'invoicePayment/query',
      payload: {
        id: invoiceDetail.currentId || invoicePayment.currentId,
      },
    })
  }

  onAddPaymentClick = invoicePayerFK => {
    const { dispatch, values, invoiceDetail } = this.props
    const invoicePayer = values.find(
      item => parseInt(item.id, 10) === parseInt(invoicePayerFK, 10),
    )

    const queryPatientProfileThenShowAddPayment = () => {
      if (invoicePayer.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT)
        dispatch({
          type: 'patient/query',
          payload: { id: invoicePayer.patientProfileFK },
        })
      const showAddPayment = () => {
        const invoicePayerPayment = {
          ...invoiceDetail.entity,
          payerTypeFK: invoicePayer.payerTypeFK,
          totalAftGst: invoicePayer.payerDistributedAmt,
          outstandingBalance: invoicePayer.outStanding,
          finalPayable: invoicePayer.outStanding,
          totalClaims: undefined,
        }
        let invoicePayerName = ''
        if (invoicePayer.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT)
          invoicePayerName = invoicePayer.patientName
        if (invoicePayer.payerTypeFK === INVOICE_PAYER_TYPE.SCHEME)
          invoicePayerName = invoicePayer.payerType
        if (invoicePayer.payerTypeFK === INVOICE_PAYER_TYPE.COMPANY)
          invoicePayerName = invoicePayer.companyName
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
      invoicePayer,
      queryPatientProfileThenShowAddPayment,
    )
  }

  onWriteOffClick = invoicePayerFK => {
    const { values } = this.props
    const invoicePayer = values.find(item => item.id === invoicePayerFK)
    const showWriteOffModal = () => {
      this.setState({
        showWriteOff: true,
        selectedInvoicePayerFK: invoicePayerFK,
      })
    }
    this._validateOutstandingAmount(invoicePayer, showWriteOffModal)
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
    const { dispatch, invoiceDetail, invoicePayment, values } = this.props
    dispatch({
      type: 'invoiceCreditNote/mapCreditNote',
      payload: {
        payerType,
        invoicePayerFK,
        invoiceDetail: invoiceDetail.entity || {},
        invoicePaymentDetails: invoicePayment.entity || {},
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
    const { invoicePayment, invoiceDetail } = this.props
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
            InvoiceId: invoicePayment ? invoicePayment.currentId : '',
            CopayerId: copayerID,
            InvoicePayerid: invoicePayerid,
            printType: invoiceReportType,
            _key: invoiceDetail?.entity?.invoiceNo || '',
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
    const {
      invoicePayment: { entity = [] },
    } = this.props
    const payer = entity.find(
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
        id: invoiceDetail.currentId,
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
    const { values, dispatch, patient = {} } = this.props
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
    const selectedPayer = values.find(item => item.id === invoicePayerFK)
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
      values,
      readOnly,
      patientIsActive,
      clinicSettings,
      invoiceDetail = {},
    } = this.props
    const { entity } = invoiceDetail
    const { hasActiveSession } = this.state
    const {
      enableWriteOffinInvoice: isEnableWriteOffinInvoice,
    } = clinicSettings.settings
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

    const transferProps = {
      ...this.props,
    }
    return (
      <div className={classes.container}>
        {readOnly ? (
          <div style={{ paddingTop: 5 }}>
            <WarningSnackbar
              variant='warning'
              className={classes.margin}
              message='Action(s) is not allowed due to no active session was found.'
            />
          </div>
        ) : (
          ''
        )}
        {!_.isEmpty(values)
          ? values
              .sort((a, b) => a.payerTypeFK - b.payerTypeFK)
              .map(payment => {
                return (
                  <PaymentCard
                    coPaymentSchemeFK={payment.coPaymentSchemeFK}
                    companyFK={payment.companyFK}
                    companyName={payment.companyName}
                    patientName={payment.patientName}
                    payerName={payment.payerName}
                    payerID={payment.payerID}
                    payerType={payment.payerType}
                    payerTypeFK={payment.payerTypeFK}
                    payments={payment.paymentTxnList}
                    payerDistributedAmt={payment.payerDistributedAmt}
                    outstanding={payment.outStanding}
                    invoicePayerFK={payment.id}
                    actions={paymentActionsProps}
                    readOnly={readOnly}
                    patientIsActive={patientIsActive}
                    hasActiveSession={hasActiveSession}
                    isEnableWriteOffinInvoice={isEnableWriteOffinInvoice}
                    visitOrderTemplateFK={entity?.visitOrderTemplateFK}
                    isFromPastSession
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
            patientPayer={invoiceDetail.entity?.patientPayer}
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
          <AddCrNote onRefresh={this.refresh} />
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
          title='Deposit'
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
            invoicePayerFK={selectedInvoicePayerFK}
            maxTranseferAmount={-(outStanding || 0)}
          />
        </CommonModal>
      </div>
    )
  }
}

export default withStyles(styles)(PaymentDetails)
