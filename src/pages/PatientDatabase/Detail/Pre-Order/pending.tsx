import React, { useState, useRef, useEffect } from 'react'
import { connect } from 'dva'
import numeral from 'numeral'
import moment from 'moment'
import { currencySymbol } from '@/utils/config'
import _ from 'lodash'
import Authorized from '@/utils/Authorized'
import { FastEditableTableGrid, Tooltip } from '@/components'
import Loading from '@/components/PageLoading/index'
import { preOrderItemCategory } from '@/utils/codes'
import { SERVICE_CENTER_CATEGORY } from '@/utils/constants'
import { NumberInput } from '@/components'
import Yup from '@/utils/yup'
// interface IPendingPreOrderProps {
// }

const preOrderSchema = Yup.object().shape({
  preOrderItemType: Yup.string().required(),
  itemName: Yup.string().required(),
  quantity: Yup.number()
    .required()
    .min(1),
})

const PendingPreOrder: React.FC = (props: any) => {
  const {
    values,
    user: {
      data: { clinicianProfile },
    },
    height,
  } = props
  const [medications, setMedications] = useState()
  const [consumables, setConsumables] = useState()
  const [vaccinations, setVaccinations] = useState()
  const [services, setServices] = useState()
  const [labs, setLabs] = useState()
  const [radiology, setRadiology] = useState()

  const addPreOrderAccessRight = Authorized.check(
    'patientdatabase.modifypreorder.addpreorder',
  ) || { rights: 'hidden' }
  const deletePreOrderAccessRight = Authorized.check(
    'patientdatabase.modifypreorder.deletepreorder',
  ) || { rights: 'hidden' }

  const isEditable = row => {
    return row.id < 0 ? true : false
  }

  const commitChanges = ({ rows }) => {
    const { setFieldValue, values } = props
    setFieldValue('pendingPreOrderItem', rows)
  }

  const fetchCodeTable = async (
    ctname:
      | 'ctservice'
      | 'inventoryvaccination'
      | 'inventorymedication'
      | 'inventoryconsumable',
  ) => {
    return props.dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: ctname,
      },
    })
  }

  const initAllTypeOptions = () => {
    const itemWrapper = (p: any, c: any) => {
      const {
        code,
        displayValue,
        sellingPrice = 0,
        dispensingUOM = {},
        uom = {},
        unitPrice = 0,
      } = c
      const { name: medAndVacUOM = '' } = dispensingUOM
      const { name: consumableUOM = '' } = uom
      let uomName = medAndVacUOM || consumableUOM || ''
      let pricing =
        sellingPrice === 0 ? (unitPrice === 0 ? 0 : unitPrice) : sellingPrice
      let opt = {
        ...c,
        combinDisplayValue: `${displayValue} - ${code} (${currencySymbol}${pricing.toFixed(
          2,
        )} / ${uomName})`,
      }
      return [...p, opt]
    }

    if (!medications) {
      const {
        codetable: { inventorymedication },
      } = props
      if (inventorymedication && inventorymedication.length > 0) {
        const retResponse = inventorymedication
          .reduce(itemWrapper, [])
          .filter(x => x.orderable === true)
        setMedications(retResponse)
      } else {
        fetchCodeTable('inventorymedication').then(response => {
          const retResponse = response
            .reduce(itemWrapper, [])
            .filter(x => x.orderable === true)
          setMedications(retResponse)
        })
      }
    }
    if (!vaccinations) {
      const {
        codetable: { inventoryvaccination },
      } = props
      if (inventoryvaccination && inventoryvaccination.length >= 0) {
        const combinRespons = inventoryvaccination.reduce(itemWrapper, [])
        setVaccinations(combinRespons)
      } else {
        fetchCodeTable('inventoryvaccination').then(response => {
          const combinRespons = response.reduce(itemWrapper, [])
          setVaccinations(combinRespons)
        })
      }
    }
    if (!consumables) {
      const {
        codetable: { inventoryconsumable },
      } = props
      if (inventoryconsumable && inventoryconsumable.length >= 0) {
        const retResponse = inventoryconsumable
          .reduce(itemWrapper, [])
          .filter(x => x.orderable === true)
        setConsumables(retResponse)
      } else {
        fetchCodeTable('inventoryconsumable').then(response => {
          const retResponse = response
            .reduce(itemWrapper, [])
            .filter(x => x.orderable === true)
          setConsumables(retResponse)
        })
      }
    }
    if (!services) {
      const {
        codetable: { ctservice },
      } = props
      if (ctservice && ctservice.length >= 0) {
        const retSerResponse = ctservice
          .filter(
            c =>
              c.serviceCenterCategoryFK !==
                SERVICE_CENTER_CATEGORY.INTERNALLABSERVICECENTER &&
              c.serviceCenterCategoryFK !==
                SERVICE_CENTER_CATEGORY.INTERNALRADIOLOGYSERVICECENTER &&
              c.serviceCenterCategoryFK !==
                SERVICE_CENTER_CATEGORY.EXTERNALLABSERVICECENTRE &&
              c.serviceCenterCategoryFK !==
                SERVICE_CENTER_CATEGORY.EXTERNALRADIOLOGYSERVICECENTRE,
          )
          .reduce(itemWrapper, [])
        setServices(retSerResponse)
        const retLabResponse = ctservice
          .filter(
            c =>
              c.serviceCenterCategoryFK ===
                SERVICE_CENTER_CATEGORY.INTERNALLABSERVICECENTER ||
              c.serviceCenterCategoryFK ===
                SERVICE_CENTER_CATEGORY.EXTERNALLABSERVICECENTRE,
          )
          .reduce(itemWrapper, [])
        setLabs(retLabResponse)
        const retRadiologyResponse = ctservice
          .filter(
            c =>
              c.serviceCenterCategoryFK ===
                SERVICE_CENTER_CATEGORY.INTERNALRADIOLOGYSERVICECENTER ||
              c.serviceCenterCategoryFK ===
                SERVICE_CENTER_CATEGORY.EXTERNALRADIOLOGYSERVICECENTRE,
          )
          .reduce(itemWrapper, [])
        setRadiology(retRadiologyResponse)
      } else {
        fetchCodeTable('ctservice').then(response => {
          const retSerResponse = response
            .filter(
              c =>
                c.serviceCenterCategoryFK !==
                  SERVICE_CENTER_CATEGORY.INTERNALLABSERVICECENTER &&
                c.serviceCenterCategoryFK !==
                  SERVICE_CENTER_CATEGORY.INTERNALRADIOLOGYSERVICECENTER &&
                c.serviceCenterCategoryFK !==
                  SERVICE_CENTER_CATEGORY.EXTERNALLABSERVICECENTRE &&
                c.serviceCenterCategoryFK !==
                  SERVICE_CENTER_CATEGORY.EXTERNALRADIOLOGYSERVICECENTRE,
            )
            .reduce(itemWrapper, [])
          setServices(retSerResponse)
          const retLabResponse = response
            .filter(
              c =>
                c.serviceCenterCategoryFK ===
                  SERVICE_CENTER_CATEGORY.INTERNALLABSERVICECENTER ||
                c.serviceCenterCategoryFK ===
                  SERVICE_CENTER_CATEGORY.EXTERNALLABSERVICECENTRE,
            )
            .reduce(itemWrapper, [])
          setLabs(retLabResponse)
          const retRadiologyResponse = response
            .filter(
              c =>
                c.serviceCenterCategoryFK ===
                  SERVICE_CENTER_CATEGORY.INTERNALRADIOLOGYSERVICECENTER ||
                c.serviceCenterCategoryFK ===
                  SERVICE_CENTER_CATEGORY.EXTERNALRADIOLOGYSERVICECENTRE,
            )
            .reduce(itemWrapper, [])
          setRadiology(retRadiologyResponse)
        })
      }
    }
  }

  const generateItemDataSource = (row: any) => {
    const { preOrderItemType } = row
    if (preOrderItemType) {
      if (preOrderItemType === preOrderItemCategory[0].value) {
        return medications
      }
      if (preOrderItemType === preOrderItemCategory[1].value) {
        return consumables
      }
      if (preOrderItemType === preOrderItemCategory[2].value) {
        return vaccinations
      }
      if (preOrderItemType === preOrderItemCategory[3].value) {
        return services
      }
      if (preOrderItemType === preOrderItemCategory[4].value) {
        return labs
      }
      if (preOrderItemType === preOrderItemCategory[5].value) {
        return radiology
      }
    }
  }

  const getFilteredRows = (rows: any) => {
    const result = rows.filter(
      (c: { preOrderItemStatus: string }) =>
        c.preOrderItemStatus !== 'Actualized',
    )
    return result
  }
  const handleCategoryChanged = (e: any) => {
    if (!e.option) {
      return
    }
    const { option, row } = e
    row.quantity = 1
    row.amount = 0
    row.itemName = undefined
    row.preOrderVaccinationItem = undefined
    row.preOrderServiceItem = undefined
    row.preOrderMedicationItem = undefined
    row.preOrderConsumableItem = undefined
  }
  const handleItemChanged = (e: any) => {
    const { row, option } = e
    const { dispensingUOM = {}, prescribingUOM = {}, uom = {} } = option
    row.itemName = option?.combinDisplayValue
    row.code = option?.code
    if (row.preOrderItemType === preOrderItemCategory[0].value) {
      row.preOrderMedicationItem = {
        InventoryMedicationFK: option?.id,
        PrescribingUOMFK: prescribingUOM?.id,
        DispensingUOMFK: dispensingUOM?.id,
      }
    } else if (row.preOrderItemType === preOrderItemCategory[1].value) {
      row.preOrderConsumableItem = {
        InventoryConsumableFK: option?.id,
        DispensingUOMFK: uom?.id,
      }
    } else if (row.preOrderItemType === preOrderItemCategory[2].value) {
      row.preOrderVaccinationItem = {
        InventoryVaccinationFK: option?.id,
        PrescribingUOMFK: prescribingUOM?.id,
        DispensingUOMFK: dispensingUOM?.id,
      }
    } else if (
      row.preOrderItemType === preOrderItemCategory[3].value ||
      row.preOrderItemType == preOrderItemCategory[4].value ||
      row.preOrderItemType == preOrderItemCategory[5].value
    ) {
      row.preOrderServiceItem = { ServiceCenterServiceFK: option?.id }
      row.serviceCenterName = option?.serviceCenter || '-'
    }
    row.quantity = 1
    row.amount = 0
    row.remarks = undefined
  }

  const handelQuantityChanged = (e: any) => {
    const { row, value } = e
    const {
      preOrderItemType,
      preOrderMedicationItem = {},
      preOrderServiceItem = {},
      preOrderVaccinationItem = {},
      preOrderConsumableItem = {},
    } = row
    if (!preOrderItemType) {
      return
    }
  }

  useEffect(() => {
    initAllTypeOptions()
  }, [])

  const tableParas = {
    columns: [
      { name: 'preOrderItemType', title: 'Type' },
      { name: 'itemName', title: 'Name' },
      { name: 'quantity', title: 'Order Qty.' },
      { name: 'orderByUserFK', title: 'Order By' },
      { name: 'orderDate', title: 'Order Date' },
      { name: 'remarks', title: 'Remarks' },
      { name: 'apptDate', title: 'Appt. Date' },
      { name: 'amount', title: 'Total' },
      { name: 'hasPaid', title: 'Paid' },
      { name: 'preOrderItemStatus', title: 'Status' },
    ],
    columnExtensions: [
      {
        columnName: 'preOrderItemType',
        type: 'select',
        labelField: 'name',
        valueField: 'value',
        sortingEnabled: false,
        width: 130,
        options: () => preOrderItemCategory,
        onChange: handleCategoryChanged,
        isDisabled: row => !isEditable(row),
        render: row => {
          return (
            <Tooltip title={row.preOrderItemType}>
              <div>
                <span style={{ color: 'red', fontStyle: 'italic' }}>
                  <sup>
                    {row.isPreOrderItemActive === false
                      ? '#1'
                      : row.isPreOrderItemOrderable === false
                      ? '#2'
                      : row.isUOMChanged === true
                      ? '#3'
                      : ''}
                    &nbsp;
                  </sup>
                </span>

                <span>{row.preOrderItemType}</span>
              </div>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'itemName',
        type: 'select',
        labelField: 'combinDisplayValue',
        showOptionTitle: false,
        valueField: 'id',
        sortingEnabled: false,
        width: 380,
        options: generateItemDataSource,
        dropdownMatchSelectWidth: false,
        dropdownStyle: { width: '770px' },
        renderDropdown: option => {
          return (
            <Tooltip
              title={
                <div>
                  {option?.combinDisplayValue}
                  <br />
                  {option?.serviceCenter}
                </div>
              }
            >
              <div>
                <strong>{option?.displayValue}</strong> -&nbsp;
                <strong>{option?.code}</strong> -&nbsp;
                <span>{option?.serviceCenter}</span> -&nbsp;
                <span> ${option?.unitPrice}</span>
              </div>
            </Tooltip>
          )
        },
        onChange: handleItemChanged,
        render: row => {
          return (
            <Tooltip
              title={
                <div>
                  {`Code: ${row.code}`}
                  <br />
                  {`Name: ${row.itemName}`}
                  <br />
                  {row.preOrderServiceItem &&
                    `Service Center: ${row.serviceCenterName ??
                      row.preOrderServiceItem.serviceCenterName ??
                      '-'}`}
                </div>
              }
            >
              <div>{row.itemName}</div>
            </Tooltip>
          )
        },
        isDisabled: row => !isEditable(row),
      },
      {
        columnName: 'quantity',
        type: 'number',
        precision: 1,
        width: 100,
        sortingEnabled: false,
        render: row => {
          const displayQty = `${numeral(row.quantity).format(
            '0.0',
          )} ${row.dispenseUOM || ''}`
          return (
            <Tooltip title={displayQty}>
              <span>{displayQty}</span>
            </Tooltip>
          )
        },
        isDisabled: row => !isEditable(row),
      },
      {
        columnName: 'orderByUserFK',
        width: 150,
        type: 'text',
        sortingEnabled: false,
        render: row => {
          return (
            <Tooltip title={row.orderByUser}>
              <div>{row.orderByUser}</div>
            </Tooltip>
          )
        },
        isDisabled: () => true,
      },
      {
        columnName: 'orderDate',
        type: 'date',
        width: 150,
        direction: 'desc',
        sortBy: 'orderDate',
        isDisabled: () => true,
        render: row => {
          return (
            <span>{moment(row.orderDate).format('DD MMM YYYY HH:mm')}</span>
          )
        },
      },
      {
        columnName: 'remarks',
        width: 250,
        maxLength: 100,
        sortingEnabled: false,
        isDisabled: row => (row.preOrderItemStatus === 'New' ? false : true),
        render: row => {
          return (
            <Tooltip title={row.remarks}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{row.remarks}</div>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'apptDate',
        width: 150,
        type: 'date',
        sortingEnabled: false,
        render: row => {
          return row.apptDate
            ? `${moment(row.apptDate).format('DD MMM YYYY')} ${moment(
                row.apptStartTime,
                'HH:mm',
              ).format('HH:mm')}`
            : '-'
        },
        isDisabled: () => true,
      },
      {
        columnName: 'amount',
        width: 100,
        type: 'currency',
        sortingEnabled: false,
        isDisabled: () => true,
        render: row => {
          return row.hasPaid ? (
            <NumberInput currency text value={row.amount} rightAlign readonly />
          ) : (
            '-'
          )
        },
      },
      {
        columnName: 'hasPaid',
        width: 100,
        sortingEnabled: false,
        isDisabled: () => true,
        sortingEnabled: false,
        render: row => {
          return row.hasPaid ? 'Yes' : 'No'
        },
      },
      {
        columnName: 'preOrderItemStatus',
        width: 100,
        sortingEnabled: false,
        isDisabled: () => true,
      },
    ],
  }

  if (
    !medications ||
    !vaccinations ||
    !consumables ||
    !services ||
    !labs ||
    !radiology
  ) {
    return <Loading />
  }

  return (
    <>
      <div style={{ maxHeight: height - 250, overflowY: 'auto' }}>
        <FastEditableTableGrid
          rows={getFilteredRows(values.pendingPreOrderItem)}
          schema={preOrderSchema}
          FuncProps={{
            pager: false,
            sortConfig: {
              defaultSorting: [{ columnName: 'orderDate', direction: 'desc' }],
            },
          }}
          EditingProps={{
            showAddCommand:
              addPreOrderAccessRight.rights === 'enable' ? true : false,
            isDeletable: row => {
              return deletePreOrderAccessRight.rights === 'enable' &&
                row.hasPaid === false &&
                row.preOrderItemStatus === 'New'
                ? true
                : false
            },
            showCommandColumn:
              deletePreOrderAccessRight.rights === 'enable' ? true : false,
            onCommitChanges: commitChanges,
            onAddedRowsChange: (rows: any) => {
              return rows.map(o => {
                return {
                  orderDate: moment(),
                  orderByUserFK: clinicianProfile?.userProfileFK,
                  orderByUser: clinicianProfile?.name,
                  preOrderItemStatus: 'New',
                  hasPaid: false,
                  amount: 0,
                  preOrderVaccinationItem: undefined,
                  preOrderServiceItem: undefined,
                  preOrderMedicationItem: undefined,
                  preOrderConsumableItem: undefined,
                  prescribingUOMFK: undefined,
                  quantity: 1,
                  ...o,
                }
              })
            },
          }}
          {...tableParas}
        />
      </div>

      <div style={{ position: 'fixed', bottom: 100, width: '100%' }}>
        <span>
          Note:&nbsp;
          <span style={{ color: 'red', fontStyle: 'italic' }}>
            <sup>#1&nbsp;</sup>
          </span>
          Inactive item &nbsp;&nbsp;
          <span style={{ color: 'red', fontStyle: 'italic' }}>
            <sup>#2&nbsp;</sup>
          </span>
          Non-orderable item&nbsp;&nbsp;
          <span style={{ color: 'red', fontStyle: 'italic' }}>
            <sup>#3&nbsp;</sup>
          </span>
          Dispense/prescribe UOM changed&nbsp;&nbsp;
        </span>
      </div>
    </>
  )
}

export default connect(({ codetable, user }) => ({ codetable, user }))(
  PendingPreOrder,
)
