import React, { Fragment } from 'react'
import Delete from '@material-ui/icons/Delete'
import {
  Field,
  FastField,
  GridContainer,
  GridItem,
  CodeSelect,
  Button,
  Tabs,
  CommonTableGrid,
  Popconfirm,
  Tooltip,
  notification,
  NumberInput,
  Switch,
  SizeContainer,
} from '@/components'
import { getUniqueId,calculateAdjustAmount } from '@/utils/utils'
import { isNumber } from 'util'
import { InventoryTypes, visitOrderTemplateItemTypes } from '@/utils/codes'
import { ITEM_TYPE } from '@/utils/constants'
import Authorized from '@/utils/Authorized'
import { currencySymbol } from '@/utils/config'
import _ from 'lodash'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
import { Table } from '@devexpress/dx-react-grid-material-ui'
const CPSwitch = label => args => {
  if (!args.field.value) {
    args.field.value = 'ExactAmount'
  }

  return (
    <Switch
      checkedChildren='$'
      checkedValue='ExactAmount'
      unCheckedChildren='%'
      unCheckedValue='Percentage'
      label={label}
      {...args}
    />
  )
}
const CPNumber = (label, type) => args => {
  return (
    <NumberInput
      label={label}
      currency={type === 'ExactAmount'}
      percentage={type === 'Percentage'}
      min={0}
      defaultValue='0.00'
      {...args}
    />
  )
}

class InventoryItemList extends React.Component {
  state = {
    currentTab: 1,
  }

  addItemToRows = newRow => {
    const { setFieldValue, values, dispatch } = this.props
    let newRows = []
    if (Array.isArray(newRow)) {
      newRows = [...values.rows, ...newRow]
    } else {
      newRows = [...values.rows, newRow]
    }

    setFieldValue('rows', newRows)

    // Reset field
    setFieldValue('tempSelectedItem', undefined)
    setFieldValue('tempSelectedItemFK', undefined)
    dispatch({
      type: 'global/incrementCommitCount',
    })
  }

  dislayExistingItem = (array, fieldName) => {
    if (array.length > 0) {
      return (
        <Fragment>
          {array.map(item => (
            <li>
              <b>{item[fieldName]}</b>
            </li>
          ))}
        </Fragment>
      )
    }

    return null
  }

  showConfirmationBox = (existingItemArray, newItemArray) => {
    const { dispatch } = this.props

    const medicationArray = existingItemArray.filter(
      item => item.inventoryMedicationFK,
    )
    const consumableArray = existingItemArray.filter(
      item => item.inventoryConsumableFK,
    )
    const vaccinationArray = existingItemArray.filter(
      item => item.inventoryVaccinationFK,
    )
    const serviceArray = existingItemArray.filter(
      item => item.serviceCenterServiceFK,
    )

    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: `Order set item(s) will not be added. Item(s) are either already in the list or has been deactivated.`,
        alignContent: 'left',
        additionalInfo: (
          <div style={{ fontSize: '1.3em' }}>
            <ul style={{ listStylePosition: 'inside' }}>
              {this.dislayExistingItem(medicationArray, 'medicationName')}
              {this.dislayExistingItem(consumableArray, 'consumableName')}
              {this.dislayExistingItem(vaccinationArray, 'vaccinationName')}
              {this.dislayExistingItem(serviceArray, 'serviceName')}
            </ul>
          </div>
        ),
        onConfirmSave: () => {
          this.addOrderSetItemToRows(newItemArray)
        },
      },
    })
  }

  addOrderSetItemToRows = newItemArray => {
    const newItems = newItemArray.map(item => {
      const itemFieldName = InventoryTypes.filter(x => x.value === item.type)[0]
      const typeFieldName = item[itemFieldName.field]
      const total = _.round(item.quantity * item.unitPrice, 2)
      const newItemRow = {
        uid: getUniqueId(),
        type: itemFieldName.value,
        [itemFieldName.itemFKName]:
          item.type === ITEM_TYPE.SERVICE
            ? item.serviceCenterServiceFK
            : typeFieldName.id,
        itemFK:
          item.type === ITEM_TYPE.SERVICE
            ? item.serviceCenterServiceFK
            : typeFieldName.id,
        unitPrice: item.unitPrice,
        code: typeFieldName.code,
        name: typeFieldName.displayValue,

        itemValueType: 'Percentage',
        itemValue: 0,
        quantity: item.quantity,
        total: total,
        totalAftAdj: total,
        adjValue: 0,
        adjAmt: 0,
        adjType:'Percentage',
        isMinus: true,
        isExactAmount: false,
      }
      return newItemRow
    })
    this.addItemToRows(newItems)
  }

  checkOrderSetItemIsExisted = (orderSetItemArray, existingRows, type) => {
    let existingItem = []
    const filteredRows = existingRows
      .filter(row => !row.isDeleted && row.type === type)
      .map(row => row.itemFK)

    const updatedItemArray = orderSetItemArray.map(row => {
      const currentType = visitOrderTemplateItemTypes.find(
        itemType => itemType.id === type,
      )
      if (
        filteredRows.includes(row[currentType.itemFKName]) ||
        !row[currentType.keyName].isActive
      ) {
        existingItem.push(row)
        return null
      }
      return {
        ...row,
        type,
      }
    })

    return [existingItem, updatedItemArray]
  }

  onClickAdd = type => {
    const { currentTab } = this.state
    const { values } = this.props
    const { tempSelectedItem, rows, tempSelectedItemFK } = values
    if (tempSelectedItemFK === undefined) return

    let itemFieldName
    let existingItem = []
    let newItem = []
    if (currentTab === ITEM_TYPE.ORDERSET) {
      const {
        medicationOrderSetItem,
        consumableOrderSetItem,
        vaccinationOrderSetItem,
        serviceOrderSetItem,
      } = tempSelectedItem

      const [
        existingMedicationItem,
        newMedicationItem,
      ] = this.checkOrderSetItemIsExisted(
        medicationOrderSetItem,
        rows,
        ITEM_TYPE.MEDICATION,
      )

      existingItem.push(...existingMedicationItem)
      newItem.push(...newMedicationItem.filter(item => item !== null))

      const [
        existingConsumableItem,
        newConsumableItem,
      ] = this.checkOrderSetItemIsExisted(
        consumableOrderSetItem,
        rows,
        ITEM_TYPE.CONSUMABLE,
      )

      existingItem.push(...existingConsumableItem)
      newItem.push(...newConsumableItem.filter(item => item !== null))

      const [
        existingVaccinationItem,
        newVaccinationItem,
      ] = this.checkOrderSetItemIsExisted(
        vaccinationOrderSetItem,
        rows,
        ITEM_TYPE.VACCINATION,
      )

      existingItem.push(...existingVaccinationItem)
      newItem.push(...newVaccinationItem.filter(item => item !== null))

      const [
        existingServiceItem,
        newServiceItem,
      ] = this.checkOrderSetItemIsExisted(
        serviceOrderSetItem,
        rows,
        ITEM_TYPE.SERVICE,
      )

      existingItem.push(...existingServiceItem)
      newItem.push(...newServiceItem.filter(item => item !== null))

      if (existingItem.length > 0) {
        this.showConfirmationBox(existingItem, newItem)
      } else {
        this.addOrderSetItemToRows(newItem)
      }
    } else {
      const isExisted = rows
        .filter(row => !row.isDeleted && row.type === currentTab)
        .map(row => row.itemFK)
        .includes(tempSelectedItemFK)

      if (isExisted) {
        notification.error({ message: 'Item is already in the list' })
        return
      }

      itemFieldName = InventoryTypes.filter(x => x.ctName === type)[0]
      const unitPrice = itemFieldName.value === ITEM_TYPE.SERVICE
      ? tempSelectedItem.unitPrice
      : tempSelectedItem.sellingPrice
      let newItemRow = {
        uid: getUniqueId(),
        type: itemFieldName.value,
        [itemFieldName.itemFKName]: tempSelectedItemFK,
        itemFK: tempSelectedItemFK,
        unitPrice: unitPrice,
        code: tempSelectedItem.code,
        name: tempSelectedItem.displayValue,
        itemValueType: 'Percentage',
        quantity: 1,
        itemValue: 0,
        total: unitPrice,
        totalAftAdj: unitPrice,
        adjValue: 0,
        adjAmt: 0,
        adjType:'Percentage',
        isMinus: true,
        isExactAmount: false,
      }
      this.addItemToRows(newItemRow)
    }
  }

  onItemSelect = (e, option, type) => {
    const { setFieldValue } = this.props
    if (option) {
      setFieldValue('tempSelectedItem', option)
    }
  }

  addContent = (type, accessRight) => {
    const isDisabled = this.props.includeOrderSet && accessRight === 'disable'
    return (
      <GridContainer>
        <GridItem xs={8}>
          <FastField
            name='tempSelectedItemFK'
            render={args => {
              return (
                <CodeSelect
                  labelField='displayValue'
                  valueField={
                    type === 'ctservice' ? 'serviceCenter_ServiceId' : 'id'
                  }
                  onChange={(e, option) => this.onItemSelect(e, option, type)}
                  code={type}
                  renderDropdown={option => {
                    let {
                      code,
                      displayValue,
                      sellingPrice = 0,
                      dispensingUOM,
                      uom = {},
                      unitPrice = 0,
                      totalPrice = 0,
                    } = option
                    let uomName = ''

                    if (
                      type === 'inventorymedication' ||
                      type === 'inventoryvaccination'
                    ) {
                      uomName = dispensingUOM?.name
                    } else if (type === 'inventoryconsumable') {
                      uomName = uom.name
                    } else if (type === 'ctservice') {
                      const optDisplay = `${displayValue} - ${code} (${currencySymbol}${unitPrice.toFixed(
                        2,
                      )})`
                      return <span>{optDisplay}</span>
                    } else if (type === 'inventoryorderset') {
                      const optDisplay = `${displayValue} - ${code} (${currencySymbol}${totalPrice.toFixed(
                        2,
                      )}) `
                      return <span>{optDisplay}</span>
                    }

                    const optDisplay = `${displayValue} - ${code} (${currencySymbol}${sellingPrice.toFixed(
                      2,
                    )} / ${uomName})`

                    return <span>{optDisplay}</span>
                  }}
                  localFilter={item =>
                    (type !== 'inventoryconsumable' &&
                      type !== 'inventorymedication') ||
                    item.orderable
                  }
                  disabled={isDisabled}
                  {...args}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs={4}>
          <Button
            color='primary'
            // disabled={this.props.values.tempSelectedItemFK === undefined}
            disabled={isDisabled}
            onClick={() => this.onClickAdd(type)}
          >
            Add
          </Button>
        </GridItem>
      </GridContainer>
    )
  }

  onDeleteClick = row => {
    const { values, setFieldValue, dispatch } = this.props
    const newRows = values.rows.map(item => {
      if (item.itemFK === row.itemFK && item.type === row.type) {
        return {
          ...item,
          isDeleted: true,
        }
      }
      return { ...item }
    })
    setFieldValue('rows', newRows)
    dispatch({
      type: 'global/incrementCommitCount',
    })
  }

  onTabChange = tabId => {
    const { setFieldValue } = this.props
    setFieldValue('tempSelectedItemFK', undefined)
    this.setState({
      currentTab: parseInt(tabId, 10),
    })
  }

  filterTabOnAccessRight = tabs => {
    if (this.props.includeOrderSet) {
      return tabs.filter(o => {
        if (!o.accessRight || o.accessRight === 'hidden') return false
        return true
      })
    }
    return tabs
  }

  getAccessRight = accessRightName => {
    const accessRight = Authorized.check(accessRightName)
    if (!accessRight) return false
    return accessRight.rights
  }

  getOptions = () => {
    const medicationAccessRight = this.getAccessRight(
      'settings.templates.visitordertemplate.medication',
    )
    const consumableAccessRight = this.getAccessRight(
      'settings.templates.visitordertemplate.consumable',
    )
    const vaccinationAccessRight = this.getAccessRight(
      'settings.templates.visitordertemplate.vaccination',
    )
    const serviceAccessRight = this.getAccessRight(
      'settings.templates.visitordertemplate.service',
    )
    const ordersetAccessRight = this.getAccessRight(
      'settings.templates.visitordertemplate.orderset',
    )
    const commonOptions = [
      {
        id: ITEM_TYPE.MEDICATION,
        name: 'Medication',
        content: this.addContent('inventorymedication', medicationAccessRight),
        accessRight: medicationAccessRight,
      },
      {
        id: ITEM_TYPE.CONSUMABLE,
        name: 'Consumable',
        content: this.addContent('inventoryconsumable', consumableAccessRight),
        accessRight: consumableAccessRight,
      },
      {
        id: ITEM_TYPE.VACCINATION,
        name: 'Vaccination',
        content: this.addContent(
          'inventoryvaccination',
          vaccinationAccessRight,
        ),
        accessRight: vaccinationAccessRight,
      },
      {
        id: ITEM_TYPE.SERVICE,
        name: 'Service',
        content: this.addContent('ctservice', serviceAccessRight),
        accessRight: serviceAccessRight,
      },
    ]

    if (this.props.includeOrderSet) {
      return [
        ...commonOptions,
        {
          id: ITEM_TYPE.ORDERSET,
          name: 'Order Set',
          content: this.addContent('inventoryorderset', ordersetAccessRight),
          accessRight: ordersetAccessRight,
        },
      ]
    }

    const removedAccessRightOptions = commonOptions.map(option => {
      const { accessRight, ...restFields } = option
      return {
        ...restFields,
      }
    })

    return removedAccessRightOptions
  }

  getColumns = () => {
    const commonColumns = [
      { name: 'type', title: 'Type' },
      { name: 'name', title: 'Item' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'action', title: 'Actions' },
    ]

    if (this.props.includeOrderSet) {
      commonColumns.splice(2, 0, {
        name: 'quantity',
        title: 'Quantity',
      })
      commonColumns.splice(commonColumns.length - 1, 0, {
        name: 'total',
        title: 'Total Bef. Adj.',
      })
      commonColumns.splice(commonColumns.length - 1, 0, {
        name: 'adjAmt',
        title: 'Adjustment',
      })
      commonColumns.splice(commonColumns.length - 1, 0, {
        name: 'totalAftAdj',
        title: 'Total Aft. Adj.',
      })
    } else {
      commonColumns.splice(commonColumns.length - 1, 0, {
        name: 'cpAmount',
        title: 'Co-Pay Amount',
      })
    }

    return commonColumns
  }

  onAdjustmentConditionChange = index => {
    const { setFieldValue, values } = this.props
    const { rows = [] } = values
    const { adjValue, isMinus, isExactAmount } = rows[index]
    if (!isNumber(adjValue)) return
    let value = adjValue
    if (!isExactAmount && adjValue > 100) {
      value = 100
      setFieldValue(`rows[${index}].adjValue`, 100)
    }
    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }

    this.getFinalAmount({ value, index })
  }

  onAdjustmentConditionChangeDebounce = _.debounce(
    idx =>
      setTimeout(() => {
        this.onAdjustmentConditionChange(idx)
      }, 1),
    300,
  )

  getFinalAmount = ({ value, index } = {}) => {
    const { setFieldValue, values } = this.props
    const { rows = [] } = values
    const { isExactAmount, adjValue, unitPrice, quantity } = rows[index]
    const total = _.round(unitPrice * quantity, 2)
    setFieldValue(`rows[${index}].total`, total)

    const finalAmount = calculateAdjustAmount(
      isExactAmount,
      total,
      value || adjValue,
    )
    setFieldValue(`rows[${index}].totalAftAdj`, finalAmount.amount)
    setFieldValue(`rows[${index}].adjAmt`, finalAmount.adjAmount)
  }

  getColumnsExtensions = values => {
    const commonExtensions = [
      {
        columnName: 'type',
        type: 'select',
        sortingEnabled: false,
        width: 100,
        options: InventoryTypes,
        render: row => {
          const itemType = `${
            InventoryTypes.find(type => type.value === row.type).name
          }`

          return (
            <span>
              {itemType} <br />
              {`${
                row.isActive || row.isActive === undefined ? '' : '(Inactive)'
              }`}
            </span>
          )
        },
      },
      {
        columnName: 'name',
        sortingEnabled: true,
        compare: (a, b) => a.toUpperCase().localeCompare(b.toUpperCase()),
        render: row => {
          const inventory = InventoryTypes.filter(x => x.value === row.type)[0]
          const { ctName, itemFKName } = inventory
          var item = row.name ? row.name : ''
          return (
            <Tooltip title={item}>
              <span>{item}</span>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'action',
        align: 'center',
        render: row => {
          const onConfirm = () => this.onDeleteClick(row)
          const btnAccessRight = this.getCurrentTypeAccessRight(row.type)
          if (btnAccessRight === 'hidden') return null
          return (
            <Popconfirm onConfirm={onConfirm}>
              <Tooltip title='Delete'>
                <Button
                  size='sm'
                  color='danger'
                  justIcon
                  disabled={btnAccessRight}
                >
                  <Delete />
                </Button>
              </Tooltip>
            </Popconfirm>
          )
        },
      },
    ]

    if (this.props.includeOrderSet) {
      commonExtensions.splice(
        commonExtensions.length - 1,
        0,
        {
          columnName: 'quantity',
          type: 'number',
          align: 'left',
          sortingEnabled: false,
          width: 90,
          render: row => {
            const { rows = [] } = values
            const index = rows.map(i => i.uid).indexOf(row.uid)
            return (
              <Field
                name={`rows[${index}].quantity`}
                render={args => (
                  <NumberInput
                    {...args}
                    debounceDuration={1}
                    onChange={() => this.onAdjustmentConditionChangeDebounce(index)}
                    min={1}
                    precision={0}
                    positiveOnly
                    disabled={this.getCurrentTypeAccessRight(row.type)}
                  />
                )}
              />
            )
          },
        },
        {
          columnName: 'unitPrice',
          sortingEnabled: false,
          type: 'currency',
          align: 'left',
          width: 100,
          render: row => {
            const { rows = [] } = values
            const index = rows.map(i => i.uid).indexOf(row.uid)
            return (
              <Field
                name={`rows[${index}].unitPrice`}
                render={args => (
                  <NumberInput
                    {...args}
                    debounceDuration={1}
                    onChange={() => this.onAdjustmentConditionChangeDebounce(index)}
                    currency
                    positiveOnly
                    min={0}
                    disabled={this.getCurrentTypeAccessRight(row.type)}
                  />
                )}
              />
            )
          },
        },
        {
          columnName: 'total',
          observeFields: ['quantity', 'unitPrice'],
          type: 'currency',
          sortingEnabled: false,
          width: 118,
        },
        {
          columnName: 'adjAmt',
          width: 200,
          isReactComponent: true,
          sortingEnabled: false,
          align: 'right',
          render: currentrow => {
            const { focused = false } = this.state
            const { rows = [] } = values
            const { row } = currentrow
            const index = rows.map(i => i.uid).indexOf(row.uid)
            return (
              <div style={{ display: 'flex',textAlign:'left' }}>
                <Field
                  name={`rows[${index}].isMinus`}
                  render={args => (
                    <Switch
                      style={{ margin: 0 }}
                      checkedChildren='-'
                      unCheckedChildren='+'
                      label=''
                      debounceDuration={1}
                      onChange={() => this.onAdjustmentConditionChangeDebounce(index)}
                      {...args}
                      inputProps={{
                        onMouseUp: e => {
                          if (!focused) {
                            this.setState({ focused: true })
                            e.target.click()
                          }
                        },
                      }}
                      disabled={false}
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
                      name={`rows[${index}].adjValue`}
                      render={args => (
                        <NumberInput
                          style={{
                            marginBottom: 0,
                            marginTop: 0,
                          }}
                          original
                          label=''
                          debounceDuration={1}
                          onChange={() => this.onAdjustmentConditionChangeDebounce(index)}
                          min={0}
                          precision={2}
                          {...args}
                          inputProps={{
                            onMouseUp: e => {
                              if (!focused) {
                                this.setState({ focused: true })
                                e.target.focus()
                              }
                            },
                          }}
                          disabled={false}
                        />
                      )}
                    />
                  ) : (
                    <Field
                      name={`rows[${index}].adjValue`}
                      render={args => (
                        <NumberInput
                          style={{
                            marginBottom: 0,
                            marginTop: 0,
                          }}
                          original
                          max={100}
                          label=''
                          debounceDuration={1}
                          onChange={() => this.onAdjustmentConditionChangeDebounce(index)}
                          min={0}
                          precision={2}
                          {...args}
                          inputProps={{
                            onMouseUp: e => {
                              if (!focused) {
                                this.setState({ focused: true })
                                e.target.focus()
                              }
                            },
                          }}
                          disabled={false}
                        />
                      )}
                    />
                  )}
                </div>
                <Field
                  name={`rows[${index}].isExactAmount`}
                  render={args => (
                    <Switch
                      style={{
                        marginRight: -30,
                        marginBottom: 0,
                        marginTop: 0,
                      }}
                      checkedChildren='$'
                      // checkedValue='ExactAmount'
                      unCheckedChildren='%'
                      // unCheckedValue='Percentage'
                      label=''
                      debounceDuration={1}
                      onChange={() => this.onAdjustmentConditionChangeDebounce(index)}
                      {...args}
                      inputProps={{
                        onMouseUp: e => {
                          if (!focused) {
                            this.setState({ focused: true })
                            e.target.click()
                          }
                        },
                      }}
                      disabled={false}
                    />
                  )}
                />
              </div>
            )
          },
        },
        {
          columnName: 'totalAftAdj',
          sortingEnabled: false,
          type: 'currency',
          width: 118,
        },
      )
    } else {
      commonExtensions.splice(
        commonExtensions.length - 1,
        0,
        {
          columnName: 'quantity',
          type: 'number',
        },
        {
          columnName: 'unitPrice',
          type: 'currency',
        },
        {
          columnName: 'cpAmount',
          render: row => {
            const { rows = [] } = values
            const index = rows.map(i => i.uid).indexOf(row.uid)
            return (
              <GridContainer>
                <GridItem xs={8}>
                  <Field
                    name={`rows[${index}].itemValue`}
                    render={CPNumber(
                      undefined,
                      row.itemValueType === 'ExactAmount'
                        ? 'ExactAmount'
                        : 'Percentage',
                    )}
                  />
                </GridItem>
                <GridItem xs={4}>
                  <Field
                    name={`rows[${index}].itemValueType`}
                    render={CPSwitch(undefined)}
                  />
                </GridItem>
              </GridContainer>
            )
          },
        },
      )
    }

    return commonExtensions
  }

  getCurrentTypeAccessRight = rowType => {
    const currentTabAccessRight = this.getOptions().find(
      tab => tab.id === rowType,
    )

    if (currentTabAccessRight && currentTabAccessRight.accessRight === 'hidden')
      return 'hidden'

    if (
      !currentTabAccessRight ||
      (currentTabAccessRight && currentTabAccessRight.accessRight === 'disable')
    )
      return true

    return false
  }

  render() {
    const { theme, values, includeOrderSet = false } = this.props
    return (
      <SizeContainer size='sm'>
        <div style={{ marginTop: theme.spacing(1) }}>
          <Tabs
            defaultActiveKey='1'
            onChange={this.onTabChange}
            options={this.filterTabOnAccessRight(this.getOptions())}
          />
          <CommonTableGrid
            rows={values.rows}
            // {...tableConfigs}
            forceRender
            getRowId={r => r.uid}
            columns={this.getColumns()}
            columnExtensions={this.getColumnsExtensions(values)}
            FuncProps={{
              pager: false,
              summary: includeOrderSet,
              summaryConfig: {
                state: {
                  totalItems: [
                    { columnName: 'total', type: 'total' },
                    { columnName: 'totalAftAdj', type: 'totalAftAdj' },
                  ],
                },
                integrated: {
                  calculator: (type, rows, getValue) => {
                    if (type == 'total' || type == 'totalAftAdj') 
                      return rows.reduce((acc, row) => acc + row[type], 0)
                    return IntegratedSummary.defaultCalculator(type, rows, getValue)
                  },
                },
                row: {
                  totalRowComponent: p => {
                    const { children } = p
                    const newChildren = []
                    for (var i = 0, colSpan = 1; i < children.length; i++, colSpan++) 
                    {
                      var col = children[i]
                      var colName = col.props.tableColumn.column?.name
                      if (['total', 'totalAftAdj', 'action'].includes(colName)) {
                        var newChild = [
                          {
                            ...col,
                            props: {
                              ...col.props,
                              colSpan,
                            },
                            key: `${colName}_${i}`,
                          },
                        ]
                        colSpan = 0
                        newChildren.push(newChild)
                      }
                    }
                    return <Table.Row {...p}>{newChildren}</Table.Row>
                  },
                  messages: {
                    total: 'Total Before Adjustment',
                    totalAftAdj: 'Sub Total',
                  },
                },
              },
            }}
          />
        </div>
      </SizeContainer>
    )
  }
}

export default InventoryItemList
