import React, { PureComponent } from 'react'

import { CommonTableGrid, Button, Tooltip } from '@/components'
import { status } from '@/utils/codes'
import Edit from '@material-ui/icons/Edit'

class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingMedicationDosage } = this.props

    const { list } = settingMedicationDosage

    dispatch({
      type: 'settingMedicationDosage/updateState',
      payload: {
        showModal: true,
        entity: list.find((o) => o.id === row.id),
      },
    })
  }

  render () {
    const { height, clinicSettings } = this.props
    const { primaryPrintoutLanguage = 'EN', secondaryPrintoutLanguage = '' } = clinicSettings
    const isUseSecondLanguage = secondaryPrintoutLanguage !== ''
    let columns = [
      { name: 'code', title: 'Code' },
      { name: 'displayValue', title: `Display Value${isUseSecondLanguage ? ` (${primaryPrintoutLanguage})` : ''}` },
      { name: 'translatedDisplayValue', title: `Display Value (${secondaryPrintoutLanguage})` },
      { name: 'description', title: 'Description' },
      { name: 'sortOrder', title: 'Sort Order' },
      { name: 'isActive', title: 'Status' },
      {
        name: 'action',
        title: 'Action',
      },
    ]

    if (!isUseSecondLanguage) {
      columns = columns.filter(c => c.name !== 'translatedDisplayValue')
    }
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='settingMedicationDosage'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        columns={columns}
        columnExtensions={[
          {
            columnName: 'sortOrder',
            render: (row) => {
              return <p>{row.sortOrder === null ? '-' : row.sortOrder}</p>
            },
          },
          {
            columnName: 'isActive',
            sortingEnabled: false,
            type: 'select',
            options: status,
          },
          {
            columnName: 'translatedDisplayValue',
            sortingEnabled: false,
          },
          {
            columnName: 'action',
            align: 'center',
            render: (row) => {
              return (
                <Tooltip title='Edit Medication Dosage' placement='bottom'>
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
        ]}
      />
    )
  }
}

export default Grid
