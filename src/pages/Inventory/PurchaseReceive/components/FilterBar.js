import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
// umi
import { formatMessage, FormattedMessage } from 'umi'
// formik
import { FastField, withFormik } from 'formik'
// material ui
import Search from '@material-ui/icons/Search'
import Add from '@material-ui/icons/Add'
// common components
import {
  GridContainer,
  GridItem,
  Button,
  TextField,
  Checkbox,
  CodeSelect,
  ProgressButton,
  DatePicker,
  Tooltip,
  Field,
} from '@/components'
import Authorized from '@/utils/Authorized'
import { FilterBarDate } from '@/components/_medisys'

// @connect(({ purchaseReceiveList }) => {
//   return purchaseReceiveList.filterSearch
// })
@withFormik({
  mapPropsToValues: () => ({
    transactionStartDate: moment()
      .startOf('month')
      .formatUTC(),
    transactionEndDate: moment()
      .endOf('day')
      .formatUTC(false),
  }),
  handleSubmit: () => {},
  displayName: 'PurchaseReceiveFilter',
})
class FilterBar extends PureComponent {
  render() {
    const {
      classes,
      dispatch,
      values,
      actions: { handleNavigate },
    } = this.props

    const {
      transactionStartDate,
      transactionEndDate,
      isAllDateChecked,
    } = values

    return (
      <GridContainer>
        <GridItem xs={6} md={3}>
          <FastField
            name='purchaseOrderNo'
            render={args => {
              return (
                <TextField
                  label={formatMessage({
                    id: 'inventory.pr.filter.pono',
                  })}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem md={3}>
          <Field
            name='transactionStartDate'
            render={args => (
              <FilterBarDate
                noTodayLimit
                args={args}
                disabled={isAllDateChecked}
                label='Date From'
                formValues={{
                  startDate: transactionStartDate,
                  endDate: transactionEndDate,
                }}
              />
            )}
          />
        </GridItem>
        <GridItem md={3}>
          <Field
            name='transactionEndDate'
            render={args => (
              <FilterBarDate
                noTodayLimit
                isEndDate
                args={args}
                label='Date To'
                disabled={isAllDateChecked}
                formValues={{
                  startDate: transactionStartDate,
                  endDate: transactionEndDate,
                }}
              />
            )}
          />
        </GridItem>
        <GridItem xs sm={6} md={3}>
          <FastField
            name='isAllDateChecked'
            render={args => {
              return (
                <Tooltip
                  title={formatMessage({
                    id: 'form.date.placeholder.allDate',
                  })}
                  placement='bottom'
                >
                  <Checkbox
                    label={formatMessage({
                      id: 'form.date.placeholder.allDate',
                    })}
                    inputLabel=' '
                    {...args}
                  />
                </Tooltip>
              )
            }}
          />
        </GridItem>
        {/* <GridItem xs={6} md={3}>
          <FastField
            name='invoiceStatusFK'
            render={args => {
              return (
                <CodeSelect
                  code='LTInvoiceStatus'
                  labelField='name'
                  label={formatMessage({
                    id: 'inventory.pr.invoiceStatus',
                  })}
                  {...args}
                />
              )
            }}
          />
        </GridItem> */}
        <GridItem xs={6} md={3}>
          <FastField
            name='supplierFK'
            render={args => {
              return (
                <CodeSelect
                  label={formatMessage({
                    id: 'inventory.pr.supplier',
                  })}
                  code='ctSupplier'
                  labelField='displayValue'
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={3}>
          <FastField
            name='purchaseOrderStatusFK'
            render={args => {
              return (
                <CodeSelect
                  code='LTPurchaseOrderStatus'
                  labelField='name'
                  label={formatMessage({
                    id: 'inventory.pr.poStatus',
                  })}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={12} md={3}>
          <div className={classes.buttonGroup}>
            <ProgressButton
              color='primary'
              icon={<Search />}
              onClick={() => {
                const {
                  purchaseOrderNo,
                  purchaseRequestNo,
                  invoiceStatusFK,
                  purchaseOrderStatusFK,
                  // transactionDates,
                  supplierFK,
                  isAllDateChecked,
                } = values
                // const fromToDates = (index) => {
                //   if (transactionDates && !isAllDateChecked)
                //     return transactionDates[index]
                //   return undefined
                // }

                dispatch({
                  type: 'purchaseReceiveList/query',
                  payload: {
                    lgteql_purchaseOrderDate: isAllDateChecked
                      ? undefined
                      : transactionStartDate,
                    lsteql_purchaseOrderDate: isAllDateChecked
                      ? undefined
                      : transactionEndDate,
                    // purchaseOrderNo,
                    invoiceStatusFK,
                    purchaseOrderStatusFK,
                    supplierFK,
                    group: [
                      {
                        purchaseOrderNo,
                        purchaseRequestNo:purchaseOrderNo,
                        combineCondition: 'or',
                      },
                    ],
                  },
                })
              }}
            >
              <FormattedMessage id='form.search' />
            </ProgressButton>
            {/* <Authorized authority='purchasingandreceiving.newpurchasingandreceiving'>
              <Button onClick={() => handleNavigate('new')} color='primary'>
                <Add />
                Add New
              </Button>
            </Authorized> */}
          </div>
        </GridItem>
      </GridContainer>
    )
  }
}

export default FilterBar
