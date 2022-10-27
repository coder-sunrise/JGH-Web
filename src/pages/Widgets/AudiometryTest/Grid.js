import React, { useState, useEffect } from 'react'
import { formatMessage } from 'umi'
import Yup from '@/utils/yup'
import _ from 'lodash'
import numeral from 'numeral'
import { EditableTableGrid } from '@/components'

const message = 'Value must be between 10 and 100 dB'
const gridValidationSchema = Yup.object().shape({
  Result1000Hz: Yup.number()
    .min(10, message)
    .max(100, message),
  Result4000Hz: Yup.number()
    .min(10, message)
    .max(100, message),
})
export default ({
  dispatch,
  classes,
  from,
  codetable,
  handleCommitChanges,
  ...restProps
}) => {
  const { rows = [], isEditable = true } = restProps

  const tableParas = {
    columns: [
      { name: 'type', title: ' ' },
      { name: 'Result1000Hz', title: '1000Hz Result (dB)' },
      { name: 'Result4000Hz', title: '4000Hz Result (dB)' },
    ],

    columnExtensions: [
      {
        columnName: 'type',
        width: 80,
        isDisabled: () => true,
        sortingEnabled: false,
      },
      {
        columnName: 'Result1000Hz',
        type: 'number',
        align: 'center',
        precision: 0,
        sortingEnabled: false,
      },
      {
        columnName: 'Result4000Hz',
        type: 'number',
        align: 'center',
        precision: 0,
        sortingEnabled: false,
      },
    ],
  }

  return (
    <EditableTableGrid
      size='sm'
      style={{ margin: 0 }}
      rows={rows}
      schema={gridValidationSchema}
      FuncProps={{
        pager: false,
        edit: isEditable,
      }}
      EditingProps={{
        showAddCommand: false,
        showCommandColumn: false,
        onCommitChanges: handleCommitChanges,
      }}
      {...tableParas}
    />
  )
}
