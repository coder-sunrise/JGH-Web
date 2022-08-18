import React, { PureComponent, Fragment } from 'react'
import { status } from '@/utils/codes'
import MoreVert from '@material-ui/icons/MoreVert'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import { Button, CommonTableGrid, Tooltip, dateFormatLong } from '@/components'

const CellBase = props => {
  const { column, row, onRowDoubleClick } = props
  if (column.name === 'Action') {
    return (
      <Table.Cell {...props}>
        <Tooltip id='tooltip-left' title='View Details' placement='bottom'>
          <Button
            size='sm'
            onClick={() => {
              onRowDoubleClick(row)
            }}
            justIcon
            round
            color='primary'
            style={{ marginRight: 5 }}
          >
            <MoreVert />
          </Button>
        </Tooltip>
      </Table.Cell>
    )
  }
  return <Table.Cell {...props} />
}

export const Cell = CellBase

class CorporateBillingGrid extends PureComponent {
  state = {
    columns: [
      { name: 'displayValue', title: 'Co-Payer' },
      { name: 'outstandingBalance', title: 'O/S Balance' },
      { name: 'lastPaymentDate', title: 'Last Payment' },
      { name: 'contactPerson', title: 'Contact Person' },
      { name: 'officeNo', title: 'Office No.' },
      { name: 'faxNo', title: 'Fax No.' },
      { name: 'email', title: 'Email' },
      { name: 'isActive', title: 'Status' },
      { name: 'Action', title: 'Action' },
    ],
    columnExtensions: [
      {
        columnName: 'Action',
        width: 95,
        align: 'center',
        sortingEnabled: false,
      },
      {
        columnName: 'contactPerson',
        width: 130,
        sortingEnabled: false,
        render: row => {
          return (
            <Tooltip title={row?.personName || ''}>
              <span>{row?.personName || '-'}</span>
            </Tooltip>
          )
        },
      },
      { columnName: 'displayValue' },
      {
        columnName: 'lastPaymentDate',
        width: 140,
        type: 'date',
        format: dateFormatLong,
        sortingEnabled: false,
      },
      {
        columnName: 'officeNo',
        sortingEnabled: false,
        width: 130,
        render: row => {
          return (
            <Tooltip title={row?.workNumber || ''}>
              <span>{row?.workNumber || '-'}</span>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'faxNo',
        sortingEnabled: false,
        width: 130,
        render: row => {
          return (
            <Tooltip title={row?.faxNumber || ''}>
              <span>{row?.faxNumber || '-'}</span>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'email',
        sortingEnabled: false,
        width: 130,
        render: row => {
          return (
            <Tooltip title={row?.emailAddress || ''}>
              <span>{row?.emailAddress || '-'}</span>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'isActive',
        sortingEnabled: false,
        type: 'select',
        options: status,
        align: 'center',
        width: 120,
      },
      {
        columnName: 'outstandingBalance',
        align: 'right',
        type: 'number',
        width: 130,
        sortingEnabled: false,
        currency: true,
      },
    ],
  }

  FuncConfig = {
    sort: true,
    sortConfig: {
      defaultSorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  }

  constructor(props) {
    super(props)

    this.props.dispatch({
      type: 'corporateBilling/fetchCompany',
    })
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'corporateBilling/query',
      payload: {
        id: undefined,
        isActive: true,
        apiCriteria: {
          outstandingBalanceStatus: undefined,
        },
      },
    })
  }

  render() {
    const { columns, columnExtensions } = this.state
    const {
      corporateBilling: { list },
      dispatch,
      onRowDoubleClick,
      gridHeight,
    } = this.props

    const TableCell = p => Cell({ ...p, dispatch, onRowDoubleClick })

    const ActionProps = { TableCellComponent: TableCell }

    return (
      <Fragment>
        <CommonTableGrid
          type='corporateBilling'
          forceRender
          FuncProps={this.FuncConfig}
          columns={columns}
          TableProps={{ height: gridHeight }}
          columnExtensions={columnExtensions}
          onRowDoubleClick={onRowDoubleClick}
          ActionProps={ActionProps}
        />
      </Fragment>
    )
  }
}

export default CorporateBillingGrid
