import React, { Component } from 'react'
import withFormikExtend from '@/components/Decorator/withFormikExtend'
import { FastField } from 'formik'
import { ListItem, ListItemText, withStyles } from '@material-ui/core'
import {
  Button,
  TextField,
  MultipleTextField,
  dateFormatLongWithTimeNoSec,
  IconButton,
  Tooltip,
} from '@/components'
import { Done, Replay } from '@material-ui/icons'
import moment from 'moment'
import { Link } from 'umi'

const formatDateTime = datetime =>
  datetime ? moment(datetime).format(dateFormatLongWithTimeNoSec) : ''

const styles = theme => ({
  buttonLink: { margin: 'auto' },
  itemContainer: { display: 'flex' },
  itemRoot: {
    paddingTop: 0,
    paddingBottom: 0,
    cursor: 'pointer',
    '&:not(:last-child)': {
      borderBottom: `1px solid rgba(0, 0, 0, 0.12)`,
    },
    '&.Mui-disabled': {
      opacity: 1,
      backgroundColor: 'white',
    },
  },
  timestampText: {
    color: 'grey',
    fontSize: 12,
    marginTop: 5,
  },
})

class AppNotificationContent extends Component {
  state = {
    internalContent: undefined,
  }

  render() {
    const {
      notification,
      actions,
      classes,
      dispatch,
      currentUserFK,
      onAddNew,
      onCancel,
      onSave,
      onAcknowledge,
      customeStyle = {},
      showAcknowledge = true,
    } = this.props
    const {
      isNew,
      isAcknowledgeRequired,
      isAcknowledged,
      acknowledgeDate,
      content,
      fromUserFK,
      fromUser,
      toUserFK,
      toUser,
      generateDate,
      isRead,
      patientName,
    } = notification
    const { internalContent = content } = this.state
    const isSender = currentUserFK == fromUserFK
    const isReceiver = currentUserFK == toUserFK
    const isOtherPRO = !isSender && !isReceiver

    return (
      <div style={{ ...customeStyle }}>
        <div>
          {isNew ? (
            <div>
              <div>{`To: ${toUser}`}</div>
              <MultipleTextField
                maxLength={2000}
                autoSize={{ minRows: 4, maxRows: 4 }}
                value={internalContent}
                onChange={e => {
                  this.setState({ internalContent: e.target.value })
                }}
              />
            </div>
          ) : (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontWeight: isRead || isOtherPRO ? 'unset' : 'bold',
              }}
            >
              {internalContent}
              {patientName ? (
                <span style={{ marginLeft: 20 }}>
                  Patient: <strong>{patientName}</strong>
                </span>
              ) : null}
            </div>
          )}
        </div>
        <div>
          {isNew ? (
            <div style={{ textAlign: 'Right' }}>
              <Link style={{ display: 'inline-block' }}>
                <span
                  style={{
                    display: 'block',
                    textDecoration: 'underline',
                    marginRight: 10,
                    color: 'red',
                  }}
                  onClick={e => {
                    e.preventDefault()
                    onCancel(notification)
                  }}
                >
                  Cancel
                </span>
              </Link>
              <Link style={{ display: 'inline-block' }}>
                <span
                  style={{
                    display: 'block',
                    textDecoration: 'underline',
                  }}
                  onClick={e => {
                    e.preventDefault()
                    if (!internalContent?.trim()) return
                    onSave({ ...notification, content: internalContent })
                    this.setState({ internalContent: '' })
                  }}
                >
                  Save
                </span>
              </Link>
            </div>
          ) : (
            <div style={{ position: 'relative', height: 24 }}>
              {showAcknowledge &&
                (isReceiver && !isAcknowledged ? (
                  <Tooltip title='Acknowledge Message'>
                    <Button
                      justIcon
                      size='sm'
                      color='primary'
                      onClick={e => {
                        e.stopPropagation()
                        onAcknowledge(notification)
                      }}
                      title={formatDateTime(acknowledgeDate)}
                    >
                      <Done />
                    </Button>
                  </Tooltip>
                ) : isAcknowledged ? (
                  <div style={{ width: 22, height: 22, padding: 3 }}>
                    <Done style={{ color: '#389e0d' }} />
                  </div>
                ) : null)}
              {(isSender || isOtherPRO) && (
                <div
                  style={{
                    position: 'absolute',
                    left: 25,
                    bottom: 0,
                    fontSize: '0.75rem',
                  }}
                >{`To: ${toUser}`}</div>
              )}
              {/* {(isReceiver || isOtherPRO) &&*/ (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    fontSize: '0.75rem',
                  }}
                >
                  {`From: ${fromUser}, ${formatDateTime(generateDate)}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default withStyles(styles, { name: 'AppNotificationContent' })(
  AppNotificationContent,
)
