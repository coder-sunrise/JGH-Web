import React, { PureComponent } from 'react'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
import { ReportDataGrid } from '@/components/_medisys'

class InvoiceList extends PureComponent {
  render() {
    let listData = []
    const { reportDatas } = this.props
    if (!reportDatas) return null
    const { groupBy } = reportDatas.ListingDetails[0]
    if (reportDatas && reportDatas.InvoiceListing) {
      listData = reportDatas.InvoiceListing.map((item, index) => ({
        ...item,
        id: `InvoiceListing-${index}-${item.invoiceno}`,
      }))
    }

    const InvoiceListingCols = [
      { name: 'invoiceDate', title: 'Date' },
      { name: 'invoiceNo', title: 'Invoice No.' },
      { name: 'doctorName', title: 'Doctor' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'invoiceAmt', title: 'Amount(Bef. GST)' },
      { name: 'gstAmt', title: 'GST' },
      { name: 'adj', title: 'ADJ' },
      { name: 'patientPayable', title: 'Patient Payable' },
      { name: 'copayer', title: 'Co-Payer' },
      { name: 'copayerPayable', title: 'Co-Payer Payable' },
    ]
    const InvoiceListingExtensions = [
      {
        columnName: 'invoiceDate',
        type: 'date',
        sortingEnabled: false,
        width: 120,
      },
      { columnName: 'invoiceNo', sortingEnabled: false, width: 100 },
      {
        columnName: 'doctorName',
        sortingEnabled: false,
        wordWrapEnabled: true,
      },
      {
        columnName: 'patientName',
        sortingEnabled: false,
        wordWrapEnabled: true,
      },
      {
        columnName: 'invoiceAmt',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 140,
      },
      {
        columnName: 'gstAmt',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 140,
        wordWrapEnabled: true,
      },
      {
        columnName: 'adj',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 140,
        wordWrapEnabled: true,
      },
      {
        columnName: 'patientPayable',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 140,
        wordWrapEnabled: true,
      },
      { columnName: 'copayer', sortingEnabled: false, wordWrapEnabled: true },
      {
        columnName: 'copayerPayable',
        type: 'currency',
        currency: true,
        sortingEnabled: false,
        width: 140,
        wordWrapEnabled: true,
      },
    ]
    const sumItems = [
      { columnName: 'invoiceAmt', type: 'sum' },
      { columnName: 'gstAmt', type: 'sum' },
      { columnName: 'adj', type: 'sum' },
      { columnName: 'patientPayable', type: 'sum' },
      {
        columnName: 'copayerPayable',
        type: 'copayerPayable',
      },
    ]
    let FuncProps = {
      pager: false,
    }
    let InvoiceListCols = InvoiceListingCols
    let InvoiceListColsExtension = InvoiceListingExtensions
    if (groupBy === 'Doctor') {
      FuncProps = {
        ...FuncProps,
        summaryConfig: {
          state: {
            totalItems: [],
            groupItems: sumItems,
          },
          integrated: {
            calculator: (type, rows, getValue) => {
              if (type == 'copayerPayable') {
                return rows.reduce((acc, row) => acc + (row[type] || 0), 0)
              }
              return IntegratedSummary.defaultCalculator(type, rows, getValue)
            },
          },
          row: {
            messages: {
              sum: 'Total',
              copayerPayable: 'Total',
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
    } else if (groupBy === 'Company') {
      InvoiceListCols = [
        ...InvoiceListingCols,
        { name: 'company', title: 'Co-Payer' },
      ]
      InvoiceListColsExtension = [
        ...InvoiceListingExtensions,
        { columnName: 'Company', sortingEnabled: false, wordWrapEnabled: true },
      ]
      FuncProps = {
        ...FuncProps,
        summaryConfig: {
          state: {
            totalItems: [],
            groupItems: sumItems,
          },
          integrated: {
            calculator: (type, rows, getValue) => {
              if (type == 'copayerPayable') {
                return rows.reduce((acc, row) => acc + (row[type] || 0), 0)
              }
              return IntegratedSummary.defaultCalculator(type, rows, getValue)
            },
          },
          row: {
            messages: {
              sum: 'Total',
              copayerPayable: 'Total',
            },
          },
        },
        grouping: true,
        groupingConfig: {
          state: {
            grouping: [{ columnName: 'company' }],
          },
          row: {
            contentComponent: ({ column, row }) => (
              <span>
                <strong>{row.value ? column.title : ''}</strong>
                {row.value ? `: ${row.value}` : 'Private Patient Invoices'}
              </span>
            ),
          },
        },
      }
    } else {
      FuncProps = {
        pager: false,
        summary: true,
        summaryConfig: {
          state: {
            totalItems: sumItems,
          },
          integrated: {
            calculator: (type, rows, getValue) => {
              if (type == 'copayerPayable') {
                return rows.reduce((acc, row) => acc + (row[type] || 0), 0)
              }
              return IntegratedSummary.defaultCalculator(type, rows, getValue)
            },
          },
          row: {
            messages: {
              sum: 'Total',
              copayerPayable: 'Total',
            },
          },
        },
      }
    }
    return (
      <ReportDataGrid
        data={listData}
        columns={InvoiceListCols}
        columnExtensions={InvoiceListColsExtension}
        FuncProps={FuncProps}
      />
    )
  }
}
export default InvoiceList
