import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi/locale'
import { Search, Add } from '@material-ui/icons'
import { status } from '@/utils/codes'
import Authorized from '@/utils/Authorized'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Button,
  TextField,
  Select,
  ProgressButton,
  CodeSelect,
  Field,
} from '@/components'

@withFormikExtend({
  authority: 'finance/scheme',
  mapPropsToValues: ({ settingCompany }) => settingCompany.filter || {},
  handleSubmit: () => {},
  displayName: 'CompanyFilter',
})
class Filter extends PureComponent {
  state = {
    isCopayer: undefined,
  }

  checkIsCopayer (name) {
    this.setState({
      isCopayer: name === 'copayer',
    })
  }

  render () {
    const { classes, route, settingCompany } = this.props
    const { name } = route
    const { companyType } = settingCompany
    this.checkIsCopayer(name)
    const { isCopayer } = this.state

    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs={6} md={3}>
            <Field
              name='codeDisplayValue'
              render={(args) => {
                return (
                  <TextField
                    label={
                      isCopayer ? 'Co-Payer Code/Name' : 'Supplier Code/Name'
                    }
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={isCopayer ? 6 : 0} md={isCopayer ? 3 : 0}>
            {isCopayer ? (
              <FastField
                name='coPayerTypeFK'
                render={(args) => {
                  return (
                    <CodeSelect
                      label='Co-Payer Type'
                      code='ctCopayerType'
                      {...args}
                    />
                  )
                }}
              />
            ) : (
              []
            )}
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='isActive'
              render={(args) => {
                return <Select label='Status' options={status} {...args} />
              }}
            />
          </GridItem>
          <GridContainer>
            <GridItem xs={6} md={3}>
              <div className={classes.filterBtn}>
                <ProgressButton
                  color='primary'
                  icon={<Search />}
                  onClick={() => {
                    const {
                      codeDisplayValue,
                      isActive,
                      coPayerTypeFK,
                    } = this.props.values
                    this.props.dispatch({
                      type: 'settingCompany/query',
                      payload: {
                        // companyType,
                        coPayerTypeFK,
                        isActive,
                        group: [
                          {
                            code: codeDisplayValue,
                            displayValue: codeDisplayValue,
                            combineCondition: 'or',
                          },
                        ],
                      },
                    })
                  }}
                >
                  <FormattedMessage id='form.search' />
                </ProgressButton>
                <Authorized authority='scheme.newscheme'>
                  <Button
                    color='primary'
                    onClick={() => {
                      this.props.dispatch({
                        type: 'settingCompany/updateState',
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
                </Authorized>
              </div>
            </GridItem>
          </GridContainer>
        </GridContainer>
      </div>
    )
  }
}

export default Filter
