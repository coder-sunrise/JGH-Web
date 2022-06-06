import React from 'react'
// formik
import { FastField } from 'formik'
import { formatMessage } from 'umi'
// common components
import {
  Button,
  Checkbox,
  DatePicker,
  GridContainer,
  GridItem,
  TextField,
  NumberInput,
  SizeContainer,
  Field,
  Select,
} from '@/components'
// medisys components
import { DoctorProfileSelect } from '@/components/_medisys'
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({ handleSubmit, values, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <GridContainer>
        <GridContainer alignItems='flex-end'>
          {/* 1st row  */}
          <GridItem md={4}>
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
            <FastField
              name='ageFrom'
              render={args => (
                <NumberInput
                  {...args}
                  label='Age From'
                  max={200}
                  precision={0}
                />
              )}
            />
          </GridItem>
          <GridItem md={1}>
            <FastField
              name='ageTo'
              render={args => (
                <NumberInput {...args} label='Age To' max={200} precision={0} />
              )}
            />
          </GridItem>
          <GridItem md={6} />
          {/* 2nd row  */}
          <ReportDateRangePicker
            fromDateLabel='Visit Date From'
            toDateLabel='Visit Date To'
          />

          <GridItem
            md={3}
            container
            style={{ position: 'relative', paddingLeft: 140 }}
          >
            <FastField
              name='isAllDate'
              render={args => (
                <Checkbox
                  style={{ position: 'absolute', top: 12, left: 8 }}
                  {...args}
                  label='All Date'
                />
              )}
            />
            <FastField
              name='noVisitDateFrom'
              render={args => <DatePicker {...args} label='No Visit Since' />}
            />
          </GridItem>
          <GridItem md={5} />
          <GridItem md={2}>
            <FastField
              name='patientStatus'
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
          <GridItem md={2}>
            <FastField
              name='doctorIDs'
              render={args => (
                <DoctorProfileSelect
                  mode='multiple'
                  {...args}
                  allValue={-99}
                  allValueOption={{
                    id: -99,
                    clinicianProfile: {
                      name: 'All',
                    },
                  }}
                  labelField='clinicianProfile.name'
                />
              )}
            />
          </GridItem>
          <GridItem
            md={4}
            container
            style={{ position: 'relative', paddingLeft: 140 }}
          >
            <FastField
              name='isGroupByDoctor'
              render={args => (
                <Checkbox
                  {...args}
                  label='Group By Doctor'
                  style={{ position: 'absolute', top: -6, left: 8 }}
                />
              )}
            />
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
