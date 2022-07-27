import React, { Fragment, useState, useEffect } from 'react'
import { Typography } from 'antd'
import _ from 'lodash'
import ProCard from '@ant-design/pro-card'
import { columns } from '@/pages/Widgets/ClinicalNotes/CannedText/utils'
import { RADIOLOGY_WORKITEM_STATUS } from '@/utils/constants'
import { Empty } from 'antd'

const defaultColumnStyle = {
  height: '100%',
  backgroundColor: 'green',
  borderRadius: 5,
  display: 'flex',
  flexDirection: 'column',
  padding: 1,
  margin: '0px 4px',
}

const columnBodyStyle = {
  backgroundColor: 'white',
  margin: 3,
  flex: '1 1 auto',
  overflow: 'auto',
  height: 0,
  padding: '3px',
}

const WorlklistColumnTitle = ({ title, workItemCount }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 4fr 1fr',
        justifyItems: 'center',
        margin: 5,
      }}
    >
      <Typography.Title
        level={4}
        style={{ color: 'white', gridColumnStart: 2, marginBottom: 5 }}
      >
        {title}
      </Typography.Title>
      <div
        style={{
          padding: '0px 20px',
          alignSelf: 'center',
          backgroundColor: 'white',
          gridColumnStart: 3,
          borderRadius: 10,
        }}
      >
        {workItemCount}
      </div>
    </div>
  )
}

const WorklistColumnBody = ({ data, renderWorkitem, ...restProps }) => {
  let sortedData = data.workitems || []

  return (
    <div style={columnBodyStyle}>
      {sortedData.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      {sortedData.length > 0 &&
        sortedData.map(item => renderWorkitem(item, restProps))}
    </div>
  )
}

export const WorklistColumn = ({
  data,
  renderWorkitem,
  columnPercentage,
  ...restProps
}) => (
  <div
    style={{
      ...defaultColumnStyle,
      backgroundColor: data.backgroundColor,
      width: `${columnPercentage}%`,
      minWidth: 300,
    }}
  >
    <WorlklistColumnTitle
      title={data.title}
      workItemCount={data.workitems.length}
    />
    <WorklistColumnBody
      data={data}
      {...restProps}
      renderWorkitem={renderWorkitem}
    />
  </div>
)
