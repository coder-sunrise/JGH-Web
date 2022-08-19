import React, { Component, useState } from 'react'
import numeral from 'numeral'
import { qtyFormat } from '@/utils/config'
// dva
import { connect } from 'dva'
import Yup from '@/utils/yup'
// material ui
import { withStyles } from '@material-ui/core'
import Save from '@material-ui/icons/Save'
import { FastField, Field } from 'formik'
import { isNumber } from 'util'
// common components
import {
  Button,
  GridContainer,
  withFormikExtend,
  EditableTableGrid,
  GridItem,
  OutlinedTextField,
  NumberInput,
  Switch,
  ProgressButton,
  Tooltip,
} from '@/components'
// utils
import { INVOICE_VIEW_MODE } from '@/utils/constants'
import {
  roundTo,
  navigateDirtyCheck,
  calculateAdjustAmount,
} from '@/utils/utils'
// sub component
import AmountSummary from '@/pages/Shared/AmountSummary'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'

const styles = theme => ({
  cardContainer: {
    margin: theme.spacing(1),
    marginTop: 20,
  },
  errorPromptContainer: {
    textAlign: 'center',
    '& p': {
      fontSize: '1rem',
    },
  },
  wrapCellTextStyle: {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  rightIcon: {
    position: 'relative',
    fontWeight: 600,
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 3px',
    height: 20,
    cursor: 'pointer',
    margin: '0px 1px',
    lineHeight: '16px',
  },
})

const itemSchema = Yup.object().shape({
  unitPrice: Yup.number()
    .min(0, '')
    .required(),
  subTotal: Yup.number()
    .min(0, '')
    .required(),
})

@connect(({ invoiceDetail }) => ({
  invoiceDetail,
}))
@withFormikExtend({
  notDirtyDuration: 3,
  displayName: 'EditInvoice',
  enableReinitialize: true,
  mapPropsToValues: ({ invoiceDetail }) => {
    return {
      ...invoiceDetail.entity,
      invoiceItem: invoiceDetail.entity.invoiceItem.map(item => {
        return {
          ...item,
          adjValue:
            item.adjValue && item.adjValue < 0
              ? -1 * item.adjValue
              : item.adjValue || 0,
          isMinus: !!(item.adjValue && item.adjValue < 0),
          isExactAmount: !!(item.adjType && item.adjType === 'ExactAmount'),
        }
      }),
    }
  },
})
class EditInvoice extends Component {
  switchMode = () => {
    this.props.dispatch({
      type: 'invoiceDetail/updateState',
      payload: {
        mode: INVOICE_VIEW_MODE.DEFAULT,
      },
    })
  }

  handleSaveClick = async () => {
    const { dispatch, values, history } = this.props
    const payload = {
      ...values,
      invoiceItem: values.invoiceItem.map(item => {
        return {
          ...item,
          adjValue: item.isMinus ? -1 * item.adjValue : item.adjValue,
          adjType: item.isExactAmount ? 'ExactAmount' : 'Percentage',
        }
      }),
    }

    dispatch({
      type: 'invoiceDetail/saveEditInvoice',
      payload,
    }).then(response => {
      if (response) {
        const { id } = response
        history.replace(`/finance/invoice/details?id=${id}`)
      }
    })
  }

  handleCommitChanges = ({ rows }) => {
    const { setFieldValue } = this.props
    setFieldValue('invoiceItem', rows)
  }

  updateInvoiceData = v => {
    const { values, setValues } = this.props
    const newInvoice = {
      ...values,
      invoiceTotal: v.summary.total,
      invoiceTotalAftAdj: v.summary.totalAfterAdj,
      invoiceTotalAftGST: v.summary.totalWithGST,
      outstandingBalance: v.summary.totalWithGST - values.totalPayment,
      invoiceGSTAmt: Math.round(v.summary.gst * 100) / 100,
      invoiceGSTAdjustment: v.summary.gstAdj,
      invoiceAdjustment: v.adjustments,
      isGSTInclusive: !!v.summary.isGSTInclusive,
    }
    setValues({
      ...newInvoice,
    })
  }

  updateTotal = row => {
    const {
      totalAfterItemAdjustment = 0,
      quantity = 0,
      adjValue,
      isExactAmount,
      isMinus,
    } = row
    let value = adjValue
    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }
    if (isExactAmount) {
      row.subTotal = totalAfterItemAdjustment - value
    } else {
      row.adjAmt = roundTo(
        (totalAfterItemAdjustment / (1 + value / 100)) * (value / 100),
      )
      row.subTotal = totalAfterItemAdjustment - row.adjAmt
    }
    row.unitPrice = quantity > 0 ? row.subTotal / quantity : 0
  }

  updateUnitPrice = row => {
    const {
      unitPrice = 0,
      quantity = 0,
      isMinus,
      adjValue,
      isExactAmount,
    } = row
    let value = adjValue
    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }
    row.subTotal = roundTo(unitPrice * quantity)
    const finalAmount = calculateAdjustAmount(
      isExactAmount,
      row.subTotal,
      value || adjValue,
    )
    row.totalAfterItemAdjustment = finalAmount.amount
    row.adjAmt = finalAmount.adjAmount
  }

  onAdjustmentConditionChange = index => {
    const { setFieldValue, values } = this.props
    const { invoiceItem = [] } = values
    const { isMinus, adjValue, isExactAmount } = invoiceItem[index]
    if (!isNumber(adjValue)) return
    let value = adjValue
    if (!isExactAmount && adjValue > 100) {
      value = 100
      setFieldValue(`invoiceItem[${index}].adjValue`, 100)
    }

    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }

    this.getFinalAmount({ value, index })
  }

  getFinalAmount = ({ value, index } = {}) => {
    const { setFieldValue, values } = this.props
    const { invoiceItem = [] } = values
    const { isExactAmount, adjValue, subTotal = 0 } = invoiceItem[index]
    const finalAmount = calculateAdjustAmount(
      isExactAmount,
      subTotal,
      value || adjValue,
    )
    setFieldValue(
      `invoiceItem[${index}].totalAfterItemAdjustment`,
      finalAmount.amount,
    )
    setFieldValue(`invoiceItem[${index}].adjAmt`, finalAmount.adjAmount)
  }

  drugMixtureIndicator = (row, right) => {
    if (!row.isDrugMixture) return null

    return (
      <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
    )
  }

  render() {
    const { classes, values } = this.props
    const {
      invoiceItem = [],
      invoiceAdjustment = [],
      isGSTInclusive,
      gstValue,
    } = values
    return (
      <div className={classes.cardContainer}>
        <div
          style={{
            justifyContent: 'space-between',
            textAlign: 'right',
            marginBottom: 24,
          }}
        >
          <Button
            size='sm'
            color='danger'
            onClick={navigateDirtyCheck({ onProceed: this.switchMode })}
          >
            Cancel
          </Button>
          <ProgressButton
            icon={<Save />}
            size='sm'
            color='primary'
            onClick={this.handleSaveClick}
            disabled={
              values.invoiceTotalAftGST < 0 ||
              invoiceItem.find(item => item.totalAfterItemAdjustment < 0)
            }
          >
            Save Changes
          </ProgressButton>
        </div>

        <GridContainer className={classes.summaryContainer}>
          <EditableTableGrid
            style={{ marginLeft: 8, marginRight: 8 }}
            rows={invoiceItem}
            forceRender
            columns={[
              { name: 'itemType', title: 'Type' },
              { name: 'itemName', title: 'Name' },
              { name: 'unitPrice', title: 'Unit Price' },
              { name: 'quantity', title: 'Quantity' },
              { name: 'adjAmt', title: 'Adjustment' },
              { name: 'totalAfterItemAdjustment', title: 'Total ($)' },
            ]}
            columnExtensions={[
              {
                columnName: 'itemType',
                width: 300,
                disabled: true,
                render: row => {
                  let paddingRight = 0
                  if (row.isActualizedPreOrder || row.isPreOrder) {
                    paddingRight = 24
                  }
                  if (row.isDrugMixture) {
                    paddingRight = 10
                  }
                  return (
                    <div style={{ position: 'relative' }}>
                      <div
                        className={classes.wrapCellTextStyle}
                        style={{ paddingRight: paddingRight }}
                      >
                        {row.itemType}
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
                disabled: true,
              },
              {
                columnName: 'unitPrice',
                type: 'number',
                currency: true,
                sortingEnabled: false,
                width: 120,
                onChange: e => {
                  this.updateUnitPrice(e.row)
                },
                isDisabled: row =>
                  (row.isPreOrder && !row.isChargeToday) || row.hasPaid,
              },
              {
                columnName: 'quantity',
                type: 'number',
                width: 160,
                disabled: true,
                sortingEnabled: false,
                render: row => {
                  const { quantity, dispenseUOMDisplayValue = '' } = row
                  return `${numeral(quantity).format(
                    qtyFormat,
                  )} ${dispenseUOMDisplayValue}`
                },
              },
              {
                columnName: 'adjAmt',
                width: 200,
                isReactComponent: true,
                sortingEnabled: false,
                render: currentrow => {
                  const [focused, setFocused] = useState(false)
                  const { row } = currentrow
                  const index = invoiceItem.map(i => i.id).indexOf(row.id)
                  return (
                    <div style={{ display: 'flex' }}>
                      <Field
                        name={`invoiceItem[${index}].isMinus`}
                        render={args => (
                          <Switch
                            style={{ margin: 0 }}
                            checkedChildren='-'
                            unCheckedChildren='+'
                            label=''
                            onChange={() => {
                              setTimeout(() => {
                                this.onAdjustmentConditionChange(index)
                              }, 1)
                            }}
                            {...args}
                            inputProps={{
                              onMouseUp: e => {
                                if (!focused) {
                                  setFocused(true)
                                  e.target.click()
                                }
                              },
                            }}
                            disabled={
                              (row.isPreOrder && !row.isChargeToday) ||
                              row.hasPaid
                            }
                          />
                        )}
                      />
                      <div
                        style={{
                          marginLeft: -24,
                          marginRight: 10,
                        }}
                      >
                        {row.isExactAmount ? (
                          <Field
                            name={`invoiceItem[${index}].adjValue`}
                            render={args => (
                              <NumberInput
                                style={{
                                  marginBottom: 0,
                                  marginTop: 0,
                                }}
                                noSuffix
                                currency
                                label=''
                                onChange={() => {
                                  setTimeout(() => {
                                    this.onAdjustmentConditionChange(index)
                                  }, 1)
                                }}
                                min={0}
                                precision={2}
                                {...args}
                                inputProps={{
                                  onMouseUp: e => {
                                    if (!focused) {
                                      setFocused(true)
                                      e.target.focus()
                                    }
                                  },
                                }}
                                disabled={
                                  (row.isPreOrder && !row.isChargeToday) ||
                                  row.hasPaid
                                }
                              />
                            )}
                          />
                        ) : (
                          <Field
                            name={`invoiceItem[${index}].adjValue`}
                            render={args => (
                              <NumberInput
                                style={{
                                  marginBottom: 0,
                                  marginTop: 0,
                                }}
                                percentage
                                noSuffix
                                max={100}
                                label=''
                                onChange={() => {
                                  setTimeout(() => {
                                    this.onAdjustmentConditionChange(index)
                                  }, 1)
                                }}
                                min={0}
                                precision={2}
                                {...args}
                                inputProps={{
                                  onMouseUp: e => {
                                    if (!focused) {
                                      setFocused(true)
                                      e.target.focus()
                                    }
                                  },
                                }}
                                disabled={
                                  (row.isPreOrder && !row.isChargeToday) ||
                                  row.hasPaid
                                }
                              />
                            )}
                          />
                        )}
                      </div>
                      <Field
                        name={`invoiceItem[${index}].isExactAmount`}
                        render={args => (
                          <Switch
                            style={{
                              marginRight: -30,
                              marginBottom: 0,
                              marginTop: 0,
                            }}
                            checkedChildren='$'
                            unCheckedChildren='%'
                            label=''
                            onChange={() => {
                              setTimeout(() => {
                                this.onAdjustmentConditionChange(index)
                              }, 1)
                            }}
                            {...args}
                            inputProps={{
                              onMouseUp: e => {
                                if (!focused) {
                                  setFocused(true)
                                  e.target.click()
                                }
                              },
                            }}
                            disabled={
                              (row.isPreOrder && !row.isChargeToday) ||
                              row.hasPaid
                            }
                          />
                        )}
                      />
                    </div>
                  )
                },
              },
              {
                columnName: 'totalAfterItemAdjustment',
                type: 'number',
                currency: true,
                sortingEnabled: false,
                width: 120,
                onChange: e => {
                  this.updateTotal(e.row)
                },
                isDisabled: row =>
                  (row.isPreOrder && !row.isChargeToday) || row.hasPaid,
                render: row => (
                  <NumberInput
                    value={
                      (row.isPreOrder && !row.isChargeToday) || row.hasPaid
                        ? 0
                        : row.totalAfterItemAdjustment
                    }
                    text
                    currency
                  />
                ),
              },
            ]}
            schema={itemSchema}
            FuncProps={{ pager: false }}
            EditingProps={{
              showCommandColumn: false,
              onCommitChanges: this.handleCommitChanges,
            }}
          />
          <GridItem xs={7} md={7}>
            <FastField
              name='remark'
              render={args => {
                return (
                  <OutlinedTextField
                    label='Invoice Remarks'
                    multiline
                    rowsMax={5}
                    rows={2}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={5} md={5}>
            <AmountSummary
              rows={invoiceItem}
              adjustments={invoiceAdjustment}
              config={{
                isGSTInclusive,
                totalField: 'totalAfterItemAdjustment',
                adjustedField: 'totalAfterOverallAdjustment',
                gstField: 'totalAfterGST',
                gstAmtField: 'gstAmount',
                gstValue,
              }}
              onValueChanged={this.updateInvoiceData}
            />
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles)(EditInvoice)
