import React, { PureComponent } from 'react'
import { ReportDataGrid } from '@/components/_medisys'

class InventoryGroupDetails extends PureComponent {
  render() {
    let listData = []
    const { reportDatas } = this.props
    if (!reportDatas) return null
    if (reportDatas.InventoryGroupDetails) {
      listData = reportDatas.InventoryGroupDetails.map((item, index) => ({
        ...item,
        id: `InventoryGroupDetails-${index}-${item.inventoryType}`,
      }))
    }
    const FuncProps = {
      pager: false,
      grouping: true,
      groupingConfig: {
        state: {
          grouping: [{ columnName: 'groupName' }],
        },
      },
    }

    const InventoryGroupDetailsColumns = [
      { name: 'groupName', title: 'Date' },
      { name: 'inventoryType', title: 'Type' },
      { name: 'inventoryItem', title: 'Item' },
      { name: 'patientCount', title: 'Patients' },
      { name: 'visitCount', title: 'Visits' },
      {
        name: 'totalQuantity',
        title: 'Total Dispense Quantity',
      },
    ]
    const InventoryGroupDetailsExtensions = [
      { columnName: 'groupName', sortingEnabled: false },
      { columnName: 'inventoryType', sortingEnabled: false },
      { columnName: 'inventoryItem', sortingEnabled: false },
      {
        columnName: 'patientCount',
        sortingEnabled: false,
        type: 'number',
        precision: 0,
      },
      {
        columnName: 'visitCount',
        sortingEnabled: false,
        type: 'number',
        precision: 0,
      },
      {
        columnName: 'totalQuantity',
        sortingEnabled: false,
        type: 'number',
        precision: 1,
      },
    ]

    return (
      <ReportDataGrid
        data={listData}
        columns={InventoryGroupDetailsColumns}
        columnExtensions={InventoryGroupDetailsExtensions}
        FuncProps={FuncProps}
      />
    )
  }
}
export default InventoryGroupDetails
