import React, { useState } from 'react'
import { withStyles } from '@material-ui/core'
import Warning from '@material-ui/icons/Warning'
import { Button, GridContainer, GridItem, TextField } from '@/components'

const styles = theme => ({
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

const ForceCompleteConfirmation = ({ classes, handleSubmit, onClose }) => {
  const [forceCompleteReason, setForceCompleteReason] = useState('')

  return (
    <GridContainer justify='center' alignItems='center'>
      <GridItem md={12} className={classes.title}>
        <h4 style={{ textAlign: 'center', width: '100%' }}>
          <p>Some items are not fully dispensed.</p>
          <p>Confirm to proceed?</p>
        </h4>
      </GridItem>
      <GridItem md={10}>
        <TextField
          label='Remarks'
          maxLength={200}
          autoFocus
          onChange={e => setForceCompleteReason(e.target.value)}
        />
      </GridItem>
      <GridItem>
        <Button color='danger' onClick={onClose}>
          Cancel
        </Button>
        <Button
          color='primary'
          onClick={() => handleSubmit(forceCompleteReason)}
          disabled={forceCompleteReason.trim() === ''}
        >
          Confirm
        </Button>
      </GridItem>
    </GridContainer>
  )
}

export default withStyles(styles, { name: 'ForceCompleteConfirmation' })(
  ForceCompleteConfirmation,
)
