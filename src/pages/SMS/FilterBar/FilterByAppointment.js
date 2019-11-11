import React from 'react'
import { formatMessage } from 'umi/locale'
// formik
import { FastField, Field } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  Checkbox,
  GridItem,
  DatePicker,
  Select,
  CodeSelect,
} from '@/components'
// medisys component
import { AppointmentTypeLabel } from '@/components/_medisys'

const styles = (theme) => ({
  checkbox: {
    paddingTop: `${theme.spacing(2)}px !important`,
  },
})
const FilterByAppointment = ({ classes, values }) => {
  const { appointmentType = [] } = values
  const maxAppointmentTagCount = appointmentType.length <= 1 ? 1 : 0
  return (
    <React.Fragment>
      <GridItem xs={2}>
        <FastField
          name='Start'
          render={(args) => (
            <DatePicker
              label={formatMessage({ id: 'sms.from' })}
              timeFormat={false}
              {...args}
            />
          )}
        />
      </GridItem>
      <GridItem xs={2}>
        <FastField
          name='End'
          render={(args) => (
            <DatePicker
              label={formatMessage({ id: 'sms.to' })}
              timeFormat={false}
              {...args}
            />
          )}
        />
      </GridItem>
      <GridItem xs={4}>
        <Field
          name='appointmentType'
          render={(args) => (
            <CodeSelect
              {...args}
              mode='multiple'
              allowClear={false}
              all={-99}
              label='Filter by Appointment Type'
              code='ctappointmenttype'
              labelField='displayValue'
              renderDropdown={(option) => (
                <AppointmentTypeLabel
                  color={option.tagColorHex}
                  label={option.displayValue}
                />
              )}
              defaultOptions={[
                {
                  isExtra: true,
                  id: -99,
                  displayValue: 'All appointment types',
                },
              ]}
              maxTagCount={maxAppointmentTagCount}
              maxTagPlaceholder='appointment types'
            />
          )}
        />
      </GridItem>

      <GridItem xs={4}>
        <FastField
          name='Doctor'
          render={(args) => {
            return (
              <Select
                mode='multiple'
                label={formatMessage({
                  id: 'sms.doctor',
                })}
                options={[
                  {
                    name: 'Dr Levine',
                    value: 'Dr Levine',
                  },
                  {
                    name: 'Dr Heloo',
                    value: 'Dr Heloo',
                  },
                ]}
                {...args}
              />
            )
          }}
        />
      </GridItem>
      <GridItem xs={2}>
        <FastField
          name='AppointmentStatus'
          render={(args) => {
            return (
              <Select
                label={formatMessage({
                  id: 'sms.appointment.status',
                })}
                options={[
                  {
                    name: 'Confirmed',
                    value: 'Confirmed',
                  },
                  {
                    name: 'Unknown',
                    value: 'Unknown',
                  },
                ]}
                {...args}
              />
            )
          }}
        />
      </GridItem>

      <GridItem xs={4} className={classes.checkbox}>
        <FastField
          name='ExcludeSent'
          render={(args) => (
            <Checkbox
              simple
              label={formatMessage({
                id: 'sms.appointment.exclude',
              })}
              {...args}
            />
          )}
        />
      </GridItem>
      <GridItem md={6} />
      <GridItem xs={2}>
        <FastField
          name='SMSStatus'
          render={(args) => {
            return (
              <Select
                label={formatMessage({
                  id: 'sms.status',
                })}
                options={[
                  {
                    name: 'Sent',
                    value: 'Sent',
                  },
                  {
                    name: 'Pending',
                    value: 'Pending',
                  },
                ]}
                {...args}
              />
            )
          }}
        />
      </GridItem>

      <GridItem xs={2}>
        <FastField
          name='MessageStatus'
          render={(args) => {
            return (
              <Select
                label={formatMessage({
                  id: 'sms.message.status',
                })}
                options={[
                  {
                    name: 'Read',
                    value: 'Read',
                  },
                  {
                    name: 'Unread',
                    value: 'Unread',
                  },
                ]}
                {...args}
              />
            )
          }}
        />
      </GridItem>
    </React.Fragment>
  )
}

export default withStyles(styles, { name: 'FilterByAppointment' })(
  FilterByAppointment,
)
