import React from 'react'
import { PageContainer } from '@/components'
import moment from 'moment'
// umi locale
import { history, FormattedMessage, formatMessage, connect } from 'umi'
// class names
import classNames from 'classnames'
// material ui
import { Divider, withStyles } from '@material-ui/core'
import Refresh from '@material-ui/icons/Refresh'
import Stop from '@material-ui/icons/Stop'
import EventNote from '@material-ui/icons/EventNote'
import { openCautionAlertOnStartConsultation } from '@/pages/Widgets/Orders/utils'

// custom components
import {
  Card,
  CardHeader,
  CardBody,
  CommonModal,
  PageHeaderWrapper,
  ProgressButton,
  notification,
  Tooltip,
} from '@/components'
// current page sub components
import EndSessionSummary from '@/pages/Report/SessionSummary/Details/index'
// utils
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import { getAppendUrl, getRemovedUrl } from '@/utils/utils'
import Authorized from '@/utils/Authorized'
import { QueueDashboardButton } from '@/components/_medisys'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import {
  FORM_CATEGORY,
  VALUE_KEYS,
  VISIT_TYPE,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  DISPENSE_FROM,
} from '@/utils/constants'
import { initRoomAssignment } from '@/utils/codes'
import { sendNotification } from '@/utils/realtime'
import {
  modelKey,
  AppointmentContextMenu,
  ContextMenuOptions,
} from './variables'
import PatientSearchModal from './PatientSearch'
import DetailsGrid from './Grid'
import DetailsActionBar from './FilterBar'
import EmptySession from './EmptySession'
import VisitForms from './VisitForms'
import RightClickContextMenu from './Grid/RightClickContextMenu'

const drawerWidth = 400

const styles = theme => ({
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  sessionNo: {
    marginTop: 0,
    marginBottom: 0,
    float: 'left',
    color: 'black',
  },
  toolBtns: {
    float: 'right',
    paddingTop: 5,
  },
  cardIconTitle: {
    color: 'black',
  },
  switchContainer: {
    lineHeight: '1em',
    height: '100%',
    color: 'currentColor',
    borderRadius: 0,
    '& .ant-switch-handle': {
      width: 20,
      height: 16,
      '&::before': {
        borderRadius: 3,
        right: 2,
      },
    },
  },
})

@connect(
  ({
    queueLog,
    patientSearch,
    loading,
    user,
    patient,
    queueCalling,
    clinicSettings,
    codetable,
  }) => ({
    patientSearchResult: patientSearch.list,
    queueLog,
    loading,
    user: user.data,
    patient: patient.entity,
    DefaultPatientProfile: patient.default,
    queueCalling,
    clinicSettings,
    codetable,
  }),
)
class Queue extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      _sessionInfoID: undefined,
      showPatientSearch: false,
      showEndSessionSummary: false,
      search: '',
      showForms: false,
      formCategory: undefined,
      queueInfo: undefined,
      refreshInfo: undefined,
    }
    this._timer = null
  }

  componentWillMount = () => {
    const { dispatch, queueLog, history } = this.props
    const {
      location: { query },
    } = history
    const { sessionInfo } = queueLog
    dispatch({
      type: `${modelKey}initState`,
    })
    dispatch({
      type: `${modelKey}refresh`,
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctroom',
      },
    })

    this.setState({
      refreshInfo: moment().format('HH:mm'),
    })
    initRoomAssignment()
    this.AutoRefreshQueueList()
  }

  componentWillUnmount() {
    clearInterval(this._timer)
    this.props.dispatch({
      type: 'calendar/updateState',
      payload: {
        list: [],
      },
    })
  }

  showVisitRegistration = ({
    visitID = undefined,
    patientID = undefined,
    appointmentID = undefined,
    pdid = undefined,
    pdroomid = undefined,
    visitMode = undefined,
    visitOrderTemplateFK = undefined,
  }) => {
    const parameter = {
      md: 'visreg',
    }
    if (patientID) parameter.pid = patientID
    if (visitID) parameter.vis = visitID
    if (appointmentID) parameter.apptid = appointmentID
    if (pdid) parameter.pdid = pdid
    if (pdroomid) parameter.pdroomid = pdroomid
    if (visitMode) parameter.visitMode = visitMode
    if (visitOrderTemplateFK)
      parameter.visitOrderTemplateFK = visitOrderTemplateFK

    // console.log(parameter)
    this.togglePatientSearch(false)
    this.props.history.push(getAppendUrl(parameter))
  }

  handleActualizeAppointment = ({
    patientID = undefined,
    appointmentID = undefined,
    primaryClinicianFK = undefined,
    primaryClinicianRoomFK = undefined,
    visitOrderTemplateFK = undefined,
  }) => {
    this.showVisitRegistration({
      patientID,
      appointmentID,
      pdid: primaryClinicianFK,
      pdroomid: primaryClinicianRoomFK,
      visitOrderTemplateFK: visitOrderTemplateFK,
      visitMode: 'edit',
    })
  }

  closeVisitRegistration = () => {
    this.props.dispatch({
      type: 'global/updateAppState',
      payload: {
        showVisitRegistration: false,
      },
    })
  }

  redirectToVisitRegistration = () => {
    const { patient } = this.props
    if (patient) {
      this.showVisitRegistration({
        patientID: patient.id,
        visitMode: 'edit',
      })
    }
  }

  updateAppointmentLinking = (row, patientProfileFK) => {
    const { dispatch } = this.props
    dispatch({
      type: 'calendar/updateAppointmentLinking',
      payload: {
        id: row.id,
        patientProfileFK,
      },
    }).then(response => {
      if (response) {
        dispatch({
          type: 'queueLog/refresh',
        })
      }
    })
  }

  toggleRegisterNewPatient = (shouldRedirect = true, row = undefined) => {
    if (row) {
      const { DefaultPatientProfile } = this.props
      this.props.dispatch({
        type: 'patient/updateDefaultEntity',
        payload: {
          name: row.patientName,
          callingName: row.patientName,
          contact: {
            ...DefaultPatientProfile.contact,
            mobileContactNumber: {
              ...DefaultPatientProfile.contact.mobileContactNumber,
              number: row.patientContactNo,
            },
          },
        },
      })
    }
    this.props.dispatch({
      type: 'patient/openPatientModal',
      payload: {
        callback: patientProfileFK => {
          this.props.dispatch({
            type: 'patient/closePatientModal',
          })
          if (shouldRedirect) this.redirectToVisitRegistration()
          if (row) this.updateAppointmentLinking(row, patientProfileFK)
        },
      },
    })
  }

  togglePatientSearch = override => {
    const { showPatientSearch } = this.state
    const target = !showPatientSearch
    this.setState({
      showPatientSearch: override === undefined ? target : override,
    })
    // closing patient search
    if (!target) {
      this.resetPatientSearchResult()
    }

    // opening patient search
    if (target) {
      this.props.dispatch({
        type: 'patient/updateState',
        payload: {
          callback: () => {
            this.props.dispatch({
              type: 'patient/closePatientModal',
            })
            this.redirectToVisitRegistration()
          },
        },
      })
    }
    this.props.history.push(getRemovedUrl(['v']))
  }

  resetPatientSearchResult = () => {
    this.props.dispatch({
      type: 'patientSearch/updateState',
      payload: {
        filter: {},
        list: [],
      },
    })
  }

  onStartSession = () => {
    const { dispatch } = this.props
    this.setState({
      _sessionInfoID: undefined,
    })
    dispatch({
      type: `${modelKey}startSession`,
    })
  }

  onReopenLastSession = () => {
    const { dispatch } = this.props
    dispatch({
      type: `${modelKey}reopenLastSession`,
    })
  }

  onEndSessionClick = () => {
    const { dispatch, queueLog } = this.props
    const { sessionInfo } = queueLog
    const { sessionNo } = sessionInfo
    const hasWaitingVisitGroup = queueLog.list.find(
      q => q.visitGroup && q.visitStatus === VISIT_STATUS.WAITING,
    )

    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmTitle: '',
        customWidth: hasWaitingVisitGroup ? 'md' : '',
        openConfirmContent: hasWaitingVisitGroup
          ? [
              `Confirm to remove waiting patients' visit group and`,
              <br />,
              `end current session (${sessionNo})?`,
            ]
          : `End current session (${sessionNo})?`,
        onConfirmSave: this.onConfirmEndSession,
      },
    })
  }

  onSessionSummaryClick = () => {
    const { queueLog } = this.props
    const _sessionInfoID = queueLog.sessionInfo.id
    this.setState({ _sessionInfoID })
    this.setState({
      showEndSessionSummary: true,
    })
  }

  onConfirmEndSession = () => {
    const { queueLog, dispatch } = this.props
    const _sessionInfoID = queueLog.sessionInfo.id
    this.setState({ _sessionInfoID })
    dispatch({
      type: `queueLog/endSession`,
      sessionID: queueLog.sessionInfo.id,
    }).then(async response => {
      if (response) {
        this.clearQueueCall()
        this.setState({
          showEndSessionSummary: true,
        })
      }
    })
  }

  clearQueueCall = () => {
    this.props
      .dispatch({
        type: 'queueCalling/claearAll',
        payload: {
          key: VALUE_KEYS.QUEUECALLING,
        },
      })
      .then(res => {
        if (res) {
          sendNotification('QueueClear', {
            type: NOTIFICATION_TYPE.QUEUECALL,
            status: NOTIFICATION_STATUS.OK,
            message: 'Queue Clear',
          })
        }
      })
  }

  onEndSessionSummaryClose = () => {
    this.setState({ showEndSessionSummary: false })
  }

  onEnterPressed = async searchQuery => {
    const hasSearchQuery = !!searchQuery
    await this.showSearchResult(hasSearchQuery, searchQuery)
  }

  onContextMenu = (row, event) => {
    if (event) {
      event.preventDefault()
      this.setState({
        rightClickedRow: row,
        anchorEl: {
          x: event.pageX,
          y: event.pageY,
        },
      })
    }
  }

  onHideContextMenu = e => {
    if (
      e &&
      e.target &&
      (e.target.nodeName === 'svg' || e.target.nodeName === 'BUTTON')
    )
      return
    this.setState({
      rightClickedRow: undefined,
      anchorEl: undefined,
    })
  }

  deleteQueueConfirmation = row => {
    const { queueNo, id } = row
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmTitle: '',
        openConfirmText: 'Confirm',
        openConfirmContent: `Delete this visit (Q No.: ${queueNo})?`,
        onConfirmSave: () => {
          dispatch({
            type: 'queueLog/deleteQueueByQueueID',
            payload: {
              id,
              queueNo,
            },
          })
        },
      },
    })
  }

  isAssignedDoctor = row => {
    if (!row.doctor) return false
    const {
      doctor: { id },
      visitStatus,
    } = row
    const {
      clinicianProfile: { doctorProfile },
    } = this.props.user

    if (!doctorProfile) {
      notification.error({
        message: 'Current user is not authorized to access',
      })
      return false
    }

    if ([VISIT_STATUS.IN_CONS, VISIT_STATUS.PAUSED].indexOf(visitStatus) >= 0) {
      if (id !== doctorProfile.id) {
        notification.error({
          message: `You cannot resume other doctor's consultation.`,
        })
        return false
      }
    }
    return true
  }

  canAccess = id => {
    const apptsActionID = ['8', '9']
    const findMatch = item => item.id === parseFloat(id, 10)

    let menuOpt = ContextMenuOptions.find(findMatch)

    if (apptsActionID.includes(id)) {
      menuOpt = AppointmentContextMenu.find(findMatch)
    }

    const accessRight = Authorized.check(menuOpt.authority)

    // skip for patient dashboard button
    // user can access patient dashboard regardless of access right
    // patient dashboard page will have the access right checking explicitly
    if (id === '4') return true

    return (
      accessRight &&
      (accessRight.rights === 'enable' || accessRight.rights === 'readwrite')
    )
  }

  onMenuItemClick = (row, id) => {
    const { dispatch } = this.props
    const hasAccess = this.canAccess(id)

    if (!hasAccess) {
      notification.error({
        message: 'Current user is not authorized to access',
      })
      return
    }
    dispatch({
      type: 'queueLog/updateState',
      payload: {
        statusTagClicked: true,
      },
    })
    switch (id) {
      case '0': // edit visit
        this.showVisitRegistration({
          visitID: row.id,
          visitMode: 'edit',
        })
        break
      case '0.1': // view visit
        this.showVisitRegistration({
          visitID: row.id,
          visitMode: 'view',
        })
        break
      case '1': {
        // dispense
        const isInitialLoading =
          row.visitPurposeFK === VISIT_TYPE.OTC &&
          row.visitStatus === VISIT_STATUS.WAITING
        const version = Date.now()
        dispatch({
          type: `dispense/start`,
          payload: {
            id: row.visitFK,
            version,
            qid: row.id,
            queueNo: row.queueNo,
          },
        }).then(o => {
          if (o) {
            dispatch({
              type: `dispense/updateState`,
              payload: {
                openFrom: DISPENSE_FROM.QUEUE,
              },
            })
            history.push(
              `/reception/queue/dispense?isInitialLoading=${isInitialLoading}&qid=${row.id}&vid=${row.visitFK}&v=${version}&pid=${row.patientProfileFK}`,
            )
          }
        })

        break
      }
      case '1.1': {
        // billing
        const version = Date.now()
        const parameters = {
          vid: row.visitFK,
          pid: row.patientProfileFK,
          qid: row.id,
          v: version,
        }
        history.push(getAppendUrl(parameters, '/reception/queue/billing'))
        break
      }
      case '2': // delete visit
        this.deleteQueueConfirmation(row)
        break
      case '3': // view patient profile
        this.onViewPatientProfileClick(row.patientProfileFK, row.id)
        break
      case '3.1': // view patient document
        this.onViewPatientProfileClick(row.patientProfileFK, row.id, 7)
        break
      case '4': // patient dashboard
        history.push(
          `/reception/queue/patientdashboard?qid=${row.id}&v=${Date.now()}`,
        )
        break
      case '5': {
        // start consultation
        const valid = this.isAssignedDoctor(row)
        if (valid) {
          const version = Date.now()

          dispatch({
            type: `consultation/start`,
            payload: {
              id: row.visitFK,
              version,
              qid: row.id,
              queueNo: row.queueNo,
            },
          }).then(o => {
            if (o) {
              history.push(
                `/reception/queue/consultation?qid=${row.id}&cid=${o.id}&pid=${row.patientProfileFK}&v=${version}`,
              )
              openCautionAlertOnStartConsultation(o)
            }
          })
        }
        break
      }
      case '6': {
        // resume consultation
        const valid = this.isAssignedDoctor(row)
        if (valid) {
          const version = Date.now()

          if (row.visitStatus === VISIT_STATUS.PAUSED) {
            dispatch({
              type: `consultation/resume`,
              payload: {
                id: row.visitFK,
                version,
              },
            }).then(o => {
              if (o)
                history.push(
                  `/reception/queue/consultation?qid=${row.id}&cid=${o.id}&pid=${row.patientProfileFK}&v=${version}`,
                )
            })
          } else {
            history.push(
              `/reception/queue/consultation?qid=${row.id}&cid=${row.clinicalObjectRecordFK}&pid=${row.patientProfileFK}&v=${version}`,
            )
          }
        }

        break
      }
      case '7': {
        // edit consultation
        const version = Date.now()
        dispatch({
          type: `consultation/edit`,
          payload: {
            id: row.visitFK,
            version,
          },
        }).then(o => {
          if (o)
            if (o.updateByUserFK !== this.props.user.id) {
              const { clinicianprofile = [] } = this.props.codetable
              const editingUser = clinicianprofile.find(
                m => m.userProfileFK === o.updateByUserFK,
              ) || {
                name: 'Someone',
              }
              dispatch({
                type: 'global/updateAppState',
                payload: {
                  openConfirm: true,
                  openConfirmContent: `${editingUser.name} is currently editing the patient note, do you want to overwrite?`,
                  onConfirmSave: () => {
                    dispatch({
                      type: `consultation/overwrite`,
                      payload: {
                        id: row.visitFK,
                        version,
                      },
                    }).then(c => {
                      history.push(
                        `/reception/queue/consultation?qid=${row.id}&cid=${c.id}&pid=${row.patientProfileFK}&v=${version}`,
                      )
                    })
                  },
                },
              })
            } else {
              history.push(
                `/reception/queue/consultation?qid=${row.id}&cid=${o.id}&pid=${row.patientProfileFK}&v=${version}`,
              )
            }
        })
        break
      }
      case '8': {
        const { clinicianprofile = [] } = this.props.codetable
        const doctorProfile = clinicianprofile.find(
          item => item.id === row.clinicianProfileFk,
        )
        console.log(row)
        this.handleActualizeAppointment({
          patientID: row.patientProfileFk,
          appointmentID: row.id,
          primaryClinicianFK: doctorProfile ? doctorProfile.id : undefined,
          primaryClinicianRoomFK: row.roomFk,
          visitOrderTemplateFK: row.visitOrderTemplateFK,
        })
        break
      }
      case '9':
        this.toggleRegisterNewPatient(false, row)
        break
      case '10':
        this.showVisitForms(row)
        break
      default:
        break
    }
    setTimeout(() => {
      dispatch({
        type: 'queueLog/updateState',
        payload: {
          statusTagClicked: false,
        },
      })
    }, 3000)
  }

  onQueueListing = row => {
    const { dispatch } = this.props
    const visitId = row.id
    dispatch({
      type: 'queueLog/updateQueueListing',
      payload: row,
    }).then(r => {
      !r ? row.changeState() : null
    })
  }

  showSearchResult = async (hasSearchQuery = false, searchQuery) => {
    const { dispatch } = this.props
    if (searchQuery) {
      const prefix = 'like_'
      await dispatch({
        type: 'patientSearch/query',
        payload: {
          apiCriteria: {
            searchValue: searchQuery,
          },
        },
      })
    } else {
      this.props.dispatch({
        type: 'patientSearch/updateState',
        payload: {
          list: [],
          pagination: {
            totalRecords: 0,
            pagesize: 20,
          },
        },
      })
    }
    const { patientSearchResult = [] } = this.props
    const totalRecords = patientSearchResult.length

    if (totalRecords === 1 && hasSearchQuery)
      return this.showVisitRegistration({
        patientID: patientSearchResult[0].id,
        visitMode: 'edit',
      })
    if (totalRecords >= 1) {
      return this.togglePatientSearch()
    }
    if (totalRecords === 0 && searchQuery) {
      return this.toggleRegisterNewPatient()
    }
    return this.togglePatientSearch()
  }

  onRefreshClick = () => {
    const { dispatch } = this.props
    this.AutoRefreshQueueList()
    this.setState({ refreshInfo: moment().format('HH:mm') })
    dispatch({
      type: `${modelKey}refresh`,
    })
  }

  AutoRefreshQueueList() {
    let {
      dispatch,
      clinicSettings: {
        settings: { autoRefreshQueueListingInterval = 120 },
      },
    } = this.props
    clearInterval(this._timer)
    this._timer = setInterval(() => {
      dispatch({ type: `${modelKey}refresh` })
      this.setState({
        refreshInfo: moment().format('HH:mm'),
      })
    }, (autoRefreshQueueListingInterval || 120) * 1000)
  }
  onViewPatientProfileClick = (patientProfileFK, qid, cmt = 1) => {
    this.props.history.push(
      getAppendUrl({
        md: 'pt',
        cmt: cmt,
        pid: patientProfileFK,
        qid,
        v: Date.now(),
      }),
    )
  }

  setSearch = v => {
    this.setState({
      search: v,
    })
  }

  toggleForms = () => {
    const { showForms } = this.state
    const target = !showForms
    this.setState({
      showForms: target,
    })
    // closing Forms
    if (!target) {
      this.resetFormsResult()
    }
  }

  resetFormsResult = () => {
    this.props.dispatch({
      type: 'formListing/updateState',
      payload: {
        list: [],
      },
    })
  }

  showVisitForms = async row => {
    const {
      id,
      visitStatus,
      doctor,
      patientAccountNo,
      patientName,
      gender,
      patientReferenceNo,
      dob,
    } = row
    const title =
      doctor?.clinicianProfile.title &&
      doctor.clinicianProfile.title !== 'Other'
        ? `${doctor.clinicianProfile.title} `
        : ''
    await this.props.dispatch({
      type: 'formListing/updateState',
      payload: {
        visitID: id,
        visitDetail: {
          visitID: id,
          doctorProfileFK: doctor ? doctor.id : 0,
          patientName,
          doctorName: doctor ? `${title}${doctor.clinicianProfile.name}` : '',
          patientAccountNo,
          patientGender: gender,
          patientDOB: dob,
          patientAge: dob ? calculateAgeFromDOB(dob) : 0,
          patientRefNo: patientReferenceNo,
          todayDate: moment().toDate(),
        },
      },
    })
    if (visitStatus === VISIT_STATUS.WAITING) {
      this.setState({ formCategory: FORM_CATEGORY.VISITFORM })
    } else {
      this.setState({ formCategory: FORM_CATEGORY.CORFORM })
    }
    this.toggleForms()
  }

  render() {
    const {
      classes,
      queueLog,
      loading,
      history,
      dispatch,
      queueCalling,
    } = this.props
    const {
      showEndSessionSummary,
      showPatientSearch,
      _sessionInfoID,
      search,
      showForms,
      queueInfo,
      refreshInfo,
    } = this.state
    const { sessionInfo, error, queueFilterBar = {} } = queueLog
    const { visitType = [] } = queueFilterBar
    const { doctor = [] } = queueFilterBar
    const { sessionNo, isClinicSessionClosed } = sessionInfo
    const { oriQCallList } = queueCalling
    const openQueueDisplayAccessRight = Authorized.check('openqueuedisplay')
    const roomCode = localStorage.getItem('roomCode')
    let queueCallList = undefined

    if (oriQCallList) {
      queueCallList = oriQCallList.filter(
        x => x.from === 'Queue' && x.roomCode === roomCode,
      )
    }
    return (
      <PageContainer
        header={{
          breadcrumb: {},
          title: `Session No.: ${sessionNo}`,
          extra: [
            <div className='queueHeader'>
              {!isClinicSessionClosed && (
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      position: 'absolute',
                      right: 700,
                      width: 200,
                    }}
                  >
                    <p style={{ fontWeight: 400, fontSize: '0.8rem' }}>
                      Now Serving:
                    </p>
                    <Tooltip
                      title={
                        queueCallList?.[0]
                          ? `${queueCallList?.[0]?.qNo}.0 (${queueCallList?.[0]?.patientName})`
                          : '-'
                      }
                    >
                      <p
                        style={{
                          color: '#1890f8',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          marginTop: -5,
                          fontSize: '0.9rem',
                          width: 200,
                        }}
                      >
                        {queueCallList?.[0]
                          ? `${queueCallList?.[0]?.qNo}.0 (${queueCallList?.[0]?.patientName})`
                          : '-'}
                      </p>
                    </Tooltip>
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      position: 'absolute',
                      right: 620,
                    }}
                  >
                    <p style={{ fontWeight: 400, fontSize: '0.8rem' }}>
                      Last Refresh:
                    </p>
                    <span>
                      <p
                        style={{
                          color: '#1890f8',
                          marginTop: -5,
                          fontSize: '0.9rem',
                        }}
                      >
                        {refreshInfo ? refreshInfo : '-'}
                      </p>
                    </span>
                  </div>
                  <ProgressButton
                    color='info'
                    size='sm'
                    onClick={this.onRefreshClick}
                    submitKey={`${modelKey}refresh`}
                    icon={<Refresh />}
                  >
                    Refresh
                  </ProgressButton>
                  <QueueDashboardButton size='sm' />

                  <Authorized authority='queue.endsession'>
                    <ProgressButton
                      icon={<EventNote />}
                      color='info'
                      size='sm'
                      onClick={this.onSessionSummaryClick}
                    >
                      <FormattedMessage id='reception.queue.sessionSummary' />
                    </ProgressButton>
                  </Authorized>

                  <Authorized authority='queue.endsession'>
                    <ProgressButton
                      icon={<Stop />}
                      color='danger'
                      size='sm'
                      onClick={this.onEndSessionClick}
                    >
                      <FormattedMessage id='reception.queue.endSession' />
                    </ProgressButton>
                  </Authorized>
                </div>
              )}
            </div>,
          ],
        }}
      >
        <PageHeaderWrapper
          title={<FormattedMessage id='app.forms.basic.title' />}
          content={<FormattedMessage id='app.forms.basic.description' />}
        >
          {isClinicSessionClosed ? (
            <EmptySession
              handleStartSession={this.onStartSession}
              handleReopenLastSession={this.onReopenLastSession}
              sessionInfo={sessionInfo}
              loading={loading}
              errorState={error}
            />
          ) : (
            <div>
              <div className='filterBar'>
                <DetailsActionBar
                  // selfOnly={queueLog.selfOnly}
                  // onSwitchClick={this.toggleFilterSelfOnly}
                  onRegisterVisitEnterPressed={this.onEnterPressed}
                  toggleNewPatient={this.toggleRegisterNewPatient}
                  setSearch={this.setSearch}
                  {...this.props}
                />
              </div>
              <DetailsGrid
                // onViewPatientProfileClick={this.onViewPatientProfileClick}
                // onViewDispenseClick={this.toggleDispense}
                // onRegisterPatientClick={this.toggleRegisterNewPatient}
                // handleEditVisitClick={this.showVisitRegistration}
                // handleActualizeAppointment={this.handleActualizeAppointment}
                onMenuItemClick={this.onMenuItemClick}
                onContextMenu={this.onContextMenu}
                onQueueListing={this.onQueueListing}
                // handleFormsClick={this.showVisitForms}
                history={history}
                searchQuery={search}
                visitType={visitType}
                doctor={doctor}
              />
              <RightClickContextMenu
                onMenuItemClick={this.onMenuItemClick}
                onOutsidePopoverRightClick={this.onHideContextMenu}
                anchorEl={this.state.anchorEl}
                rightClickedRow={this.state.rightClickedRow}
                dispatch={dispatch}
              />
            </div>
          )}
          <CommonModal
            open={showPatientSearch}
            title={formatMessage({ id: 'reception.queue.patientSearch' })}
            onClose={this.togglePatientSearch}
            onConfirm={this.togglePatientSearch}
            maxWidth='md'
            overrideLoading
          >
            <PatientSearchModal
              search={this.state.search}
              handleRegisterVisitClick={this.showVisitRegistration}
              onViewPatientProfileClick={this.onViewPatientProfileClick}
            />
          </CommonModal>
          <CommonModal
            open={showEndSessionSummary}
            title='Session Summary'
            onClose={this.onEndSessionSummaryClose}
            onConfirm={this.onEndSessionSummaryClose}
            disableBackdropClick
          >
            <EndSessionSummary sessionID={_sessionInfoID} />
          </CommonModal>
          <CommonModal
            open={showForms}
            title={
              this.state.formCategory === FORM_CATEGORY.VisitForms
                ? 'Visit Forms'
                : 'Forms'
            }
            onClose={this.toggleForms}
            onConfirm={this.toggleForms}
            maxWidth='md'
            overrideLoading
          >
            <VisitForms formCategory={this.state.formCategory} />
          </CommonModal>
        </PageHeaderWrapper>
      </PageContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Queue)
