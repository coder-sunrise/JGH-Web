import React, { useContext, useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'dva'
import moment from 'moment'
import _ from 'lodash'
import { history, connect } from 'umi'
import { Card, Button } from 'antd'
import { GridContextMenuButton as GridButton } from 'medisys-components'
import { WORK_ITEM_TYPES } from '@/utils/constants'
import NurseWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/NurseWorkItemInfo'
import RadioWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/RadioWorkItemInfo'
import LabWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/LabWorkItemInfo'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import { UnorderedListOutlined } from '@ant-design/icons'
import UndoOutlinedIcon from '@material-ui/icons/UndoOutlined'
import AssignmentOutlined from '@material-ui/icons/AssignmentOutlined'
import {
  dateFormatLongWithTimeNoSec,
  Icon,
  TextField,
  Select,
  DatePicker,
  Tooltip,
  notification,
} from '@/components'
import { ProTable } from '@medisys/component'
import service from './services'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
import VisitOrderTemplateIndicateString from '@/pages/Widgets/Orders/VisitOrderTemplateIndicateString'
import { getVisitOrderTemplateContent } from '../Worklist/components/Util'
import { ableToViewByAuthority } from '@/utils/utils'
import { MEDICALCHECKUP_WORKITEM_STATUS } from '@/utils/constants'
import CombineVisitIcon from '@/pages/MedicalCheckup/Worklist/components/CombineVisitIcon'

const { queryList, query } = service
const api = {
  remove: null,
  create: null,
  update: null,
  queryList,
  query,
}

const saveColumnsSetting = (dispatch, columnsSetting) => {
  dispatch({
    type: 'medicalCheckupWorklistHistory/saveUserPreference',
    payload: {
      userPreferenceDetails: {
        value: columnsSetting,
        Identifier: 'MedicalCheckupWorklistHistoryColumnSetting',
      },
      itemIdentifier: 'MedicalCheckupWorklistHistoryColumnSetting',
      type: '4',
    },
  }).then(result => {
    dispatch({
      type: 'medicalCheckupWorklistHistory/updateState',
      payload: {
        medicalCheckupWorklistHistoryColumnSetting: columnsSetting,
      },
    })
  })
}

const History = ({
  medicalCheckupWorklistHistory,
  user,
  mainDivHeight = 700,
}) => {
  const {
    medicalCheckupWorklistHistoryColumnSetting = [],
  } = medicalCheckupWorklistHistory
  const dispatch = useDispatch()
  const actionRef = useRef()
  const { doctorprofile = [] } = useSelector(s => s.codetable)
  useEffect(() => {
    dispatch({
      force: true,
      type: 'codetable/fetchCodes',
      payload: {
        code: 'doctorprofile',
        filter: {
          'clinicianProfile.isActive': true,
        },
      },
    })
  }, [])

  const showReportingDetails = row => {
    const version = Date.now()
    history.push(
      `/medicalcheckup/history/reportingdetails?mcid=${row.id}&qid=${row.queueId}&vid=${row.visitFK}&pid=${row.patientProfileFK}&v=${version}`,
    )
  }

  const visitDateForm = moment()
    .add(-1, 'month')
    .add(1, 'day')
    .toDate()
  const visitDateTo = moment()

  const menus = [
    {
      id: 1,
      label: 'Reporting Details',
      Icon: AssignmentOutlined,
    },
    {
      id: 2,
      label: 'Revert Reporting',
      Icon: UndoOutlinedIcon,
      authority: 'medicalcheckupworklist.revert',
    },
  ]

  const onCompleteMC = row => {
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmTitle: 'Revert Reporting',
        openConfirmContent: `Confirm to revert this reporting?`,
        onConfirmSave: () => {
          dispatch({
            type: `medicalCheckupWorklistHistory/revert`,
            payload: {
              id: row.id,
            },
          }).then(o => {
            if (o) {
              notification.success({
                message: 'Medical Checkup report reverted.',
              })
            }
            actionRef.current.reload()
          })
        },
      },
    })
  }

  const handleMenuItemClick = (row, id) => {
    switch (id) {
      case '1':
        showReportingDetails(row)
        break
      case '2':
        onCompleteMC(row)
        break
    }
  }

  const defaultColumns = () => {
    return [
      {
        key: 'reportId',
        title: 'Report ID',
        dataIndex: 'reportId',
        sorter: false,
        search: false,
        fixed: 'left',
        width: 115,
        render: (_dom, entity) => {
          return (
            <span>
              <span>{entity.reportId}</span>
              {entity.combineReportGroupFK > 0 && (
                <span style={{ marginLeft: 4 }}>
                  <CombineVisitIcon
                    placement='bottom'
                    combineReportGroupFK={entity.combineReportGroupFK}
                  />
                </span>
              )}
            </span>
          )
        },
      },
      {
        key: 'patientName',
        title: 'Patient Name',
        dataIndex: 'patientName',
        sorter: true,
        search: false,
        fixed: 'left',
        width: 200,
        sortBy: 'patientName',
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
        width: 160,
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
        sorter: true,
        search: false,
        width: 140,
        defaultSortOrder: 'descend',
        sortBy: 'visitDate',
        render: (_dom, entity) =>
          entity.visitDate?.format(dateFormatLongWithTimeNoSec) || '-',
      },
      {
        key: 'medicalCheckupWorkitemDoctor',
        title: 'Doctor',
        dataIndex: 'medicalCheckupWorkitemDoctor',
        sorter: false,
        search: false,
        width: 200,
        render: (item, entity) => {
          const doctors = (entity.medicalCheckupWorkitemDoctor || [])
            .map(doctor => {
              return doctor.shortName || doctor.name
            })
            .join(', ')
          return (
            <Tooltip title={doctors}>
              <div
                style={{
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {doctors}
              </div>
            </Tooltip>
          )
        },
      },
      {
        key: 'completedDate',
        title: 'Completed Date',
        dataIndex: 'completedDate',
        sortBy: 'completedDate',
        render: (_dom, entity) =>
          entity.completedDate?.format(dateFormatLongWithTimeNoSec) || '-',
        sorter: true,
        search: false,
        width: 140,
      },
      {
        key: 'completedByUser',
        title: 'Completed By',
        dataIndex: 'completedByUser',
        sorter: false,
        search: false,
        width: 160,
      },
      {
        key: 'statusFK',
        title: 'Status',
        dataIndex: 'statusFK',
        sortBy: 'statusFK',
        render: (_dom, entity) => {
          if (entity.statusFK === 4) return 'Completed'
          return (
            <Tooltip
              title={
                <div>
                  <div>
                    {`Discarded by ${entity.discardedByUser || ''} at ${moment(
                      entity.discardedDate,
                    ).format(dateFormatLongWithTimeNoSec)}`}
                  </div>
                  <div>{`Reason: ${entity.discardedReason}`}</div>{' '}
                </div>
              }
            >
              <span>Discarded</span>
            </Tooltip>
          )
        },
        sorter: true,
        search: false,
        fixed: 'right',
        width: 100,
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
                    m =>
                      ableToViewByAuthority(m.authority) &&
                      (entity.statusFK ===
                        MEDICALCHECKUP_WORKITEM_STATUS.DISCARDED ||
                        m.id !== 2),
                  )}
                  onClick={handleMenuItemClick}
                />
              </div>
            </Tooltip>
          )
        },
      },
      {
        hideInTable: true,
        title: '',
        dataIndex: 'searchValue',
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          if (type === 'form') {
            return null
          }
          return (
            <TextField
              style={{ width: 350 }}
              label={'Patient Name, Acc. No., Patient Ref. No.'}
            />
          )
        },
      },
      {
        hideInTable: true,
        title: '',
        dataIndex: 'visitDoctor',
        initialValue: [-99, ...doctorprofile.map(item => item.id)],
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <Select
              label='Visit Doctor'
              options={doctorprofile.map(item => ({
                value: item.id,
                name: item.clinicianProfile.name,
              }))}
              placeholder=''
              style={{ width: 180 }}
              mode='multiple'
              maxTagCount={0}
              maxTagPlaceholder='Visit Doctor'
            />
          )
        },
      },
      {
        hideInTable: true,
        title: '',
        dataIndex: 'dateFrom',
        initialValue: visitDateForm,
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <DatePicker
              style={{ width: 140 }}
              label='Visit Date From'
              placeholder=''
            />
          )
        },
      },
      {
        hideInTable: true,
        title: '',
        dataIndex: 'dateTo',
        initialValue: visitDateTo,
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <DatePicker
              style={{ width: 140 }}
              label='Visit Date To'
              placeholder=''
            />
          )
        },
      },
      {
        hideInTable: true,
        title: '',
        dataIndex: 'medicalCheckupStatus',
        initialValue: [4],
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <Select
              label='Status'
              options={[
                { value: 4, name: 'Completed' },
                { value: 5, name: 'Discarded' },
              ]}
              placeholder=''
              style={{ width: 140 }}
              mode='multiple'
              maxTagCount={0}
              maxTagPlaceholder='status'
            />
          )
        },
      },
    ]
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
  const columns = defaultColumns()
  const height = mainDivHeight - 260
  return (
    <ProTable
      api={api}
      actionRef={actionRef}
      rowSelection={false}
      columns={columns}
      tableClassName='custom_pro'
      options={{ density: false, reload: false }}
      search={{
        span: 8,
        collapsed: false,
        collapseRender: false,
        searchText: 'Search',
        resetText: 'Reset',
        optionRender: (searchConfig, formProps, dom) => {
          return (
            <div
              style={{
                display: 'inline',
                float: 'right',
                width: 200,
                marginTop: 15,
              }}
            >
              {dom[1]} {dom[0]}
            </div>
          )
        },
      }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      columnsStateMap={medicalCheckupWorklistHistoryColumnSetting}
      onColumnsStateChange={map => saveColumnsSetting(dispatch, map)}
      defaultColumns={[]}
      beforeSearchSubmit={values => {
        const {
          searchValue,
          dateFrom,
          dateTo,
          visitDoctor,
          medicalCheckupStatus = [],
          ...resValue
        } = values
        return {
          ...resValue,
          apiCriteria: {
            searchValue,
            filterFrom: moment(dateFrom)
              .startOf('day')
              .formatUTC(false),
            filterTo: moment(dateTo)
              .endOf('day')
              .formatUTC(false),
            visitDoctor: visitDoctor?.includes(-99)
              ? null
              : visitDoctor?.join(','),
            medicalCheckupStatus: medicalCheckupStatus?.includes(-99)
              ? null
              : medicalCheckupStatus?.join(','),
          },
        }
      }}
      request={params => {
        const { sort = [] } = params
        let sortBy
        let order
        if (sort.length) {
          sortBy = sort[0].sortby
          order = sort[0].order
        }
        return queryList({
          apiCriteria: {
            ...params.apiCriteria,
            current: params.current,
            pageSize: params.pageSize,
            sortBy,
            order: order,
          },
        })
      }}
      scroll={{ x: 1100, y: height }}
      onRow={row => {
        return {
          onDoubleClick: () => {
            onRowDoubleClick(row)
          },
        }
      }}
    />
  )
}

export default connect(({ medicalCheckupWorklistHistory, user, global }) => ({
  medicalCheckupWorklistHistory,
  user,
  mainDivHeight: global.mainDivHeight,
}))(History)
