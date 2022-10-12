import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import { CardContainer, CommonTableGrid } from '@/components'
import { queryList as queryAppointments } from '@/services/calendar'
import Authorized from '@/utils/Authorized'
import { LoadingWrapper } from '@/components/_medisys'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import {
  APPOINTMENT_STATUSOPTIONS,
  INVALID_APPOINTMENT_STATUS,
} from '@/utils/constants'
import { futureApptTableParams, previousApptTableParams } from './variables'
import { grayColors } from '@/assets/jss'
import { getUniqueId } from '@/utils/utils'

const styles = theme => ({
  gridRow: {
    marginTop: theme.spacing(1),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 'calc(100vh - 80px)',
  },
  subRow: {
    '& > td:first-child': {
      paddingLeft: theme.spacing(1),
    },
  },
  disabledRow: {
    '& > td': {
      color: grayColors[3],
    },
  },
})

@connect(({ patient, user, codetable }) => ({
  patient: patient.entity || {},
  user,
  appointmentTypes: codetable.ctappointmenttype,
  ctcalendarresource: codetable.ctcalendarresource,
}))
class AppointmentHistory extends PureComponent {
  state = {
    height: 100,
    previousAppt: [],
    futureAppt: [],
    patientProfileFK: undefined,
    loadingAppt: false,
  }

  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.resize.bind(this))
    if (this.props.patient && this.props.patient.id > 0) {
      this.getAppts(this.props.patient.id)
    }
    this.props.pushApptHistoryRef(this)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  async getAppts(patientId) {
    this.setState({ loadingAppt: true })
    try {
      const { user, dispatch, ctcalendarresource } = this.props
      const commonParams = {
        combineCondition: 'and',
        sorting: [{ columnName: 'appointmentDate', direction: 'desc' }],
      }

      const viewOtherApptAccessRight = Authorized.check(
        'appointment.viewotherappointment',
      )

      let doctor
      if (
        !viewOtherApptAccessRight ||
        viewOtherApptAccessRight.rights !== 'enable'
      ) {
        const calendarresource = ctcalendarresource.find(
          resource =>
            resource.isActive &&
            resource.clinicianProfileDto?.id === user.data.clinicianProfile.id,
        )
        if (calendarresource) {
          doctor = calendarresource.id
        }
      }

      await dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'ltappointmentstatus',
        },
      })

      // const future = undefined
      const [previous, future] = await Promise.all([
        queryAppointments({
          apiCriteria: {
            // appStatus: [
            //   APPOINTMENT_STATUS.CANCELLED,
            //   APPOINTMENT_STATUS.TURNEDUP,
            //   APPOINTMENT_STATUS.TURNEDUPLATE,
            //   // APPOINTMENT_STATUS.NOSHOW,
            // ].join(),
            apptDateTo: moment()
              .add(-1, 'd')
              .formatUTC(),
            patientProfileId: patientId,
            doctor,
            isIncludeHistory: true,
            isIncludeRescheduledByClinic: false,
          },
          ...commonParams,
        }),
        queryAppointments({
          apiCriteria: {
            apptDateFrom: moment().formatUTC(),
            isIncludeHistory: true,
            isIncludeRescheduledByClinic: false,
            // appStatus: [
            //   APPOINTMENT_STATUS.CONFIRMED,
            //   APPOINTMENT_STATUS.RESCHEDULED,
            //   APPOINTMENT_STATUS.PFA_RESCHEDULED,
            // ].join(),
            patientProfileId: patientId,
            doctor,
          },
          ...commonParams,
        }),
      ])
      let previousAppt = []
      let futureAppt = []
      if (previous) {
        const { status, data } = previous
        if (status === '200') previousAppt = this.reBuildApptDatas(data.data)
      }

      if (future) {
        const { status, data } = future
        if (status === '200') futureAppt = this.reBuildApptDatas(data.data)
      }
      this.setState({
        futureAppt,
        previousAppt,
        patientProfileFK: patientId,
        loadingAppt: false,
      })
    } catch (error) {
      this.setState({ loadingAppt: false })
    }
  }

  resetAppts() {
    this.setState({
      futureAppt: [],
      previousAppt: [],
      patientProfileFK: null,
      loadingAppt: false,
    })
  }
  async UNSAFE_componentWillReceiveProps(nextProps) {
    const { patient } = nextProps

    if (this.state.patientProfileFK !== patient.id && patient.id > 0) {
      this.setState({
        patientProfileFK: patient.id,
      })
      await this.getAppts(patient.id)
    }
  }

  resize() {
    if (this.divElement) {
      const height = this.divElement.clientHeight
      if (height > 0) {
        this.setState({ height: height > 0 ? height / 2 - 144 : 300 })
      }
    }
  }

  reBuildApptDatas = data => {
    let formattedList = []
    for (let i = 0; i < data.length; i++) {
      const { appointment_Resources, ...restValues } = data[i]
      const currentPatientAppts = appointment_Resources.map((appt, idx) => {
        const { startTime, appointmentTypeFK, calendarResourceFK } = appt
        const apptStatusId = parseInt(restValues.appointmentStatusFk, 10)
        const apptStatus = APPOINTMENT_STATUSOPTIONS.find(
          m => m.id === apptStatusId,
        )
        const commonValues = {
          ...restValues,
          uid: getUniqueId(),
          apptResourceFK: appt.id,
          appointmentTypeFK,
          appointmentDate: `${moment(restValues.appointmentDate).format(
            'YYYY-MM-DD',
          )}`,
          startTime: moment(startTime, 'HH:mm:ss').format('hh:mm A'),
          calendarResourceFK,
          appointmentStatus: apptStatus ? apptStatus.name || '' : '',
          appointmentStatusFk: apptStatusId,
          appointmentRemarks: restValues.appointmentRemarks || '',
        }

        if (idx === 0) {
          return {
            ...commonValues,
            countNumber: 1,
            rowspan: appointment_Resources.length,
          }
        }
        return {
          ...commonValues,
          countNumber: 0,
          rowspan: 0,
        }
      })

      formattedList = [...formattedList, ...currentPatientAppts]
    }
    return formattedList
  }

  appointmentRow = p => {
    const { classes, handleRowDoubleClick } = this.props
    const { row, children, tableRow } = p
    let newchildren = []
    const middleColumns = children.slice(1, 4)

    if (row.countNumber === 1) {
      newchildren.push(
        children
          .filter((value, index) => index < 1)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.rowspan,
            },
          })),
      )

      newchildren.push(middleColumns)

      newchildren.push(
        children
          .filter((value, index) => index > 3)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.rowspan,
            },
          })),
      )
    } else {
      newchildren.push(middleColumns)
    }

    const selectedData = {
      ...tableRow.row,
      doctor: null,
    }

    const isDisabledRow = () => {
      return (
        INVALID_APPOINTMENT_STATUS.indexOf(selectedData.appointmentStatusFk) >
        -1
      )
    }

    const doubleClick = () => {
      // const accessRight = Authorized.check('appointment.appointmentdetails')

      // if (!accessRight || (accessRight && accessRight.rights !== 'enable'))
      //   return

      if (isDisabledRow()) return

      handleRowDoubleClick(selectedData)
    }

    const disabledRowClass = isDisabledRow() ? ` ${classes.disabledRow}` : null
    if (row.countNumber === 1) {
      return (
        <Table.Row
          {...p}
          onDoubleClick={doubleClick}
          className={disabledRowClass}
        >
          {newchildren}
        </Table.Row>
      )
    }
    return (
      <Table.Row
        {...p}
        className={classes.subRow + disabledRowClass}
        onDoubleClick={doubleClick}
      >
        {newchildren}
      </Table.Row>
    )
  }

  render() {
    const {
      classes,
      theme,
      handleRowDoubleClick,
      appointmentTypes,
      handleCopyAppointmentClick,
    } = this.props
    const { previousAppt, futureAppt, loadingAppt } = this.state

    return (
      <LoadingWrapper loading={loadingAppt} text='loading...'>
        <div>
          <CardContainer hideHeader size='sm'>
            <h4>Current & Future Appointment</h4>

            <CommonTableGrid
              size='sm'
              rows={futureAppt}
              getRowId={r => `${r.id}_${r.apptResourceFK}`}
              onRowDoubleClick={handleRowDoubleClick}
              {...futureApptTableParams(appointmentTypes)}
              TableProps={{
                rowComponent: this.appointmentRow,
              }}
              FuncProps={{
                pager: true,
                pagerDefaultState: {
                  pagesize: 10,
                },
              }}
            />

            <h4
              style={{
                marginTop: theme.spacing(2),
              }}
            >
              Previous Appointment
            </h4>
            <CommonTableGrid
              size='sm'
              rows={previousAppt}
              getRowId={r => `${r.id}_${r.apptResourceFK}`}
              {...previousApptTableParams(
                appointmentTypes,
                handleCopyAppointmentClick,
              )}
              TableProps={{
                rowComponent: this.appointmentRow,
              }}
              FuncProps={{
                pager: true,
                pagerDefaultState: {
                  pagesize: 10,
                },
              }}
            />
          </CardContainer>
        </div>
      </LoadingWrapper>
    )
  }
}

export default withStyles(styles, {
  withTheme: true,
  name: 'AppointmentHistory',
})(AppointmentHistory)
