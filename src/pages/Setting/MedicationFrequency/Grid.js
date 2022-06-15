import React, { PureComponent } from 'react'
import { CommonTableGrid, Button, Tooltip } from '@/components'
import { status } from '@/utils/codes'
import Edit from '@material-ui/icons/Edit'
import { SYSTEM_LANGUAGE } from '@/utils/constants'
class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingMedicationFrequency } = this.props

    const { list } = settingMedicationFrequency

    dispatch({
      type: 'settingMedicationFrequency/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
  }

  render() {
    const { height, clinicSettings } = this.props
    const {
      primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const isUseSecondLanguage =
      primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
      secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
    let columns = [
      { name: 'code', title: 'Code' },
      {
        name: 'displayValue',
        title: `Display Value${
          isUseSecondLanguage ? ` (${SYSTEM_LANGUAGE.PRIMARYLANGUAGE})` : ''
        }`,
      },
      {
        name: 'translatedDisplayValue',
        title: `Display Value (${SYSTEM_LANGUAGE.SECONDLANGUAGE})`,
      },
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
        type='settingMedicationFrequency'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        columns={columns}
        columnExtensions={[
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
            sortingEnabled: false,
            align: 'center',
            render: row => {
              return (
                <Tooltip title='Edit Medication Frequency' placement='bottom'>
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
