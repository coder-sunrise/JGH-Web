import React, { PureComponent } from 'react'
import $ from 'jquery'
import moment from 'moment'
import { connect } from 'dva'
import { List } from '@material-ui/icons'
import {
  CommonTableGrid,
  Tooltip,
  dateFormatLong,
  dateFormatLongWithTime,
  Button,
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
      { name: 'createDate', title: 'Create Date' },
      { name: 'processedDateTime', title: 'Processed Date' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      {
        columnName: 'type',
        width: 220,
        render: row => {
          return sapQueueItemType.find(
            x => x.value === row.type.replace('Realtime_', ''),
          )?.name
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
          const status = queueItemStatus.find(x => x.value === row.statusFK)
          return <span style={{ color: status.color }}>{status.name}</span>
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
        columnName: 'createDate',
        width: 190,
        type: 'date',
        showTime: true,
        format: dateFormatLongWithTime,
      },
      {
        columnName: 'processedDateTime',
        width: 190,
        type: 'date',
        showTime: true,
        format: dateFormatLongWithTime,
      },
      {
        columnName: 'action',
        align: 'center',
        render: row => {
          const { retrigger } = this.props
          return (
            <div>
              <Tooltip title='Details'>
                <Button
                  size='sm'
                  color='primary'
                  justIcon
                  disabled={false}
                  onClick={() => this.editRow(row)}
                >
                  <List />
                </Button>
              </Tooltip>
              <Tooltip title='Retrigger'>
                <Button
                  size='sm'
                  color='primary'
                  justIcon
                  disabled={
                    row.statusFK != 4 || row.retryCount != row.maxRetryCount
                  }
                  onClick={() => retrigger(row)}
                >
                  RE
                </Button>
              </Tooltip>
            </div>
          )
        },
      },
    ],
  }

  editRow = async row => {
    const { toggleModal, dispatch } = this.props
    const queueItem = await dispatch({
      type: 'sapQueueProcessor/queryOne',
      payload: {
        id: row.id,
      },
    })

    if (queueItem) {
      dispatch({
        type: 'sapQueueProcessor/updateState',
        payload: {
          entity: queueItem,
          currentRow: row,
        },
      })
      toggleModal()
    }
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
        onRowDoubleClick={row => this.editRow(row)}
        {...this.configs}
        TableProps={{
          height,
        }}
      />
    )
  }
}

export default SAPGrid
