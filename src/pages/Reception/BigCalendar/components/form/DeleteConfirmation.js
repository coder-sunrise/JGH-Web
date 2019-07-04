import React, { useState } from 'react'
import classnames from 'classnames'
// material ui
import { withStyles } from '@material-ui/core'
import Warning from '@material-ui/icons/Warning'
// common component
import {
  GridContainer,
  GridItem,
  RadioGroup,
  Button,
  TextField,
} from '@/components'

const styles = (theme) => ({
  reasonTextBox: {
    paddingTop: `${theme.spacing.unit * 4.75}px !important`,
  },
  title: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  warningIcon: {
    margin: theme.spacing.unit * 2,
  },
})

function DeleteConfirmation ({ onConfirm, onClose, classes }) {
  const [
    step,
    setStep,
  ] = useState(0)

  const [
    deleteType,
    setDeleteType,
  ] = useState('occurence')

  const [
    reason,
    setReason,
  ] = useState('')

  const [
    reasonType,
    setReasonType,
  ] = useState('noshow')

  const onContinueClick = () => {
    setStep(1)
  }

  const handleDeleteTypeChange = (event) => {
    const { target } = event
    setDeleteType(target.value)
  }

  const onReasonTextChange = (event) => {
    const { target } = event
    setReason(target.value)
  }

  const onReasonTypeChange = (event) => {
    const { target } = event
    setReasonType(target.value)
  }

  const onConfirmClick = () => {
    onConfirm({
      deleteType,
      reasonType,
      reason,
    })
  }

  return step === 0 ? (
    <GridContainer justify='center'>
      <GridItem>
        <div className={classes.title}>
          <Warning fontSize='large' className={classes.warningIcon} />
          <h4 style={{ textAlign: 'left' }}>
            Do you want to cancel this appointment?
          </h4>
        </div>
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
  ) : (
    <GridContainer justify='center'>
      <GridItem xs md={12}>
        <div className={classes.title}>
          <Warning fontSize='large' className={classes.warningIcon} />
          <h4 style={{ textAlign: 'left' }}>
            Please indicate reason for cancellation
          </h4>
        </div>
      </GridItem>
      <GridItem>
        <RadioGroup
          label=''
          simple
          vertical
          defaultValue={reasonType}
          onChange={onReasonTypeChange}
          options={[
            {
              value: 'noshow',
              label: 'No Show',
            },
            {
              value: 'other',
              label: 'Other',
            },
          ]}
        />
      </GridItem>
      <GridItem xs md={6} className={classnames(classes.reasonTextBox)}>
        <TextField
          value={reason}
          onChange={onReasonTextChange}
          label='Reason'
          disabled={reasonType !== 'other'}
        />
      </GridItem>
      <GridItem container justify='flex-end'>
        <Button onClick={onClose} color='danger'>
          Cancel
        </Button>
        <Button onClick={onConfirmClick} color='primary'>
          Confirm
        </Button>
      </GridItem>
    </GridContainer>
  )
}

export default withStyles(styles)(DeleteConfirmation)
