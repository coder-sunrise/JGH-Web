import React, { Component, Fragment } from 'react'
import { connect } from 'umi'
import { Space, Card } from 'antd'
import { primaryColor } from 'mui-pro-jss'
import { Worklist } from './components/Worklist'
import { WorklistContextProvider } from './WorklistContext'

const MedicalCheckupWorklist = props => {
  return <Worklist {...props} />
}

const MedicalCheckupWorklistWithProvider = props => (
  <WorklistContextProvider>
    <MedicalCheckupWorklist {...props}></MedicalCheckupWorklist>
  </WorklistContextProvider>
)

const ConnectedMedicalCheckupWorklistWithProvider = connect(
  ({ medicalCheckupWorklist, codetable, clinicSettings }) => ({
    medicalCheckupWorklist,
    codetable,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
  }),
)(MedicalCheckupWorklistWithProvider)

export default ConnectedMedicalCheckupWorklistWithProvider
