import React, { Suspense } from 'react'
import NProgress from 'nprogress'
import $ from 'jquery'
import _ from 'lodash'
import moment from 'moment'
import { headerHeight } from 'mui-pro-jss'

// import { renderWhenReady} from '@sencha/ext-react'
// import { Panel } from '@sencha/ext-modern'
import router from 'umi/router'
import CssBaseline from '@material-ui/core/CssBaseline'
import DocumentTitle from 'react-document-title'
import isEqual from 'lodash/isEqual'
import memoizeOne from 'memoize-one'
import { connect } from 'dva'
import { ContainerQuery } from 'react-container-query'
import cx from 'classnames'
import pathToRegexp from 'path-to-regexp'
import Media from 'react-media'
import { formatMessage } from 'umi/locale'
import { PATH_TO_ACCESS_NAME } from '@/utils/constants'

// import { ToastComponent } from '@syncfusion/ej2-react-notifications'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
// import {
//   primaryColor,
//   secondaryColor,
//   dangerColor,
//   roseColor,
//   grayColor,
//   fontColor,
//   hoverColor,
// } from 'mui-pro-jss'
// import Sidebar from 'mui-pro-components/Sidebar'
// import logo from '../assets/logo.svg'
import image from 'assets/img/sidebar-2.jpg'
// import logo from 'assets/img/logo-white.svg'
import logo from 'assets/img/logo/logo_blue.png'
// import logo from 'assets/img/logo/nscmh-logo-2.png'
import withStyles from '@material-ui/core/styles/withStyles'
import appStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/dashboardStyle.jsx'
import Header from 'mui-pro-components/Header'
import Footer from 'mui-pro-components/Footer'
import Loading from '@/components/PageLoading/index'
import { smallTheme, defaultTheme, largeTheme } from '@/utils/theme'
import { initStream } from '@/utils/realtime'
import { initClinicSettings } from '@/utils/config'
import Authorized, { reloadAuthorized } from '@/utils/Authorized'
import defaultSettings from '@/defaultSettings'

// import Footer from './Footer'
// import Header from './Header'
import { notification } from '@/components'
import SiderMenu from '@/components/SiderMenu'
import { getAuthority } from '@/utils/authority'
import Context from './MenuContext'
import ErrorBoundary from './ErrorBoundary'
import Exception403 from '../pages/Exception/403'
import Exception from '../components/Exception'
import GlobalModalContainer from './GlobalModalContainer'

initClinicSettings()

// setInterval(() => {
//   console.log(document.activeElement)
//   // $(document.activeElement).trigger($.Event('keyup', { which: 49 }))
// }, 2000)
const _theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  props: {
    ...defaultTheme.props,
  },
  palette: {
    ...defaultTheme.palette,
    // primary: {
    //   main: primaryColor,
    // },
    // secondary: {
    //   light: '#ff7961',
    //   main: '#f44336',
    //   dark: '#ba000d',
    //   contrastText: '#000',
    // },
  },
  overrides: {
    ...defaultTheme.overrides,
  },
})

// let ps
const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
    maxWidth: 1599,
  },
  'screen-xxl': {
    minWidth: 1600,
  },
}

const refreshTokenTimer = 10 * 60 * 1000
const sessionTimeoutTimer = 30 * 60 * 1000
// const sessionTimeoutTimer = 2500

class BasicLayout extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      mobileOpen: false,
      authorized: false,
      accessable: false,
    }
    // this.resize = this.resize.bind(this)
    this.resize = _.debounce(this.resize, 500, {
      leading: true,
    })
    const { dispatch } = this.props

    this.initUserData()
    initStream()

    let sessionTimeOutInterval = null
    this.refreshTokenInterval = null

    const resetSessionTimeOut = (e) => {
      // console.log(e)
      clearTimeout(sessionTimeOutInterval)
      const now = Date.now()
      localStorage.setItem('lastActiveTime', now)
      sessionTimeOutInterval = setInterval(() => {
        if (
          Number(localStorage.getItem('lastActiveTime')) <=
          Date.now() - sessionTimeoutTimer
        ) {
          if (localStorage.getItem('token')) {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                showSessionTimeout: true,
              },
            })
            clearInterval(sessionTimeOutInterval)
          } else {
            window.location.reload()
          }
        }
      }, sessionTimeoutTimer)
    }
    const debouncedRST = _.debounce(resetSessionTimeOut, 10000, {
      leading: true,
      trailing: false,
    })
    $(document).on('click', debouncedRST)
    $(document).on('keydown', debouncedRST)

    resetSessionTimeOut()
    this.refreshToken()
  }

  componentDidMount () {
    // console.log(getAuthority())
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  componentDidUpdate (e) {
    if (e.history.location.pathname !== e.location.pathname) {
      this.updateAuthority(e.history.location.pathname)
      if (window.mainPanel) window.mainPanel.scrollTop = 0
      if (this.state.mobileOpen) {
        this.setState({ mobileOpen: false })
      }
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize)
    clearInterval(this.refreshTokenInterval)
  }

  getContext () {
    const { location } = this.props
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap,
    }
  }

  /**
   * 获取面包屑映射
   * @param {Object} menuData 菜单配置
   */
  getBreadcrumbNameMap (menus) {
    // console.log('getBreadcrumbNameMap')
    // console.log({ menus })
    const routerMap = {}
    const flattenMenuData = (data) => {
      data.forEach((menuItem) => {
        if (menuItem.children) {
          flattenMenuData(menuItem.children)
        }
        // Reduce memory usage
        routerMap[menuItem.path] = menuItem
      })
    }
    flattenMenuData(menus)
    return routerMap
  }

  refreshToken = () => {
    clearInterval(this.refreshTokenInterval)
    this.refreshTokenInterval = setInterval(() => {
      this.props.dispatch({
        type: 'login/refreshToken',
      })
    }, refreshTokenTimer)
  }

  checkShouldProceedRender = async () => {
    const { dispatch } = this.props
    try {
      const currentSystemVersion =
        JSON.parse(localStorage.getItem('systemVersion')) || null
      const latestSystemVersion = await dispatch({
        type: 'global/getSystemVersion',
      })
      // console.log(currentSystemVersion)
      // first time open
      if (!currentSystemVersion || !latestSystemVersion['semr2-frontend'])
        return true

      const currentUIVersion = currentSystemVersion['semr2-frontend']
        .split('.')
        .map((item) => parseInt(item, 10))
      const latestUIVersion = latestSystemVersion['semr2-frontend']
        .split('.')
        .map((item) => parseInt(item, 10))

      const shouldRefresh = latestUIVersion.reduce(
        (refresh, version, index) => {
          if (version > currentUIVersion[index]) return true
          return refresh
        },
        false,
      )

      return !shouldRefresh
    } catch (error) {
      console.log({ error })
      return true
    }
  }

  updateAuthority = (pathname) => {
    console.log(pathname)
    console.log(getAuthority())

    const authority = getAuthority()
    const accessRight = authority.find(
      (a) => a.name === this.pathAccessNameMap(pathname.substring(1)),
    )
    this.setState({
      accessable: !accessRight || accessRight.rights === 'readwrite',
    })
    console.log(accessRight)
  }

  pathAccessNameMap = (pathname) => {
    const accessName = PATH_TO_ACCESS_NAME[pathname]
    return accessName || pathname
  }

  initUserData = async () => {
    const { dispatch, route: { routes, authority }, location } = this.props
    const shouldProceed = await this.checkShouldProceedRender()
    if (!shouldProceed) {
      // system version is lower than db, should do a refresh
      // reload(true) will reload the page from server, instead of cache
      window.location.reload(true)
      return
    }

    await Promise.all([
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'doctorprofile',
          filter: {
            'clinicianProfile.isActive': true,
          },
        },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'clinicianprofile',
        },
      }),
    ])

    const user = await dispatch({
      type: 'user/fetchCurrent',
    })

    this.updateAuthority(location.pathname)

    if (!user) return
    reloadAuthorized()
    await dispatch({
      type: 'codetable/fetchAllCachedCodetable',
    })

    // console.log(routes, authority)
    const menus = await dispatch({
      type: 'menu/getMenuData',
      payload: { routes, authority },
    })
    this.getBreadcrumbNameMap = memoizeOne(this.getBreadcrumbNameMap, isEqual)
    this.breadcrumbNameMap = this.getBreadcrumbNameMap(menus)
    // console.log(this.breadcrumbNameMap)

    this.matchParamsPath = memoizeOne(this.matchParamsPath, isEqual)
    this.getPageTitle = memoizeOne(this.getPageTitle)
    this.menus = menus

    this.setState({
      authorized: true,
    })
  }

  matchParamsPath = (pathname) => {
    if (!this.breadcrumbNameMap) return null
    // console.log('matchParamsPath', pathname, this.breadcrumbNameMap)
    const pathKey = Object.keys(this.breadcrumbNameMap).find((key) =>
      pathToRegexp(key).test(pathname),
    )
    return this.breadcrumbNameMap[pathKey]
  }

  getPageTitle = (pathname) => {
    const currRouterData = this.matchParamsPath(pathname)

    if (!currRouterData) {
      return defaultSettings.appTitle
    }
    const pageName = formatMessage({
      id: currRouterData.locale || currRouterData.name,
      defaultMessage: currRouterData.name,
    })
    return `${pageName} - ${defaultSettings.appTitle}`
  }

  getLayoutStyle = () => {
    const { fixSiderbar, isMobile, collapsed, layout } = this.props
    if (fixSiderbar && layout !== 'topmenu' && !isMobile) {
      return {
        paddingLeft: collapsed ? '80px' : '256px',
      }
    }
    return null
  }

  getContentStyle = () => {
    const { fixedHeader } = this.props
    return {
      margin: '24px 24px 0',
      paddingTop: fixedHeader ? 64 : 0,
    }
  }

  // handleMenuCollapse = (collapsed) => {
  //   const { dispatch } = this.props
  //   dispatch({
  //     type: 'global/changeLayoutCollapsed',
  //     payload: collapsed,
  //   })
  //   console.log('handleMenuCollapse')
  //   // $(window).trigger('resize')
  //   setTimeout(() => {
  //     this.triggerResizeEvent()
  //   }, 5000)
  // }

  resize = () => {
    if (window.innerWidth >= 960) {
      this.setState({ mobileOpen: false })
    }
    if (window.mainPanel) {
      this.props.dispatch({
        type: 'global/updateState',
        payload: {
          mainDivHeight: window.mainPanel.offsetHeight - headerHeight,
        },
      })
    }
  }

  sidebarMinimize = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: !this.props.collapsed,
    }).then(() => {
      // console.log('resize')
      setTimeout(this.triggerResizeEvent, 500)
    })
  }

  handleDrawerToggle = () => {
    this.setState((preState) => ({
      mobileOpen: !preState.mobileOpen,
    }))
  }

  triggerResizeEvent () {
    // eslint-disable-line
    const event = document.createEvent('HTMLEvents')
    event.initEvent('resize', true, false)
    window.dispatchEvent(event)
    // console.log(event)
  }

  // renderSettingDrawer = () => {
  //   // Do not render SettingDrawer in production
  //   // unless it is deployed in preview.pro.ant.design as demo
  //   if (process.env.NODE_ENV === 'production' && APP_TYPE !== 'site') {
  //     return null
  //   }
  //   return <SettingDrawer />
  // };

  renderChild = () => {
    const { children } = this.props
    const { authorized, accessable } = this.state
    if (!accessable) return <Exception type='404' />
    if (!authorized) return <Loading />
    return children
  }

  render () {
    const { classes, loading, theme, ...props } = this.props
    // console.log(props.collapsed)
    NProgress.start()
    if (!loading.global) {
      NProgress.done()
    }
    const {
      navTheme,
      layout: PropsLayout,
      children,
      location: { pathname },
      isMobile,
      menuData,
      collapsed,
    } = this.props
    // console.log(this.props)
    const isTop = PropsLayout === 'topmenu'
    // const routerConfig = this.matchParamsPath(pathname)
    // console.log('routerConfig', routerConfig)
    const mainPanel = `${classes.mainPanel} ${cx({
      [classes.mainPanelSidebarMini]: collapsed,
    })}`
    // console.log(this.props)
    // console.log(this)
    // console.log(this.state.mainDivHeight, window.mainPanel)
    return (
      <React.Fragment>
        <MuiThemeProvider theme={_theme}>
          <CssBaseline />
          <DocumentTitle title={this.getPageTitle(pathname)}>
            <ContainerQuery query={query}>
              {(params) => (
                <Context.Provider value={this.getContext()}>
                  <ErrorBoundary>
                    <div id='main-page' className={cx(params)}>
                      {!global.fullscreen && (
                        <div className={classes.wrapper}>
                          {isTop && !isMobile ? null : (
                            <SiderMenu
                              logo={logo}
                              logoText={defaultSettings.appTitle}
                              theme={navTheme}
                              // onCollapse={this.handleMenuCollapse}
                              menuData={menuData}
                              isMobile={isMobile}
                              image={image}
                              // handleDrawerToggle={this.handleDrawerToggle}
                              // open={this.state.mobileOpen}
                              open={this.state.mobileOpen}
                              color='blue'
                              bgColor='black'
                              handleDrawerToggle={this.handleDrawerToggle}
                              {...props}
                            />
                            // <Sidebar
                            //   routes={menuData}
                            //   logoText="Creative Tim"
                            //   logo={logo}
                            //   image={image}
                            //   handleDrawerToggle={this.handleDrawerToggle}
                            //   open={this.state.mobileOpen}
                            //   color="blue"
                            //   bgColor="black"
                            //   miniActive={collapsed}
                            //   {...this.props}
                            // />
                          )}
                          <div
                            id='mainPanel-root'
                            className={mainPanel}
                            ref={(node) => {
                              // this.mainPanel = node
                              window.mainPanel = node
                            }}
                          >
                            {/* <Header
            menuData={menuData}
            handleMenuCollapse={this.handleMenuCollapse}
            logo={logo}
            isMobile={isMobile}
            {...props}
          /> */}
                            {/* <Affix target={() => window.mainPanel}> */}
                            <Header
                              sidebarMinimize={this.sidebarMinimize}
                              miniActive={collapsed}
                              menuData={menuData}
                              breadcrumbNameMap={this.breadcrumbNameMap}
                              // routes={dashboardRoutes}
                              handleDrawerToggle={this.handleDrawerToggle}
                              {...props}
                            />
                            {/* </Affix> */}
                            <ErrorBoundary>
                              <div className={classes.content}>
                                <div className={classes.container}>
                                  {this.renderChild()}
                                </div>
                              </div>
                            </ErrorBoundary>
                            {/* <Footer fluid /> */}
                          </div>
                        </div>
                      )}

                      {this.state.authorized && (
                        <GlobalModalContainer {...props} />
                      )}
                    </div>
                  </ErrorBoundary>
                </Context.Provider>
              )}
            </ContainerQuery>
          </DocumentTitle>
          {/* <Suspense fallback={<PageLoading />}>{this.renderSettingDrawer()}</Suspense> */}
        </MuiThemeProvider>
      </React.Fragment>
    )
  }
}

export default withStyles(appStyle)(
  connect(({ global, setting, menu, loading }) => ({
    collapsed: global.collapsed,
    layout: setting.layout,
    menuData: menu.menuData,
    ...setting,
    loading,
  }))((props) => (
    <Media query='(max-width: 599px)'>
      {(isMobile) => <BasicLayout {...props} isMobile={isMobile} />}
    </Media>
  )),
)
