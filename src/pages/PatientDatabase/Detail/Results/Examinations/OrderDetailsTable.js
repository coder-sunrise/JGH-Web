import { Table } from 'antd'
import { useState } from 'react'
import { useEffect } from 'react'
import { Checkbox } from '@/components'
import moment from 'moment'

export const OrderDetailsTable = props => {
  const { data } = props
  const defaultColumns = [
    {
      title: '#',
      align: 'center',
      width: 40,
      dataIndex: 'ServiceName',
      render: (text, row, index) => {
        return <span>{index + 1}</span>
      },
    },
    {
      title: 'Service',
      dataIndex: 'ServiceName',
      width: 200,
    },
    {
      title: 'Test Panel',
      dataIndex: 'TestPanels',
    },
    {
      title: 'Priority',
      width: 100,
      dataIndex: 'Priority',
    },
    {
      title: 'Order Date',
      dataIndex: 'CreateDate',
      width: 150,
      render: text => {
        return <span>{moment(text).format('DD MMM YYYY HH:mm')}</span>
      },
    },
    {
      title: 'Instructions',
      width: 300,
      dataIndex: 'Instruction',
      render: (text, row, index) => {
        return <span>{text ? text : '-'}</span>
      },
    },
    {
      title: 'Remarks',
      width: 300,
      dataIndex: 'Remark',
      render: (text, row, index) => {
        return <span>{text ? text : '-'}</span>
      },
    },
  ]
  const [columns, setColumns] = useState(defaultColumns)
  const { doctorName = '', doctorTitle = '' } = data
  const visitDoctor = `${
    doctorTitle.trim().length ? doctorTitle + '. ' : ''
  }${doctorName}`
  return (
    <div>
      <Table
        className='customizedAntTable'
        columns={columns}
        pagination={false}
        dataSource={data.orderDetails}
        bordered
        size='small'
        title={() => {
          return (
            <p style={{ marginTop: 10 }}>
              <span
                style={{
                  display: 'inline-block',
                  color: '#4255bd',
                  fontWeight: '500',
                  fontSize: 14,
                }}
              >
                Order Details
              </span>
              <span style={{ marginLeft: 10 }}>{'Visit Doctor: '}</span>
              <span>{visitDoctor}</span>
            </p>
          )
        }}
      />
    </div>
  )
}
