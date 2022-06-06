import React, { useState, useEffect, useContext } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { FastField, Field } from 'formik'
import { compose } from 'redux'
import { List, Button } from 'antd'
import { PlusCircleOutlined } from '@ant-design/icons'
import { formatMessage } from 'umi'
import { connect } from 'dva'
import {
  GridContainer,
  GridItem,
  Transfer,
  CodeSelect,
  NumberInput,
} from '@/components'
import DetailsContext from './DetailsContext'
import { SectionHeader, SelectList, AutoCalculateDosage } from '../Components'

const styles = () => ({})

const Setting = ({ classes, showTransfer, dispatch, global, ...props }) => {
  const { medicationDetail, theme, values, setFieldValue } = props
  const {
    medicationSideEffects,
    medicationGroups,
    medicationIngredients,
    medicationPrecautions,
    medicationContraindications,
    medicationInteractions,
  } = values
  const optionLabelLength = 40
  const { isMultiLanguage, languageLabel, currentLanguage } = useContext(
    DetailsContext,
  )

  return (
    <div
      hideHeader
      style={{
        margin: theme.spacing(1),
      }}
    >
      <AutoCalculateDosage
        languageLabel={languageLabel}
        {...props}
      ></AutoCalculateDosage>
      <GridContainer>
        <GridItem md={6}>
          <Field
            name='medicationGroups'
            render={args => (
              <SelectList
                header='Group'
                codeset='ctMedicationGroup'
                isMultiLanguage={false}
                initialValue={medicationGroups}
                labelField='name'
                label='#'
                onChange={value =>
                  setFieldValue(
                    'medicationGroups',
                    value.map(v => v),
                  )
                }
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <Field
            name='medicationIngredients'
            render={args => (
              <SelectList
                header={'Ingredient'}
                codeset='ctMedicationIngredient'
                isMultiLanguage={false}
                label='#'
                labelField='name'
                isShowFreeText
                initialValue={medicationIngredients}
                onChange={value =>
                  setFieldValue(
                    'medicationIngredients',
                    value.map(v => v),
                  )
                }
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <Field
            name='medicationPrecautions'
            render={args => (
              <SelectList
                header={'Precaution' + languageLabel}
                codeset='ctMedicationPrecaution'
                language={currentLanguage}
                isMultiLanguage={isMultiLanguage}
                initialValue={medicationPrecautions}
                note='* ONLY THE TOP 3 PRECAUTIONS WILL BE DISPLAYED IN DRUG LABEL'
                label='#'
                onChange={value =>
                  setFieldValue(
                    'medicationPrecautions',
                    value.map(v => v),
                  )
                }
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <Field
            name='medicationSideEffects'
            render={args => (
              <SelectList
                header={'Side Effect' + languageLabel}
                codeset='ctMedicationSideEffect'
                language={currentLanguage}
                isMultiLanguage={isMultiLanguage}
                label='#'
                initialValue={medicationSideEffects}
                onChange={value =>
                  setFieldValue(
                    'medicationSideEffects',
                    value.map(v => v),
                  )
                }
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <Field
            name='medicationContraindications'
            render={args => (
              <SelectList
                header={'Contraindication' + languageLabel}
                codeset='ctMedicationContraIndication'
                language={currentLanguage}
                isMultiLanguage={isMultiLanguage}
                label='#'
                initialValue={medicationContraindications}
                onChange={value =>
                  setFieldValue(
                    'medicationContraindications',
                    value.map(v => v),
                  )
                }
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem md={6}>
          <Field
            name='medicationInteractions'
            render={args => (
              <SelectList
                header={'Interaction' + languageLabel}
                codeset='ctMedicationInteraction'
                language={currentLanguage}
                isMultiLanguage={isMultiLanguage}
                label='#'
                initialValue={medicationInteractions}
                onChange={value =>
                  setFieldValue(
                    'medicationInteractions',
                    value.map(v => v),
                  )
                }
                {...args}
              />
            )}
          />
        </GridItem>
      </GridContainer>
    </div>
  )
}

const ConnectedSetting = connect(({ global, codetable }) => ({
  global,
  codetable,
}))(Setting)

export default compose(
  withStyles(styles, { withTheme: true }),
  React.memo,
)(ConnectedSetting)
