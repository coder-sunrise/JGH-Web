import { IconButton, Popover } from '@/components'
import { FileDoneOutlined } from '@ant-design/icons'
import { NURSE_WORKITEM_STATUS, WORK_ITEM_TYPES_ENUM } from '@/utils/constants'
import React, { useState } from 'react'
import { Badge } from 'antd'
import { useDispatch } from 'dva'

const NurseWorkItemInfo = props => {
  const { workItemSummary, visitFK } = props
  const dispatch = useDispatch()
  const [completedWorkItemCount, setCompletedWorkItemCount] = useState(
    workItemSummary.completedWorkItemCount || 0,
  )
  const [realCompletedWorkItemCount, setRealCompletedWorkItemCount] = useState(
    workItemSummary.realCompletedWorkItemCount || 0,
  )
  const [totalWorkItemCount, setTotalWorkItemCount] = useState(
    workItemSummary.totalWorkItem || 0,
  )
  const [workItemDetails, setWorkItemDetails] = useState([])
  let sortedWorkItem = []
  const sortedDateWorkedItem = []

  const getDetails = () => {
    dispatch({
      type: 'queueLog/getWorkItemDetailStatus',
      payload: {
        visitFK: visitFK,
        workItemType: WORK_ITEM_TYPES_ENUM.NURSEACTUALIZE,
      },
    }).then(detailData => {
      setWorkItemDetails(detailData)
      setTotalWorkItemCount(detailData.length)
      setCompletedWorkItemCount(
        detailData.filter(
          t =>
            t.statusFK === NURSE_WORKITEM_STATUS.ACTUALIZED ||
            t.statusFK === NURSE_WORKITEM_STATUS.CANCELLED,
        ).length,
      )
      setRealCompletedWorkItemCount(
        detailData.filter(t => t.statusFK === NURSE_WORKITEM_STATUS.ACTUALIZED)
          .length,
      )
    })
  }

  const nurseWorkItemDetails = (row = []) => {
    if (row.length == 0) return
    let number = 0
    return row.map(nurseWorkitem => {
      number += 1
      return (
        <tr style={{ borderBottom: '1px solid #eeeeee' }}>
          <td
            style={{
              width: '35px',
              verticalAlign: 'top',
              wordBreak: 'break-word',
            }}
          >
            {number}
          </td>
          <td
            style={{
              width: '200px',
              verticalAlign: 'top',
              wordBreak: 'break-word',
            }}
          >
            {nurseWorkitem.name || '-'}
          </td>
          <td
            style={{
              width: '200px',
              verticalAlign: 'top',
              wordBreak: 'break-word',
            }}
          >
            {nurseWorkitem.instructions || '-'}
          </td>
          <td
            style={{
              width: '200px',
              verticalAlign: 'top',
              wordBreak: 'break-word',
            }}
          >
            {nurseWorkitem.remarks || '-'}
          </td>
          <td
            style={{
              width: '65px',
              verticalAlign: 'top',
              wordBreak: 'break-word',
              color: nurseWorkitem.priority === 'Urgent' ? 'red' : 'black',
            }}
          >
            {nurseWorkitem.priority || 'Normal'}
          </td>
          <td
            style={{
              width: '120px',
              wordBreak: 'break-word',
              verticalAlign: 'top',
              color:
                nurseWorkitem.statusFK === NURSE_WORKITEM_STATUS.ACTUALIZED
                  ? 'green'
                  : 'black',
            }}
          >
            {nurseWorkitem.status}
          </td>
        </tr>
      )
    })
  }

  return (
    <Popover
      icon={null}
      placement='bottomLeft'
      overlayInnerStyle={{
        maxHeight: 500,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      arrowPointAtCenter
      content={
        <div>
          <h5>Nurse Work Item Details</h5>
          <table
            style={{
              fontWeight: 'bold',
              fontSize: 14,
              marginTop: 5,
            }}
          >
            <tr style={{ borderBottom: '1px solid #eeeeee' }}>
              <th style={{ width: '35px' }}>No.</th>
              <th style={{ width: '200px' }}>Name</th>
              <th style={{ width: '200px' }}>Instructions</th>
              <th style={{ width: '200px' }}>Remarks</th>
              <th style={{ width: '65px' }}>Priority</th>
              <th style={{ width: '120px' }}>Status</th>
            </tr>
          </table>

          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <table
              style={{
                fontSize: 14,
                marginTop: 5,
              }}
            >
              {nurseWorkItemDetails(workItemDetails)}
            </table>
          </div>
        </div>
      }
    >
      <div style={{ display: 'inline-block', marginRight: 15 }}>
        <Badge
          color='red'
          count={realCompletedWorkItemCount}
          style={{ paddingRight: 4, paddingLeft: 4 }}
          size='small'
        >
          <IconButton
            style={{
              position: 'relative',
              color: 'white',
              backgroundColor:
                totalWorkItemCount === completedWorkItemCount
                  ? 'green'
                  : '#4255bd',
            }}
            onClick={getDetails}
            size='large'
          >
            <FileDoneOutlined />
          </IconButton>
        </Badge>
      </div>
    </Popover>
  )
}

export default NurseWorkItemInfo
