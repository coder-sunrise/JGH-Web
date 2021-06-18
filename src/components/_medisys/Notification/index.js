import React, { useState } from 'react'
import classnames from 'classnames'
// material ui
import { withStyles, Divider } from '@material-ui/core'
import Notifications from '@material-ui/icons/Notifications'
import Refresh from '@material-ui/icons/Refresh'
// common components
import { Badge, Popover, Button, Tabs, IconButton } from '@/components'
// sub components
import customDropdownStyle from '@/assets/jss/material-dashboard-pro-react/components/customDropdownStyle'
import { SystemMessageList } from '@/components/_medisys'
import NotificationList from './NotificationList'
// assets
import { TYPES } from './constants'

const styles = (theme) => ({
  ...customDropdownStyle(theme),
  overlayRoot: {
    display: 'flex',
    height: 50,
    borderBottom: 'solid 1px #DCDCDC',
  },
})

const NotificationComponent = ({
  notifications = [],
  systemMessage = {},
  dispatch,
  classes,
  theme,
}) => {
  const refreshQueueListing = () => {
    dispatch({
      type: 'queueLog/refresh',
    })
  }

  const [
    showNotification,
    setShowNotification,
  ] = useState(false)

  const { totalUnReadCount = 0 } = systemMessage

  const toggleVisibleChange = () => {
    setShowNotification(!showNotification)
  }

  const overlay = (
    <div style={{ position: 'relative', width: 600 }}>
      <Tabs
        type='line'
        options={TYPES.map((o) => {
          const list = notifications.filter((m) => !o.id || m.type === o.id)
          let unReadCounts =
            o.id === 4 ? totalUnReadCount : list.filter((m) => !m.read).length

          return {
            ...o,
            name: `${o.name} ${unReadCounts > 0 ? `(${unReadCounts})` : ''}`,
            content: o.id === 4 ? (
              <SystemMessageList dispatch={dispatch} type={o.id}
                setShowNotification={setShowNotification} />
            ) : (
              <NotificationList
                notifications={list}
                dispatch={dispatch}
                type={o.id}
              />
            ),
          }
        })}
      />
      <IconButton
        style={{ top: 12, right: 12, position: 'absolute' }}
        onClick={refreshQueueListing}
      >
        <Refresh />
      </IconButton>
    </div>
  )

  return (
    <Popover
      icon={null}
      trigger='click'
      className={classnames({
        [classes.pooperResponsive]: true,
        [classes.pooperNav]: true,
      })}
      content={overlay}
      onVisibleChange={toggleVisibleChange}
      visible={showNotification}
    >
      <Badge
        badgeContent={
          notifications.filter(
            (o) => TYPES.find((t) => !t.id || o.type === t.id) && !o.read,
          ).length + totalUnReadCount
        }
        color='primary'
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Button justIcon color='transparent' onClick={() => {
          setShowNotification(true)
        }}>
          <Notifications fontSize='large' />
        </Button>
      </Badge>
    </Popover>
  )
}

export default withStyles(styles, {
  withTheme: true,
  name: 'NotificationComponent',
})(NotificationComponent)
