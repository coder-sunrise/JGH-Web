import React from 'react'
import { connect } from 'dva'
// formik
import { FastField, Field } from 'formik'
import { Chip } from '@material-ui/core'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  SizeContainer,
  CodeSelect,
  RadioGroup,
  Select,
  Checkbox,
} from '@/components'
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <GridItem md={2}>
            <FastField
              name='viewBy'
              render={(args) => (
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
          <ReportDateRangePicker
            fromDateFieldName='listingFrom'
            toDateFieldName='listingTo'
          />
          <GridItem md={2}>
            <Field
              name='inventoryType'
              render={(args) => {
                const { form: fm } = args
                return (
                  <Select
                    {...args}
                    label='Inventory Type'
                    allowClear={false}
                    options={[
                      { name: 'Medication', value: 'MEDICATION' },
                      { name: 'Consumable', value: 'CONSUMABLE' },
                      { name: 'Vaccination', value: 'VACCINATION' },
                    ]}
                    onChange={(e) => {
                      if (e) {
                        fm.setFieldValue('items', undefined)
                      }
                    }}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={4} />
          <GridItem md={4}>
            <Field
              name='items'
              render={(args) => {
                const { form } = args
                return (
                  <CodeSelect
                    {...args}
                    label='Item List'
                    mode='multiple'
                    code={`inventory${form.values.inventoryType}`}
                    labelField='displayValue'
                    force
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='showDetails'
              render={(args) => (
                <Checkbox {...args} label='Show Report Details' />
              )}
            />
          </GridItem>

          <GridItem md={3}>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Generate Report
            </Button>
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

const Connected = connect(({ codetable }) => ({ codetable }))(FilterBar)

export default Connected
