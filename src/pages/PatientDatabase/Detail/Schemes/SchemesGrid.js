import React, { PureComponent } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import { CodeSelect, EditableTableGrid, notification } from '@/components'
import Authorized from '@/utils/Authorized'

import { getCodes } from '@/utils/codetable'
import { SCHEME_TYPE } from '@/utils/constants'

// let schemeTypes = []
// getCodes('ctSchemeType').then((codetableData) => {
//   schemeTypes = codetableData
// })

const ctSchemeType = 'ctSchemeType'
// let commitCount = 1000 // uniqueNumber
@connect(({ codetable, clinicSettings }) => ({ codetable, clinicSettings }))
class SchemesGrid extends PureComponent {
  state = {
    editingRowIds: [],
    rowChanges: {},
  }

  constructor (props) {
    super(props)

    const { title, titleChildren, dispatch, type, clinicSettings } = props
    const { state } = this
    const isMedisaveEnable = clinicSettings.settings.isEnableMedisave

    this.tableParas = {
      columns: [
        { name: 'schemeTypeFK', title: 'Scheme Type' },
        { name: 'coPaymentSchemeFK', title: 'Scheme Name' },
        { name: 'accountNumber', title: 'Account Number' },
        { name: 'validRange', title: 'Valid Period' },
      ],
      columnExtensions: [
        {
          columnName: 'validRange',
          type: 'daterange',
          getInitialValue: (row) => {
            return [
              row.validFrom,
              row.validTo,
            ]
          },
          sortingEnabled: false,
          isDisabled: (row) => {
            return this.isPHPC(row)
          },
          // onChange: (date, moments, org, row) => {
          //   row.validFrom = date[0]
          //   row.validTo = date[1]

          //   console.log(date, row)
          // },
        },
        {
          columnName: 'schemeTypeFK',
          type: 'codeSelect',
          code: 'ctSchemeType',
          sortingEnabled: false,
          localFilter: (opt) => {
            return isMedisaveEnable ? opt : !this.isMedisave(opt)
          },
          onChange: ({ val, option, row, onValueChange }) => {
            let { rows } = this.props
            if (!row.id) {
              rows = rows.concat([
                row,
              ])
            }
            const ctSchemeTypes = this.props.codetable[
              ctSchemeType.toLowerCase()
            ]
            const st = ctSchemeTypes.find((o) => o.id === val)
            if (!st) return
            // console.log('schemesgrid', { rows, st })
            if (this.isPHPC(row)) {
              row.validRange = []
              row.validFrom = undefined
              row.validTo = undefined
              // row.accountNumber = undefined
            }
            // console.log('row', row)
            const rs = rows.filter(
              (o) =>
                !o.isDeleted &&
                o.schemeTypeFK === val &&
                st.code !== 'CORPORATE' &&
                o.id !== row.id,
            )
            if (rs.length >= 1) {
              row.schemeTypeFK = undefined
              notification.error({
                message: 'The Schemes record already exists in the system',
              })
            }
            if (
              this.isCHAS(val) &&
              rows.filter(
                (o) =>
                  !o.isDeleted &&
                  this.isCHAS(o.schemeTypeFK) &&
                  o.id !== row.id,
              ).length > 0
            ) {
              row.schemeTypeFK = undefined

              notification.error({
                message: 'Patient already has a CHAS Scheme Added',
              })
            }
            // console.log(row, rows)

            if (
              this.medisaveCheck(row) &&
              rows.filter(
                (o) => !o.isDeleted && this.medisaveCheck(o) && o.id !== row.id,
              ).length > 0
            ) {
              row.schemeTypeFK = undefined

              notification.error({
                message:
                  'Patient can only either Medisave 500 Visit or Outpantient Scan at any point of time',
              })
              return
            }
            if (st.code !== 'CORPORATE' && row.coPaymentSchemeFK) {
              row.coPaymentSchemeFK = undefined
            }

            // this.props.dispatch({
            //   // force current edit row components to update
            //   type: 'global/updateState',
            //   payload: {
            //     commitCount: commitCount++,
            //   },
            // })
          },
          isDisabled: (row) => {
            return this.isExistingRow(row)
          },
        },
        {
          columnName: 'coPaymentSchemeFK',
          sortingEnabled: false,
          type: 'codeSelect',
          // code: 'ctschemecategory',
          code: 'coPaymentScheme',
          // remoteFilter: {
          //   schemeCategoryFK: 5,
          // },
          localFilter: (opt) => opt.schemeCategoryName === 'Corporate',
          isDisabled: (row) => !this.isCorporate(row),
          render: (row) => {
            const { copaymentscheme = [] } = this.props.codetable
            const patCoPaymentScheme = copaymentscheme.find(
              (item) => item.id === row.coPaymentSchemeFK,
            )

            if (
              row.schemeTypeFK === SCHEME_TYPE.CORPORATE &&
              patCoPaymentScheme
            ) {
              const isActiveLabel = !patCoPaymentScheme.isActive
                ? ' (Inactive)'
                : ''
              return (
                <span>
                  {patCoPaymentScheme ? patCoPaymentScheme.name : ''}
                  {isActiveLabel}
                </span>
              )
            }
            return (
              <span>{patCoPaymentScheme ? patCoPaymentScheme.name : ''}</span>
            )
          },
          onChange: ({ val, option, row, onValueChange }) => {
            let { rows } = this.props
            if (!row.id) {
              rows = rows.concat([
                row,
              ])
            }
            const {
              copaymentscheme = [],
              ctschemetype: ctSchemeTypes = [],
            } = this.props.codetable

            const st = ctSchemeTypes.find((o) => o.id === row.schemeTypeFK)

            const rs = rows.filter(
              (o) =>
                !o.isDeleted &&
                o.coPaymentSchemeFK === val &&
                st.code === 'CORPORATE' &&
                o.id !== row.id,
            )

            if (rs.length >= 1) {
              row.coPaymentSchemeFK = undefined

              notification.error({
                message: 'The Schemes record already exists in the system',
              })
              return
            }
            const patCoPaymentScheme = copaymentscheme.find(
              (item) => item.id === row.coPaymentSchemeFK,
            )

            if (!patCoPaymentScheme.isActive) {
              row.coPaymentSchemeFK = undefined
              notification.error({
                message: 'Selected scheme is an inactive schemes',
              })
            }
          },
        },
        {
          columnName: 'accountNumber',
          sortingEnabled: false,
          isDisabled: (row) => {
            return !this.isCorporate(row)
          },
        },
      ],
    }

    this.commitChanges = ({ rows, added, changed, deleted }) => {
      const { setFieldValue } = this.props
      const newRows = this.getSortedRows(rows)

      newRows.forEach((r, i) => {
        if (r.validRange && !this.isPHPC(r)) {
          r.validFrom = r.validRange[0]
          r.validTo = r.validRange[1]
        } else {
          r.validRange = []
          r.validFrom = ''
          r.validTo = ''
        }
        r.sequence = this.isCorporate(r) ? i : 0
      })

      const _newRows = this.isDuplicate({ rows: newRows, changed })

      setFieldValue('patientScheme', _newRows)
      return _newRows
    }
  }

  isDuplicate = ({ rows, changed }) => {
    if (!changed) return rows
    const key = Object.keys(changed)[0]
    const { schemeTypeFK } = changed[key]

    // not changing scheme type or scheme type is Corporate, skip all the checking
    if (!schemeTypeFK || schemeTypeFK === 15) return rows

    const hasDuplicate = key
      ? rows.filter((r) => !r.isDeleted && r.schemeTypeFK === schemeTypeFK)
          .length >= 2
      : []
    const chasSchemes = rows.filter(
      (r) => !r.isDeleted && this.isCHAS(r.schemeTypeFK),
    )
    const isCurrentSelectedCHAS = this.isCHAS(schemeTypeFK)

    let _newRows = [
      ...rows,
    ]

    if (hasDuplicate || (chasSchemes.length >= 2 && isCurrentSelectedCHAS)) {
      _newRows = _newRows.map(
        (r) =>
          r.id === parseInt(key, 10) ? { ...r, schemeTypeFK: undefined } : r,
      )
    }

    return _newRows
  }

  isPHPC = (row) => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find((o) => o.id === row.schemeTypeFK)
    return r && r.code.startsWith('PHPC')
  }

  isCorporate = (row) => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find((o) => o.id === row.schemeTypeFK)
    return r && r.code.toUpperCase() === 'CORPORATE'
  }

  isCHAS = (schemeTypeFK) => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find((o) => o.id === schemeTypeFK)
    return r && r.code.startsWith('CHAS')
  }

  isExistingRow = (row) => {
    if (this.isCHAS(row.schemeTypeFK) && row.id && row.id > 0) {
      return true
    }
    return false
  }

  isMedisave = (row) => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find((o) => o.id === row.id)

    if (!r) return false
    return (
      [
        'MEDIVISIT',
        'FLEXIMEDI',
        'OPSCAN',
      ].indexOf(r.code) >= 0 // || r.code.startsWith('PHPC')
    )
  }

  medisaveCheck = (row) => {
    const { codetable } = this.props
    const schemeTypes = codetable[ctSchemeType.toLowerCase()] || []

    const r = schemeTypes.find((o) => o.id === row.schemeTypeFK)

    if (!r) return false
    return (
      [
        'MEDI500VISIT',
        'OPSCAN',
        'MEDI500VACCINATION',
      ].indexOf(r.code) >= 0
    )
  }

  getSortedRows = (rows) => {
    return _.orderBy(rows, [
      'sequence',
      'schemeTypeFK',
    ])
  }

  onRowMove = (row, dirt) => {
    const { setFieldValue, rows } = this.props
    const newRows = this.getSortedRows(rows)
    // console.log(newRows)
    const r = newRows.find((o) => o.id === row.id)
    const i = newRows.indexOf(r)
    // newRows.forEach((o, idx) => {
    //   if (o.schemeTypeFK === 11) o.sequence = idx
    // })
    // console.log(i)
    if (dirt === 'UP') {
      if (i - 1 >= 0) {
        newRows[i - 1].sequence = i
      }
      r.sequence = i - 1
    } else if (dirt === 'DOWN') {
      if (i + 1 <= rows.length) {
        newRows[i + 1].sequence = i
      }
      r.sequence = i + 1
    }
    setFieldValue('patientScheme', newRows)

    // console.log(row, dirt, newRows)
  }

  render () {
    const { editingRowIds, rowChanges } = this.state
    const { type, rows, schema, errors } = this.props
    // console.log('schema', schema, errors)
    const EditingProps = {
      showAddCommand: true,

      onCommitChanges: this.commitChanges,
    }
    return (
      <EditableTableGrid
        rows={this.getSortedRows(rows)}
        rowMoveable={this.isCorporate}
        onRowMove={this.onRowMove}
        FuncProps={{ pager: false }}
        EditingProps={EditingProps}
        schema={schema}
        {...this.tableParas}
      />
    )
  }
}

export default SchemesGrid
