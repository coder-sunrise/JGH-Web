import moment from 'moment'
import Print from '@material-ui/icons/Print'
import { FormattedMessage } from 'umi/locale'
import numeral from 'numeral'
import { currencySymbol, currencyFormat } from '@/utils/config'
import {
  NumberInput,
  TextField,
  FastField,
  DatePicker,
  Button,
  Tooltip,
  Checkbox,
  Select,
} from '@/components'
import LowStockInfo from '@/pages/Widgets/Orders/Detail/LowStockInfo'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import PackageDrawdownInfo from '@/pages/Widgets/Orders/Detail/PackageDrawdownInfo'
import { InventoryTypes } from '@/utils/codes'
import CONSTANTS from './DispenseDetails/constants'

export const tableConfig = {
  FuncProps: { pager: false },
}

const columnWidth = '10%'

const lowStockIndicator = (row, itemIdFieldName) => {
  const currentType = InventoryTypes.find((type) => type.name === row.type)
  if (!currentType) return null

  const values = {
    [currentType.itemFKName]: row[itemIdFieldName],
  }

  // If is drug mixture, show drug mixture indicator
  const isDrugMixture = currentType.name === 'Medication' && row.isDrugMixture

  return (
    <div style={{ position: 'relative', top: 2 }}>
      {isDrugMixture ? (
        <DrugMixtureInfo values={row.prescriptionDrugMixture} />
      ) : (
        <LowStockInfo
          sourceType={currentType.name.toLowerCase()}
          values={values}
        />
      )}
    </div>
  )
}

const packageDrawdownIndicator = (row) => {
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

export const PrescriptionColumns = [
  // { name: 'id', title: 'id' },
  {
    name: 'name',
    title: 'Name',
  },
  {
    name: 'instruction',
    title: 'Instructions',
  },
  {
    name: 'remarks',
    title: 'Remarks',
  },
  {
    name: 'batchNo',
    title: 'Batch #',
  },
  {
    name: 'expiryDate',
    title: 'Expiry Date',
  },
  {
    name: 'orderedQuantity',
    title: 'Qty Ordered',
  },
  {
    name: 'dispensedQuanity',
    title: 'Qty Dispensed',
  },
  {
    name: 'unitPrice',
    title: 'Unit Price ($)',
  },
  {
    name: 'adjAmt',
    title: 'Item Adj ($)',
  },
  {
    name: 'totalAfterItemAdjustment',
    title: 'Total ($)',
  },
  {
    name: 'action',
    title: 'Action',
  },
]

export const PrescriptionColumnExtensions = (
  viewOnly = false,
  onPrint,
  inventorymedication = [],
  handleSelectedBatch,
) => [
  { columnName: 'unitPrice', width: 100, type: 'currency' },
  {
    columnName: 'name',
    width: columnWidth,
    render: (row) => {
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {row.name}
            {lowStockIndicator(row, 'inventoryMedicationFK')}
          </div>
        </div>
      )
    },
  },
  {
    columnName: 'instruction',
    render: (row) => {
      return (
        <div
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {row.instruction}
        </div>
      )
    },
  },
  {
    columnName: 'remarks',
    width: 200,
  },
  {
    columnName: 'totalAfterItemAdjustment',
    width: 110,
    type: 'currency',
  },
  {
    columnName: 'adjAmt',
    width: 100,
    type: 'currency',
  },
  {
    columnName: 'dispensedQuanity',
    type: 'number',
    width: 130,
    render: (row) => {
      return (
        <p>
          {numeral(row.dispensedQuanity || 0).format('0,0.0')} {row.dispenseUOM}
        </p>
      )
    },
  },
  {
    columnName: 'orderedQuantity',
    type: 'number',
    width: 130,
    render: (row) => {
      return (
        <p>
          {numeral(row.orderedQuantity || 0).format('0,0.0')} {row.orderUOM}
        </p>
      )
    },
  },
  {
    columnName: 'batchNo',
    width: 150,
    render: (row) => {
      const currentItem = inventorymedication.find(
        (o) => o.id === row.inventoryMedicationFK,
      )
      let batchNoOptions = []
      if (currentItem) {
        batchNoOptions = currentItem.medicationStock
      }
      return (
        <FastField
          name={`prescription[${row.rowIndex}]batchNo`}
          render={(args) => {
            const restProps = viewOnly ? { value: row.batchNo } : { ...args }
            return (
              <Select
                simple
                options={batchNoOptions}
                mode='tags'
                // valueField='id'
                valueField='batchNo'
                labelField='batchNo'
                maxSelected={1}
                disableAll
                disabled={viewOnly}
                onChange={(e, op = {}) => handleSelectedBatch(e, op, row)}
                {...restProps}
              />
            )
          }}
        />
      )
    },
  },
  {
    columnName: 'expiryDate',
    width: 130,
    render: (row) => {
      return (
        <FastField
          name={`prescription[${row.rowIndex}]expiryDate`}
          render={(args) => {
            const restProps = viewOnly ? { value: row.expiryDate } : { ...args }

            return (
              <DatePicker
                text={viewOnly}
                disabled={viewOnly}
                disabledDate={(d) => !d || d.isBefore(moment().add('days', -1))}
                simple
                {...restProps}
              />
            )
          }}
        />
      )
    },
  },
  {
    columnName: 'action',
    align: 'center',
    width: 80,
    render: (row) => {
      return (
        <Tooltip
          title={
            <FormattedMessage id='reception.queue.dispense.printDrugLabel' />
          }
        >
          <Button
            color='primary'
            onClick={() => {
              onPrint({ type: CONSTANTS.DRUG_LABEL, row })
            }}
            justIcon
          >
            <Print />
          </Button>
        </Tooltip>
      )
    },
  },
]

export const VaccinationColumn = [
  {
    name: 'name',
    title: 'Name',
  },
  {
    name: 'remarks',
    title: 'Remarks',
  },
  {
    name: 'batchNo',
    title: 'Batch #',
  },
  {
    name: 'expiryDate',
    title: 'Expiry Date',
  },
  {
    name: 'dispensedQuanity',
    title: 'Qty Dispensed',
  },
  {
    name: 'unitPrice',
    title: 'Unit Price ($)',
  },
  {
    name: 'adjAmt',
    title: 'Item Adj ($)',
  },
  {
    name: 'totalAfterItemAdjustment',
    title: 'Total ($)',
  },
  {
    name: 'action',
    title: 'Action',
  },
]

export const VaccinationColumnExtensions = (
  viewOnly = false,
  inventoryvaccination = [],
  handleSelectedBatch = () => {},
) => [
  {
    columnName: 'name',
    render: (row) => {
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {row.name}
            {lowStockIndicator(row, 'inventoryVaccinationFK')}
          </div>
        </div>
      )
    },
  },
  {
    columnName: 'remarks',
    width: 200,
  },
  {
    columnName: 'dispensedQuanity',
    type: 'number',
    width: 130,
    render: (row) => {
      return (
        <p>
          {numeral(row.dispensedQuanity || 0).format('0,0.0')} {row.dispenseUOM}
        </p>
      )
    },
  },
  { columnName: 'unitPrice', width: 100, type: 'currency' },
  {
    columnName: 'totalAfterItemAdjustment',
    width: 110,
    type: 'currency',
  },
  {
    columnName: 'adjAmt',
    width: 100,
    type: 'currency',
  },
  {
    columnName: 'batchNo',
    width: 150,
    render: (row) => {
      const currentItem = inventoryvaccination.find(
        (o) => o.id === row.inventoryVaccinationFK,
      )
      let batchNoOptions = []
      if (currentItem) {
        batchNoOptions = currentItem.vaccinationStock
      }

      return (
        <FastField
          name={`vaccination[${row.rowIndex}]batchNo`}
          render={(args) => {
            const restProps = viewOnly ? { value: row.batchNo } : { ...args }
            return (
              <Select
                simple
                options={batchNoOptions}
                mode='tags'
                // valueField='id'
                valueField='batchNo'
                labelField='batchNo'
                maxSelected={1}
                disableAll
                disabled={viewOnly}
                onChange={(e, op = {}) => handleSelectedBatch(e, op, row)}
                {...restProps}
              />
            )
            // return (
            //   <TextField
            //     simple
            //     text={viewOnly}
            //     disabled={viewOnly}
            //     {...restProps}
            //   />
            // )
          }}
        />
      )
    },
  },
  {
    columnName: 'expiryDate',
    width: 130,
    render: (row) => {
      return (
        <FastField
          name={`vaccination[${row.rowIndex}]expiryDate`}
          render={(args) => {
            const restProps = viewOnly ? { value: row.expiryDate } : { ...args }
            return (
              <DatePicker
                disabledDate={(d) => !d || d.isBefore(moment().add('days', -1))}
                text={viewOnly}
                disabled={viewOnly}
                simple
                {...restProps}
              />
            )
          }}
        />
      )
    },
  },
  {
    columnName: 'action',
    width: 80,
    render: () => <div />,
  },
]

export const OtherOrdersColumns = [
  {
    name: 'type',
    title: 'Type',
  },
  {
    name: 'description',
    title: 'Description',
  },
  {
    name: 'remarks',
    title: 'Remarks',
  },
  {
    name: 'quantity',
    title: 'Quantity',
  },
  {
    name: 'unitPrice',
    title: 'Unit Price ($)',
  },
  {
    name: 'adjAmt',
    title: 'Item Adj ($)',
  },
  {
    name: 'totalAfterItemAdjustment',
    title: 'Total ($)',
  },
  {
    name: 'action',
    title: 'Action',
  },
]

const compareString = (a, b) => a.localeCompare(b)

export const OtherOrdersColumnExtensions = (viewOnly = false, onPrint) => [
  {
    columnName: 'type',
    compare: compareString,
    width: 160,
    render: (row) => {
      return (
        <div
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {row.type}
        </div>
      )
    },
  },
  {
    columnName: 'description',
    compare: compareString,
    render: (row) => {
      const { code = '', description = '', unitPrice = 0 } = row
      const title = `${description} - ${code} (${currencySymbol}${numeral(
        unitPrice,
      ).format(currencyFormat)})`
      return (
        <Tooltip title={title}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {row.description}
              {lowStockIndicator(row, 'itemFK')}
            </div>
          </div>
        </Tooltip>
      )
    },
  },
  {
    columnName: 'remarks',
    width: 200,
  },
  {
    columnName: 'quantity',
    type: 'number',
    width: 130,
    render: (row) => {
      return (
        <p>
          {numeral(row.quantity || 0).format('0,0.0')} {row.dispenseUOM}
        </p>
      )
    },
  },
  {
    columnName: 'unitPrice',
    // type: 'currency',
    align: 'right',
    width: 100,
    render: (row) => {
      const { type } = row
      if (type !== 'Service' && type !== 'Consumable' && type !== 'Treatment')
        return 'N/A'
      return <NumberInput text currency showZero value={row.unitPrice} />
    },
  },
  {
    columnName: 'adjAmt',
    // type: 'currency',
    align: 'right',
    width: 100,
    render: (row) => {
      const { type } = row
      if (type !== 'Service' && type !== 'Consumable' && type !== 'Treatment')
        return 'N/A'
      return <NumberInput text currency showZero value={row.adjAmt} />
    },
  },
  {
    columnName: 'totalAfterItemAdjustment',
    // type: 'currency',
    align: 'right',
    width: 110,
    render: (row) => {
      const { type } = row
      if (type !== 'Service' && type !== 'Consumable' && type !== 'Treatment')
        return 'N/A'
      return (
        <NumberInput
          text
          currency
          showZero
          value={row.totalAfterItemAdjustment}
        />
      )
    },
  },
  {
    columnName: 'action',
    align: 'center',
    width: 80,
    render: (r) => {
      const { type } = r

      if (type === 'Service' || type === 'Consumable' || type === 'Treatment')
        return null
      return (
        <Tooltip title='Print'>
          <Button
            color='primary'
            justIcon
            onClick={() => {
              onPrint({ type: CONSTANTS.DOCUMENTS, row: r })
            }}
          >
            <Print />
          </Button>
        </Tooltip>
      )
    },
  },
]

export const DrugLabelSelectionColumns = [
  {
    name: 'code',
    title: 'Code',
  },
  {
    name: 'name',
    title: 'Description',
  },
  {
    name: 'instruction',
    title: 'Instructions',
  },
  {
    name: 'dispensedQuanity',
    title: 'Qty Dispensed',
  },
  {
    name: 'no',
    title: 'No. Of Label',
  },
  {
    name: 'print',
    title: 'Print',
  },
]

export const DrugLabelSelectionColumnExtensions = (
  handleDrugLabelSelected,
  handleDrugLabelNoChanged,
) => [
  {
    columnName: 'code',
    width: 150,
    render: (row) => {
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {row.code}
          </div>
        </div>
      )
    },
  },
  {
    columnName: 'name',
    width: 210,
    render: (row) => {
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {row.name}
          </div>
        </div>
      )
    },
  },
  {
    columnName: 'instruction',
    width: 260,
    render: (row) => {
      return (
        <div
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {row.instruction}
        </div>
      )
    },
  },
  {
    columnName: 'dispensedQuanity',
    type: 'number',
    width: 100,
    render: (row) => {
      return (
        <p>
          {row.dispensedQuanity} {row.dispenseUOM}
        </p>
      )
    },
  },
  {
    columnName: 'no',
    type: 'number',
    width: 100,
    render: (row) => {
      return (
        <p>
          <NumberInput
            max={99}
            precision={0}
            min={1}
            value={row.no}
            defaultValue={1}
            onChange={(obj) => {
              handleDrugLabelNoChanged(row.id, obj.target.value)
            }}
          />
        </p>
      )
    },
  },
  {
    columnName: 'print',
    align: 'center',
    width: 80,
    render: (row) => {
      return (
        <Checkbox
          onChange={(obj) => {
            handleDrugLabelSelected(row.id, obj.target.value)
          }}
          checked={row.selected}
          simple
        />
      )
    },
  },
]

export const PackageColumns = [
  {
    name: 'type',
    title: 'Type',
  },
  {
    name: 'description',
    title: 'Description',
  },
  {
    name: 'remarks',
    title: 'Remarks',
  },
  {
    name: 'packageConsumeQuantity',
    title: 'Consumed',
  },
  {
    name: 'packageRemainingQuantity',
    title: 'Balance',
  },
  {
    name: 'totalAfterItemAdjustment',
    title: 'Total ($)',
  },
  {
    name: 'action',
    title: 'Action',
  },
  {
    name: 'packageGlobalId',
    title: 'Package',
  },
]

export const PackageColumnExtensions = (onPrint) => [
  {
    columnName: 'type',
    compare: compareString,
    width: 160,
    sortingEnabled: false,
    render: (row) => {
      return (
        <div
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {row.type}
        </div>
      )
    },
  },
  {
    columnName: 'description',
    compare: compareString,
    sortingEnabled: false,
    render: (row) => {
      const { code = '', description = '', unitPrice = 0 } = row
      const title = `${description} - ${code} (${currencySymbol}${numeral(
        unitPrice,
      ).format(currencyFormat)})`
      return (
        <Tooltip title={title}>
          <div
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {packageDrawdownIndicator(row)}
            <div
              style={{
                position: 'relative',
                left: 22,
              }}
            >
              {row.description}
            </div>
            {lowStockIndicator(row, 'itemFK')}
          </div>
        </Tooltip>
      )
    },
  },
  {
    columnName: 'remarks',
    width: 200,
  },
  {
    columnName: 'packageConsumeQuantity',
    align: 'right',
    width: 130,
    sortingEnabled: false,
    render: (row) => {
      return (
        <p>
          {numeral(row.packageConsumeQuantity || 0).format('0,0.0')}{' '}
          {row.dispenseUOM}
        </p>
      )
    },
  },
  {
    columnName: 'packageRemainingQuantity',
    align: 'right',
    width: 130,
    sortingEnabled: false,
    render: (row) => {
      const { packageDrawdown } = row
      let drawdownTransaction = []
      let balanceQty = row.quantity
      const todayQuantity = row.packageConsumeQuantity

      if (packageDrawdown) {
        if (
          packageDrawdown.packageDrawdownTransaction &&
          packageDrawdown.packageDrawdownTransaction.length > 0
        ) {
          drawdownTransaction = packageDrawdown.packageDrawdownTransaction.filter(
            (t) => t.consumeDate < row.packageDrawdownAsAtDate,
          )
        }

        // Transferred quantity
        let transferredQty = 0
        const { packageDrawdownTransfer } = packageDrawdown
        if (packageDrawdownTransfer && packageDrawdownTransfer.length > 0) {
          const drawdownTransfer = packageDrawdownTransfer.filter(
            (t) => t.transferDate < row.packageDrawdownAsAtDate,
          )
          drawdownTransfer.forEach((transfer) => {
            transferredQty += transfer.quantity
          })
        }

        // Received (Transfer back) quantity
        let receivedQty = 0
        const { packageDrawdownReceive } = packageDrawdown
        if (packageDrawdownReceive && packageDrawdownReceive.length > 0) {
          const drawdownReceive = packageDrawdownReceive.filter(
            (t) => t.transferDate < row.packageDrawdownAsAtDate,
          )
          drawdownReceive.forEach((receive) => {
            receivedQty += receive.quantity
          })
        }

        const totalQty =
          packageDrawdown.totalQuantity - transferredQty + receivedQty
        let totalDrawdown = 0
        drawdownTransaction.forEach((txn) => {
          totalDrawdown += txn.consumeQuantity
        })
        balanceQty = totalQty - totalDrawdown
      }
      return (
        <p>
          {numeral((balanceQty || 0) - (todayQuantity || 0)).format(
            '0,0.0',
          )}{' '}
          {row.dispenseUOM}
        </p>
      )
    },
  },
  {
    columnName: 'totalAfterItemAdjustment',
    align: 'right',
    width: 110,
    sortingEnabled: false,
    render: (row) => {
      return (
        <NumberInput
          text
          currency
          showZero
          value={row.totalAfterItemAdjustment}
        />
      )
    },
  },
  {
    columnName: 'action',
    align: 'center',
    width: 80,
    sortingEnabled: false,
    render: (r) => {
      const { type } = r

      if (type === 'Service' || type === 'Consumable' || type === 'Vaccination')
        return null
      return (
        <Tooltip
          title={
            <FormattedMessage id='reception.queue.dispense.printDrugLabel' />
          }
        >
          <Button
            color='primary'
            justIcon
            onClick={() => {
              onPrint({ type: CONSTANTS.DRUG_LABEL, row: r })
            }}
          >
            <Print />
          </Button>
        </Tooltip>
      )
    },
  },
]
