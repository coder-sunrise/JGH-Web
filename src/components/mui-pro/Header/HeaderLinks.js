/* eslint-disable guard-for-in */
import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
// dva
import { connect } from 'dva'
// antd
import { Divider } from 'antd'
import _ from 'lodash'

// @material-ui
import withStyles from '@material-ui/core/styles/withStyles'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'
import Person from '@material-ui/icons/Person'
import WifiOff from '@material-ui/icons/WifiOff'
// assets
import headerLinksStyle from 'mui-pro-jss/material-dashboard-pro-react/components/headerLinksStyle'
// common components
import moment from 'moment'
import { Badge, SizeContainer, Popper, Button, Tooltip } from '@/components'
// subcomponents
import { Notification } from '@/components/_medisys'
// utils
import { updateAPIType } from '@/utils/request'
import { navigateDirtyCheck } from '@/utils/utils'
import {
  VALUE_KEYS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '@/utils/constants'

@connect(({ user, clinicInfo, header, systemMessage }) => ({
  user,
  clinicInfo,
  header,
  systemMessage,
}))
class HeaderLinks extends React.Component {
  state = {
    openNotification: false,
    openAccount: false,
    openDomain: false,
    title: 'PROD',
  }

  async componentDidMount () {
    const { dispatch } = this.props
    const allResult = await this.featchSysMessages()

    const latestData = allResult.reduce((p, i) => {
      if (i) {
        const { data = [] } = i
        const [
          current,
        ] = data

        if (current) {
          const { createDate: currentDate } = current
          const { createDate: preDate } = p

          if (preDate && currentDate) {
            const d1 = moment(preDate)
            const d2 = moment(currentDate)
            return d1.isBefore(d2) ? current : p
          }
          if (currentDate) {
            return current
          }
        }
      }
      return p
    }, {})

    if (latestData) {
      const { isAlertAfterLogin = false, isRead = false, isActive } = latestData
      if (isAlertAfterLogin && !isRead && isActive) {
        dispatch({
          type: 'systemMessage/updateState',
          payload: {
            entity: latestData,
          },
        })

        dispatch({
          type: 'global/updateState',
          payload: {
            showSystemMessage: true,
          },
        })
      }
    }
  }

  // eslint-disable-next-line react/sort-comp
  async featchSysMessages () {
    const { dispatch } = this.props
    let payload = {
      // lgt_EffectiveEndDate: moment().formatUTC(false),
      pagesize: 3,
      typeId: 1,
      systemMessageTypeFK: 1,
      group: [
        {
          lst_EffectiveStartDate: moment().formatUTC(false),
          isAlertAfterLogin: false,
          combineCondition: 'or',
        },
      ],
      sorting: [
        { columnName: 'createDate', direction: 'desc' },
      ],
    }
    const result = await Promise.all([
      dispatch({
        type: 'systemMessage/queryList',
        payload,
      }),
      dispatch({
        type: 'systemMessage/queryList',
        payload: {
          ...payload,
          typeId: 2,
          systemMessageTypeFK: 2,
        },
      }),
    ])
    return result
  }

  handleClick = (key) => () => {
    this.setState((preState) => ({ [`open${key}`]: !preState[`open${key}`] }))
  }

  handleClose = (key, cb) => () => {
    this.setState({ [`open${key}`]: false })
    if (cb) cb()
  }

  onLogoutClick = (event) => {
    this.setState({
      openAccount: false,
    })

    navigateDirtyCheck({
      onProceed: () =>
        this.props.dispatch({
          type: 'login/logout',
        }),
    })(event)
  }

  openUserProfileForm = () => {
    const { dispatch, user } = this.props
    user.data &&
      dispatch({
        type: 'user/fetchProfileDetails',
        id: user.data.clinicianProfile.id,
      })
    dispatch({
      type: 'global/updateAppState',
      payload: {
        showUserProfile: true,
      },
    })
  }

  openChangePasswordForm = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateState',
      payload: {
        showChangePasswordModal: true,
      },
    })
  }

  updateAPIType (type) {
    updateAPIType(type)
  }

  render () {
    const {
      classes,
      rtlActive,
      user,
      clinicInfo,
      header,
      systemMessage,
    } = this.props
    const { openAccount } = this.state
    const { signalRConnected, notifications } = header

    const dropdownItem = classNames(
      classes.dropdownItem,
      classes.primaryHover,
      { [classes.dropdownItemRTL]: rtlActive },
    )
    const wrapper = classNames({
      [classes.wrapperRTL]: rtlActive,
    })
    const managerClasses = classNames({
      [classes.managerClasses]: true,
    })
    const name =
      user.data && user.data.clinicianProfile
        ? user.data.clinicianProfile.name
        : ''
    const userTitle =
      user.data && user.data.clinicianProfile
        ? user.data.clinicianProfile.title
        : ''

    const clinicShortCode = clinicInfo ? clinicInfo.clinicShortCode : ''

    return (
      <div className={wrapper}>
        <div className={managerClasses}>
          <SizeContainer size='lg'>
            <div>
              <Notification
                dispatch={this.props.dispatch}
                notifications={notifications}
                systemMessage={systemMessage}
              />
              {!signalRConnected && (
                <Tooltip title='Real-time update signal is down. Please refresh manually.'>
                  <Button justIcon color='transparent'>
                    <Badge
                      ripple
                      color='danger'
                      overlap='circle'
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      variant='dot'
                    >
                      <WifiOff />
                    </Badge>
                  </Button>
                </Tooltip>
              )}
              <Popper
                className={classNames({
                  [classes.pooperResponsive]: true,
                  [classes.pooperNav]: true,
                })}
                overlay={
                  <MenuList role='menu'>
                    <MenuItem
                      onClick={this.openUserProfileForm}
                      className={dropdownItem}
                    >
                      My Account
                    </MenuItem>
                    <MenuItem
                      onClick={this.openChangePasswordForm}
                      className={dropdownItem}
                    >
                      Change Password
                    </MenuItem>
                    <MenuItem
                      onClick={this.onLogoutClick}
                      className={dropdownItem}
                    >
                      Logout
                    </MenuItem>
                  </MenuList>
                }
              >
                <Button
                  justIcon
                  color='transparent'
                  aria-label='Person'
                  aria-haspopup='true'
                  aria-owns={openAccount ? 'menu-list' : null}
                  className={classes.buttonLink}
                >
                  <Person />
                  <span className={classes.username}>
                    {userTitle} {name}
                  </span>
                </Button>
              </Popper>
              <Divider
                type='vertical'
                style={{ background: '#999', height: '1.2rem' }}
              />
              <div className={classes.clinicShortCode}>
                <span>{clinicShortCode}</span>
              </div>
            </div>
          </SizeContainer>
        </div>
      </div>
    )
  }
}

HeaderLinks.propTypes = {
  classes: PropTypes.object.isRequired,
  rtlActive: PropTypes.bool,
}

export default withStyles(headerLinksStyle)(HeaderLinks)
