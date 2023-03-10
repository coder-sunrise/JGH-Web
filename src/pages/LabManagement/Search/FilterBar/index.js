import React, { PureComponent } from 'react'
import { FastField, withFormik } from 'formik'
import { formatMessage, FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import PersonAdd from '@material-ui/icons/PersonAdd'

import { withStyles } from '@material-ui/core'
import { standardRowHeight } from 'mui-pro-jss'
import Authorized from '@/utils/Authorized'
import {
  GridContainer,
  GridItem,
  Button,
  TextField,
  Select,
  ClinicianSelect,
  ProgressButton,
  DateRangePicker,
} from '@/components'

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
  tansactionCheck: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    right: 0,
  },
})

@withFormik({
  mapPropsToValues: ({ search }) => {
    return {
      search,
    }
  },
})
class FilterBar extends PureComponent {
  render() {
    const { classes, dispatch, disableAdd, simple } = this.props

    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem md={4}>
            <FastField
              name='search1'
              render={args => {
                return <Select label='Service Center' {...args} />
              }}
            />
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='search3'
              render={args => {
                return <TextField label='Patient Acct No.' {...args} />
              }}
            />
          </GridItem>
          <GridItem md={4}>
            <ClinicianSelect label='Doctor' />
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='search4'
              render={args => {
                return <Select label='Service Category' {...args} />
              }}
            />
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='search7'
              render={args => {
                return <TextField label='Patient Name' {...args} />
              }}
            />
          </GridItem>
          <GridItem md={4} />
          <GridItem md={4}>
            <FastField
              name='search5'
              render={args => {
                return <Select label='Status' {...args} />
              }}
            />
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='search6'
              render={args => {
                return <DateRangePicker label='Order Date' {...args} />
              }}
            />
          </GridItem>
          <GridItem md={4}>
            <div className={classes.filterBtn}>
              <ProgressButton
                variant='contained'
                color='primary'
                icon={<Search />}
                onClick={() => {}}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(FilterBar)
