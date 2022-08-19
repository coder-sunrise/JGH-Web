import numeral from 'numeral'
import { NumberInput, Tooltip } from '@/components'
import { qtyFormat } from '@/utils/config'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import PackageDrawdownInfo from '@/pages/Widgets/Orders/Detail/PackageDrawdownInfo'

const wrapCellTextStyle = {
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
}

const drugMixtureIndicator = (row, right) => {
  if (!row.isDrugMixture) return null

  return <DrugMixtureInfo values={row.prescriptionDrugMixture} right={right} />
}

const packageDrawdownIndicator = row => {
  if (!row.isPackage) return null

  return (
    <div style={{ position: 'relative' }}>
      <PackageDrawdownInfo
        drawdownData={row}
        asAtDate={row.packageDrawdownAsAtDate}
      />
    </div>
  )
}

export const DataGridColExtensions = [
  {
    columnName: 'itemType',
    width: 300,
    render: row => {
      let paddingRight = 0
      if (row.isActualizedPreOrder || row.isPreOrder) {
        paddingRight = 24
      }
      if (row.isDrugMixture) {
        paddingRight = 10
      }
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              paddingRight: paddingRight,
            }}
          >
            {row.itemType}
            <div style={{ position: 'absolute', top: '-1px', right: '-6px' }}>
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
                    row.isPreOrder ? 'New Pre-Order' : 'Actualized Pre-Order'
                  }
                >
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 4,
                      backgroundColor: row.isPreOrder ? '#4255bd' : 'green',
                      fontWeight: 500,
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '2px 3px',
                      height: 20,
                      margin: '0px 1px',
                      display: 'inline-block',
                      lineHeight: '16px',
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
    columnName: 'itemName',
    render: row => {
      return (
        <div style={wrapCellTextStyle}>
          {packageDrawdownIndicator(row)}
          <div
            style={{
              position: 'relative',
              left: row.isPackage ? 22 : 0,
            }}
          >
            {row.itemName}
          </div>
        </div>
      )
    },
  },
  {
    columnName: 'quantity',
    type: 'number',
    currency: false,
    width: 180,
    render: row => {
      const { quantity, dispenseUOMDisplayValue = '' } = row
      return `${numeral(quantity).format(qtyFormat)} ${dispenseUOMDisplayValue}`
    },
  },
  { columnName: 'adjAmt', type: 'currency', currency: true, width: 180 },
  {
    columnName: 'totalAfterItemAdjustment',
    type: 'currency',
    currency: true,
    width: 200,
    render: row => (
      <NumberInput
        value={
          (row.isPreOrder && !row.isChargeToday) || row.hasPaid
            ? 0
            : row.totalAfterItemAdjustment
        }
        text
        currency
      />
    ),
  },
]
