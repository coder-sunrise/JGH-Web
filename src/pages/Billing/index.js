import React, { Component } from 'react'
import { history } from 'umi'
import { connect } from 'dva'
// material ui
import { Paper, withStyles } from '@material-ui/core'
import ArrowBack from '@material-ui/icons/ArrowBack'
import SolidExpandMore from '@material-ui/icons/ArrowDropDown'
// common components
import {
  Accordion,
  Button,
  CommonModal,
  GridContainer,
  GridItem,
  withFormikExtend,
  notification,
  FastField,
  OutlinedTextField,
  WarningSnackbar,
  Field,
  CheckboxGroup,
} from '@/components'
import { AddPayment, LoadingWrapper, ReportViewer } from '@/components/_medisys'
// common utils
import { roundTo, getUniqueId } from '@/utils/utils'
import {
  INVOICE_PAYER_TYPE,
  PACKAGE_SIGNATURE_CHECK_OPTION,
  INVOICE_REPORT_TYPES,
} from '@/utils/constants'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import Authorized from '@/utils/Authorized'
// sub component
import PatientBanner from '@/pages/PatientDashboard/Banner'
import DispenseDetails from '@/pages/Dispense/DispenseDetails/WebSocketWrapper'
import ViewPatientHistory from '@/pages/Consultation/ViewPatientHistory'
import {
  ReportsOnCompletePaymentOption,
  ReportsOnCompletePayment,
} from '@/utils/codes'
import Signature from '@/components/_medisys/Forms/Signature'
import ApplyClaims from './refactored/newApplyClaims'
import InvoiceSummary from './components/InvoiceSummary'
import SchemeValidationPrompt from './components/SchemeValidationPrompt'
import { getDrugLabelPrintData } from '../Shared/Print/DrugLabelPrint'
import InvoicePaymentDetails from './components/InvoicePaymentDetails'
// page utils
import {
  constructPayload,
  validateApplySchemesWithPatientSchemes,
} from './utils'
import { subscribeNotification } from '@/utils/realtime'
import { CollectionsOutlined } from '@material-ui/icons'

const styles = theme => ({
  accordionContainer: {
    paddingTop: theme.spacing(1.5),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  paperContent: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    padding: theme.spacing(1),
  },
  paymentButton: {
    margin: theme.spacing(2),
    textAlign: 'right',
  },
  dispenseContainer: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  rightIcon: {
    position: 'relative',
    fontWeight: 600,
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 3px',
    height: 20,
    cursor: 'pointer',
    margin: '0px 1px',
    lineHeight: '16px',
  },
})

const base64Prefix = 'data:image/jpeg;base64,'

const getDispenseEntity = (codetable, clinicSettings, entity = {}) => {
  const {
    inventorymedication = [],
    inventoryconsumable = [],
    inventoryvaccination = [],
    ctmedicationunitofmeasurement = [],
  } = codetable

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
        inventoryMedicationFK: drugMixture.inventoryMedicationFK,
        code: drugMixture.drugCode,
        name: drugMixture.drugName,
        quantity: drugMixture.quantity,
        dispenseUOM: drugMixture.uomDisplayValue,
        isDispensedByPharmacy: drugMixture.isDispensedByPharmacy,
        drugMixtureName: item.name,
        stockBalance: drugMixture.quantity,
        uid: getUniqueId(),
      }
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
    })

    const groupItems = orderItems.filter(
      oi => oi.type === item.type && oi.id === item.id,
    )
    groupItems[0].groupNumber = 1
    groupItems[0].groupRowSpan = groupItems.length
  }

  const generateFromTransaction = item => {
    const groupName = 'NormalDispense'
    if (item.isPreOrder) {
      orderItems.push({
        ...defaultItem(item, groupName),
        groupNumber: 1,
        groupRowSpan: 1,
      })
      return
    }

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
        })
      })
    } else {
      orderItems.push(defaultItem(item, groupName))
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
        return { ...item, quantity: item.dispensedQuanity }
      }),
    ...(entity.vaccination || []),
    ...(entity.consumable || []),
    ...(entity.prescription || []).filter(
      item => item.type === 'Medication' && item.isDrugMixture,
    ),
    ...(entity.prescription || [])
      .filter(item => item.type === 'Open Prescription')
      .map(item => {
        return { ...item, quantity: item.dispensedQuanity }
      }),
    ...(entity.externalPrescription || []).map(item => {
      return { ...item, quantity: item.dispensedQuanity }
    }),
  ]

  sortOrderItems.forEach(item => {
    if (item.type === 'Medication') {
      if (item.isDrugMixture) {
        generateFromDrugmixture(item)
      } else {
        generateFromTransaction(item)
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
    } else {
      generateFromTransaction(item)
    }
  })
  const defaultExpandedGroups = _.uniqBy(orderItems, 'dispenseGroupId').map(
    o => o.dispenseGroupId,
  )
  return {
    ...entity,
    dispenseItems: orderItems,
    defaultExpandedGroups,
  }
}

@connect(
  ({
    global,
    codetable,
    queueLog,
    billing,
    user,
    dispense,
    loading,
    patient,
    clinicSettings,
  }) => ({
    billing,
    dispense,
    loading: loading.models.billing,
    dispenseLoading: loading.models.dispense,
    patient: patient.entity || patient.default,
    user: user.data,
    sessionInfo: queueLog.sessionInfo,
    ctcopaymentscheme: codetable.copaymentscheme || [],
    ctschemetype: codetable.ctschemetype || [],
    ctcopayer: codetable.ctcopayer || [],
    inventorymedication: codetable.inventorymedication || [],
    inventoryvaccination: codetable.inventoryvaccination || [],
    ctservice: codetable.ctservice || [],
    commitCount: global.commitCount,
    clinicSettings: clinicSettings.settings,
    codetable,
  }),
)
@withFormikExtend({
  notDirtyDuration: 3,
  displayName: 'BillingForm',
  enableReinitialize: true,
  mapPropsToValues: ({ billing, clinicSettings }) => {
    const { autoPrintReportsOnCompletePayment = '' } = clinicSettings
    try {
      if (billing.entity) {
        const { invoicePayer = [], visitPurposeFK } = billing.entity

        const finalClaim = invoicePayer.reduce(
          (totalClaim, payer) => totalClaim + payer.payerDistributedAmt,
          0,
        )
        const finalPayable = roundTo(
          billing.entity.invoice.totalAftGst - finalClaim,
        )
        const values = {
          ...billing.default,
          ...billing.entity,
          invoice: {
            ...billing.entity.invoice,
          },
          finalClaim,
          finalPayable,
          visitId: billing.visitID,
          visitPurposeFK,
          autoPrintReportsOnCompletePayment: autoPrintReportsOnCompletePayment.split(
            ',',
          ),
          patientID: billing.patientID,
        }
        return values
      }
    } catch (error) {
      console.log({ error })
    }
    return {
      ...billing.default,
      visitId: billing.visitID,
      autoPrintReportsOnCompletePayment: autoPrintReportsOnCompletePayment.split(
        ',',
      ),
    }
  },
})
@Authorized.Secured('queue.dispense.makepayment')
class Billing extends Component {
  constructor(props) {
    super(props)
    this.fetchCodeTables()
  }

  state = {
    showReport: false,
    reportPayload: {
      reportID: undefined,
      reportParameters: undefined,
    },
    showAddPaymentModal: false,
    showSchemeValidationPrompt: false,
    isEditing: false,
    submitCount: 0,
    schemeValidations: {
      patient: [],
      billing: [],
    },
    showDrugLabelSelection: false,
    selectedDrugs: [],
    isUpdatedAppliedInvoicePayerInfo: false,
    isConsumedPackage: false,
    hasNewSignature: false,
  }

  componentDidMount() {
    subscribeNotification('QueueListing', {
      callback: response => {
        const { visitID, senderId, isBillingSaved } = response
        const {
          dispatch,
          values: { id, visitGroup, visitGroupStatusDetails = [] },
          location: { pathname },
        } = this.props
        if (
          visitID != id &&
          isBillingSaved !== undefined &&
          pathname == '/reception/queue/billing'
        ) {
          if (visitGroupStatusDetails.some(x => x.visitFK === visitID)) {
            dispatch({
              type: 'groupInvoice/fetchVisitGroupStatusDetails',
              payload: { visitGroup },
            }).then((r = []) => {
              const disabledPayment = !(
                _.sumBy(r, 'outstandingBalance') > 0 &&
                !r.some(x => !x.isBillingSaved)
              )
              if (disabledPayment != (this.state.disabledPayment ?? false)) {
                notification.destroy()
                notification.error({
                  duration: 999,
                  message: `The status for one of the invoices had been changed. Please check all invoices is in billing status and the billing is saved.`,
                })
                this.setState({ disabledPayment })
              }
            })
          }
        }
      },
    })
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'billing/updateState',
      payload: {
        entity: null,
        shouldRefreshOrder: false,
      },
    })
    this.props.dispatch({
      type: 'dispense/updateState',
      payload: {
        entity: null,
        shouldRefreshOrder: false,
      },
    })
  }

  fetchCodeTables = async () => {
    const { history, dispatch, billing } = this.props
    const { query } = history.location
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctcopayer',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'copaymentscheme',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctschemetype',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryvaccination',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventorymedication',
      },
    })
    if (query.vid) {
      const { invoice } = billing.entity || billing.default
      const { invoiceItems } = invoice

      if (invoiceItems && invoiceItems.length > 0) {
        const consumedItems = invoiceItems.filter(
          i => i.isPackage && i.packageConsumeQuantity > 0,
        )
        if (consumedItems.length > 0) {
          this.setState({
            isConsumedPackage: true,
          })
        }
      }
    }
  }

  onPrintRef = ref => {
    this.childOnPrintRef = ref
  }

  validateSchemesWithPatientProfile = (invoicePayers = []) => {
    const { doesNotMatch, schemes } = validateApplySchemesWithPatientSchemes({
      ...this.props,
      invoicePayers,
    })
    this.setState({
      schemeValidations: schemes,
      showSchemeValidationPrompt: doesNotMatch,
    })
    return !doesNotMatch
  }

  upsertByPassValidation = () => {
    this.upsertBilling(null, true)
    this.toggleSchemeValidationPrompt()
  }

  printAfterComplete = async (autoPrintReportsOnCompletePayment = []) => {
    let settings = JSON.parse(localStorage.getItem('clinicSettings'))
    const { autoPrintOnCompletePayment } = settings
    if (autoPrintOnCompletePayment) {
      await this.onExpandDispenseDetails()

      const { values, dispense } = this.props
      const { prescription = [] } = dispense.entity
      const { invoice, invoicePayment } = values
      this.setState({
        selectedDrugs: prescription.map(x => {
          return { ...x, no: 1, selected: true }
        }),
      })
      let reportsOnCompletePayment = autoPrintReportsOnCompletePayment
      let printData = []
      if (
        reportsOnCompletePayment.indexOf(
          ReportsOnCompletePaymentOption.Invoice,
        ) > -1
      ) {
        if (invoice) {
          printData.push({
            ReportId: 15,
            Copies: 1,
            DocumentName: 'Invoice',
            ReportParam: `${JSON.stringify({ InvoiceID: invoice.id })}`,
          })
        }
      }
      if (
        reportsOnCompletePayment.indexOf(
          ReportsOnCompletePaymentOption.Receipt,
        ) > -1
      ) {
        if (invoicePayment && invoicePayment.length > 0) {
          let payments = invoicePayment.filter(
            payment => !payment.isCancelled && !payment.isDeleted,
          )
          if (payments && payments.length > 0) {
            printData = printData.concat(
              payments.map(payment => ({
                ReportId: 29,
                DocumentName: 'Receipt',
                Copies: 1,
                ReportParam: `${JSON.stringify({
                  InvoicePaymentId: payment.id,
                  printType: INVOICE_REPORT_TYPES.PAYMENT_RECEIPT,
                })}`,
              })),
            )
          }
        }
      }

      const printDrugLabel =
        reportsOnCompletePayment.indexOf(
          ReportsOnCompletePaymentOption.DrugLabel,
        ) > -1
      if (!printDrugLabel) {
        this.setState({ selectedDrugs: [] })
      }

      if (printData && printData.length > 0) {
        const token = localStorage.getItem('token')
        printData = printData.map(item => ({
          ...item,
          Token: token,
          BaseUrl: process.env.url,
        }))
      }

      if (printData.length > 0 || printDrugLabel) {
        await this.childOnPrintRef({
          type: 1,
          printData,
          printAllDrugLabel: printDrugLabel,
        })
      }
    }
  }

  upsertBilling = async (
    callback = null,
    noValidation = false,
    backtoQueue = false,
  ) => {
    const { dispatch, values, resetForm, patient } = this.props
    await this.calculateOutstandingBalance(null)
    const {
      visitStatus,
      invoicePayer = [],
      autoPrintReportsOnCompletePayment = [],
    } = values
    try {
      const isSchemesValid = noValidation
        ? true
        : this.validateSchemesWithPatientProfile(invoicePayer)
      if (isSchemesValid) {
        const payload = constructPayload(values)
        const defaultCallback = async () => {
          if (visitStatus === VISIT_STATUS.COMPLETED) {
            notification.success({
              message: backtoQueue ? 'Billing Completed' : 'Billing Saved',
            })
            if (!backtoQueue) {
              this.setState(preState => ({
                submitCount: preState.submitCount + 1,
              }))
            }
            await this.printAfterComplete(autoPrintReportsOnCompletePayment)
            if (backtoQueue) {
              history.push('/reception/queue')
            }
          } else {
            notification.success({
              message: 'Billing Saved',
            })
            dispatch({
              type: 'patient/query',
              payload: { id: patient.id },
            })
            this.setState(preState => ({
              submitCount: preState.submitCount + 1,
              hasNewSignature: false,
            }))
          }
          resetForm()
        }

        const saveResponse = await dispatch({
          type: 'billing/save',
          payload,
        })

        if (saveResponse) {
          if (callback) {
            callback()
            return
          }
          await defaultCallback()
        }
      }
    } catch (error) {
      console.error(error)
    }
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
  getInvoiceReportTitle = reportPayload => {
    switch (reportPayload?.reportParameters?.printType) {
      case INVOICE_REPORT_TYPES.GROUPINVOICE:
        return 'Invoice'
      case INVOICE_REPORT_TYPES.CLAIMABLEITEMCATEGORYINVOICE:
        return 'Claimable Item Category Invoice'
      case INVOICE_REPORT_TYPES.CLAIMABLEITEMINVOICE:
        return 'Claimable Item Invoice'
      case INVOICE_REPORT_TYPES.INDIVIDUALINVOICE:
        return 'Invoice'
      case INVOICE_REPORT_TYPES.ITEMCATEGORYINVOICE:
        return 'Item Category Invoice'
      case INVOICE_REPORT_TYPES.SUMMARYINVOICE:
        return 'Summary Invoice'
      case INVOICE_REPORT_TYPES.PAYMENT_RECEIPT:
        return 'Payment Receipt'
    }
    return 'Invoice'
  }
  backToDispense = () => {
    const { dispatch, billing } = this.props
    dispatch({
      type: 'billing/backToDispense',
    })
  }

  toggleAddPaymentModal = () => {
    this.setState(preState => ({
      disabledPayment: undefined,
      showAddPaymentModal: !preState.showAddPaymentModal,
    }))
  }

  onAddPaymentClick = async isGroupPayment => {
    const callBack = () => {
      this.setState(preState => ({
        submitCount: preState.submitCount + 1,
        isGroupPayment,
        disabledPayment: undefined,
        showAddPaymentModal: !preState.showAddPaymentModal,
      }))
    }

    this.upsertBilling(callBack)
  }

  calculateOutstandingBalance = async invoicePayment => {
    const { values, setFieldValue } = this.props

    const totalPaid = (invoicePayment || values.invoicePayment).reduce(
      (totalAmtPaid, payment) => {
        // || !payment.id is in order to include current payment
        if ((!payment.isCancelled && payment.id) || !payment.id)
          return totalAmtPaid + payment.totalAmtPaid
        return totalAmtPaid
      },
      0,
    )
    const newOutstandingBalance = roundTo(values.finalPayable - totalPaid)
    console.log(newOutstandingBalance)
    await setFieldValue('invoice', {
      ...values.invoice,
      outstandingBalance: newOutstandingBalance,
    })
  }

  onExpandDispenseDetails = async (event, p, expanded) => {
    const { dispense } = this.props
    if (expanded && p.key === 0 && !dispense.entity) {
      await this.props.dispatch({
        type: 'billing/showDispenseDetails',
      })
    }
  }

  handleIsEditing = editing => {
    this.setState({ isEditing: editing })
  }

  shouldDisableSaveAndCompleteButton = () => {
    const { values } = this.props
    const { invoicePayer = [], invoice } = values
    if (invoice === null) return true
    if (invoicePayer.length === 0) return false

    return false
  }

  checkPackageSignature = () => {
    const { dispatch, values, clinicSettings } = this.props
    const { packageRedeemAcknowledge } = values
    const { isEnablePackage, isCheckPackageSignature } = clinicSettings
    const isExistingPackageSignature =
      packageRedeemAcknowledge &&
      packageRedeemAcknowledge.signature !== '' &&
      packageRedeemAcknowledge.signature !== undefined

    if (!isEnablePackage || !this.state.isConsumedPackage)
      return this.checkInvoiceOutstanding()

    if (
      isCheckPackageSignature.toLowerCase() ===
        PACKAGE_SIGNATURE_CHECK_OPTION.IGNORE.toLowerCase() ||
      isExistingPackageSignature
    )
      return this.checkInvoiceOutstanding()

    if (
      isCheckPackageSignature.toLowerCase() ===
      PACKAGE_SIGNATURE_CHECK_OPTION.OPTIONAL.toLowerCase()
    ) {
      return dispatch({
        type: 'global/updateState',
        payload: {
          openConfirm: true,
          openConfirmTitle: '',
          openConfirmText: 'Confirm',
          openConfirmContent:
            'Patient signature is not provided, confirm to complete billing?',
          onConfirmSave: () => {
            this.checkInvoiceOutstanding()
          },
        },
      })
    }
    if (
      isCheckPackageSignature.toLowerCase() ===
      PACKAGE_SIGNATURE_CHECK_OPTION.MANDATORY.toLowerCase()
    ) {
      notification.error({
        message: 'Patient signature is mandatory for package acknowledgement',
      })
      return false
    }
    return false
  }

  checkInvoiceOutstanding = async () => {
    const { dispatch, values, setFieldValue } = this.props
    await setFieldValue('mode', 'save')
    await setFieldValue('visitStatus', VISIT_STATUS.COMPLETED)

    const { invoice, invoicePayer = [] } = values
    const { outstandingBalance = 0, invoiceItems = [] } = invoice

    // check if invoice is OVERPAID and prompt user for confirmation
    if (
      outstandingBalance < 0 ||
      invoicePayer.find(ip => ip.payerOutstanding < 0)
    ) {
      return dispatch({
        type: 'global/updateState',
        payload: {
          openConfirm: true,
          openConfirmTitle: '',
          openConfirmText: 'Confirm',
          openConfirmContent:
            'Invoice is overpaid. Confirm to complete billing?',
          onConfirmSave: () => {
            this.upsertBilling(null, null, true)
          },
        },
      })
    }

    if (
      invoiceItems.find(item => {
        if ((item.isPreOrder && !item.isChargeToday) || item.hasPaid) {
          return false
        }
        let totalClaim = 0
        invoicePayer.forEach(payer => {
          const selectInfo = (payer.invoicePayerItem || []).find(
            x => x.invoiceItemFK === item.id,
          )
          if (selectInfo) {
            totalClaim = totalClaim + selectInfo.claimAmount
          }
        })
        if (roundTo(item.totalAfterGst - totalClaim - item.paidAmount) < 0) {
          return true
        }
        return false
      })
    ) {
      return dispatch({
        type: 'global/updateState',
        payload: {
          openConfirm: true,
          openConfirmTitle: '',
          openConfirmText: 'Confirm',
          openConfirmContent:
            'Invoice Item is overpaid. Confirm to complete billing?',
          onConfirmSave: () => {
            this.upsertBilling(null, null, true)
          },
        },
      })
    }
    return this.upsertBilling(null, null, true)
  }

  onCompletePaymentClick = async () => {
    // check package acknowledge
    this.checkPackageSignature()
  }

  onPrintReceiptClick = invoicePaymentID => {
    const { dispatch } = this.props
    dispatch({
      type: 'report/updateState',
      payload: {
        reportTypeID: 29,
        reportParameters: {
          isSaved: true,
          invoicePaymentID,
          printType: INVOICE_REPORT_TYPES.PAYMENT_RECEIPT,
        },
      },
    })
  }

  onPrinterClick = (
    type,
    itemID,
    copayerID,
    invoicePayerid,
    index,
    invoiceReportType,
  ) => {
    switch (type) {
      case 'Payment':
        this.onShowReport(29, {
          InvoicePaymentId: itemID,
          printType: INVOICE_REPORT_TYPES.PAYMENT_RECEIPT,
        })
        break
      case 'TaxInvoice':
        this.onPrintInvoice(copayerID, invoicePayerid, index, invoiceReportType)
        break
      default:
        break
    }
  }

  onPrintInvoice = (
    copayerID,
    invoicePayerid,
    index,
    invoiceReportType,
    forceSave = false,
  ) => {
    const { values, dispatch } = this.props
    const { invoicePayer, visitGroup } = values
    const isGroup = invoiceReportType === INVOICE_REPORT_TYPES.GROUPINVOICE
    const reportID = isGroup ? 89 : 15
    this.setState({ isGroupPrint: isGroup })
    let parametrPayload
    if (copayerID) {
      parametrPayload = {
        InvoiceId: values.invoice ? values.invoice.id : '',
        CopayerId: copayerID,
        InvoicePayerid: invoicePayerid,
        printIndex: index,
        printType: invoiceReportType,
        _key: values?.invoice?.invoiceNo || '',
      }
    } else {
      parametrPayload = {
        InvoiceId: values.invoice ? values.invoice.id : '',
        printType: invoiceReportType,
        _key: values?.invoice?.invoiceNo || '',
      }
    }
    const saveAndPrint = () => {
      let currentPrintIndex
      if (parametrPayload.printIndex !== undefined) {
        const { printIndex, ...other } = parametrPayload
        parametrPayload = {
          ...other,
        }
        currentPrintIndex = invoicePayer.filter(
          (item, i) => !item.isCancelled && i < printIndex,
        ).length
      }

      const callback = () => {
        this.setState(preState => ({
          submitCount: preState.submitCount + 1,
          hasNewSignature: false,
        }))
        if (currentPrintIndex !== undefined) {
          const {
            billing: { entity = {} },
          } = this.props
          parametrPayload = {
            ...parametrPayload,
            InvoicePayerid: entity.invoicePayer[currentPrintIndex].id,
            printType: invoiceReportType,
          }
        }

        this.onShowReport(reportID, {
          visitGroup,
          ...parametrPayload,
        })
      }
      this.upsertBilling(callback)
    }
    if (forceSave) {
      saveAndPrint()
    } else {
      const modifiedOrNewAddedPayer = invoicePayer.filter(payer => {
        if (payer.id === undefined && payer.isCancelled) return false
        if (payer.id) return payer.isModified
        return true
      })
      if (modifiedOrNewAddedPayer.length > 0 || this.state.hasNewSignature) {
        dispatch({
          type: 'global/updateState',
          payload: {
            openConfirm: true,
            openConfirmTitle: '',
            openConfirmText: 'Confirm',
            openConfirmContent: `Save changes and print invoice?`,
            onConfirmSave: () => {
              saveAndPrint()
            },
          },
        })
      } else if (!values.invoice.isBillingSaved) {
        saveAndPrint()
      } else {
        this.onShowReport(reportID, { visitGroup, ...parametrPayload })
      }
    }
  }

  onPrintInvoiceClick = invoiceReportType => {
    const {
      dispatch,
      values: { visitGroupStatusDetails = [] },
    } = this.props
    if (
      invoiceReportType === INVOICE_REPORT_TYPES.GROUPINVOICE &&
      visitGroupStatusDetails.some(x => !x.isBillingSaved)
    ) {
      dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmContent: `One or more invoice(s) are not in \'Billing\' status. Confirm to print?`,
          onConfirmSave: () => {
            this.onPrintInvoice(
              undefined,
              undefined,
              undefined,
              invoiceReportType,
              true,
            )
          },
        },
      })
    } else {
      this.onPrintInvoice(undefined, undefined, undefined, invoiceReportType)
    }
  }

  onPrintVisitInvoiceClick = () => {
    const { values } = this.props
    const parametrPayload = {
      InvoiceId: values.invoice ? values.invoice.id : '',
    }

    this.onShowReport(80, parametrPayload)
  }

  handleAddPayment = async payment => {
    const { values, setValues } = this.props
    const { outstandingBalance, ...rest } = payment
    const invoicePayment = [
      ...values.invoicePayment.filter(item => item.id),
      rest,
    ]
    const _newValues = {
      ...values,
      invoicePayment,
      mode: 'save',
      visitStatus: VISIT_STATUS.BILLING,
    }
    await setValues(_newValues)
    await this.calculateOutstandingBalance(invoicePayment)

    this.toggleAddPaymentModal()
    this.upsertBilling()
  }

  handleDeletePayment = async id => {
    const { values, setValues, user } = this.props
    const { invoicePayment } = values
    let _newInvoicePayment = [...invoicePayment]
    if (id === undefined) {
      _newInvoicePayment = invoicePayment.filter(
        payment => payment.id !== undefined,
      )
    } else {
      _newInvoicePayment = invoicePayment.map(payment =>
        payment.id === id
          ? {
              ...payment,
              isCancelled: true,
              cancelDate: new Date(),
              cancelByUserFK: user.id,
            }
          : { ...payment },
      )
    }
    const _newValues = {
      ...values,
      invoicePayment: _newInvoicePayment,
      mode: 'save',
      visitStatus: VISIT_STATUS.BILLING,
    }
    await setValues(_newValues)
    await this.calculateOutstandingBalance(_newInvoicePayment)
    this.upsertBilling()
  }

  handleResetClick = () => {
    const { dispatch, values } = this.props

    dispatch({
      type: 'billing/query',
      payload: { id: values.visitId },
    }).then(response => {
      if (response) {
        this.setState(preState => ({
          submitCount: preState.submitCount + 1,
        }))
      }
    })
  }

  handleSaveBillingClick = () => {
    this.upsertBilling()
  }

  toggleSchemeValidationPrompt = () => {
    this.setState(preState => ({
      showSchemeValidationPrompt: !preState.showSchemeValidationPrompt,
    }))
  }

  handleDrugLabelClick = () => {
    const { dispense } = this.props
    const { prescription = [], packageItem = [] } = dispense.entity

    let drugList = []

    prescription.forEach(item => {
      drugList.push(item)
    })
    packageItem.forEach(item => {
      if (item.type === 'Medication') {
        drugList.push({
          ...item,
          name: item.description,
          dispensedQuanity: item.packageConsumeQuantity,
        })
      }
    })

    this.setState(prevState => {
      return {
        showDrugLabelSelection: !prevState.showDrugLabelSelection,
        selectedDrugs: drugList.map(x => {
          return { ...x, no: 1, selected: true }
        }),
      }
    })
  }

  handleDrugLabelSelectionClose = () => {
    this.setState(prevState => {
      return {
        showDrugLabelSelection: !prevState.showDrugLabelSelection,
      }
    })
  }

  handleDrugLabelSelected = (itemId, selected) => {
    this.setState(prevState => ({
      selectedDrugs: prevState.selectedDrugs.map(drug =>
        drug.id === itemId ? { ...drug, selected } : { ...drug },
      ),
    }))
    this.props.dispatch({ type: 'global/incrementCommitCount' })
  }

  handleDrugLabelNoChanged = (itemId, no) => {
    this.setState(prevState => ({
      selectedDrugs: prevState.selectedDrugs.map(drug =>
        drug.id === itemId ? { ...drug, no } : { ...drug },
      ),
    }))
    this.props.dispatch({ type: 'global/incrementCommitCount' })
  }

  onShowReport = (reportID, reportParameters, printType) => {
    this.setState({
      showReport: true,
      reportPayload: {
        reportID,
        reportParameters,
        printType,
      },
    })
  }

  handleUpdatedAppliedInvoicePayerInfo = isUpdatedAppliedInvoicePayerInfo => {
    this.setState({ isUpdatedAppliedInvoicePayerInfo })
  }

  showRefreshOrder = () => {
    const { billing, values } = this.props
    const { shouldRefreshOrder } = billing
    let showRefreshOrder = shouldRefreshOrder
    const { visitStatus } = values
    if (
      visitStatus &&
      visitStatus !== VISIT_STATUS.BILLING &&
      visitStatus !== VISIT_STATUS.COMPLETED
    ) {
      showRefreshOrder = true
    }
    return showRefreshOrder
  }

  updateSignature = signature => {
    const { dispatch, values, patient } = this.props
    const { thumbnail } = signature

    dispatch({
      type: 'billing/savePackageAcknowledge',
      payload: {
        visitId: values.visitId,
        invoiceFK: values.invoice.id,
        signatureName: patient.name,
        signature: thumbnail,
      },
    })
  }

  updateInvoiceSignature = signature => {
    const { dispatch, values, patient, setFieldValue } = this.props
    const { thumbnail } = signature
    if (thumbnail != values.invoice.signature) {
      this.setState({ hasNewSignature: true })
    }
    setFieldValue('invoice', {
      ...values.invoice,
      signatureName: thumbnail ? patient.name : undefined,
      signature: thumbnail ? thumbnail : undefined,
    })
  }

  render() {
    const {
      showReport,
      reportPayload,
      showAddPaymentModal,
      showSchemeValidationPrompt,
      schemeValidations,
      submitCount,
      isGroupPayment,
      disabledPayment,
    } = this.state
    const {
      classes,
      dispatch,
      values,
      dispense,
      loading,
      dispenseLoading,
      setFieldValue,
      setValues: setValuesHook,
      patient,
      sessionInfo,
      user,
      commitCount,
      ctschemetype,
      ctcopaymentscheme,
      ctcopayer,
      ctservice,
      inventoryvaccination,
      inventorymedication,
      clinicSettings,
      codetable,
    } = this.props
    const setValues = v => {
      let newValues = v
      if (v.visitGroupStatusDetails?.length > 0) {
        newValues = {
          ...v,
          visitGroupStatusDetails: v.visitGroupStatusDetails.map(x => {
            if (x.visitFK === v.id)
              return {
                ...x,
                totalClaim: v.finalClaim,
                outstandingBalance: v.invoice.outstandingBalance,
              }
            return x
          }),
        }
      }
      setValuesHook(newValues)
    }

    const formikBag = {
      values,
      setFieldValue,
      setValues,
    }
    const commonProps = {
      patient,
      ctschemetype,
      ctcopaymentscheme,
      sessionInfo,
      user,
      clinicSettings,
      inventoryvaccination,
      inventorymedication,
      ctservice,
      ctcopayer,
    }
    const {
      isEnableAddPaymentInBilling = false,
      isEnablePackage = false,
      isEnableVisitationInvoiceReport = false,
      autoPrintOnCompletePayment = false,
    } = clinicSettings
    let packageDrawdownSignatureSrc
    if (
      values.packageRedeemAcknowledge &&
      values.packageRedeemAcknowledge.signature !== '' &&
      values.packageRedeemAcknowledge.signature !== undefined
    ) {
      packageDrawdownSignatureSrc = `${base64Prefix}${values.packageRedeemAcknowledge.signature}`
    }
    let invoiceSignatureSrc
    if (
      values?.invoice?.signature &&
      values?.invoice?.signature !== '' &&
      values?.invoice?.signature !== undefined
    ) {
      invoiceSignatureSrc = `${base64Prefix}${values?.invoice?.signature}`
    }

    return (
      <LoadingWrapper loading={loading} text='Getting billing info...'>
        <PatientBanner
          from='Billing'
          // activePreOrderItem={patient?.listingPreOrderItem?.filter(item => !item.isDeleted) || []}
        />
        <div className={classes.accordionContainer}>
          <LoadingWrapper linear loading={dispenseLoading}>
            <Accordion
              onChange={this.onExpandDispenseDetails}
              collapses={[
                {
                  key: 0,
                  title: 'Dispensing Details',
                  content: (
                    <div className={classes.dispenseContainer}>
                      <DispenseDetails
                        viewOnly
                        values={
                          dispense.entity
                            ? getDispenseEntity(
                                codetable,
                                clinicSettings,
                                dispense.entity,
                              )
                            : dispense.entity
                        }
                        history={this.props.history}
                        dispatch={this.props.dispatch}
                        onDrugLabelClick={this.handleDrugLabelClick}
                        showDrugLabelSelection={
                          this.state.showDrugLabelSelection
                        }
                        onDrugLabelSelectionClose={
                          this.handleDrugLabelSelectionClose
                        }
                        onDrugLabelSelected={this.handleDrugLabelSelected}
                        onDrugLabelNoChanged={this.handleDrugLabelNoChanged}
                        selectedDrugs={this.state.selectedDrugs}
                        onPrintRef={this.onPrintRef}
                      />
                    </div>
                  ),
                },
                {
                  key: 1,
                  title: 'Invoice Payment Details',
                  content: (
                    <div className={classes.dispenseContainer}>
                      <InvoicePaymentDetails
                        invoice={values.invoice}
                        {...this.props}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </LoadingWrapper>
        </div>

        <Paper className={classes.paperContent}>
          <GridContainer justify='center' alignItems='flex-start'>
            <GridItem md={12}>
              {this.showRefreshOrder() && (
                <div style={{ paddingBottom: 8 }}>
                  <WarningSnackbar
                    variant='warning'
                    message='Changes detected. Please refresh order in dispensing screen. (Delete all the Co-payer payment if any)'
                  />
                </div>
              )}
            </GridItem>
            <GridContainer item md={8}>
              {values.id && (
                <ApplyClaims
                  handleIsEditing={this.handleIsEditing}
                  onResetClick={this.handleResetClick}
                  submitCount={submitCount}
                  dispatch={dispatch}
                  commitCount={commitCount}
                  {...formikBag}
                  {...commonProps}
                  onPrinterClick={this.onPrinterClick}
                  saveBilling={this.handleSaveBillingClick}
                  fromBilling
                  handleUpdatedAppliedInvoicePayerInfo={
                    this.handleUpdatedAppliedInvoicePayerInfo
                  }
                  showRefreshOrder={this.showRefreshOrder()}
                />
              )}
            </GridContainer>
            <GridContainer item md={4} justify='center' alignItems='flex-start'>
              <InvoiceSummary
                disabled={this.state.isEditing || values.id === undefined}
                handleAddPaymentClick={this.onAddPaymentClick}
                handleDeletePaymentClick={this.handleDeletePayment}
                handlePrintInvoiceClick={this.onPrintInvoiceClick}
                handlePrintReceiptClick={this.onPrintReceiptClick}
                {...formikBag}
                isEnableVisitationInvoiceReport={
                  isEnableVisitationInvoiceReport
                }
                handlePrintVisitInvoiceClick={this.onPrintVisitInvoiceClick}
              />
            </GridContainer>
          </GridContainer>
        </Paper>
        <GridContainer>
          <GridItem
            md={isEnablePackage && this.state.isConsumedPackage ? 6 : 8}
          >
            <div
              style={{
                display: 'flex',
              }}
            >
              <FastField
                name='invoice.invoiceRemark'
                render={args => {
                  return (
                    <OutlinedTextField
                      label='Invoice Remarks'
                      multiline
                      maxLength={2000}
                      rowsMax={5}
                      rows={2}
                      disabled={
                        this.state.isUpdatedAppliedInvoicePayerInfo ||
                        this.showRefreshOrder()
                      }
                      {...args}
                    />
                  )
                }}
              />
              {autoPrintOnCompletePayment === true && (
                <div
                  style={{
                    marginLeft: 10,
                  }}
                >
                  <h5
                    style={{
                      width: 400,
                    }}
                  >
                    Auto print below documents after Complete Payment
                  </h5>
                  <Field
                    name='autoPrintReportsOnCompletePayment'
                    render={args => {
                      return (
                        <CheckboxGroup
                          disabled={
                            this.state.isEditing ||
                            values.id === undefined ||
                            this.state.isUpdatedAppliedInvoicePayerInfo ||
                            this.showRefreshOrder()
                          }
                          valueField='code'
                          textField='description'
                          options={ReportsOnCompletePayment}
                          noUnderline
                          {...args}
                        />
                      )
                    }}
                  />
                </div>
              )}
            </div>
          </GridItem>
          <GridItem
            md={isEnablePackage && this.state.isConsumedPackage ? 6 : 4}
            style={{ paddingRight: 0 }}
          >
            <React.Fragment>
              <div className={classes.paymentButton}>
                {isEnablePackage && this.state.isConsumedPackage && (
                  <Button
                    color={
                      packageDrawdownSignatureSrc !== '' &&
                      packageDrawdownSignatureSrc !== undefined
                        ? 'success'
                        : 'danger'
                    }
                    onClick={() => {
                      this.setState({
                        isShowAcknowledge: true,
                      })
                    }}
                    disabled={this.state.isEditing || values.id === undefined}
                  >
                    Acknowledge
                  </Button>
                )}
                <Button
                  size='sm'
                  color={
                    invoiceSignatureSrc !== '' &&
                    invoiceSignatureSrc !== undefined
                      ? 'success'
                      : 'danger'
                  }
                  onClick={() => {
                    this.setState({
                      isShowInvoiceSignature: true,
                    })
                  }}
                  disabled={this.state.isEditing || values.id === undefined}
                >
                  Patient Signature
                </Button>
                <Button
                  color='info'
                  size='sm'
                  onClick={this.backToDispense}
                  disabled={
                    this.state.isEditing ||
                    values.id === undefined ||
                    values.invoicePayer.find(payer =>
                      (payer.invoicePayment || []).find(
                        payment => !payment.isCancelled,
                      ),
                    )
                  }
                >
                  <ArrowBack />
                  Dispense
                </Button>
                <Button
                  color='primary'
                  size='sm'
                  onClick={this.handleSaveBillingClick}
                  disabled={
                    this.state.isEditing ||
                    values.id === undefined ||
                    this.state.isUpdatedAppliedInvoicePayerInfo ||
                    this.showRefreshOrder()
                  }
                >
                  Save Billing
                </Button>
                <Button
                  color='success'
                  size='sm'
                  disabled={
                    this.state.isEditing ||
                    values.id === undefined ||
                    this.state.isUpdatedAppliedInvoicePayerInfo ||
                    this.showRefreshOrder()
                  }
                  onClick={this.onCompletePaymentClick}
                >
                  Complete Payment
                </Button>
              </div>
            </React.Fragment>
          </GridItem>
        </GridContainer>
        <CommonModal
          open={showSchemeValidationPrompt}
          title='Scheme Check'
          onClose={this.toggleSchemeValidationPrompt}
          onConfirm={this.upsertByPassValidation}
          cancelText='Cancel'
        >
          <SchemeValidationPrompt validation={schemeValidations} />
        </CommonModal>
        <CommonModal
          open={showAddPaymentModal}
          title={`Add ${isGroupPayment ? 'Group' : ''} Payment`}
          onClose={this.toggleAddPaymentModal}
          observe='AddPaymentForm'
          maxWidth='lg'
        >
          {showAddPaymentModal && (
            <AddPayment
              handleSubmit={this.handleAddPayment}
              invoicePayerName={patient.name}
              invoicePayment={values.invoicePayment}
              invoice={{
                ...values.invoice,
                outstandingBalance: values.invoice.outstandingBalance,
                payerTypeFK: INVOICE_PAYER_TYPE.PATIENT,
                paymentReceivedByUserFK: user.id,
                paymentCreatedBizSessionFK: sessionInfo.id,
                paymentReceivedBizSessionFK: sessionInfo.id,
                finalPayable: values.finalPayable,
                totalClaim: values.finalClaim,
              }}
              patientPayer={values.patientPayer}
              disabledPayment={disabledPayment}
              isGroupPayment={isGroupPayment}
              visitGroupStatusDetails={values.visitGroupStatusDetails?.filter(
                x => x.outstandingBalance > 0,
              )}
            />
          )}
        </CommonModal>
        <CommonModal
          open={showReport}
          onClose={this.onCloseReport}
          title={this.getInvoiceReportTitle(reportPayload)}
          maxWidth='lg'
        >
          <ReportViewer
            showTopDivider={false}
            reportID={reportPayload.reportID}
            reportParameters={reportPayload.reportParameters}
          />
        </CommonModal>
        <CommonModal
          open={this.state.isShowAcknowledge}
          title='Package Acknowledge'
          observe='PackageAcknowledge'
          onClose={() => {
            this.setState({
              isShowAcknowledge: false,
            })
          }}
        >
          <Signature
            signatureName={patient.name}
            updateSignature={this.updateSignature}
            image={packageDrawdownSignatureSrc}
            isEditable={
              packageDrawdownSignatureSrc === '' ||
              packageDrawdownSignatureSrc === undefined
            }
            signatureNameLabel='Patient Name'
          />
        </CommonModal>
        <CommonModal
          open={this.state.isShowInvoiceSignature}
          title='Patient Signature'
          onClose={() => {
            this.setState({
              isShowInvoiceSignature: false,
            })
          }}
        >
          <Signature
            signatureName={patient.name}
            updateSignature={this.updateInvoiceSignature}
            image={invoiceSignatureSrc}
            signatureNameLabel='Patient Name'
            allowClear={true}
          />
        </CommonModal>
        <ViewPatientHistory top='239px' />
      </LoadingWrapper>
    )
  }
}

export default withStyles(styles, { name: 'BillingScreen' })(Billing)
