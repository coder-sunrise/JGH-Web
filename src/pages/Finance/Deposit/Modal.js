import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import * as Yup from 'yup'
import valid from 'card-validator'
import { formatMessage } from 'umi/locale'
import { withStyles, Grid } from '@material-ui/core'
import { paymentMethods } from '@/utils/codes'
import {
  GridContainer,
  GridItem,
  NumberInput,
  TextField,
  DatePicker,
  Select,
  CodeSelect,
  Field,
  FastField,
  withFormikExtend,
} from '@/components'

const style = () => ({
  totalPayment: {
    textAlign: 'right',
  },
  summaryLabel: {
    paddingTop: 0,
  },
})

@connect(({ deposit }) => ({
  deposit,
}))
@withFormikExtend({
  mapPropsToValues: ({ deposit, isDeposit }) => {
    if (deposit.entity) {
      console.log('entity', deposit.entity)
      const transactionTypeFK = isDeposit ? 1 : 2
      return {
        ...deposit.entity,
        // id: undefined,
        patientDepositTransaction: {
          patientDepositFK: deposit.entity.patientDepositFK,
          transactionDate: moment(),
          transactionTypeFK,
          amount: 0,
        },
      }
    }
    return deposit.default
  },
  validationSchema: Yup.object().shape({
    patientDepositTransaction: Yup.object().shape({
      transactionDate: Yup.string().required('Date is required'),
      transactionBizSessionFK: Yup.number().required(),
      transactionModeFK: Yup.number().required('Mode is required'),
      amount: Yup.number().min(0.01, 'The amount should be more than 0.01'),
      creditCardTypeFK: Yup.number().when('transactionModeFK', {
        is: (val) => val === 1,
        then: Yup.number().required(),
      }),
      cardNumber: Yup.number().when('transactionModeFK', {
        is: (val) => val === 1,
        then: Yup.number().test(
          'test-number', // this is used internally by yup
          'Credit Card number is invalid', //validation message
          (value) => valid.number(value).isValid,
        ), // ret,
        otherwise: Yup.number(),
      }),
      //   cardNumber: Yup.string()
      //     .test(
      //       'test-number', // this is used internally by yup
      //       'Credit Card number is invalid', //validation message
      //       (value) => valid.number(value).isValid,
      //     ) // return true false based on validation
      //     .required(),
    }),
  }),
  // validate: (values, props) => {
  //   let errors = {}

  //   if (
  //     moment(values.date).format('YYMMDD') === moment().format('YYMMDD') &&
  //     props.isDeposit
  //   ) {
  //   } else {
  //     if (!values.session) {
  //       errors.session = 'This is a required field'
  //     }
  //   }

  //   return errors
  // },
  handleSubmit: (values, { props }) => {
    const { dispatch, onConfirm } = props
    const { balanceAfter, patientDepositTransaction } = values
    console.log({ values })
    dispatch({
      type: 'deposit/upsert',
      payload: {
        ...values,
        balance: balanceAfter,
        patientDepositTransaction: {
          ...patientDepositTransaction,
          createdByBizSessionFK:
            patientDepositTransaction.transactionBizSessionFK,
          // creditCardTypeFK: 1,
        },
      },
    }).then((r) => {
      if (r) {
        if (onConfirm) onConfirm()
        dispatch({
          type: 'deposit/query',
        })
      }
    })
    // props
    //   .dispatch({
    //     type: 'deposit/submit',
    //     payload: values,
    //   })
    //   .then((r) => {
    //     if (r && r.message === 'Ok') {
    //       // toast.success('test')
    //       notification.success({
    //         // duration:0,
    //         message: 'Done',
    //       })
    //       if (props.onConfirm) props.onConfirm()
    //     }
    //   })
  },
})
class Modal extends PureComponent {
  constructor (props) {
    super(props)
    const { isDeposit, deposit } = this.props
    const { entity } = deposit
    this.state = {
      // balanceAfter: entity.balance || 0,
      // isSessionRequired: isDeposit ? false : true,
      isSessionRequired: false,
      isCardPayment: false,
    }
  }

  componentDidMount () {
    this.getBizList(moment().format('YYMMDD'))
  }

  onChangeDate = (event) => {
    const { dispatch, setFieldValue, isDeposit } = this.props
    const selectedDate = moment(event).format('YYMMDD')

    if (isDeposit && selectedDate === moment().format('YYMMDD')) {
      this.setState({ isSessionRequired: false })
    } else {
      this.setState({ isSessionRequired: true })

      // dispatch({
      //   type: 'deposit/bizSessionList',
      //   payload: {
      //     sessionNoPrefix: selectedDate,
      //     pagesize: 999999,
      //   },
      // }).then(() => {
      //   const { bizSessionList } = this.props.deposit
      //   setFieldValue(
      //     'patientDepositTransaction.transactionBizSessionFK',
      //     bizSessionList.length === 0 || bizSessionList === undefined
      //       ? ''
      //       : bizSessionList[0].value,
      //   )
      // })
      this.getBizList(selectedDate)
    }
  }

  getBizList = (e) => {
    const { dispatch, setFieldValue } = this.props
    dispatch({
      type: 'deposit/bizSessionList',
      payload: {
        sessionNoPrefix: e,
        pagesize: 999999,
      },
    }).then(() => {
      const { bizSessionList } = this.props.deposit
      setFieldValue(
        'patientDepositTransaction.transactionBizSessionFK',
        bizSessionList.length === 0 || bizSessionList === undefined
          ? undefined
          : bizSessionList.slice(-1)[0].value, // bizSessionList[0].value
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
      setFieldValue('patientDepositTransaction.cardNumber', '')
      setFieldValue('patientDepositTransaction.creditCardTypeFK', undefined)
    }
  }

  calculateBalanceAfter = () => {
    console.log('props', this.props)
    const { isDeposit, errors, initialValues, setFieldValue } = this.props
    const { balance, patientDepositTransaction } = this.props.values || 0
    const { amount } = patientDepositTransaction
    let finalBalance
    if (!errors.amount) {
      console.log({ balance, amount })
      finalBalance = isDeposit ? balance + amount : balance - amount
    } else {
      finalBalance = initialValues.balance
    }
    this.setState({
      balanceAfter: finalBalance,
    })

    console.log({ finalBalance })
    setFieldValue('balanceAfter', finalBalance)
  }

  render () {
    const { state, props } = this
    const { theme, footer, onConfirm, values, isDeposit, deposit } = props
    const { bizSessionList, entity } = deposit
    const { isSessionRequired, isCardPayment } = this.state
    const commonAmountOpts = {
      currency: true,
      prefixProps: {
        style: { width: '100%' },
      },
    }
    console.log({ props })

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
                    {...args}
                  />
                )}
              />
            </GridItem>

            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.transactionBizSessionFK'
                render={(args) => (
                  <Select label='Session' options={bizSessionList} {...args} />
                )}
              />
            </GridItem>

            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.transactionModeFK'
                render={(args) => (
                  <CodeSelect
                    label='Mode'
                    labelField='displayValue'
                    onChange={(e) => this.onChangePaymentMode(e)}
                    code='ctpaymentmode'
                    {...args}
                  />
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
            {isCardPayment && (
              <GridItem xs={12}>
                <Field
                  name='patientDepositTransaction.cardNumber'
                  render={(args) => <TextField label='Card Number' {...args} />}
                />
              </GridItem>
            )}
            {/* <GridItem xs={12}>
              <Field
                name='remarks'
                render={(args) => (
                  <TextField multiline rowsMax='5' label='Remarks' {...args} />
                )}
              />
            </GridItem> */}
            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.remarks'
                render={(args) => (
                  <TextField
                    multiline
                    rowsMax='5'
                    prefix={isDeposit ? 'Deposit Remarks' : 'Refund Remarks'}
                    label={isDeposit ? 'Deposit Remarks' : 'Refund Remarks'}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='balance'
                render={(args) => (
                  <NumberInput
                    {...commonAmountOpts}
                    style={{
                      marginTop: theme.spacing.unit * 2,
                    }}
                    disabled
                    simple
                    currency
                    prefix='Balance'
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='patientDepositTransaction.amount'
                render={(args) => (
                  <NumberInput
                    currency
                    onChange={this.calculateBalanceAfter}
                    {...commonAmountOpts}
                    prefix={isDeposit ? 'Deposit Amount' : 'Refund Amount'}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='balanceAfter'
                render={(args) => (
                  <NumberInput
                    {...commonAmountOpts}
                    disabled
                    simple
                    currency
                    prefix=' '
                    {...args}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
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
