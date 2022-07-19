import React, { useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { formatMessage } from 'umi'
import { FastField } from 'formik'
import { compose } from 'redux'
import Yup from '@/utils/yup'
import {
  CommonModal,
  CardContainer,
  TextField,
  GridContainer,
  GridItem,
  DateRangePicker,
  Button,
  CodeSelect,
  Field,
  dateFormatLong,
  CheckboxGroup,
} from '@/components'
import MedisaveVaccinations from './MedisaveVaccinations'
import Sdd from '../../Sdd'
import SharedContainer from '../../SharedContainer'

const styles = () => ({})

const Detail = ({
  vaccinationDetail,
  dispatch,
  theme,
  hasActiveSession,
  values,
  schema,
  clinicSettings,
  ...props
}) => {
  const field = vaccinationDetail.entity ? 'entity' : 'default'

  const [toggle, setToggle] = useState(false)

  const toggleModal = () => {
    setToggle(!toggle)
  }
  const handleSelectSdd = row => {
    const { id, code, name } = row
    setToggle(!toggle)
    dispatch({
      type: 'vaccinationDetail/updateState',
      payload: {
        [field]: {
          ...values,
          sddfk: id,
          sddCode: code,
          sddDescription: name,
        },
      },
    })
  }

  const toggleMedisaveVaccination = o => {
    dispatch({
      type: 'vaccinationDetail/updateState',
      payload: {
        [field]: {
          ...values,
          isMedisaveClaimable: o.isMedisaveClaimable,
          inventoryVaccination_MedisaveVaccination: [],
        },
      },
    })
  }

  const medisaveSchema = values.isMedisaveClaimable
    ? Yup.object().shape({
        medisaveVaccinationFK: Yup.number().required(),
        isDefault: Yup.boolean(),
      })
    : Yup.object()

  // const medisaveSchema = values.isMedisaveClaimable ? Yup.array()
  // .compact((v) => v.isDeleted)
  // .of(
  //   Yup.object().shape({
  //     medisaveVaccinationFK: Yup.number().required(),
  //     isDefault: Yup.boolean(),
  //   }),
  // ) : Yup.object()

  const sddProps = !props.values
    ? {
        ...props,
        values,
      }
    : { ...props }

  return (
    <SharedContainer hideHeader>
      <div
        style={{
          margin: theme.spacing(1),
          minHeight: 670,
          maxHeight: 670,
        }}
      >
        <GridContainer gutter={0}>
          <GridItem xs={12} md={5}>
            <GridContainer style={{ height: 'auto' }}>
              <GridItem xs={12}>
                <FastField
                  name='code'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.vaccination.code',
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
                          id: 'inventory.master.vaccination.name',
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
                          id: 'inventory.master.vaccination.description',
                        })}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <FastField
                  name='caution'
                  render={args => (
                    <TextField
                      label={formatMessage({
                        id: 'inventory.master.vaccination.caution',
                      })}
                      maxLength={200}
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem>
                <FastField
                  name='schemes'
                  render={args => (
                    <CheckboxGroup
                      style={{
                        marginTop: theme.spacing(1),
                      }}
                      vertical
                      simple
                      valueField='id'
                      textField='name'
                      options={(() => {
                        var arr = []
                        arr.push({
                          id: 'isAutoGenerateCertificate',
                          name: 'Auto Generate Certificate',

                          layoutConfig: {
                            style: {},
                          },
                        })
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
                        if (clinicSettings.isEnableMedisave) {
                          arr.push({
                            id: 'isMedisaveClaimable',
                            name: 'CDMP Claimable',

                            layoutConfig: {
                              style: {},
                            },
                          })
                        }
                        if (clinicSettings.isEnableNurseWorkItem) {
                          arr.push({
                            id: 'isNurseActualizable',
                            name: 'Actualized by Nurse',
                            tooltip:
                              'Item will generate task for nurse to actualize',
                            disabled:
                              hasActiveSession &&
                              values?.id &&
                              values?.isActive &&
                              values?.isNurseActualizable,
                            layoutConfig: {
                              style: {},
                            },
                          })
                        }
                        return arr
                      })()}
                      onChange={(e, s) => {
                        if (s.isMedisaveClaimable !== undefined)
                          toggleMedisaveVaccination(s)
                      }}
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={12} style={{ marginTop: '10px' }} />
              <GridItem xs={12}>
                <h4 style={{ marginTop: 15, fontWeight: 400 }}>
                  <b>SDD</b>
                </h4>
                <GridContainer>
                  <GridItem xs={10}>
                    <FastField
                      name='sddCode'
                      render={args => {
                        return (
                          <TextField
                            label={formatMessage({
                              id: 'inventory.master.medication.sddID',
                            })}
                            disabled
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem xs={2} style={{ marginTop: 10 }}>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={toggleModal}
                    >
                      Search
                    </Button>
                  </GridItem>
                  <GridItem xs={12}>
                    <FastField
                      name='sddDescription'
                      render={args => {
                        return (
                          <TextField
                            label={formatMessage({
                              id: 'inventory.master.medication.sddDescription',
                            })}
                            disabled
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                </GridContainer>
              </GridItem>
            </GridContainer>
          </GridItem>

          <GridItem xs={1} />

          <GridItem xs={12} md={6}>
            <GridContainer style={{ height: 'auto' }}>
              <GridItem xs={2} />
              <GridItem xs={10}>
                <FastField
                  name='favouriteSupplierFK'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.vaccination.supplier',
                      })}
                      code='ctSupplier'
                      labelField='displayValue'
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={2} />
              <GridItem xs={10}>
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
              <GridItem xs={2} />
              <GridItem xs={10}>
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
              <GridItem xs={2} />
              <GridItem xs={10}>
                <Field
                  name='effectiveDates'
                  render={args => (
                    <DateRangePicker
                      format={dateFormatLong}
                      label='Effective Start Date'
                      label2='End Date'
                      disabled={
                        vaccinationDetail.entity &&
                        hasActiveSession &&
                        vaccinationDetail.entity.isActive
                      }
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem xs={2} />
              <GridItem xs={10}>
                <div
                  style={{
                    display:
                      clinicSettings.isEnableMedisave &&
                      values.isMedisaveClaimable
                        ? ''
                        : 'none',
                  }}
                >
                  <MedisaveVaccinations
                    rows={values.inventoryVaccination_MedisaveVaccination}
                    schema={medisaveSchema}
                    values={values}
                    {...props}
                  />
                </div>
              </GridItem>
            </GridContainer>
          </GridItem>
        </GridContainer>
        {/* <Divider style={{ margin: '40px 0 20px 0' }} /> */}
        <CommonModal
          open={toggle}
          observe='VaccinationDetail'
          title='Standard Drug Dictionary'
          maxWidth='md'
          bodyNoPadding
          onClose={toggleModal}
          onConfirm={toggleModal}
        >
          <Sdd
            dispatch={dispatch}
            handleSelectSdd={handleSelectSdd}
            theme={theme}
            {...sddProps}
          />
        </CommonModal>
      </div>
    </SharedContainer>
  )
}

export default compose(
  withStyles(styles, { withTheme: true }),
  React.memo,
)(Detail)
