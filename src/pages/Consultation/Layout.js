import React, { PureComponent } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import $ from 'jquery'
// react-grid-layout
import { Responsive, WidthProvider } from 'react-grid-layout'
// antd
import { Anchor, Menu, Dropdown } from 'antd'
// material ui
import { Paper, Divider, Slide, Tooltip, Drawer } from '@material-ui/core'
import Clear from '@material-ui/icons/Clear'
import Settings from '@material-ui/icons/Settings'
import Fullscreen from '@material-ui/icons/Fullscreen'
import FullscreenExit from '@material-ui/icons/FullscreenExit'
import CompareArrows from '@material-ui/icons/CompareArrows'
import Accessibility from '@material-ui/icons/Accessibility'

import { headerHeight } from 'mui-pro-jss'
// common components
import {
  CardContainer,
  Button,
  CheckboxGroup,
  ProgressButton,
  SizeContainer,
  Popconfirm,
  IconButton,
  CustomInputWrapper,
  notification,
  GridContainer,
  GridItem,
} from '@/components'
// sub components
import PatientHistoryDrawer from './PatientHistoryDrawer'
import { control } from '@/components/Decorator'
import Templates from './Templates'
// utils
import Authorized from '@/utils/Authorized'
import { widgets } from '@/utils/widgets'
import gpLayoutCfg, { dentalLayoutCfg } from './layoutConfigs'
import { CLINIC_TYPE } from '@/utils/constants'

// console.log(JSON.stringify(dentalLayoutCfg))
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const sizes = Object.keys(breakpoints)

const ResponsiveGridLayout = WidthProvider(Responsive)

let lastActivedWidget = null

const { Link } = Anchor
// @connect(({ cestemplate }) => ({
//   cestemplate,
// }))
@control()
class Layout extends PureComponent {
  constructor (props) {
    super(props)

    this.container = React.createRef()
    this.layoutContainer = React.createRef()
    // console.log(this.container)
    // console.log(window.innerHeight)
    this.delayedResize = _.debounce(this.resize, 300)
    window.addEventListener('resize', this.delayedResize)
    this.delayedChangeLayout = _.debounce(this.changeLayout, 300)
    this.ordersRef = React.createRef()
    this.myRefs = []

    // console.log(localStorage.getItem('consultationLayout'))
    // console.log(JSON.parse(localStorage.getItem('consultationLayout') || '{}'))

    const { userDefaultLayout, clinicInfo } = props

    let { defaultConsultationTemplate = '[]' } = clinicInfo
    // console.log(defaultConsultationTemplate)
    if (!defaultConsultationTemplate || defaultConsultationTemplate === '[]') {
      notification.warn({
        message: 'Clinic do not have default template configuration',
      })
      this.pageDefaultWidgets = []
    } else {
      this.pageDefaultWidgets = JSON.parse(defaultConsultationTemplate)
    }

    let defaultLayout

    if (userDefaultLayout && userDefaultLayout.consultationTemplate) {
      defaultLayout = JSON.parse(userDefaultLayout.consultationTemplate)
    } else {
      // disable local setting(!localStorage.getItem('consultationLayout')) {
      defaultLayout = this.getDefaultLayout()
    }
    //  else {
    //   defaultLayout = JSON.parse(localStorage.getItem('consultationLayout'))
    // }
    // console.log(defaultLayout)
    if (!defaultLayout.widgets) {
      defaultLayout = this.getDefaultLayout()
    }
    // console.log(defaultLayout)
    this.widgetMenu = (
      <Menu>
        {widgets
          .filter((widget) => {
            const widgetAccessRight = Authorized.check(widget.accessRight)
            if (!widgetAccessRight) return false
            const shouldShow =
              widgetAccessRight && widgetAccessRight.rights !== 'hidden'

            return shouldShow
          })
          .map((o) => {
            const cfg = defaultLayout.lg.find((m) => m.i === o.id) || {}

            return (
              <Menu.Item
                key={o.id}
                disabled={cfg.static}
                onClick={(e) => {
                  // console.log(this.state.currentLayout)
                  // console.log(e.domEvent.target)
                  // console.log(this.state.replaceWidget)
                  if (e.key === this.state.replaceWidget) return false
                  const layout = _.cloneDeep(this.state.currentLayout)
                  for (let index = 0; index < sizes.length; index++) {
                    const breakpoint = sizes[index]
                    if (layout[breakpoint]) {
                      const target = layout[breakpoint].find(
                        (m) => m.i === e.key,
                      )
                      let starter = layout[breakpoint].find(
                        (m) => m.i === this.state.replaceWidget,
                      )
                      if (target) {
                        target.i = this.state.replaceWidget
                        starter.i = e.key
                      } else {
                        starter.i = e.key
                        if (
                          layout.widgets.find(
                            (m) => m === this.state.replaceWidget,
                          )
                        )
                          layout.widgets = _.reject(
                            layout.widgets,
                            (m) => m === this.state.replaceWidget,
                          )

                        if (!layout.widgets.find((m) => m === e.key)) {
                          layout.widgets.push(e.key)
                        }
                        // layout[breakpoint]=_.reject(layout[breakpoint])
                      }

                      // console.log(target, starter)
                    }
                  }
                  // console.log(layout)
                  this.changeLayout(layout)
                }}
              >
                {o.name}
              </Menu.Item>
            )
          })}
      </Menu>
    )

    this.state = {
      mode: 'edit',
      breakpoint: 'lg',
      rowHeight: this.getLayoutRowHeight(),
      showInvoiceAdjustment: false,
      collapsed: global.collapsed,
      currentLayout: defaultLayout,
      openPatientHistoryDrawer: false,
    }
    localStorage.setItem('consultationLayout', JSON.stringify(defaultLayout))
  }

  // componentDidMount () {}

  componentWillUnmount () {
    window.removeEventListener('resize', this.delayedResize)
    $(window.mainPanel).css('overflow', 'auto')

    this.state.currentLayout.widgets.map((id) => {
      const w = widgets.find((o) => o.id === id)
      if (w && w.onUnmount) w.onUnmount()
    })
  }

  resize = (e) => {
    // console.log(e)
    this.setState({
      rowHeight: this.getLayoutRowHeight(),
    })
  }

  showWidgetManagePanel = (event) => {
    this.setState({
      anchorEl: event.currentTarget,
      menuOpen: true,
    })
  }

  closeWidgetManagePanel = () => {
    this.setState({
      anchorEl: null,
      menuOpen: false,
    })
  }

  removeWidget = (widgetId) => {
    const { setFieldValue, values } = this.props
    const wg = widgets.find((o) => o.id === widgetId)
    // console.log(wg)
    const { associatedProps = [], onRemove, model } = wg
    associatedProps.forEach((ap) => {
      const v = values[ap]
      // console.log(ap, v)
      if (v) {
        if (Array.isArray(v)) {
          // eslint-disable-next-line no-return-assign
          // console.log(
          //   v.map((o) => ({
          //     ...o,
          //     isDeleted: true,
          //   })),
          // )
          setFieldValue(
            ap,
            v.map((o) => ({
              ...o,
              isDeleted: true,
            })),
          )
        }
      }
    })
    if (onRemove) onRemove()
    // if (model) {
    //   this.props.dispatch({
    //     type: `${model}/removeWidget`,
    //   })
    // }
    const { currentLayout } = this.state

    const layout = {
      widgets: _.reject(currentLayout.widgets, (w) => w === widgetId),
    }
    sizes.forEach((s) => {
      layout[s] = currentLayout[s]
      if (layout[s]) {
        layout[s] = layout[s].filter((o) => o.i !== widgetId)
      }
    })
    this.changeLayout(layout)
  }

  addWidget = (widgetId) => {
    const { currentLayout } = this.state
    const layout = _.cloneDeep(currentLayout)
    layout.widgets.push(widgetId)
    // console.log(currentLayout)
    sizes.forEach((s) => {
      const widget = this.pageDefaultWidgets.find((o) => o.id === widgetId) || {
        config: {},
      }
      if (layout[s]) {
        const n = {
          h: 4,
          w: 6,
          minH: 3,
          minW: 4,
          x: 0,
          i: widgetId,
          ...widget.config[s],
          y: Infinity,
        }
        layout[s].push(n)
        // console.log(n)
      }
    })
    this.changeLayout(layout)
  }

  promptRemoveWidgetConfirmation = (key) => {
    this.props.dispatch({
      type: 'global/updateState',
      payload: {
        openConfirm: true,
        openConfirmContent: 'Confirm to remove widgets?',
        openConfirmText: 'Confirm',
        onConfirmSave: () => this.removeWidget(key),
      },
    })
  }

  updateWidget = (ids, changes) => {
    const keys = Object.keys(changes)
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      if (changes[key]) {
        this.addWidget(key)
      } else {
        this.promptRemoveWidgetConfirmation(key)
      }
    }
  }

  changeLayout = (layout) => {
    this.setState(
      {
        currentLayout: layout,
      },
      () => {
        localStorage.setItem('consultationLayout', JSON.stringify(layout))
      },
    )
  }

  getDefaultLayout = () => {
    const defaultWidgets = _.cloneDeep(this.pageDefaultWidgets)

    const r = {
      widgets: defaultWidgets
        .filter((o) => {
          const w = widgets.find((m) => m.id === o.id)
          if (!w) return false
          const widgetAccessRight = Authorized.check(w.accessRight)
          // console.log(widgetAccessRight, w)
          return !!widgetAccessRight
        })
        .map((o) => o.id),
    }
    sizes.forEach((s) => {
      r[s] = defaultWidgets.map((o) => ({
        ...o.config[s],
        i: o.id,
      }))
    })
    return r
  }

  generateConfig = (id) => {
    const { classes, ...resetProps } = this.props
    const { elevation } = this.state
    return {
      elevation: 1,
      classes: {
        root: classes.paperRoot,
      },
      className: 'widget-container',
      onMouseEnter: this.onMouseEnter,

      // onMouseOut: (e) => {
      //   console.log(e.target)

      //   // elevation[cfg.id] = 0
      //   // this.setState({ elevation })
      // },
    }
  }

  toggleMode = () => {
    this.setState((prevState) => ({
      mode: prevState.mode === 'default' ? 'edit' : 'default',
    }))
  }

  toggleDrawer = (event) => {
    this.setState((prevState) => ({ openDraw: !prevState.openDraw }))
    const { cestemplate, dispatch } = this.props
    if (cestemplate && !cestemplate.list) {
      dispatch({
        type: 'cestemplate/query',
      })
    }
  }

  togglePatientHistoryDrawer = () => {
    this.setState((prevState) => ({
      openPatientHistoryDrawer: !prevState.openPatientHistoryDrawer,
    }))
  }

  compareNodeLayoutChange = (a, b) => {
    for (let index = 0; index < a.length; index++) {
      const a1 = a[index]
      const b1 = b[index]
      if (a1.h !== b1.h) return false
      if (a1.w !== b1.w) return false
      if (a1.x !== b1.x) return false
      if (a1.y !== b1.y) return false
    }
    return true
  }

  onMouseEnter = (e) => {
    // console.log(e.target)
    // console.log(cfg, e.target)
    // console.log($(e.target).parent('.widget-container')[0])
    // elevation[cfg.id] = 3
    // this.setState({ elevation })
    // if (lastActivedWidgetId === id) return
    if (lastActivedWidget) {
      lastActivedWidget.css('overflowY', 'hidden')
      lastActivedWidget.css('overflowX', 'hidden')
    }
    const t = $(e.target)
    lastActivedWidget = t.hasClass('widget-container')
      ? t
      : $(t.parents('.widget-container')[0])
    if (lastActivedWidget.length > 0) {
      lastActivedWidget.css('overflowY', 'auto')
      lastActivedWidget.css('overflowX', 'hidden')
    }
  }

  onFullScreenClick = (id) => () => {
    sessionStorage.setItem(
      'tempLayout',
      JSON.stringify(this.state.currentLayout),
    )
    this.setState(
      {
        fullScreenWidget: id,
      },
      () => {
        // $(window.mainPanel).css('overflow', 'hidden').scrollTop(0)
      },
    )
  }

  onExitFullScreenClick = () => {
    $(window.mainPanel).css('overflow', 'auto')
    this.setState({
      fullScreenWidget: undefined,
      currentLayout: JSON.parse(sessionStorage.getItem('tempLayout')),
    })
  }

  // // eslint-disable-next-line camelcase
  // UNSAFE_componentWillReceiveProps (nextProps) {
  //   const { global } = nextProps
  //   // console.log(value)
  //   if (global.collapsed !== this.state.collapsed) {
  //     this.setState({
  //       collapsed: global.collapsed,
  //       // currentLayout: _.cloneDeep(preState.currentLayout),
  //     })
  //     this.forceUpdate()
  //   }
  // }

  getLayoutRowHeight = () => {
    const topHeight = (this.props.height ? 0 : headerHeight) + 158 // 168 = nav header height + patient banner height + anchor height
    // console.log(
    //   this.props,
    //   (this.props.height || window.innerHeight - topHeight) / 6,
    //   ((this.props.height || window.innerHeight) - topHeight) / 6,
    // )

    return ((this.props.height || window.innerHeight) - topHeight) / 6
  }

  onAnchorClick = (id) => {
    const parentElement = document.getElementById('mainPanel-root')
    const element = document.getElementById(id)
    try {
      if (parentElement && element) {
        const screenPosition = element.getBoundingClientRect()
        const { scrollTop } = parentElement
        const { top, left } = screenPosition

        parentElement.scrollTo({
          // scrolled top position + element top position - Nav header height and Patient Banner height
          top: scrollTop + top - 208,
          left,
          behavior: 'smooth',
        })
      }
    } catch (error) {
      console.error({ error })
    }
  }

  render () {
    const { state, props } = this
    const { currentLayout } = state
    const { classes, ...restProps } = props
    const {
      theme,
      height,
      rights,
      clinicInfo,
      onSaveLayout = (f) => f,
    } = restProps
    const widgetProps = {
      status: 'consultation',
      // parentProps: props,
      rights,
    }
    // console.log(state.currentLayout)

    const layoutCfg = {
      className: classnames({
        [classes.layout]: true,
        [classes.fullscreenWidget]: this.state.fullScreenWidget,
      }),
      rowHeight: state.rowHeight,
      layouts: state.currentLayout,
      breakpoints,
      cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
      useCSSTransforms: false,
      preventCollision: !!this.state.fullScreenWidget,
      margin: [
        2,
        2,
      ],
      isDraggable: !this.state.fullScreenWidget,
      draggableCancel: '.non-dragable',
      draggableHandle: '.dragable',
      isResizable: this.state.mode === 'edit',
      onBreakpointChange: (newBreakpoint, newCols) => {
        this.setState({
          breakpoint: newBreakpoint,
        })
        // console.log('onBreakpointChange', newBreakpoint, newCols)
      },
      onLayoutChange: (_currentLayout, allLayouts) => {
        // console.log(window.mainPanel)
        if (
          !this.state.fullScreenWidget &&
          !_.isEqualWith(
            allLayouts[this.state.breakpoint],
            this.state.currentLayout[this.state.breakpoint],
            this.compareNodeLayoutChange,
          )
        ) {
          // console.log('onLayoutChange')
          this.delayedChangeLayout(allLayouts)
        }
      },
      onWidthChange: (containerWidth, margin, cols, containerPadding) => {
        // console.log(
        //   'onWidthChange',
        //   containerWidth,
        //   margin,
        //   cols,
        //   containerPadding,
        // )
      },
      onResizeStart: (e) => {
        // $(this.layoutContainer.current).addClass(classes.layoutOnDrag)
        // console.log(e, window, $(window.mainPanel))
        // $(window.mainPanel).scrollTop($(window.mainPanel).scrollTop() + 5)
        // console.log($(this.layoutContainer.current), classes.layoutOnDrag)
        const {
          scrollTop,
          scrollHeight,
          offsetHeight,
        } = this.layoutContainer.current
        // console.log(scrollTop + offsetHeight, scrollHeight)
        if (scrollTop + offsetHeight >= scrollHeight - 10) {
          $(this.layoutContainer.current).addClass(
            this.props.classes.layoutOnDrag,
          )
          this.layoutContainer.current.scrollTo(
            0,
            this.layoutContainer.current.scrollHeight,
          )
        }
      },
      onResizeStop: (e) => {
        // $(this.layoutContainer.current).removeClass(classes.layoutOnDrag)
        // console.log(e)
        $(this.layoutContainer.current).removeClass(
          this.props.classes.layoutOnDrag,
        )
      },
    }

    // console.log({ currentLayout: state.currentLayout.widgets, widgets })
    const { clinicTypeFK = CLINIC_TYPE.GP } = clinicInfo
    return (
      <div>
        {!this.state.fullScreenWidget && (
          <CardContainer
            hideHeader
            style={{
              marginTop: 0,
              position: 'sticky',
              overflowY: 'auto',
              top: headerHeight + 100,
              zIndex: 1000,
              borderRadius: 0,
              marginBottom: 0,
              // backgroundColor: '#f0f8ff',
            }}
          >
            <GridContainer justify='space-between'>
              <GridItem md={10}>
                {state.currentLayout.widgets.map((id) => {
                  const w = widgets.find((o) => o.id === id)
                  if (!w) return null
                  const onClick = () => this.onAnchorClick(w.id)
                  return (
                    <Button size='sm' color='primary' onClick={onClick}>
                      {w.name}
                    </Button>
                  )
                })}
              </GridItem>
              <GridItem md={2} style={{ textAlign: 'right' }}>
                <Button size='sm' color='info' onClick={this.toggleDrawer}>
                  <Settings />
                  Widgets
                </Button>
                <Button
                  size='sm'
                  color='info'
                  onClick={this.togglePatientHistoryDrawer}
                >
                  <Accessibility />
                  History
                </Button>
              </GridItem>
            </GridContainer>
          </CardContainer>
        )}
        {true && (
          <div
            ref={this.layoutContainer}
            style={{
              height: height ? this.props.height - 116 : 'auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              marginTop: 1,
              position: 'relative',
            }}

            // onScroll={this.delayedMainDivScroll}
          >
            <ResponsiveGridLayout {...layoutCfg}>
              {state.currentLayout.widgets.map((id) => {
                const w = widgets.find((o) => o.id === id)
                if (!w) return <div />
                const cfgs = state.currentLayout[state.breakpoint]
                const cfg = cfgs.find((o) => o.i === id)

                if (!cfg) return <div key={id} />
                const LoadableComponent = w.component

                return (
                  <div
                    className={classnames({
                      [classes.block]: true,
                      [classes.fullscreen]: state.fullScreenWidget === id,
                      [classes.hide]: state.fullScreenWidget !== id,
                      [classes.show]:
                        !state.fullScreenWidget ||
                        state.fullScreenWidget === id,
                    })}
                    key={id}
                    id={w.id}
                  >
                    <Paper
                      {...this.generateConfig(id)}
                      style={{
                        borderColor: '#AAAAAA',
                        borderStyle: 'solid',
                        borderWidth: 'thin',
                      }}
                    >
                      {this.state.mode === 'edit' && (
                        <div className={`${classes.blockHeader} dragable`}>
                          <div
                            style={{ height: 25, backgroundColor: '#e6e6e6' }}
                          >
                            <span className={classes.blockName}>{w.name}</span>

                            <React.Fragment>
                              {w.toolbarAddon}
                              {!state.fullScreenWidget && (
                                <React.Fragment>
                                  <Tooltip title='Full-screen'>
                                    <IconButton
                                      aria-label='Full-screen'
                                      size='small'
                                      onClick={this.onFullScreenClick(id)}
                                    >
                                      <Fullscreen />
                                    </IconButton>
                                  </Tooltip>

                                  <Dropdown
                                    overlay={this.widgetMenu}
                                    trigger={[
                                      'click',
                                    ]}
                                    currentWidgetId={id}
                                    disabled={cfg.static}
                                    onVisibleChange={(visible) => {
                                      if (visible)
                                        this.setState({
                                          replaceWidget: id,
                                        })
                                    }}
                                  >
                                    <Tooltip title='Switch widget'>
                                      <IconButton
                                        aria-label='Replace'
                                        size='small'
                                      >
                                        <CompareArrows />
                                      </IconButton>
                                    </Tooltip>
                                  </Dropdown>

                                  {!w.disableDeleteWarning ? (
                                    <Popconfirm
                                      title='Removing widget will remove all underlying data. Remove this widget?'
                                      onConfirm={() => this.removeWidget(id)}
                                    >
                                      <Tooltip title='Delete'>
                                        <IconButton
                                          aria-label='Delete'
                                          size='small'
                                          disabled={w.persist}
                                        >
                                          <Clear />
                                        </IconButton>
                                      </Tooltip>
                                    </Popconfirm>
                                  ) : (
                                    <Tooltip title='Delete'>
                                      <IconButton
                                        onClick={() => this.removeWidget(id)}
                                        aria-label='Delete'
                                        size='small'
                                        disabled={w.persist}
                                      >
                                        <Clear />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </React.Fragment>
                              )}
                              {state.fullScreenWidget === id && (
                                <Tooltip title='Exit full-screen'>
                                  <IconButton
                                    aria-label='Exit full-screen'
                                    size='small'
                                    onClick={this.onExitFullScreenClick}
                                  >
                                    <FullscreenExit />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </React.Fragment>
                          </div>
                          <Divider light />
                        </div>
                      )}
                      <div
                        className='non-dragable'
                        style={w.layoutConfig ? w.layoutConfig.style : {}}
                      >
                        <SizeContainer size='sm'>
                          <LoadableComponent
                            {...widgetProps}
                            {...w.restProps}
                          />
                        </SizeContainer>
                      </div>
                    </Paper>
                  </div>
                )
              })}
            </ResponsiveGridLayout>
          </div>
        )}
        {!state.fullScreenWidget && (
          <React.Fragment>
            {/* <div className={classes.fabContainer}>
              <Slide
                direction='up'
                in={this.state.mode === 'edit'}
                mountOnEnter
              >
                <div style={{ display: 'inline-block' }}>
                  <Fab
                    color='secondary'
                    className={classes.fab}
                    style={{ marginRight: 8 }}
                    variant='extended'
                    size='small'
                    onClick={this.toggleDrawer}
                  >
                    <Settings />&nbsp;Widget Settings
                  </Fab>
                </div>
              </Slide>
              {clinicTypeFK === CLINIC_TYPE.DENTAL && (
                <Slide
                  direction='up'
                  in={this.state.mode === 'edit'}
                  mountOnEnter
                >
                  <div style={{ display: 'inline-block' }}>
                    <Fab
                      color='secondary'
                      className={classes.fab}
                      style={{ marginRight: 8 }}
                      variant='extended'
                      size='small'
                      onClick={this.togglePatientHistoryDrawer}
                    >
                      <Accessibility />&nbsp;Patient History
                    </Fab>
                  </div>
                </Slide>
              )}
            </div> */}
            <Drawer
              anchor='right'
              open={this.state.openPatientHistoryDrawer}
              onClose={this.togglePatientHistoryDrawer}
            >
              <PatientHistoryDrawer
                {...widgetProps}
                onClose={this.togglePatientHistoryDrawer}
              />
              {/* <div style={{ width: '67vw', padding: theme.spacing(2) }}>
                <h4>Patient History</h4>
                <Button />
                <SizeContainer size='sm'>
                  <PatientHistory {...widgetProps} mode='integrated' />
                </SizeContainer>
              </div> */}
            </Drawer>
            <Drawer
              anchor='right'
              open={this.state.openDraw}
              onClose={this.toggleDrawer}
            >
              <div style={{ width: 360, position: 'relative' }}>
                <h5
                  style={{
                    fontWeight: 500,
                    lineHeight: 1.3,
                    position: 'absolute',
                    top: 8,
                    left: 16,
                  }}
                >
                  Manage Widgets
                </h5>
                <SizeContainer size='sm'>
                  <CheckboxGroup
                    className={classes.fabDiv}
                    label=''
                    vertical
                    strongLabel
                    value={currentLayout.widgets}
                    valueField='id'
                    textField='name'
                    options={widgets.filter((widget) => {
                      const widgetAccessRight = Authorized.check(
                        widget.accessRight,
                      )
                      if (!widgetAccessRight) return false
                      const shouldShow =
                        widgetAccessRight &&
                        widgetAccessRight.rights !== 'hidden'

                      return shouldShow
                    })}
                    onChange={(e, s) => {
                      // console.log(e)
                      // dispatch({
                      //   type: 'consultation/updateState',
                      //   payload: {
                      //     selectedWidgets: e.target.value,
                      //   },
                      // })
                      // console.log(e.target.value, s)
                      this.updateWidget(e.target.value, s)
                    }}
                  />
                  <div
                    style={{
                      margin: theme.spacing(2),
                      marginTop: 0,
                    }}
                  >
                    <Button
                      onClick={() => {
                        this.changeLayout(this.getDefaultLayout())
                      }}
                      color='danger'
                    >
                      Reset
                    </Button>
                  </div>
                  <Divider light />
                  <div className={classes.fabDiv}>
                    <Templates {...restProps} />
                  </div>
                  <Divider light />
                  <div className={classes.fabDiv}>
                    <h5
                      style={{
                        fontWeight: 500,
                        lineHeight: 1.3,
                        position: 'absolute',
                      }}
                    >
                      Manage Layout
                    </h5>
                    <CustomInputWrapper
                      label=''
                      style={{ paddingTop: 25 }}
                      strongLabel
                      labelProps={{
                        shrink: true,
                      }}
                    >
                      <ProgressButton
                        style={{ margin: theme.spacing(1, 0) }}
                        onClick={() => {
                          onSaveLayout(this.state.currentLayout)
                        }}
                      >
                        Save as My Favourite
                      </ProgressButton>
                      <ul
                        style={{
                          listStyle: 'square',
                          paddingLeft: 16,
                          fontSize: 'smaller',
                        }}
                      >
                        <li>
                          <p>
                            Save current consultation layout as my favourite.
                          </p>
                        </li>
                        <li>
                          <p>
                            System will use favourite layout for new
                            consultation.
                          </p>
                        </li>
                      </ul>
                    </CustomInputWrapper>
                  </div>
                </SizeContainer>
              </div>
            </Drawer>
          </React.Fragment>
        )}
      </div>
    )
  }
}

export default Layout
