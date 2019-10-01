import React, { PureComponent } from 'react'
import { FastField, withFormik } from 'formik'
import { formatMessage, FormattedMessage } from 'umi/locale'
import { Search, PermIdentity } from '@material-ui/icons'
import { withStyles, Tooltip } from '@material-ui/core'
import { standardRowHeight } from 'mui-pro-jss'
import { getAppendUrl } from '@/utils/utils'

import {
  GridContainer,
  GridItem,
  Select,
  Button,
  TextField,
  NumberField,
  Checkbox,
  DatePicker,
  DateRangePicker,
} from '@/components'

const styles = (theme) => ({
  filterBar: {
    marginBottom: '10px',
  },
  filterBtn: {
    // paddingTop: '13px',
    lineHeight: standardRowHeight,
    textAlign: 'left',
    '& > button': {
      marginRight: theme.spacing.unit,
    },
  },
  tansactionCheck: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    right: 14,
  },
})

@withFormik({
  mapPropsToValues: () => {},
})
class FilterBar extends PureComponent {
  render () {
    const { classes, dispatch, theme } = this.props
    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs sm={12} md={4} style={{ position: 'relative' }}>
            <FastField
              name='ExpenseType'
              render={(args) => {
                return (
                  <TextField
                    label={formatMessage({
                      id: 'finance.deposit.search.patient',
                    })}
                    {...args}
                  />
                )
              }}
            />
            {/* <div className={classes.tansactionCheck} /> */}
          </GridItem>

          <GridItem xs={6} md={6}>
            <FastField
              name='transactionDates'
              render={(args) => {
                return (
                  <DateRangePicker
                    label='Transaction Date From'
                    label2='To'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>

          <GridItem xs sm={6} md={3}>
            <FastField
              name='TansactionOnly'
              render={(args) => {
                return (
                  <Tooltip
                    title={formatMessage({
                      id: 'finance.deposit.search.tansaction',
                    })}
                    placement='bottom'
                  >
                    <Checkbox
                      label={formatMessage({
                        id: 'finance.deposit.search.tansaction',
                      })}
                      simple
                      {...args}
                    />
                  </Tooltip>
                )
              }}
            />
          </GridItem>

          {/*<GridItem xs sm={12} md={2}>
            <FastField
              name='ExpenseType'
              render={(args) => {
                return (
                  <Select
                    label={formatMessage({
                      id: 'finance.deposit.search.gender',
                    })}
                    // noWrapper
                    options={[
                      { name: 'All', value: '0' },
                      { name: 'Male', value: '1' },
                      { name: 'Female', value: '2' },
                      { name: 'Unknown', value: '3' },
                    ]}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
           <GridItem xs sm={6} md={1}>
            <FastField
              name='AgeStart'
              render={(args) => {
                return (
                  <NumberField
                    label={formatMessage({
                      id: 'finance.deposit.search.age.start',
                    })}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs sm={6} md={1}>
            <FastField
              name='AgeEnd'
              render={(args) => {
                return (
                  <NumberField
                    label={formatMessage({
                      id: 'finance.deposit.search.age.end',
                    })}
                    {...args}
                  />
                )
              }}
            />
          </GridItem> */}
          <GridItem xs={12} md={12}>
            <div className={classes.filterBtn}>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  const { transactionDates, ExpenseType } = this.props.values
                  this.props.dispatch({
                    type: 'deposit/query',
                    payload: {
                      // patientDepositTransaction: {

                      // },
                      // lgteql_lastTransactionDate: transactionDates[0],
                      // lsteql_lastTransactionDate: transactionDates[1],

                      group: [
                        {
                          'contactFkNavigation.contactNumber.number': ExpenseType,
                          // 'PatientDepositFKNavigation.ReferenceNo': ExpenseType,
                          patientAccountNo: ExpenseType,
                          name: ExpenseType,
                          combineCondition: 'or',
                        },
                      ],
                    },
                  })
                }}
              >
                <Search />
                <FormattedMessage id='form.search' />
              </Button>

              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  this.props.history.push(
                    getAppendUrl({
                      md: 'pt',
                      cmt: '1',
                      new: 1,
                    }),
                  )
                }}
              >
                <PermIdentity />
                New Patient
              </Button>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(FilterBar)
