// ##############################
// // // RegularForms view styles
// #############################

import {
  cardTitle,
  successColor,
  dangerColor,
} from 'mui-pro-jss'
import customCheckboxRadioSwitch from 'mui-pro-jss/material-dashboard-pro-react/customCheckboxRadioSwitch.jsx'

const regularFormsStyle = (theme) => ({
  ...customCheckboxRadioSwitch(theme),
  cardIconTitle: {
    ...cardTitle,
    marginTop: '15px',
    marginBottom: '0px',
  },
  staticFormGroup: {
    marginLeft: '0',
    marginRight: '0',
    paddingBottom: '10px',
    margin: '8px 0 0 0',
    position: 'relative',
    '&:before,&:after': {
      display: 'table',
      content: '" "',
    },
    '&:after': {
      clear: 'both',
    },
  },
  staticFormControl: {
    marginBottom: '0',
    paddingTop: '8px',
    paddingBottom: '8px',
    minHeight: '34px',
  },
  inputAdornment: {
    marginRight: '8px',
    position: 'relative',
  },
  inputAdornmentIconSuccess: {
    color: successColor + '!important',
  },
  inputAdornmentIconError: {
    color: dangerColor + '!important',
  },
})

export default regularFormsStyle
