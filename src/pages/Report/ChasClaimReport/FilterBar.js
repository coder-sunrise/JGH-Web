import React from 'react'
// formik
import { FastField } from 'formik'
// common components
import { formatMessage } from 'umi'
import {
  Button,
  DatePicker,
  GridContainer,
  GridItem,
  SizeContainer,
  Checkbox,
  CodeSelect,
} from '@/components'
import ReportDateRangePicker from '../ReportDateRangePicker'
import { claimStatus, chasSchemeTypes } from '@/utils/codes'

const FilterBar = ({ handleSubmit, isSubmitting }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker
            fromDateLabel='From'
            toDateLabel='To'
            fromDateFieldName='dateFrom'
            toDateFieldName='dateTo'
          />
          <GridItem md={4}>
            <FastField
              name='claimStatus'
              render={args => {
                return (
                  <CodeSelect
                    label={formatMessage({
                      id: 'claimsubmission.invoiceClaim.claimStatus',
                    })}
                    valueField='value'
                    labelField='name'
                    options={claimStatus}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={4} />
          <GridItem md={4}>
            <FastField
              name='schemeTypes'
              render={args => {
                return (
                  <CodeSelect
                    label='Scheme Type'
                    mode='multiple'
                    options={chasSchemeTypes}
                    valueField='code'
                    labelField='displayValue'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='isGroup'
              render={args => (
                <Checkbox {...args} label='Group By Sheme Type' />
              )}
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
