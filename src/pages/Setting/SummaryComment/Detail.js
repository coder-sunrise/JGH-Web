import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import _ from 'lodash'
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
  Select,
  CodeSelect,
} from '@/components'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

const Detail = ({
  theme,
  footer,
  settingSummaryComment,
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
                  disabled={!!settingSummaryComment.entity}
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
                  precision={0}
                  max={9999}
                  min={-9999}
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
                      label={`Display Value (${SYSTEM_LANGUAGE.SECOUNDLANGUAGE})`}
                      {...args}
                      maxLength={500}
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
          <GridItem md={12}>
            <FastField
              name='summaryCommentCategoryFK'
              render={args => (
                <CodeSelect
                  label='Category'
                  code='ctsummarycommentcategory'
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
    mapPropsToValues: ({ settingSummaryComment, clinicSettings }) => {
      let settings =
        settingSummaryComment.entity || settingSummaryComment.default
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
      summaryCommentCategoryFK: Yup.string().required(),
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
        type: 'settingSummaryComment/upsert',
        payload: {
          ...restValues,
          summaryCommentCategoryFKNavigation: null,
          translationData,
          EffectiveStartDate: '1900-01-01',
          EffectiveEndDate: '2099-12-31',
        },
      }).then(r => {
        if (r) {
          resetForm()
          if (onConfirm) onConfirm()
          dispatch({
            type: 'settingSummaryComment/query',
          })
        }
      })
    },
    displayName: 'SummaryCommentDetail',
  }),
)(Detail)
