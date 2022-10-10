import React, { useContext, useEffect, useState } from 'react'
import moment from 'moment'
import { useDispatch } from 'dva'
import { Table } from 'antd'
import { dateFormatLong, Icon, Popover } from '@/components'

const CombineVisitIcon = ({ combineReportGroupFK, placement = 'bottom' }) => {
  const [combineReport, setCombineReport] = useState([])
  const dispatch = useDispatch()
  const queryCombineReport = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/queryCombineReport',
      payload: {
        id: combineReportGroupFK,
      },
    }).then(r => {
      if (r && r.status === '200') {
        setCombineReport(r.data.data)
      } else {
        setCombineReport([])
      }
    })
  }
  return (
    <Popover
      icon={null}
      trigger='click'
      placement={placement}
      content={
        <div style={{ width: 310 }}>
          <Table
            bordered
            size='small'
            pagination={false}
            columns={[
              {
                title: 'No.',
                dataIndex: 'index',
                key: 'index',
                width: 40,
              },
              {
                title: 'Report ID',
                dataIndex: 'reportId',
                key: 'reportId',
                width: 100,
              },
              {
                title: 'Visit Date',
                dataIndex: 'visitDate',
                key: 'visitDate',
                render: (_, row) =>
                  moment(row.visitDate).format(dateFormatLong),
              },
              {
                title: 'Primary',
                dataIndex: 'isPrimary',
                key: 'isPrimary',
                width: 70,
                align: 'center',
                render: (_, row) => <span>{row.isPrimary ? 'YES' : 'NO'}</span>,
              },
            ]}
            dataSource={combineReport.map((item, index) => ({
              ...item,
              index: index + 1,
            }))}
          />
        </div>
      }
    >
      <Icon
        type='link'
        style={{
          color: '#1890f8',
        }}
        onClick={queryCombineReport}
      />
    </Popover>
  )
}
export default CombineVisitIcon
