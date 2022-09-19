import React from 'react'

// common components
import {
  Button,
  GridContainer,
  GridItem,
  FastField,
  CodeSelect,
  SizeContainer,
  Select,
  Field,
  Checkbox,
} from '@/components'

// medisys components
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size="sm">
      <React.Fragment>
        <GridContainer alignItems="flex-end">
          {/* 1st row */}
          <ReportDateRangePicker fromDateLabel="Expiry Date From" toDateLabel="Expiry Date To" />
          <GridItem md={3}>
            <Field
              name="stockType"
              render={(args) => {
                const { form: fm } = args
                return (
                  <Select
                    {...args}
                    label="Inventory Type"
                    options={[
                      { name: 'Medication', value: 'MEDICATION' },
                      { name: 'Consumable', value: 'CONSUMABLE' },
                      { name: 'Vaccination', value: 'VACCINATION' },
                    ]}
                    allowClear={false}
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
          <GridItem md={5} />
          <GridItem md={2}>
            <Field
              name="items"
              render={(args) => {
                const { form } = args
                return (
                  <CodeSelect
                    {...args}
                    label="Item List"
                    mode="multiple"
                    code={`Inventory${form.values.stockType}`}
                    labelField="displayValue"
                    force
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name="IsDefault"
              render={(args) => {
                return (
                  <Select
                    label="IsDefault"
                    options={[ { name: 'Yes', value: true }, { name: 'No', value: false } ]}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={1}>
            <FastField name="GroupByItem" render={(args) => <Checkbox {...args} label="Group By Item" />} />
          </GridItem>
          <GridItem md={2}>
            <Button color="primary" onClick={handleSubmit} disabled={isSubmitting}>
              Generate Report
            </Button>
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

export default FilterBar
