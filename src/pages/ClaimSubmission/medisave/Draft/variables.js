import { Tooltip } from '@/components'
import Warining from '@material-ui/icons/Error'

export const DraftMedisaveColumns = [
  {
    name: 'visitDate',
    title: 'Visit Date',
  },
  {
    name: 'patientAccountNo',
    title: 'Account No.',
  },
  {
    name: 'patientName',
    title: 'Patient Name',
  },
  {
    name: 'schemeTypeDisplayValue',
    title: 'Scheme Type',
  },
  {
    name: 'payerName',
    title: 'Payer Name',
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
    name: 'chargeCode',
    title: 'Charge Code',
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
    name: 'chasClaimAmt',
    title: 'CHAS Claim Amt.',
  },
  {
    name: 'claimAmount',
    title: 'Claim Amt.',
  },
  {
    name: 'action',
    title: 'Action',
  },
]

export const DraftMedisaveColumnExtensions = [
  { columnName: 'visitDate', type: 'date', width: 100 },
  { columnName: 'invoiceDate', type: 'date', width: 120 },
  { columnName: 'chargeCode', width: 120 },
  {
    columnName: 'schemeCategoryDisplayValue',
    width: 145,
    sortBy: 'schemeCategory',
  },
  {
    columnName: 'invoiceAmount',
    type: 'currency',
    currency: true,
    sortBy: 'invoiceAmt',
  },
  {
    columnName: 'claimAmount',
    type: 'currency',
    currency: true,
    sortBy: 'claimAmt',
  },
  {
    columnName: 'chasClaimAmt',
    type: 'currency',
    currency: true,
    sortBy: 'chasClaimAmt',
    width: 145,
  },
  {
    columnName: 'schemeTypeDisplayValue',
    sortBy: 'SchemeTypeFKNavigation.DisplayValue',
  },
  {
    columnName: 'visitDoctorName',
    sortBy: 'DoctorProfileFKNavigation.ClinicianProfile.Name',
  },
  {
    columnName: 'patientName',
    render: (row) => {
      return (
        <Tooltip
          title={
            row.patientIsActive ? (
              row.patientName
            ) : (
              'This patient has been inactived.'
            )
          }
        >
          <span>
            {!row.patientIsActive && (
              <Warining color='error' style={{ marginRight: 5 }} />
            )}
            {row.patientName}
          </span>
        </Tooltip>
      )
    },
  },
  {
    columnName: 'diagnosis',
    sortingEnabled: false,
    render: (row) => {
      let diagnoisisList = row.diagnosis.join(", ")
      return (
        <Tooltip title={diagnoisisList}>
          <span className title={diagnoisisList}>
            {diagnoisisList}
          </span>
        </Tooltip>
      )
    },
  },
]
