import React, { useEffect, useState, memo } from 'react'
// formik
import { FastField, Field } from 'formik'
import {
  Button,
  GridContainer,
  GridItem,
  CheckBox,
  TextField,
  SizeContainer,
  CodeSelect,
  DateRangePicker,
  withFormikExtend,
  Tooltip,
  Select,
} from '@/components'
import { ReportDateRangePicker } from '@/pages/Report/ReportDateRangePicker'
import Checkbox from '@/components/Checkbox'
import { DoctorProfileSelect } from '@/components/_medisys'
import { useDispatch } from 'react-redux'
import moment from 'moment'

const searchResult = (values, props) => {
  const { dispatch, setState } = props
  const {
    orderDate,
    allDate,
    category,
    examinationName,
    doctorIDs,
    status,
  } = values

  const orderStartDate =
    orderDate && orderDate.length > 0
      ? moment(orderDate[0])
          .startOf('day')
          .formatUTC()
      : undefined
  const orderEndDate =
    orderDate && orderDate.length > 1
      ? moment(orderDate[1])
          .endOf('day')
          .formatUTC(false)
      : undefined
  const payload = {
    orderStartDate: allDate ? undefined : orderStartDate || undefined,
    orderEndDate: allDate ? undefined : orderEndDate || undefined,
    examinationName: examinationName || undefined,
    category: category,
    doctorIDs: doctorIDs,
    status: status,
  }
}
const FilterBar = props => {
  const [category, setCategory] = useState('Lab')
  const dispatch = useDispatch()
  const { handleSubmit, isSubmitting } = props
  const { setFieldValue, values } = props
  useEffect(() => {
    setFieldValue('category', 'Lab')
    setFieldValue('status', [6])
    setFieldValue('doctorIDs', [-99])
    setFieldValue(
      'visitDate[0]',
      moment(new Date())
        .startOf('day')
        .toDate(),
    )
    setFieldValue(
      'visitDate[1]',
      moment(new Date())
        .endOf('day')
        .toDate(),
    )
  }, [])
  useEffect(() => {
    if (category === 'Lab') {
      setFieldValue('status', [6])
    } else {
      setFieldValue('status', [3, 4])
    }
  }, [category])
  const radiologyStatus = [
    {
      id: 4,
      code: 'Completed',
      name: 'Completed',
    },
    {
      id: 3,
      code: 'Modality Completed',
      name: 'Modality Completed',
    },
    {
      id: 2,
      code: 'In Progress',
      name: 'In Progress',
    },
    {
      id: 1,
      code: 'New',
      name: 'New',
    },
    {
      id: 5,
      code: 'Cancelled',
      name: 'Cancelled',
    },
  ]
  const labStatus = [
    {
      id: 6,
      code: 'Completed',
      name: 'Completed',
    },
    {
      id: 4,
      code: 'In Progress',
      name: 'In Progress',
    },
    {
      id: 1,
      code: 'New',
      name: 'New',
    },
  ]
  return (
    <div>
      <GridContainer alignItems='flex-end'>
        <Field
          name='category'
          render={args => {
            const { form: fm } = args
            return (
              <Select
                {...args}
                style={{ width: 140, marginRight: 10 }}
                label='Category'
                options={[
                  { id: 1, name: 'Lab', value: 'Lab' },
                  { id: 2, name: 'Radiology', value: 'Radiology' },
                ]}
                onChange={v => {
                  setFieldValue('status', '')
                  setCategory(v)
                }}
                allowClear={false}
              />
            )
          }}
        />
        <FastField
          name='examinationName'
          render={args => (
            <TextField
              maxLength={50}
              style={{
                width: 200,
                position: 'relative',
                marginRight: 10,
              }}
              label='Examination Name'
              {...args}
            />
          )}
        />
        <Field
          name='visitDate'
          render={args => {
            return (
              <DateRangePicker
                style={{
                  width: 280,
                  position: 'relative',
                  marginRight: 10,
                }}
                disabled={values.allDate}
                label='Visit Date From'
                label2='To'
                {...args}
              />
            )
          }}
        />
        <Field
          name='allDate'
          render={args => {
            return (
              <Checkbox
                style={{
                  width: 80,
                  position: 'relative',
                  marginRight: 10,
                }}
                inputLabel=' '
                label='All Date'
                {...args}
              />
            )
          }}
        />
        <FastField
          name='doctorIDs'
          render={args => (
            <Tooltip
              placement='right'
              title='Select "All" will retrieve active and inactive doctors'
            >
              <DoctorProfileSelect
                mode='multiple'
                {...args}
                style={{ width: 200, marginRight: 10 }}
                allValue={-99}
                allValueOption={{
                  id: -99,
                  clinicianProfile: {
                    name: 'All',
                  },
                }}
                maxTagCount={0}
                labelField='clinicianProfile.name'
              />
            </Tooltip>
          )}
        />
        {category === 'Lab' && (
          <FastField
            name='status'
            render={args => {
              const { form } = args
              return (
                <CodeSelect
                  {...args}
                  style={{ width: 170, marginRight: 10 }}
                  label='Status'
                  options={labStatus}
                  mode='multiple'
                  labelField='name'
                  maxTagCount={0}
                  temp
                />
              )
            }}
          />
        )}
        {category === 'Radiology' && (
          <FastField
            name='status'
            initialValue={[3, 4]}
            render={args => {
              const { form } = args
              return (
                <CodeSelect
                  {...args}
                  style={{ width: 170, marginRight: 10 }}
                  label='Status'
                  options={radiologyStatus}
                  maxTagCount={0}
                  mode='multiple'
                  labelField='name'
                  temp
                />
              )
            }}
          />
        )}
        <Button
          color='primary'
          style={{ position: 'relative', top: -8 }}
          onClick={handleSubmit}
          // disabled={isSubmitting}
        >
          Search
        </Button>
      </GridContainer>
    </div>
  )
}
export default memo(
  withFormikExtend({
    handleSubmit: (values, { props, resetForm }) => {
      const { search } = props
      const payload = {
        ...values,
        doctorIDs: (values.doctorIDs || []).join('|'),
        status: (values.status || []).join('|'),
      }
      search(payload)
    },
  })(FilterBar),
)
