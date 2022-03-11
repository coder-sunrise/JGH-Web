import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { connect } from 'dva'
import { compose } from 'redux'
import moment from 'moment'
import { Button, Drawer } from 'antd'
import { Link, history } from 'umi'
import { withStyles, Divider } from '@material-ui/core'
import Banner from '@/pages/PatientDashboard/Banner'
import { LoadingWrapper } from '@/components/_medisys'
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
  } = props
  const reportingStatus = medicalCheckupReportingDetails.entity?.statusFK
  const { primaryPrintoutLanguage = 'EN' } = clinicSettings.settings
  const height = window.innerHeight
  const banner = document.getElementById('patientBanner')
  const contentHeight = (height || 0) - (banner?.offsetHeight || 0) - 92
  const [selectedLanguage, setSelectedLanguage] = useState(
    primaryPrintoutLanguage,
  )
  const [showReportHistory, setShowReportHistory] = useState(false)
  const [showResultDetails, setShowResultDetails] = useState(false)
  const [placement, setPlacement] = useState('right')
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
        refreshMedicalCheckup()
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

  const isEnableFinalReport = () => {
    const { medicalCheckupWorkitemDoctor = [] } =
      medicalCheckupReportingDetails.entity || {}
    if (
      reportingStatus === MEDICALCHECKUP_WORKITEM_STATUS.REPORTING &&
      medicalCheckupWorkitemDoctor.filter(
        x => x.status === REPORTINGDOCTOR_STATUS.VERIFIED,
      ).length === medicalCheckupWorkitemDoctor.length
    ) {
      return true
    }
    return false
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
  return (
    <div>
      <LoadingWrapper loading={loading.models.medicalCheckupReportingDetails}>
        <div style={{ marginTop: '-20px' }}>
          <Banner
            from='MedicalCheckup'
            patientInfo={patient}
            editingOrder={false}
            activePreOrderItems={[]}
            isRetail={false}
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
              <div
                style={{
                  width: 140,
                }}
              >
                <Link>
                  <span
                    style={{
                      display: 'block',
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
              </div>
              <div style={{ position: 'absolute', right: 3, top: 0 }}>
                <Button
                  size='small'
                  type='danger'
                  style={{ margin: '0px 5px' }}
                  onClick={onClose}
                >
                  Close
                </Button>
                {(reportingStatus ===
                  MEDICALCHECKUP_WORKITEM_STATUS.REPORTING ||
                  reportingStatus ===
                    MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS) && (
                  <Button
                    size='small'
                    type='primary'
                    style={{ margin: '0px 5px' }}
                    onClick={genrateTemporaryReport}
                  >
                    Generate Temporary Report
                  </Button>
                )}
                {isEnableFinalReport() && (
                  <Button
                    size='small'
                    type='primary'
                    style={{ margin: '0px 5px' }}
                    onClick={() => {
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
                    }}
                  >
                    Generate Report
                  </Button>
                )}
                {reportingStatus ===
                  MEDICALCHECKUP_WORKITEM_STATUS.COMPLETED && (
                  <Button
                    size='small'
                    style={{
                      margin: '0px 5px',
                      backgroundColor: '#5a9cde',
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
          style={{
            position: 'absolute',
            //top: banner?.offsetHeight,
            //height: contentHeight,
          }}
          closable={false}
          bodyStyle={{
            padding: '0px 6px',
          }}
          visible={showResultDetails}
          onClose={() => setShowResultDetails(false)}
          mask={false}
        >
          <div>
            <div style={{ position: 'relative', marginTop: 4 }}>
              <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                Result Details
              </div>
              <Button
                size='small'
                type='text'
                icon={<CloseOutlined style={{ color: '#cccccc' }} />}
                style={{ position: 'absolute', right: 0, top: 2 }}
                onClick={() => setShowResultDetails(false)}
              ></Button>
            </div>
            <Divider style={{ marginBottom: 4 }} />
            <ResultDetails height={height - 130} />
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              {placement === 'right' && (
                <Tooltip title='Show on Left'>
                  <Button
                    type='primary'
                    size='small'
                    style={{ margin: '0px 5px', width: 55 }}
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
                <Tooltip title='Show on Right'>
                  <Button
                    type='primary'
                    size='small'
                    style={{ margin: '0px 5px', width: 55 }}
                    icon={<DoubleRightOutlined />}
                    onClick={changePlacement}
                  ></Button>
                </Tooltip>
              )}
            </div>
          </div>
        </Drawer>
      </LoadingWrapper>
      <CommonModal
        open={showReportHistory}
        title='Report History'
        onClose={toggleReportHistory}
        onConfirm={toggleReportHistory}
        maxWidth='lg'
        observe='ReportHistory'
        overrideLoading
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
      clinicSettings,
    }) => ({
      patient: patient.entity || {},
      loading,
      medicalCheckupReportingDetails,
      user,
      clinicSettings,
    }),
  ),
)(ReportingDetails)
