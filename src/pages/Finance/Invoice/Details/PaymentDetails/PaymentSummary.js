import React from 'react'
// common components
import { GridItem, NumberInput, SizeContainer } from '@/components'
// sub component

const amountProps = {
  style: { margin: 0 },
  showZero: true,
  noUnderline: true,
  currency: true,
  rightAlign: true,
  text: true,
  fullWidth: true,
}

const PaymentSummary = ({
  payerDistributedAmtBeforeGST = 0.0,
  outstanding = 0.0,
  gstAmount,
  showTotalClaimAmount,
  _originalGstAmount,
  gstRounding,
}) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        {showTotalClaimAmount != undefined && (
          <GridItem xs={6} md={12}>
            <NumberInput
              prefix='Total Claim Amount:'
              value={payerDistributedAmtBeforeGST}
              size='sm'
              {...amountProps}
            />
          </GridItem>
        )}
        {_originalGstAmount != undefined && (
          <GridItem xs={6} md={12}>
            <NumberInput
              prefix='Initial GST Amount:'
              value={_originalGstAmount}
              size='sm'
              {...amountProps}
            />
          </GridItem>
        )}
        {gstRounding != undefined && (
          <GridItem xs={6} md={12}>
            <NumberInput
              prefix='GST Rounding:'
              value={gstRounding}
              size='sm'
              {...amountProps}
            />
          </GridItem>
        )}
        {gstAmount != undefined && (
          <GridItem xs={6} md={12}>
            <NumberInput
              prefix='Final GST Amount:'
              value={gstAmount}
              size='sm'
              {...amountProps}
            />
          </GridItem>
        )}
        <GridItem xs={6} md={12}>
          <NumberInput
            prefix='Outstanding:'
            value={outstanding}
            size='sm'
            {...amountProps}
          />
        </GridItem>
      </React.Fragment>
    </SizeContainer>
  )
}

export default PaymentSummary
