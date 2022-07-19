import React from 'react'
import { formatMessage } from 'umi'
import { withStyles } from '@material-ui/core/styles'
import { FastField } from 'formik'
import { connect } from 'dva'
import { compose } from 'redux'
import {
  CodeSelect,
  TextField,
  GridContainer,
  GridItem,
  DateRangePicker,
  dateFormatLong,
  CheckboxGroup,
  Field,
} from '@/components'
import SharedContainer from '../../SharedContainer'

const styles = () => ({})

const Detail = ({
  consumableDetail,
  hasActiveSession,
  theme,
  clinicSettings,
  values,
}) => {
  const { settings = [] } = clinicSettings
  return (
    <SharedContainer hideHeader>
      <div
        hideHeader
        style={{
          margin: theme.spacing(1),
          minHeight: 670,
          maxHeight: 670,
        }}
      >
        <GridContainer gutter={0}>
          <GridItem xs={12} md={5}>
            <GridContainer>
              <GridItem xs={12}>
                <FastField
                  name='code'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.consumable.code',
                        })}
                        {...args}
                        disabled={values.isActive && values.id}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='displayValue'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.consumable.name',
                        })}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='description'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.consumable.description',
                        })}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='remarks'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.consumable.remarks',
                        })}
                        multiline
                        rowsMax='5'
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem>
                <FastField
                  name='chas'
                  render={args => (
                    <CheckboxGroup
                      vertical
                      simple
                      valueField='id'
                      textField='name'
                      options={(() => {
                        var arr = []
                        if (clinicSettings.isEnableCHAS) {
                          arr.push(
                            ...[
                              {
                                id: 'isChasAcuteClaimable',
                                name: 'CHAS Acute Claimable',

                                layoutConfig: {
                                  style: {},
                                },
                              },
                              {
                                id: 'isChasChronicClaimable',
                                name: 'CHAS Chronic Claimable',

                                layoutConfig: {
                                  style: {},
                                },
                              },
                            ],
                          )
                        }

                        arr.push(
                          ...[
                            {
                              id: 'orderable',
                              name: 'Orderable',
                              tooltip:
                                'Item is orderable and dispensable to patient',
                              disabled:
                                hasActiveSession &&
                                consumableDetail.entity?.id &&
                                consumableDetail.entity?.isActive &&
                                consumableDetail.entity?.orderable,
                              layoutConfig: {
                                style: {},
                              },
                            },
                          ],
                        )

                        if (clinicSettings.isEnablePharmacyModule)
                          arr.push(
                            ...[
                              {
                                id: 'isDispensedByPharmacy',
                                name: 'Dispensed by Pharmacy',
                                tooltip:
                                  "Item’s stock is deducted and dispense by pharmacy. If unchecked the setting, stock deduction will take place during finalization of patient's order",
                                disabled:
                                  hasActiveSession &&
                                  consumableDetail.entity?.id &&
                                  consumableDetail.entity?.isActive &&
                                  consumableDetail.entity
                                    ?.isDispensedByPharmacy,
                                layoutConfig: {
                                  style: {},
                                },
                              },
                            ],
                          )

                        if (clinicSettings.isEnableNurseWorkItem)
                          arr.push(
                            ...[
                              {
                                id: 'isNurseActualizable',
                                name: 'Actualized by Nurse',
                                tooltip:
                                  'Item will generate task for nurse to actualize',
                                disabled:
                                  hasActiveSession &&
                                  consumableDetail.entity?.id &&
                                  consumableDetail.entity?.isActive &&
                                  consumableDetail.entity?.isNurseActualizable,
                                layoutConfig: {
                                  style: {},
                                },
                              },
                            ],
                          )

                        return arr
                      })()}
                      onChange={(e, s) => {}}
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
                  name='favouriteSupplierFK'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.consumable.supplier',
                      })}
                      code='ctSupplier'
                      labelField='displayValue'
                      max={10}
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='manufacturerFK'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.medication.manufacturer',
                      })}
                      code='ctManufacturer'
                      labelField='displayValue'
                      max={10}
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='uomfk'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.consumable.baseUOM',
                      })}
                      code='ctConsumableUnitOfMeasurement'
                      max={10}
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='consumableCategoryFK'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.consumable.category',
                      })}
                      code='ctConsumableCategory'
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='revenueCategoryFK'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.medication.revenueCategory',
                      })}
                      code='ctRevenueCategory'
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12}>
                <Field
                  name='effectiveDates'
                  render={args => (
                    <DateRangePicker
                      format={dateFormatLong}
                      label='Effective Start Date'
                      label2='End Date'
                      disabled={
                        consumableDetail.entity &&
                        hasActiveSession &&
                        consumableDetail.entity.isActive
                      }
                      {...args}
                    />
                  )}
                />
              </GridItem>
            </GridContainer>
          </GridItem>
        </GridContainer>
      </div>
    </SharedContainer>
  )
}
export default compose(
  connect(({ clinicSettings }) => ({
    clinicSettings: clinicSettings.settings,
  })),
  withStyles(styles, { withTheme: true }),
  React.memo,
)(Detail)
