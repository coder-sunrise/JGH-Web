import React from 'react'
import classnames from 'classnames'
import moment from 'moment'
import * as Yup from 'yup'
// umi formatMessage
import { formatMessage } from 'umi/locale'
// formik
import { FastField, Field, withFormik } from 'formik'
// material ui
import { Divider, CircularProgress, Paper, withStyles } from '@material-ui/core'
// custom component
import {
  Card,
  CardBody,
  Button,
  CommonModal,
  DatePicker,
  GridContainer,
  GridItem,
  SizeContainer,
  NumberInput,
  OutlinedTextField,
  Select,
  AntdInput,
  Checkbox,
  TimePicker,
  RadioGroup,
  Danger,
} from '@/components'
// custom components
import AppointmentTypeSelector from '../../../Appointment/Calendar/Appointments/AppointmentTypeSelector'
import NewPatient from '../../../../PatientDatabase/New'
import PatientSearchModal from '../../PatientSearch'
import DeleteConfirmation from './DeleteConfirmation'
// services
import {
  fetchPatientListByName,
  fetchPatientInfoByPatientID,
} from '../../service/appointment'
import { getColorByAppointmentType } from '../../setting'
import styles from './style'

const doctors = [
  { value: 'medisys', name: 'Medisys' },
  { value: 'levinne', name: 'Dr Levinne' },
  { value: 'cheah', name: 'Dr Cheah' },
  { value: 'tan', name: 'Dr Tan' },
  { value: 'lim', name: 'Dr Lim' },
  { value: 'liu', name: 'Dr Liu' },
]

const recurrencePattern = [
  { name: 'Daily', value: 'daily' },
  { name: 'Weekly', value: 'weekly' },
  { name: 'Monthly', value: 'wonthly' },
]

const RECURRENCE_RANGE = {
  AFTER: 'after',
  BY: 'by',
}

const _dateFormat = 'DD MMM YYYY'
const _timeFormat = 'hh:mm a'
const _slotInfoDateFormat = 'MMM DD YYYY'

const AppointmentSchema = Yup.object().shape({
  patientName: Yup.string().required(),
  contactNo: Yup.string().required(),
  doctor: Yup.string().required('Doctor name is required'),
  startDate: Yup.string().required(),
  endDate: Yup.string().required(),
  startTime: Yup.string().required(),
  endTime: Yup.string().required(),
})

const initialAptInfo = {
  patientName: '',
  contactNo: '',
  doctor: '',
  bookBy: '',
  bookDate: '',
  remarks: '',
  enableRecurrence: false,
  recurrencePattern: 'daily',
  recurrenceRange: RECURRENCE_RANGE.AFTER,
  occurence: 1,
}

@withFormik({
  enableReinitialize: true,
  validationSchema: AppointmentSchema,
  handleSubmit: (values, { props, resetForm }) => {
    const {
      patientName,
      contactNo,
      startDate: _utcStartDate,
      endDate: _utcEndDate,
      startTime,
      endTime,
      appointmentType = '',
      doctor,
    } = values
    const { handleAddEvents, handleUpdateEvents, slotInfo, resources } = props

    const startDate = moment(_utcStartDate).format(_dateFormat)
    const endDate = moment(_utcEndDate).format(_dateFormat)

    const _momentStartDate = moment(
      `${startDate} ${startTime}`,
      `${_dateFormat} hh:mm a`,
    )
    const _nativeStartDate = _momentStartDate.toDate()

    const _momentEndDate = moment(
      `${endDate} ${endTime}`,
      `${_dateFormat} hh:mm a`,
    )
    const _nativeEndDate = _momentEndDate.toDate()

    const assignedResource = resources.find(
      (resource) => resource.resourceId === doctor,
    )
    let resourceId = assignedResource ? assignedResource.resourceId : 'other'

    if (!_momentStartDate.isValid() && !_momentEndDate.isValid()) return

    const event = {
      ...slotInfo,
      ...values,
      tooltip: `${patientName}(${contactNo})`,
      start: _nativeStartDate,
      end: _nativeEndDate,
      title: `${patientName}(${contactNo})`,
      color: getColorByAppointmentType(appointmentType),
      resourceId,
    }

    switch (slotInfo.type) {
      case 'update':
        handleUpdateEvents(event)
        break
      default:
        handleAddEvents(event)
        break
    }
    resetForm()
  },
  mapPropsToValues: ({ slotInfo, resources = [] }) => {
    const startDate = moment(slotInfo.start, _slotInfoDateFormat).format(
      _dateFormat,
    )
    const startTime = moment(slotInfo.start, _slotInfoDateFormat).format(
      'hh:mm a',
    )
    const endDate = moment(slotInfo.end, _slotInfoDateFormat).format(
      _dateFormat,
    )
    const endTime = moment(slotInfo.end, _slotInfoDateFormat).format('hh:mm a')

    const currentResource = resources.find(
      (resource) => resource.resourceId === slotInfo.resourceId,
    )
    let doctor = ''
    if (currentResource) {
      doctor =
        currentResource.resourceId !== 'other' ? currentResource.resourceId : ''
    }

    return {
      ...initialAptInfo,
      ...slotInfo,
      doctor,
      startDate,
      startTime,
      endDate,
      endTime,
    }
  },
})
class Form extends React.PureComponent {
  state = {
    showNewPatientModal: false,
    showSearchPatientModal: false,
    showDeleteConfirmationModal: false,
    patientList: [],
  }

  toggleNewPatientModal = () => {
    const { showNewPatientModal } = this.state
    this.setState({ showNewPatientModal: !showNewPatientModal })
  }

  openSearchPatientModal = () => {
    this.setState({ showSearchPatientModal: true })
  }

  closeSearchPatientModal = () => {
    this.setState({ showSearchPatientModal: false })
  }

  onSearchPatient = () => {
    const { values } = this.props
    this.searchPatient(values.patientName)
  }

  searchPatient = (patientName) => {
    fetchPatientListByName(patientName).then((response) => {
      if (response) {
        const { data: { data = [] } } = response
        this.setState({
          patientList: [
            ...data,
          ],
          showSearchPatientModal: true,
        })
      }
    })
  }

  startDateValidation = (value) => {
    const { values } = this.props

    if (value === '') return 'Start date is required'
    if (!moment(value).isValid()) return 'Invalid date'

    // start date should be lower than end date
    const endDate = moment(values.endDate).isValid()
      ? moment(values.endDate)
      : ''
    if (endDate === '') return ''
    if (endDate.isBefore(moment(value)))
      return 'Start Date must be before End Date'

    return ''
  }

  endDateValidation = (value) => {
    const { values } = this.props
    if (value === '') return 'End Date is required'
    if (!moment(value).isValid()) return 'Invalid date'

    // end date should be greater than start date
    const startDate = moment(values.startDate).isValid()
      ? moment(values.startDate)
      : ''
    if (startDate === '') return ''

    if (startDate.isAfter(moment(value)))
      return 'End Date must be after Start Date'

    return ''
  }

  startTimeValidation = (value) => {
    const { values } = this.props
    if (value === '') return 'Time is required'
    if (!moment(value, _timeFormat).isValid()) return 'Invalid time'

    const endTime = moment(values.endTime, _timeFormat).isValid()
      ? moment(values.endTime, _timeFormat)
      : ''
    if (endTime === '') return ''

    const startTime = moment(values.startTime, _timeFormat)

    if (startTime.isAfter(endTime)) return 'Start Time must be before End Time'

    return ''
  }

  endTimeValidation = (value) => {
    const { values } = this.props
    if (value === '') return 'Time is required'
    if (!moment(value, _timeFormat).isValid()) return 'Invalid time'

    const startTime = moment(values.startTime, _timeFormat).isValid()
      ? moment(values.startTime, _timeFormat)
      : ''
    if (startTime === '') return ''
    const endTime = moment(values.endTime, _timeFormat)

    if (endTime.isBefore(startTime)) return 'End Time must be after Start Time'

    return ''
  }

  handleSelectPatient = (patientID) => {
    fetchPatientInfoByPatientID(patientID).then((response) => {
      if (response) {
        const patientInfo = { ...response.data }
        const { name, contact } = patientInfo
        const patientName = name !== undefined ? name : ''
        let contactNumber = ''
        if (contact) {
          const { mobileContactNumber } = contact
          contactNumber = mobileContactNumber.number
        }
        const { setFieldValue, setFieldTouched } = this.props

        setFieldValue('patientName', patientName)
        setFieldValue('contactNo', contactNumber)

        setFieldTouched('patientName', true)
        setFieldTouched('contactNo', true)

        this.setState({
          showSearchPatientModal: false,
        })
      }
    })
  }

  closeDeleteConfirmation = () => {
    this.setState({
      showDeleteConfirmationModal: false,
    })
  }

  onCancelAppointmentClick = () => {
    this.setState({
      showDeleteConfirmationModal: true,
    })
  }

  onConfirmCancelAppointment = ({ deleteType, reasonType, reason }) => {
    const { handleDeleteEvent, slotInfo } = this.props
    this.setState(
      {
        showDeleteConfirmationModal: false,
      },
      () => {
        handleDeleteEvent(slotInfo.id)
      },
    )
  }

  render () {
    const {
      classes,
      onConfirm,
      slotInfo,
      isLoading,
      handleSubmit,
      values,
    } = this.props

    const {
      showNewPatientModal,
      showSearchPatientModal,
      showDeleteConfirmationModal,
      patientList,
    } = this.state

    const hideCancelAppointmentClass = {
      [classes.hideCancelAppointmentBtn]: slotInfo.type === 'add',
    }

    return (
      <SizeContainer>
        <React.Fragment>
          <Paper className={classnames(classes.content)}>
            {isLoading && (
              <div className={classnames(classes.loading)}>
                <CircularProgress />
                <h3 style={{ fontWeight: 400 }}>Populating patient info...</h3>
              </div>
            )}

            <GridContainer
              className={classnames(classes.formContent)}
              alignItems='flex-start'
            >
              <GridItem container xs md={12}>
                <GridItem xs md={7}>
                  <Field
                    name='patientName'
                    render={(args) => {
                      return (
                        <AntdInput
                          {...args}
                          autoFocus
                          onEnterPressed={this.onSearchPatient}
                          label={formatMessage({
                            id: 'reception.appt.form.patientName',
                          })}
                        />
                      )
                    }}
                  />
                </GridItem>
                <GridItem xs md={5}>
                  <div className={classnames(classes.buttonGroup)}>
                    <Button
                      size='sm'
                      color='primary'
                      onClick={this.onSearchPatient}
                    >
                      Search
                    </Button>
                    <Button
                      size='sm'
                      color='primary'
                      onClick={this.toggleNewPatientModal}
                    >
                      Create Patient
                    </Button>
                  </div>
                </GridItem>
                <GridItem xs md={7}>
                  <Field
                    name='contactNo'
                    render={(args) => (
                      <AntdInput
                        {...args}
                        label={formatMessage({
                          id: 'reception.appt.form.contactNo',
                        })}
                      />
                    )}
                  />
                </GridItem>

                <GridItem
                  xs
                  md={12}
                  className={classnames(classes.remarksField)}
                >
                  <FastField
                    name='remarks'
                    render={(args) => (
                      <OutlinedTextField
                        {...args}
                        multiline
                        rowsMax={3}
                        rows={2}
                        label={formatMessage({
                          id: 'reception.appt.form.remarks',
                        })}
                      />
                    )}
                  />
                </GridItem>

                <GridItem xs md={6}>
                  <FastField
                    name='doctor'
                    render={(args) => (
                      <Select
                        {...args}
                        options={doctors}
                        label={formatMessage({
                          id: 'reception.appt.form.doctor',
                        })}
                      />
                    )}
                  />
                </GridItem>

                <GridItem xs md={6}>
                  <FastField
                    name='appointmentType'
                    render={(args) => (
                      <AppointmentTypeSelector
                        {...args}
                        label='Appointment Type'
                      />
                    )}
                  />
                </GridItem>
              </GridItem>
              <GridItem xs md={12}>
                <p className={classnames(classes.apptLabel)}>
                  Appointment Time
                </p>
              </GridItem>
              <GridItem xs md={1}>
                <p className={classnames(classes.apptSubLabel)}>From</p>
              </GridItem>
              <GridItem xs md={3}>
                <Field
                  name='startDate'
                  validate={this.startDateValidation}
                  render={(args) => (
                    <DatePicker noLabel {...args} format={_dateFormat} />
                  )}
                />
              </GridItem>
              <GridItem xs md={2}>
                <Field
                  name='startTime'
                  validate={this.startTimeValidation}
                  render={(args) => (
                    <TimePicker
                      {...args}
                      noLabel
                      format={_timeFormat}
                      use12Hours
                      minuteStep={15}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs md={1}>
                <p className={classnames(classes.apptSubLabel)}>To</p>
              </GridItem>
              <GridItem xs md={3}>
                <Field
                  name='endDate'
                  validate={this.endDateValidation}
                  render={(args) => {
                    return (
                      <DatePicker
                        disabled
                        noLabel
                        {...args}
                        format={_dateFormat}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs md={2}>
                <Field
                  name='endTime'
                  validate={this.endTimeValidation}
                  render={(args) => (
                    <TimePicker
                      {...args}
                      noLabel
                      format={_timeFormat}
                      use12Hours
                      minuteStep={15}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs md={6}>
                <p className={classnames(classes.dateTimePreview)}>
                  {` ${moment(values.startDate).format('dddd')}, ${moment(
                    values.startDate,
                  ).format(_dateFormat)} ${values.startTime}`}
                </p>
              </GridItem>
              <GridItem xs md={6}>
                <p className={classnames(classes.dateTimePreview)}>
                  {`${moment(values.endDate).format('dddd')}, ${moment(
                    values.endDate,
                  ).format(_dateFormat)} ${values.endTime}`}
                </p>
              </GridItem>
              <GridItem
                xs
                md={12}
                className={classnames(classes.enableOccurenceCheckbox)}
              >
                <Divider className={classnames(classes.divider)} />
                <FastField
                  name='enableRecurrence'
                  render={(args) => {
                    return (
                      <Checkbox simple label='Enable Recurrence' {...args} />
                    )
                  }}
                />
              </GridItem>
              {values.enableRecurrence && (
                <React.Fragment>
                  <GridItem xs md={4}>
                    <FastField
                      name='recurrencePattern'
                      render={(args) => (
                        <Select
                          {...args}
                          options={recurrencePattern}
                          label={formatMessage({
                            id: 'reception.appt.form.recurrencePattern',
                          })}
                        />
                      )}
                    />
                  </GridItem>
                  <GridContainer item xs md={12}>
                    <GridItem>
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
                    <GridItem>
                      {values.recurrenceRange === RECURRENCE_RANGE.AFTER && (
                        <Field
                          name='occurence'
                          render={(args) => (
                            <NumberInput
                              {...args}
                              label={formatMessage({
                                id: 'reception.appt.form.occurence',
                              })}
                            />
                          )}
                        />
                      )}
                      {values.recurrenceRange === RECURRENCE_RANGE.BY && (
                        <FastField
                          name='stopDate'
                          render={(args) => (
                            <DatePicker
                              {...args}
                              label={formatMessage({
                                id: 'reception.appt.form.stopDate',
                              })}
                            />
                          )}
                        />
                      )}
                    </GridItem>
                  </GridContainer>
                </React.Fragment>
              )}
            </GridContainer>
          </Paper>
          <Card
            size='sm'
            raised
            className={classnames(classes.conflictContainer)}
          >
            <CardBody>
              <GridContainer>
                <GridItem xs md={8}>
                  <Danger>
                    <h4 className={classnames(classes.conflictContent)}>
                      Appointment has conflict in schedule
                    </h4>
                  </Danger>
                </GridItem>
                <GridItem xs md={4} container justify='flex-end'>
                  <Button color='primary'>Validate</Button>
                </GridItem>
              </GridContainer>
            </CardBody>
          </Card>
          <div className={classnames(classes.footer)}>
            <GridContainer>
              <GridItem xs md={4} container justify='flex-start'>
                <Button
                  color='danger'
                  className={classnames(hideCancelAppointmentClass)}
                  onClick={this.onCancelAppointmentClick}
                >
                  Cancel Appointment
                </Button>
              </GridItem>

              <GridItem xs md={8} container justify='flex-end'>
                <Button onClick={onConfirm} color='danger'>
                  Cancel
                </Button>
                <Button color='success'>Save Draft</Button>
                <Button onClick={handleSubmit} color='primary'>
                  Confirm
                </Button>
              </GridItem>
            </GridContainer>
          </div>

          <CommonModal
            open={showNewPatientModal}
            title='Register New Patient'
            onClose={this.toggleNewPatientModal}
            onConfirm={this.toggleNewPatientModal}
            fullScreen
            showFooter={false}
          >
            {showNewPatientModal ? <NewPatient /> : null}
          </CommonModal>
          <CommonModal
            open={showSearchPatientModal}
            title='Search Patient'
            onClose={this.closeSearchPatientModal}
            onConfirm={this.closeSearchPatientModal}
            maxWidth='md'
            showFooter={false}
          >
            {showSearchPatientModal ? (
              <PatientSearchModal
                searchPatientName={values.patientName}
                patientList={patientList}
                handleSearchPatient={this.searchPatient}
                onBackClick={this.closeSearchPatientModal}
                onSelectClick={this.handleSelectPatient}
              />
            ) : null}
          </CommonModal>
          <CommonModal
            open={showDeleteConfirmationModal}
            title='Alert'
            onClose={this.closeDeleteConfirmation}
            onConfirm={this.onConfirmCancelAppointment}
            maxWidth='sm'
          >
            <DeleteConfirmation />
          </CommonModal>
        </React.Fragment>
      </SizeContainer>
    )
  }
}

const FormComponent = withStyles(styles, { name: 'ApptForm' })(Form)

export default FormComponent
