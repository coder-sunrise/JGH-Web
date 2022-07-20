import { Table } from 'antd'
import numeral from 'numeral'
import { currencySymbol, currencyFormat } from '@/utils/config'
import tablestyles from './PatientHistoryStyle.less'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import { Tooltip } from '@/components'
import { FileCopySharp } from '@material-ui/icons'
import { orderItemTypes } from '@/utils/codes'
import * as WidgetConfig from './config'

const wrapCellTextStyle = {
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
}

const drugMixtureIndicator = (row, right) => {
  if (!row.isDrugMixture) return null

  return <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
}

const urgentIndicator = (row, right) => {
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
      <div style={{ color: 'darkBlue', fontWeight: 500 }}>
        {`${currencySymbol}${numeral(value).format('0,0.00')}`}
      </div>
    )
  return (
    <div style={{ color: 'red', fontWeight: 500 }}>
      {`(${currencySymbol}${numeral(value * -1).format('0,0.00')})`}
    </div>
  )
}
export default ({
  current,
  classes,
  showDrugLabelRemark,
  isFullScreen = true,
}) => {
  const { isFromEditOrder, editDispenseType, editDispenseReason } = current
  return (
    <div style={{ marginBottom: 8, marginTop: 8 }}>
      <Table
        size='small'
        bordered
        pagination={false}
        columns={[
          {
            dataIndex: 'type',
            title: 'Type',
            width: 105,
            render: (text, row) => {
              let paddingRight = 0
              if (row.isPreOrder && row.isExclusive) {
                paddingRight = 54
              } else if (row.isPreOrder || row.isExclusive) {
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

              let type = row.type
              if (row.isDrugMixture) {
                type = 'Drug Mixture'
              }
              const itemType = orderItemTypes.find(
                t => t.type.toUpperCase() === (type || '').toUpperCase(),
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
                    <Tooltip title={type}>
                      <span>{itemType?.displayValue}</span>
                    </Tooltip>
                    <div
                      style={{
                        position: 'absolute',
                        top: '-1px',
                        right: '-4px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-block',
                          position: 'relative',
                        }}
                      >
                        {drugMixtureIndicator(row)}
                      </div>
                      {row.isPreOrder && (
                        <Tooltip title='New Pre-Order'>
                          <div
                            className={classes.rightIcon}
                            style={{
                              borderRadius: 4,
                              backgroundColor: '#4255bd',
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
                      <div
                        style={{ display: 'inline-block', margin: '0px 1px' }}
                      >
                        {urgentIndicator(row)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
          },
          {
            dataIndex: 'name',
            title: 'Name',
            width: isFullScreen ? 250 : 140,
            render: (text, row) => (
              <Tooltip
                title={
                  <div>
                    {`Code: ${row.code}`}
                    <br />
                    {`Name: ${row.name}`}
                    {row.type === 'Service' && (
                      <div>Service Center: {row.serviceCenter}</div>
                    )}
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
                    <Tooltip title={row.remarks || ' '}>
                      <span className='oneline_textblock'>
                        {row.remarks || ' '}
                      </span>
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
          {
            dataIndex: 'quantity',
            title: 'Qty.',
            align: 'right',
            width: 60,
            render: (text, row) => (
              <Tooltip
                title={
                  <div>{`${numeral(row.quantity || 0).format('0,0.0')}`}</div>
                }
              >
                <div
                  style={{
                    color: 'darkBlue',
                    fontWeight: 500,
                  }}
                >
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
        ]}
        dataSource={current.orders || []}
        rowClassName={(record, index) => {
          return index % 2 === 0 ? tablestyles.once : tablestyles.two
        }}
        className={tablestyles.table}
      />
      {isFromEditOrder && (
        <div style={{ marginTop: 6 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                textAlign: 'right',
              }}
            >
              Edit Order Type:
            </div>
            <div style={{ paddingLeft: 130, whiteSpace: 'pre-wrap' }}>
              {editDispenseType}
            </div>
          </div>
          {WidgetConfig.hasValue(editDispenseReason) &&
            editDispenseReason.trim().length && (
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    textAlign: 'right',
                  }}
                >
                  Edit Order Reason:
                </div>
                <div
                  style={{
                    paddingLeft: 130,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {editDispenseReason}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
