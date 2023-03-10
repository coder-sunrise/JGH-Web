import React, { useState } from 'react'
import { formatMessage } from 'umi'
import { withStyles } from '@material-ui/core/styles'
import { FastField } from 'formik'
import { compose } from 'redux'
import {
  CodeSelect,
  TextField,
  GridContainer,
  GridItem,
  DateRangePicker,
  Button,
  CommonModal,
  Field,
  dateFormatLong,
  CheckboxGroup,
} from '@/components'
import SharedContainer from '../../SharedContainer'
import Sdd from '../../Sdd'

const styles = () => ({})

const Detail = ({
  medicationDetail,
  dispatch,
  setFieldValue,
  sddDetail,
  theme,
  hasActiveSession,
  clinicSettings,
  ...props
}) => {
  const [toggle, setToggle] = useState(false)

  const toggleModal = () => {
    setToggle(!toggle)
  }
  const handleSelectSdd = row => {
    const { id, code, name } = row
    setToggle(!toggle)

    setFieldValue('sddfk', id)
    setFieldValue('sddCode', code)
    setFieldValue('sddDescription', name)
  }

  return (
    <SharedContainer>
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
                <Field
                  name='code'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.medication.code',
                        })}
                        {...args}
                        disabled={!props.values.isActive}
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
                          id: 'inventory.master.medication.name',
                        })}
                        disabled={medicationDetail.entity}
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
                          id: 'inventory.master.medication.description',
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
                        id: 'inventory.master.medication.caution',
                      })}
                      maxLength={200}
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
                        id: 'inventory.master.medication.supplier',
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
                  name='medicationGroupFK'
                  render={args => (
                    <CodeSelect
                      label={formatMessage({
                        id: 'inventory.master.medication.medicationGroup',
                      })}
                      code='ctMedicationGroup'
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
                      disabled={!!(medicationDetail.entity && hasActiveSession)}
                      {...args}
                    />
                  )}
                />
              </GridItem>
            </GridContainer>
          </GridItem>
          <GridItem xs={12} md={5}>
            <GridContainer>
              <GridItem xs={12}>
                <FastField
                  name='remarks'
                  render={args => {
                    return (
                      <TextField
                        label={formatMessage({
                          id: 'inventory.master.medication.remarks',
                        })}
                        multiline
                        rowsMax='5'
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>
          </GridItem>

          <GridItem xs={12} />
          <GridItem>
            <FastField
              name='chas'
              render={args => (
                <CheckboxGroup
                  style={{
                    margin: theme.spacing(1),
                  }}
                  vertical
                  simple
                  valueField='id'
                  textField='name'
                  options={
                    (()=>{
                      var arr = []
                      if(clinicSettings.isEnableCHAS){
                        arr.push(...[{
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
                        }])
                      }
                      if(clinicSettings.isEnableMedisave){
                        arr.push({
                          id: 'isMedisaveClaimable',
                          name: 'CDMP Claimable',
                          layoutConfig: {
                            style: {},
                          },
                        })
                      }
                      return arr
                    })()
                  }
                  onChange={(e, s) => {}}
                  {...args}
                />
              )}
            />
          </GridItem>
        </GridContainer>

        <h4 style={{ marginTop: 15, fontWeight: 400 }}>
          <b>SDD</b>
        </h4>
        <GridContainer>
          <GridItem xs={5}>
            <Field
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
          <GridItem xs={5} style={{ marginTop: 10 }}>
            <Button variant='contained' color='primary' onClick={toggleModal}>
              Search
            </Button>
          </GridItem>
          <GridItem xs={5}>
            <Field
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

        <CommonModal
          open={toggle}
          observe='MedicationDetail'
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
            {...props}
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
