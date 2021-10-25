import React, { useState, useEffect, useContext } from 'react'
import { useDispatch } from 'dva'
import _ from 'lodash'
import { Typography, Card, Table } from 'antd'
import { Icon, Popover } from '@/components'
import WorklistContext from '../Worklist/WorklistContext'

const blueColor = '#1890f8'

const CombinedOrderIcon = ({ workitemId, ...restProps }) => {
  const [combinedOrders, setCombinedOrders] = useState([])
  const dispatch = useDispatch()
  const { getCombinedOrders } = useContext(WorklistContext)

  useEffect(() => {
    return setCombinedOrders([])
  }, [])

  const fetchCombinedOrders = () => {
    dispatch({
      type: 'radiologyDetails/query',
      payload: { id: workitemId },
    }).then(workitem => {
      if (workitem) {
        console.log('getCombinedOrders', getCombinedOrders(workitem))
        setCombinedOrders(getCombinedOrders(workitem))
      }
    })
  }

  const CombinedOrderTable = () => {
    return combinedOrders.length > 0 ? (
      <Table
        size='small'
        bordered
        pagination={false}
        dataSource={combinedOrders}
        columns={[
          {
            title: 'No.',
            width: 70,
            sortingEnabled: false,
            render: (text, row, index) => {
              return <div>{index + 1}</div>
            },
          },
          {
            dataIndex: 'accessionNo',
            title: 'Accession No.',
            width: 100,
            sortingEnabled: false,
          },
          {
            dataIndex: 'itemDescription',
            title: 'Examination',
            width: 70,
            sortingEnabled: false,
          },
          {
            title: 'Primary',
            width: 70,
            sortingEnabled: false,
            align: 'center',
            render: (text, row, index) => {
              return index === 0 ? 'Yes' : 'No'
            },
          },
        ]}
      />
    ) : (
      <React.Fragment />
    )
  }

  return (
    <span>
      <Popover
        icon={null}
        trigger='click'
        placement='right'
        content={
          <div style={{ width: 400 }}>
            <CombinedOrderTable />
          </div>
        }
      >
        <Icon
          type='link'
          style={{ fontSize: 18, color: blueColor, alignSelf: 'center' }}
          onClick={() => fetchCombinedOrders()}
        />
      </Popover>
      <span style={{ marginLeft: 2 }}></span>
    </span>
  )
}
export default CombinedOrderIcon