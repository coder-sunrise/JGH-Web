import React, { useState, useEffect, PureComponent } from 'react'
import Yup from '@/utils/yup'
import { useTranslation } from '@/utils/hooks'
import { compose } from 'redux'
import { getTranslationValue } from '@/utils/utils'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Field,
  TextField,
  DateRangePicker,
  NumberInput,
  Checkbox,
  dateFormatLong,
} from '@/components'
import { AttachmentWithThumbnail } from '@/components/_medisys'
import { Tooltip } from 'antd'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

const Detail = ({
  theme,
  footer,
  settingMedicineTrivia,
  clinicSettings,
  handleSubmit,
  values,
  dispatch,
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

  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    const { fileIndexFK, fileExtension, fileName } = values
    if (fileIndexFK) {
      const attach = [
        {
          thumbnailIndexFK: fileIndexFK,
          fileIndexFK: fileIndexFK,
          fileName: fileName,
          fileExtension: fileExtension,
          id: fileIndexFK,
        },
      ]
      setAttachments(attach)
      setFieldValue(attach)
      return
    }
  }, [])
  const onSaveClick = async () => {
    await setFieldValue('translationData', [...translationData])
    handleSubmit()
  }

  const updateAttachments = ({ added, deleted }) => {
    let updated = [...attachments]

    if (added) updated = [...updated, ...added]
    if (deleted)
      updated = updated.reduce((items, item) => {
        if (
          (item.fileIndexFK !== undefined && item.fileIndexFK === deleted) ||
          (item.fileIndexFK === undefined && item.id === deleted)
        )
          return [...items, { ...item, isDeleted: true }]

        return [...items, { ...item }]
      }, [])

    setAttachments(updated)
    setFieldValue('attachment', updated)
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
                  disabled={!!settingMedicineTrivia.entity}
                />
              )}
            />
          </GridItem>
          <GridItem md={8}>
            <Field
              name='isDefault'
              render={args => {
                return (
                  <Checkbox
                    style={{ position: 'relative', top: '15px' }}
                    label={
                      <Tooltip
                        title='To display in Patient Info Leaflet'
                        placement='bottomLeft'
                      >
                        <span>Set As Current Medicine Trivia</span>
                      </Tooltip>
                    }
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={12}>
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
                  maxLength={300}
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
          {isUseSecondLanguage && (
            <GridItem md={12}>
              <FastField
                name='secondDisplayValue'
                render={args => {
                  return (
                    <TextField
                      label={`Display Value (${SYSTEM_LANGUAGE.SECOUNDLANGUAGE})`}
                      {...args}
                      maxLength={300}
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
            <Field
              name='attachment'
              render={args => (
                <AttachmentWithThumbnail
                  extenstions='.png, .jpg, .jpeg'
                  fieldName='attachment'
                  label='Images'
                  isReadOnly={false}
                  allowedMultiple={false}
                  disableScanner
                  handleUpdateAttachments={updateAttachments}
                  attachments={attachments}
                  simple
                  thumbnailSize={{
                    height: 128,
                    width: 128,
                  }}
                />
              )}
            />
          </GridItem>
        </GridContainer>
      </div>
      {footer &&
        footer({
          onConfirm: () => {
            if (values.isDefault) {
              dispatch({
                type: 'global/updateAppState',
                payload: {
                  openConfirm: true,
                  openConfirmContent: `Set ${values.code} as current Medicine Trivia?`,
                  onConfirmSave: onSaveClick,
                },
              })
            } else {
              onSaveClick()
            }
          },
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
    mapPropsToValues: ({ settingMedicineTrivia, clinicSettings }) => {
      let settings =
        settingMedicineTrivia.entity || settingMedicineTrivia.default
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
      secondDisplayValue: Yup.string().when('secondLanguage', {
        is: v => v !== undefined,
        then: Yup.string().required(),
      }),
    }),
    handleSubmit: (values, { props, resetForm }) => {
      const { attachment, ...restValues } = values
      const { dispatch, onConfirm, clinicSettings } = props
      const {
        primaryPrintoutLanguage = SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
        secondaryPrintoutLanguage = '',
      } = clinicSettings

      const fileInfo = {}
      if (attachment) {
        const newAttach = attachment.filter(
          a => !a.isDeleted && a.fileIndexFK === undefined,
        )[0]

        fileInfo.fileIndexFK = newAttach?.id
        fileInfo.fileName = newAttach?.fileName
      }

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
        type: 'settingMedicineTrivia/upsert',
        payload: {
          ...restValues,
          ...fileInfo,
          EffectiveStartDate: '1900-01-01',
          EffectiveEndDate: '2099-12-31',
          translationData,
        },
      }).then(r => {
        if (r) {
          resetForm()
          if (onConfirm) onConfirm()
          dispatch({
            type: 'settingMedicineTrivia/query',
            payload: {
              sorting: [
                { columnName: 'isDefault', direction: 'desc' },
                { columnName: 'updateDate', direction: 'desc' },
              ],
            },
          })
        }
      })
    },
    displayName: 'MedicineTriviaDetail',
  }),
)(Detail)
