import React from 'react'
import * as Yup from 'yup'
import moment from 'moment'
// formik
import { withFormik } from 'formik'
// material ui
import SolidExpandMore from '@material-ui/icons/ArrowDropDown'
// common components
import {
  Accordion,
} from '@/components'
// sub components
import FilterBar from './FilterBar'
import InvoicePayer from './InvoicePayer'
import PastPaymentsCollection from './PastPaymentsCollection'
import ReportBase from '../ReportBase'
import VisitListing from './VisitListing'
import { AccordionTitle } from '@/components/_medisys'

class QueueListing extends ReportBase {
  constructor (props) {
    super(props)
    this.state = {
      ...super.state,
      reportId: 1,
      fileName: 'Queue Listing Report',
    }
  }

  renderFilterBar = (handleSubmit) => {
    return <FilterBar handleSubmit={handleSubmit} />
  }

  renderContent = (reportDatas) => {
    return <Accordion
      active={this.state.activePanel}
      onChange={this.handleActivePanelChange}
      leftIcon
      expandIcon={<SolidExpandMore fontSize='large' />}
      collapses={[
        {
          title: <AccordionTitle title='Visit Listing' />,
          content: (
            <VisitListing reportDatas={reportDatas} />
          ),
        },
        {
          title: <AccordionTitle title='Past Payments Collection' />,
          content: (
            <PastPaymentsCollection reportDatas={reportDatas} />
          ),
        },
        {
          title: <AccordionTitle title='Invoice Payer' />,
          content: (
            <InvoicePayer reportDatas={reportDatas} />
          ),
        },
      ]}
    />
  }
}

const QueueListingWithFormik = withFormik({
  validationSchema: Yup.object().shape({
    listingFrom: Yup.date().required(),
  }),
  mapPropsToValues: () => ({
    listingFrom: moment(new Date()).toDate(),
    listingTo: moment(new Date()).toDate(),
  }),
})(QueueListing)

export default QueueListingWithFormik
