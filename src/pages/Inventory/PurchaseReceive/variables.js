// material ui icons
import Edit from '@material-ui/icons/Edit'
import Duplicate from '@material-ui/icons/FileCopy'
import Print from '@material-ui/icons/Print'
import { formatMessage } from 'umi/locale'
import PurchaseOrder from './Details/PurchaseOrder'
import DeliveryOrder from './Details/DeliveryOrder'
import Payment from './Details/Payment'
import moment from 'moment'

const isDuplicatePOAllowed = (status) => {
  const allowedStatus = [
    'Partially Received',
    'Finalized',
    'Fulfilled',
  ]
  return !(allowedStatus.indexOf(status) > -1)
}

export const isPOStatusDraft = (status) => {
  const allowedStatus = [
    'Draft',
    'Cancelled',
  ]
  return allowedStatus.indexOf(status) > -1
}

export const isPOStatusFinalized = (status) => {
  const allowedStatus = [
    'Finalized',
  ]
  return allowedStatus.indexOf(status) > -1
}

export const PurchaseReceiveGridCol = [
  { name: 'purchaseOrderNo', title: 'PO No' },
  { name: 'purchaseOrderDate', title: 'PO Date' },
  { name: 'supplier', title: 'Supplier' },
  { name: 'expectedDeliveryDate', title: 'Expected Delivery Date' },
  { name: 'purchaseOrderStatus', title: 'PO Status' },
  { name: 'totalAmount', title: 'Total' },
  { name: 'outstanding', title: 'Outstanding' },
  { name: 'invoiceStatus', title: 'Inv. Status' },
  { name: 'remarks', title: 'Remarks' },
  { name: 'action', title: 'Action' },
]

export const PurchaseReceiveGridTableConfig = {
  FuncProps: {
    selectable: true,
    selectConfig: {
      // showSelectAll: true
    },
  }
}

export const ContextMenuOptions = (row) => {
  return [
    {
      id: 0,
      label: 'Edit',
      Icon: Edit,
      disabled: false,
    },
    {
      id: 1,
      label: 'Duplicate PO',
      Icon: Duplicate,
      disabled: isDuplicatePOAllowed(row.poStatus),
    },
    { isDivider: true },
    {
      id: 2,
      label: 'Print',
      Icon: Print,
      disabled: false,
    },
  ]
}

const addContent = (type, props) => {
  switch (type) {
    case 1:
      return <PurchaseOrder {...props} />
    case 2:
      return <DeliveryOrder {...props} />
    case 3:
      return <Payment {...props} />
    default:
      return <PurchaseOrder {...props} />
  }
}

export const PurchaseReceiveDetailOption = (poStatus, props) => [
  {
    id: 0,
    name: formatMessage({
      id: 'inventory.pr.detail.pod',
    }),
    content: addContent(1, props),
  },
  {
    id: 1,
    name: formatMessage({
      id: 'inventory.pr.detail.dod',
    }),
    content: addContent(2, props),
    disabled: isPOStatusDraft(poStatus),
  },
  {
    id: 2,
    name: formatMessage({
      id: 'inventory.pr.detail.payment',
    }),
    content: addContent(3, props),
    disabled: isPOStatusDraft(poStatus),
  },
]

export const amountProps = {
  style: { margin: 0 },
  noUnderline: true,
  currency: true,
  disabled: true,
  rightAlign: true,
  normalText: true,
}

export const fakeQueryDoneData = {
  purchaseOrder: {
    poNo: 'PO/000999',
    poDate: moment(),
    //status: 'Draft',
    status: 'Finalized',
    shippingAddress:
      '24 Raffles Place, Clifford Centre, #07-02A, Singapore 048621',
    IsGSTEnabled: true,
    IsGSTInclusive: true,
    invoiceGST: 10.7,
    invoiceTotal: 163.6,
  },
  rows: [],
  purchaseOrderMedicationItem: [
    {
      id: 1,
      inventoryMedicationFK: 35,
      uom: 35,
      orderQty: 1,
      bonusQty: 0,
      totalQty: 1,
      totalAfterAdjustments: 0.0,
      totalAfterGst: 0.0,
      quantityReceived: 0,
      totalPrice: 25.0,
      unitPrice: 25.0,
      isDeleted: false,
    },
  ],
  purchaseOrderVaccinationItem: [
    {
      id: 1,
      inventoryVaccinationFK: 10,
      uom: 10,
      orderQty: 1,
      bonusQty: 0,
      totalQty: 1,
      totalAfterAdjustments: 0.0,
      totalAfterGst: 0.0,
      quantityReceived: 0,
      totalPrice: 40.0,
      unitPrice: 40.0,
      isDeleted: false,
    },
  ],
  purchaseOrderConsumableItem: [
    {
      id: 1,
      inventoryConsumableFK: 8,
      uom: 8,
      orderQty: 1,
      bonusQty: 0,
      totalQty: 1,
      totalAfterAdjustments: 0.0,
      totalAfterGst: 0.0,
      quantityReceived: 0,
      totalPrice: 48.0,
      unitPrice: 48.0,
      isDeleted: false,
    },
    {
      id: 1,
      inventoryConsumableFK: 10,
      uom: 10,
      orderQty: 1,
      bonusQty: 0,
      totalQty: 1,
      totalAfterAdjustments: 0.0, // tempSubTotal || totalPrice - itemLevelGST
      totalAfterGst: 0.0, // tempSubTotal + itemLevelGST
      quantityReceived: 1,
      totalPrice: 50.0,
      unitPrice: 50.0,
      isDeleted: false,
    },
  ],
  purchaseOrderAdjustment: [
    {
      id: 1,
      adjRemark: 'Adj 001',
      adjType: 'ExactAmount',
      adjValue: -24,
      sequence: 1,
      adjDisplayAmount: -24,
      isDeleted: false,
    },
    {
      id: 2,
      adjRemark: 'Adj 002',
      adjType: 'Percentage',
      adjValue: 10,
      sequence: 2,
      adjDisplayAmount: 13.9,
      isDeleted: false,
    },
  ],
}

export const fakeDOQueryDoneData = [
  {
    id: 1,
    doNo: 'DO/000001',
    doDate: moment(),
    total: 20,
    outstanding: 15,
    remarks: 'Will provide on 31 Jun 2018',
  },
  {
    id: 2,
    doNo: 'DO/000002',
    doDate: moment(),
    total: 50,
    outstanding: 0,
    remarks: 'Completed',
  },
  {
    id: 3,
    doNo: 'DO/000003',
    doDate: moment(),
    total: 20,
    outstanding: 15,
    remarks: 'Need Another Orders',
  },
  {
    id: 4,
    doNo: 'DO/000004',
    doDate: moment(),
    total: 20,
    outstanding: 15,
    remarks: 'Need Another Orders',
  },
  {
    id: 5,
    doNo: 'DO/000004',
    doDate: moment(),
    total: 20,
    outstanding: 15,
    remarks: 'Need Another Orders',
  },
]

export const fakePodoPaymentData = [
  {
    id: 1,
    paymentNo: 'P/000001',
    paymentDate: moment(),
    paymentMode: 'Cash',
    reference: 'REF/000001',
    paymentAmount: 119.99,
    remarks: 'Paid',
  },
  {
    id: 2,
    paymentNo: 'P/000002',
    paymentDate: moment(),
    paymentMode: 'Cash',
    reference: 'REF/000002',
    paymentAmount: 129.99,
    remarks: 'Paid',
  },
]
