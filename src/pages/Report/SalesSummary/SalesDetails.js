import React, { PureComponent } from 'react'
import { IntegratedSummary } from '@devexpress/dx-react-grid'

import { ReportDataGrid } from '@/components/_medisys'

class SalesDetails extends PureComponent {
  render() {
    const { reportDatas } = this.props
    if (!reportDatas) return null
    let SalesSummaryDetailsCols = [
      { name: 'doctorName', title: 'Doctor Name' },
      { name: 'salesDate', title: 'Date' },
      { name: 'visit', title: 'Visit' },
    ]
    let SalesSummaryDetailsExtensions = [
      {
        columnName: 'doctorName',
        sortingEnabled: false,
        wordWrapEnabled: true,
      },
      { columnName: 'salesDate', sortingEnabled: false, wordWrapEnabled: true },
      { columnName: 'visit', sortingEnabled: false, wordWrapEnabled: true },
    ]
    let listData = []
    let colInfo = []
    let groupItems = [{ columnName: 'visit', type: 'sum' }]
    let categories = {}
    if (reportDatas.SalesSummaryDetails) {
      for (let cur of reportDatas.SalesSummaryDetails) {
        if (categories[cur.category] === undefined) {
          categories[cur.category] = 0
          SalesSummaryDetailsExtensions.push({
            columnName: cur.category,
            type: 'currency',
            currency: true,
            sortingEnabled: false,
            wordWrapEnabled: true,
          })
          groupItems.push({ columnName: cur.category, type: 'sum' })
          colInfo.push({
            name: cur.category,
            title: cur.category,
            sortOrder: cur.sortOrder,
          })
        }
        if (cur.doctorName && cur.salesDate) {
          const curId = `SalesSummaryDetails-${cur.doctorName}-${cur.salesDate}`
          let record = listData.find(value => value.id === curId)
          if (record) {
            record[cur.category] =
              record[cur.category] === undefined
                ? cur.amount
                : record[cur.category] + cur.amount
            record.visit += cur.visitNum
          } else {
            record = {
              id: curId,
              doctorName: cur.doctorName,
              salesDate: cur.salesDate,
              visit: cur.visitNum,
            }
            record[cur.category] = cur.amount
            listData.push(record)
          }
        }
      }
      colInfo.sort((a, b) => {
        if (a.sortOrder < b.sortOrder) return -1
        return 1
      })
    }
    SalesSummaryDetailsCols = [...SalesSummaryDetailsCols, ...colInfo]

    listData = listData.map(value => ({ ...categories, ...value }))

    const FuncProps = {
      pager: false,
      grouping: true,
      groupingConfig: {
        state: {
          grouping: [{ columnName: 'doctorName' }],
        },
      },
      summary: true,
      summaryConfig: {
        state: {
          totalItems: [],
          groupItems,
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

    return (
      <ReportDataGrid
        data={listData}
        columns={SalesSummaryDetailsCols}
        columnExtensions={SalesSummaryDetailsExtensions}
        FuncProps={FuncProps}
      />
    )
  }
}
export default SalesDetails
