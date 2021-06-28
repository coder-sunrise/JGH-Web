import React, { useCallback, useMemo } from 'react'
import { connect } from 'dva'
// moment
import moment from 'moment'
// big calendar
import BigCalendar from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
// material ui
import { withStyles } from '@material-ui/core'
// components
import { serverDateFormat, Tooltip } from '@/components'
// medisys components
import { LoadingWrapper } from '@/components/_medisys'
// setting
import Authorized from '@/utils/Authorized'
// assets
import { primaryColor } from '@/assets/jss'

import { ContextMenuComponent } from '@syncfusion/ej2-react-navigations'
import { ScheduleComponent, Day, Week, Month, ViewsDirective, ViewDirective, ResourcesDirective, ResourceDirective, Inject, Timezone } from '@syncfusion/ej2-react-schedule'
import { closest, extend, Internationalization, isNullOrUndefined } from '@syncfusion/ej2-base'

import { doctorEventColorOpts } from '../utils'
// sub component
import CalendarToolbar from './Toolbar'
import Event from './Event'
import TimeSlotComponent from './TimeSlotComponent'
import { getFirstAppointmentType } from './form/formUtils'
import { SampleBase } from './SampleBase'
import './FuncCalendarView.css'

const styles = () => ({
  customMaxWidth: {
    maxWidth: 500,
  },
  calendarHoliday: {
    '& span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  calendarHolidayLabel: {
    paddingLeft: 4,
    float: 'left',
    textAlign: 'left',
    maxWidth: '90%',
    fontSize: '0.9rem',
    fontWeight: '450',
    color: '#fff',
  },
})

const DragAndDropCalendar = withDragAndDrop(BigCalendar)
const localizer = BigCalendar.momentLocalizer(moment)
const today = new Date()
const minTime = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate(),
  7,
  0,
  0,
)
const maxTime = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate(),
  21,
  30,
  0,
)

const applyFilter = (filter, data, isDayView) => {
  const {
    filterByApptType,
    filterByDoctor,
    search = '',
    filterBySingleDoctor,
  } = filter
  const viewOtherApptAccessRight = Authorized.check(
    'appointment.viewotherappointment',
  )
  if (
    isDayView &&
    filterByDoctor.length <= 0 &&
    (!viewOtherApptAccessRight || viewOtherApptAccessRight.rights !== 'enable')
  ) {
    return []
  }

  let returnData = [
    ...data,
  ]

  try {
    // filter by patient name and ignore doctorblock
    if (search !== '') {
      const _searchStr = search.toLowerCase()
      returnData = returnData.filter((eachData) => {
        if (eachData.isDoctorBlock) return true
        const { patientProfile, patientName, patientContactNo } = eachData
        if (patientProfile) {
          const { contactNumbers = [] } = patientProfile
          const mobile = contactNumbers.find(
            (item) => item.numberTypeFK === 1,
          ) || { number: '' }

          return (
            patientProfile.name.toLowerCase().indexOf(_searchStr) >= 0 ||
            patientProfile.patientAccountNo.toLowerCase().indexOf(_searchStr) >=
            0 ||
            mobile.number.toLowerCase().indexOf(_searchStr) >= 0
          )
        }

        return (
          patientName.toLowerCase().indexOf(_searchStr) >= 0 ||
          patientContactNo.toLowerCase().indexOf(_searchStr) >= 0
        )
      })
    }

    // filter by doctor
    if (isDayView) {
      if (filterByDoctor.length > 0 && filterByDoctor.indexOf(-99) !== 0) {
        returnData = returnData.filter((eachData) => {
          if (eachData.isDoctorBlock)
            return filterByDoctor.includes(eachData.doctor.clinicianProfile.id)

          return filterByDoctor.includes(eachData.clinicianFK)
        })
      }
    } else {
      returnData = returnData.filter((eachData) => {
        if (eachData.isDoctorBlock)
          return filterBySingleDoctor === eachData.doctor.clinicianProfile.id

        return filterBySingleDoctor === eachData.clinicianFK
      })
    }

    // filter by appointment type
    if (filterByApptType.length > 0 && !filterByApptType.includes(-99)) {
      returnData = returnData.filter(
        (eachData) =>
          eachData.isDoctorBlock ||
          filterByApptType.includes(eachData.appointmentTypeFK),
      )
    }
  } catch (error) {
    console.log({ error })
  }

  return returnData
}

const MonthDateHeader = withStyles(styles, { name: 'MonthDateHeader' })(
  connect(({ calendar }) => ({
    publicHolidayList: calendar.publicHolidayList,
  }))(({ classes, date, onDrillDown, label, publicHolidayList }) => {
    let holidayLabel = ''
    const momentDate = moment(date)
    const publicHoliday = publicHolidayList.filter((item) => {
      const momentStartDate = moment(item.startDate)
      const momentEndDate = moment(item.endDate)

      if (momentDate.isBetween(momentStartDate, momentEndDate, 'days', '[]'))
        return true
      return false
    })

    if (publicHoliday.length > 0) {
      holidayLabel = publicHoliday.map((item) => item.displayValue).join(', ')

      return (
        <Tooltip
          title={<span style={{ wordWrap: 'break-word' }}>{holidayLabel}</span>}
          placement='top'
          enterDelay={250}
          classes={{ tooltip: classes.customMaxWidth }}
        >
          <div className={classes.calendarHoliday}>
            <span className={classes.calendarHolidayLabel}>{holidayLabel}</span>
            <a onClick={onDrillDown}>{label}</a>
          </div>
        </Tooltip>
      )
    }
    return (
      <div className={classes.calendarHoliday}>
        <span className={classes.calendarHolidayLabel}>{holidayLabel}</span>
        <a onClick={onDrillDown}>{label}</a>
      </div>
    )
  }),
)

export class CalendarView extends SampleBase {
  constructor (props) {
    super(props)
    this.intl = new Internationalization()
    this.contextMenuItems = [
      { text: 'Copy', iconCss: 'e-icons new', id: 'Copy' },
      { text: 'Cut', iconCss: 'e-icons recurrence', id: 'Cut' },
      { text: 'Paste', iconCss: 'e-icons edit', id: 'Paste' },
    ]
    this.calendarCollections = [
      { CalendarText: 'My Calendar', CalendarId: 1, CalendarColor: '#c43081' },
      { CalendarText: 'Company', CalendarId: 2, CalendarColor: '#ff7f50' },
      { CalendarText: 'Birthday', CalendarId: 3, CalendarColor: '#AF27CD' },
      { CalendarText: 'Holiday', CalendarId: 4, CalendarColor: '#808000' },
    ]
  }

  render () {
    const {
      dispatch,
      // --- event handlers ---
      handleSelectSlot,
      handleSelectEvent,
      handleDoubleClick,
      handleOnDragStart,
      handleEventMouseOver,
      handleMoveEvent,
      // --- variables ---
      calendarEvents,
      publicHolidays,
      doctorBlocks,
      resources,
      displayDate,
      calendarView,
      filter,
      loading,
      appointmentTypes,
    } = this.props

    const _draggableAccessor = (event) => {
      if (event.isEnableRecurrence) return false
      if (event.doctor) return false
      return true
    }
    const _eventColors = (event) => {
      const { doctor } = event

      if (doctor) {
        return {
          style: {
            backgroundColor: doctorEventColorOpts.value,
          },
        }
      }

      let appointmentType
      if (calendarView !== BigCalendar.Views.MONTH) {
        appointmentType = appointmentTypes.find(
          (item) => item.id === event.appointmentTypeFK,
        )
      } else {
        const appointmentTypeFK = getFirstAppointmentType(event)
        appointmentType =
          appointmentTypeFK !== null &&
          appointmentTypes.find((item) => item.id === appointmentTypeFK)
      }

      return {
        style: {
          backgroundColor: !appointmentType
            ? primaryColor
            : appointmentType.tagColorHex,
        },
      }
    }

    const _customDayPropGetter = (date) => {
      const momentDate = moment(date)
      const publicHoliday = publicHolidays.find((item) => {
        const momentStartDate = moment(item.startDate)
        const momentEndDate = moment(item.endDate)
        if (momentDate.isBetween(momentStartDate, momentEndDate, 'days', '[]'))
          return true
        return false
      })

      if (calendarView === BigCalendar.Views.MONTH && publicHoliday)
        return {
          className: 'calendar-holiday',
        }
      return {}
    }

    const _jumpToDate = (date) => {
      dispatch({
        type: 'calendar/navigateCalendar',
        payload: { date },
      })
    }

    const _onViewChange = (view) => {
      dispatch({
        type: 'calendar/navigateCalendar',
        payload: { view },
      })
      dispatch({
        type: 'calendar/setCalendarView',
        payload: view,
      })
    }

    const _moveEvent = (props) => {
      handleMoveEvent({ props })
    }

    const _jumpToSelectedValue = (value, type, currentDate) => {
      const desiredDate = moment(currentDate).add(value, type).toDate()

      dispatch({
        type: 'calendar/navigateCalendar',
        payload: { date: desiredDate },
      })
    }

    const Toolbar = (toolbarProps) => {
      return (
        <CalendarToolbar
          {...toolbarProps}
          handleViewChange={_onViewChange}
          handleDateChange={_jumpToDate}
          handleSelectedValue={_jumpToSelectedValue}
        />
      )
    }

    const EventComponent = (eventProps) => {
      return (
        <Event
          {...eventProps}
        />
      )
    }

    const eventList = () => {
      if (calendarView === BigCalendar.Views.MONTH)
        return calendarEvents.reduce((events, appointment) => {
          const { appointment_Resources: apptResources = [] } = appointment
          const firstApptRes = apptResources.find(
            (item) => item.isPrimaryClinician,
          )

          if (!firstApptRes) return events

          const firstClinicianFK =
            firstApptRes !== undefined ? firstApptRes.clinicianFK : undefined

          const firstAppointmentTypeFK =
            firstApptRes !== undefined
              ? firstApptRes.appointmentTypeFK
              : undefined

          return [
            ...events,
            {
              ...appointment,
              appointmentTypeFK: firstAppointmentTypeFK,
              clinicianFK: firstClinicianFK,
              resourceId: firstClinicianFK,
              clinicianName: !firstApptRes
                ? undefined
                : firstApptRes.clinicianName,
              startTime: moment(
                `${appointment.appointmentDate} ${firstApptRes.startTime}`,
                `${serverDateFormat} HH:mm`,
              ).toDate(),
              endTime: moment(
                `${appointment.appointmentDate} ${firstApptRes.endTime}`,
                `${serverDateFormat} HH:mm`,
              ).toDate(),
            },
          ]
        }, [])
      return calendarEvents.reduce((events, appointment) => {
        const {
          appointmentDate,
          patientProfile,
          patientName,
          patientContactNo,
          isEnableRecurrence,
          appointment_Resources: apptResources,
          appointmentRemarks,
          appointmentStatusFk,
          bookedByUser,
          createDate,
          isEditedAsSingleAppointment,
        } = appointment

        const apptEvents = apptResources.map((item) => ({
          ...item,
          resourceId: item.clinicianFK,
          clinicianFK: item.clinicianFK,
          patientProfile,
          patientName,
          patientContactNo,
          isEnableRecurrence,
          appointmentRemarks,
          appointmentStatusFk,
          bookedByUser,
          createDate,
          isEditedAsSingleAppointment,
          StartTime: moment(
            `${appointmentDate} ${item.startTime}`,
            `${serverDateFormat} HH:mm`,
          ).toDate(),
          EndTime: moment(
            `${appointmentDate} ${item.endTime}`,
            `${serverDateFormat} HH:mm`,
          ).toDate(),
        }))

        return [
          ...events,
          ...apptEvents,
        ]
      }, [])
    }

    const filtered = () => {
      return applyFilter(
        filter,
        [
          ...eventList(),
          ...doctorBlocks.map((item) => ({
            ...item,
            isDoctorBlock: true,
            resourceId: item.doctor.clinicianProfile.id,
            start: moment(item.startDateTime).toDate(),
            end: moment(item.endDateTime).toDate(),
          })),
        ],
        calendarView === BigCalendar.Views.DAY,
      )
    }
    console.log('Resources', this.scheduleObj)
    return (
      <div className='schedule-control-section' style={{ margin: '20px 10px' }}>
        <div className='col-lg-9 control-section'>
          <div className='control-wrapper'>
            <ScheduleComponent id='scheduler'
              cssClass='schedule-overview'
              ref={(value) => { this.scheduleObj = value }}
              width='100%'
              height='100%'
              group={{ resources: ['Resources'] }}
              timezone='UTC'
              currentView='Day'
              startHour='07:00 AM'
              endHour='22:00 PM'
              eventSettings={{
                dataSource: filtered(),
                template: () => <div>Event</div>,
                enableTooltip: true,
                tooltipTemplate: () => <div>ToolTip</div>,
              }}
              eventClick={(event) => {
                event.cancel = true
              }}
              cellDoubleClick={(event) => {
                event.cancel = true
              }}
              cellClick={(event) => {
                event.cancel = true
              }}
              select={(event) => {
                event.cancel = true
              }}
              eventRendered={(event) => {
                console.log('event,', event)
                //event.element.style.backgroundColor = 'red'
              }}
              changeCurrentView={(viewName) => {
                console.log('viewName', viewName)
              }}
            >
              <ResourcesDirective>
                <ResourceDirective
                  field='clinicianFK'
                  title='Resources'
                  name='Resources'
                  dataSource={resources}
                  textField='doctorName'
                  idField='clinicianFK'
                //colorField='CalendarColor'
                />
              </ResourcesDirective>
              <ViewsDirective>
                <ViewDirective option='Day' />
                <ViewDirective option='Week' />
                <ViewDirective option='Month' />
              </ViewsDirective>
              <Inject services={[Day, Week, Month]} />
            </ScheduleComponent>
            <ContextMenuComponent
              id='ContextMenu'
              cssClass='schedule-context-menu'
              ref={(memu) => { this.contextMenuObj = memu }}
              target='.e-schedule'
              items={this.contextMenuItems}
              beforeOpen={(args) => {
                this.targetElement = args.event.target
                console.log('targetElement', this.targetElement)
                if (closest(this.targetElement, '.e-header-cells')) {
                  args.cancel = true
                  return
                }
                if (closest(this.targetElement, '.e-all-day-cells')) {
                  args.cancel = true
                  return
                }
                if (closest(this.targetElement, '.e-contextmenu')) {
                  return
                }
                this.selectedTarget = closest(this.targetElement, '.e-appointment,.e-work-cells,.e-vertical-view .e-date-header-wrap .e-all-day-cells,.e-vertical-view .e-date-header-wrap .e-header-cells');
                if (isNullOrUndefined(this.selectedTarget)) {
                  args.cancel = true
                  return
                }
                this.contextMenuObj.hideItems(['Copy', 'Cut', 'Paste'], true)
                if (this.selectedTarget.classList.contains('e-appointment')) {
                  let eventObj = this.scheduleObj.getEventDetails(this.selectedTarget);
                  console.log('eventObj', eventObj)
                  this.contextMenuObj.showItems(['Copy', 'Cut'], true)
                  return
                }
                this.contextMenuObj.showItems(['Paste'], true)
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default connect(({ calendar, codetable, loading, doctorBlock }) => ({
  displayDate: calendar.currentViewDate,
  calendarView: calendar.calendarView,
  calendarEvents: calendar.list || [],
  publicHolidays: calendar.publicHolidayList,
  doctorBlocks: doctorBlock.list || [],
  appointmentTypes: codetable.ctappointmenttype || [],
  loading: loading.models.calendar,
}))(CalendarView)
