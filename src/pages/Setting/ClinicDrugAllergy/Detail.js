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
} from '@/components'

const styles = theme => ({})

@withFormikExtend({
  mapPropsToValues: ({ settingClinicDrugAllergy }) =>
    settingClinicDrugAllergy.entity || settingClinicDrugAllergy.default,
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
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
      type: 'settingClinicDrugAllergy/upsert',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
        clinicdrugallergyStatusFK: 1,
      },
    }).then(r => {
      if (r) {
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingClinicDrugAllergy/query',
        })
      }
    })
  },
  displayName: 'ClinicDrugAllergyDetail',
})
class Detail extends PureComponent {
  render() {
    const { props } = this
    let { classes, theme, footer, values } = props
    // console.log('detail', props)
    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={args => {
                  return (
                    <TextField
                      label='Code'
                      autoFocus
                      disabled={!!values.id}
                      {...args}
                    />
                  )
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
                      // showTime
                      label='Effective Start Date'
                      label2='End Date'
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={12}>
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
          </GridContainer>
        </div>
        {footer &&
          footer({
            onConfirm: props.handleSubmit,
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
