import React from 'react'
// formik
import { FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  CardContainer,
  DatePicker,
  GridContainer,
  GridItem,
  NumberInput,
  dateFormatLong,
  Tooltip,
} from '@/components'
// styles
import Warining from '@material-ui/icons/Error'
import classnames from 'classnames'
import styles from './styles'

const amountProps = {
  noUnderline: true,
  currency: true,
  disabled: true,
  rightAlign: true,
  normalText: true,
  text: true,
}
const customStyle = { position: 'relative', top: 8 }
const InvoiceBanner = ({ classes, ...restProps }) => {
  const { values, patient = {} } = restProps
  const { entity = {} } = patient
  const pateintDisplayName = `${values.patientName ||
    'N/A'} ${values.patientAccountNo || 'N/A'}`

  return (
    <CardContainer
      hideHeader
      size='sm'
      style={
        entity && !entity.isActive
          ? {
              backgroundColor: 'lightYellow',
            }
          : {}
      }
    >
      <GridContainer xs={12}>
        <GridContainer item md={3} alignItems='flex-start'>
          <GridItem md={4}>
            <h5 className={classes.boldText}>Patient Name: </h5>
          </GridItem>
          <GridItem md={8}>
            <div style={{ display: 'flex' }}>
              <Tooltip title={pateintDisplayName}>
                <span
                  className={classnames({
                    [classes.normalText]: true,
                    [classes.overTextEllipsis]: true,
                    [classes.inActiveText]: entity && !entity.isActive,
                  })}
                  style={{
                    fontWeight: '600',
                  }}
                >
                  <span className='baseOnCustomStyle'>
                    {pateintDisplayName}
                  </span>
                </span>
              </Tooltip>
              {entity && !entity.isActive && (
                <Tooltip title='This patient has been inactived.'>
                  <Warining
                    color='error'
                    style={{ marginLeft: 5, marginTop: 8 }}
                  />
                </Tooltip>
              )}
            </div>
          </GridItem>
          <GridItem md={4}>
            <h5 className={classes.boldText}>Invoice No: </h5>
          </GridItem>
          <GridItem md={8}>
            <span className='baseOnCustomStyle' style={{ ...customStyle }}>
              {values.invoiceNo}
            </span>
          </GridItem>
          <GridItem md={4}>
            <h5 className={classes.boldText}>Invoice Date:</h5>
          </GridItem>
          <GridItem md={8}>
            <DatePicker
              text
              format={dateFormatLong}
              value={values.invoiceDate}
              style={{ ...customStyle }}
            />
          </GridItem>
        </GridContainer>

        <GridContainer item md={3} alignItems='flex-start'>
          <GridItem md={5}>
            <h5 className={classes.boldText}>Invoice Amount: </h5>
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='invoiceTotalAftGST'
              render={args => (
                <NumberInput
                  style={{ ...customStyle }}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} />
          <GridItem md={5}>
            <h5 className={classes.boldText}>Write Off Amount: </h5>
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='writeOffAmount'
              render={args => (
                <NumberInput
                  style={{ ...customStyle }}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} />
          <GridItem md={5}>
            <h5 className={classes.boldText}>&nbsp;</h5>
          </GridItem>
          <GridItem md={3}>
            <h5 className={classes.normalText}>&nbsp;</h5>
          </GridItem>
          <GridItem md={4} />
        </GridContainer>

        <GridContainer item md={3} alignItems='flex-start'>
          <GridItem md={5}>
            <h5 className={classes.boldText}>Total Paid: </h5>
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='totalPayment'
              render={args => (
                <NumberInput
                  style={{ ...customStyle }}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} />
          <GridItem md={5}>
            <h5 className={classes.boldText}>Credit Note: </h5>
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='totalCreditNoteAmt'
              render={args => (
                <NumberInput
                  style={{ ...customStyle }}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} />
          <GridItem md={5}>
            <h5 className={classes.boldText}>&nbsp;</h5>
          </GridItem>
          <GridItem md={7}>
            <h5 className={classes.normalText}>&nbsp;</h5>
          </GridItem>
        </GridContainer>

        <GridContainer item md={3} alignItems='flex-start'>
          <GridItem md={5}>
            <h5 className={classes.boldText}>O/S Balance: </h5>
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='outstandingBalance'
              render={args => (
                <NumberInput
                  style={{ ...customStyle }}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} />
          <GridItem md={5}>
            <h5 className={classes.boldText}>&nbsp;</h5>
          </GridItem>
          <GridItem md={7}>
            <h5 className={classes.normalText}>&nbsp;</h5>
          </GridItem>
          <GridItem md={5}>
            <h5 className={classes.boldText}>&nbsp;</h5>
          </GridItem>
          <GridItem md={7}>
            <h5 className={classes.normalText}>&nbsp;</h5>
          </GridItem>
        </GridContainer>
      </GridContainer>
    </CardContainer>
  )
}

export default withStyles(styles, { name: 'InvoiceBanner' })(InvoiceBanner)
