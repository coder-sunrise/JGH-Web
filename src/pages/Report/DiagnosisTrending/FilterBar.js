import React, { useState } from 'react'
import { connect } from 'dva'
// formik
import { FastField } from 'formik'
import { Chip, withStyles } from '@material-ui/core'
// common components
import {
  Button,
  Checkbox,
  DatePicker,
  GridContainer,
  GridItem,
  SizeContainer,
  RadioGroup,
} from '@/components'
import { DiagnosisSelect, ICD10DiagnosisSelect } from '@/components/_medisys'
import { DIAGNOSIS_TYPE, SYSTEM_LANGUAGE } from '@/utils/constants'
import ReportDateRangePicker from '../ReportDateRangePicker'

const styles = theme => ({
  generateBtn: {
    marginBottom: theme.spacing(1),
  },
})

const FilterBar = ({
  classes,
  handleSubmit,
  isSubmitting,
  formikProps,
  clinicSettings,
  ctdiagnosis = [],
  cticd10diagnosis = [],
}) => {
  const { values, setFieldValue } = formikProps
  const { diagnosisIds = [] } = values
  const [currentDiagnosisLanguage, setcurrentDiagnosisLanguage] = useState(
    SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
  )
  const {
    diagnosisDataSource = DIAGNOSIS_TYPE.SNOMEDDIAGNOSIS,
    isEnableJapaneseICD10Diagnosis = false,
  } = clinicSettings

  let selectedDiagnosis = []
  if (diagnosisDataSource === DIAGNOSIS_TYPE.SNOMEDDIAGNOSIS) {
    selectedDiagnosis = ctdiagnosis.filter(diagnosis =>
      diagnosisIds.includes(diagnosis.id),
    )
  } else {
    selectedDiagnosis = cticd10diagnosis.filter(diagnosis =>
      diagnosisIds.includes(diagnosis.id),
    )
  }

  const handleDelete = diagnosisID => {
    setFieldValue(
      'diagnosisIds',
      diagnosisIds.filter(item => item !== diagnosisID),
    )
  }
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker
            fromDateFieldName='listingFrom'
            toDateFieldName='listingTo'
          />

          <GridItem md={2}>
            <FastField
              name='viewBy'
              render={args => (
                <RadioGroup
                  {...args}
                  label='View By'
                  options={[
                    {
                      value: 'Monthly',
                      label: 'Monthly',
                    },
                    {
                      value: 'Weekly',
                      label: 'Weekly',
                    },
                  ]}
                />
              )}
            />
          </GridItem>
          <GridItem md={2} className={classes.generateBtn}>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Generate Report
            </Button>
          </GridItem>
          <GridItem md={4} />
          <GridItem md={4}>
            <FastField
              name='diagnosisIds'
              render={args =>
                diagnosisDataSource === DIAGNOSIS_TYPE.SNOMEDDIAGNOSIS ? (
                  <DiagnosisSelect
                    {...args}
                    mode='multiple'
                    maxTagCount={0}
                    maxTagPlaceholder='Diagnosis'
                  />
                ) : (
                  <ICD10DiagnosisSelect
                    {...args}
                    mode='multiple'
                    maxTagCount={0}
                    maxTagPlaceholder='Diagnosis'
                    defaultLanguage={SYSTEM_LANGUAGE.PRIMARYLANGUAGE}
                    filterStyle={{
                      position: 'absolute',
                      bottom: 0,
                      right: -130,
                    }}
                    onICD10AMLanguageChange={setcurrentDiagnosisLanguage}
                  />
                )
              }
            />
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='showDetails'
              render={args => (
                <Checkbox
                  style={{
                    marginLeft:
                      diagnosisDataSource === DIAGNOSIS_TYPE.SNOMEDDIAGNOSIS ||
                      !isEnableJapaneseICD10Diagnosis
                        ? 0
                        : 110,
                  }}
                  {...args}
                  label='Show Details'
                />
              )}
            />
          </GridItem>
          <GridItem md={12}>
            {selectedDiagnosis.map(item => (
              <Chip
                style={{ margin: 8 }}
                key={item.code}
                size='small'
                variant='outlined'
                label={
                  currentDiagnosisLanguage === SYSTEM_LANGUAGE.PRIMARYLANGUAGE
                    ? item.displayvalue
                    : item.JpnDisplayValue
                }
                color='primary'
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

const Connected = connect(({ codetable, clinicSettings }) => ({
  ctdiagnosis: codetable['codetable/ctsnomeddiagnosis'],
  cticd10diagnosis: codetable['codetable/CTICD10AM'],
  clinicSettings: clinicSettings.settings,
}))(FilterBar)

export default withStyles(styles, { name: 'SalesSummaryFilterBar' })(Connected)
