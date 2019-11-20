import React from 'react'
// formik
import { FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common component
import { GridContainer, GridItem, NumberInput, TextField } from '@/components'
import PaymentBase from './PaymentBase'
import styles from '../styles'

const Deposit = ({
  payment,
  index,
  handleDeletePayment,
  handleAmountChange,
  patientInfo,
}) => {
  const maxAmount =
    patientInfo && patientInfo.patientDeposit
      ? patientInfo.patientDeposit.balance
      : undefined
  return (
    <PaymentBase payment={payment} handleDeletePayment={handleDeletePayment}>
      <GridContainer>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].amt`}
            render={(args) => (
              <NumberInput
                label='Amount'
                {...args}
                currency
                max={maxAmount}
                onChange={handleAmountChange}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].remark`}
            render={(args) => <TextField label='Remarks' {...args} />}
          />
        </GridItem>
      </GridContainer>
    </PaymentBase>
  )
}

// const ConnectedDeposit = connect(({ patient }) => ({
//   patient: patient.entity,
// }))(Deposit)

export default withStyles(styles, { name: 'DepositPayment' })(Deposit)
