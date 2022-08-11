import React, { PureComponent } from 'react'
import moment from 'moment'
import { formatMessage } from 'umi'
import { Paper, withStyles } from '@material-ui/core'
import { connect } from 'dva'
import {
  GridContainer,
  GridItem,
  DatePicker,
  NumberInput,
  CustomInput,
  TextField,
  CardContainer,
  CodeSelect,
  withFormikExtend,
  Field,
  FastField,
} from '@/components'
import { COPAYER_TYPE } from '@/utils/constants'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const styles = theme => ({
  root: {
    padding: '10px',
    marginBottom: '10px',
  },

  boldText: {
    '& > p': {
      fontWeight: '700',
    },
  },

  gridItem: {
    // margin: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontSize: '1.15em',
  },
})

const amountProps = {
  noUnderline: true,
  currency: true,
  disabled: true,
  rightAlign: true,
  normalText: true,
}

class DetailsHeader extends PureComponent {
  render() {
    const { classes, history, values, theme } = this.props
    const cfg = {
      prefixProps: {
        classes: {
          root: classes.boldText,
        },
      },
      fullWidth: true,
      rightAlign: true,
      text: true,
    }

    return (
      <CardContainer hideHeader size='sm'>
        <GridContainer gutter={theme.spacing(3)}>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <Field
              name='statementNo'
              render={args => (
                <TextField prefix='Statement No.:' {...cfg} {...args} />
              )}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <FastField
              name='statementDate'
              render={args => (
                <DatePicker prefix='Statement Date:' {...cfg} {...args} />
              )}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <Field
              name='copayerFK'
              render={args => (
                <CodeSelect
                  code='ctcopayer'
                  showOptionTitle={false}
                  renderDropdown={option => {
                    return (
                      <CopayerDropdownOption
                        option={option}
                      ></CopayerDropdownOption>
                    )
                  }}
                  prefix='Co-Payer:'
                  additionalSearchField='code'
                  rightAlign
                  text
                  labelField='displayValue'
                  localFilter={item =>
                    [COPAYER_TYPE.CORPORATE, COPAYER_TYPE.INSURANCE].indexOf(
                      item.coPayerTypeFK,
                    ) >= 0
                  }
                  {...cfg}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <Field
              name='paymentTerm'
              render={args => (
                <TextField
                  prefix='Payment Term:'
                  suffix='Day(s)'
                  rightAlign
                  text
                  {...cfg}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <FastField
              name='adjustmentValueField'
              render={args => (
                <NumberInput
                  prefix='Statement Adjustment: '
                  {...cfg}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <Field
              name='adminChargeValueField'
              render={args => {
                return (
                  <NumberInput
                    prefix='Corporate Charge:'
                    {...cfg}
                    {...amountProps}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <FastField
              name='totalPayableAmount'
              render={args => (
                <NumberInput
                  prefix='Total Payable Amount:'
                  {...cfg}
                  {...amountProps}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={3} xs={12} className={classes.gridItem}>
            <FastField
              name='outstandingBalance'
              render={args => (
                <NumberInput
                  prefix='O/S Balance:'
                  {...cfg}
                  {...amountProps}
                  {...args}
                  defaultCurrencyFontColor
                />
              )}
            />
          </GridItem>
        </GridContainer>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(DetailsHeader)
