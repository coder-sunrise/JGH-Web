import React, { PureComponent, Suspense } from 'react'
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout'
import Loadable from 'react-loadable'
import {
  FormControl,
  InputLabel,
  Input,
  Paper,
  withStyles,
  IconButton,
  Menu,
  MenuItem,
  Popper,
  Fade,
  ClickAwayListener,
} from '@material-ui/core'
import MoreVert from '@material-ui/icons/MoreVert'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
import Loading from '@/components/PageLoading/index'
import { getUniqueId } from '@/utils/utils'
import EyeVisualAcuity from '@/pages/Widgets/EyeVisualAcuity'

import {
  CardContainer,
  TextField,
  Button,
  CommonHeader,
  CommonModal,
  PictureUpload,
  GridContainer,
  GridItem,
  Card,
  CardAvatar,
  CardBody,
  notification,
  Select,
  DatePicker,
  CheckboxGroup,
  ProgressButton,
  Checkbox,
} from '@/components'

import { widgets } from '@/utils/widgets'

// import PatientSearch from '@/pages/PatientDatabase/Search'
// import PatientDetail from '@/pages/PatientDatabase/Detail'

const ResponsiveGridLayout = WidthProvider(Responsive)
// let layout = {
//   lg: [
//     { i: 'a', x: 0, y: 0, w: 12, h: 6, static: true }, // static: true
//     { i: 'b', x: 0, y: 0, w: 6, h: 2 }, // minW: 2, maxW: 4
//     { i: 'c', x: 6, y: 0, w: 6, h: 2 },
//   ],
// }
const styles = (theme) => ({
  ...basicStyle(theme),
  container: {
    width: '100%',
  },
  item: {
    width: 100,
    border: '1px solid #ccc',
  },
  paper: {
    '&> div': {
      overflow: 'auto',
      height: '100%',
    },
    // padding: 10,
  },
  moreWidgetsBtn: {
    position: 'absolute',
    right: -13,
    top: 0,
  },
})

const pageDefaultWidgets = [
  {
    id: '00001',
    key: 'a',
    widgetFK: 1,
    config: {
      lg: { i: 'a', x: 0, y: 0, w: 12, h: 6, static: true },
    },
  },
  {
    id: '00002',
    key: 'b',
    widgetFK: 2,
    config: {
      lg: { i: 'b', x: 0, y: 0, w: 6, h: 2 },
    },
  },
]

let myConfig = JSON.parse(localStorage.getItem('myConfig') || '{}')
if (Object.values(myConfig).length === 0) {
  myConfig = pageDefaultWidgets
}

class Masonry extends PureComponent {
  constructor (props) {
    super(props)
    this.container = React.createRef()
  }

  state = {
    nodes: null,
    elevation: {},
    menuOpen: false,
    anchorEl: null,
  }

  componentDidMount () {
    // create an instance
  }

  title = () => {
    const { anchorEl, menuOpen } = this.state
    const { theme } = this.props
    const ITEM_HEIGHT = 48
    const uid = getUniqueId()
    const handleClose = () => {
      this.setState({
        anchorEl: null,
        menuOpen: false,
      })
    }
    return (
      <div>
        <IconButton
          aria-label='More'
          aria-owns={this.state.menuOpen ? uid : undefined}
          aria-haspopup='true'
          onClick={(event) => {
            this.setState({
              anchorEl: event.currentTarget,
              menuOpen: true,
            })
          }}
          className={this.props.classes.moreWidgetsBtn}
        >
          <MoreVert />
        </IconButton>
        <Popper
          id={uid}
          anchorEl={anchorEl}
          open={menuOpen}
          transition
          onClose={handleClose}
          PaperProps={{
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: 200,
            },
          }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <ClickAwayListener onClickAway={handleClose}>
                <Paper
                  style={{
                    paddingLeft: theme.spacing.unit * 2,
                    paddingTop: theme.spacing.unit,
                  }}
                >
                  <CheckboxGroup
                    label='Selected Widgets'
                    vertical
                    simple
                    defaultValue={[
                      '1',
                    ]}
                    valueField='id'
                    textField='name'
                    options={widgets}
                    onChange={(e) => {
                      console.log(e)
                    }}
                  />
                </Paper>
              </ClickAwayListener>
            </Fade>
          )}
        </Popper>
      </div>
    )
  }

  generateConfig = (cfg) => {
    const { classes, ...resetProps } = this.props
    const { elevation } = this.state
    return {
      elevation: 0,
      className: classes.paper,
      onMouseOver: (e) => {
        elevation[cfg.id] = 3
        this.setState({ elevation })
      },
      onMouseOut: (e) => {
        elevation[cfg.id] = 0
        this.setState({ elevation })
      },
    }
  }

  render () {
    const { props, state } = this
    return <EyeVisualAcuity />
  }
}

export default withStyles(styles, { withTheme: true })(Masonry)
