import React, { Fragment, useState, useEffect, useContext, useRef } from 'react'
import { Typography, Card } from 'antd'
import ProCard from '@ant-design/pro-card'
import moment from 'moment'
import { useSelector } from 'dva'
import numeral from 'numeral'
import { getNameWithTitle } from '@/utils/utils'
import { useVisitTypes } from '@/utils/hooks/'
import { Icon, dateFormatLongWithTimeNoSec, Tooltip } from '@/components'
import {
  VISIT_TYPE,
  VISIT_TYPE_NAME,
  RADIOLOGY_WORKITEM_STATUS,
  RADIOLOGY_WORKLIST_STATUS_COLOR,
  GENDER,
  MODALITY_STATUS,
} from '@/utils/constants'
import { calculateAgeFromDOB } from '@/utils/dateUtils'
import WorklistContext from '../Worklist/WorklistContext'
import CombinedOrderIcon from './CombinedOrderIcon'
import VisitGroupIcon from './VisitGroupIcon'
import ModalityStatusIcon from './ModalityStatusIcon'
import { CallingQueueButton } from '@/components/_medisys'
const blueColor = '#1890f8'
const statusUpdateDateTooltip = {
  1: '', //No tooltip is needed as new status only have order create date.
  2: 'Examination Started Time',
  3: 'Modality Completed Time',
  4: 'Reporting Completed Time',
  5: 'Cancelled Time',
}

const EmptyDiv = () => <div>&nbsp;</div>

const LeftLabel = ({ children, tooltip, style, ...restProps }) => (
  <Tooltip title={tooltip}>
    <div
      style={{
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        ...style,
      }}
      {...restProps}
    >
      {children}
    </div>
  </Tooltip>
)

const WorkitemRow = ({ children, rowStyle, ...restProps }) => (
  <div style={{ display: 'flex', ...rowStyle }} {...restProps}>
    {children}
  </div>
)

const RightLabel = ({ children, width, style, ...restProps }) => (
  <div
    style={{
      marginLeft: 'auto',
      textAlign: 'right',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width,
      ...style,
    }}
    {...restProps}
  >
    {children}
  </div>
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
        flexDirection: 'column',
      }}
    >
      <WorkitemRow>
        <LeftLabel
          tooltip={item.patientInfo.name}
          style={{ color: blueColor, fontWeight: 500 }}
        >
          {item.patientInfo.name}
        </LeftLabel>
        <RightLabel width={100}>
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
        </RightLabel>
      </WorkitemRow>
      <WorkitemRow>
        <LeftLabel tooltip={item.patientInfo.patientReferenceNo}>
          {item.patientInfo.patientReferenceNo}
        </LeftLabel>
        {item.statusFK === RADIOLOGY_WORKITEM_STATUS.INPROGRESS &&
          (item.modalityStatusFK === MODALITY_STATUS.PENDING ||
            item.modalityStatusFK === MODALITY_STATUS.FAILED) && (
            <ModalityStatusIcon itemModalityStatusFK={item.modalityStatusFK} />
          )}
        <RightLabel width={150}>{item.patientInfo.patientAccountNo}</RightLabel>
      </WorkitemRow>
    </div>
  )
}

const WorkitemBody = ({ item }) => {
  const { setDetailsId, visitTypes } = useContext(WorklistContext)
  const { visitInfo } = item
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
      : item.visitInfo.queueNo
  const doctorName = getNameWithTitle(
    visitInfo.doctorTitle,
    visitInfo.doctorName,
  )

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
      <WorkitemRow>
        <LeftLabel style={{ fontWeight: 500 }} tooltip={item.itemDescription}>
          {item.itemDescription}
        </LeftLabel>
      </WorkitemRow>

      <WorkitemRow>
        <LeftLabel>
          <Tooltip title={item.accessionNo}>
            <span>{item.accessionNo}</span>
          </Tooltip>
          {item.primaryWorkitemFK && (
            <CombinedOrderIcon workitemId={item.radiologyWorkitemId} />
          )}
        </LeftLabel>
        <RightLabel width={120}>Q. No.: {queueNo}</RightLabel>
      </WorkitemRow>

      <WorkitemRow>
        <LeftLabel tooltip={doctorName}>{doctorName}</LeftLabel>

        {item.visitInfo.visitGroup && (
          <RightLabel width={100}>
            <VisitGroupIcon
              visitGroup={item.visitInfo.visitGroup}
              visitFK={item.visitFK}
              isQueueNoDecimal={isQueueNoDecimal}
              size='sm'
            />
          </RightLabel>
        )}
      </WorkitemRow>

      <WorkitemRow>
        <LeftLabel tooltip='Order Created Time' style={{ width: 140 }}>
          {orderDate}
        </LeftLabel>
        <RightLabel width={140}>
          {item.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW && (
            <Tooltip title='Appointment Time'>
              <div
                style={{
                  color: 'rgb(0, 153, 51)',
                }}
              >
                {item.appointmentTime}
              </div>
            </Tooltip>
          )}
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
        </RightLabel>
      </WorkitemRow>

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
          {visitTypes &&
            visitTypes.length > 0 &&
            item?.visitInfo &&
            visitTypes.find(p => p.id === item.visitInfo.visitPurposeFK).code}
        </span>

        {item.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW && (
          <span
            style={{
              display: 'flex',
              float: 'right',
              marginLeft: 50,
            }}
          >
            <CallingQueueButton
              qId={queueNo}
              patientName={item.patientInfo.name}
              from='Radiology'
            />
          </span>
        )}
      </div>
    </div>
  )
}

export const Workitem = (item, style) => {
  const { setDetailsId } = useContext(WorklistContext)
  return (
    <div
      onDoubleClick={() => {
        setDetailsId(item.radiologyWorkitemId)
      }}
      key={item.radiologyWorkitemId}
      style={{
        borderRadius: 10,
        backgroundColor:
          (item.isNurseActualized || !item.isNurseActualizeRequired) &&
          (item.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW ||
            item.statusFK === RADIOLOGY_WORKITEM_STATUS.INPROGRESS)
            ? '#d3fed1'
            : 'white',
        border: '#cdcdcd solid 2px',
        ...style,
      }}
    >
      <WorkitemTitle item={item} />
      <WorkitemBody item={item} />
    </div>
  )
}
