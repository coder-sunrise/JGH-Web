export default theme => ({
  payerHeader: {
    '& h4': {
      display: 'inline',
    },
  },
  leftAlignText: {
    textAlign: 'left',
  },
  rightAlignText: {
    textAlign: 'right',
  },
  centerText: {
    textAlign: 'center',
  },
  currencyText: { color: 'darkblue', fontWeight: 500 },
  boldText: {
    fontWeight: 'bold',
  },
  paymentTypeContainer: {
    maxHeight: '43vh',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  paymentTypeRow: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  paymentItemHeader: {
    display: 'inline',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  trashBin: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(2),
  },
  paymentSummary: {
    textAlign: 'right',
    marginTop: theme.spacing(2),
    fontSize: '1rem',
  },
  addPaymentActionButtons: {
    textAlign: 'right',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  noPaddingLeft: {
    paddingLeft: '0px !important',
  },
  paymentModeContainer: {
    maxHeight: '43vh',
    overflowX: 'auto',
    padding: theme.spacing(1),
  },
  paymentContent: {
    // marginTop: theme.spacing(2),
  },
})
