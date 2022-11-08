import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import moment from 'moment'
import { sapQueueItemType, queueItemStatus } from '@/utils/codes'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Select,
  ProgressButton,
  CodeSelect,
  DateRangePicker,
  ClinicianSelect,
  TextField,
} from '@/components'

@withFormikExtend({
  mapPropsToValues: () => {},
  handleSubmit: () => {},
  displayName: 'SAPQueueProcessorFilter',
})
class SAPFilter extends PureComponent {
  render() {
    const { classes } = this.props
    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs={6} md={3}>
            <FastField
              name='type'
              render={args => {
                return (
                  <Select label='Type' options={sapQueueItemType} {...args} />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={2}>
            <FastField
              name='statusFK'
              render={args => {
                return (
                  <Select label='Status' options={queueItemStatus} {...args} />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='sessionNo'
              render={args => <TextField label='Session No' {...args} />}
            />
          </GridItem>
          <GridItem xs={6} md={4}>
            <FastField
              name='requestDate'
              render={args => {
                return (
                  <DateRangePicker
                    label='Processed Date From'
                    label2='Processed Date To'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridContainer>

        <GridContainer>
          <GridItem xs={6} md={3}>
            <div className={classes.filterBtn}>
              <ProgressButton
                color='primary'
                icon={<Search />}
                onClick={() => {
                  const {
                    type,
                    sessionNo,
                    requestDate,
                    statusFK,
                  } = this.props.values
                  this.props.dispatch({
                    type: 'sapQueueProcessor/query',
                    payload: {
                      type,
                      sessionNo,
                      lgteql_processedDateTime: requestDate?.length
                        ? moment(requestDate[0]).formatUTC()
                        : undefined,
                      lsteql_processedDateTime: requestDate?.length
                        ? moment(requestDate[1])
                            .endOf('day')
                            .formatUTC(false)
                        : undefined,
                      statusFK,
                    },
                  })
                }}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default SAPFilter
