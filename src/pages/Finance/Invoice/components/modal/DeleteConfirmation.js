import React, { useState } from 'react'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import { Button, GridContainer, GridItem, TextField } from '@/components'

const styles = (theme) => ({
  centerText: { textAlign: 'center' },
  spacing: {
    marginBottom: theme.spacing(2),
  },
})

const DeleteConfirmation = ({
  classes,
  handleSubmit,
  id,
  type,
  itemID,
  onClose,
  ...onVoid
}) => {
  const [
    cancelReason,
    setCancelReason,
  ] = useState('')

  const _paymentlabel = `Void the ${type} ${itemID}`
  const _writeOffLabel = `Void the selected write-off?`
  const _otherLabel = `Void the selected ${type.toLowerCase()}?`

  let _label = _otherLabel
  if (type === 'Write Off') _label = _writeOffLabel
  if (type === 'Payment') _label = _paymentlabel

  return (
    <GridContainer justify='center' alignItems='center'>
      <GridItem md={12} className={classes.centerText}>
        <h4>{_label}</h4>
      </GridItem>
      <GridItem md={10} className={classes.spacing}>
        <TextField
          label='Reason'
          autoFocus
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </GridItem>
      <GridItem>
        <Button color='danger' onClick={onClose}>
          Cancel
        </Button>
        <Button
          color='primary'
          onClick={() => handleSubmit(cancelReason, onVoid)}
          disabled={cancelReason.trim() === ''}
        >
          Confirm
        </Button>
      </GridItem>
    </GridContainer>
  )
}

export default withStyles(styles, { name: 'DeleteConfirmation' })(
  DeleteConfirmation,
)
