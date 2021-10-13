import React from 'react'
import { formatMessage } from 'umi'
import { withStyles } from '@material-ui/core/styles'
import { FastField } from 'formik'
import { compose } from 'redux'
import {
  CodeSelect,
  CardContainer,
  TextField,
  GridContainer,
  GridItem,
  DateRangePicker,
  Select,
} from '@/components'
import Setting from './Setting'

const styles = () => ({})

const Detail = ({ height, ...props }) => {
  const { values, codetable } = props
  const { copayerTypeFK } = values

  const getCopayerOptions = () => {
    const { ctcopayer = [] } = codetable
    if (copayerTypeFK === 2) return ctcopayer
    const options = ctcopayer.filter(
      copayerList => copayerList.coPayerTypeFK === 1,
    )
    return options
  }

  return (
    <CardContainer
      hideHeader
      style={{
        height,
        overflowX: 'hidden',
      }}
    >
      <GridContainer gutter={0}>
        <GridItem xs={6} md={6} direction='column'>
          <GridItem xs={9}>
            <FastField
              name='code'
              render={args => {
                return (
                  <TextField
                    label={formatMessage({
                      id: 'finance.scheme.detail.code',
                    })}
                    disabled
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={9}>
            <FastField
              name='name'
              render={args => {
                return (
                  <TextField
                    label={formatMessage({
                      id: 'finance.scheme.detail.name',
                    })}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={9}>
            <FastField
              name='description'
              render={args => {
                return (
                  <TextField
                    label={formatMessage({
                      id: 'finance.scheme.detail.description',
                    })}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={9}>
            <FastField
              name='remarks'
              render={args => {
                return (
                  <TextField
                    label={formatMessage({
                      id: 'finance.scheme.detail.remarks',
                    })}
                    multiline
                    rowsMax='5'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridItem>
        <GridItem xs={6} md={6} direction='column'>
          <GridItem xs={9}>
            <FastField
              name='schemeTypeFK'
              render={args => {
                return (
                  <CodeSelect
                    label={formatMessage({
                      id: 'finance.scheme.detail.type',
                    })}
                    code='ctSchemeType'
                    disabled
                    {...args}
                  />
                )
              }}
            />
          </GridItem>

          <GridItem xs={9}>
            <FastField
              name='schemeCategoryFK'
              render={args => {
                return (
                  <CodeSelect
                    label={formatMessage({
                      id: 'finance.scheme.detail.category',
                    })}
                    code='ctSchemeCategory'
                    disabled
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={9}>
            <FastField
              name='copayerFK'
              render={args => (
                <Select
                  label={formatMessage({
                    id: 'finance.scheme.detail.coPayer',
                  })}
                  options={getCopayerOptions()}
                  valueField='id'
                  labelField='displayValue'
                  max={50}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs={9}>
            <FastField
              name='effectiveDates'
              render={args => {
                return (
                  <DateRangePicker
                    label='Effective Start Date'
                    label2='End Date'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridItem>
        <Setting {...props} />
      </GridContainer>
    </CardContainer>
  )
}
export default compose(
  withStyles(styles, { withTheme: true }),
  React.memo,
)(Detail)
