import React from 'react'
// formik
import { FastField } from 'formik'
// common components
import {
  Button,
  RadioGroup,
  GridContainer,
  GridItem,
  SizeContainer,
  CodeSelect,
  Checkbox,
} from '@/components'
import { DoctorProfileSelect } from '@/components/_medisys'
import { COPAYER_TYPE } from '@/utils/constants'
import ReportDateRangePicker from '../ReportDateRangePicker'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker
            fromDateFieldName='listingFrom'
            toDateFieldName='listingTo'
          />
          <GridItem md={8} container style={{ position: 'relative' }}>
            <FastField
              name='groupBy'
              render={args => (
                <RadioGroup
                  {...args}
                  label='Group By'
                  options={[
                    {
                      value: 'Company',
                      label: 'Co-Payer',
                    },
                    {
                      value: 'Doctor',
                      label: 'Doctor',
                    },
                    {
                      value: 'None',
                      label: 'None',
                    },
                  ]}
                />
              )}
            />
            <div style={{ position: 'absolute', left: 280, top: 18 }}>
              <FastField
                name='asAt'
                render={args => <Checkbox {...args} label='As At' />}
              />
            </div>
            <div style={{ position: 'absolute', left: 360, top: 16 }}>
              <Button
                color='primary'
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Generate Report
              </Button>
            </div>
          </GridItem>
          <GridItem md={4}>
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
          <GridItem md={4}>
            <FastField
              name='companyIDS'
              render={args => (
                <CodeSelect
                  {...args}
                  code='ctcopayer'
                  labelField='displayValue'
                  showOptionTitle={false}
                  renderDropdown={option => {
                    return (
                      <CopayerDropdownOption
                        option={option}
                      ></CopayerDropdownOption>
                    )
                  }}
                  additionalSearchField='code'
                  mode='multiple'
                  label='Co-Payer'
                  isCheckedShowOnTop
                />
              )}
            />
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

export default FilterBar
