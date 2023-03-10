import React from 'react'
import { Tooltip } from '@/components'
import NumberInput from '@/components/NumberInput'
import Warining from '@material-ui/icons/Error'

export const ApprovedCHASColumns = [
  {
    name: 'submissionDate',
    title: 'Submission Date',
  },
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
    name: 'chasClaimStatusDescription',
    title: 'Claim Status',
  },
  {
    name: 'approvedAmount',
    title: 'Approved Amt.',
  },
  {
    name: 'collectedPayment',
    title: 'Collected Amt.',
  },
  {
    name: 'action',
    title: 'Action',
  },
]

export const ApprovedCHASColumnExtensions = [
  { columnName: 'visitDate', type: 'date', width: 100 },
  { columnName: 'invoiceDate', type: 'date', width: 100 },
  { columnName: 'submissionDate', type: 'date', width: 120 },
  { columnName: 'invoiceNo', width: 90 },
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
      let diagnoisisList = row.diagnosis.join(', ')
      return (
        <Tooltip title={diagnoisisList}>
          <span className title={diagnoisisList}>
            {diagnoisisList}
          </span>
        </Tooltip>
      )
    },
  },
  {
    columnName: 'schemeTypeDisplayValue',
    sortBy: 'SchemeTypeFKNavigation.DisplayValue',
  },
  {
    columnName: 'schemeCategoryDisplayValue',
    width: 145,
    sortBy: 'schemeCategory',
  },
  { columnName: 'submissionDate', type: 'date', width: 140 },
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
    columnName: 'collectedPayment',
    type: 'currency',
    currency: true,
    sortingEnabled: false,
    render: (row) => {
      if (row.chasClaimStatusDescription === 'Paid')
        return (
          <NumberInput
            currency
            text
            value={row.collectedPayment}
            rightAlign
            readonly
          />
        )
      return '-'
    },
  },
  {
    columnName: 'approvedAmount',
    type: 'currency',
    currency: true,
    sortBy: 'ApprovedAmt',
    render: (row) => {
      if (row.chasClaimStatusDescription === 'Paid')
        return (
          <NumberInput
            currency
            text
            value={row.approvedAmount}
            rightAlign
            readonly
          />
        )
      return '-'
    },
  },
]
