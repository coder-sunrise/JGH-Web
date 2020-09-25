import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  dateFormatLong,
  CodeSelect,
  NumberInput,
} from '@/components'

const styles = (theme) => ({})

@withFormikExtend({
  mapPropsToValues: ({ settingMedicationConsumptionMethod }) => {
    let settings = settingMedicationConsumptionMethod.entity || settingMedicationConsumptionMethod.default
    if (settings && settings.translationLink && settings.translationLink.translationMasters) {
      settings.translationLink.translationMasters = settings.translationLink.translationMasters.map((o) => {
        return { ...o, tempLanguageFK: o.languageFK, originalLanguageFK: o.languageFK, originalDisplayValue: o.displayValue }
      })
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
          displayValue: Yup.string().when('tempLanguageFK', {
            is: (v) => v !== undefined,
            then: Yup.string().required(),
          }),
          languageFK: Yup.number().when('displayValue', {
            is: (v) => v !== undefined && v !== null && v.trim() !== '',
            then: Yup.number().required(),
          }),
        }),
      ),
    }),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    const { translationLink } = restValues
    // if translate language has been removed, then just update the IsDeleted to True
    if (translationLink && translationLink.translationMasters && translationLink.translationMasters.length > 0) {
      if (!translationLink.translationMasters[0].languageFK) {
        if (translationLink.id) {
          translationLink.translationMasters[0].isDeleted = true
          translationLink.translationMasters[0].languageFK = translationLink.translationMasters[0].originalLanguageFK
          translationLink.translationMasters[0].displayValue = translationLink.translationMasters[0].originalDisplayValue
          translationLink.isDeleted = true
        }
        else {
          restValues.translationLink = undefined
        }
      }
    }
    dispatch({
      type: 'settingMedicationConsumptionMethod/upsert',
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
          type: 'settingMedicationConsumptionMethod/query',
        })
      }
    })
  },
  displayName: 'MedicationConsumptionMethodDetail',
})
class Detail extends PureComponent {
  state = {}

  render () {
    const { props } = this
    const {
      theme,
      footer,
      settingMedicationConsumptionMethod,
      setFieldValue,
    } = props
    // console.log('detail', props)
    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={(args) => (
                  <TextField
                    label='Code'
                    autoFocus
                    {...args}
                    disabled={!!settingMedicationConsumptionMethod.entity}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='displayValue'
                render={(args) => <TextField label='Display Value' {...args} />}
              />
            </GridItem>

            <GridItem md={6}>
              <FastField
                name='effectiveDates'
                render={(args) => {
                  return (
                    <DateRangePicker
                      format={dateFormatLong}
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
                name='sortOrder'
                render={(args) => <NumberInput label='Sort Order' {...args} />}
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
            <GridItem md={4}>
              <FastField
                name='translationLink.translationMasters[0].languageFK'
                render={(args) => {
                  return (
                    <CodeSelect
                      label='Translation Language'
                      code='ctLanguage'
                      onChange={(value) => {
                        setFieldValue(
                          `translationLink.translationMasters[0].tempLanguageFK`,
                          value,
                        )
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={8}>
              <FastField
                name='translationLink.translationMasters[0].displayValue'
                render={(args) => {
                  return (
                    <TextField label='Translated Display Value' {...args} />
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
