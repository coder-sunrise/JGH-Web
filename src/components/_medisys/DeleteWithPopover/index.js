import React, { useState } from 'react'
// material ui
import { withStyles } from '@material-ui/core'
import Delete from '@material-ui/icons/Delete'
// common components
import { Button, Popover, SizeContainer, Tooltip } from '@/components'

const styles = theme => ({
  popoverContainer: {
    textAlign: 'center',
  },
  popoverMessage: {
    paddingBottom: theme.spacing(1),
  },
})

const DeleteWithPopover = ({
  classes,
  disabled,
  index,
  title = 'Remove this item',
  tooltipText = 'Remove this item',
  contentText = 'Confirm to remove this item?',
  extraCmd,
  onConfirmDelete,
  onCancelClick,
  buttonProps = {},
  isUseCallBack,
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
    if (!isUseCallBack) toggleVisibleChange()
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
            {show && <div style={{ marginRight: 8 }}>{extraCmd}</div>}
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
      <Tooltip title={tooltipText || title}>
        <Button justIcon color='danger' disabled={disabled} {...buttonProps}>
          <Delete />
        </Button>
      </Tooltip>
    </Popover>
  )
}

export default withStyles(styles, { name: 'DeleteWithPopover' })(
  DeleteWithPopover,
)
