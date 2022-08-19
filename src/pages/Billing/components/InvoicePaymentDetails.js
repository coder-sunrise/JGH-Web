import { Table } from 'antd'
import numeral from 'numeral'
import { currencySymbol } from '@/utils/config'
import { roundTo } from '@/utils/utils'
import { orderItemTypes } from '@/utils/codes'
import { GridContainer, GridItem, Tooltip } from '@/components'
import AmountSummary from '@/pages/Widgets/PatientHistory/AmountSummary'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'

import { Tag } from 'antd'

const showMoney = (v = 0) => {
  if (v < 0)
    return (
      <span
        style={{ fontWeight: 500, color: 'red' }}
      >{`(${currencySymbol}${numeral(v * -1.0).format('0.00')})`}</span>
    )
  return (
    <span
      style={{ fontWeight: 500, color: 'darkblue' }}
    >{`${currencySymbol}${numeral(v).format('0.00')}`}</span>
  )
}
const drugMixtureIndicator = (row, right) => {
  if (!row.isDrugMixture) return null

  return <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
}
const InvoicePaymentDetails = ({ invoice = {}, classes }) => {
  const { invoiceNo, invoiceItems = [], invoiceAdjustments = [] } = invoice
  let data = invoiceItems.map(item => ({
    ...item,
    outstanding: item.patientOutstanding,
  }))
  data = _.orderBy(
    data,
    [
      'isVisitPurposeItem',
      x => (x.itemType || '').toLowerCase(),
      x => (x.itemName || '').toLowerCase(),
    ],
    ['desc', 'asc', 'asc'],
  )
  return (
    <GridContainer hideHeader>
      <GridItem md={12}>
        <h4>Invoice Summary: {invoiceNo}</h4>
      </GridItem>
      <GridItem md={12}>
        <Table
          size='small'
          bordered
          pagination={false}
          dataSource={data}
          columns={[
            {
              dataIndex: 'itemType',
              title: 'Category ',
              width: 160,
              render: (_, row) => {
                let paddingRight = 0
                if (row.isPreOrder || row.isActualizedPreOrder) {
                  paddingRight = 24
                }
                if (row.isDrugMixture) {
                  paddingRight = 10
                }
                const itemType = orderItemTypes.find(
                  t =>
                    t.type.toUpperCase() === (row.itemType || '').toUpperCase(),
                )
                return (
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Tooltip title={row.itemType}>
                        <span>{itemType?.displayValue}</span>
                      </Tooltip>
                      <div>
                        <div
                          style={{
                            display: 'inline-block',
                            position: 'relative',
                          }}
                        >
                          {drugMixtureIndicator(row)}
                        </div>
                        {(row.isActualizedPreOrder || row.isPreOrder) && (
                          <Tooltip
                            title={
                              row.isPreOrder
                                ? 'New Pre-Order'
                                : 'Actualized Pre-Order'
                            }
                          >
                            <div
                              className={classes.rightIcon}
                              style={{
                                borderRadius: 4,
                                backgroundColor: row.isPreOrder
                                  ? '#4255bd'
                                  : 'green',
                                display: 'inline-block',
                              }}
                            >
                              Pre
                            </div>
                          </Tooltip>
                        )}
                        {row.isVisitPurposeItem && (
                          <Tooltip title='Visit Purpose Item' placement='right'>
                            <Tag style={{ marginRight: 0 }} color='blue'>
                              V.P.
                            </Tag>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              dataIndex: 'itemDescription',
              title: 'Name',
            },
            {
              dataIndex: 'quantity',
              title: 'Qty.',
              align: 'right',
              width: 80,
              render: (_, row) => {
                const qty = numeral(row.quantity).format('0.0')
                return (
                  <Tooltip title={qty}>
                    <span>{qty}</span>
                  </Tooltip>
                )
              },
            },
            {
              dataIndex: 'uom',
              title: 'UOM',
              width: 100,
            },
            {
              dataIndex: 'subTotal',
              title: 'Sub Total',
              align: 'right',
              width: 110,
              render: (_, row) => {
                return showMoney(row.subTotal)
              },
            },
            {
              dataIndex: 'adjAmt',
              title: 'Adj.',
              align: 'right',
              width: 80,
              render: (_, row) => {
                return showMoney(row.adjAmt)
              },
            },
            {
              dataIndex: 'gstAmount',
              title: 'GST',
              align: 'right',
              width: 80,
              render: (_, row) => {
                return showMoney(
                  (row.isPreOrder && !row.isChargeToday) || row.hasPaid
                    ? 0
                    : row.gstAmount,
                )
              },
            },
            {
              dataIndex: 'totalAfterGst',
              title: 'Total',
              align: 'right',
              width: 110,
              render: (_, row) => {
                return showMoney(
                  (row.isPreOrder && !row.isChargeToday) || row.hasPaid
                    ? 0
                    : row.totalAfterGst,
                )
              },
            },
            {
              dataIndex: 'totalClaim',
              title: 'Co-Payer O/S',
              align: 'right',
              width: 110,
              render: (_, row) => {
                return showMoney(row.totalClaim)
              },
            },
            {
              dataIndex: 'outstanding',
              title: 'Patient O/S',
              align: 'right',
              width: 110,
              render: (_, row) => {
                return showMoney(row.outstanding)
              },
            },
            {
              dataIndex: 'paidAmount',
              title: 'Paid Amt.',
              align: 'right',
              width: 110,
              render: (_, row) => {
                return showMoney(row.paidAmount)
              },
            },
            {
              dataIndex: 'receiptNo',
              title: 'Receipt No.',
              width: 180,
              render: (_, row) => {
                return (
                  <div>
                    {(row.invoiceItemPayments || []).map(payment => {
                      return (
                        <div>
                          <span>{payment.receiptNo}</span>&nbsp;&nbsp;
                          <span>{showMoney(payment.paidAmount)}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              },
            },
            {
              dataIndex: 'status',
              title: 'Status',
              width: 100,
              render: (_, row) => {
                let status = 'Paid'
                if (row.outstanding > 0) {
                  status = 'Outstanding'
                } else if (row.outstanding < 0) {
                  status = 'Overpaid'
                }
                return <span>{status}</span>
              },
            },
          ]}
        ></Table>
      </GridItem>
      <GridItem md={7} />
      <GridItem md={5}>
        <div style={{ paddingRight: 90, marginTop: 8 }}>
          <AmountSummary
            adjustments={invoiceAdjustments}
            invoice={{
              invoiceTotal: invoice.total,
              invoiceTotalAftGST: invoice.totalAftGst,
              invoiceGSTAmt: invoice.gstAmount,
              isGSTInclusive: invoice.isGstInclusive,
              gstValue: invoice.gstValue,
            }}
          />
        </div>
      </GridItem>
    </GridContainer>
  )
}
export default InvoicePaymentDetails
