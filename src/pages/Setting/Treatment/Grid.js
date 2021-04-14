import React, { PureComponent } from 'react'
import Edit from '@material-ui/icons/Edit'
import { status } from '@/utils/codes'
import { CommonTableGrid, Button, Tooltip } from '@/components'
import Legend from '@/pages/Widgets/DentalChart/Setup/Legend'

class Grid extends PureComponent {
  configs = {
    columns: [
      { name: 'code', title: 'Code' },
      { name: 'displayValue', title: 'Display Value' },
      { name: 'description', title: 'Description' },
      { name: 'chartMethodDisplayValue', title: 'Chart Method' },
      { name: 'costPrice', title: 'Cost' },
      { name: 'sellingPrice', title: 'Unit Selling Price' },
      { name: 'treatmentCategoryDisplayValue', title: 'Treatment Category' },
      { name: 'revenueCategoryDisplayValue', title: 'Revenue Category' },
      { name: 'isActive', title: 'Status' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      { columnName: 'code', sortBy: 'code' },
      {
        columnName: 'displayValue',
        sortBy: 'displayValue',
      },
      {
        columnName: 'description',
        sortBy: 'description',
      },
      {
        columnName: 'chartMethodDisplayValue',
        sortBy: 'chartMethod.displayValue',
        render: (row) => {
          const { chartMethod } = row
          if (chartMethod) {
            return (
              <div style={{ lineHeight: '26px' }}>
                <Legend row={chartMethod} viewOnly />
                <span style={{ marginLeft: 8 }}>
                  {chartMethod.displayValue}
                </span>
              </div>
            )
          }
          return ''
        },
      },
      {
        columnName: 'costPrice',
        type: 'currency',
      },
      {
        columnName: 'sellingPrice',
        type: 'currency',
      },
      {
        columnName: 'treatmentCategoryDisplayValue',
        sortBy: 'treatmentCategoryDisplayValue',
        width: 150,
        render: (row) => {
          const { treatmentCategory } = row
          if (treatmentCategory) {
            return treatmentCategory.displayValue
          }
          return ''
        },
      },
      {
        columnName: 'revenueCategoryDisplayValue',
        sortBy: 'revenueCategoryDisplayValue',
        width: 150,
        render: (row) => {
          const { revenueCategory } = row
          if (revenueCategory) {
            return revenueCategory.displayValue
          }
          return ''
        },
      },
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
        width: 80,
        render: (row) => {
          return (
            <Tooltip title='Edit Treatment'>
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
    ],
  }

  editRow = (row, e) => {
    const { dispatch, settingTreatment } = this.props
    const { list } = settingTreatment
    dispatch({
      type: 'settingTreatment/updateState',
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
        type='settingTreatment'
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
