import React, { useState, useEffect } from 'react'
import { Link, formatMessage } from 'umi'
import { useDispatch } from 'dva'
import moment from 'moment'
import {
  CodeSelect,
  GridContainer,
  GridItem,
  IconButton,
  CommonModal,
  Tabs,
  Switch,
  dateFormatLong,
  Tooltip,
  Popconfirm,
  notification,
  DragableTableGrid,
  SizeContainer,
} from '@/components'
import { Badge, Button, Table } from 'antd'
import { TranslateOutlined } from '@material-ui/icons'
import { Divider } from '@material-ui/core'
import { DeleteFilled, EditFilled, CopyOutlined } from '@ant-design/icons'
import Authorized from '@/utils/Authorized'
import customtyles from '../../Style.less'
import CommentDetails from './SummaryCommentDetails'
import CommentVerification from '../CommentVerification'
import ReportingDoctorTag from '../../ReportingDoctorList'
import { mergeClasses } from '@material-ui/styles'
import { REPORTINGDOCTOR_STATUS } from '@/utils/constants'
import { ListBoxComponent } from '@syncfusion/ej2-react-dropdowns'

const SummaryComment = props => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    height,
    medicalCheckupReportingDetails,
    querySummaryCommentHistory,
    queryIndividualCommentHistory,
    refreshMedicalCheckup,
    clearEditComment,
    user,
    isEditEnable = true,
    isModifyCommentEnable,
    isModifyOthersCommentEnable,
  } = props
  const [showVerification, setShowVerification] = useState(false)
  const [commentOption, setCommentOption] = useState([])
  const dispatch = useDispatch()
  const isDoctor =
    user.data.clinicianProfile.userProfile.role?.clinicRoleFK === 1

  useEffect(() => {
    if (
      medicalCheckupReportingDetails.patientID &&
      medicalCheckupReportingDetails.visitID
    ) {
      querySummaryCommentHistory()
    }
  }, [
    medicalCheckupReportingDetails.visitID,
    medicalCheckupReportingDetails.patientID,
  ])

  useEffect(() => {
    if (selectedLanguage) {
      setData(medicalCheckupReportingDetails.summaryCommentList)
    }
  }, [
    selectedLanguage,
    medicalCheckupReportingDetails.summaryCommentList,
    medicalCheckupReportingDetails.summaryCommentEntity,
    isEditEnable,
    medicalCheckupReportingDetails.entity,
  ])

  const onConfirm = () => {
    clearEditComment()
    toggleCommentVerification()
  }

  const showCommentVerification = e => {
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
  const toggleCommentVerification = () => {
    const target = !showVerification
    setShowVerification(target)
  }

  const confirmCommentVerification = () => {
    querySummaryCommentHistory()
    queryIndividualCommentHistory()
    refreshMedicalCheckup()
    toggleCommentVerification()
  }

  const editComment = row => {
    if (document.activeElement) {
      document.activeElement.blur()
    }
    dispatch({
      type: 'medicalCheckupReportingDetails/updateState',
      payload: {
        summaryCommentEntity: { ...row },
      },
    })
  }

  const deleteComment = row => {
    dispatch({
      type: 'medicalCheckupReportingDetails/deleteSummaryComment',
      payload: {
        id: row.id,
      },
    }).then(r => {
      if (r) {
        dispatch({
          type: 'medicalCheckupReportingDetails/querySummaryCommentHistory',
          payload: {
            apiCriteria: {
              patientProfileFK: row.patientProfileFK,
              visitFK: row.visitFK,
            },
          },
        })
        dispatch({
          type: 'medicalCheckupReportingDetails/query',
          payload: {
            id: row.medicalCheckupWorkitemFK,
          },
        })
        dispatch({
          type: 'medicalCheckupReportingDetails/updateState',
          payload: {
            summaryCommentEntity: undefined,
          },
        })
      }
    })
  }

  const getDisplayValue = row => {
    const showValue =
      row[
        `${selectedLanguage === 'EN' ? 'englishComment' : 'japaneseComment'}`
      ] || '-'
    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
        }}
      >
        {showValue}
      </div>
    )
  }

  const onDropGroup = e => {
    if (e.previousIndex === e.currentIndex) {
      return
    }

    const newSummaryComment = e.source.currentData.map((x, index) => ({
      ...x,
      sequence: index,
    }))

    const {
      medicalCheckupIndividualComment,
      medicalCheckupSummaryComment,
      medicalCheckupWorkitemDoctor,
      medicalCheckupReport,
      ...resetValue
    } = medicalCheckupReportingDetails.entity
    dispatch({
      type: 'medicalCheckupReportingDetails/upsert',
      payload: {
        ...resetValue,
        medicalCheckupSummaryComment: newSummaryComment,
      },
    }).then(r => {
      querySummaryCommentHistory()
      refreshMedicalCheckup()
    })
  }

  const actions = row => {
    if (row.commentByUserFK === user.data.clinicianProfile.userProfile.id) {
      if (!isModifyCommentEnable) return ''
    } else {
      if (!isModifyOthersCommentEnable) return ''
    }
    return (
      <div style={{ position: 'absolute', right: 4, top: 4 }}>
        <Tooltip title='Edit Summary Comment'>
          <Button
            size='small'
            type='primary'
            style={{ marginRight: 5 }}
            icon={<EditFilled />}
            onClick={() => editComment(row)}
          ></Button>
        </Tooltip>
        <Popconfirm
          title='Are you sure?'
          onConfirm={() => {
            deleteComment(row)
          }}
        >
          <Tooltip title='Delete Summary Comment'>
            <Button
              size='small'
              type='danger'
              style={{ marginRight: 5 }}
              icon={<DeleteFilled />}
            ></Button>
          </Tooltip>
        </Popconfirm>
      </div>
    )
  }

  const setData = queryData => {
    const { classes } = props
    const data = _.orderBy(queryData, ['visitDate'], ['desc'])
    let options = []
    const isEditingRow = _.isObject(
      medicalCheckupReportingDetails.summaryCommentEntity,
    )
    data.forEach((item, index) => {
      const commentList = (item.medicalCheckupSummaryComment || []).map(x => ({
        ...x,
        visitFK: medicalCheckupReportingDetails.visitID,
        patientProfileFK: medicalCheckupReportingDetails.patientID,
        currentMedicalCheckupWorkitemId:
          medicalCheckupReportingDetails.medicalCheckupWorkitemId,
      }))
      if (index === 0) {
        let itemTemplate
        if (selectedLanguage === 'EN') {
          itemTemplate = row => {
            return (
              <div
                style={{
                  padding: '6px 70px 6px 10px',
                  position: 'relative',
                }}
              >
                {getDisplayValue(row)}
                {actions(row)}
              </div>
            )
          }
        } else {
          itemTemplate = row => {
            return (
              <div
                style={{
                  padding: '6px 70px 6px 10px',
                  position: 'relative',
                }}
              >
                {getDisplayValue(row)}
                {actions(row)}
              </div>
            )
          }
        }
        options.push({
          id: index,
          name: moment(item.visitDate).format(dateFormatLong),
          content: (
            <ListBoxComponent
              enabled={isEditEnable && !isEditingRow}
              dataSource={commentList}
              allowDragAndDrop={true}
              scope='combined-list'
              fields={{ text: 'id' }}
              selectionSettings={{ mode: 'Single' }}
              itemTemplate={itemTemplate}
              drop={onDropGroup}
            />
          ),
        })
      } else {
        options.push({
          id: index,
          name: moment(item.visitDate).format(dateFormatLong),
          content: (
            <div
              style={{
                border: '1px solid #dee2e6',
              }}
            >
              {commentList.map(row => {
                return (
                  <div
                    style={{
                      position: 'relative',
                      padding: '6px 6px 6px 10px',
                      borderBottom: '1px solid #dee2e6',
                    }}
                    className={classes.commentContainer}
                  >
                    {getDisplayValue(row)}
                    <div style={{ position: 'absolute', right: 0, top: 4 }}>
                      {isEditEnable && isModifyCommentEnable ? (
                        <Tooltip title='Copy Comment'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => {
                              copyComment(row)
                            }}
                          >
                            <CopyOutlined />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ),
        })
      }
    })
    setCommentOption(options)
  }

  const onSaveComment = () => {
    querySummaryCommentHistory()
    refreshMedicalCheckup()
  }

  const copyComment = row => {
    dispatch({
      type: 'medicalCheckupReportingDetails/copyComment',
      payload: {
        medicalCheckupWorkitemFK: row.currentMedicalCheckupWorkitemId,
        sourceCommentFK: row.id,
        commentType: 'Summary',
      },
    }).then(r => {
      dispatch({
        type: 'medicalCheckupReportingDetails/querySummaryCommentHistory',
        payload: {
          apiCriteria: {
            patientProfileFK: row.patientProfileFK,
            visitFK: row.visitFK,
          },
        },
      })
      dispatch({
        type: 'medicalCheckupReportingDetails/query',
        payload: {
          id: row.currentMedicalCheckupWorkitemId,
        },
      })
    })
  }

  const activeReportingDoctors = () => {
    if (isDoctor) {
      return (
        medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemDoctor ||
        []
      ).filter(
        item =>
          item.userProfileFK === user.data.clinicianProfile.userProfile.id,
      )
    }
    return medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemDoctor
  }

  const updateReportingDoctor = (reportingDoctor, status) => {
    dispatch({
      type: 'medicalCheckupReportingDetails/updateReportingDoctor',
      payload: {
        ...reportingDoctor,
        status,
      },
    }).then(r => {
      if (r === 204) {
        notification.success({
          message:
            status === 'New'
              ? 'Reporting comment reverted to doctor.'
              : 'Comment Verified.',
        })
        refreshMedicalCheckup()
      }
    })
  }
  const getNonVerifyCount = () => {
    const {
      medicalCheckupIndividualComment = [],
      medicalCheckupSummaryComment = [],
    } = medicalCheckupReportingDetails.entity || {}

    return (
      medicalCheckupIndividualComment.filter(item => !item.isVerified).length +
      medicalCheckupSummaryComment.filter(item => !item.isVerified).length
    )
  }

  const isShowCommentVerification = () => {
    const commentVerificationAccessRight = Authorized.check(
      'medicalcheckupworklist.commentverification',
    ) || {
      rights: 'hidden',
    }
    if (commentVerificationAccessRight.rights !== 'hidden') return true
    return false
  }

  return (
    <div
      style={{
        border: '1px solid #CCCCCC',
        height,
      }}
    >
      <div
        style={{
          backgroundColor: '#CCCC',
          position: 'relative',
          padding: '8px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <span style={{ fontWeight: 'bold' }}>Summary Comment</span>
          {isShowCommentVerification() && (
            <Badge
              style={{
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
              size='small'
              onClick={showCommentVerification}
              count={getNonVerifyCount()}
            >
              <IconButton
                style={{
                  color: 'white',
                  backgroundColor: '#4255bd',
                  marginLeft: 8,
                }}
              >
                <TranslateOutlined style={{ width: 16, height: 16 }} />
              </IconButton>
            </Badge>
          )}
        </div>

        <div style={{ position: 'absolute', right: 0, top: 4 }}>
          <ReportingDoctorTag
            medicalCheckupDoctor={activeReportingDoctors()}
            isShowMessage
            isShowLabel
            label='Doctor(s):'
            updateReportingDoctor={updateReportingDoctor}
            isEditEnable={isEditEnable}
            medicalCheckupWorkitemId={medicalCheckupReportingDetails.entity?.id}
          />
        </div>
      </div>
      <Tabs
        options={commentOption}
        style={{ height: height - 230 }}
        tabBarStyle={{ paddingRight: 8, fontWeight: 'bold' }}
        tabBarExtraContent={
          <Switch
            checkedChildren='EN'
            checkedValue='EN'
            unCheckedChildren='JP'
            unCheckedValue='JP'
            label=''
            value={selectedLanguage}
            onChange={setSelectedLanguage}
          />
        }
      />
      <Divider style={{ marginTop: 4 }} />
      <div>
        <CommentDetails {...props} saveComment={onSaveComment} />
      </div>
      <CommonModal
        open={showVerification}
        title='Comment Verification'
        onClose={toggleCommentVerification}
        onConfirm={confirmCommentVerification}
        maxWidth='lg'
        observe='CommentVerification'
      >
        <CommentVerification />
      </CommonModal>
    </div>
  )
}
export default SummaryComment
