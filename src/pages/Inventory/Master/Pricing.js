import React, { useState, useEffect } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Divider } from '@material-ui/core'
import { FastField } from 'formik'
import { formatMessage } from 'umi/locale'

import {
  CardContainer,
  GridContainer,
  GridItem,
  NumberInput,
  Field,
} from '@/components'

const styles = () => ({})

const Pricing = ({
  values,
  setFieldValue,
  medicationDetail,
  vaccinationDetail,
  consumableDetail,
  setValues,
}) => {
  const [
    acp,
    setAcp,
  ] = useState(0.0)
  const [
    markupMargin,
    setMarkupMargin,
  ] = useState()

  const calculate = () => {
    const suggestedSellingPrice =
      parseFloat(acp) * (1 + parseFloat(markupMargin) / 100)
    setFieldValue('suggestSellingPrice', suggestedSellingPrice)
  }

  useEffect(() => {
    if (medicationDetail) {
      return setFieldValue('averageCostPrice', 0.0)
    }
    if (vaccinationDetail) {
      return setFieldValue('averageCostPrice', 0.0)
    }

    if (consumableDetail) {
      return setFieldValue('averageCostPrice', 0.0)
    }
    return undefined
  }, [])

  const isEditMode = () => {
    if (medicationDetail && medicationDetail.entity) {
      return true
    }
    if (vaccinationDetail && vaccinationDetail.entity) {
      return true
    }

    if (consumableDetail && consumableDetail.entity) {
      return true
    }

    return false
  }
  useEffect(
    () => {
      if (acp && markupMargin) {
        calculate()
      }
      // console.log('values', acp, markupMargin)
      // setValues({
      //   averageCostPrice: acp,
      //   markupMargin: markupMargin,
      // })
      setFieldValue('averageCostPrice', acp)
      setFieldValue('markupMargin', markupMargin)
    },
    [
      acp,
      markupMargin,
    ],
  )
  return (
    <CardContainer
      hideHeader
      style={{
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      <GridContainer gutter={0}>
        <GridItem xs={12} md={5}>
          <GridContainer>
            <GridItem xs={12}>
              <Field
                name='lastCostPriceBefBonus'
                render={(args) => {
                  return (
                    <NumberInput
                      currency
                      label={formatMessage({
                        id: 'inventory.master.pricing.lastCostPriceBefBonus',
                      })}
                      disabled={isEditMode()}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name='lastCostPriceAftBonus'
                render={(args) => {
                  return (
                    <NumberInput
                      currency
                      label={formatMessage({
                        id: 'inventory.master.pricing.lastCostPriceAftBonus',
                      })}
                      disabled={isEditMode()}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='averageCostPrice'
                render={(args) => (
                  <NumberInput
                    prefix='$'
                    label={formatMessage({
                      id: 'inventory.master.pricing.averageCostPrice',
                    })}
                    onChange={(e) => {
                      setAcp(e.target.value)
                      setFieldValue(
                        'averageCostPrice',
                        e.target.value.toFixed(4),
                      )
                    }}
                    {...args}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        </GridItem>
        <GridItem xs={12} md={2} />
        <GridItem xs={12} md={5}>
          <GridContainer>
            <GridItem xs={12}>
              <FastField
                name='markupMargin'
                render={(args) => (
                  <NumberInput
                    label={formatMessage({
                      id: 'inventory.master.pricing.profitMarginPercentage',
                    })}
                    onChange={(e) => {
                      setMarkupMargin(e.target.value)
                      setFieldValue('markupMargin', e.target.value.toFixed(1))
                    }}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='suggestSellingPrice'
                render={(args) => (
                  <NumberInput
                    currency
                    label={formatMessage({
                      id: 'inventory.master.pricing.suggestedSellingPrice',
                    })}
                    disabled
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='sellingPrice'
                render={(args) => (
                  <NumberInput
                    currency
                    label={formatMessage({
                      id: 'inventory.master.pricing.sellingPrice',
                    })}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='maxDiscount'
                render={(args) => (
                  <NumberInput
                    label={formatMessage({
                      id: 'inventory.master.pricing.maxDiscount',
                    })}
                    onChange={(e) =>
                      setFieldValue('maxDiscount', e.target.value.toFixed(1))}
                    {...args}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        </GridItem>
      </GridContainer>
      <Divider style={{ margin: '40px 0 20px 0' }} />
    </CardContainer>
  )
}
export default withStyles(styles, { withTheme: true })(Pricing)
