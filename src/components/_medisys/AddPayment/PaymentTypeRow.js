import React from 'react'
// material ui
import { withStyles } from '@material-ui/core'
import { Button, GridContainer, GridItem } from '@/components'
import { PAYMENT_MODE } from '@/utils/constants'

const styles = theme => ({
  button: {
    padding: theme.spacing(1),
    marginTop: 3,
    marginBottom: 3,
    marginRight: 0,
    textAlign: 'left',
    textTransform: 'none !important',
    '& p': {
      marginBottom: 0,
    },
  },
  hotkey: {
    textAlign: 'right',
  },
})

const PaymentTypeRow = ({
  classes,
  mode,
  hideDeposit = false,
  patientInfo,
  disableCash,
  disableDeposit,
  disableAllMode,
  onPaymentModeClick,
}) => {
  const handleClick = () => onPaymentModeClick(mode)

  let shouldDisable = false

  switch (mode.id) {
    case PAYMENT_MODE.CASH:
      shouldDisable = disableCash
      break
    case PAYMENT_MODE.DEPOSIT:
      shouldDisable =
        disableDeposit ||
        !patientInfo.patientDeposit ||
        patientInfo.patientDeposit.balance <= 0
      break
    default:
      shouldDisable = disableAllMode
      break
  }
  if (mode.id === PAYMENT_MODE.DEPOSIT && hideDeposit) return null
  return (
    <Button
      block
      color='primary'
      className={classes.button}
      onClick={handleClick}
      disabled={shouldDisable}
    >
      <GridContainer alignItems='center'>
        <GridItem md={8}>
          <p style={{ textDecoration: 'none' }}>{mode.displayValue}</p>
        </GridItem>
        <GridItem md={4} className={classes.hotkey}>
          <p>{mode.hotKey ? `(${mode.hotKey})` : ''}</p>
        </GridItem>
      </GridContainer>
    </Button>
  )
}

export default withStyles(styles, { name: 'PaymentTypeRowComponent' })(
  PaymentTypeRow,
)
