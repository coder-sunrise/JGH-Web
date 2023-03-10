import React from 'react'
// formik
import { FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common component
import { GridContainer, GridItem, NumberInput, TextField } from '@/components'
import PaymentBase from './PaymentBase'
import styles from '../styles'

const Nets = ({ payment, index, handleDeletePayment, handleAmountChange }) => {
  return (
    <PaymentBase payment={payment} handleDeletePayment={handleDeletePayment}>
      <GridContainer>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].amt`}
            render={(args) => (
              <NumberInput
                label='Amount'
                min={0}
                {...args}
                currency
                onChange={handleAmountChange}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].netsPayment.refNo`}
            render={(args) => (
              <TextField
                label='Reference No.'
                {...args}
                maxLength={25}
                inputProps={{ maxLength: 25 }}
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

export default withStyles(styles, { name: 'NetsPayment' })(Nets)
