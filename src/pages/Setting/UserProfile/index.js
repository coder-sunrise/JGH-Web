import React from 'react'
import { connect } from 'dva'
import router from 'umi/router'
// formik
import { withFormik, FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
import Edit from '@material-ui/icons/Edit'
// devexpress react grid
import { Table } from '@devexpress/dx-react-grid-material-ui'
// common component
import {
  Button,
  CardContainer,
  CommonTableGrid,
  CommonModal,
  GridContainer,
  GridItem,
  Select,
  TextField,
  Tooltip,
} from '@/components'
// sub component
import UserProfileForm from './UserProfileForm'
import { UserProfileTableConfig } from './const'

const styles = (theme) => ({
  verticalSpacing: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
})

@connect(({ settingUserProfile }) => ({ settingUserProfile }))
@withFormik({
  mapPropsToValues: () => ({
    status: 'Active',
  }),
})
class UserProfile extends React.Component {
  state = {
    gridConfig: {
      ...UserProfileTableConfig,
      columnExtensions: [
        ...UserProfileTableConfig.columnExtensions,
        {
          columnName: 'action',
          width: 90,
          align: 'center',
          render: (row) => this.Cell(row),
        },
      ],
    },
  }

  componentDidMount = () => {
    this.props.dispatch({
      type: 'settingUserProfile/query',
      payload: {
        sorting: [
          { sortby: 'id', order: 'desc' },
        ],
      },
    })
  }

  handleActionButtonClick = (event) => {
    const { currentTarget } = event
    const { dispatch } = this.props
    dispatch({
      type: 'settingUserProfile/fetchUserProfileByID',
      id: currentTarget.id,
    })
  }

  Cell = (row) => {
    return (
      <Tooltip title='Edit User Profile' placement='bottom'>
        <Button
          justIcon
          color='primary'
          onClick={this.handleActionButtonClick}
          id={row.id}
        >
          <Edit />
        </Button>
      </Tooltip>
    )
  }

  handleSearchClick = () => {
    const { dispatch, values } = this.props
    const prefix = 'like_'
    dispatch({
      type: 'settingUserProfile/query',
      payload: {
        [`${prefix}userName`]: values.searchQuery,
        [`${prefix}name`]: values.searchQuery,
        combineCondition: 'or',
      },
    })
  }

  handleChangePassword = () => {
    this.props.dispatch({
      type: 'global/updateAppState',
      payload: {
        showChangePasswordModal: true,
      },
    })
  }

  onAddNewClick = () => {
    router.push('/setting/userprofile/new')
  }

  openModal = () => {
    this.props.dispatch({
      type: 'settingUserProfile/openModal',
    })
  }

  closeModal = () => {
    this.props.dispatch({
      type: 'settingUserProfile/closeModal',
    })
  }

  onConfirmClick = (values) => {
    const { dispatch } = this.props
    console.log({ values })
    // dispatch({
    //   type: 'settingUserProfile/upsert',
    //   payload: values,
    // })
  }

  render () {
    const { classes, settingUserProfile } = this.props
    const {
      list,
      showUserProfileModal,
      currentSelectedUser,
    } = settingUserProfile

    const userProfileList = list.reduce(
      (userProfiles, profile) => [
        ...userProfiles,
        {
          name: profile.name,
          status: profile.isActive,
          ...profile.userProfile,
        },
      ],
      [],
    )

    return (
      <CardContainer hideHeader>
        <GridContainer>
          <GridItem md={4}>
            <FastField
              name='searchQuery'
              render={(args) => (
                <TextField {...args} label='Name / Login Account' />
              )}
            />
          </GridItem>
          <GridItem md={2}>
            <FastField
              name='status'
              render={(args) => (
                <Select
                  {...args}
                  label='Status'
                  options={[
                    { name: 'Active', value: 'Active' },
                    { name: 'Inactive', value: 'Inactive' },
                  ]}
                />
              )}
            />
          </GridItem>
          <GridItem md={12} className={classes.verticalSpacing}>
            <Button color='primary' onClick={this.handleSearchClick}>
              Search
            </Button>
            <Button color='primary' onClick={this.openModal}>
              Add New
            </Button>
          </GridItem>
          <GridItem md={12}>
            <CommonTableGrid
              rows={userProfileList}
              {...this.state.gridConfig}
            />
          </GridItem>
        </GridContainer>
        <CommonModal
          title={
            Object.entries(currentSelectedUser).length === 0 ? (
              'Add User Profile'
            ) : (
              'Edit User Profile'
            )
          }
          open={showUserProfileModal}
          onClose={this.closeModal}
          onConfirm={this.onConfirmClick}
        >
          <UserProfileForm
            // selectedUser={currentSelectedUser}
            onChangePasswordClick={this.handleChangePassword}
          />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'UserProfile' })(UserProfile)
