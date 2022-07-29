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
  Field,
  Tooltip,
} from '@/components'
import { SCHEME_TYPE, COPAYER_TYPE, SCHEME_CATEGORY } from '@/utils/constants'
import Setting from './Setting'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const styles = () => ({})

const Detail = ({ height, ...props }) => {
  const { values, codetable, setFieldValue } = props
  const { copayerTypeFK } = values

  const getCopayerOptions = () => {
    const { ctcopayer = [] } = codetable
    const options = ctcopayer.filter(
      copayerList => copayerList.coPayerTypeFK === copayerTypeFK,
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
                  <Tooltip
                    title='Code will be generated automatically'
                    placement='bottom'
                  >
                    <span>
                      <TextField
                        label={formatMessage({
                          id: 'finance.scheme.detail.code',
                        })}
                        disabled={true}
                        {...args}
                      />
                    </span>
                  </Tooltip>
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
            <Field
              name='schemeTypeFK'
              render={args => {
                return (
                  <CodeSelect
                    label={formatMessage({
                      id: 'finance.scheme.detail.type',
                    })}
                    code='ctSchemeType'
                    localFilter={item => {
                      return (
                        values.id ||
                        ['CORPORATE', 'INSURANCE'].indexOf(
                          item.code.toUpperCase(),
                        ) >= 0
                      )
                    }}
                    disabled={values.id}
                    onChange={value => {
                      if (value) {
                        if (value === SCHEME_TYPE.CORPORATE) {
                          setFieldValue('copayerTypeFK', COPAYER_TYPE.CORPORATE)
                          setFieldValue(
                            'schemeCategoryFK',
                            SCHEME_CATEGORY.CORPORATE,
                          )
                        } else {
                          setFieldValue('copayerTypeFK', COPAYER_TYPE.INSURANCE)
                          setFieldValue(
                            'schemeCategoryFK',
                            SCHEME_CATEGORY.INSURANCE,
                          )
                        }
                      } else {
                        setFieldValue('copayerTypeFK', undefined)
                        setFieldValue('schemeCategoryFK', undefined)
                      }
                      setFieldValue('copayerFK', undefined)
                    }}
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
            <Field
              name='copayerFK'
              render={args => (
                <CodeSelect
                  code='ctcopayer'
                  label={formatMessage({
                    id: 'finance.scheme.detail.coPayer',
                  })}
                  additionalSearchField='code'
                  localFilter={item => item.coPayerTypeFK === copayerTypeFK}
                  labelField='displayValueWithCode'
                  max={50}
                  showOptionTitle={false}
                  dropdownMatchSelectWidth={false}
                  dropdownClassName='ant-select-dropdown-bottom-bordered'
                  dropdownStyle={{ width: '810px' }}
                  renderDropdown={option => {
                    const {
                      code = '',
                      creditFacility = '',
                      copayerAddress = '',
                      labelField = 'displayValue',
                    } = option
                    return (
                      <Tooltip
                        placement='left'
                        title={
                          <>
                            <span>
                              {code ? `${code} - ` : ''}
                              <span>{`${option[labelField]}`}</span>
                            </span>
                            <br />
                            <span>{`Cr. Facility: ${
                              creditFacility == '' ? ' - ' : creditFacility
                            }`}</span>
                            <br />
                            <span>{`Addr.: ${
                              copayerAddress == '' ? ' - ' : copayerAddress
                            }`}</span>
                          </>
                        }
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span>
                            {option.code ? `${option.code} - ` : ''}
                            <span
                              style={{
                                fontWeight: option.code ? 'bold' : 'normal',
                              }}
                            >
                              {`${option[labelField]}`}
                            </span>
                          </span>
                          <span
                            style={{ display: 'block', lineHeight: '15px' }}
                          >{`Cr. Facility: ${
                            creditFacility == '' ? ' - ' : creditFacility
                          }`}</span>
                          <span style={{ display: 'block' }}>{`Addr.: ${
                            copayerAddress == '' ? ' - ' : copayerAddress
                          }`}</span>
                        </div>
                      </Tooltip>
                    )
                  }}
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
