import React from 'react'
import { formatMessage } from 'umi'
// formik
import { FastField, Field } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  Checkbox,
  GridItem,
  Select,
  CodeSelect,
  DateRangePicker,
} from '@/components'
// medisys component
import { AppointmentTypeLabel, DoctorLabel } from '@/components/_medisys'
import { smsStatus, messageStatus, appointmentStatus } from '@/utils/codes'
import Authorized from '@/utils/Authorized'

const styles = theme => ({
  checkbox: {
    position: 'relative',
    top: '24px',
  },
})
const FilterByAppointment = ({ classes, values, setFieldValue }) => {
  const { appointmentType = [], doctor = [] } = values
  const maxAppointmentTagCount = appointmentType.length <= 1 ? 1 : 0
  const maxDoctorTagCount = doctor.length <= 1 ? 1 : 0
  return (
    <React.Fragment>
      <GridItem md={4}>
        <Field
          name='upcomingAppointmentDate'
          render={args => (
            <DateRangePicker
              {...args}
              label='Upcoming Appointment From'
              label2='To'
              onChange={e => {
                if (e.length === 0)
                  setFieldValue('upcomingAppointmentDate', undefined)
              }}
            />
          )}
        />
      </GridItem>
      <GridItem xs={4}>
        <Field
          name='appointmentType'
          render={args => {
            return (
              <CodeSelect
                {...args}
                mode='multiple'
                all={-99}
                label='Filter by Appointment Type'
                code='ctappointmenttype'
                labelField='displayValue'
                renderDropdown={option => (
                  <AppointmentTypeLabel
                    color={option.tagColorHex}
                    label={option.displayValue}
                  />
                )}
                filter={{
                  'clinicianProfile.isActive': true,
                }}
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
            )
          }}
        />
      </GridItem>

      <GridItem xs={4}>
        <FastField
          name='doctor'
          render={args => {
            return (
              <Authorized authority='appointment.viewotherappointment'>
                <CodeSelect
                  label={formatMessage({
                    id: 'sms.doctor',
                  })}
                  allValue={-99}
                  allValueOption={{
                    clinicianProfile: {
                      name: 'All',
                      id: -99,
                    },
                  }}
                  code='doctorProfile'
                  mode='multiple'
                  labelField='clinicianProfile.name'
                  valueField='clinicianProfile.id'
                  maxTagCount={maxDoctorTagCount}
                  maxTagPlaceholder='doctors'
                  renderDropdown={option => <DoctorLabel doctor={option} />}
                  {...args}
                />
              </Authorized>
            )
          }}
        />
      </GridItem>
      <GridItem xs={2}>
        <FastField
          name='appointmentStatus'
          render={args => {
            return (
              <Select
                label={formatMessage({
                  id: 'sms.appointment.status',
                })}
                options={appointmentStatus}
                {...args}
              />
            )
          }}
        />
      </GridItem>

      <GridItem xs={4}>
        <div className={classes.checkbox}>
          <FastField
            name='isExcludeReminderSent'
            render={args => (
              <Checkbox
                simple
                label={formatMessage({
                  id: 'sms.appointment.exclude',
                })}
                {...args}
              />
            )}
          />
        </div>
      </GridItem>
      <GridItem md={6} />
      <GridItem xs={2}>
        <FastField
          name='lastSMSSendStatus'
          render={args => {
            return (
              <Select
                label={formatMessage({
                  id: 'sms.status',
                })}
                options={smsStatus}
                {...args}
              />
            )
          }}
        />
      </GridItem>

      {/* <GridItem xs={2}>
        <FastField
          name='MessageStatus'
          render={(args) => {
            return (
              <Select
                label={formatMessage({
                  id: 'sms.message.status',
                })}
                options={messageStatus}
                {...args}
              />
            )
          }}
        />
      </GridItem> */}
    </React.Fragment>
  )
}

export default withStyles(styles, { name: 'FilterByAppointment' })(
  FilterByAppointment,
)
