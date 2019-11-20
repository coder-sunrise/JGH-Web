import React from 'react'
import { connect } from 'dva'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  GridContainer,
  GridItem,
  NumberInput,
  SizeContainer,
} from '@/components'
// styling
import styles from './styles'

const parseToTwoDecimalString = (value = 0.0) => value.toFixed(2)

const PayerHeader = ({
  classes,
  patient,
  invoice,
  invoicePayerName,
  outstandingAfterPayment,
}) => {
  const { totalClaim } = invoice
  const columnConfig = totalClaim === undefined ? { md: 4 } : { md: 3 }
  return (
    <GridContainer justify='space-between' className={classes.payerHeader}>
      <GridItem {...columnConfig} className={classes.leftAlignText}>
        <h4>Payer: </h4>
        <h4>{invoicePayerName}</h4>
      </GridItem>
      <GridItem {...columnConfig} className={classes.centerText}>
        <h4>Total Payable: </h4>
        <NumberInput text currency value={invoice.totalAftGst} />
      </GridItem>
      {totalClaim !== undefined && (
        <GridItem {...columnConfig} className={classes.centerText}>
          <h4>Total Claim: </h4>
          <NumberInput text currency value={totalClaim} />
        </GridItem>
      )}
      <GridItem {...columnConfig} className={classes.rightAlignText}>
        <h4>Outstanding: </h4>
        <NumberInput text currency value={outstandingAfterPayment} />
      </GridItem>
    </GridContainer>
  )
}

// const ConnectedPayerHeader = connect(({ patient }) => ({
//   patient: patient.entity || patient.default,
// }))(PayerHeader)

export default withStyles(styles, { name: 'PayerHeader' })(PayerHeader)
