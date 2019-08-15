import React from 'react'
import classnames from 'classnames'
// material ui
import { withStyles } from '@material-ui/core'
// custom component
import { Button, GridContainer, GridItem } from '@/components'

import style from './style'

const ButtonText = {
  DELETE: 'Delete',
  CANCEL: 'Cancel',
  CHECK: 'Check Availability',
  DRAFT: 'Save Draft',
  ADD: 'Save Appointment',
  EDIT: 'Reschedule Appointment',
}

const FormFooter = ({
  classes,
  isNew,
  onClose,
  onCancelAppointmentClick,
  handleSaveDraftClick,
  handleConfirmClick,
}) => {
  const hideCancelAppointmentClass = {
    [classes.hideCancelAppointmentBtn]: isNew,
  }

  const confirmBtnText = isNew ? ButtonText.ADD : ButtonText.EDIT

  return (
    <div className={classnames(classes.footer)}>
      <GridContainer>
        <GridItem xs md={4} container justify='flex-start'>
          <Button
            color='danger'
            className={classnames(hideCancelAppointmentClass)}
            onClick={onCancelAppointmentClick}
          >
            {ButtonText.DELETE}
          </Button>
        </GridItem>

        <GridItem xs md={8} container justify='flex-end'>
          <Button color='success' disabled>
            {ButtonText.CHECK}
          </Button>
          <Button onClick={onClose} color='danger'>
            {ButtonText.CANCEL}
          </Button>
          <Button onClick={handleSaveDraftClick} color='info'>
            {ButtonText.DRAFT}
          </Button>
          <Button onClick={handleConfirmClick} color='primary'>
            {confirmBtnText}
          </Button>
        </GridItem>
      </GridContainer>
    </div>
  )
}

export default withStyles(style, { name: 'AppointmentFormFooter' })(FormFooter)
