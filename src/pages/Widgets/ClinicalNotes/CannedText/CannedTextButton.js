import React, { useState } from 'react'
import { connect } from 'dva'
import color from 'color'
// material ui
import { Divider, withStyles } from '@material-ui/core'
import Settings from '@material-ui/icons/Settings'
// common components
import { primaryColor } from 'mui-pro-jss'
import { Button, Popover, Tooltip } from '@/components'
import { CANNED_TEXT_TYPE_FIELD } from '@/utils/constants'

const styles = (theme) => ({
  item: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',

    '&:hover': {
      background: color(primaryColor).lighten(0.9).hex(),
    },
    '& > svg': {
      marginRight: theme.spacing(1),
    },
    '& > span': {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
  },
  popoverContainer: {
    width: 200,
    textAlign: 'left',
  },
  listContainer: {
    maxHeight: 300,
    overflowY: 'auto',
  },
  divider: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
})

const ListItem = ({ classes, title, onClick }) => {
  return (
    <Tooltip title={title}>
      <div className={classes.item} onClick={onClick}>
        <span>{title}</span>
      </div>
    </Tooltip>
  )
}

const CannedTextButton = ({
  classes,
  cannedText,
  cannedTextTypeFK,
  onSettingClick,
  handleSelectCannedText,
  onCannedTextClick,
}) => {
  const [
    show,
    setShow,
  ] = useState(false)

  const field = CANNED_TEXT_TYPE_FIELD[cannedTextTypeFK]
  const list = cannedText[field] || []

  const toggleVisibleChange = () => setShow(!show)

  const onListItemClick = (selectedCannedText) => {
    handleSelectCannedText(selectedCannedText)
    toggleVisibleChange()
  }

  const handleSettingClick = () => {
    toggleVisibleChange()
    onSettingClick()
  }

  return (
    <Popover
      icon={null}
      trigger='click'
      placement='bottom'
      visible={show}
      onVisibleChange={toggleVisibleChange}
      content={
        <div className={classes.popoverContainer}>
          <div className={classes.item} onClick={handleSettingClick}>
            <Settings />
            <span>Settings</span>
          </div>
          <Divider className={classes.divider} />
          <div className={classes.listContainer}>
            {list.map((item) => {
              const handleClick = () => onListItemClick(item)
              return (
                <ListItem
                  key={`cannedText-${item.id}`}
                  classes={classes}
                  onClick={handleClick}
                  {...item}
                />
              )
            })}
          </div>
        </div>
      }
    >
      <Button
        color='info'
        style={{
          position: 'absolute',
          zIndex: 1,
          left: 435,
          right: 0,
          top: 10,
        }}
        onClick={onCannedTextClick}
      >
        Canned Text
      </Button>
    </Popover>
  )
}

const Connected = connect(({ cannedText }) => ({ cannedText }))(
  CannedTextButton,
)

export default withStyles(styles, { name: 'CannedTextButton' })(Connected)
