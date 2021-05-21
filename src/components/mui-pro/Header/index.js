import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Link, { FormattedMessage } from 'umi'

// @material-ui/core components
import withStyles from '@material-ui/core/styles/withStyles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Hidden from '@material-ui/core/Hidden'

// material-ui icons
import Menu from '@material-ui/icons/Menu'
import MoreVert from '@material-ui/icons/MoreVert'
import ViewList from '@material-ui/icons/ViewList'

// core components
import Button from 'mui-pro-components/CustomButtons'

import headerStyle from 'mui-pro-jss/material-dashboard-pro-react/components/headerStyle.jsx'

import PageHeader from '@/components/PageHeader'
import MenuContext from '@/layouts/MenuContext'
import HeaderLinks from './HeaderLinks'

function Header({ isMobile, collapsed, setting, ...props }) {
  // function makeBrand () {
  //   let name
  //   props.menuData.map((prop, key) => {
  //     // console.log(prop)

  //     (prop.children || []).map((p, key) => {
  //       if (p.path === props.location.pathname) {
  //         name = p.name
  //       }
  //       return null
  //     })
  //     if (prop.path === props.location.pathname) {
  //       name = prop.name
  //     }
  //     return null
  //   })
  //   if(name){
  //     return name
  //   }
  //     return "Default Brand Name"

  // }
  const { classes, color, rtlActive } = props
  const appBarClasses = cx({
    [` ${classes[color]}`]: color,
  })
  const sidebarMinimize = `${classes.sidebarMinimize} ${cx({
    [classes.sidebarMinimizeRTL]: rtlActive,
  })}`

  // const { fixedHeader, layout } = setting
  //   if (isMobile || !fixedHeader || layout === 'topmenu') {
  //     return '100%'
  //   }
  //   const width = collapsed ? 'calc(100% - 80px)' : 'calc(100% - 256px)'

  const { children, contentWidth, wrapperClassName, top, ...restProps } = props
  return (
    <AppBar className={classes.appBar + appBarClasses}>
      <Toolbar className={classes.container}>
        <Hidden smDown implementation='css'>
          <div className={sidebarMinimize}>
            {props.miniActive ? (
              <Button
                justIcon
                size='sm'
                round
                color='white'
                onClick={props.sidebarMinimize}
              >
                <ViewList className={classes.sidebarMiniIcon} />
              </Button>
            ) : (
              <Button
                justIcon
                round
                size='sm'
                color='white'
                onClick={props.sidebarMinimize}
              >
                <MoreVert className={classes.sidebarMiniIcon} />
              </Button>
            )}
          </div>
        </Hidden>
        <div className={classes.flex}>
          {/* Here we create navbar brand, based on route name */}
          {/* <Button href="#" className={classes.title} color="transparent">
            {makeBrand()}
          </Button> */}

          <MenuContext.Consumer>
            {value => (
              <PageHeader
                wide={contentWidth === 'Fixed'}
                // home={<FormattedMessage id='menu.home' defaultMessage='Home' />}
                {...value}
                key='pageheader'
                {...restProps}
                // linkElement={Link}
                itemRender={(item, isLast) => {
                  if (isLast && sessionStorage.getItem(location.pathname)) {
                    return sessionStorage.getItem(location.pathname)
                  }
                  if (item.locale) {
                    return (
                      <FormattedMessage
                        id={item.locale}
                        defaultMessage={item.title}
                      />
                    )
                  }
                  return item.title
                }}
              />
            )}
          </MenuContext.Consumer>
        </div>
        <Hidden smDown implementation='css'>
          <HeaderLinks rtlActive={rtlActive} />
        </Hidden>
        <Hidden mdUp implementation='css'>
          <Button
            className={classes.appResponsive}
            color='transparent'
            justIcon
            aria-label='open drawer'
            onClick={props.handleDrawerToggle}
          >
            <Menu />
          </Button>
        </Hidden>
      </Toolbar>
    </AppBar>
  )
}

Header.propTypes = {
  classes: PropTypes.object.isRequired,
  color: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger']),
  rtlActive: PropTypes.bool,
}

export default withStyles(headerStyle)(Header)
