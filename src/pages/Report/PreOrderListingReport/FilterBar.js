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
  ClinicianSelect,
  ItemSelect,
} from '@/components'
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <GridContainer>
        <GridContainer alignItems='flex-end'>
          <GridItem md={3}>
            <div style={{ position: 'relative', top: '-3px' }}>
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
            </div>
          </GridItem>
          <ReportDateRangePicker
            fromDateLabel='Order Date From'
            toDateLabel='Order Date To'
            fromDateCols='2'
            toDateCols='2'
            fromDateFieldName='orderDateFrom'
            toDateFieldName='orderDateTo'
          />
          <ReportDateRangePicker
            fromDateLabel='Appt Date From'
            toDateLabel='Appt Date To'
            fromDateCols='2'
            toDateCols='2'
            fromDateFieldName='apptDateFrom'
            toDateFieldName='apptDateTo'
          />
        </GridContainer>
        <GridContainer alignItems='flex-end'>
          <GridItem md={2}>
            <Field
              name='itemType'
              render={args => {
                const { form: fm } = args
                return (
                  <Select
                    {...args}
                    label='Type'
                    options={[
                      { name: 'Medication', value: 'Medication' },
                      { name: 'Consumable', value: 'Consumable' },
                      { name: 'Vaccination', value: 'Vaccination' },
                      { name: 'Service', value: 'Service' },
                      { name: 'Radiology', value: 'Radiology' },
                      { name: 'Lab', value: 'Lab' },
                    ]}
                    allowClear={true}
                    onChange={e => {
                      if (e) {
                        fm.setFieldValue('itemListIDs', undefined)
                      }
                    }}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={2}>
            <Field
              name='itemListIDs'
              render={args => {
                const { form } = args
                return (
                  <Tooltip
                    placement='right'
                    title='Select "All" will retrieve active and inactive items'
                  >
                    <ItemSelect
                      {...args}
                      label='Item List'
                      maxTagCount={0}
                      mode='multiple'
                      labelField='displayValue'
                      itemType={form.values.itemType}
                      disabled={!form.values.itemType}
                      force
                    />
                  </Tooltip>
                )
              }}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='orderByIDs'
              render={args => (
                <Tooltip
                  placement='right'
                  title='Select "All" will retrieve active and inactive users'
                >
                  <ClinicianSelect
                    label='Order By'
                    noDefaultValue
                    mode='multiple'
                    force={false}
                    maxTagPlaceholder='options '
                    maxTagCount={0}
                    {...args}
                  />
                </Tooltip>
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='status'
              render={args => (
                <Select
                  {...args}
                  label='Status'
                  mode='multiple'
                  options={[
                    {
                      name: 'New',
                      value: 'New',
                    },
                    {
                      name: 'Actualizing',
                      value: 'Actualizing',
                    },
                    {
                      name: 'Actualized',
                      value: 'Actualized',
                    },
                  ]}
                  maxTagCount={0}
                  labelField='name'
                  valueField='value'
                />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <div style={{ position: 'relative', top: '-6px' }}>
              <Button
                color='primary'
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Generate Report
              </Button>
            </div>
          </GridItem>
        </GridContainer>
      </GridContainer>
    </SizeContainer>
  )
}

export default FilterBar
