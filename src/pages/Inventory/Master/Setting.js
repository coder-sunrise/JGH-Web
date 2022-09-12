import React, { useState, useEffect } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { FastField } from 'formik'
import { compose } from 'redux'
import { formatMessage } from 'umi'
import { connect } from 'dva'
import {
  GridContainer,
  GridItem,
  Transfer,
  CodeSelect,
  NumberInput,
} from '@/components'

const styles = () => ({})
const Setting = ({
  classes,
  setFieldValue,
  showTransfer,
  dispatch,
  global,
  ...props
}) => {
  const { medicationDetail, vaccinationDetail, theme } = props
  const optionLabelLength = 40

  const { ctmedicationprecaution, entity, config = {} } =
    medicationDetail || vaccinationDetail
  const entityData = entity || []
  let addedItems = []
  if (
    entityData &&
    entityData.inventoryMedication_MedicationPrecaution &&
    entityData.inventoryMedication_MedicationPrecaution.length > 0
  ) {
    addedItems = entityData.inventoryMedication_MedicationPrecaution.map(
      item => ({
        medicationPrecautionFK: item.medicationPrecautionFK,
        value: item.medicationPrecaution.name,
      }),
    )
  }
  const settingProps = {
    items: ctmedicationprecaution || [],
    addedItems,
    classes,
    label: 'Precaution',
    limitTitle: formatMessage({
      id: 'inventory.master.setting.precaution',
    }),
    limit: 3,
    setFieldValue,
    fieldName: 'inventoryMedication_MedicationPrecaution',
    searchLabel: 'Precaution Name',
  }

  return (
    <div
      hideHeader
      style={{
        margin: theme.spacing(1),
      }}
    >
      <h4 style={{ fontWeight: 400 }}>
        <b>Prescribing</b>
      </h4>
      <GridContainer>
        <GridItem xs={6}>
          <FastField
            name={showTransfer ? 'medicationUsageFK' : 'vaccinationUsageFK'}
            render={args => (
              <CodeSelect
                label={formatMessage({
                  id: 'inventory.master.setting.usage',
                })}
                labelField={showTransfer ? 'displayValue' : 'name'}
                code={showTransfer ? 'ctMedicationUsage' : 'ctvaccinationusage'}
                {...args}
              />
            )}
          />
        </GridItem>
      </GridContainer>
      <GridContainer>
        <GridItem xs={3}>
          <FastField
            name='prescribingDosageFK'
            render={args => (
              <CodeSelect
                label={formatMessage({
                  id: 'inventory.master.setting.dosage',
                })}
                labelField='displayValue'
                code='ctMedicationDosage'
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs={3}>
          <FastField
            name='prescribingUOMFK'
            render={args => (
              <CodeSelect
                label={formatMessage({
                  id: 'inventory.master.setting.prescribeUOM',
                })}
                labelField={showTransfer ? 'displayValue' : 'name'}
                code={
                  showTransfer
                    ? 'ctmedicationunitofmeasurement'
                    : 'ctvaccinationunitofmeasurement'
                }
                {...args}
              />
            )}
          />
        </GridItem>
      </GridContainer>
      <GridContainer>
        <GridItem xs={3}>
          <FastField
            name={
              showTransfer ? 'medicationFrequencyFK' : 'vaccinationFrequencyFK'
            }
            render={args => (
              <CodeSelect
                label={formatMessage({
                  id: 'inventory.master.setting.frequency',
                })}
                labelField='displayValue'
                code='ctMedicationFrequency'
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs={3}>
          <FastField
            name='duration'
            render={args => {
              return (
                <NumberInput
                  label={formatMessage({
                    id: 'inventory.master.setting.duration',
                  })}
                  {...args}
                  precision={0}
                />
              )
            }}
          />
        </GridItem>
      </GridContainer>

      <h4 style={{ fontWeight: 400, marginTop: 25 }}>
        <b>Dispensing</b>
      </h4>

      <GridContainer>
        <GridItem xs={3}>
          <FastField
            name='dispensingQuantity'
            render={args => {
              return (
                <NumberInput
                  label={formatMessage({
                    id: 'inventory.master.setting.quantity',
                  })}
                  format={config.dispenseQuantityFormat || '0.0'}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={3}>
          <FastField
            name='dispensingUOMFK'
            render={args => (
              <CodeSelect
                label={formatMessage({
                  id: 'inventory.master.setting.dispenseUOM',
                })}
                // Fix work item ID: 10993
                labelField={showTransfer ? 'displayValue' : 'name'}
                code={
                  showTransfer
                    ? 'ctmedicationunitofmeasurement'
                    : 'ctvaccinationunitofmeasurement'
                }
                {...args}
              />
            )}
          />
        </GridItem>
      </GridContainer>
      <GridContainer>
        <GridItem xs={1}>
          <FastField
            name='prescriptionToDispenseConversion'
            render={args => (
              <NumberInput
                label={formatMessage({
                  id:
                    'inventory.master.setting.prescriptionToDispenseConversion',
                })}
                precision={2}
                format='0.00'
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem>
          <FastField
            name='prescribingUOMFK'
            render={args => (
              <CodeSelect
                style={{ marginTop: 30 }}
                label=''
                text
                labelField={showTransfer ? 'displayValue' : 'name'}
                optionLabelLength={optionLabelLength}
                code={
                  showTransfer
                    ? 'ctmedicationunitofmeasurement'
                    : 'ctvaccinationunitofmeasurement'
                }
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem style={{ padding: 0 }}>
          <React.Fragment>
            <div style={{ marginTop: 30, fontSize: 16 }}>= 1.0</div>
          </React.Fragment>
        </GridItem>
        <GridItem>
          <FastField
            name='dispensingUOMFK'
            render={args => (
              <CodeSelect
                style={{ marginTop: 30 }}
                optionLabelLength={optionLabelLength}
                text
                label=''
                labelField={showTransfer ? 'displayValue' : 'name'}
                code={
                  showTransfer
                    ? 'ctmedicationunitofmeasurement'
                    : 'ctvaccinationunitofmeasurement'
                }
                {...args}
              />
            )}
          />
        </GridItem>
      </GridContainer>
      {showTransfer && (
        <React.Fragment>
          <h4 style={{ fontWeight: 400, marginTop: 25 }}>
            <b>Medication Precaution</b>
          </h4>

          <Transfer {...settingProps} style={{ paddingLeft: 0 }} />
        </React.Fragment>
      )}
    </div>
  )
}

const ConnectedSetting = connect(({ global }) => ({
  global,
}))(Setting)

export default compose(
  withStyles(styles, { withTheme: true }),
  React.memo,
)(ConnectedSetting)
