import React, { useState, useEffect, useRef } from 'react'
import {
  Space,
  Collapse,
  InputNumber,
  Typography,
  Table,
  Checkbox,
  Form,
} from 'antd'
import {
  Icon,
  dateFormatLongWithTimeNoSec,
  DatePicker,
  Select,
  CommonModal,
  NumberInput,
  GridContainer,
  GridItem,
  Button,
} from '@/components'
import Print from '@material-ui/icons/Print'
import { VisitTypeTag } from '@/components/_medisys'
import { SpecimenStatusTag } from '../../components/SpecimenStatusTag'
import { TestPanelColumn } from '../../components/TestPanelColumn'
import { useCodeTable } from '@/utils/hooks'
import { LAB_SPECIMEN_STATUS, PRIORITY_VALUES } from '@/utils/constants'
import PrintSpecimenLabel from '@/pages/Lab/SpecimenCollection/components/PrintSpecimenLabel'
import Edit from '@material-ui/icons/Edit'
import { history } from 'umi'

export const HeaderInfo = ({ entity, toggleEditSpecimenModal }) => {
  const cttestcategory = useCodeTable('cttestcategory')
  const ctspecimentype = useCodeTable('ctspecimentype')
  const cttestpanel = useCodeTable('cttestpanel')

  const specimenInfoColumns = [
    {
      title: 'Accession No.',
      dataIndex: 'accessionNo',
      key: 'accessionNo',
      width: 120,
    },
    {
      title: 'Category',
      dataIndex: 'testCategories',
      key: 'testCategories',
      width: 210,
    },
    {
      title: 'Specimen Type',
      width: 150,
      dataIndex: 'specimenTypeFK',
      key: 'specimenTypeFK',
      render: (text, record, index) => {
        const speicmenType = ctspecimentype.find(
          item => record.specimenTypeFK === item.id,
        )

        return speicmenType ? speicmenType.name : ''
      },
    },
    {
      title: 'Status',
      dataIndex: 'specimenStatusFK',
      key: 'specimenStatusFK',
      width: 100,
      align: 'center',
      render: (text, record, index) => <SpecimenStatusTag statusId={text} />,
    },
    {
      title: 'Action',
      width: 85,
      dataIndex: 'operation',
      key: 'operation',
      align: 'center',
      render: (text, record, index) => <PrintSpecimenLabel id={entity.id} />,
    },
  ]

  const orderInfoColumns = [
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 160,
    },

    {
      title: 'Test Panel',
      dataIndex: 'testPanel',
      key: 'testPanel',
      width: 200,
      render: (text, record, index) => {
        const testPanels = record.labWorkitems.map(item => {
          const currentTestPanel = cttestpanel.find(
            testPanel => testPanel.id === item.testPanelFK,
          )
          return {
            priority: item.priority,
            testPanelName: currentTestPanel?.displayValue,
            sortOrder: currentTestPanel?.sortOrder,
            testPanelFK: item.testPanelF,
          }
        })

        return <TestPanelColumn testPanels={testPanels} />
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: text => {
        return text === PRIORITY_VALUES.URGENT ? (
          <span style={{ color: 'red' }}> {text}</span>
        ) : (
          text
        )
      },
    },
    {
      title: 'Ordered Date',
      dataIndex: 'orderedDate',
      key: 'orderedDate',
      width: 150,
      render: (text, record, index) => text.format(dateFormatLongWithTimeNoSec),
    },

    {
      title: 'Instructions',
      dataIndex: 'instruction',
      key: 'instruction',
      width: 120,
      render: text => (text ? text : '-'),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 120,
      render: text => (text ? text : '-'),
    },
  ]

  return (
    <GridContainer>
      <GridItem md={8} style={{ paddingTop: 16 }}>
        <Typography.Text strong>Specimen Details </Typography.Text>
        &#x3000;
        {entity.specimenStatusFK != LAB_SPECIMEN_STATUS.COMPLETED &&
          history.location.pathname.includes('lab') && (
            <Button
              size='sm'
              onClick={() => {
                toggleEditSpecimenModal('Edit Specimen')
              }}
              justIcon
              color='primary'
            >
              <Edit />
            </Button>
          )}
      </GridItem>
      <GridItem md={4} style={{ padding: 8, textAlign: 'right' }}>
        <VisitTypeTag type={entity.visitPurposeFK} />
      </GridItem>
      <GridItem md={12} style={{ padding: 8 }}>
        <Table
          bordered
          columns={specimenInfoColumns}
          dataSource={[entity]}
          pagination={false}
          size='small'
        />
      </GridItem>
      <GridItem md={12} style={{ paddingTop: 16 }}>
        <Typography.Text strong>Order Details </Typography.Text>
      </GridItem>
      <GridItem md={12} style={{ padding: 8 }}>
        <Table
          bordered
          columns={orderInfoColumns}
          dataSource={[...(entity.specimenOrders ?? [])].sort((a, b) =>
            a.priority === b.priority
              ? a.orderedDate < b.orderedDate
                ? -1
                : 1
              : a.priority === PRIORITY_VALUES.URGENT
              ? -1
              : 1,
          )}
          pagination={false}
          size='small'
        />
      </GridItem>
    </GridContainer>
  )
}
