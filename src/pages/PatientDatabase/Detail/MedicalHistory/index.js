import React, { PureComponent } from 'react'
import moment from 'moment'
import Authorized from '@/utils/Authorized'
import {
  GridContainer,
  GridItem,
  FastField,
  OutlinedTextField,
  CommonTableGrid,
} from '@/components'

class MedicalHistory extends PureComponent {

  constructor(props) {
    super(props)
    this.state = { 
      persistentDiagnosis: [],
    }
  }

  componentWillMount () {
    const patientId = this.props.values.id
    const diagnosis = Authorized.check('patientdatabase.patientprofiledetails.medicalhistory.persistentdiagnosis')
    if (patientId&& diagnosis && diagnosis.rights !== 'hidden') {
      this.props.dispatch({
        type: 'patientHistory/queryPersistentDiagnosis',
        payload: { id: patientId },
      }).then((r) => {
        if (r) {
          this.setState({
            persistentDiagnosis: r.data.data,
          })
        }
      })
    }
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render () {
    const accessRight = Authorized.check('patientdatabase.patientprofiledetails.medicalhistory')
    const diagnosis = Authorized.check('patientdatabase.patientprofiledetails.medicalhistory.persistentdiagnosis')
    const highRisk = Authorized.check('patientdatabase.patientprofiledetails.medicalhistory.highriskpatient')
    let disabledByAccessRight = true
    let showPersistentDiagnosis = false
    let showHighRiskPatient = false
    let disableEditHighRiskPatient = false
    if (accessRight) disabledByAccessRight = accessRight.rights === 'disable'
    if (diagnosis) showPersistentDiagnosis = diagnosis.rights !== 'hidden'
    if (highRisk) showHighRiskPatient = highRisk.rights !== 'hidden'
    if (highRisk) disableEditHighRiskPatient = highRisk.rights !== 'enable'
    const { clinicSettings } = this.props

    return (
      <div>
        <GridContainer alignItems='flex-start'>
          <GridItem xs={12} md={6}>
          {showHighRiskPatient && 
            <FastField
              name='patientMedicalHistory.highRiskCondition'
              render={(args) => {
                return (
                  <OutlinedTextField
                    label='Prevalence of high-risk medical conditions (HRP)'
                    maxLength={200}
                    rows={1}
                    disabled={disabledByAccessRight || disableEditHighRiskPatient}
                    {...args}
                  />
                )
              }}
            />}
          </GridItem>
          <GridItem xs={12} md={6} />
          {showPersistentDiagnosis && 
          <GridItem xs={12} md={6} style={{ paddingBottom: 20 }}>
            <div>
              Persistent Diagnosis
            </div>        
              <CommonTableGrid
                disabled={disabledByAccessRight}
                getRowId={(r) => r.uid}
                size='sm'
                style={{ margin: 0 }}
                rows={this.state.persistentDiagnosis}
                columns={clinicSettings.isEnableJapaneseICD10Diagnosis ? [
                  { name: 'diagnosisDescription', title: 'Diagnosis' },
                  { name: 'jpnDiagnosisDescription', title: 'Diagnosis(JP)' },
                  { name: 'onsetDate', title: 'Onset Date' },
                ] : [
                  { name: 'diagnosisDescription', title: 'Diagnosis' },
                  { name: 'onsetDate', title: 'Onset Date' },
                ]}
                columnExtensions={[
                  {
                    columnName: 'onsetDate',
                    type: 'date',
                  }
                ]}
                FuncProps={{ pager: false }}
              />
          </GridItem>}
          <GridItem xs={12} md={12}>
            <FastField
              name='patientMedicalHistory.longTermMedication'
              render={(args) => {
                return (
                  <OutlinedTextField
                    label='Long Term Medication'
                    multiline
                    rowsMax={5}
                    maxLength={9999999}
                    rows={5}
                    disabled={disabledByAccessRight}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={12} md={12}>
            <FastField
              name='patientMedicalHistory.medicalHistory'
              render={(args) => {
                return (
                  <OutlinedTextField
                    label='Medical History'
                    multiline
                    rowsMax={5}
                    maxLength={9999999}
                    rows={5}
                    disabled={disabledByAccessRight}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={12} md={12}>
            <FastField
              name='patientMedicalHistory.familyHistory'
              render={(args) => {
                return (
                  <OutlinedTextField
                    label='Family History'
                    multiline
                    rowsMax={5}
                    maxLength={9999999}
                    rows={5}
                    disabled={disabledByAccessRight}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={12} md={12}>
            <FastField
              name='patientMedicalHistory.socialHistory'
              render={(args) => {
                return (
                  <OutlinedTextField
                    label='Social History'
                    multiline
                    rowsMax={5}
                    maxLength={9999999}
                    rows={5}
                    disabled={disabledByAccessRight}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridContainer>
      </div>)
  }
}

export default MedicalHistory
