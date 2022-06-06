import React, { useState, useEffect, useContext } from 'react'
import { List, Radio, InputNumber } from 'antd'
import { formatMessage } from 'umi'
import { FastField, Field, withFormik } from 'formik'
import {
  GridContainer,
  GridItem,
  CodeSelect,
  NumberInput,
  Popconfirm,
} from '@/components'
import { DOSAGE_RULE } from '@/utils/constants'
import DetailsContext from '../../Details/DetailsContext'
import SectionHeader from '../SectionHeader'
import DosageRuleTable from './DosageRule'

const AutoCalculateDosage = ({
  languageLabel,
  setFieldValue,
  values,
  codetable,
  ...restProps
}) => {
  const [ruleType, setRuleType] = useState(DOSAGE_RULE.default)
  const [conversionEnabled, setConversionEnabled] = useState(false)
  const { isEditingDosageRule } = useContext(DetailsContext)
  // console.log(ruleType, values)
  useEffect(() => {
    if (
      values.medicationInstructionRule &&
      values.medicationInstructionRule.length > 0
    ) {
      setRuleType(values.medicationInstructionRule[0].ruleType)
    }
  }, [values.medicationInstructionRule])

  useEffect(() => {
    if (values.prescribingUOMFK) {
      setConversionEnabled(true)
    }
  }, [values.prescribingUOMFK])
  let switchingRuleType = ''
  const handleRuleTypeClick = e => {
    const clickedItem = e.currentTarget.dataset.ruletype

    if (isEditingDosageRule || clickedItem === ruleType) {
      e.stopPropagation()
      e.preventDefault()
      return
    }

    switchingRuleType = clickedItem

    //Currently the list is empty, not require to show the prompt.
    if (
      !values.medicationInstructionRule ||
      values.medicationInstructionRule?.length == 0
    ) {
      e.stopPropagation()
      e.preventDefault()
      handleRuleTypeChange()
    }
  }

  const handleRuleTypeChange = () => {
    setFieldValue('medicationInstructionRule', [])
    setRuleType(switchingRuleType)
  }

  const prescribleUOMChanged = val => {
    if (!val) {
      setFieldValue('prescriptionToDispenseConversion', undefined)
      setConversionEnabled(false)
    } else {
      setConversionEnabled(true)
    }
  }
  const optionLabelLength = 40
  const conversionDisabled = !values.prescribingUOMFK

  const dispenseUOM = codetable?.ctmedicationunitofmeasurement?.find(
    t => t.id === values.dispensingUOMFK,
  )?.displayValue
  const prescribeUOM = codetable?.ctmedicationunitofmeasurement?.find(
    t => t.id === values.prescribingUOMFK,
  )?.displayValue
  return (
    <GridContainer>
      <GridItem md={6}>
        <SectionHeader style={{ display: 'inline-flex', margin: 0 }}>
          Prescribing {languageLabel}
        </SectionHeader>
      </GridItem>
      <GridItem md={6}>
        <SectionHeader style={{ display: 'inline-flex', margin: 0 }}>
          Dispensing {languageLabel}
        </SectionHeader>
      </GridItem>
      <GridItem md={3}>
        <FastField
          name='medicationUsageFK'
          render={args => (
            <CodeSelect
              label={formatMessage({
                id: 'inventory.master.setting.usage',
              })}
              labelField='displayValue'
              code='ctMedicationUsage'
              {...args}
            />
          )}
        />
      </GridItem>
      <GridItem md={3}>
        <FastField
          name='prescribingUOMFK'
          render={args => (
            <CodeSelect
              label={formatMessage({
                id: 'inventory.master.setting.prescribeUOM',
              })}
              onChange={prescribleUOMChanged}
              labelField='displayValue'
              code='ctmedicationunitofmeasurement'
              {...args}
            />
          )}
        />
      </GridItem>
      <GridItem md={2}>
        <FastField
          name='dispensingUOMFK'
          render={args => (
            <CodeSelect
              label={formatMessage({
                id: 'inventory.master.setting.dispenseUOM',
              })}
              labelField='displayValue'
              code='ctmedicationunitofmeasurement'
              {...args}
            />
          )}
        />
      </GridItem>
      <GridItem md={4}>
        {conversionEnabled && (
          <GridContainer>
            <GridItem md={5}>
              <FastField
                name='prescriptionToDispenseConversion'
                render={args => (
                  <NumberInput
                    label={formatMessage({
                      id:
                        'inventory.master.setting.prescriptionToDispenseConversion',
                    })}
                    format='0.0'
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem>
              <span
                title={prescribeUOM}
                style={{
                  display: 'inline-block',
                  maxWidth: 110,
                  marginTop: 25,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {prescribeUOM}
              </span>
            </GridItem>

            <GridItem>
              <div style={{ marginTop: 25, fontSize: 16 }}>= 1.0</div>
            </GridItem>
            <GridItem>
              <span
                title={dispenseUOM}
                style={{
                  display: 'inline-block',
                  maxWidth: 110,
                  marginTop: 25,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {dispenseUOM}
              </span>
            </GridItem>
          </GridContainer>
        )}
      </GridItem>
      <GridItem md={12}>
        <SectionHeader style={{ display: 'inline-flex', marginRight: 20 }}>
          Instruction Setting
        </SectionHeader>
        <Field
          name='ruleType'
          render={args => (
            <Popconfirm
              title='Confirm to remove all instructions by changing setting?'
              onConfirm={handleRuleTypeChange}
              disabled={isEditingDosageRule}
            >
              <span
                data-ruletype={DOSAGE_RULE.default}
                onClick={handleRuleTypeClick}
              >
                <Radio
                  value={DOSAGE_RULE.default}
                  checked={ruleType === DOSAGE_RULE.default}
                  data-ruletype={DOSAGE_RULE.default}
                  disabled={isEditingDosageRule}
                >
                  Default
                </Radio>
              </span>
              <span
                data-ruletype={DOSAGE_RULE.age}
                onClick={handleRuleTypeClick}
              >
                <Radio
                  value={DOSAGE_RULE.age}
                  checked={ruleType === DOSAGE_RULE.age}
                  disabled={isEditingDosageRule}
                >
                  By Age
                </Radio>
              </span>
              <span
                data-ruletype={DOSAGE_RULE.weight}
                onClick={handleRuleTypeClick}
              >
                <Radio
                  value={DOSAGE_RULE.weight}
                  checked={ruleType === DOSAGE_RULE.weight}
                  disabled={isEditingDosageRule}
                >
                  By Weight
                </Radio>
              </span>
            </Popconfirm>
          )}
        />
      </GridItem>
      <GridItem md={12}>
        <Field
          name='medicationInstructionRule'
          render={args => (
            <DosageRuleTable
              rule={ruleType}
              medicationUsageFK={values.medicationUsageFK}
              dispenseUomFK={values.dispensingUOMFK}
              prescribeUomFK={values.prescribingUOMFK}
              initialData={values.medicationInstructionRule}
              onChange={data => {
                args.form.setFieldValue(
                  'medicationInstructionRule',
                  data.map(item => {
                    return { ...item, ruleType }
                  }),
                )
              }}
            />
          )}
        />
      </GridItem>
    </GridContainer>
  )
}

export default AutoCalculateDosage
