import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { connect } from 'dva'
import { compose } from 'redux'
import moment from 'moment'
import { Button, Drawer } from 'antd'
import { Link, history, formatMessage } from 'umi'
import { withStyles, Divider } from '@material-ui/core'
import Banner from '@/pages/PatientDashboard/Banner'
import { LoadingWrapper } from '@/components/_medisys'
import Authorized from '@/utils/Authorized'
import SummaryComment from './SummaryComment'
import TestResult from './TestResult'
import ReportHistory from './ReportHistory'
import ResultDetails from './ResultDetails'
import {
  MEDICALCHECKUP_WORKITEM_STATUS,
  MEDICALCHECKUP_REPORTTYPE,
  MEDICALCHECKUP_REPORTSTATUS,
  REPORTINGDOCTOR_STATUS,
} from '@/utils/constants'
import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import {
  GridContainer,
  GridItem,
  SizeContainer,
  CommonModal,
  Tooltip,
  notification,
} from '@/components'

const styles = theme => ({
  commentContainer: {
    '& > div:last-child': {
      visibility: 'hidden',
    },
    '&:hover': {
      '& > div:last-child': {
        visibility: 'visible',
      },
    },
  },
})

const ReportingDetails = props => {
  const {
    loading,
    patient,
    medicalCheckupReportingDetails,
    dispatch,
    user,
    onClose = () => {},
    clinicSettings,
    visitRegistration,
  } = props
  const reportingStatus = medicalCheckupReportingDetails.entity?.statusFK
  const { primaryPrintoutLanguage = 'EN' } = clinicSettings.settings
  const height = window.innerHeight
  const banner = document.getElementById('patientBanner')
  const contentHeight = (height || 0) - (banner?.offsetHeight || 0) - 92
  const [selectedLanguage, setSelectedLanguage] = useState(
    primaryPrintoutLanguage,
  )
  const [reportLanguage, setReportLanguage] = useState(undefined)
  const [showReportHistory, setShowReportHistory] = useState(false)
  const [showResultDetails, setShowResultDetails] = useState(false)
  const [placement, setPlacement] = useState('right')
  useEffect(() => {
    if (visitRegistration.entity?.visit) {
      const medicalCheckupWorkitems =
        visitRegistration.entity?.visit?.medicalCheckupWorkitem || []
      if (
        medicalCheckupWorkitems.length > 0 &&
        medicalCheckupWorkitems[0].reportLanguage !== reportLanguage
      ) {
        setReportLanguage(medicalCheckupWorkitems[0].reportLanguage)

        if (
          (medicalCheckupWorkitems[0].reportLanguage || '').indexOf('JP') >= 0
        ) {
          setSelectedLanguage('JP')
        } else {
          setSelectedLanguage('EN')
        }
      }
    }
  }, [visitRegistration])
  const generateReport = (reportType, message) => {
    dispatch({
      type: 'medicalCheckupReportingDetails/generateReport',
      payload: {
        medicalCheckupWorkitemFK: medicalCheckupReportingDetails.entity.id,
        reportType,
      },
    }).then(r => {
      if (r) {
        notification.success({
          message: message,
        })
        refreshMedicalCheckup()
      }
    })
  }

  const toggleReportHistory = () => {
    const target = !showReportHistory
    setShowReportHistory(target)
  }

  const querySummaryCommentHistory = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/querySummaryCommentHistory',
      payload: {
        apiCriteria: {
          patientProfileFK: medicalCheckupReportingDetails.patientID,
          visitFK: medicalCheckupReportingDetails.visitID,
        },
      },
    })
  }

  const queryIndividualCommentHistory = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/queryIndividualCommentHistory',
      payload: {
        apiCriteria: {
          patientProfileFK: medicalCheckupReportingDetails.patientID,
          visitFK: medicalCheckupReportingDetails.visitID,
        },
      },
    })
  }

  const refreshMedicalCheckup = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/query',
      payload: {
        id: medicalCheckupReportingDetails.medicalCheckupWorkitemId,
      },
    })
  }

  const changePlacement = () => {
    if (placement === 'left') {
      setPlacement('right')
    } else {
      setPlacement('left')
    }
  }

  const onShowShowResultDetails = () => {
    if (!showResultDetails) {
      setShowResultDetails(true)
      setPlacement('right')
    }
  }

  const onUnlock = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/unlock',
      payload: {
        ...medicalCheckupReportingDetails.entity,
      },
    }).then(r => {
      if (r) {
        notification.success({
          message: 'Medical Checkup report unlocked.',
        })
        onClose()
      }
    })
  }

  const clearEditComment = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/updateState',
      payload: {
        summaryCommentEntity: undefined,
        individualCommentEntity: undefined,
        isNeedToClearSummaryComment: true,
      },
    })

    dispatch({
      type: 'medicalCheckupReportingDetails/updateState',
      payload: {
        individualCommentEntity: undefined,
      },
    })
  }

  const getEditEnable = () => {
    return (
      reportingStatus !== MEDICALCHECKUP_WORKITEM_STATUS.PENDINGVERIFICATION &&
      reportingStatus !== MEDICALCHECKUP_WORKITEM_STATUS.COMPLETED
    )
  }

  const completeMedicalCheckup = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/upsert',
      payload: {
        ...medicalCheckupReportingDetails.entity,
        statusFK: MEDICALCHECKUP_WORKITEM_STATUS.COMPLETED,
        completedDate: moment(),
        completedByUserFK: user.data.clinicianProfile.userProfile.id,
      },
    }).then(r => {
      if (r) {
        refreshMedicalCheckup()
      }
    })
  }

  const isShowGenerateFinalReport = () => {
    const { medicalCheckupWorkitemDoctor = [] } =
      medicalCheckupReportingDetails.entity || {}
    if (
      reportingStatus === MEDICALCHECKUP_WORKITEM_STATUS.REPORTING &&
      medicalCheckupWorkitemDoctor.filter(
        x => x.status === REPORTINGDOCTOR_STATUS.VERIFIED,
      ).length === medicalCheckupWorkitemDoctor.length
    ) {
      const generateReportAccessRight = Authorized.check(
        'medicalcheckupworklist.generatereport',
      ) || {
        rights: 'hidden',
      }
      if (generateReportAccessRight.rights === 'enable') return true
    }
    return false
  }

  const isShowGenerateTemporaryReport = () => {
    if (
      reportingStatus !== MEDICALCHECKUP_WORKITEM_STATUS.REPORTING &&
      reportingStatus !== MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS
    )
      return false

    const generateTemporaryReportAccessRight = Authorized.check(
      'medicalcheckupworklist.generatetemporaryreport',
    ) || {
      rights: 'hidden',
    }
    if (generateTemporaryReportAccessRight.rights !== 'enable') return false

    return true
  }

  const genrateTemporaryReport = () => {
    if (reportingStatus === MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS) {
      dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmContent: `Not all test has completed, generating report will exclude incomplete test. Confirm to generate ?`,
          onConfirmSave: () => {
            generateReport(
              MEDICALCHECKUP_REPORTTYPE.TEMPORARY,
              'Temporary report generated.',
            )
          },
        },
      })
    } else {
      generateReport(
        MEDICALCHECKUP_REPORTTYPE.TEMPORARY,
        'Temporary report generated.',
      )
    }
  }

  const genrateFinalReport = () => {
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: `Confirm to generate report (Finalized) ?`,
        onConfirmSave: () => {
          generateReport(
            MEDICALCHECKUP_REPORTTYPE.FINAL,
            'Final report generated.',
          )
        },
      },
    })
  }

  const checkUnsaveChange = onConfirm => {
    if (
      window.dirtyForms['SummaryCommentDetails'] ||
      window.dirtyForms['IndividualCommentDetails']
    ) {
      dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmContent: formatMessage({
            id: 'app.general.leave-without-save',
          }),
          onConfirmSave: onConfirm,
          openConfirmText: 'Confirm',
          onConfirmClose: () => {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                openConfirm: false,
              },
            })
          },
        },
      })
    } else {
      onConfirm()
    }
  }

  const isShowCompleteComment = () => {
    if (!getEditEnable()) return false
    if (user.data.clinicianProfile.userProfile.role?.clinicRoleFK === 1) {
      const currentDoctor = (
        medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemDoctor ||
        []
      ).find(
        item =>
          item.userProfileFK === user.data.clinicianProfile.userProfile.id,
      )
      if (
        currentDoctor &&
        currentDoctor.status !== REPORTINGDOCTOR_STATUS.COMMENTVERIFYING
      ) {
        return true
      }
    }
    return false
  }

  const onCompleteComment = () => {
    const currentDoctor = (
      medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemDoctor || []
    ).find(
      item => item.userProfileFK === user.data.clinicianProfile.userProfile.id,
    )
    dispatch({
      type: 'medicalCheckupReportingDetails/markCommentAsDone',
      payload: {
        ...currentDoctor,
        status: REPORTINGDOCTOR_STATUS.COMMENTVERIFYING,
      },
    }).then(r => {
      if (r) {
        notification.success({ message: 'Reporting comment completed.' })
        onClose()
      }
    })
  }

  const isEditVisitEnable = () => {
    if (reportingStatus === MEDICALCHECKUP_WORKITEM_STATUS.COMPLETED)
      return false

    const editVisitAccessRight = Authorized.check(
      'medicalcheckupworklist.editvisit',
    ) || {
      rights: 'hidden',
    }
    if (editVisitAccessRight.rights !== 'enable') return false

    return true
  }

  const isShowUnlockReport = () => {
    if (reportingStatus !== MEDICALCHECKUP_WORKITEM_STATUS.COMPLETED)
      return false
    const unlockReportAccessRight = Authorized.check(
      'medicalcheckupworklist.unlockreport',
    ) || {
      rights: 'hidden',
    }
    if (unlockReportAccessRight.rights !== 'enable') return false
    return true
  }

  const isModifyCommentEnable = () => {
    const modifyCommentAccessRight = Authorized.check(
      'medicalcheckupworklist.modifycomment',
    ) || {
      rights: 'hidden',
    }
    if (modifyCommentAccessRight.rights === 'enable') return true
    return false
  }

  const isModifyOthersCommentEnable = () => {
    const modifyOthersCommentAccessRight = Authorized.check(
      'medicalcheckupworklist.modifyotherscomment',
    ) || {
      rights: 'hidden',
    }
    if (modifyOthersCommentAccessRight.rights === 'enable') return true
    return false
  }
  return (
    <div>
      <div style={{ marginTop: '-20px' }}>
        <Banner
          from='MedicalCheckup'
          patientInfo={patient}
          editingOrder={false}
          activePreOrderItems={[]}
          isRetail={false}
          isEditVisitEnable={isEditVisitEnable()}
        />
      </div>
      <SizeContainer size='sm'>
        <div
          style={{
            border: '1px solid #CCCCCC',
            backgroundColor: 'white',
          }}
        >
          <GridContainer style={{ height: contentHeight }}>
            <GridItem md={7} style={{ padding: 0 }}>
              <TestResult
                {...props}
                height={contentHeight}
                selectedLanguage={selectedLanguage}
                querySummaryCommentHistory={querySummaryCommentHistory}
                queryIndividualCommentHistory={queryIndividualCommentHistory}
                refreshMedicalCheckup={refreshMedicalCheckup}
                setShowResultDetails={onShowShowResultDetails}
                isEditEnable={getEditEnable()}
                isModifyCommentEnable={isModifyCommentEnable()}
                isModifyOthersCommentEnable={isModifyOthersCommentEnable()}
                genderFK={patient?.genderFK}
              />
            </GridItem>
            <GridItem md={5} style={{ padding: 0 }}>
              <SummaryComment
                {...props}
                height={contentHeight}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                querySummaryCommentHistory={querySummaryCommentHistory}
                queryIndividualCommentHistory={queryIndividualCommentHistory}
                refreshMedicalCheckup={refreshMedicalCheckup}
                clearEditComment={clearEditComment}
                isEditEnable={getEditEnable()}
                isModifyCommentEnable={isModifyCommentEnable()}
                isModifyOthersCommentEnable={isModifyOthersCommentEnable()}
              />
            </GridItem>
          </GridContainer>
          <div
            style={{
              position: 'relative',
              padding: '0px 8px',
              margin: '10px 0px',
            }}
          >
            <Link>
              <span
                style={{
                  textDecoration: 'underline',
                }}
                onClick={e => {
                  e.preventDefault()
                  toggleReportHistory()
                }}
              >
                {`Report History (${medicalCheckupReportingDetails.entity
                  ?.medicalCheckupReport?.length || 0})`}
              </span>
            </Link>
            <div style={{ position: 'absolute', right: 3, top: 0 }}>
              <Button
                size='small'
                type='danger'
                style={{ margin: '0px 5px' }}
                onClick={onClose}
              >
                Close
              </Button>
              {isShowCompleteComment() && (
                <Button
                  size='small'
                  style={{
                    margin: '0px 5px',
                    backgroundColor: '#389e0d',
                    color: 'white',
                  }}
                  onClick={onCompleteComment}
                >
                  Complete Comment
                </Button>
              )}
              {isShowGenerateTemporaryReport() && (
                <Button
                  size='small'
                  type='primary'
                  style={{ margin: '0px 5px' }}
                  onClick={() => checkUnsaveChange(genrateTemporaryReport)}
                >
                  Generate Temporary Report
                </Button>
              )}
              {isShowGenerateFinalReport() && (
                <Button
                  size='small'
                  type='primary'
                  style={{ margin: '0px 5px' }}
                  onClick={() => checkUnsaveChange(genrateFinalReport)}
                >
                  Generate Report
                </Button>
              )}
              {isShowUnlockReport() && (
                <Button
                  size='small'
                  style={{
                    margin: '0px 5px',
                    backgroundColor: '#389e0d',
                    color: 'white',
                  }}
                  onClick={onUnlock}
                >
                  Unlock
                </Button>
              )}
            </div>
          </div>
        </div>
      </SizeContainer>

      <Drawer
        placement={placement}
        width='40%'
        getContainer={false}
        bodyStyle={{
          padding: '0px 6px',
        }}
        title='Result Details'
        visible={showResultDetails}
        onClose={() => setShowResultDetails(false)}
        mask={false}
      >
        <div style={{ height: '100%', paddingBottom: 40 }}>
          <ResultDetails
            showResultDetails={showResultDetails}
            visitId={medicalCheckupReportingDetails.visitID}
          />
          <div style={{ textAlign: 'right', position: 'absolute', bottom: 10 }}>
            {placement === 'right' && (
              <Tooltip title='Move to left'>
                <Button
                  type='primary'
                  size='small'
                  style={{
                    margin: '0px 5px',
                    position: 'relative',
                    top: -1,
                    width: 55,
                  }}
                  icon={<DoubleLeftOutlined />}
                  onClick={changePlacement}
                ></Button>
              </Tooltip>
            )}
            <Button
              size='small'
              type='danger'
              style={{ margin: '0px 5px' }}
              onClick={() => setShowResultDetails(false)}
            >
              Close
            </Button>
            {placement === 'left' && (
              <Tooltip title='Move to right'>
                <Button
                  type='primary'
                  size='small'
                  style={{
                    margin: '0px 5px',
                    position: 'relative',
                    top: -1,
                    width: 55,
                  }}
                  icon={<DoubleRightOutlined />}
                  onClick={changePlacement}
                ></Button>
              </Tooltip>
            )}
          </div>
        </div>
      </Drawer>
      <CommonModal
        open={showReportHistory}
        title='Report History'
        onClose={toggleReportHistory}
        onConfirm={toggleReportHistory}
        maxWidth='lg'
        observe='ReportHistory'
      >
        <ReportHistory refreshMedicalCheckup={refreshMedicalCheckup} />
      </CommonModal>
    </div>
  )
}

export default compose(
  withStyles(styles),
  connect(
    ({
      patient,
      loading,
      medicalCheckupReportingDetails,
      user,
      labTrackingDetails,
      clinicSettings,
      visitRegistration,
    }) => ({
      patient: patient.entity || {},
      loading,
      medicalCheckupReportingDetails,
      labTrackingDetails,
      user,
      clinicSettings,
      visitRegistration,
    }),
  ),
)(ReportingDetails)
