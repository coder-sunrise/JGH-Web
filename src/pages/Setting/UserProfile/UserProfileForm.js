import React from 'react'
import * as Yup from 'yup'
import moment from 'moment'
import { connect } from 'dva'
// formik
import { FastField, Field, withFormik } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
import Key from '@material-ui/icons/VpnKey'
// common component
import {
  Button,
  CommonModal,
  CodeSelect,
  DatePicker,
  DateRangePicker,
  GridContainer,
  GridItem,
  NumberInput,
  TextField,
} from '@/components'
import { ChangePassword } from '@/components/_medisys'
// utils
import { constructUserProfile } from './utils'

const styles = (theme) => ({
  container: {
    marginBottom: theme.spacing(2),
  },
  verticalSpacing: {
    marginTop: theme.spacing(3),
    '& > h4': {
      fontWeight: 500,
    },
    // marginBottom: theme.spacing(1),
  },
  isDoctorCheck: {
    paddingTop: `${theme.spacing(2)}px !important`,
  },
  indent: {
    paddingLeft: theme.spacing(2),
  },
})

@connect(({ settingUserProfile, user, codetable }) => ({
  settingUserProfile,
  currentUser: user.profileDetails,
  ctRole: codetable.role,
}))
@withFormik({
  enableReinitialize: true,
  validationSchema: (props) => {
    const { settingUserProfile, currentUser } = props
    const { currentSelectedUser } = settingUserProfile
    const isEdit =
      (currentSelectedUser &&
        currentSelectedUser.userProfile &&
        currentSelectedUser.userProfile.userName) ||
      (currentUser && currentUser.userProfile.userName)
    const baseValidationRule = {
      userProfile: Yup.object().shape({
        userName: Yup.string().required('Login ID is a required field'),
      }),
      name: Yup.string().required('Name is a required field'),
      phoneNumber: Yup.string().required('Contact No. is a required field'),
      userAccountNo: Yup.string().required(
        'User Account No. is a required field',
      ),
      email: Yup.string().email('Invalid email'),
      effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
      role: Yup.string().required('Role is a required field'),
      doctorProfile: Yup.object()
        .transform((value) => (value === null ? {} : value))
        .when('role', {
          is: (val) => val === '2' || val === '3',
          then: Yup.object().shape({
            doctorMCRNo: Yup.string().required(),
          }),
        }),
    }
    return isEdit
      ? Yup.object().shape(baseValidationRule)
      : Yup.object().shape({
          ...baseValidationRule,
          userProfile: Yup.object().shape({
            userName: Yup.string().required('Login ID is a required field'),
            password: Yup.string().required('Password is a required field'),
          }),
        })
  },
  mapPropsToValues: (props) => {
    const { settingUserProfile, currentUser } = props
    console.log({ settingUserProfile, currentUser })
    if (currentUser) {
      return {
        ...currentUser,
        // ...currentUser.userProfile,
        effectiveDates: [
          currentUser.effectiveStartDate,
          currentUser.effectiveEndDate,
        ],
        role:
          currentUser.userProfile && currentUser.userProfile.role
            ? currentUser.userProfile.role.id
            : undefined,
      }
    }
    if (settingUserProfile) {
      const { currentSelectedUser = {} } = settingUserProfile
      return {
        ...currentSelectedUser,
        // ...currentSelectedUser.userProfile,
        // ...currentSelectedUser.doctorProfile,
        effectiveDates:
          Object.entries(currentSelectedUser).length <= 0
            ? [
                moment(),
                moment('2099-12-31T23:59:59').formatUTC(false),
              ]
            : [
                currentSelectedUser.effectiveStartDate,
                currentSelectedUser.effectiveEndDate,
              ],
        role: currentSelectedUser.userProfile
          ? currentSelectedUser.userProfile.role.id
          : undefined,
      }
    }
    return {}
  },
  handleSubmit: (values, { props, resetForm }) => {
    const { dispatch, ctRole, onConfirm } = props
    const { effectiveDates, role: roleFK, ...restValues } = values
    const role = ctRole.find((item) => item.id === roleFK)
    const userProfile = constructUserProfile(values, role)

    const payload = {
      ...restValues,
      effectiveStartDate: values.effectiveDates[0],
      effectiveEndDate: values.effectiveDates[1],
      userProfile,
    }
    // console.log({ values, str: JSON.stringify(values) })
    dispatch({
      type: 'settingUserProfile/upsert',
      payload,
    }).then((response) => {
      if (response) {
        dispatch({ type: 'settingUserProfile/query' })
        resetForm()
        onConfirm()
      }
    })
  },
})
class UserProfileForm extends React.PureComponent {
  state = {
    showChangePassword: false,
  }

  toggleChangePasswordModal = () => {
    this.setState((preState) => ({
      showChangePassword: !preState.showChangePassword,
    }))
  }

  render () {
    const { classes, footer, handleSubmit, values } = this.props
    const { showChangePassword } = this.state
    const isEdit = values.id !== undefined
    console.log({ values })
    return (
      <React.Fragment>
        <GridContainer
          alignItems='center'
          justify='space-between'
          className={classes.container}
        >
          <GridItem md={12} className={classes.verticalSpacing}>
            <h4>Login Info</h4>
          </GridItem>
          <GridContainer className={classes.indent} alignItems='center'>
            <GridItem md={6}>
              <FastField
                name='userProfile.userName'
                render={(args) => (
                  <TextField {...args} label='Username' disabled={isEdit} />
                )}
              />
            </GridItem>
            {!isEdit ? (
              <React.Fragment>
                <GridItem md={6}>
                  <FastField
                    name='userProfile.password'
                    render={(args) => (
                      <TextField
                        {...args}
                        label='Password'
                        type='password'
                        inputProps={{
                          autoComplete: 'new-password',
                        }}
                      />
                    )}
                  />
                </GridItem>
                <GridItem md={6} />
                <GridItem md={6}>
                  <i>User must create a new password at next sign in.</i>
                </GridItem>
                <GridItem md={6} />
                <GridItem md={6}>
                  <span>Password must be</span>
                  <ul>
                    <li>8 to 18 characters long</li>
                    <li>
                      contain a mix of letters, numbers, and/or special
                      characters
                    </li>
                  </ul>
                </GridItem>
              </React.Fragment>
            ) : (
              <GridItem md={6}>
                <Button
                  color='primary'
                  onClick={this.toggleChangePasswordModal}
                >
                  <Key />Change Password
                </Button>
              </GridItem>
            )}
          </GridContainer>

          <GridItem md={12} className={classes.verticalSpacing}>
            <h4>Profile</h4>
          </GridItem>
          <GridContainer className={classes.indent}>
            <GridItem md={6}>
              <FastField
                name='name'
                render={(args) => (
                  <TextField {...args} label='Name' disabled={isEdit} />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='title'
                render={(args) => (
                  <CodeSelect
                    {...args}
                    code='ctsalutation'
                    valueField='code'
                    label='Title'
                    flexible
                    // onChange={(value) => {
                    //   console.log({ value })
                    // }}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='userAccountNo'
                render={(args) => (
                  <TextField
                    {...args}
                    label='User Account No.'
                    disabled={isEdit}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='doctorProfile.doctorMCRNo'
                render={(args) => (
                  <TextField
                    {...args}
                    label='Doctor MCR No.'
                    disabled={isEdit}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='phoneNumber'
                render={(args) => <NumberInput {...args} label='Contact No.' />}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='genderFK'
                render={(args) => (
                  <CodeSelect {...args} label='Gender' code='ctgender' />
                )}
              />
            </GridItem>

            <GridItem md={6}>
              <FastField
                name='email'
                render={(args) => <TextField {...args} label='Email' />}
              />
            </GridItem>

            <GridItem md={6}>
              <FastField
                name='designation'
                render={(args) => <TextField {...args} label='Designation' />}
              />
            </GridItem>

            <GridItem md={6}>
              <FastField
                name='dob'
                render={(args) => (
                  <DatePicker {...args} label='Date Of Birth' />
                )}
              />
            </GridItem>

            <GridItem md={6} />

            <GridItem md={12}>
              <FastField
                name='effectiveDates'
                render={(args) => (
                  <DateRangePicker
                    {...args}
                    label='Effective Start Date'
                    label2='Effective End Date'
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridItem md={12} className={classes.verticalSpacing}>
            <h4>User Role</h4>
          </GridItem>
          <GridContainer className={classes.indent}>
            <GridItem md={6}>
              <Field
                name='role'
                render={(args) => (
                  <CodeSelect {...args} label='Role' code='role' />
                )}
              />
            </GridItem>
          </GridContainer>
        </GridContainer>
        {isEdit && (
          <CommonModal
            title='Change Password'
            open={showChangePassword}
            onClose={this.toggleChangePasswordModal}
            onConfirm={this.toggleChangePasswordModal}
            maxWidth='sm'
          >
            <ChangePassword userID={values.userProfileFK} changeTargetUser />
          </CommonModal>
        )}
        {footer &&
          footer({
            onConfirm: handleSubmit,
            confirmBtnText: 'Save',
          })}
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { name: 'UserProfileForm' })(UserProfileForm)
