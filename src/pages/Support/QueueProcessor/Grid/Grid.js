import React, { PureComponent } from 'react'
import $ from 'jquery'
import moment from 'moment'
import { connect } from 'dva'
import {
  CommonTableGrid,
  Tooltip,
  dateFormatLong,
  dateFormatLongWithTime12h,
} from '@/components'
import { queueProcessorType, queueItemStatus } from '@/utils/codes'

@connect(({ queueProcessor }) => ({ queueProcessor }))
class Grid extends PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: 'queueProcessor/query',
    })
  }

  configs = {
    columns: [
      { name: 'queueName', title: 'Process Type' },
      { name: 'requestedBy', title: 'Requested By' },
      { name: 'createDate', title: 'Request Date' },
      { name: 'updateDate', title: 'Completed Date' },
      { name: 'queueProcessStatusFK', title: 'Status' },
      { name: 'data', title: 'Request Parameter' },
      { name: 'result', title: 'Result Message' },
    ],
    columnExtensions: [
      {
        columnName: 'queueName',
        width: 220,
      },
      {
        columnName: 'queueProcessStatusFK',
        width: 110,
        render: row => {
          return queueItemStatus.find(x => x.value === row.queueProcessStatusFK)
            .name
        },
      },
      {
        columnName: 'requestedBy',
        width: 140,
        sortBy: 'CreateByUserFkNavigation.ClinicianProfile.Name',
      },
      {
        columnName: 'createDate',
        width: 190,
        type: 'date',
        showTime: true,
      },
      {
        columnName: 'updateDate',
        width: 190,
        type: 'date',
        showTime: true,
        render: row => {
          if (
            row.queueProcessStatusFK === 3 ||
            row.queueProcessStatusFK === 4
          ) {
            return moment(row.updateDate).format(dateFormatLongWithTime12h)
          }
          return undefined
        },
      },
      {
        columnName: 'data',
        render: row => {
          let result = this.formatParameter(row)
          return (
            <Tooltip title={result} placement='top'>
              <div
                style={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {result}
              </div>
            </Tooltip>
          )
        },
        sortingEnabled: false,
      },
      {
        columnName: 'result',
        width: 260,
        render: row => {
          let result = this.formatResultMessage(row)
          let tooltip = this.getTooltip(row)
          return (
            <Tooltip title={tooltip} placement='top'>
              <div
                style={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {result}
              </div>
            </Tooltip>
          )
        },
        sortingEnabled: false,
      },
    ],
  }

  formatParameter = row => {
    let type = row.queueProcessTypeFK
    const { clinicSettings } = this.props
    const { systemTimeZoneInt } = clinicSettings.settings
    if (type === 1) {
      let parameter = JSON.parse(row.data)
      return `Statement Date: ${moment
        .utc(parameter.StatementDate)
        .add(systemTimeZoneInt, 'hours')
        .format(dateFormatLong)}
      , Payment Terms: ${parameter.PaymentTerms} day(s)
      , Invoice Date From: ${
        parameter.InvoiceDateFrom
          ? moment
              .utc(parameter.InvoiceDateFrom)
              .add(systemTimeZoneInt, 'hours')
              .format(dateFormatLong)
          : '-'
      }
      , Invoice Date To: ${
        parameter.InvoiceDateTo
          ? moment
              .utc(parameter.InvoiceDateTo)
              .add(systemTimeZoneInt, 'hours')
              .format(dateFormatLong)
          : '-'
      }`
    }
    return ''
  }

  formatResultMessage = row => {
    let type = row.queueProcessTypeFK
    if (type === 1) {
      if (row.queueProcessStatusFK === 3) {
        return `${
          (JSON.parse(row.result) || []).length
        } statement(s) has been generated`
      }
      if (row.queueProcessStatusFK === 4) {
        return row.result
      }
    }
    return ''
  }

  getTooltip = row => {
    let type = row.queueProcessTypeFK
    if (type === 1) {
      if (row.queueProcessStatusFK === 3) {
        let newStatementNo = JSON.parse(row.result)
        if (newStatementNo && newStatementNo.length === 0) {
          return '0 statement(s) has been generated'
        }
        return `New Statement(s): ${newStatementNo.join(', ')}`
      }
    }
    return ''
  }

  render() {
    const { mainDivHeight = 700 } = this.props
    const filterBarHeight = $('.filterQueueProcessorBar').height() || 0
    const height = Math.max(300, mainDivHeight - 160 - filterBarHeight)
    return (
      <CommonTableGrid
        forceRender
        style={{ margin: 0 }}
        type='queueProcessor'
        {...this.configs}
        TableProps={{
          height,
        }}
      />
    )
  }
}

export default Grid
