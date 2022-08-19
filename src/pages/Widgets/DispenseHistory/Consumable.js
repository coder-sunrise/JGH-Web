import React from 'react'
import { CardContainer } from '@/components'
import numeral from 'numeral'
import { currencySymbol } from '@/utils/config'
import moment from 'moment'
import { Table } from 'antd'
import tablestyles from '../PatientHistory/PatientHistoryStyle.less'
import { Tooltip } from '@/components'

export default ({ classes, current, fieldName = '', isFullScreen = true }) => {
  const showCurrency = (value = 0) => {
    if (value >= 0)
      return (
        <div className={classes.numberstyle}>
          {`${currencySymbol}${numeral(value).format('0,0.00')}`}
        </div>
      )
    return (
      <div className={classes.negativeNumberstyle}>
        {`(${currencySymbol}${numeral(value * -1).format('0,0.00')})`}
      </div>
    )
  }
  const tableColumns = [
    {
      dataIndex: 'visitDate',
      title: 'Date',
      width: 90,
      render: (text, row) => (
        <span>{moment(row.visitDate).format('DD MMM YYYY')}</span>
      ),
    },
    {
      dataIndex: 'description',
      title: 'Name',
      width: isFullScreen ? 250 : 140,
      render: (text, row) => {
        return (
          <div style={{ position: 'relative' }}>
            <div
              className={classes.wrapCellTextStyle}
              style={{
                paddingRight:
                  row.isPreOrder || row.isActualizedPreOrder ? 24 : 0,
              }}
            >
              <Tooltip
                title={
                  <div>
                    {`Code: ${row.code}`}
                    <br />
                    {`Name: ${row.description}`}
                  </div>
                }
              >
                <div>{row.description}</div>
              </Tooltip>
              <div style={{ position: 'absolute', top: '-1px', right: '-4px' }}>
                {(row.isPreOrder || row.isActualizedPreOrder) && (
                  <Tooltip
                    title={
                      row.isPreOrder ? 'New Pre-Order' : 'Actualized Pre-Order'
                    }
                  >
                    <div
                      className={classes.rightIcon}
                      style={{
                        borderRadius: 4,
                        backgroundColor: row.isPreOrder ? '#4255bd' : 'green',
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
      dataIndex: 'quantity',
      title: 'Qty.',
      align: 'right',
      width: isFullScreen ? 80 : 60,
      render: (text, row) => {
        const qty = `${numeral(row.quantity || 0).format('0,0.0')}`
        return (
          <Tooltip title={qty}>
            <div>{qty}</div>
          </Tooltip>
        )
      },
    },
    {
      dataIndex: 'dispenseUOM',
      title: 'UOM',
      width: isFullScreen ? 100 : 80,
      render: text => (
        <Tooltip title={text}>
          <div>{text}</div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'totalPrice',
      title: 'Sub Total',
      align: 'right',
      width: isFullScreen ? 90 : 80,
      render: (text, row) => showCurrency(row.totalPrice),
    },
    {
      dataIndex: 'adjAmt',
      title: 'Adj.',
      align: 'right',
      width: isFullScreen ? 80 : 70,
      render: (text, row) => showCurrency(row.adjAmt),
    },
    {
      dataIndex: 'totalAfterItemAdjustment',
      title: 'Total',
      align: 'right',
      width: isFullScreen ? 90 : 80,
      render: (text, row) =>
        showCurrency(
          (row.isPreOrder && !row.isChargeToday) || row.hasPaid
            ? 0
            : row.totalAfterItemAdjustment,
        ),
    },
    {
      dataIndex: 'remarks',
      title: 'Remarks',
      render: text => (
        <Tooltip title={text}>
          <div>{text}</div>
        </Tooltip>
      ),
    },
  ]

  return (
    <div style={{ padding: 8 }}>
      <Table
        size='small'
        bordered
        pagination={false}
        columns={tableColumns}
        dataSource={current.consumable || []}
        rowClassName={(record, index) => {
          return index % 2 === 0 ? tablestyles.once : tablestyles.two
        }}
        className={tablestyles.table}
      />
    </div>
  )
}
