import React from 'react'
import CoPayment from './CoPayment'
import CoverageCap from './CoverageCap'
// import ItemList from './ItemList'
import ItemList from './new_ItemList'

import {
  Field,
  GridContainer,
  GridItem,
  NumberInput,
  SizeContainer,
  CardContainer,
  FieldSet,
  Switch,
} from '@/components'

const CPSwitch = (label) => (args) => {
  if (!args.field.value) {
    args.field.value = 'ExactAmount'
  }
  console.log({ label, args })
  return (
    <Switch
      checkedChildren='$'
      checkedValue='ExactAmount'
      unCheckedChildren='%'
      unCheckedValue='Percentage'
      label={label}
      {...args}
    />
  )
}
const CPNumber = (label, type) => (args) => {
  return (
    <NumberInput
      label={label}
      currency={type === 'ExactAmount'}
      percentage={type === 'Percentage'}
      // format={type === 'ExactAmount' ? '$0,0.00' : '0.00'}
      min={0}
      defaultValue='0.00'
      {...args}
    />
  )
}
const Setting = (props) => {
  const { schemeDetail, height, classes, values, setFieldValue, theme } = props

  return (
    <div style={{ marginTop: theme.spacing(1) }}>
      <SizeContainer size='sm'>
        <GridContainer>
          <GridItem xs={8} md={5}>
            <Field
              name='patientMinCoPaymentAmount'
              render={CPNumber(
                'Minimum Patient Payable Amount',
                values.patientMinCoPaymentAmountType,
              )}
            />
          </GridItem>
          <GridItem xs={4} md={1}>
            <Field
              name='patientMinCoPaymentAmountType'
              render={CPSwitch(' ')}
            />
          </GridItem>
        </GridContainer>
        <GridContainer>
          <GridItem xs={12} md={6}>
            <FieldSet size='sm' title='Coverage Cap'>
              <CoverageCap
                setFieldValue={setFieldValue}
                values={values}
                {...props}
              />
            </FieldSet>
          </GridItem>
          <GridItem xs={12} md={6}>
            <FieldSet size='sm' title='Co-Payment'>
              <CoPayment
                schemeDetail={schemeDetail}
                setFieldValue={setFieldValue}
                values={values}
                {...props}
              />
            </FieldSet>
          </GridItem>
        </GridContainer>
        <ItemList
          {...props}
          // values={values}
          CPSwitch={CPSwitch}
          CPNumber={CPNumber}
          setFieldValue={setFieldValue}
        />
      </SizeContainer>
    </div>
  )
}

export default Setting
