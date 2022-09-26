import { IconButton, Popover, Tooltip } from '@/components'
import { createFromIconfontCN } from '@ant-design/icons'
import defaultSettings from '@/defaultSettings'
import { LAB_WORKITEM_STATUS, WORK_ITEM_TYPES_ENUM } from '@/utils/constants'
import { useCodeTable } from '@/utils/hooks'
import New from '@/pages/ClaimSubmission/chas/New'
import React, { useState } from 'react'
import { Badge } from 'antd'
import _ from 'lodash'
import { useDispatch } from 'dva'
import moment from 'moment'
import { CheckCircleOutlined } from '@material-ui/icons'

const LabWorkItemInfo = props => {
  const { workItemSummary, visitFK, style, workItemFK } = props
  const dispatch = useDispatch()
  const [completedWorkItemCount, setCompletedWorkItemCount] = useState(
    workItemSummary.completedWorkItemCount || 0,
  )

  const [totalWorkItemCount, setTotalWorkItemCount] = useState(
    workItemSummary.totalWorkItem || 0,
  )
  const [workItemDetails, setWorkItemDetails] = useState([])

  let IconFont = createFromIconfontCN({
    scriptUrl: defaultSettings.iconfontUrl,
  })

  const getDetails = () => {
    dispatch({
      type: 'queueLog/getWorkItemDetailStatus',
      payload: {
        visitFK: visitFK,
        workItemType: WORK_ITEM_TYPES_ENUM.LAB,
        workItemFK: workItemFK,
      },
    }).then(result => {
      let detailData = result.filter(
        item => item.statusFK !== LAB_WORKITEM_STATUS.CANCELLED,
      )
      const workItemFKArray = _.uniqBy(detailData, 'workitemFK').map(
        t => t.workitemFK,
      )
      _.forEach(detailData, item => {
        ;(item.number = workItemFKArray.indexOf(item.workitemFK) + 1),
          (item.rowspan = detailData.filter(
            t => t.workitemFK === item.workitemFK,
          ).length),
          (item.ishide =
            detailData.indexOf(detailData.find(x => x.id === item.id)) !=
            detailData.indexOf(
              detailData.filter(x => x.workitemFK === item.workitemFK)[0],
            ))
      })
      setWorkItemDetails(detailData)
      setTotalWorkItemCount(detailData.length)
      setCompletedWorkItemCount(
        detailData.filter(t => t.statusFK === LAB_WORKITEM_STATUS.COMPLETED)
          .length,
      )
    })
  }

  const getQueueLabWorkitemStatus = labWorkitem =>
    labWorkitem.statusFK === LAB_WORKITEM_STATUS.NEW ||
    labWorkitem.statusFK === LAB_WORKITEM_STATUS.SPECIMENCOLLECTED ||
    labWorkitem.statusFK === LAB_WORKITEM_STATUS.SPECIMENRECEIVED
      ? 'New'
      : labWorkitem.statusFK === LAB_WORKITEM_STATUS.COMPLETED
      ? 'Completed'
      : 'In Progress'

  return (
    <Popover
      icon={null}
      placement='bottomLeft'
      arrowPointAtCenter
      overlayInnerStyle={{
        maxHeight: 500,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      content={
        <div>
          <h5>Lab Work Item Details</h5>
          <table
            style={{
              fontSize: 14,
              marginTop: 5,
              tableLayout: 'fixed',
              minWidth: 250,
            }}
          >
            <tr style={{ borderBottom: '1px solid #eeeeee' }}>
              <th style={{ width: '35px' }}>No.</th>
              <th style={{ width: '150px' }}>Name</th>
              <th style={{ width: '150px' }}>Instructions</th>
              <th style={{ width: '150px' }}>Remarks</th>
              <th style={{ width: '65px' }}>Priority</th>
              <th style={{ minWidth: '200px' }}>Test Panels</th>
              <th style={{ minWidth: '120px' }}>Status</th>
            </tr>
          </table>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table
              style={{
                fontSize: 14,
                marginTop: 5,
              }}
            >
              <tbody>
                {workItemDetails.map((labWorkitem, index) => (
                  <tr style={{ borderBottom: '1px solid #eeeeee' }}>
                    {!labWorkitem.ishide && (
                      <td
                        rowspan={labWorkitem.rowspan}
                        style={{
                          width: '35px',
                          wordBreak: 'break-word',
                          verticalAlign: 'top',
                        }}
                      >
                        {labWorkitem.number}
                      </td>
                    )}
                    {!labWorkitem.ishide && (
                      <td
                        rowspan={labWorkitem.rowspan}
                        style={{
                          width: '150px',
                          wordBreak: 'break-word',
                          verticalAlign: 'top',
                        }}
                      >
                        {labWorkitem.name || '-'}
                      </td>
                    )}
                    {!labWorkitem.ishide && (
                      <td
                        rowspan={labWorkitem.rowspan}
                        style={{
                          width: '150px',
                          wordBreak: 'break-word',
                          verticalAlign: 'top',
                        }}
                      >
                        {labWorkitem.instructions || '-'}
                      </td>
                    )}
                    {!labWorkitem.ishide && (
                      <td
                        rowspan={labWorkitem.rowspan}
                        style={{
                          width: '150px',
                          wordBreak: 'break-word',
                          verticalAlign: 'top',
                        }}
                      >
                        {labWorkitem.remarks || '-'}
                      </td>
                    )}
                    {!labWorkitem.ishide && (
                      <td
                        rowspan={labWorkitem.rowspan}
                        style={{
                          width: '65px',
                          wordBreak: 'break-word',
                          color:
                            labWorkitem.priority === 'Urgent' ? 'red' : 'black',
                          verticalAlign: 'top',
                        }}
                      >
                        {labWorkitem.priority || 'Normal'}
                      </td>
                    )}
                    <td style={{ width: 200, verticalAlign: 'top' }}>
                      {labWorkitem.testPanelName}
                    </td>
                    <td
                      style={{
                        width: 120,
                        verticalAlign: 'top',
                        wordBreak: 'break-word',
                        color:
                          labWorkitem.statusFK === LAB_WORKITEM_STATUS.COMPLETED
                            ? 'green'
                            : 'black',
                      }}
                    >
                      <span>{getQueueLabWorkitemStatus(labWorkitem)}</span>
                      {labWorkitem.isAcknowledged && (
                        <Tooltip
                          title={`Acknowledged by ${
                            labWorkitem.acknowledgeByUserTitle
                              ? labWorkitem.acknowledgeByUserTitle + '. '
                              : ''
                          }${labWorkitem.acknowledgeBy} on ${moment(
                            labWorkitem.acknowledgeDate,
                          ).format('DD MMM YYYY HH:mm')}`}
                        >
                          <CheckCircleOutlined
                            style={{
                              color: 'green',
                              position: 'relative',
                              top: 3,
                              float: 'right',
                              marginLeft: 10,
                            }}
                          />
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    >
      <div style={{ display: 'inline-block', ...style, marginRight: 15 }}>
        <Badge
          color='red'
          count={completedWorkItemCount}
          style={{ paddingRight: 4, paddingLeft: 4 }}
          size='small'
        >
          <IconButton
            style={{
              position: 'relative',
              top: '0px',
              color: 'white',
              backgroundColor:
                totalWorkItemCount === completedWorkItemCount &&
                totalWorkItemCount > 0
                  ? 'green'
                  : '#4255bd',
            }}
            size='large'
            onClick={getDetails}
          >
            <IconFont type='icon-lab' />
          </IconButton>
        </Badge>
      </div>
    </Popover>
  )
}

export default LabWorkItemInfo
