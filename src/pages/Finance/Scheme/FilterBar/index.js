import React from 'react'
import { FastField, withFormik } from 'formik'
import { formatMessage, FormattedMessage } from 'umi/locale'
import { Search, Add } from '@material-ui/icons'
import { withStyles } from '@material-ui/core'
import { standardRowHeight } from 'mui-pro-jss'
import { compose } from 'redux'
import {
  GridContainer,
  GridItem,
  Button,
  TextField,
  CodeSelect,
  Select,
  ProgressButton,
} from '@/components'
import { status } from '@/utils/codes'
import Authorized from '@/utils/Authorized'

const styles = (theme) => ({
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
const FilterBar = ({ classes, dispatch, history, schemeDetail, values }) => {
  return (
    <div className={classes.filterBar}>
      <GridContainer>
        <GridItem xs={6} md={4}>
          <FastField
            name='name'
            render={(args) => {
              return (
                <TextField
                  label={formatMessage({
                    id: 'finance.scheme.search.name',
                  })}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={4}>
          <FastField
            name='schemeTypeFK'
            render={(args) => {
              return (
                <CodeSelect
                  label={formatMessage({
                    id: 'finance.scheme.search.type',
                  })}
                  code='ctSchemeType'
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={4}>
          <FastField
            name='coPayerFK'
            render={(args) => {
              return (
                <CodeSelect
                  label={formatMessage({
                    id: 'finance.scheme.search.cpname',
                  })}
                  code='ctCopayer'
                  labelField='displayValue'
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={4}>
          <FastField
            name='copayerTypeFK'
            render={(args) => {
              return (
                <CodeSelect
                  label={formatMessage({
                    id: 'finance.scheme.search.cptype',
                  })}
                  code='ctCopayerType'
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={6} md={4}>
          <FastField
            name='isActive'
            render={(args) => {
              return <Select label='Status' {...args} options={status} />
            }}
          />
        </GridItem>
        <GridItem xs={12}>
          <div className={classes.filterBtn}>
            <ProgressButton
              variant='contained'
              color='primary'
              onClick={() => {
                const {
                  name,
                  schemeTypeFK,
                  schemeCategory,
                  coPayerFK,
                  copayerTypeFK,
                  isActive,
                } = values
                dispatch({
                  type: 'copaymentScheme/query',
                  payload: {
                    name,
                    schemeTypeFK,
                    schemeCategory,
                    coPayerFK,
                    'CopayerFKNavigation.copayerTypeFK': copayerTypeFK,
                    isActive,
                  },
                })
              }}
            >
              <Search />
              <FormattedMessage id='form.search' />
            </ProgressButton>

            <Authorized authority='scheme.newscheme'>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  dispatch({
                    type: 'schemeDetail/updateState',
                    payload: {
                      entity: undefined,
                    },
                  })
                  history.push('/finance/scheme/details')
                }}
              >
                <Add />
                Add New
              </Button>
            </Authorized>
          </div>
        </GridItem>
      </GridContainer>
    </div>
  )
}

export default compose(
  withStyles(styles, { withTheme: true }),
  withFormik({
    mapPropsToValues: () => {},
  }),
  React.memo,
)(FilterBar)
