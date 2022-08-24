import React, { PureComponent } from 'react'
import * as Yup from 'yup'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
import { Descriptions } from 'antd'
import moment from 'moment'
import {
  CardContainer,
  Tabs,
  CommonModal,
  GridContainer,
  GridItem,
  TextField,
  Field,
  Select,
  NumberInput,
  dateFormatLongWithTime,
  DatePicker,
  withFormikExtend,
  CommonTableGrid,
  Button,
  Tooltip,
} from '@/components'
import {
  sapQueueItemType,
  sapQueueBatchType,
  queueItemStatus,
} from '@/utils/codes'
import ReactJson from 'react-json-view'

const jsonViewConfig = {
  name: false,
  collapsed: 4,
  displayObjectSize: false,
  displayDataTypes: false,
  quotesOnKeys: false,
  enableClipboard: false,
}

const jsonViwer = jsonStr => {
  if (!jsonStr) return null
  let jsonObj
  try {
    jsonObj = JSON.parse(jsonStr)
  } catch {
    return jsonStr
  }
  return <ReactJson {...jsonViewConfig} src={jsonObj} />
}

const styles = theme => ({
  ...basicStyle(theme),
})

@connect(({ sapQueueProcessor }) => ({
  sapQueueProcessor,
}))
@withFormikExtend({
  mapPropsToValues: ({ sapQueueProcessor }) => sapQueueProcessor.entity || {},
  displayName: 'SAPQueueItemDetails',
})
class SAPQueueItemDetails extends PureComponent {
  render() {
    const {
      footer,
      toggleModal,
      retrigger,
      sapQueueProcessor: {
        currentRow,
        filter: { apiCriteria: { type } = {} } = {},
      },
      values,
    } = this.props
    const status = queueItemStatus.find(x => x.value === values.statusFK)
    const itemType = sapQueueItemType.find(x => x.value === values.type)
    return (
      <div>
        <Descriptions
          bordered
          size='small'
          style={{
            height: 700,
            alignItems: 'start',
            overflowY: 'scroll',
            marginBottom: 20,
          }}
        >
          <Descriptions.Item label='Type'>
            {itemType?.name ?? type}
          </Descriptions.Item>
          <Descriptions.Item label='Session No'>
            {values.sessionNo || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Generate Date Time'>
            {moment(values.createDate).format(dateFormatLongWithTime)}
          </Descriptions.Item>
          <Descriptions.Item label='Status'>
            <span style={{ color: status.color }}>{status.name}</span>
          </Descriptions.Item>
          <Descriptions.Item label='Retry'>
            {values.retryCount}/{values.maxRetryCount}
          </Descriptions.Item>
          <Descriptions.Item label='Processed Date Time'>
            {moment(values.processedDateTime).format(dateFormatLongWithTime)}
          </Descriptions.Item>
          <Descriptions.Item label='Parameter' span={3}>
            {jsonViwer(values.parameter)}
          </Descriptions.Item>
          <Descriptions.Item label='Request' span={3}>
            {jsonViwer(values.data)}
          </Descriptions.Item>
          <Descriptions.Item label='Response' span={3}>
            {jsonViwer(values.response)}
          </Descriptions.Item>
          <Descriptions.Item label='Exception' span={3}>
            {jsonViwer(values.exception)}
          </Descriptions.Item>
          {values.batches &&
            sapQueueBatchType.some(x => x.value === values.type) && (
              <Descriptions.Item label='Failed Batches' span={3}>
                {jsonViwer(values.batches)}
              </Descriptions.Item>
            )}
        </Descriptions>
        {footer &&
          footer({
            cancelProps: {},
            confirmProps: {
              disabled:
                currentRow.statusFK != 4 ||
                currentRow.retryCount != currentRow.maxRetryCount ||
                (currentRow.maxRetryCount ?? 0) <= 0,
            },
            onConfirm: () => {
              retrigger(currentRow).then(r => {
                toggleModal()
              })
            },
            confirmBtnText: 'Retrigger',
          })}
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(SAPQueueItemDetails)
