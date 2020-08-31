import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import {
  CardContainer,
  CommonTableGrid,
  GridContainer,
  GridItem,
  Checkbox,
} from '@/components'
import { APPOINTMENT_STATUS } from '@/utils/constants'
import { queryList as queryAppointments } from '@/services/calendar'
import Authorized from '@/utils/Authorized'
import { previousApptTableParams } from './variables'

const styles = (theme) => ({
  gridRow: {
    marginTop: theme.spacing(1),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 'calc(100vh - 80px)',
  },
})

@connect(({ patient, user }) => ({
  patient: patient.entity || {},
  user,
}))
class AppointmentHistory extends PureComponent {
  state = {
    height: 100,
    previousAppt: [],
    patientProfileFK: undefined,
  }

  componentDidMount () {
    this.resize()
    window.addEventListener('resize', this.resize.bind(this))
    if (this.props.patient && this.props.patient.id > 0) {
      this.getAppts(this.props.patient.id, false)
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  async getAppts (patientId, showRecheduledByClinic) {
    // console.log('getAppts', patientId)
    const { user, dispatch } = this.props
    const commonParams = {
      combineCondition: 'and',
      sorting: [
        { columnName: 'appointmentDate', direction: 'desc' },
      ],
    }

    const viewOtherApptAccessRight = Authorized.check(
      'appointment.viewotherappointment',
    )

    let doctor
    if (
      !viewOtherApptAccessRight ||
      viewOtherApptAccessRight.rights !== 'enable'
    ) {
      doctor = user.data.clinicianProfile.id
    }

    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ltappointmentstatus',
      },
    })

    const [
      previous,
    ] = await Promise.all([
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

  async UNSAFE_componentWillReceiveProps (nextProps) {
    const { patient } = nextProps

    if (this.state.patientProfileFK !== patient.id && patient.id > 0) {
      this.setState({
        patientProfileFK: patient.id,
      })
      await this.getAppts(patient.id)
    }
  }

  resize () {
    if (this.divElement) {
      const height = this.divElement.clientHeight
      if (height > 0) {
        this.setState({ height: height > 0 ? height / 2 - 144 : 300 })
      }
    }
  }

  reBuildApptDatas (data) {
    return data.map((o) => {
      const firstAppointment = o.appointment_Resources.find(
        (item) => item.sortOrder === 0,
      )
      let startTime = ''
      let doctor = 0
      let { appointmentDate } = o

      if (firstAppointment) {
        startTime = moment(firstAppointment.startTime, 'HH:mm:ss').format(
          'hh:mm A',
        )
        doctor = firstAppointment.clinicianFK
        appointmentDate = `${moment(o.appointmentDate).format(
          'YYYY-MM-DD',
        )} ${moment(firstAppointment.startTime, 'HH:mm:ss').format('HH:mm:ss')}`
      }

      const newRow = {
        ...o,
        appointmentDate,
        startTime,
        doctor,
        appointmentStatusFk: parseInt(o.appointmentStatusFk, 10),
        appointmentRemarks: o.appointmentRemarks || '',
      }
      return newRow
    })
  }

  toggleShowRecheduledByClinic = (e) => {
    this.getAppts(this.props.patient.id, e.target.value)
  }

  render () {
    const { previousAppt } = this.state

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
              rows={previousAppt}
              {...previousApptTableParams}
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
