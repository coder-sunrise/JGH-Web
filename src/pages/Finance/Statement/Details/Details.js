import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import { formatMessage, FormattedMessage } from 'umi/locale'
import Print from '@material-ui/icons/Print'
import Refresh from '@material-ui/icons/Refresh'
import { withStyles } from '@material-ui/core'
import {
  Button,
  GridContainer,
  GridItem,
  CommonTableGrid,
  CommonModal,
  dateFormatLong,
  dateFormatLongWithTimeNoSec12h,
  ProgressButton,
  serverDateFormat,
} from '@/components'
import { getBizSession } from '@/services/queue'
import { roundTo } from '@/utils/utils'
import CollectPaymentConfirm from './CollectPaymentConfirm'
import ExtractAsSingle from './ExtractAsSingle'
import PrintStatementReport from '../PrintStatementReport'

const styles = () => ({
  gridContainer: {
    marginBottom: '10px',
  },
  buttonContainer: {
    paddingLeft: '0 !important',
  },
  collectPaymentBtn: {
    paddingRight: '0 !important',
  },
})

@connect(({ statement }) => ({
  statement,
}))
class Details extends PureComponent {
  state = {
    showModal: false,
    selectedRows: [],
    extractRows: [],
    columns: [
      { name: 'invoiceNo', title: 'Invoice No' },
      { name: 'invoiceDate', title: 'Invoice Date' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'adminCharge', title: 'Corporate Charge' },
      { name: 'statementAdjustment', title: 'Statement Adjustment' },
      { name: 'totalPayableAmount', title: 'Total Payable Amt' },
      { name: 'outstandingAmount', title: 'Outstanding' },
      { name: 'remark', title: 'Remarks' },
    ],

    showCollectPayment: false,
  }

  handleRefresh = () => {
    const { dispatch, values, resetForm } = this.props
    dispatch({
      type: 'statement/refreshStatement',
      payload: {
        id: values.id,
      },
    }).then(() => {
      resetForm()

      this.props.fetchLatestBizSessions()
    })
  }

  toggleCollectPayment = () => {
    const { showCollectPayment } = this.state
    this.setState({
      showCollectPayment: !showCollectPayment,
    })
  }

  gridGetRowID = (row) => row.invoiceNo

  handleSelectionChange = (selection) => {
    this.setState({ selectedRows: selection })
  }

  handleClick = () => {
    const { statement } = this.props
    let rows = []
    let selectedInvoiceNos = []
    this.state.selectedRows.forEach((o) => {
      const invoice = statement.entity.statementInvoice.find(
        (r) => r.invoiceNo === o,
      )
      if (!invoice) {
        return
      }
      rows.push(invoice)
      selectedInvoiceNos.push(invoice.invoiceNo)
    })
    this.setState({
      extractRows: rows,
      selectedRows: selectedInvoiceNos,
    })
    this.setState((prevState) => {
      return { showModal: !prevState.showModal }
    })
  }

  render () {
    const {
      columns,
      showCollectPayment,
      showModal,
      extractRows,
      selectedRows,
    } = this.state
    const { classes, statement, values, theme, history } = this.props
    const { statementInvoice = [] } = values
    return (
      <div>
        <GridContainer classes={{ grid: classes.gridContainer }}>
          <GridContainer direction='row' justify='flex-end'>
            <GridItem style={{ marginRight: -16 }}>
              <ProgressButton
                color='primary'
                onClick={this.handleRefresh}
                icon={<Refresh />}
              >
                <FormattedMessage id='finance.statement.details.refreshStatement' />
              </ProgressButton>
              <PrintStatementReport id={values.id}>
                <Button color='primary'>
                  <Print />
                  <FormattedMessage id='finance.statement.details.printStatement' />
                </Button>
              </PrintStatementReport>
            </GridItem>
          </GridContainer>
        </GridContainer>

        <CommonTableGrid
          forceRender
          rows={statementInvoice}
          columns={columns}
          columnExtensions={[
            {
              columnName: 'invoiceNo',
              sortingEnabled: false,
              width: 100,
            },
            {
              columnName: 'patientName',
              sortingEnabled: false,
            },
            {
              columnName: 'remark',
              sortingEnabled: false,
            },
            {
              columnName: 'adminCharge',
              type: 'number',
              currency: true,
              sortingEnabled: false,
              width: 150,
            },
            {
              columnName: 'statementAdjustment',
              type: 'number',
              currency: true,
              sortingEnabled: false,
              width: 180,
            },
            {
              columnName: 'totalPayableAmount',
              type: 'number',
              currency: true,
              sortingEnabled: false,
              width: 150,
            },
            {
              columnName: 'outstandingAmount',
              type: 'number',
              currency: true,
              sortingEnabled: false,
              width: 150,
            },
            {
              columnName: 'invoiceDate',
              type: 'date',
              format: dateFormatLong,
              sortingEnabled: false,
              width: 100,
            },
          ]}
          TableProps={{
            height: 'calc(100vh - 370px)',
          }}
          FuncProps={{
            pager: false,
            selectable: true,
            selectConfig: {
              showSelectAll: true,
              rowSelectionEnabled: (row) => {
                return !row.statementInvoicePayment.find(
                  (o) => o.invoicePayment.isCancelled === false,
                )
              },
            },
          }}
          getRowId={this.gridGetRowID}
          selection={this.state.selectedRows}
          onSelectionChange={this.handleSelectionChange}
        />

        <p style={{ margin: theme.spacing(1) }}>
          {`Last Refreshed On ${values.lastRefreshTime
            ? moment(values.lastRefreshTime).format(
              dateFormatLongWithTimeNoSec12h,
            )
            : '-'}`}
        </p>

        <CommonModal
          open={showCollectPayment}
          title={formatMessage({
            id: 'finance.corporate-billing.collectPaymentTitle',
          })}
          onClose={this.toggleCollectPayment}
          onConfirm={this.toggleCollectPayment}
          maxWidth='lg'
          showFooter={false}
        >
          <CollectPaymentConfirm />
        </CommonModal>
        <CommonModal
          title='Statement'
          open={showModal}
          maxWidth='md'
          bodyNoPadding
          onClose={this.handleClick}
          onConfirm={this.handleClick}
          observe='statementExtract'
        >
          <ExtractAsSingle selectedRows={extractRows} />
        </CommonModal>
        <Button
          style={{ marginTop: 10 }}
          color='primary'
          onClick={this.handleClick}
          disabled={selectedRows.length <= 0}
        >
          Extract As Single
        </Button>
        <Button
          style={{ marginTop: 10 }}
          color='primary'
          onClick={() => {
            history.push(`/finance/statement/editstatement/${values.id}`)
          }}
        >
          Edit Statement
        </Button>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Details)
