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
} from '@/components'
import { sapQueueItemType, queueItemStatus } from '@/utils/codes'
import ReactJson from 'react-json-view'

const jsonViewConfig = {
  name: false,
  collapsed: 4,
  displayObjectSize: false,
  displayDataTypes: false,
  quotesOnKeys: false,
}

const jsonViwer = jsonStr => {
  if (!jsonStr) return null
  let jsonObj
  try {
    jsonObj = JSON.parse(jsonStr)
  } catch {
    return null
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
  validationSchema: Yup.object().shape({
    retryCount: Yup.number()
      .min(0, "Can't be less than zero")
      .max(Yup.ref('maxRetryCount'), e => {
        return `Retry count must be less than or equal to ${
          e.max ? e.max.toFixed(1) : e.max
        }`
      })
      .required(),
    statusFK: Yup.number().required(),
  }),
  handleSubmit: (values, { props }) => {
    const { dispatch, onConfirm } = props
    const { ...restValues } = values
    const selectedOptions = {}
    dispatch({
      type: 'settingClinicService/upsert',
      payload: {
        ...values,
      },
    }).then(r => {
      if (r) {
        if (onConfirm) onConfirm()
        dispatch({ type: 'sapQueueProcessor/query' })
      }
    })
  },
  displayName: 'SAPQueueItemDetails',
})
class SAPQueueItemDetails extends PureComponent {
  render() {
    const {
      footer,
      toggleModal,
      retrigger,
      sapQueueProcessor: { currentRow },
      values,
    } = this.props
    const status = queueItemStatus.find(x => x.value == values.statusFK)
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
            {sapQueueItemType.find(x => x.value == values.type).name}
          </Descriptions.Item>
          <Descriptions.Item label='Session No'>
            {values.sessionNo}
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
        </Descriptions>
        {footer &&
          footer({
            cancelProps: {},
            confirmProps: {
              disabled:
                currentRow.statusFK != 4 ||
                currentRow.retryCount != currentRow.maxRetryCount,
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
