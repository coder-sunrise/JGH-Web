import React, { Component } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import * as Yup from 'yup'
import $ from 'jquery'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  serverDateFormat,
  notification,
  EditableTableGrid,
} from '@/components'
import withFormikExtend from '@/components/Decorator/withFormikExtend'
// sub component
import { roundTo } from '@/utils/utils'
import {
  PAYMENT_MODE,
  INVOICE_PAYER_TYPE,
  INVOICE_ITEM_TYPE,
} from '@/utils/constants'
import { getBizSession } from '@/services/queue'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import PayerHeader from './PayerHeader'
import PaymentType from './PaymentType'
import PaymentCard from './PaymentCard'
import PaymentSummary from './PaymentSummary'
import PaymentDateAndBizSession from './PaymentDateAndBizSession'
// styling
import styles from './styles'
import { ValidationSchema, getLargestID } from './variables'
import { rounding } from './utils'
import _ from 'lodash'

@connect(({ clinicSettings, patient, codetable }) => ({
  clinicSettings: clinicSettings.settings || clinicSettings.default,
  patient: patient.entity,
  ctPaymentMode: codetable.ctpaymentmode,
}))
@withFormikExtend({
  notDirtyDuration: 0.5,
  displayName: 'AddPaymentForm',
  mapPropsToValues: ({
    invoice,
    showPaymentDate,
    isGroupPayment,
    visitGroupStatusDetails = [],
    patientPayer = {},
  }) => {
    let invoicePayerItem = (patientPayer.invoicePayerItem || []).map(x => ({
      ...x,
      allowMaxPaid: x.outstanding > 0 ? x.outstanding : 0,
      totalPaidAmount: x.outstanding > 0 ? x.outstanding : 0,
      invoiceNo: invoice.invoiceNo,
      isSelected: x.outstanding > 0,
    }))
    let newValues = {
      ...invoice,
      showPaymentDate,
      cashReturned: 0,
      cashReceived: 0,
      cashRounding: 0,
      totalAmtPaid: 0,
      outstandingAfterPayment: invoice.outstandingBalance,
      collectableAmount: 0,
      paymentList: [],
      invoicePayerItem: !isGroupPayment ? invoicePayerItem : [],
      selectedRows: !isGroupPayment
        ? invoicePayerItem.filter(x => x.outstanding > 0).map(x => x.id)
        : [],
      remainOutstanding:
        invoice.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT
          ? _.sumBy(invoicePayerItem, 'outstanding')
          : invoice.outstandingBalance,
      currentPayable:
        invoice.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT
          ? _.sumBy(invoicePayerItem, 'outstanding')
          : invoice.outstandingBalance,
    }
    if (isGroupPayment && visitGroupStatusDetails.length > 0) {
      const outstandingBalance = roundTo(
        _.sumBy(visitGroupStatusDetails, 'outstandingBalance'),
      )
      invoicePayerItem = []
      visitGroupStatusDetails.forEach(i => {
        if (i.invoicePayerItem.length) {
          invoicePayerItem = invoicePayerItem.concat([
            ...i.invoicePayerItem.map(x => ({
              ...x,
              allowMaxPaid: x.outstanding > 0 ? x.outstanding : 0,
              totalPaidAmount: x.outstanding > 0 ? x.outstanding : 0,
              invoiceNo: i.invoiceNo,
              isGroupPayment,
              isSelected: x.outstanding > 0,
            })),
          ])
        }
      })
      newValues = {
        ...newValues,
        outstandingAfterPayment: outstandingBalance,
        collectableAmount: 0,
        finalPayable: outstandingBalance,
        outstandingBalance: outstandingBalance,
        invoiceOSAmount: invoice.outstandingBalance,
        isGroupPayment,
        invoicePayerItem,
        selectedRows: invoicePayerItem
          .filter(x => x.outstanding > 0)
          .map(x => x.id),
        remainOutstanding: _.sumBy(invoicePayerItem, 'outstanding'),
        currentPayable: _.sumBy(invoicePayerItem, 'outstanding'),
      }
    }
    return newValues
  },
  validationSchema: ValidationSchema,
  handleSubmit: (values, { props }) => {
    const { handleSubmit, isGroupPayment } = props
    const {
      paymentList,
      cashRounding,
      cashReceived,
      cashReturned,
      totalAmtPaid,
      paymentReceivedByUserFK,
      paymentReceivedDate,
      paymentReceivedBizSessionFK,
      paymentCreatedBizSessionFK,
      invoicePayerItem = [],
      selectedRows = [],
    } = values
    const returnValue = {
      invoicePaymentMode: paymentList.map((payment, index) => ({
        ...payment,
        sequence: index,
        id: undefined,
        cashRounding:
          payment.paymentModeFK === PAYMENT_MODE.CASH ? cashRounding : 0,
      })),
      // outstandingBalance: finalPayable - totalAmtPaid,
      cashRounding,
      cashReceived,
      cashReturned,
      totalAmtPaid,
      paymentReceivedByUserFK,
      paymentReceivedDate,
      paymentReceivedBizSessionFK,
      paymentCreatedBizSessionFK,
      isGroupPayment,
      invoicePayment_InvoicePayerInfo:
        values.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT
          ? invoicePayerItem
              .filter(
                x => selectedRows.indexOf(x.id) >= 0 && x.totalPaidAmount > 0,
              )
              .map(x => ({
                invoicePayerInfoFK: x.id,
                paidAmount: x.totalPaidAmount,
              }))
          : [],
    }

    handleSubmit(returnValue)
  },
})
class AddPayment extends Component {
  state = {
    cashPaymentAmount: 0,
    bizSessionList: [],
    paymentModes: [],
  }

  componentWillMount = () => {
    this.props
      .dispatch({
        type: 'codetable/fetchCodes',
        payload: { code: 'ctpaymentmode' },
      })
      .then(response => {
        this.setState({
          paymentModes: response,
        })
      })
    if (this.props.showPaymentDate) {
      this.fetchLatestBizSessions()
    }
  }

  componentDidMount = () => {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    // unbind keyDown listener
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = event => {
    const { values } = this.props
    const min = 112
    const max = 123
    const { keyCode, key } = event
    if (keyCode < min || keyCode > max) return

    event.preventDefault()
    const { ctPaymentMode, patient } = this.props

    const paymentModeObj = ctPaymentMode.find(o => o.hotKey === key)

    if (paymentModeObj) {
      const isCash = paymentModeObj.id === PAYMENT_MODE.CASH
      const isDeposit = paymentModeObj.id === PAYMENT_MODE.DEPOSIT
      const disableCash = values.paymentList.length > 0
      const hasDeposit =
        patient.patientDeposit && patient.patientDeposit.balance > 0
      const disableDeposit =
        values.paymentList.find(
          item =>
            item.paymentModeFK === PAYMENT_MODE.CASH ||
            item.paymentModeFK === PAYMENT_MODE.DEPOSIT,
        ) || values.invoiceOSAmount <= 0

      const disableAllMode = values.paymentList.find(
        item => item.paymentModeFK === PAYMENT_MODE.CASH,
      )
      if (
        (isCash && disableCash) ||
        (isDeposit &&
          (values.payerTypeFK !== INVOICE_PAYER_TYPE.PATIENT ||
            disableDeposit)) ||
        disableAllMode
      )
        return

      document.activeElement?.blur()
      setTimeout(() => {
        this.onPaymentTypeClick(paymentModeObj)
      }, 100)
    }
  }

  fetchLatestBizSessions = () => {
    const { setFieldValue } = this.props
    const payload = {
      pagesize: 1,
      sorting: [{ columnName: 'sessionStartDate', direction: 'desc' }],
    }
    getBizSession(payload).then(response => {
      const { status, data } = response
      if (parseInt(status, 10) === 200 && data.totalRecords > 0) {
        const { data: sessionData } = data
        const { isClinicSessionClosed, sessionStartDate } = sessionData[0]
        let paymentDate = moment()
        if (isClinicSessionClosed === true) {
          paymentDate = moment(sessionStartDate, serverDateFormat)
        }

        const formateDate = paymentDate.format(serverDateFormat)
        setFieldValue('paymentCreatedBizSessionFK', sessionData[0].id)
        setFieldValue('paymentReceivedDate', formateDate)

        this.fetchBizSessionList(formateDate)
      } else {
        setFieldValue('paymentCreatedBizSessionFK', undefined)
        setFieldValue('paymentReceivedDate', null)
      }
    })
  }

  fetchBizSessionList = date => {
    if (!date) return

    const { setFieldValue } = this.props
    const momentDate = moment(date, serverDateFormat)
    const startDateTime = moment(
      momentDate.set({ hour: 0, minute: 0, second: 0 }),
    ).formatUTC(false)
    const endDateTime = moment(
      momentDate.set({ hour: 23, minute: 59, second: 59 }),
    ).formatUTC(false)

    getBizSession({
      pagesize: 999,
      lsteql_SessionStartDate: endDateTime,
      group: [
        {
          isClinicSessionClosed: false,
          lgteql_SessionCloseDate: startDateTime,
          combineCondition: 'or',
        },
      ],
      sorting: [{ columnName: 'sessionStartDate', direction: 'desc' }],
    }).then(response => {
      const { status, data } = response
      if (parseInt(status, 10) === 200) {
        const bizSessionList = data.data.map(item => ({
          value: item.id,
          name: item.sessionNo,
        }))
        this.setState({
          bizSessionList,
        })

        if (bizSessionList.length > 0)
          setFieldValue('paymentReceivedBizSessionFK', bizSessionList[0].value)
        else setFieldValue('paymentReceivedBizSessionFK', undefined)
      }
    })
  }

  getPopulateAmount = paymentMode => {
    const { id: type } = paymentMode
    const {
      values: { remainOutstanding, invoiceOSAmount = 0 },
      patient,
      isGroupPayment,
      visitGroupStatusDetails,
    } = this.props

    const outstanding = remainOutstanding < 0 ? 0 : remainOutstanding

    if (parseInt(type, 10) !== PAYMENT_MODE.DEPOSIT) {
      return outstanding
    }

    const { patientDeposit } = patient
    if (patientDeposit) {
      const { balance = 0 } = patientDeposit
      if (isGroupPayment) {
        return Math.min(balance, Math.min(outstanding, invoiceOSAmount))
      }
      {
        return Math.min(balance, outstanding)
      }
    }
  }

  onPaymentTypeClick = async paymentMode => {
    const {
      values,
      setFieldValue,
      isGroupPayment,
      visitGroupStatusDetails,
    } = this.props
    const { id: type, displayValue } = paymentMode
    const amt = this.getPopulateAmount(paymentMode)

    let payment = {
      id: getLargestID(values.paymentList) + 1,
      displayValue,
      paymentModeFK: parseInt(type, 10),
      paymentMode: displayValue,
      amt: roundTo(amt),
    }
    if (isGroupPayment) {
      const isDeposit = parseInt(type, 10) === PAYMENT_MODE.DEPOSIT
      const defaultRemark = isDeposit
        ? values.invoiceNo
        : values.paymentList.some(x => x.isDeposit)
        ? visitGroupStatusDetails
            .filter(x => x.invoiceNo !== values.invoiceNo)
            .map(x => x.invoiceNo)
            .join('/')
        : visitGroupStatusDetails.map(x => x.invoiceNo).join('/')
      payment = {
        ...payment,
        isDeposit,
        remark: defaultRemark,
      }
    }
    const newPaymentList = [...values.paymentList, payment]
    await setFieldValue('paymentList', newPaymentList)
    this.calculatePayment()
  }

  onDeleteClick = async paymentID => {
    const { values, setFieldValue } = this.props
    const newPaymentList = values.paymentList.filter(
      payment => payment.id !== parseFloat(paymentID, 10),
    )

    await setFieldValue('paymentList', newPaymentList)
    this.calculatePayment()
  }

  calculatePayment = () => {
    const {
      values,
      setFieldValue,
      clinicSettings,
      isGroupPayment,
      visitGroupStatusDetails = [],
    } = this.props
    let {
      paymentList,
      outstandingBalance,
      payerTypeFK,
      invoicePayerItem = [],
      selectedRows = [],
    } = values

    let outstanding = outstandingBalance
    if (payerTypeFK === INVOICE_PAYER_TYPE.PATIENT) {
      outstanding = _.sumBy(
        invoicePayerItem.filter(x => selectedRows.indexOf(x.id) >= 0),
        'totalPaidAmount',
      )
      setFieldValue('currentPayable', outstanding)
    }

    const totalPaid = roundTo(
      paymentList.reduce((total, payment) => total + (payment.amt || 0), 0),
    )

    const cashPayment = paymentList.find(
      payment => payment.paymentModeFK === PAYMENT_MODE.CASH,
    )

    let cashReturned = 0
    if (cashPayment) {
      let cashAfterRounding = roundTo(rounding(clinicSettings, cashPayment.amt))
      let collectableAmountAfterRounding = roundTo(
        rounding(clinicSettings, totalPaid),
      )
      if (isGroupPayment) {
        const otherPayment = _.sumBy(paymentList, p =>
          p.paymentModeFK !== PAYMENT_MODE.CASH ? p.amt || 0 : 0,
        )
        let tempOtherPayment = otherPayment
        //rouding os for per invoice then sum
        const newCashAfterRounding = roundTo(
          _.sumBy(visitGroupStatusDetails, x => {
            const paidAmt = roundTo(
              Math.min(tempOtherPayment, x.outstandingBalance),
            )
            const remainOS = roundTo(x.outstandingBalance - paidAmt)
            tempOtherPayment -= paidAmt
            if (remainOS > 0) {
              const newInvoiceOS = roundTo(rounding(clinicSettings, remainOS))
              return newInvoiceOS
            }
            return 0
          }),
        )
        cashAfterRounding = newCashAfterRounding
        collectableAmountAfterRounding = otherPayment + newCashAfterRounding
      }
      const roundingAmt = roundTo(cashAfterRounding - cashPayment.amt)
      this.setState(
        {
          cashPaymentAmount: cashAfterRounding,
        },
        () => {
          setFieldValue('cashReceived', cashAfterRounding)
          setFieldValue('_cashAfterRounding', cashAfterRounding)
        },
      )

      setFieldValue('cashRounding', roundingAmt)
      setFieldValue('collectableAmount', collectableAmountAfterRounding)

      if (totalPaid > outstanding && cashPayment) {
        cashReturned = roundTo(totalPaid - outstanding)
        setFieldValue('cashReturned', cashReturned)
      } else {
        setFieldValue('cashReturned', 0)
      }
    } else {
      setFieldValue('collectableAmount', totalPaid)
      setFieldValue('_cashAfterRounding', 0)
      setFieldValue('cashReceived', 0)
      setFieldValue('cashReturned', 0)
      setFieldValue('cashRounding', 0)
    }

    setFieldValue('totalAmtPaid', totalPaid)
    setFieldValue(
      'outstandingAfterPayment',
      roundTo(outstandingBalance - totalPaid + cashReturned),
    )

    if (payerTypeFK === INVOICE_PAYER_TYPE.PATIENT) {
      setFieldValue(
        'remainOutstanding',
        roundTo(outstanding - totalPaid + cashReturned),
      )
    } else {
      setFieldValue(
        'remainOutstanding',
        roundTo(outstanding - totalPaid + cashReturned),
      )
    }
  }

  handleAmountChange = () => {
    setTimeout(() => this.calculatePayment(), 1)
  }

  handleCashReceivedChange = event => {
    const _cashReceived = event.target.value
    const { values, setFieldValue } = this.props
    const { cashRounding, paymentList, currentPayable } = values
    const cashPayment = paymentList.find(
      payment => payment.paymentModeFK === PAYMENT_MODE.CASH,
    )
    const totalPaid = paymentList.reduce(
      (total, payment) => total + (payment.amt || 0),
      0,
    )

    if (totalPaid - cashPayment.amt + _cashReceived > currentPayable)
      setFieldValue(
        'cashReturned',
        roundTo(_cashReceived - (cashPayment.amt + cashRounding)),
      )
    else if (totalPaid < currentPayable) {
      setFieldValue(
        'cashReturned',
        _cashReceived - (cashPayment.amt + cashRounding),
      )
    } else setFieldValue('cashReturned', 0)
  }

  handlePaymentDateChange = value => {
    this.fetchBizSessionList(value)
  }

  getPayerHeaderProps = () => {
    const {
      patient,
      values,
      invoice = {},
      invoicePayerName = '',
      isGroupPayment,
      visitGroupStatusDetails = [],
    } = this.props
    return {
      invoiceNo: isGroupPayment
        ? visitGroupStatusDetails.map(x => x.invoiceNo).join('/')
        : invoice.invoiceNo,
      invoicePayerName: isGroupPayment
        ? visitGroupStatusDetails.map(x => x.name).join('/')
        : invoicePayerName,
      patientReferenceNo: isGroupPayment
        ? visitGroupStatusDetails.map(x => x.patientReferenceNo).join('/')
        : patient.patientReferenceNo,
      outstandingAfterPayment: values.outstandingAfterPayment,
      totalClaim: isGroupPayment
        ? _.sumBy(visitGroupStatusDetails, x => x.totalClaim)
        : invoice.totalClaim,
      totalAftGst: isGroupPayment
        ? _.sumBy(visitGroupStatusDetails, x => x.totalAftGST)
        : invoice.totalAftGst,
      payerTypeFK: isGroupPayment
        ? INVOICE_PAYER_TYPE.PATIENT
        : invoice.payerTypeFK,
    }
  }
  handleSelectionChange = selection => {
    const { setFieldValue, values } = this.props
    const newUnSelectItems = values.selectedRows.filter(
      i => !selection.includes(i),
    )
    const newSelectItems = selection.filter(
      i => !values.selectedRows.includes(i),
    )
    const newInvoicePayerItem = values.invoicePayerItem.map(item => {
      if (
        !newUnSelectItems.find(x => x === item.id) &&
        !newSelectItems.find(x => x === item.id)
      )
        return item

      if (newUnSelectItems.find(x => x === item.id)) {
        return {
          ...item,
          totalPaidAmount: 0,
          isSelected: false,
        }
      } else {
        return {
          ...item,
          totalPaidAmount: item.allowMaxPaid,
          isSelected: true,
        }
      }
    })

    setFieldValue('invoicePayerItem', [...newInvoicePayerItem])
    setFieldValue('selectedRows', selection)
    setTimeout(() => this.calculatePayment(), 1)
  }
  SummaryRow = p => {
    const { isGroupPayment } = this.props
    const { children } = p
    let countCol = children.find(c => {
      if (!c.props.tableColumn.column) return false
      return c.props.tableColumn.column.name === 'totalPaidAmount'
    })
    if (countCol) {
      const newChildren = [
        {
          ...countCol,
          props: {
            ...countCol.props,
            colSpan: 7,
            tableColumn: {
              ...countCol.props.tableColumn,
              align: 'right',
            },
          },
          key: 'totalPaidAmount-sumtotal',
        },
      ]
      return <Table.Row {...p}>{newChildren}</Table.Row>
    }
    return <Table.Row {...p}>{children}</Table.Row>
  }

  handleCommitChanges = ({ rows }) => {
    const { setFieldValue } = this.props
    setFieldValue('invoicePayerItem', rows)
    setTimeout(() => this.calculatePayment(), 1)
  }

  getModeMaxHeight = () => {
    const { height } = this.props
    const maxHeight = height - $('.paymentItems').height() - 326
    return maxHeight > 200 ? maxHeight : 200
  }

  render() {
    const {
      classes,
      onClose,
      invoice = {},
      clinicSettings,
      values,
      handleSubmit,
      patient,
      showPaymentDate,
      disabledPayment,
      isGroupPayment,
    } = this.props
    const { selectedRows = [], invoicePayerItem = [] } = values
    const { bizSessionList, paymentModes } = this.state
    const payerHeaderProps = this.getPayerHeaderProps()
    return (
      <div>
        <PayerHeader {...payerHeaderProps} />
        <React.Fragment>
          <GridContainer className={classes.paymentContent}>
            <GridItem md={12} className='paymentItems'>
              {values.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT && (
                <div>
                  <div style={{ margin: '4px 0px' }}>
                    Available payment item(s):
                  </div>
                  <EditableTableGrid
                    rows={invoicePayerItem}
                    forceRender
                    columns={[
                      { name: 'itemType', title: 'Category' },
                      { name: 'itemName', title: 'Name' },
                      { name: 'invoiceNo', title: 'Invoice No.' },
                      {
                        name: 'claimAmount',
                        title: 'Payable Amt.',
                      },
                      {
                        name: 'outstanding',
                        title: 'Patient O/S',
                      },
                      {
                        name: 'totalPaidAmount',
                        title: 'Payment Amt.',
                      },
                    ]}
                    columnExtensions={[
                      {
                        columnName: 'itemType',
                        disabled: true,
                        sortingEnabled: false,
                        width: 140,
                      },
                      {
                        columnName: 'itemName',
                        disabled: true,
                        sortingEnabled: false,
                      },
                      {
                        columnName: 'invoiceNo',
                        disabled: true,
                        sortingEnabled: false,
                        width: 100,
                      },
                      {
                        columnName: 'claimAmount',
                        type: 'number',
                        currency: true,
                        disabled: true,
                        sortingEnabled: false,
                        width: 130,
                      },
                      {
                        columnName: 'outstanding',
                        type: 'number',
                        currency: true,
                        disabled: true,
                        sortingEnabled: false,
                        width: 130,
                      },
                      {
                        columnName: 'totalPaidAmount',
                        type: 'number',
                        currency: true,
                        sortingEnabled: false,
                        min: 0,
                        isDisabled: row =>
                          row.isGroupPayment ||
                          row.outstanding <= 0 ||
                          !row.isSelected,
                        width: 130,
                      },
                    ]}
                    selection={selectedRows}
                    onSelectionChange={this.handleSelectionChange}
                    FuncProps={{
                      pager: false,
                      selectable: true,
                      summary: true,
                      selectConfig: {
                        showSelectAll: true,
                        isSelectionEnabled: !isGroupPayment,
                        rowSelectionEnabled: row => row.outstanding > 0,
                      },

                      summaryConfig: {
                        state: {
                          totalItems: [
                            { columnName: 'totalPaidAmount', type: 'sum' },
                          ],
                        },
                        integrated: {
                          calculator: (type, rows, getValue) => {
                            return rows
                              .filter(r => selectedRows.includes(r.id))
                              .reduce((pre, cur) => {
                                const v = getValue(cur)
                                return pre + (v || 0)
                              }, 0)
                          },
                        },
                        row: {
                          totalRowComponent: this.SummaryRow,
                          messages: {
                            sum: 'Total Payment Amount',
                          },
                        },
                      },
                    }}
                    EditingProps={{
                      showAddCommand: false,
                      showDeleteCommand: false,
                      showCommandColumn: false,
                      onCommitChanges: this.handleCommitChanges,
                    }}
                    TableProps={{
                      height: invoicePayerItem.length > 4 ? 200 : undefined,
                    }}
                    schema={Yup.object().shape({
                      totalPaidAmount: Yup.number()
                        .min(0)
                        .max(
                          Yup.ref('allowMaxPaid'),
                          'Payment Amount cannot exceed Patient Outstanding',
                        ),
                    })}
                  />
                </div>
              )}
            </GridItem>
            <GridItem md={3} style={{ lineHeight: '39px' }}>
              <div style={{ fontSize: '1.2rem', position: 'relative', top: 6 }}>
                Payment Mode:
              </div>
            </GridItem>
            <GridItem md={9}>
              <div>
                {showPaymentDate && (
                  <PaymentDateAndBizSession
                    bizSessionList={bizSessionList}
                    handleDateChange={this.handlePaymentDateChange}
                  />
                )}
              </div>
            </GridItem>
            <GridItem md={3} className={classes.noPaddingLeft}>
              <PaymentType
                paymentModes={paymentModes}
                currentPayments={values.paymentList.map(
                  payment => payment.paymentModeFK,
                )}
                hideDeposit={values.payerTypeFK !== INVOICE_PAYER_TYPE.PATIENT}
                patientInfo={patient}
                handlePaymentTypeClick={paymentModeObj => {
                  setTimeout(() => {
                    this.onPaymentTypeClick(paymentModeObj)
                  }, 100)
                }}
                currentOSAmount={values.invoiceOSAmount}
                maxHeight={this.getModeMaxHeight()}
              />
            </GridItem>
            <GridItem md={9} className={classes.noPaddingLeft}>
              <PaymentCard
                paymentList={values.paymentList}
                handleDeletePayment={this.onDeleteClick}
                handleAmountChange={this.handleAmountChange}
                setFieldValue={this.props.setFieldValue}
                patientInfo={patient}
                maxHeight={this.getModeMaxHeight()}
              />
            </GridItem>
          </GridContainer>

          <GridContainer alignItems='flex-end'>
            <PaymentSummary
              clinicSettings={clinicSettings}
              handleCashReceivedChange={this.handleCashReceivedChange}
              minCashReceived={this.state.cashPaymentAmount}
              {...values}
            />
            <GridItem md={12} className={classes.addPaymentActionButtons}>
              <Button color='danger' onClick={onClose}>
                Cancel
              </Button>
              <Button
                color='primary'
                onClick={() => {
                  setTimeout(() => {
                    if (values.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT) {
                      if (values.remainOutstanding > 0) {
                        notification.warning({
                          message:
                            'Total selected item amount must equal to total payment amount.',
                        })
                        return
                      }
                    }
                    handleSubmit()
                  }, 100)
                }}
                disabled={
                  values.paymentList.length === 0 ||
                  disabledPayment ||
                  (values.payerTypeFK === INVOICE_PAYER_TYPE.PATIENT &&
                    invoicePayerItem.find(
                      x =>
                        selectedRows.indexOf(x.id) >= 0 &&
                        x.totalPaidAmount > x.allowMaxPaid,
                    )) ||
                  !invoicePayerItem.find(
                    x =>
                      selectedRows.indexOf(x.id) >= 0 && x.totalPaidAmount > 0,
                  )
                }
              >
                Confirm
              </Button>
            </GridItem>
          </GridContainer>
        </React.Fragment>
      </div>
    )
  }
}

export default withStyles(styles, { name: 'AddPayment' })(AddPayment)
