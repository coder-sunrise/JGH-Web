import React, { PureComponent, useState } from 'react'
// formik
import { FastField } from 'formik'
// umi
import { formatMessage, FormattedMessage } from 'umi/locale'
// common components
import DeleteIcon from '@material-ui/icons/Delete'
import { withStyles, Divider, Paper } from '@material-ui/core'
import {
  TextField,
  NumberInput,
  CommonCard,
  GridContainer,
  GridItem,
  Popover,
  Button,
  Popconfirm,
} from '@/components'

export default ({
  theme,
  index,
  arrayHelpers,
  handleCalculateBMI,
  ...props
}) => {
  const [
    show,
    setShow,
  ] = useState(false)

  return (
    <React.Fragment>
      <GridContainer style={{ marginTop: theme.spacing(1) }}>
        <GridItem xs={12} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].temperatureC`}
            render={(args) => (
              <NumberInput
                {...args}
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.temperature',
                })}
                format='0.0'
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.temperature.suffix',
                })}
                min={0}
                max={200}
              />
            )}
          />
        </GridItem>
        <GridItem xs={12} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].bpSysMMHG`}
            render={(args) => (
              <NumberInput
                {...args}
                label='Blood Pressure SYS'
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.mmhg',
                })}
                min={0}
                max={999}
              />
            )}
          />
        </GridItem>
        <GridItem xs={12} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].bpDiaMMHG`}
            render={(args) => (
              <NumberInput
                {...args}
                label='Blood Pressure DIA'
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.mmhg',
                })}
                min={0}
                max={999}
              />
            )}
          />
        </GridItem>
        <GridItem xs={12} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].pulseRateBPM`}
            render={(args) => (
              <NumberInput
                {...args}
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.heartRate',
                })}
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.heartRate.suffix',
                })}
                min={0}
                max={999}
              />
            )}
          />
        </GridItem>
        <GridItem xs={12} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].weightKG`}
            render={(args) => (
              <NumberInput
                {...args}
                format='0.0'
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.weight',
                })}
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.weight.suffix',
                })}
                onChange={(e) => {
                  setTimeout(() => {
                    handleCalculateBMI(index)
                  }, 1)
                }}
                min={0}
                max={999}
              />
            )}
          />
        </GridItem>
        <GridItem xs={12} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].heightCM`}
            render={(args) => (
              <NumberInput
                {...args}
                precision={0}
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.height',
                })}
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.height.suffix',
                })}
                // formatter={(value) => Math.floor(value)}
                onChange={(e) => {
                  setTimeout(() => {
                    handleCalculateBMI(index)
                  }, 1)
                }}
                min={0}
                max={999}
              />
            )}
          />
        </GridItem>
        <GridItem xs={11} sm={4} md={3}>
          <FastField
            name={`corPatientNoteVitalSign[${index}].bmi`}
            render={(args) => (
              <NumberInput
                {...args}
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.bmi',
                })}
                suffix={formatMessage({
                  id: 'reception.queue.visitRegistration.bmi.suffix',
                })}
                disabled
              />
            )}
          />
        </GridItem>
        <GridItem xs={1} style={{ position: 'relative' }}>
          {/* <Popover
            content={
              <div>
                <p style={{ paddingLeft: 20, paddingBottom: theme.spacing(2) }}>
                  Confirm to remove this Vital Sign?
                </p>
                <Button
                  onClick={() => {
                    setShow(false)
                  }}
                  variant='outlined'
                >
                  Cancel
                </Button>
                <Button
                  color='primary'
                  onClick={() => {
                    arrayHelpers.remove(index)
                    setShow(false)
                  }}
                >
                  Remove Vital Sign
                </Button>
              </div>
            }
            title='Delete Vital Sign'
            trigger='click'
            visible={show}
            onVisibleChange={() => {
              setShow(!show)
            }}
          >
            <Button
              // style={{ position: 'absolute', bottom: theme.spacing(1) }}
              justIcon
              color='danger'
              size='sm'
            >
              <DeleteIcon />
            </Button>
          </Popover> */}
          <Popconfirm
            title='Confirm to remove this Vital Sign?'
            onConfirm={() => {
              const { form } = arrayHelpers
              form.setFieldValue(
                `corPatientNoteVitalSign[${index}].isDeleted`,
                true,
              )
            }}
          >
            <Button
              style={{ position: 'absolute', bottom: theme.spacing(1) }}
              justIcon
              color='danger'
              size='sm'
            >
              <DeleteIcon />
            </Button>
          </Popconfirm>
        </GridItem>
      </GridContainer>
      <Divider />
    </React.Fragment>
  )
}
