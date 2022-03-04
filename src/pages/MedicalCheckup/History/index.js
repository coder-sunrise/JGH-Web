import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'dva'
import moment from 'moment'
import _ from 'lodash'
import { history, connect } from 'umi'
import { Card, Tooltip, Button } from 'antd'
import { WORK_ITEM_TYPES } from '@/utils/constants'
import NurseWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/NurseWorkItemInfo'
import RadioWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/RadioWorkItemInfo'
import LabWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/LabWorkItemInfo'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import { UnorderedListOutlined } from '@ant-design/icons'
import {
  dateFormatLongWithTimeNoSec,
  Icon,
  TextField,
  Select,
  DatePicker,
} from '@/components'
import { ProTable } from '@medisys/component'
import service from './services'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
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

const History = ({ medicalCheckupWorklistHistory, user }) => {
  const {
    medicalCheckupWorklistHistoryColumnSetting = [],
  } = medicalCheckupWorklistHistory
  const dispatch = useDispatch()
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
    .add(-1, 'week')
    .toDate()
  const visitDateTo = moment()
    .add(-1, 'day')
    .toDate()

  const defaultColumns = () => {
    return [
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
        width: 200,
        render: (item, entity) => {
          const doctors = (entity.medicalCheckupWorkitemDoctor || [])
            .map(doctor => {
              return `${
                hasValue(doctor.title) && doctor.title.trim().length
                  ? `${doctor.title}.`
                  : ''
              }${doctor.name || ''}`
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
        key: 'verifiedDate',
        title: 'Verified Date',
        dataIndex: 'verifiedDate',
        render: (_dom, entity) =>
          entity.verifiedDate?.format(dateFormatLongWithTimeNoSec) || '-',
        sorter: false,
        search: false,
        width: 140,
      },
      {
        key: 'verifiedByUser',
        title: 'Verified By',
        dataIndex: 'verifiedByUser',
        sorter: false,
        search: false,
        width: 180,
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
            !(entity.medicalCheckupWorkitemDoctor || []).find(
              x =>
                x.userProfileFK === user.data.clinicianProfile.userProfile.id,
            )
          ) {
            return ''
          }
          return (
            <Tooltip title='Reporting Details'>
              <Button
                onClick={() => {
                  showReportingDetails(entity)
                }}
                type='primary'
                size='small'
                icon={<UnorderedListOutlined />}
              />
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
    ]
  }
  const columns = defaultColumns()
  const height = window.innerHeight - 300
  return (
    <ProTable
      api={api}
      rowSelection={false}
      columns={columns}
      options={{ density: false, reload: false }}
      search={{
        span: 5,
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
      pagination={{ pageSize: 20 }}
      columnsStateMap={medicalCheckupWorklistHistoryColumnSetting}
      onColumnsStateChange={map => saveColumnsSetting(dispatch, map)}
      defaultColumns={[]}
      beforeSearchSubmit={values => {
        const {
          searchValue,
          dateFrom,
          dateTo,
          visitDoctor,
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
          },
        }
      }}
      request={params => {
        return queryList({
          ...params,
          apiCriteria: {
            ...params.apiCriteria,
            current: params.current,
            pageSize: params.pageSize,
          },
        })
      }}
      scroll={{ x: 1100, y: height }}
    />
  )
}

export default connect(({ medicalCheckupWorklistHistory, user }) => ({
  medicalCheckupWorklistHistory,
  user,
}))(History)
