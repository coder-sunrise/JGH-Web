import React from 'react'
// formik
import { FastField, Field } from 'formik'
import { status } from '@/utils/codes'
// common components
import { Button, GridContainer, GridItem, SizeContainer, CodeSelect, Select } from '@/components'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <GridItem md={3}>
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
                      { name: 'Vaccination', value: 'VACCINATION' },
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
          <GridItem md={3}>
            <FastField
              name='Suppliers'
              render={args => (
                <CodeSelect
                  label='Supplier'
                  code='ctSupplier'
                  mode='multiple'
                  labelField='displayValue'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3}>
            <FastField
              name='ThresholdType'
              render={args => (
                <Select
                  label='Threshold Type'
                  allowClear={false}
                  labelField='name'
                  valueField='value'
                  {...args}
                  options={[
                    { name: 'All', value: 'All' },
                    { name: 'Re-Order', value: 'Re-Order' },
                    { name: 'Excess', value: 'Excess' },
                  ]}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} />
          <GridItem md={3}>
            <Field
              name='items'
              render={args => {
                const { form } = args
                return (
                  <CodeSelect
                    {...args}
                    label='Item List'
                    mode='multiple'
                    code={`Inventory${form.values.inventoryType}`}
                    labelField='displayValue'
                    force
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={3}>
            <FastField
              name='Status'
              render={args => (
                <Select
                  {...args}
                  label='Status'
                  options={[
                    {
                      name: 'All',
                      value: 'all',
                    },
                    {
                      name: 'Active',
                      value: 'active',
                    },
                    {
                      name: 'Inactive',
                      value: 'inactive',
                    },
                  ]}
                  allowClear={false}
                  labelField='name'
                  valueField='value'
                />
              )}
            />
          </GridItem>
          <GridItem md={3}>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ position: 'relative', top: '-5px' }}
            >
              Generate Report
            </Button>
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

export default FilterBar
