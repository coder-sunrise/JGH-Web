import React, { PureComponent } from 'react'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import { ReportDataGrid } from '@/components/_medisys'
import { filter } from 'lodash'

class PartialDispenseList extends PureComponent {
  render() {
    let listData = []
    const { reportDatas } = this.props
    if (!reportDatas) return null
    if (reportDatas.PartialDispenseDetails) {
      listData = reportDatas.PartialDispenseDetails.map((item, index) => ({
        ...item,
        id: `PartialDispenseDetails-${index}`,
      }))
    }
    let groupByItems = []
    let PartialDispenseExtensions = []
    let PartialDispenseColumns = [
      { name: 'orderDate', title: 'Order Date' },
      { name: 'patientReferenceNo', title: 'Ref. No' },
      { name: 'patientAccountNo', title: 'Acc. No' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'patientContactNo', title: 'Contact No.' },
    ]
    if (
      reportDatas.PartialDispenseParameter[0].groupByItem &&
      reportDatas.PartialDispenseDetails.length > 0
    ) {
      PartialDispenseColumns = [
        {
          name: 'groupingItems',
          title: (
            <text>{reportDatas.PartialDispenseDetails[0].inventoryType}</text>
          ),
        },
        ...PartialDispenseColumns,
      ]
      groupByItems = [{ columnName: 'groupingItems' }, ...groupByItems]
    } else {
      PartialDispenseColumns = [
        ...PartialDispenseColumns,
        { name: 'inventoryType', title: 'Type' },
        { name: 'inventoryCode', title: 'Item Code' },
        { name: 'inventoryName', title: 'Item Name' },
      ]

      PartialDispenseExtensions = [
        ...PartialDispenseExtensions,
        { columnName: 'inventoryType', width: 120 },
        {
          columnName: 'inventoryCode',
          width: 120,
        },
        { columnName: 'inventoryName', width: 150 },
      ]
    }
    PartialDispenseColumns = [
      ...PartialDispenseColumns,
      {
        name: 'orderedQty',
        title: (
          <div>
            <p style={{ height: 16 }}>Ordered</p>
            <p style={{ height: 16 }}>Qty.</p>
          </div>
        ),
      },
      {
        name: 'dispensedQty',
        title: (
          <div>
            <p style={{ height: 16 }}>Dispensed</p>
            <p style={{ height: 16 }}>Qty.</p>
          </div>
        ),
      },
      {
        name: 'owingQty',
        title: (
          <div>
            <p style={{ height: 16 }}>Owing</p>
            <p style={{ height: 16 }}>Qty.</p>
          </div>
        ),
      },
      { name: 'uom', title: 'UOM' },
      { name: 'visitDoctor', title: 'Visit Doctor' },
    ]
    PartialDispenseExtensions = [
      {
        columnName: 'orderDate',
        type: 'date',
        width: 120,
      },
      { columnName: 'patientReferenceNo', width: 130 },
      { columnName: 'patientAccountNo', width: 150 },

      { columnName: 'patientContactNo', width: 150 },
      {
        columnName: 'orderedQty',
        type: 'number',
        precision: 1,
        width: 100,
      },
      {
        columnName: 'dispensedQty',
        type: 'number',
        precision: 1,
        width: 100,
      },
      {
        columnName: 'owingQty',
        type: 'number',
        precision: 1,
        width: 100,
      },
      { columnName: 'uom', width: 120 },
      { columnName: 'visitDoctor', width: 120 },
      ...PartialDispenseExtensions,
    ]

    const FuncProps = {
      pager: false,
      summary: false,
      grouping: true,
      groupingConfig: {
        state: {
          grouping: groupByItems,
        },
      },
    }
    return (
      <ReportDataGrid
        data={listData}
        columns={PartialDispenseColumns}
        columnExtensions={PartialDispenseExtensions}
        FuncProps={FuncProps}
      />
    )
  }
}
export default PartialDispenseList
