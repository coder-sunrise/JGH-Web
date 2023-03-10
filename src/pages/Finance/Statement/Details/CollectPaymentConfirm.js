import React, { PureComponent } from 'react'
import _ from 'lodash'
import moment from 'moment'
import { FastField } from 'formik'
import { withStyles } from '@material-ui/core'
import {
  GridContainer,
  GridItem,
  CardContainer,
  NumberInput,
  CommonTableGrid,
  TextField,
  dateFormatLong,
  CodeSelect,
  Field,
  DatePicker,
  Select,
  ProgressButton,
  serverDateFormat,
} from '@/components'
import { DEFAULT_PAYMENT_MODE_GIRO } from '@/utils/constants'
import { getBizSession } from '@/services/queue'
import { CreditCardNumberInput } from '@/components/_medisys'

const styles = () => ({
  grid: {
    marginTop: 10,
    marginBottom: 10,
  },
})

class CollectPaymentConfirm extends PureComponent {
  state = {
    isCardPayment: false,
    isGIROPayment: true,
    isChequePayment: false,
    isNetsPayment: false,
    totalAmount: '',
    rows: [
      this.props.values.statementInvoice,
    ],
    columns: [
      { name: 'invoiceNo', title: 'Invoice No' },
      { name: 'invoiceDate', title: 'Invoice Date' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'adminCharge', title: 'Corporate Charge' },
      { name: 'statementAdjustment', title: 'Statement Adjustment' },
      { name: 'totalPayableAmount', title: 'Total Payable Amt' },
      { name: 'outstandingAmount', title: 'Outstanding' },
      { name: 'payment', title: 'Payment' },
    ],
    columnExtensions: [
      {
        columnName: 'invoiceNo',
        sortingEnabled: false,
        width: 100,
      },
      {
        columnName: 'patientName',
        sortingEnabled: false,
      },
      {
        columnName: 'adminCharge',
        type: 'number',
        currency: true,
        sortingEnabled: false,
        width: 130,
      },
      {
        columnName: 'statementAdjustment',
        type: 'number',
        currency: true,
        sortingEnabled: false,
        width: 160,
      },
      {
        columnName: 'totalPayableAmount',
        type: 'number',
        currency: true,
        sortingEnabled: false,
        width: 150,
      },
      {
        columnName: 'outstandingAmount',
        type: 'number',
        currency: true,
        sortingEnabled: false,
        width: 120,
      },
      {
        columnName: 'invoiceDate',
        type: 'date',
        format: dateFormatLong,
        sortingEnabled: false,
        width: 100,
      },
      {
        columnName: 'payment',
        currency: true,
        sortingEnabled: false,
        render: (row) => {
          return (
            <GridItem xs={12}>
              <FastField
                name={`statementInvoice[${row.rowIndex}].tempOutstandingAmount`}
                render={(args) => (
                  <NumberInput
                    {...args}
                    currency
                    min={0}
                    simple
                    onChange={(e) => this.handlePaymentAmount(e, 'grid')}
                  />
                )}
              />
            </GridItem>
          )
        },
        width: 150,
      },
    ],
    hasActiveSession: false,
  }

  componentDidMount () {
    this.checkHasActiveSession()
    this.resize()
    window.addEventListener('resize', this.resize.bind(this))
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  handlePaymentAmount = (e, from) => {
    const { setFieldValue, statement, values, setValues } = this.props
    const { statementInvoice } = statement.entity

    if (from === 'grid') {
      const { name, value } = e.target
      const matches = name.match(/\[(.*?)\]/)
      let edittedIndex
      if (matches) {
        edittedIndex = parseInt(matches[1], 10)
      }

      let totalAmountPaid = 0
      for (let index = 0; index < values.statementInvoice.length; index++) {
        if (index === edittedIndex) {
          totalAmountPaid =
            (totalAmountPaid || 0) +
            (value === undefined || value === '' ? 0 : value)
        } else {
          totalAmountPaid =
            (totalAmountPaid || 0) +
            (values.statementInvoice[index].tempOutstandingAmount || 0)
        }
      }

      const currentStatement = values.statementInvoice[edittedIndex]
      const currentPayment = currentStatement.statementInvoicePayment.find(
        (o) => !o.id,
      )
      if (currentPayment) {
        const { invoicePayment } = currentPayment
        invoicePayment.totalAmtPaid =
          value === undefined || value === '' ? 0 : value
      }

      setFieldValue('amount', totalAmountPaid)
      return
    }
    let tempAmount =
      e.target.value === undefined || e.target.value === '' ? 0 : e.target.value
    const newStatementInvoice = values.statementInvoice.map((o) => {
      let totalAmtPaid
      if (tempAmount >= o.outstandingAmount) {
        totalAmtPaid = o.outstandingAmount
        tempAmount -= o.outstandingAmount
      } else {
        totalAmtPaid = tempAmount
        tempAmount = 0
      }
      const newStatementInvoicePayment = {
        statementInvoiceFK: o.id,
        invoicePayment: {
          totalAmtPaid,
          receiptNo: o.invoiceNo,
          invoicePayerFK: o.invoicePayerFK,
        },
      }
      let statementInvoicePayment
      const existingInvoicePayment = statementInvoice.find((i) => i.id === o.id)
      if (existingInvoicePayment) {
        statementInvoicePayment = [
          ...existingInvoicePayment.statementInvoicePayment,
          newStatementInvoicePayment,
        ]
      }

      return {
        ...o,
        tempOutstandingAmount: totalAmtPaid,
        statementInvoicePayment,
      }
    })
    setValues({
      ...values,
      amount:
        e.target.value === undefined || e.target.value === ''
          ? 0
          : e.target.value,
      statementInvoice: newStatementInvoice,
    })
  }

  onChangeDate = (event) => {
    if (event) {
      this.props.getBizList(event)
    }
  }

  onChangePaymentMode = (event, op) => {
    const { displayValue } = op
    const { setFieldValue } = this.props
    const selectedValue = event || ''
    if (selectedValue === 1) {
      this.setState({ isCardPayment: true })
      this.setState({ isGIROPayment: false })
      this.setState({ isChequePayment: false })
      this.setState({ isNetsPayment: false })
      setFieldValue('creditCardTypeFK', 1)
    } else if (selectedValue === 5) {
      this.setState({ isChequePayment: false })
      this.setState({ isNetsPayment: false })
      this.setState({ isCardPayment: false })
      this.setState({ isGIROPayment: true })
      setFieldValue('cardNumber', '')
      setFieldValue('creditCardTypeFK', undefined)
    } else if (selectedValue === 2) {
      this.setState({ isChequePayment: true })
      this.setState({ isNetsPayment: false })
      this.setState({ isCardPayment: false })
      this.setState({ isGIROPayment: false })
      setFieldValue('cardNumber', '')
      setFieldValue('creditCardTypeFK', undefined)
    } else if (selectedValue === 4) {
      this.setState({ isChequePayment: false })
      this.setState({ isNetsPayment: true })
      this.setState({ isCardPayment: false })
      this.setState({ isGIROPayment: false })
      setFieldValue('cardNumber', '')
      setFieldValue('creditCardTypeFK', undefined)
    } else {
      this.setState({ isCardPayment: false })
      this.setState({ isChequePayment: false })
      this.setState({ isGIROPayment: false })
      setFieldValue('cardNumber', '')
      setFieldValue('refNo', '')
      setFieldValue('chequeNo', '')
      setFieldValue('creditCardTypeFK', undefined)
    }
    setFieldValue('displayValue', displayValue)
  }

  checkHasActiveSession = async () => {
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
  }

  resize () {
    if (this._container) {
      const containerHeight = window.document.body.clientHeight - 300
      this.setState({ containerHeight })
    }
  }

  render () {
    const {
      rows,
      columns,
      columnExtensions,
      isCardPayment,
      isGIROPayment,
      isNetsPayment,
      isChequePayment,
      hasActiveSession,
    } = this.state
    const { values, statement, handleSubmit } = this.props
    const { bizSessionList } = statement
    return (
      <GridContainer>
        <GridItem md={9}>
          <CommonTableGrid
            rows={values.statementInvoice}
            columns={columns}
            columnExtensions={columnExtensions}
            FuncProps={{ pager: false }}
            TableProps={{
              height: 'calc(100vh - 240px)',
            }}
          />
        </GridItem>
        <GridItem md={3}>
          <CardContainer hideHeader style={{ marginTop: 0 }}>
            <GridItem>
              <FastField
                name='amount'
                render={(args) => (
                  <NumberInput
                    {...args}
                    currency
                    label='Amount'
                    autoFocus
                    min={0}
                    onChange={this.handlePaymentAmount}
                  />
                )}
              />
            </GridItem>

            <GridItem>
              <Field
                name='paymentDate'
                render={(args) => (
                  <DatePicker
                    timeFomat={false}
                    onChange={this.onChangeDate}
                    disabledDate={(d) => !d || d.isAfter(moment())}
                    label='Date'
                    {...args}
                  />
                )}
              />
            </GridItem>

            <GridItem>
              <Field
                name='paymentCreatedBizSessionFK'
                render={(args) => (
                  <Select label='Session' options={bizSessionList} {...args} />
                )}
              />
            </GridItem>

            <GridItem>
              <Field
                name='paymentModeFK'
                render={(args) => (
                  <CodeSelect
                    {...args}
                    label='Payment Mode'
                    code='ctPaymentMode'
                    labelField='displayValue'
                    localFilter={(item) => item.code !== 'DEPOSIT'}
                    onChange={(e, op = {}) => this.onChangePaymentMode(e, op)}
                  />
                )}
              />
            </GridItem>

            {isCardPayment && (
              <React.Fragment>
                <GridItem>
                  <Field
                    name='creditCardTypeFK'
                    render={(args) => (
                      <CodeSelect
                        label='Card Type'
                        code='ctCreditCardType'
                        {...args}
                      />
                    )}
                  />
                </GridItem>
                <GridItem>
                  <Field
                    name='cardNumber'
                    render={(args) => <CreditCardNumberInput {...args} />}
                  />
                </GridItem>
              </React.Fragment>
            )}
            {isGIROPayment && (
              <React.Fragment>
                <GridItem>
                  <FastField
                    name='refNo'
                    render={(args) => <TextField {...args} label='Ref. No' />}
                  />
                </GridItem>
              </React.Fragment>
            )}
            {isNetsPayment && (
              <React.Fragment>
                <GridItem>
                  <FastField
                    name='refNo'
                    render={(args) => <TextField {...args} label='Ref. No' />}
                  />
                </GridItem>
              </React.Fragment>
            )}
            {isChequePayment && (
              <React.Fragment>
                <GridItem>
                  <FastField
                    name='chequeNo'
                    render={(args) => <TextField {...args} label='Cheque No' />}
                  />
                </GridItem>
              </React.Fragment>
            )}

            <GridItem>
              <FastField
                name='remarks'
                render={(args) => (
                  <TextField {...args} multiline label='Remarks' />
                )}
              />
            </GridItem>

            <GridItem style={{ float: 'right', padding: 0, marginTop: 10 }}>
              <ProgressButton
                color='primary'
                onClick={handleSubmit}
                disabled={values.amount <= 0 || !hasActiveSession}
              >
                Confirm Payment
              </ProgressButton>
            </GridItem>
          </CardContainer>
        </GridItem>
      </GridContainer>
    )
  }
}

export default withStyles(styles)(CollectPaymentConfirm)
