import React, { useState, useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'dva'
import $ from 'jquery'
import { withStyles } from '@material-ui/core/styles'
import { CardContainer } from '@/components'
import FilterBar from './FilterBar'
import CorporateBillingGrid from './CorporateBillingGrid'

const styles = () => ({})
const CorporateBilling = ({
  classes,
  dispatch,
  history,
  corporateBilling,
  mainDivHeight = 700,
}) => {

  let height = mainDivHeight - 110 - ($('.filterBar').height() || 0)
  if (height < 300) height = 300

  const onRowDoubleClick = (row) => {
    history.push(`/finance/billing/details/${row.id}`)
  }

  const props = {
    classes,
    dispatch,
    history,
    corporateBilling,
    onRowDoubleClick,
    gridHeight: height,
  }

  return (
    <CardContainer hideHeader>
      <div className='filterBar'>
        <FilterBar {...props} />
      </div>
      <CorporateBillingGrid {...props}/>
    </CardContainer>
  )
}

export default compose(
  withStyles(styles),
  React.memo,
  connect(({ corporateBilling, global }) => ({
    corporateBilling,
    mainDivHeight: global.mainDivHeight,
  })),
)(CorporateBilling)
