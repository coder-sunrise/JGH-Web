import React from 'react'
// material ui
import { withStyles } from '@material-ui/core'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
// common components
import { GridContainer, GridItem, NumberInput, Tooltip } from '@/components'
// styling
import styles from './styles'

const titleStyle = {
  position: 'absolute',
  left: 0,
  top: '-4px',
  fontWeight: 'bold',
}

const gridStyle = {
  position: 'relative',
  paddingLeft: 155,
}

const PayerHeader = ({
  classes,
  invoiceNo,
  invoicePayerName,
  patientReferenceNo,
  outstandingAfterPayment,
  totalClaim,
  totalAftGst,
  payerTypeFK,
}) => {
  const showReferrenceNo = payerTypeFK === INVOICE_PAYER_TYPE.PATIENT
  return (
    <GridContainer className={classes.payerHeader}>
      <GridItem md={4}>
        <div style={gridStyle}>
          <h5 style={titleStyle}>Payer: </h5>
          <Tooltip title={invoicePayerName}>
            <div
              className='baseOnCustomStyle'
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'relative',
                top: 2,
              }}
              title={invoicePayerName}
            >
              {invoicePayerName}
            </div>
          </Tooltip>
        </div>
      </GridItem>
      <GridItem md={4}>
        <div style={gridStyle}>
          <h5 style={titleStyle}>Invoice No.: </h5>
          <Tooltip title={invoiceNo}>
            <div
              className='baseOnCustomStyle'
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'relative',
                top: 2,
              }}
              title={invoiceNo}
            >
              {invoiceNo}
            </div>
          </Tooltip>
        </div>
      </GridItem>
      <GridItem md={4} style={{ textAlign: 'right' }}>
        <div style={gridStyle}>
          <h5 style={titleStyle}>Total Payable Amt.: </h5>
          <NumberInput text currency value={totalAftGst} />
        </div>
      </GridItem>
      {showReferrenceNo && (
        <GridItem md={4}>
          <div style={gridStyle}>
            <h5 style={titleStyle}>Referrence No.: </h5>
            <Tooltip title={patientReferenceNo}>
              <div
                className='baseOnCustomStyle'
                style={{
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  top: 2,
                }}
              >
                {patientReferenceNo}
              </div>
            </Tooltip>
          </div>
        </GridItem>
      )}
      <GridItem md={4} style={{ textAlign: 'right' }}>
        {totalClaim !== undefined && (
          <div style={gridStyle}>
            <h5 style={titleStyle}>Total Co-Payer Amt.: </h5>
            <NumberInput text currency value={totalClaim} />
          </div>
        )}
      </GridItem>
      {!showReferrenceNo && <GridItem md={4} />}
      <GridItem md={4} style={{ textAlign: 'right' }}>
        <div style={gridStyle}>
          <h5 style={titleStyle}>Total O/S Amt.: </h5>
          <NumberInput text currency value={outstandingAfterPayment} />
        </div>
      </GridItem>
    </GridContainer>
  )
}

export default withStyles(styles, { name: 'PayerHeader' })(PayerHeader)
