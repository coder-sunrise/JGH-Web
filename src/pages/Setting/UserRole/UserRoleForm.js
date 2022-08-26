import React from 'react'
// formik
import { withFormik } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
import { withRouter } from 'react-router'
// common component
import {
  GridContainer,
  GridItem,
  FastField,
  Select,
  CodeSelect,
} from '@/components'
// sub components
import request from '@/utils/request'
import { convertToQuery } from '@/utils/utils'

const styles = theme => ({
  verticalSpacing: {
    // marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '& > h4': {
      fontWeight: 500,
    },
  },
})
class UserRoleForm extends React.PureComponent {
  state = {
    selectedValue: undefined,
  }

  onSelect = value => {
    this.setState({ selectedValue: value })
  }

  handleClickAddNew = () => {
    const { selectedValue } = this.state
    if (selectedValue) {
      this.props.history.push(`/setting/userrole/new`, { id: selectedValue })
    }
  }

  render() {
    const { classes, footer } = this.props
    const { selectedValue } = this.state
    return (
      <div>
        <React.Fragment>
          <div className={classes.verticalSpacing}>
            <GridContainer>
              <GridItem md={4} />
              <GridItem md={4} className={classes.verticalSpacing}>
                <FastField
                  name='role'
                  render={args => (
                    <CodeSelect
                      {...args}
                      label='Existing User Group'
                      code='role'
                      orderBy={[['name'], ['asc']]}
                      onChange={this.onSelect}
                      getPopupContainer={() =>
                        document.getElementsByClassName(
                          'MuiDialog-container MuiDialog-scrollPaper',
                        )[0]
                      }
                    />
                  )}
                />
              </GridItem>
            </GridContainer>
          </div>

          <GridItem md={4} />
          {footer &&
            footer({
              confirmBtnText: 'Add New',
              onConfirm: this.handleClickAddNew,
              confirmProps: {
                disabled: !selectedValue,
              },
            })}
        </React.Fragment>
      </div>
    )
  }
}

export default withFormik({
  mapPropsToValues: () => ({}),
  handleSubmit: () => {},
})(withStyles(styles, { name: 'UserRoleForm' })(withRouter(UserRoleForm)))
