import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import {
  GridContainer,
  GridItem,
  withFormikExtend,
  NumberInput,
  FastField,
  Field,
  TextField,
  DatePicker,
  CodeSelect,
  Button,
  Tooltip,
  dateFormatLong,
  dateFormatLongWithTimeNoSec,
  MultipleTextField,
} from '@/components'

const styles = theme => ({})

const ContentGridItem = ({ children, title }) => {
  return (
    <GridItem md={12} style={{ paddingLeft: 140 }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 140,
            textAlign: 'right',
            position: 'absolute',
            left: '-140px',
            fontWeight: 600,
            top: '12px',
          }}
        >
          {title}
        </div>
        <div style={{ marginLeft: 6 }}> {children}</div>
      </div>
    </GridItem>
  )
}

const Details = ({
  values,
  clinicSettings,
  onClose,
  handleSubmit,
  setFieldValue,
}) => {
  const {
    diagnosisDataSource = 'Snomed',
    isEnableJapaneseICD10Diagnosis = false,
  } = clinicSettings
  let diagnosis
  if (diagnosisDataSource === 'Snomed') {
    diagnosis = values.diagnosisFK ? values.diagnosisDescription : '-'
  } else {
    diagnosis = values.icD10DiagnosisFK
      ? isEnableJapaneseICD10Diagnosis
        ? `${values.icD10DiagnosisDescription ||
            ''} ${values.icD10JpnDiagnosisDescription || ''}`
        : values.icD10DiagnosisDescription
      : '-'
  }
  const doctor = `${
    values.doctorTitle && values.doctorTitle.trim().length
      ? `${values.doctorTitle}. `
      : ''
  }${values.doctorName || ''}`

  const getUpdateMessage = () => {
    const updateUser = `${
      values.updateUserTitle && values.updateUserTitle.trim().length
        ? `${values.updateUserTitle}. `
        : ''
    }${values.updateUserName || ''}`

    return `Last Updated by ${updateUser} on ${moment(values.updateDate).format(
      dateFormatLongWithTimeNoSec,
    )}`
  }

  const setDueDate = dueDate => {
    setFieldValue('dueDate', dueDate)
    updateBalanceDays(dueDate)
  }

  const updateBalanceDays = dueDate => {
    if (dueDate) {
      setFieldValue(
        'balanceDays',
        moment(dueDate).startOf('day') > moment().startOf('day')
          ? Math.floor(
              (moment(dueDate).startOf('day') - moment().startOf('day')) /
                (24 * 3600 * 1000),
            )
          : 0,
      )
    } else {
      setFieldValue('balanceDays', undefined)
    }
  }

  const updateDueDate = (
    diagnosisType,
    firstVisitDate,
    onsetDate,
    validityDays,
  ) => {
    if (diagnosisType === 'Sickness') {
      if (
        !firstVisitDate ||
        validityDays === '' ||
        validityDays === null ||
        validityDays === undefined
      ) {
        setDueDate(undefined)
      } else {
        const dueDate = moment(firstVisitDate)
          .add(validityDays, 'd')
          .add(-1, 'd')
        setDueDate(dueDate)
      }
    } else if (diagnosisType === 'Injury') {
      if (
        !onsetDate ||
        validityDays === '' ||
        validityDays === null ||
        validityDays === undefined
      ) {
        setDueDate(undefined)
      } else {
        const dueDate = moment(onsetDate)
          .add(validityDays, 'd')
          .add(-1, 'd')
        setDueDate(dueDate)
      }
    } else {
      setDueDate(undefined)
    }
  }

  const firstVisitDateUpdate = v => {
    if (values.diagnosisType === 'Sickness') {
      updateDueDate(
        values.diagnosisType,
        v,
        values.onsetDate,
        values.validityDays,
      )
    }
  }
  const onsetDateUpdate = v => {
    if (values.diagnosisType === 'Injury') {
      updateDueDate(
        values.diagnosisType,
        values.firstVisitDate,
        v,
        values.validityDays,
      )
    }
  }
  const validityDaysUpdate = v => {
    updateDueDate(
      values.diagnosisType,
      values.firstVisitDate,
      values.onsetDate,
      v.target.value,
    )
  }
  const diagnosisTypeUpdate = v => {
    updateDueDate(
      v,
      values.firstVisitDate,
      values.onsetDate,
      values.validityDays,
    )
  }
  return (
    <div style={{ padding: '0px 10px' }}>
      <GridContainer>
        <ContentGridItem title='Visit Date:'>
          <div
            style={{
              padding: '12px 0px 7px',
              fontSize: '14px',
              fontWeight: 400,
            }}
          >
            {moment(values.visitDate).format(dateFormatLong)}
          </div>
        </ContentGridItem>
        <ContentGridItem title='Visit Doctor:'>
          <Tooltip title={doctor}>
            <div
              style={{
                padding: '12px 0px 7px',
                fontSize: '14px',
                fontWeight: 400,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {doctor}
            </div>
          </Tooltip>
        </ContentGridItem>
        <ContentGridItem title='Diagnosis:'>
          <div
            style={{
              padding: '12px 0px 7px',
              fontSize: '14px',
              fontWeight: 400,
            }}
          >
            {diagnosis}
          </div>
        </ContentGridItem>
        <ContentGridItem title='International Code:'>
          <FastField
            name='internationalCode'
            render={args => (
              <TextField style={{ width: 120 }} {...args} maxLength={20} />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='Type:'>
          <Field
            name='diagnosisType'
            render={args => (
              <CodeSelect
                style={{ width: 120 }}
                options={[
                  { id: 'Sickness', name: 'Sickness' },
                  { id: 'Injury', name: 'Injury' },
                ]}
                onChange={diagnosisTypeUpdate}
                {...args}
              />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='Onset Date:'>
          <Field
            name='onsetDate'
            render={args => (
              <DatePicker
                style={{ width: 120 }}
                {...args}
                onChange={onsetDateUpdate}
              />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='First Visit Date:'>
          <Field
            name='firstVisitDate'
            render={args => (
              <DatePicker
                style={{ width: 120 }}
                {...args}
                onChange={firstVisitDateUpdate}
              />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='Balance (Days):'>
          <div
            style={{
              padding: '12px 0px 7px',
              fontSize: '14px',
              fontWeight: 400,
            }}
          >
            {values.balanceDays || values.balanceDays === 0
              ? values.balanceDays
              : '-'}
          </div>
        </ContentGridItem>
        <ContentGridItem title='Validity (Days):'>
          <Field
            name='validityDays'
            render={args => (
              <NumberInput
                style={{ width: 120 }}
                min={0}
                max={999999}
                precision={0}
                onChange={validityDaysUpdate}
                {...args}
              />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='Due Date:'>
          <Field
            name='dueDate'
            render={args => (
              <DatePicker
                style={{ width: 120 }}
                {...args}
                onChange={updateBalanceDays}
              />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='Claimable:'>
          <FastField
            name='isClaimable'
            render={args => (
              <CodeSelect
                style={{ width: 120 }}
                options={[
                  { id: true, name: 'Yes' },
                  { id: false, name: 'No' },
                ]}
                {...args}
              />
            )}
          />
        </ContentGridItem>
        <ContentGridItem title='Diagnosis Remarks:'>
          <div
            style={{
              padding: '12px 0px 7px',
              fontSize: '14px',
              fontWeight: 400,
            }}
          >
            {values.diagnosisRemarks || '-'}
          </div>
        </ContentGridItem>
        <ContentGridItem title='Remarks:'>
          <FastField
            name='remarks'
            render={args => (
              <MultipleTextField maxLength={2000} rows={4} {...args} />
            )}
          />
        </ContentGridItem>
      </GridContainer>
      <div
        style={{ margin: '10px 0px', position: 'relative', paddingRight: 220 }}
      >
        <Tooltip title={getUpdateMessage()}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 400,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {getUpdateMessage()}
          </div>
        </Tooltip>
        <div style={{ position: 'absolute', right: 0, bottom: '-6px' }}>
          <Button
            color='danger'
            size='sm'
            onClick={() => {
              if (onClose) {
                onClose()
              }
            }}
          >
            Cancel
          </Button>
          <Button
            color='primary'
            size='sm'
            onClick={() => {
              if (handleSubmit) {
                handleSubmit()
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default compose(
  withStyles(styles),
  connect(({ claimHistory, clinicSettings }) => ({
    claimHistory: claimHistory,
    clinicSettings: clinicSettings.settings,
  })),
  withFormikExtend({
    enableReinitialize: true,
    mapPropsToValues: ({ claimHistory }) => {
      return claimHistory.entity || {}
    },
    //validationSchema: Yup.object().shape({}),
    handleSubmit: (values, { props, resetForm }) => {
      const { dispatch, onConfirm } = props
      dispatch({
        type: 'claimHistory/upsert',
        payload: {
          ...values,
        },
      }).then(r => {
        if (r) {
          resetForm()
          if (onConfirm) onConfirm()
        }
      })
    },
    displayName: 'ClaimDetails',
  }),
)(Details)
