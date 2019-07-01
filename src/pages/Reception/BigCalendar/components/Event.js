import React, { PureComponent } from 'react'
// material ui
import { withStyles } from '@material-ui/core'
import ErrorOutline from '@material-ui/icons/ErrorOutline'

const style = () => ({
  blockDiv: {
    display: 'block',
  },
  container: {
    height: '100%',
    cursor: 'pointer',
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})

class Event extends PureComponent {
  _handleMouseEnter = (syntheticEvent) => {
    const { event, handleMouseOver } = this.props
    handleMouseOver(event, syntheticEvent)
  }

  _handleMouseLeave = () => {
    const { handleMouseOver } = this.props
    handleMouseOver(null, null)
  }

  render () {
    const { event, classes } = this.props
    const { isDoctorEvent, hasConflict } = event

    const title = isDoctorEvent ? event.doctor : event.patientName

    return (
      <div
        className={classes.container}
        onMouseEnter={this._handleMouseEnter}
        onMouseLeave={this._handleMouseLeave}
      >
        <div className={classes.title}>
          <span>
            <strong>{title}</strong>
          </span>
          {hasConflict && <ErrorOutline />}
        </div>
        <span className={classes.blockDiv}>{event.contactNo}</span>
      </div>
    )
  }
}

export default withStyles(style, { name: 'ApptEvent' })(Event)
