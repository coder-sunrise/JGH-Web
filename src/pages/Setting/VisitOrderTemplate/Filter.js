import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import Add from '@material-ui/icons/Add'
import { status } from '@/utils/codes'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Button,
  TextField,
  Select,
  CodeSelect,
  ProgressButton,
  LocalSearchSelect,
  Popper,
  CommonModal,
} from '@/components'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'
import {
  withStyles,
  MenuList,
  ClickAwayListener,
  MenuItem,
} from '@material-ui/core'
import VisitPurposeForm from './VisitPurposeForm'

@withFormikExtend({
  mapPropsToValues: ({ settingVisitOrderTemplate }) => ({
    ...(settingVisitOrderTemplate.filter || {}),
    isActive: true,
  }),
  handleSubmit: (values, { props }) => {
    const { codeDisplayValue, isActive, copayerFK } = values
    const { dispatch } = props

    dispatch({
      type: 'settingVisitOrderTemplate/query',
      payload: {
        isActive,
        group: [
          {
            code: codeDisplayValue,
            displayValue: codeDisplayValue,
            combineCondition: 'or',
          },
        ],
        apiCriteria: {
          copayerFK: copayerFK,
        },
      },
    })
  },
})
class Filter extends PureComponent {
  state = {
    openPopper: false,
    showFromExistModal: false,
  }
  toggleModal = () => {
    const { showFromExistModal } = this.state
    this.setState({ showFromExistModal: !showFromExistModal })
  }
  handleClickPopper = i => {
    switch (i) {
      case 1:
        this.props.dispatch({
          type: 'settingVisitOrderTemplate/updateState',
          payload: {
            entity: undefined,
            isExist: false,
          },
        })
        this.props.toggleModal()
        this.setState({ openPopper: false })
        break
      case 2:
        this.setState({ openPopper: false, showFromExistModal: true })
        break
    }
  }
  render() {
    const { classes, handleSubmit } = this.props
    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs={6} md={3}>
            <FastField
              name='codeDisplayValue'
              render={args => {
                return <TextField label='Code / Display Value' {...args} />
              }}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='copayerFK'
              render={args => (
                <LocalSearchSelect
                  {...args}
                  code='ctcopayer'
                  labelField='displayValue'
                  additionalSearchField='code'
                  showOptionTitle={false}
                  renderDropdown={option => {
                    return (
                      <CopayerDropdownOption
                        option={option}
                      ></CopayerDropdownOption>
                    )
                  }}
                  maxTagCount={0}
                  label='Co-Payers'
                />
              )}
            />
          </GridItem>
          <GridItem xs={6} md={2}>
            <FastField
              name='isActive'
              render={args => {
                return <Select label='Status' options={status} {...args} />
              }}
            />
          </GridItem>
        </GridContainer>

        <GridContainer>
          <GridItem xs={6} md={3}>
            <div className={classes.filterBtn}>
              <ProgressButton
                color='primary'
                icon={<Search />}
                onClick={handleSubmit}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>
              <Popper
                open={this.state.openPopper}
                transition
                overlay={
                  <ClickAwayListener
                    onClickAway={() => {
                      this.setState({ openPopper: false })
                    }}
                  >
                    <MenuList role='menu'>
                      <MenuItem onClick={() => this.handleClickPopper(1)}>
                        Add New
                      </MenuItem>
                      <MenuItem onClick={() => this.handleClickPopper(2)}>
                        Add From Existing
                      </MenuItem>
                    </MenuList>
                  </ClickAwayListener>
                }
              >
                <Button
                  color='primary'
                  onClick={() => {
                    this.setState({ openPopper: true })
                  }}
                >
                  <Add />
                  Add New
                </Button>
              </Popper>
            </div>
          </GridItem>
        </GridContainer>

        <CommonModal
          open={this.state.showFromExistModal}
          title='Add From Existing'
          maxWidth='md'
          bodyNoPadding
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
        >
          <VisitPurposeForm
            showFromExistModalFun={this.toggleModal}
            {...this.props}
          />
        </CommonModal>
      </div>
    )
  }
}

export default Filter
