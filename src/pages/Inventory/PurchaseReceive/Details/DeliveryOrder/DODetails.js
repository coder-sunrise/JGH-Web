import React, { PureComponent } from 'react'
import { formatMessage } from 'umi'
import Yup from '@/utils/yup'
import {
  GridContainer,
  GridItem,
  FastField,
  TextField,
  withFormikExtend,
  DatePicker,
  OutlinedTextField,
  EditableTableGrid,
  Field,
} from '@/components'
import { podoOrderType, getInventoryItemV2 } from '@/utils/codes'
import { INVENTORY_TYPE } from '@/utils/constants'
import AuthorizedContext from '@/components/Context/Authorized'
import CommonTableGrid from '@/components/CommonTableGrid'

// let commitCount = 2201 // uniqueNumber

const receivingDetailsSchema = Yup.object().shape({
  type: Yup.number().required(),
  code: Yup.number().required(),
  name: Yup.number().required(),
  batchNo: Yup.string().required(),
  expiryDate: Yup.string().nullable(),
  currentReceivingQty: Yup.number()
    .min(0, 'Current Receiving Quantity must be greater than or equal to 0')
    .max(Yup.ref('maxCurrentReceivingQty'), e => {
      return `Current Receiving Quantity must be less than or equal to ${
        e.max ? e.max.toFixed(1) : e.max
      }`
    })
    .required(),
})

@withFormikExtend({
  mapPropsToValues: ({ deliveryOrderDetails }) => {
    // console.log('DODetails', deliveryOrderDetails)
    return deliveryOrderDetails.entity
  },
  enableReinitialize: true,
  displayName: 'deliveryOrderDetails',
  validationSchema: Yup.object().shape({
    // deliveryOrderNo: Yup.string().required(),
    deliveryOrderDate: Yup.date().required(),
    rows: Yup.array().required('At least one item is required.'),
    // rows: Yup.array().compact((v) => v.isDeleted).of(receivingDetailsSchema),
    remark: Yup.string().max(2000),
  }),
  handleSubmit: (values, { props }) => {
    const { rows, ...restValues } = values
    const {
      deliveryOrderDetails,
      refreshDeliveryOrder,
      dispatch,
      onConfirm,
    } = props
    const { list, purchaseOrderDetails } = deliveryOrderDetails
    const { purchaseOrderItem } = purchaseOrderDetails
    const getPurchaseOrderItemFK = v => {
      if (!v.id || v.id <= 0) {
        let purchaseItemName = ''
        switch (v.type) {
          case INVENTORY_TYPE.MEDICATION: {
            purchaseItemName = 'purchaseOrderMedicationItem'
            break
          }
          case INVENTORY_TYPE.CONSUMABLE: {
            purchaseItemName = 'purchaseOrderConsumableItem'
            break
          }
          case INVENTORY_TYPE.VACCINATION: {
            purchaseItemName = 'purchaseOrderVaccinationItem'
            break
          }
          default: {
            break
          }
        }
        return v[purchaseItemName].purchaseOrderItemFK
      }

      if (values.id) {
        return v.purchaseOrderItemFK
      }
      return undefined
    }

    let deliveryOrderItem = rows
      .filter(row => !(row.isNew && row.isDeleted))
      .map((x, index) => {
        // const itemType = podoOrderType.find((y) => y.value === x.type)
        const {
          purchaseOrderMedicationItem,
          purchaseOrderVaccinationItem,
          purchaseOrderConsumableItem,
          ...restX
        } = x

        let batchNo = Array.isArray(x.batchNo) ? x.batchNo[0] : x.batchNo
        if (!batchNo) batchNo = null
        return {
          ...restX,
          // inventoryTransactionItemFK: 39, // Temporary hard code, will remove once Soe fix the API
          purchaseOrderItemFK: getPurchaseOrderItemFK(x),
          recevingQuantity: x.currentReceivingQty,
          bonusQuantity: x.currentReceivingBonusQty,
          isDeleted: x.isDeleted,
          batchNo,
          expiryDate: x.expiryDate,
          sortOrder: index + 1,
          id: values.id ? x.id : undefined,
        }
      })
    dispatch({
      type: 'deliveryOrderDetails/upsert',
      payload: {
        ...restValues,
        sequence: list ? list.length + 1 : 1,
        // inventoryTransactionFK: 26, // Temporary hard code, will remove once Soe fix the API
        deliveryOrderStatusFK: 1, // Temporary hard code, will remove once Soe fix the API
        deliveryOrderItem,
      },
    }).then(r => {
      if (r) {
        if (onConfirm) onConfirm()
        dispatch({
          type: 'purchaseOrderDetails/refresh',
          payload: {
            id: deliveryOrderDetails.id,
          },
        })

        setTimeout(() => refreshDeliveryOrder(), 500)
      }
    })
  },
})
class DODetails extends PureComponent {
  state = {
    onClickColumn: undefined,
    selectedItem: {},

    ConsumableItemList: [],
    MedicationItemList: [],
    VaccinationItemList: [],

    filterConsumableItemList: [],
    filterMedicationItemList: [],
    filterVaccinationItemList: [],

    // Batch No. #
    expiryDateAvailability: false,
    selectedBatch: {},
    stockMedication: [], // medication
    stockVaccination: [], // vaccination
    stockConsumable: [], // consumable

    filterStockMedication: [], // medication
    filterStockVaccination: [], // vaccination
    filterStockConsumable: [], // consumable

    itemType: podoOrderType,
  }

  componentDidMount = async () => {
    const { mode, dispatch, deliveryOrderDetails } = this.props
    const {
      purchaseOrderDetails: { purchaseOrderOutstandingItem },
    } = deliveryOrderDetails

    const osItemType = podoOrderType.filter(type =>
      purchaseOrderOutstandingItem.some(osItem =>
        Object.prototype.hasOwnProperty.call(osItem, type.prop),
      ),
    )

    this.setState({ itemType: osItemType })

    podoOrderType.forEach(x => {
      this.setState({
        [x.stateName]: deliveryOrderDetails[x.stateName],
      })
    })
    // await this.props.refreshDeliveryOrder()
    if (mode === 'Add') {
      await dispatch({
        type: 'deliveryOrderDetails/setAddNewDeliveryOrder',
      })
      await this.props.setFieldValue(
        'deliveryOrderDate',
        this.props.values.deliveryOrderDate,
      )
      this.manuallyTriggerDirty()
    }
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'global/updateState',
      payload: {
        disableSave: false,
      },
    })
    this.props.dispatch({
      type: 'deliveryOrderDetails/reset',
    })
  }

  manuallyTriggerDirty = () => {
    this.props.dispatch({
      type: 'formik/updateState',
      payload: {
        deliveryOrderDetails: {
          displayName: 'deliveryOrderDetails',
          dirty: true,
        },
      },
    })
  }

  handleOnOrderTypeChanged = async e => {
    const { values, deliveryOrderDetails } = this.props
    const { purchaseOrderDetails } = deliveryOrderDetails
    const { purchaseOrderItem } = purchaseOrderDetails
    const { rows } = values
    const { row, option } = e
    const { value, itemFKName, stateName } = option
    const originItemList = this.state[stateName]

    const { inventoryItemList } = getInventoryItemV2(
      originItemList,
      value,
      itemFKName,
      rows,
      purchaseOrderItem,
      values.id,
    )

    this.setState({
      [`filter${stateName}`]: inventoryItemList,
    })

    row.code = ''
    row.name = ''
    row.uom = ''
    row.orderQty = 0
    row.bonusQty = 0
    row.quantityReceived = 0
    row.totalBonusReceived = 0
    row.currentReceivingQty = 0
    row.currentReceivingBonusQty = 0

    this.setState({ onClickColumn: 'type' })
  }

  handleItemOnChange = (e, type) => {
    const { option, row } = e
    const { value, remainingQty } = option
    if (type === 'code') {
      row.name = value
    } else {
      row.code = value
    }

    row.uom = value
    row.currentReceivingQty = remainingQty
    row.itemFK = value
    row.maxCurrentReceivingQty = remainingQty
    row.maxCurrentReceivingBonusQty = remainingQty

    const { deliveryOrderDetails } = this.props
    const { purchaseOrderDetails } = deliveryOrderDetails
    const { purchaseOrderItem } = purchaseOrderDetails
    const osItem = purchaseOrderItem.find(
      x => x.code === value && x.inventoryItemTypeFK === row.type,
    )

    if (osItem) {
      const defaultBatch = this.getBatchStock(row).find(
        batch => batch.isDefault,
      )
      if (defaultBatch) {
        row.batchNo = defaultBatch.batchNo
        row.batchNoId = defaultBatch.id
        row.expiryDate = defaultBatch.expiryDate
      }
      row.orderQuantity = osItem.orderQuantity
      row.bonusQuantity = osItem.bonusQuantity
      row.quantityReceived = osItem.quantityReceived
      row.totalBonusReceived = osItem.bonusReceived
    }

    this.setState({
      selectedItem: option,
      onClickColumn: 'item',
    })

    // this.forceUpdate()

    return { ...row }
  }

  handleSelectedBatch = e => {
    const { option, row, val } = e

    if (option.length > 0) {
      const { expiryDate, id, batchNo } = option[0]
      row.batchNo = batchNo
      row.expiryDate = expiryDate
      row.batchNoId = id
    } else {
      row.batchNo = val[0]
      row.batchNoId = undefined
      row.expiryDate = undefined
    }
  }

  onCommitChanges = async ({ rows, deleted, changed, added }) => {
    const { dispatch, values, setFieldValue } = this.props

    if (deleted) {
      await dispatch({
        type: 'deliveryOrderDetails/deleteRow',
        payload: deleted[0],
      })
    } else {
      await dispatch({
        type: 'deliveryOrderDetails/upsertRow',
        payload: {
          uid: changed ? Object.keys(changed)[0] : undefined,
          gridRows: rows,
          gridRow: added ? added[0] : undefined,
          remark: values.remark,
        },
      })
    }
    setFieldValue('isDirty', true) // manually trigger dirty

    // return rows
  }

  getItemOptions = (row, filteredStateName, stateName) => {
    const { code, name, isNew } = row
    if (code && name) {
      return this.state[stateName].filter(o => o.value === code)
    }
    return isNew ? this.state[filteredStateName] : this.state[stateName]
  }

  rowOptions = row => {
    if (row.type === INVENTORY_TYPE.MEDICATION) {
      return this.getItemOptions(
        row,
        'filterMedicationItemList',
        'MedicationItemList',
      )
    }
    if (row.type === INVENTORY_TYPE.CONSUMABLE) {
      return this.getItemOptions(
        row,
        'filterConsumableItemList',
        'ConsumableItemList',
      )
    }
    if (row.type === INVENTORY_TYPE.VACCINATION) {
      return this.getItemOptions(
        row,
        'filterVaccinationItemList',
        'VaccinationItemList',
      )
    }
    return []
  }

  getOptions = (stateItemList, storeItemList, row) => {
    const stateArray = stateItemList
    const selectedArray = stateArray.length <= 0 ? storeItemList : stateArray
    return selectedArray.find(o => o.itemFK === row.code).stock
  }

  getBatchStock = row => {
    const {
      MedicationItemList = [],
      ConsumableItemList = [],
      VaccinationItemList = [],
    } = this.props.deliveryOrderDetails

    if (row.code && row.name) {
      if (row.type === INVENTORY_TYPE.MEDICATION) {
        return this.getOptions(
          this.state.MedicationItemList,
          MedicationItemList,
          row,
        )
      }
      if (row.type === INVENTORY_TYPE.CONSUMABLE) {
        return this.getOptions(
          this.state.ConsumableItemList,
          ConsumableItemList,
          row,
        )
      }
      if (row.type === INVENTORY_TYPE.VACCINATION) {
        return this.getOptions(
          this.state.VaccinationItemList,
          VaccinationItemList,
          row,
        )
      }
    }

    return []
  }

  render() {
    const { props } = this
    const {
      footer,
      values,
      theme,
      errors,
      classes,
      isEditable,
      allowAccess,
    } = props
    const { rows } = values

    const tableParas = {
      columns: [
        { name: 'type', title: 'Type' },
        { name: 'code', title: 'Code' },
        { name: 'name', title: 'Name' },
        { name: 'uom', title: 'UOM' },
        { name: 'orderQuantity', title: 'Order Qty' },
        { name: 'bonusQuantity', title: 'Bonus Qty' },
        { name: 'quantityReceived', title: 'Total Received' },
        { name: 'totalBonusReceived', title: 'Total Bonus Received' },
        { name: 'currentReceivingQty', title: 'Current Receiving Qty' },
        {
          name: 'currentReceivingBonusQty',
          title: 'Current Receiving Bonus Qty',
        },
        { name: 'batchNo', title: 'Batch No.' },
        { name: 'expiryDate', title: 'Expiry Date' },
      ],
      columnExtensions: [
        {
          columnName: 'type',
          type: 'select',
          options: () => this.state.itemType,
          onChange: e => {
            if (e.option) {
              this.handleOnOrderTypeChanged(e)
            }
          },
          isDisabled: row => row.id >= 0,
          render: row => {
            if (row.type) {
              return podoOrderType.find(type => type.value === row.type).name
            }
            return null
          },
        },
        {
          columnName: 'code',
          type: 'select',
          labelField: 'code',
          options: row => {
            return this.rowOptions(row)
          },
          onChange: e => {
            if (e.option) {
              this.handleItemOnChange(e, 'code')
            }
          },
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'name',
          type: 'select',
          labelField: 'name',
          options: row => {
            return this.rowOptions(row)
          },
          onChange: e => {
            if (e.option) {
              this.handleItemOnChange(e, 'name')
            }
          },
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'uom',
          type: 'select',
          labelField: 'uom',
          disabled: true,
          options: row => {
            if (row.type === INVENTORY_TYPE.MEDICATION) {
              return this.state.MedicationItemList
            }
            if (row.type === INVENTORY_TYPE.CONSUMABLE) {
              return this.state.ConsumableItemList
            }
            if (row.type === INVENTORY_TYPE.VACCINATION) {
              return this.state.VaccinationItemList
            }
            return []
          },
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'orderQuantity',
          type: 'number',
          format: '0.0',
          disabled: true,
          width: 90,
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'bonusQuantity',
          type: 'number',
          format: '0.0',
          disabled: true,
          width: 90,
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'quantityReceived',
          type: 'number',
          format: '0.0',
          disabled: true,
          width: 120,
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'totalBonusReceived',
          type: 'number',
          format: '0.0',
          disabled: true,
          width: 150,
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'currentReceivingQty',
          type: 'number',
          format: '0.0',
          width: 150,
          isDisabled: row => row.id >= 0 || row.orderQuantity - row.quantityReceived <= 0,
        },
        {
          columnName: 'currentReceivingBonusQty',
          type: 'number',
          format: '0.0',
          width: 200,
          isDisabled: row => row.id >= 0 || row.bonusQuantity - row.totalBonusReceived <= 0,
        },
        {
          columnName: 'batchNo',
          type: 'select',
          mode: 'tags',
          maxSelected: 1,
          labelField: 'batchNo',
          valueField: 'batchNo',
          disableAll: true,
          options: this.getBatchStock,
          onChange: e => {
            this.handleSelectedBatch(e)
          },
          render: row => {
            return <TextField text value={row.batchNo} />
          },
          isDisabled: row => row.id >= 0,
        },
        {
          columnName: 'expiryDate',
          type: 'date',
          isDisabled: row => row.id >= 0 || row.batchNoId,
        },
      ],
      onRowDoubleClick: undefined,
    }

    return (
      // <AuthorizedContext.Provider
      //   value={{
      //     rights:
      //       isEditable === true && allowAccess === true ? 'enable' : 'disable',
      //   }}
      // >
      <div style={{ margin: theme.spacing(2) }}>
        <GridContainer>
          <GridItem xs={12} md={5}>
            <GridContainer>
              <GridItem xs={12}>
                <FastField
                  name='deliveryOrderNo'
                  render={args => {
                    return (
                      <TextField
                        autoFocus
                        label={formatMessage({
                          id: 'inventory.pr.detail.dod.deliveryOrderNo',
                        })}
                        disabled
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <Field
                  name='deliveryOrderDate'
                  render={args => {
                    return (
                      <DatePicker
                        disabled={values.id}
                        label={formatMessage({
                          id: 'inventory.pr.detail.dod.deliveryOrderDate',
                        })}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>
          </GridItem>

          <GridItem xs={12} md={1} />

          <GridItem xs={12} md={5}>
            <GridContainer>
              <GridItem xs={12}>
                <FastField
                  name='remark'
                  render={args => {
                    return (
                      <OutlinedTextField
                        label={formatMessage({
                          id: 'inventory.pr.detail.dod.remarks',
                        })}
                        multiline
                        disabled={values.id}
                        rowsMax={2}
                        rows={2}
                        maxLength={2000}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>
          </GridItem>
        </GridContainer>

        <GridItem xs={12} md={11}>
          <h4 style={{ marginTop: 20, fontWeight: 'bold' }}>
            {formatMessage({
              id: 'inventory.pr.detail.dod.receivingDetails',
            })}
          </h4>
        </GridItem>
        <div style={{ margin: theme.spacing(2) }}>
          {errors.rows && (
            <p className={classes.errorMsgStyle}>{errors.rows}</p>
          )}
          {values.id && (
            <CommonTableGrid
              getRowId={r => r.uid}
              rows={rows}
              schema={receivingDetailsSchema}
              FuncProps={{
                // edit: isEditable,
                pager: false,
              }}
              {...tableParas}
            />
          )}
          {!values.id && (
            <EditableTableGrid
              getRowId={r => r.uid}
              rows={rows}
              schema={receivingDetailsSchema}
              FuncProps={{
                // edit: isEditable,
                pager: false,
              }}
              EditingProps={{
                showAddCommand: values.id ? false : true,
                onCommitChanges: this.onCommitChanges,
              }}
              {...tableParas}
            />
          )}
        </div>
        {footer &&
          footer({
            align: 'center',
            onConfirm: values.id ? undefined : props.handleSubmit,
            confirmBtnText: 'Save',
          })}
      </div>
      // </AuthorizedContext.Provider>
    )
  }
}

export default DODetails
