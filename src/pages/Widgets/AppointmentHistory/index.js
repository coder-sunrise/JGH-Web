import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import $ from 'jquery'
import { withStyles } from '@material-ui/core'
import {
  CardContainer,
  CommonTableGrid,
  GridContainer,
  GridItem,
  Checkbox,
} from '@/components'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import {
  APPOINTMENT_STATUSOPTIONS,
  INVALID_APPOINTMENT_STATUS,
} from '@/utils/constants'
import { queryList as queryAppointments } from '@/services/calendar'
import Authorized from '@/utils/Authorized'
import { previousApptTableParams } from './variables'
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

@connect(({ patient, user, global, codetable }) => ({
  patient: patient.entity || {},
  user,
  mainDivHeight: global.mainDivHeight,
  appointmentTypes: codetable.ctappointmenttype,
  ctcalendarresource: codetable.ctcalendarresource,
}))
class AppointmentHistory extends PureComponent {
  state = {
    previousAppt: [],
    patientProfileFK: undefined,
  }

  componentDidMount() {
    if (this.props.patient && this.props.patient.id > 0) {
      this.getAppts(this.props.patient.id, false)
    }
  }

  async getAppts(patientId, showRecheduledByClinic) {
    const { user, dispatch, ctcalendarresource = [] } = this.props
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

    const [previous] = await Promise.all([
      queryAppointments({
        apiCriteria: {
          isIncludeHistory: true,
          isIncludeRescheduledByClinic: showRecheduledByClinic,
          patientProfileId: patientId,
          doctor,
        },
        ...commonParams,
      }),
    ])

    let previousAppt = []

    if (previous) {
      const { status, data } = previous
      if (status === '200') previousAppt = this.reBuildApptDatas(data.data)
    }
    this.setState({
      previousAppt,
      patientProfileFK: patientId,
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

  toggleShowRecheduledByClinic = e => {
    this.getAppts(this.props.patient.id, e.target.value)
  }

  appointmentRow = p => {
    const { classes, handleDoubleClick } = this.props
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

      handleDoubleClick(selectedData)
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
    const { previousAppt } = this.state
    const { mainDivHeight = 700 } = this.props
    let height = mainDivHeight - 310
    if (height < 300) height = 300

    return (
      <CardContainer hideHeader size='sm'>
        <GridContainer>
          <GridItem xs={12}>
            <Checkbox
              simple
              label='Show Rescheduled by Clinic'
              onChange={this.toggleShowRecheduledByClinic}
            />
          </GridItem>
          <GridItem xs={12}>
            <CommonTableGrid
              size='sm'
              TableProps={{
                rowComponent: this.appointmentRow,
                height,
              }}
              rows={previousAppt}
              getRowId={r => `${r.id}_${r.apptResourceFK}`}
              {...previousApptTableParams(this.props.appointmentTypes)}
            />
          </GridItem>
        </GridContainer>
      </CardContainer>
    )
  }
}

export default withStyles(styles, {
  withTheme: true,
  name: 'AppointmentHistory',
})(AppointmentHistory)
