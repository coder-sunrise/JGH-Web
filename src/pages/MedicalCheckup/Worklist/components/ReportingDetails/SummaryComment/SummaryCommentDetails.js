import React, { PureComponent, useState, useEffect } from 'react'
import { compose } from 'redux'
import Yup from '@/utils/yup'
import { Button } from 'antd'
import { connect } from 'dva'
import _ from 'lodash'
import moment from 'moment'
import { useCodeTable } from '@/utils/hooks'
import {
  CodeSelect,
  GridContainer,
  GridItem,
  MultipleTextField,
  IconButton,
  withFormikExtend,
  FastField,
  Field,
  notification,
} from '@/components'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
import { SYSTEM_LANGUAGE } from '@/utils/constants'

const SummaryCommentDetails = props => {
  const {
    values,
    selectedLanguage,
    setFieldValue,
    dispatch,
    setValues,
    isEditEnable = true,
    medicalCheckupReportingDetails,
    handleSubmit,
    isModifyCommentEnable,
  } = props

  const [selectCategory, setSelectCategory] = useState()
  const [selectComment, setSelectComment] = useState()

  useEffect(() => {
    if (medicalCheckupReportingDetails.isNeedToClearSummaryComment) {
      clearValues()
      dispatch({
        type: 'medicalCheckupReportingDetails/updateState',
        payload: {
          isNeedToClearSummaryComment: false,
        },
      })
    }
  }, [medicalCheckupReportingDetails.isNeedToClearSummaryComment])

  const onDiscard = () => {
    if (document.activeElement) {
      document.activeElement.blur()
    }
    clearValues()
    dispatch({
      type: 'medicalCheckupReportingDetails/updateState',
      payload: { summaryCommentEntity: undefined },
    })
  }

  const clearValues = () => {
    setValues({})
    setSelectCategory(null)
    setSelectComment(null)
  }

  const onSelectComment = (val, option) => {
    setSelectComment(val)
    if (option) {
      setFieldValue(
        'originalJapaneseComment',
        `${
          hasValue(values.originalJapaneseComment)
            ? `${values.originalJapaneseComment}, `
            : ``
        }${option.japaneseDisplayValue}`,
      )
      setFieldValue(
        'japaneseComment',
        `${
          hasValue(values.japaneseComment) ? `${values.japaneseComment}, ` : ``
        }${option.japaneseDisplayValue}`,
      )
      setFieldValue(
        'originalEnglishComment',
        `${
          hasValue(values.originalEnglishComment)
            ? `${values.originalEnglishComment}, `
            : ``
        }${option.englishDisplayValue}`,
      )
      setFieldValue(
        'englishComment',
        `${
          hasValue(values.englishComment) ? `${values.englishComment}, ` : ``
        }${option.englishDisplayValue}`,
      )
    }
  }

  const getCommentOptions = () => {
    const ctsummaryComment = useCodeTable('ctsummarycomment')
    return ctsummaryComment.map(item => {
      const englishComment = item.translationData
        .find(l => l.language === SYSTEM_LANGUAGE.PRIMARYLANGUAGE)
        ?.list?.find(l => (l.key = 'displayValue'))?.value
      const japaneseComment = item.translationData
        .find(l => l.language === SYSTEM_LANGUAGE.SECOUNDLANGUAGE)
        ?.list?.find(l => (l.key = 'displayValue'))?.value
      return {
        ...item,
        englishDisplayValue: englishComment,
        japaneseDisplayValue: japaneseComment,
      }
    })
  }

  const commentOptions = getCommentOptions()

  const onSave = () => {
    const { japaneseComment, englishComment } = values
    if (
      (!hasValue(japaneseComment) || !japaneseComment.trim().length) &&
      (!hasValue(englishComment) || !englishComment.trim().length)
    ) {
      notification.warning({
        message: 'Please input comment.',
      })
      return
    }
    if (handleSubmit) handleSubmit()
  }

  const isAnyChange = !_.isEmpty(window.dirtyForms['SummaryCommentDetails'])

  const isCommentEditEnable =
    isEditEnable && (values.id || isModifyCommentEnable)
  return (
    <GridContainer>
      <GridItem
        md={12}
        container
        style={{ position: 'relative', paddingLeft: 195 }}
      >
        <CodeSelect
          style={{ position: 'absolute', top: 0, left: 6, width: 180 }}
          valueField='id'
          code='CTSummaryCommentCategory'
          label='Category'
          disabled={!isCommentEditEnable}
          value={selectCategory}
          onChange={val => {
            setSelectCategory(val)
            setSelectComment(null)
          }}
        />
        <CodeSelect
          options={commentOptions}
          valueField='id'
          label='Template'
          disabled={!isCommentEditEnable}
          labelField={
            selectedLanguage === SYSTEM_LANGUAGE.PRIMARYLANGUAGE
              ? 'englishDisplayValue'
              : 'japaneseDisplayValue'
          }
          value={selectComment}
          localFilter={item =>
            !selectCategory || item.summaryCommentCategoryFK === selectCategory
          }
          onChange={onSelectComment}
          renderDropdown={option => {
            const textField =
              selectedLanguage === SYSTEM_LANGUAGE.PRIMARYLANGUAGE
                ? 'englishDisplayValue'
                : 'japaneseDisplayValue'
            return (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {option[textField] || ''}
              </div>
            )
          }}
        />
      </GridItem>
      <GridItem md={12}>
        <Field
          name={
            selectedLanguage === SYSTEM_LANGUAGE.PRIMARYLANGUAGE
              ? 'englishComment'
              : 'japaneseComment'
          }
          render={args => (
            <MultipleTextField
              maxLength={2000}
              disabled={!isCommentEditEnable}
              autoSize={{ minRows: 4, maxRows: 4 }}
              {...args}
            />
          )}
        />
      </GridItem>
      {isCommentEditEnable && (
        <GridItem md={12} style={{ textAlign: 'right' }}>
          <Button
            size='small'
            type='danger'
            onClick={onDiscard}
            disabled={!isCommentEditEnable}
          >
            Discard
          </Button>
          <Button
            size='small'
            type='primary'
            style={{ marginLeft: 10 }}
            disabled={!isAnyChange}
            onClick={onSave}
          >
            Save
          </Button>
        </GridItem>
      )}
    </GridContainer>
  )
}
export default compose(
  connect(({ medicalCheckupReportingDetails, user }) => ({
    medicalCheckupReportingDetails,
    user,
  })),
  withFormikExtend({
    mapPropsToValues: ({ medicalCheckupReportingDetails }) => {
      return medicalCheckupReportingDetails.summaryCommentEntity || {}
    },
    validationSchema: Yup.object().shape({
      //comment: Yup.string().required(),
    }),
    handleSubmit: (values, { props, resetForm, setValues }) => {
      const {
        medicalCheckupReportingDetails,
        dispatch,
        onConfirm,
        saveComment = () => {},
        user,
      } = props
      if (
        values.originalJapaneseComment !== values.japaneseComment ||
        values.originalEnglishComment !== values.englishComment
      ) {
        values.isCustomized = true
      }
      const newValue = {
        commentDate: moment(),
        commentByUserFK: user.data.clinicianProfile.userProfile.id,
        sequence:
          medicalCheckupReportingDetails.entity.medicalCheckupSummaryComment
            .length,
        medicalCheckupWorkitemFK: medicalCheckupReportingDetails.entity.id,
        ...values,
      }
      dispatch({
        type: 'medicalCheckupReportingDetails/upsertSummaryComment',
        payload: { ...newValue },
      }).then(r => {
        if (r) {
          saveComment()
          dispatch({
            type: 'medicalCheckupReportingDetails/updateState',
            payload: {
              isNeedToClearSummaryComment: true,
              summaryCommentEntity: undefined,
            },
          })
        }
      })
    },
    enableReinitialize: true,
    displayName: 'SummaryCommentDetails',
  }),
)(SummaryCommentDetails)
