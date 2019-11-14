export const NewCHASColumns = [
  {
    name: 'visitDate',
    title: 'Visit Date',
  },
  {
    name: 'patientAccountNo',
    title: 'Account No',
  },
  {
    name: 'patientName',
    title: 'Patient Name',
  },
  {
    name: 'visitDoctorName',
    title: 'Doctor',
  },
  {
    name: 'diagnosis',
    title: 'Diagnosis',
  },
  {
    name: 'schemeTypeDisplayValue',
    title: 'Scheme Type',
  },
  {
    name: 'schemeCategoryDisplayValue',
    title: 'Scheme Category',
  },
  {
    name: 'invoiceNo',
    title: 'Invoice No.',
  },
  {
    name: 'invoiceDate',
    title: 'Invoice Date',
  },
  {
    name: 'invoiceAmount',
    title: 'Invoice Amt.',
  },
  {
    name: 'claimAmount',
    title: 'Claim Amt.',
  },
  {
    name: 'rejectionReason',
    title: 'Rejection Reason',
  },
  {
    name: 'action',
    title: 'Action',
  },
]

export const NewCHASColumnExtensions = [
  { columnName: 'visitDate', type: 'date' },
  { columnName: 'invoiceDate', type: 'date' },
  { columnName: 'rejectionReason', width: 145 },
  { columnName: 'schemeCategoryDisplayValue', width: 145 , sortBy:'schemeCategory'},
  { columnName: 'invoiceAmount', type: 'currency', currency: true },
  { columnName: 'claimAmount', type: 'currency', currency: true },
]
