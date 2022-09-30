import React, { PureComponent } from 'react'
import _ from 'lodash'
import { formatMessage, FormattedMessage } from 'umi'
import Yup from '@/utils/yup'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  Button,
  notification,
  CodeSelect,
  LocalSearchSelect,
} from '@/components'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const styles = theme => ({})

@withFormikExtend({
  mapPropsToValues: ({ settingStatementGroup }) =>
    settingStatementGroup.entity || settingStatementGroup.default,
  validationSchema: Yup.object().shape({
    // code: Yup.string().required(),
    displayValue: Yup.string().required(),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props

    dispatch({
      type: 'settingStatementGroup/upsert',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
      },
    }).then(r => {
      if (r) {
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingStatementGroup/query',
        })
      }
    })
  },
  displayName: 'StatementGroupDetail',
})
class Detail extends PureComponent {
  render() {
    let { classes, theme, footer, values } = this.props
    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={args => {
                  return <TextField label='Code' autoFocus disabled {...args} />
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='displayValue'
                render={args => {
                  return <TextField label='Display Value' {...args} />
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='effectiveDates'
                render={args => {
                  return (
                    <DateRangePicker
                      label='Effective Start Date'
                      label2='End Date'
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='description'
                render={args => {
                  return (
                    <TextField
                      label='Description'
                      multiline
                      rowsMax={4}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='copayerFK'
                render={args => {
                  return (
                    <LocalSearchSelect
                      code='ctcopayer'
                      label='Co-Payer'
                      labelField='displayValue'
                      additionalSearchField='code'
                      showOptionTitle={false}
                      renderDropdown={option => {
                        return <CopayerDropdownOption option={option} />
                      }}
                      getPopupContainer={node => document.body}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
        </div>
        {footer &&
          footer({
            onConfirm: this.props.handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: false,
            },
          })}
      </React.Fragment>
    )
  }
}

export default Detail
