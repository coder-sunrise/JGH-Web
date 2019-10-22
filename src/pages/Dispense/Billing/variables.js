import * as Yup from 'yup'
import { INVOICE_ITEM_TYPE } from '@/utils/constants'

export const SchemeInvoicePayerColumn = [
  { name: 'invoiceItemTypeFk', title: 'Category' },
  { name: 'itemCode', title: 'Name' },
  { name: 'coverage', title: 'Coverage' },
  { name: 'totalAfterGst', title: 'Payable Amount ($)' },
  { name: 'claimAmount', title: 'Claim Amount ($)' },
]

export const CompanyInvoicePayerColumn = [
  { name: 'invoiceItemTypeFk', title: 'Category' },
  { name: 'itemCode', title: 'Name' },
  { name: 'totalAfterGst', title: 'Payable Amount ($)' },
  { name: 'claimAmount', title: 'Claim Amount ($)' },
]

export const ApplyClaimsColumnExtension = [
  {
    columnName: 'invoiceItemTypeFk',
    // type: 'codeSelect',
    // code: 'ltinvoiceitemtype',
    render: (row) => INVOICE_ITEM_TYPE[row.invoiceItemTypeFk],
  },
  { columnName: 'itemCode', disabled: true },
  {
    columnName: 'coverage',
    align: 'right',
    disabled: true,
  },
  {
    columnName: 'totalAfterGst',
    type: 'currency',
    currency: true,
    disabled: true,
  },
  {
    columnName: 'claimAmount',
    type: 'currency',
    currency: true,
  },
]

export const CoPayerColumns = [
  { name: 'itemCode', title: 'Name' },
  { name: 'totalAfterGst', title: 'Payable Amount' },
  {
    name: 'claimAmount',
    title: 'Claim Amount',
  },
]

export const CoPayerColExtensions = [
  {
    columnName: 'itemCode',
    disabled: true,
  },
  {
    columnName: 'totalAfterGst',
    type: 'number',
    currency: true,
    disabled: true,
  },
  {
    columnName: 'claimAmount',
    type: 'number',
    currency: true,
  },
]

export const validationSchema = Yup.object().shape({
  coverage: Yup.string(),
  totalAfterGst: Yup.number(),
  claimAmount: Yup.number().when(
    [
      'coverage',
      'totalAfterGst',
    ],
    (coverage, totalAfterGst, schema) => {
      const isPercentage = coverage.indexOf('%') > 0
      let _absoluteValue = 0
      if (isPercentage) {
        const percentage = parseFloat(coverage.slice(0, -1))
        _absoluteValue = totalAfterGst * percentage / 100
      } else _absoluteValue = coverage.slice(1)
      const message =
        _absoluteValue === totalAfterGst
          ? 'Claim Amount cannot exceed Total Payable'
          : `Claim Amount cannot exceed Coverage amount ($${_absoluteValue})`
      return schema.min(0).max(_absoluteValue, message)
    },
  ),
})
