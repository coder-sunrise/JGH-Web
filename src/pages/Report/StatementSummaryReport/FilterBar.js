import React from 'react'
// formik
import { FastField, Field } from 'formik'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  SizeContainer,
  Checkbox,
  CodeSelect,
  Select,
} from '@/components'
import { osBalanceStatus } from '@/utils/codes'
import { COPAYER_TYPE } from '@/utils/constants'
import ReportDateRangePicker from '../ReportDateRangePicker'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const FilterBar = ({ handleSubmit, isSubmitting, values, setFieldValue }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker
            fromDateLabel='Statement From Date'
            toDateLabel='Statement To Date'
          />
          <GridItem md={1}>
            <FastField
              name='asAt'
              render={args => <Checkbox {...args} label='Till Today' />}
            />
          </GridItem>
          <GridItem md={6} />
          <ReportDateRangePicker
            fromDateLabel='Statement Due From Date'
            toDateLabel='Statement Due End Date'
            fromDateFieldName='dueDateFrom'
            toDateFieldName='dueDateTo'
          />
          <GridItem md={1}>
            <FastField
              name='isAllDueDate'
              render={args => <Checkbox {...args} label='All Date' />}
            />
          </GridItem>
          <GridItem md={6} />

          <GridItem md={2}>
            <Field
              name='companyIDS'
              render={args => (
                <CodeSelect
                  {...args}
                  code='ctcopayer'
                  labelField='displayValue'
                  mode='multiple'
                  showOptionTitle={false}
                  renderDropdown={option => {
                    return (
                      <CopayerDropdownOption
                        option={option}
                      ></CopayerDropdownOption>
                    )
                  }}
                  additionalSearchField='code'
                  label='Co-Payer'
                  localFilter={item =>
                    [COPAYER_TYPE.CORPORATE, COPAYER_TYPE.INSURANCE].indexOf(
                      item.coPayerTypeFK,
                    ) >= 0
                  }
                  onChange={val => {
                    if (val.length === 0 && values.isPrintDetails) {
                      setFieldValue('isPrintDetails', false)
                    }
                  }}
                  isCheckedShowOnTop
                />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='outstandingBalanceStatus'
              render={args => {
                return (
                  <Select
                    label='O/S Balance'
                    options={osBalanceStatus}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={8}>
            <div>
              <div style={{ display: 'inline-Block' }}>
                <FastField
                  name='groupByCompany'
                  render={args => (
                    <Checkbox {...args} label='Group By Co-Payer' />
                  )}
                />
              </div>
              <div style={{ display: 'inline-Block', marginLeft: 10 }}>
                <Field
                  name='isPrintDetails'
                  render={args => (
                    <Checkbox
                      {...args}
                      label='Print Details'
                      disabled={(values.companyIDS || []).length === 0}
                    />
                  )}
                />
              </div>
              <div style={{ display: 'inline-Block', marginLeft: 10 }}>
                <Button
                  color='primary'
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </GridItem>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

export default FilterBar
