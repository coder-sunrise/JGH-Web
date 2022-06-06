import { MuiThemeProvider, createMuiTheme, withStyles } from '@material-ui/core'
import color from 'color'

import primaryColor from '@material-ui/core/colors/indigo'
import secondaryColor from '@material-ui/core/colors/blueGrey'
import {
  standardRowHeight,
  smallRowHeight,
  largeRowHeight,
  smallSingleRowHeight,
  standardSingleRowHeight,
  largeSingleRowHeight,
} from 'assets/jss'
import {
  // primaryColor,
  // secondaryColor,
  dangerColor,
  roseColor,
  grayColor,
  fontColor,
  hoverColor,
} from 'mui-pro-jss'

const defaultFontSize = '1rem'
const smallFontSize = '0.85rem'
const largeFontSize = '1.2rem'

const defaultIconWidth = '1.2rem'
const smallIconWidth = '1rem'
const largeIconWidth = '1.5rem'

const defaultButton = {
  padding: '8px 18px !important',
  fontSize: `${defaultFontSize} !important`,
  lineHeight: 1.5,
  borderRadius: '3px !important',
  minWidth: 100,
}
const smallButton = {
  padding: '3px 10px !important',
  fontSize: `${smallFontSize} !important`,
  lineHeight: 1.5,
  borderRadius: '0.2rem !important',
  minWidth: 80,
}
const largetButton = {
  padding: '12px 25px !important',
  fontSize: `${largeFontSize} !important`,
  lineHeight: 1.5,
  borderRadius: '5px !important',
}

const defaultColor = 'rgba(0, 0, 0, 0.54)'
const sharedToggleButtonGroup = {
  grouped: {
    // height: 'initial',
    lineHeight: 1.5,
  },
  sizeSmall: {
    height: 'auto',
  },
}
const sharedFormControlLabel = {
  label: {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  labelPlacementStart: {
    marginLeft: 0,
  },
}
const sharedInputAdornmentRoot = {
  color: fontColor,
  // fontSize: '1rem',
  height: 'auto',
  whiteSpace: 'nowrap',
  // '& > p': {
  //   fontWeight: 300,
  // },
}
const sharedPalette = {
  primary: primaryColor,
  secondary: secondaryColor,
}
const sharedCircularProgress = {
  // indeterminate: {
  //   animation:
  //     'MuiCircularProgress-keyframes-mui-progress-circular-rotate 1.4s linear infinite',
  //   animationName: 'none',
  // },
}
const sharedOverrides = {
  // CustomInputWrapper: {
  //   labelRoot: {
  //     zIndex: 1,
  //   },
  // },
  MuiExpansionPanel: {
    root: {
      '&.Mui-expanded': {
        margin: 0,
        marginTop: '8px !important',

        // marginTop: 'inherit',
        '&:first-child': {
          marginTop: '0px !important',
        },
      },
    },
  },
  NavPills: {
    contentWrapper: {
      marginLeft: 1,
      marginRight: 1,
    },
  },
  MuiBadge: {
    badge: {
      right: 8,
    },
  },
  MuiDrawer: {
    paper: {
      overflowX: 'hidden',
    },
  },
  MuiTypography: {
    body1: {
      fontSize: '1rem',
      lineHeight: 'auto',
    },
    colorTextSecondary: {
      color: 'currentColor',
    },
  },
  MuiInput: {
    underline: {
      '&:hover:not($disabled):not($focused):not($error):before': {
        borderBottomWidth: '1px',
      },
      '&:after': {
        // borderBottomColor: primaryColor,
        // borderBottomWidth:'1px',
      },
      // "&:before": {
      //   borderBottom: '10px solid rgba(0, 0, 0, 0.42)',
      // },
      '&$focused': {
        '&:after': {
          transform: 'scaleX(1) !important',
        },
      },
    },
    root: {
      '&$focused .rdw-editor-main': {
        transform: 'scaleX(1)',
        border: '2px solid #303f9f',
      },
      '& .rdw-editor-main': {
        border: '1px solid rgba(0, 0, 0, 0.42)',
      },
    },
    fullWidth: {
      '& > div': {
        width: '100%',
      },
    },
  },
  // RadioGroup: {
  //   label: {
  //     fontSize: 'inherit',
  //     fontWeight: 'inherit',
  //   },
  // },
  MuiGrid: {
    'direction-xs-column': {
      '& > div': {
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
  },
  MuiIconButton: {
    root: {
      padding: 3,
      color: 'rgba(0, 0, 0, 0.8)',
      fontSize: '1.2rem',
      borderRadius: 4,
    },
  },
  MuiTouchRipple: {
    child: {
      borderRadius: 4,
    },
  },
  MuiDialog: {
    paper: {
      // margin: 0,
    },
  },
  MuiList: {
    root: {
      color: primaryColor,
    },
  },
  // MuiListItemIcon: {
  //   root: {
  //     minWidth: 25,
  //   },
  // },
  MuiListItem: {
    button: {
      '&:hover,&:focus': {
        backgroundColor: hoverColor,
      },
    },
    root: {
      // textDecoration: 'underline',
      '&$selected': {
        backgroundColor: color(hoverColor)
          .lighten(0.05)
          .hex(),
      },
      '&$selected:hover': {
        backgroundColor: hoverColor,
      },
    },
  },
  MuiTooltip: {
    tooltip: {
      backgroundColor: '#ffffff',
      color: 'rgba(0, 0, 0, 0.87)',
      boxShadow:
        '0px 1px 3px 0px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 2px 1px -1px rgba(0,0,0,0.12)',
    },
  },

  TableSummaryItemBase: {
    item: {
      fontSize: '2em',
    },
  },

  // MuiTableBody: {
  //   root: {
  //     // '& tr.moveable:last-of-type td.td-move-cell button:last-of-type': {
  //     //   display: 'none',
  //     // },
  //     '& tr.moveable:nth-child(4) td.td-move-cell button:nth-child(1)': {
  //       display: 'none',
  //     },
  //   },
  // },
}

export const defaultTheme = createMuiTheme({
  palette: {
    ...sharedPalette,
  },
  props: {
    rowHeight: standardRowHeight,
    singleRowHeight: standardSingleRowHeight,
    size: 'md',
  },
  overrides: {
    ...sharedOverrides,
    MuiTypography: {
      body1: {
        fontSize: defaultFontSize,
        lineHeight: 'auto',
      },
      colorTextSecondary: {
        color: 'currentColor',
      },
    },
    MuiGrid: {
      root: {
        '& .ant-tag': {
          fontSize: defaultFontSize,
        },
        '& .ant-radio-wrapper': {
          fontSize: defaultFontSize,
        },
        '& .baseOnCustomStyle': {
          fontSize: defaultFontSize,
        },
        '& .ant-input': {
          fontSize: defaultFontSize,
        },
        '& .ant-select': {
          fontSize: defaultFontSize,
        },
        '& .ant-table-tbody': {
          '& > tr > td': {
            fontSize: defaultFontSize,
          },
        },
      },
    },
    MuiTableCell: {
      root: {
        '& > span': {
          fontSize: defaultFontSize,
        },
        padding: '7px 8px',
      },
      footer: {
        fontSize: defaultFontSize,
      },
    },
    MuiCheckbox: {
      root: {
        alignSelf: 'flex-start',
      },
    },
    MuiExpansionPanelDetails: {
      root: {
        display: 'inherit',
      },
    },
    MuiToggleButtonGroup: {
      ...sharedToggleButtonGroup,
      groupedSizeSmall: {
        padding: '5px 6px',
        fontSize: defaultFontSize,
      },
    },
    MuiFormControlLabel: {
      ...sharedFormControlLabel,
      root: {
        marginLeft: -10,
        width: '100%',
      },
      label: {
        fontSize: defaultFontSize,
      },
    },
    MuiSvgIcon: {
      root: {
        width: defaultIconWidth,
        height: defaultIconWidth,
      },
    },
    PrivateSwitchBase: {
      root: {
        margin: '0px 6px',
        padding: '0px 0px 1px 3px',
      },
    },
    MuiFormControl: {
      root: {
        margin: '5px 0 5px 0',
        paddingTop: 0,
      },
    },
    MuiFormLabel: {
      root: {
        lineHeight: '19px',
      },
    },
    MuiInputBase: {
      root: {
        alignItems: 'start',
        cursor: 'inherit',
        fontSize: defaultFontSize,
        '&.Mui-disabled': {
          color: 'inherit',
          cursor: 'not-allowed',
        },
        '& .ant-input': {
          height: '1em',
        },
        '& .ant-switch': {
          fontSize: smallFontSize,
        },
        '& .ant-switch-loading-icon, .ant-switch:after': {
          width: 20,
          height: 20,
          borderRadius: 3,
          top: 1,
        },
        '& .anticon': {
          fontSize: defaultFontSize,
          color: defaultColor,
        },
        '& .ant-radio-wrapper': {
          fontSize: defaultFontSize,
        },
        '& .ant-picker-input > input': {
          fontSize: defaultFontSize,
        },
        '& .ant-select': {
          fontSize: defaultFontSize,
          minHeight: 22,
        },
        '& .ant-input-number, .ant-time-picker': {
          fontSize: defaultFontSize,
        },

        '& .ant-select-remove-icon': {
          fontSize: 'inherit',
        },
        '& .anticon-close-circle': {
          color: 'rgba(0, 0, 0, 1)',
          fontSize: '1.1em',
        },
        '& .ant-select-selection__clear': {
          right: 14,
          top: 12,
        },
        '& .ant-calendar-picker-clear': {
          right: 12,
          top: '52%',
        },
        '& .ant-select-selection--single .ant-select-selection-selected-value': {
          position: 'relative',
          // top: 2,
        },
        // '& .ant-select-selection--single': {
        //   marginTop: 4,
        // },
        '& .ant-select-selection--single .ant-select-selection__clear': {
          top: 7,
          right: 15,
        },
        // '& .ant-select-selection--multiple .ant-select-selection__rendered': {
        //   height: '28px !important',
        //   overflowY: 'auto',
        //   overflowX: 'hidden',
        //   marginRight: 28,
        //   marginBottom: '-9px',
        // },
        '& .ant-select-selection--multiple > ul > li, .ant-select-selection--multiple .ant-select-selection__rendered > ul > li': {
          top: -2,
        },

        '&.Mui-disabled .anticon': {
          display: 'none',
        },
        '& .checkbox-container': {
          position: 'relative',
          top: 1,
        },
        '& .ant-select-selector': {
          height: '24px !important',
        },
        '& .ant-select-selection-item': {
          lineHeight: '22px !important',
        },
        BaseInput: {
          textInput: {
            fontSize: defaultFontSize,
          },
        },
      },

      input: {
        padding: '4px 0 1px',
        minHeight: 24,
        height: '1em',
        '& > label': {
          fontSize: defaultFontSize,
        },
      },
      multiline: {
        padding: 0,
        '& textarea:first-of-type': {
          position: 'relative',
          marginBottom: 5,
          top: 6,
        },
      },
    },
    MuiInputLabel: {
      root: {
        fontSize: defaultFontSize,
        fontWeight: 300,
      },
      formControl: {
        transform: 'translate(0, 22px) scale(1)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
      },
      shrink: {
        transform: 'translate(0, 3px) scale(0.8)',
        fontWeight: 'inherit',
        width: '126%',
      },
    },
    MuiInputAdornment: {
      root: {
        ...sharedInputAdornmentRoot,
        position: 'relative',
        top: 3,
        '& > svg': {
          top: 3,
          position: 'relative',
        },
      },
    },
    MuiCircularProgress: {
      ...sharedCircularProgress,
      root: {
        width: '16px !important',
        height: '16px !important',
        // '& svg': {
        //   top: 3,
        //   position: 'relative',
        // },
      },
    },
    MuiButton: {
      root: {
        textTransform: 'none',
      },
      contained: defaultButton,
      outlined: {
        ...defaultButton,
        padding: '7px 17px !important',
      },
    },
    RichEditor: {
      wrapper: {
        '& .rdw-editor-toolbar': {
          //  zoom: '90%',
          // height: 35,
          // padding: 5,
        },
      },
    },
    Tabs: {
      main: {
        '& .ant-tabs-bar': {
          zoom: '100%',
        },
      },
    },
    RadioEditor: {
      main: {
        '& svg': {
          width: '0.95rem',
          height: '0.95rem',
        },
      },
    },
    BaseInput: {
      textInput: {
        '& > div': {
          top: 0,
        },
        fontSize: defaultFontSize,
      },
    },

    MuiChip: {
      root: {
        borderRadius: 4,
        padding: 2,
      },
    },
  },
})

export const smallTheme = createMuiTheme({
  palette: {
    ...sharedPalette,
  },
  props: {
    rowHeight: smallRowHeight,
    singleRowHeight: smallSingleRowHeight,
    size: 'sm',
  },
  overrides: {
    ...sharedOverrides,
    MuiTypography: {
      body1: {
        fontSize: smallFontSize,
        lineHeight: 'auto',
      },
      colorTextSecondary: {
        color: 'currentColor',
      },
    },
    MuiGrid: {
      root: {
        '& .ant-tag': {
          fontSize: smallFontSize,
        },
        '& .ant-radio-wrapper': {
          fontSize: smallFontSize,
        },
        '& .baseOnCustomStyle': {
          fontSize: smallFontSize,
        },
        '& .ant-input': {
          fontSize: smallFontSize,
        },
        '& .ant-select': {
          fontSize: smallFontSize,
        },
        '& .ant-table-tbody': {
          fontSize: smallFontSize,
        },
      },
    },
    MuiTableCell: {
      root: {
        '& > span': {
          fontSize: smallFontSize,
        },
        padding: '7px 8px',
      },
      footer: {
        fontSize: smallFontSize,
      },
    },
    MuiToggleButtonGroup: {
      ...sharedToggleButtonGroup,
      groupedSizeSmall: {
        padding: '2px 6px',
        fontSize: smallFontSize,
      },
    },
    MuiToggleButton: {
      sizeSmall: {
        height: 26,
      },
    },
    MuiFormControlLabel: {
      ...sharedFormControlLabel,
      root: {
        marginLeft: -7,
        width: '100%',
      },
      label: {
        fontSize: smallFontSize,
      },
    },
    MuiSvgIcon: {
      root: {
        width: smallIconWidth,
        height: smallIconWidth,
      },
    },
    PrivateSwitchBase: {
      root: {
        margin: '0px 4px',
        padding: 0,
        paddingLeft: 2,
      },
    },
    MuiFormControl: {
      root: {
        margin: '3px 0 3px 0',
        paddingTop: 0,
      },
    },
    MuiInputBase: {
      root: {
        alignItems: 'start',
        cursor: 'inherit',
        fontSize: smallFontSize,
        '&.Mui-disabled': {
          color: 'inherit',
          cursor: 'not-allowed',
        },
        '& .ant-input': {
          height: '1em',
        },
        '& .ant-switch': {
          fontSize: smallFontSize,
        },
        '& .ant-switch-loading-icon, .ant-switch:after': {
          width: 16,
          height: 16,
          borderRadius: 3,
          top: 1,
        },
        '& .ant-radio-wrapper': {
          fontSize: smallFontSize,
        },
        '& .ant-picker-input > input': {
          fontSize: smallFontSize,
        },
        '& .ant-select': {
          fontSize: smallFontSize,
          minHeight: 20,
          // padding: '1px 0 0px',
        },
        '& .ant-input-number, .ant-time-picker': {
          fontSize: smallFontSize,
        },
        '& .anticon': {
          fontSize: smallFontSize,
          color: defaultColor,
        },
        '& .ant-select-remove-icon': {
          fontSize: 'inherit',
        },
        '& .anticon-close-circle': {
          color: 'rgba(0, 0, 0, 1)',
          fontSize: '1em',
        },
        '& .ant-select-selection__clear': {
          right: 13,
          top: 8,
        },
        '& .ant-select-selection--single .ant-select-selection-selected-value': {
          position: 'relative',
          top: 1,
        },
        '& .ant-select-selection--single .ant-select-selection__clear': {
          top: 6,
        },
        '& .ant-calendar-picker': {
          fontSize: smallFontSize,
        },
        // '& .ant-calendar-picker-input': {
        //   paddingTop: 3,
        // },
        // '& .ant-select-selection--multiple .ant-select-selection__rendered': {
        //   height: '22px !important',
        //   overflowY: 'auto',
        //   overflowX: 'hidden',
        //   marginRight: 27,
        // },
        '& .ant-select-selection--multiple > ul > li, .ant-select-selection--multiple .ant-select-selection__rendered > ul > li': {
          // top: -4,
          height: 18,
          // margin-top: 3px;
          lineHeight: '18px',
          fontSize: 'smaller',
          padding: '0 18px 0 5px',
        },
        '& .ant-select-selector': {
          height: '18px !important',
        },
        '& .ant-select-selection-item': {
          lineHeight: '18px !important',
        },
        BaseInput: {
          textInput: {
            fontSize: smallFontSize,
          },
        },
      },
      input: {
        padding: '3px 0 0px',
        minHeight: 20,
        height: '1em',
        '& > label': {
          fontSize: smallFontSize,
        },
      },
      multiline: {
        padding: 0,
        '& textarea:first-of-type': {
          position: 'relative',
          marginBottom: 4,
          top: 3,
        },
      },
    },
    MuiInputLabel: {
      root: {
        fontSize: smallFontSize,
        lineHeight: '0.95rem',
        fontWeight: 300,
      },
      formControl: {
        transform: 'translate(0, 20px) scale(1)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
      },
      shrink: {
        transform: 'translate(0, 3px) scale(0.8)',
        fontWeight: 'inherit',
        width: '126%',
        lineHeight: '20px',
      },
    },
    MuiInputAdornment: {
      root: {
        ...sharedInputAdornmentRoot,
        top: 3,
        position: 'relative',
        '& > svg': {
          top: 3,
          position: 'relative',
        },
      },
    },
    MuiCircularProgress: {
      ...sharedCircularProgress,
      root: {
        width: '12px !important',
        height: '12px !important',
        // '& svg': {
        //   top: 3,
        //   position: 'relative',
        // },
      },
    },
    MuiButton: {
      contained: smallButton,
      outlined: {
        ...smallButton,
        padding: '2px 9px !important',
      },
    },
    RichEditor: {
      wrapper: {
        '& .rdw-editor-toolbar': {
          // zoom: '70%',
          // height: 35,
          // padding: 5,
        },
      },
    },
    BaseInput: {
      textInput: {
        '& > div': {
          top: -3,
        },
        fontSize: smallFontSize,
      },
    },
    Tabs: {
      main: {
        '& .ant-tabs-bar': {
          zoom: '80%',
        },
      },
    },
    MuiChip: {
      root: {
        borderRadius: 4,
        padding: 2,
        height: 'auto',
      },
      deleteIcon: {
        width: 16,
        height: 16,
      },
    },
  },
})

export const largeTheme = createMuiTheme({
  palette: {
    ...sharedPalette,
  },
  props: {
    rowHeight: largeRowHeight,
    singleRowHeight: largeSingleRowHeight,
    size: 'lg',
  },
  overrides: {
    ...sharedOverrides,
    MuiTypography: {
      body1: {
        fontSize: largeFontSize,
        lineHeight: 'auto',
      },
      colorTextSecondary: {
        color: 'currentColor',
      },
    },
    MuiGrid: {
      root: {
        '& .ant-tag': {
          fontSize: largeFontSize,
        },
        '& .ant-radio-wrapper': {
          fontSize: largeFontSize,
        },
        '& .baseOnCustomStyle': {
          fontSize: largeFontSize,
        },
        '& .ant-input': {
          fontSize: largeFontSize,
        },
        '& .ant-select': {
          fontSize: largeFontSize,
        },
        '& .ant-table-tbody': {
          fontSize: largeFontSize,
        },
      },
    },
    MuiTableCell: {
      root: {
        '& > span': {
          fontSize: largeFontSize,
        },
        padding: '7px 8px',
      },
      footer: {
        fontSize: largeFontSize,
      },
    },
    MuiFormControlLabel: {
      ...sharedFormControlLabel,
      root: {
        marginLeft: -12,
        width: '100%',
      },
      label: {
        fontSize: largeFontSize,
      },
    },
    MuiSvgIcon: {
      root: {
        width: largeIconWidth,
        height: largeIconWidth,
      },
    },
    PrivateSwitchBase: {
      root: {
        margin: '0px 8px',
        padding: '0px 3px',
      },
    },
    MuiFormControl: {
      root: {
        margin: '6px 0 5px 0',
        paddingTop: 4,
      },
    },
    MuiInputBase: {
      root: {
        alignItems: 'start',
        cursor: 'inherit',
        fontSize: largeFontSize,
        '&.Mui-disabled': {
          color: 'inherit',
          cursor: 'not-allowed',
        },
        '& .ant-input': {
          height: '1em',
        },
        '& .ant-switch': {
          fontSize: largeFontSize,
        },
        '& .ant-switch-loading-icon, .ant-switch:after': {
          width: 21,
          height: 21,
          borderRadius: 3,
          top: 1,
        },
        '& .ant-radio-wrapper': {
          fontSize: largeFontSize,
        },
        '& .ant-picker-input > input': {
          fontSize: largeFontSize,
        },
        '& .ant-select': {
          fontSize: largeFontSize,
          minHeight: 25,
          // padding: '1px 0 0px',
        },
        '& .ant-input-number, .ant-time-picker': {
          fontSize: largeFontSize,
        },
        '& .anticon': {
          fontSize: largeFontSize,
          color: defaultColor,
        },
        '& .ant-select-remove-icon': {
          fontSize: 'inherit',
        },
        '& .anticon-close-circle': {
          color: 'rgba(0, 0, 0, 1)',
          fontSize: '1.3rem',
        },
        '& .ant-select-selection__clear': {
          right: 17,
          top: 10,
        },
        '& .ant-select-selection--single .ant-select-selection-selected-value': {
          position: 'relative',
          top: 1,
        },
        '& .ant-select-selection--single .ant-select-selection__clear': {
          top: 5,
        },
        '& .ant-calendar-picker': {
          fontSize: largeFontSize,
        },
        // '& .ant-select-selection--multiple .ant-select-selection__rendered': {
        //   height: '30px !important',
        //   overflowY: 'auto',
        //   overflowX: 'hidden',
        //   marginRight: 30,
        // },
        '& .ant-select-selection--multiple > ul > li, .ant-select-selection--multiple .ant-select-selection__rendered > ul > li': {
          top: -1,
        },
        '& .ant-select-selector': {
          height: '24px !important',
        },
        '& .ant-select-selection-item': {
          lineHeight: '22px !important',
        },
        BaseInput: {
          textInput: {
            fontSize: largeFontSize,
          },
        },
      },
      input: {
        padding: '6px 0 3px',
        minHeight: 25,
        height: '1em',
        '& > label': {
          fontSize: largeFontSize,
        },
      },
      multiline: {
        padding: 0,
        '& textarea:first-of-type': {
          position: 'relative',
          marginBottom: 9,
          top: 8,
        },
      },
    },
    MuiInputLabel: {
      root: {
        fontSize: largeFontSize,
        lineHeight: '1em',
        fontWeight: 300,
      },
      formControl: {
        transform: 'translate(0, 30px) scale(1)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
      },
      shrink: {
        transform: 'translate(0, 6px) scale(0.8)',
        fontWeight: 'inherit',
        width: '126%',
      },
    },
    MuiInputAdornment: {
      root: {
        ...sharedInputAdornmentRoot,
        marginTop: 4,
      },
    },
    MuiCircularProgress: {
      ...sharedCircularProgress,
      root: {
        width: '20px !important',
        height: '20px !important',
        // '& svg': {
        //   top: 2,
        //   position: 'relative',
        // },
      },
    },
    MuiButton: {
      contained: largetButton,
      outlined: {
        ...largetButton,
        padding: '11px 24px !important',
      },
    },
    BaseInput: {
      textInput: {
        '& > div': {
          marginTop: 0,
        },
        fontSize: largeFontSize,
      },
    },
  },
})
// console.log(smallTheme)
