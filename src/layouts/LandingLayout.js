import React from 'react'
import NProgress from 'nprogress'
import moment from 'moment'

import DocumentTitle from 'react-document-title'
// material ui
import { withStyles } from '@material-ui/core'
// umi
import { history } from 'umi'
// common component
import { SizeContainer } from '@/components'
// medisys
import { LoginNavbar } from '@/components/_medisys'
// Import static files
import authStyle from '@/assets/jss/material-dashboard-pro-react/layouts/authStyle'
// import loginBackground from '@/assets/img/login.jpeg'
import loginBackground from '@/assets/img/login_background.jpg'
import defaultSettings from '@/defaultSettings'

// console.log(moment.locale())
moment.locale('en') // TODO should be removed in furture, solve deafult display chinese date bug
// console.log(moment.locale())
const styles = theme => ({
  ...authStyle(theme),
})

class LandingLayout extends React.Component {
  componentWillMount() {
    const token = localStorage.getItem('token')
    if (token !== null) {
      history.push('/')
    }
  }

  getBgImage = () => {
    return loginBackground
  }

  render() {
    NProgress.done()
    const { children, classes } = this.props
    return (
      <DocumentTitle title={defaultSettings.appTitle}>
        <div className={classes.wrapper}>
          <SizeContainer size='lg'>
            <React.Fragment>
              {/* <LoginNavbar {...this.props} /> */}
              <div className={classes.content}>
                <div
                  className={classes.fullPage}
                  style={{ backgroundImage: `url(${this.getBgImage()})` }}
                >
                  {children}
                </div>
              </div>
            </React.Fragment>
          </SizeContainer>
        </div>
      </DocumentTitle>
    )
  }
}

export default withStyles(styles)(LandingLayout)
