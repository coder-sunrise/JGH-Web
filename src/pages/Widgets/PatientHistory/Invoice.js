import React from 'react'
import { Table } from 'antd'
import moment from 'moment'
import numeral from 'numeral'
import { currencySymbol, currencyFormat } from '@/utils/config'
import { GridContainer, GridItem, TextField, Tooltip } from '@/components'
import { orderItemTypes } from '@/utils/codes'
import { VISIT_TYPE, RADIOLOGY_CATEGORY, LAB_CATEGORY } from '@/utils/constants'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import AmountSummary from './AmountSummary'
import tablestyles from './PatientHistoryStyle.less'
import { mergeClasses } from '@material-ui/styles'
import VisitOrderTemplateIndicateString from '@/pages/Widgets/Orders/VisitOrderTemplateIndicateString'
const numberstyle = {
  color: 'darkBlue',
  fontWeight: 500,
}

const negativeNumberstyle = {
  color: 'red',
  fontWeight: 500,
}

const wrapCellTextStyle = {
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
}

const drugMixtureIndicator = (row, right) => {
  if (!row.isDrugMixture) return null

  return <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
}

const urgentIndicator = row => {
  return (
    row.priority === 'Urgent' && (
      <Tooltip title='Urgent'>
        <div
          style={{
            borderRadius: 4,
            backgroundColor: 'red',
            position: 'relative',
            fontWeight: 500,
            color: 'white',
            fontSize: '0.7rem',
            padding: '2px 3px',
            height: 20,
            cursor: 'pointer',
          }}
        >
          Urg.
        </div>
      </Tooltip>
    )
  )
}

const showCurrency = (value = 0) => {
  if (value >= 0)
    return (
      <div style={numberstyle}>
        {`${currencySymbol}${numeral(value).format('0,0.00')}`}
      </div>
    )
  return (
    <div style={negativeNumberstyle}>
      {`(${currencySymbol}${numeral(value * -1).format('0,0.00')})`}
    </div>
  )
}

const baseColumns = (classes, isFullScreen) => {
  return [
    {
      dataIndex: 'itemType',
      title: 'Type',
      width: 105,
      render: (text, row) => {
        let paddingRight = 0
        if ((row.isActualizedPreOrder || row.isPreOrder) && row.isExclusive) {
          paddingRight = 54
        } else if (
          row.isActualizedPreOrder ||
          row.isPreOrder ||
          row.isExclusive
        ) {
          paddingRight = 24
        }
        if (row.isDrugMixture) {
          paddingRight = 10
        }
        let urgentRight = 0

        if (row.priority === 'Urgent') {
          paddingRight += 34
          urgentRight = -paddingRight - 4
        }
        const itemType = orderItemTypes.find(
          t => t.type.toUpperCase() === (row.itemType || '').toUpperCase(),
        )
        return (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                paddingRight: paddingRight,
              }}
            >
              <Tooltip title={row.itemType}>
                <span>{itemType?.displayValue}</span>
              </Tooltip>
              <div style={{ position: 'absolute', top: '-1px', right: '-4px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    position: 'relative',
                  }}
                >
                  {drugMixtureIndicator(row)}
                </div>
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
                {row.isExclusive && (
                  <Tooltip title='The item has no local stock, we will purchase on behalf and charge to patient in invoice'>
                    <div
                      className={classes.rightIcon}
                      style={{
                        borderRadius: 4,
                        backgroundColor: 'green',
                        display: 'inline-block',
                      }}
                    >
                      Excl.
                    </div>
                  </Tooltip>
                )}
                <div style={{ display: 'inline-block', margin: '0px 1px' }}>
                  {urgentIndicator(row)}
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      dataIndex: 'itemName',
      title: 'Name',
      width: isFullScreen ? 250 : 180,
      render: (text, row) => (
        <Tooltip
          title={
            <div>
              {`Code: ${row.itemCode}`}
              <br />
              {`Name: ${row.itemName}`}
            </div>
          }
        >
          <div style={wrapCellTextStyle}>{text}</div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'description',
      title: 'Instructions',
      render: (text, row) => (
        <Tooltip title={row.description}>
          <div style={wrapCellTextStyle}>{text}</div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'quantity',
      title: 'Qty.',
      align: 'right',
      width: 60,
      render: (text, row) => (
        <Tooltip
          title={<div>{`${numeral(row.quantity || 0).format('0,0.0')}`}</div>}
        >
          <div style={numberstyle}>
            {`${numeral(row.quantity || 0).format('0,0.0')}`}
          </div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'dispenseUOMDisplayValue',
      title: 'UOM',
      width: 80,
      render: (text, row) => (
        <Tooltip title={row.dispenseUOMDisplayValue}>
          <div style={wrapCellTextStyle}>{text}</div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'adjAmt',
      title: 'Adj.',
      width: 70,
      align: 'right',
      render: (text, row) => showCurrency(row.adjAmt),
    },
    {
      dataIndex: 'totalAfterItemAdjustment',
      title: 'Total',
      width: 80,
      align: 'right',
      render: (text, row) =>
        showCurrency(
          (row.isPreOrder && !row.isChargeToday) || row.hasPaid
            ? 0
            : row.totalAfterItemAdjustment,
        ),
    },
  ]
}

export default ({ current, theme, isFullScreen = true, classes }) => {
  let invoiceAdjustmentData = []
  let columns = baseColumns(classes, isFullScreen)

  if (current.invoice) {
    const { invoiceAdjustment = [] } = current.invoice
    invoiceAdjustmentData = invoiceAdjustment
  }

  return (
    <div style={{ fontSize: '0.85rem', marginBottom: 8, marginTop: 8 }}>
      {current.invoice ? (
        <div style={{ marginBottom: 5 }}>
          <span>{`Invoice No: ${current.invoice.invoiceNo}`}</span>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span>
            {`Invoice Date: ${moment(current.invoice.invoiceDate).format(
              'DD MMM YYYY',
            )}`}
          </span>
        </div>
      ) : (
        ''
      )}
      <Table
        size='small'
        bordered
        pagination={false}
        columns={columns}
        dataSource={current.invoice ? current.invoice.invoiceItem : []}
        rowClassName={(record, index) => {
          return index % 2 === 0 ? tablestyles.once : tablestyles.two
        }}
        className={tablestyles.table}
      />
      <GridContainer style={{ paddingTop: theme.spacing(2) }}>
        <GridItem xs={12} sm={6} md={isFullScreen ? 8 : 6}>
          {current.invoice && (
            <div style={{ marginLeft: -8 }}>
              {current.invoice.remark && (
                <div>
                  <span style={{ fontWeight: 500 }}>Invoice Remarks:</span>
                  <TextField
                    inputRootCustomClasses={tablestyles.historyText}
                    noUnderline
                    multiline
                    disabled
                    value={current.invoice.remark || ''}
                  />
                </div>
              )}
              <div>
                <VisitOrderTemplateIndicateString
                  visitOrderTemplateDetails={current.visitOrderTemplateDetails}
                ></VisitOrderTemplateIndicateString>
              </div>
            </div>
          )}
        </GridItem>
        <GridItem xs={12} sm={6} md={isFullScreen ? 4 : 6}>
          <AmountSummary
            adjustments={invoiceAdjustmentData}
            invoice={current.invoice}
          />
        </GridItem>
      </GridContainer>
    </div>
  )
}
