import React, { Component, Fragment } from 'react'
import { connect } from 'umi'
import { Space, Card } from 'antd'
import { WorklistFilter } from './WorklistFilter'
import WorklistGrid from './WorklistGrid'

export const Worklist = props => {
  return (
    <Card>
      <Space
        style={{
          width: '100%',
        }}
        direction='vertical'
      >
        <WorklistFilter {...props} />
        <WorklistGrid {...props} />
      </Space>
    </Card>
  )
}
