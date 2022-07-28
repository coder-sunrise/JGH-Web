import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'dva'
import moment from 'moment'
import _ from 'lodash'
import { history } from 'umi'
import { Menu, Dropdown, Space, Typography, Card, Tag } from 'antd'
import {
  MEDICALCHECKUP_WORKITEM_STATUS,
  MEDICALCHECKUP_WORKITEM_STATUSES,
  FORM_CATEGORY,
  DISPENSE_FROM,
  VISIT_TYPE,
  WORK_ITEM_TYPES,
  MEDICALCHECKUP_REPORTTYPE,
  MEDICALCHECKUP_REPORTSTATUS,
} from '@/utils/constants'
import NurseWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/NurseWorkItemInfo'
import RadioWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/RadioWorkItemInfo'
import LabWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/LabWorkItemInfo'
import LabTrackingItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/LabTrackingItemInfo'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import {
  CommonModal,
  dateFormatLongWithTimeNoSec,
  Icon,
  Button,
  Popover,
  dateFormatLong,
  Tooltip,
  notification,
} from '@/components'
import { ProTable } from '@medisys/component'
import { GridContextMenuButton as GridButton } from 'medisys-components'
import MoreVert from '@material-ui/icons/MoreVert'
import Description from '@material-ui/icons/Description'
import FindInPage from '@material-ui/icons/FindInPage'
import VisitForms from '@/pages/Reception/Queue/VisitForms'
import FormatListBulletedOutlinedIcon from '@material-ui/icons/FormatListBulletedOutlined'
import ListAltOutlinedIcon from '@material-ui/icons/ListAltOutlined'
import AssignmentOutlined from '@material-ui/icons/AssignmentOutlined'
import { commonDataReaderTransform } from '@/utils/utils'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { CheckCircleOutlined } from '@ant-design/icons'
import WorklistContext from '../WorklistContext'
import { StatusFilter } from './StatusFilter'
import ReportingDoctorList from './ReportingDoctorList'
import {
  getMedicalCheckupReportPayload,
  getVisitOrderTemplateContent,
} from './Util'
import VisitOrderTemplateIndicateString from '@/pages/Widgets/Orders/VisitOrderTemplateIndicateString'

const allMedicalCheckupReportStatuses = Object.values(
  MEDICALCHECKUP_WORKITEM_STATUS,
)

const saveColumnsSetting = (dispatch, columnsSetting) => {
  dispatch({
    type: 'medicalCheckupWorklist/saveUserPreference',
    payload: {
      userPreferenceDetails: {
        value: columnsSetting,
        Identifier: 'MedicalCheckupWorklistColumnSetting',
      },
      itemIdentifier: 'MedicalCheckupWorklistColumnSetting',
      type: '4',
    },
  }).then(result => {
    dispatch({
      type: 'medicalCheckupWorklist/updateState',
      payload: {
        medicalCheckupWorklistColumnSetting: columnsSetting,
      },
    })
  })
}

const WorklistGrid = ({
  medicalCheckupWorklist,
  user,
  handlePreviewReport,
  height,
}) => {
  const {
    list: originalWorklist = [],
    medicalCheckupWorklistColumnSetting = [],
    showReportingForm,
  } = medicalCheckupWorklist
  const dispatch = useDispatch()
  const [filteredStatuses, setFilteredStatuses] = useState(
    allMedicalCheckupReportStatuses,
  )
  const [workitems, setWorkitems] = useState([])
  const [showForms, setShowForms] = useState(false)
  const { setIsAnyWorklistModelOpened } = useContext(WorklistContext)
  useEffect(() => {
    if (originalWorklist) {
      const currentFilteredWorklist = originalWorklist.filter(item =>
        filteredStatuses.includes(item.statusFK),
      )
      setWorkitems(currentFilteredWorklist)
    }
  }, [originalWorklist, filteredStatuses])

  const toggleForms = () => {
    const target = !showForms
    setShowForms(target)
    setIsAnyWorklistModelOpened(target)
    if (!target) {
      dispatch({
        type: 'formListing/updateState',
        payload: {
          list: [],
        },
      })
    }
  }

  const showVisitForms = async row => {
    const {
      visitFK,
      patientAccountNo,
      patientName,
      medicalCheckupWorkitemDoctor,
      patientGender,
      patientReferenceNo,
      patientDOB,
      doctorProfileFK,
    } = row
    const primaryDoctor = (medicalCheckupWorkitemDoctor || []).find(
      x => x.isPrimaryDoctor,
    )
    const title =
      primaryDoctor?.title && primaryDoctor.title !== 'Other'
        ? `${primaryDoctor.title} `
        : ''
    await dispatch({
      type: 'formListing/updateState',
      payload: {
        visitID: visitFK,
        visitDetail: {
          visitID: visitFK,
          doctorProfileFK: doctorProfileFK,
          patientName,
          doctorName: primaryDoctor ? `${title}${primaryDoctor.name}` : '',
          patientAccountNo,
          patientGender: patientGender,
          patientDOB: patientDOB,
          patientAge: patientDOB ? calculateAgeFromDOB(patientDOB) : 0,
          patientRefNo: patientReferenceNo,
          todayDate: moment().toDate(),
        },
      },
    })
    toggleForms()
  }

  const showReportingDetails = async row => {
    setIsAnyWorklistModelOpened(true)
    dispatch({
      type: 'medicalCheckupWorklist/generateAutoComment',
      payload: { id: row.id },
    }).then(() => {
      const version = Date.now()
      history.push(
        `/medicalcheckup/worklist/reportingdetails?mcid=${row.id}&qid=${row.queueId}&vid=${row.visitFK}&pid=${row.patientProfileFK}&v=${version}`,
      )
    })
  }

  const viewReport = async row => {
    dispatch({
      type: 'medicalCheckupWorklist/queryLastReportData',
      payload: {
        id: row.id,
      },
    }).then(response => {
      if (response && response.status === '200') {
        const payload = getMedicalCheckupReportPayload(response.data)
        handlePreviewReport(JSON.stringify(payload))
      }
    })
  }

  const handleMenuItemClick = (row, id) => {
    switch (id) {
      case '1':
        showVisitForms(row)
        break
      case '2':
        const version = Date.now()
        dispatch({
          type: `dispense/start`,
          payload: {
            id: row.visitFK,
            version,
            qid: row.queueId,
            queueNo: row.queueNo,
            isFromMedicalCheckupWorklist: true,
          },
        }).then(o => {
          if (o) {
            setIsAnyWorklistModelOpened(true)
            dispatch({
              type: `dispense/updateState`,
              payload: {
                openFrom: DISPENSE_FROM.MEDICALCHECKUP,
              },
            })
            history.push(
              `/medicalcheckup/worklist/orderdetails?isInitialLoading=${false}&qid=${
                row.queueId
              }&vid=${row.visitFK}&v=${version}&pid=${row.patientProfileFK}`,
            )
          }
        })
        break
      case '3':
        showReportingDetails(row)
        break
      case '4':
        viewReport(row)
        break
    }
  }
  const menus = [
    {
      id: 1,
      label: 'Forms',
      Icon: Description,
      authority: 'queue.consultation.form',
    },
    {
      id: 2,
      label: 'Order Details',
      Icon: ListAltOutlinedIcon,
    },
    {
      id: 3,
      label: 'Reporting Details',
      Icon: AssignmentOutlined,
    },
    {
      id: 4,
      label: 'View Reports',
      Icon: FindInPage,
    },
  ]

  const renderWorkitemStatus = row => {
    const status = MEDICALCHECKUP_WORKITEM_STATUSES.find(
      x => x.id === row.statusFK,
    )
    const statusColor = status.color
    const statusName = status.label

    let isShowTag
    let tagBGColor
    if (
      (row.statusFK === MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS ||
        row.statusFK === MEDICALCHECKUP_WORKITEM_STATUS.REPORTING) &&
      (row.lastReportStatus === MEDICALCHECKUP_REPORTSTATUS.PENDINGVERIFY ||
        row.lastReportStatus === MEDICALCHECKUP_REPORTSTATUS.VERIFIED)
    ) {
      isShowTag = true
      tagBGColor =
        row.lastReportStatus === MEDICALCHECKUP_REPORTSTATUS.VERIFIED
          ? '#007D00'
          : '#44A2FF'
    }
    return (
      <div style={{ position: 'relative' }}>
        <Tag
          color={statusColor}
          style={{
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: 2,
          }}
        >
          {statusName}
        </Tag>
        {isShowTag && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: tagBGColor,
              height: 14,
              fontSize: '0.55rem',
              padding: '0px 3px',
              color: 'white',
              borderRadius: 2,
              border: '1px solid #ccc',
            }}
          >
            Temp.
          </div>
        )}
      </div>
    )
  }

  const onRowDoubleClick = row => {
    const isDoctor =
      user.data.clinicianProfile.userProfile.role?.clinicRoleFK === 1
    if (
      isDoctor &&
      !(row.medicalCheckupWorkitemDoctor || []).find(
        x => x.userProfileFK === user.data.clinicianProfile.userProfile.id,
      )
    ) {
      notification.warn({
        message:
          "Please make sure you are the primary/reporting doctor to view this patient's worklist.",
      })
      return
    }
    showReportingDetails(row)
  }

  const defaultColumns = () => {
    return [
      {
        key: 'statusFK',
        title: 'Status',
        dataIndex: 'statusFK',
        sorter: false,
        search: false,
        align: 'center',
        fixed: 'left',
        width: 110,
        render: (item, entity) => {
          return renderWorkitemStatus(entity)
        },
      },
      {
        key: 'patientReferenceNo',
        title: 'Ref. No.',
        dataIndex: 'patientReferenceNo',
        sorter: false,
        search: false,
        fixed: 'left',
        width: 100,
      },
      {
        key: 'patientAccountNo',
        title: 'Acc. No.',
        dataIndex: 'patientAccountNo',
        sorter: false,
        search: false,
        fixed: 'left',
        width: 100,
      },
      {
        key: 'patientName',
        title: 'Patient Name',
        dataIndex: 'patientName',
        sorter: false,
        search: false,
        fixed: 'left',
        width: 200,
      },
      {
        key: 'genderAge',
        title: 'Gender/Age',
        dataIndex: 'genderAge',
        sorter: false,
        search: false,
        render: (_dom, entity) =>
          `${entity.patientGender?.substring(0, 1)}/${Math.floor(
            entity.patientDOB?.toDate()?.duration('year'),
          )}`,
        width: 100,
      },
      {
        key: 'reportPriority',
        title: 'Priority',
        dataIndex: 'reportPriority',
        sorter: false,
        search: false,
        width: 200,
        render: (_dom, entity) => {
          const remarks = `${entity.reportPriority}${
            entity.urgentReportRemarks ? `, ${entity.urgentReportRemarks}` : ''
          }`
          return (
            <Tooltip title={remarks}>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entity.reportPriority === 'Urgent' ? (
                  <span style={{ color: 'red' }}>{entity.reportPriority}</span>
                ) : (
                  <span>{entity.reportPriority}</span>
                )}
                {entity.urgentReportRemarks
                  ? `, ${entity.urgentReportRemarks}`
                  : ''}
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'visitOrderTemplateDetails',
        title: 'Visit Purpose',
        dataIndex: 'visitOrderTemplateDetails',
        sorter: false,
        search: false,
        width: 200,
        render: (_dom, entity) => {
          const visitOrderTemplateContent = getVisitOrderTemplateContent(
            entity.visitOrderTemplateDetails,
          )
          return (
            <Tooltip title={visitOrderTemplateContent}>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {visitOrderTemplateContent || '-'}
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'visitDate',
        title: 'Visit Date',
        dataIndex: 'visitDate',
        sorter: false,
        search: false,
        width: 140,
        render: (_dom, entity) =>
          entity.visitDate?.format(dateFormatLongWithTimeNoSec) || '-',
      },
      {
        key: 'workItem',
        title: 'Work Item',
        dataIndex: 'workItem',
        sorter: false,
        search: false,
        width: 180,
        render: (item, entity) => {
          const dispatch = useDispatch()
          const workItemSummary = JSON.parse(entity.workItemSummary || '[]')
          const radioWorkItems =
            workItemSummary.find(t => t.type === WORK_ITEM_TYPES.RADIOLOGY) ||
            []
          const labWorkItems =
            workItemSummary.find(t => t.type === WORK_ITEM_TYPES.LAB) || []
          const nurseWorkItems =
            workItemSummary.find(
              t => t.type === WORK_ITEM_TYPES.NURSEACTUALIZE,
            ) || []
          const labTrackingItems =
            workItemSummary.find(
              t => t.type === WORK_ITEM_TYPES.LAB_TRACKING,
            ) || []

          return (
            <div style={{ justifyContent: 'space-between' }}>
              {labWorkItems && labWorkItems.totalWorkItem > 0 && (
                <LabWorkItemInfo
                  visitFK={entity.visitFK}
                  workItemSummary={labWorkItems}
                />
              )}
              {radioWorkItems && radioWorkItems.totalWorkItem > 0 && (
                <RadioWorkItemInfo
                  visitFK={entity.visitFK}
                  workItemSummary={radioWorkItems}
                />
              )}
              {nurseWorkItems && nurseWorkItems.totalWorkItem > 0 && (
                <NurseWorkItemInfo
                  visitFK={entity.visitFK}
                  workItemSummary={nurseWorkItems}
                />
              )}
              {labTrackingItems && labTrackingItems.totalWorkItem > 0 && (
                <LabTrackingItemInfo
                  visitFK={entity.visitFK}
                  workItemSummary={labTrackingItems}
                />
              )}
            </div>
          )
        },
      },
      {
        key: 'medicalCheckupWorkitemDoctor',
        title: 'Doctor',
        dataIndex: 'medicalCheckupWorkitemDoctor',
        sorter: false,
        search: false,
        width: 280,
        render: (item, entity) => {
          return (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <ReportingDoctorList
                medicalCheckupDoctor={entity.medicalCheckupWorkitemDoctor}
              />
            </div>
          )
        },
      },
      {
        key: 'visitRemarks',
        title: 'Visit Remarks',
        dataIndex: 'visitRemarks',
        sorter: false,
        search: false,
        width: 250,
        render: (_dom, entity) => {
          return (
            <Tooltip title={entity.visitRemarks}>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entity.visitRemarks || '-'}
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'days',
        title: 'Days',
        dataIndex: 'days',
        sorter: (a, b) => a.days - b.days,
        search: false,
        width: 60,
      },
      {
        key: 'action',
        title: 'Action',
        dataIndex: 'action',
        align: 'center',
        sorter: false,
        search: false,
        fixed: 'right',
        width: 60,
        render: (item, entity) => {
          const isDoctor =
            user.data.clinicianProfile.userProfile.role?.clinicRoleFK === 1
          if (
            isDoctor &&
            !(entity.medicalCheckupWorkitemDoctor || []).find(
              x =>
                x.userProfileFK === user.data.clinicianProfile.userProfile.id,
            )
          ) {
            return ''
          }

          const handleClick = event => {
            const { key } = event
            clickMenu(entity, key)
          }
          return (
            <Tooltip title='More Options'>
              <div>
                <GridButton
                  row={entity}
                  contextMenuOptions={menus.filter(
                    m => entity.isExistsVerifiedReport || m.id !== 4,
                  )}
                  onClick={handleMenuItemClick}
                />
              </div>
            </Tooltip>
          )
        },
      },
    ]
  }
  const columns = defaultColumns()
  const tableHeight = height - 50
  return (
    <div style={{ backgroundColor: 'white', paddingTop: 12, marginTop: 2 }}>
      <div style={{ textAlign: 'right' }}>
        <StatusFilter
          defaultSelection={allMedicalCheckupReportStatuses}
          counts={(originalWorklist || []).map(items => {
            return {
              status: items.statusFK,
              count: 1,
            }
          })}
          style={{
            flexGrow: 1,
            justifyContent: 'end',
            marginBottom: 4,
          }}
          onFilterChange={selected => setFilteredStatuses(selected)}
        />
      </div>
      <div style={{ height: tableHeight }}>
        <ProTable
          rowSelection={false}
          columns={columns}
          tableClassName='custom_pro'
          search={false}
          options={{ density: false, reload: false }}
          dataSource={workitems}
          pagination={false}
          columnsStateMap={medicalCheckupWorklistColumnSetting}
          onColumnsStateChange={map => saveColumnsSetting(dispatch, map)}
          defaultColumns={[]}
          onRow={row => {
            return {
              onDoubleClick: () => {
                onRowDoubleClick(row)
              },
            }
          }}
          scroll={{ x: 1100, y: tableHeight - 95 }}
        />
      </div>
      <div style={{ textAlign: 'right', marginRight: 100 }}>
        <span
          style={{
            display: 'inline-block',
            height: 18,
            width: 18,
            border: `1px solid #354497`,
          }}
        />
        <span
          style={{
            display: 'inline-block',
            marginRight: 8,
            position: 'relative',
            top: '-4px',
            marginLeft: 2,
          }}
        >
          Reporting In Progress
        </span>
        <span
          style={{
            display: 'inline-block',
            height: 18,
            width: 18,
            border: `1px solid #008B00`,
          }}
        />
        <span
          style={{
            display: 'inline-block',
            marginRight: 8,
            position: 'relative',
            top: '-4px',
            marginLeft: 2,
          }}
        >
          Comment Verifying By PRO
        </span>
        <span
          style={{
            color: '#008B00',
            display: 'inline-block',
            height: 18,
            width: 18,
            border: `1px solid #008B00`,
            position: 'relative',
            top: 0,
          }}
        >
          <CheckCircleOutlined
            style={{
              position: 'absolute',
              top: 1,
              left: 1,
            }}
          />
        </span>
        <span
          style={{
            display: 'inline-block',
            marginRight: 8,
            position: 'relative',
            top: '-4px',
            marginLeft: 2,
          }}
        >
          Comment Verified By PRO
        </span>
      </div>
      <CommonModal
        open={showForms}
        title='Forms'
        onClose={toggleForms}
        onConfirm={toggleForms}
        maxWidth='md'
        overrideLoading
      >
        <VisitForms formCategory={FORM_CATEGORY.CORFORM} />
      </CommonModal>
    </div>
  )
}

export default withWebSocket()(WorklistGrid)
