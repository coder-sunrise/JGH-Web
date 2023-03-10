import React from 'react'
// ant design
import { Dropdown, Menu } from 'antd'
// material ui core
import withStyles from '@material-ui/core/styles/withStyles'
// material ui icons
import MoreVert from '@material-ui/icons/MoreVert'
// common components
import { primaryColor } from 'mui-pro-jss'
import { Button } from '@/components'
import Authorized from '@/utils/Authorized'

const style = theme => ({
  leftAlign: {
    justifyContent: 'start',
  },
  menu: {
    '& > .ant-dropdown-menu-item': {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      '& span': {
        fontSize: '0.8rem',
        color: primaryColor,
      },
    },
    '& > .ant-dropdown-menu-item-disabled': {
      '& span, & svg': {
        color: 'rgba(0, 0, 0, 0.25) !important',
      },
    },
  },
  icon: {
    color: primaryColor,
    marginRight: theme.spacing(1),
    position: 'relative',
    top: 5,
  },
})

const GridContextMenuButton = ({
  classes,
  color = 'primary',
  contextMenuOptions = [
    {
      id: '',
      label: '',
      Icon: null,
      disabled: false,
      isDivider: false,
    },
  ],
  onClick = f => f,
  row = {},
}) => {
  const handleClick = event => {
    const { key } = event
    onClick(row, key)
  }

  const MenuItemsOverlay = (
    <Menu
      id='gridContextMenuButton'
      onClick={handleClick}
      className={classes.menu}
      onContextMenu={event => {
        event.preventDefault()
      }}
    >
      {contextMenuOptions.map(
        (
          {
            disabled,
            label,
            Icon,
            id,
            style,
            isDivider,
            hidden,
            authority,
            ...rest
          },
          index,
        ) => {
          if (isDivider) return <Menu.Divider key={`divider-${index}`} />

          const accessRight = Authorized.check(authority)
          if (!accessRight) return null

          const hideByAccessRight = accessRight.rights === 'hidden'
          const disabledByAccessRight = accessRight.rights === 'disable'

          const menu = (
            <Menu.Item
              key={id}
              id={`gridContextMenuButton-${id}`}
              onContextMenu={event => {
                event.preventDefault()
              }}
              disabled={disabled || disabledByAccessRight}
              style={{ width: rest.width || '100%' }}
            >
              <Icon style={style} className={classes.icon} />
              <span>{label}</span>
            </Menu.Item>
          )
          // eslint-disable-next-line no-nested-ternary
          return hidden || hideByAccessRight ? null : menu
        },
      )}
    </Menu>
  )

  return (
    <Dropdown
      overlay={MenuItemsOverlay}
      trigger={['click']}
      placement='bottomRight'
    >
      <Button justIcon round color={color} size='sm'>
        <MoreVert />
      </Button>
    </Dropdown>
  )
}

// GridContextMenuButton.propTypes = {
//   onClick: PropTypes.func.isRequired,
//   row: PropTypes.shape({}),
//   color: PropTypes.oneOf([
//     'primary',
//     'danger',
//     'success',
//     'info',
//   ]),
//   contextMenuOptions: PropTypes.shape([
//     {
//       id: PropTypes.string,
//       disabled: PropTypes.bool,
//       label: PropTypes.string,
//       Icon: PropTypes.node,
//       isDivider: PropTypes.bool,
//     },
//   ]),
// }

export default withStyles(style, { name: 'GridContextMenuButton' })(
  GridContextMenuButton,
)
