import React, { PureComponent } from 'react'
import { CommonTableGrid, Button } from '@/components'
import { status } from '@/utils/codes'
import Edit from '@material-ui/icons/Edit'

class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingParticipantRole } = this.props

    const { list } = settingParticipantRole
    // For complex object retrieve from server
    // dispatch({
    //   type: 'settingRoom/querySingle',
    //   payload: {
    //     id: row.id,
    //   },
    // }).then(toggleModal)
    // console.log(settingRoom, row.id, e)
    dispatch({
      type: 'settingParticipantRole/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
  }

  render() {
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='settingParticipantRole'
        onRowDoubleClick={this.editRow}
        columns={[
          { name: 'code', title: 'Code' },
          { name: 'displayValue', title: 'Display Value' },
          { name: 'description', title: 'Description' },
          { name: 'isActive', title: 'Status' },
          {
            name: 'action',
            title: 'Action',
          },
        ]}
        // FuncProps={{ pager: false }}
        columnExtensions={[
          {
            columnName: 'isActive',
            sortingEnabled: false,
            type: 'select',
            options: status,
          },
          {
            columnName: 'action',
            sortingEnabled: false,
            align: 'center',
            render: row => {
              return (
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
              )
            },
          },
        ]}
      />
    )
  }
}

export default Grid
