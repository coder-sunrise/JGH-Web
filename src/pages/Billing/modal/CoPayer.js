import React, { Component } from 'react'
import { connect } from 'dva'
import * as Yup from 'yup'
import _ from 'lodash'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import { Table } from '@devexpress/dx-react-grid-material-ui'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'
import {
  Button,
  EditableTableGrid,
  GridContainer,
  GridItem,
  CodeSelect,
  FastField,
  Field,
  NumberInput,
  Switch,
  withFormikExtend,
  LocalSearchSelect,
} from '@/components'
// data table variable
import { INVOICE_PAYER_TYPE, COPAYER_TYPE } from '@/utils/constants'
import { roundTo, getUniqueId } from '@/utils/utils'
import { CoPayerColumns, CoPayerColExtensions } from '../variables'

const styles = theme => ({
  container: {
    padding: theme.spacing.unit,
  },
  dropdown: {
    marginBottom: theme.spacing.unit,
  },
  saveChangesButton: {
    textAlign: 'right',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit,
  },
})

const validationSchema = Yup.object().shape({
  payableBalance: Yup.number(),
  claimAmountBeforeGST: Yup.number()
    .min(0)
    .max(Yup.ref('payableBalance'), 'Claim Amount cannot exceed Total Payable'),
})

@connect(({ codetable }) => ({ codetable }))
@withFormikExtend({
  displayName: 'BillingForm-AddCopayer',
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    coPayer: Yup.number().required(),
    patientCopayAmount: Yup.number().when(
      ['patientCopayAmountType', 'invoiceItems', 'selectedRows'],
      (patientCopayAmountType, invoiceItems, selectedRows = [], schema) => {
        let maxAmount = invoiceItems
          .filter(r => selectedRows.includes(r.id))
          .reduce((p, c) => {
            return p + (c.payableBalance || 0)
          }, 0)
        const isPercentage =
          !patientCopayAmountType || patientCopayAmountType === 'Percentage'
        if (isPercentage) {
          return schema.min(0).max(100)
        }
        return schema.min(0).max(maxAmount)
      },
    ),
  }),
})
class CoPayer extends Component {
  state = {
    editingRowIds: [],
    selectedRows: [],
    invoiceItems: this.props.invoiceItems,
  }

  UNSAFE_componentWillReceiveProps = nextProps => {
    const { values: nextValues } = nextProps
    const { values } = this.props

    const { patientCopayAmountType, patientCopayAmount } = nextValues
    if (
      patientCopayAmountType !== values.patientCopayAmountType ||
      patientCopayAmount !== values.patientCopayAmount
    ) {
      this.reCalcluteClaimAmount(patientCopayAmountType, patientCopayAmount)
    }
  }

  populateClaimAmount = selected => {
    const { invoiceItems } = this.state
    const {
      values: { patientCopayAmountType = 'Percentage', patientCopayAmount },
    } = this.props
    const selectedItems = invoiceItems.map(item => {
      if (
        selected.includes(item.id) &&
        (item.claimAmountBeforeGST === 0 ||
          item.claimAmountBeforeGST === undefined)
      )
        return { ...item, claimAmountBeforeGST: item.payableBalance }
      return { ...item }
    })

    const newItems = this.assignPatientCopayAmount(
      selectedItems,
      patientCopayAmountType,
      patientCopayAmount,
      selected,
    )
    this.setState({ invoiceItems: newItems })
    this.props.dispatch({
      type: 'global/incrementCommitCount',
    })
  }

  assignPatientCopayAmount = (
    invoiceItems,
    patientCopayAmountType = 'Percentage',
    patientCopayAmount,
    selectedRows,
  ) => {
    const newitems = invoiceItems.map(i => {
      const payableAmount = i.payableBalance
      let claimAmountBeforeGST = i.payableBalance || 0

      if (
        !selectedRows.includes(i.id) ||
        i.claimAmountBeforeGST === undefined
      ) {
        return i
      }

      if (patientCopayAmount > 0 && payableAmount > 0) {
        if (patientCopayAmountType === 'Percentage') {
          const amt = roundTo((payableAmount * patientCopayAmount) / 100)
          if (claimAmountBeforeGST > amt) {
            claimAmountBeforeGST -= amt
          } else claimAmountBeforeGST = 0
        } else if (payableAmount > patientCopayAmount) {
          claimAmountBeforeGST -= patientCopayAmount
          patientCopayAmount = 0
        } else {
          patientCopayAmount -= payableAmount
          claimAmountBeforeGST = 0
        }
      }
      return { ...i, claimAmountBeforeGST }
    })
    return newitems
  }

  reCalcluteClaimAmount = (patientCopayAmountType, patientCopayAmount) => {
    const { invoiceItems, selectedRows } = this.state
    const newItems = this.assignPatientCopayAmount(
      invoiceItems,
      patientCopayAmountType,
      patientCopayAmount,
      selectedRows,
    )
    this.setState({ invoiceItems: newItems })
    this.props.dispatch({
      type: 'global/incrementCommitCount',
    })
  }

  handleSelectionChange = selection => {
    this.populateClaimAmount(selection)
    this.setState({ selectedRows: selection })
    const { setFieldValue } = this.props
    setFieldValue('selectedRows', selection)
  }

  onConfirmClick = async () => {
    const {
      codetable,
      values: {
        coPayer,
        patientCopayAmountType = 'Percentage',
        patientCopayAmount = 0,
      },
      handleSubmit,
      validateForm,
      invoice,
      copayers,
    } = this.props

    const isFormValid = await validateForm()
    if (!_.isEmpty(isFormValid)) {
      handleSubmit()
      return
    }
    const gstValue = invoice.gstValue || 0
    const { selectedRows, invoiceItems } = this.state
    const invoicePayerItem = invoiceItems
      .filter(item => selectedRows.includes(item.id))
      .map(item => ({ ...item, id: getUniqueId(), invoiceItemFK: item.id }))
    const copayerItem = codetable.ctcopayer.find(item => item.id === coPayer)

    const totalClaimAmountBeforeGST = roundTo(
      invoicePayerItem.reduce(
        (total, item) => total + item.claimAmountBeforeGST,
        0,
      ),
    )
    const totalGst = roundTo((totalClaimAmountBeforeGST * gstValue) / 100)
    const returnValue = {
      invoicePayerItem,
      payerDistributedAmtBeforeGST: totalClaimAmountBeforeGST,
      payerDistributedAmt: totalClaimAmountBeforeGST + totalGst,
      gstAmount: totalGst,
      payerOutstanding: totalClaimAmountBeforeGST + totalGst,
      payerTypeFK: INVOICE_PAYER_TYPE.COMPANY,
      name: copayerItem.displayValue,
      companyFK: copayerItem.id,
      patientCopayAmountType,
      patientCopayAmount,
      isModified: false,
      _isConfirmed: true,
      _isEditing: false,
      _isDeleted: false,
      schemeConfig: {},
    }
    this.props.onAddCoPayerClick(returnValue)
  }

  handleCommitChanges = ({ rows }) => {
    this.setState({
      invoiceItems: [...rows],
    })
  }

  handleEditingRowIdsChange = rows => {
    this.setState({
      editingRowIds: rows,
    })
    return rows
  }

  shouldDisableAddCopayer = () => {
    const {
      values: { coPayer },
    } = this.props
    const { selectedRows, editingRowIds, invoiceItems } = this.state
    const subtotalAmount = invoiceItems.reduce(
      (subtotal, item) =>
        item.claimAmountBeforeGST === undefined
          ? subtotal
          : subtotal + item.claimAmountBeforeGST,
      0,
    )
    const getErrorRows = row => row._errors && row._errors.length > 0
    const getSelectedRows = item => selectedRows.includes(item.id)
    const hasError =
      invoiceItems.filter(getSelectedRows).filter(getErrorRows).length > 0

    return (
      subtotalAmount <= 0 ||
      editingRowIds.length > 0 ||
      selectedRows.length === 0 ||
      !coPayer ||
      hasError
    )
  }

  SummaryRow = p => {
    const { children } = p
    let countCol = children.find(c => {
      if (!c.props.tableColumn.column) return false
      return c.props.tableColumn.column.name === 'claimAmountBeforeGST'
    })
    if (countCol) {
      const newChildren = [
        {
          ...countCol,
          props: {
            ...countCol.props,
            colSpan: 5,
            tableColumn: {
              ...countCol.props.tableColumn,
              align: 'right',
            },
          },
          key: 'claimAmountBeforeGST-sumtotal',
        },
        // {
        //   ...countCol,
        //   props: {
        //     ...countCol.props,
        //     colSpan: 5,
        //     tableColumn: {
        //       ...countCol.props.tableColumn,
        //       align: 'right',
        //     },
        //   },
        //   key: 'claimAmountBeforeGST-gsttotal',
        // },
      ]
      return <Table.Row {...p}>{newChildren}</Table.Row>
    }
    return <Table.Row {...p}>{children}</Table.Row>
  }

  render() {
    const { classes, onClose, copayers = [], values } = this.props
    const { selectedRows, invoiceItems } = this.state
    return (
      <div className={classes.container}>
        <GridContainer
          style={{
            maxHeight: 800,
            minHeight: 450,
            overflow: 'auto',
            alignContent: 'flex-start',
          }}
        >
          <GridItem md={6} className={classes.dropdown}>
            <FastField
              name='coPayer'
              render={args => {
                return (
                  <LocalSearchSelect
                    label='Co-Payer'
                    code='ctcopayer'
                    labelField='displayValue'
                    additionalSearchField='code'
                    dropdownMatchSelectWidth={false}
                    localFilter={item =>
                      [COPAYER_TYPE.CORPORATE, COPAYER_TYPE.INSURANCE].indexOf(
                        item.coPayerTypeFK,
                      ) >= 0 && !copayers.includes(item.id)
                    }
                    dropdownStyle={{
                      width: 650,
                    }}
                    renderDropdown={option => {
                      return (
                        <CopayerDropdownOption
                          option={option}
                        ></CopayerDropdownOption>
                      )
                    }}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={1} />
          <GridItem md={4}>
            <Field
              name='patientCopayAmount'
              render={args => {
                if (values.patientCopayAmountType === 'ExactAmount') {
                  return (
                    <NumberInput
                      currency
                      label='Patient Copay Amount'
                      defaultValue='0.00'
                      min={0}
                      precision={2}
                      {...args}
                    />
                  )
                }
                return (
                  <NumberInput
                    percentage
                    label='Patient Copay Amount'
                    defaultValue='0.00'
                    max={100}
                    min={0}
                    precision={2}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem md={1}>
            <Field
              name='patientCopayAmountType'
              render={args => (
                <Switch
                  checkedChildren='$'
                  checkedValue='ExactAmount'
                  unCheckedChildren='%'
                  unCheckedValue='Percentage'
                  label=' '
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem md={12}>
            <EditableTableGrid
              size='sm'
              rows={_.orderBy(
                invoiceItems,
                ['isVisitPurposeItem', 'itemType', 'itemName'],
                ['desc', 'asc', 'asc'],
              ).map(item => ({
                ...item,
                disabled: !selectedRows.includes(item.id),
              }))}
              forceRender
              columns={CoPayerColumns}
              columnExtensions={CoPayerColExtensions}
              selection={selectedRows}
              onSelectionChange={this.handleSelectionChange}
              FuncProps={{
                pager: false,
                selectable: true,
                summary: true,
                selectConfig: {
                  showSelectAll: true,
                  rowSelectionEnabled: row => row.isClaimable,
                },

                summaryConfig: {
                  state: {
                    totalItems: [
                      { columnName: 'claimAmountBeforeGST', type: 'sum' },
                    ],
                  },
                  integrated: {
                    calculator: (type, rows, getValue) => {
                      return rows
                        .filter(r => selectedRows.includes(r.id))
                        .reduce((pre, cur) => {
                          const v = getValue(cur)
                          return pre + (v || 0)
                        }, 0)
                    },
                  },
                  row: {
                    totalRowComponent: this.SummaryRow,
                    messages: {
                      sum: 'Total Claim Amount',
                    },
                  },
                },
              }}
              EditingProps={{
                showAddCommand: false,
                showDeleteCommand: false,
                showCommandColumn: false,
                onCommitChanges: this.handleCommitChanges,
                onEditingRowIdsChange: this.handleEditingRowIdsChange,
              }}
              schema={validationSchema}
            />
          </GridItem>
        </GridContainer>
        <div className={classes.saveChangesButton}>
          <Button color='danger' onClick={onClose}>
            Cancel
          </Button>
          <Button
            color='primary'
            onClick={this.onConfirmClick}
            disabled={this.shouldDisableAddCopayer()}
          >
            Add Co-Payer
          </Button>
        </div>
      </div>
    )
  }
}

export default withStyles(styles, { name: 'CoPayer' })(CoPayer)
