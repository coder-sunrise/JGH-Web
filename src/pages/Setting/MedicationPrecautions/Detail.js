import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import _ from 'lodash'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  NumberInput,
} from '@/components'

@withFormikExtend({
  mapPropsToValues: ({ settingMedicationPrecautions, clinicSettings, codetable }) => {
    let settings = settingMedicationPrecautions.entity || settingMedicationPrecautions.default
    if (!settings.translationLink || !(settings.translationLink.translationMasters || []).length) {
      const { secondaryPrintOutLanguage = '' } = clinicSettings
      const { ctlanguage = [] } = codetable
      const language = ctlanguage.find(l => l.code === secondaryPrintOutLanguage)
      if (language) {
        settings.translationLink = { translationMasters: [{ languageFK: language.id }] }
      }
    }
    return settings
  },
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
    sortOrder: Yup.number()
      .min(
        -2147483648,
        'The number should between -2,147,483,648 and 2,147,483,647',
      )
      .max(
        2147483647,
        'The number should between -2,147,483,648 and 2,147,483,647',
      )
      .nullable(),
    translationLink: Yup.object().shape({
      translationMasters: Yup.array().of(
        Yup.object().shape({
          displayValue: Yup.string().when('languageFK', {
            is: (v) => v !== undefined,
            then: Yup.string().required(),
          }),
        }),
      ),
    }),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    dispatch({
      type: 'settingMedicationPrecautions/upsert',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
      },
    }).then((r) => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingMedicationPrecautions/query',
        })
      }
    })
  },
  displayName: 'MedicationPrecautionsDetail',
})
class Detail extends PureComponent {
  state = {}

  render () {
    const { props } = this
    const { theme, footer, settingMedicationPrecautions, clinicSettings } = props
    const { primaryPrintoutLanguage = 'EN', secondaryPrintOutLanguage = '' } = clinicSettings
    const isUseSecondLanguage = secondaryPrintOutLanguage !== ''
    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={4}>
              <FastField
                name='code'
                render={(args) => (
                  <TextField
                    label='Code'
                    autoFocus
                    {...args}
                    disabled={!!settingMedicationPrecautions.entity}
                  />
                )}
              />
            </GridItem>
            <GridItem md={8}>
              <FastField
                name='displayValue'
                render={(args) => <TextField label={`Display Value${isUseSecondLanguage ? ` (${primaryPrintoutLanguage})` : ''}`} {...args} maxLength={200} />}
              />
            </GridItem>
            <GridItem md={4}>
              <FastField
                name='sortOrder'
                render={(args) => <NumberInput label='Sort Order' {...args} />}
              />
            </GridItem>
            {isUseSecondLanguage && (
              <GridItem md={8}>
                <FastField
                  name='translationLink.translationMasters[0].displayValue'
                  render={(args) => {
                    return (<TextField label={`Display Value (${secondaryPrintOutLanguage})`} {...args} maxLength={200} />)
                  }}
                />
              </GridItem>)}
            <GridItem md={isUseSecondLanguage ? 12 : 8}>
              <FastField
                name='effectiveDates'
                render={(args) => {
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

            <GridItem md={12}>
              <FastField
                name='description'
                render={(args) => {
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
