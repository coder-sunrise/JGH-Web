import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { Divider } from '@material-ui/core'
import { formatMessage } from 'umi/locale'
import { Add } from '@material-ui/icons'
import { amountProps } from '../../variables'
import {
  GridContainer,
  GridItem,
  NumberInput,
  Field,
  Switch,
  Tooltip,
  Checkbox,
  Button,
  FieldArray,
  FastField,
  withFormik,
} from '@/components'
import Adjustment from './Adjustment'

class POSummary extends PureComponent {
  render () {
    const { props } = this
    const {
      clinicSetting,
      calculateInvoice,
      setFieldValue,
      adjustmentList,
      dispatch,
      purchaseOrder,
      purchaseOrderAdjustment,
      toggleInvoiceAdjustment,
    } = props
    const poPrefix = 'purchaseOrder'
    const { gstEnabled, gstIncluded } = purchaseOrder

    const onChangeGstToggle = (isCheckboxClicked = false) => {
      if (!isCheckboxClicked) {
        if (!gstEnabled) {
          setFieldValue(`${poPrefix}.gstIncluded`, false)
        }
      }
      setTimeout(() => {
        calculateInvoice()
      }, 1)
    }

    console.log('POSummary', this.props)
    return (
      <div style={{ paddingRight: 140, paddingTop: 20 }}>
        <GridContainer>
          <GridItem xs={2} md={9} />
          <GridItem xs={10} md={3} container>
            <p>
              {formatMessage({
                id: 'inventory.pr.detail.pod.summary.adjustment',
              })}
            </p>
            &nbsp;&nbsp;&nbsp;
            <Button
              color='primary'
              size='sm'
              justIcon
              key='addAdjustment'
              //onClick={this.addAdjustment}
              onClick={toggleInvoiceAdjustment}
            >
              <Add />
            </Button>
          </GridItem>
        </GridContainer>

        <FieldArray
          name='purchaseOrderAdjustment'
          render={(arrayHelpers) => {
            this.arrayHelpers = arrayHelpers
            if (!purchaseOrderAdjustment) return null
            return purchaseOrderAdjustment.map((v, i) => {
              if (!v.isDeleted) {
                return (
                  <Adjustment
                    key={v.id}
                    index={i}
                    dispatch={dispatch}
                    arrayHelpers={arrayHelpers}
                    purchaseOrderAdjustment={purchaseOrderAdjustment}
                    calculateInvoice={calculateInvoice}
                    setFieldValue={setFieldValue}
                    {...amountProps}
                    {...props}
                  />
                )
              }
            })
          }}
        />

        {clinicSetting.gstEnabled ? (
          <GridContainer>
            <GridItem xs={2} md={9} />
            <GridItem xs={4} md={2}>
              <span> {`GST (${clinicSetting.gstRate}%): `}</span>
              <FastField
                name={`${poPrefix}.gstEnabled`}
                render={(args) => (
                  <Switch
                    fullWidth={false}
                    onChange={() => onChangeGstToggle()}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={6} md={1}>
              <FastField
                name={`${poPrefix}.invoiceGST`}
                render={(args) => {
                  return <NumberInput {...amountProps} {...args} />
                }}
              />
            </GridItem>

            {/* <GridItem xs={2} md={9} />
          <GridItem xs={10} md={3}>
            <FastField
              name={`${poPrefix}.gstEnabled`}
              render={(args) => <Switch onChange={() => onChangeGstToggle()} {...args} />}
            />
          </GridItem> */}
            <GridItem xs={2} md={9} />
            {gstEnabled ? (
              <GridItem xs={10} md={3}>
                <FastField
                  name={`${poPrefix}.gstIncluded`}
                  render={(args) => {
                    return (
                      <Tooltip
                        title={formatMessage({
                          id: 'inventory.pr.detail.pod.summary.inclusiveGST',
                        })}
                        placement='bottom'
                      >
                        <Checkbox
                          label={formatMessage({
                            id: 'inventory.pr.detail.pod.summary.inclusiveGST',
                          })}
                          onChange={() => onChangeGstToggle(true)}
                          {...args}
                        />
                      </Tooltip>
                    )
                  }}
                />
              </GridItem>
            ) : (
              <GridItem xs={10} md={3} />
            )}
          </GridContainer>
        ) : (
          []
        )}

        <GridContainer>
          <GridItem xs={2} md={9} />
          <GridItem xs={10} md={3}>
            <Divider />
          </GridItem>
          <GridItem xs={2} md={9} />
          <GridItem xs={10} md={3}>
            <FastField
              name={`${poPrefix}.invoiceTotal`}
              render={(args) => {
                return (
                  <NumberInput
                    prefix={formatMessage({
                      id: 'inventory.pr.detail.pod.summary.total',
                    })}
                    {...amountProps}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}
export default POSummary
