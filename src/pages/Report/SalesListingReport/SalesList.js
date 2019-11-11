import React, { PureComponent } from 'react'
import {
  IntegratedSummary,
} from '@devexpress/dx-react-grid'
import { ReportDataGrid } from '@/components/_medisys'

class SalesList extends PureComponent {
  render () {
    let listData = []
    const { reportDatas } = this.props
    if (!reportDatas)
      return null
    if (reportDatas && reportDatas.SalesDetails) {
      listData = reportDatas.SalesDetails.map(
        (item, index) => ({
          ...item,
          id: `SalesList-${index}-${item.invoiceno}`,
        }),
      )
    }

    const SalesDetailsCols = [
      { name: 'doctorName', title: 'Doctor' },
      { name: 'date', title: 'Date' },
      { name: 'patientID', title: 'Patinet ID' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'itemCategory', title: 'Category' },
      { name: 'item', title: 'Item' },
      { name: 'documentNo', title: 'Document No.' },
      { name: 'qty', title: 'QTY' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'revenueAMT', title: 'Tevenue Amt.' },
      { name: 'cnamt', title: 'CN Amt.' },
    ]
    const SalesDetailsExtensions = [
      { columnName: 'date', type: 'date' },
      { columnName: 'qty', type: 'qty' },
      { columnName: 'unitPrice', type: 'currency', currency: true },
      { columnName: 'revenueAMT', type: 'currency', currency: true },
      { columnName: 'cnamt', type: 'currency', currency: true },
    ]

    let FuncProps = {
      pager: false,
      summary: true,
      summaryConfig: {
        state: {
          totalItems: [
            { columnName: 'unitPrice', type: 'sum' },
            { columnName: 'revenueAMT', type: 'sum' },
            { columnName: 'cnamt', type: 'sum' },
          ],
        },
        integrated: {
          calculator: IntegratedSummary.defaultCalculator,
        },
        row: {
          messages: {
            sum: 'Total',
          },
        },
      },
    }
    let SalesListCols = SalesDetailsCols
    let SalesListColsExtension = SalesDetailsExtensions
    if (reportDatas.ListingDetails[0].groupByDoctor) {
      FuncProps = {
        ...FuncProps,
        summaryConfig: {
          state: {
            totalItems: [],
            groupItems: [
              { columnName: 'unitPrice', type: 'sum' },
              { columnName: 'revenueamt', type: 'sum' },
              { columnName: 'cnamt', type: 'sum' },
            ],
          },
          integrated: {
            calculator: IntegratedSummary.defaultCalculator,
          },
          row: {
            messages: {
              sum: 'Total',
            },
          },
        },
        grouping: true,
        groupingConfig: {
          state: {
            grouping: [
              { columnName: 'doctorName' },
            ],
          },
        },
      }
    }
    return (
      <ReportDataGrid
        height={500}
        data={listData}
        columns={SalesListCols}
        columnExtensions={SalesListColsExtension}
        FuncProps={FuncProps}
      />
    )
  }
}
export default SalesList
