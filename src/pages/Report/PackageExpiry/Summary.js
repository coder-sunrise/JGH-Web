import React from 'react'
import {
  NumberInput,
  GridContainer,
  GridItem,
} from '@/components'

const Summary = ({ reportDatas }) => {
  if (!reportDatas)
    return null
  
  const { PackageExpirySummary } = reportDatas  
  let summaryData
  PackageExpirySummary.forEach(element => {
    summaryData = element
  })

  return (
    <GridContainer md={6}>
      <GridItem md={12}>
        <NumberInput
          prefix='Total Package Amount (Before Adj.)'
          currency
          disabled
          value={summaryData.totalAmountBeforAdj}
          rightAlign
        />
      </GridItem>
      <GridItem md={12}>
        <NumberInput
          prefix='Total Adjustment'
          currency
          disabled
          value={summaryData.adj}
          rightAlign
        />
      </GridItem>
      <GridItem md={12}>
        <NumberInput
          prefix='Total Package Amount (After Adj.)'
          currency
          disabled
          value={summaryData.totalAmountAfterAdj}
          rightAlign
        />
      </GridItem>
      <GridItem md={12}>
        <NumberInput
          prefix='Total Consumed'
          currency
          disabled
          value={summaryData.consumedAmount}
          rightAlign
        />
      </GridItem>
      <GridItem md={12}>
        <NumberInput
          prefix='Total Expired'
          currency
          disabled
          value={summaryData.expiredAmount}
          rightAlign
        />
      </GridItem>
      <GridItem md={12}>
        <NumberInput
          prefix='Total Balance'
          currency
          disabled
          value={summaryData.balanceAmount}
          rightAlign
        />
      </GridItem>
    </GridContainer>
  )
}

export default Summary
