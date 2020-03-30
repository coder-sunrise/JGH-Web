import React, { useState, useEffect } from 'react'
import { withStyles } from '@material-ui/core'
import _ from 'lodash'
import AttachMoney from '@material-ui/icons/AttachMoney'
import FilterList from '@material-ui/icons/FilterList'
import { Select, ButtonSelect } from '@/components'
import { queryList } from '@/services/common'

const styles = (theme) => ({
  money: {
    width: 16,
    height: 16,
    top: 3,
    position: 'relative',
    color: 'green',
  },
})

const filterOptions = [
  {
    value: 'isChasChronicClaimable',
    name: 'CHAS Chronic',
  },
  {
    value: 'isChasAcuteClaimable',
    name: 'CHAS Acute',
  },
  {
    value: 'isHazeClaimable',
    name: 'Haze',
  },
]

const initMaxTagCount = 4

const DiagnosisSelect = ({
  theme,
  classes,
  style,
  label,
  onDataSouceChange,
  filterStyle = { position: 'absolute', bottom: 8, right: 0 },
  ...props
}) => {
  let selectProps = props
  const [
    maxTagCount,
  ] = useState(
    props.maxTagCount !== undefined ? props.maxTagCount : initMaxTagCount,
  )
  if (
    props.maxTagCount === undefined &&
    props.mode &&
    props.mode === 'multiple'
  ) {
    selectProps = { ...props, maxTagCount }
  }

  const [
    ctDiagnosis,
    setCtDiagnosis,
  ] = useState([])

  const [
    diagnosisFilter,
    setDiagnosisFilter,
  ] = useState(filterOptions.map((o) => o.value))

  const onDiagnosisSearch = async (v) => {
    const search = {
      props:
        'id,displayvalue,code,complication,isChasAcuteClaimable,isChasChronicClaimable,isHazeClaimable',
      sorting: [
        { columnName: 'displayvalue', direction: 'asc' },
      ],
      pagesize: 30,
    }
    if (typeof v === 'string') {
      search.displayvalue = v
    } else {
      search.id = Number(v)
    }
    if (
      !(
        diagnosisFilter.length === 0 ||
        diagnosisFilter.length === filterOptions.length
      )
    ) {
      search.group = [
        {
          combineCondition: 'or',
        },
      ]
      diagnosisFilter.forEach((df) => {
        search.group[0][df] = true
      })
    }

    // console.log(diagnosisFilter)
    const response = await queryList('/api/codetable/ctsnomeddiagnosis', search)
    if (response && response.data) setCtDiagnosis(response.data.data)

    return response
  }
  const selected = ctDiagnosis.find(
    (diagnosis) => diagnosis.id === props.field.value,
  )

  let showPrefix = false
  if (selected) {
    showPrefix =
      selected.isChasAcuteClaimable ||
      selected.isChasChronicClaimable ||
      selected.isHazeClaimable
  }

  return (
    <div style={{ position: 'relative' }}>
      <Select
        label={label || 'Diagnosis'}
        prefix={showPrefix ? <AttachMoney className={classes.money} /> : null}
        options={ctDiagnosis}
        valueField='id'
        labelField='displayvalue'
        // autoComplete
        renderDropdown={(option) => {
          const {
            isChasAcuteClaimable,
            isChasChronicClaimable,
            isHazeClaimable,
          } = option
          return (
            <span>
              {(isChasAcuteClaimable ||
                isChasChronicClaimable ||
                isHazeClaimable) && <AttachMoney className={classes.money} />}

              {option.displayvalue}
            </span>
          )
        }}
        query={onDiagnosisSearch}
        onDataSouceChange={(data) => {
          setCtDiagnosis(data)
          if (onDataSouceChange) onDataSouceChange(data)
        }}
        onChange={(values, opts) => {
          if (props.onChange) {
            props.onChange(values, opts)
          }
        }}
        {...selectProps}
      />

      <ButtonSelect
        options={filterOptions}
        mode='multiple'
        textField='name'
        valueField='value'
        value={diagnosisFilter}
        justIcon
        style={filterStyle}
        onChange={(v, option) => {
          if (v !== diagnosisFilter) setDiagnosisFilter(v)
        }}
      >
        <FilterList />
      </ButtonSelect>
    </div>
  )
}

export default withStyles(styles, { withTheme: true })(DiagnosisSelect)
