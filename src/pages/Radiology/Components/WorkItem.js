import React, { Fragment, useState, useEffect, useContext } from 'react'
import { Typography, Card } from 'antd'
import ProCard from '@ant-design/pro-card'
import moment from 'moment'
import { useSelector } from 'dva'
import numeral from 'numeral'
import { Icon, dateFormatLongWithTimeNoSec, Tooltip } from '@/components'
import {
  VISIT_TYPE,
  VISIT_TYPE_NAME,
  RADIOLOGY_WORKITEM_STATUS,
  RADIOLOGY_WORKLIST_STATUS_COLOR,
  GENDER,
} from '@/utils/constants'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import WorklistContext from '../Worklist/WorklistContext'
import CombinedOrderIcon from './CombinedOrderIcon'
import VisitGroupIcon from './VisitGroupIcon'

const blueColor = '#1890f8'
const statusUpdateDateTooltip = {
  1: '', //No tooltip is needed as new status only have order create date.
  2: 'Examination Started Time',
  3: 'Modality Completed Time',
  4: 'Reporting Completed Time',
  5: 'Cancelled Time',
}

const EmptyDiv = () => <div>&nbsp;</div>

const WorkitemLeftLabel = ({
  children,
  tooltip,
  width = 120,
  style,
  ...props
}) => (
  <Tooltip title={tooltip}>
    <div
      style={{
        textOverflow: 'ellipsis',
        width: width,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  </Tooltip>
)

const WorkitemTitle = ({ item }) => {
  const age = calculateAgeFromDOB(item.patientInfo.dob)
  const gender = item.patientInfo.genderFK === GENDER.MALE ? 'male' : 'female'

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        fontSize: '0.9rem',
        borderBottom: '#cdcdcd solid 1px',
        padding: 8,
      }}
    >
      <div
        style={{
          marginRight: 'auto',
        }}
      >
        <WorkitemLeftLabel
          width={180}
          tooltip={item.patientInfo.name}
          style={{ color: blueColor, fontWeight: 500 }}
        >
          {item.patientInfo.name}
        </WorkitemLeftLabel>
        <WorkitemLeftLabel
          width={180}
          tooltip={item.patientInfo.patientReferenceNo}
        >
          {item.patientInfo.patientReferenceNo}
        </WorkitemLeftLabel>
      </div>
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <div>
          <Tooltip title={gender}>
            <span>
              <Icon
                type={gender}
                style={{
                  color:
                    item.patientInfo.genderFK === GENDER.MALE
                      ? blueColor
                      : 'red',
                  fontSize: 15,
                }}
              />
            </span>
          </Tooltip>
          {age} {age === 1 ? 'Yr' : 'Yrs'}
        </div>

        <div
          style={{
            textOverflow: 'ellipsis',
            width: 80,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {item.patientInfo.patientAccountNo}
        </div>
      </div>
    </div>
  )
}

const WorkitemBody = ({ item }) => {
  const { setDetailsId, visitPurpose } = useContext(WorklistContext)
  const orderDate = moment(item.generateDate).format(
    dateFormatLongWithTimeNoSec,
    false,
  )
  const statusUpdateDate = moment(item.statusUpdateDate).format(
    dateFormatLongWithTimeNoSec,
    false,
  )

  const clinicSettings = useSelector(s => s.clinicSettings)
  const { isQueueNoDecimal } = clinicSettings.settings || {}
  const queueNo =
    !item.visitInfo.queueNo || !item.visitInfo.queueNo.trim().length
      ? '-'
      : numeral(item.visitInfo.queueNo).format(isQueueNoDecimal ? '0.0' : '0')
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        fontSize: '0.9rem',
        lineHeight: '1.8rem',
        padding: 8,
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
        }}
      >
        <div style={{ marginRight: 'auto', flexGrow: 1 }}>
          <WorkitemLeftLabel
            style={{ fontWeight: 500 }}
            tooltip={item.itemDescription}
          >
            {item.itemDescription}
          </WorkitemLeftLabel>
          <WorkitemLeftLabel>
            <Tooltip title={item.accessionNo}>
              <span>{item.accessionNo}</span>
            </Tooltip>
            {item.primaryWorkitemFK && (
              <CombinedOrderIcon workitemId={item.radiologyWorkitemId} />
            )}
          </WorkitemLeftLabel>
          <WorkitemLeftLabel tooltip={item.visitInfo.doctorName}>
            {item.visitInfo.doctorName}
          </WorkitemLeftLabel>
          <WorkitemLeftLabel tooltip='Order Created Time'>
            {orderDate}
          </WorkitemLeftLabel>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div>Q.No.: {queueNo}</div>

          {item.visitInfo.visitGroup ? (
            <div>
              <VisitGroupIcon
                visitGroup={item.visitInfo.visitGroup}
                visitFK={item.visitFK}
                isQueueNoDecimal={isQueueNoDecimal}
              />
            </div>
          ) : (
            <EmptyDiv />
          )}
          <EmptyDiv />
          {item.statusFK !== RADIOLOGY_WORKITEM_STATUS.NEW && (
            <Tooltip title={statusUpdateDateTooltip[`${item.statusFK}`]}>
              <div
                style={{
                  color: RADIOLOGY_WORKLIST_STATUS_COLOR[`${item.statusFK}`],
                }}
              >
                {statusUpdateDate}
              </div>
            </Tooltip>
          )}
        </div>
      </div>
      <div
        style={{
          color: blueColor,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
        }}
      >
        <Typography.Text
          underline
          style={{
            cursor: 'pointer',
            gridColumnStart: 1,
            gridColumnEnd: 2,
            textAlign: 'left',
          }}
          onClick={() => {
            setDetailsId(item.radiologyWorkitemId)
          }}
        >
          Details
        </Typography.Text>
        {item.priority === 'Urgent' && (
          <div
            style={{
              color: 'red',
              gridColumnStart: 2,
              gridColumnEnd: 3,
              display: 'flex',
            }}
          >
            <Icon
              type='thunder'
              style={{ fontSize: 15, color: 'red', alignSelf: 'center' }}
            />
            URGENT
          </div>
        )}

        <span
          style={{
            gridColumnStart: 3,
            gridColumnEnd: 4,
            justifySelf: 'center',
          }}
        >
          {visitPurpose &&
            item?.visitInfo &&
            visitPurpose.find(p => p.id === item.visitInfo.visitPurposeFK).code}
        </span>
      </div>
    </div>
  )
}

export const Workitem = item => (
  <div
    key={item.radiologyWorkitemId}
    style={{
      height: 220,
      margin: '10px 5px',
      borderRadius: 10,
      backgroundColor:
        ((item.isNurseActualized || !item.isNurseActualizeRequired) &&
          item.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW) ||
        item.statusFK === RADIOLOGY_WORKITEM_STATUS.INPROGRESS
          ? '#d3fed1'
          : 'white',
      border: '#cdcdcd solid 2px',
    }}
  >
    <WorkitemTitle item={item} />
    <WorkitemBody item={item} />
  </div>
)
