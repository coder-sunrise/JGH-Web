import React, { useState, useEffect, Fragment, useContext, useRef } from 'react'
import { compose } from 'redux'
import {
  PageContainer,
  Select,
  TextField,
  DatePicker,
  Popper,
  CommonTableGrid,
  CodeSelect,
  Tooltip,
  VisitTypeSelect,
  Checkbox,
} from '@/components'
import { ProTable, Input, Button } from '@medisys/component'
import service from './services'
import { connect, history, formatMessage } from 'umi'
import { getAppendUrl, getNameWithTitle } from '@/utils/utils'
import Authorized from '@/utils/Authorized'
import { VISIT_TYPE } from '@/utils/constants'
import { PrinterOutlined, UnorderedListOutlined } from '@ant-design/icons'
import moment from 'moment'
import { useSelector, useDispatch } from 'dva'
import _ from 'lodash'
import LinkIcon from '@material-ui/icons/Link'
import IconButton from '@/components/Button/IconButton'
import { withStyles } from '@material-ui/core'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { useVisitTypes } from '@/utils/hooks'
import CollectSpecimen from './components/CollectSpecimen'
import { usePrintSpecimenLabel } from './components/PrintSpecimenLabel'
import { TestPanelPriorityNote } from '../Worklist/components'
import { TestPanelColumn } from '../Worklist/components/TestPanelColumn'
import { LAB_WORKITEM_STATUS } from '@/utils/constants'

const { queryList } = service
const api = {
  remove: null,
  create: null,
  update: null,
  queryList: queryList,
  query: null,
}

const style = theme => ({})

const saveColumnsSetting = (dispatch, columnsSetting) => {
  dispatch({
    type: 'specimenCollection/saveUserPreference',
    payload: {
      userPreferenceDetails: {
        value: columnsSetting,
        Identifier: 'SpecimenCollectionColumnSetting',
      },
      itemIdentifier: 'SpecimenCollectionColumnSetting',
      type: '4', //grid setting type
    },
  }).then(result => {
    dispatch({
      type: 'specimenCollection/updateState',
      payload: {
        specimenCollectionColumnSetting: columnsSetting,
      },
    })
  })
}

const SpecimenCollection = ({
  specimenCollection: { specimenCollectionColumnSetting = [] },
  codetable,
  handlePrint,
  user,
  mainDivHeight = 700,
}) => {
  const dispatch = useDispatch()
  const visitTypes = useVisitTypes()
  const [visitId, setVisitId] = useState()
  const [TheCurrentCancelId, setTheCurrentCancelId] = useState()

  const ref = useRef()
  const printSpecimenLabel = usePrintSpecimenLabel(handlePrint)

  const defaultColumns = (codetable, visitTypes = []) => {
    return [
      {
        key: 'patientName',
        title: 'Patient Name',
        dataIndex: 'patientName',
        sorter: false,
        search: false,
        width: 150,
      },
      {
        key: 'patientReferenceNo',
        title: 'Ref. No.',
        dataIndex: 'patientReferenceNo',
        sorter: false,
        search: false,
        width: 80,
      },
      {
        key: 'testCategories',
        title: 'Test Category',
        dataIndex: 'testCategories',
        sorter: false,
        search: false,
        width: 180,
      },
      {
        key: 'testPanels',
        title: 'New Test Panel',
        dataIndex: 'testPanels',
        sorter: false,
        search: false,
        width: 200,
        render: (_dom, entity) => {
          let newTestPanels = entity.testPanels.filter(
            item => item.statusFK == LAB_WORKITEM_STATUS.NEW,
          )
          return <TestPanelColumn testPanels={newTestPanels} />
        },
      },
      {
        key: 'cancelledTestPanels',
        title: 'Cancelled Test Panel',
        dataIndex: 'testPanels',
        sorter: false,
        search: false,
        width: 200,
        render: (_dom, entity) => {
          let cancelledTestPanels = entity.testPanels.filter(
            item => item.statusFK == LAB_WORKITEM_STATUS.CANCELLED,
          )
          return <TestPanelColumn testPanels={cancelledTestPanels} />
        },
      },
      {
        key: 'firstOrderDate',
        title: 'First Order Date',
        dataIndex: 'firstOrde}rDate',
        valueType: 'dateTime',
        render: (_dom, entity) =>
          entity.firstOrderDate?.format('DD MMM YYYY HH:mm'),
        sortBy: 'firstOrderDate',
        sorter: true,
        search: false,
        width: 120,
      },
      {
        key: 'visitDoctor',
        title: 'Visit Doctor',
        dataIndex: 'visitDoctor',
        sorter: false,
        search: false,
        width: 130,
        render: (_dom, entity) =>
          getNameWithTitle(entity.doctorTitle, entity.doctorName),
      },
      {
        key: 'visitType',
        title: 'Visit Type',
        dataIndex: 'visitType',
        sorter: false,
        search: false,
        width: 85,
        render: (_dom, entity) => {
          const vt = visitTypes.find(x => x.id === entity.visitPurposeId)
          return (
            <Tooltip title={vt?.name}>
              <span>{vt?.code}</span>
            </Tooltip>
          )
        },
      },
      {
        key: 'action',
        title: 'Action',
        dataIndex: 'action',
        align: 'center',
        sorter: false,
        search: false,
        fixed: 'right',
        width: 150,
        render: (_dom, entity) => {
          return Authorized.check('lab.collectspecimen')?.rights ===
            'enable' ? (
            <div>
              {entity.testPanels.find(
                item => item.statusFK == LAB_WORKITEM_STATUS.NEW,
              ) && (
                <Tooltip title='Collect Specimen'>
                  <Button
                    onClick={() => {
                      setVisitId(entity.id)
                    }}
                    type='link'
                  >
                    Collect
                  </Button>
                </Tooltip>
              )}
              <Tooltip title='Cancel Test Panel'>
                <Button
                  onClick={() => {
                    setTheCurrentCancelId(entity.id)
                  }}
                  type='link'
                >
                  Cancel
                </Button>
              </Tooltip>
            </div>
          ) : (
            <span></span>
          )
        },
      },
      /* Filter Columns */
      {
        // search: Patient Name/Acc. No./Ref. No.
        hideInTable: true,
        title: '',
        dataIndex: 'searchPatient',
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          if (type === 'form') {
            return null
          }
          return (
            <TextField
              style={{ width: 250 }}
              label={'Patient Name, Patient Ref. No.'}
            />
          )
        },
      },
      {
        // search: filterFrom,
        hideInTable: true,
        title: '',
        dataIndex: 'searchfilterFrom',
        initialValue: moment(moment().toDate()).formatUTC(),
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <DatePicker
              style={{ width: 200 }}
              label='Order Date From'
              placeholder=''
            />
          )
        },
      },
      {
        // title: filterTo
        hideInTable: true,
        title: '',
        dataIndex: 'searchfilterTo',
        initialValue: moment()
          .endOf('day')
          .formatUTC(false),
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <DatePicker
              style={{ width: 200 }}
              label='Order Date To'
              placeholder=''
            />
          )
        },
      },

      {
        // title: Visit Type
        hideInTable: true,
        title: '',
        dataIndex: 'searchVisitType',
        initialValue: [-99],
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <VisitTypeSelect
              label='Visit Type'
              mode='multiple'
              maxTagCount={0}
              maxTagPlaceholder='Visit Types'
              style={{ width: 200 }}
              localFilter={item => {
                return item.id !== VISIT_TYPE.OTC
              }}
              allowClear={true}
            />
          )
        },
      },
      {
        // search: VisitDoctor
        hideInTable: true,
        title: '',
        dataIndex: 'searchVisitDoctor',
        initialValue: [-99],
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          const visitDoctorOptions = (codetable.doctorprofile || []).map(x => {
            return {
              value: x.id,
              name: x.clinicianProfile.name,
              doctorMCRNo: x.doctorMCRNo,
              clinicianProfile: x.clinicianProfile,
            }
          })
          return (
            <Tooltip
              placement='right'
              title='Select "All" will retrieve active and inactive doctors'
            >
              <Select
                label='Visit Doctor'
                mode='multiple'
                options={visitDoctorOptions}
                placeholder=''
                style={{ width: 200 }}
                maxTagCount={0}
                maxTagPlaceholder='Doctors'
                // renderDropdown={(option) => <DoctorLabel doctor={option} />}
              />
            </Tooltip>
          )
        },
      },
      {
        // title: Display Cancelled Test Panel
        hideInTable: true,
        title: '',
        dataIndex: '',
        initialValue: [-99],
        renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
          return (
            <Checkbox
              label='Display Cancelled Test Panel'
              style={{ width: 250, marginTop: '20px' }}
              checked={
                specimenCollectionColumnSetting?.cancelledTestPanels?.show
              }
              onChange={e => {
                saveColumnsSetting(dispatch, {
                  ...specimenCollectionColumnSetting,
                  cancelledTestPanels: {
                    show: e.target.value,
                  },
                })
              }}
            />
          )
        },
      },
    ]
  }

  useEffect(() => {
    dispatch({
      force: true,
      type: 'codetable/fetchCodes',
      payload: { code: 'ctservice' },
      filter: {
        'serviceFKNavigation.IsActive': true,
        'serviceCenterFKNavigation.ServiceCenterCategoryFK': 4,
        combineCondition: 'and',
      },
    })

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
    dispatch({
      force: true,
      type: 'codetable/fetchCodes',
      payload: {
        code: 'clinicianprofile',
        filter: {
          isActive: true,
        },
      },
    })
  }, [])

  const columns = defaultColumns(codetable, visitTypes)

  const onCloseCollectSpecimen = () => {
    setVisitId(undefined)
    setTheCurrentCancelId(undefined)
    ref.current.reload()
  }

  return (
    <Fragment>
      <PageContainer pageHeaderRender={false}>
        <ProTable
          actionRef={ref}
          rowSelection={false}
          columns={columns}
          api={api}
          search={{
            span: 9,
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
          options={{ density: false, reload: false }}
          columnsStateMap={specimenCollectionColumnSetting}
          onColumnsStateChange={map => saveColumnsSetting(dispatch, map)}
          defaultColumns={[]}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          footer={() => <TestPanelPriorityNote />}
          features={[
            {
              code: 'details',
              render: row => {
                return (
                  <Button
                    onClick={() => {}}
                    type='primary'
                    icon={<UnorderedListOutlined />}
                  />
                )
              },
            },
          ]}
          beforeSearchSubmit={({
            searchfilterFrom,
            searchfilterTo,
            searchPatient,
            searchVisitType,
            searchVisitDoctor,
            ...values
          }) => {
            return {
              ...values,
              apiCriteria: {
                searchValue: searchPatient,
                filterFrom: searchfilterFrom,
                filterTo: moment(searchfilterTo)
                  .endOf('day')
                  .formatUTC(false),
                visitType:
                  searchVisitType?.indexOf(-99) > -1
                    ? null
                    : searchVisitType?.join(),
                visitDoctor:
                  searchVisitDoctor?.indexOf(-99) > -1
                    ? null
                    : searchVisitDoctor?.join(),
              },
            }
          }}
          scroll={{ x: 1100, y: mainDivHeight - 315 }}
        />
      </PageContainer>

      <CollectSpecimen
        enableReceiveSpecimen={
          Authorized.check('lab.receivespecimen')?.rights === 'enable'
        }
        mode='new'
        open={visitId != undefined && visitId != null}
        visitId={visitId}
        onConfirm={(newId, printInfo) => {
          if (printInfo?.isPrintLabel) {
            printSpecimenLabel(newId, printInfo.copies)
          }
          onCloseCollectSpecimen()
        }}
        onClose={onCloseCollectSpecimen}
      ></CollectSpecimen>
      <CollectSpecimen
        mode='cancel'
        open={TheCurrentCancelId != undefined && TheCurrentCancelId != null}
        onConfirm={() => {
          onCloseCollectSpecimen()
        }}
        visitId={TheCurrentCancelId}
        onClose={onCloseCollectSpecimen}
        userId={user?.data?.id}
      ></CollectSpecimen>
    </Fragment>
  )
}

export default compose(
  withWebSocket(),
  connect(({ specimenCollection, codetable, global, user }) => ({
    specimenCollection,
    codetable,
    mainDivHeight: global.mainDivHeight,
    user,
  })),
)(SpecimenCollection)
