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
import { connect } from 'dva'
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
  Select,
  Field,
  FastField,
  CodeSelect,
} from '@/components'
// sub components
import { control } from '@/components/Decorator'
import Authorized from '@/utils/Authorized'
import { widgets } from '@/utils/widgets'
import { CLINIC_TYPE } from '@/utils/constants'
import { languageCategory } from '@/utils/codes'
import PatientHistoryDrawer from './PatientHistoryDrawer'
import LabTrackingDrawer from './LabTrackingDrawer'
import Templates from './Templates'
// utils
import gpLayoutCfg, { dentalLayoutCfg } from './layoutConfigs'
import { DIAGNOSIS_TYPE, VISIT_TYPE } from '@/utils/constants'

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const sizes = Object.keys(breakpoints)

const ResponsiveGridLayout = WidthProvider(Responsive)

let lastActivedWidget = null

const { Link } = Anchor
@connect(({ diagnosis }) => ({
  diagnosis,
}))
@control()
class Layout extends PureComponent {
  constructor(props) {
    super(props)
    this.container = React.createRef()
    this.layoutContainer = React.createRef()
    this.delayedResize = _.debounce(this.resize, 300)
    window.addEventListener('resize', this.delayedResize)
    this.delayedChangeLayout = _.debounce(this.changeLayout, 300)
    this.ordersRef = React.createRef()
    this.myRefs = []

    const {
      userDefaultLayout,
      clinicInfo,
      consultation,
      visitRegistration,
    } = props

    let { defaultConsultationTemplate = '[]' } = clinicInfo
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
      defaultLayout = {
        ...defaultLayout,
        widgets: defaultLayout.widgets.filter(this.fitlerItemWithAccessRight),
      }
    } else {
      // disable local setting(!localStorage.getItem('consultationLayout')) {
      defaultLayout =
        JSON.parse(localStorage.getItem('consultationLayout')) ||
        this.getDefaultLayout()
    }
    if (!defaultLayout.widgets) {
      defaultLayout = this.getDefaultLayout()
    }
    this.widgetMenu = (
      <Menu>
        {widgets
          .map(widget => {
            const widgetAccessRight = Authorized.check(widget.accessRight)
            const { rights } = widgetAccessRight || { rights: undefined }
            return { ...widget, rights }
          })
          .filter(widget => {
            if (!widget.rights) return false
            return widget.rights !== 'hidden'
          })
          .map(o => {
            const cfg = defaultLayout.lg.find(m => m.i === o.id) || {}
            // const disableByAccessRight = o.rights === 'disable'
            return (
              <Menu.Item
                key={o.id}
                disabled={cfg.static}
                onClick={e => {
                  if (e.key === this.state.replaceWidget) return false
                  const layout = _.cloneDeep(this.state.currentLayout)
                  for (let index = 0; index < sizes.length; index++) {
                    const breakpoint = sizes[index]
                    if (layout[breakpoint]) {
                      const target = layout[breakpoint].find(m => m.i === e.key)
                      let starter = layout[breakpoint].find(
                        m => m.i === this.state.replaceWidget,
                      )
                      if (target) {
                        target.i = this.state.replaceWidget
                        starter.i = e.key
                      } else {
                        starter.i = e.key
                        if (
                          layout.widgets.find(
                            m => m === this.state.replaceWidget,
                          )
                        )
                          layout.widgets = _.reject(
                            layout.widgets,
                            m => m === this.state.replaceWidget,
                          )

                        if (!layout.widgets.find(m => m === e.key)) {
                          layout.widgets.push(e.key)
                        }
                        // layout[breakpoint]=_.reject(layout[breakpoint])
                      }
                    }
                  }
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
      openLabTrackingDrawer: false,
    }
    localStorage.setItem('consultationLayout', JSON.stringify(defaultLayout))
  }

  componentDidMount() {
    this.setBannerHeight()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.delayedResize)
    $(window.mainPanel).css('overflow', 'auto')

    this.state.currentLayout.widgets.map(id => {
      const w = widgets.find(o => o.id === id)
      if (w && w.onUnmount) w.onUnmount()
    })
  }

  resize = e => {
    this.setBannerHeight()
    this.setState({
      rowHeight: this.getLayoutRowHeight(),
    })
  }

  setBannerHeight = () => {
    const banner = document.getElementById('patientBanner')
    const bannerHeight = banner ? banner.offsetHeight : 0
    this.setState({
      bannerHeight: bannerHeight,
    })
    if (bannerHeight === 0) setTimeout(this.setBannerHeight, 1000)
  }

  showWidgetManagePanel = event => {
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

  removeWidget = widgetId => {
    const { setFieldValue, values } = this.props
    const wg = widgets.find(o => o.id === widgetId)
    const { associatedProps = [], onRemove, model } = wg
    associatedProps.forEach(ap => {
      const v = values[ap]
      if (v) {
        if (Array.isArray(v)) {
          // eslint-disable-next-line no-return-assign
          setFieldValue(
            ap,
            v.map(o => ({
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
      widgets: _.reject(currentLayout.widgets, w => w === widgetId),
    }
    sizes.forEach(s => {
      layout[s] = currentLayout[s]
      if (layout[s]) {
        layout[s] = layout[s].filter(o => o.i !== widgetId)
      }
    })
    this.changeLayout(layout)
  }

  addWidget = widgetId => {
    const { currentLayout } = this.state
    const layout = _.cloneDeep(currentLayout)
    layout.widgets.push(widgetId)
    sizes.forEach(s => {
      const widget = this.pageDefaultWidgets.find(o => o.id === widgetId) || {
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
      }
    })
    this.changeLayout(layout)
  }

  promptRemoveWidgetConfirmation = key => {
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

  changeLayout = layout => {
    this.setState(
      {
        currentLayout: layout,
      },
      () => {
        localStorage.setItem('consultationLayout', JSON.stringify(layout))
      },
    )
  }

  fitlerItemWithAccessRight = itemId => {
    const w = widgets.find(m => m.id === itemId)
    if (!w) return false
    const widgetAccessRight = Authorized.check(w.accessRight)

    if (widgetAccessRight && widgetAccessRight.rights !== 'hidden') return true

    return false
  }

  getDefaultLayout = () => {
    const defaultWidgets = _.cloneDeep(this.pageDefaultWidgets)

    const r = {
      widgets: defaultWidgets
        .filter(w => this.fitlerItemWithAccessRight(w.id))
        .map(o => o.id),
    }
    sizes.forEach(s => {
      r[s] = defaultWidgets.map(o => ({
        ...o.config[s],
        i: o.id,
      }))
    })
    return r
  }

  generateConfig = id => {
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

      //   // elevation[cfg.id] = 0
      //   // this.setState({ elevation })
      // },
    }
  }

  toggleMode = () => {
    this.setState(prevState => ({
      mode: prevState.mode === 'default' ? 'edit' : 'default',
    }))
  }

  toggleDrawer = event => {
    this.setState(prevState => ({ openDraw: !prevState.openDraw }))
    const { cestemplate, dispatch } = this.props
    if (cestemplate && !cestemplate.list) {
      dispatch({
        type: 'cestemplate/query',
      })
    }
  }

  togglePatientHistoryDrawer = () => {
    this.setState(prevState => ({
      openPatientHistoryDrawer: !prevState.openPatientHistoryDrawer,
    }))
  }

  toggleLabTrackingDrawer = () => {
    this.setState(prevState => ({
      openLabTrackingDrawer: !prevState.openLabTrackingDrawer,
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

  onMouseEnter = e => {
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

  onFullScreenClick = id => () => {
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

    return ((this.props.height || window.innerHeight) - topHeight) / 6
  }

  onAnchorClick = id => {
    const parentElement = document.getElementById('main-page')
    const element = document.getElementById(id)
    try {
      if (parentElement && element) {
        const screenPosition = element.getBoundingClientRect()
        const { scrollTop } = parentElement
        const { top, left } = screenPosition
        parentElement.scrollTo({
          // scrolled top position + element top position - Nav header height and Patient Banner height
          top:
            scrollTop +
            top -
            (document.getElementById('patientBanner').offsetHeight + 108),
          left,
        })
      }
    } catch (error) {
      console.error({ error })
    }
  }

  setLanguageVersion = v => {
    this.props.dispatch({
      type: 'consultation/updateState',
      payload: {
        favouriteDiagnosisLanguage: v,
      },
    })
  }

  isEnableEditOrder = () => {
    const { user, visitRegistration } = this.props
    const { entity: visit = {} } = visitRegistration
    if (
      visit.visit?.visitPurposeFK === VISIT_TYPE.MC &&
      visit.visit?.doctorProfileFK !==
        user.data.clinicianProfile.doctorProfile.id
    ) {
      return false
    }
    return true
  }

  render() {
    const { state, props } = this
    const { currentLayout } = state
    const {
      classes,
      diagnosis,
      clinicSettings,
      patientBannerHeight,
      ...restProps
    } = props
    const {
      theme,
      height,
      rights,
      clinicInfo,
      visitRegistration,
      onSaveLayout = f => f,
      onSaveFavouriteDiagnosisLanguage = s => s,
    } = restProps
    const widgetProps = {
      status: 'consultation',
      rights,
      visitRegistration,
    }

    const {
      isEnableJapaneseICD10Diagnosis,
      diagnosisDataSource,
    } = clinicSettings
    const { favouriteDiagnosisLanguage } = diagnosis

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
      margin: [2, 2],
      isDraggable: !this.state.fullScreenWidget,
      draggableCancel: '.non-dragable',
      draggableHandle: '.dragable',
      isResizable: this.state.mode === 'edit',
      onBreakpointChange: (newBreakpoint, newCols) => {
        this.setState({
          breakpoint: newBreakpoint,
        })
      },
      onLayoutChange: (_currentLayout, allLayouts) => {
        if (
          !this.state.fullScreenWidget &&
          !_.isEqualWith(
            allLayouts[this.state.breakpoint],
            this.state.currentLayout[this.state.breakpoint],
            this.compareNodeLayoutChange,
          )
        ) {
          this.delayedChangeLayout(allLayouts)
        }
      },
      onWidthChange: (containerWidth, margin, cols, containerPadding) => {},
      onResizeStart: e => {
        // $(this.layoutContainer.current).addClass(classes.layoutOnDrag)
        // $(window.mainPanel).scrollTop($(window.mainPanel).scrollTop() + 5)
        const {
          scrollTop,
          scrollHeight,
          offsetHeight,
        } = this.layoutContainer.current
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
      onResizeStop: e => {
        // $(this.layoutContainer.current).removeClass(classes.layoutOnDrag)
        $(this.layoutContainer.current).removeClass(
          this.props.classes.layoutOnDrag,
        )
      },
    }

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
              top:
                headerHeight +
                (patientBannerHeight === 0
                  ? this.state.bannerHeight
                  : this.props.patientBannerHeight),
              zIndex: 1000,
              borderRadius: 0,
              marginBottom: 0,
              // backgroundColor: '#f0f8ff',
            }}
          >
            <GridContainer justify='space-between'>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {state.currentLayout.widgets.map(id => {
                    const w = widgets.find(o => o.id === id)
                    if (!w) return null
                    const onClick = () => this.onAnchorClick(w.id)
                    return (
                      <Tooltip title={w.name}>
                        <Button
                          size='sm'
                          color='primary'
                          onClick={onClick}
                          style={{ marginTop: 2, marginBottom: 2 }}
                        >
                          {w.shortName || w.name}
                        </Button>
                      </Tooltip>
                    )
                  })}
                </div>
                <div style={{ textAlign: 'right', width: 220 }}>
                  <Button size='sm' color='info' onClick={this.toggleDrawer}>
                    <Settings />
                    Widgets
                  </Button>
                  <Authorized authority='queue.consultation.widgets.patienthistory'>
                    {({ rights: patientHistoryAccessRight }) => {
                      if (patientHistoryAccessRight === 'hidden') return null
                      return (
                        <Button
                          size='sm'
                          color='info'
                          onClick={this.togglePatientHistoryDrawer}
                        >
                          <Accessibility />
                          History
                        </Button>
                      )
                    }}
                  </Authorized>
                </div>
              </div>
            </GridContainer>
          </CardContainer>
        )}
        {true && (
          <div
            ref={this.layoutContainer}
            style={{
              height: height ? this.props.height - 116 : 'auto',
              marginTop: 1,
              position: 'relative',
            }}

            // onScroll={this.delayedMainDivScroll}
          >
            <ResponsiveGridLayout {...layoutCfg}>
              {state.currentLayout.widgets.map(id => {
                const w = widgets.find(o => o.id === id)
                if (!w) return <div />
                const cfgs = state.currentLayout[state.breakpoint]
                const cfg = cfgs.find(o => o.i === id)

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
                            style={{
                              height: 30,
                              padding: '3px 0',
                              backgroundColor: '#e6e6e6',
                            }}
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
                                    trigger={['click']}
                                    currentWidgetId={id}
                                    disabled={cfg.static}
                                    onVisibleChange={visible => {
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
                            isFullScreen={state.fullScreenWidget === id}
                            isEnableEditOrder={this.isEnableEditOrder()}
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
                    options={widgets.filter(widget => {
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
                        Save Layout as My Favourite
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
                  <Divider light />
                  <div className={classes.fabDiv}>
                    <Templates {...restProps} />
                  </div>
                  <Divider light />
                  <div className={classes.fabDiv}>
                    <GridContainer
                      gutter={0}
                      style={{
                        marginTop: theme.spacing(2),
                        marginBottom: theme.spacing(1),
                      }}
                    >
                      {isEnableJapaneseICD10Diagnosis === true &&
                        diagnosisDataSource ===
                          DIAGNOSIS_TYPE['ICD10DIANOGSIS'] && (
                          <GridContainer>
                            <GridItem xs={12}>
                              <h5 style={{ fontWeight: 500, lineHeight: 1.3 }}>
                                Favourite Diagnosis Language{' '}
                              </h5>
                            </GridItem>
                            <GridItem xs={8}>
                              <Field
                                render={() => (
                                  <CodeSelect
                                    label='Diagnosis Language'
                                    labelField='name'
                                    valueField='value'
                                    value={favouriteDiagnosisLanguage}
                                    options={languageCategory}
                                    dropdownMatchSelectWidth={false}
                                    onChange={v => {
                                      this.setLanguageVersion(v)
                                    }}
                                    {...restProps}
                                  />
                                )}
                              />
                            </GridItem>
                            <GridItem
                              xs={3}
                              style={{ marginTop: 15, marginLeft: 20 }}
                            >
                              <ProgressButton
                                disabled={false}
                                onClick={() => {
                                  onSaveFavouriteDiagnosisLanguage(
                                    favouriteDiagnosisLanguage,
                                  )
                                }}
                              >
                                Save{' '}
                              </ProgressButton>
                            </GridItem>
                          </GridContainer>
                        )}
                    </GridContainer>
                  </div>
                </SizeContainer>
              </div>
            </Drawer>
            <Drawer
              anchor='right'
              open={this.state.openLabTrackingDrawer}
              onClose={this.toggleLabTrackingDrawer}
            >
              <LabTrackingDrawer
                {...widgetProps}
                patientId={
                  this.props.visitRegistration.entity
                    ? this.props.visitRegistration.entity.visit.patientProfileFK
                    : undefined
                }
                onClose={this.toggleLabTrackingDrawer}
              />
            </Drawer>
          </React.Fragment>
        )}
      </div>
    )
  }
}

export default Layout
