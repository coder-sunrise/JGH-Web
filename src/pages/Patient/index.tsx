import { PageContainer, Icon } from '@/components'
import { ProTable, Select, Input, Button } from '@medisys/component'
import patientService from '@/services/patient'
import { connect, history } from 'umi'
import { formatMessage } from 'umi'
import { getAppendUrl } from '@/utils/utils'
import Authorized from '@/utils/Authorized'

import { TextField, DatePicker, CodeSelect } from '@/components'
import { useState, useRef } from 'react'
import { ActionType } from '@ant-design/pro-table'
import { Tooltip } from '@material-ui/core'
const { queryList, upsert, query, remove } = patientService
const api = {
  remove,
  create: upsert,
  update: upsert,
  queryList,
  query,
}

const defaultColumns = [
  {
    key: 'patientReferenceNo',
    title: 'Ref. No.',
    dataIndex: 'patientReferenceNo',
    sorterBy: 'aa.patientReferenceNo',
    defaultSortOrder: 'ascend',
    width: 100,
    sorter: true,
    search: false,
  },
  {
    key: 'patientAccountNo',
    title: 'Acc. No.',
    dataIndex: 'patientAccountNo',
    sorter: true,
    search: false,
  },
  {
    key: 'name',
    title: 'Patient Name',
    dataIndex: 'name',
    sorter: true,
    search: false,
    width: 200,
  },
  {
    key: 'lastVisitDate',
    title: 'Last Visit Date',
    dataIndex: 'lastVisitDate',
    valueType: 'dateTime',
    render: (_dom: any, entity: any) =>
      entity.lastVisitDate?.format('DD MMM yyyy') || '-',
    width: 120,
    search: false,
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    search: false,
  },
  {
    key: 'gender/age',
    dataIndex: 'gender/age',
    title: 'Gender / Age',
    render: (_dom: any, entity: any) =>
      `${entity.gender?.substring(0, 1)}/${Math.floor(
        entity.dob?.toDate()?.duration('year'),
      )}`,
    search: false,
  },
  {
    key: 'dob',
    dataIndex: 'dob',
    title: 'DOB',
    render: (_dom: any, entity: any) =>
      entity.dob?.format('DD MMM yyyy') || '-',
    width: 100,
    search: false,
  },
  { key: 'race', dataIndex: 'race', title: 'Race', search: false },
  {
    key: 'nationality',
    dataIndex: 'nationality',
    title: 'Nationality',
    search: false,
  },
  {
    key: 'copayers',
    dataIndex: 'copayers',
    title: 'Co-Payers',
    search: false,
  },
  {
    key: 'mobileNo',
    dataIndex: 'mobileNo',
    title: 'Mobile No.',
    search: false,
  },
  { key: 'homeNo', dataIndex: 'homeNo', title: 'Home No.', search: false },
  {
    key: 'officeNo',
    dataIndex: 'officeNo',
    title: 'Office No.',
    search: false,
  },
  {
    key: 'outstandingBalance',
    dataIndex: 'outstandingBalance',
    title: 'Total O/S Balance',
    valueType: 'money',
    search: false,
    align: 'right',
  },
  // { dataIndex: 'action', title: 'Action', search: false },
  {
    // title: 'Patient Name, Acc No., Patient Ref. No., Contact No.',
    hideInTable: true,
    title: '',
    dataIndex: 'search',
    renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
      if (type === 'form') {
        return null
      }
      return (
        <TextField
          style={{ width: 350 }}
          label={formatMessage({
            id: 'reception.queue.patientSearchPlaceholder',
          })}
        />
      )
    },
  },
  {
    // title: dob
    hideInTable: true,
    title: '',
    dataIndex: 'dob',
    renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
      return <DatePicker style={{ width: 150 }} label='DOB' placeholder='' />
    },
  },
  {
    hideInTable: true,
    title: '',
    dataIndex: 'copayer',
    renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
      return (
        <Tooltip
          placement='left'
          title='Select “All” will retrieve active and inactive co-payers'
        >
          <CodeSelect
            style={{ width: 250 }}
            label={formatMessage({
              id: 'finance.scheme.search.cpname',
            })}
            mode='multiple'
            code='ctCopayer'
            labelField='displayValue'
          />
        </Tooltip>
      )
    },
  },
]
const showPatient = row => {
  const viewPatProfileAccessRight = Authorized.check(
    'patientdatabase.patientprofiledetails',
  )
  const disableRights = ['disable', 'hidden']
  if (
    viewPatProfileAccessRight &&
    disableRights.includes(viewPatProfileAccessRight.rights)
  )
    return

  history.push(
    getAppendUrl({
      md: 'pt',
      cmt: '1',
      pid: row.id,
      v: Date.now(),
    }),
  )
}
const saveColumnsSetting = (dispatch, columnsSetting) => {
  dispatch({
    type: 'patient/saveUserPreference',
    payload: {
      userPreferenceDetails: {
        value: columnsSetting,
        Identifier: 'PatientDatabaseColumnSetting',
      },
      itemIdentifier: 'PatientDatabaseColumnSetting',
      type: '4',
    },
  }).then(result => {
    dispatch({
      type: 'patient/updateState',
      payload: {
        favPatDBColumnSetting: columnsSetting,
      },
    })
  })
}

const PatientIndex = ({
  dispatch,
  patient: { favPatDBColumnSetting = {}, onRefresh = false },
}) => {
  const createPatProfileAccessRight = Authorized.check(
    'patientdatabase.newpatient',
  )
  const actionRef = useRef<ActionType>()

  if (onRefresh) {
    actionRef?.current?.reload()
    dispatch({
      type: 'patient/updateState',
      payload: {
        onRefresh: false,
      },
    })
  }
  return (
    <PageContainer pageHeaderRender={false}>
      <ProTable
        search={{ span: 8 }}
        rowSelection={false}
        columns={defaultColumns}
        api={api}
        actionRef={actionRef}
        search={{
          optionRender: (searchConfig, formProps, dom) => {
            return (
              <div
                style={{
                  display: 'inline',
                  float: 'left',
                  width: 200,
                  marginTop: 15,
                }}
              >
                {dom[0]} {dom[1]}
              </div>
            )
          },
        }}
        columnsStateMap={favPatDBColumnSetting}
        onColumnsStateChange={map => saveColumnsSetting(dispatch, map)}
        options={{ density: false, reload: false }}
        toolBarRender={() => {
          if (
            createPatProfileAccessRight &&
            createPatProfileAccessRight.rights !== 'hidden'
          )
            return [
              <Button
                type='primary'
                icon={<Icon type='adduser' />}
                color='primary'
                disabled={createPatProfileAccessRight.rights == 'disable'}
                onClick={() => {
                  dispatch({
                    type: 'patient/updateState',
                    payload: {
                      entity: undefined,
                      version: undefined,
                    },
                  })
                  dispatch({
                    type: 'patient/openPatientModal',
                  })
                }}
              >
                Register New Patient
              </Button>,
            ]
          return []
        }}
        onRowDblClick={showPatient}
        defaultColumns={['options']}
        features={[
          {
            code: 'myedit',
            render: row => {
              return (
                <Button
                  onClick={() => {
                    showPatient(row)
                  }}
                  type='primary'
                  icon={<Icon type='user' />}
                />
              )
            },
          },
        ]}
        beforeSearchSubmit={({ search, dob, copayer, ...values }) => {
          dispatch({
            type: 'patient/updateState',
            payload: {
              shouldQueryOnClose: location.pathname.includes('patient'),
            },
          })
          if (copayer && copayer.length > 0 && copayer[0] === -99) copayer = []
          return {
            ...values,
            apiCriteria: {
              searchValue: search,
              dob: dob,
              copayerIds: (copayer || []).join('|'),
              includeinactive: true,
            },
          }
        }}
        scroll={{ x: 1100 }}
      />
    </PageContainer>
  )
}

// @ts-ignore
export default connect(({ patient }) => {
  return {
    patient,
  }
})(PatientIndex)
