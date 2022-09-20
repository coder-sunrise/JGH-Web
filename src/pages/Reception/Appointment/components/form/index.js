import React from 'react'
import * as Yup from 'yup'
import { connect } from 'dva'
import moment from 'moment'
import classnames from 'classnames'
import { Link } from 'umi'
// formik
import { Field } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// custom component
import {
  CommonModal,
  CardContainer,
  GridContainer,
  GridItem,
  SizeContainer,
  OutlinedTextField,
  withFormikExtend,
  Button,
  notification,
} from '@/components'
// medisys components
import { LoadingWrapper, Recurrence } from '@/components/_medisys'
// custom components
import PatientProfile from '@/pages/PatientDatabase/Detail'
import { getAppendUrl, navigateDirtyCheck } from '@/utils/utils'
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_CANCELLEDBY,
  CANNED_TEXT_TYPE,
  CALENDAR_RESOURCE,
} from '@/utils/constants'
import { getBizSession } from '@/services/queue'
import Authorized from '@/utils/Authorized'
import PatientBanner from '@/pages/PatientDashboard/Banner'
import AppointmentHistory from './AppointmentHistory'
import PatientSearchModal from '../../PatientSearch'
import DeleteConfirmation from './DeleteConfirmation'
import AppointmentDataGrid from './AppointmentDataGrid'
import PatientInfoInput from './PatientInfo'
import AppointmentDateInput from './AppointmentDate'
// import Recurrence from './Recurrence'
import FormFooter from './FormFooter'
import SeriesUpdateConfirmation from '../../SeriesUpdateConfirmation'
import RescheduleForm from './RescheduleForm'
import PreOrder from './PreOrder'
import SelectPreOrder from './SelectPreOrder'
import CannedTextButton from '@/pages/Widgets/Orders/Detail/CannedTextButton'
// utils
import {
  ValidationSchema,
  mapPropsToValues,
  sortDataGrid,
  getEndTime,
} from './formUtils'
import { getUniqueNumericId, roundTo } from '@/utils/utils'
import styles from './style'

const gridValidationSchema = Yup.object().shape({
  startTime: Yup.string().required(),
  endTime: Yup.string().required(),
  apptDurationHour: Yup.number().required(),
  apptDurationMinute: Yup.number().required(),
  calendarResourceFK: Yup.number().required(),
  appointmentTypeFK: Yup.string().required(),
})

@connect(
  ({
    loginSEMR,
    loading,
    user,
    calendar,
    codetable,
    patient,
    patientSearch,
    global,
    visitRegistration,
  }) => ({
    loginSEMR,
    loading,
    commitCount: global.commitCount || 1,
    patientProfile: patient.entity,
    patientProfileDefaultValue: patient.default,
    user: user.data,
    events: calendar.list,
    conflicts: calendar.conflicts,
    viewingAppointment: calendar.currentViewAppointment,
    isEditedAsSingleAppointment: calendar.isEditedAsSingleAppointment,
    mode: calendar.mode,
    cachedPayload: calendar.cachedPayload,
    appointmentStatuses: codetable.ltappointmentstatus,
    clinicianProfiles: codetable.clinicianprofile,
    patientSearchResult: patientSearch.list,
    visitRegistration,
    ctcalendarresource: codetable.ctcalendarresource,
    operationhour: calendar.clinicOperationhour,
    ctresource: codetable.ctresource,
    codetable: codetable,
    mainDivHeight: global.mainDivHeight,
  }),
)
@withFormikExtend({
  notDirtyDuration: 1,
  displayName: 'AppointmentForm',
  // enableReinitialize: true,
  validationSchema: ValidationSchema,
  mapPropsToValues,
})
class Form extends React.PureComponent {
  state = {
    submitCount: this.props.commitCount,
    showPatientProfile: false,
    showSearchPatientModal: false,
    showDeleteConfirmationModal: false,
    showRescheduleForm: false,
    datagrid:
      this.props.values && this.props.values.currentAppointment
        ? this.props.values.currentAppointment.appointments_Resources
        : [],
    showSeriesUpdateConfirmation: false,
    tempNewAppointmentStatusFK: -1,
    isDataGridValid: this.props.values.id !== undefined,
    editingRows: [],
    hasActiveSession: false,
    showSelectPreOrder: false,
  }

  componentDidMount = async () => {
    const { values, dispatch, setFieldValue } = this.props
    const response = await dispatch({
      type: 'visitRegistration/getVisitOrderTemplateListForDropdown',
      payload: {
        pagesize: 9999,
      },
    })
    if (response) {
      const { data } = response
      const templateOptions = data
        .filter(template => template.isActive)
        .map(template => {
          return {
            ...template,
            value: template.id,
            name: template.displayValue,
          }
        })

      dispatch({
        type: 'visitRegistration/updateState',
        payload: {
          visitOrderTemplateOptions: templateOptions,
        },
      })
      this.setBannerHeight()
    }

    this.checkHasActiveSession()
    Promise.all([
      dispatch({
        type: 'codetable/fetchCodes',
        payload: { code: 'ltappointmentstatus' },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: { code: 'ltcancelreasontype' },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: { code: 'ctresource' },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: { code: 'ctcalendarresource' },
      }),
    ])

    if (values && values.patientProfileFK) {
      this.refreshPatient(values.patientProfileFK)
    }

    this.validateDataGrid()

    setTimeout(() => {
      const { values, setFieldValue } = this.props
      if (values.isUpdated) {
        setFieldValue('isUpdated', false)
      }
    }, 500)
  }

  checkHasActiveSession = async () => {
    try {
      const bizSessionPayload = {
        IsClinicSessionClosed: false,
      }
      const result = await getBizSession(bizSessionPayload)
      const { data } = result.data

      this.setState(() => {
        return {
          hasActiveSession: data.length > 0,
        }
      })
    } catch (error) {}
  }

  refreshPatient = id => {
    this.props
      .dispatch({
        type: 'patient/query',
        payload: {
          id,
        },
      })
      .then(pat => {
        this.props.dispatch({
          type: 'patient/updateState',
          payload: { entity: pat },
        })
      })
  }

  onRecurrencePatternChange = async recurrencePatternFK => {
    const { setFieldValue, setFieldTouched } = this.props
    // reset other field first
    await setFieldValue('recurrenceDto.recurrenceDaysOfTheWeek', [])
    await setFieldValue('recurrenceDto.recurrenceDayOfTheMonth', null)
    await setFieldTouched('recurrenceDto.recurrenceDayOfTheMonth', false, false)
    await setFieldTouched('recurrenceDto.recurrenceDaysOfTheWeek', false, false)

    // initialize value accordingly
    if (recurrencePatternFK === 3) {
      await setFieldValue('recurrenceDto.recurrenceDayOfTheMonth', 1)
      await setFieldTouched('recurrenceDto.recurrenceDayOfTheMonth', true, true)
    }

    if (recurrencePatternFK === 2) {
      await setFieldValue('recurrenceDto.recurrenceDaysOfTheWeek', [])
      await setFieldTouched(
        'recurrenceDto.recurrenceDaysOfTheWeek',
        true,
        false,
      )
    }
  }

  toggleSearchPatientModal = () => {
    const { showSearchPatientModal } = this.state
    this.setState({ showSearchPatientModal: !showSearchPatientModal })
    if (showSearchPatientModal) {
      // this.props.dispatch({
      //   type: 'patientSearch/updateState',
      //   payload: {
      //     filter: {},
      //     list: [],
      //   },
      // })
      this.resetPatientSearchResult()
    }
  }

  togglePatientProfileModal = () => {
    const { patientProfileDefaultValue, dispatch, values } = this.props
    const entity = {
      ...patientProfileDefaultValue,
      name: values.patientName,
      callingName: values.patientName,
      contact: {
        ...patientProfileDefaultValue.contact,
        mobileContactNumber: {
          ...patientProfileDefaultValue.contact.mobileContactNumber,
          number: values.patientContactNo,
          countryCodeFK: values.countryCodeFK,
        },
      },
    }

    dispatch({
      type: 'patient/openPatientModal',
      payload: {
        callback: this.onConfirmCreatePatient,
      },
    })
    dispatch({
      type: 'patient/updateDefaultEntity',
      payload: {
        ...entity,
        // currentId: undefined,
      },
    })

    // this.setState(
    //   (preState) => ({
    //     ...preState,
    //     showPatientProfile: !preState.showPatientProfile,
    //   }),
    //   () => {
    //     dispatch({
    //       type: 'patient/updateState',
    //       payload: {
    //         entity,
    //         currentId: undefined,
    //       },
    //     })
    //   },
    // )
  }

  checkShouldPopulate = patientSearchResult => patientSearchResult.length === 1

  onSearchPatient = async () => {
    const { dispatch, values } = this.props
    const prefix = 'like_'
    await dispatch({
      type: 'patientSearch/query',
      payload: {
        // group: [
        //   {
        //     [`${prefix}name`]: values.patientName,
        //     [`${prefix}patientAccountNo`]: values.patientName,
        //     [`${prefix}patientReferenceNo`]: values.patientName,
        //     [`${prefix}contactFkNavigation.contactNumber.number`]: `${values.patientContactNo ||
        //       ''}`,
        //     combineCondition: 'or',
        //   },
        // ],
        apiCriteria: {
          searchValue: values.search,
          dob: values.dob,
        },
      },
    })
    this.showSearchResult()
  }

  resetPatientSearchResult = () => {
    this.props.dispatch({
      type: 'patientSearch/updateState',
      payload: {
        filter: {},
        list: [],
      },
    })
  }

  showSearchResult = () => {
    const { patientSearchResult } = this.props

    if (patientSearchResult) {
      const shouldPopulate = this.checkShouldPopulate(patientSearchResult)

      if (shouldPopulate) {
        this.onSelectPatientClick(patientSearchResult[0], true)
        this.resetPatientSearchResult()
      } else this.toggleSearchPatientModal()
    }
  }

  onSelectPatientClick = async (patientProfile, autoPopulate = false) => {
    const {
      id,
      patientAccountNo,
      name,
      mobileNo,
      countryCodeFK,
    } = patientProfile
    const { values, setValues } = this.props
    await setValues({
      ...values,
      patientAccountNo,
      patientProfileFK: id,
      patientName: name,
      patientContactNo: mobileNo,
      countryCodeFK,
    })
    this.refreshPatient(id)
    if (!autoPopulate) this.toggleSearchPatientModal()

    return true
  }

  closeDeleteConfirmation = () => {
    this.setState({
      showDeleteConfirmationModal: false,
    })
  }

  deleteDraft = id => {
    const { onClose, dispatch } = this.props
    dispatch({
      type: 'calendar/deleteDraft',
      payload: { id },
      callback: onClose,
    })
  }

  onConfirmCreatePatient = () => {
    const { patientProfile, dispatch } = this.props
    const { id, name, contact, patientAccountNo } = patientProfile
    const payload = {
      id,
      name,
      patientAccountNo,
      mobileNo: contact.mobileContactNumber.number,
    }
    dispatch({
      type: 'patient/closePatientModal',
    })
    // const doneUpdateFields = await this.onSelectPatientClick(payload, true)
    this.onSelectPatientClick(payload, true)
    // if (doneUpdateFields && values.id) {
    //   this._submit(false, true)
    // }
  }

  onConfirmCancelAppointment = ({
    type,
    cancelBy = APPOINTMENT_CANCELLEDBY.CLINIC,
    reasonType,
    reason,
  }) => {
    const { values, onClose, user, dispatch } = this.props
    // const noShowStatus = APPOINTMENT_STATUS.NOSHOW
    const cancelStatus =
      cancelBy === APPOINTMENT_CANCELLEDBY.PATIENT
        ? APPOINTMENT_STATUS.PFA_CANCELLED
        : APPOINTMENT_STATUS.CANCELLED

    const payload = {
      id: values.currentAppointment.id,
      concurrencyToken: values.currentAppointment.concurrencyToken,
      appointmentStatusFK: cancelStatus,
      cancellationDateTime: moment().formatUTC(),
      cancellationReasonTypeFK: reasonType,
      cancellationReason: reason,
      cancelByUserFk: user.id,
      cancelSeries: type === '2',
      cancelledByFK: cancelBy,
      isCancelled: false,
    }

    dispatch({
      type: 'calendar/cancelAppointment',
      payload,
    }).then(response => {
      if (response) {
        this.setState({
          showDeleteConfirmationModal: false,
        })
        onClose()
      }
    })
  }

  validateWithSchema = (datagrid = []) => {
    const endResult = datagrid.reduce((result, data) => {
      try {
        if (!data.isDeleted) {
          gridValidationSchema.validateSync(data, {
            abortEarly: false,
          })
        }

        return [...result, { ...data, _errors: [] }]
      } catch (error) {
        return [...result, { ...data, _errors: error.inner }]
      }
    }, [])
    return endResult
  }

  onCommitChanges = ({ rows, deleted, ...restProps }) => {
    const { setFieldValue } = this.props
    setFieldValue('_fakeField', 'fakeValue')
    if (deleted) {
      const { datagrid } = this.state
      // const newDatagrid = datagrid.filter(
      //   (event) => !deleted.includes(event.id),
      // )
      const afterDelete = datagrid.map(item => ({
        ...item,
        isDeleted: item.isDeleted || deleted.includes(item.id),
      }))
      const primayDoctor = afterDelete.find(
        item => !item.isDeleted && item.isPrimaryClinician,
      )
      const firstUnDelete = afterDelete.find(
        item =>
          !item.isDeleted &&
          item.calendarResource?.resourceType === CALENDAR_RESOURCE.DOCTOR,
      )
      let newDataGrid = [...afterDelete]
      if (primayDoctor) {
        newDataGrid = afterDelete
      } else {
        newDataGrid = afterDelete.map(item => ({
          ...item,
          isPrimaryClinician: firstUnDelete?.id === item.id,
        }))
      }

      this.setState(
        {
          datagrid: newDataGrid,
        },
        () => {
          this.validateDataGrid()
          this.updateEnableRecurrence()
        },
      )
      return newDataGrid
    }

    if (rows) {
      const updatedRows = this.validateWithSchema(
        rows.sort(sortDataGrid).map((item, index) => ({
          ...item,
          sortOrder: index,
          conflicts: [],
          endTime: getEndTime(item),
          startTime: item.startTime
            ? moment(item.startTime, 'hh:mm A').format('HH:mm')
            : undefined,
        })),
      )
      this.setState(
        {
          datagrid: updatedRows,
        },
        () => {
          this.validateDataGrid()
          this.updateEnableRecurrence()
        },
      )
      return updatedRows
    }

    return rows
  }

  updateEnableRecurrence = () => {
    const { datagrid } = this.state
    const { setFieldValue, values } = this.props
    if (
      !values.id &&
      values.isEnableRecurrence &&
      datagrid
        .filter(item => !item.isDeleted)
        .find(
          item =>
            item.calendarResource?.resourceType === CALENDAR_RESOURCE.RESOURCE,
        )
    ) {
      setFieldValue('isEnableRecurrence', false)
    }
  }

  checkAddResource = () => {
    const { values, mode } = this.props
    if (values.id && mode === 'series') {
      return false
    }
    return true
  }

  validateDataGrid = () => {
    const { datagrid = [], editingRows } = this.state

    let isDataGridValid = true

    // editing at least 1 row
    if (editingRows.length > 0) isDataGridValid = false

    if (
      this.validateWithSchema(datagrid).filter(
        item => item._errors && item._errors.length > 0,
      ).length > 0
    )
      isDataGridValid = false

    // has at least 1 row of appointment_resources
    if (datagrid.length === 0) isDataGridValid = false

    const filterDeleted = datagrid.filter(item => !item.isDeleted)

    this.setState({
      isDataGridValid,
      // datagrid: newDataGrid,
    })
  }

  _submit = async (validate = false) => {
    try {
      const {
        validateForm,
        setSubmitting,
        handleSubmit,
        values,
        onConfirm,
        dispatch,
      } = this.props
      const {
        datagrid,
        tempNewAppointmentStatusFK: appointmentStatusFK,
      } = this.state

      if (!validate) {
        handleSubmit() // fake submit to touch all fields
        setSubmitting(true)
        const formError = await validateForm(values)

        if (Object.keys(formError).length > 0) {
          setSubmitting(false)
          return
        }
      }

      const submitPayload = {
        validate,
        datagrid,
        formikValues: values,
        appointmentResources: [],
        newAppointmentStatusFK: appointmentStatusFK,
      }
      setSubmitting(false)

      const response = await dispatch({
        type: 'calendar/submit',
        payload: submitPayload,
      })
      if (validate && response) {
        const conflicts = [...response]

        this.setState(
          preState => ({
            submitCount: preState.submitCount + 1,
            datagrid: preState.datagrid.reduce(
              (data, d) => [
                ...data,
                {
                  ...d,
                  conflicts:
                    conflicts[d.sortOrder] && conflicts[d.sortOrder].conflicts
                      ? conflicts[d.sortOrder].conflicts
                      : undefined,
                },
              ],
              [],
            ),
          }),
          () => {
            this.props.dispatch({
              type: 'global/updateState',
              payload: {
                commitCount: this.state.submitCount + 1,
              },
            })
          },
        )
        return conflicts
      }
      if (!validate && response) {
        onConfirm()
      }
      return response
    } catch (error) {
      return false
    }
    return false
  }

  onDeleteClick = () => {}

  onValidateClick = () => {
    const appointmentStatus = this.props.appointmentStatuses.find(
      item => item.code === 'SCHEDULED',
    )
    const { tempNewAppointmentStatusFK } = this.state
    this.setState(
      {
        tempNewAppointmentStatusFK: appointmentStatus
          ? appointmentStatus.id
          : tempNewAppointmentStatusFK,
      },
      async () => {
        await this._submit(true)
      },
    )
  }

  onCancelOrDeleteClick = () => {
    const { values, dispatch } = this.props
    const { currentAppointment } = values

    if (currentAppointment.appointmentStatusFk !== undefined) {
      if (currentAppointment.appointmentStatusFk === 2) {
        dispatch({
          type: 'global/updateAppState',
          payload: {
            openConfirm: true,
            openConfirmContent: `Delete this draft appointment?`,
            onConfirmSave: () => this.deleteDraft(currentAppointment.id),
          },
        })
      } else {
        this.setState({
          showDeleteConfirmationModal: true,
        })
      }
    }
  }

  saveAppointment = () => {
    const { values, mode, viewingAppointment } = this.props
    const appointmentStatusFK = APPOINTMENT_STATUS.DRAFT

    const hasModifiedAsSingle = viewingAppointment.appointments.reduce(
      (editedAsSingle, appointment) =>
        appointment.isEditedAsSingleAppointment || editedAsSingle,
      false,
    )
    this.setState(
      {
        tempNewAppointmentStatusFK: appointmentStatusFK,
      },
      () => {
        if (
          values.id !== undefined &&
          mode === 'series' &&
          hasModifiedAsSingle &&
          viewingAppointment.isEnableRecurrence
        )
          this.openSeriesUpdateConfirmation()
        else this._submit()
      },
    )
  }

  onSaveDraftClick = () => {
    const appointmentStatus = this.props.appointmentStatuses.find(
      item => item.code === 'SCHEDULED',
    )
    const { tempNewAppointmentStatusFK } = this.state
    this.setState(
      {
        tempNewAppointmentStatusFK: appointmentStatus
          ? appointmentStatus.id
          : tempNewAppointmentStatusFK,
      },
      async () => {
        const result = await this._submit(true)
        if (result) {
          if (result.find(c => (c?.conflicts || []).find(r => r.isPrevent))) {
            notification.error({
              message:
                'Resource reach maximum booking. please modify to proceed.',
            })
          } else {
            this.saveAppointment()
          }
        }
      },
    )
  }

  confirmAppointment = () => {
    const { values, mode, viewingAppointment } = this.props
    try {
      const { datagrid } = this.state
      let newAppointmentStatusFK = APPOINTMENT_STATUS.CONFIRMED
      const rescheduleFK = APPOINTMENT_STATUS.RESCHEDULED
      let originalAppointment = viewingAppointment.appointments.find(
        t => t.id === values.currentAppointment.id,
      )

      let newResource = Array.from(datagrid, resource => {
        let startTime = `${resource.startTime}:00`
        let endTime = `${resource.endTime}:00`
        const {
          appointmentFK,
          calendarResourceFK,
          clinicianName,
          clinicianTitle,
          sortOrder,
          isPrimaryClinician,
          id,
          isDeleted,
          concurrencyToken,
          apptDurationHour,
          apptDurationMinute,
          preCalendarResourceFK,
          roomFk,
          appointmentTypeFK,
        } = resource
        return {
          appointmentFK,
          calendarResourceFK,
          clinicianName,
          clinicianTitle,
          startTime,
          endTime,
          sortOrder,
          isPrimaryClinician,
          id,
          isDeleted,
          concurrencyToken,
          apptDurationHour,
          apptDurationMinute,
          preCalendarResourceFK,
          roomFk,
          appointmentTypeFK,
        }
      })
      let originalResource = {}
      if (originalAppointment) {
        originalResource = Array.from(
          originalAppointment.appointments_Resources,
          resource => {
            const {
              appointmentFK,
              calendarResourceFK,
              clinicianName,
              clinicianTitle,
              startTime,
              endTime,
              sortOrder,
              isPrimaryClinician,
              id,
              isDeleted,
              concurrencyToken,
              apptDurationHour,
              apptDurationMinute,
              preCalendarResourceFK,
              roomFk,
              appointmentTypeFK,
            } = resource
            return {
              appointmentFK,
              calendarResourceFK,
              clinicianName,
              clinicianTitle,
              startTime,
              endTime,
              sortOrder,
              isPrimaryClinician,
              id,
              isDeleted,
              concurrencyToken,
              apptDurationHour,
              apptDurationMinute,
              preCalendarResourceFK,
              roomFk,
              appointmentTypeFK,
            }
          },
        )
      }
      let resourceChanged =
        originalAppointment &&
        JSON.stringify(originalResource) !== JSON.stringify(newResource)
      let dateChanged =
        originalAppointment &&
        originalAppointment.appointmentDate.indexOf(
          values.currentAppointment.appointmentDate,
        ) === -1
      const canChangeToRescheduleStatus = [
        APPOINTMENT_STATUS.CONFIRMED,
        APPOINTMENT_STATUS.RESCHEDULED,
        APPOINTMENT_STATUS.PFA_RESCHEDULED,
      ]
      if (
        values.currentAppointment &&
        canChangeToRescheduleStatus.includes(
          values.currentAppointment.appointmentStatusFk,
        )
      ) {
        if (resourceChanged || dateChanged) {
          newAppointmentStatusFK = rescheduleFK
        }
      }

      const hasModifiedAsSingle = viewingAppointment.appointments.reduce(
        (editedAsSingle, appointment) =>
          appointment.isEditedAsSingleAppointment || editedAsSingle,
        false,
      )

      this.setState(
        {
          tempNewAppointmentStatusFK: newAppointmentStatusFK,
        },
        () => {
          if (
            values.id !== undefined &&
            mode === 'series' &&
            hasModifiedAsSingle &&
            viewingAppointment.isEnableRecurrence
          ) {
            this.openSeriesUpdateConfirmation(this.openRescheduleForm)
            return true
          }
          if (newAppointmentStatusFK === APPOINTMENT_STATUS.RESCHEDULED) {
            this.openRescheduleForm()
          } else {
            this._submit()
          }
          return true
        },
      )
    } catch (error) {}
  }

  onConfirmClick = () => {
    const appointmentStatus = this.props.appointmentStatuses.find(
      item => item.code === 'SCHEDULED',
    )
    const { tempNewAppointmentStatusFK } = this.state
    this.setState(
      {
        tempNewAppointmentStatusFK: appointmentStatus
          ? appointmentStatus.id
          : tempNewAppointmentStatusFK,
      },
      async () => {
        const result = await this._submit(true)
        if (result) {
          if (result.find(c => (c?.conflicts || []).find(r => r.isPrevent))) {
            notification.error({
              message:
                'Resource reach maximum booking. please modify to proceed.',
            })
          } else {
            this.confirmAppointment()
          }
        }
      },
    )
  }

  openRescheduleForm = () => {
    this.setState({ showRescheduleForm: true })
  }

  openSeriesUpdateConfirmation = () => {
    this.setState({
      showSeriesUpdateConfirmation: true,
    })
  }

  closeSeriesUpdateConfirmation = (callback = f => f) => {
    this.setState({ showSeriesUpdateConfirmation: false }, callback)
  }

  closeRescheduleForm = () => {
    this.setState({ showRescheduleForm: false })
  }

  onConfirmSeriesUpdate = async type => {
    await this.props.setFieldValue('overwriteEntireSeries', type === '2', false)
    const { tempNewAppointmentStatusFK } = this.state

    if (tempNewAppointmentStatusFK === APPOINTMENT_STATUS.RESCHEDULED) {
      this.closeSeriesUpdateConfirmation()
      this.openRescheduleForm()
    } else this.closeSeriesUpdateConfirmation(this._submit)
  }

  onConfirmReschedule = async rescheduleValues => {
    const { setValues, values } = this.props
    // const { rescheduledByFK } = rescheduleValues
    // let { appointmentStatusFk } = values

    // by patient
    // if (rescheduledByFK === '2') {
    //   appointmentStatusFk = APPOINTMENT_STATUS.PFA_RESCHEDULED
    //   this.setState({ tempNewAppointmentStatusFK: appointmentStatusFk })
    // }
    this.setState({ tempNewAppointmentStatusFK: APPOINTMENT_STATUS.CONFIRMED })
    await setValues({ ...values, ...rescheduleValues })
    this.closeRescheduleForm()
    this._submit()
  }

  onEditingRowsChange = rows => {
    this.setState(
      {
        editingRows: [...rows],
      },
      () => this.validateDataGrid(),
    )
    return rows
  }

  onCloseFormClick = () => {
    const { onClose, dispatch } = this.props
    dispatch({
      type: 'patientSearch/updateState',
      payload: { list: undefined },
    })
    onClose()
  }

  getVisregUrl = () => {
    const { datagrid } = this.state
    const { values, history } = this.props
    const primaryDoctorResource = datagrid.find(item => item.isPrimaryClinician)
    const firstResource = datagrid.find(i => i.sortOrder === 0)
    const parameters = {
      md: 'visreg',
      pid: values.patientProfileFK,
      apptid: values.currentAppointment.id,
      pdid: primaryDoctorResource?.calendarResource?.clinicianProfileDto?.id, // primary clinician id
    }

    if (firstResource?.roomFk) {
      // pdroomid: primaryDoctorResource.roomFk || null, // primary clinician resource room fk
      parameters.pdroomid = firstResource.roomFk
    }
    if (values.currentAppointment.visitOrderTemplateFK) {
      parameters.visitOrderTemplateFK =
        values.currentAppointment.visitOrderTemplateFK
    }

    return getAppendUrl(parameters)
  }

  containsPrimaryClinician = () => {
    const { datagrid } = this.state
    if (datagrid.find(item => item.isPrimaryClinician)) {
      return true
    }
    return false
  }

  onVisitPurposeSelected = template => {
    const { datagrid } = this.state
    _.remove(datagrid, n => {
      return n.id < 0 && n.templateFK
    })
    if (!template) {
      return
    }
    const primaryResrouce = datagrid.find(x => x.isPrimaryClinician)
    let sortOrder = _.maxBy(datagrid, 'sortOrder')?.sortOrder || 0
    const { ctresource = [], ctcalendarresource = [] } = this.props.codetable
    template.visitOrderTemplate_Resources.forEach(temp => {
      sortOrder++
      const resource = ctresource.find(
        x => x.id === temp.resourceFK && x.isActive,
      )
      if (!resource) return
      const calendarResource = ctcalendarresource.find(
        source => source.id === resource.calendarResourceFK && source.isActive,
      )
      if (!calendarResource) return

      if (
        datagrid.find(
          res =>
            res.calendarResourceFK === calendarResource.id && !res.isDeleted,
        )
      ) {
        // Skip the active resources
        return
      }
      const newResource = {
        templateFK: template.id,
        appointmentTypeFK: primaryResrouce?.appointmentTypeFK,
        apptDurationHour: primaryResrouce?.apptDurationHour,
        apptDurationMinute: primaryResrouce?.apptDurationMinute,
        calendarResourceFK: calendarResource.id,
        calendarResource: calendarResource
          ? { ...calendarResource }
          : undefined,
        isPrimaryClinician: false,
        sortOrder: sortOrder,
        id: getUniqueNumericId(),
        startTime: primaryResrouce?.startTime,
        endTime: primaryResrouce?.endTime,
      }
      datagrid.push(newResource)
    })
    this.validateDataGrid()
  }
  onViewPatientProfile = () => {
    const { values, history } = this.props
    history.push(
      getAppendUrl({
        md: 'pt',
        cmt: '1',
        pid: values.patientProfileFK,
        v: Date.now(),
      }),
    )
  }

  shouldDisablePatientInfo = () => {
    const { values } = this.props

    return values.id !== undefined
  }

  shouldDisableButtonAction = () => {
    const { values } = this.props
    const { isDataGridValid } = this.state
    if (
      !isDataGridValid ||
      !values.patientName ||
      values.patientContactNo === undefined ||
      values.patientContactNo === null
    )
      return true

    return false
  }

  shouldDisableCheckAvailabilityButtonAction = () => {
    const { patientProfile, values = {} } = this.props
    const { isDataGridValid } = this.state
    const patientIsActive =
      values.patientProfileFK > 0
        ? patientProfile && patientProfile.isActive
        : true
    if (!isDataGridValid || !patientIsActive) return true

    return false
  }

  shouldDisableDatagrid = () => {
    const { values, patientProfile } = this.props

    const { currentAppointment = {} } = values
    const patientIsActive =
      values.patientProfileFK > 0
        ? patientProfile && patientProfile.isActive
        : true

    const _disabledStatus = [
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.TURNEDUP,
      APPOINTMENT_STATUS.TURNEDUPLATE,
    ]
    if (
      _disabledStatus.includes(currentAppointment.appointmentStatusFk) ||
      !patientIsActive
    )
      return true
    return false
  }

  shouldDisableAppointmentDate = () => {
    const { values } = this.props
    const { appointmentStatusFk } = values
    if (!values.id) return false
    const disablingList = [
      APPOINTMENT_STATUS.CANCELLED,
      // APPOINTMENT_STATUS.NOSHOW,
      APPOINTMENT_STATUS.TURNEDUP,
      APPOINTMENT_STATUS.TURNEDUPLATE,
    ]
    return (
      values.isEnableRecurrence || disablingList.includes(appointmentStatusFk)
    )
  }

  openSelectPreOrder = () => {
    this.setState({ showSelectPreOrder: true })
  }

  updatePreOrderSequence = (appointmentPreOrderItem = []) => {
    let sequence = 0
    appointmentPreOrderItem.forEach(po => {
      if (!po.isDeleted) {
        po.sequence = sequence
        sequence = sequence + 1
      }
    })
  }

  onSelectPreOrder = (selectPreOrder = []) => {
    const { values, setFieldValue } = this.props
    const { currentAppointment = {} } = values
    let { appointmentPreOrderItem = [] } = currentAppointment
    selectPreOrder.forEach(po => {
      let currentPreOrder = appointmentPreOrderItem.find(
        apo => apo.actualizedPreOrderItemFK === po.id,
      )
      if (currentPreOrder) {
        currentPreOrder.isDeleted = false
      } else {
        const { id, ...resetPreOrderItem } = po
        appointmentPreOrderItem = [
          ...appointmentPreOrderItem,
          { ...resetPreOrderItem, actualizedPreOrderItemFK: id },
        ]
      }
    })
    this.updatePreOrderSequence(appointmentPreOrderItem)
    setFieldValue('currentAppointment.appointmentPreOrderItem', [
      ...appointmentPreOrderItem,
    ])
    setFieldValue('currentAppointment.dirty', true)
    this.setState({ showSelectPreOrder: false })
  }

  closeSelectPreOrder = () => {
    this.setState({ showSelectPreOrder: false })
  }

  checkedRecurrence = () => {
    const { dispatch, values, setFieldValue } = this.props
    const { currentAppointment = {} } = values
    if ((currentAppointment.appointmentPreOrderItem || []).length) {
      dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmText: 'OK',
          openConfirmContent: `Check Recurrence will remove all Pre-Order.`,
          onConfirmSave: () => {
            setFieldValue('currentAppointment.appointmentPreOrderItem', [])
          },
          onConfirmClose: () => {
            setFieldValue('isEnableRecurrence', false)
          },
        },
      })
    }
  }

  showPreOrder = () => {
    const { values, mode } = this.props
    const { isEnableRecurrence, patientProfileFK, currentAppointment } = values
    const { appointmentPreOrderItem = {} } = currentAppointment
    if (!appointmentPreOrderItem.length) return false
    if (values.id) {
      return mode !== 'series'
    }
    return patientProfileFK && !isEnableRecurrence
  }

  deletePreOrderItem = actualizedPreOrderItemFK => {
    const { values, setFieldValue } = this.props
    const { currentAppointment = {} } = values
    let { appointmentPreOrderItem = [] } = currentAppointment

    var item = appointmentPreOrderItem.find(
      poi => poi.actualizedPreOrderItemFK === actualizedPreOrderItemFK,
    )
    if (item) {
      if (item.id) {
        item.isDeleted = true
      } else {
        appointmentPreOrderItem = [
          ...appointmentPreOrderItem.filter(
            poi => poi.actualizedPreOrderItemFK !== actualizedPreOrderItemFK,
          ),
        ]
      }
    }
    this.updatePreOrderSequence(appointmentPreOrderItem)
    setFieldValue('currentAppointment.appointmentPreOrderItem', [
      ...appointmentPreOrderItem,
    ])
    setFieldValue('currentAppointment.dirty', true)
  }

  setBannerHeight = () => {
    const banner = document.getElementById('patientBanner')
    const bannerHeight = banner ? banner.offsetHeight : 0
    this.setState({
      bannerHeight: bannerHeight,
    })
    if (bannerHeight === 0) setTimeout(this.setBannerHeight, 1000)
  }

  disableRecurrence = () => {
    const { values } = this.props
    const { datagrid = [] } = this.state
    return (
      values.id !== undefined ||
      datagrid
        .filter(item => !item.isDeleted)
        .find(
          item =>
            item.calendarResource?.resourceType === CALENDAR_RESOURCE.RESOURCE,
        )
    )
  }

  getClinicoperationhour = apptDate => {
    const { dispatch } = this.props
    dispatch({
      type: 'calendar/getClinicOperationhour',
      payload: {
        apptDate,
      },
    })
  }
  render() {
    const {
      classes,
      theme,
      onClose,
      loading,
      values,
      mode,
      conflicts,
      selectedSlot,
      height,
      onHistoryRowSelected,
      patientProfile,
      visitRegistration: { visitOrderTemplateOptions = [] },
      dispatch,
      setFieldValue,
      handleCopyAppointmentClick,
      registerToVisit = () => {},
      operationhour,
    } = this.props

    const {
      showPatientProfile,
      showSearchPatientModal,
      showDeleteConfirmationModal,
      showSeriesUpdateConfirmation,
      showRescheduleForm,
      datagrid,
      editingRows,
      showSelectPreOrder,
    } = this.state

    const patientIsActive =
      values.patientProfileFK > 0
        ? patientProfile && patientProfile.isActive
        : true

    const { currentAppointment = {}, isEnableRecurrence } = values
    const { appointmentPreOrderItem = [] } = currentAppointment
    const disablePatientInfo = this.shouldDisablePatientInfo()
    const disableFooterButton = this.shouldDisableButtonAction()
    const disableCheckAvailabilityFooterButton = this.shouldDisableCheckAvailabilityButtonAction()
    const disableDataGrid = this.shouldDisableDatagrid()
    const disablePreOrderConditions = [
      {
        condition: disableDataGrid,
        message: `Pre-Order is not allowed for current appointment status.`,
      },
      {
        condition: values.id && mode == 'series',
        message: `Pre-Order is not allowed for entire series appointment.`,
      },
      {
        condition: !values.id && isEnableRecurrence,
        message: `Pre-Order is not allowed for recurring appointment.`,
      },
    ]

    const _datagrid =
      conflicts.length > 0
        ? datagrid
            .filter(item => !item.isDeleted)
            .sort(sortDataGrid)
            .map((item, index) => ({
              ...item,
              sortOrder: index,
            }))
        : [...datagrid]

    const show =
      loading.effects['patientSearch/query'] || loading.models.calendar
    const _disableAppointmentDate =
      this.shouldDisableAppointmentDate() || !patientIsActive

    const { pendingPreOrderItem = [] } = patientProfile || {}

    const draftPreOrderItem = pendingPreOrderItem.map(po => {
      const selectPreOrder = appointmentPreOrderItem.find(
        apo => apo.actualizedPreOrderItemFK === po.id,
      )
      if (selectPreOrder) {
        return {
          ...po,
          preOrderItemStatus: selectPreOrder.isDeleted ? 'New' : 'Actualizing',
        }
      }
      return { ...po }
    })
    return (
      <LoadingWrapper loading={show} text='Loading...'>
        <SizeContainer size='sm'>
          <React.Fragment>
            {values.patientProfileFK && (
              <div style={{ marginTop: -20 }}>
                <PatientBanner
                  from='Appointment'
                  onSelectPreOrder={this.onSelectPreOrder}
                  disablePreOrder={disablePreOrderConditions}
                  activePreOrderItems={draftPreOrderItem}
                  {...this.props}
                />
              </div>
            )}
            <GridContainer
              className={classnames(classes.formContent)}
              alignItems='flex-start'
            >
              <GridItem
                container
                xs={12}
                md={6}
                style={{
                  maxHeight:
                    this.props.mainDivHeight -
                    (this.state.bannerHeight || 0) -
                    16,
                  overflow: 'auto',
                }}
              >
                <PatientInfoInput
                  disabled={disablePatientInfo}
                  isEdit={values.id}
                  onViewPatientProfileClick={this.onViewPatientProfile}
                  onSearchPatientClick={this.onSearchPatient}
                  onCreatePatientClick={this.togglePatientProfileModal}
                  onRegisterToVisitClick={navigateDirtyCheck({
                    redirectUrl: this.getVisregUrl(),
                    onProceed: () => registerToVisit(),
                  })}
                  patientContactNo={values.patientContactNo}
                  patientName={values.patientName}
                  patientProfileFK={values.patientProfileFK}
                  patientIsActive={patientIsActive}
                  appointmentStatusFK={currentAppointment.appointmentStatusFk}
                  values={values}
                  hasActiveSession={this.state.hasActiveSession}
                  containsPrimaryClinician={this.containsPrimaryClinician()}
                />
                <AppointmentDateInput
                  disabled={_disableAppointmentDate}
                  visitOrderTemplateOptions={visitOrderTemplateOptions}
                  patientProfileFK={values.patientProfileFK}
                  values={values}
                  onVisitPurposeSelected={this.onVisitPurposeSelected}
                  patientProfile={patientProfile}
                  getClinicoperationhour={this.getClinicoperationhour}
                />
                <GridItem xs md={12} className={classes.verticalSpacing}>
                  <AppointmentDataGrid
                    validationSchema={gridValidationSchema}
                    disabled={disableDataGrid}
                    appointmentDate={currentAppointment.appointmentDate}
                    data={_datagrid.map(item => ({ ...item, operationhour }))}
                    handleCommitChanges={this.onCommitChanges}
                    handleEditingRowsChange={this.onEditingRowsChange}
                    editingRows={editingRows}
                    selectedSlot={selectedSlot}
                    checkAddResource={this.checkAddResource}
                  />
                </GridItem>
                <GridItem xs md={12}>
                  <div style={{ position: 'relative' }}>
                    <span>Appointment Remarks</span>
                    <Field
                      name='currentAppointment.appointmentRemarks'
                      render={args => (
                        <OutlinedTextField
                          {...args}
                          disabled={disableDataGrid}
                          rows='5'
                          multiline
                          maxLength={2000}
                          label=''
                          className={classes.apptRemarksMultiline}
                        />
                      )}
                    />
                    <CannedTextButton
                      buttonType='text'
                      disabled={disableDataGrid}
                      cannedTextTypeFK={CANNED_TEXT_TYPE.APPOINTMENTREMARKS}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -7,
                      }}
                      handleSelectCannedText={cannedText => {
                        const remarks = currentAppointment.appointmentRemarks
                        const newRemaks = `${
                          remarks ? remarks + '\n' : ''
                        }${cannedText.text || ''}`.substring(0, 2000)
                        setFieldValue(
                          'currentAppointment.appointmentRemarks',
                          newRemaks,
                        )
                      }}
                    />
                  </div>
                </GridItem>
                <GridItem xs md={12}>
                  <Recurrence
                    size='lg'
                    disabled={this.disableRecurrence()}
                    formValues={values}
                    recurrenceDto={values.recurrenceDto}
                    handleRecurrencePatternChange={
                      this.onRecurrencePatternChange
                    }
                    checkedRecurrence={this.checkedRecurrence}
                  />
                </GridItem>
                <GridItem xs md={12}>
                  {this.showPreOrder() && (
                    <PreOrder
                      {...this.props}
                      deletePreOrderItem={this.deletePreOrderItem}
                      disabled={disableDataGrid}
                    ></PreOrder>
                  )}
                </GridItem>
                <GridItem xs md={12} className={classes.footerGrid}>
                  <FormFooter
                    // isNew={slotInfo.type === 'add'}
                    id={currentAppointment.id}
                    appointmentStatusFK={currentAppointment.appointmentStatusFk}
                    onClose={onClose}
                    disabled={disableFooterButton}
                    patientIsActive={patientIsActive}
                    disabledCheckAvailability={
                      disableCheckAvailabilityFooterButton
                    }
                    handleCancelOrDeleteClick={this.onCancelOrDeleteClick}
                    handleSaveDraftClick={this.onSaveDraftClick}
                    handleConfirmClick={this.onConfirmClick}
                    handleValidateClick={this.onValidateClick}
                  />
                </GridItem>
              </GridItem>
              <GridItem xs={12} md={6}>
                <CardContainer
                  hideHeader
                  className={classes.appointmentHistory}
                  style={{
                    height:
                      this.props.mainDivHeight -
                      (this.state.bannerHeight || 0) -
                      24,
                    overflow: 'auto',
                  }}
                >
                  <h4 style={{ fontWeight: 500 }}>Appointment History</h4>
                  <AppointmentHistory
                    handleRowDoubleClick={data => {
                      onHistoryRowSelected({ ...data, isHistory: true })
                    }}
                    handleCopyAppointmentClick={handleCopyAppointmentClick}
                  />
                </CardContainer>
              </GridItem>
            </GridContainer>
            <CommonModal
              open={showSearchPatientModal}
              title='Search Patient'
              onClose={this.toggleSearchPatientModal}
              onConfirm={this.toggleSearchPatientModal}
              maxWidth='md'
              showFooter={false}
              overrideLoading
            >
              <PatientSearchModal
                search={values.patientName}
                handleSelectClick={this.onSelectPatientClick}
              />
            </CommonModal>
            <CommonModal
              open={showPatientProfile}
              onClose={this.togglePatientProfileModal}
              onConfirm={this.onConfirmCreatePatient}
              title='Create Patient Profile'
              observe='PatientDetail'
              authority='patient'
              fullScreen
              overrideLoading
              showFooter={false}
            >
              <PatientProfile history={this.props.history} />
            </CommonModal>
            <CommonModal
              open={showDeleteConfirmationModal}
              title='Alert'
              onClose={this.closeDeleteConfirmation}
              maxWidth='sm'
            >
              <DeleteConfirmation
                handleConfirmClick={this.onConfirmCancelAppointment}
                isSeries={values.isEnableRecurrence && mode === 'series'}
              />
            </CommonModal>
            <CommonModal
              open={showSeriesUpdateConfirmation}
              title='Alert'
              onClose={this.closeSeriesUpdateConfirmation}
              maxWidth='sm'
            >
              <SeriesUpdateConfirmation
                handleConfirm={this.onConfirmSeriesUpdate}
              />
            </CommonModal>
            <CommonModal
              open={showRescheduleForm}
              title='Alert'
              onClose={this.closeRescheduleForm}
              maxWidth='sm'
            >
              <RescheduleForm onConfirmReschedule={this.onConfirmReschedule} />
            </CommonModal>
            {/*<CommonModal
              open={showSelectPreOrder}
              title='Select Pre-Order'
              onClose={this.closeSelectPreOrder}
              maxWidth='lg'
            >
              <SelectPreOrder onSelectPreOrder={this.onSelectPreOrder} activePreOrderItem={draftPreOrderItem} />
            </CommonModal>*/}
          </React.Fragment>
        </SizeContainer>
      </LoadingWrapper>
    )
  }
}

const FormComponent = withStyles(styles, { name: 'ApptForm', withTheme: true })(
  Form,
)

export default FormComponent
