import React from 'react'
// formik
import { FastField } from 'formik'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  SizeContainer,
  CodeSelect,
  Checkbox,
} from '@/components'
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker />

          <GridItem md={3}>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Generate Report
            </Button>
          </GridItem>
          <GridItem md={5} />
          <GridItem md={4}>
            <FastField
              name='inventoryTypeIDs'
              render={(args) => (
                <CodeSelect
                  {...args}
                  label='Inventory Type'
                  mode='multiple'
                  valueField='value'
                  options={[
                    { value: 1, name: 'Medication' },
                    { value: 2, name: 'Consumable' },
                    { value: 3, name: 'Vaccination' },
                  ]}
                  force
                />
              )}
            />
          </GridItem>
          <GridItem md={8} />
          <GridItem md={4}>
            <FastField
              name='transactionTypeIDs'
              render={(args) => (
                <CodeSelect
                  {...args}
                  label='Transaction'
                  mode='multiple'
                  valueField='value'
                  options={[
                    { value: 1, name: 'Purchase Order' },
                    { value: 2, name: 'Receiving Goods' },
                  ]}
                  force
                />
              )}
            />
          </GridItem>
          <GridItem md={8} />
          <GridItem md={4}>
            <FastField
              name='supplierIDs'
              render={(args) => (
                <CodeSelect
                  {...args}
                  label='Supplier'
                  mode='multiple'
                  code='ctSupplier'
                  labelField='displayValue'
                  force
                />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='groupBySupplier'
              render={(args) => (
                <Checkbox {...args} label='Group By Supplier' />
              )}
            />
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

export default FilterBar
