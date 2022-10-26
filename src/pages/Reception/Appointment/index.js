import React from 'react'
import { connect } from 'dva'
import moment from 'moment'
// material ui
import { withStyles } from '@material-ui/core'
// common component
import { CardContainer, CommonModal, timeFormat24Hour } from '@/components'
import { ReportViewer } from '@/components/_medisys'
// sub component
import {
  APPOINTMENT_STATUS,
  CALENDAR_VIEWS,
  CALENDAR_RESOURCE,
} from '@/utils/constants'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { getRemovedUrl } from '@/utils/utils'
import Authorized from '@/utils/Authorized'
import FilterBar from './components/FilterBar'
import FuncCalendarView from './components/FuncCalendarView'
import Form from './components/form'
import DoctorBlockForm from './components/form/DoctorBlock'
import SeriesConfirmation from './SeriesConfirmation'
import AppointmentSearch from './AppointmentSearch'
// settings
import {
  defaultColorOpts,
  DoctorFormValidation,
  InitialPopoverEvent,
} from './utils'
import { ApplyClaimsColumnExtension } from '@/pages/Billing/variables'
// utils

const styles = theme => ({
  popover: {
    pointerEvents: 'none',
  },
  typography: {
    padding: theme.spacing.unit,
  },
  dateButton: {
    fontSize: '1.5rem',
    paddingBottom: '8px !important',
  },
  defaultColor: {
    background: defaultColorOpts.value,
    '&:hover': {
      backgroundColor: defaultColorOpts.activeColor,
    },
  },
})

export const flattenAppointmentDateToCalendarEvents = (massaged, event) =>
  event.isDoctorEvent
    ? [...massaged]
    : [
        ...massaged,
        {
          ...event,
          visitStatus: VISIT_STATUS.UPCOMING_APPT,
          startTime: event.appointment_Resources.reduce(
            (resources, res) => [...resources, res.startTime],
            [],
          ),
        },
      ]

@connect(
  ({
    calendar,
    codetable,
    clinicInfo,
    loading,
    user,
    clinicSettings,
    calendarResource,
  }) => ({
    calendar,
    calendarLoading: loading.models.calendar,
    clinicInfo,
    doctorprofile: codetable.doctorprofile || [],
    user,
    apptTimeSlotDuration: clinicSettings.settings.apptTimeSlotDuration,
    appointmentTypes: codetable.ctappointmenttype || [],
    ctcalendarresource: codetable.ctcalendarresource || [],
    calendarResource,
  }),
)
class Appointment extends React.PureComponent {
  state = {
    showAppointmentForm: false,
    showDoctorEventModal: false,
    showSearchAppointmentModal: false,
    resources: [],
    allResources: [],
    selectedSlot: {},
    filter: {
      search: '',
      dob: null,
      filterByApptType: [],
      filterByDoctor: [],
    },
    isDragging: false,
    selectedAppointmentFK: -1,
    selectedDoctorEventFK: -1,
    updateEvent: undefined,
  }

  async componentWillMount() {
    const { dispatch, clinicInfo } = this.props
    const startOfMonth = moment()
      .startOf('day')
      .formatUTC()
    const endOfMonth = moment()
      .endOf('day')
      .formatUTC(false)

    const filterTemplate = await dispatch({
      type: 'appointment/getFilterTemplate',
    })
    dispatch({
      type: 'calendar/query',
      payload: {
        pagesize: 9999,
        apiCriteria: {
          isCancelled: false,
          apptDateFrom: startOfMonth,
          apptDateTo: endOfMonth,
          appType: filterTemplate?.currentFilterTemplate?.filterByApptType.join(),
        },
      },
    })
    dispatch({
      type: 'appointment/updateState',
      payload: {
        filters: {
          filterByDoctor: filterTemplate?.currentFilterTemplate?.filterByDoctor,
          filterByApptType:
            filterTemplate?.currentFilterTemplate?.filterByApptType,
        },
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'clinicianprofile',
        force: true,
        filter: {
          isActive: undefined,
          current: 1,
        },
      },
    })

    let filter //= this.state.filter
    if (filterTemplate) {
      const { currentFilterTemplate } = filterTemplate
      if (currentFilterTemplate) {
        const { filterByDoctor, filterByApptType, dob } = currentFilterTemplate
        filter = {
          filterByDoctor,
          filterByApptType,
          filterBySingleDoctor:
            filterByDoctor && filterByDoctor.length
              ? filterByDoctor[0]
              : undefined,
          dob,
        }
      }
    }

    const response = await dispatch({
      type: 'calendarResource/query',
      payload: {
        pagesize: 9999,
        apiCriteria: {
          IncludeDailyCapacity: true,
          DateFrom: moment()
            .startOf('Day')
            .formatUTC(),
          DateTo: moment()
            .startOf('Day')
            .formatUTC(),
        },
        sorting: [{ columnName: 'resourceType', direction: 'asc' }],
      },
    })
    if (response) {
      let filterByDoctor = []
      let filterBySingleDoctor
      let resources = []
      let primaryCalendarResourceFK

      const viewOtherApptAccessRight = Authorized.check(
        'appointment.viewotherappointment',
      )
      if (
        viewOtherApptAccessRight &&
        viewOtherApptAccessRight.rights === 'enable'
      ) {
        const favDoctors = filter ? filter.filterByDoctor || [] : []
        const lastSelected = JSON.parse(
          sessionStorage.getItem('appointmentDoctors') || '[]',
        )
        let filterDoctors = []
        if (favDoctors.length > 0) {
          filterDoctors = favDoctors
        } else if (lastSelected.length > 0) {
          filterDoctors = lastSelected
        }

        resources = _.orderBy(
          (response.data || []).filter(x => x.isActive),
          ['resourceType', 'sortOrder', source => source.name.toUpperCase()],
          ['asc'],
        )
          .filter(calendarResource => calendarResource.isActive)
          .filter((calendarResource, index) =>
            filterDoctors.length > 0
              ? filterDoctors.includes(calendarResource.id)
              : index < 5,
          )
          .map(calendarResource => ({
            ...calendarResource,
            calendarResourceFK: calendarResource.id,
            calendarResourceName: calendarResource.name,
            resourceFK:
              calendarResource.resourceType === CALENDAR_RESOURCE.DOCTOR
                ? `Doctor-${calendarResource.clinicianProfileDto.id}`
                : `Resource-${calendarResource.resourceDto.id}`,
          }))
      } else {
        resources = response.data
          .filter(calendarResource => {
            const { user } = this.props
            return (
              calendarResource.isActive &&
              calendarResource.clinicianProfileDto?.id ===
                user.data.clinicianProfile.id
            )
          })
          .map(calendarResource => ({
            ...calendarResource,
            calendarResourceFK: calendarResource.id,
            calendarResourceName: calendarResource.name,
            resourceFK: `Doctor-${calendarResource.clinicianProfileDto.id}`,
          }))
      }
      filterByDoctor = resources.map(res => res.calendarResourceFK)
      filterBySingleDoctor =
        resources && resources.length
          ? resources[0].calendarResourceFK
          : undefined
      this.setState(() => ({
        filter: {
          ...filter,
          filterByDoctor,
          filterBySingleDoctor,
        },
        primaryCalendarResourceFK,
        resources,
        allResources: (response?.data || []).filter(
          x => x.isActive && x.resourceType === CALENDAR_RESOURCE.RESOURCE,
        ),
      }))
    } else {
      this.setState({ filter })
    }

    dispatch({
      type: 'calendar/initState',
      payload: { start: startOfMonth },
    })
    dispatch({
      type: 'doctorBlock/query',
      payload: {
        lgteql_startDateTime: startOfMonth,
      },
    })

    dispatch({
      type: 'calendar/updateState',
      payload: {
        currentViewDate: moment().toDate(),
        calendarView: CALENDAR_VIEWS.DAY,
      },
    })
  }

  componentWillUnmount() {
    const { dispatch } = this.props
    // reset doctor profile codetable
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'doctorprofile',
        force: true,
        filter: {
          'clinicianProfile.isActive': true,
        },
      },
    })

    // reset clinician profile codetable
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'clinicianprofile',
        force: true,
      },
    })
  }

  refreshResources = async () => {
    const { calendar } = this.props
    const { filter = {} } = this.state
    const { filterByDoctor = [], filterBySingleDoctor } = filter
    const response = await this.getCalendarResource(
      calendar.calendarView,
      calendar.currentViewDate,
    )
    let newResources = []
    if (response) {
      newResources = _.orderBy(
        (response.data || []).filter(x => x.isActive),
        ['resourceType', 'sortOrder', source => source.name.toUpperCase()],
        ['asc'],
      )
        .filter(calendarResource =>
          calendar.calendarView === CALENDAR_VIEWS.DAY
            ? !filterByDoctor.length ||
              filterByDoctor.includes(calendarResource.id)
            : filterBySingleDoctor === calendarResource.id,
        )
        .map(calendarResource => ({
          ...calendarResource,
          calendarResourceFK: calendarResource.id,
          calendarResourceName: calendarResource.name,
          resourceFK:
            calendarResource.resourceType === CALENDAR_RESOURCE.DOCTOR
              ? `Doctor-${calendarResource.clinicianProfileDto.id}`
              : `Resource-${calendarResource.resourceDto.id}`,
        }))
    }
    this.setState(() => ({
      resources: newResources.length > 0 ? newResources : [],
      allResources: (response?.data || []).filter(
        x => x.isActive && x.resourceType === CALENDAR_RESOURCE.RESOURCE,
      ),
    }))
  }

  closeAppointmentForm = async (clearPatient = true) => {
    this.setState({
      selectedAppointmentFK: -1,
      showAppointmentForm: false,
      updateEvent: undefined,
    })
    await this.refreshResources()
    const { dispatch, history } = this.props
    dispatch({
      type: 'calendar/updateState',
      payload: {
        currentViewAppointment: { appointments: [] },
        conflicts: [],
        isEditedAsSingleAppointment: false,
      },
    })

    dispatch({
      type: 'global/updateState',
      payload: {
        disableSave: false,
      },
    })

    if (clearPatient) {
      dispatch({
        type: 'patient/updateState',
        payload: { entity: null },
      })
    }
    history.push(getRemovedUrl(['md', 'pid', 'apptid']))
  }

  moveEvent = props => {
    this.setState({
      isDragging: false,
    })
  }

  printDailyAppointmentReport = (date, calendarResourceFK) => {
    this.reportDailyAppt(date, date, calendarResourceFK)
  }

  reportDailyAppt = (start, end, calendarResourceFK) => {
    this.setState({
      selectedSlot: { start, end, calendarResourceFK },
      showDailyAppointmentListingReport: true,
    })
  }

  createDailyApptListingPayload = ({ start, end, calendarResourceFK }) => {
    var payload = {
      apptDateFrom: moment(start)
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .toDate(),
      apptDateto: moment(end)
        .set({ hour: 23, minute: 59, second: 59 })
        .toDate(),
      doctor: calendarResourceFK,
    }
    return payload
  }

  onSelectSlot = props => {
    const { start, end, action, resourceId } = props || {}
    const createApptAccessRight = Authorized.check('appointment.newappointment')

    if (createApptAccessRight && createApptAccessRight.rights !== 'enable')
      return

    if (action === 'select' || action === 'click') return

    const selectedSlot = {
      allDay: start - end === 0,
      start,
      end,
      resourceId,
    }
    this.setState(
      {
        selectedSlot,
        isDragging: false,
        showAppointmentForm: true,
      },
      () => {
        this.props.dispatch({
          type: 'calendar/getClinicOperationhour',
          payload: {
            apptDate: moment(start)
              .startOf('day')
              .formatUTC(),
          },
        })
      },
    )
  }

  onDoubleClickEvent = doubleClickEvent => {
    const {
      id,
      appointmentFK,
      isEditedAsSingleAppointment,
      isEditedAsSingleDoctorBlock,
      isEnableRecurrence,
      appointmentStatusFk,
      isHistory,
      isDoctorBlock,
    } = doubleClickEvent

    if (
      isHistory &&
      [
        APPOINTMENT_STATUS.RESCHEDULED,
        APPOINTMENT_STATUS.PFA_RESCHEDULED,
      ].includes(appointmentStatusFk)
    )
      return

    const viewApptAccessRight = Authorized.check(
      'appointment.appointmentdetails',
    )
    const viewDoctorBlockAccessRight = Authorized.check(
      'settings.clinicsetting.doctorblock',
    )

    if (
      (viewApptAccessRight &&
        viewApptAccessRight.rights !== 'enable' &&
        !isDoctorBlock) ||
      (isDoctorBlock &&
        viewDoctorBlockAccessRight &&
        viewDoctorBlockAccessRight.rights !== 'enable')
    )
      return

    if (isDoctorBlock) {
      let shouldShowDoctorBlockForm = true

      if (this.state.showDoctorEventModal) {
        this.setState({
          selectedDoctorEventFK: undefined,
          showDoctorEventModal: false,
          isDragging: false,
        })
      }

      if (isEnableRecurrence) {
        if (!isEditedAsSingleDoctorBlock) {
          shouldShowDoctorBlockForm = false
          this.setState({
            selectedDoctorEventFK: id,
            showSeriesConfirmation: true,
            eventType: 'DoctorBlock',
            isDragging: false,
          })
        }
      }
      if (shouldShowDoctorBlockForm) {
        this.props
          .dispatch({
            type: 'doctorBlock/getDoctorBlockDetails',
            payload: {
              id,
              mode: 'single',
            },
          })
          .then(response => {
            if (response) {
              this.setState(
                {
                  selectedDoctorEventFK: id,
                  showDoctorEventModal: true,
                  isDragging: false,
                },
                () => {
                  this.props.dispatch({
                    type: 'doctorBlock/getClinicOperationhour',
                    payload: {
                      apptDate: moment(response.doctorBlocks[0].startDateTime)
                        .startOf('day')
                        .formatUTC(),
                    },
                  })
                },
              )
            }
          })
      }
    } else {
      const selectedAppointmentID =
        appointmentFK === undefined ? id : appointmentFK
      let shouldShowApptForm = true

      if (this.state.showAppointmentForm) {
        this.setState({
          selectedAppointmentFK: undefined,
          showAppointmentForm: false,
          isDragging: false,
          updateEvent: undefined,
        })
      }

      if (isEnableRecurrence) {
        if (!isEditedAsSingleAppointment) {
          shouldShowApptForm = false
          this.setState({
            selectedAppointmentFK: selectedAppointmentID,
            showSeriesConfirmation: true,
            eventType: 'Appointment',
            isDragging: false,
          })
        }
      }
      if (shouldShowApptForm) {
        this.props
          .dispatch({
            type: 'calendar/getAppointmentDetails',
            payload: {
              id: selectedAppointmentID,
              mode: 'single',
            },
          })
          .then(response => {
            if (response) {
              this.setState(
                {
                  selectedAppointmentFK: selectedAppointmentID,
                  showAppointmentForm: true,
                  isDragging: false,
                },
                () => {
                  this.props.dispatch({
                    type: 'calendar/getClinicOperationhour',
                    payload: {
                      apptDate: response.appointments[0].appointmentDate,
                    },
                  })
                },
              )
            }
          })
      }
    }
  }

  handleClosePopover = () => {
    this.setState({
      showPopup: false,
      popoverEvent: { ...InitialPopoverEvent },
      popupAnchor: null,
    })
  }

  handleOnDragStart = () => {
    this.setState({
      showPopup: false,
      popoverEvent: { ...InitialPopoverEvent },
      popupAnchor: null,
      isDragging: true,
    })
  }

  onFilterClick = filter => {
    this.props.dispatch({
      type: 'calendar/filterCalendar',
      payload: { ...filter },
    })
  }

  getCalendarResource = async (view, date) => {
    const { dispatch } = this.props
    let calendarView = 'month'
    if (view === CALENDAR_VIEWS.DAY) {
      calendarView = 'day'
    } else if (view === CALENDAR_VIEWS.WEEK) {
      calendarView = 'week'
    }
    const dateFrom =
      view !== CALENDAR_VIEWS.MONTH
        ? moment(date)
            .startOf(calendarView)
            .formatUTC()
        : moment().startOf(calendarView) >= moment(date).startOf(calendarView)
        ? moment()
            .startOf('day')
            .formatUTC()
        : moment(date)
            .startOf(calendarView)
            .formatUTC()
    const dateTo = moment(date)
      .endOf(calendarView)
      .startOf('day')
      .formatUTC()
    const response = await dispatch({
      type: 'calendarResource/query',
      payload: {
        pagesize: 9999,
        apiCriteria: {
          IncludeDailyCapacity: true,
          DateFrom: dateFrom,
          DateTo: dateTo,
        },
      },
    })

    return response
  }

  onFilterUpdate = async filter => {
    const {
      filterByDoctor = [],
      dob,
      search,
      filterByApptType,
      filterBySingleDoctor,
    } = filter
    const { calendar } = this.props
    const response = await this.getCalendarResource(
      calendar.calendarView,
      calendar.currentViewDate,
    )
    let newResources = []
    if (response) {
      newResources = _.orderBy(
        (response.data || []).filter(x => x.isActive),
        ['resourceType', 'sortOrder', source => source.name.toUpperCase()],
        ['asc'],
      )
        .filter(calendarResource =>
          calendar.calendarView === CALENDAR_VIEWS.DAY
            ? !filterByDoctor.length ||
              filterByDoctor.includes(calendarResource.id)
            : filterBySingleDoctor === calendarResource.id,
        )
        .map(calendarResource => ({
          ...calendarResource,
          calendarResourceFK: calendarResource.id,
          calendarResourceName:
            calendarResource.resourceType === CALENDAR_RESOURCE.DOCTOR
              ? calendarResource.clinicianProfileDto.shortName ||
                calendarResource.clinicianProfileDto.name
              : calendarResource.name,
          resourceFK:
            calendarResource.resourceType === CALENDAR_RESOURCE.DOCTOR
              ? `Doctor-${calendarResource.clinicianProfileDto.id}`
              : `Resource-${calendarResource.resourceDto.id}`,
        }))
    }
    const updFilter = {
      dob: dob || undefined,
      search: search || undefined,
      filterByApptType: filterByApptType,
      filterByDoctor: filterByDoctor,
      filterBySingleDoctor: filterBySingleDoctor,
    }

    this.setState(() => ({
      filter: { ...updFilter },
      resources: newResources.length > 0 ? newResources : [],
      allResources: (response?.data || []).filter(
        x => x.isActive && x.resourceType === CALENDAR_RESOURCE.RESOURCE,
      ),
    }))

    this.props.dispatch({
      type: 'calendar/filterCalendar',
      payload: {
        search: updFilter.search,
        dob: updFilter.dob,
        doctor:
          calendar.calendarView === CALENDAR_VIEWS.DAY
            ? updFilter.filterByDoctor
            : [updFilter.filterBySingleDoctor],
        appType: updFilter.filterByApptType,
      },
    })
  }

  handleAddAppointmentClick = () => {
    this.onSelectSlot({ start: new Date(), end: new Date() })
  }

  handleCopyAppointmentClick = selectedAppointmentID => {
    let shouldShowApptForm = true
    if (this.state.showAppointmentForm) {
      this.setState({
        selectedAppointmentFK: undefined,
        showAppointmentForm: false,
        isDragging: false,
        updateEvent: undefined,
      })
    }
    this.props
      .dispatch({
        type: 'calendar/copyAppointment',
        payload: {
          id: selectedAppointmentID,
          mode: 'single',
          bookedByUserFk: this.props.user.data.id,
        },
      })
      .then(response => {
        if (response)
          this.setState({
            selectedAppointmentFK: selectedAppointmentID,
            showAppointmentForm: shouldShowApptForm,
            isDragging: false,
          })
      })
  }

  handleDoctorEventClick = () => {
    const { showDoctorEventModal } = this.state
    this.setState(
      {
        showDoctorEventModal: !showDoctorEventModal,
        updateEvent: undefined,
      },
      () => {
        this.props.dispatch({
          type: 'doctorBlock/getClinicOperationhour',
          payload: {
            apptDate: moment()
              .startOf('day')
              .formatUTC(),
          },
        })
      },
    )
    this.props.dispatch({
      type: 'doctorBlock/updateState',
      payload: {
        currentViewDoctorBlock: {},
      },
    })
  }

  closeDoctorBlockModal = () => {
    this.setState({ showDoctorEventModal: false, updateEvent: undefined })
    this.props.dispatch({
      type: 'doctorBlock/updateState',
      payload: {
        currentViewDoctorBlock: {},
        isEditedAsSingleDoctorBlock: false,
      },
    })
  }

  closeSeriesConfirmation = () => {
    this.props.dispatch({
      type: 'calendar/setViewAppointment',
      data: { appointments: [] },
    })
    this.setState({ showSeriesConfirmation: false, eventType: '' })
  }

  editSeriesConfirmation = (isEditedAsSingle = false) => {
    const { dispatch } = this.props
    const {
      selectedAppointmentFK,
      eventType,
      selectedDoctorEventFK,
    } = this.state
    dispatch({
      type:
        eventType === 'Appointment'
          ? 'calendar/getAppointmentDetails'
          : 'doctorBlock/getDoctorBlockDetails',
      payload: {
        id:
          eventType === 'Appointment'
            ? selectedAppointmentFK
            : selectedDoctorEventFK,
        // isEditedAsSingleAppointment,
        mode: isEditedAsSingle ? 'single' : 'series',
      },
    }).then(response => {
      if (response) {
        this.setState(
          {
            isDragging: false,
            showSeriesConfirmation: false,
            eventType: '',
            showAppointmentForm: eventType === 'Appointment',
            showDoctorEventModal: eventType === 'DoctorBlock',
          },
          () => {
            if (eventType === 'Appointment') {
              dispatch({
                type: 'calendar/getClinicOperationhour',
                payload: {
                  apptDate: response.appointments.find(
                    x => x.id === selectedAppointmentFK,
                  )?.appointmentDate,
                },
              })
            } else {
              dispatch({
                type: 'doctorBlock/getClinicOperationhour',
                payload: {
                  apptDate: moment(
                    response.find(x => x.id === selectedDoctorEventFK)
                      ?.startDateTime,
                  )
                    .startOf('day')
                    .formatUTC(),
                },
              })
            }
          },
        )
      }
    })
  }

  handleAfterSubmitDoctorBlock = () => {
    this.props.dispatch({
      type: 'calendar/refresh',
    })
  }

  queryCodetables = async () => {
    const { dispatch } = this.props
    await Promise.all([
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'ctroom',
        },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'ltappointmentstatus',
        },
      }),
    ])
  }

  toggleSearchAppointmentModal = async () => {
    await this.queryCodetables()

    this.setState(prevState => {
      return {
        showSearchAppointmentModal: !prevState.showSearchAppointmentModal,
      }
    })
  }

  toggleDailyAppointmentListingReport = () => {
    this.setState(prevState => {
      return {
        showDailyAppointmentListingReport: !prevState.showDailyAppointmentListingReport,
      }
    })
  }

  onResourceDateChange = async (view, targetDate) => {
    const response = await this.getCalendarResource(view, targetDate)

    if (response) {
      const { filterByDoctor = [], filterBySingleDoctor } = this.state.filter
      const newResources = _.orderBy(
        (response.data || []).filter(x => x.isActive),
        ['resourceType', 'sortOrder', source => source.name.toUpperCase()],
        ['asc'],
      )
        .filter(calendarResource =>
          view === CALENDAR_VIEWS.DAY
            ? !filterByDoctor.length ||
              filterByDoctor.includes(calendarResource.id)
            : filterBySingleDoctor === calendarResource.id,
        )
        .map(calendarResource => ({
          ...calendarResource,
          calendarResourceFK: calendarResource.id,
          calendarResourceName: calendarResource.name,
          resourceFK:
            calendarResource.resourceType === CALENDAR_RESOURCE.DOCTOR
              ? `Doctor-${calendarResource.clinicianProfileDto.id}`
              : `Resource-${calendarResource.resourceDto.id}`,
        }))

      this.setState(preFilter => ({
        ...preFilter,
        resources: newResources.length > 0 ? newResources : [],
        allResources: (response?.data || []).filter(
          x => x.isActive && x.resourceType === CALENDAR_RESOURCE.RESOURCE,
        ),
      }))
    }
  }

  onUpdateEvent = event => {
    const {
      id,
      appointmentFK,
      appointmentStatusFk,
      isDoctorBlock,
      resourceId,
      startTime,
      endTime,
      view,
      isFromCopy,
      isAffectAllResource,
    } = event

    const viewApptAccessRight = Authorized.check(
      'appointment.appointmentdetails',
    )
    const viewDoctorBlockAccessRight = Authorized.check(
      'settings.clinicsetting.doctorblock',
    )

    if (
      (viewApptAccessRight &&
        viewApptAccessRight.rights !== 'enable' &&
        !isDoctorBlock) ||
      (isDoctorBlock &&
        viewDoctorBlockAccessRight &&
        viewDoctorBlockAccessRight.rights !== 'enable')
    )
      return

    if (isDoctorBlock) {
      if (this.state.showDoctorEventModal) {
        this.setState({
          selectedDoctorEventFK: undefined,
          showDoctorEventModal: false,
          isDragging: false,
          updateEvent: undefined,
        })
      }

      if (isFromCopy) {
        this.props
          .dispatch({
            type: 'doctorBlock/copyDoctorBlock',
            payload: {
              id,
              mode: 'single',
              updateReource: {
                newResourceId: resourceId,
                newStartTime: startTime,
                newEndTime: endTime,
                view,
              },
            },
          })
          .then(response => {
            if (response) {
              this.setState({
                selectedDoctorEventFK: id,
                showDoctorEventModal: true,
                eventType: 'DoctorBlock',
                isDragging: false,
              })
            }
          })
      } else {
        this.props
          .dispatch({
            type: 'doctorBlock/getDoctorBlockDetails',
            payload: {
              id,
              mode: 'single',
            },
          })
          .then(response => {
            if (response) {
              this.setState(
                {
                  selectedDoctorEventFK: id,
                  showDoctorEventModal: true,
                  eventType: 'DoctorBlock',
                  updateEvent: {
                    newResourceId: resourceId,
                    newStartTime: startTime,
                    newEndTime: endTime,
                    view,
                  },
                  isDragging: false,
                },
                () => {
                  this.props.dispatch({
                    type: 'doctorBlock/getClinicOperationhour',
                    payload: {
                      apptDate: moment(startTime)
                        .startOf('day')
                        .formatUTC(),
                    },
                  })
                },
              )
            }
          })
      }
    } else {
      const selectedAppointmentID =
        appointmentFK === undefined ? id : appointmentFK

      if (this.state.showAppointmentForm) {
        this.setState({
          selectedAppointmentFK: undefined,
          showAppointmentForm: false,
          isDragging: false,
          updateEvent: undefined,
        })
      }

      if (isFromCopy) {
        this.props
          .dispatch({
            type: 'calendar/copyAppointment',
            payload: {
              id: selectedAppointmentID,
              mode: 'single',
              bookedByUserFk: this.props.user.data.id,
              updateReource: {
                updateApptResourceId: id,
                newResourceId: resourceId,
                newStartTime: startTime,
                newEndTime: endTime,
                view: view,
              },
            },
          })
          .then(response => {
            if (response) {
              this.setState({
                selectedAppointmentFK: selectedAppointmentID,
                showAppointmentForm: true,
                eventType: 'Appointment',
                isDragging: false,
              })
            }
          })
      } else {
        this.props
          .dispatch({
            type: 'calendar/getAppointmentDetails',
            payload: {
              id: selectedAppointmentID,
              mode: 'single',
            },
          })
          .then(response => {
            if (response) {
              this.setState(
                {
                  selectedAppointmentFK: selectedAppointmentID,
                  showAppointmentForm: true,
                  eventType: 'Appointment',
                  updateEvent: {
                    updateApptResourceId: id,
                    newResourceId: resourceId,
                    newStartTime: startTime,
                    newEndTime: endTime,
                    view: view,
                    isAffectAllResource,
                  },
                  isDragging: false,
                },
                () => {
                  this.props.dispatch({
                    type: 'calendar/getClinicOperationhour',
                    payload: {
                      apptDate: moment(startTime)
                        .startOf('day')
                        .formatUTC(),
                    },
                  })
                },
              )
            }
          })
      }
    }
  }

  render() {
    const {
      calendar: CalendarModel,
      calendarLoading,
      dispatch,
      user,
      ctcalendarresource,
      apptTimeSlotDuration,
      appointmentTypes,
    } = this.props
    const {
      showAppointmentForm,
      showDoctorEventModal,
      showSeriesConfirmation,
      selectedSlot,
      resources,
      filter = {},
      selectedAppointmentFK,
      showSearchAppointmentModal,
      eventType,
      showDailyAppointmentListingReport,
      updateEvent,
      allResources,
    } = this.state

    const { currentViewAppointment, mode, calendarView } = CalendarModel

    let formTitle = 'Appointment'

    if (currentViewAppointment.isEnableRecurrence) {
      formTitle =
        mode === 'single'
          ? `${formTitle} (Editing Single) `
          : `${formTitle} (Editing Entire Series) `
    }

    return (
      <CardContainer hideHeader size='sm'>
        <FilterBar
          dispatch={dispatch}
          search={filter.search}
          dob={filter.dob}
          loading={calendarLoading}
          filterByDoctor={filter.filterByDoctor}
          filterBySingleDoctor={filter.filterBySingleDoctor}
          filterByApptType={filter.filterByApptType}
          handleUpdateFilter={this.onFilterUpdate}
          onFilterClick={this.onFilterClick}
          onDoctorEventClick={this.handleDoctorEventClick}
          onAddAppointmentClick={this.handleAddAppointmentClick}
          toggleSearchAppointmentModal={this.toggleSearchAppointmentModal}
        />
        <Authorized authority='appointment.appointmentdetails'>
          <FuncCalendarView
            resources={resources}
            allResources={allResources}
            filter={filter}
            handleSelectSlot={this.onSelectSlot}
            handleDoubleClick={this.onDoubleClickEvent}
            handleMoveEvent={this.moveEvent}
            handleEventMouseOver={this.onEventMouseOver}
            handleOnDragStart={this.handleOnDragStart}
            printDailyAppointmentReport={this.printDailyAppointmentReport}
            onResourceDateChange={this.onResourceDateChange}
            onUpdateEvent={this.onUpdateEvent}
            {...this.props}
          />
        </Authorized>

        <CommonModal
          open={showAppointmentForm}
          title={formTitle}
          onClose={this.closeAppointmentForm}
          onConfirm={this.closeAppointmentForm}
          showFooter={false}
          fullScreen
          overrideLoading
          observe='AppointmentForm'
        >
          {showAppointmentForm && (
            <Form
              history={this.props.history}
              resources={resources}
              selectedAppointmentID={selectedAppointmentFK}
              selectedSlot={{
                ...selectedSlot,
                resourceId:
                  calendarView === CALENDAR_VIEWS.DAY
                    ? selectedSlot.resourceId
                    : filter.filterBySingleDoctor,
              }}
              updateEvent={updateEvent}
              onHistoryRowSelected={this.onDoubleClickEvent}
              apptTimeSlotDuration={apptTimeSlotDuration}
              handleCopyAppointmentClick={this.handleCopyAppointmentClick}
              appointmentTypes={appointmentTypes}
              registerToVisit={() => {
                this.closeAppointmentForm(false)
              }}
            />
          )}
        </CommonModal>
        <CommonModal
          open={showDoctorEventModal}
          title='Doctor Block'
          onClose={this.closeDoctorBlockModal}
          onConfirm={this.handleDoctorEventClick}
          observe='DoctorBlockForm'
        >
          <DoctorBlockForm
            updateEvent={updateEvent}
            validationSchema={DoctorFormValidation}
            handleAfterSubmit={this.handleAfterSubmitDoctorBlock}
          />
        </CommonModal>
        <CommonModal
          open={showSeriesConfirmation}
          title='Alert'
          onClose={this.closeSeriesConfirmation}
          maxWidth='sm'
        >
          <SeriesConfirmation
            eventType={eventType}
            onConfirmClick={this.editSeriesConfirmation}
          />
        </CommonModal>

        <CommonModal
          open={showSearchAppointmentModal}
          title='Appointment Search'
          onClose={this.toggleSearchAppointmentModal}
          maxWidth='xl'
        >
          <AppointmentSearch
            handleDoubleClick={this.onDoubleClickEvent}
            handleAddAppointmentClick={this.handleAddAppointmentClick}
            handleCopyAppointmentClick={this.handleCopyAppointmentClick}
            currentUser={user.data.clinicianProfile.id}
            ctcalendarresource={ctcalendarresource}
          />
        </CommonModal>

        <CommonModal
          open={showDailyAppointmentListingReport}
          onClose={this.toggleDailyAppointmentListingReport}
          title='Daily Appointment Listing'
          maxWidth='lg'
        >
          <ReportViewer
            showTopDivider={false}
            reportID={81}
            reportParameters={{
              ...this.createDailyApptListingPayload(selectedSlot),
            }}
            defaultScale={1.5}
          />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'AppointmentPage' })(Appointment)
