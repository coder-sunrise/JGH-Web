import React, { useMemo } from 'react'
import { connect } from 'dva'
// moment
import moment from 'moment'
// big calendar
import BigCalendar from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
// material ui
import { withStyles } from '@material-ui/core'
// components
import { serverDateFormat } from '@/components'
// medisys components
import { LoadingWrapper } from '@/components/_medisys'
// setting
import { doctorEventColorOpts } from '../setting'
// sub component
import CalendarToolbar from './Toolbar'
import Event from './Event'
import { getFirstAppointmentType } from './form/formikUtils'
// assets
import { primaryColor } from '@/assets/jss'

const styles = () => ({
  calendarHolidayLabel: {
    paddingLeft: 4,
    float: 'left',
    textAlign: 'left',
    maxWidth: '75%',
    fontSize: '0.9rem',
    fontWeight: '450',
    color: '#6f6f6f',
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
  19,
  0,
  0,
)

const applyFilter = (filter, data) => {
  const { filterByApptType, filterByDoctor, search = '' } = filter
  let returnData = [
    ...data,
  ]
  try {
    // filter by patient name
    if (search !== '') {
      returnData = returnData.filter(
        (eachData) =>
          eachData.patientName.toLowerCase().indexOf(search.toLowerCase()) !==
          -1,
      )
    }

    // filter by doctor
    if (filterByDoctor.length > 0) {
      returnData = returnData.filter((eachData) =>
        filterByDoctor.includes(eachData.clinicianFK),
      )
    }

    // filter by appointment type
    if (filterByApptType.length > 0) {
      returnData = returnData.filter((eachData) =>
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
    const publicHoliday = publicHolidayList.find((item) => {
      const momentStartDate = moment(item.startDate)

      if (momentStartDate.diff(momentDate, 'day') === 0) {
        return true
      }
      return false
    })

    if (publicHoliday) holidayLabel = publicHoliday.displayValue

    return (
      <div>
        <span className={classes.calendarHolidayLabel}>{holidayLabel}</span>
        <a onClick={onDrillDown}>{label}</a>
      </div>
    )
  }),
)

const CalendarView = ({
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
}) => {
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
    // const { publicHolidays } = this.props
    const momentDate = moment(date)
    const publicHoliday = publicHolidays.find((item) => {
      const momentStartDate = moment(item.startDate)

      if (momentStartDate.diff(momentDate, 'day') === 0) {
        return true
      }
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
    // this.props.dispatch({ type: 'calendar/setCurrentViewDate', date })
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

    // const { handleMoveEvent } = this.props
    // const { id, _appointmentID } = event

    // const resourceID = resourceId !== undefined ? resourceId : event.resourceId

    // const updatedEvent = {
    //   start,
    //   end,
    //   resourceId: resourceID,
    // }
  }

  const Toolbar = (toolbarProps) => {
    return (
      <CalendarToolbar
        {...toolbarProps}
        displayDate={displayDate}
        handleViewChange={_onViewChange}
        handleDateChange={_jumpToDate}
      />
    )
  }

  const EventComponent = (eventProps) => {
    // const { handleEventMouseOver, calendarView } = this.props

    return (
      <Event
        {...eventProps}
        calendarView={calendarView}
        handleMouseOver={handleEventMouseOver}
      />
    )
  }

  const eventList = useMemo(
    () => {
      if (calendarView === BigCalendar.Views.MONTH)
        return calendarEvents.reduce((events, appointment) => {
          const { appointment_Resources: apptResources = [] } = appointment

          const firstApptRes = apptResources.find(
            (item) => item.sortOrder === 0,
          )

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
              start: moment(appointment.appointmentDate).toDate(),
              end: moment(appointment.appointmentDate).toDate(),
              appointmentTypeFK: firstAppointmentTypeFK,
              clinicianFK: firstClinicianFK,
            },
          ]
        }, [])
      return calendarEvents.reduce((events, appointment) => {
        const {
          appointmentDate,
          patientName,
          patientContactNo,
          isEnableRecurrence,
          appointment_Resources: apptResources,
        } = appointment

        const apptEvents = apptResources.map((item) => ({
          ...item,
          resourceId: item.clinicianFK,
          clinicianFK: item.clinicianFK,
          patientName,
          patientContactNo,
          isEnableRecurrence,
          start: moment(
            `${appointmentDate} ${item.startTime}`,
            `${serverDateFormat} HH:mm`,
          ).toDate(),
          end: moment(
            `${appointmentDate} ${item.endTime}`,
            `${serverDateFormat} HH:mm`,
          ).toDate(),
        }))

        return [
          ...events,
          ...apptEvents,
        ]
      }, [])
    },
    [
      calendarView,
      calendarEvents,
    ],
  )

  const filtered = useMemo(
    () =>
      applyFilter(filter, [
        ...eventList,
        ...doctorBlocks.map((item) => ({
          ...item,
          start: moment(item.startDateTime).toDate(),
          end: moment(item.endDateTime).toDate(),
        })),
      ]),
    [
      calendarView,
      filter,
      doctorBlocks,
      eventList,
    ],
  )
  return (
    <LoadingWrapper loading={loading} text='Loading appointments...'>
      <DragAndDropCalendar
        components={{
          // https://github.com/intljusticemission/react-big-calendar/blob/master/src/Calendar.js
          toolbar: Toolbar,
          event: EventComponent,
          month: {
            dateHeader: MonthDateHeader,
          },
        }}
        localizer={localizer}
        date={displayDate}
        min={minTime}
        max={maxTime}
        view={calendarView}
        // #region values props
        events={filtered}
        // #endregion

        // #region --- functional props ---
        selectable='ignoreEvents'
        resizable={false}
        showMultiDayTimes={false}
        step={15}
        timeslots={2}
        longPressThreshold={500}
        tooltipAccessor={null}
        // #endregion --- functional props ---
        // #region --- resources ---
        resources={resources}
        resourceIdAccessor='clinicianFK'
        resourceTitleAccessor='doctorName'
        // #endregion --- resources ---
        // #region --- event handlers ---
        draggableAccessor={_draggableAccessor}
        onNavigate={_jumpToDate}
        onEventDrop={_moveEvent}
        onView={_onViewChange}
        eventPropGetter={_eventColors}
        dayPropGetter={_customDayPropGetter}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onDoubleClickEvent={handleDoubleClick}
        onDragStart={handleOnDragStart}
        // #endregion --- event handlers ---
      />
    </LoadingWrapper>
  )
}

export default connect(({ calendar, codetable, loading, doctorBlock }) => ({
  displayDate: calendar.currentViewDate,
  calendarView: calendar.calendarView,
  calendarEvents: calendar.list,
  publicHolidays: calendar.publicHolidayList,
  doctorBlocks: doctorBlock.list,
  appointmentTypes: codetable.ctappointmenttype || [],
  loading: loading.effects['calendar/getCalendarList'],
}))(CalendarView)
