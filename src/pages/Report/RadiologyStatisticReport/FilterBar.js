import React, { useState, useEffect } from 'react'
// formik
import { FastField, Field } from 'formik'
import { connect } from 'dva'
import {
  Button,
  Checkbox,
  DatePicker,
  GridContainer,
  GridItem,
  CodeSelect,
  SizeContainer,
  Select,
  Tooltip,
  ClinicianSelect,
  VisitTypeSelect,
} from '@/components'
import { DoctorProfileSelect } from '@/components/_medisys'
import ReportDateRangePicker from '../ReportDateRangePicker'

const FilterBar = ({
  handleSubmit,
  isSubmitting,
  ctservice = [],
  cttag = [],
}) => {
  const serviceOptions = Object.values(
    _.groupBy(
      ctservice.filter(t => t.serviceCenterCategoryFK === 3),
      'serviceId',
    ),
  ).map(x => {
    return { id: x[0].serviceId, name: x[0].displayValue }
  })
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <ReportDateRangePicker
            fromDateLabel='Order Date From'
            toDateLabel='Order Date To'
            fromDateCols='1'
            toDateCols='1'
          />
          <GridItem md={2}>
            <FastField
              name='radiographerIDs'
              render={args => (
                <Tooltip
                  placement='right'
                  title='Select "All" will retrieve active and inactive radiographers'
                >
                  <ClinicianSelect
                    label='Radiology Technologist'
                    noDefaultValue
                    mode='multiple'
                    force={true}
                    orderBy={[
                      ['clinicRoleFK', o => (o.name || '').toLowerCase()],
                      ['desc', 'asc'],
                    ]}
                    customOrder
                    maxTagPlaceholder='Radiology Technologists'
                    {...args}
                    localFilter={item =>
                      (item.userProfile.role.clinicRoleFK === 3 ||
                        item.userProfile.role.clinicRoleFK === 1) &&
                      item.isActive &&
                      item.userProfile.isActive
                    }
                  />
                </Tooltip>
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='modalityIDs'
              render={args => (
                <Tooltip
                  placement='right'
                  title='Select "All" will retrieve active and inactive modality'
                >
                  <CodeSelect
                    mode='multiple'
                    label='Modality'
                    code='ctmodality'
                    maxTagPlaceholder='Modalities'
                    remoteFilter={{
                      isActive: true,
                    }}
                    {...args}
                  />
                </Tooltip>
              )}
            ></FastField>
          </GridItem>
          <GridItem md={2}>
            <Field
              name='serviceIDs'
              render={args => (
                <Tooltip
                  placement='right'
                  title='Select "All" will retrieve active and inactive examinations'
                >
                  <CodeSelect
                    label='Examination'
                    mode='multiple'
                    options={serviceOptions}
                    maxTagPlaceholder='Examinations'
                    {...args}
                  />
                </Tooltip>
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='visitTypeIDs'
              render={args => (
                <Tooltip
                  placement='right'
                  title='Select "All" will retrieve active and inactive visit type'
                >
                  <VisitTypeSelect
                    label='Visit Type'
                    {...args}
                    mode='multiple'
                    maxTagPlaceholder='Visit Types'
                    allowClear={true}
                  />
                </Tooltip>
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <Field
              name='tags'
              render={args => (
                <Tooltip
                  placement='right'
                  title='Select “All” will retrieve active and inactive patient tag'
                >
                  <CodeSelect
                    label='Patient Tag'
                    mode='multiple'
                    options={cttag}
                    maxTagPlaceholder='Patient Tags'
                    {...args}
                  />
                </Tooltip>
              )}
            />
          </GridItem>
          <GridItem md={12} style={{ textAlign: 'right' }}>
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

const Connected = connect(({ codetable }) => ({
  ctservice: codetable.ctservice,
}))(FilterBar)

export default Connected
