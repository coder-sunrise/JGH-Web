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
  ProgressButton,
} from '@/components'

@withFormikExtend({
  mapPropsToValues: ({ settingClinicDrugAllergy }) => {return {...(settingClinicDrugAllergy.filter || {}),type:false}},
  handleSubmit: () => {},
  displayName: 'ClinicDrugAllergyFilter',
})
class Filter extends PureComponent {
  render() {
    const drugAllergyTypes = [
      {
        value: false,
        name: 'Drug Allergy',
        render: () => <span>Clinic</span>,
      },
      {
        value: true,
        name: 'MIMS',
        render: () => <span>Master</span>,
      },
    ]
    const { classes } = this.props
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
          <GridItem xs={6} md={2}>
            <FastField
              name='isActive'
              render={args => {
                return <Select label='Status' options={status} {...args} />
              }}
            />
          </GridItem>
          {/* user can see MIMS here
           <GridItem xs={6} md={2}>
            <FastField
              name='type'
              render={args => {
                return <Select label='Type' options={drugAllergyTypes} {...args} allowClear={false} />
              }}
            />
          </GridItem> */}
        </GridContainer>

        <GridContainer>
          <GridItem>
            <div className={classes.filterBtn}>
              <ProgressButton
                color='primary'
                icon={<Search />}
                onClick={() => {
                  const { codeDisplayValue, isActive, type } = this.props.values
                  this.props.dispatch({
                    type: 'settingClinicDrugAllergy/query',
                    payload: {
                      apiCriteria:{Type:type},
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

              <Button
                color='primary'
                onClick={() => {
                  this.props.dispatch({
                    type: 'settingClinicDrugAllergy/updateState',
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