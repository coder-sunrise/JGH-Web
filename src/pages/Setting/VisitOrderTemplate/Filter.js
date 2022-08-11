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
} from '@/components'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

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
                <CodeSelect
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

              <Button
                color='primary'
                onClick={() => {
                  this.props.dispatch({
                    type: 'settingVisitOrderTemplate/updateState',
                    payload: {
                      entity: undefined,
                    },
                  })
                  this.props.toggleModal()
                }}
              >
                <Add />
                Add New
              </Button>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default Filter
