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
import WorklistContext from '../WorklistContext'
import {
  StatusFilter,
  DiscardSpecimen,
  ReceiveSpecimen,
  ExapandCollapseAllButton,
} from './index'
import { SpecimenDetails } from '../SpecimenDetails'
import { SpecimenStatusTag } from './SpecimenStatusTag'
import { TestPanelColumn } from './TestPanelColumn'
import styles from './WorklistGrid.less'
import { LabResultReportPreview } from './LabResultReportPreview'

const MODALS = {
  NONE: '',
  SPECIMEN_COLLECTION: 'SPECIMEN_COLLECTION',
  SPECIMEN_DETAILS: 'SPECIMEN_DETAILS',
  DISCARD_SPECIMEN: 'DISCARD_SPECIMEN',
  RECEIVE_SPECIMEN: 'RECEIVE_SPECIMEN',
  LAB_REPORT_PREVIEW: 'LAB_REPORT_PREVIEW',
}

const allSpecimenStatuses = Object.values(LAB_SPECIMEN_STATUS)

export const WorklistGrid = ({ labWorklist, clinicSettings }) => {
  const { list: originalWorklist = [] } = labWorklist
  const { setIsAnyWorklistModelOpened } = useContext(WorklistContext)

  const [visits, setVisits] = useState([])
  const [collapsedKeys, setCollapsedKeys] = useState([])
  const [filteredStatuses, setFilteredStatuses] = useState(allSpecimenStatuses)
  const [filteredWorklist, setFilteredWorklist] = useState([])
  const cttestpanel = useCodeTable('cttestpanel')
  const cttestcategory = useCodeTable('cttestcategory')
  const ctspecimentype = useCodeTable('ctspecimentype')
  const dispatch = useDispatch()
  const visitTypes = useVisitTypes()
  const [currentModal, setCurrentModal] = useState({
    modal: MODALS.NONE,
    para: undefined,
  })
  const [discardSpecimenPara, setDiscardSpecimenPara] = useState({
    open: false,
    id: undefined,
  })
  const [receiveSpecimenPara, setReceiveSpecimenPara] = useState({
    open: false,
    id: undefined,
  })
  const [labResultReportPreviewPara, setLabResultReportPreviewPara] = useState({
    open: false,
    visitId: undefined,
  })
  useEffect(() => {
    if (originalWorklist) {
      const currentFilteredWorklist = _(
        originalWorklist.filter(item =>
          filteredStatuses.includes(item.specimenStatusFK),
        ),
      )
        .orderBy('firstOrderDate')
        .value()

      const uniqeVisits = _(
        currentFilteredWorklist.map(item => ({
          key: item.visitFK,
          patientName: item.patientName,
          patientReferenceNo: item.patientReferenceNo,
          visitFK: item.visitFK,
          visitPurposeFK: item.visitPurposeFK,
          doctor:
            (item.doctorTitle ? `${item.doctorTitle} ` : '') + item.doctorName,
          firstOrderDate: _(currentFilteredWorklist)
            .filter(inner => inner.visitFK === item.visitFK)
            .minBy(inner => inner.generateDate).generateDate,
          workitems: currentFilteredWorklist
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
        .orderBy('firstOrderDate')
        .reverse()
        .value()

      setFilteredWorklist(currentFilteredWorklist)
      setVisits(uniqeVisits)
    }
  }, [originalWorklist, filteredStatuses])

  const getSpecimenCountByCategory = visitFK => {
    if (!visitFK || !cttestcategory) return ''
    const specimenCountByCategory = cttestcategory.map(item => ({
      name: item.name,
      incompleteWorkitemCount: _(originalWorklist)
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

  const closeModal = () => {
    setCurrentModal({ modal: MODALS.NONE })
    setIsAnyWorklistModelOpened(false)
  }

  const closeDiscardSpecimen = () => {
    setDiscardSpecimenPara({
      open: false,
      id: undefined,
    })
    setIsAnyWorklistModelOpened(false)
  }

  const closeReceiveSpecimen = () => {
    setReceiveSpecimenPara({
      open: false,
      id: undefined,
    })
    setIsAnyWorklistModelOpened(false)
  }

  const closeLabResultReportPreview = () => {
    setLabResultReportPreviewPara({
      open: false,
      id: undefined,
    })
    setIsAnyWorklistModelOpened(false)
  }

  const expandedRowRender = (record, index, indent, expanded) => {
    const groupedTestPanels = _(
      filteredWorklist
        .filter(item => item.visitFK === record.visitFK)
        .map(item => ({
          ...item,
          firstOrderDate: _(filteredWorklist)
            .filter(innerItem => innerItem.labSpecimenFK === item.labSpecimenFK)
            .minBy(innerItem => innerItem.generateDate).generateDate,
          testCategories: filteredWorklist
            .filter(innerItem => innerItem.labSpecimenFK === item.labSpecimenFK)
            .reduce((prev, cur) => {
              const testCategory = cttestcategory.find(
                item => item.id === cur.testCategoryFK,
              )
              return `${prev ? prev + ', ' : ''}${testCategory?.name}`
            }, ''),
          testPanels: _.uniq(
            filteredWorklist
              .filter(
                innerItem => innerItem.labSpecimenFK === item.labSpecimenFK,
              )
              .map(innerItem => ({
                testPanelFK: innerItem.testPanelFK,
                testPanelName: cttestpanel.find(
                  item => item.id === innerItem.testPanelFK,
                )?.name,
                priority: innerItem.priority,
              })),
          ),
        })),
    )
      .uniqBy('labSpecimenFK')
      .orderBy('firstOrderDate')
      .reverse()
      .value()
    const columns = [
      {
        title: 'Test Category',
        dataIndex: 'testCategories',
        key: 'testCategories',
        ellipsis: true,
        width: 160,
      },
      {
        title: 'Test Panel',
        dataIndex: 'testPanels',
        key: 'testPanels',
        width: 320,
        render: (text, record, index) => {
          return (
            <TestPanelColumn columnWidth={320} testPanels={record.testPanels} />
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
        title: 'First Order Date',
        dataIndex: 'firstOrderDate',
        key: 'firstOrderDate',
        ellipsis: true,
        width: 135,
        render: (text, record, index) =>
          record.firstOrderDate?.format(dateFormatLongWithTimeNoSec),
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
                    Discarded by {record.lastUpdatedClinicianName} at{' '}
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
                <Tooltip title='Open Specimen Details'>
                  <Button
                    onClick={() => {
                      setCurrentModal({
                        modal: MODALS.SPECIMEN_DETAILS,
                        para: record.labSpecimenFK,
                      })
                      setIsAnyWorklistModelOpened(true)
                    }}
                    justIcon
                    color='primary'
                    size='sm'
                  >
                    <UnorderedListOutlined />
                  </Button>
                </Tooltip>
              )}
            {!record.dateReceived &&
              record.specimenStatusFK === LAB_SPECIMEN_STATUS.NEW && (
                <Tooltip title='Receive Specimen'>
                  <Button
                    onClick={() => {
                      setReceiveSpecimenPara({
                        open: true,
                        id: record.labSpecimenFK,
                      })
                      setIsAnyWorklistModelOpened(true)
                    }}
                    justIcon
                    color='primary'
                    size='sm'
                  >
                    <Icon type='flask-empty' />
                  </Button>
                </Tooltip>
              )}
            {record.dateReceived &&
              record.specimenStatusFK === LAB_SPECIMEN_STATUS.NEW && (
                <Tooltip title='Discard Specimen'>
                  <Button
                    onClick={() => {
                      setDiscardSpecimenPara({
                        open: true,
                        id: record.labSpecimenFK,
                      })
                      setIsAnyWorklistModelOpened(true)
                    }}
                    justIcon
                    color='danger'
                    size='sm'
                  >
                    <Icon type='flask-empty' />
                  </Button>
                </Tooltip>
              )}
          </Space>
        ),
      },
    ]

    return (
      <Table
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
              <Typography.Text strong>
                {record.patientName} ({record.patientReferenceNo})
              </Typography.Text>
              <Typography.Text type='secondary'>
                {record.doctor}
              </Typography.Text>
              <VisitTypeTag type={record.visitPurposeFK} />
            </Space>
            <Space>
              <span>{getSpecimenCountByCategory(record.visitFK)}</span>
              <Button
                color='primary'
                onClick={() => {
                  setIsAnyWorklistModelOpened(true)
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
            </Space>
          </div>
        )
      },
    },
  ]
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'start' }}>
        <ExapandCollapseAllButton
          onExpandAllClick={() => setCollapsedKeys([])}
          onCollapseAllClick={() =>
            setCollapsedKeys(visits.map(v => v.visitFK))
          }
        />
        <StatusFilter
          defaultSelection={allSpecimenStatuses}
          counts={_(originalWorklist)
            .groupBy('specimenStatusFK')
            .map(function(items, specimenStatusFK) {
              return {
                status: parseInt(specimenStatusFK),
                count: _.uniqBy(items, 'labSpecimenFK').length,
              }
            })
            .value()}
          style={{
            flexGrow: 1,
            justifyContent: 'end',
            marginBottom: 10,
          }}
          onFilterChange={selected => setFilteredStatuses(selected)}
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
        pagination={false}
        expandIcon={({ expanded, onExpand, record }) =>
          expanded ? (
            <DownOutlined onClick={e => onExpand(record, e)} />
          ) : (
            <RightOutlined onClick={e => onExpand(record, e)} />
          )
        }
      />
      <section style={{ margin: 10, fontStyle: 'italic' }}>
        Note: test panel in{' '}
        <span style={{ color: 'red' }}>red color = urgent </span>; test panel in
        black color = normal
      </section>

      <SpecimenDetails
        id={
          currentModal.modal === MODALS.SPECIMEN_DETAILS
            ? currentModal.para
            : undefined
        }
        onClose={() => {
          closeModal()
        }}
        onConfirm={() => {
          closeModal()
        }}
      />
      <ReceiveSpecimen
        {...receiveSpecimenPara}
        onClose={() => {
          closeReceiveSpecimen()
        }}
        onConfirm={() => {
          closeReceiveSpecimen()
        }}
      />
      <DiscardSpecimen
        {...discardSpecimenPara}
        onClose={() => {
          closeDiscardSpecimen()
        }}
        onConfirm={() => {
          closeDiscardSpecimen()
        }}
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
