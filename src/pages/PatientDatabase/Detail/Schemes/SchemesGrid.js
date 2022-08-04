import React, { PureComponent, Fragment } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import {
  CodeSelect,
  EditableTableGrid,
  notification,
  Popconfirm,
  Button,
  Popover,
  Tooltip,
} from '@/components'
import { InputNumber } from 'antd'
import Authorized from '@/utils/Authorized'
import { MenuList, ClickAwayListener, MenuItem } from '@material-ui/core'

import { getCodes } from '@/utils/codetable'
import { SCHEME_TYPE } from '@/utils/constants'
import codetable from '@/models/codetable'
import Delete from '@material-ui/icons/Delete'
import Print from '@material-ui/icons/Print'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { getRawData } from '@/services/report'
import { REPORT_ID } from '@/utils/constants'

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
    isPatientProfileSaved: false,
    popperOpen: false,
    printCopayerFK: undefined,
    anchorEl: undefined,
    copayerLabelCopies: 1,
    copayerCoverPageCopies: 1,
  }

  componentDidMount = () => {
    const { values } = this.props
    this.setState({ isPatientProfileSaved: values.id })
  }

  constructor(props) {
    super(props)

    const {
      title,
      titleChildren,
      dispatch,
      id,
      type,
      clinicSettings,
      values,
    } = props
    const { state } = this

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

    // not changing scheme type or scheme type is Corporate or Insurance, skip all the checking
    if (
      !schemeTypeFK ||
      schemeTypeFK === SCHEME_TYPE.CORPORATE ||
      schemeTypeFK === SCHEME_TYPE.INSURANCE
    )
      return rows

    const hasDuplicate = key
      ? rows.filter(r => !r.isDeleted && r.schemeTypeFK === schemeTypeFK)
          .length >= 2
      : []
    const chasSchemes = rows.filter(
      r => !r.isDeleted && this.isCHAS(r.schemeTypeFK),
    )
    const isCurrentSelectedCHAS = this.isCHAS(schemeTypeFK)

    let _newRows = [...rows]

    if (hasDuplicate || (chasSchemes.length >= 2 && isCurrentSelectedCHAS)) {
      _newRows = _newRows.map(r =>
        r.id === parseInt(key, 10) ? { ...r, schemeTypeFK: undefined } : r,
      )
    }

    return _newRows
  }

  isPHPC = row => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find(o => o.id === row.schemeTypeFK)
    return r && r.code.startsWith('PHPC')
  }

  isCorporate = row => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find(o => o.id === row.schemeTypeFK)
    return r && ['CORPORATE', 'INSURANCE'].indexOf(r.code.toUpperCase()) >= 0
  }

  isCHAS = schemeTypeFK => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find(o => o.id === schemeTypeFK)
    return r && r.code.startsWith('CHAS')
  }

  isExistingRow = row => {
    if (this.isCHAS(row.schemeTypeFK) && row.id && row.id > 0) {
      return true
    }
    return false
  }

  isMedisave = row => {
    const { codetable } = this.props
    const ctSchemeTypes = codetable[ctSchemeType.toLowerCase()] || []
    const r = ctSchemeTypes.find(o => o.id === row.id)

    if (!r) return false
    return (
      ['MEDIVISIT', 'FLEXIMEDI', 'OPSCAN'].indexOf(r.code) >= 0 // || r.code.startsWith('PHPC')
    )
  }

  medisaveCheck = row => {
    const { codetable } = this.props
    const schemeTypes = codetable[ctSchemeType.toLowerCase()] || []

    const r = schemeTypes.find(o => o.id === row.schemeTypeFK)

    if (!r) return false
    return ['MEDI500VISIT', 'OPSCAN', 'MEDI500VACCINATION'].indexOf(r.code) >= 0
  }

  getSortedRows = rows => {
    return _.orderBy(rows, ['sequence', 'schemeTypeFK'])
  }

  onRowMove = (row, dirt) => {
    const { setFieldValue, rows } = this.props
    const newRows = this.getSortedRows(rows)
    const r = newRows.find(o => o.id === row.id)
    const i = newRows.indexOf(r)
    // newRows.forEach((o, idx) => {
    //   if (o.schemeTypeFK === 11) o.sequence = idx
    // })
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
  }

  printLabel = async copayerId => {
    if (!Number.isInteger(copayerId)) return

    const { handlePrint, clinicSettings } = this.props
    const { labelPrinterSize } = clinicSettings.settings

    const sizeConverter = sizeCM => {
      return sizeCM
        .split('x')
        .map(o =>
          (10 * parseFloat(o.replace('cm', ''))).toString().concat('MM'),
        )
        .join('_')
    }
    const { values } = this.props
    const reportID =
      REPORT_ID[
        'COPAYER_ADDRESS_LABEL_'.concat(sizeConverter(labelPrinterSize))
      ]
    const data = await getRawData(reportID, {
      copayerId,
      patientprofileid: values.id,
    })
    const payload = [
      {
        ReportId: reportID,
        ReportData: JSON.stringify({
          ...data,
        }),
        Copies: this.state.copayerLabelCopies,
      },
    ]
    handlePrint(JSON.stringify(payload))
  }

  printCopayerCoverPage = async (row, copayerId) => {
    if (!Number.isInteger(copayerId)) return

    const { dispatch, handlePrint, clinicSettings, patient } = this.props
    dispatch({
      type: 'copayerDetail/queryCopayerDetails',
      payload: {
        id: copayerId,
      },
    }).then(r => {
      if (!r) return
      const data = {}
      let information = {}
      const { name, title } = patient?.entity
      information.Title = `${title ? title + ' ' : ''}${name}`
      if (r.address) {
        let address = r?.address || {}
        information.Content = `${r.displayValue}\n${address.blockNo || ''}${
          address.street ? (address.blockNo ? ' ' : '') + address.street : ''
        }${address.blockNo || address.street ? '\n' : ''}${address.unitNo ||
          ''}${
          address.buildingName
            ? (address.unitNo ? ' ' : '') + address.buildingName
            : ''
        }${
          address.unitNo || address.buildingName ? '\n' : ''
        }${address.countryName || ''}${
          address.postcode
            ? (address.countryName ? ' ' : '') + address.postcode
            : ''
        }`
      }
      data.MailingInformation = [information]
      const payload = [
        {
          ReportId: 95,
          ReportData: JSON.stringify(data),
          Copies: this.state.copayerCoverPageCopies,
        },
      ]
      handlePrint(JSON.stringify(payload))
    })
  }

  openPopper = row => {
    const { onPrintButtonClick } = this.props
    if (onPrintButtonClick) onPrintButtonClick(row.id)
  }
  closePopper = () => {
    this.setState({
      copayerLabelCopies: 1,
      copayerCoverPageCopies: 1,
    })
    const { onPrintButtonClick } = this.props
    if (onPrintButtonClick) onPrintButtonClick(null)
  }

  handleCopyNoChange = (value, labelType) => {
    if (labelType === 'Co-Payer Label') {
      this.setState({ copayerLabelCopies: value || 1 })
    } else {
      this.setState({ copayerCoverPageCopies: value || 1 })
    }
  }
  matchSearch = (option, input) => {
    const lowerCaseInput = input.toLowerCase()
    return (
      option.code.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
      option.name.toLowerCase().indexOf(lowerCaseInput) >= 0
    )
  }

  render() {
    const labelTypes = ['Co-Payer Label', 'Co-Payer Cover Page']
    const { editingRowIds, rowChanges, anchorEl } = this.state
    const {
      type,
      rows,
      schema,
      sendingJob,
      values,
      errors,
      printAnchorEl,
      clinicSettings,
    } = this.props
    const EditingProps = {
      showAddCommand: true,
      showCommandColumn: false,
      onCommitChanges: this.commitChanges,
    }

    const isMedisaveEnable = clinicSettings.settings.isEnableMedisave
    const columnExtensions = [
      {
        columnName: 'validRange',
        type: 'daterange',
        getInitialValue: row => {
          return [row.validFrom, row.validTo]
        },
        width: 250,
        sortingEnabled: false,
        isDisabled: row => {
          return this.isPHPC(row)
        },
      },
      {
        columnName: 'schemeTypeFK',
        type: 'codeSelect',
        code: 'ctSchemeType',
        width: 250,
        sortingEnabled: false,
        localFilter: opt => {
          return isMedisaveEnable ? opt : !this.isMedisave(opt)
        },
        onChange: ({ val, option, row, onValueChange }) => {
          let { rows } = this.props
          if (!row.id) {
            rows = rows.concat([row])
          }
          const ctSchemeTypes = this.props.codetable[ctSchemeType.toLowerCase()]

          if (row.coPaymentSchemeFK) {
            row.coPaymentSchemeFK = null
            row.copayerFK = null
          }

          const st = ctSchemeTypes.find(o => o.id === val)
          if (!st) return
          if (this.isPHPC(row)) {
            row.validRange = []
            row.validFrom = undefined
            row.validTo = undefined
            // row.accountNumber = undefined
          }
          const rs = rows.filter(
            o =>
              !o.isDeleted &&
              o.schemeTypeFK === val &&
              ['CORPORATE', 'INSURANCE'].indexOf(st.code.toUpperCase()) < 0 &&
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
              o =>
                !o.isDeleted && this.isCHAS(o.schemeTypeFK) && o.id !== row.id,
            ).length > 0
          ) {
            row.schemeTypeFK = undefined

            notification.error({
              message: 'Patient already has a CHAS Scheme Added',
            })
          }
          if (
            this.medisaveCheck(row) &&
            rows.filter(
              o => !o.isDeleted && this.medisaveCheck(o) && o.id !== row.id,
            ).length > 0
          ) {
            row.schemeTypeFK = undefined

            notification.error({
              message:
                'Patient can only either Medisave 500 Visit or Outpantient Scan at any point of time',
            })
            return
          }
        },
        isDisabled: row => {
          return this.isExistingRow(row)
        },
      },
      {
        columnName: 'coPaymentSchemeFK',
        sortingEnabled: false,
        type: 'localSearchSelect',
        additionalSearchField: 'code',
        showOptionTitle: false,
        dropdownMatchSelectWidth: false,
        dropdownStyle: { width: '1250px' },
        dropdownClassName: 'ant-select-dropdown-bottom-bordered',
        renderDropdown: option => {
          let { copayerName, creditFacility, copayerAddress } = option
          return (
            <Tooltip
              placement='left'
              title={
                <div>
                  <span>
                    {option.code ? `${option.code} - ` : ''}
                    {option.name}
                  </span>
                  <br />
                  <span>{`Copayer: ${copayerName}`}</span>
                  <br />
                  <span>
                    {`Credit Facility: ${
                      creditFacility ? creditFacility : ' - '
                    }`}
                  </span>
                  <br />
                  <span>{`Addr.: ${copayerAddress || ' - '}`}</span>
                </div>
              }
            >
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'block', lineHeight: '20px' }}>
                  {option.code ? `${option.code} - ` : ''}
                  <span style={{ fontWeight: option.code ? 'bold' : 'normal' }}>
                    {`${option.name}`}
                  </span>
                </div>
                <span
                  style={{ display: 'block', lineHeight: '20px' }}
                >{`Copayer: ${copayerName}`}</span>
                <span style={{ display: 'block', lineHeight: '20px' }}>
                  {`Credit Facility: ${
                    creditFacility ? creditFacility : ' - '
                  }`}
                </span>
                <span style={{ display: 'block', lineHeight: '20px' }}>
                  {`Addr.: ${copayerAddress || ' - '}`}
                </span>
              </div>
            </Tooltip>
          )
        },
        options: row => {
          const { codetable } = this.props
          const { copaymentscheme = [] } = codetable
          let filterOptions = []
          if (row.schemeTypeFK === SCHEME_TYPE.CORPORATE)
            filterOptions = copaymentscheme.filter(
              cps => cps.schemeTypeName === 'Corporate',
            )
          else if (row.schemeTypeFK === SCHEME_TYPE.INSURANCE)
            filterOptions = copaymentscheme.filter(
              cps => cps.schemeTypeName === 'Insurance',
            )
          return _.orderBy(
            filterOptions,
            [data => data.name.toLowerCase()],
            ['asc'],
          )
        },
        isDisabled: row => !this.isCorporate(row),
        render: row => {
          const { copaymentscheme = [] } = this.props.codetable
          const patCoPaymentScheme = copaymentscheme.find(
            item => item.id === row.coPaymentSchemeFK,
          )

          if (
            (row.schemeTypeFK === SCHEME_TYPE.CORPORATE ||
              row.schemeTypeFK === SCHEME_TYPE.INSURANCE) &&
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
        matchSearch: this.matchSearch,
        onChange: ({ val, option, row, onValueChange }) => {
          let { rows } = this.props
          if (!row.id) {
            rows = rows.concat([row])
          }
          const {
            copaymentscheme = [],
            ctschemetype: ctSchemeTypes = [],
          } = this.props.codetable

          const st = ctSchemeTypes.find(o => o.id === row.schemeTypeFK)

          const rs = rows.filter(
            o =>
              !o.isDeleted &&
              o.coPaymentSchemeFK === val &&
              ['CORPORATE', 'INSURANCE'].indexOf(st.code.toUpperCase()) < 0 &&
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
            item => item.id === row.coPaymentSchemeFK,
          )
          row.copayerFK = option?.copayerFK
          if (patCoPaymentScheme && !patCoPaymentScheme.isActive) {
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
        width: 250,
        isDisabled: row => {
          return !this.isCorporate(row)
        },
      },
      {
        columnName: 'action',
        width: 90,
        isReactComponent: true,
        sortingEnabled: false,
        isDisabled: row => true,
        render: e => {
          const { row, columnConfig } = e
          const { control } = columnConfig
          const { commitChanges } = control
          return (
            <Fragment>
              <div
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Popconfirm
                  title='Confirm to delete?'
                  onConfirm={() => {
                    commitChanges({
                      changed: {
                        [row.id]: {
                          isDeleted: true,
                        },
                      },
                    })
                  }}
                >
                  <Button size='sm' justIcon color='danger'>
                    <Delete />
                  </Button>
                </Popconfirm>
                <Popover
                  overlayClassName='noPaddingPopover'
                  visible={row.id === this.props.targetPrintId}
                  placement='bottomLeft'
                  trigger='click'
                  transition
                  onVisibleChange={val => {
                    if (!val) {
                      const { onPrintButtonClick } = this.props
                      if (onPrintButtonClick) {
                        onPrintButtonClick(undefined)
                        this.setState({
                          copayerCoverPageCopies: 1,
                          copayerLabelCopies: 1,
                        })
                      }
                    }
                  }}
                  content={
                    <MenuList role='menu'>
                      <MenuItem>
                        <Button
                          color='primary'
                          size='sm'
                          style={{ width: 150 }}
                          onClick={() => this.printLabel(row.copayerFK)}
                          disabled={
                            !Number.isInteger(this.state.copayerLabelCopies) ||
                            this.state.sendingJob
                          }
                        >
                          Co-Payer Label
                        </Button>
                        <InputNumber
                          size='small'
                          min={1}
                          max={10}
                          value={this.state.copayerLabelCopies}
                          onChange={value =>
                            this.setState({
                              copayerLabelCopies: value || 1,
                            })
                          }
                          style={{ width: '50px', textAlign: 'right' }}
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                          }}
                        >
                          &nbsp;Copies
                        </span>
                      </MenuItem>
                      <MenuItem>
                        <Button
                          color='primary'
                          size='sm'
                          style={{ width: 150 }}
                          onClick={() =>
                            this.printCopayerCoverPage(row, row.copayerFK)
                          }
                          disabled={
                            !Number.isInteger(
                              this.state.copayerCoverPageCopies,
                            ) || this.state.sendingJob
                          }
                        >
                          Co-Payer Cover Page
                        </Button>
                        <InputNumber
                          size='small'
                          min={1}
                          max={10}
                          value={this.state.copayerCoverPageCopies}
                          onChange={value =>
                            this.setState({
                              copayerCoverPageCopies: value || 1,
                            })
                          }
                          style={{ width: '50px', textAlign: 'right' }}
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                          }}
                        >
                          &nbsp;Copies
                        </span>
                      </MenuItem>
                    </MenuList>
                  }
                >
                  <Tooltip title='Print Patient’s Co-Payer Label/Cover Page'>
                    <Button
                      size='sm'
                      justIcon
                      color='primary'
                      onClick={() => {
                        this.openPopper(row)
                      }}
                      disabled={row.id < 1}
                    >
                      <Print />
                    </Button>
                  </Tooltip>
                </Popover>
              </div>
            </Fragment>
          )
        },
      },
    ]

    return (
      <EditableTableGrid
        rows={this.getSortedRows(rows)}
        rowMoveable={this.isCorporate}
        onRowMove={this.onRowMove}
        FuncProps={{ pager: false }}
        EditingProps={EditingProps}
        schema={schema}
        forceRender
        columns={[
          { name: 'schemeTypeFK', title: 'Scheme Type' },
          { name: 'coPaymentSchemeFK', title: 'Scheme Name' },
          { name: 'accountNumber', title: 'Account Number' },
          { name: 'validRange', title: 'Valid Period' },
          { name: 'action', title: 'Action' },
        ]}
        columnExtensions={columnExtensions}
      />
    )
  }
}

export default withWebSocket()(SchemesGrid)
