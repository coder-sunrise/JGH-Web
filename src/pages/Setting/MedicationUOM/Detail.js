import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import { useTranslation } from '@/utils/hooks'
import { compose } from 'redux'
import { getTranslationValue } from '@/utils/utils'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  NumberInput,
} from '@/components'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

const Detail = ({
  theme,
  footer,
  settingMedicationUOM,
  clinicSettings,
  handleSubmit,
  values,
  setFieldValue,
}) => {
  const {
    primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
    secondaryPrintoutLanguage = '',
  } = clinicSettings
  const isUseSecondLanguage =
    primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE ||
    secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE

  const [
    translation,
    getValue,
    setValue,
    setLanguage,
    translationData,
  ] = useTranslation(
    values.translationData || [],
    SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
  )

  const onSaveClick = async () => {
    await setFieldValue('translationData', [...translationData])
    handleSubmit()
  }

  return (
    <React.Fragment>
      <div style={{ margin: theme.spacing(1) }}>
        <GridContainer>
          <GridItem md={4}>
            <FastField
              name='code'
              render={args => (
                <TextField
                  label='Code'
                  autoFocus
                  {...args}
                  disabled={!!settingMedicationUOM.entity}
                />
              )}
            />
          </GridItem>
          <GridItem md={8}>
            <FastField
              name='displayValue'
              render={args => (
                <TextField
                  label={`Display Value${
                    isUseSecondLanguage
                      ? ` (${SYSTEM_LANGUAGE.PRIMARYLANGUAGE})`
                      : ''
                  }`}
                  {...args}
                  maxLength={200}
                  onChange={e => {
                    if (
                      getValue(SYSTEM_LANGUAGE.PRIMARYLANGUAGE).displayValue !==
                      e.target.value
                    ) {
                      setValue(
                        'displayValue',
                        e.target.value,
                        SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
                      )
                    }
                  }}
                />
              )}
            />
          </GridItem>
          <GridItem md={4}>
            <FastField
              name='sortOrder'
              render={args => <NumberInput label='Sort Order' {...args} />}
            />
          </GridItem>
          {isUseSecondLanguage && (
            <GridItem md={8}>
              <FastField
                name='secondDisplayValue'
                render={args => {
                  return (
                    <TextField
                      label={`Display Value (${SYSTEM_LANGUAGE.SECOUNDLANGUAGE})`}
                      {...args}
                      maxLength={200}
                      onChange={e => {
                        if (
                          getValue(SYSTEM_LANGUAGE.SECOUNDLANGUAGE)
                            .displayValue !== e.target.value
                        ) {
                          setValue(
                            'displayValue',
                            e.target.value,
                            SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
                          )
                        }
                      }}
                    />
                  )
                }}
              />
            </GridItem>
          )}
          <GridItem md={isUseSecondLanguage ? 12 : 8}>
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
          onConfirm: onSaveClick,
          confirmBtnText: 'Save',
          confirmProps: {
            disabled: false,
          },
        })}
    </React.Fragment>
  )
}

export default compose(
  withFormikExtend({
    enableReinitialize: true,
    mapPropsToValues: ({ settingMedicationUOM, clinicSettings }) => {
      let settings = settingMedicationUOM.entity || settingMedicationUOM.default
      const {
        primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
        secondaryPrintoutLanguage = '',
      } = clinicSettings
      if (
        primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE ||
        secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE
      ) {
        settings.secondDisplayValue = getTranslationValue(
          settings.translationData,
          SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
          'displayValue',
        )
        settings.secondLanguage = SYSTEM_LANGUAGE.SECOUNDLANGUAGE
      }

      return settings
    },
    validationSchema: Yup.object().shape({
      code: Yup.string().required(),
      displayValue: Yup.string().required(),
      effectiveDates: Yup.array()
        .of(Yup.date())
        .min(2)
        .required(),
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
      secondDisplayValue: Yup.string().when('secondLanguage', {
        is: v => v !== undefined,
        then: Yup.string().required(),
      }),
    }),
    handleSubmit: (values, { props, resetForm }) => {
      const { effectiveDates, ...restValues } = values
      const { dispatch, onConfirm, clinicSettings } = props
      const {
        primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
        secondaryPrintoutLanguage = '',
      } = clinicSettings

      let translationData = [
        {
          language: SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
          list: [
            {
              key: 'displayValue',
              value: values.displayValue,
            },
          ],
        },
      ]

      if (
        primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE ||
        secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE
      ) {
        translationData = [
          ...translationData,
          {
            language: SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
            list: [
              {
                key: 'displayValue',
                value: values.secondDisplayValue,
              },
            ],
          },
        ]
      }

      dispatch({
        type: 'settingMedicationUOM/upsert',
        payload: {
          ...restValues,
          effectiveStartDate: effectiveDates[0],
          effectiveEndDate: effectiveDates[1],
          translationData,
        },
      }).then(r => {
        if (r) {
          resetForm()
          if (onConfirm) onConfirm()
          dispatch({
            type: 'settingMedicationUOM/query',
          })
        }
      })
    },
    displayName: 'MedicationUOMDetail',
  }),
)(Detail)
