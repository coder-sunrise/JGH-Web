import React from 'react'
// formik
import { FastField, Formik } from 'formik'
// material ui
import { Divider, withStyles } from '@material-ui/core'
// common components
import {
  Button,
  DatePicker,
  GridContainer,
  GridItem,
  NumberInput,
  Select,
  TextField,
  SizeContainer,
} from '@/components'

const styles = (theme) => ({
  container: {
    '& h4': {
      fontWeight: 'bold',
      marginTop: theme.spacing(3),
    },
    '& hr': {
      height: 2,
    },
  },
  footer: {
    textAlign: 'right',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
})

const ClaimDetails = ({
  classes,
  claimDetails,
  onConfirm,
  onClose,
  readOnly = true,
  renderClaimDetails,
}) => {
  return (
    <Formik initialValues={{ ...claimDetails }}>
      <SizeContainer size='md'>
        <React.Fragment>
          <GridContainer className={classes.container}>
            <GridItem md={12}>
              <h4>Visit Details</h4>
              <Divider />
            </GridItem>
            <GridItem md={5} container>
              <GridItem md={12}>
                <FastField
                  name='refNo'
                  render={(args) => (
                    <TextField {...args} disabled label='Patient Ref No.' />
                  )}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='patientAccountNo'
                  render={(args) => (
                    <TextField {...args} disabled label='Patient Acc No.' />
                  )}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='patientName'
                  render={(args) => (
                    <TextField {...args} disabled label='Patient Name' />
                  )}
                />
              </GridItem>
            </GridItem>
            <GridItem md={1} />
            <GridItem md={5} container>
              <GridItem md={12}>
                <FastField
                  name='visitDate'
                  render={(args) => (
                    <TextField {...args} disabled label='Visit Date' />
                  )}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='visitDoctorName'
                  render={(args) => (
                    <TextField {...args} disabled label='Doctor' />
                  )}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='patientDob'
                  render={(args) => (
                    <TextField {...args} disabled label='DOB' />
                  )}
                />
              </GridItem>
            </GridItem>

            <GridItem md={12}>
              <h4>Invoice Details</h4>
              <Divider />
            </GridItem>
            <GridItem md={5} container>
              <GridItem md={12}>
                <FastField
                  name='invoiceNo'
                  render={(args) => (
                    <TextField {...args} disabled label='Invoice No.' />
                  )}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='visitDate'
                  render={(args) => (
                    <DatePicker {...args} disabled label='Invoice Date' />
                  )}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='invoiceAmt'
                  render={(args) => (
                    <NumberInput
                      {...args}
                      disabled
                      currency
                      label='Invoice Amount'
                    />
                  )}
                />
              </GridItem>
            </GridItem>

            <GridItem md={12}>
              <h4>Claim Details</h4>
              <Divider />
            </GridItem>
            {}
            {renderClaimDetails !== undefined ? (
              renderClaimDetails(readOnly)
            ) : (
              <GridItem md={12} container>
                <GridItem md={5}>
                  <FastField
                    name='schemeType'
                    render={(args) => (
                      <TextField {...args} disabled label='Scheme Type' />
                    )}
                  />
                </GridItem>
                <GridItem md={7} />
                <GridItem md={5}>
                  <FastField
                    name='schemeCategory'
                    render={(args) => (
                      <TextField {...args} disabled label='Scheme Category' />
                    )}
                  />
                </GridItem>
                <GridItem md={1} />
                <GridItem md={2}>
                  <FastField
                    name='tier'
                    render={(args) => (
                      <TextField {...args} disabled label='Tier' />
                    )}
                  />
                </GridItem>
                <GridItem md={4} />
                <GridItem md={5}>
                  <FastField
                    name='schemeType'
                    render={(args) => (
                      <TextField {...args} disabled label='Scheme Type' />
                    )}
                  />
                </GridItem>
                <GridItem md={7} />
                <GridItem md={5}>
                  <FastField
                    name='diagnosis'
                    render={(args) => (
                      <Select
                        {...args}
                        label='Diagnosis'
                        options={[
                          { name: 'Asthma', value: 'asthma' },
                          { name: 'Hypertension', value: 'hypertension' },
                        ]}
                      />
                    )}
                  />
                </GridItem>
                <GridItem md={7} />
                <GridItem md={5}>
                  <FastField
                    name='claimAmt'
                    render={(args) => (
                      <NumberInput
                        {...args}
                        disabled
                        currency
                        label='Claim Amount'
                      />
                    )}
                  />
                </GridItem>
                <GridItem md={7} />
              </GridItem>
            )}

            <GridItem md={12} className={classes.footer}>
              <Button color='danger' onClick={onClose}>
                Close
              </Button>
              <Button color='primary' onClick={onConfirm}>
                Confirm
              </Button>
            </GridItem>
          </GridContainer>
        </React.Fragment>
      </SizeContainer>
    </Formik>
  )
}

export default withStyles(styles, { name: 'ClaimDetails' })(ClaimDetails)
