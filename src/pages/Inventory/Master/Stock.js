import React, { useState, useEffect } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { FastField } from 'formik'
import _ from 'lodash'
import { formatMessage } from 'umi/locale'
import moment from 'moment'
import { Radio } from 'antd'
import Delete from '@material-ui/icons/Delete'
import SharedContainer from './SharedContainer'
import {
  CardContainer,
  GridContainer,
  GridItem,
  NumberInput,
  CommonTableGrid,
  Field,
  Tooltip,
  Button,
  notification,
  dateFormatLong,
} from '@/components'
import Authorized from '@/utils/Authorized'

const styles = (theme) => ({
  infoPanl: {
    marginBottom: theme.spacing.unit * 2,
  },
  isDeleted: {
    textDecoration: 'line-through',
  },
  negativeNum: {
    color: 'red',
  },
})

let commitCount = 1000 // uniqueNumber
const Stock = ({
  classes,
  vaccinationDetail,
  medicationDetail,
  consumableDetail,
  values,
  setFieldValue,
  theme,
  dispatch,
  hasActiveSession,
  authority,
}) => {
  const objectType = () => {
    if (vaccinationDetail)
      return { name: 'vaccination', stockProp: 'vaccinationStock' }
    if (medicationDetail)
      return { name: 'medication', stockProp: 'medicationStock' }
    if (consumableDetail)
      return { name: 'consumable', stockProp: 'consumableStock' }
    return ''
  }

  const [
    stock,
    setStock,
  ] = useState(_.sortBy(values[objectType().stockProp], 'id'))

  const changeIsDefault = async (row) => {
    const updatedStock = stock.map((batch) => {
      if (batch.id === row.id) {
        return {
          ...batch,
          isDefault: true,
        }
      }
      return {
        ...batch,
        isDefault: false,
      }
    })

    setStock(updatedStock)
    await setFieldValue(objectType().stockProp, updatedStock)

    dispatch({
      // force current edit row components to update
      type: 'global/updateState',
      payload: {
        commitCount: (commitCount += 1),
      },
    })
  }

  const [
    stockQty,
    setStockQty,
  ] = useState(0)

  useEffect(() => {
    let totalQty = 0
    values[objectType().stockProp].forEach((o) => {
      totalQty += o.stock
    })
    setStockQty(totalQty)
  }, [])

  const handleDeleteStock = async (row) => {
    const { stock: remainingQty, isDefault } = row
    if (hasActiveSession) {
      notification.warning({
        message:
          'There is an active session. End current session before deleting batch',
      })
      return
    }
    if (isDefault) {
      notification.error({
        message: 'Switch default batch no. to another record before deleting',
      })
      return
    }
    if (remainingQty > 0) {
      notification.error({
        message:
          'Please remove any stock count from adjustment before deleting batch',
      })
      return
    }

    const deletedStock = stock.find((batch) => batch.id === row.id)
    deletedStock.isDeleted = true
    setStock(stock)
    await setFieldValue(objectType().stockProp, stock)

    dispatch({
      // force current edit row components to update
      type: 'global/updateState',
      payload: {
        commitCount: (commitCount += 1),
      },
    })
  }
  const renderStockQty = (stockQuantity) => {
    if (Number.isInteger(stockQuantity)) {
      return stockQuantity.toFixed(1)
    }
    return stockQuantity
  }

  const checkIsReadOnly = () => {
    const accessRight = Authorized.check(authority)
    if (!accessRight || (accessRight && accessRight.rights !== 'readwrite'))
      return true
    return false
  }

  const [
    tableParas,
    setTableParas,
  ] = useState({
    columns: [
      { name: 'batchNo', title: 'Batch No.' },
      { name: 'expiryDate', title: 'Expiry Date' },
      { name: 'stock', title: 'Quantity' },
      { name: 'isDefault', title: 'Default' },
      {
        name: 'action',
        title: 'Action',
      },
    ],
    columnExtensions: [
      {
        columnName: 'batchNo',
        render: (row) => (
          <p className={row.isDeleted && classes.isDeleted}>{row.batchNo}</p>
        ),
      },
      {
        columnName: 'stock',
        align: 'center',
        render: (row) => (
          <p
            style={{ color: row.stock < 0 ? 'red' : 'black' }}
            className={row.isDeleted && classes.isDeleted}
          >
            {renderStockQty(row.stock)}
          </p>
        ),
      },
      {
        columnName: 'expiryDate',
        align: 'center',
        render: (row) => (
          <p className={row.isDeleted && classes.isDeleted}>
            {row.expiryDate ? (
              moment(row.expiryDate).format(dateFormatLong)
            ) : (
              '-'
            )}
          </p>
        ),
      },
      {
        columnName: 'isDefault',
        align: 'center',
        render: (row) => {
          return (
            <Radio
              checked={row.isDefault}
              onChange={() => changeIsDefault(row)}
              disabled={row.isDeleted || checkIsReadOnly()}
            />
          )
        },
      },
      {
        columnName: 'action',
        sortingEnabled: false,
        align: 'center',
        render: (row) => {
          return (
            <Tooltip
              title={`Delete ${objectType().name} batch`}
              placement='bottom'
            >
              <Button
                size='sm'
                onClick={() => handleDeleteStock(row)}
                justIcon
                color='primary'
                disabled={row.isDeleted}
              >
                <Delete />
              </Button>
            </Tooltip>
          )
        },
      },
    ],
  })
  return (
    <SharedContainer>
      <div
        hideHeader
        style={{
          margin: theme.spacing(1),
          minHeight: 700,
          maxHeight: 700,
        }}
      >
        <h4 style={{ fontWeight: 400 }}>
          <b>Stock</b>
        </h4>
        <GridContainer className={classes.infoPanl}>
          <GridItem xs={12} md={4}>
            <Field
              name={`${objectType().stockProp}`}
              // name={`${objectType()}.length`}
              render={(args) => {
                return (
                  <NumberInput
                    label={formatMessage({
                      id: 'inventory.master.stock.currentStock',
                    })}
                    value={stockQty}
                    disabled
                    format='0.0'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={12} md={4}>
            <FastField
              name='reOrderThreshold'
              render={(args) => {
                return (
                  <NumberInput
                    label={formatMessage({
                      id: 'inventory.master.stock.reorderThreshold',
                    })}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={12} md={4}>
            <FastField
              name='criticalThreshold'
              render={(args) => {
                return (
                  <NumberInput
                    label={formatMessage({
                      id: 'inventory.master.stock.criticalThreshold',
                    })}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridContainer>
        <CommonTableGrid rows={stock} showIsDeleted {...tableParas} />
        {/* <Divider style={{ margin: '40px 0 20px 0' }} /> */}
      </div>
    </SharedContainer>
  )
}
export default withStyles(styles, { withTheme: true })(Stock)
