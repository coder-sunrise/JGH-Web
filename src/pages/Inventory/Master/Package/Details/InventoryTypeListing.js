import React, { useState, useEffect } from 'react'
import { withStyles } from '@material-ui/core/styles'
import Yup from '@/utils/yup'
import { CardContainer, GridContainer, GridItem } from '@/components'
import { podoOrderType, getInventoryItemList, getServices } from '@/utils/codes'
import InventoryType from './InventoryType'

const styles = () => ({
  displayDiv: {
    float: 'right',
    padding: '20px',
  },

  tableHeader: {
    marginTop: 50,
  },

  tableSectionHeader: {
    fontWeight: 400,
    marginLeft: -15,
  },
})

let commitCount = 1000 // uniqueNumber
const InventoryTypeListing = ({
  dispatch,
  classes,
  packDetail,
  setFieldValue,
  setValues,
  values,
  setTotalPrice,
  totalPrice,
  theme,
}) => {
  useEffect(() => {
    return () => {
      dispatch({
        type: 'global/updateState',
        payload: {
          disableSave: false,
        },
      })
    }
  }, [])

  const {
    medicationPackageItem,
    consumablePackageItem,
    vaccinationPackageItem,
    servicePackageItem,
  } = values

  const medicationSchema = Yup.object().shape({
    inventoryMedicationFK: Yup.number().required(),
    quantity: Yup.number().required().min(1),
  })
  const consumableSchema = Yup.object().shape({
    inventoryConsumableFK: Yup.number().required(),
    quantity: Yup.number().required().min(1),
  })
  const vaccinationSchema = Yup.object().shape({
    inventoryVaccinationFK: Yup.number().required(),
    quantity: Yup.number().required().min(1),
  })
  const serviceSchema = Yup.object().shape({
    serviceCenterServiceFK: Yup.number().required(),
    serviceName: Yup.number().required(),
    quantity: Yup.number().required().min(1),
  })

  const [
    medicationRows,
    setMedicationRows,
  ] = useState(medicationPackageItem)
  const [
    consumableRows,
    setConsumableRows,
  ] = useState(consumablePackageItem)
  const [
    vaccinationRows,
    setVaccinationRows,
  ] = useState(vaccinationPackageItem)
  const [
    serviceRows,
    setServiceRows,
  ] = useState(servicePackageItem)

  const [
    medicationList,
    setMedicationList,
  ] = useState([])

  const [
    consumableList,
    setConsumableList,
  ] = useState([])

  const [
    vaccinationList,
    setVaccinationList,
  ] = useState([])

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(() => {})

  const [
    servicess,
    setServicess,
  ] = useState(() => [])
  const [
    serviceCenterss,
    setServiceCenterss,
  ] = useState(() => [])
  const [
    serviceCenterServicess,
    setServiceCenterServicess,
  ] = useState(() => [])
  const [
    serviceFK,
    setServiceFK,
  ] = useState(() => {})
  const [
    serviceCenterFK,
    setServiceCenterFK,
  ] = useState(() => {})

  const fetchCodes = async () => {
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
      },
    }).then((list) => {
      const { services, serviceCenters, serviceCenterServices } = getServices(
        list,
      )
      setServicess(services)
      setServiceCenterss(serviceCenters)
      setServiceCenterServicess(serviceCenterServices)
      // if (
      //   packDetail.entity &&
      //   packDetail.entity.servicePackageItem.length > 0
      // ) {
      //   servicePackageItem.forEach((o) => {
      //     o.serviceName = serviceCenterServices.find(
      //       (i) => i.serviceCenter_ServiceId === o.serviceCenterServiceFK,
      //     ).serviceCenterId
      //   })
      // }
    })

    podoOrderType.forEach((x) => {
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: x.ctName,
        },
      }).then((list) => {
        const { inventoryItemList } = getInventoryItemList(list)
        switch (x.stateName) {
          case 'ConsumableItemList': {
            return setConsumableList(inventoryItemList)
          }
          case 'MedicationItemList': {
            return setMedicationList(inventoryItemList)
          }
          case 'VaccinationItemList': {
            return setVaccinationList(inventoryItemList)
          }
          default: {
            return null
          }
        }
      })
    })

    dispatch({
      // force current edit row components to update
      type: 'global/updateState',
      payload: {
        commitCount: (commitCount += 1),
      },
    })
  }

  useEffect(
    () => {
      dispatch({
        // force current edit row components to update
        type: 'global/updateState',
        payload: {
          commitCount: (commitCount += 1),
        },
      })
    },
    [
      medicationList,
      consumableList,
      vaccinationList,
    ],
  )

  useEffect(
    () => {
      setMedicationRows(medicationPackageItem)
      setConsumableRows(consumablePackageItem)
      setVaccinationRows(vaccinationPackageItem)
      setServiceRows(servicePackageItem)
      dispatch({
        // force current edit row components to update
        type: 'global/updateState',
        payload: {
          commitCount: (commitCount += 1),
        },
      })
    },
    [
      packDetail,
    ],
  )

  useEffect(() => {
    fetchCodes()
  }, [])

  useEffect(
    () => {
      let total = 0
      medicationRows.forEach((row) => {
        if (!row.isDeleted) {
          total += row.subTotal
        }
      })

      serviceRows.forEach((row) => {
        if (!row.isDeleted) {
          total += row.subTotal
        }
      })

      consumableRows.forEach((row) => {
        if (!row.isDeleted) {
          total += row.subTotal
        }
      })

      vaccinationRows.forEach((row) => {
        if (!row.isDeleted) {
          total += row.subTotal
        }
      })

      setFieldValue('medicationPackageItem', medicationRows)
      setFieldValue('consumablePackageItem', consumableRows)
      setFieldValue('vaccinationPackageItem', vaccinationRows)
      setFieldValue('servicePackageItem', serviceRows)

      setTotalPrice(total)

      setValues({
        ...values,
        medicationPackageItem: medicationRows,
        consumablePackageItem: consumableRows,
        vaccinationPackageItem: vaccinationRows,
        servicePackageItem: serviceRows,
        totalPrice: total,
      })

      dispatch({
        // force current edit row components to update
        type: 'global/updateState',
        payload: {
          commitCount: (commitCount += 1),
        },
      })
    },
    [
      medicationRows,
      consumableRows,
      vaccinationRows,
      serviceRows,
    ],
  )

  // useEffect(
  //   () => {
  //     if (serviceRows.length > 0 && serviceCenterServicess.length > 0) {
  //       const newServiceRows = serviceRows.map((o) => {
  //         if (o.tempServiceCenterServiceFK) {
  //           return {
  //             ...o,
  //           }
  //         }
  //         return {
  //           ...o,
  //           serviceCenterServiceFK: serviceCenterServicess.find(
  //             (s) => s.serviceCenter_ServiceId === o.serviceCenterServiceFK,
  //           ).serviceId,
  //           serviceName: serviceCenterServicess.find(
  //             (s) => s.serviceCenter_ServiceId === o.serviceCenterServiceFK,
  //           ).serviceCenterId,
  //         }
  //       })

  //       setServiceRows(newServiceRows)

  //       dispatch({
  //         // force current edit row components to update
  //         type: 'global/updateState',
  //         payload: {
  //           commitCount: (commitCount += 1),
  //         },
  //       })
  //       dispatch({
  //         type: 'packDetail/updateState',
  //         payload: {
  //           entity: {
  //             ...values,
  //             servicePackageItem: newServiceRows,
  //           },
  //         },
  //       })
  //     }
  //   },
  //   [
  //     serviceCenterServicess,
  //   ],
  // )

  const onCommitChanges = (type) => ({ rows, deleted, added, changed }) => {
    console.log(rows, deleted, added, changed)
    if (deleted) {
      const tempArray = [
        ...values[type],
      ]
      const newArray = tempArray.map((o) => {
        if (o.id === deleted[0]) {
          return {
            ...o,
            isDeleted: true,
          }
        }
        return {
          ...o,
        }
      })

      switch (type) {
        case 'medicationPackageItem': {
          return setMedicationRows(newArray)
        }
        case 'consumablePackageItem': {
          return setConsumableRows(newArray)
        }
        case 'vaccinationPackageItem': {
          return setVaccinationRows(newArray)
        }
        case 'servicePackageItem': {
          return setServiceRows(newArray)
        }

        default: {
          return rows
        }
      }
    } else if (added) {
      switch (type) {
        case 'medicationPackageItem': {
          setMedicationRows([
            ...medicationRows,
            rows[0],
          ])
          return setFieldValue(`${type}`, medicationRows)
        }
        case 'consumablePackageItem': {
          setConsumableRows([
            ...consumableRows,
            rows[0],
          ])
          return setFieldValue(`${type}`, consumableRows)
        }
        case 'vaccinationPackageItem': {
          setVaccinationRows([
            ...vaccinationRows,
            rows[0],
          ])
          return setFieldValue(`${type}`, vaccinationRows)
        }
        case 'servicePackageItem': {
          const { serviceCenterServiceFK, serviceName } = rows[0]
          const serviceCenterService =
            serviceCenterServicess.find(
              (o) =>
                o.serviceId === serviceCenterServiceFK &&
                o.serviceCenterId === serviceName,
            ) || {}
          if (serviceCenterService) {
            rows[0] = {
              ...rows[0],
              isDeleted: false,
              tempServiceCenterServiceFK:
                serviceCenterService.serviceCenter_ServiceId,
              tempServiceName: servicess.find((o) => o.value === serviceFK)
                .name,
            }
          }

          setServiceRows([
            ...serviceRows,
            rows[0],
          ])
          setServiceCenterFK()
          setServiceFK()
          return setFieldValue(`${type}`, serviceRows)
        }
        default:
          return rows
      }
    } else if (changed) {
      Object.entries(changed).map(([ key, value,
      ]) => {
        const getType = (t) => {
          switch (t) {
            case 'medicationPackageItem': {
              return {
                stateRows: medicationRows,
                setStateRow: (v) => setMedicationRows(v),
              }
            }
            case 'consumablePackageItem': {
              return {
                stateRows: consumableRows,
                setStateRow: (v) => setConsumableRows(v),
              }
            }
            case 'vaccinationPackageItem': {
              return {
                stateRows: vaccinationRows,
                setStateRow: (v) => setVaccinationRows(v),
              }
            }
            case 'servicePackageItem': {
              return {
                stateRows: serviceRows,
                setStateRow: (v) => setServiceRows(v),
              }
            }
            default: {
              return null
            }
          }
        }

        const edittedType = getType(type)
        const newArray = edittedType.stateRows.map((item) => {
          if (item.id === parseInt(key, 10)) {
            const {
              medicationName,
              inventoryMedication,
              consumableName,
              inventoryConsumable,
              vaccinationName,
              inventoryVaccination,
              service,
              ...restFields
            } = item

            let tempServiceCenterServiceFK
            const tempServiceId = serviceFK || item.serviceCenterServiceFK
            const tempServiceCenterId = serviceCenterFK || item.serviceName
            const serviceCenterService =
              serviceCenterServicess.find(
                (o) =>
                  o.serviceId === tempServiceId &&
                  o.serviceCenterId === tempServiceCenterId,
              ) || {}
            if (serviceCenterService) {
              tempServiceCenterServiceFK =
                serviceCenterService.serviceCenter_ServiceId
            }
            const obj = {
              ...restFields,
              ...value,
              tempServiceCenterServiceFK,
            }
            return obj
          }
          return item
        })

        setServiceCenterFK()
        setServiceFK()
        edittedType.setStateRow(newArray)
        return setFieldValue(`${type}`, newArray)
      })
    }
  }

  const getServiceCenterService = (row) => {
    const { serviceCenterServiceFK, serviceName } = row
    if (!serviceCenterServiceFK || !serviceName) {
      setSelectedItem({})
      return
    }
    const serviceCenterService =
      serviceCenterServicess.find(
        (o) =>
          o.serviceId === serviceCenterServiceFK &&
          o.serviceCenterId === serviceName,
      ) || {}
    if (serviceCenterService) {
      row.unitPrice = serviceCenterService.unitPrice
    }
  }
  const calSubtotal = (e) => {
    const { row } = e
    const { unitPrice, quantity } = row
    console.log(unitPrice, quantity)
    if (unitPrice && quantity) row.subTotal = unitPrice * quantity
    console.log(row.subTotal)
  }

  const onAddedRowsChange = (type) => (addedRows) => {
    if (addedRows.length > 0) {
      const newRow = addedRows[0]

      const {
        quantity,
        unitPrice,
        serviceCenterServiceFK,
        serviceName,
      } = newRow

      // const total = () => {
      //   if (quantity && unitPrice) {
      //     return quantity * unitPrice
      //   }
      //   return 0.0
      // }
      if (type === 'service') {
        if (serviceCenterServiceFK && serviceName) {
          const returnRow = addedRows.map((row) => ({
            ...row,
            // subTotal: total(),
          }))
          return returnRow
        }

        return addedRows.map((row) => ({
          ...row,
          quantity: undefined,
          unitPrice: undefined,
          subTotal: undefined,
          // subTotal: total(),
        }))
      }

      if (selectedItem) {
        return addedRows.map((row) => ({
          ...row,
          // subTotal: total(),
        }))
      }
    }
    return addedRows
  }

  const handleItemOnChange = (e) => {
    const { option, row } = e
    const { sellingPrice } = option
    setSelectedItem(option)
    row.quantity = undefined
    row.unitPrice = sellingPrice
    row.subTotal = undefined

    dispatch({
      // force current edit row components to update
      type: 'global/updateState',
      payload: {
        commitCount: (commitCount += 1),
      },
    })
  }

  const medicationProps = {
    columns: [
      { name: 'inventoryMedicationFK', title: 'Medication Name' },
      { name: 'quantity', title: 'Quantity' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'subTotal', title: 'Amount' },
    ],

    columnExtensions: [
      {
        columnName: 'inventoryMedicationFK',
        type: 'select',
        labelField: 'name',
        options: medicationList,
        onChange: handleItemOnChange,
      },
      {
        columnName: 'quantity',
        width: 150,
        type: 'number',
        format: '0.0',
        onChange: calSubtotal,
      },
      {
        columnName: 'unitPrice',
        width: 150,
        type: 'number',
        currency: true,
        onChange: calSubtotal,
      },
      {
        columnName: 'subTotal',
        width: 150,
        type: 'number',
        currency: true,
        disabled: true,
      },
    ],
  }

  const vaccinationProps = {
    columns: [
      { name: 'inventoryVaccinationFK', title: 'Vaccination' },
      { name: 'quantity', title: 'Quantity' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'subTotal', title: 'Amount' },
    ],
    columnExtensions: [
      {
        columnName: 'inventoryVaccinationFK',
        type: 'select',
        labelField: 'name',
        options: vaccinationList,
        onChange: handleItemOnChange,
      },
      {
        columnName: 'quantity',
        width: 150,
        type: 'number',
        format: '0.0',
        onChange: calSubtotal,
      },
      {
        columnName: 'unitPrice',
        width: 150,
        type: 'number',
        currency: true,
        onChange: calSubtotal,
      },
      {
        columnName: 'subTotal',
        width: 150,
        type: 'number',
        currency: true,
        disabled: true,
      },
    ],
  }

  const consumableProps = {
    columns: [
      { name: 'inventoryConsumableFK', title: 'Consumable Name' },
      { name: 'quantity', title: 'Quantity' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'subTotal', title: 'Amount' },
    ],

    columnExtensions: [
      {
        columnName: 'inventoryConsumableFK',
        type: 'select',
        labelField: 'name',
        options: consumableList,
        onChange: handleItemOnChange,
      },

      {
        columnName: 'quantity',
        width: 150,
        type: 'number',
        format: '0.0',
        onChange: calSubtotal,
      },
      {
        columnName: 'unitPrice',
        width: 150,
        type: 'number',
        currency: true,
        onChange: calSubtotal,
      },
      {
        columnName: 'subTotal',
        width: 150,
        type: 'number',
        currency: true,
        disabled: true,
      },
    ],
  }

  const serviceProps = {
    columns: [
      { name: 'serviceCenterServiceFK', title: 'Service' },
      { name: 'serviceName', title: 'Service Center' },
      { name: 'quantity', title: 'Quantity' },
      { name: 'unitPrice', title: 'Unit Price' },
      { name: 'subTotal', title: 'Amount' },
    ],

    columnExtensions: [
      {
        columnName: 'serviceCenterServiceFK',
        type: 'select',
        options: (row) => {
          const tempArray = [
            ...servicess,
          ]
          if (!row.serviceName) {
            return tempArray
          }
          const options = tempArray.filter((o) =>
            o.serviceCenters.find((m) => m.value === row.serviceName),
          )
          return options
          // return tempArray.filter(
          //   (o) =>
          //     !serviceCenterFK ||
          //     o.serviceCenters.find((m) => m.value === serviceCenterFK),
          // )
        },
        onChange: (e) => {
          setServiceFK(e.val)
          handleItemOnChange
          getServiceCenterService(e.row)
          e.row.serviceCenterServiceFK = e.val
          dispatch({
            // force current edit row components to update
            type: 'global/updateState',
            payload: {
              commitCount: (commitCount += 1),
            },
          })
        },
      },
      {
        columnName: 'serviceName',
        type: 'select',
        options: (row) => {
          const tempArray = [
            ...serviceCenterss,
          ]
          if (!row.serviceCenterServiceFK) {
            return tempArray
          }
          const options = tempArray.filter((o) =>
            o.services.find((m) => m.value === row.serviceCenterServiceFK),
          )
          return options
          // return tempArray.filter(
          //   (o) =>
          //     !serviceFK ||
          //     o.services.find(
          //       (m) => m.value === serviceFK || m.value === row.serviceName,
          //     ),
          // )
        },

        onChange: (e) => {
          setServiceCenterFK(e.val)
          handleItemOnChange
          getServiceCenterService(e.row)
          e.row.serviceName = e.val
          dispatch({
            // force current edit row components to update
            type: 'global/updateState',
            payload: {
              commitCount: (commitCount += 1),
            },
          })
        },
      },
      {
        columnName: 'quantity',
        width: 150,
        type: 'number',
        format: '0.0',
        onChange: calSubtotal,
      },
      {
        columnName: 'unitPrice',
        width: 150,
        type: 'number',
        currency: true,
        onChange: calSubtotal,
      },
      {
        columnName: 'subTotal',
        width: 150,
        type: 'number',
        currency: true,
        disabled: true,
      },
    ],
  }

  const medicationEditingProps = {
    messages: {
      deleteCommand: 'Delete medication',
    },
    showAddCommand: true,
    onCommitChanges: onCommitChanges('medicationPackageItem'),
    onAddedRowsChange: onAddedRowsChange('medication'),
  }

  const consumableEditingProps = {
    messages: {
      deleteCommand: 'Delete consumable',
    },
    showAddCommand: true,
    onAddedRowsChange: onAddedRowsChange('consumable'),
    onCommitChanges: onCommitChanges('consumablePackageItem'),
  }

  const vaccinationEditingProps = {
    messages: {
      deleteCommand: 'Delete vaccination',
    },
    showAddCommand: true,
    onCommitChanges: onCommitChanges('vaccinationPackageItem'),
    onAddedRowsChange: onAddedRowsChange('vaccination'),
  }

  const serviceEditingProps = {
    messages: {
      deleteCommand: 'Delete service',
    },
    showAddCommand: true,
    onAddedRowsChange: onAddedRowsChange('service'),
    onCommitChanges: onCommitChanges('servicePackageItem'),
  }

  return (
    <div>
      <CardContainer
        hideHeader
        style={{
          margin: theme.spacing(1),
          maxHeight: 700,
          minHeight: 700,
        }}
      >
        <GridContainer>
          <GridItem xs={12}>
            <div className={classes.displayDiv}>
              <h4>
                <b>Package Price: ${totalPrice.toFixed(2)}</b>
              </h4>
            </div>
          </GridItem>
        </GridContainer>
        <GridContainer
          style={{
            overflow: 'auto',
            minHeight: 550,
            maxHeight: 550,
            padding: 10,
          }}
        >
          <InventoryType
            title='Medication'
            inventoryTypeProps={medicationProps}
            schema={medicationSchema}
            rows={medicationRows}
            editingProps={medicationEditingProps}
          />

          <InventoryType
            title='Consumable'
            inventoryTypeProps={consumableProps}
            schema={consumableSchema}
            rows={consumableRows}
            editingProps={consumableEditingProps}
            style={{ marginTop: 15 }}
          />

          <InventoryType
            title='Vaccination'
            inventoryTypeProps={vaccinationProps}
            schema={vaccinationSchema}
            rows={vaccinationRows}
            editingProps={vaccinationEditingProps}
            style={{ marginTop: 15 }}
          />

          <InventoryType
            title='Service'
            inventoryTypeProps={serviceProps}
            schema={serviceSchema}
            rows={serviceRows}
            editingProps={serviceEditingProps}
            style={{ marginTop: 15 }}
          />
        </GridContainer>
      </CardContainer>
    </div>
  )
}
export default withStyles(styles, { withTheme: true })(InventoryTypeListing)
