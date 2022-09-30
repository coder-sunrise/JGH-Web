import React, { useEffect, useState } from 'react'
// formik
import { FastField, Field } from 'formik'
// common components
import {
  Button,
  DatePicker,
  GridContainer,
  GridItem,
  SizeContainer,
  Checkbox,
  CodeSelect,
} from '@/components'
import { DoctorProfileSelect } from '@/components/_medisys'
import ReportDateRangePicker from '../ReportDateRangePicker'
import { INVOICE_ITEM_TYPE_BY_NAME } from '@/utils/constants'

const FilterBar = ({ handleSubmit, isSubmitting, setFieldValue }) => {
  let [serviceCenterIDsFieldState, setServiceCenterIDsFieldState] = useState(
    true,
  )
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker />

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
              name='categoryIDs'
              render={args => (
                <CodeSelect
                  {...args}
                  code='ltinvoiceitemtype'
                  mode='multiple'
                  label='Category'
                  maxTagTextLength={50}
                  localFilter={item => [1, 2, 3, 4, 6].includes(item.id)}
                  onChange={(_, value) => {
                    if (
                      !!value.find(
                        item => item?.id == INVOICE_ITEM_TYPE_BY_NAME.SERVICE,
                      )
                    ) {
                      setServiceCenterIDsFieldState(false)
                    } else {
                      setServiceCenterIDsFieldState(true)
                      setFieldValue('serviceCenterIDs', [])
                    }
                  }}
                />
              )}
            />
          </GridItem>
          <GridItem md={4}>
            <Field
              name='serviceCenterIDs'
              render={args => (
                <CodeSelect
                  {...args}
                  code='ctservicecenter'
                  mode='multiple'
                  label='Service Center'
                  force={true}
                  remoteFilter={{
                    isActive: undefined,
                  }}
                  maxTagTextLength={50}
                  disabled={serviceCenterIDsFieldState}
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
