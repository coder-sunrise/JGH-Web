import React from 'react'
import * as Yup from 'yup'
import $ from 'jquery'
import moment from 'moment'
import { connect } from 'dva'
// formik
import { withFormik } from 'formik'
// sub components
import FilterBar from './FilterBar'
import SalesList from './SalesList'
import ReportBase from '../ReportBase'

@connect(({ global }) => ({
  mainDivHeight: global.mainDivHeight,
}))
class SalesListingReport extends ReportBase {
  constructor(props) {
    super(props)
    this.state = {
      ...this.state,
      reportId: 17,
      fileName: 'Sales Listing Report',
    }
  }

  renderFilterBar = (handleSubmit, isSubmitting) => {
    return <FilterBar handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
  }

  renderContent = reportDatas => {
    const { mainDivHeight = 700 } = this.props
    const filterBarHeight = $('.divReportFilterBar').height() || 0
    const height = mainDivHeight - filterBarHeight - 140
    return <SalesList height={height} reportDatas={reportDatas} />
  }
}

const SalesListingReportWithFormik = withFormik({
  validationSchema: Yup.object().shape({
    dateFrom: Yup.date().required(),
  }),
  mapPropsToValues: () => ({
    dateFrom: moment(new Date())
      .startOf('month')
      .toDate(),
    dateTo: moment(new Date())
      .endOf('month')
      .toDate(),
  }),
})(SalesListingReport)

export default SalesListingReportWithFormik
