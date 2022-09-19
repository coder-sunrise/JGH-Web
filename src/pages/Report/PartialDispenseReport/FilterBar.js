import React from 'react'
// formik
import { FastField, Field } from 'formik'
import { status } from '@/utils/codes'
import { formatMessage } from 'umi'

// common components
import {
  Button,
  Checkbox,
  GridContainer,
  GridItem,
  SizeContainer,
  CodeSelect,
  Select,
  TextField,
  Tooltip,
} from '@/components'
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <GridContainer>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker
            fromDateLabel='Order Date From'
            toDateLabel='Order Date To'
            fromDateCols='1'
            toDateCols='1'
          />
          <GridItem md={3}>
            <FastField
              name='patientCriteria'
              render={args => (
                <TextField
                  {...args}
                  label={formatMessage({
                    id: 'reception.queue.patientSearchPlaceholder',
                  })}
                />
              )}
            />
          </GridItem>
          <GridItem md={1}>
            <Field
              name='inventoryType'
              render={args => {
                const { form: fm } = args
                return (
                  <Select
                    {...args}
                    label='Inventory Type'
                    options={[
                      { name: 'Medication', value: 'MEDICATION' },
                      { name: 'Consumable', value: 'CONSUMABLE' },
                    ]}
                    allowClear={false}
                    onChange={e => {
                      if (e) {
                        fm.setFieldValue('items', undefined)
                      }
                    }}
                  />
                )
              }}
            />
          </GridItem>

          <GridItem md={2}>
            <Field
              name='items'
              render={args => {
                const { form } = args
                return (
                  <Tooltip
                    placement='right'
                    title='Select "All" will retrieve active and inactive items'
                  >
                    <CodeSelect
                      {...args}
                      label='Item List'
                      mode='multiple'
                      code={`inventory${form.values.inventoryType}`}
                      labelField='displayValue'
                      force
                    />
                  </Tooltip>
                )
              }}
            />
          </GridItem>
          <GridItem md={1}>
            <FastField
              name='GroupByItem'
              render={args => <Checkbox {...args} label='Group By Item' />}
            />
          </GridItem>
          <GridItem md={1}>
            <Field
              name='isFullyDispensed'
              render={args => {
                const { form: fm } = args
                return (
                  <Select
                    {...args}
                    label='Status'
                    mode='multiple'
                    options={[
                      { name: 'Partially', value: 0 },
                      { name: 'Completed', value: 1 },
                    ]}
                    maxTagCount={0}
                    maxTagPlaceholder='Statuses'
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={2}>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Generate Report
            </Button>
          </GridItem>
        </GridContainer>
      </GridContainer>
    </SizeContainer>
  )
}

export default FilterBar
