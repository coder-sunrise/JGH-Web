import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import Add from '@material-ui/icons/Add'
import { individualCommentGroup } from '@/utils/codes'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Button,
  TextField,
  ProgressButton,
  Select,
  CodeSelect,
} from '@/components'

@withFormikExtend({
  mapPropsToValues: ({ settingIndividualComment }) =>
    settingIndividualComment.filter || {},
  handleSubmit: () => {},
  displayName: 'IndividualCommentFilter',
})
class Filter extends PureComponent {
  render() {
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
          <GridItem xs={6} md={3}>
            <FastField
              name='examinationItemFK'
              render={args => (
                <CodeSelect
                  label='Examination'
                  code='ctexaminationitem'
                  labelField='displayValueWithCategory'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='groupNo'
              render={args => {
                return (
                  <Select
                    label='Comment Group'
                    options={individualCommentGroup}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem>
            <div className={classes.filterBtn}>
              <ProgressButton
                color='primary'
                icon={<Search />}
                onClick={() => {
                  const {
                    codeDisplayValue,
                    groupNo,
                    examinationItemFK,
                  } = this.props.values
                  const { clinicSettings, onQuery } = this.props
                  const { secondaryPrintoutLanguage = '' } = clinicSettings
                  const payload = {
                    groupNo,
                    examinationItemFK,
                    apiCriteria: {
                      Language: secondaryPrintoutLanguage,
                      Key: 'displayValue',
                      SearchValue: codeDisplayValue,
                    },
                  }
                  this.props
                    .dispatch({
                      type: 'settingIndividualComment/query',
                      payload: payload,
                    })
                    .then(() => {
                      onQuery(payload)
                    })
                }}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>

              <Button
                color='primary'
                onClick={() => {
                  this.props.dispatch({
                    type: 'settingIndividualComment/updateState',
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
