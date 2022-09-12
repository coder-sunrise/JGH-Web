import React, { PureComponent, Fragment } from 'react'
import Edit from '@material-ui/icons/Edit'
import Delete from '@material-ui/icons/Delete'

import {
  CommonTableGrid,
  Button,
  dateFormatLong,
  Popconfirm,
  notification,
} from '@/components'
import Authorized from '@/utils/Authorized'

const viewAdjustmentDetailAuthority =
  'inventoryadjustment.inventoryadjustmentdetails'
class Grid extends PureComponent {
  state = {
    isShowPopover: false,
  }
  configs = {
    columns: [
      { name: 'transactionNo', title: 'Transaction No' },
      { name: 'transactionDate', title: 'Transaction Date' },
      { name: 'status', title: 'Status' },
      { name: 'remarks', title: 'Remarks' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      {
        columnName: 'action',
        align: 'center',
        render: row => {
          return (
            <Authorized authority={viewAdjustmentDetailAuthority}>
              <Fragment>
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
                <Popconfirm
                  title='Are you sure?'
                  onConfirm={() => {
                    setTimeout(() => {
                      this.cancelRow(row)
                    }, 1)
                  }}
                  onVisibleChange={visible => {
                    this.setState({ isShowPopover: visible })
                  }}
                >
                  <Button
                    size='sm'
                    justIcon
                    color='danger'
                    disabled={row.status !== 'Draft'}
                  >
                    <Delete />
                  </Button>
                </Popconfirm>
              </Fragment>
            </Authorized>
          )
        },
      },
      {
        columnName: 'transactionDate',
        type: 'date',
        format: dateFormatLong,
        sortBy: 'adjustmentTransactionDate',
      },
      {
        columnName: 'transactionNo',
        sortBy: 'adjustmentTransactionNo',
      },
      {
        columnName: 'status',
        sortBy: 'inventoryAdjustmentStatusFK',
      },
      {
        columnName: 'remarks',
        width: 350,
      },
    ],
  }

  editRow = async row => {
    const { toggleModal } = this.props
    const accessRight = Authorized.check(viewAdjustmentDetailAuthority)
    if (!accessRight || accessRight.rights !== 'enable') {
      notification.error({
        message: 'Current user is not authorized to access',
      })
      return
    }

    await this.props
      .dispatch({
        type: 'inventoryAdjustment/queryOne',
        payload: {
          id: row.id,
        },
      })
      .then(() => {
        toggleModal()
      })
  }

  cancelRow = row => {
    this.props
      .dispatch({
        type: 'inventoryAdjustment/removeRow',
        payload: {
          id: row.id,
        },
      })
      .then(() => {
        this.props.dispatch({
          type: 'inventoryAdjustment/query',
        })
      })
  }

  render() {
    const { height } = this.props
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='inventoryAdjustment'
        onRowDoubleClick={(row, e) => {
          if (this.state.isShowPopover) return
          this.editRow(row, e)
        }}
        TableProps={{
          height,
        }}
        {...this.configs}
      />
    )
  }
}

export default Grid
