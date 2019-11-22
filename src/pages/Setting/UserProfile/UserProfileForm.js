import React from 'react'
import _ from 'lodash'
import * as Yup from 'yup'
import moment from 'moment'
import { connect } from 'dva'
// formik
import { FastField, Field } from 'formik'
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
  TextField,
  WarningSnackbar,
  withFormikExtend,
} from '@/components'
import {
  ChangePassword,
  LoadingWrapper,
  MobileNumberInput,
} from '@/components/_medisys'
import PrimaryClinicianChanges from './PrimaryClinicianChanges'
// utils
import { constructUserProfile } from './utils'
import * as queueServices from '@/services/queue'
import * as clinicServices from '@/services/clinicInfo'

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
@withFormikExtend({
  displayName: 'UserProfile',
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
        countryCodeFK: Yup.string().required(),
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
            userName: Yup.string()
              .matches(
                /(^[a-zA-Z][a-zA-Z0-9]+$)/,
                'Must have at least 2 letter, start with alphabet and do not contains whitespace and special characters.',
              )
              .required('Login ID is a required field'),
            password: Yup.string().required('Password is a required field'),
          }),
        })
  },
  mapPropsToValues: (props) => {
    const { settingUserProfile, currentUser } = props

    if (currentUser) {
      return {
        ...currentUser,
        effectiveDates: [
          currentUser.effectiveStartDate,
          currentUser.effectiveEndDate,
        ],
        _oldRole:
          currentUser.userProfile && currentUser.userProfile.role
            ? currentUser.userProfile.role.id
            : undefined,
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
        userProfile: {
          countryCodeFK: 1,
          ...currentSelectedUser.userProfile,
        },
        effectiveDates:
          Object.entries(currentSelectedUser).length <= 0
            ? [
                moment().formatUTC(),
                moment('2099-12-31T23:59:59').formatUTC(false),
              ]
            : [
                currentSelectedUser.effectiveStartDate,
                currentSelectedUser.effectiveEndDate,
              ],
        role: currentSelectedUser.userProfile
          ? currentSelectedUser.userProfile.role.id
          : undefined,
        _oldRole: currentSelectedUser.userProfile
          ? currentSelectedUser.userProfile.role.id
          : undefined,
      }
    }
    return {
      userProfile: {
        countryCodeFK: 1,
      },
    }
  },
  handleSubmit: (values, { props, resetForm }) => {
    const { dispatch, ctRole, currentUser, onConfirm } = props
    const { effectiveDates, role: roleFK, ...restValues } = values
    const role = ctRole.find((item) => item.id === roleFK)
    const isDoctor = roleFK === 2 || roleFK === 3
    const doctorProfile = _.isEmpty(restValues.doctorProfile)
      ? undefined
      : {
          ...restValues.doctorProfile,
          isDeleted: !isDoctor,
        }

    const userProfile = constructUserProfile(values, role)

    const payload = {
      ...restValues,
      doctorProfile,
      effectiveStartDate: values.effectiveDates[0],
      effectiveEndDate: values.effectiveDates[1],
      userProfile,
    }
    console.log({ payload })
    dispatch({
      type: 'settingUserProfile/upsert',
      payload,
    }).then((response) => {
      if (response) {
        sessionStorage.removeItem('user')
        if (currentUser) {
          dispatch({
            type: 'user/fetchCurrent',
          })
        }
        dispatch({ type: 'settingUserProfile/query' })
        dispatch({
          type: 'settingUserProfile/refreshAllRelatedCodetables',
        })
        resetForm()
        onConfirm()
      }
    })
  },
})
class UserProfileForm extends React.PureComponent {
  state = {
    isValidating: false,
    currentPrimaryRegisteredDoctorFK: undefined,
    showActiveSessionWarning: false,
    showChangePassword: false,
    showPrimaryClinicianChanges: false,
    canEditDoctorMCR: false,
  }

  toggleChangePasswordModal = () => {
    this.setState((preState) => ({
      showChangePassword: !preState.showChangePassword,
    }))
  }

  togglePrimaryClinicianChangesModal = () => {
    this.setState((preState) => ({
      showPrimaryClinicianChanges: !preState.showPrimaryClinicianChanges,
    }))
  }

  onRoleChange = (value) => {
    const { ctRole, setFieldValue } = this.props
    const role = ctRole.find((item) => item.id === value)

    this.setState({
      canEditDoctorMCR: role.name === 'Doctor' || role.name === 'Doctor Owner',
    })
  }

  promptPrimaryClinicianChanges = (currentPrimaryRegisteredDoctorFK) => {
    this.setState({
      currentPrimaryRegisteredDoctorFK,
      showPrimaryClinicianChanges: true,
    })
  }

  handleConfirmChangePrimaryClinician = (newPrimaryRegisteredDoctorFK) => {
    const { setFieldValue, handleSubmit } = this.props
    this.togglePrimaryClinicianChangesModal()
    setFieldValue('newPrimaryDoctorProfileFK', newPrimaryRegisteredDoctorFK)
    setTimeout(() => handleSubmit(), 100)
  }

  handleDeactivating = (primaryRegisteredDoctorFK, bizSessionData) => {
    const { data } = bizSessionData
    if (data.length > 0) {
      this.setState({ showActiveSessionWarning: true })
      return false
    }

    this.promptPrimaryClinicianChanges(primaryRegisteredDoctorFK)
    return true
  }

  toggleValidating = () => {
    this.setState((preState) => ({ isValidating: !preState.isValidating }))
  }

  validateBeforeSubmit = async () => {
    const { values, handleSubmit, ctRole, dispatch } = this.props
    const { _oldRole, role, id } = values

    /* skip all the validation when add new user */
    if (!id) {
      handleSubmit()
      return true
    }

    try {
      const oldRole = ctRole.find((item) => item.id === _oldRole)
      const currentSelectedRole = ctRole.find((item) => item.id === role)
      if (
        oldRole.clinicalRoleName === 'Doctor' &&
        currentSelectedRole.clinicalRoleName !== 'Doctor'
      ) {
        dispatch({
          type: 'global/updateState',
          payload: {
            openConfirm: true,
            openConfirmTitle: '',
            openConfirmText: 'Ok',
            openConfirmContent:
              'You are not allowed to change the role from doctor to non-doctor',
          },
        })
        return true
      }

      const clinicCode = localStorage.getItem('clinicCode')
      this.toggleValidating()
      const [
        clinicInfoResponse,
        bizSessionResponse,
      ] = await Promise.all([
        clinicServices.query(clinicCode),
        queueServices.getBizSession({
          IsClinicSessionClosed: false,
        }),
      ])
      this.toggleValidating()

      const { status, data: clinicInfo } = clinicInfoResponse
      const {
        status: bizResponseStatus,
        data: bizSessionData,
      } = bizSessionResponse

      if (
        parseInt(status, 10) === 200 &&
        parseInt(bizResponseStatus, 10) === 200
      ) {
        const { primaryRegisteredDoctorFK } = clinicInfo
        const { doctorProfile, effectiveDates } = values

        const today = moment()
        const effectiveEndDate = moment(effectiveDates[1])
        const deactivating = today.isSameOrAfter(effectiveEndDate)
        const isPrimaryClinician =
          currentSelectedRole.clinicalRoleName === 'Doctor'
            ? parseInt(doctorProfile.id, 10) ===
              parseInt(primaryRegisteredDoctorFK, 10)
            : false

        if (deactivating && isPrimaryClinician) {
          return this.handleDeactivating(
            primaryRegisteredDoctorFK,
            bizSessionData,
          )
        }
        handleSubmit()
      }
    } catch (error) {
      console.log({ error })
    }
    this.setState({
      isValidating: false,
    })
    return true
  }

  render () {
    const { classes, footer, values } = this.props
    const {
      currentPrimaryRegisteredDoctorFK,
      showChangePassword,
      canEditDoctorMCR,
      showPrimaryClinicianChanges,
      showActiveSessionWarning,
      isValidating,
    } = this.state
    const isEdit = values.id !== undefined
    return (
      <LoadingWrapper loading={isValidating}>
        <React.Fragment>
          {showActiveSessionWarning && (
            <div style={{ paddingTop: 5 }}>
              <WarningSnackbar
                variant='warning'
                className={classes.margin}
                message='There is an active business session and this user is a primary clinician. Please end the current session to change primary clinician'
              />
            </div>
          )}
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
                <Field
                  name='doctorProfile.doctorMCRNo'
                  render={(args) => (
                    <TextField
                      {...args}
                      label='Doctor MCR No.'
                      disabled={!canEditDoctorMCR}
                    />
                  )}
                />
              </GridItem>
              <GridItem md={2}>
                <FastField
                  name='userProfile.countryCodeFK'
                  render={(args) => (
                    <CodeSelect
                      allowClear={false}
                      label='Country Code'
                      code='ctcountrycode'
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem md={4}>
                <FastField
                  name='phoneNumber'
                  render={(args) => (
                    // <NumberInput
                    //   {...args}
                    //   label='Contact No.'
                    //   max={1000000000000000}
                    //   // maxLength={15}
                    // />
                    <MobileNumberInput {...args} />
                  )}
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
                    <DatePicker {...args} dobRestrict label='Date Of Birth' />
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
                    <CodeSelect
                      {...args}
                      label='Role'
                      code='role'
                      onChange={this.onRoleChange}
                    />
                  )}
                />
              </GridItem>
            </GridContainer>
          </GridContainer>
          <CommonModal
            title='Primary Clinician'
            open={showPrimaryClinicianChanges}
            onClose={this.togglePrimaryClinicianChangesModal}
            // onConfirm={this.togglePrimaryClinicianChangesModal}
            maxWidth='sm'
          >
            <PrimaryClinicianChanges
              primaryRegisteredDoctorFK={currentPrimaryRegisteredDoctorFK}
              onConfirmClick={this.handleConfirmChangePrimaryClinician}
            />
          </CommonModal>
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
              onConfirm: this.validateBeforeSubmit,
              confirmBtnText: 'Save',
            })}
        </React.Fragment>
      </LoadingWrapper>
    )
  }
}

export default withStyles(styles, { name: 'UserProfileForm' })(UserProfileForm)
