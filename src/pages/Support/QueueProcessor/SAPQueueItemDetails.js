import React, { PureComponent } from 'react'
import * as Yup from 'yup'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
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
  dateFormatLongWithTimeNoSec,
  DatePicker,
  withFormikExtend,
  CommonTableGrid,
} from '@/components'
import { sapQueueItemType, queueItemStatus } from '@/utils/codes'

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
    const { values } = this.props
    return (
      <GridContainer
        style={{
          height: 700,
          alignItems: 'start',
          overflowY: 'scroll',
        }}
      >
        <GridItem xs={4}>
          <Field
            name='type'
            render={args => (
              <Select
                label='Type'
                options={sapQueueItemType}
                allowClear={false}
                {...args}
                disabled
              />
            )}
          />
        </GridItem>
        <GridItem xs={4}>
          <Field
            name='sessionNo'
            render={args => <TextField label='Session No' {...args} disabled />}
          />
        </GridItem>
        <GridItem xs={4}>
          <Field
            name='createDate'
            render={args => (
              <DatePicker
                disabled
                label='Generate Date Time'
                format={dateFormatLongWithTimeNoSec}
                showTime
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs={4}>
          <Field
            name='processedDateTime'
            render={args => (
              <DatePicker
                disabled
                label='Processed Date Time'
                format={dateFormatLongWithTimeNoSec}
                showTime
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs={4}>
          <Field
            name='statusFK'
            render={args => (
              <Select
                label='Status'
                options={queueItemStatus}
                allowClear={false}
                {...args}
                disabled={false}
              />
            )}
          />
        </GridItem>
        <GridItem xs={2}>
          <Field
            name='retryCount'
            render={args => (
              <NumberInput
                label='Retry Count'
                precision={0}
                max={values.maxRetryCount}
                min={0}
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs={2}>
          <Field
            name='maxRetryCount'
            render={args => (
              <NumberInput
                label='Max Retry Count'
                precision={0}
                disabled
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs={12}>
          <Field
            name='parameter'
            render={args => (
              <TextField label='Parameter' multiline disabled {...args} />
            )}
          />
        </GridItem>
        <GridItem xs={12}>
          <Field
            name='data'
            render={args => (
              <TextField label='Request' multiline disabled {...args} />
            )}
          />
        </GridItem>
        <GridItem xs={12}>
          <Field
            name='response'
            render={args => (
              <TextField label='Response' multiline disabled {...args} />
            )}
          />
        </GridItem>
      </GridContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(SAPQueueItemDetails)
