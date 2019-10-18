export default (theme) => ({
  title: {
    marginBottom: theme.spacing(1),
    fontSize: '1rem',
  },
  container: {
    margin: theme.spacing(1),
  },
  printButton: {
    position: 'absolute',
    left: theme.spacing(2),
  },
  infoButton: {
    position: 'absolute',
    left: theme.spacing(2),
  },
  currency: {
    color: 'darkblue',
    fontWeight: 500,
  },
  rowContainer: {
    paddingLeft: theme.spacing(4),
  },
  errorMessage: {
    color: 'red',
    fontWeight: 500,
  },
})
