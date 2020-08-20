import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import * as Yup from 'yup'
import { formatMessage } from 'umi/locale'
import { withStyles, Divider } from '@material-ui/core'
import { getBizSession } from '@/services/queue'
import Authorized from '@/utils/Authorized'
import {
  GridContainer,
  GridItem,
  NumberInput,
  TextField,
  DatePicker,
  Select,
  CodeSelect,
  Field,
  withFormikExtend,
  notification,
  serverDateFormat,
} from '@/components'

import { CreditCardNumberInput } from '@/components/_medisys'

const style = () => ({
  totalPayment: {
    textAlign: 'right',
  },
  summaryLabel: {
    paddingTop: 0,
  },
  label: {
    textAlign: 'right',
    fontSize: '1rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
})

@connect(({ deposit, codetable }) => ({
  deposit,
  codetable,
}))
@withFormikExtend({
  authority: 'finance/deposit',
  mapPropsToValues: ({ deposit, isDeposit }) => {
    if (deposit.entity) {
      const { patientDepositTransaction, balance } = deposit.entity
      const transactionTypeFK = isDeposit ? 1 : 2
      const transactionType = transactionTypeFK === 1 ? 'Deposit' : 'Refund'
      const transactionModeFK = isDeposit ? undefined : 3
      return {
        ...deposit.entity,
        balance: deposit.entity.balance ? deposit.entity.balance : 0,
        patientDepositTransaction: {
          patientDepositFK: deposit.entity.patientDepositFK,
          // transactionDate: moment(),
          transactionType,
          transactionTypeFK,
          transactionModeFK,
          amount: 0,
        },
        balanceAfter: deposit.entity.balance ? deposit.entity.balance : 0,
        hasTransactionBefore: !!patientDepositTransaction,
      }
    }
    return deposit.default
  },
  validationSchema: ({ deposit }) => {
    const balance = deposit.entity
      ? deposit.entity.balance
      : deposit.default.balance
    return Yup.object().shape({
      patientDepositTransaction: Yup.object().shape({
        transactionDate: Yup.string().required('Date is required'),
        transactionBizSessionFK: Yup.number().required(),
        transactionModeFK: Yup.number().required('Mode is required'),
        amount: Yup.number().when('transactionTypeFK', {
          is: (val) => val === 2,
          then: Yup.number()
            .min(0.01, 'The amount should be more than 0.01')
            .max(balance, 'The amount should not exceed the balance.'),
          otherwise: Yup.number().min(
            0.01,
            'The amount should be more than 0.01',
          ),
        }),

        creditCardTypeFK: Yup.number().when('transactionModeFK', {
          is: (val) => val === 1,
          then: Yup.number().required(),
        }),

        // cardNumber: Yup.number().when('transactionModeFK', {
        //   is: (val) => false,
        //   then: Yup.number().test(
        //     'test-number', // this is used internally by yup
        //     'Credit Card number is invalid', //validation message
        //     (value) => valid.number(value).isValid,
        //   ), // ret,
        //   otherwise: Yup.number(),
        // }),
        //   cardNumber: Yup.string()
        //     .test(
        //       'test-number', // this is used internally by yup
        //       'Credit Card number is invalid', //validation message
        //       (value) => valid.number(value).isValid,
        //     ) // return true false based on validation
        //     .required(),
      }),
    })
  },
  handleSubmit: (values, { props }) => {
    const { dispatch, onConfirm, codetable, isDeposit } = props
    const {
      balanceAfter,
      patientDepositTransaction,
      hasTransactionBefore,
    } = values
    const {
      transactionModeFK,
      creditCardTypeFK,
      transactionBizSessionFK,
      remarks,
      ...restDepositTransaction
    } = patientDepositTransaction
    const { ctpaymentmode, ctcreditcardtype } = codetable
    let transactionMode
    let creditCardType
    transactionMode = ctpaymentmode.find((o) => o.id === transactionModeFK)
      .displayValue
    if (transactionModeFK === 1) {
      creditCardType = ctcreditcardtype.find((o) => o.id === creditCardTypeFK)
        .name
    }
    const transType = patientDepositTransaction.transactionType
    dispatch({
      type: 'deposit/updateDeposit',
      payload: {
        ...values,
        id: hasTransactionBefore ? values.id : undefined,
        concurrencyToken: hasTransactionBefore
          ? values.concurrencyToken
          : undefined,
        balance: balanceAfter,
        patientDepositTransaction: {
          ...restDepositTransaction,
          transactionMode,
          creditCardType,
          transactionModeFK,
          creditCardTypeFK,
          createdByBizSessionFK: transactionBizSessionFK,
          transactionBizSessionFK,
          remarks:
            remarks ||
            (isDeposit
              ? 'Deposit for treatments'
              : 'Refund from patient deposit account'),
        },
      },
    }).then((r) => {
      if (r) {
        notification.success({
          message: `${transType} successfully`,
        })
        if (onConfirm) onConfirm()
        dispatch({
          type: 'deposit/query',
        })
      }
    })
  },
  displayName: 'Deposit',
})
class Modal extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      // balanceAfter: entity.balance || 0,
      // isSessionRequired: isDeposit ? false : true,
      isSessionRequired: false,
      isCardPayment: false,
      paymentMode: [],
    }
  }

  componentDidMount () {
    const { dispatch, isDeposit } = this.props

    this.fetchLatestBizSessions()
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctpaymentmode',
      },
    }).then((v) => {
      let paymentMode = v
      if (isDeposit) {
        paymentMode = v.filter((o) => o.code !== 'DEPOSIT')
      }
      this.setState({ paymentMode })
    })
  }

  fetchLatestBizSessions = () => {
    const { setFieldValue } = this.props
    const payload = {
      pagesize: 1,
      sorting: [
        { columnName: 'sessionStartDate', direction: 'desc' },
      ],
    }
    getBizSession(payload).then((response) => {
      const { status, data } = response
      if (parseInt(status, 10) === 200 && data.totalRecords > 0) {
        const { data: sessionData } = data
        const { isClinicSessionClosed, sessionStartDate } = sessionData[0]
        let paymentDate = moment()
        if (isClinicSessionClosed === true) {
          paymentDate = moment(sessionStartDate, serverDateFormat)
        }
        setFieldValue(
          'patientDepositTransaction.transactionDate',
          paymentDate.format(serverDateFormat),
        )
        setFieldValue(
          'patientDepositTransaction.transactionBizSessionFK',
          sessionData[0].id,
        )

        this.getBizList(paymentDate.format(serverDateFormat))
      } else {
        setFieldValue('patientDepositTransaction.transactionDate', null)
        setFieldValue(
          'patientDepositTransaction.transactionBizSessionFK',
          undefined,
        )
      }
    })
  }

  onChangeDate = (event) => {
    if (event) {
      const { isDeposit } = this.props
      const selectedDate = moment(event).format('YYMMDD')

      if (isDeposit && selectedDate === moment().format('YYMMDD')) {
        this.setState({ isSessionRequired: false })
      } else {
        this.setState({ isSessionRequired: true })
      }
      this.getBizList(event)
    }
  }

  getBizList = (date) => {
    const { dispatch, setFieldValue } = this.props
    const momentDate = moment(date, serverDateFormat)

    const startDateTime = moment(
      momentDate.set({ hour: 0, minute: 0, second: 0 }),
    ).formatUTC(false)
    const endDateTime = moment(
      momentDate.set({ hour: 23, minute: 59, second: 59 }),
    ).formatUTC(false)

    dispatch({
      type: 'deposit/bizSessionList',
      payload: {
        pagesize: 999,
        lsteql_SessionStartDate: endDateTime,
        group: [
          {
            isClinicSessionClosed: false,
            lgteql_SessionCloseDate: startDateTime,
            combineCondition: 'or',
          },
        ],
        sorting: [
          { columnName: 'sessionStartDate', direction: 'desc' },
        ],
      },
    }).then(() => {
      const { bizSessionList } = this.props.deposit
      setFieldValue(
        'patientDepositTransaction.transactionBizSessionFK',
        bizSessionList === undefined || bizSessionList.length === 0
          ? undefined
          : bizSessionList[0].value, // bizSessionList.slice(-1)[0].value,
      )
    })
  }

  onChangePaymentMode = (event) => {
    const { setFieldValue } = this.props
    const selectedValue = event || ''

    if (selectedValue === 1) {
      this.setState({ isCardPayment: true })
      setFieldValue('patientDepositTransaction.creditCardTypeFK', 1)
    } else {
      this.setState({ isCardPayment: false })
      setFieldValue('patientDepositTransaction.creditCardTypeFK', undefined)
    }
  }

  calculateBalanceAfter = (event) => {
    const { value = 0 } = event.target
    const { isDeposit, errors, initialValues, setFieldValue } = this.props
    const { balance } = this.props.values || 0
    let finalBalance
    if (!errors.amount) {
      finalBalance = isDeposit ? balance + value : balance - value
    } else {
      finalBalance = initialValues.balance
    }
    setFieldValue('balanceAfter', finalBalance)
  }

  render () {
    const { props } = this
    const { classes, footer, isDeposit, deposit } = props
    const { bizSessionList } = deposit
    const { isCardPayment, paymentMode } = this.state
    const commonAmountOpts = {
      currency: true,
      fullWidth: true,
      // rightAlign: true,
      noUnderline: true,
    }
    const accessRight = Authorized.check('finance.deposit.addtopastsession')

    const allowAddToPastSession = accessRight && accessRight.rights === 'enable'

    //
    return (
      <React.Fragment>
        <div>
          <GridContainer>
            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.transactionDate'
                render={(args) => (
                  <DatePicker
                    timeFomat={false}
                    onChange={this.onChangeDate}
                    disabledDate={(d) => !d || d.isAfter(moment())}
                    label='Date'
                    autoFocus
                    disabled={!allowAddToPastSession}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.transactionBizSessionFK'
                render={(args) => (
                  <Select
                    label='Session'
                    options={bizSessionList}
                    {...args}
                    disabled={!allowAddToPastSession}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.transactionModeFK'
                render={(args) => (
                  <Select
                    label='Mode'
                    onChange={(e) => this.onChangePaymentMode(e)}
                    options={paymentMode}
                    labelField='displayValue'
                    valueField='id'
                    {...args}
                  />
                  //    <CodeSelect
                  //   label='Mode'
                  //   labelField='displayValue'
                  //   onChange={(e) => this.onChangePaymentMode(e)}
                  //   code='ctpaymentmode'
                  //   {...args}
                  // />
                )}
              />
            </GridItem>

            {isCardPayment && (
              <GridItem xs={12}>
                <Field
                  name='patientDepositTransaction.creditCardTypeFK'
                  render={(args) => (
                    <CodeSelect
                      label='Card Type'
                      code='ctCreditCardType'
                      {...args}
                    />
                  )}
                />
              </GridItem>
            )}

            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.modeRemarks'
                render={(args) => (
                  <TextField
                    multiline
                    rowsMax='3'
                    label='Mode Remarks'
                    maxLength={200}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.remarks'
                render={(args) => (
                  <TextField
                    multiline
                    rowsMax='5'
                    // prefix={isDeposit ? 'Deposit Remarks' : 'Refund Remarks'}
                    label={isDeposit ? 'Deposit Remarks' : 'Refund Remarks'}
                    {...args}
                  />
                )}
              />
            </GridItem>
          </GridContainer>

          <GridContainer alignItems='center' justify='center'>
            <GridItem md={3} />
            <GridItem md={3} className={classes.label}>
              <span>Balance</span>
            </GridItem>
            <GridItem md={3}>
              <Field
                name='balance'
                render={(args) => (
                  <NumberInput
                    defaultValue='0.00'
                    disabled
                    {...commonAmountOpts}
                    // label='Balance'
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem md={3} />
            <GridItem md={3} />
            <GridItem md={3} className={classes.label}>
              <span>{isDeposit ? 'Deposit Amount' : 'Refund Amount'}</span>
            </GridItem>
            <GridItem md={3}>
              <Field
                name='patientDepositTransaction.amount'
                render={(args) => (
                  <NumberInput
                    defaultValue='0.00'
                    onChange={this.calculateBalanceAfter}
                    {...commonAmountOpts}
                    // label={isDeposit ? 'Deposit Amount' : 'Refund Amount'}
                    min={0}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem md={3} />
            <GridItem md={3} />
            <GridItem md={6}>
              <Divider />
            </GridItem>
            <GridItem md={3} />

            <GridItem md={3} />

            <GridItem md={3}>
              <Field
                name='balanceAfter'
                render={(args) => (
                  <NumberInput
                    style={{ top: -5 }}
                    {...commonAmountOpts}
                    disabled
                    defaultValue='0.00'
                    {...args}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          {/* <div style={{ width: '40%', margin: 'auto' }}>
            <Field
              name='balance'
              render={(args) => (
                <NumberInput
                  {...commonAmountOpts}
                  style={{
                    marginTop: theme.spacing.unit * 2,
                  }}
                  disabled
                  defaultValue='0.00'
                  prefix='Balance'
                  {...args}
                />
              )}
            />
            <Field
              name='patientDepositTransaction.amount'
              render={(args) => (
                <NumberInput
                  defaultValue='0.00'
                  onChange={this.calculateBalanceAfter}
                  {...commonAmountOpts}
                  prefix={isDeposit ? 'Deposit Amount' : 'Refund Amount'}
                  min={0}
                  {...args}
                />
              )}
            />
            <Divider style={{ width: '45%', float: 'right' }} />
            <Field
              name='balanceAfter'
              render={(args) => (
                <NumberInput
                  style={{ top: -5 }}
                  {...commonAmountOpts}
                  disabled
                  defaultValue='0.00'
                  prefix=' '
                  {...args}
                />
              )}
            />
          </div> */}
        </div>

        {footer &&
          footer({
            onConfirm: props.handleSubmit,
            confirmBtnText: formatMessage({
              id: 'form.save',
            }),
            confirmProps: {
              disabled: false,
            },
          })}
      </React.Fragment>
    )
  }
}

export default withStyles(style, { withTheme: true })(Modal)
