import React, { PureComponent } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import { EditableTableGrid, GridContainer, GridItem } from '@/components'
import {
  podoOrderType,
  getInventoryItem,
  getInventoryItemList,
  fetchAndSaveCodeTable,
} from '@/utils/codes'

// let commitCount = 2200 // uniqueNumber

const receivingDetailsSchema = Yup.object().shape({
  type: Yup.number().required(),
  code: Yup.number().required(),
  // name: Yup.string().required(),
  orderQuantity: Yup.number()
    .min(1, 'Order Quantity nust be greater than or equal to 1')
    .required(),
  // bonusReceived: Yup.number()
  //   .min(0, 'Bonus Quantity nust be greater than or equal to 0')
  //   .required(),
})

class Grid extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      onClickColumn: undefined,
      selectedItem: {},

      ConsumableItemList: [],
      MedicationItemList: [],
      VaccinationItemList: [],

      filterConsumableItemList: [],
      filterMedicationItemList: [],
      filterVaccinationItemList: [],
    }
  }

  componentDidMount = () => {
    this.initializeStateItemList()
  }

  initializeStateItemList = async () => {
    const { dispatch } = this.props

    const excludeInactiveCodes = () => {
      const { values } = this.props
      if (!Number.isNaN(values.id)) {
        return undefined
      }
      return true
    }

    await podoOrderType.map((x) => {
      fetchAndSaveCodeTable(x.ctName, {
        // excludeInactiveCodes: excludeInactiveCodes(),
        // excludeInactiveCodes: false,
        isActive: excludeInactiveCodes(),
      }).then((list) => {
        const { inventoryItemList } = getInventoryItemList(
          list,
          x.itemFKName,
          x.stateName,
        )
        this.setState({
          [x.stateName]: inventoryItemList,
        })
      })
      return null
    })

    // dispatch({
    //   // force current edit row components to update
    //   type: 'global/updateState',
    //   payload: {
    //     commitCount: (commitCount += 1),
    //   },
    // })
  }

  handleOnOrderTypeChanged = async (e) => {
    const { dispatch, values } = this.props
    const { rows } = values
    const { row, option } = e
    const { value, itemFKName, stateName } = option
    const originItemList = this.state[stateName]

    const { inventoryItemList } = getInventoryItem(
      originItemList,
      value,
      itemFKName,
      rows,
    )

    this.setState({
      [`filter${stateName}`]: inventoryItemList,
    })

    // row.code = ''
    // row.name = ''
    // row.uom = ''
    // row.orderQuantity = 0
    // row.bonusReceived = 0
    // row.totalQuantity = 0
    // row.totalReceived = 0
    // row.unitPrice = 0
    // row.totalPrice = 0

    this.setState({ onClickColumn: 'type' })

    // dispatch({
    //   // force current edit row components to update
    //   type: 'global/updateState',
    //   payload: {
    //     commitCount: (commitCount += 1),
    //   },
    // })
  }

  handleItemOnChange = (e, type) => {
    const { option, row } = e
    if (type === 'code') {
      row.name = option.value
    } else {
      row.code = option.value
    }
    row.codeString = option.code
    row.nameString = option.name
    row.unitOfMeasurement = option.uom
    row.unitPrice = option.sellingPrice
    row.uom = option.value
    row.orderQuantity = 0
    row.bonusReceived = 0
    row.totalQuantity = 0
    row.totalReceived = 0
    this.setState({
      selectedItem: option,
      onClickColumn: 'item',
    })

    // this.props.dispatch({
    //   // force current edit row components to update
    //   type: 'global/updateState',
    //   payload: {
    //     commitCount: (commitCount += 1),
    //   },
    // })
    // return { ...row }
  }

  onAddedRowsChange = (addedRows) => {
    let newAddedRows = addedRows
    if (addedRows.length > 0) {
      if (!addedRows.isFocused) {
        const { onClickColumn, selectedItem } = this.state
        let tempRow = addedRows[0]
        let tempOrderQty = tempRow.orderQuantity
        let tempBonusQty = tempRow.bonusReceived
        let tempTotalQty = tempRow.totalQuantity
        let tempQuantityReceived = tempRow.totalReceived
        let tempUnitPrice = tempRow.unitPrice
        let tempTotalPrice = tempRow.totalPrice

        const calcTotalQty = () => {
          if (tempOrderQty >= 0 && tempBonusQty >= 0) {
            return tempOrderQty + tempBonusQty
          }
          return undefined
        }

        const calcTotalPrice = () => {
          if (tempOrderQty >= 1 && tempUnitPrice) {
            return tempOrderQty * tempUnitPrice
          }
          return undefined
        }

        if (onClickColumn === 'type') {
          // type logic here
        } else if (onClickColumn === 'item') {
          tempUnitPrice = selectedItem.sellingPrice
          tempTotalPrice = selectedItem.sellingPrice
        } else {
          tempTotalQty = calcTotalQty() || 0
          tempTotalPrice = calcTotalPrice() || tempUnitPrice
        }

        this.setState({ onClickColumn: undefined })

        newAddedRows = addedRows.map((row) => ({
          ...row,
          itemFK: selectedItem.value,
          totalQuantity: tempTotalQty,
          unitPrice: tempUnitPrice,
          totalPrice: tempTotalPrice,
        }))
      } else {
        // Initialize new generated row
        this.setState({ onClickColumn: undefined })
        newAddedRows = addedRows.map((row) => ({
          ...row,
          orderQuantity: 0,
          bonusReceived: 0,
          totalQuantity: 0,
          totalReceived: 0,
          unitPrice: 0,
          totalPrice: 0,
          isFocused: true,
        }))
      }
    }
    return newAddedRows
  }

  onCommitChanges = (values) => ({ rows, added, changed, deleted }) => {
    const { dispatch, calcPurchaseOrderSummary } = this.props

    if (deleted) {
      dispatch({
        type: 'purchaseOrderDetails/deleteRow',
        payload: deleted[0],
      })
    } else if (added || changed) {
      dispatch({
        type: 'purchaseOrderDetails/upsertRow',
        payload: {
          purchaseOrder: values,
          rows,
        },
      })
    }

    setTimeout(() => calcPurchaseOrderSummary(), 500)
    return rows
  }

  rowOptions = (row) => {
    const { purchaseOrderDetails } = this.props
    const getUnusedItem = (stateName) => {
      const unusedInventoryItem = _.differenceBy(
        this.state[stateName],
        purchaseOrderDetails.rows.filter((o) => !o.isDeleted),
        'itemFK',
      )
      return unusedInventoryItem
    }

    const getCurrentOptions = (stateName, filteredOptions) => {
      const selectedItem = this.state[stateName].find(
        (o) => o.itemFK === row.itemFK,
      )
      let currentOptions = filteredOptions
      if (selectedItem) {
        currentOptions = [
          ...filteredOptions,
          selectedItem,
        ]
      }
      return currentOptions
    }

    const filterActiveCode = (ops) => {
      return ops.filter((o) => o.isActive === true)
    }
    if (row.type === 1) {
      const filteredOptions = getUnusedItem('MedicationItemList')
      const activeOptions = filterActiveCode(filteredOptions)
      const currentOptions = getCurrentOptions(
        'MedicationItemList',
        activeOptions,
      )
      return row.uid ? currentOptions : activeOptions
    }
    if (row.type === 2) {
      const filteredOptions = getUnusedItem('VaccinationItemList')
      const activeOptions = filterActiveCode(filteredOptions)
      const currentOptions = getCurrentOptions(
        'VaccinationItemList',
        activeOptions,
      )
      return row.uid ? currentOptions : activeOptions
    }
    if (row.type === 3) {
      const filteredOptions = getUnusedItem('ConsumableItemList')
      const activeOptions = filterActiveCode(filteredOptions)
      const currentOptions = getCurrentOptions(
        'ConsumableItemList',
        activeOptions,
      )
      return row.uid ? currentOptions : activeOptions
    }
    return []
  }

  calculateTotalPriceAndTotalQuantity = (e) => {
    const { row } = e
    if (row) {
      const { orderQuantity, unitPrice } = row
      row.totalPrice = orderQuantity * unitPrice
      row.totalQuantity = orderQuantity
    }
  }

  render () {
    // const { purchaseOrderItems } = this.props
    const { values, isEditable, dispatch } = this.props
    const { rows } = values
    // console.log('banana', rows)

    // if (rows && rows.length > 1) {
    //   dispatch({
    //     // force current edit row components to update
    //     type: 'global/updateState',
    //     payload: {
    //       commitCount: (commitCount += 1),
    //     },
    //   })
    // }

    const tableParas = {
      columns: [
        { name: 'type', title: 'Type' },
        { name: 'code', title: 'Code' },
        { name: 'name', title: 'Name' },
        { name: 'unitOfMeasurement', title: 'UOM' },
        { name: 'orderQuantity', title: 'Order Qty' },
        { name: 'bonusReceived', title: 'Bonus Qty' },
        { name: 'totalQuantity', title: 'Total Qty' }, // Disabled, auto calc
        { name: 'totalReceived', title: 'Total Received' },
        { name: 'unitPrice', title: 'Unit Price' },
        { name: 'totalPrice', title: 'Total Price' }, // Disabled, auto calc
      ],
      columnExtensions: [
        {
          columnName: 'type',
          type: 'select',
          options: podoOrderType,
          sortingEnabled: false,
          onChange: (e) => {
            if (e.option) {
              this.handleOnOrderTypeChanged(e)
            }
          },
        },
        {
          columnName: 'code',
          type: 'select',
          labelField: 'code',
          sortingEnabled: false,
          options: (row) => {
            return this.rowOptions(row)
          },
          onChange: (e) => {
            if (e.option) {
              this.handleItemOnChange(e, 'code')
            }
          },
        },
        {
          columnName: 'name',
          type: 'select',
          labelField: 'name',
          sortingEnabled: false,
          options: (row) => {
            return this.rowOptions(row)
          },
          onChange: (e) => {
            if (e.option) {
              this.handleItemOnChange(e, 'name')
            }
          },
        },
        {
          columnName: 'uom',
          type: 'select',
          labelField: 'uom',
          disabled: true,
          sortingEnabled: false,
          options: (row) => {
            if (row.type === 1) {
              return this.state.MedicationItemList
            }
            if (row.type === 2) {
              return this.state.VaccinationItemList
            }
            if (row.type === 3) {
              return this.state.ConsumableItemList
            }
            return []
          },
        },
        {
          columnName: 'orderQuantity',
          type: 'number',
          precision: 1,
          onChange: this.calculateTotalPriceAndTotalQuantity,
        },
        {
          columnName: 'bonusReceived',
          type: 'number',
          format: '0.0',
          disabled: true,
        },
        {
          columnName: 'totalQuantity',
          type: 'number',
          format: '0.0',
          disabled: true,
        },
        {
          columnName: 'totalReceived',
          type: 'number',
          format: '0.0',
          disabled: true,
        },
        {
          columnName: 'unitPrice',
          type: 'number',
          currency: true,
          onChange: this.calculateTotalPriceAndTotalQuantity,
        },
        {
          columnName: 'totalPrice',
          type: 'number',
          currency: true,
          disabled: true,
        },
      ],
      onRowDoubleClick: undefined,
    }
    return (
      <GridContainer style={{ paddingRight: 20 }}>
        <GridItem xs={4} md={12}>
          <EditableTableGrid
            getRowId={(r) => r.uid}
            rows={rows}
            schema={receivingDetailsSchema}
            FuncProps={{
              edit: isEditable,
              pager: false,
            }}
            EditingProps={{
              showAddCommand: isEditable,
              showEditCommand: isEditable,
              showDeleteCommand: isEditable,
              onCommitChanges: this.onCommitChanges(values.purchaseOrder),
              onAddedRowsChange: this.onAddedRowsChange,
            }}
            {...tableParas}
          />
        </GridItem>
        {/* <GridItem xs={8} md={1} /> */}
      </GridContainer>
    )
  }
}

export default Grid
