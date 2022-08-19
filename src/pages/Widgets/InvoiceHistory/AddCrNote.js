import React, { Component } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import moment from 'moment'
import Delete from '@material-ui/icons/Delete'
import Warning from '@material-ui/icons/Error'
// common components
import {
  CommonTableGrid,
  withFormikExtend,
  GridContainer,
  GridItem,
  Button,
  Field,
  NumberInput,
  IconButton,
  Tooltip,
  Popconfirm,
  notification,
  SizeContainer,
} from '@/components'
import { showErrorNotification } from '@/utils/error'
import { roundTo } from '@/utils/utils'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
import { orderItemTypes } from '@/utils/codes'
// sub components
import CrNoteForm from '@/pages/Finance/Invoice/components/modal/AddCrNote/CrNoteForm'
import Summary from '@/pages/Finance/Invoice/components/modal/AddCrNote/Summary'
import MiscCrNote from '@/pages/Finance/Invoice/components/modal/AddCrNote/MiscCrNote'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import { mergeClasses } from '@material-ui/styles'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'

@connect(({ invoiceCreditNote }) => ({
  invoiceCreditNote,
}))
@withFormikExtend({
  name: 'invoiceCreditNote',
  // enableReinitialize: true,
  mapPropsToValues: ({ invoiceCreditNote }) => {
    return invoiceCreditNote
  },
  validate: values => {
    const { creditNoteBalance, finalCredit, payerType } = values
    const errors = {}
    if (creditNoteBalance - finalCredit < 0) {
      const amountType =
        payerType === INVOICE_PAYER_TYPE.PATIENT
          ? 'Patient Payable Amount'
          : 'Outstanding Amount'
      errors.finalCredit = `Total Credit Notes amount cannot be more than ${amountType}. (Balance: $${creditNoteBalance.toFixed(
        2,
      )})`
    }
    return errors
  },
  handleSubmit: (values, { props }) => {
    const { invoiceDetail, dispatch, onConfirm, onRefresh } = props
    const {
      creditNoteItem,
      invoicePayerFK,
      isStockIn,
      remark,
      finalCredit,
      gstAmount,
      generatedDate,
    } = values
    const payload = {
      generatedDate,
      invoicePayerFK,
      isStockIn,
      remark,
      gstAmt: gstAmount,
      gstValue: invoiceDetail.gstValue,
      total: finalCredit - gstAmount,
      totalAftGST: finalCredit,
      creditNoteItem: creditNoteItem
        .filter(
          x => x.isSelected && (x.currentQuantity > 0 || x.currentAmount > 0),
        )
        .map(selectedItem => {
          const { id, concurrencyToken, ...restProps } = selectedItem

          const item = {
            ...restProps,
            isInventoryItem:
              restProps.itemType.toLowerCase() !== 'lab' &&
              restProps.itemType.toLowerCase() !== 'radiology' &&
              restProps.itemType.toLowerCase() !== 'service' &&
              !restProps.isDrugMixture,
            subTotal: restProps.isPackage
              ? restProps.packageRemainingAmountAfterGST
              : restProps.currentAmount || 0,
            itemDescription: restProps.itemName,
            quantity: restProps.isPackage
              ? restProps.packageRemainingQuantity
              : restProps.currentQuantity || 0,
          }
          return { ...item }
        }),
    }

    dispatch({
      type: 'invoiceCreditNote/upsert',
      payload,
    }).then(r => {
      if (r) {
        if (onConfirm) onConfirm()
        // Refresh invoice & invoicePayer
        onRefresh()
      }
    })
  },
})
class AddCrNote extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedRows: [],
      expandedGroups: [],
      isExistPackage: false,
    }

    this.handleOnChangeQuantity = _.debounce(this.handleOnChangeQuantity, 100)
  }

  componentDidMount = () => {
    const { values } = this.props
    const { creditNoteItem } = values

    const settings = JSON.parse(localStorage.getItem('clinicSettings'))
    const { isEnablePackage = false } = settings
    const packageItems = creditNoteItem.filter(item => item.isPackage)
    const existPackage = isEnablePackage && packageItems.length > 0
    this.setState({
      isExistPackage: existPackage,
    })

    this.expandAllPackages(values)
  }

  expandAllPackages = values => {
    const { creditNoteItem } = values

    if (creditNoteItem) {
      const groups = creditNoteItem.reduce(
        (distinct, data) =>
          distinct.includes(data.packageGlobalId)
            ? [...distinct]
            : [...distinct, data.packageGlobalId],
        [],
      )

      this.setState({
        expandedGroups: groups,
      })
    }
  }

  handleExpandedGroupsChange = e => {
    this.setState({
      expandedGroups: e,
    })
  }

  handleCalcCrNoteItem = (selection = undefined) => {
    const { invoiceDetail } = this.props
    let rowSelection = []
    const { selectedRows } = this.state
    rowSelection = selection || selectedRows

    const { setFieldValue, values } = this.props
    const { creditNoteItem } = values

    const finalCreditTotal = creditNoteItem.reduce((total, item) => {
      if (rowSelection.includes(item.id)) {
        if (item.isPackage) return total + item.packageRemainingAmountAfterGST
        return total + item.currentAmount
      }
      return total
    }, 0)
    setFieldValue('finalCredit', roundTo(finalCreditTotal))

    const gstAmount =
      (finalCreditTotal / (1 + invoiceDetail.gstValue / 100)) *
      (invoiceDetail.gstValue / 100)
    setFieldValue('gstAmount', roundTo(gstAmount))
    setFieldValue('subTotal', roundTo(finalCreditTotal) - roundTo(gstAmount))
  }

  handleSelectionChange = selection => {
    const { values, setFieldValue } = this.props

    let newSelection = selection
    if (this.state.isExistPackage) {
      // If is select a package item, should auto select all items under the package
      const newSelect = selection.find(
        i => !this.state.selectedRows.includes(i),
      )
      if (newSelect) {
        const item = values.creditNoteItem.find(i => i.id === newSelect)
        if (item && item.isPackage) {
          const otherItems = values.creditNoteItem.filter(
            i =>
              i.packageGlobalId === item.packageGlobalId &&
              i.id !== newSelect &&
              !i.isSelected,
          )
          if (otherItems && otherItems.length > 0) {
            otherItems.forEach(i => {
              i.isSelected = true
              newSelection.push(i.id)
            })
          }
        }
      }

      // If is remove selection from a package item, should auto remove selection all items under the package
      const newUnselect = this.state.selectedRows.find(
        i => !selection.includes(i),
      )
      if (newUnselect) {
        const item = values.creditNoteItem.find(i => i.id === newUnselect)
        if (item && item.isPackage) {
          const otherItems = values.creditNoteItem.filter(
            i =>
              i.packageGlobalId === item.packageGlobalId &&
              i.id !== newUnselect &&
              i.isSelected,
          )
          if (otherItems && otherItems.length > 0) {
            otherItems.forEach(i => {
              i.isSelected = false
              newSelection = newSelection.filter(s => s !== i.id)
            })
          }
        }
      }
    }

    const newUnSelectItems = this.state.selectedRows.filter(
      i => !selection.includes(i),
    )
    const newSelectItems = selection.filter(
      i => !this.state.selectedRows.includes(i),
    )
    const newCreditNoteItem = values.creditNoteItem.map(item => {
      if (
        !newUnSelectItems.find(x => x === item.id) &&
        !newSelectItems.find(x => x === item.id)
      )
        return item

      if (newUnSelectItems.find(x => x === item.id)) {
        return {
          ...item,
          currentQuantity: 0,
          currentAmount: 0,
          isSelected: false,
        }
      } else {
        return {
          ...item,
          currentQuantity: item.remainQuantity,
          currentAmount: item.remainAmount,
          isSelected: true,
        }
      }
    })

    setFieldValue('creditNoteItem', [...newCreditNoteItem])
    this.setState({ selectedRows: newSelection }, this.handleCalcCrNoteItem)
  }

  handleOnChangeQuantity = (id, value) => {
    const { values } = this.props
    const { creditNoteItem } = values

    var updateItem = creditNoteItem.find(x => x.id === id)
    if (value === updateItem.remainQuantity) {
      updateItem.currentAmount = updateItem._totalAfterGST
    } else {
      updateItem.currentAmount = roundTo(value * updateItem._unitPriceAftGst)
    }

    setTimeout(() => this.handleCalcCrNoteItem(), 1)
  }

  handleTotalChange = row => event => {
    const { target } = event
    const { values, setFieldValue } = this.props
    const { gstValue } = values
    let gstAmt = row.gstAmount

    const parseValue =
      hasValue(target.value) && target.value !== '' ? target.value : 0
    gstAmt = roundTo(parseValue - parseValue / (1 + gstValue / 100)) || 0
    const gstFieldName = `${target.name.split('.')[0]}.gstAmount`
    setFieldValue(gstFieldName, gstAmt)
    setTimeout(() => this.handleCalcCrNoteItem(), 1)
  }

  drugMixtureIndicator = (row, right) => {
    if (!row.isDrugMixture) return null

    return (
      <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
    )
  }

  render() {
    const {
      handleSubmit,
      onConfirm,
      values,
      invoiceDetail,
      classes,
    } = this.props
    const { creditNoteItem, finalCredit, payerType } = values

    const packageGroupCellContent = ({ row }) => {
      if (row.value === undefined || row.value === '') {
        return (
          <span style={{ verticalAlign: 'middle' }}>
            <strong>Non-Package Items</strong>
          </span>
        )
      }

      let label = 'Package'
      if (!creditNoteItem) return ''
      const data = creditNoteItem.filter(
        item => item.packageGlobalId === row.value,
      )
      if (data.length > 0) {
        label = `${data[0].packageCode} - ${data[0].packageName}`
        if (data[0].isPackageExpired) {
          label += ' (Expired)'
        }
      }

      return (
        <span style={{ verticalAlign: 'middle' }}>
          <strong>{label}</strong>
        </span>
      )
    }

    let CrNoteColumns = [
      { name: 'itemType', title: 'Type' },
      { name: 'itemName', title: 'Name' },
      { name: 'claimAmount', title: 'Payable Amt. ($)' },
      { name: 'creditNoteAmount', title: 'Total CN Amt. ($)' },
      { name: 'currentAmount', title: 'Current CN Amt. ($)' },
    ]

    if (this.state.isExistPackage) {
      CrNoteColumns.splice(2, 0, {
        name: 'quantity',
        title: 'Purchased Quantity',
      })
      CrNoteColumns.splice(3, 0, {
        name: 'packageConsumeQuantity',
        title: 'Consumed Quantity',
      })
      CrNoteColumns.splice(4, 0, {
        name: 'packageRemainingQuantity',
        title: 'Balance Quantity',
      })

      CrNoteColumns.push({
        name: 'packageGlobalId',
        title: 'Package',
      })
    } else {
      CrNoteColumns.splice(2, 0, { name: 'quantity', title: 'Total Qty.' })
      CrNoteColumns.splice(3, 0, {
        name: 'creditNoteQuantity',
        title: 'Total CN Qty.',
      })
      CrNoteColumns.splice(4, 0, {
        name: 'currentQuantity',
        title: 'Current CN Qty.',
      })
    }

    return (
      <div>
        <CrNoteForm payerType={payerType} />
        <CommonTableGrid
          size='sm'
          FuncProps={{
            selectable: true,
            selectConfig: {
              showSelectAll: true,
              rowSelectionEnabled: row =>
                (row.remainQuantity > 0 || row.remainAmount > 0) &&
                (!row.isPackage ||
                  (row.isPackage &&
                    !row.isPackageExpired &&
                    row.packageRemainingAmountAfterGST > 0)),
            },
            pager: false,
            grouping: this.state.isExistPackage,
            groupingConfig: {
              state: {
                grouping: [{ columnName: 'packageGlobalId' }],
                expandedGroups: [...this.state.expandedGroups],
                onExpandedGroupsChange: this.handleExpandedGroupsChange,
              },
              row: {
                contentComponent: packageGroupCellContent,
              },
            },
          }}
          selection={this.state.selectedRows}
          onSelectionChange={this.handleSelectionChange}
          defaultSorting={[{ columnName: 'packageGlobalId', direction: 'asc' }]}
          rows={creditNoteItem.filter(cn => !cn.isPreOrder || cn.isChargeToday)}
          columns={CrNoteColumns}
          columnExtensions={[
            {
              columnName: 'itemType',
              width: 150,
              sortingEnabled: false,
              render: row => {
                let paddingRight = 0
                if (row.isActualizedPreOrder || row.isPreOrder) {
                  paddingRight = 24
                }
                if (row.isDrugMixture) {
                  paddingRight = 10
                }
                const itemType = orderItemTypes.find(
                  t =>
                    t.type.toUpperCase() === (row.itemType || '').toUpperCase(),
                )
                return (
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        paddingRight: paddingRight,
                      }}
                    >
                      <Tooltip title={row.itemType}>
                        <span>{itemType?.displayValue}</span>
                      </Tooltip>
                      <div
                        style={{
                          position: 'absolute',
                          top: '-1px',
                          right: '-6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-block',
                            position: 'relative',
                          }}
                        >
                          {this.drugMixtureIndicator(row)}
                        </div>
                        {(row.isActualizedPreOrder || row.isPreOrder) && (
                          <Tooltip
                            title={
                              row.isPreOrder
                                ? 'New Pre-Order'
                                : 'Actualized Pre-Order'
                            }
                          >
                            <div
                              className={classes.rightIcon}
                              style={{
                                borderRadius: 4,
                                backgroundColor: row.isPreOrder
                                  ? '#4255bd'
                                  : 'green',
                                display: 'inline-block',
                              }}
                            >
                              Pre
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              columnName: 'itemName',
              sortingEnabled: false,
            },
            {
              columnName: 'quantity',
              width: 100,
              type: 'number',
              sortingEnabled: false,
            },
            {
              columnName: 'creditNoteQuantity',
              width: 100,
              type: 'number',
              sortingEnabled: false,
            },
            {
              columnName: 'currentQuantity',
              width: 120,
              align: 'right',
              sortingEnabled: false,
              render: row => {
                const { currentQuantity, remainQuantity, isPackage } = row

                if (isPackage) {
                  return (
                    <NumberInput
                      size='sm'
                      text
                      value={currentQuantity}
                      format='0.0'
                    />
                  )
                }

                return (
                  <Field
                    name={`creditNoteItem[${row.rowIndex}].currentQuantity`}
                    render={args => {
                      const selectItem =
                        args.form.values.creditNoteItem[row.rowIndex]
                      return (
                        <SizeContainer size='sm'>
                          <NumberInput
                            size='sm'
                            text={
                              !selectItem.isSelected || row.remainQuantity === 0
                            }
                            onChange={e =>
                              this.handleOnChangeQuantity(
                                creditNoteItem[row.rowIndex].id,
                                hasValue(e.target.value) &&
                                  e.target.value !== ''
                                  ? e.target.value
                                  : 0,
                              )
                            }
                            min={0}
                            max={row.remainQuantity}
                            {...args}
                            format='0.0'
                          />
                          {currentQuantity > remainQuantity ? (
                            <Tooltip
                              title={
                                <p style={{ color: 'red', fontSize: 12 }}>
                                  {`Item exceed quantity limits. (Maximum: ${remainQuantity})`}
                                </p>
                              }
                            >
                              <IconButton>
                                <Warning color='error' />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            ''
                          )}
                        </SizeContainer>
                      )
                    }}
                  />
                )
              },
            },
            {
              columnName: 'packageConsumeQuantity',
              width: 150,
              align: 'right',
              sortingEnabled: false,
              render: row => {
                const { quantity, packageRemainingQuantity, isPackage } = row
                const totalConsumedQuantity =
                  isPackage !== true
                    ? undefined
                    : quantity - (packageRemainingQuantity || 0)

                return (
                  <NumberInput
                    size='sm'
                    text
                    value={totalConsumedQuantity}
                    format='0.0'
                  />
                )
              },
            },
            {
              columnName: 'packageRemainingQuantity',
              width: 150,
              align: 'right',
              sortingEnabled: false,
              render: row => {
                const { packageRemainingQuantity } = row

                return (
                  <NumberInput
                    size='sm'
                    text
                    value={packageRemainingQuantity}
                    format='0.0'
                  />
                )
              },
            },
            {
              columnName: 'claimAmount',
              width: 120,
              type: 'currency',
              sortingEnabled: false,
            },
            {
              columnName: 'creditNoteAmount',
              width: 125,
              type: 'currency',
              sortingEnabled: false,
            },
            {
              columnName: 'currentAmount',
              width: 150,
              align: 'right',
              sortingEnabled: false,
              render: row => {
                if (row.isPackage) {
                  return (
                    <NumberInput
                      size='sm'
                      text
                      currency
                      value={row.packageRemainingAmountAfterGST}
                    />
                  )
                }

                return (
                  <Field
                    name={`creditNoteItem[${row.rowIndex}].currentAmount`}
                    render={args => {
                      const selectItem =
                        args.form.values.creditNoteItem[row.rowIndex]
                      return (
                        <SizeContainer size='sm'>
                          <NumberInput
                            {...args}
                            currency
                            min={0}
                            max={row.remainAmount}
                            text={
                              !selectItem.isSelected || row.remainAmount === 0
                            }
                            onChange={this.handleTotalChange(row)}
                          />
                        </SizeContainer>
                      )
                    }}
                  />
                )
              },
            },
          ]}
        />

        <Summary invoiceDetail={invoiceDetail} />

        <GridContainer>
          <GridItem md={9}>
            <p>Note: Total Amount ($) is GST inclusive.</p>
          </GridItem>
          <GridItem md={3} style={{ textAlign: 'right' }}>
            <Button color='danger' onClick={onConfirm}>
              Cancel
            </Button>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={
                creditNoteItem.filter(
                  x =>
                    x.isSelected &&
                    (x.currentQuantity > 0 || x.currentAmount > 0),
                ).length <= 0
              }
            >
              Save
            </Button>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default AddCrNote
