import React from 'react'
import moment from 'moment'
import * as Yup from 'yup'
// formik
import { FastField, withFormik } from 'formik'
// material ui
import { Paper, withStyles } from '@material-ui/core'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  Select,
  DatePicker,
  TimePicker,
  TextField,
  NumberInput,
  RadioGroup,
} from '@/components'

const STYLES = (theme) => ({
  paperContainer: {
    padding: theme.spacing.unit,
  },
  buttonContainer: {
    margin: `${theme.spacing.unit * 2}px ${theme.spacing.unit}px ${theme.spacing
      .unit}px`,
  },
})

const _dateFormat = 'DD MMM YYYY'
const _timeFormat = 'hh:mm a'
const doctors = [
  { value: 'medisys', name: 'Medisys' },
  { value: 'levinne', name: 'Dr Levinne' },
  { value: 'cheah', name: 'Dr Cheah' },
  { value: 'tan', name: 'Dr Tan' },
  { value: 'lim', name: 'Dr Lim' },
  { value: 'liu', name: 'Dr Liu' },
]

const eventType = [
  { value: 'family day', name: 'Family Day' },
  { value: 'vacation', name: 'Vacation' },
  { value: 'on leave', name: 'On Leave' },
]

const durationHours = [
  { value: '0', name: 0 },
  { value: '1', name: 1 },
  { value: '2', name: 2 },
  { value: '3', name: 3 },
  { value: '4', name: 4 },
  { value: '5', name: 5 },
  { value: '6', name: 6 },
  { value: '7', name: 7 },
  { value: '8', name: 8 },
]

const durationMinutes = [
  { value: '0', name: 0 },
  { value: '15', name: 15 },
  { value: '30', name: 30 },
  { value: '45', name: 45 },
]

const RECURRENCE_RANGE = {
  AFTER: 'after',
  BY: 'by',
}

const recurrencePattern = [
  { name: 'Daily', value: 'daily' },
  { name: 'Weekly', value: 'weekly' },
  { name: 'Monthly', value: 'wonthly' },
]

function DoctorEventForm ({ classes, handleSubmit, values, ...props }) {
  return (
    <React.Fragment>
      <Paper className={classes.paperContainer}>
        <GridContainer justify='center'>
          <GridItem xs md={12}>
            <FastField
              name='doctor'
              render={(args) => (
                <Select {...args} allowClear label='Doctor' options={doctors} />
              )}
            />
          </GridItem>
          <GridContainer item xs md={12} justify='center'>
            <GridItem xs md={8}>
              <FastField
                name='eventDate'
                render={(args) => (
                  <DatePicker {...args} label='Date' format={_dateFormat} />
                )}
              />
            </GridItem>
            <GridItem xs md={4}>
              <FastField
                name='eventTime'
                render={(args) => (
                  <TimePicker
                    {...args}
                    label='Time'
                    format={_timeFormat}
                    use12Hours
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer item xs md={12} justify='center'>
            <GridItem xs md={6}>
              <FastField
                name='durationHour'
                render={(args) => (
                  <Select {...args} label='Hour' options={durationHours} />
                )}
              />
            </GridItem>
            <GridItem xs md={6}>
              <FastField
                name='durationMinute'
                render={(args) => (
                  <Select
                    {...args}
                    label='Minute: '
                    options={durationMinutes}
                  />
                )}
              />
            </GridItem>
          </GridContainer>

          <GridItem xs md={12}>
            <FastField
              name='eventType'
              render={(args) => (
                <Select {...args} label='Event Type' options={eventType} />
              )}
            />
          </GridItem>
          <GridItem xs md={12}>
            <FastField
              name='subject'
              render={(args) => <TextField {...args} label='Subject' />}
            />
          </GridItem>
          <GridItem xs md={12}>
            <FastField
              name='description'
              render={(args) => (
                <TextField
                  {...args}
                  label='Description'
                  multiline
                  rowsMax={4}
                />
              )}
            />
          </GridItem>
          <GridItem xs md={12}>
            <FastField
              name='recurrencePattern'
              render={(args) => (
                <Select
                  {...args}
                  options={recurrencePattern}
                  label='Recurrence Pattern'
                />
              )}
            />
          </GridItem>
          <GridItem xs md={12}>
            <FastField
              name='recurrenceRange'
              render={(args) => (
                <RadioGroup
                  label='Range of Recurrence'
                  textField='name'
                  options={[
                    {
                      value: RECURRENCE_RANGE.AFTER,
                      name: 'End After',
                    },
                    {
                      value: RECURRENCE_RANGE.BY,
                      name: 'End By',
                    },
                  ]}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs md={12}>
            {values.recurrenceRange === RECURRENCE_RANGE.AFTER && (
              <FastField
                name='occurence'
                render={(args) => <NumberInput {...args} label='Occurence' />}
              />
            )}
            {values.recurrenceRange === RECURRENCE_RANGE.BY && (
              <FastField
                name='stopDate'
                render={(args) => <DatePicker {...args} label='Stop Date' />}
              />
            )}
          </GridItem>
        </GridContainer>
      </Paper>
      <GridContainer justify='flex-end' className={classes.buttonContainer}>
        <GridItem>
          <Button color='danger'>Cancel</Button>
          <Button color='primary' onClick={handleSubmit}>
            Save
          </Button>
        </GridItem>
      </GridContainer>
    </React.Fragment>
  )
}

const DoctorFormValidation = Yup.object().shape({
  doctor: Yup.string().required(),
  durationHour: Yup.string().required(),
  durationMinute: Yup.string().required(),
  eventDate: Yup.string().required(),
  eventTime: Yup.string().required(),
})

export default withFormik({
  validationSchema: DoctorFormValidation,
  handleSubmit: (values, { props, resetForm }) => {
    const { handleAddDoctorEvent } = props
    const {
      doctor,
      durationHour,
      durationMinute,
      eventDate,
      eventTime,
    } = values

    const date = moment(eventDate).format(_dateFormat)
    const endDate = moment(
      `${date} ${eventTime}`,
      `${_dateFormat} ${_timeFormat}`,
    )
    endDate.add(parseInt(durationHour, 10), 'hours')
    endDate.add(parseInt(durationMinute, 10), 'minutes')

    const startDate = moment(
      `${date} ${eventTime}`,
      `${_dateFormat} ${_timeFormat}`,
    )

    const event = {
      ...values,
      startTime: startDate.format(_timeFormat),
      endTime: endDate.format(_timeFormat),
      start: startDate.toDate(),
      end: endDate.toDate(),
      isDoctorEvent: true,
      resourceId: doctor,
    }

    resetForm()
    handleAddDoctorEvent(event)
  },
  mapPropsToValues: () => ({
    doctor: '',
    durationHour: '0',
    durationMinute: '15',
    eventDate: '',
    eventTime: '',
    subject: '',
    description: '',
    occurence: 0,
    recurrencePattern: 'daily',
    recurrenceRange: RECURRENCE_RANGE.AFTER,
  }),
})(withStyles(STYLES, { name: 'DoctorForm' })(DoctorEventForm))
