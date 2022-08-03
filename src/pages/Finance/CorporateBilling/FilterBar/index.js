import React from 'react'
import { FastField, withFormik, Field } from 'formik'
import { formatMessage, FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import { withStyles } from '@material-ui/core'
import { standardRowHeight } from 'mui-pro-jss'
import { compose } from 'redux'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'
import {
  GridContainer,
  GridItem,
  Button,
  TextField,
  CodeSelect,
  Select,
  ProgressButton,
} from '@/components'
import { osBalanceStatus, status } from '@/utils/codes'
import Authorized from '@/utils/Authorized'

const styles = theme => ({
  filterBar: {
    marginBottom: '10px',
  },
  filterBtn: {
    lineHeight: standardRowHeight,
    textAlign: 'left',
    '& > button': {
      marginRight: theme.spacing.unit,
    },
  },
})

const FilterBar = ({
  classes,
  handleSubmit,
  corporateBilling: { ctCoPayer },
}) => {
  return (
    <div className={classes.filterBar}>
      <GridContainer>
        <GridItem xs={4} md={3} style={{ position: 'relative' }}>
          <Field
            name='copayerFK'
            render={args => {
              return (
                <CodeSelect
                  options={ctCoPayer}
                  label='Co-Payer'
                  labelField='name'
                  additionalSearchField='code'
                  showOptionTitle={false}
                  renderDropdown={option => {
                    return (
                      <CopayerDropdownOption
                        option={option}
                        labelField='name'
                      ></CopayerDropdownOption>
                    )
                  }}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={4} md={3}>
          <FastField
            name='outstandingBalanceStatus'
            render={args => {
              return (
                <Select
                  label='O/S Balance'
                  options={osBalanceStatus}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={4} md={3}>
          <FastField
            name='isActive'
            render={args => {
              return <Select label='Status' {...args} options={status} />
            }}
          />
        </GridItem>
        <GridItem xs={12}>
          <div className={classes.filterBtn}>
            <ProgressButton
              icon={<Search />}
              variant='contained'
              color='primary'
              onClick={handleSubmit}
            >
              <FormattedMessage id='form.search' />
            </ProgressButton>
          </div>
        </GridItem>
      </GridContainer>
    </div>
  )
}

export default compose(
  withStyles(styles, { withTheme: true }),
  withFormik({
    mapPropsToValues: () => ({
      isActive: true,
      copayerFK: 'All Co-Payer',
    }),
    handleSubmit: (values, { props }) => {
      const { copayerFK, isActive, outstandingBalanceStatus } = values
      let isOutstanding
      if (outstandingBalanceStatus === 'yes') {
        isOutstanding = true
      } else if (outstandingBalanceStatus === 'no') {
        isOutstanding = false
      }
      props.dispatch({
        type: 'corporateBilling/query',
        payload: {
          apiCriteria: {
            CopayerId: typeof copayerFK === 'number' ? copayerFK : undefined,
            IsOutstanding: isOutstanding,
            IsActive: isActive,
          },
        },
      })
    },
  }),
  React.memo,
)(FilterBar)
