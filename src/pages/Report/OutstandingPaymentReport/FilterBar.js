import React from 'react'
// formik
import { FastField } from 'formik'
// common components
import {
  Button,
  DatePicker,
  GridContainer,
  GridItem,
  SizeContainer,
  Checkbox,
  CodeSelect,
  RadioGroup,
} from '@/components'
import { DoctorProfileSelect } from '@/components/_medisys'
import ReportDateRangePicker from '../ReportDateRangePicker'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker />

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
          <GridItem md={2}>
            <FastField
              name='companyIDS'
              render={args => (
                <CodeSelect
                  {...args}
                  // code='ctcopayer,ctsupplier'
                  code='ctcopayer'
                  style={{ width: 300 }}
                  labelField='displayValue'
                  showOptionTitle={false}
                  renderDropdown={option => {
                    return (
                      <CopayerDropdownOption
                        option={option}
                      ></CopayerDropdownOption>
                    )
                  }}
                  mode='multiple'
                  additionalSearchField='code'
                  label='Co-Payer'
                  isCheckedShowOnTop
                />
              )}
            />
          </GridItem>
          <GridItem md={4} />
          <GridItem md={2}>
            <FastField
              name='payerType'
              render={args => (
                <RadioGroup
                  {...args}
                  label='Payer Type'
                  options={[
                    {
                      value: 'All',
                      label: 'All',
                    },
                    {
                      value: 'Company',
                      label: 'Co-Payer',
                    },
                    {
                      value: 'Patient',
                      label: 'Patient',
                    },
                  ]}
                />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='groupByDoctor'
              render={args => <Checkbox {...args} label='Group By Doctor' />}
            />
          </GridItem>
          <GridItem md={1}>
            <FastField
              name='asAt'
              render={args => <Checkbox {...args} label='As At' />}
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
      </React.Fragment>
    </SizeContainer>
  )
}

export default FilterBar
