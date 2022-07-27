import React, { useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useDispatch, useSelector } from 'dva'
import _ from 'lodash'
import { formatMessage } from 'umi'
import {
  Table,
  Badge,
  Menu,
  Dropdown,
  Space,
  Typography,
  Card,
  Tag,
  Tooltip,
} from 'antd'
import {
  DownOutlined,
  RightOutlined,
  PlusCircleTwoTone,
  MinusCircleTwoTone,
  CoffeeOutlined,
  UnorderedListOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons'
import Print from '@material-ui/icons/Print'
import Delete from '@material-ui/icons/Delete'
import {
  LAB_SPECIMEN_STATUS,
  PRIORITY_OPTIONS,
  PRIORITY_VALUES,
} from '@/utils/constants'
import { useCodeTable, useVisitTypes } from '@/utils/hooks'
import {
  CommonModal,
  DatePicker,
  Select,
  Button,
  dateFormatLongWithTimeNoSec,
  Icon,
} from '@/components'
import { VisitTypeTag } from '@/components/_medisys'
import {
  ExapandCollapseAllButton,
  LabResultReportPreview,
  SpecimenStatusTag,
} from '../../Worklist/components'
import { SpecimenDetails } from '../../Worklist/SpecimenDetails'
import { TestPanelColumn } from '../../Worklist/components/TestPanelColumn'
import WorklistHistoryContext from '../WorklistHistoryContext'
import styles from './WorklistHistoryGrid.less'

export const WorklistHistoryGrid = ({ labWorklistHistory }) => {
  const {
    list: labWorklistHistoryEntity = [],
    pagination = {},
  } = labWorklistHistory
  const [visits, setVisits] = useState([])
  const [collapsedKeys, setCollapsedKeys] = useState([])
  const cttestpanel = useCodeTable('cttestpanel')
  const cttestcategory = useCodeTable('cttestcategory')
  const ctspecimentype = useCodeTable('ctspecimentype')
  const dispatch = useDispatch()
  const visitTypes = useVisitTypes()
  const { triggerPaginationChange } = useContext(WorklistHistoryContext)

  const [labResultReportPreviewPara, setLabResultReportPreviewPara] = useState({
    open: false,
    visitId: undefined,
  })
  const [specimenDetailsPara, setSpecimenDetailsPara] = useState({
    open: false,
    id: undefined,
  })

  useEffect(() => {
    if (labWorklistHistoryEntity) {
      const uniqeVisits = _(
        labWorklistHistoryEntity.map(item => ({
          ...item,
          key: item.visitFK,
          doctor:
            (item.doctorTitle ? `${item.doctorTitle} ` : '') + item.doctorName,
          workitems: labWorklistHistoryEntity
            .filter(inner => inner.visitFK === item.visitFK)
            .map(inner => ({
              testCategoryFK: inner.testCategoryFK,
              workitemStatusId: inner.workitemStatusId,
              workitemId: inner.workitemId,
              visitFK: inner.visitFK,
            })),
        })),
      )
        .uniqBy('visitFK')
        .orderBy('visitDate')
        .value()

      setVisits(uniqeVisits)
    }
  }, [labWorklistHistoryEntity])

  const getSpecimenCountByCategory = visitFK => {
    if (!visitFK || !cttestcategory) return ''
    const specimenCountByCategory = cttestcategory.map(item => ({
      name: item.name,
      incompleteWorkitemCount: _(labWorklistHistoryEntity)
        .filter(
          w =>
            w.visitFK === visitFK &&
            w.testCategoryFK === item.id &&
            (w.specimenStatusFK !== LAB_SPECIMEN_STATUS.COMPLETED ||
              w.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED),
        )
        .uniqBy(w => w.labSpecimenFK)
        .value().length,
    }))

    return specimenCountByCategory
      .filter(item => item.incompleteWorkitemCount > 0)
      .reduce(
        (prev, current) =>
          `${prev !== '' ? prev + ', ' : ''}${current.name}: ${
            current.incompleteWorkitemCount
          } `,
        '',
      )
  }
  const closeLabResultReportPreview = () => {
    setLabResultReportPreviewPara({
      open: false,
      id: undefined,
    })
  }

  const closeSpecimenDetails = () => {
    setSpecimenDetailsPara({
      open: false,
      id: undefined,
    })
  }

  const expandedRowRender = (record, index, indent, expanded) => {
    const groupedTestPanels = _(
      labWorklistHistoryEntity
        .filter(item => item.visitFK === record.visitFK)
        .map(item => ({
          ...item,
          testCategories: _.uniqBy(
            labWorklistHistoryEntity.filter(
              innerItem => innerItem.labSpecimenFK === item.labSpecimenFK,
            ),
            'testCategoryFK',
          ).reduce((prev, cur) => {
            const testCategory = cttestcategory.find(
              item => item.id === cur.testCategoryFK,
            )
            return `${prev ? prev + ', ' : ''}${testCategory?.name}`
          }, ''),
          testPanels: _.uniq(
            labWorklistHistoryEntity
              .filter(
                innerItem => innerItem.labSpecimenFK === item.labSpecimenFK,
              )
              .map(innerItem => {
                const currentTestPanel = cttestpanel.find(
                  item => item.id === innerItem.testPanelFK,
                )
                return {
                  testPanelFK: innerItem.testPanelFK,
                  testPanelName: currentTestPanel?.displayValue,
                  sortOrder: currentTestPanel?.sortOrder,
                  priority: innerItem.priority,
                }
              }),
          ),
        })),
    )
      .uniqBy('labSpecimenFK')
      .orderBy('accessionNo')
      .reverse()
      .value()

    const columns = [
      {
        title: 'Test Category',
        dataIndex: 'testCategories',
        key: 'testCategories',
        ellipsis: true,
        width: 170,
      },
      {
        title: 'Test Panel',
        dataIndex: 'testPanels',
        key: 'testPanels',
        width: 290,
        render: (text, record, index) => {
          return (
            <TestPanelColumn columnWidth={290} testPanels={record.testPanels} />
          )
        },
      },
      {
        title: 'Specimen Type',
        width: 120,
        dataIndex: 'specimenTypeFK',
        key: 'specimenTypeFK',
        ellipsis: true,
        render: (text, record, index) => {
          const speicmenType = ctspecimentype.find(
            item => record.specimenTypeFK === item.id,
          )

          return speicmenType ? speicmenType.name : ''
        },
      },
      {
        title: 'Accession No.',
        dataIndex: 'accessionNo',
        key: 'accessionNo',
        width: 120,
        render: (text, record) =>
          record.hasAnyPendingRetestResult ? (
            <span>
              {text} <ExclamationCircleFilled style={{ color: 'red' }} />
            </span>
          ) : (
            <span>{text}</span>
          ),
      },
      {
        title: 'Collected Date',
        dataIndex: 'specimenCollectionDate',
        key: 'specimenCollectionDate',
        width: 135,
        render: (text, record, index) =>
          record.specimenCollectionDate?.format(dateFormatLongWithTimeNoSec),
      },
      {
        title: 'Received Date',
        dataIndex: 'dateReceived',
        key: 'dateReceived',
        width: 135,
        render: (text, record, index) =>
          record.dateReceived?.format(dateFormatLongWithTimeNoSec),
      },
      {
        title: 'First Verifier',
        dataIndex: 'firstVerifier',
        key: 'firstVerifier',
        ellipsis: true,
        width: 150,
      },
      {
        title: 'Second Verifier',
        dataIndex: 'secondVerifier',
        key: 'secondVerifier',
        ellipsis: true,
        width: 150,
      },
      {
        title: 'Status',
        width: 100,
        dataIndex: 'specimenStatusFK',
        key: 'specimenStatusFK',
        align: 'center',
        render: (specimenStatus, record, index) => (
          <SpecimenStatusTag
            customToolTip={
              specimenStatus === LAB_SPECIMEN_STATUS.DISCARDED ? (
                <div>
                  <div>
                    Discarded by {record.specimenDiscardedClinicianName} at{' '}
                    {record.lastUpdatedDate?.format(
                      dateFormatLongWithTimeNoSec,
                    )}
                  </div>
                  <div>Reason: {record.specimenDiscardReason}</div>
                </div>
              ) : (
                ''
              )
            }
            statusId={specimenStatus}
          />
        ),
      },
      {
        title: 'Action',
        width: 85,
        dataIndex: 'operation',
        key: 'operation',
        align: 'left',
        render: (text, record, index) => (
          <Space size='small' align='center'>
            {record.dateReceived &&
              record.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED && (
                <Tooltip title='Lab Specimen Details'>
                  <Button
                    onClick={() => {
                      setSpecimenDetailsPara({
                        open: true,
                        id: record.labSpecimenFK,
                      })
                    }}
                    justIcon
                    color='primary'
                    size='sm'
                  >
                    <UnorderedListOutlined />
                  </Button>
                </Tooltip>
              )}
          </Space>
        ),
      },
    ]

    return (
      <Table
        onRow={record => {
          if (
            record.dateReceived &&
            record.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED
          ) {
            return {
              onDoubleClick: () => {
                setSpecimenDetailsPara({
                  open: true,
                  id: record.labSpecimenFK,
                })
              },
            }
          }
        }}
        className='noBgTable innerTable'
        bordered
        columns={columns}
        dataSource={groupedTestPanels}
        pagination={false}
      />
    )
  }
  const columns = [
    {
      title: 'Name',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (text, record) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Space style={{ flexGrow: 1 }}>
              <Button
                color='primary'
                onClick={() => {
                  setLabResultReportPreviewPara({
                    open: true,
                    visitId: record.visitFK,
                  })
                }}
                size='sm'
                justIcon
                style={{ height: 25, marginTop: 2 }}
              >
                <Print />
              </Button>
              <Typography.Text strong>
                {record.patientName} ({record.patientReferenceNo})
              </Typography.Text>
              <Typography.Text>
                {record.doctor},{' '}
                {record.visitDate.format(dateFormatLongWithTimeNoSec)}
              </Typography.Text>
              <VisitTypeTag type={record.visitPurposeFK} />
            </Space>
            {/* <Space style={{ fontWeight: 'bold' }}>
              <span>{getSpecimenCountByCategory(record.visitFK)}</span>
            </Space> */}
          </div>
        )
      },
    },
  ]
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'start', marginBottom: 8 }}>
        <ExapandCollapseAllButton
          onExpandAllClick={() => setCollapsedKeys([])}
          onCollapseAllClick={() =>
            setCollapsedKeys(visits.map(v => v.visitFK))
          }
        />
      </div>
      <Table
        className={styles.table}
        size='small'
        columns={columns}
        rowClassName={styles.expandableRow}
        expandable={{
          expandedRowRender,
          onExpand: (expanded, record) => {
            expanded
              ? setCollapsedKeys(
                  collapsedKeys.filter(item => item !== record.visitFK),
                )
              : setCollapsedKeys([...collapsedKeys, record.visitFK])
          },
        }}
        expandedRowKeys={visits
          .filter(v => !collapsedKeys.includes(v.visitFK))
          .map(v => v.visitFK)}
        showHeader={false}
        dataSource={visits}
        pagination={{
          defaultPageSize: 20,
          total: pagination.totalRecords,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          showSizeChanger: true,
          onChange: (pageNo, pageSize) => {
            triggerPaginationChange(pageNo, pageSize)
          },
        }}
        expandIcon={({ expanded, onExpand, record }) =>
          expanded ? (
            <DownOutlined onClick={e => onExpand(record, e)} />
          ) : (
            <RightOutlined onClick={e => onExpand(record, e)} />
          )
        }
      />
      <section style={{ fontStyle: 'italic' }}>
        Note: test panel in{' '}
        <span style={{ color: 'red' }}>red color = urgent </span>; test panel in
        black color = normal
      </section>

      <SpecimenDetails
        {...specimenDetailsPara}
        onClose={() => {
          closeSpecimenDetails()
        }}
        onConfirm={() => {
          closeSpecimenDetails()
        }}
        isReadonly
      />
      <LabResultReportPreview
        {...labResultReportPreviewPara}
        onClose={() => {
          closeLabResultReportPreview()
        }}
        onConfirm={() => {
          closeLabResultReportPreview()
        }}
      />
    </Card>
  )
}
