import React from 'react'
import { Button, Tooltip } from '@/components'
import Authorized from '@/utils/Authorized'
import { PrinterOutlined } from '@ant-design/icons'
import { ContextMenuComponent } from '@syncfusion/ej2-react-navigations'
import {
  ScheduleComponent,
  Day,
  Week,
  Month,
  ViewsDirective,
  ViewDirective,
  ResourcesDirective,
  ResourceDirective,
  Inject,
  Timezone,
  DragAndDrop,
  Resize,
} from '@syncfusion/ej2-react-schedule'
import { closest, isNullOrUndefined, enableRipple } from '@syncfusion/ej2-base'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import './SyncfusionCalendar.css'
import { APPOINTMENT_STATUS, CALENDAR_VIEWS } from '@/utils/constants'

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

enableRipple(true)

class SyncfusionCalendar extends React.PureComponent {
  constructor(props) {
    super(props)
    this.contextMenuItems = [
      { text: 'Copy', iconCss: 'e-icons e-copy', id: 'Copy' },
      { text: 'Cut', iconCss: 'e-icons e-cut', id: 'Cut' },
      { text: 'Paste', iconCss: 'e-icons e-paste', id: 'Paste' },
    ]
    this.state = {
      previousDate: undefined,
      selectedData: undefined,
    }
  }

  resourceHeaderTemplate = props => {
    const {
      classes,
      printDailyAppointmentReport,
      view,
      resourceTitleAccessor,
    } = this.props
    return (
      <div
        className={classes.dayHeaderContainer}
        style={{ position: 'relative' }}
      >
        <Tooltip title={props.resourceData[resourceTitleAccessor]}>
          <div
            style={{
              color: '#9e9e9e',
              fontWeight: 700,
              fontSize: '0.85rem',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {props.resourceData[resourceTitleAccessor]}
          </div>
        </Tooltip>
        <div style={{ position: 'absolute', right: '-14px', top: 0 }}>
          {view === CALENDAR_VIEWS.DAY && (
            <Button
              size='sm'
              color='transparent'
              justIcon
              onClick={() => {
                printDailyAppointmentReport(
                  this.scheduleObj.activeView.renderDates[0],
                  props.resourceData.calendarResourceFK,
                )
              }}
            >
              <PrinterOutlined />
            </Button>
          )}
        </div>
      </div>
    )
  }

  render() {
    const {
      startHour,
      endHour,
      resources = [],
      printDailyAppointmentReport,
      classes,
      events,
      view,
      dateHeaderTemplate,
      height,
      timeScale,
      onViewChange,
      cellDoubleClick,
      eventDoubleClick,
      eventRendered,
      renderCell,
      resourceIdAccessor,
      resourceTitleAccessor,
      eventTemplate,
      eventSettings,
      onCopyClick,
      onCutClick,
      onPasteClick,
      dragStart,
      dragStop,
      resizeStart,
      resizeStop,
      cellTemplate,
      jumpToDate,
      displayDate,
      eventAction,
    } = this.props
    return (
      <div className='schedule-control-section' style={{ margin: '8px 8px' }}>
        <div className='col-lg-9 control-section'>
          <div className='control-wrapper'>
            <ScheduleComponent
              showTimeIndicator={false}
              id='scheduler'
              cssClass='schedule-overview'
              ref={value => (this.scheduleObj = value)}
              width='100%'
              height={height}
              group={{ resources: ['Calendars'] }}
              //timezone='UTC'
              currentView='Day'
              startHour={startHour}
              endHour={endHour}
              timeFormat='HH:mm'
              timeScale={timeScale}
              allowResizing={view !== CALENDAR_VIEWS.MONTH}
              resourceHeaderTemplate={this.resourceHeaderTemplate}
              dateHeaderTemplate={dateHeaderTemplate}
              eventSettings={eventSettings}
              //selectedDate={displayDate}
              navigating={props => {
                if (props.currentView) {
                  if (onViewChange)
                    onViewChange(props.currentView, props.currentDate)
                } else {
                  if (
                    moment(this.state.previousDate)
                      .startOf('day')
                      .formatUTC() !=
                    moment(props.currentDate)
                      .startOf('day')
                      .formatUTC()
                  ) {
                    this.setState({ previousDate: props.currentDate }, () => {
                      if (jumpToDate) jumpToDate(props.currentDate)
                    })
                  } else {
                    props.cancel = true
                  }
                }
              }}
              eventClick={event => {
                event.cancel = true
              }}
              popupOpen={event => {
                if (event.type === 'Editor') {
                  event.cancel = true
                  eventDoubleClick(event.data)
                }
              }}
              cellDoubleClick={cellDoubleClick}
              cellClick={event => {
                event.cancel = true
              }}
              eventRendered={eventRendered}
              renderCell={renderCell}
              dragStart={dragStart}
              dragStop={dragStop}
              resizeStart={resizeStart}
              resizeStop={resizeStop}
              cellTemplate={cellTemplate}
            >
              <ResourcesDirective>
                <ResourceDirective
                  field={resourceIdAccessor}
                  title='Calendars'
                  name='Calendars'
                  dataSource={resources}
                  textField={resourceTitleAccessor}
                  idField={resourceIdAccessor}
                  //colorField='CalendarColor'
                />
              </ResourcesDirective>
              <ViewsDirective>
                <ViewDirective option='Day' />
                <ViewDirective option='Week' />
                <ViewDirective option='Month' />
              </ViewsDirective>
              <Inject services={[Day, Week, Month, DragAndDrop, Resize]} />
            </ScheduleComponent>
            <ContextMenuComponent
              id='ContextMenu'
              cssClass='schedule-context-menu'
              ref={memu => (this.contextMenuObj = memu)}
              target='.e-schedule'
              items={this.contextMenuItems}
              beforeOpen={args => {
                this.targetElement = args.event.target
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

                this.selectedTarget = closest(
                  this.targetElement,
                  '.e-appointment,.e-work-cells,.e-vertical-view .e-date-header-wrap .e-all-day-cells,.e-vertical-view .e-date-header-wrap .e-header-cells',
                )
                if (isNullOrUndefined(this.selectedTarget)) {
                  args.cancel = true
                  return
                }

                this.contextMenuObj.hideItems(['Copy', 'Cut', 'Paste'], true)

                if (this.selectedTarget.classList.contains('e-appointment')) {
                  let eventObj = this.scheduleObj.getEventDetails(
                    this.selectedTarget,
                  )
                  this.setState({ selectedData: { ...eventObj } })
                  const viewApptAccessRight = Authorized.check(
                    'appointment.appointmentdetails',
                  )
                  const viewDoctorBlockAccessRight = Authorized.check(
                    'settings.clinicsetting.doctorblock',
                  )

                  if (
                    (viewApptAccessRight &&
                      viewApptAccessRight.rights !== 'enable' &&
                      !eventObj.isDoctorBlock) ||
                    (eventObj.isDoctorBlock &&
                      viewDoctorBlockAccessRight &&
                      viewDoctorBlockAccessRight.rights !== 'enable')
                  )
                    return
                  if (
                    !eventObj.isDoctorBlock &&
                    (eventObj.appointmentStatusFk ===
                      APPOINTMENT_STATUS.TURNEDUP ||
                      eventObj.appointmentStatusFk ===
                        APPOINTMENT_STATUS.TURNEDUPLATE)
                  ) {
                    this.contextMenuObj.showItems(['Copy'], true)
                  } else {
                    this.contextMenuObj.showItems(['Copy', 'Cut'], true)
                  }
                  return
                }
                if (eventAction) {
                  this.contextMenuObj.showItems(['Paste'], true)
                } else {
                  args.cancel = true
                }
              }}
              select={e => {
                if (e.item.id === 'Copy') {
                  if (onCopyClick) {
                    onCopyClick(this.state.selectedData)
                  }
                } else if (e.item.id === 'Cut') {
                  if (onCutClick) {
                    onCutClick(this.state.selectedData)
                  }
                } else if (e.item.id === 'Paste') {
                  let eventObj = this.scheduleObj.getCellDetails(
                    this.selectedTarget,
                  )
                  if (onPasteClick) {
                    onPasteClick(eventObj)
                  }
                }
              }}
            ></ContextMenuComponent>
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(calendarViewstyles, {
  name: 'SyncfusionCalendar',
  withTheme: true,
})(SyncfusionCalendar)
