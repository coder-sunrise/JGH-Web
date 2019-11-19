import React from 'react'
// formik
import { FastField } from 'formik'
// material ui
import { withStyles, IconButton } from '@material-ui/core'
import TrashBin from '@material-ui/icons/Delete'
// common component
import {
  CardContainer,
  GridContainer,
  GridItem,
  NumberInput,
  TextField,
  Tooltip,
} from '@/components'
import styles from '../styles'

const Nets = ({
  classes,
  payment,
  index,
  handleDeletePayment,
  handleAmountChange,
}) => {
  return (
    <CardContainer hideHeader>
      <h5 className={classes.paymentItemHeader}>Nets</h5>
      <Tooltip title='Delete payment' placement='top-end'>
        <IconButton
          className={classes.trashBin}
          id={payment.id}
          onClick={handleDeletePayment}
        >
          <TrashBin />
        </IconButton>
      </Tooltip>
      <GridContainer>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].amt`}
            render={(args) => (
              <NumberInput
                label='Amount'
                {...args}
                currency
                autoFocus
                onChange={handleAmountChange}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].netsPayment.refNo`}
            render={(args) => <TextField label='Referrence No.' {...args} />}
          />
        </GridItem>
        <GridItem md={6}>
          <FastField
            name={`paymentList[${index}].remark`}
            render={(args) => <TextField label='Remarks' {...args} />}
          />
        </GridItem>
      </GridContainer>
    </CardContainer>
  )
}

export default withStyles(styles, { name: 'NetsPayment' })(Nets)
