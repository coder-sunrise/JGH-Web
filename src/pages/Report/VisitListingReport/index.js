import React from 'react'
import moment from 'moment'
import { connect } from 'dva'
// formik
import { withFormik } from 'formik'
import { withStyles } from '@material-ui/core'
// sub components
import FilterBar from './FilterBar'
import VisitList from './VisitList'
import ReportBase from '../ReportBase'

const reportId = 63
const fileName = 'Visit Listing Report'

const styles = () => ({
  contactIcon: {
    width: 15,
    height: 15,
    position: 'relative',
    top: 3,
  },
})

@connect(({ visitRegistration, codetable }) => ({
  visitRegistration,
  ctcopayer: codetable.ctcopayer || [],
}))
class VisitListing extends ReportBase {
  constructor(props) {
    super(props)
    this.state = {
      ...this.state,
      reportId,
      fileName,
    }
  }

  formatReportParams = params => {
    return {
      ...params,
      groupByVisitPurpose: params.groupBy === 'VisitPurpose',
      groupByDoctor: params.groupBy === 'Doctor',
      groupByCopayer: params.groupBy === 'Copayer',
    }
  }

  componentDidMount = async () => {
    const { dispatch } = this.props
    const response = await dispatch({
      type: 'visitRegistration/getVisitOrderTemplateListForDropdown',
      payload: {
        pagesize: 9999,
      },
    })
    if (response) {
      const { data } = response
      const templateOptions = data
        .filter(template => template.isActive)
        .map(template => {
          return {
            ...template,
            value: template.id,
            name: template.displayValue,
          }
        })

      dispatch({
        type: 'visitRegistration/updateState',
        payload: {
          visitOrderTemplateOptions: templateOptions,
        },
      })
    }
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctcopayer',
      },
    })
  }

  renderFilterBar = (handleSubmit, isSubmitting) => {
    const {
      visitRegistration: { visitOrderTemplateOptions = [] },
      ctcopayer,
      classes,
    } = this.props
    return (
      <FilterBar
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        visitOrderTemplateOptions={visitOrderTemplateOptions}
        ctcopayer={ctcopayer}
        classes={classes}
      />
    )
  }

  renderContent = reportDatas => {
    return <VisitList reportDatas={reportDatas} />
  }
}

const VisitListingWithFormik = withFormik({
  mapPropsToValues: () => ({
    dateFrom: moment(new Date())
      .startOf('month')
      .toDate(),
    dateTo: moment(new Date())
      .endOf('month')
      .toDate(),
    groupBy: 'None',
  }),
})(VisitListing)

export default withStyles(styles, { withTheme: true })(VisitListingWithFormik)
