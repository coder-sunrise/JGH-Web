import { Button } from '@/components'
import { ProTable } from '@medisys/component'
import patientService from '@/services/patient'
import PersonAdd from '@material-ui/icons/PersonAdd'
import { connect, history } from 'umi'
import { formatMessage } from 'umi'
import {
  getAppendUrl,
  ableToViewByAuthority,
  menuViewableByAuthoritys,
} from '@/utils/utils'
import Authorized from '@/utils/Authorized'

import { TextField, DatePicker, CodeSelect } from '@/components'
import { useRef } from 'react'
import { ActionType } from '@ant-design/pro-table'
import { Tooltip } from '@material-ui/core'
import { primaryColor } from '@/assets/jss'
import ArrowForwardIosOutlinedIcon from '@material-ui/icons/ArrowForwardIosOutlined'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'
import { GridContextMenuButton as GridButton } from 'medisys-components'

const { queryList, upsert, query, remove } = patientService
const api = {
  remove,
  create: upsert,
  update: upsert,
  queryList,
  query,
}

const iconStyle = {
  height: 14,
  width: 14,
  color: 'rgba(0, 0, 0, 0.54)',
  position: 'relative',
  top: 3,
}

const menus = [
  {
    id: 1,
    label: 'Claim History',
    Icon: ArrowForwardIosOutlinedIcon,
    access: ['patientdatabase.patientprofiledetails.claimhistory'],
    cmt: 12,
    style: iconStyle,
  },
  {
    id: 2,
    label: 'Patient Account',
    access: [
      'patientdatabase.patientprofiledetails.patienthistory.deposit',
      'finance/invoicepayment',
    ],
    Icon: ArrowForwardIosOutlinedIcon,
    cmt: 13,
    style: iconStyle,
  },
  {
    id: 3,
    label: 'Patient Result',
    Icon: ArrowForwardIosOutlinedIcon,
    access: ['patientdatabase.patientprofiledetails.patientresults'],
    cmt: 5,
    style: iconStyle,
  },
  {
    id: 4,
    label: 'Patient History',
    Icon: ArrowForwardIosOutlinedIcon,
    cmt: 6,
    style: iconStyle,
  },
  {
    id: 5,
    label: 'Patient Document',
    authority: 'patientdatabase.patientprofiledetails.patientdocument',
    access: ['patientdatabase.patientprofiledetails.patientdocument'],
    Icon: ArrowForwardIosOutlinedIcon,
    cmt: 7,
    style: iconStyle,
  },
  {
    id: 6,
    label: 'Pre-Order List',
    authority: 'patientdatabase.modifypreorder',
    access: ['patientdatabase.modifypreorder'],
    Icon: ArrowForwardIosOutlinedIcon,
    cmt: 11,
    style: iconStyle,
  },
]

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
    fixed: 'left',
  },
  {
    key: 'patientAccountNo',
    title: 'Acc. No.',
    dataIndex: 'patientAccountNo',
    sorter: true,
    search: false,
    width: 100,
    fixed: 'left',
  },
  {
    key: 'name',
    title: 'Patient Name',
    dataIndex: 'name',
    sorter: true,
    search: false,
    width: 200,
    fixed: 'left',
    render: (_dom: any, entity: any) => {
      const isDisabled = !ableToViewByAuthority(
        'patientdatabase.patientprofiledetails',
      )
      return (
        <Tooltip title={entity.name}>
          {isDisabled ? (
            <span
              style={{
                color: primaryColor,
              }}
            >
              {entity.name}
            </span>
          ) : (
            <Button
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                textAlign: 'left',
                width: '100%',
              }}
              color='primary'
              size='sm'
              link
              onClick={() => {
                if (
                  !ableToViewByAuthority(
                    'patientdatabase.patientprofiledetails',
                  )
                )
                  return
                showPatient(entity)
              }}
            >
              {entity.name}
            </Button>
          )}
        </Tooltip>
      )
    },
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
    width: 60,
    search: false,
  },
  {
    key: 'gender/age',
    dataIndex: 'gender/age',
    title: 'Gender / Age',
    width: 105,
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
  { key: 'race', dataIndex: 'race', title: 'Race', width: 100, search: false },
  {
    key: 'nationality',
    dataIndex: 'nationality',
    title: 'Nationality',
    width: 100,
    search: false,
  },
  {
    key: 'copayers',
    dataIndex: 'copayers',
    title: 'Co-Payers',
    search: false,
    width: 200,
  },
  {
    key: 'mobileNo',
    dataIndex: 'mobileNo',
    title: 'Mobile No.',
    search: false,
    width: 100,
  },
  {
    key: 'homeNo',
    dataIndex: 'homeNo',
    title: 'Home No.',
    width: 100,
    search: false,
  },
  {
    key: 'officeNo',
    dataIndex: 'officeNo',
    title: 'Office No.',
    width: 100,
    search: false,
  },
  // {
  //   key: 'outstandingBalance',
  //   dataIndex: 'outstandingBalance',
  //   title: 'Total O/S Bal.',
  //   valueType: 'money',
  //   width: 110,
  //   search: false,
  //   align: 'right',
  // },
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
          debounceDuration={100}
          style={{ width: 380 }}
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
            style={{ width: 350 }}
            label={formatMessage({
              id: 'finance.scheme.search.cpname',
            })}
            maxTagCount={0}
            mode='multiple'
            showOptionTitle={false}
            renderDropdown={option => {
              return (
                <CopayerDropdownOption option={option}></CopayerDropdownOption>
              )
            }}
            code='ctCopayer'
            additionalSearchField='code'
            labelField='displayValue'
            isCheckedShowOnTop
          />
        </Tooltip>
      )
    },
  },
  {
    key: 'options',
    title: 'Action',
    align: 'center',
    dataIndex: 'options',
    width: 60,
  },
]
const showPatient = (row: any, cmt = 1) => {
  history.push(
    getAppendUrl({
      md: 'pt',
      cmt: cmt,
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
  mainDivHeight = 700,
}) => {
  const createPatProfileAccessRight = ableToViewByAuthority(
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
    <div>
      <ProTable
        search={{ span: 8 }}
        rowSelection={false}
        columns={defaultColumns}
        api={api}
        actionRef={actionRef}
        tableClassName='custom_pro'
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
        options={{ density: false, reload: false, width: 60 }}
        toolBarRender={() => {
          if (createPatProfileAccessRight)
            return [
              <Button
                color='primary'
                size='sm'
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
                <PersonAdd />
                New Patient
              </Button>,
            ]
          return []
        }}
        defaultColumns={['options']}
        features={[
          {
            code: 'myedit',
            render: row => {
              if (
                !ableToViewByAuthority('patientdatabase.patientprofiledetails')
              )
                return ''
              const activeMenus = menus.filter(m => {
                if (m.id === 6) {
                  return ableToViewByAuthority(m.authority)
                }
                return menuViewableByAuthoritys(m.access)
              })
              if (activeMenus.length <= 0) return ''
              return (
                <Tooltip title='More Options'>
                  <div>
                    <GridButton
                      row={row}
                      contextMenuOptions={activeMenus}
                      onClick={(entity: any, id: any) => {
                        var selectMenu = activeMenus.find(
                          x => x.id === parseInt(id, 10),
                        )
                        showPatient(entity, selectMenu.cmt)
                      }}
                    />
                  </div>
                </Tooltip>
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
        onRow={row => {
          return {
            onDoubleClick: () => {
              if (
                !ableToViewByAuthority('patientdatabase.patientprofiledetails')
              ) {
                return
              }
              showPatient(row)
            },
          }
        }}
        scroll={{ x: 1100, y: mainDivHeight - 260 }}
      />
    </div>
  )
}

// @ts-ignore
export default connect(({ patient, global }) => {
  return {
    patient,
    mainDivHeight: global.mainDivHeight,
  }
})(PatientIndex)
