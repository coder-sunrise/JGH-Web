import React from 'react'
import moment from 'moment'
import _ from 'lodash'
// formik
import { withFormik } from 'formik'
import { connect } from 'dva'
// material ui
import SolidExpandMore from '@material-ui/icons/ArrowDropDown'
// common components
import { Accordion } from '@/components'
import { AccordionTitle } from '@/components/_medisys'
// sub components
import FilterBar from './FilterBar'
import ReferralSourceList from './ReferralSourceList'
import SumList from './SumList'
import ReportBase from '../ReportBase'

@connect(({ settingReferralSource, settingReferralPerson }) => ({
  settingReferralSource, settingReferralPerson,
}))

class ReferralSource extends ReportBase {

  constructor (props) {
    super(props)
    this.state = {
      ...this.state,
      reportId: 72,
      fileName: 'Referral Source Report',
      referralData: [],
      referralList: [],
      referralPersonData: [],
      referralPersonList: [],
    }
  }

  componentDidMount = () => {
    this.loadReferralSource()
    this.loadReferralPerson()
  }

  loadReferralSource = () => {
    this.props
      .dispatch({
        type: 'settingReferralSource/query',
        payload: { pagesize: 9999 },
      })
      .then((response) => {
        if (response) {
          let data = response.data.filter(t => t.isActive)
          let result = data.map((m) => {
            return { name: m.name, value: m.id }
          })
          result = _.concat({ name: 'Patient As Referral', value: -1 }, result)
          this.setState({ referralData: data, referralList: result })
        }
      })
  }

  loadReferralPerson = () => {
    this.props.dispatch({
      type: 'settingReferralPerson/query',
      payload: { pagesize: 9999 },
    })
      .then((response) => {
        if (response) {
          let data = response.data.filter(t => t.isActive)
          this.setState({ referralPersonData: data, referralPersonList: [] })
        }
      })
  }

  formatReportParams = (params) => {
    return {
      ...params,
    }
  }

  onReferralSourceChange = (v) => {
    this.props.setFieldValue('referralPersonIds', undefined)
  }

  renderFilterBar = (handleSubmit, isSubmitting) => {
    let { values } = this.props
    let { referralPersonData } = this.state
    let result = []
    if (values.referralSourceIds && values.referralSourceIds.length > 0) {
      referralPersonData.forEach((person) => {
        if (person.referralSources) {
          if (person.referralSources.find(source => values.referralSourceIds.indexOf(source.id) > -1)) {
            result.push(person)
          }
        }
      })
    }
    result = result.map((m) => {
      return { name: m.name, value: m.id }
    })
    return <FilterBar handleSubmit={handleSubmit}
      referralList={this.state.referralList}
      onReferralSourceChange={this.onReferralSourceChange}
      referralPerson={result}
      isSubmitting={isSubmitting}
    />
  }

  renderContent = (reportDatas) => {
    return (
      <Accordion
        defaultActive={[
          0,
          1,
        ]}
        mode='multiple'
        leftIcon
        expandIcon={<SolidExpandMore fontSize='large' />}
        collapses={[
          {
            title: <AccordionTitle title='Referral Details' />,
            content: <ReferralSourceList reportDatas={reportDatas} />,
          },
          {
            title: <AccordionTitle title='Summary' />,
            content: <SumList reportDatas={reportDatas} />,
          },
        ]}
      />
    )
  }
}

const ReferralSourceWithFormik = withFormik({
  validationSchema: {},
  mapPropsToValues: () => ({
    dateFrom: moment(new Date()).startOf('month').toDate(),
    dateTo: moment(new Date()).endOf('month').toDate(),
  }),
})(ReferralSource)

export default ReferralSourceWithFormik
