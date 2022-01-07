import React, { PureComponent, useState } from 'react'
import PropTypes from 'prop-types'
// material ui
import { Popover, withStyles } from '@material-ui/core'
import Info from '@material-ui/icons/Info'
// devexpress react-grid
import { DataTypeProvider } from '@devexpress/dx-react-grid'
// common components
import { SizeContainer } from '@/components'
import { tooltip } from '@/assets/jss/index'
import _ from 'lodash'

const RowErrorStyles = () => ({
  popover: {
    pointerEvents: 'none',
  },
  tooltip: {
    // ...tooltip,
    '& > ul': {
      marginBottom: '0px !important',
      listStyle: 'none',
      paddingInlineStart: '10px !important',
    },
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
    maxWidth: 400,
    textAlign: 'left',
  },
})

const ListTypeError = ({ errors }) => {
  return (
    <ul>
      {_.orderBy(errors, ['isPrevent'], ['desc']).map((error, index) => (
        <li key={`rowError-${index}`}>{error.conflictContent}</li>
      ))}
    </ul>
  )
}

const ErrorPopover = ({ classes, errors = [], style = {}, className }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handlePopoverOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const showPopup = Boolean(anchorEl)
  return (
    <div style={style} className={className}>
      <Info
        color='error'
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      />
      <Popover
        // id={}
        className={classes.popover}
        open={showPopup}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        // disableRestoreFocus
      >
        <div className={classes.tooltip}>
          {Array.isArray(errors) ? (
            <ListTypeError errors={errors} />
          ) : (
            <span>{errors}</span>
          )}
        </div>
      </Popover>
    </div>
  )
}

export default withStyles(RowErrorStyles, { name: 'ErrorPopover' })(
  ErrorPopover,
)
