import React from 'react'
import * as Yup from 'yup'
// dva
import { connect } from 'dva'
// formik
import { withFormik, FastField } from 'formik'
// common components
import { TextField, GridContainer, GridItem, notification } from '@/components'
// services
import { changeCurrentUserPassword, changeUserPassword } from '@/services/user'

@connect(({ user }) => ({ currentUser: user.data }))
@withFormik({
  validationSchema: Yup.object().shape({
    currentPassword: Yup.string().required(
      'Current Password is a required field',
    ),
    newPassword: Yup.string().required('Current Password is a required field'),
    confirmPassword: Yup.string()
      .oneOf(
        [
          Yup.ref('newPassword'),
          null,
        ],
        "Passwords don't match",
      )
      .required('Current Password is a required field'),
  }),
  mapPropsToValues: () => ({}),
  handleSubmit: async (values, { props }) => {
    const { onConfirm, userID, currentUser } = props
    const payload = {
      userID,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }
    const isCurrentLogin = userID === currentUser.id
    let response
    if (isCurrentLogin) response = await changeCurrentUserPassword(payload)
    else response = await changeUserPassword(payload)

    const { data } = response
    if (data.succeeded) {
      notification.success({
        message: 'Change password success.',
      })
      onConfirm()
    } else {
      notification.error({
        message: 'Failed to change password.',
      })
    }
  },
})
class ChangePassword extends React.Component {
  render () {
    const { footer, handleSubmit } = this.props
    return (
      <React.Fragment>
        <GridContainer>
          <GridItem md={12}>
            <FastField
              name='currentPassword'
              render={(args) => (
                <TextField {...args} label='Current Password' type='password' />
              )}
            />
          </GridItem>
          <GridItem md={12}>
            <FastField
              name='newPassword'
              render={(args) => (
                <TextField {...args} label='New Password' type='password' />
              )}
            />
          </GridItem>
          <GridItem md={12}>
            <FastField
              name='confirmPassword'
              render={(args) => (
                <TextField {...args} label='Confirm Password' type='password' />
              )}
            />
          </GridItem>
        </GridContainer>
        {footer &&
          footer({
            onConfirm: handleSubmit,
          })}
      </React.Fragment>
    )
  }
}

export default ChangePassword
