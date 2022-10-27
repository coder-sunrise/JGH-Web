import React, { PureComponent } from 'react'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
import { ReportDataGrid } from '@/components/_medisys'

class SalesList extends PureComponent {
  render() {
    let listData = []
    const { height, reportDatas } = this.props
    if (!reportDatas) return null
    if (reportDatas && reportDatas.SalesDetails) {
      listData = reportDatas.SalesDetails.map((item, index) => ({
        ...item,
        id: `SalesList-${index}-${item.invoiceno}`,
      }))
    }

    const SalesDetailsCols = [
      { name: 'doctorName', title: 'Doctor' },
      { name: 'date', title: 'Date' },
      { name: 'patientID', title: 'Patient ID' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'itemCategory', title: 'Category' },
      { name: 'item', title: 'Item' },
      { name: 'documentNo', title: 'Invoice No.' },
      { name: 'qty', title: 'Qty' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'adj', title: 'Adj.' },
      { name: 'revenueAMT', title: 'Revenue Amt.' },
      { name: 'cnamt', title: 'CN Amt.' },
    ]
    const SalesDetailsExtensions = [
      { columnName: 'date', type: 'date', sortingEnabled: false, width: 100 },
      { columnName: 'qty', type: 'number', sortingEnabled: false, width: 100 },
      {
        columnName: 'unitPrice',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 140,
      },
      {
        columnName: 'adj',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 100,
      },
      {
        columnName: 'revenueAMT',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 180,
        wordWrapEnabled: true,
      },
      {
        columnName: 'cnamt',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 180,
        wordWrapEnabled: true,
      },
      {
        columnName: 'doctorName',
        sortingEnabled: false,
        wordWrapEnabled: true,
      },
      { columnName: 'patientID', sortingEnabled: false, width: 100 },
      {
        columnName: 'patientName',
        sortingEnabled: false,
        wordWrapEnabled: true,
      },
      {
        columnName: 'itemCategory',
        sortingEnabled: false,
        wordWrapEnabled: true,
        width: 120,
      },
      { columnName: 'item', sortingEnabled: false, wordWrapEnabled: true },
      {
        columnName: 'documentNo',
        sortingEnabled: false,
        wordWrapEnabled: true,
      },
    ]

    let FuncProps = {
      pager: false,
      summary: true,
      summaryConfig: {
        state: {
          totalItems: [
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
        grouping: true,
        groupingConfig: {
          state: {
            grouping: [{ columnName: 'doctorName' }],
          },
        },
      }
    }
    return (
      <ReportDataGrid
        data={listData}
        columns={SalesListCols}
        columnExtensions={SalesListColsExtension}
        FuncProps={FuncProps}
      />
    )
  }
}
export default SalesList
