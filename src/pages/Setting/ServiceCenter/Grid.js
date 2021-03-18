import React, { PureComponent } from 'react'

import Edit from '@material-ui/icons/Edit'
import { status } from '@/utils/codes'
import { CommonTableGrid, Button, Tooltip } from '@/components'

class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingServiceCenter } = this.props

    const { list } = settingServiceCenter
    dispatch({
      type: 'settingServiceCenter/updateState',
      payload: {
        showModal: true,
        entity: list.find((o) => o.id === row.id),
      },
    })
  }

  render () {
    const { height } = this.props
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='settingServiceCenter'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        columns={[
          { name: 'code', title: 'Code' },
          { name: 'displayValue', title: 'Display Value' },
          { name: 'description', title: 'Description' },
          { name: 'serviceCenterCategoryFK', title: 'Service Center Category' },
          { name: 'isActive', title: 'Status' },
          {
            name: 'action',
            title: 'Action',
          },
        ]}
        columnExtensions={[
          {
            columnName: 'isActive',
            sortingEnabled: false,
            type: 'select',
            options: status,
            width: 120,
            align: 'center',
          },
          {
            columnName: 'action',
            sortingEnabled: false,
            align: 'center',
            width: 100,
            render: (row) => {
              return (
                <Tooltip title='Edit service center'>
                  <Button
                    size='sm'
                    onClick={() => {
                      this.editRow(row)
                    }}
                    justIcon
                    color='primary'
                    style={{ marginRight: 0 }}
                  >
                    <Edit />
                  </Button>
                </Tooltip>
              )
            },
          },
          {
            columnName: 'serviceCenterCategoryFK',
            sortingEnabled: false,
            render: (row) => row.serviceCenterCategoryFKNavigation.displayValue,
          },
        ]}
      />
    )
  }
}

export default Grid
