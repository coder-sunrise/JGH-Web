import React, { PureComponent } from 'react'
import moment from 'moment'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
// common components
import { Table } from '@devexpress/dx-react-grid-material-ui'
import { ReportDataGrid } from '@/components/_medisys'

class VisitList extends PureComponent {
  render() {
    let listData = []
    const { reportDatas } = this.props
    if (!reportDatas) return null
    if (reportDatas && reportDatas.VisitListingDetails) {
      listData = reportDatas.VisitListingDetails.map((item, index) => ({
        ...item,
        id: `VisitListingDetails-${index}-${item.visitDate}`,
      }))
    }
    const VisitListingColumns = [
      { name: 'visitDate', title: 'Date' },
      { name: 'patientReferenceNo', title: 'Ref. No.' },
      { name: 'patientNRIC', title: 'Acc. No.' },
      { name: 'patientName', title: 'Patient Name' },
      { name: 'copayer', title: 'Co-Payer' },
      { name: 'visitPurpose', title: 'Visit Purpose' },
      { name: 'invoiceNo', title: 'Invoice No.' },
      { name: 'doctorName', title: 'Doctor' },
      { name: 'diagnosis', title: 'Diagnosis' },
      { name: 'visitRemarks', title: 'Remarks' },
    ]

    const VisitListingColumnsExtensions = [
      {
        columnName: 'visitDate',
        sortingEnabled: false,
        width: 120,
      },
      { columnName: 'patientReferenceNo', sortingEnabled: false, width: 100 },
      { columnName: 'patientNRIC', sortingEnabled: false, width: 100 },
      { columnName: 'patientName', sortingEnabled: false },
      { columnName: 'copayer', sortingEnabled: false },
      { columnName: 'visitPurpose', sortingEnabled: false },
      { columnName: 'invoiceNo', sortingEnabled: false, width: 100 },
      { columnName: 'doctorName', sortingEnabled: false },
      {
        columnName: 'diagnosis',
        sortingEnabled: false,
        render: row => {
          return (
            <div
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {row.diagnosis}
            </div>
          )
        },
      },
      { columnName: 'visitRemarks', sortingEnabled: false, width: 180 },
    ]
    const SummaryRow = p => {
      const { children } = p
      let countCol = children.find(c => {
        return (
          c.props.tableColumn.column &&
          c.props.tableColumn.column.name === 'visitDate'
        )
      })
      if (countCol) {
        const newChildren = [
          {
            ...countCol,
            props: {
              ...countCol.props,
              colSpan: 3,
            },
            key: 1111,
          },
        ]
        return <Table.Row {...p}>{newChildren}</Table.Row>
      }
      return <Table.Row {...p}>{children}</Table.Row>
    }

    let FuncProps = {
      pager: false,
      summary: true,
      summaryConfig: {
        state: {
          totalItems: [{ columnName: 'visitDate', type: 'visitCount' }],
        },
        integrated: {
          calculator: (type, rows, getValue) => {
            let visitIds = []
            if (type === 'visitCount') {
              if (rows && rows.length > 0) {
                for (let p of rows) {
                  if (!visitIds.includes(p.id)) {
                    visitIds.push(p.id)
                  }
                }
              }
              return visitIds.length
            }
            return IntegratedSummary.defaultCalculator(type, rows, getValue)
          },
        },
        row: {
          totalRowComponent: SummaryRow,
          messages: {
            visitCount: 'Total Number of Visit',
          },
        },
      },
    }

    if (
      reportDatas.VisitListingInfo &&
      reportDatas.VisitListingInfo.length > 0 &&
      (reportDatas.VisitListingInfo[0].isGroupByDoctor ||
        reportDatas.VisitListingInfo[0].isGroupByVisitPurpose ||
        reportDatas.VisitListingInfo[0].isGroupByCopayer)
    ) {
      FuncProps = {
        pager: false,
        summary: true,
        summaryConfig: {
          state: {
            totalItems: [{ columnName: 'visitDate', type: 'visitCount' }],
            groupItems: [{ columnName: 'visitDate', type: 'groupCount' }],
          },
          integrated: {
            calculator: (type, rows, getValue) => {
              let visitIds = []
              if (type === 'visitCount' || type === 'groupCount') {
                if (rows && rows.length > 0) {
                  for (let p of rows) {
                    if (!visitIds.includes(p.id)) {
                      visitIds.push(p.id)
                    }
                  }
                }
                return visitIds.length
              }
              return IntegratedSummary.defaultCalculator(type, rows, getValue)
            },
          },
          row: {
            totalRowComponent: SummaryRow,
            groupRowComponent: SummaryRow,
            messages: {
              groupCount: 'Total Number of Visit',
              visitCount: 'Grand Total Number of Visit',
            },
          },
        },
        grouping: true,
        groupingConfig: {
          state: {
            grouping: [
              {
                columnName: [
                  { prop: 'isGroupByDoctor', columnName: 'doctorName' },
                  { prop: 'isGroupByVisitPurpose', columnName: 'visitPurpose' },
                  { prop: 'isGroupByCopayer', columnName: 'copayer' },
                ].find(g => reportDatas.VisitListingInfo[0][g.prop]).columnName,
              },
            ],
          },
        },
      }
    }
    return (
      <ReportDataGrid
        data={(listData || []).map(o => {
          return { ...o, visitDate: moment(o.visitDate).format('DD MMM YYYY') }
        })}
        columns={VisitListingColumns}
        columnExtensions={VisitListingColumnsExtensions}
        FuncProps={FuncProps}
      />
    )
  }
}
export default VisitList
