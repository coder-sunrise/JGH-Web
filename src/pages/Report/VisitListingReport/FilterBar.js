import React, { useEffect, useState } from 'react'
// formik
import { FastField, Field } from 'formik'
// common components
import {
  Button,
  CodeSelect,
  GridContainer,
  GridItem,
  RadioGroup,
  SizeContainer,
  Select,
} from '@/components'
// medisys components
import { DoctorProfileSelect } from '@/components/_medisys'
import service from '@/services/patient'
import Call from '@material-ui/icons/Call'
import ReportDateRangePicker from '../ReportDateRangePicker'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'
import { fetchCodeTable } from '@/utils/codetable'

const { queryList, query } = service
const FilterBar = ({
  handleSubmit,
  isSubmitting,
  visitOrderTemplateOptions = [],
  classes,
}) => {
  const [ctcopayer, setCTCopayer] = useState([])
  useEffect(() => {
    const response = fetchCodeTable('ctcopayer', {
      isActive: undefined,
      apiCriteria: { excludeInactiveCodes: false },
    }).then(response => {
      const newCopayer = [
        { id: 0, displayValue: 'None' },
        ...response.map(x => ({ ...x, isActive: true })),
      ]
      setCTCopayer(newCopayer)
    })
  }, [])
  const selectPatientProfile = args => {
    const { disabled } = args
    return (
      <Select
        disabled={disabled}
        query={v => {
          if (typeof v === 'number') {
            return query({ id: v })
          }
          return queryList({
            apiCriteria: {
              searchValue: v,
              includeinactive: false,
            },
          })
        }}
        handleFilter={() => true}
        valueField='id'
        label='Patient Name/Account No./Mobile No./Ref. No.'
        renderDropdown={p => {
          const { contact = {} } = p
          const {
            mobileContactNumber = {},
            officeContactNumber = {},
            homeContactNumber = {},
          } = contact
          p.mobileNo = mobileContactNumber.number || p.mobileNo
          p.officeNo = officeContactNumber.number || p.officeNo
          p.homeNo = homeContactNumber.number || p.homeNo
          return (
            <div>
              <p>
                {p.patientAccountNo} / {p.name}
              </p>
              <p>
                Ref No. {p.patientReferenceNo}
                <span style={{ float: 'right' }}>
                  <Call className={classes.contactIcon} />
                  {p.mobileNo || p.officeNo || p.homeNo}
                </span>
              </p>
            </div>
          )
        }}
        {...args}
      />
    )
  }

  return (
    <SizeContainer size='sm'>
      <GridContainer>
        <GridContainer alignItems='center'>
          <GridItem xs md={4}>
            <Field
              disabled
              name='patientProfileID'
              render={selectPatientProfile}
            />
          </GridItem>
          <ReportDateRangePicker />
          <GridItem md={2}>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Generate Report
            </Button>
          </GridItem>
          <GridItem md={12} />
          <GridItem md={2}>
            <Field
              name='visitPurposeIDS'
              render={args => (
                <CodeSelect
                  {...args}
                  maxTagCount={0}
                  options={[
                    { id: 0, displayValue: 'None' },
                    ...visitOrderTemplateOptions,
                  ]}
                  labelField='displayValue'
                  mode='multiple'
                  label='Visit Purpose'
                />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='doctorIDs'
              render={args => (
                <DoctorProfileSelect
                  {...args}
                  maxTagCount={0}
                  allValue={-99}
                  allValueOption={{
                    id: -99,
                    clinicianProfile: {
                      name: 'All',
                    },
                  }}
                  labelField='clinicianProfile.name'
                  mode='multiple'
                />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <Field
              name='copayerIDs'
              render={args => (
                <CodeSelect
                  {...args}
                  maxTagCount={0}
                  title='Copayers that patient visit claimed'
                  options={ctcopayer}
                  labelField='displayValue'
                  mode='multiple'
                  label='Co-Payer'
                  renderDropdown={option => {
                    return <CopayerDropdownOption option={option} />
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
                      value: 'VisitPurpose',
                      label: 'Visit Purpose',
                    },
                    {
                      value: 'Doctor',
                      label: 'Doctor',
                    },
                    {
                      value: 'Copayer',
                      label: 'Co-Payer',
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
        </GridContainer>
      </GridContainer>
    </SizeContainer>
  )
}

export default FilterBar
