import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import moment from 'moment'
import { queueProcessorType, queueItemStatus } from '@/utils/codes'
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
} from '@/components'

@withFormikExtend({
  mapPropsToValues: () => {},
  handleSubmit: () => {},
  displayName: 'QueueProcessorFilter',
})
class Filter extends PureComponent {
  render() {
    const { classes } = this.props
    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs={6} md={4}>
            <FastField
              name='queueProcessTypeFK'
              render={args => {
                return (
                  <CodeSelect
                    label='Process Type'
                    options={queueProcessorType}
                    {...args}
                    valueField='value'
                    all={-99}
                    defaultOptions={[
                      {
                        isExtra: true,
                        id: -99,
                        displayValue: 'All',
                      },
                    ]}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={4}>
            <FastField
              name='requestDate'
              render={args => {
                return (
                  <DateRangePicker
                    label='Request Date From'
                    label2='Request Date To'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={4}>
            <FastField
              name='createByUserFK'
              render={args => {
                return (
                  <ClinicianSelect
                    noDefaultValue
                    label='Requested By'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={4}>
            <FastField
              name='queueProcessStatusFK'
              render={args => {
                return (
                  <Select label='Status' options={queueItemStatus} {...args} />
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
                    queueProcessStatusFK,
                    createByUserFK,
                    queueProcessTypeFK,
                    requestDate,
                  } = this.props.values
                  this.props.dispatch({
                    type: 'queueProcessor/query',
                    payload: {
                      queueProcessStatusFK,
                      queueProcessTypeFK,
                      createByUserFK,
                      lgteql_createDate: requestDate?.length
                        ? moment(requestDate[0]).formatUTC()
                        : undefined,
                      lsteql_createDate: requestDate?.length
                        ? moment(requestDate[1])
                            .endOf('day')
                            .formatUTC(false)
                        : undefined,
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

export default Filter
