import React, { PureComponent } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import {
    FastEditableTableGrid,
    GridContainer,
    GridItem,
  } from '@/components'
import {
  podoOrderType,
  getInventoryItem,
  inventoryItemListing,
} from '@/utils/codes'
import { fetchAndSaveCodeTable } from '@/utils/codetable'
import { roundTo } from '@/utils/utils'

const purchaseRequestDetailsSchema = Yup.object().shape({
  type: Yup.number().required(),
  code: Yup.number().required(),
  name: Yup.number().required(),
  qty: Yup.number()
    .min(1, 'Order Quantity must be greater than or equal to 1')
    .required(),
})

class Grid extends PureComponent {
  constructor(props) {
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

    await podoOrderType.map(x => {
      fetchAndSaveCodeTable(x.ctName, {
        isActive: excludeInactiveCodes(),
      }).then(list => {
        const { inventoryItemList } = inventoryItemListing(
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
  }

  handleOnOrderTypeChanged = async e => {
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

    row.type = value
    row.itemTypeFK = value
    row.code = ''
    row.itemCode = ''
    row.codeString = ''
    row.name = ''
    row.itemFK = ''
    row.itemName = ''
    row.nameString = ''
    row.uom = ''
    row.uomString = ''
    row.qty = 0

    this.setState({ onClickColumn: 'type' })
  }

  handleItemOnChange = (e, type) => {
    const { option, row } = e
    if (type === 'code') {
      row.name = option.value
    } else {
      row.code = option.value
    }
    row.itemFK = option.itemFK
    row.codeString = option.code
    row.itemCode = option.code
    row.nameString = option.name
    row.itemName = option.name
    row.uom = option.value
    row.uomString = option.uom
    // row.qty = 0
    this.setState({
      selectedItem: option,
      onClickColumn: 'item',
    })
  }

  onAddedRowsChange = addedRows => {
    let newAddedRows = addedRows
    if (addedRows.length > 0) {
      if (!addedRows.isFocused) {
        const { onClickColumn, selectedItem } = this.state
        this.setState({ onClickColumn: undefined })
        newAddedRows = addedRows.map(row => ({
          ...row,
          itemFK: selectedItem.value,
          qty: 0,
        }))
      } else {
        // Initialize new generated row
        this.setState({ onClickColumn: undefined })
        newAddedRows = addedRows.map(row => ({
          ...row,
          qty: 0,
        }))
      }
    }
    return newAddedRows
  }

  onCommitChanges = values => ({ rows, added, changed, deleted }) => {
    const { dispatch, propertyChange } = this.props
    propertyChange()
    if (deleted) {
      dispatch({
        type: 'purchaseRequestDetails/deleteRow',
        payload: deleted[0],
      })
    } else if (added || changed) {
      dispatch({
        type: 'purchaseRequestDetails/upsertRow',
        payload: {
          purchaseRequest: values.purchaseRequest,
          rows,
        },
      })
    }
    return rows
  }

  rowOptions = row => {
    const { purchaseRequestDetails } = this.props
    const getUnusedItem = stateName => {
      const unusedInventoryItem = _.differenceBy(
        this.state[stateName],
        purchaseRequestDetails.rows.filter(o => !o.isDeleted),
        'itemFK',
      )
      return unusedInventoryItem
    }

    const getCurrentOptions = (stateName, filteredOptions) => {
      const selectedItem = this.state[stateName].find(
        o => o.itemFK === row.itemFK,
      )
      let currentOptions = filteredOptions
      if (selectedItem) {
        currentOptions = [...filteredOptions, selectedItem]
      }
      return currentOptions
    }

    const filterActiveCode = ops => {
      return ops.filter(o => o.isActive === true)
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
    if (row.type === 3) {
      const filteredOptions = getUnusedItem('VaccinationItemList')
      const activeOptions = filterActiveCode(filteredOptions)
      const currentOptions = getCurrentOptions(
        'VaccinationItemList',
        activeOptions,
      )
      return row.uid ? currentOptions : activeOptions
    }
    if (row.type === 2) {
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

  render() {
    const { values, isEditable, dispatch } = this.props
    const { rows } = values
    const tableParas = {
      columns: [
        { name: 'type', title: 'Type' },
        { name: 'code', title: 'Code' },
        { name: 'name', title: 'Name' },
        { name: 'uom', title: 'UOM' },
        { name: 'qty', title: 'Request Qty' },
      ],
      columnExtensions: [
        {
          columnName: 'type',
          type: 'select',
          options: podoOrderType,
          sortingEnabled: false,
          disabled: !isEditable,
          onChange: e => {
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
          disabled: !isEditable,
          options: row => {
            return this.rowOptions(row)
          },
          onChange: e => {
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
          disabled: !isEditable,
          options: row => {
            return this.rowOptions(row)
          },
          onChange: e => {
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
          options: row => {
            if (row.type === 1) {
              return this.state.MedicationItemList
            }
            if (row.type === 2) {
              return this.state.ConsumableItemList
            }
            if (row.type === 3) {
              return this.state.VaccinationItemList
            }
            return []
          },
        },
        {
          columnName: 'qty',
          type: 'number',
          precision: 1,
          disabled: !isEditable,
        },
      ],
      onRowDoubleClick: undefined,
    }
    return (
      <GridContainer style={{ paddingRight: 20 }}>
        <GridItem xs={4} md={12}>
          <FastEditableTableGrid
            getRowId={r => r.uid}
            rows={rows}
            schema={purchaseRequestDetailsSchema}
            forceRenderDuration={5000}
            FuncProps={{
              pager: false,
            }}
            EditingProps={{
              showCommandColumn: isEditable,
              showAddCommand: isEditable,
              // showEditCommand: isEditable,
              // showDeleteCommand: isEditable,
              onCommitChanges: this.onCommitChanges(values),
              onAddedRowsChange: this.onAddedRowsChange,
            }}
            {...tableParas}
          />
        </GridItem>
      </GridContainer>
    )
  }
}

export default Grid
