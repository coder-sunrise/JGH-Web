import React from 'react'
import moment from 'moment'
// material ui
import { IconButton, withStyles } from '@material-ui/core'
import Printer from '@material-ui/icons/Print'
import Info from '@material-ui/icons/Info'
import Cross from '@material-ui/icons/HighlightOff'
// common components
import { GridContainer, GridItem, Tooltip, dateFormatLong } from '@/components'
import styles from './styles'
import { currencyFormatter } from '@/utils/utils'

const PaymentRow = ({
  // id,
  // type,
  // itemID,
  // date,
  // amount,
  // reason,
  // isCancelled,
  classes,
  handleVoidClick,
  handlePrinterClick,
  readOnly,
  ...payment
}) => {
  const { id, type, itemID, date, amount, reason, isCancelled } = payment
  let tooltipMsg = ''
  if (type === 'Payment') tooltipMsg = 'Print Receipt'
  else if (type === 'Credit Note') tooltipMsg = 'Print Credit Note'
  return (
    <GridContainer
      justify='center'
      alignItems='center'
      className={classes.rowContainer}
      style={isCancelled ? { textDecorationLine: 'line-through' } : {}}
    >
      <GridItem md={2}>
        {type === 'Payment' || type === 'Credit Note' ? (
          <Tooltip title={tooltipMsg}>
            <IconButton
              // payerID='N/A'
              id={itemID}
              className={classes.printButton}
              disabled={isCancelled}
              onClick={() => handlePrinterClick(type, id)}
            >
              <Printer />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title={reason}>
            <IconButton className={classes.infoButton}>
              <Info />
            </IconButton>
          </Tooltip>
        )}
        <span>{type}</span>
      </GridItem>
      <GridItem md={2}>
        <span>{itemID}</span>
      </GridItem>
      <GridItem md={2}>
        <span>{moment(date).format(dateFormatLong)}</span>
        {/* <DatePicker text format={dateFormatLong} value={date} /> */}
      </GridItem>
      <GridItem md={6} container justify='flex-end' alignItems='center'>
        <GridItem>
          <span className={classes.currency}>
            {amount ? currencyFormatter(amount) : 'N/A'}
          </span>
        </GridItem>
        <GridItem>
          <Tooltip
            title='Delete Selected item'
            style={{
              visibility: isCancelled === undefined ? 'hidden' : 'visible',
            }}
          >
            <IconButton
              id={itemID}
              onClick={() => handleVoidClick(payment)}
              disabled={isCancelled || readOnly}
            >
              <Cross />
            </IconButton>
          </Tooltip>
        </GridItem>
      </GridItem>
    </GridContainer>
  )
}

export default withStyles(styles, { name: 'PaymentRow' })(PaymentRow)
