import React, { Fragment, useState, useEffect } from 'react'
import { Typography, Card } from 'antd'
import ProCard from '@ant-design/pro-card'
import { Icon } from '@/components'
import { WorklistColumn } from './WorklistColumn'
import PharmacyWorkItem from './PharmacyWorkItem'
export const Worklist = ({ columns, partialPreparedChecked, ...restProps }) => {
  const [columnPercentage, setColumnPercentage] = useState(100)
  useEffect(() => {
    if (columns) {
      setColumnPercentage(100 / columns.length)
    }
  }, [columns])
  window.mapped = columns

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {(columns || []).map((column, index) => (
        <WorklistColumn
          columnPercentage={columnPercentage}
          data={column}
          renderWorkitem={item => {
            if (partialPreparedChecked && item.status === 'New') {
              return
            } else {
              if (item.isFullyDispensed && partialPreparedChecked) {
                return
              }
            }
            return <PharmacyWorkItem item={item} {...restProps} />
          }}
          {...restProps}
          partialPreparedChecked={partialPreparedChecked}
        />
      ))}
    </div>
  )
}
