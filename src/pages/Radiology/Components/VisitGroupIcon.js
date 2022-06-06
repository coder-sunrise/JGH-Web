import React, { useState } from 'react'
import _ from 'lodash'
import numeral from 'numeral'
import { Typography, Card, Table } from 'antd'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import { Icon, Popover, SizeContainer } from '@/components'
import { queryVisitGroup } from '@/services/queue'

const VisitGroupIcon = props => {
  const { visitGroup, visitFK, isQueueNoDecimal, size = 'md' } = props
  const [visitGroupList, setVisitGroupList] = useState([])
  const visitGroupDetail = () => {
    return (
      <Table
        size='small'
        bordered
        pagination={false}
        dataSource={visitGroupList || []}
        columns={[
          {
            dataIndex: 'queueNo',
            title: 'Q. No.',
            width: 70,
            sortingEnabled: false,
            render: (text, row) => {
              const queueNo =
                !row.queueNo || !row.queueNo.trim().length ? '-' : row.queueNo
              return <div>{queueNo}</div>
            },
          },
          {
            dataIndex: 'name',
            title: 'Name',
            sortingEnabled: false,
          },
          {
            dataIndex: 'gender',
            title: 'Gender',
            width: 70,
            sortingEnabled: false,
          },
          {
            dataIndex: 'age',
            title: 'Age',
            width: 60,
            sortingEnabled: false,
          },
        ]}
      />
    )
  }
  const searchVisitGroup = () => {
    const response = queryVisitGroup({ visitID: visitFK }).then(response => {
      if (response) {
        const visitGroup = _.orderBy(
          (response.data.data || []).map(l => {
            const age = l.dob ? calculateAgeFromDOB(l.dob) : 0
            let gender = '-'
            if (l.genderFK === 1) {
              gender = 'F'
            } else if (l.genderFK === 2) {
              gender = 'M'
            }
            return {
              queueNo: l.queueNo,
              name: l.patientName,
              gender,
              age: `${age} ${age > 1 ? 'Yrs' : 'Yr'}`,
              orderQueueNo: parseFloat(l.queueNo),
            }
          }),
          ['orderQueueNo'],
          ['asc'],
        )
        setVisitGroupList(visitGroup)
      }
    })
  }
  return (
    <SizeContainer size={size}>
      <span>
        <Popover
          icon={null}
          trigger='click'
          placement='right'
          content={<div style={{ width: 400 }}>{visitGroupDetail()}</div>}
        >
          <Icon
            type='family'
            style={{
              color: 'red',
              fontSize: '1.2rem',
              marginLeft: 10,
            }}
            onClick={searchVisitGroup}
          />
        </Popover>
        <span className='baseOnCustomStyle' style={{ marginLeft: 2 }}>
          {visitGroup}
        </span>
      </span>
    </SizeContainer>
  )
}

export default VisitGroupIcon
