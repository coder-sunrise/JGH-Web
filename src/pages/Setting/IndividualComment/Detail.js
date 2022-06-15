import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import _ from 'lodash'
import { useTranslation } from '@/utils/hooks'
import { compose } from 'redux'
import { individualCommentGroup } from '@/utils/codes'
import { getTranslationValue } from '@/utils/utils'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  NumberInput,
  Select,
  Checkbox,
  CodeSelect,
} from '@/components'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

const Detail = ({
  theme,
  footer,
  settingIndividualComment,
  clinicSettings,
  handleSubmit,
  values,
  codetable,
  setFieldValue,
}) => {
  const {
    primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
    secondaryPrintoutLanguage = '',
  } = clinicSettings
  const isUseSecondLanguage =
    primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
    secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
  const { ctexaminationcategory } = codetable
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
                  disabled={!!settingIndividualComment.entity}
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
                  maxLength={500}
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
              render={args => (
                <NumberInput
                  min={-9999}
                  precision={0}
                  max={9999}
                  label='Sort Order'
                  {...args}
                />
              )}
            />
          </GridItem>
          {isUseSecondLanguage && (
            <GridItem md={8}>
              <FastField
                name='secondDisplayValue'
                render={args => {
                  return (
                    <TextField
                      label={`Display Value (${SYSTEM_LANGUAGE.SECONDLANGUAGE})`}
                      {...args}
                      maxLength={500}
                      onChange={e => {
                        if (
                          getValue(SYSTEM_LANGUAGE.SECONDLANGUAGE)
                            .displayValue !== e.target.value
                        ) {
                          setValue(
                            'displayValue',
                            e.target.value,
                            SYSTEM_LANGUAGE.SECONDLANGUAGE,
                          )
                        }
                      }}
                    />
                  )
                }}
              />
            </GridItem>
          )}
          <GridItem md={4}>
            <FastField
              name='groupNo'
              render={args => (
                <Select
                  label='Comment Group'
                  options={individualCommentGroup}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={8}>
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
          <GridItem md={4} style={{ marginTop: 20 }}>
            <FastField
              name='showSeparaterInBelow'
              render={args => (
                <Checkbox
                  simple
                  label='Show separater in below when reporting'
                  {...args}
                />
              )}
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
    mapPropsToValues: ({ settingIndividualComment, clinicSettings }) => {
      let settings =
        settingIndividualComment.entity || settingIndividualComment.default
      const {
        primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
        secondaryPrintoutLanguage = '',
      } = clinicSettings
      if (
        primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
        secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
      ) {
        settings.secondDisplayValue = getTranslationValue(
          settings.translationData,
          SYSTEM_LANGUAGE.SECONDLANGUAGE,
          'displayValue',
        )
        settings.secondLanguage = SYSTEM_LANGUAGE.SECONDLANGUAGE
      }
      return settings
    },
    validationSchema: Yup.object().shape({
      code: Yup.string().required(),
      displayValue: Yup.string().required(),
      groupNo: Yup.number().required(),
      examinationItemFK: Yup.string().required(),
      sortOrder: Yup.number()
        .min(-9999, 'The number should between -9999 and 9999')
        .max(9999, 'The number should between -9999 and 9999')
        .nullable(),
      secondDisplayValue: Yup.string().when('secondLanguage', {
        is: v => v !== undefined,
        then: Yup.string().required(),
      }),
    }),
    handleSubmit: (values, { props, resetForm }) => {
      const { ...restValues } = values
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
        primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE ||
        secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECONDLANGUAGE
      ) {
        translationData = [
          ...translationData,
          {
            language: SYSTEM_LANGUAGE.SECONDLANGUAGE,
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
        type: 'settingIndividualComment/upsert',
        payload: {
          ...restValues,
          examinationItemFKNavigation: null,
          translationData,
          EffectiveStartDate: '1900-01-01',
          EffectiveEndDate: '2099-12-31',
        },
      }).then(r => {
        if (r) {
          resetForm()
          if (onConfirm) onConfirm()
        }
      })
    },
    displayName: 'IndividualCommentDetail',
  }),
)(Detail)
