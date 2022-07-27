import React, { useState } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import color from 'color'
// material ui
import { Divider, withStyles } from '@material-ui/core'
import Settings from '@material-ui/icons/Settings'
import ListAlt from '@material-ui/icons/ListAlt'
// common components
import { primaryColor } from 'mui-pro-jss'
import { Button, Popover, Tooltip, TextField, CommonModal } from '@/components'
import CannedText from '@/pages/Widgets/ClinicalNotes/CannedText'
import { CANNED_TEXT_TYPE_FIELD_NAME } from '@/pages/Widgets/ClinicalNotes/CannedText/utils'

const styles = theme => ({
  item: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',

    '&:hover': {
      background: color(primaryColor)
        .lighten(0.9)
        .hex(),
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
    width: 300,
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
  arrowRight: {
    float: 'right',
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

const component = ({
  dispatch,
  classes,
  cannedText,
  cannedTextTypeFK,
  handleSelectCannedText,
  user,
  style,
  disabled,
  buttonType = 'icon',
}) => {
  const [show, setShow] = useState(false)

  const [showCannedText, setShowCannedText] = useState(false)

  const [filterCannedText, setFilterCannedText] = useState('')

  const fieldName = CANNED_TEXT_TYPE_FIELD_NAME[cannedTextTypeFK]

  let list = cannedText[fieldName] || []
  list = [
    ..._.orderBy(
      list.filter(o => o.ownedByUserFK === user.id),
      ['sortOrder', 'title'],
      ['asc'],
    ),
    ..._.orderBy(
      list.filter(o => o.ownedByUserFK !== user.id),
      ['title'],
      ['asc'],
    ),
  ]

  const handleMainButtonClick = () => {
    if (cannedTextTypeFK && !show) {
      dispatch({
        type: 'cannedText/query',
        payload: cannedTextTypeFK,
      })
      setShow(true)
    }
  }

  const onListItemClick = selectedCannedText => {
    handleSelectCannedText(selectedCannedText)
  }

  const handleSettingClick = () => {
    dispatch({
      type: 'cannedText/setSelectedNote',
      payload: {
        cannedTextTypeFK,
        fieldName: CANNED_TEXT_TYPE_FIELD_NAME[cannedTextTypeFK],
      },
    })
    setShow(false)
    setShowCannedText(true)
  }

  const debouncedAction = _.debounce(
    e => {
      setFilterCannedText(e.target.value)
    },
    100,
    {
      leading: true,
      trailing: false,
    },
  )

  const closeCannedText = () => {
    dispatch({
      type: 'cannedText/query',
      payload: cannedTextTypeFK,
    })
    setShowCannedText(false)
  }

  return (
    <div>
      <Popover
        icon={null}
        trigger='click'
        placement='bottom'
        visible={show}
        onVisibleChange={() => {
          setShow(!show)
          setFilterCannedText('')
        }}
        content={
          <div className={classes.popoverContainer}>
            <TextField
              label='Filter Canned Text'
              onChange={e => {
                debouncedAction(e)
              }}
            />
            <div className={classes.listContainer}>
              {list
                .filter(
                  item =>
                    item.title
                      .toUpperCase()
                      .indexOf(filterCannedText.toUpperCase()) >= 0,
                )
                .map(item => {
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
            <Divider className={classes.divider} />
            <div className={classes.item} onClick={handleSettingClick}>
              <Settings />
              <span>Settings</span>
            </div>
          </div>
        }
      >
        {buttonType === 'text' ? (
          <Button
            style={style}
            size='sm'
            color='info'
            onClick={handleMainButtonClick}
            disabled={disabled}
          >
            Canned Text
          </Button>
        ) : (
          <Button
            style={style}
            size='sm'
            color='transparent'
            onClick={handleMainButtonClick}
            disabled={disabled}
          >
            <ListAlt />
            CANNED TEXT
          </Button>
        )}
      </Popover>
      <CommonModal
        open={showCannedText}
        title='Canned Text'
        observe='CannedText'
        onClose={closeCannedText}
      >
        <CannedText />
      </CommonModal>
    </div>
  )
}

const Connected = connect(({ cannedText, loading, user }) => ({
  cannedText,
  loading: loading.effects['cannedText/query'],
  user: user.data,
}))(component)

export const CannedTextButton = withStyles(styles, {
  name: 'CannedTextButton',
})(Connected)