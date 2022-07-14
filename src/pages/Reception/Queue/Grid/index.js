import React from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import MoreVert from '@material-ui/icons/MoreVert'
import $ from 'jquery'
// material ui
import CallIcon from '@material-ui/icons/Call'
// medisys component
import Tooltip from '@material-ui/core/Tooltip'
import { VisitStatusTag, LoadingWrapper } from '@/components/_medisys'
import { CommonTableGrid, Button, Skeleton, Switch } from '@/components'
// medisys component
// sub component
// utils
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { VISIT_TYPE } from '@/utils/constants'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import {
  FuncConfig,
  QueueTableConfig,
  QueueColumnExtensions,
  AppointmentTableConfig,
  ApptColumnExtensions,
} from './variables'
import { filterData } from '../utils'
import { StatusIndicator } from '../variables'
import { compose } from 'redux'
import Authorized from '@/utils/Authorized'
import ConsReadySwitch from './ConsReadySwitch'

const styles = theme => ({
  switchContainer: {
    color: 'currentColor',
    borderRadius: 3,
    height: 24,
    margin: 0,
    overflow: 'visible',
    top: -2,
    padding: 0,
    '& .ant-switch-handle': {
      width: 20,
      height: 20,
      '&::before': {
        borderRadius: 3,
        right: 2,
      },
    },
  },
})

class Grid extends React.Component {
  constructor(props) {
    super(props)
    props.dispatch({
      type: 'codetable/fetchCodes',
      payload: 'ctgender',
    })
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.loading !== nextProps.loading) return true
    if (this.props.selfOnly !== nextProps.selfOnly) return true
    if (this.props.filter !== nextProps.filter) return true
    if (this.props.mainDivHeight !== nextProps.mainDivHeight) return true
    if (this.props.searchQuery !== nextProps.searchQuery) return true
    if (this.props.visitType !== nextProps.visitType) return true
    if (this.props.doctor !== nextProps.doctor) return true

    if (
      nextProps.filter === StatusIndicator.APPOINTMENT &&
      this.props.calendarEvents !== nextProps.calendarEvents
    )
      return true
    if (
      nextProps.filter !== StatusIndicator.APPOINTMENT &&
      this.props.queueList !== nextProps.queueList
    )
      return true
    return false
  }

  onRowDoubleClick = row => {
    const { visitStatus, visitPurposeFK = VISIT_TYPE.CON } = row
    const isWaiting = visitStatus === VISIT_STATUS.WAITING
    const {
      clinicianProfile: { doctorProfile },
    } = this.props.user.data
    const retailVisits = [VISIT_TYPE.OTC, VISIT_TYPE.BF, VISIT_TYPE.MC]
    if (!doctorProfile || retailVisits.includes(visitPurposeFK)) return false

    if (isWaiting) this.props.onMenuItemClick(row, '5') // start consultation context menu id = 5

    return true
  }

  computeQueueListingData = () => {
    const {
      calendarEvents = [],
      eQueueEvents = [],
      filter = StatusIndicator.ALL,
      searchQuery,
      selfOnly = false,
      queueList = [],
      visitType = [],
      doctor = [],
    } = this.props
    const user = JSON.parse(
      sessionStorage.getItem('user') || localStorage.getItem('user'),
    )
    const { clinicianProfile } = user.data
    if (filter === StatusIndicator.APPOINTMENT) {
      let result = calendarEvents
      if (selfOnly) {
        result = result.filter(item =>
          clinicianProfile
            ? item.clinicianProfileFk === clinicianProfile.id
            : true,
        )
      }
      if (doctor.length > 0) {
        result = result.filter(
          item => doctor.indexOf(item.doctorProfileFK) > -1,
        )
      }
      if (searchQuery) {
        result = result.filter(
          item =>
            (item.patientName || '')
              .toLowerCase()
              .indexOf(searchQuery.toLowerCase()) >= 0 ||
            (item.patientReferenceNo || '')
              .toLowerCase()
              .indexOf(searchQuery.toLowerCase()) >= 0 ||
            (item.patientAccountNo || '')
              .toLowerCase()
              .indexOf(searchQuery.toLowerCase()) >= 0 ||
            (item.patientContactNo || '')
              .toLowerCase()
              .indexOf(searchQuery.toLowerCase()) >= 0,
        )
      }
      return result
    }

    if (filter === StatusIndicator.E_QUEUE) return eQueueEvents
    let data = [...queueList]

    if (selfOnly) {
      const servePatientRight = Authorized.check('queue.servepatient')
      const userRole = user.data.clinicianProfile.userProfile.role
      const userFK = user.data.clinicianProfile.userProfile.id
      const isServePatientEnable =
        userRole &&
        userRole.clinicRoleFK === 2 &&
        servePatientRight &&
        servePatientRight.rights !== 'hidden'

      data = data.filter(item => {
        if (!item.doctor && !isServePatientEnable) return false
        const {
          doctor: { id },
          visitDoctor = [],
        } = item
        return clinicianProfile.doctorProfile
          ? visitDoctor.filter(
              d => d.doctorProfileFK === clinicianProfile.doctorProfile.id,
            ).length > 0 || id === clinicianProfile.doctorProfile.id
          : item.servingByList.filter(o => o.servingByUserFK === userFK)
              .length > 0
      })
    }

    return filterData(filter, data, searchQuery, visitType, doctor)
  }

  getActionButton = row => (
    <Button
      justIcon
      round
      color='primary'
      size='sm'
      onClick={e => {
        this.props.onContextMenu(row, e)
        e.preventDefault()
        return false
      }}
    >
      <MoreVert />
    </Button>
  )

  handleStatusTagClick = row => {
    let id = '5' // default as Start Consultation
    const {
      visitStatus,
      visitPurposeFK,
      patientProfileFk,
      appointmentStatusFk,
      doctorName,
    } = row
    if (visitStatus === VISIT_STATUS.UPCOMING_APPT) {
      if (patientProfileFk && !doctorName) {
        return
      }
      id = patientProfileFk ? '8' : '9'

      this.props.onMenuItemClick(row, id)
      return
    }

    switch (visitStatus) {
      case VISIT_STATUS.WAITING:
        if (
          visitPurposeFK === VISIT_TYPE.OTC ||
          visitPurposeFK === VISIT_TYPE.BF ||
          visitPurposeFK === VISIT_TYPE.MC
        )
          id = '1'
        else id = '5'
        break
      case VISIT_STATUS.IN_CONS:
        id = '6'
        break
      case VISIT_STATUS.PAUSED:
        const { user } = this.props
        const clinicRoleFK =
          user.data.clinicianProfile.userProfile.role?.clinicRoleFK
        if (clinicRoleFK === 1) {
          id = '6'
        } else {
          id = '1'
        }
        break
      case VISIT_STATUS.DISPENSE:
      case VISIT_STATUS.ORDER_UPDATED:
        id = '1'
        break
      case VISIT_STATUS.BILLING:
      case VISIT_STATUS.COMPLETED:
      case VISIT_STATUS.PAYMENT_REQUESTED:
      case VISIT_STATUS.PAYMENT_FAILED:
        id = '1.1'
        break
      case VISIT_STATUS.EQ_PENDING:
        id = '12'
        break
      case VISIT_STATUS.PENDING:
        id = '11'
        break
      default:
        id = undefined
        break
    }

    this.props.onMenuItemClick(row, id)
  }

  render() {
    const {
      classes,
      codetable,
      filter = StatusIndicator.ALL,
      loading = false,
      queryingFormData = false,
      showingVisitRegistration = false,
      statusTagClicked,
      mainDivHeight = 700,
    } = this.props

    const queueListingData = this.computeQueueListingData()

    const showConsReady = Authorized.check('queue.modifyconsultationready')
    const showVisitGroup = Authorized.check('queue.visitgroup')

    const queueConfig = {
      ...QueueTableConfig,
      columns: QueueTableConfig.columns
        .filter(col =>
          showConsReady && showConsReady.rights === 'hidden'
            ? col.name !== 'consReady'
            : true,
        )
        .filter(col =>
          showVisitGroup && showVisitGroup.rights === 'hidden'
            ? col.name !== 'visitGroup'
            : true,
        ),
    }

    const isLoading = showingVisitRegistration ? false : loading
    let loadingText = 'Refreshing queue...'
    if (!loading && queryingFormData) loadingText = ''
    let height =
      document.documentElement.clientHeight -
      110 -
      ($('.filterBar').height() || 0) -
      ($('.queueHeader').height() || 0)
    if (height < 500) height = 500
    const TableProps = { height }
    if (!height) return <Skeleton variant='rect' height={500} />
    const queueColumns = QueueColumnExtensions(this.props)
    return (
      <div>
        <LoadingWrapper
          linear
          loading={isLoading || queryingFormData}
          text={loadingText}
        >
          {filter !== StatusIndicator.APPOINTMENT && (
            <CommonTableGrid
              size='sm'
              TableProps={TableProps}
              rows={queueListingData}
              forceRender
              columnExtensions={[
                ...queueColumns,
                {
                  columnName: 'visitStatus',
                  width: 180,
                  render: row => (
                    <VisitStatusTag
                      row={row}
                      onClick={this.handleStatusTagClick}
                    />
                  ),
                },
                {
                  columnName: 'consReady',
                  align: 'center',
                  render: row => {
                    return (
                      <ConsReadySwitch
                        className={classes.switchContainer}
                        row={row}
                        disabled={
                          showConsReady && showConsReady.rights !== 'enable'
                        }
                        {...this.props}
                      />
                    )
                  },
                  sortingEnabled: false,
                },
                {
                  columnName: 'action',
                  align: 'center',
                  render: this.getActionButton,
                  width: 95,
                },
                {
                  columnName: 'visitPurposeFK',
                  width: 60,
                  align: 'left',
                  render: row => {
                    return ''
                  },
                },
              ]}
              FuncProps={FuncConfig}
              onRowDoubleClick={this.onRowDoubleClick}
              onContextMenu={this.props.onContextMenu}
              {...queueConfig}
            />
          )}
          {filter === StatusIndicator.APPOINTMENT && (
            <CommonTableGrid
              size='sm'
              TableProps={TableProps}
              rows={queueListingData}
              forceRender
              columnExtensions={[
                ...ApptColumnExtensions,
                {
                  columnName: 'visitStatus',
                  width: 200,
                  render: row => (
                    <VisitStatusTag
                      row={row}
                      onClick={this.handleStatusTagClick}
                      statusTagClicked={statusTagClicked}
                    />
                  ),
                },
                {
                  columnName: 'action',
                  align: 'center',
                  render: this.getActionButton,
                  width: 95,
                },
                {
                  columnName: 'gender/age',
                  render: row => {
                    const { dob, genderFK = 3, patientProfileFk } = row
                    if (!patientProfileFk) return null
                    const { ctgender = [] } = codetable
                    const age = calculateAgeFromDOB(dob)
                    const gender = ctgender.find(g => g.id === genderFK)
                    return (
                      <Tooltip title={`${gender.code}/${age}`}>
                        <span>{`${gender.code}/${age}`}</span>
                      </Tooltip>
                    )
                  },
                  sortingEnabled: false,
                },
              ]}
              FuncProps={FuncConfig}
              onRowDoubleClick={this.onRowDoubleClick}
              {...AppointmentTableConfig}
            />
          )}
        </LoadingWrapper>
      </div>
    )
  }
}

export default compose(
  connect(({ queueLog, global, loading, user, codetable, dispatch }) => ({
    user,
    codetable,
    dispatch,
    mainDivHeight: global.mainDivHeight,
    filter: queueLog.currentFilter,
    selfOnly: queueLog.selfOnly,
    queueList: queueLog.list || [],
    statusTagClicked: queueLog.statusTagClicked,
    calendarEvents: queueLog.appointmentList || [],
    eQueueEvents: queueLog.equeueList || [],
    showingVisitRegistration: global.showVisitRegistration,
    queueLog,
    loading:
      loading.effects['queueLog/refresh'] ||
      loading.effects['queueLog/getSessionInfo'] ||
      loading.effects['queueLog/query'] ||
      loading.effects['calendar/getCalendarList'],
    queryingFormData: loading.effects['dispense/initState'],
  })),
  withStyles(styles),
)(Grid)
