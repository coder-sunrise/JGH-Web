import React from 'react'
// formik
import { FastField } from 'formik'
import { formatMessage } from 'umi'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  DateRangePicker,
  Checkbox,
  GridItem,
  TextField,
  Select,
  GridContainer,
  CheckboxGroup,
  CodeSelect,
  NumberInput,
} from '@/components'
import { smsStatus, messageStatus } from '@/utils/codes'

const styles = theme => ({
  checkbox: {
    paddingTop: `${theme.spacing(2)}px !important`,
  },
})

const FilterByPatient = ({ classes, setFieldValue }) => {
  return (
    <React.Fragment>
      <GridItem md={4}>
        <FastField
          name='patientName'
          render={args => (
            <TextField
              {...args}
              label={formatMessage({
                id: 'reception.queue.patientSearchPlaceholder',
              })}
            />
          )}
        />
      </GridItem>
      <GridItem md={4}>
        <FastField
          name='visitDate'
          render={args => (
            <DateRangePicker {...args} label='Visit Date From' label2='To' />
          )}
        />
      </GridItem>
      <GridItem md={4} />

      <GridItem md={2}>
        <FastField
          name='nationality'
          render={args => (
            <CodeSelect {...args} label='Nationlity' code='ctnationality' />
          )}
        />
      </GridItem>
      <GridItem md={2} />
      <GridItem xs={8}>
        <FastField
          name='pdpaConsent'
          render={args => (
            <CheckboxGroup
              label='PDPA Consent - Agree to receive marketing material via:'
              horizontal
              valueField='id'
              textField='name'
              options={[
                {
                  id: '1',
                  name: 'Phone Call',
                  layoutConfig: {
                    style: {},
                  },
                },
                {
                  id: '2',
                  name: 'Text Message',
                  layoutConfig: {
                    style: {},
                  },
                },
                {
                  id: '3',
                  name: 'Email',
                  layoutConfig: {
                    style: {},
                  },
                },
              ]}
              {...args}
            />
          )}
        />
      </GridItem>

      <GridItem md={4}>
        <FastField
          name='noVisitDate'
          render={args => (
            <DateRangePicker
              {...args}
              label='No Visit Since From'
              label2='To'
            />
          )}
        />
      </GridItem>
      <GridItem md={4}>
        <FastField
          name='dob'
          render={args => (
            <DateRangePicker {...args} label='Birthday From' label2='To' />
          )}
        />
      </GridItem>
      <GridItem md={2}>
        <FastField
          name='ageFrom'
          render={args => (
            <NumberInput {...args} label='Age From' precision={0} />
          )}
        />
      </GridItem>

      <GridItem md={2}>
        <FastField
          name='ageTo'
          render={args => (
            <NumberInput {...args} label='Age To' precision={0} />
          )}
        />
      </GridItem>
      {/* <GridItem md={2}>
        <FastField
          name='messageStatus'
          render={(args) => (
            <Select {...args} label='Message Status' options={messageStatus} />
          )}
        />
      </GridItem> */}

      <GridItem md={2}>
        <FastField
          name='lastSMSSendStatus'
          render={args => (
            <Select {...args} label='SMS Status' options={smsStatus} />
          )}
        />
      </GridItem>
    </React.Fragment>
  )
}

export default withStyles(styles, { name: 'FilterByPatient' })(FilterByPatient)
