import React, { PureComponent } from 'react'
import Edit from '@material-ui/icons/Edit'
import { status } from '@/utils/codes'
import { CommonTableGrid, Button, Tooltip } from '@/components'

class Grid extends PureComponent {
  configs = {
    columns: [
      { name: 'code', title: 'Code' },
      { name: 'displayValue', title: 'Display Value' },
      { name: 'description', title: 'Description' },
      { name: 'copayer', title: 'Co-Payer' },
      { name: 'isActive', title: 'Status' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      { columnName: 'code', width: 200 },
      {
        columnName: 'isActive',
        sortingEnabled: false,
        type: 'select',
        options: status,
        align: 'center',
        width: 100,
      },
      {
        columnName: 'action',
        align: 'center',
        render: row => {
          return (
            <Tooltip title='Edit Statement Group'>
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
          )
        },
      },
    ],
  }

  editRow = (row, e) => {
    const {
      dispatch,
      settingStatementGroup: { list },
    } = this.props
    dispatch({
      type: 'settingStatementGroup/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
  }

  render() {
    const { height } = this.props
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='settingStatementGroup'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        {...this.configs}
      />
    )
  }
}

export default Grid
