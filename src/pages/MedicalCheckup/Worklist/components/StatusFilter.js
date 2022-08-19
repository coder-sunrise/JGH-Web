import React, { useState, useContext, useEffect } from 'react'
import { CheckSquareFilled } from '@ant-design/icons'
import { TagWithCount } from '@/components/_medisys'
import {
  MEDICALCHECKUP_WORKITEM_STATUS,
  MEDICALCHECKUP_WORKITEM_STATUS_ALL_COLOR,
  MEDICALCHECKUP_WORKITEM_STATUSES,
} from '@/utils/constants'

const ALL_STATUS_VALUE = -99
const allMedicalCheckupReportStatuses = Object.values(
  MEDICALCHECKUP_WORKITEM_STATUS,
)

const getStatusColor = statusId =>
  MEDICALCHECKUP_WORKITEM_STATUSES.find(x => x.id === statusId).color
const getStatusLabel = statusId =>
  MEDICALCHECKUP_WORKITEM_STATUSES.find(x => x.id === statusId).label
const getStatusDescription = statusId =>
  MEDICALCHECKUP_WORKITEM_STATUSES.find(x => x.id === statusId).description

export const StatusFilter = ({
  counts,
  style,
  onFilterChange,
  selectedStatus = [],
}) => {
  const handleTagClick = status => {
    let newSelectedStatus

    if (status === ALL_STATUS_VALUE) {
      {
        newSelectedStatus =
          selectedStatus.length === allMedicalCheckupReportStatuses.length
            ? []
            : [...allMedicalCheckupReportStatuses]
      }
    } else
      newSelectedStatus = selectedStatus.includes(status)
        ? selectedStatus.filter(item => item !== status)
        : [...selectedStatus, status]

    onFilterChange && onFilterChange(newSelectedStatus)
  }

  return (
    <div style={{ display: 'flex', ...style }}>
      <TagWithCount
        checked={
          selectedStatus.length === allMedicalCheckupReportStatuses.length
        }
        tagColor={MEDICALCHECKUP_WORKITEM_STATUS_ALL_COLOR}
        label='All'
        tooltip='All'
        count={counts.reduce((prev, cur) => prev + cur.count, 0)}
        onClick={() => {
          handleTagClick(ALL_STATUS_VALUE)
        }}
      />

      {allMedicalCheckupReportStatuses.map((status, index) => (
        <TagWithCount
          key={index}
          tagColor={getStatusColor(status)}
          label={getStatusLabel(status)}
          tooltip={getStatusDescription(status)}
          checked={selectedStatus.includes(status)}
          count={counts.filter(item => item.status === status).length}
          onClick={() => {
            handleTagClick(status)
          }}
        />
      ))}
    </div>
  )
}
