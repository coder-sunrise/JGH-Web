import React, { useState } from 'react'
import classnames from 'classnames'
import { connect } from 'dva'
// formik
import { withFormik, Field } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
import Warning from '@material-ui/icons/Warning'
import { APPOINTMENT_CANCELLEDBY } from '@/utils/constants'
// common component
import {
  Danger,
  GridContainer,
  GridItem,
  RadioGroup,
  Button,
  TextField,
} from '@/components'

const styles = (theme) => ({
  reasonTextBox: {
    paddingTop: `${theme.spacing(2)}px !important`,
  },
  title: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  warningIcon: {
    margin: theme.spacing(2),
  },
})

const DeleteConfirmation = ({
  classes,
  ltCancelReason,
  isSeries,
  handleSubmit,
  onClose,
  values,
}) => {
  const [
    error,
    setError,
  ] = useState()

  const [
    step,
    setStep,
  ] = useState(isSeries ? 0 : 1)

  const onContinueClick = () => {
    if (isSeries && values.type === '') {
      setError('Please choose an option')
    } else {
      setStep(1)
    }
  }
  const message = isSeries
    ? 'Do you want to cancel all occurences of the recurring appointment, or just this one?'
    : 'Do you want to cancel this appointment?'

  const radioLabelSingle = isSeries
    ? 'Cancel this occurence'
    : 'Only appointment that has not been modified'
  const radioLabelAll = isSeries ? 'Cancel the series' : 'All appointment'

  if (step === 0)
    return (
      <GridContainer justify='center' alignItems='center'>
        <GridItem>
          <div className={classes.title}>
            <Warning fontSize='large' className={classes.warningIcon} />
            <h4 style={{ textAlign: 'left' }}>{message}</h4>
          </div>
        </GridItem>
        {isSeries && (
          <GridItem md={8}>
            <Field
              name='type'
              render={(args) => (
                <RadioGroup
                  {...args}
                  label=''
                  simple
                  vertical
                  options={[
                    {
                      value: '1',
                      label: radioLabelSingle,
                    },
                    {
                      value: '2',
                      label: radioLabelAll,
                    },
                  ]}
                />
              )}
            />
          </GridItem>
        )}
        <GridItem md={6} className={classes.centerText}>
          <Danger>
            <p>{error}</p>
          </Danger>
        </GridItem>
        <GridItem container justify='flex-end'>
          <Button onClick={onClose} color='danger'>
            Cancel
          </Button>
          <Button onClick={onContinueClick} color='primary'>
            Continue
          </Button>
        </GridItem>
      </GridContainer>
    )

  return (
    <GridContainer justify='center'>
      <GridItem xs md={12}>
        <div className={classes.title}>
          <Warning fontSize='large' className={classes.warningIcon} />
          <h4 style={{ textAlign: 'left' }}>
            Please indicate reason for cancellation
          </h4>
        </div>
      </GridItem>
      <GridItem md={8}>
        <Field
          name='cancelBy'
          render={(args) => (
            <RadioGroup
              {...args}
              label='Cancel By'
              options={[
                {
                  value: APPOINTMENT_CANCELLEDBY.CLINIC,
                  label: 'Clinic',
                },
                {
                  value: APPOINTMENT_CANCELLEDBY.PATIENT,
                  label: 'Patient',
                },
              ]}
            />
          )}
        />
      </GridItem>
      {/* <GridItem md={8}>
        <Field
          name='reasonType'
          render={(args) => (
            <RadioGroup
              {...args}
              label=''
              options={ltCancelReason}
              textField='name'
              valueField='id'
            />
          )}
        />
      </GridItem> */}
      <GridItem xs md={8}>
        <Field
          name='reason'
          render={(args) => <TextField {...args} label='Reason' />}
        />
      </GridItem>
      <GridItem container justify='flex-end'>
        <Button onClick={onClose} color='danger'>
          Cancel
        </Button>
        <Button onClick={handleSubmit} color='primary'>
          Confirm
        </Button>
      </GridItem>
    </GridContainer>
  )
}

const DeleteConfirmationForm = withFormik({
  mapPropsToValues: () => ({
    type: '',
    reason: '',
    reasonType: '1',
    cancelBy: APPOINTMENT_CANCELLEDBY.CLINIC.toString(),
  }),
  handleSubmit: (values, { props }) => {
    let { cancelBy } = values
    if (parseInt(cancelBy, 10) === APPOINTMENT_CANCELLEDBY.PATIENT)
      cancelBy = APPOINTMENT_CANCELLEDBY.PATIENT
    else cancelBy = APPOINTMENT_CANCELLEDBY.CLINIC

    props.handleConfirmClick({ ...values, cancelBy })
  },
})(DeleteConfirmation)

const ConnectDeleteConfirmation = connect(({ codetable }) => ({
  ltCancelReason: codetable.ltcancelreasontype,
}))(DeleteConfirmationForm)

export default withStyles(styles)(ConnectDeleteConfirmation)
