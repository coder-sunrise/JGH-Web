import React from 'react'
import { connect } from 'dva'
import $ from 'jquery'
// material ui
import { withStyles } from '@material-ui/core'
import moment from 'moment'
// common components
import { CardContainer } from '@/components'
import { getBizSession } from '@/services/queue'
// sub components
import FilterBar from './components/FilterBar'
import InvoiceDataGrid from './components/InvoiceDataGrid'
// styles
import styles from './styles'

const getBizSessionId = async () => {
  const bizSessionPayload = {
    IsClinicSessionClosed: false,
  }
  const result = getBizSession(bizSessionPayload)
  const { data } = result.data
  if (data.length > 0) {
    return data[0].id
  }
  return null
}
@connect(({ invoiceList, global, clinicSettings }) => ({
  invoiceList,
  global,
  mainDivHeight: global.mainDivHeight,
  clinicSettings: clinicSettings.settings,
}))
class Invoice extends React.Component {
  componentDidMount() {
    this.queryList()
  }
  queryList = () => {
    const {
      invoiceList: { filterValues = {} },
      dispatch,
    } = this.props

    const {
      invoiceNo,
      patientName,
      patientAccountNo,
      invoiceStartDate,
      invoiceEndDate,
      outstandingBalanceStatus,
      session,
      coPayerFk,
    } = filterValues
    let SessionID
    let SessionType
    if (session === 'current') {
      SessionID = getBizSessionId()
      SessionType = 'CurrentSession'
    } else if (session === 'past') {
      SessionID = getBizSessionId()
      SessionType = 'PastSession'
    }

    const payload = {
      lgteql_invoiceDate: invoiceStartDate || undefined,
      lsteql_invoiceDate: invoiceEndDate || undefined,
      lgt_OutstandingBalance:
        outstandingBalanceStatus === 'yes' && outstandingBalanceStatus !== 'all'
          ? '0'
          : undefined,
      lsteql_OutstandingBalance:
        outstandingBalanceStatus === 'no' && outstandingBalanceStatus !== 'all'
          ? '0'
          : undefined,
      apiCriteria: {
        SessionID,
        SessionType,
        coPayerFk,
      },
      group: [
        {
          invoiceNo,
          'VisitInvoice.VisitFKNavigation.PatientProfileFkNavigation.Name': patientName,
          'VisitInvoice.VisitFKNavigation.PatientProfileFkNavigation.PatientAccountNo': patientAccountNo,
          combineCondition: 'and',
        },
      ],
    }

    dispatch({
      type: 'invoiceList/query',
      payload,
    })
  }
  onRowDoubleClick = row => {
    this.props.history.push(`/finance/invoice/details?id=${row.id}`)
  }
  render() {
    const { classes, mainDivHeight = 700 } = this.props
    let height =
      mainDivHeight -
      140 -
      ($('.filterInvoiceBar').height() || 0) -
      ($('.footerInvoiceBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer hideHeader>
        <div className='filterInvoiceBar'>
          <FilterBar {...this.props} />
        </div>
        <InvoiceDataGrid
          handleRowDoubleClick={this.onRowDoubleClick}
          {...this.props}
          height={height}
        />
        <div className='footerInvoiceBar'>
          <p className={classes.footerNote}>
            Note: Total Payment is the sum total of the payment amount of payers
          </p>
        </div>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'InvoicePage' })(Invoice)
