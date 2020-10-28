import React, { PureComponent } from 'react'

import moment from 'moment'
import { connect } from 'dva'
import { CommonTableGrid, Tooltip, dateFormatLong } from '@/components'
import { queueProcessorType, queueItemStatus } from '@/utils/codes'
import * as service from './services'

@connect(({ queueProcessor }) => ({
  queueProcessor,
}))

class Grid extends PureComponent {
  configs = {
    columns: [
      { name: 'queueProcessTypeFK', title: 'Process Type' },
      { name: 'requestedBy', title: 'Requested By' },
      { name: 'createDate', title: 'Request Date' },
      { name: 'updateDate', title: 'Completed Date' },
      { name: 'queueProcessStatusFK', title: 'Status' },
      { name: 'data', title: 'Request Parameter' },
      { name: 'result', title: 'Result Message' }, 
    ],
    columnExtensions: [
      {
        columnName: 'queueProcessTypeFK', width: 220,
        render: (row) => {
          return queueProcessorType.find(x => x.value === row.queueProcessTypeFK).name
        },
      },
      {
        columnName: 'queueProcessStatusFK', width: 110,
        render: (row) => {
          return queueItemStatus.find(x => x.value === row.queueProcessStatusFK).name
        },
      },
      { columnName: 'requestedBy', width: 140 },
      {
        columnName: 'createDate', width: 180,
        type: 'date',
        showTime: true,
      },
      {
        columnName: 'updateDate', width: 180,
        type: 'date',
        showTime: true,
      },
      {
        columnName: 'data',
        render: (row) => {
          let result = this.formatParameter(row)
          return (
            <Tooltip title={result} placement='top'>
              <div>{result}</div>
            </Tooltip>
          )
        },
        sortingEnabled: false,
      },
      {
        columnName: 'result', width: 260,
        render: (row) => {
          let result = this.formatResultMessage(row)
          let tooltip = this.getTooltip(row)
          return (
            <Tooltip title={tooltip} placement='top'>
              <div>{result}</div>
            </Tooltip>
          )
        },
        sortingEnabled: false,
      },
    ],
  }

  formatParameter = (row) => {
    let type = row.queueProcessTypeFK
    if (type === 1) {
      let parameter = JSON.parse(row.data)
      return `Statement Date: ${moment(parameter.StatementDate).format(dateFormatLong)}, Payment Terms: ${parameter.PaymentTerms} day(s), Invoice Date From: ${parameter.InvoiceDateFrom ? moment(parameter.InvoiceDateFrom).format(dateFormatLong) : '-'}, Invoice Date To: ${parameter.InvoiceDateTo ? moment(parameter.InvoiceDateTo).format(dateFormatLong) : '-'}`
    }
    return ''
  }

  formatResultMessage = (row) => {
    let type = row.queueProcessTypeFK
    if (type === 1) {
      if (row.queueProcessStatusFK === 3) {
        return `${(JSON.parse(row.result) || []).length} statement(s) has been generated`
      }
      if (row.queueProcessStatusFK === 4) {
        return row.result
      }
    }
    return ''
  }

  getTooltip = (row) => {
    let type = row.queueProcessTypeFK
    if (type === 1) {
      if (row.queueProcessStatusFK === 3) {
        let newStatementNo = JSON.parse(row.result)
        if (newStatementNo && newStatementNo.length === 0) {
          return "0 statement(s) has been generated"
        }
        return `New Statement(s): ${newStatementNo.join(', ')}`
      }
    }
    return ''
  }

  render () {
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='queueProcessor'
        {...this.configs}
      />
    )
  }
}

export default Grid
