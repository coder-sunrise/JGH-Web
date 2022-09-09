import React, { useState } from 'react'
// material ui
import { withStyles } from '@material-ui/core'
import Undo from '@material-ui/icons/Undo'
// common components
import { Button, Popover, SizeContainer, Tooltip } from '@/components'

const styles = theme => ({
  popoverContainer: {
    textAlign: 'center',
  },
  popoverMessage: {
    paddingLeft: theme.spacing(3),
    paddingBottom: theme.spacing(1),
  },
})

const VoidWithPopover = ({
  classes,
  disabled,
  index,
  title = 'Void this Form',
  contentText = 'Confirm to void this form?',
  extraCmd,
  onConfirmDelete,
  onCancelClick,
  onVisibleChange,
}) => {
  const [show, setShow] = useState(false)

  const toggleVisibleChange = (v = false) => {
    if (onVisibleChange) {
      onVisibleChange(v)
    }
    setShow(!show)
  }

  const handleCancelClick = () => {
    toggleVisibleChange(false)
    if (onCancelClick) onCancelClick(index)
  }

  const onConfirmClick = () => {
    onConfirmDelete(index, toggleVisibleChange)
    // toggleVisibleChange()
  }

  return (
    <Popover
      title={title}
      trigger='click'
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      visible={show}
      onVisibleChange={toggleVisibleChange}
      content={
        <div className={classes.popoverContainer}>
          <p className={classes.popoverMessage}>{contentText}</p>
          <SizeContainer size='sm'>
            <div style={{ marginRight: 8 }}>{extraCmd}</div>
          </SizeContainer>
          <Button size='sm' color='danger' onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button size='sm' color='primary' onClick={onConfirmClick}>
            Confirm
          </Button>
        </div>
      }
    >
      <Tooltip title={title}>
        <Button justIcon color='danger' disabled={disabled}>
          <Undo />
        </Button>
      </Tooltip>
    </Popover>
  )
}

export default withStyles(styles, { name: 'VoidWithPopover' })(VoidWithPopover)
