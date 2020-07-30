import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { isNumber } from 'util'
import {
  GridContainer,
  GridItem,
  TextField,
  CodeSelect,
  NumberInput,
  FastField,
  withFormikExtend,
  Field,
  DatePicker,
  Switch,
} from '@/components'

import Yup from '@/utils/yup'
import { calculateAdjustAmount } from '@/utils/utils'
import LowStockInfo from './LowStockInfo'
import Authorized from '@/utils/Authorized'

@connect(({ global, codetable }) => ({ global, codetable }))
@withFormikExtend({
  mapPropsToValues: ({ orders = {}, type }) => {
    const v = { ...(orders.entity || orders.defaultConsumable) }

    if (v.uid) {
      if (v.adjValue <= 0) {
        v.adjValue = Math.abs(v.adjValue)
        v.isMinus = true
      } else {
        v.isMinus = false
      }

      v.isExactAmount = v.adjType !== 'Percentage'
    } else {
      v.isMinus = true
      v.adjValue = 0
      v.isExactAmount = true
    }

    return { ...v }
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    inventoryConsumableFK: Yup.number().required(),
    // unitPrice: Yup.number().required(),
    totalPrice: Yup.number().required(),
    quantity: Yup.number().required(),
    totalAfterItemAdjustment: Yup.number().min(
      0.0,
      'The amount should be more than 0.00',
    ),
  }),

  handleSubmit: (values, { props, onConfirm }) => {
    const { dispatch, currentType, getNextSequence } = props
    let { batchNo } = values
    if (batchNo instanceof Array) {
      if (batchNo && batchNo.length > 0) {
        batchNo = batchNo[0]
      }
    }
    const data = {
      sequence: getNextSequence(),
      ...values,
      subject: currentType.getSubject(values),
      isDeleted: false,
      batchNo,
      adjValue:
        values.adjAmount < 0
          ? -Math.abs(values.adjValue)
          : Math.abs(values.adjValue),
      unitPrice: values.totalPrice / values.quantity,
    }
    dispatch({
      type: 'orders/upsertRow',
      payload: data,
    })
    if (onConfirm) onConfirm()
  },
  displayName: 'OrderPage',
})
class Consumable extends PureComponent {
  // state = {
  //   selectedConsumable: {
  //     consumableStock: [],
  //   },
  //   batchNo: '',
  //   expiryDate: '',
  // }

  constructor (props) {
    super(props)

    let selectedConsumable = {
      consumableStock: [],
    }

    const { codetable, values } = this.props
    const { inventoryconsumable = [] } = codetable
    const { inventoryConsumableFK } = values

    const consumable = inventoryConsumableFK
      ? inventoryconsumable.find((item) => item.id === inventoryConsumableFK)
      : undefined

    if (consumable) selectedConsumable = consumable
    // console.log({ consumable })
    this.state = {
      selectedConsumable,
      batchNo: '',
      expiryDate: '',
    }
  }

  changeConsumable = (v, op = {}) => {
    const { setFieldValue, values, disableEdit } = this.props

    let defaultBatch
    if (op.consumableStock) {
      defaultBatch = op.consumableStock.find((o) => o.isDefault === true)
      if (defaultBatch)
        this.setState({
          batchNo: defaultBatch.batchNo,
          expiryDate: defaultBatch.expiryDate,
        })
    }
    this.setState({
      selectedConsumable: op,
    })
    if (disableEdit === false) {
      setFieldValue('batchNo', defaultBatch ? defaultBatch.batchNo : undefined)
      setFieldValue(
        'expiryDate',
        defaultBatch ? defaultBatch.expiryDate : undefined,
      )
    }
    // console.log(v, op)
    setFieldValue('isActive', true)
    setFieldValue('consumableCode', op.code)
    setFieldValue('consumableName', op.displayValue)
    setFieldValue('unitOfMeasurement', op.uom ? op.uom.name : undefined)

    if (op.sellingPrice) {
      setFieldValue('unitPrice', op.sellingPrice)
      setFieldValue('totalPrice', op.sellingPrice * values.quantity)
      this.updateTotalPrice(op.sellingPrice * values.quantity)
    } else {
      setFieldValue('unitPrice', undefined)
      setFieldValue('totalPrice', undefined)
      this.updateTotalPrice(undefined)
    }
  }

  updateTotalPrice = (v) => {
    if (v || v === 0) {
      const { isExactAmount, isMinus, adjValue } = this.props.values

      let value = adjValue
      if (!isMinus) {
        value = Math.abs(adjValue)
      } else {
        value = -Math.abs(adjValue)
      }

      const finalAmount = calculateAdjustAmount(
        isExactAmount,
        v,
        value || adjValue,
      )
      this.props.setFieldValue('totalAfterItemAdjustment', finalAmount.amount)
      this.props.setFieldValue('adjAmount', finalAmount.adjAmount)
      this.props.setFieldValue(
        'adjType',
        isExactAmount ? 'ExactAmount' : 'Percentage',
      )
    } else {
      this.props.setFieldValue('totalAfterItemAdjustment', undefined)
      this.props.setFieldValue('adjAmount', undefined)
    }
  }

  handleReset = () => {
    const { setValues, orders } = this.props
    setValues({
      ...orders.defaultConsumable,
      type: orders.type,
    })
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (nextProps.orders.type === this.props.type)
      if (
        (!this.props.global.openAdjustment &&
          nextProps.global.openAdjustment) ||
        nextProps.orders.shouldPushToState
      ) {
        nextProps.dispatch({
          type: 'orders/updateState',
          payload: {
            entity: nextProps.values,
            shouldPushToState: false,
          },
        })
      }

    const { values: nextValues } = nextProps
    const { values: currentValues } = this.props

    if (
      !!nextValues.id &&
      nextValues.id !== currentValues.id &&
      nextValues.type === '4' // type === 'Medication'
    ) {
      const { codetable } = this.props
      const { inventoryconsumable = [] } = codetable
      const { inventoryConsumableFK } = nextValues

      const consumable = inventoryConsumableFK
        ? inventoryconsumable.find((item) => item.id === inventoryConsumableFK)
        : undefined
      // console.log({ consumable })
      if (consumable)
        this.setState({
          selectedConsumable: consumable,
        })
      else
        this.setState({
          selectedConsumable: {
            consumableStock: [],
          },
        })
    }
  }

  onAdjustmentConditionChange = (v) => {
    const { values } = this.props
    const { isMinus, adjValue, isExactAmount } = values
    if (!isNumber(adjValue)) return

    let value = adjValue
    if (!isExactAmount && adjValue > 100) {
      value = 100
      this.props.setFieldValue('adjValue', 100)
    }

    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }
    v = value

    this.getFinalAmount({ value })
  }

  getFinalAmount = ({ value } = {}) => {
    const { values, setFieldValue } = this.props
    const { isExactAmount, adjValue, totalPrice = 0 } = values
    const finalAmount = calculateAdjustAmount(
      isExactAmount,
      totalPrice,
      value || adjValue,
    )

    setFieldValue('totalAfterItemAdjustment', finalAmount.amount)
    setFieldValue('adjAmount', finalAmount.adjAmount)
    setFieldValue('adjType', isExactAmount ? 'ExactAmount' : 'Percentage')
  }

  render () {
    const {
      theme,
      values,
      footer,
      handleSubmit,
      setFieldValue,
      classes,
      disableEdit,
      isInclusiveCoPayer,
    } = this.props
    const addAccessRight = Authorized.check(
      'queue.consultation.order.consumable',
    )
    return (
      <Authorized.Context.Provider
        value={
          isInclusiveCoPayer ? (
            {
              rights: 'disable',
            }
          ) : (
            {
              rights: addAccessRight ? addAccessRight.rights : 'hidden',
            }
          )
        }
      >
        <div>
          <GridContainer>
            <GridItem xs={8}>
              <FastField
                name='inventoryConsumableFK'
                render={(args) => {
                  return (
                    <div style={{ position: 'relative' }}>
                      <CodeSelect
                        temp
                        label='Consumable Name'
                        code='inventoryconsumable'
                        labelField='displayValue'
                        onChange={this.changeConsumable}
                        {...args}
                        style={{ paddingRight: 20 }}
                      />
                      <LowStockInfo sourceType='consumable' {...this.props} />
                    </div>
                  )
                }}
              />
            </GridItem>
            <GridItem xs={4}>
              <FastField
                name='quantity'
                render={(args) => {
                  return (
                    <NumberInput
                      label='Quantity'
                      step={1}
                      min={1}
                      onChange={(e) => {
                        if (values.unitPrice) {
                          const total = e.target.value * values.unitPrice
                          setFieldValue('totalPrice', total)
                          this.updateTotalPrice(total)
                        }
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>

          <GridContainer>
            <GridItem xs={4} className={classes.editor}>
              <Field
                name='batchNo'
                render={(args) => {
                  return (
                    <CodeSelect
                      mode='tags'
                      maxSelected={1}
                      disableAll
                      label='Batch No.'
                      labelField='batchNo'
                      valueField='batchNo'
                      options={this.state.selectedConsumable.consumableStock}
                      onChange={(e, op = {}) => {
                        if (op && op.length > 0) {
                          const { expiryDate } = op[0]
                          setFieldValue(`expiryDate`, expiryDate)
                        } else {
                          setFieldValue(`expiryDate`, undefined)
                        }
                      }}
                      disabled={disableEdit}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={4} className={classes.editor}>
              <Field
                name='expiryDate'
                render={(args) => {
                  return (
                    <DatePicker
                      label='Expiry Date'
                      disabled={disableEdit}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={4} className={classes.editor}>
              <FastField
                name='totalPrice'
                render={(args) => {
                  return (
                    <NumberInput
                      label='Total'
                      currency
                      onChange={(e) => {
                        this.updateTotalPrice(e.target.value)
                      }}
                      min={0}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={8} className={classes.editor}>
              <FastField
                name='remark'
                render={(args) => {
                  // return <RichEditor placeholder='Remarks' {...args} />
                  return (
                    <TextField
                      multiline
                      rowsMax='5'
                      label='Remarks'
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={3} className={classes.editor}>
              <div style={{ position: 'relative' }}>
                <FastField
                  name='isMinus'
                  render={(args) => {
                    return (
                      <Switch
                        style={{ position: 'absolute' }}
                        checkedChildren='-'
                        unCheckedChildren='+'
                        label=''
                        onChange={() => {
                          setTimeout(() => {
                            this.onAdjustmentConditionChange()
                          }, 1)
                        }}
                        {...args}
                      />
                    )
                  }}
                />
                <Field
                  name='adjValue'
                  render={(args) => {
                    args.min = 0
                    if (values.isExactAmount) {
                      return (
                        <NumberInput
                          style={{
                            marginLeft: 55,
                            paddingRight: 45,
                          }}
                          currency
                          label='Adjustment'
                          onChange={() => {
                            setTimeout(() => {
                              this.onAdjustmentConditionChange()
                            }, 1)
                          }}
                          {...args}
                        />
                      )
                    }
                    return (
                      <NumberInput
                        style={{
                          marginLeft: 55,
                          paddingRight: 45,
                        }}
                        percentage
                        max={999}
                        label='Adjustment'
                        onChange={() => {
                          setTimeout(() => {
                            this.onAdjustmentConditionChange()
                          }, 1)
                        }}
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
            <GridItem xs={1} className={classes.editor}>
              <FastField
                name='isExactAmount'
                render={(args) => {
                  return (
                    <Switch
                      checkedChildren='$'
                      unCheckedChildren='%'
                      label=''
                      onChange={() => {
                        setTimeout(() => {
                          this.onAdjustmentConditionChange()
                        }, 1)
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={8} />
            <GridItem xs={4}>
              <FastField
                name='totalAfterItemAdjustment'
                render={(args) => {
                  return (
                    <NumberInput
                      label='Total After Adj'
                      currency
                      disabled
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          {footer({
            onSave: handleSubmit,
            onReset: this.handleReset,
          })}
        </div>
      </Authorized.Context.Provider>
    )
  }
}
export default Consumable
