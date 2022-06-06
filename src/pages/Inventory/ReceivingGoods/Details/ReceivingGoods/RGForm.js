import React from 'react'
import moment from 'moment'
import { formatMessage } from 'umi'
import { Divider } from '@material-ui/core'
import {
  GridContainer,
  GridItem,
  FastField,
  TextField,
  DatePicker,
  OutlinedTextField,
  CodeSelect,
  Field,
  Checkbox,
} from '@/components'
import { MobileNumberInput } from '@/components/_medisys'
import AuthorizedContext from '@/components/Context/Authorized'
import { LTReceivingGoodsStatus } from '../../variables'

const prefix = 'receivingGoods'

const RGForm = ({
  setFieldValue,
  isReadOnly = false,
  isDisableSupplier = false,
}) => {
  const setSupplierDetails = opts => {
    let conPerson
    let faxNo
    let contactNo
    let address

    if (opts) {
      const { contactPerson, contact, isGSTEnabled, gstValue } = opts
      const { faxContactNumber, mobileContactNumber, contactAddress } = contact
      const { street } = contactAddress[0]
      conPerson = contactPerson
      faxNo = faxContactNumber.number
      contactNo = mobileContactNumber.number
      address = street

      setFieldValue(`${prefix}.isGSTEnabled`, isGSTEnabled)
      if (isGSTEnabled) {
        setFieldValue(`${prefix}.gstValue`, gstValue)
      }
      if (!isGSTEnabled) {
        setFieldValue(`${prefix}.gstValue`, undefined)
        setFieldValue(`${prefix}.isGSTInclusive`, false)
      }
    }

    setFieldValue(`${prefix}.contactPerson`, conPerson)
    setFieldValue(`${prefix}.faxNo`, faxNo)
    setFieldValue(`${prefix}.contactNo`, contactNo)
    setFieldValue(`${prefix}.supplierAddress`, address)
  }
  return (
    <div>
      <GridContainer gutter={0}>
        <GridItem xs={12} md={5}>
          <GridContainer>
            <GridItem xs={12}>
              <FastField
                name={`${prefix}.receivingGoodsNo`}
                render={args => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'inventory.rg.rgno',
                      })}
                      disabled
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name={`${prefix}.documentNo`}
                render={args => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'inventory.rg.detail.rgd.documentNo',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name={`${prefix}.receivingGoodsStatusFK`}
                render={args => {
                  return (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.rg.status',
                      })}
                      options={LTReceivingGoodsStatus}
                      labelField='name'
                      disabled
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
        </GridItem>

        <GridItem xs={12} md={1} />

        <GridItem xs={12} md={5}>
          <GridContainer>
            <GridItem xs={12}>
              <Field
                name={`${prefix}.receivingGoodsDate`}
                render={args => {
                  return (
                    <DatePicker
                      label={formatMessage({
                        id: 'inventory.rg.detail.rgd.rgDate',
                      })}
                      allowClear={false}
                      onChange={e => {
                        if (e === '') {
                          setFieldValue(
                            'receivingGoods.receivingGoodsDate',
                            moment(),
                          )
                        }
                      }}
                      disabled={isReadOnly}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <Field
                name={`${prefix}.invoiceDate`}
                render={args => {
                  return (
                    <DatePicker
                      label={formatMessage({
                        id: 'inventory.rg.detail.rgd.invoiceDate',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12} style={{ paddingRight: 145 }}>
              <div style={{ position: 'relative' }}>
                <Field
                  name={`${prefix}.remark`}
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.rg.detail.rgd.remarks',
                        })}
                        multiline
                        rowsMax={4}
                        maxLength={2000}
                        {...args}
                      />
                    )
                  }}
                />
                <Field
                  name={`${prefix}.isShowRemarkInPrintout`}
                  render={args => {
                    return (
                      <Checkbox
                        style={{ position: 'absolute', bottom: 2, width: 165 }}
                        label='show in printout'
                        inputLabel=' '
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
          </GridContainer>
        </GridItem>

        <AuthorizedContext.Provider
          value={{
            rights: isReadOnly ? 'disable' : 'enable',
          }}
        >
          <GridItem xs={12} md={11}>
            <h4 style={{ marginTop: 20, fontWeight: 'bold' }}>
              {formatMessage({
                id: 'inventory.rg.detail.rgd.supplierInfo',
              })}
            </h4>
            <Divider />
          </GridItem>

          <GridItem xs={12} md={5}>
            <GridContainer>
              <GridItem xs={12}>
                <Field
                  name={`${prefix}.supplierFK`}
                  render={args => {
                    return (
                      <CodeSelect
                        label={formatMessage({
                          id: 'inventory.rg.supplier',
                        })}
                        code='ctSupplier'
                        labelField='displayValue'
                        onChange={(v, opts) => {
                          setSupplierDetails(opts)
                        }}
                        disabled={isDisableSupplier}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name={`${prefix}.contactPerson`}
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.rg.detail.rgd.contactPerson',
                        })}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name={`${prefix}.supplierAddress`}
                  render={args => {
                    return (
                      <OutlinedTextField
                        label={formatMessage({
                          id: 'inventory.rg.detail.rgd.supplierAdd',
                        })}
                        multiline
                        rowsMax={2}
                        rows={2}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>
          </GridItem>

          <GridItem xs={12} md={1} />

          <GridItem xs={12} md={5}>
            <GridContainer>
              <GridItem xs={12}>
                <FastField
                  name={`${prefix}.contactNo`}
                  render={args => (
                    <MobileNumberInput
                      {...args}
                      label={formatMessage({
                        id: 'inventory.rg.detail.rgd.contactNo',
                      })}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name={`${prefix}.faxNo`}
                  render={args => (
                    <MobileNumberInput
                      {...args}
                      label={formatMessage({
                        id: 'inventory.rg.detail.rgd.faxNo',
                      })}
                    />
                  )}
                />
              </GridItem>
            </GridContainer>
          </GridItem>
        </AuthorizedContext.Provider>
      </GridContainer>
    </div>
  )
}

export default RGForm
