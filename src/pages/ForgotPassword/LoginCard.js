import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { connect } from 'dva'
import { FastField, withFormik } from 'formik'
import * as Yup from 'yup'
import { formatMessage, FormattedMessage } from 'umi/locale'
// material ui
import { withStyles } from '@material-ui/core'
import LockOpen from '@material-ui/icons/LockOpen'
import {
  Button,
  GridContainer,
  GridItem,
  TextField,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Danger,
  Transition,
  ProgressButton,
} from '@/components'

import loginPageStyle from '../../assets/jss/material-dashboard-pro-react/views/loginPageStyle'

const styles = (theme) => ({
  ...loginPageStyle(theme),
  cardTitle: {
    marginTop: '0',
    minHeight: 'auto',
    fontWeight: '500',
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: '3px',
    textDecoration: 'none',
    color: 'white',
  },
  centerItem: {
    marginRight: 'auto',
    marginLeft: 'auto',
  },
  body: {
    marginBottom: '15px',
  },
})

const cardAnimationDuration = 350

const submitKey = 'login/getToken'

const LoginSchema = Yup.object().shape({
  username: Yup.string().trim().required('Please enter Username'),
  password: Yup.string().trim().required('Please enter Password'),
  clinicCode: Yup.string().trim().required('Please enter Clinic Code'),
})
@connect(({ login }) => ({ login }))
@withFormik({
  mapPropsToValues: () => {
    if (process.env.NODE_ENV === 'development')
      return {
        username: 'medisys',
        password: 'Medi$y$Innovati0n',
        clinicCode: '123456789',
      }
    return { username: '', password: '', clinicCode: '' }
  },
  handleSubmit: (values, { props }) => {
    const { username, password, clinicCode } = values
    const { handleLogin } = props

    handleLogin(username, password, clinicCode)
  },
  validationSchema: LoginSchema,
})
class LoginCard extends PureComponent {
  state = {
    cardAnimation: 'cardHidden',
  }

  componentDidMount () {
    // add a hidden class to the card and after 700 ms we delete it and the transition appears
    this.timeOutFunction = setTimeout(() => {
      this.setState({ cardAnimation: '' })
    }, cardAnimationDuration)

    // bind keyDown listener to document
    document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount () {
    clearTimeout(this.timeOutFunction)
    this.timeOutFunction = null

    // unbind keyDown listener
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = (event) => {
    const ENTER_KEY = 13
    switch (event.keyCode) {
      case ENTER_KEY:
        this.onEnterPressed()
        break
      default:
        break
    }
  }

  onEnterPressed = () => {
    const { handleSubmit } = this.props
    handleSubmit()
  }

  render () {
    const { classes, login } = this.props
    const { isInvalidLogin } = login
    const { cardAnimation } = this.state

    return (
      <div className={classnames(classes.container)}>
        <GridContainer justify='center'>
          <GridItem xs={12} sm={6} md={4}>
            <Card login className={classes[cardAnimation]}>
              <CardHeader
                className={`${classes.cardHeader} ${classes.textCenter}`}
                color='primary'
              >
                <h3 className={classes.cardTitle}>Login</h3>
                <h3>
                  <FormattedMessage id='app.login.title' />
                </h3>
              </CardHeader>

              <CardBody className={classnames(classes.body)}>
                {isInvalidLogin && (
                  <Transition show={isInvalidLogin}>
                    <div style={{ textAlign: 'center' }}>
                      <Danger>
                        <h4>
                          <FormattedMessage id='app.login.message-invalid-credentials' />
                        </h4>
                        <p>
                          <FormattedMessage id='app.login.message-invalid-credentials-info' />
                        </p>
                      </Danger>
                    </div>
                  </Transition>
                )}
                <FastField
                  name='username'
                  render={(args) => (
                    <TextField
                      {...args}
                      label={formatMessage({ id: 'app.login.username' })}
                    />
                  )}
                />
                <FastField
                  name='password'
                  render={(args) => (
                    <TextField
                      {...args}
                      type='password'
                      label={formatMessage({ id: 'app.login.password' })}
                    />
                  )}
                />
                <FastField
                  name='clinicCode'
                  render={(args) => (
                    <TextField
                      {...args}
                      label={formatMessage({ id: 'app.login.clinicCode' })}
                    />
                  )}
                />
              </CardBody>
              <CardFooter className={classnames(classes.justifyContentCenter)}>
                <GridContainer>
                  <GridItem md={12}>
                    <ProgressButton
                      submitKey={submitKey}
                      text='Enter'
                      icon={<LockOpen />}
                      block
                      color='primary'
                      onClick={this.onEnterPressed}
                    />
                  </GridItem>
                  <GridItem
                    md={12}
                    style={{ marginTop: 12, textAlign: 'right' }}
                  >
                    <a>Forgot Password</a>
                  </GridItem>
                </GridContainer>
              </CardFooter>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true, name: 'LoginCard' })(
  LoginCard,
)
