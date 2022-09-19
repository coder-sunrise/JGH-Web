import React from 'react'
// formik
import { FastField } from 'formik'
import { withStyles } from '@material-ui/core'
import { formatMessage } from 'umi'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  SizeContainer,
  CodeSelect,
  TextField,
  Checkbox,
  DatePicker,
} from '@/components'
import ReportDateRangePicker from '../ReportDateRangePicker'

const styles = theme => ({
  generateBtn: {
    marginBottom: theme.spacing(1),
  },
})

const FilterBar = ({ classes, handleSubmit, isSubmitting, values }) => {
  return (
    <SizeContainer size='sm'>
      <React.Fragment>
        <GridContainer alignItems='flex-end'>
          <GridItem md={4}>
            <FastField
              name='packageIDs'
              render={args => (
                <CodeSelect
                  force
                  label='Package'
                  code='package'
                  labelField='displayValue'
                  mode='multiple'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={1} />
          <GridItem md={3}>
            <FastField
              name='patientCriteria'
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
          <GridItem md={4} />

          <ReportDateRangePicker
            fromDateLabel='Purchase Date From'
            toDateLabel='Purchase Date To'
            disabled={values.isAllDate}
          />

          <GridItem md={1}>
            <FastField
              name='isAllDate'
              render={args => (
                <Checkbox {...args} label='All Date' defaultValue />
              )}
            />
          </GridItem>
          <GridItem md={1}>
            <FastField
              name='expiredAfterDate'
              render={args => <DatePicker {...args} label='Expired After' />}
            />
          </GridItem>
          <GridItem md={2} className={classes.generateBtn}>
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

export default withStyles(styles, { name: 'PackageExpiryFilterBar' })(FilterBar)
