import React, { Fragment } from 'react'
import moment from 'moment'
// components
import {
  DoctorLabel,
  CallingQueueButton,
  ServePatientButton,
} from '@/components/_medisys'
import {
  CodeSelect,
  DateFormatter,
  Tooltip,
  dateFormatLong,
  dateFormatLongWithTimeNoSec12h,
} from '@/components'
// utils
import { calculateAgeFromDOB } from '@/utils/dateUtils'
// variables
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import Authorized from '@/utils/Authorized'
import NurseWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/NurseWorkItemInfo'
import RadioWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/RadioWorkItemInfo'
import LabWorkItemInfo from '@/pages/Reception/Queue/Grid/WorkItemPopover/LabWorkItemInfo'
import { VISIT_TYPE } from '@/utils/constants'
import DoctorConsultationStatus from './DoctorConsultationStatus'

const compareString = (a, b) => a.localeCompare(b)
const compareDoctor = (a, b) => {
  const titleA = a.clinicianProfile.title ? `${a.clinicianProfile.title} ` : ''
  const nameA = `${titleA}${a.clinicianProfile.name}`

  const titleB = b.clinicianProfile.title ? `${b.clinicianProfile.title} ` : ''
  const nameB = `${titleB}${b.clinicianProfile.name}`
  return nameA.localeCompare(nameB)
}

const compareTime = (a, b) => {
  if (a === '-' && b !== '-') return -1
  if (a !== '-' && b === '-') return 1

  const momentA = moment(a)
  const momentB = moment(b)
  if (momentA.isSameOrBefore(momentB)) return -1
  if (momentA.isSameOrAfter(momentB)) return 1

  return 0
}

const compareQueueNo = (a, b) => {
  const floatA = parseFloat(a)
  const floatB = parseFloat(b)
  if (Number.isNaN(floatA) || Number.isNaN(floatB)) {
    return -1
  }

  return floatA < floatB ? -1 : 1
}

const mapServingPersonsString = servingByList =>
  servingByList && servingByList.map(o => o.servingBy).join(', ')

const compareServingPerson = (a, b) => {
  return compareString(mapServingPersonsString(a), mapServingPersonsString(b))
}

const filterRadioWorkItem = workItem => {
  return workItem.filter(x => x.type === 'Radiology')
}

const filterNurseWorkItem = workItem => {
  return workItem.filter(x => x.nurseWorkitem)
}

const filterLabWorkItem = workItem => {
  return workItem
    .filter(x => x.type === 'Lab')
    .map(x => x.labWorkitems)
    .flat()
}

export const FuncConfig = {
  pager: false,
  sort: true,
  columnReorderable: true,
  columnSelectable: true,
  sortConfig: {
    defaultSorting: [{ columnName: 'queueNo', direction: 'asc' }],
  },
  resizable: true,
  selectRowHighlightable: true,
}

export const AppointmentTableConfig = {
  columns: [
    { name: 'visitStatus', title: 'Status' },
    { name: 'patientName', title: 'Patient Name' },
    { name: 'patientAccountNo', title: 'Acc. No.' },
    { name: 'gender/age', title: 'Gender / Age' },
    { name: 'doctorName', title: 'Doctor' },
    { name: 'appointmentTime', title: 'Appt. Time' },
    { name: 'roomNo', title: 'Room No.' },
    { name: 'remarks', title: 'Remarks' },
    { name: 'patientContactNo', title: 'Phone' },
    { name: 'action', title: 'Action' },
  ],
  identifier: 'reception_appointment',
}

export const ApptColumnExtensions = [
  // {
  //   columnName: 'visitStatus',
  //   width: 180,
  //   render: (row) => <VisitStatusTag row={row} />,
  // },
  { columnName: 'patientAccountNo', compare: compareString, width: 120 },
  {
    columnName: 'patientName',
    width: 250,
    compare: compareString,
  },
  {
    columnName: 'doctorName',
    width: 250,
    render: row => {
      const _title = row.title ? `${row.title || ''} ` : ''
      return `${_title}${row.doctorName || ''}`
    },
  },
  {
    columnName: 'gender/age',
    render: row => {
      const { genderFK, dob, patientProfileFk } = row
      if (!patientProfileFk) return null
      const gender = (
        <CodeSelect
          text
          code='ctgender'
          value={genderFK}
          valueField='id'
          labelField='code'
        />
      )
      const age = calculateAgeFromDOB(dob)
      return (
        <React.Fragment>
          {gender}
          <span>/{age}</span>
        </React.Fragment>
      )
    },
    width: 100,
    sortingEnabled: false,
  },
  {
    columnName: 'roomNo',
    render: row => row.roomNo || '-',
    width: 120,
  },
  {
    columnName: 'remarks',
    width: 180,
    render: row => row.remarks || '-',
  },
  {
    columnName: 'appointmentTime',
    width: 150,
    type: 'date',
    showTime: true,
    render: row => {
      if (row.appointmentTime) {
        return moment(row.appointmentTime).format('DD MMM YYYY HH:mm')
      }
      return '-'
    },
  },
  {
    columnName: 'patientContactNo',
    width: 120,
  },
]

export const QueueTableConfig = {
  columns: [
    { name: 'visitStatus', title: 'Status' },
    { name: 'queueNo', title: 'Q. No.' },
    { name: 'visitGroup', title: 'Group No.' },
    {
      name: 'consReady',
      title: 'Cons. Ready',
      fullTitle: 'Ready for Consultation',
    },
    { name: 'workItem', title: 'Work Item' },
    { name: 'servingByList', title: 'Serving By' },
    { name: 'patientReferenceNo', title: 'Ref. No.' },
    { name: 'patientName', title: 'Patient Name' },
    { name: 'orderCreateTime', title: 'Order Created Time' },
    { name: 'patientAccountNo', title: 'Acc. No.' },
    { name: 'gender/age', title: 'Gender / Age' },
    { name: 'doctor', title: 'Doctor' },
    { name: 'appointmentTime', title: 'Appt. Time' },
    { name: 'roomNo', title: 'Room No.' },
    { name: 'remarks', title: 'Remarks' },
    { name: 'timeIn', title: 'Time In' },
    { name: 'timeOut', title: 'Time Out' },
    { name: 'invoiceNo', title: 'Invoice No' },
    { name: 'invoiceStatus', title: 'Invoice Status' },
    { name: 'invoiceAmount', title: 'Invoice Amt.' },
    // { name: 'invoicePaymentMode', title: 'Payment Mode' },
    { name: 'invoiceGST', title: 'GST' },
    { name: 'invoicePaymentAmount', title: 'Payment' },
    { name: 'invoiceOutstanding', title: 'Outstanding' },
    { name: 'patientScheme', title: 'Scheme' },
    { name: 'patientMobile', title: 'Phone' },
    { name: 'visitOrderTemplate', title: 'Visit Purpose' },
    { name: 'action', title: 'Action' },
  ],
  leftColumns: ['visitStatus', 'queueNo', 'patientName'],
  identifier: 'reception',
}

export const QueueColumnExtensions = [
  // {
  //   columnName: 'visitStatus',
  //   width: 180,
  //   render: (row) => <VisitStatusTag row={row} />,
  // },
  {
    columnName: 'queueNo',
    width: 80,
    compare: compareQueueNo,
    render: row => {
      return (
        <Fragment>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{row.queueNo}</span>
            <div>
              {row.patientIsActive &&
                row.visitStatus !== VISIT_STATUS.UPCOMING_APPT && (
                  <Authorized authority='openqueuedisplay'>
                    <CallingQueueButton
                      qId={row.queueNo}
                      patientName={row.patientName}
                      from='Queue'
                    />
                  </Authorized>
                )}
            </div>
          </div>
        </Fragment>
      )
    },
  },
  { columnName: 'patientAccountNo', compare: compareString, width: 120 },
  {
    columnName: 'visitGroup',
    align: 'center',
  },
  {
    columnName: 'invoiceNo',
    width: 120,
  },
  {
    columnName: 'roomNo',
    width: 120,
  },
  {
    columnName: 'remarks',
    width: 180,
  },
  {
    columnName: 'patientScheme',
    width: 200,
  },
  {
    columnName: 'invoiceStatus',
    width: 120,
  },
  {
    columnName: 'patientMobile',
    width: 120,
  },
  // {
  //   columnName: 'invoicePaymentMode',
  //   width: 150,
  //   render: (row) => row.invoicePaymentMode || '-',
  // },
  {
    columnName: 'patientName',
    width: 250,
    compare: compareString,
  },
  {
    columnName: 'orderCreateTime',
    width: 150,
    type: 'date',
    showTime: true,
    render: row => {
      if (row.orderCreateTime) {
        return moment(row.orderCreateTime).format('DD MMM YYYY HH:mm')
      }
      return '-'
    },
  },
  { columnName: 'referralCompany', width: 150 },
  { columnName: 'referralPerson', width: 150 },
  { columnName: 'referralRemarks', width: 150 },
  { columnName: 'invoiceAmount', type: 'number', currency: true, width: 120 },
  {
    columnName: 'invoicePaymentAmount',
    type: 'number',
    currency: true,
    width: 120,
  },
  { columnName: 'invoiceGST', type: 'number', currency: true, width: 120 },
  {
    columnName: 'invoiceOutstanding',
    type: 'number',
    currency: true,
    width: 120,
  },
  {
    columnName: 'timeIn',
    width: 150,
    type: 'date',
    showTime: true,
    render: row => {
      if (row.timeIn) {
        return moment(row.timeIn).format('DD MMM YYYY HH:mm')
      }
      return '-'
    },
  },
  {
    columnName: 'timeOut',
    width: 150,
    type: 'date',
    showTime: true,
    render: row => {
      if (row.timeOut) {
        return moment(row.timeOut).format('DD MMM YYYY HH:mm')
      }
      return '-'
    },
  },
  {
    columnName: 'gender/age',
    render: row => {
      const { dob, gender = 'U' } = row

      const ageLabel = calculateAgeFromDOB(dob)
      return (
        <Tooltip title={`${gender}/${ageLabel}`}>
          <span>{`${gender}/${ageLabel}`}</span>
        </Tooltip>
      )
    },
    width: 100,
    sortingEnabled: false,
  },
  {
    columnName: 'appointmentTime',
    width: 150,
    type: 'date',
    showTime: true,
    // compare: compareTime,
    render: row => {
      if (row.appointmentTime) {
        const appointmentDate = moment(row.appointmentTime).format(
          'DD MMM YYYY',
        )
        return moment(
          `${appointmentDate} ${row.appointmentResourceStartTime}`,
        ).format('DD MMM YYYY HH:mm')
      }
      return '-'
    },
  },
  {
    columnName: 'doctor',
    render: row => {
      if (row.visitPurposeFK !== VISIT_TYPE.MC) {
        return <DoctorLabel doctor={row.doctor} hideMCR />
      }

      const showVisitDoctor = () => {
        return row.visitDoctor.map(d => {
          return <DoctorConsultationStatus doctor={d} />
        })
      }

      return <DoctorConsultationStatus visitDoctor={row.visitDoctor} />
    },
    sortingEnabled: false,
    width: 280,
  },
  {
    columnName: 'visitOrderTemplate',
    width: 180,
  },
  {
    columnName: 'workItem',
    width: 180,
    render: row => {
      const labWorkItems = filterLabWorkItem(row.workItem)
      const radioWorkItems = filterRadioWorkItem(row.workItem)
      const nurseWorkItems = filterNurseWorkItem(row.workItem)
      const labWorkItemsAccessRight = Authorized.check(
        'queue.workitem.labworkitem',
      ) || { rights: 'hidden' }
      const radiologyWorkItemsAccessRight = Authorized.check(
        'queue.workitem.radiologyworkitem',
      ) || { rights: 'hidden' }
      const nurseWorkItemsAccessRight = Authorized.check(
        'queue.workitem.nurseworkitem',
      ) || { rights: 'hidden' }
      return (
        <div style={{ justifyContent: 'space-between' }}>
          {labWorkItemsAccessRight.rights === 'enable' &&
            labWorkItems &&
            labWorkItems.length > 0 && (
              <LabWorkItemInfo
                values={labWorkItems}
                style={{ marginRight: 18 }}
              />
            )}
          {radiologyWorkItemsAccessRight.rights === 'enable' &&
            radioWorkItems &&
            radioWorkItems.length > 0 && (
              <RadioWorkItemInfo values={radioWorkItems} />
            )}
          {nurseWorkItemsAccessRight.rights === 'enable' &&
            nurseWorkItems &&
            nurseWorkItems.length > 0 && (
              <NurseWorkItemInfo values={nurseWorkItems} />
            )}
        </div>
      )
    },
  },
  {
    columnName: 'servingByList',
    compare: compareServingPerson,
    width: 130,
    render: row => {
      const servingPersons = mapServingPersonsString(row.servingByList)
      return (
        <Fragment>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'left',
            }}
          >
            <Tooltip title={servingPersons}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {servingPersons}
              </span>
            </Tooltip>
            <div>
              {row.visitFK && (
                <Authorized authority='queue.servepatient'>
                  <ServePatientButton
                    visitFK={row.visitFK}
                    servingPersons={row.servingByList}
                    patientName={row.patientName}
                  />
                </Authorized>
              )}
            </div>
          </div>
        </Fragment>
      )
    },
  },
]
