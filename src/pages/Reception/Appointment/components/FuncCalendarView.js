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
import { doctorEventColorOpts } from '../utils'
// sub component
import CalendarToolbar from './Toolbar'
import Event from './Event'
import TimeSlotComponent from './TimeSlotComponent'
import { getFirstAppointmentType } from './form/formUtils'
// assets
import { primaryColor } from '@/assets/jss'

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
    // console.log({ date })
    const momentDate = moment(date)
    const publicHoliday = publicHolidays.find((item) => {
      const momentStartDate = moment(item.startDate)
      const momentEndDate = moment(item.endDate)

      // if (momentStartDate.diff(momentDate, 'day') === 0) {
      //   return true
      // }
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
        // calendarView={calendarView}
        // handleMouseOver={handleEventMouseOver}
      />
    )
  }

  const eventList = useMemo(
    () => {
      if (calendarView === BigCalendar.Views.MONTH)
        return calendarEvents.reduce((events, appointment) => {
          const { appointment_Resources: apptResources = [] } = appointment

          // TODO: need to fix sortOrder calculation, should exclude deleted appointments when calculating sortOrder
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
              start: moment(
                `${appointment.appointmentDate} ${firstApptRes.startTime}`,
                `${serverDateFormat} HH:mm`,
              ).toDate(),
              end: moment(
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
          stageColorHex: appointment.stageColorHex,
          stage: appointment.stage,
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
      applyFilter(
        filter,
        [
          ...eventList,
          ...doctorBlocks.map((item) => ({
            ...item,
            isDoctorBlock: true,
            resourceId: item.doctor.clinicianProfile.id,
            start: moment(item.startDateTime).toDate(),
            end: moment(item.endDateTime).toDate(),
          })),
        ],
        calendarView === BigCalendar.Views.DAY,
      ),
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
          timeSlotWrapper: TimeSlotComponent,
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
        timeslots={1}
        longPressThreshold={500}
        tooltipAccessor={null}
        // #endregion --- functional props ---
        // #region --- resources ---
        resources={
          calendarView === BigCalendar.Views.DAY ? resources : undefined
        }
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
        // slotPropGetter={TimeSlotComponent}
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
  calendarEvents: calendar.list || [],
  publicHolidays: calendar.publicHolidayList,
  doctorBlocks: doctorBlock.list || [],
  appointmentTypes: codetable.ctappointmenttype || [],
  loading: loading.models.calendar,
}))(CalendarView)
