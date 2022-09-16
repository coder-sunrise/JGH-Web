import React from 'react'
import * as Yup from 'yup'
import moment from 'moment'
// formik
import { withFormik } from 'formik'
// sub components
import FilterBar from './FilterBar'
import SalesList from './SalesList'
import ReportBase from '../ReportBase'

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
    return <SalesList reportDatas={reportDatas} />
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
