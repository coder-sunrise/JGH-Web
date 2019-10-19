import React, { Component } from 'react'
import * as Yup from 'yup'
import { connect } from 'dva'
// formik
import { withFormik } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import { Button, GridContainer, GridItem } from '@/components'
// sub component
import PayerHeader from './PayerHeader'
import PaymentType from './PaymentType'
import PaymentCard from './PaymentCard'
import PaymentSummary from './PaymentSummary'
// styling
import styles from './styles'
import { getLargestID, InitialValue } from './variables'
import { rounding } from './utils'
import { roundToTwoDecimals } from '@/utils/utils'
import { PAYMENT_MODE } from '@/utils/constants'

@connect(({ clinicSettings }) => ({
  clinicSettings: clinicSettings.settings || clinicSettings.default,
}))
@withFormik({
  mapPropsToValues: ({ invoice, clinicSettings }) => {
    const collectableAmount = rounding(
      clinicSettings,
      invoice.outstandingBalance,
    )
    const cashRounding = roundToTwoDecimals(
      collectableAmount - invoice.outstandingBalance,
    )

    return {
      outstandingAfterPayment: collectableAmount,
      cashReturned: 0,
      cashReceived: 0,
      paymentList: [],
      cashRounding,
      collectableAmount,
      ...invoice,
    }
  },
  validationSchema: Yup.object().shape({
    cashReceived: Yup.number(),
    totalAmtPaid: Yup.number(),
    collectableAmount: Yup.number(),
    outstandingAfterPayment: Yup.number(),
    paymentList: Yup.array().when(
      [
        'totalAmtPaid',
        'collectableAmount',
      ],
      (totalAmtPaid, collectableAmount, schema) => {
        if (totalAmtPaid - collectableAmount > 0)
          return schema.of(
            Yup.object().shape({
              id: Yup.number(),
              paymentModeFK: Yup.number().required(),
              amt: Yup.number().when(
                'paymentModeFK',
                (paymentModeFK) =>
                  paymentModeFK !== PAYMENT_MODE.CASH
                    ? Yup.number()
                        .min(0)
                        .max(
                          collectableAmount,
                          'Total amount paid cannot exceed collectable amount',
                        )
                        .required()
                    : Yup.number().min(0).required(),
              ),
              creditCardTypeFK: Yup.string().when('paymentModeFK', {
                is: (val) => val === PAYMENT_MODE.CREDIT_CARD,
                then: Yup.string().required(),
              }),
              creditCardNo: Yup.string().when('paymentModeFK', {
                is: (val) => val === PAYMENT_MODE.CREDIT_CARD,
                then: Yup.string().required(),
              }),
              chequeNo: Yup.number().when('paymentModeFK', {
                is: (val) => val === PAYMENT_MODE.CHEQUE,
                then: Yup.number().required(),
              }),
              referrenceNo: Yup.string().when('paymentModeFK', {
                is: (val) => val === PAYMENT_MODE.GIRO,
                then: Yup.string().required(),
              }),
            }),
          )

        return schema.of(
          Yup.object().shape({
            id: Yup.number(),
            paymentModeFK: Yup.number().required(),
            amt: Yup.number().min(0).required(),
            creditCardTypeFK: Yup.string().when('paymentModeFK', {
              is: (val) => val === PAYMENT_MODE.CREDIT_CARD,
              then: Yup.string().required(),
            }),
            creditCardNo: Yup.string().when('paymentModeFK', {
              is: (val) => val === PAYMENT_MODE.CREDIT_CARD,
              then: Yup.string().required(),
            }),
            chequeNo: Yup.number().when('paymentModeFK', {
              is: (val) => val === PAYMENT_MODE.CHEQUE,
              then: Yup.number().required(),
            }),
            referrenceNo: Yup.string().when('paymentModeFK', {
              is: (val) => val === PAYMENT_MODE.GIRO,
              then: Yup.string().required(),
            }),
          }),
        )
      },
    ),
  }),
  handleSubmit: (values, { props }) => {
    const { handleSubmit } = props
    const {
      paymentList,
      cashRounding,
      cashReceived,
      cashReturned,
      totalAmtPaid,
    } = values
    const returnValue = {
      paymentModes: paymentList.map((payment, index) => ({
        ...payment,
        sequence: index,
        id: undefined,
      })),
      cashRounding,
      cashReceived,
      cashReturned,
      totalAmtPaid,
    }
    handleSubmit(returnValue)
  },
})
class AddPayment extends Component {
  onPaymentTypeClick = (event) => {
    const { values, setFieldValue } = this.props
    const { currentTarget: { id: type } } = event
    const paymentMode = Object.keys(PAYMENT_MODE).find(
      (mode) => PAYMENT_MODE[mode] === parseInt(type, 10),
    )
    const payment = {
      id: getLargestID(values.paymentList) + 1,
      paymentModeFK: parseInt(type, 10),
      paymentMode,
      ...InitialValue[type],
    }
    const newPaymentList = [
      ...values.paymentList,
      payment,
    ]
    setFieldValue('paymentList', newPaymentList)
  }

  onDeleteClick = (event) => {
    const { currentTarget: { id } } = event
    const { values, setFieldValue } = this.props
    const newPaymentList = values.paymentList.filter(
      (payment) => payment.id !== parseFloat(id, 10),
    )
    const hasCash = newPaymentList.reduce(
      (noCashPaymentMode, payment) =>
        payment.paymentModeFK === PAYMENT_MODE.CASH || noCashPaymentMode,
      false,
    )

    setFieldValue('paymentList', newPaymentList)
    if (!hasCash) {
      setFieldValue('cashReceived', 0)
      setFieldValue('cashReturned', 0)
    }

    if (newPaymentList.length === 0) setFieldValue('outstandingAfterPayment', 0)
  }

  handleAmountChange = () => {
    const { values, setFieldValue } = this.props
    const { paymentList, collectableAmount } = values
    const totalPaid = paymentList.reduce(
      (total, payment) => total + (payment.amt || 0),
      0,
    )
    const cashPayment = paymentList.find(
      (payment) => payment.paymentModeFK === PAYMENT_MODE.CASH,
    )

    let cashReturned = 0
    if (cashPayment) {
      setFieldValue('cashReceived', cashPayment.amt)

      if (totalPaid > collectableAmount && cashPayment) {
        cashReturned = totalPaid - collectableAmount
        setFieldValue('cashReturned', cashReturned)
      }
    }
    setFieldValue('totalAmtPaid', totalPaid)
    setFieldValue(
      'outstandingAfterPayment',
      roundToTwoDecimals(collectableAmount - totalPaid + cashReturned),
    )
  }

  render () {
    const {
      classes,
      onClose,
      invoice = {},
      clinicSettings,
      values,
      handleSubmit,
    } = this.props
    const { paymentList } = values

    return (
      <div>
        <PayerHeader invoice={invoice} />
        <React.Fragment>
          <PaymentType
            disableCash={values.paymentList.reduce(
              (noCashPaymentMode, payment) =>
                payment.paymentModeFK === PAYMENT_MODE.CASH ||
                noCashPaymentMode,
              false,
            )}
            handlePaymentTypeClick={this.onPaymentTypeClick}
          />
          <PaymentCard
            paymentList={paymentList}
            handleDeletePayment={this.onDeleteClick}
            handleAmountChange={this.handleAmountChange}
            setFieldValue={this.props.setFieldValue}
          />

          <GridContainer alignItems='flex-end'>
            <PaymentSummary clinicSettings={clinicSettings} {...values} />
            <GridItem md={12} className={classes.addPaymentActionButtons}>
              <Button color='danger' onClick={onClose}>
                Cancel
              </Button>
              <Button color='primary' onClick={handleSubmit}>
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
