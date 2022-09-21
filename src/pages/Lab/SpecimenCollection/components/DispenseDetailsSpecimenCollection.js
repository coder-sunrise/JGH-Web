import React, { useState, useEffect } from 'react'
import { useDispatch } from 'umi'
import _, { curry } from 'lodash'
import { Space, Typography, Table } from 'antd'
import PropTypes from 'prop-types'
import TableData from '@/pages/Dispense/DispenseDetails/TableData'
import Authorized from '@/utils/Authorized'
import { UnorderedListOutlined } from '@ant-design/icons'
import { LAB_SPECIMEN_STATUS, LAB_WORKITEM_STATUS } from '@/utils/constants'
import { REPORT_ID } from '@/utils/constants'
import { Link } from '@material-ui/core'
import moment from 'moment'
import {
  Button,
  ProgressButton,
  GridItem,
  GridContainer,
  CommonTableGrid,
  TextField,
  CommonModal,
  NumberInput,
  Popper,
  notification,
  Icon,
  Tooltip,
  dateFormatLongWithTimeNoSec,
} from '@/components'
import { TestPanelColumn } from '../../Worklist/components/TestPanelColumn'
import CollectSpecimen from './CollectSpecimen'
import { useCodeTable } from '@/utils/hooks'
import { DiscardSpecimen } from '../../Worklist/components'
import { SpecimenDetails } from '../../Worklist/SpecimenDetails'
import PrintSpecimenLabel, { usePrintSpecimenLabel } from './PrintSpecimenLabel'
import customtyles from '@/pages/Dispense/DispenseDetails/Style.less'

const DispenseDetailsSpecimenCollection = ({
  visitId,
  handlePrint,
  patient = {},
  classes,
  userId,
  ...restProps
}) => {
  if (!visitId) return ''
  const dispatch = useDispatch()
  const [labSpecimens, setLabSpecimens] = useState([])
  const [newLabWorkitems, setNewLabWorkitems] = useState([])
  const [cancelledLabWorkitems, setCancelledLabWorkitems] = useState([])
  const [collectSpecimenPara, setCollectSpecimenPara] = useState({
    open: false,
    id: undefined,
    mode: 'new',
  })
  const [discardSpecimenPara, setDiscardSpecimenPara] = useState({
    open: false,
    id: undefined,
  })
  const [specimenDetailsPara, setSpecimenDetailsPara] = useState({
    open: false,
    id: undefined,
  })
  const printSpecimenLabel = usePrintSpecimenLabel(handlePrint)

  const columns = [
    {
      title: 'Service Name',
      name: 'serviceName',
    },

    {
      title: 'Test Panels',
      name: 'testPanelNames',
    },
    {
      title: 'Specimen Type',
      name: 'specimenType',
    },
    {
      title: 'Accession No.',
      name: 'accessionNo',
    },
    { name: 'action', title: 'Action' },
  ]

  const columns1 = [
    {
      dataIndex: 'serviceName',
      key: 'serviceName',
      title: 'Service Name',
      width: 300,
    },
    {
      dataIndex: 'testPanelNames',
      width: 910,
      key: 'testPanelNames',
      title: 'Test Panels',
    },
    {
      dataIndex: 'specimenType',
      key: 'specimenType',
      title: 'Specimen Type',
      width: 180,
    },
    {
      dataIndex: 'accessionNo',
      key: 'accessionNo',
      title: 'Accession No.',
      width: 110,
      render: (_, row) => {
        if (row.specimenStatusFK === LAB_SPECIMEN_STATUS.NEW) {
          return Authorized.check('queue.collectspecimen').rights ===
            'enable' ? (
            <Link
              component='button'
              onClick={() => {
                setCollectSpecimenPara({
                  visitId,
                  labSpecimenId: row.labSpecimenFK,
                  open: true,
                  mode: 'edit',
                })
              }}
            >
              {row.accessionNo}
            </Link>
          ) : (
            <div>{row.accessionNo}</div>
          )
        } else if (row.specimenStatusFK === LAB_SPECIMEN_STATUS.DISCARDED) {
          return (
            <Tooltip
              useTooltip2
              title={
                <div>
                  <div>
                    Discarded by {row.specimenDiscardedClinicianName} at{' '}
                    {row.lastUpdatedDate?.format(dateFormatLongWithTimeNoSec)}
                  </div>
                  <div>Reason: {row.specimenDiscardReason}</div>
                </div>
              }
            >
              <div>
                <Typography.Text delete>{row.accessionNo}</Typography.Text>
              </div>
            </Tooltip>
          )
        } else {
          return <span>{row.accessionNo}</span>
        }
      },
    },
    {
      dataIndex: 'action',
      key: 'action',
      title: 'Action',
      width: 120,
      render: (_, row) => (
        <Space size='small' align='center'>
          {Authorized.check('queue.labspecimendetails').rights &&
            Authorized.check('queue.labspecimendetails').rights !== 'hidden' &&
            row.dateReceived &&
            row.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED && (
              <Tooltip title='Lab Specimen Details'>
                <Button
                  onClick={() => {
                    setSpecimenDetailsPara({
                      open: true,
                      id: row.labSpecimenFK,
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
          {row.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED && (
            <PrintSpecimenLabel id={row.labSpecimenFK} />
          )}
          {Authorized.check('queue.discardspecimen').rights === 'enable' &&
            row.specimenStatusFK === LAB_SPECIMEN_STATUS.NEW && (
              <Tooltip title='Discard Specimen'>
                <Button
                  onClick={() => {
                    setDiscardSpecimenPara({
                      open: true,
                      id: row.labSpecimenFK,
                    })
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

  const columnExtensions = [
    {
      columnName: 'specimenType',
      width: 180,
    },
    {
      columnName: 'accessionNo',
      width: 110,
      render: row => {
        if (row.specimenStatusFK === LAB_SPECIMEN_STATUS.NEW) {
          return Authorized.check('queue.collectspecimen').rights ===
            'enable' ? (
            <Link
              component='button'
              onClick={() => {
                setCollectSpecimenPara({
                  visitId,
                  labSpecimenId: row.labSpecimenFK,
                  open: true,
                  mode: 'edit',
                })
              }}
            >
              {row.accessionNo}
            </Link>
          ) : (
            <div>{row.accessionNo}</div>
          )
        } else if (row.specimenStatusFK === LAB_SPECIMEN_STATUS.DISCARDED) {
          return (
            <Tooltip
              useTooltip2
              title={
                <div>
                  <div>
                    Discarded by {row.specimenDiscardedClinicianName} at{' '}
                    {row.lastUpdatedDate?.format(dateFormatLongWithTimeNoSec)}
                  </div>
                  <div>Reason: {row.specimenDiscardReason}</div>
                </div>
              }
            >
              <div>
                <Typography.Text delete>{row.accessionNo}</Typography.Text>
              </div>
            </Tooltip>
          )
        } else {
          return <span>{row.accessionNo}</span>
        }
      },
    },
    {
      columnName: 'action',
      align: 'left',
      width: 120,
      render: row => (
        <Space size='small' align='center'>
          {Authorized.check('queue.labspecimendetails').rights &&
            Authorized.check('queue.labspecimendetails').rights !== 'hidden' &&
            row.dateReceived &&
            row.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED && (
              <Tooltip title='Lab Specimen Details'>
                <Button
                  onClick={() => {
                    setSpecimenDetailsPara({
                      open: true,
                      id: row.labSpecimenFK,
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
          {row.specimenStatusFK !== LAB_SPECIMEN_STATUS.DISCARDED && (
            <PrintSpecimenLabel id={row.labSpecimenFK} />
          )}
          {Authorized.check('queue.discardspecimen').rights === 'enable' &&
            row.specimenStatusFK === LAB_SPECIMEN_STATUS.NEW && (
              <Tooltip title='Discard Specimen'>
                <Button
                  onClick={() => {
                    setDiscardSpecimenPara({
                      open: true,
                      id: row.labSpecimenFK,
                    })
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

  const getVisitSpecimenCollection = () => {
    dispatch({
      type: 'specimenCollection/getVisitSpecimenCollection',
      payload: { id: visitId },
    }).then(result => {
      if (result) {
        setNewLabWorkitems(
          result.labWorkitems.filter(
            lw => lw.statusFK === LAB_WORKITEM_STATUS.NEW,
          ),
        )
        setCancelledLabWorkitems(
          result.labWorkitems.filter(
            lw => lw.statusFK === LAB_WORKITEM_STATUS.CANCELLED,
          ),
        )

        setLabSpecimens(groupWorkitemsBySpecimens(result.specimenLabWorkitems))
      }
    })
  }

  useEffect(() => {
    if (visitId) getVisitSpecimenCollection()
    return () => cleanUpStates()
  }, [visitId])

  const cleanUpStates = () => {
    setLabSpecimens([])
  }

  const closeCollectSpecimen = () => {
    setCollectSpecimenPara({
      open: false,
      visitId: undefined,
      labSpecimenId: undefined,
      mode: 'new',
    })
    getVisitSpecimenCollection()
  }

  const closeDiscardSpecimen = () => {
    setDiscardSpecimenPara({
      open: false,
      id: undefined,
    })
    getVisitSpecimenCollection()
  }

  const closeSpecimenDetails = () => {
    setSpecimenDetailsPara({
      open: false,
      id: undefined,
    })
    getVisitSpecimenCollection()
  }

  const groupWorkitemsBySpecimens = labWorkitems => {
    return _.uniqBy(
      labWorkitems.map(item => {
        const curSpecimenLabWorkitems = labWorkitems.filter(
          innerItem => innerItem.labSpecimenFK === item.labSpecimenFK,
        )

        const serviceName = _(curSpecimenLabWorkitems)
          .sortBy(x => x.serviceName.toLowerCase())
          .uniqBy('serviceName')
          .value()
          .map(x => x.serviceName)
          .join(', ')

        const specimenType = item.specimenTypeName

        const testPanelNames = _.uniq(
          curSpecimenLabWorkitems.map(
            innerItem => innerItem.testPanelName || '',
          ),
        ).join(', ')

        return {
          ...item,
          serviceName,
          specimenType,
          testPanelNames,
        }
      }),
      'labSpecimenFK',
    )
  }

  return (
    <React.Fragment>
      <div className={classes.tableContainer}>
        <div>
          <h5>Lab Specimen Collection</h5>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table
            className={customtyles.table}
            size='small'
            bordered
            pagination={false}
            dataSource={labSpecimens}
            columns={columns1}
          />
        </div>
      </div>
      {false && (
        <TableData
          title='Lab Specimen Collection'
          forceRender
          oddEven={false}
          onSelectionChange={value => {
            handleSelectionChange('Service', value)
          }}
          idPrefix='Service'
          columns={columns}
          colExtensions={columnExtensions}
          data={labSpecimens}
        />
      )}
      {Authorized.check('queue.collectspecimen').rights === 'enable' &&
        newLabWorkitems &&
        newLabWorkitems.length > 0 && (
          <Link
            component='button'
            style={{ marginLeft: 10, textDecoration: 'underline' }}
            onClick={() => {
              setCollectSpecimenPara({
                open: true,
                visitId,
                labSpecimenId: undefined,
                mode: 'new',
              })
            }}
          >
            Collect Specimen
          </Link>
        )}
      {Authorized.check('queue.cancellabtestpanel')?.rights === 'enable' &&
        [...newLabWorkitems, ...cancelledLabWorkitems].length > 0 && (
          <Link
            component='button'
            style={{ marginLeft: 10, textDecoration: 'underline' }}
            onClick={() => {
              setCollectSpecimenPara({
                open: true,
                visitId,
                labSpecimenId: undefined,
                mode: 'cancel',
              })
            }}
          >
            Cancel Test Panel
          </Link>
        )}
      <CollectSpecimen
        {...collectSpecimenPara}
        onConfirm={(newId, printInfo) => {
          if (printInfo?.isPrintLabel) {
            printSpecimenLabel(newId, printInfo.copies)
          }
          closeCollectSpecimen()
        }}
        onClose={() => {
          closeCollectSpecimen()
        }}
        userId={userId}
      ></CollectSpecimen>
      <DiscardSpecimen
        {...discardSpecimenPara}
        onClose={() => {
          closeDiscardSpecimen()
        }}
        patient={patient}
        onConfirm={() => {
          closeDiscardSpecimen()
        }}
      />
      <SpecimenDetails
        {...specimenDetailsPara}
        onClose={() => {
          closeSpecimenDetails()
        }}
        onConfirm={() => {
          closeSpecimenDetails()
        }}
        isDisposePatientEntity={false}
        isReadonly={true}
        hideIfFromOrder={true}
      />
    </React.Fragment>
  )
}

DispenseDetailsSpecimenCollection.propTypes = {
  visitId: PropTypes.number.isRequired,
}

export default DispenseDetailsSpecimenCollection
