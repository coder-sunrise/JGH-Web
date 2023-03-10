// ##############################
// // // Header styles
// #############################

import {
  containerFluid,
  defaultFont,
  primaryColor,
  defaultBoxShadow,
  infoColor,
  successColor,
  warningColor,
  dangerColor,
} from 'mui-pro-jss'

const headerStyle = (theme) => ({
  appBar: {
    // boxShadow: "none",
    borderBottom: '0',
    marginBottom: '0',
    position: 'sticky',
    // width: '100%',
    zIndex: '1029',
    color: '#555555',
    border: '0',
    // borderRadius: "3px",
    padding: '3px 0',
    transition: 'all 150ms ease 0s',
    minHeight: '50px',
    display: 'block',
    backgroundColor: 'white',
    boxShadow:
      '0px 1px 5px 0px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12)',
  },
  container: {
    ...containerFluid,
    minHeight: '50px',
  },
  flex: {
    flex: 1,
  },
  breadcrumb: {
    fontSize: 18,
  },
  title: {
    ...defaultFont,
    lineHeight: '30px',
    fontSize: '18px',
    borderRadius: '3px',
    textTransform: 'none',
    color: 'inherit',
    paddingTop: '0.625rem',
    paddingBottom: '0.625rem',
    margin: '0 !important',
    '&:hover,&:focus': {
      background: 'transparent',
    },
  },
  primary: {
    backgroundColor: primaryColor,
    color: '#FFFFFF',
    ...defaultBoxShadow,
  },
  info: {
    backgroundColor: infoColor,
    color: '#FFFFFF',
    ...defaultBoxShadow,
  },
  success: {
    backgroundColor: successColor,
    color: '#FFFFFF',
    ...defaultBoxShadow,
  },
  warning: {
    backgroundColor: warningColor,
    color: '#FFFFFF',
    ...defaultBoxShadow,
  },
  danger: {
    backgroundColor: dangerColor,
    color: '#FFFFFF',
    ...defaultBoxShadow,
  },
  sidebarMinimize: {
    float: 'left',
    padding: '0 0 0 15px',
    display: 'block',
    color: '#555555',
  },
  sidebarMinimizeRTL: {
    padding: '0 15px 0 0 !important',
  },
  sidebarMiniIcon: {
    width: '20px',
    height: '17px',
  },
})

export default headerStyle
