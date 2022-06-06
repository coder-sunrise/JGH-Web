import React, { PureComponent } from 'react'
import _ from 'lodash'
import { withStyles } from '@material-ui/core'
import Yup from '@/utils/yup'
import { INVENTORY_TYPE, INVENTORY_ADJUSTMENT_STATUS } from '@/utils/constants'
import {
  inventoryAdjustmentStatus,
  podoOrderType,
  inventoryItemListing,
} from '@/utils/codes'
import { fetchAndSaveCodeTable } from '@/utils/codetable'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DatePicker,
  Select,
  EditableTableGrid,
  OutlinedTextField,
  Field,
  ProgressButton,
  notification,
} from '@/components'
import AuthorizedContext from '@/components/Context/Authorized'

const styles = theme => ({
  errorMessage: {
    margin: theme.spacing(2),
    color: '#cf1322',
    fontSize: ' 0.75rem',
    minHeight: '1em',
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontWeight: 400,
    lineHeight: '1em',
    letterSpacing: ' 0.03333em',
  },
})

const inventoryAdjustmentSchema = Yup.object().shape({
  inventoryTypeFK: Yup.number().required(),
  code: Yup.string().required(),
  displayValue: Yup.string().required(),
  adjustmentQty: Yup.number()
    .min(-999999.9, 'Adjustment Qty must between -999,999.9 and 999,999.9')
    .max(999999.9, 'Adjustment Qty must between -999,999.9 and 999,999.9'),
  physicalStock: Yup.number()
    .min(-999999.9, 'Physical stock must between -999,999.9 and 999,999.9')
    .max(999999.9, 'Physical stock must between -999,999.9 and 999,999.9'),
  expiryDate: Yup.string().nullable(),
})

@withFormikExtend({
  mapPropsToValues: ({ inventoryAdjustment }) => {
    const value = inventoryAdjustment.entity || inventoryAdjustment.default
    return {
      ...value,
    }
  },
  validationSchema: Yup.object().shape({
    adjustmentTransactionDate: Yup.date().required(),
    remarks: Yup.string().max(2000, 'Max 2000 characters for remarks.'),
    inventoryAdjustmentItems: Yup.array()
      .compact(v => v.isDeleted)
      .of(inventoryAdjustmentSchema)
      .required('At least one item is required.'),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const {
      inventoryAdjustmentItems,
      stockList,
      inventoryAdjustmentStatusString,
      _inventoryAdjustmentStatusFK,
      ...restValue
    } = values
    const { dispatch, onConfirm } = props
    const list = inventoryAdjustmentItems
    const newInventoryAdjustmentItem = list.map((o, index) => {
      if (o.isDeleted) {
        return {
          ...o,
          // inventoryTypeFK: o.preInventoryTypeFK,
        }
      }
      const type = v => {
        switch (v) {
          case INVENTORY_TYPE.MEDICATION:
            return {
              typeName: 'medication',
              codeName: 'medicationCode',
              nameName: 'medicationName',
              stock: 'medicationStock',
              stockFK: 'medicationStockFK',
              itemFK: 'inventoryMedicationFK',
            }
          case INVENTORY_TYPE.VACCINATION:
            return {
              typeName: 'vaccination',
              codeName: 'vaccinationCode',
              nameName: 'vaccinationName',
              stock: 'vaccinationStock',
              stockFK: 'vaccinationStockFK',
              itemFK: 'inventoryVaccinationFK',
            }
          case INVENTORY_TYPE.CONSUMABLE:
            return {
              typeName: 'consumable',
              codeName: 'consumableCode',
              nameName: 'consumableName',
              stock: 'consumableStock',
              stockFK: 'consumableStockFK',
              itemFK: 'inventoryConsumableFK',
            }
          default:
            return {}
        }
      }
      const getType = type(o.inventoryTypeFK)

      const getBatchNo = () => {
        if (o.batchNo) {
          if (Array.isArray(o.batchNo)) return o.batchNo[0]
          return o.batchNo
        }
        if (o[getType.typeName] && o[getType.typeName].batchNo)
          return o[getType.typeName].batchNo
        return undefined
      }

      const getExpiryDate = () => {
        if (o.expiryDate) {
          return o.expiryDate
        }
        if (o[getType.typeName] && o[getType.typeName][getType.stockFK])
          return o[getType.typeName].expiryDate
        return undefined
      }

      const getStockFK = () => {
        if (o.isManuallyCreated) return undefined
        if (o.stockFK) return o.stockFK
        if (o[getType.typeName]) return o[getType.typeName][getType.stockFK]
        return undefined
      }

      const shareProperty = {
        [getType.itemFK]: o.code || o[getType.typeName][getType.itemFK],
        [getType.stockFK]: getStockFK(),
        batchNo: getBatchNo(),
        expiryDate: getExpiryDate(),
      }

      const getStockObject = () => {
        const stockQty = o.stock || 0
        const adjQty = o.adjustmentQty || 0
        if (o.isManuallyCreated) {
          return {
            ...shareProperty,
            stock: stockQty + adjQty,
          }
        }
        if (values.inventoryAdjustmentStatusFK === 1) return undefined
        if (o.stockFK) return undefined
        if (o[getType.typeName] && o[getType.typeName][getType.stockFK]) {
          return undefined
        }
        return {
          ...shareProperty,
          stock: stockQty + adjQty,
        }
      }

      if (list === inventoryAdjustmentItems) {
        const { restValues, ...val } = o
        const {
          code,
          codeString,
          displayValue,
          displayValueString,
          batchNo,
          batchNoString,
          expiryDate,
          ...value
        } = val
        let newQty = 0
        if (val.stock) newQty += val.stock
        if (val.adjustmentQty) newQty += val.adjustmentQty

        return {
          ...value,
          newQty,
          oldQty: val.stock || 0,
          sortOrder: index + 1,
          id: o.getFromApi ? undefined : o.id,
          [getType.typeName]: {
            ...o[getType.typeName],
            ...shareProperty,
            [getType.itemFK]: o.code || o[getType.typeName][getType.itemFK],
            [getType.codeName]:
              o.codeString || o[getType.typeName][getType.codeName],
            [getType.nameName]:
              o.displayValueString || o[getType.typeName][getType.nameName],
            [getType.stock]:
              values.inventoryAdjustmentStatusFK === 1
                ? undefined
                : getStockObject(),
          },
        }
      }
    })
    dispatch({
      type: 'inventoryAdjustment/upsert',
      payload: {
        ...restValue,
        inventoryAdjustmentStatusFK:
          _inventoryAdjustmentStatusFK === INVENTORY_ADJUSTMENT_STATUS.FINALIZED
            ? INVENTORY_ADJUSTMENT_STATUS.FINALIZED
            : restValue.inventoryAdjustmentStatusFK,
        inventoryAdjustmentStatus:
          _inventoryAdjustmentStatusFK === INVENTORY_ADJUSTMENT_STATUS.FINALIZED
            ? 'Finalized'
            : inventoryAdjustmentStatusString,
        inventoryAdjustmentItems: newInventoryAdjustmentItem,
      },
    }).then(r => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        dispatch({
          type: 'inventoryAdjustment/query',
        })
      }
    })
  },
  displayName: 'InventoryAdjustment',
})
class Detail extends PureComponent {
  state = {
    type: undefined,
    ConsumableItemList: [],
    MedicationItemList: [],
    VaccinationItemList: [],

    filterConsumableItemList: [],
    filterMedicationItemList: [],
    filterVaccinationItemList: [],

    selectedItem: null,
    selectedBatch: null,
    inventoryAdjustmentItems: [],

    stockMedication: [], // medication
    stockVaccination: [], // vaccination
    stockConsumable: [], // consumable

    filterStockMedication: [], // medication
    filterStockVaccination: [], // vaccination
    filterStockConsumable: [], // consumable
    stockList: [],
    editingRowIds: [],
  }

  // eslint-disable-next-line react/sort-comp
  tableParas = {
    columns: [
      {
        name: 'inventoryTypeFK',
        title: 'Type',
      },
      { name: 'codeString', title: 'Code' },
      { name: 'displayValueString', title: 'Name' },
      { name: 'uomDisplayValue', title: 'UOM' },
      { name: 'batchNo', title: 'Batch #' },
      { name: 'expiryDate', title: 'Expiry Date' },
      { name: 'stock', title: 'Batch Stock' },
      { name: 'totalStock', title: 'Total Stock' },
      { name: 'adjustmentQty', title: 'Adjustment Qty' },
      { name: 'physicalStock', title: 'Batch Physical Stock' },
    ],
    columnExtensions: [
      {
        columnName: 'inventoryTypeFK',
        type: 'select',
        options: [
          { value: INVENTORY_TYPE.MEDICATION, name: 'Medication' },
          { value: INVENTORY_TYPE.CONSUMABLE, name: 'Consumable' },
          { value: INVENTORY_TYPE.VACCINATION, name: 'Vaccination' },
        ],
        disabled: true,
      },
      {
        columnName: 'codeString',
        disabled: true,
      },
      {
        columnName: 'displayValueString',
        disabled: true,
        width: 250,
      },
      {
        columnName: 'uomDisplayValue',
        disabled: true,
        width: 90,
      },
      {
        columnName: 'batchNo',
        disabled: true,
      },
      {
        columnName: 'expiryDate',
        type: 'date',
        disabled: true,
        width: 150,
      },
      {
        columnName: 'totalStock',
        type: 'number',
        format: '0.0',
        disabled: true,
        qty: true,
      },
      {
        columnName: 'stock',
        type: 'number',
        format: '0.0',
        disabled: true,
        qty: true,
      },
      {
        columnName: 'adjustmentQty',
        type: 'number',
        format: '0.0',
        qty: true,
        onChange: e => {
          this.handleAdjQuantity(e)
        },
      },
      {
        columnName: 'physicalStock',
        type: 'number',
        format: '0.0',
        qty: true,
        onChange: e => {
          this.handlePhysicStock(e)
        },
      },
    ],
    // columnEditingEnabled: false,
  }

  isDisabled = row => {
    if (row.isManuallyCreated === true) return false
    if (
      row.restValues &&
      (row.restValues.medicationStockFK ||
        row.restValues.consumableStockFK ||
        row.restValues.vaccinationStockFK)
    ) {
      return true
    }
    if (
      row.restValues &&
      (!row.restValues.medicationStockFK ||
        !row.restValues.consumableStockFK ||
        !row.restValues.vaccinationStockFK)
    )
      return false

    return true
  }

  componentDidMount = async () => {
    const { dispatch, values, inventoryAdjustment, setValues } = this.props
    await this.initializeStateItemList()
    if (inventoryAdjustment.entity) {
      const { inventoryAdjustmentItems } = inventoryAdjustment.entity
      if (inventoryAdjustmentItems) {
        const newList = _.orderBy(
          inventoryAdjustmentItems.map(o => {
            const getType = this.type(o.inventoryTypeFK)
            return {
              ...o,
              itemFK: o[getType.typeName][getType.itemFK],
              code: o[getType.typeName][getType.itemFK],
              codeString: o[getType.typeName][getType.codeName],
              displayValue: o[getType.typeName][getType.itemFK],
              displayValueString: o[getType.typeName][getType.nameName],
              batchNo: o[getType.typeName].batchNo,
              expiryDate: o[getType.typeName].expiryDate,
              stockFK: o[getType.typeName][getType.stockFK],
              stock: o.oldQty,
              physicalStock: o.oldQty + o.adjustmentQty,
              restValues: o[getType.typeName],
              totalStock: o.totalStock,
            }
          }),
          ['expiryDate'],
          ['desc'],
        )
        this.setState({ inventoryAdjustmentItems: newList })
        setValues({ ...values, inventoryAdjustmentItems: newList })
      }
    }
  }

  initializeStateItemList = async () => {
    const excludeInactiveCodes = () => {
      const { values } = this.props
      if (!Number.isNaN(values.id)) {
        return undefined
      }
      return true
    }

    await podoOrderType.forEach(x => {
      fetchAndSaveCodeTable(x.ctName, {
        isActive: excludeInactiveCodes(),
      }).then(list => {
        const { inventoryItemList } = inventoryItemListing(
          list,
          x.itemFKName,
          x.stateName,
          x.stockName,
        )
        this.setState({
          [x.stateName]: inventoryItemList,
        })
      })
    })
  }

  getInventoryItems = inventoryTypeFK => {
    const filterActiveCode = ops => {
      return ops
        .filter(o => o.isActive === true)
        .map(o => ({ inventoryTypeFK, ...o }))
    }

    if (inventoryTypeFK === INVENTORY_TYPE.MEDICATION) {
      const activeOptions = filterActiveCode(this.state.MedicationItemList)
      return activeOptions
    }
    if (inventoryTypeFK === INVENTORY_TYPE.VACCINATION) {
      const activeOptions = filterActiveCode(this.state.VaccinationItemList)
      return activeOptions
    }
    if (inventoryTypeFK === INVENTORY_TYPE.CONSUMABLE) {
      const activeOptions = filterActiveCode(this.state.ConsumableItemList)
      return activeOptions
    }
    return []
  }

  additionalFilteringStock = (row, filteredStockOptions, x) => {
    const getType = this.type(row.inventoryTypeFK)
    const value = row[getType.typeName]
      ? row[getType.typeName].batchNo
      : undefined

    const results = filteredStockOptions.filter(
      ({ value: id1 }) => !x.some(({ value: id2 }) => id2 === id1),
    )

    const edittingBatchNo = filteredStockOptions.find(o => o.batchNo === value)

    const edittingBatchNo1 = this.state[getType.stateName].find(
      o => o.id === row.batchNo,
    )

    filteredStockOptions = [...x, edittingBatchNo]

    filteredStockOptions = [...new Set(filteredStockOptions)]
    let temp = []
    if (!filteredStockOptions.includes(undefined)) {
      temp = filteredStockOptions.filter(
        ({ value: id1 }) => !results.some(({ value: id2 }) => id2 === id1),
      )
    }
    filteredStockOptions = [...temp, edittingBatchNo1]

    if (filteredStockOptions.includes(undefined)) {
      return []
    }
    return filteredStockOptions
  }

  stockOptions = row => {
    if (row.inventoryTypeFK === INVENTORY_TYPE.MEDICATION) {
      let array = [...this.state.filterStockMedication]
      let x = array.filter(o => o.inventoryItemFK === row.code)
      return x
    }
    if (row.inventoryTypeFK === INVENTORY_TYPE.VACCINATION) {
      let array = [...this.state.filterStockVaccination]
      let x = array.filter(o => o.inventoryItemFK === row.code)
      return x
    }
    if (row.inventoryTypeFK === INVENTORY_TYPE.CONSUMABLE) {
      let array = [...this.state.filterStockConsumable]
      let x = array.filter(o => o.inventoryItemFK === row.code)
      return x
    }
    return []
  }

  filterStockOption = e => {
    const { row } = e
    if (row.batchNo) {
      const getState = this.type(row.inventoryTypeFK)
      this.setState(prevState => {
        return {
          [getState.filterStateName]: prevState[
            getState.filterStateName
          ].filter(o => o.id !== row.batchNo),
        }
      })
    }
  }

  handleSelectedBatch = e => {
    const { option, row, val } = e
    if (option) {
      this.setState({ selectedItem: undefined })
      if (val && val.length > 0) {
        const [firstIndex] = val
        row.batchNo = val
        row.batchNoString = firstIndex
        if (option.length > 0) {
          const { expiryDate, stock, id } = option[0]
          row.expiryDate = expiryDate
          row.stock = stock
          row.adjustmentQty = undefined
          row.physicalStock = stock
          row.stockFK = id
          row.stockId = id
          row.isManuallyCreated = false
        } else {
          row.stockFK = undefined
          row.isManuallyCreated = true
          row.expiryDate = undefined
          row.stock = undefined
          row.adjustmentQty = undefined
          row.physicalStock = undefined
        }
      } else {
        row.expiryDate = undefined
        row.stock = undefined
        row.adjustmentQty = undefined
        row.physicalStock = undefined
        row.batchNoString = undefined
      }
    }
  }

  type = v => {
    switch (v) {
      case INVENTORY_TYPE.MEDICATION:
        return {
          typeName: 'medication',
          codeName: 'medicationCode',
          nameName: 'medicationName',
          stock: 'medicationStock',
          stockFK: 'medicationStockFK',
          itemFK: 'inventoryMedicationFK',
          stateName: 'stockMedication',
          filterStateName: 'filterStockMedication',
          initialStateName: 'MedicationItemList',
        }
      case INVENTORY_TYPE.VACCINATION:
        return {
          typeName: 'vaccination',
          codeName: 'vaccinationCode',
          nameName: 'vaccinationName',
          stock: 'vaccinationStock',
          stockFK: 'vaccinationStockFK',
          itemFK: 'inventoryVaccinationFK',
          stateName: 'stockVaccination',
          filterStateName: 'filterStockVaccination',
          initialStateName: 'VaccinationItemList',
        }
      case INVENTORY_TYPE.CONSUMABLE:
        return {
          typeName: 'consumable',
          codeName: 'consumableCode',
          nameName: 'consumableName',
          stock: 'consumableStock',
          stockFK: 'consumableStockFK',
          itemFK: 'inventoryConsumableFK',
          stateName: 'stockConsumable',
          filterStateName: 'filterStockConsumable',
          initialStateName: 'ConsumableItemList',
        }
      default:
        return {}
    }
  }

  handleSelectedItem = (selectedItem, stockItem) => {
    const row = {}
    if (selectedItem && stockItem) {
      const { inventoryTypeFK, uom, value, code, name, stock } = selectedItem
      row.inventoryTypeFK = inventoryTypeFK
      row.code = value
      row.displayValue = value
      row.uomDisplayValue = uom
      row.codeString = code
      row.displayValueString = name
      row.batchNo = stockItem.batchNo
      row.batchNoString = stockItem.batchNo
      row.expiryDate = stockItem.expiryDate
      row.stockFK = stockItem.id
      row.stock = stockItem.stock
      row.physicalStock = stockItem.stock
      row.adjustmentQty = undefined
      // row.stockList = stock
      row.itemFK = value
      row.totalStock = stock.reduce((stockCount, s) => {
        return stockCount + s.stock
      }, 0)
    }
    return row
  }

  handlePhysicStock = e => {
    const { row } = e
    row.adjustmentQty = (e.value || 0) - row.stock
  }

  handleAdjQuantity = e => {
    const { row } = e
    row.physicalStock = (e.value || 0) + row.stock
  }

  // eslint-disable-next-line react/sort-comp
  onCommitChanges = ({ rows, deleted }) => {
    const { setValues, values } = this.props
    if (deleted) {
      const deletedRow = rows.find(row => this.getRowId(row) == deleted)
      deletedRow.isDeleted = true
      this.setState({ inventoryAdjustmentItems: rows })
      setValues({ ...values, inventoryAdjustmentItems: rows })
      return rows
    }
  }

  onAddedRowsChange = addedRows => {
    let returnRows = addedRows
    if (returnRows.length > 0 && !_.isEmpty(returnRows[0])) {
      if (this.state.selectedItem) {
        const { option } = this.state.selectedItem
        const { uom, expiryDate, stock } = option
        if (uom) {
          returnRows = returnRows.map(r => ({
            ...r,
            uomDisplayValue: uom,
          }))
        } else {
          returnRows = returnRows.map(r => {
            const { uomDisplayValue } = r
            return {
              ...r,
              uomDisplayValue,
              expiryDate,
              stock,
            }
          })
        }
        if (this.state.selectedBatch && returnRows) {
          this.setState({ selectedItem: undefined })
          returnRows = returnRows.map(r => ({
            ...r,
            stock: this.state.selectedBatch.stock,
            batchNoString: this.state.selectedBatch.batchNo,
          }))
        }
      }
      return returnRows
    }
    returnRows = returnRows.map(o => ({
      inventoryTypeFK: undefined,
      code: undefined,
      displayValue: undefined,
      uomDisplayValue: undefined,
      batchNo: undefined,
      expiryDate: undefined,
      stock: undefined,
      adjustmentQty: undefined,
      physicalStock: undefined,
    }))
    return returnRows
  }

  handleCancel = () => {
    this.props.dispatch({
      type: 'inventoryAdjustment/updateState',
      payload: {
        showModal: false,
      },
    })
  }

  updateStatus = async () => {
    const { setFieldValue, handleSubmit, errors } = this.props
    if (_.isEmpty(errors)) {
      await setFieldValue(
        '_inventoryAdjustmentStatusFK',
        INVENTORY_ADJUSTMENT_STATUS.FINALIZED,
      )
    }
    handleSubmit()
  }

  changeEditingRowIds = editingRowIds => {
    this.setState({ editingRowIds })
  }

  inventoryTypeChanged = e => {
    this.props.setFieldValue('items', null)
    // eslint-disable-next-line no-nested-ternary
    const inventoryType =
      e === INVENTORY_TYPE.MEDICATION
        ? 'Drug'
        : e === INVENTORY_TYPE.CONSUMABLE
        ? 'Consumable'
        : e === INVENTORY_TYPE.VACCINATION
        ? 'Vaccination'
        : null
    this.setState({
      inventoryItems: this.getInventoryItems(e),
      inventoryType: inventoryType,
    })
  }

  inventoryItemChanged = e => {
    const { values, setValues } = this.props
    const { inventoryItems = [], inventoryAdjustmentItems = [] } = this.state
    const selectedItem = inventoryItems.find(x => x.value === e)
    if (!selectedItem) return
    const existsStock = (selectedItem.stock || []).find(x =>
      inventoryAdjustmentItems.find(
        y =>
          !y.isDeleted &&
          this.getRowId(y) ===
            `${selectedItem.inventoryTypeFK}-${selectedItem.value}-${x.id}`,
      ),
    )
    if (existsStock) {
      notification.warning({
        message: `${this.state.inventoryType} already exists in current adjustment.`,
      })
      return
    }
    const list = _.orderBy(selectedItem.stock || [], ['expiryDate'], ['desc'])
      .filter(
        x =>
          !inventoryAdjustmentItems.find(
            y =>
              !y.isDeleted &&
              this.getRowId(y) ===
                `${selectedItem.inventoryTypeFK}-${selectedItem.value}-${x.id}`,
          ),
      )
      .map(stockItem => this.handleSelectedItem(selectedItem, stockItem))
    const newList = [...list, ...inventoryAdjustmentItems]
    this.setState({ inventoryAdjustmentItems: newList })
    setValues({ ...values, inventoryAdjustmentItems: newList })
  }

  getRowId = r => {
    return `${r.inventoryTypeFK}-${r.itemFK}-${r.stockFK}`
  }

  render() {
    const { props } = this
    const { classes, theme, values, footer, errors } = props
    const { inventoryAdjustmentItems } = errors
    const isEditable =
      values.inventoryAdjustmentStatusFK === INVENTORY_ADJUSTMENT_STATUS.DRAFT
    const cfg = {}
    if (!isEditable) {
      cfg.onRowDoubleClick = undefined
    }
    if (
      values.inventoryAdjustmentStatusFK ===
      INVENTORY_ADJUSTMENT_STATUS.FINALIZED
    )
      this.tableParas.columns = this.tableParas.columns.filter(
        col => col.name !== 'totalStock',
      )
    return (
      <React.Fragment>
        <AuthorizedContext.Provider
          value={{
            rights: isEditable ? 'enable' : 'disable',
          }}
        >
          <div style={{ margin: theme.spacing(1) }}>
            <GridContainer>
              <GridItem md={6}>
                <GridItem md={12}>
                  <FastField
                    name='adjustmentTransactionNo'
                    render={args => (
                      <TextField label='Transaction No' disabled {...args} />
                    )}
                  />
                </GridItem>
                <GridItem md={12}>
                  <Field
                    name='adjustmentTransactionDate'
                    render={args => (
                      <DatePicker label='Transaction Date' {...args} />
                    )}
                  />
                </GridItem>

                <GridItem md={12}>
                  <FastField
                    name='inventoryAdjustmentStatusFK'
                    render={args => {
                      return (
                        <Select
                          label='Status'
                          options={inventoryAdjustmentStatus}
                          disabled
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
              </GridItem>
              <GridItem md={6}>
                <GridItem md={12}>
                  <Field
                    name='remarks'
                    render={args => {
                      return (
                        <OutlinedTextField
                          label='Remarks'
                          multiline
                          rowsMax={2}
                          rows={2}
                          maxLength={2000}
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
                <GridContainer>
                  <GridItem md={6}>
                    <Field
                      name='inventoryType'
                      render={args => {
                        return (
                          <Select
                            label='Inventory Type'
                            {...args}
                            options={[
                              {
                                value: INVENTORY_TYPE.MEDICATION,
                                name: 'Medication',
                              },
                              {
                                value: INVENTORY_TYPE.CONSUMABLE,
                                name: 'Consumable',
                              },
                              {
                                value: INVENTORY_TYPE.VACCINATION,
                                name: 'Vaccination',
                              },
                            ]}
                            onChange={this.inventoryTypeChanged}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem md={6}>
                    <Field
                      name='items'
                      render={args => {
                        return (
                          <Select
                            label='Items'
                            {...args}
                            options={this.state.inventoryItems}
                            onChange={this.inventoryItemChanged}
                          />
                        )
                      }}
                    />
                  </GridItem>
                </GridContainer>
              </GridItem>
            </GridContainer>
            {inventoryAdjustmentItems &&
              !Array.isArray(inventoryAdjustmentItems) && (
                <p className={classes.errorMessage}>
                  {inventoryAdjustmentItems}
                </p>
              )}
            <GridContainer>
              <GridItem md={12}>
                <EditableTableGrid
                  style={{
                    marginTop: 10,
                    maxHeight: 'calc(50vh)',
                    overflow: 'scroll',
                  }}
                  // forceRender
                  getRowId={this.getRowId}
                  // TableProps={{maxHeight:'calc(50vh)'}}
                  FuncProps={{
                    edit: isEditable,
                    pager: false,
                    // addNewLabelName: 'New Inventory Adjustment',
                  }}
                  schema={inventoryAdjustmentSchema}
                  EditingProps={{
                    showAddCommand: false,
                    // values.inventoryAdjustmentStatusFK ===
                    // INVENTORY_ADJUSTMENT_STATUS.DRAFT,
                    onCommitChanges: this.onCommitChanges,
                    onAddedRowsChange: this.onAddedRowsChange,
                    onEditingRowIdsChange: this.changeEditingRowIds,
                    editingRowIds: this.state.editingRowIds,
                  }}
                  {...cfg}
                  rows={this.state.inventoryAdjustmentItems}
                  {...this.tableParas}
                />
              </GridItem>
            </GridContainer>
            {footer &&
              footer({
                onConfirm: props.handleSubmit,
                confirmBtnText: 'Save',
                extraButtons: (
                  <ProgressButton
                    color='info'
                    type='submit'
                    onClick={this.updateStatus}
                  >
                    Finalize
                  </ProgressButton>
                ),
              })}
          </div>
        </AuthorizedContext.Provider>
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Detail)
