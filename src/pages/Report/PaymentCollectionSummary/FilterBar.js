import React from 'react'
// formik
import { FastField } from 'formik'
// common components
import {
  Button,
  CodeSelect,
  GridContainer,
  GridItem,
  RadioGroup,
  SizeContainer,
  Checkbox,
} from '@/components'
// medisys components
import Authorized from '@/utils/Authorized'
import { DoctorProfileSelect } from '@/components/_medisys'
import ReportDateRangePicker from '../ReportDateRangePicker'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const FilterBar = ({ handleSubmit, isSubmitting, setFieldValue, values }) => {
  const { payerType, companyIDS = [] } = values
  const maxcompanyIDSCount = companyIDS.length < 1 ? 1 : 0
  return (
    <SizeContainer size='sm'>
      <GridContainer>
        <GridContainer alignItems='center'>
          <ReportDateRangePicker />

          <GridItem md={2}>
            <FastField
              name='doctorID'
              render={args => <DoctorProfileSelect {...args} />}
            />
          </GridItem>
          <GridItem md={2}>
            <Authorized.Context.Provider
              value={{
                rights: payerType !== 'Patient' ? 'enable' : 'disable',
              }}
            >
              <FastField
                name='companyIDS'
                render={args => (
                  <CodeSelect
                    {...args}
                    code='ctcopayer'
                    additionalSearchField='code'
                    showOptionTitle={false}
                    renderDropdown={option => {
                      return (
                        <CopayerDropdownOption
                          option={option}
                        ></CopayerDropdownOption>
                      )
                    }}
                    labelField='displayValue'
                    mode='multiple'
                    label='Co-Payer'
                    all={-99}
                    defaultOptions={[
                      {
                        isExtra: true,
                        id: -99,
                        displayValue: 'All Co-Payers',
                      },
                    ]}
                    maxTagCount={maxcompanyIDSCount}
                    maxTagPlaceholder='Co-Payers'
                    isCheckedShowOnTop
                  />
                )}
              />
            </Authorized.Context.Provider>
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='paymentModes'
              render={args => (
                <CodeSelect
                  {...args}
                  label='Payment Mode'
                  mode='multiple'
                  code='ctpaymentmode'
                  labelField='displayValue'
                  valueField='code'
                />
              )}
            />
          </GridItem>
          <GridItem md={2} />

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
                  onChange={v => {
                    if (v.target.value === 'Patient') {
                      setFieldValue('companyIDS', [])
                    }
                  }}
                />
              )}
            />
          </GridItem>

          <GridItem>
            <FastField
              name='groupBy'
              render={args => (
                <RadioGroup
                  {...args}
                  label='Group By'
                  defaultValue='3'
                  options={[
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
          </GridItem>
          <GridItem md={1}>
            <FastField
              name='isDisplayGST'
              render={args => <Checkbox {...args} label='Show GST' />}
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
