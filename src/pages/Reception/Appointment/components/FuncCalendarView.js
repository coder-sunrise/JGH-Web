import React, { useCallback, useMemo, useRef, useState } from 'react'
import { connect } from 'dva'
// moment
import moment from 'moment'
// material ui
import { withStyles } from '@material-ui/core'
// components
import {
  serverDateFormat,
  Tooltip,
  Button,
  Popover,
  notification,
  timeFormat24Hour,
} from '@/components'
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
import { PrinterOutlined } from '@ant-design/icons'
import SyncfusionCalendar from './SyncfusionCalendar'
import {
  CALENDAR_VIEWS,
  CALENDAR_RESOURCE,
  APPOINTMENT_STATUS,
  APPOINTMENT_STAGE_COLOR,
} from '@/utils/constants'
import consultationDocument from '@/models/consultationDocument'

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

const calendarViewstyles = () => ({
  dayHeaderContainer: {
    height: '100%',
    '& > div:last-child': {
      float: 'right',
      visibility: 'hidden',
    },
    '&:hover': {
      '& > div:last-child': {
        visibility: 'visible',
      },
    },
  },
  calendarHeightSettingStyle: {
    '& .rbc-time-view > .rbc-time-content > .rbc-time-column': {
      height: 1400,
      '& > .rbc-timeslot-group': {
        minHeight: 'unset',
        '& > div': {
          minHeight: 'unset !important',
          maxHeight: 'unset !important',
          height: '100%',
        },
      },
    },
  },
})

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

const applyFilter = (filter, data, isDayView, ctcalendarresource) => {
  return data
  const {
    filterByApptType = [],
    filterByDoctor = [],
    search = '',
    dob = null,
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

  let returnData = [...data]

  try {
    // filter by patient name and ignore doctorblock
    if (search !== '') {
      const _searchStr = search.toLowerCase()
      returnData = returnData.filter(eachData => {
        if (eachData.isDoctorBlock) return true
        const {
          patientProfileFK,
          patientName = '',
          patientContactNo = '',
          patientAccountNo = '',
          patientRefrenceNo = '',
        } = eachData
        if (patientProfileFK) {
          const { contactNumbers = [] } = patientProfile
          const mobile = contactNumbers.find(
            item => item.numberTypeFK === 1,
          ) || { number: '' }

          return (
            patientName.toLowerCase().indexOf(_searchStr) >= 0 ||
            patientContactNo.toLowerCase().indexOf(_searchStr) >= 0 ||
            patientAccountNo.toLowerCase().indexOf(_searchStr) >= 0 ||
            patientRefrenceNo.toLowerCase().indexOf(_searchStr) >= 0
          )
        }

        return (
          patientName.toLowerCase().indexOf(_searchStr) >= 0 ||
          patientContactNo.toLowerCase().indexOf(_searchStr) >= 0
        )
      })
    }

    //filter by DOB From , DOB To
    returnData = returnData.filter(eachData => {
      const { patientDOB } = eachData
      return !dob || patientDOB == dob
    })

    // filter by doctor
    if (isDayView) {
      if (filterByDoctor.length > 0 && filterByDoctor.indexOf(-99) !== 0) {
        returnData = returnData.filter(eachData => {
          if (eachData.isDoctorBlock) {
            const selectResource = ctcalendarresource.find(
              r =>
                r.resourceType === CALENDAR_RESOURCE.DOCTOR &&
                r.clinicianProfileDto.id ===
                  eachData.doctor.clinicianProfile.id,
            )
            return selectResource && filterByDoctor.includes(selectResource.id)
          }
          return filterByDoctor.includes(eachData.calendarResourceFK)
        })
      }
    } else {
      returnData = returnData.filter(eachData => {
        if (eachData.isDoctorBlock) {
          const selectResource = ctcalendarresource.find(
            r =>
              r.resourceType === CALENDAR_RESOURCE.doctor &&
              r.clinicianProfileDto.id === eachData.doctor.clinicianProfile.id,
          )
          return filterBySingleDoctor === selectResource.id
        }
        return filterBySingleDoctor === eachData.calendarResourceFK
      })
    }

    // filter by appointment type
    if (filterByApptType.length > 0 && !filterByApptType.includes(-99)) {
      returnData = returnData.filter(
        eachData =>
          eachData.isDoctorBlock ||
          filterByApptType.includes(eachData.appointmentTypeFK),
      )
    }
  } catch (error) {}

  return returnData
}

const MonthDateHeader = withStyles(styles, { name: 'MonthDateHeader' })(
  connect(({ calendar }) => ({
    publicHolidayList: calendar.publicHolidayList,
  }))(({ classes, date, onDrillDown, label, publicHolidayList }) => {
    let holidayLabel = ''
    const momentDate = moment(date)
    const publicHoliday = publicHolidayList.filter(item => {
      const momentStartDate = moment(item.startDate)
      const momentEndDate = moment(item.endDate)

      if (momentDate.isBetween(momentStartDate, momentEndDate, 'days', '[]'))
        return true
      return false
    })

    if (publicHoliday.length > 0) {
      holidayLabel = publicHoliday.map(item => item.displayValue).join(', ')

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

const changeTimeRulerExtentPixel = height => {
  var calendarView = Object.values(document.styleSheets).filter(
    x => x.ownerNode.dataset.meta === 'CalendarView',
  )
  var heightStyle = Object.values(calendarView[0].cssRules).filter(x =>
    x.selectorText.endsWith('rbc-time-column'),
  )[0]
  heightStyle.style.height = `${height || 1400}px`
}

const CalendarView = ({
  dispatch,
  // --- event handlers ---
  handleSelectSlot,
  handleDoubleClick,
  handleOnDragStart,
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
  apptTimeIntervel = 15,
  apptTimeRulerExtent = 1400,
  printDailyAppointmentReport,
  classes,
  calendar,
  ctcalendarresource,
  onResourceDateChange,
  onUpdateEvent,
  apptTimeSlotDuration = 15,
  allResources = [],
}) => {
  changeTimeRulerExtentPixel(apptTimeRulerExtent)

  const _draggableAccessor = event => {
    if (event.isEnableRecurrence) return false
    if (event.doctor) return false
    return true
  }
  const _eventColors = event => {
    const { isDoctorBlock } = event.data

    if (isDoctorBlock) {
      event.element.style.backgroundColor = doctorEventColorOpts.value
      return
    }

    const appointmentType = appointmentTypes.find(
      item => item.id === event.data.appointmentTypeFK,
    )

    event.element.style.backgroundColor = !appointmentType
      ? primaryColor
      : appointmentType.tagColorHex
  }

  const _customDayPropGetter = date => {
    const momentDate = moment(date)
    const publicHoliday = publicHolidays.find(item => {
      const momentStartDate = moment(item.startDate)
      const momentEndDate = moment(item.endDate)
      if (momentDate.isBetween(momentStartDate, momentEndDate, 'days', '[]'))
        return true
      return false
    })

    if (calendarView === CALENDAR_VIEWS.MONTH && publicHoliday)
      return {
        className: 'calendar-holiday',
      }
    return {}
  }

  const _jumpToDate = date => {
    onResourceDateChange(calendarView, date)
    dispatch({
      type: 'calendar/navigateCalendar',
      payload: {
        date,
        doctor:
          calendarView === CALENDAR_VIEWS.DAY
            ? filter.filterByDoctor
            : [filter.filterBySingleDoctor],
      },
    })
  }

  const _onViewChange = (view, date) => {
    dispatch({
      type: 'calendar/setCalendarView',
      payload: view,
    })
    onResourceDateChange(view, date)
    dispatch({
      type: 'calendar/navigateCalendar',
      payload: {
        view,
        date,
        doctor:
          view === CALENDAR_VIEWS.DAY
            ? filter.filterByDoctor
            : [filter.filterBySingleDoctor],
      },
    })
  }

  const EventComponent = event => {
    return (
      <div class='event'>
        <Event event={event} calendarView={calendarView} />
      </div>
    )
  }

  const isReadonly = appointment => {
    const {
      appointmentStatusFk,
      patientProfileFK,
      isPatientActive,
    } = appointment

    const patientIsActive = patientProfileFK > 0 ? isPatientActive : true

    const _disabledStatus = [
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.TURNEDUP,
      APPOINTMENT_STATUS.TURNEDUPLATE,
    ]
    if (_disabledStatus.includes(appointmentStatusFk) || !patientIsActive) {
      return true
    }
    return false
  }

  const eventList = useMemo(() => {
    return calendarEvents.reduce((events, appointment) => {
      const {
        appointmentDate,
        patientName,
        patientContactNo,
        patientDOB,
        isEnableRecurrence,
        appointment_Resources: apptResources,
        appointmentRemarks,
        appointmentStatusFk,
        bookedByUser,
        bookOn,
        isEditedAsSingleAppointment,
        updateByUser,
        updateDate,
        preOrder,
        visitPurposeValue,
      } = appointment
      const apptEvents = apptResources.map(item => ({
        ...item,
        resourceId: item.calendarResourceFK,
        resourceName: item.resourceName,
        patientName,
        patientContactNo,
        patientDOB,
        isEnableRecurrence,
        appointmentRemarks,
        appointmentStatusFk,
        bookedByUser: bookedByUser,
        bookOn,
        isEditedAsSingleAppointment,
        stageColorHex: APPOINTMENT_STAGE_COLOR.find(
          x => x.code === appointment.stage,
        )?.color,
        stage: appointment.stage,
        start: moment(
          `${appointmentDate} ${item.startTime}`,
          `${serverDateFormat} ${timeFormat24Hour}`,
        ).toDate(),
        end: moment(
          `${appointmentDate} ${item.endTime}`,
          `${serverDateFormat} ${timeFormat24Hour}`,
        ).toDate(),
        StartTime: moment(
          `${appointmentDate} ${item.startTime}`,
          `${serverDateFormat} ${timeFormat24Hour}`,
        ).toDate(),
        EndTime: moment(
          `${appointmentDate} ${item.endTime}`,
          `${serverDateFormat} ${timeFormat24Hour}`,
        ).toDate(),
        updateByUser: updateByUser,
        updateDate,
        resourceFK:
          item.resourceType === CALENDAR_RESOURCE.DOCTOR
            ? `Doctor-${item.resourceFK}`
            : `Resource-${item.resourceFK}`,
        IsReadonly: isReadonly(appointment),
        appointmentDate: appointmentDate,
        preOrder,
        visitPurposeValue: visitPurposeValue,
      }))
      return [...events, ...apptEvents]
    }, [])
  }, [calendarView, calendarEvents])
  const filtered = useMemo(
    () =>
      applyFilter(
        filter,
        [
          ...eventList,
          ...doctorBlocks.map(item => ({
            ...item,
            isDoctorBlock: true,
            resourceId: item.doctor.clinicianProfile.id,
            start: moment(item.startDateTime).toDate(),
            end: moment(item.endDateTime).toDate(),
            StartTime: moment(item.startDateTime).toDate(),
            EndTime: moment(item.endDateTime).toDate(),
            resourceFK: `Doctor-${item.doctor.clinicianProfile.id}`,
          })),
        ],
        calendarView === CALENDAR_VIEWS.DAY,
        ctcalendarresource,
      ),
    [calendarView, filter, doctorBlocks, eventList],
  )

  const cellDoubleClick = props => {
    const resource = resources[props.groupIndex]
    if (resource.resourceType === CALENDAR_RESOURCE.RESOURCE) {
      const dailyCapacity = resource.calendarResourceDailyCapacity || []
      const startTime = moment(props.startTime).format(timeFormat24Hour)
      const hour = Math.floor(apptTimeSlotDuration / 60)
      const minute = apptTimeSlotDuration % 60
      const endTime = moment(props.startTime)
        .add(hour, 'hour')
        .add(minute, 'minute')
        .format(timeFormat24Hour)
      for (let index = 0; index < dailyCapacity.length; index++) {
        if (
          ((startTime >= dailyCapacity[index].startTime &&
            startTime < dailyCapacity[index].endTime) ||
            (endTime > dailyCapacity[index].startTime &&
              endTime <= dailyCapacity[index].endTime) ||
            (startTime < dailyCapacity[index].startTime &&
              endTime > dailyCapacity[index].endTime)) &&
          dailyCapacity[index].maxCapacity <= dailyCapacity[index].usedSlot
        ) {
          dispatch({
            type: 'global/updateAppState',
            payload: {
              openConfirm: true,
              isInformType: true,
              openConfirmText: 'OK',
              openConfirmContent: `${resource.name} reach maximum booking in this time slot. Please select another time.`,
            },
          })
          props.cancel = true
          return
        }
      }
    }
    handleSelectSlot({
      start: props.startTime,
      end: props.endTime,
      resourceId: resources[props.groupIndex].id,
      action: props.name,
    })
    props.cancel = true
  }

  const renderCell = event => {
    if (event.elementType === 'dateHeader') {
      const resource = resources[event.groupIndex]
      if (resource && resource.resourceType === CALENDAR_RESOURCE.RESOURCE) {
        const dailyCapacity = _.orderBy(
          resource.calendarResourceDailyCapacity.filter(
            c =>
              moment(c.dailyDate).format('DD MMM YYYY') ===
              moment(event.date).format('DD MMM YYYY'),
          ),
          ['startTime'],
          ['asc'],
        )
        if (dailyCapacity.length) {
          const tooltip = dailyCapacity
            .map(c => {
              const startTime = moment(
                new Date(`${moment().format('DD MMM YYYY')} ${c.startTime}`),
              ).format(timeFormat24Hour)
              const endTime = moment(
                new Date(`${moment().format('DD MMM YYYY')} ${c.endTime}`),
              ).format(timeFormat24Hour)
              return `${startTime} - ${endTime} Maximum slot: ${
                c.maxCapacity
              } Balance slot: ${c.maxCapacity -
                c.usedSlot}\r\nRemarks: ${c.remarks || '-'}`
            })
            .join('\r\n')
          const maxSlot = dailyCapacity.map(c => c.maxCapacity).join(', ')
          const balanceSlot = dailyCapacity
            .map(c => {
              const balance = c.maxCapacity - c.usedSlot
              return `<span style="color:${
                balance > 0 ? 'black' : 'red'
              }">${balance}</span>`
            })
            .join(', ')
          event.element.innerHTML = `<div style="position:relative;">${event.element.innerHTML}<div title="${tooltip}" style="position:absolute;right:0px;top:0px;color:black;font-size:14px;">Max: ${maxSlot} Bal: ${balanceSlot}</div></div>`
        }
      }
    } else if (event.elementType === 'monthCells') {
      let tooltip
      let resourceList
      const newAllResources = _.orderBy(
        allResources || [],
        ['sortOrder', source => source.name.toUpperCase()],
        ['asc'],
      )
      newAllResources.map(item => {
        const dailyCapacitys = (
          item.calendarResourceDailyCapacity || []
        ).filter(
          c =>
            moment(c.dailyDate).format('DD MMM YYYY') ===
            moment(event.date).format('DD MMM YYYY'),
        )
        if (dailyCapacitys.length) {
          const bgResourceColor = item.resourceDto?.balanceTagColorHex
          const totalMaxCapacity = _.sumBy(dailyCapacitys, 'maxCapacity')
          const totalUsedSlot = _.sumBy(dailyCapacitys, 'usedSlot')
          const totalBalCapacity = totalMaxCapacity - totalUsedSlot
          tooltip = `${tooltip ? `${tooltip} \n` : ''}${
            item.name
          } bal.: ${totalBalCapacity}`
          resourceList = `${resourceList ? resourceList : ''}<div style="${
            resourceList ? 'border-left:1px solid #ccc;' : ''
          }display:inline-block;padding:0px 4px;background-color:${bgResourceColor ||
            'white'};color:${
            bgResourceColor ? 'white' : 'black'
          };font-size:15px;">${totalBalCapacity}</div>`
        }
      })
      if (resourceList) {
        event.element.innerHTML = `<div style="position:relative;">${event.element.innerHTML}<div title="${tooltip}" style="position:absolute;right:2px;top:-2px;border:1px solid #ccc;">${resourceList}</div></div>`
      }
    }
  }

  const eventDoubleClick = event => {
    handleDoubleClick(event)
  }

  const [eventAction, setEventAction] = useState(undefined)
  return (
    <LoadingWrapper loading={loading} text='Loading appointments...'>
      <SyncfusionCalendar
        printDailyAppointmentReport={printDailyAppointmentReport}
        startHour='07:00 AM'
        endHour='22:00 PM'
        height={760}
        view={calendarView}
        eventSettings={{
          dataSource: filtered.filter(
            e =>
              !eventAction ||
              eventAction.type === 'Copy' ||
              !(
                e.id == eventAction.event.id &&
                e.isDoctorBlock === eventAction.event.isDoctorBlock
              ),
          ),
          template: EventComponent,
          enableTooltip: false,
        }}
        resources={resources}
        timeScale={{ interval: apptTimeIntervel * 2, slotCount: 2 }}
        cellDoubleClick={cellDoubleClick}
        eventDoubleClick={eventDoubleClick}
        eventRendered={_eventColors}
        renderCell={renderCell}
        cellTemplate={slot => {
          return <TimeSlotComponent slot={slot} />
        }}
        displayDate={displayDate}
        onViewChange={_onViewChange}
        jumpToDate={_jumpToDate}
        resourceIdAccessor='resourceFK'
        resourceTitleAccessor='calendarResourceName'
        eventAction={eventAction}
        dragStart={e => {
          //e.navigation.enable = true
        }}
        dragStop={e => {
          if (
            calendarView === CALENDAR_VIEWS.DAY &&
            e.data.isDoctorBlock &&
            resources[e.target.cellIndex].resourceType ===
              CALENDAR_RESOURCE.RESOURCE
          ) {
            notification.error({
              message: 'can not drag doctor block to resource.',
            })
            return
          }

          let startTime = e.data.StartTime
          let endTime = e.data.EndTime
          if (e.data.isDoctorBlock && calendarView === CALENDAR_VIEWS.MONTH) {
            startTime = moment(
              new Date(
                `${moment(startTime).format('YYYY MM DD')} ${moment(
                  e.data.startDateTime,
                ).format(timeFormat24Hour)}`,
              ),
            ).toDate()
            endTime = moment(
              new Date(
                `${moment(endTime).format('YYYY MM DD')} ${moment(
                  e.data.endDateTime,
                ).format(timeFormat24Hour)}`,
              ),
            ).toDate()
          }
          onUpdateEvent({
            ...e.data,
            resourceId:
              calendarView === CALENDAR_VIEWS.DAY
                ? e.data.isDoctorBlock
                  ? resources[e.target.cellIndex].clinicianProfileDto
                      .userProfileFK
                  : resources[e.target.cellIndex].id
                : undefined,
            view: calendarView,
            startTime,
            endTime,
            isAffectAllResource: true,
          })
          setEventAction(undefined)
        }}
        resizeStop={e => {
          onUpdateEvent({
            ...e.data,
            view: calendarView,
            startTime: e.data.StartTime,
            endTime: e.data.EndTime,
          })
          setEventAction(undefined)
        }}
        onCopyClick={data => {
          setEventAction({ type: 'Copy', event: { ...data } })
        }}
        onCutClick={data => {
          setEventAction({ type: 'Cut', event: { ...data } })
        }}
        onPasteClick={data => {
          const newResource = resources[data.groupIndex]
          if (
            eventAction.event.isDoctorBlock &&
            newResource.resourceType === CALENDAR_RESOURCE.RESOURCE
          ) {
            notification.error({
              message: 'can not paste doctor block to resource.',
            })
            return
          }

          let oldStartTime = eventAction.event.StartTime
          let oldEndTime = eventAction.event.EndTime
          if (eventAction.event.isDoctorBlock) {
            oldStartTime = eventAction.event.startDateTime
            oldEndTime = eventAction.event.endDateTime
          }

          let startTime = data.startTime
          if (calendarView === CALENDAR_VIEWS.MONTH) {
            startTime = moment(
              new Date(
                `${moment(data.startTime).format('YYYY MM DD')} ${moment(
                  oldStartTime,
                ).format(timeFormat24Hour)}`,
              ),
            ).toDate()
          }
          const hour = moment(oldEndTime).diff(moment(oldStartTime), 'hour')
          const minute =
            (moment(oldEndTime).diff(moment(oldStartTime), 'minute') / 60 -
              hour) *
            60
          const endTime = moment(startTime)
            .add(hour, 'hour')
            .add(minute, 'minute')
            .toDate()

          onUpdateEvent({
            ...eventAction.event,
            resourceId:
              calendarView === CALENDAR_VIEWS.DAY
                ? eventAction.event.isDoctorBlock
                  ? newResource.clinicianProfileDto.userProfileFK
                  : newResource.id
                : undefined,
            view: calendarView,
            startTime,
            endTime,
            isFromCopy: eventAction.type === 'Copy',
            isAffectAllResource: eventAction.type === 'Copy' ? false : true,
          })
          setEventAction(undefined)
        }}
      />
    </LoadingWrapper>
  )
}

const _CalendarView = connect(
  ({ calendar, codetable, loading, doctorBlock, clinicSettings }) => ({
    displayDate: calendar.currentViewDate,
    calendarView: calendar.calendarView,
    calendarEvents: calendar.list || [],
    publicHolidays: calendar.publicHolidayList,
    doctorBlocks: doctorBlock.list || [],
    appointmentTypes: codetable.ctappointmenttype || [],
    loading: loading.models.calendar,
    apptTimeIntervel: clinicSettings.settings.apptTimeIntervel,
    apptTimeRulerExtent: clinicSettings.settings.apptTimeRulerExtent,
    apptTimeSlotDuration: clinicSettings.settings.apptTimeSlotDuration,
  }),
)(CalendarView)

export default withStyles(calendarViewstyles, {
  name: 'CalendarView',
  withTheme: true,
})(_CalendarView)
