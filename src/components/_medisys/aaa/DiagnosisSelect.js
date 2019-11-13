import React, { useState, useEffect } from 'react'
import { withStyles, Divider, Paper } from '@material-ui/core'
import { Field, FastField } from 'formik'
import _ from 'lodash'
import DeleteIcon from '@material-ui/icons/Delete'
import AttachMoney from '@material-ui/icons/AttachMoney'
import FilterList from '@material-ui/icons/FilterList'
import moment from 'moment'
import {
  Button,
  GridContainer,
  GridItem,
  TextField,
  CodeSelect,
  DatePicker,
  Checkbox,
  Popover,
  Tooltip,
  Select,
  ButtonSelect,
} from './node_modules/@/components'
import { queryList } from './node_modules/@/services/common'

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
    value: 'isChasAcuteClaimable',
    name: 'CHAS Chronic',
  },
  {
    value: 'isChasChronicClaimable',
    name: 'CHAS Acute',
  },
  {
    value: 'isHazeClaimable',
    name: 'Haze',
  },
]

const DiagnosisSelect = ({
  codetable,
  dispatch,
  theme,
  index,
  arrayHelpers,
  diagnosises,
  classes,
  form,
  field,
  style,
  onChange,
  value,
  mode,
  onDataSouceChange,
  ...props
}) => {
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
  return (
    <div style={{ position: 'relative' }}>
      <Select
        label='Diagnosis'
        options={ctDiagnosis}
        valueField='id'
        labelField='displayvalue'
        value={value}
        mode={mode}
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
        onChange={onChange}
        onDataSouceChange={(data) => {
          setCtDiagnosis(data)
          if (onDataSouceChange) onDataSouceChange(data)
        }}
        form={form}
        field={field}
      />

      <ButtonSelect
        options={filterOptions}
        mode='multiple'
        textField='name'
        valueField='value'
        value={diagnosisFilter}
        justIcon
        style={{ position: 'absolute', bottom: 2, right: -35 }}
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
