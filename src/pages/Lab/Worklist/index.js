import React, { Component, Fragment } from 'react'
import { connect } from 'umi'
import { Space, Card, Tabs } from 'antd'
import { Worklist } from './components/Worklist'

import { WorklistContextProvider } from './Specimen/WorklistContext'

const LabWorklist = props => {
  const { TabPane } = Tabs
  return (
    <Tabs type='card'>
      <TabPane tab='Worklist' key='1'>
        <Worklist {...props} />
      </TabPane>
      <TabPane tab='Pending Specimen' key='2'>
        <Space
          style={{ width: '100%', overflowY: 'scroll' }}
          direction='vertical'
        ></Space>
      </TabPane>
    </Tabs>
  )
}

export default ConnectedLabWorklistWithProvider
