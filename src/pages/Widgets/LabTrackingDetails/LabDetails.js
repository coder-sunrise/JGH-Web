import React, { useState, useEffect } from 'react'
import {
  CardContainer,
  CodeSelect,
  CommonTableGrid,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DatePicker,
  Select,
  Field,
} from '@/components'
import NumberInput from '@/components/NumberInput'

export default ({
  setFieldValue,
  values,
  codetable,
  setShowMessage,
  editable = true,
}) => {
  const { ctcasedescription = [], ctcasetype = [] } = codetable
  const [selectCaseTypeFK, setSelectCaseTypeFK] = useState(() => undefined)

  useEffect(() => {
    const {
      caseTypeFK,
      caseTypeDisplayValue,
      caseDescriptionFK,
      caseDescriptionDisplayValue,
    } = values
    if (caseDescriptionFK) {
      let caseDescription = ctcasedescription.find(
        o => o.id === caseDescriptionFK,
      )
      if (caseDescription.displayValue !== caseDescriptionDisplayValue) {
        setShowMessage(true)
        setFieldValue('caseDescriptionDisplayValue', caseDescription.name)
      }
      let caseType = ctcasetype.find(o => o.id === caseDescription.caseTypeFK)
      if (!caseTypeFK || caseTypeFK !== caseDescription.caseTypeFK) {
        setShowMessage(true)
        setSelectCaseTypeFK(caseType.id)
        setFieldValue('caseTypeFK', caseType.id)
        setFieldValue('caseTypeCode', caseType.code)
        setFieldValue('caseTypeDisplayValue', caseType.name)
      } else if (caseTypeFK && caseTypeFK === caseDescription.caseTypeFK) {
        if (caseType.name !== caseTypeDisplayValue) {
          setShowMessage(true)
          setFieldValue('caseTypeDisplayValue', caseType.name)
        }
        setSelectCaseTypeFK(caseTypeFK)
      }
    } else if (caseTypeFK) {
      let caseType = ctcasetype.find(o => o.id === caseTypeFK)
      if (caseType.name !== caseTypeDisplayValue) {
        setShowMessage(true)
        setFieldValue('caseTypeDisplayValue', caseType.name)
      }
      setSelectCaseTypeFK(caseTypeFK)
    }
  }, [])

  const caseTypeChange = (v, option) => {
    setSelectCaseTypeFK(option ? option.id : undefined)
    setFieldValue('caseTypeCode', option ? option.code : undefined)
    setFieldValue('caseTypeDisplayValue', option ? option.name : undefined)
    if (v) {
      setFieldValue('caseDescriptionFK', undefined)
      setFieldValue('caseDescriptionCode', undefined)
      setFieldValue('caseDescriptionDisplayValue', undefined)
    }
  }

  const caseDescriptionChange = (v, option) => {
    setFieldValue('caseDescriptionCode', option ? option.code : undefined)
    setFieldValue(
      'caseDescriptionDisplayValue',
      option ? option.displayValue : undefined,
    )
    if (option && !selectCaseTypeFK) {
      let caseType = ctcasetype.find(o => o.id === option.caseTypeFK)
      if (caseType) {
        setSelectCaseTypeFK(caseType.id)
        setFieldValue('caseTypeFK', caseType.id)
        setFieldValue('caseTypeCode', caseType.code)
        setFieldValue('caseTypeDisplayValue', caseType.name)
      }
    }
  }

  return (
    <CardContainer hideHeader size='sm' style={{ margin: 0 }}>
      <GridContainer>
        <GridItem md={4}>
          <FastField
            name='supplierFK'
            render={args => (
              <CodeSelect
                label='Supplier'
                labelField='displayValue'
                {...args}
                code='CTSupplier'
                onChange={(value, option) => {
                  setFieldValue(
                    'supplierCode',
                    option ? option.code : undefined,
                  )
                  setFieldValue(
                    'SupplierName',
                    option ? option.displayValue : undefined,
                  )
                }}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem xs sm={4} md={3}>
          <FastField
            name='orderedDate'
            render={args => (
              <DatePicker
                label='Ordered Date'
                {...args}
                timeFormat={false}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <FastField
            name='labSheetNo'
            render={args => (
              <TextField label='Lab Sheet No' {...args} disabled={!editable} />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem xs sm={4} md={3}>
          <FastField
            name='estimateReceiveDate'
            render={args => (
              <DatePicker
                style={{ width: '100%' }}
                label='Estimated Receive Date'
                {...args}
                timeFormat={false}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <FastField
            name='caseTypeFK'
            render={args => (
              <CodeSelect
                label='Case Type'
                valueField='id'
                {...args}
                code='CTCaseType'
                onChange={caseTypeChange}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem xs sm={4} md={3}>
          <FastField
            name='receivedDate'
            render={args => (
              <DatePicker
                style={{ width: '100%' }}
                label='Received Date'
                {...args}
                timeFormat={false}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <Field
            name='caseDescriptionFK'
            render={args => (
              <Select
                label='Case Description'
                labelField='displayValue'
                valueField='id'
                options={ctcasedescription.filter(
                  o => !selectCaseTypeFK || o.caseTypeFK === selectCaseTypeFK,
                )}
                onChange={caseDescriptionChange}
                {...args}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <FastField
            name='sentBy'
            render={args => (
              <TextField label='Sent By' {...args} disabled={!editable} />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <FastField
            name='units'
            render={args => (
              <NumberInput
                {...args}
                max={9999}
                min={0}
                maxLength={4}
                label='No. of Units'
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
        <GridItem md={4}>
          <FastField
            name='receivedBy'
            render={args => (
              <TextField
                label='Received By (in Lab)'
                {...args}
                disabled={!editable}
              />
            )}
          />
        </GridItem>
        <GridItem md={2} />
      </GridContainer>
    </CardContainer>
  )
}
