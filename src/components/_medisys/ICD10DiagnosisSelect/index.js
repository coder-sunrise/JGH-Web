import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import StarBorder from '@material-ui/icons/StarBorder'
import Star from '@material-ui/icons/Star'
import { Select, Tooltip, GridItem, Button, RadioGroup } from '@/components'
import { queryList } from '@/services/common'

const ICD10DiagnosisSelect = ({
  dispatch,
  theme,
  classes,
  style,
  label,
  filterStyle = { position: 'absolute', bottom: 8, right: 0 },
  clinicSettings,
  diagnosis,
  from = 'report',
  selectDiagnosisCode,
  favouriteDiagnosis,
  handelSaveDiagnosisAsFavourite,
  ...props
}) => {
  let selectProps = props
  const initMaxTagCount = props.field && props.field.value && props.field.value.length === 1 ? 1 : 0
  const [ maxTagCount, setMaxTagCount ] = useState(
    props.maxTagCount !== undefined ? props.maxTagCount : initMaxTagCount
  )
  if (props.maxTagCount === undefined && props.mode && props.mode === 'multiple') {
    selectProps = { ...props, maxTagCount }
  }

  const [ ctICD10Diagnosis, setICD10Diagnosis ] = useState([])
  const [ currentDiagnosisLanguage, setcurrentDiagnosisLanguage ] = useState(diagnosis.favouriteDiagnosisLanguage)
  const [ labelValue, setLabelValue ] = useState()

  useEffect(
    () => {
      setcurrentDiagnosisLanguage(diagnosis.favouriteDiagnosisLanguage)
      setLabelValue(diagnosis.favouriteDiagnosisLanguage === 'EN' ? 'displayvalue' : 'JpnDisplayValue')
    },
    [ diagnosis ]
  )

  const onICD10DiagnosisSearch = async (v) => {
    const search = {
      props: 'id,displayvalue,code,JpnDisplayValue',
      sorting: [ { columnName: 'displayvalue', direction: 'asc' } ],
      pagesize: 30,
    }

    let isOrderByFavourite = false
    if (from === 'Consultaion') {
      isOrderByFavourite = true
    }

    search.apiCriteria = {
      searchValue: v || undefined,
      id: typeof v === 'string' ? undefined : Number(v),
      isOrderByFavourite,
      searchByLanguage: currentDiagnosisLanguage,
    }

    const response = await queryList('/api/codetable/CTICD10AMDiagnosis', search)
    if (response && response.data) {
      setICD10Diagnosis(response.data.data)

      dispatch({
        type: 'codetable/updateState',
        payload: {
          'codetable/CTICD10AM': response.data.data,
        },
      })
    }
    return response
  }

  const onLanguageChange = (e) => {
    setcurrentDiagnosisLanguage(e.target.value)
    e.target.value === 'EN' ? setLabelValue('displayvalue') : setLabelValue('JpnDisplayValue')
  }

  const languageOptions = [ { label: ' EN ', value: 'EN' }, { label: ' JP ', value: 'JP' } ]

  return (
    <div style={{ position: 'relative' }}>
      <Select
        label={label || 'Diagnosis'}
        options={ctICD10Diagnosis}
        valueField="id"
        labelField={labelValue}
        handleFilter={(input, opt) => true}
        renderDropdown={(option) => {
          const { code } = option
          return (
            <div style={{ display: 'flex' }}>
              <div
                style={{
                  width: '100%',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {currentDiagnosisLanguage === 'EN' ? (
                  <div>{option.displayvalue}</div>
                ) : (
                  <div>{option.JpnDisplayValue}</div>
                )}
              </div>
              {from === 'Consultaion' && (
                <div style={{ marginLeft: 'auto', marginRight: -2, height: 20 }}>
                  {favouriteDiagnosis.find((d) => d === code) ? (
                    <Star
                      style={{
                        color: '#FFCC00',
                        width: 20,
                        height: 20,
                      }}
                    />
                  ) : (
                    <div style={{ width: 20 }} />
                  )}
                </div>
              )}
            </div>
          )
        }}
        query={onICD10DiagnosisSearch}
        onChange={(values, opts) => {
          if (props.maxTagCount === undefined && props.mode && props.mode === 'multiple') {
            setMaxTagCount(values && values.length === 1 ? 1 : 0)
          }
          if (props.onChange) {
            props.onChange(values, opts)
          }
        }}
        {...selectProps}
      />
      {clinicSettings.isEnableJapaneseICD10Diagnosis === true && (
        <RadioGroup
          style={{ ...filterStyle, top: 20, left: 380 }}
          options={languageOptions}
          onChange={onLanguageChange}
          value={currentDiagnosisLanguage}
        />
      )}
      {from === 'Consultaion' &&
      selectDiagnosisCode && (
        <div style={{ ...filterStyle, height: 28, top: 20, bottom: 0, right: -140 }}>
          {favouriteDiagnosis.find((d) => d === selectDiagnosisCode) ? (
            <Tooltip title="Click to remove favourite">
              <Star
                style={{
                  color: '#FFCC00',
                  width: 28,
                  height: 28,
                  cursor: 'pointer',
                }}
                onClick={handelSaveDiagnosisAsFavourite}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Click to add to favourite">
              <StarBorder
                style={{ color: 'gray', width: 28, height: 28, cursor: 'pointer' }}
                onClick={handelSaveDiagnosisAsFavourite}
              />
            </Tooltip>
          )}
        </div>
      )}
    </div>
  )
}

const Connected = connect(({ clinicSettings, diagnosis }) => ({
  clinicSettings: clinicSettings.settings,
  diagnosis,
}))(ICD10DiagnosisSelect)

export default withStyles({ withTheme: true })(Connected)
