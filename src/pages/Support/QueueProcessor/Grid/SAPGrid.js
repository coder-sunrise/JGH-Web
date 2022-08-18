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
import { queueItemStatus, sapQueueItemType } from '@/utils/codes'

@connect(({ sapQueueProcessor }) => ({ sapQueueProcessor }))
class SAPGrid extends PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: 'sapQueueProcessor/query',
    })
  }

  configs = {
    columns: [
      { name: 'type', title: 'Type' },
      { name: 'sessionNo', title: 'Session No' },
      { name: 'statusFK', title: 'Status' },
      { name: 'retry', title: 'Retry' },
      // { name: 'parameter', title: 'Parameter' },
      { name: 'data', title: 'Request Data' },
      { name: 'response', title: 'Response' },
      { name: 'processedDateTime', title: 'Processed Date' },
      { name: 'createDate', title: 'Create Date' },
    ],
    columnExtensions: [
      {
        columnName: 'type',
        width: 220,
        render: row => {
          return sapQueueItemType.find(x => x.value === row.type)?.name
        },
      },
      {
        columnName: 'sessionNo',
        width: 160,
      },
      {
        columnName: 'statusFK',
        width: 110,
        render: row => {
          return queueItemStatus.find(x => x.value === row.statusFK)?.name
        },
      },
      {
        columnName: 'retry',
        width: 70,
        render: row => `${row.retryCount}/${row.maxRetryCount}`,
        sortBy: 'retryCount',
      },
      {
        columnName: 'data',
        render: r => {
          let result = r.data
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
        columnName: 'response',
        render: row => {
          let result = row.response
          let tooltip = result
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
      {
        columnName: 'processedDateTime',
        width: 190,
        type: 'date',
        showTime: true,
      },
      {
        columnName: 'createDate',
        width: 190,
        type: 'date',
        showTime: true,
      },
    ],
  }

  render() {
    const { mainDivHeight = 700 } = this.props
    const filterBarHeight = $('.filterSAPQueueProcessorBar').height() || 0
    const height = Math.max(300, mainDivHeight - 160 - filterBarHeight)
    return (
      <CommonTableGrid
        forceRender
        style={{ margin: 0 }}
        type='sapQueueProcessor'
        {...this.configs}
        TableProps={{
          height,
        }}
      />
    )
  }
}

export default SAPGrid
