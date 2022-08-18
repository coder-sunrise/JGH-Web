import React from 'react'
import { CardContainer } from '@/components'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import numeral from 'numeral'
import { currencySymbol } from '@/utils/config'
import moment from 'moment'
import { Table } from 'antd'
import tablestyles from '../PatientHistory/PatientHistoryStyle.less'
import { Tooltip } from '@/components'
import { FileCopySharp } from '@material-ui/icons'

export default ({
  classes,
  current,
  fieldName = '',
  clinicSettings,
  isFullScreen = true,
}) => {
  const drugMixtureIndicator = (row, right) => {
    if (!row.isDrugMixture) return null

    return (
      <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
    )
  }

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

  const tableColumns = showDrugLabelRemark => [
    {
      dataIndex: 'visitDate',
      title: 'Date',
      width: 90,
      render: (text, row) => (
        <span>{moment(row.visitDate).format('DD MMM YYYY')}</span>
      ),
    },
    {
      dataIndex: 'name',
      title: 'Name',
      width: isFullScreen ? 250 : 120,
      render: (text, row) => {
        let paddingRight = 0
        if ((row.isActualizedPreOrder || row.isPreOrder) && row.isExclusive) {
          paddingRight = 52
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
        return (
          <div style={{ position: 'relative' }}>
            <div
              className={classes.wrapCellTextStyle}
              style={{ paddingRight: paddingRight }}
            >
              <Tooltip
                title={
                  <div>
                    {`Code: ${row.code}`}
                    <br />
                    {`Name: ${row.name}`}
                  </div>
                }
              >
                <div>{row.name}</div>
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
              </div>
            </div>
          </div>
        )
      },
    },
    {
      dataIndex: 'instruction',
      title: 'Instructions',
      width: isFullScreen ? 200 : 110,
      render: text => (
        <Tooltip title={text}>
          <div>{text}</div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'dispensedQuanity',
      title: 'Qty.',
      align: 'right',
      width: isFullScreen ? 80 : 60,
      render: (text, row) => {
        const qty = `${numeral(row.dispensedQuanity || 0).format('0,0.0')}`
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
      width: isFullScreen ? 90 : 75,
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
      width: isFullScreen ? 90 : 75,
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
      render: (text, row) => {
        const existsDrugLabelRemarks =
          showDrugLabelRemark &&
          row.drugLabelRemarks &&
          row.drugLabelRemarks.trim() !== ''
        return (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                paddingRight: existsDrugLabelRemarks ? 10 : 0,
                minHeight: 20,
              }}
            >
              <Tooltip title={row.remarks}>
                <span className='oneline_textblock'> {row.remarks || ' '}</span>
              </Tooltip>
            </div>
            <div style={{ position: 'relative', top: 6 }}>
              {existsDrugLabelRemarks && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: -8,
                  }}
                >
                  <Tooltip
                    title={
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          Drug Label Remarks
                        </div>
                        <div>{row.drugLabelRemarks}</div>
                      </div>
                    }
                  >
                    <FileCopySharp style={{ color: '#4255bd' }} />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
  ]

  const { labelPrinterSize } = clinicSettings.settings
  const showDrugLabelRemark = labelPrinterSize === '8.0cmx4.5cm_V2'

  return (
    <div style={{ padding: 8 }}>
      <Table
        size='small'
        bordered
        pagination={false}
        columns={tableColumns(showDrugLabelRemark)}
        dataSource={current.prescription || []}
        rowClassName={(record, index) => {
          return index % 2 === 0 ? tablestyles.once : tablestyles.two
        }}
        className={tablestyles.table}
      />
    </div>
  )
}
