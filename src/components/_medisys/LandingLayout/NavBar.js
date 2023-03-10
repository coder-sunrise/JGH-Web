import React, { PureComponent } from 'react'
import { NavLink } from 'react-router-dom'
import { formatMessage, FormattedMessage } from 'umi'
import {
  List,
  ListItem,
  ListItemText,
  AppBar,
  Drawer,
  Hidden,
  Toolbar,
  withStyles,
} from '@material-ui/core'
import cx from 'classnames'

// material icons
import Menu from '@material-ui/icons/Menu'
import LockOpen from '@material-ui/icons/LockOpen'
import Fingerprint from '@material-ui/icons/Fingerprint'
import PersonAdd from '@material-ui/icons/PersonAdd'

import { Button } from '@/components'

import authNavBarStyle from '@/assets/jss/material-dashboard-pro-react/components/authNavbarStyle'

const styles = theme => ({ ...authNavBarStyle(theme) })

class NavBar extends PureComponent {
  state = {
    open: false,
  }

  activeRoute = routeName => {
    // const { route } = this.props
    // return route.path === routeName
  }

  render() {
    const { classes, color } = this.props

    const { open } = this.state
    const appBarClasses = cx({
      [` ${classes[color]}`]: color,
    })

    const list = (
      <List className={classes.list}>
        {/*
          <ListItem className={classes.listItem}>
            <NavLink to='/admin/dashboard' className={classes.navLink}>
              <Dashboard className={classes.listItemIcon} />
              <ListItemText
                primary='Dashboard'
                disableTypography
                className={classes.listItemText}
              />
            </NavLink>
          </ListItem>
        */}
        <ListItem className={classes.listItem}>
          <NavLink
            to='/user/login'
            className={cx(classes.navLink, {
              [classes.navLinkActive]: this.activeRoute('/login'),
            })}
          >
            <Fingerprint className={classes.listItemIcon} />
            <ListItemText
              primary={formatMessage({ id: 'app.login.login' })}
              disableTypography
              className={classes.listItemText}
            />
          </NavLink>
        </ListItem>
        <ListItem className={classes.listItem}>
          <NavLink
            to='/user/forgotpassword'
            className={cx(classes.navLink, {
              [classes.navLinkActive]: this.activeRoute('/forgotpassword'),
            })}
          >
            <Fingerprint className={classes.listItemIcon} />
            <ListItemText
              primary='Forgot Password'
              disableTypography
              className={classes.listItemText}
            />
          </NavLink>
        </ListItem>
      </List>
    )
    return (
      <AppBar position='static' className={classes.appBar + appBarClasses}>
        <Toolbar className={classes.container}>
          <Hidden smDown>
            <div className={classes.flex}>
              <Button href='#' className={classes.title} color='transparent'>
                <FormattedMessage id='app.login.title' />
              </Button>
            </div>
          </Hidden>
          <Hidden mdUp>
            <div className={classes.flex}>
              <Button href='#' className={classes.title} color='transparent'>
                <FormattedMessage id='app.login.title' />
              </Button>
            </div>
          </Hidden>
          <Hidden smDown>{list}</Hidden>
          <Hidden mdUp>
            <Button
              className={classes.sidebarButton}
              color='transparent'
              justIcon
              aria-label='open drawer'
              onClick={this.handleDrawerToggle}
            >
              <Menu />
            </Button>
          </Hidden>
          <Hidden mdUp>
            <Hidden mdUp>
              <Drawer
                variant='temporary'
                anchor='right'
                open={open}
                classes={{
                  paper: classes.drawerPaper,
                }}
                onClose={this.handleDrawerToggle}
                ModalProps={{
                  keepMounted: true, // Better open performance on mobile.
                }}
              >
                {list}
              </Drawer>
            </Hidden>
          </Hidden>
        </Toolbar>
      </AppBar>
    )
  }
}

export default withStyles(styles, { withTheme: true })(NavBar)
