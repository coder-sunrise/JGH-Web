import React, { Fragment } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import numeral from 'numeral'
// material icon
import { Divider, withStyles } from '@material-ui/core'
import Calendar from '@material-ui/icons/CalendarToday'
// common component
import {
  CodeSelect,
  DatePicker,
  GridContainer,
  GridItem,
  TextField,
} from '@/components'
import * as Helper from './helper'
import { primaryColor } from '@/assets/jss'
import { APPOINTMENT_STATUSOPTIONS } from '@/utils/constants'

const styles = theme => ({
  root: {
    width: '530px',
    textAlign: 'left',
    padding: theme.spacing(1),
  },
  appointmentTypeColorBanner: {
    width: '100%',
    height: 20,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  divider: {
    backgroundColor: '#999',
  },
  titleLabel: {
    fontWeight: 500,
  },
  datetimeLabel: {
    display: 'inline-block',
    fontSize: '14px',
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
  },
  updateOnStyle: {
    '& > div > div > div > div > input': {
      color: 'black !important',
    },
  },
})

const ApptPopover = ({ classes, popoverEvent, ctappointmenttype = [] }) => {
  const {
    appointment_Resources: appointmentResources,
    appointmentDate,
    appointmentRemarks,
    appointmentTypeFK,
    appointmentStatusFk,
    bookedByUser,
    bookOn,
    patientName,
    patientProfile,
    patientContactNo,
    startTime,
    endTime,
    updateByUser,
    updateDate,
    resourceName,
    visitPurposeValue,
    preOrder = [],
    patientDOB,
  } = popoverEvent

  const date = moment(appointmentDate)
  const title = Helper.constructTitle(
    patientName,
    patientProfile,
    patientContactNo,
    patientDOB,
  )

  const AppointmentDateLabel = (
    <Fragment>
      <Calendar className={classes.icon} />
      <span className={classes.datetimeLabel}>
        {Helper.parseDateToDay(date)}, {Helper.parseDateToFullDate(date)}
      </span>
    </Fragment>
  )
  const TimeLabel = (
    <Fragment>
      <span className={classes.datetimeLabel}>
        {Helper.getTimeRange([], { startTime, endTime })}
      </span>
    </Fragment>
  )

  const appointmentType = ctappointmenttype.find(
    item => item.id === appointmentTypeFK,
  )
  const appointmentColor = appointmentType
    ? appointmentType.tagColorHex
    : primaryColor

  const preOrderStr = preOrder
    .map(
      x =>
        `${x.itemName || ''} ${numeral(x.quantity || '').format('0.0')}${
          x.uom ? ` ${x.uom}` : ''
        }`,
    )
    .join(', ')
  const status = APPOINTMENT_STATUSOPTIONS.find(
    x => x.id === appointmentStatusFk,
  )
  return (
    <div className={classes.root}>
      <div
        className={classes.appointmentTypeColorBanner}
        style={{
          backgroundColor: appointmentColor,
        }}
      />
      <GridContainer style={{ marginTop: 12 }}>
        <GridItem md={12}>
          <h4 className={classes.titleLabel}>{title}</h4>
        </GridItem>
        <GridItem md={12}>
          <span>Resource: {resourceName}</span>
        </GridItem>
        <GridItem className={classes.iconRow}>{AppointmentDateLabel}</GridItem>
        <GridItem>
          <Divider
            orientation='vertical'
            flexItem
            className={classes.divider}
            style={{ display: 'inline-block', width: 3 }}
          />
        </GridItem>
        <GridItem className={classes.iconRow}>{TimeLabel}</GridItem>
        <GridItem md={12}>
          <Divider
            className={classes.divider}
            style={{ marginTop: 8, marginBottom: 8 }}
          />
        </GridItem>
        <GridItem md={6}>
          <TextField
            label='Appt. Type'
            value={appointmentType?.displayValue || ''}
            disabled
          />
        </GridItem>
        <GridItem md={6}>
          <TextField label='Appt. Status' value={status?.name || ''} disabled />
        </GridItem>
        <GridItem md={6}>
          <TextField disabled label='Book By' value={bookedByUser} />
        </GridItem>
        <GridItem md={6}>
          <TextField
            label='Book On'
            value={moment(bookOn).format('DD MMM YYYY')}
            disabled
          />
        </GridItem>
        <GridItem md={6}>
          <TextField disabled label='Update By' value={updateByUser} />
        </GridItem>
        <GridItem md={6}>
          <TextField
            disabled
            label='Update On'
            value={moment(updateDate).format('DD MMM YYYY HH:mm')}
          />
        </GridItem>
        <GridItem md={12}>
          <TextField disabled label='Visit Purpose' value={visitPurposeValue} />
        </GridItem>
        <GridItem md={12}>
          <TextField
            disabled
            multiline
            rowsMax={10}
            label='Remarks'
            value={appointmentRemarks}
          />
        </GridItem>
        {preOrderStr.trim().length > 0 && (
          <GridItem md={12}>
            <span>Pre-Order : {preOrderStr}</span>
          </GridItem>
        )}
      </GridContainer>
    </div>
  )
}

const Connected = connect(({ codetable }) => ({
  ctappointmenttype: codetable.ctappointmenttype,
}))(ApptPopover)

export default withStyles(styles, { name: 'ApptPopover' })(Connected)
