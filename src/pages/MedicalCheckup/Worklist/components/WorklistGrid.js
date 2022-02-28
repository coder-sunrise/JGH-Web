import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'dva'
import moment from 'moment'
import _ from 'lodash'
import { history } from 'umi'
import { Menu, Dropdown, Space, Typography, Card, Tag, Tooltip } from 'antd'
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
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import {
  CommonModal,
  dateFormatLongWithTimeNoSec,
  Icon,
  Button,
  Popover,
} from '@/components'
import { ProTable } from '@medisys/component'
import { GridContextMenuButton as GridButton } from 'medisys-components'
import MoreVert from '@material-ui/icons/MoreVert'
import Description from '@material-ui/icons/Description'
import VisitForms from '@/pages/Reception/Queue/VisitForms'
import WorklistContext from '../WorklistContext'
import { StatusFilter } from './StatusFilter'
import ReportingDoctorList from './ReportingDoctorList'

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

export const WorklistGrid = ({ medicalCheckupWorklist, user }) => {
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
  const [showReportForm, setShowReportForm] = useState(false)
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
      visitStatus,
      doctor,
      patientAccountNo,
      patientName,
      patientGender,
      patientReferenceNo,
      patientDOB,
      doctorProfileFK,
    } = row
    await dispatch({
      type: 'formListing/updateState',
      payload: {
        visitID: visitFK,
        visitDetail: {
          visitID: visitFK,
          doctorProfileFK: doctorProfileFK,
          patientName,
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
    const version = Date.now()
    history.push(
      `/medicalcheckup/worklist/reportingdetails?mcid=${row.id}&qid=${row.queueId}&vid=${row.visitFK}&pid=${row.patientProfileFK}&v=${version}`,
    )
  }

  const toggleReportForm = () => {
    const target = !showReportForm
    setShowReportForm(target)
    setIsAnyWorklistModelOpened(target)
    if (!target) {
      dispatch({
        type: 'medicalCheckupWorklist/updateState',
        payload: {
          entity: undefined,
          id: undefined,
          visitFK: undefined,
          patientProfileFK: undefined,
        },
      })
    }
  }

  const showReportDetails = async row => {
    const { id, visitFK } = row
    await dispatch({
      type: 'medicalCheckupDetails/updateState',
      payload: {
        id,
        visitFK,
      },
    })
    toggleReportForm()
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
              `/reception/queue/dispense?isInitialLoading=${false}&qid=${
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
        showReportDetails(row)
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
    { id: 2, label: 'Order Details', Icon: Description },
    { id: 3, label: 'Reporting Details', Icon: Description },
    { id: 4, label: 'View Reports', Icon: Description },
  ]

  const renderWorkitemStatus = row => {
    const status = MEDICALCHECKUP_WORKITEM_STATUSES.find(
      x => x.id === row.statusFK,
    )
    const statusColor = status.color
    const statusName = status.label

    let subTitle
    if (
      row.statusFK === MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS ||
      row.statusFK === MEDICALCHECKUP_WORKITEM_STATUS.REPORTING
    ) {
      if (row.lastReportType) {
        subTitle = `(${
          row.lastReportType === MEDICALCHECKUP_REPORTTYPE.TEMPORARY
            ? 'Temp. Rpt.'
            : 'Final Rpt.'
        } ${
          row.lastReportStatus === MEDICALCHECKUP_REPORTSTATUS.VERIFIED
            ? 'Completed'
            : 'Verifying'
        })`
      }
    }
    return (
      <Tag
        style={{
          backgroundColor: statusColor,
          textAlign: 'center',
          color: 'white',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: 2,
        }}
      >
        {
          <div>
            <span>{statusName}</span>
            {subTitle && <div>{subTitle}</div>}
          </div>
        }
      </Tag>
    )
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
        width: 146,
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
          if (entity.reportPriority === 'Urgent') {
            return (
              <span>
                <Icon
                  type='thunder'
                  style={{ fontSize: 15, color: 'red', alignSelf: 'center' }}
                />
                <span>{entity.urgentReportRemarks}</span>
              </span>
            )
          }
          return ''
        },
      },
      {
        key: 'visitOrderTemplateName',
        title: 'Visit Purpose',
        dataIndex: 'visitOrderTemplateName',
        sorter: false,
        search: false,
        width: 200,
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
        width: 160,
        render: (item, entity) => {
          const dispatch = useDispatch()
          const workItemSummary = JSON.parse(entity.workItemSummary || '[]')
          const radioWorkItems =
            workItemSummary.find(t => t.type === WORK_ITEM_TYPES.RADIOLOGY) ||
            {}
          const labWorkItems =
            workItemSummary.find(t => t.type === WORK_ITEM_TYPES.LAB) || {}
          const nurseWorkItems =
            workItemSummary.find(
              t => t.type === WORK_ITEM_TYPES.NURSEACTUALIZE,
            ) || {}
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
            !entity.medicalCheckupWorkitemDoctor.find(
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
            <Tooltip title='More Actions'>
              <GridButton
                row={entity}
                contextMenuOptions={menus.filter(
                  m => entity.isExistsVerifiedReport || m.id !== 4,
                )}
                onClick={handleMenuItemClick}
              />
            </Tooltip>
          )
        },
      },
    ]
  }
  const columns = defaultColumns()
  const height = window.innerHeight - 350
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'start' }}>
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
            marginBottom: 10,
          }}
          onFilterChange={selected => setFilteredStatuses(selected)}
        />
      </div>
      <ProTable
        rowSelection={false}
        columns={columns}
        search={false}
        options={{ density: false, reload: false }}
        dataSource={workitems}
        pagination={false}
        columnsStateMap={medicalCheckupWorklistColumnSetting}
        onColumnsStateChange={map => saveColumnsSetting(dispatch, map)}
        defaultColumns={[]}
        scroll={{ x: 1100, y: height }}
      />
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

      <CommonModal
        open={showReportForm}
        title='View Report'
        onClose={toggleReportForm}
        onConfirm={toggleReportForm}
        fullScreen
        overrideLoading
      >
        <div>View Report</div>
      </CommonModal>
    </Card>
  )
}
