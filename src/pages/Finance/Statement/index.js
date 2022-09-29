import React, { PureComponent, Fragment } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import moment from 'moment'
// material ui
import Delete from '@material-ui/icons/Delete'
import Edit from '@material-ui/icons/Edit'
import Print from '@material-ui/icons/Print'
import _ from 'lodash'

// custom components
import { withStyles } from '@material-ui/core'
import Authorized from '@/utils/Authorized'
import {
  Button,
  CommonTableGrid,
  Tooltip,
  CommonModal,
  dateFormatLong,
  CardContainer,
  notification,
} from '@/components'
// sub components
import SearchBar from './SearchBar'
import PrintStatementReport from './PrintStatementReport'
import GenerateStatements from './GenerateStatements'
import BatchPrintStatement from './BatchPrintStatement'

const styles = () => ({})

@connect(({ statement, global }) => ({
  statement,
  mainDivHeight: global.mainDivHeight,
}))
class Statement extends PureComponent {
  state = {
    showGenerateStatement: false,
    showBatchPrintStatements: false,
    selectedRows: [],
    columns: [
      { name: 'statementNo', title: 'Statement No.' },
      { name: 'statementDate', title: 'Statement Date' },
      { name: 'company', title: 'Co-Payer' },
      { name: 'statementGroupName', title: 'Statement Group' },
      { name: 'payableAmount', title: 'Payable Amount' },
      { name: 'totalPaid', title: 'Paid' },
      { name: 'outstandingAmount', title: 'Outstanding' },
      { name: 'dueDate', title: 'Due Date' },
      { name: 'remark', title: 'Remarks' },
      { name: 'action', title: 'Action' },
    ],
  }

  componentDidMount() {
    const fromDate = moment()
      .subtract(1, 'months')
      .startOf('month')
      .formatUTC()
    const toDate = moment()
      .endOf('month')
      .endOf('day')
      .formatUTC(false)
    const dueToDate = moment()
      .add(3, 'months')
      .endOf('month')
      .endOf('day')
      .formatUTC(false)
    this.props.dispatch({
      type: 'statement/query',
      payload: {
        isCancelled: false,
        lgteql_statementDate: fromDate,
        lsteql_statementDate: toDate,
        apiCriteria: {
          DueDateFrom: fromDate,
          DueDateTo: dueToDate,
        },
      },
    })
  }

  handleSelectionChange = selection => {
    if (selection.length < 2) {
      this.setState({ selectedRows: selection })
    }
  }

  cancelStatement = row => {
    const { dispatch } = this.props
    const { statementNo, id } = row
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: `Delete record ${statementNo}?`,
        onConfirmSave: () => {
          dispatch({
            type: 'statement/removeRow',
            payload: {
              id,
              cancelReason: 'Statement Cancelled',
            },
          }).then(() => {
            this.props.dispatch({
              type: 'statement/query',
            })
          })
        },
      },
    })
  }

  editRow = (row, e) => {
    const { history, dispatch } = this.props
    const accessRight = Authorized.check('statement.statementdetails')

    if (accessRight && accessRight.rights !== 'enable') {
      notification.error({
        message: 'Current user is not authorized to access',
      })
      return
    }
    dispatch({
      type: 'statement/updateState',
      payload: {
        currentId: row.id,
      },
    })
    history.push(`/finance/statement/details/${row.id}?t=0`)
  }

  toggleGenerateStatement = () => {
    this.setState(preState => ({
      showGenerateStatement: !preState.showGenerateStatement,
    }))
  }

  toggleBatchPrintStatements = () => {
    this.setState(preState => ({
      showBatchPrintStatements: !preState.showBatchPrintStatements,
    }))
  }

  render() {
    const {
      history,
      dispatch,
      mainDivHeight = 700,
      statement = {},
    } = this.props
    const {
      rows,
      columns,
      showGenerateStatement,
      showBatchPrintStatements,
    } = this.state
    let height = mainDivHeight - 120 - ($('.filterStatementBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer hideHeader>
        <div className='filterStatementBar'>
          <SearchBar
            history={history}
            handleSearch={this.handleSearch}
            handleAddNew={this.toggleAddNewStatementModal}
            dispatch={dispatch}
            selectedRows={this.state.selectedRows}
            showGenerateStatement={this.toggleGenerateStatement}
            batchPrintStatements={this.toggleBatchPrintStatements}
          />
        </div>
        <CommonTableGrid
          style={{ margin: 0 }}
          type='statement'
          onRowDoubleClick={this.editRow}
          rows={rows}
          columns={columns}
          TableProps={{
            height,
          }}
          columnExtensions={[
            {
              columnName: 'statementNo',
              width: 130,
            },
            {
              columnName: 'company',
              sortBy: 'CopayerFKNavigation.displayValue',
            },
            {
              columnName: 'statementGroupName',
              sortBy: 'statementGroupName',
            },
            {
              columnName: 'payableAmount',
              type: 'number',
              currency: true,
              sortBy: 'totalAmount',
              width: 130,
            },
            {
              columnName: 'totalPaid',
              type: 'number',
              currency: true,
              sortBy: 'CollectedAmount',
              width: 130,
            },
            {
              columnName: 'outstandingAmount',
              type: 'number',
              currency: true,
              width: 130,
              sortingEnabled: false,
            },
            {
              columnName: 'statementDate',
              type: 'date',
              format: dateFormatLong,
              width: 120,
            },
            {
              columnName: 'dueDate',
              type: 'date',
              format: dateFormatLong,
              sortBy: 'DueDate',
              width: 120,
              sortingEnabled: false,
            },
            {
              columnName: 'action',
              align: 'center',
              width: 130,
              render: row => {
                return (
                  <Authorized authority='statement.statementdetails'>
                    <Fragment>
                      <Tooltip title='Edit Statement'>
                        <Button
                          size='sm'
                          onClick={() => {
                            this.editRow(row)
                          }}
                          justIcon
                          color='primary'
                        >
                          <Edit />
                        </Button>
                      </Tooltip>
                      <Tooltip title='Delete Statement'>
                        <Button
                          size='sm'
                          onClick={() => {
                            this.cancelStatement(row)
                          }}
                          justIcon
                          color='danger'
                        >
                          <Delete />
                        </Button>
                      </Tooltip>
                      <PrintStatementReport id={row ? row.id : null}>
                        <Tooltip title='Print Statement'>
                          <Button size='sm' justIcon color='primary'>
                            <Print />
                          </Button>
                        </Tooltip>
                      </PrintStatementReport>
                    </Fragment>
                  </Authorized>
                )
              },
            },
          ]}
        />

        <CommonModal
          title='Generate Statements'
          open={showGenerateStatement}
          maxWidth='md'
          bodyNoPadding
          onClose={this.toggleGenerateStatement}
          onConfirm={this.toggleGenerateStatement}
          observe='generateStatements'
        >
          <GenerateStatements />
        </CommonModal>

        <CommonModal
          title='Batch Print Statements'
          open={showBatchPrintStatements}
          maxWidth='lg'
          bodyNoPadding
          onClose={this.toggleBatchPrintStatements}
          onConfirm={this.toggleBatchPrintStatements}
        >
          <BatchPrintStatement
            mainDivHeight={mainDivHeight}
            rows={statement.batchPrintData || []}
          />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles)(Statement)
