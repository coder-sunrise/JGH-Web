import moment from 'moment'
import _ from 'lodash'
import numeral from 'numeral'
import Authorized from '@/utils/Authorized'
import { currencySymbol, qtyFormat } from '@/utils/config'
import { dateFormatLong, dateFormatLongWithTime } from '@/components'
import {
  UNFIT_TYPE,
  SCRIBBLE_NOTE_TYPE,
  VISITDOCTOR_CONSULTATIONSTATUS,
} from './constants'
import { calculateAgeFromDOB } from './dateUtils'

const status = [
  {
    value: false,
    name: 'Inactive',
    render: () => <span style={{ color: 'red' }}>Inactive</span>,
  },
  {
    value: true,
    name: 'Active',
    render: () => <span style={{ color: 'green' }}>Active</span>,
  },
]

const approvedStatus = [
  {
    value: 'AP',
    name: 'Approved',
    render: () => <span>Approved</span>,
  },
  {
    value: 'EP',
    name: 'Extracted to Payment Process',
    render: () => <span>Extracted to Payment Process</span>,
  },
  {
    value: 'PD',
    name: 'Paid',
    render: () => <span>Paid</span>,
  },
  {
    value: 'RV',
    name: 'Recovery Pending',
    render: () => <span>Recovery Pending</span>,
  },
  {
    value: 'RV2',
    name: 'Recovery Extracted',
    render: () => <span>Recovery Extracted</span>,
  },
  {
    value: 'RV3',
    name: 'Recovered',
    render: () => <span>Recovered</span>,
  },
]
const claimStatus = [
  {
    value: 'SU',
    name: 'Submitted',
    render: () => <span>Submitted</span>,
  },
  ...approvedStatus,
  {
    value: 'RJ',
    name: 'Rejected',
    render: () => <span>Rejected</span>,
  },
  {
    value: 'AE',
    name: 'Appealed',
    render: () => <span>Rejected</span>,
  },
  {
    value: 'PR',
    name: 'Pending for Screening Report',
    render: () => <span>Pending for Screening Report</span>,
  },
  {
    value: 'PBA',
    name: 'Pending Batch Approval',
    render: () => <span>Pending Batch Approval</span>,
  },
  {
    value: 'DF',
    name: 'Draft',
    render: () => <span>Draft</span>,
  },
  {
    value: 'OH',
    name: 'OnHold',
    render: () => <span>On-Hold</span>,
  },
  {
    value: 'CA',
    name: 'Cancellation Submitted',
    render: () => <span>Cancellation Submitted</span>,
  },
  {
    value: 'CA2',
    name: 'Cancellation Extracted',
    render: () => <span>Cancellation Extracted</span>,
  },
  {
    value: 'CA3',
    name: 'Cancelled',
    render: () => <span>Cancelled</span>,
  },
]
const chasSchemeTypes = [
  { code: 'CHASGREEN', displayValue: 'CHAS Green' },
  { code: 'CHASBLUE', displayValue: 'CHAS Blue' },
  { code: 'CHASORANGE', displayValue: 'CHAS Orange' },
  { code: 'CHASMG', displayValue: 'CHAS MG (Merdeka Generation)' },
  { code: 'CHASPG', displayValue: 'CHAS PG (Pioneer Generation)' },
  { code: 'CHASPA', displayValue: 'CHAS PA (Public Assistance)' },
  { code: 'PHPCCHILD', displayValue: 'PHPC Child' },
  { code: 'PGPCADULT', displayValue: 'PHPC Adult' },
  { code: 'PHPCSELF', displayValue: 'PHPC Self' },
  { code: 'PHPCMFAC', displayValue: 'PHPC MFAC' },
  { code: 'PHPCMFEC', displayValue: 'PHPC MFEC' },
]
const statusString = [
  {
    value: 'Inactive',
    name: 'Inactive',
    render: () => <span style={{ color: 'red' }}>Inactive</span>,
  },
  {
    value: 'Active',
    name: 'Active',
    render: () => <span style={{ color: 'green' }}>Active</span>,
  },
]

const isAutoOrder = [
  { value: false, name: 'No' },
  { value: true, name: 'Yes' },
]

const osBalanceStatus = [
  { value: 'all', name: 'All(Yes/No)', color: 'all' },
  { value: 'yes', name: 'Yes', color: 'yes' },
  { value: 'no', name: 'No', color: 'no' },
]

const sessionOptions = [
  { value: 'all', name: 'All Sessions' },
  { value: 'current', name: 'Current Session' },
  { value: 'past', name: 'Past Session' },
]

const smsStatus = [
  {
    name: 'Sent',
    value: 1,
  },
  {
    name: 'Failed',
    value: 2,
  },
]

const messageStatus = [
  {
    name: 'Read',
    value: 'Read',
  },
  {
    name: 'Unread',
    value: 'Unread',
  },
]

const appointmentStatus = [
  {
    name: 'All',
    value: undefined,
  },
  {
    name: 'Draft',
    value: 2,
  },
  {
    name: 'Scheduled',
    value: 1,
  },
  {
    name: 'Rescheduled',
    value: 5,
  },
]

const appointmentStatusReception = [
  {
    name: 'Scheduled',
    value: 1,
  },
  {
    name: 'Draft',
    value: 2,
  },
  {
    name: 'Cancelled',
    value: 3,
  },
  {
    name: 'Turned Up',
    value: 4,
  },
  {
    name: 'Rescheduled',
    value: 5,
  },
  {
    name: 'No Show',
    value: 6,
  },
]

const gstEnabled = [
  { value: false, name: 'No' },
  { value: true, name: 'Yes' },
]

const addressTypes = [
  { label: 'Mailing Address', value: '1' },
  { label: 'Primary Address', value: '2' },
]

const currencyRoundingList = [
  {
    name: 'Up',
    value: 'Up',
  },
  {
    name: 'Down',
    value: 'Down',
  },
]

const currencyRoundingToTheClosestList = [
  {
    name: '5 Cents',
    value: '0.05',
  },
  {
    name: '10 Cents',
    value: '0.10',
  },
  {
    name: '50 Cents',
    value: '0.50',
  },
  {
    name: '1 Dollars',
    value: '1',
  },
]

const currenciesList = [
  {
    value: 'Singapore',
    name: 'Singapore (S$)',
  },
  {
    value: 'United States',
    name: 'US Dollar ($)',
  },
  {
    value: 'Malaysia',
    name: 'Malaysia Ringgit (MYR)',
  },
]

const coPayerType = [
  {
    value: 'corporate',
    name: 'Corporate',
  },
  {
    value: 'government',
    name: 'Government',
  },
]

const consultationDocumentTypes = [
  {
    value: '5',
    name: 'Medical Certificate',
    prop: 'corMedicalCertificate',
    getSubject: r => {
      return `${moment(r.mcStartDate).format(dateFormatLong)} - ${moment(
        r.mcEndDate,
      ).format(dateFormatLong)} - ${r.mcDays} Day${r.mcDays > 1 ? 's' : ''}`
    },
    convert: r => {
      return {
        ...r,
        mcStartEndDate: [moment(r.mcStartDate), moment(r.mcEndDate)],
      }
    },
    downloadConfig: {
      id: 7,
      key: 'MedicalCertificateId',
      subject: 'Medical Certificate',
      draft: row => {
        return {
          MedicalCertificateDetails: [
            {
              ...row,
              unfitType: UNFIT_TYPE[row.unfitTypeFK],
              mcIssueDate: moment(row.mcIssueDate).format(dateFormatLong),
              mcStartDate: moment(row.mcStartDate).format(dateFormatLong),
              mcEndDate: moment(row.mcEndDate).format(dateFormatLong),
              otherUnfitTypeDescription: row.otherUnfitTypeDescription,
            },
          ],
        }
      },
    },
  },
  {
    value: '6',
    name: 'Certificate of Attendance',
    prop: 'corCertificateOfAttendance',
    getSubject: r => {
      return `Certificate of Attendance ${r.accompaniedBy || ''}`
    },
    convert: r => {
      return {
        ...r,
        issueDate: moment(r.issueDate).format(dateFormatLong),
      }
    },
    downloadConfig: {
      id: 8,
      key: 'CertificateOfAttendanceId',
      subject: 'Certificate Of Attendance',
      draft: row => {
        return {
          CertificateOfAttendanceDetails: [
            {
              ...row,
              issueDate: moment(row.issueDate).format(dateFormatLong),
              attendanceStartTime: moment(row.attendanceStartTime).format(
                'hh:mm A',
              ),
              attendanceEndTime: moment(row.attendanceEndTime).format(
                'hh:mm A',
              ),
            },
          ],
        }
      },
    },
  },
  {
    value: '1',
    name: 'Referral Letter',
    prop: 'corReferralLetter',
    downloadConfig: {
      id: 9,
      key: 'ReferralLetterId',
      subject: 'Referral Letter',
      draft: row => {
        return {
          ReferralLetterDetails: [
            {
              ...row,
              referralDate: moment(row.referralDate).format(dateFormatLong),
            },
          ],
        }
      },
    },
  },
  {
    value: '2',
    name: 'Memo',
    prop: 'corMemo',
    downloadConfig: {
      id: 11,
      key: 'memoid',
      subject: 'Memo',
      draft: row => {
        return {
          MemoDetails: [
            {
              ...row,
              memoDate: moment(row.memoDate).format(dateFormatLong),
            },
          ],
        }
      },
    },
  },
  {
    value: '3',
    name: 'Vaccination Certificate',
    code: 'Vaccination Cert',
    prop: 'corVaccinationCert',
    downloadKey: 'vaccinationcertificateid',
    downloadConfig: {
      id: 10,
      key: 'vaccinationcertificateid',
      subject: 'Vaccination Certificate',
      draft: row => {
        return {
          VaccinationCertificateDetails: [
            {
              ...row,
              certificateDate: moment(row.certificateDate).format(
                dateFormatLong,
              ),
            },
          ],
        }
      },
    },
  },
  {
    value: '4',
    name: 'Others',
    prop: 'corOtherDocuments',
    downloadKey: 'documentid',
    downloadConfig: {
      id: 12,
      key: 'documentid',
      subject: 'Other Documents',
      draft: row => {
        return {
          DocumentDetails: [
            {
              ...row,
              issueDate: moment(row.issueDate).format(dateFormatLong),
            },
          ],
        }
      },
    },
  },
]

const buttonTypes = ['RegularButton', 'IconButton', 'Fab']

export const countryCodes = [
  { name: '+65 Singapore', value: '65' },
  { name: '+60 Malaysia', value: '60' },
  { name: '+62 Indonesia', value: '62' },
  { name: '+63 Philippines', value: '63' },
  { name: '+66 Thailand', value: '66' },
  { name: '+81 Japan', value: '81' },
]

export const podoOrderType = [
  {
    value: 1,
    name: 'Medication',
    prop: 'purchaseOrderMedicationItem',
    itemFKName: 'inventoryMedicationFK',
    ctName: 'inventorymedication',
    stateName: 'MedicationItemList',
    itemCode: 'inventoryMedicationCode',
    itemName: 'inventoryMedicationName',
    stockName: 'medicationStock',
  },
  {
    value: 2,
    name: 'Consumable',
    prop: 'purchaseOrderConsumableItem',
    itemFKName: 'inventoryConsumableFK',
    ctName: 'inventoryconsumable',
    stateName: 'ConsumableItemList',
    itemCode: 'inventoryConsumableCode',
    itemName: 'inventoryConsumableName',
    stockName: 'consumableStock',
  },
  {
    value: 3,
    name: 'Vaccination',
    prop: 'purchaseOrderVaccinationItem',
    itemFKName: 'inventoryVaccinationFK',
    ctName: 'inventoryvaccination',
    stateName: 'VaccinationItemList',
    itemCode: 'inventoryVaccinationCode',
    itemName: 'inventoryVaccinationName',
    stockName: 'vaccinationStock',
  },
]

export const rgType = [
  {
    value: 1,
    name: 'Medication',
    prop: 'receivingGoodsMedicationItem',
    itemFKName: 'inventoryMedicationFK',
    ctName: 'inventorymedication',
    stateName: 'MedicationItemList',
    itemCode: 'inventoryMedicationCode',
    itemName: 'inventoryMedicationName',
    stockName: 'medicationStock',
  },
  {
    value: 2,
    name: 'Consumable',
    prop: 'receivingGoodsConsumableItem',
    itemFKName: 'inventoryConsumableFK',
    ctName: 'inventoryconsumable',
    stateName: 'ConsumableItemList',
    itemCode: 'inventoryConsumableCode',
    itemName: 'inventoryConsumableName',
    stockName: 'consumableStock',
  },
  {
    value: 3,
    name: 'Vaccination',
    prop: 'receivingGoodsVaccinationItem',
    itemFKName: 'inventoryVaccinationFK',
    ctName: 'inventoryvaccination',
    stateName: 'VaccinationItemList',
    itemCode: 'inventoryVaccinationCode',
    itemName: 'inventoryVaccinationName',
    stockName: 'vaccinationStock',
  },
]

const loadFromCodesConfig = {
  mapPrescriptions: (rows, codetable, patient, isExtPrescription = false) => {
    return rows.map(o => {
      const {
        instruction,
        corPrescriptionItemPrecaution: precaution = [],
        remarks = '',
        quantity = 0,
        dispenseUOMDisplayValue = '',
      } = o
      const qtyFormatStr = numeral(quantity).format(qtyFormat)
      const { ctmedicationprecaution = [] } = codetable
      const subjectHtml = `<li> - ${o.subject} ${
        isExtPrescription ? ' (Ext.)' : ''
      }</li>`
      const instHtml = instruction !== '' ? `<li>${instruction}</li>` : ''
      const remarksHtml = remarks !== '' ? `<li>${remarks}</li>` : ''
      const qtyHtml = `<li>Quantity: ${qtyFormatStr} ${dispenseUOMDisplayValue}</li>`
      const precautionHtml = precaution
        .map(i => {
          const codetablePrecaution = ctmedicationprecaution.find(
            c => c.id === i.medicationPrecautionFK,
          )
          if (codetablePrecaution && codetablePrecaution.translationLink) {
            const {
              translationLink: { translationMasters = [] },
            } = codetablePrecaution

            const transHtml = translationMasters
              .filter(t => patient.translationLinkFK === t.languageFK)
              .map(m => {
                return `<li>${m.displayValue}</li>`
              })
              .join('')

            if (i.precaution !== '' && transHtml !== '') {
              return `<li>${i.precaution}</li>
                    ${transHtml}`
            }
          }
          return ''
        })
        .join('')

      return `<ul>${subjectHtml}<ul>${instHtml}${qtyHtml}${precautionHtml}${remarksHtml}</ul></ul>`
    })
  },
  InsertMedication: (rows, codetable, patient, isExtPrescription = false) => {
    const pRows = rows.filter(
      o =>
        !o.isDeleted &&
        o.type === '1' &&
        (o.isExternalPrescription || false) === isExtPrescription,
    )
    if (pRows && pRows.length > 0) {
      const rowHTMLs = loadFromCodesConfig.mapPrescriptions(
        pRows,
        codetable,
        patient,
        isExtPrescription,
      )
      return `<ul>
              <li><strong>${
                isExtPrescription ? 'External Prescription' : 'Medication'
              }</strong></li>
               ${rowHTMLs.join('')}
            </ul>`
    }
    return ''
  },
  InsertVaccination: (rows, isGenerateCertificate) => {
    const vRows = (isGenerateCertificate
      ? rows
      : rows.filter(o => !o.isDeleted && o.type === '2')
    ).map(v => {
      const {
        subject = '',
        usageMethodDisplayValue: usage = '',
        dosageDisplayValue: dosage = '',
        uomDisplayValue: uom = '',
        remarks = '',
        quantity = 0,
        uomDisplayValue = '',
      } = v
      const qtyFormatStr = numeral(quantity).format(qtyFormat)
      const subjectHtml = `<li> - ${subject}</li>`
      const precautionHtml =
        usage + dosage + uom !== '' ? `<li>${usage} ${dosage} ${uom} </li>` : ''
      const qtyHtml = `<li>Quantity: ${qtyFormatStr} ${uomDisplayValue}</li>`
      const remarksHtml = remarks !== '' ? `<li>${remarks}</li>` : ''

      return `<ul>${subjectHtml} <ul> ${precautionHtml}${qtyHtml}${remarksHtml}</ul></ul>`
    })
    if (vRows && vRows.length > 0)
      return `<ul>
              <li><strong>Vaccination</strong></li>
              ${vRows.join('')}
            </ul>`
    return ''
  },

  InsertOpenPrescription: (
    rows,
    codetable,
    patient,
    isExtPrescription = false,
  ) => {
    const pRows = rows.filter(
      o =>
        !o.isDeleted &&
        o.type === '5' &&
        (o.isExternalPrescription || false) === isExtPrescription,
    )
    if (pRows && pRows.length > 0) {
      const rowHTMLs = loadFromCodesConfig.mapPrescriptions(
        pRows,
        codetable,
        patient,
      )
      return `<ul>
              <li><strong>Open Prescription</strong></li>
              ${rowHTMLs.join('')}
           </ul>`
    }
    return ''
  },

  InsertConsumable: rows => {
    const pRows = rows.filter(o => !o.isDeleted && o.type === '4')
    if (pRows && pRows.length > 0) {
      const rowHTMLs = pRows.map(o => {
        const {
          consumableName = '',
          unitOfMeasurement = '',
          quantity = 0,
          remarks = '',
        } = o

        const qtyFormatStr = numeral(quantity).format(qtyFormat)
        const subjectHtml = `<li> - ${consumableName}</li>`
        const qtyHtml = `<li>Quantity: ${qtyFormatStr} ${unitOfMeasurement}</li>`
        const remarksHtml = remarks !== '' ? `<li>${remarks}</li>` : ''

        return `<ul>${subjectHtml} <ul>${qtyHtml}${remarksHtml}</ul></ul>`
      })

      return `<ul>
              <li><strong>Consumable</strong></li>
              ${rowHTMLs.join('')}
           </ul>`
    }
    return ''
  },

  InsertPatientInfo: (codetable, patient) => {
    let result
    let patientGender = codetable.ctgender.find(x => x.id === patient.genderFK)
    let patientAllergy
    for (let index = 0; index < patient.patientAllergy.length; index++) {
      if (patient.patientAllergy[index].type === 'Allergy')
        patientAllergy =
          (patientAllergy ? `${patientAllergy}, ` : '') +
          patient.patientAllergy[index].allergyName
    }
    result = `<p>Patient Name: ${patient.name}</p>`
    result += `<p>Patient Ref. No.: ${patient.patientReferenceNo}</p>`
    result += `<p>Patient Acc. No.: ${patient.patientAccountNo}</p>`
    result += `<p>Gender/Age: ${patientGender.name.substring(
      0,
      1,
    )}/${calculateAgeFromDOB(patient.dob)}</p>`

    result += `<p>Drug Allergy: ${patientAllergy || 'N.A.'}</p>`
    return result
  },
}

export const InventoryTypes = [
  {
    value: 1,
    name: 'Medication',
    prop: 'medicationValueDto',
    itemFKName: 'inventoryMedicationFK',
    ctName: 'inventorymedication',
    field: 'inventoryMedication',
  },
  {
    value: 2,
    name: 'Consumable',
    prop: 'consumableValueDto',
    itemFKName: 'inventoryConsumableFK',
    ctName: 'inventoryconsumable',
    field: 'inventoryConsumable',
  },
  {
    value: 3,
    name: 'Vaccination',
    prop: 'vaccinationValueDto',
    itemFKName: 'inventoryVaccinationFK',
    ctName: 'inventoryvaccination',
    field: 'inventoryVaccination',
  },
  {
    value: 4,
    name: 'Service',
    prop: 'serviceValueDto',
    itemFKName: 'serviceCenterServiceFK',
    ctName: 'ctservice',
    field: 'service',
  },
  {
    value: 5,
    name: 'OrderSet',
    prop: 'orderSetValueDto',
    itemFKName: 'inventoryOrderSetFK',
    ctName: 'inventoryorderset',
  },
]

const tagList = [
  {
    value: 'PatientName',
    text: '<#PatientName#>',
    url: '',
    getter: () => {
      const { patient } = window.g_app._store.getState()
      if (patient && patient.entity) {
        return patient.entity.name
      }
      return 'N.A.'
    },
  },
  {
    value: 'AppointmentDateTime',
    text: '<#AppointmentDateTime#>',
    url: '',
    getter: () => {
      const { visitRegistration = {} } = window.g_app._store.getState()
      const { entity } = visitRegistration
      if (entity && entity.visit && entity.visit.appointmentDatetTime) {
        return moment(entity.visit.appointmentDatetTime).format(
          dateFormatLongWithTime,
        )
      }
      return 'N.A.'
    },
  },
  {
    value: 'Doctor',
    text: '<#Doctor#>',
    url: '',
    getter: () => {
      const { user } = window.g_app._store.getState()
      if (user && user.data && user.data.clinicianProfile) {
        const title = user.data.clinicianProfile.title
          ? `${user.data.clinicianProfile.title} `
          : ''

        return `${title}${user.data.clinicianProfile.name}`
      }
      return 'N.A.'
    },
  },
  {
    value: 'NewLine',
    text: '<#NewLine#>',
    url: '',
    getter: () => {
      return '<br/>'
    },
  },
  {
    value: 'PatientCallingName',
    text: '<#PatientCallingName#>',
    url: '',
    getter: () => {
      const { patient } = window.g_app._store.getState()
      if (patient && patient.entity) {
        return patient.entity.callingName
      }
      return 'N.A.'
    },
  },
  {
    value: 'LastVisitDate',
    text: '<#LastVisitDate#>',
    url: '',
    getter: () => {
      const { patient } = window.g_app._store.getState()
      if (patient && patient.entity && patient.entity.lastVisitDate) {
        return moment(patient.entity.lastVisitDate).format(
          dateFormatLongWithTime,
        )
      }
      return 'N.A.'
    },
  },
  {
    value: 'PatientInfo',
    text: '<#PatientInfo#>',
    url: '',
    getter: () => {
      const { patient, codetable } = window.g_app._store.getState()
      let result
      if (patient && patient.entity) {
        let patientGender = codetable.ctgender.find(
          x => x.id === patient.entity.genderFK,
        )
        let patientAllergy
        for (
          let index = 0;
          index < patient.entity.patientAllergy.length;
          index++
        ) {
          if (patient.entity.patientAllergy[index].type === 'Allergy')
            patientAllergy =
              (patientAllergy ? `${patientAllergy}, ` : '') +
              patient.entity.patientAllergy[index].allergyName
        }
        result = `<p>Patient Name: ${patient.entity.name}</p>`
        result += `<p>Patient Ref. No.: ${patient.entity.patientReferenceNo}</p>`
        result += `<p>Patient Acc. No.: ${patient.entity.patientAccountNo}</p>`
        result += `<p>Gender/Age: ${patientGender.name.substring(
          0,
          1,
        )}/${calculateAgeFromDOB(patient.entity.dob)}</p>`

        result += `<p>Drug Allergy: ${patientAllergy || 'N.A.'}</p>`
      }
      return result || 'N.A.'
    },
  },
  {
    value: 'Order',
    text: '<#Order#>',
    url: '',
    getter: newVaccination => {
      const { orders, patient, codetable } = window.g_app._store.getState()
      if (!orders) return '-'

      const { rows = [] } = orders

      let service = rows
        .filter(o => !o.isDeleted && o.type === '3')
        .map(s => `<p>- ${s.subject}</p>`)
        .join('')

      const ordersHTML = [
        loadFromCodesConfig.InsertMedication(rows, codetable, patient, false),
        loadFromCodesConfig.InsertVaccination(
          newVaccination ? [...rows, newVaccination] : rows,
          false,
        ),
        loadFromCodesConfig.InsertOpenPrescription(rows, codetable, patient),
        loadFromCodesConfig.InsertConsumable(rows, codetable, patient),
        service,
      ]

      let htmls = ordersHTML.join('')
      return htmls
    },
  },
  {
    value: 'Vaccination',
    text: '<#Vaccination#>',
    url: '',
    getter: newVaccination => {
      const { orders, consultationDocument } = window.g_app._store.getState()
      if (!orders) return '-'
      const { rows = [] } = orders
      const { entity = {} } = consultationDocument
      let insertRows = rows
      let isGenerateCertificate = false
      if (newVaccination) {
        insertRows = [newVaccination]
        isGenerateCertificate = true
      } else if (entity.vaccinationUFK) {
        insertRows = rows.filter(vc => vc.uid === entity.vaccinationUFK)
        isGenerateCertificate = true
      }

      const ordersHTML = [
        loadFromCodesConfig.InsertVaccination(
          insertRows,
          isGenerateCertificate,
        ),
      ]

      let htmls = ordersHTML.join('')
      return htmls
    },
  },
  {
    value: 'ExternalPrescription',
    text: '<#ExternalPrescription#>',
    url: '',
    getter: () => {
      const { orders, patient, codetable } = window.g_app._store.getState()
      if (!orders) return '-'
      const { rows = [] } = orders

      const ordersHTML = [
        loadFromCodesConfig.InsertMedication(rows, codetable, patient, true),
        loadFromCodesConfig.InsertOpenPrescription(
          rows,
          codetable,
          patient,
          true,
        ),
      ]

      let htmls = ordersHTML.join('')
      return htmls
    },
  },
]

const month = [
  { value: '01', name: 'Jan' },
  { value: '02', name: 'Feb' },
  { value: '03', name: 'Mar' },
  { value: '04', name: 'Apr' },
  { value: '05', name: 'May' },
  { value: '06', name: 'Jun' },
  { value: '07', name: 'Jul' },
  { value: '08', name: 'Aug' },
  { value: '09', name: 'Sep' },
  { value: '10', name: 'Oct' },
  { value: '11', name: 'Nov' },
  { value: '12', name: 'Dec' },
]

const year = [
  { value: '2040', name: '2040' },
  { value: '2039', name: '2039' },
  { value: '2038', name: '2038' },
  { value: '2037', name: '2037' },
  { value: '2036', name: '2036' },
  { value: '2035', name: '2035' },
  { value: '2034', name: '2034' },
  { value: '2033', name: '2033' },
  { value: '2032', name: '2032' },
  { value: '2031', name: '2031' },
  { value: '2030', name: '2030' },
  { value: '2029', name: '2029' },
  { value: '2028', name: '2028' },
  { value: '2027', name: '2027' },
  { value: '2026', name: '2026' },
  { value: '2025', name: '2025' },
  { value: '2024', name: '2024' },
  { value: '2023', name: '2023' },
  { value: '2022', name: '2022' },
  { value: '2021', name: '2021' },
  { value: '2020', name: '2020' },
  { value: '2019', name: '2019' },
  { value: '2018', name: '2018' },
  { value: '2017', name: '2017' },
  { value: '2016', name: '2016' },
  { value: '2015', name: '2015' },
  { value: '2014', name: '2014' },
  { value: '2013', name: '2013' },
  { value: '2012', name: '2012' },
  { value: '2011', name: '2011' },
  { value: '2010', name: '2010' },
  { value: '2009', name: '2009' },
  { value: '2008', name: '2008' },
  { value: '2007', name: '2007' },
  { value: '2006', name: '2006' },
  { value: '2005', name: '2005' },
  { value: '2004', name: '2004' },
  { value: '2003', name: '2003' },
  { value: '2002', name: '2002' },
  { value: '2001', name: '2001' },
  { value: '2000', name: '2000' },
  { value: '1999', name: '1999' },
  { value: '1998', name: '1998' },
  { value: '1997', name: '1997' },
  { value: '1996', name: '1996' },
  { value: '1995', name: '1995' },
  { value: '1994', name: '1994' },
  { value: '1993', name: '1993' },
  { value: '1992', name: '1992' },
  { value: '1991', name: '1991' },
  { value: '1990', name: '1990' },
]

const tagCategory = [
  {
    value: 'Patient',
    name: 'Patient',
    render: () => <span>Patient</span>,
  },
  {
    value: 'Service',
    name: 'Service',
    render: () => <span>Service</span>,
  },
]

const languageCategory = [
  {
    value: 'JP',
    name: 'Japanese',
    render: () => <span>Japanese</span>,
  },
  {
    value: 'EN',
    name: 'English',
    render: () => <span>English</span>,
  },
]

export const getInventoryItem = (
  list,
  value,
  itemFKName,
  rows = [],
  outstandingItem = undefined,
) => {
  let newRows = rows.filter(x => x.type === value && x.isDeleted === false)
  const groupByFKArray = _(newRows)
    .groupBy(x => x[itemFKName])
    .map((v, key) => ({
      [itemFKName]: parseInt(key, 10),
      totalCurrentReceivingQty: _.sumBy(v, 'currentReceivingQty'),
    }))
    .value()

  let fullyReceivedArray = []
  if (outstandingItem) {
    fullyReceivedArray = groupByFKArray.filter(o => {
      const item = outstandingItem.find(i => i[itemFKName] === o[itemFKName])
      if (
        item &&
        item.orderQuantity - item.quantityReceived ===
          o.totalCurrentReceivingQty
      ) {
        return {
          ...o,
        }
      }
      return null
    })
  }

  newRows = newRows.filter(o =>
    fullyReceivedArray.find(i => i[itemFKName] === o[itemFKName]),
  )

  let inventoryItemList = _.differenceBy(list, newRows, itemFKName)

  if (outstandingItem) {
    const filterOutstandingItem = outstandingItem.filter(x => x.type === value)

    inventoryItemList = _.intersectionBy(
      inventoryItemList,
      filterOutstandingItem,
      itemFKName,
    )
  }

  if (outstandingItem) {
    inventoryItemList = inventoryItemList.map(o => {
      const findSpecificOutstandingItem = outstandingItem.find(
        i => i[itemFKName] === o[itemFKName],
      )
      let remainingQty
      if (findSpecificOutstandingItem) {
        const { orderQuantity, quantityReceived } = findSpecificOutstandingItem
        const item = groupByFKArray.find(i => i[itemFKName] === o[itemFKName])
        if (item) {
          remainingQty =
            orderQuantity - quantityReceived - item.totalCurrentReceivingQty
        }
      }

      return {
        ...o,
        remainingQty,
      }
    })
  }

  return {
    inventoryItemList,
  }
}

export const getInventoryItemV2 = (
  list,
  value,
  itemFKName,
  rows = [],
  outstandingItem = undefined,
  existingData = false,
) => {
  const groupByFKFunc = array => {
    return _(array)
      .groupBy(x => x[itemFKName])
      .map((v, key) => ({
        [itemFKName]: parseInt(key, 10),
        totalCurrentReceivingQty: _.sumBy(v, 'currentReceivingQty'),
      }))
      .value()
  }

  let newRows = rows.filter(x => x.type === value && x.isDeleted === false)

  const rowsGroupByFK = groupByFKFunc(newRows)

  const newOutstandingItem = outstandingItem.map(o => {
    const {
      quantityReceived,
      orderQuantity,
      quantityReceivedFromOtherDOs = 0,
    } = o

    const activeItem = rowsGroupByFK.find(i => i[itemFKName] === o[itemFKName])
    const remainingQuantityShouldReceive =
      orderQuantity - quantityReceivedFromOtherDOs
    let remainingQuantity = orderQuantity - quantityReceived

    if (activeItem) {
      if (existingData) {
        remainingQuantity =
          orderQuantity -
          activeItem.totalCurrentReceivingQty -
          quantityReceivedFromOtherDOs
      } else {
        remainingQuantity -= activeItem.totalCurrentReceivingQty
      }

      if (remainingQuantity === 0) {
        return {
          ...o,
          remainingQuantity,
        }
      }
    } else if (existingData && !activeItem) {
      remainingQuantity = remainingQuantityShouldReceive
    }

    return {
      ...o,
      remainingQuantity,
    }
  })

  let fullyReceivedArray = []

  fullyReceivedArray = rowsGroupByFK.filter(o => {
    const item = newOutstandingItem.find(i => i[itemFKName] === o[itemFKName])
    if (item && item.remainingQuantity <= 0) {
      return {
        ...o,
      }
    }
    return null
  })

  // get the fully received item
  newRows = newRows.filter(o =>
    fullyReceivedArray.find(i => i[itemFKName] === o[itemFKName]),
  )

  // get all the not fully received item based on the inventory item and current rows
  let inventoryItemList = _.differenceBy(list, newRows, itemFKName)

  // get current inventory item outstanding item
  const filterOutstandingItem = newOutstandingItem.filter(x => x.type === value)

  // get the all the not fully received item based on outstanding item
  inventoryItemList = _.intersectionBy(
    inventoryItemList,
    filterOutstandingItem,
    itemFKName,
  )

  inventoryItemList = inventoryItemList.map(o => {
    const findSpecificOutstandingItem = newOutstandingItem.find(
      i => i[itemFKName] === o[itemFKName],
    )

    let remainingQty
    if (findSpecificOutstandingItem) {
      const { remainingQuantity } = findSpecificOutstandingItem

      remainingQty = remainingQuantity
    }

    return {
      ...o,
      remainingQty,
    }
  })
  return {
    inventoryItemList,
  }
}

export const inventoryItemListing = (
  list,
  itemFKName = undefined,
  stateName = undefined,
  stockName = undefined,
) => {
  let inventoryItemList = list.map(x => {
    const { code, displayValue, sellingPrice = 0 } = x
    const uom = x.dispensingUOM ? x.dispensingUOM.name : x.uom?.name
    const itemFKObj = itemFKName ? { [itemFKName]: x.id } : {}
    return {
      value: x.id,
      name: displayValue,
      code,
      stock: x[stockName],
      uom,
      sellingPrice: x.sellingPrice,
      lastCostPriceBefBonus: x.lastCostPriceBefBonus,
      id: x.id,
      stateName,
      itemFK: x.id,
      isActive: x.isActive,
      orderable: x.orderable,
      displayValue: `${displayValue} - ${code} (${currencySymbol}${sellingPrice.toFixed(
        2,
      )} / ${uom})`,
      ...itemFKObj,
    }
  })
  return {
    inventoryItemList,
  }
}

export const InvoicePayerType = [
  {
    invoicePayerFK: 1,
    name: 'PATIENT',
    listName: 'patientPaymentTxn',
  },
]
export const recurrenceTypes = [
  {
    value: 'daily',
    name: 'Daily',
  },
  {
    value: 'weekly',
    name: 'Weekly',
  },
  {
    value: 'monthly',
    name: 'Monthly',
  },
]

export const inventoryAdjustmentStatus = [
  { value: 1, name: 'Draft' },
  { value: 2, name: 'Finalized' },
  { value: 3, name: 'Discarded' },
]

export const shortcutKeys = [
  { value: 'F1', name: 'F1' },
  { value: 'F2', name: 'F2' },
  { value: 'F3', name: 'F3' },
  { value: 'F4', name: 'F4' },
  { value: 'F5', name: 'F5' },
  { value: 'F6', name: 'F6' },
  { value: 'F7', name: 'F7' },
  { value: 'F8', name: 'F8' },
  { value: 'F9', name: 'F9' },
  { value: 'F10', name: 'F10' },
  { value: 'F11', name: 'F11' },
  { value: 'F12', name: 'F12' },
]

export const roundToPrecision = (x, precision) => {
  const y = +x + (precision === undefined ? 0.5 : precision / 2)
  return y - (y % (precision === undefined ? 1 : +precision))
}

export const groupByFKFunc = array => {
  return _(array)
    .groupBy(x => x.itemFK)
    .map((v, key) => ({
      itemFK: parseInt(key, 10),
      totalCurrentReceivingQty: _.sumBy(v, 'currentReceivingQty'),
    }))
    .value()
}

export const visitOrderTemplateItemTypes = [
  {
    id: 1,
    dtoName: 'visitOrderTemplateMedicationItemDto',
    itemFKName: 'inventoryMedicationFK',
    keyName: 'inventoryMedication',
  },
  {
    id: 2,
    dtoName: 'visitOrderTemplateConsumableItemDto',
    itemFKName: 'inventoryConsumableFK',
    keyName: 'inventoryConsumable',
  },
  {
    id: 3,
    dtoName: 'visitOrderTemplateVaccinationItemDto',
    itemFKName: 'inventoryVaccinationFK',
    keyName: 'inventoryVaccination',
  },
  {
    id: 4,
    dtoName: 'visitOrderTemplateServiceItemDto',
    itemFKName: 'serviceCenterServiceFK',
    keyName: 'service',
  },
]

export const labelPrinterList = [
  { value: '8.9cmx3.6cm', name: '8.9cmx3.6cm' },
  { value: '8.0cmx4.5cm', name: '8.0cmx4.5cm' },
  { value: '7.6cmx3.8cm', name: '7.6cmx3.8cm' },
]

export const corAttchementTypes = [
  {
    id: 1,
    type: 'ClinicalNotes',
    name: 'Consultation Attachment',
  },
  {
    id: 2,
    type: 'VisitReferral',
    name: 'Referral Attachment',
  },
  {
    id: 3,
    type: 'Visit',
    name: 'Visit Attachment',
  },
  {
    id: 4,
    type: 'EyeVisualAcuity',
    name: 'Visual Acuity Test',
    accessRight: 'queue.consultation.widgets.eyevisualacuity',
  },
  {
    id: 5,
    type: 'QueueDisplay',
    name: 'Queue Display',
  },
]

export const ReportsOnSignOffOption = {
  DrugLabel: 'Drug Label',
  MedicalCertificate: 'Medical Certificate',
  CertificateofAttendance: 'Certificate of Attendance',
  ReferralLetter: 'Referral Letter',
  Memo: 'Memo',
  VaccinationCertificate: 'Vaccination Certificate',
  OtherDocuments: 'Other Documents',
  PrescriptionSheet: 'Prescription Sheet',
}
export const ReportsOnSignOff = [
  // { code: ReportsOnSignOffOption.DrugLabel, description: 'Drug Label' },
  {
    code: ReportsOnSignOffOption.MedicalCertificate,
    description: 'Medical Certificate',
  },
  {
    code: ReportsOnSignOffOption.CertificateofAttendance,
    description: 'Certificate of Attendance',
  },
  {
    code: ReportsOnSignOffOption.ReferralLetter,
    description: 'Referral Letter',
  },
  { code: ReportsOnSignOffOption.Memo, description: 'Memo' },
  {
    code: ReportsOnSignOffOption.VaccinationCertificate,
    description: 'Vaccination Certificate',
  },
  {
    code: ReportsOnSignOffOption.OtherDocuments,
    description: 'Other Documents',
  },
  {
    code: ReportsOnSignOffOption.PrescriptionSheet,
    description: 'Prescription Sheet',
  },
]
export const ReportsOnCompletePaymentOption = {
  DrugLabel: 'Drug Label',
  Invoice: 'Invoice',
  Receipt: 'Receipt',
}
export const ReportsOnCompletePayment = [
  // { code: ReportsOnCompletePaymentOption.DrugLabel, description: 'Drug Label' },
  { code: ReportsOnCompletePaymentOption.Invoice, description: 'Invoice' },
  { code: ReportsOnCompletePaymentOption.Receipt, description: 'Receipt' },
]
const initRoomAssignment = async () => {
  // The local identity feature overwrited
  return
  const accessRight = Authorized.check('settings.clinicsetting.roomassignment')
  if (accessRight && accessRight.rights === 'enable') {
    await window.g_app._store.dispatch({
      type: 'settingRoomAssignment/query',
      payload: {
        pagesize: 9999,
      },
    })
  }
}

const scribbleTypes = [
  { type: 'history', typeFK: SCRIBBLE_NOTE_TYPE.HISTORY },
  { type: 'chiefComplaints', typeFK: SCRIBBLE_NOTE_TYPE.CHIEFCOMPLAINTS },
  { type: 'note', typeFK: SCRIBBLE_NOTE_TYPE.CLINICALNOTES },
  { type: 'plan', typeFK: SCRIBBLE_NOTE_TYPE.PLAN },
  { type: 'radiology', typeFK: SCRIBBLE_NOTE_TYPE.RADIOLOGY },
]

const formTypes = [
  {
    value: '1',
    name: 'Letter of Certification',
    prop: 'corLetterOfCertification',
    downloadConfig: {
      id: 55,
      key: 'LetterofCertificationId',
      subject: 'Letter of Certification',
      draft: row => {
        const { formData, statusFK } = row

        let LCFormSurgicalCharges = []
        formData.procuderes
          .filter(p => p.index <= 3)
          .forEach(element => {
            for (let index = 0; index < 3; index++) {
              LCFormSurgicalCharges.push({
                index: element.index,
                ProcedureDate: element.procedureDate,
                StartTime: element.procedureStartTime,
                EndTime: element.procedureEndTime,
                NatureOperation: element.natureOfOpertation,
                SurgicalCode: element.surgicalProcedureCode,
                SurgicalDescription: element.surgicalProcedureName,
                SurgicalTable: element.surgicalProcedureTable,
                DoctorMCRNo: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgicalSurgeonMCRNo
                  : '',
                DoctorName: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgicalSurgeonName
                  : '',
                SurgeonRoleDisplayValue: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgicalRoleName
                  : '',
                SurgeonFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgeonFees
                  : 0,
                ImplantFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].implantFees
                  : 0,
                OtherFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].otherFees
                  : 0,
                TotalSurgicalFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].totalSurgicalFees
                  : 0,
                GSTChargedDisplayValue: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].gSTChargedName
                  : '',
              })
            }
          })

        let LCFormSurgicalChargesAnnex = []
        formData.procuderes
          .filter(p => p.index > 3)
          .forEach(element => {
            for (let index = 0; index < 5; index++) {
              LCFormSurgicalChargesAnnex.push({
                index: element.index,
                ProcedureDate: element.procedureDate,
                StartTime: element.procedureStartTime,
                EndTime: element.procedureEndTime,
                NatureOperation: element.natureOfOpertation,
                SurgicalCode: element.surgicalProcedureCode,
                SurgicalDescription: element.surgicalProcedureName,
                SurgicalTable: element.surgicalProcedureTable,
                PatientName: formData.patientName,
                PatientAccountNo: formData.patientAccountNo,
                DateOfAdmission: formData.admissionDate,
                DoctorMCRNo: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgicalSurgeonMCRNo
                  : '',
                DoctorName: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgicalSurgeonName
                  : '',
                SurgeonRoleDisplayValue: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgicalRoleName
                  : '',
                SurgeonFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].surgeonFees
                  : 0,
                ImplantFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].implantFees
                  : 0,
                OtherFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].otherFees
                  : 0,
                TotalSurgicalFees: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].totalSurgicalFees
                  : 0,
                GSTChargedDisplayValue: element.surgicalCharges[index]
                  ? element.surgicalCharges[index].gSTChargedName
                  : '',
              })
            }
          })

        let LCFormNonSurgicalCharges = []
        for (let index = 0; index < 7; index++) {
          LCFormNonSurgicalCharges.push({
            DoctorMCRNo: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].surgicalSurgeonMCRNo
              : '',
            DoctorName: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].surgicalSurgeonName
              : '',
            SurgeonRoleDisplayValue: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].surgicalRoleName
              : index === 0
              ? 'Principal Surgeon'
              : '',
            AttendanceFee: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].inpatientAttendanceFees
              : 0,
            OtherFees: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].otherFees
              : 0,
            TotalSurgicalFees: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].totalSurgicalFees
              : 0,
            GSTChargedDisplayValue: formData.nonSurgicalCharges[index]
              ? formData.nonSurgicalCharges[index].gSTChargedName
              : '',
          })
        }

        return {
          LCFormDetails: [
            {
              Watermark: statusFK === 4 ? 'THIS FORM IS VOIDED' : '',
              PatientName: formData.patientName,
              PatientNRIC: formData.patientNRICNo,
              PatientAccountNo: formData.patientAccountNo,
              DateOfAdmission: formData.admissionDate,
              DateOfDischarge: formData.dischargeDate,
              AdmittingSpecialtyCode: formData.admittingSpecialtys.join(','),
              OtherSpecialty: formData.others,
              CaseType: formData.caseType,
              PrincipalDiagnosisCode: formData.principalDiagnosisCode,
              PrincipalDiagnosisDescription: formData.principalDiagnosisName,
              SecondaryDiagnosisCode1: formData.secondDiagnosisACode,
              SecondaryDiagnosisDescription1: formData.secondDiagnosisAName,
              SecondaryDiagnosisCode2: formData.secondDiagnosisBCode,
              SecondaryDiagnosisDescription2: formData.secondDiagnosisBName,
              OtherDiagnosis: formData.otherDiagnosis
                .map(o => `${o.diagnosisCode} - ${o.diagnosisName}`)
                .join('|'),
            },
          ],
          LCFormSurgicalCharges,
          LCFormSignature: [
            {
              Signature: formData.signatureThumbnail,
              PrincipalSurgeonName: formData.principalSurgeonName,
              DoctorMCRNo: formData.principalSurgeonMCRNo,
              SignatureDate: formData.principalSurgeonSignatureDate,
            },
          ],
          LCFormNonSurgicalCharges,
          LCFormSurgicalChargesAnnex,
        }
      },
    },
  },
  {
    value: '2',
    name: 'From',
    prop: 'corForm',
    downloadConfig: {
      id: 0,
      key: 'FormId',
      subject: 'From',
      draft: row => {},
    },
  },
]

const formStatus = [
  {
    value: 1,
    name: 'Draft',
  },
  {
    value: 2,
    name: 'Finalized',
  },
  {
    value: 3,
    name: 'Submitted',
  },
  {
    value: 4,
    name: 'Voided',
  },
]

const gstChargedTypes = [
  {
    id: 1,
    name: 'Charged',
  },
  {
    id: 2,
    name: 'Waived',
  },
  {
    id: 3,
    name: 'Not Registered',
  },
]

const surgicalRoles = [
  {
    id: 1,
    code: 'PRINCIPALSURGEON',
    name: 'Principal Surgeon',
  },
  {
    id: 2,
    code: 'OTHERSURGEON',
    name: 'Other Surgeon',
  },
  {
    id: 3,
    code: 'DENTIST',
    name: 'Dentist',
  },
  {
    id: 4,
    code: 'DOCTOR',
    name: 'Doctor',
  },
  {
    id: 5,
    code: 'ANESTHETIST',
    name: 'Anesthetist',
  },
  {
    id: 6,
    code: 'ASSISTANT',
    name: 'Assistant',
  },
]

const ltAdmittingSpecialty = [
  {
    id: 1,
    code: '01',
    name: '01 Burns',
  },
  {
    id: 2,
    code: '02',
    name: '02 Cardio Thoracic Surgery',
  },
  {
    id: 3,
    code: '03',
    name: '03 Cardiology',
  },
  {
    id: 4,
    code: '04',
    name: '04 Chronic Medicine',
  },
  {
    id: 5,
    code: '05',
    name: '05 Dental',
  },
  {
    id: 6,
    code: '06',
    name: '06 Dermatology',
  },
  {
    id: 7,
    code: '07',
    name: '07 General Medicine',
  },
  {
    id: 8,
    code: '08',
    name: '08 General Surgery',
  },
  {
    id: 9,
    code: '09',
    name: '09 Geriatric Medicine',
  },
  {
    id: 10,
    code: '10',
    name: '10 Gynaecology',
  },
  {
    id: 11,
    code: '11',
    name: '11 Haematology',
  },
  {
    id: 12,
    code: '12',
    name: '12 Hand Surgery',
  },
  {
    id: 13,
    code: '13',
    name: '13 Infectious Disease',
  },
  {
    id: 14,
    code: '14',
    name: '14 Neonatology',
  },
  {
    id: 15,
    code: '15',
    name: '15 Neurology',
  },
  {
    id: 16,
    code: '16',
    name: '16 Neurosurgery',
  },
  {
    id: 17,
    code: '17',
    name: '17 Nuclear Medicine',
  },
  {
    id: 18,
    code: '18',
    name: '18 Obstetrics',
  },
  {
    id: 19,
    code: '19',
    name: '19 Medical Oncology',
  },
  {
    id: 20,
    code: '20',
    name: '20 Ophthalmology',
  },
  {
    id: 21,
    code: '21',
    name: '21 Orthopaedic Surgery',
  },
  {
    id: 22,
    code: '22',
    name: '22 Otorhinolaryngology',
  },
  {
    id: 23,
    code: '23',
    name: '23 Paediatric Medicine',
  },
  {
    id: 24,
    code: '24',
    name: '24 Paediatric Surgery',
  },
  {
    id: 25,
    code: '25',
    name: '25 Plastic & Reconstructive Surgery',
  },
  {
    id: 26,
    code: '26',
    name: '26 Psychiatry',
  },
  {
    id: 27,
    code: '27',
    name: '27 Rehabilitation Medicine',
  },
  {
    id: 28,
    code: '28',
    name: '28 Renal Medicine',
  },
  {
    id: 29,
    code: '29',
    name: '29 Therapeutic Radiology',
  },
  {
    id: 30,
    code: '30',
    name: '30 Trauma',
  },
  {
    id: 31,
    code: '31',
    name: '31 Tuberculosis',
  },
  {
    id: 32,
    code: '32',
    name: '32 Urology',
  },
  {
    id: 33,
    code: '33',
    name: '33 Colorectal Surgery',
  },
  {
    id: 34,
    code: '34',
    name: '34 Observational Medicine',
  },
  {
    id: 35,
    code: '35',
    name: '35 Family Medicine and Continuing Care',
  },
  {
    id: 36,
    code: '36',
    name: '36 Surgical Oncology',
  },
  {
    id: 99,
    code: '99',
    name: '99 Others (please specify)',
  },
]

const queueProcessorType = [
  {
    value: 1,
    name: 'XRay Interface',
  },
  {
    value: 2,
    name: 'SAP Interface',
  },
  {
    value: 3,
    name: 'Lab Interface',
  },
]

const queueItemStatus = [
  {
    value: 1,
    name: 'Pending',
  },
  {
    value: 2,
    name: 'Processing',
  },
  {
    value: 3,
    name: 'Successful',
  },
  {
    value: 4,
    name: 'Failed',
  },
]

const preOrderItemCategory = [
  {
    value: 'Medication',
    name: 'Medication',
  },
  {
    value: 'Consumable',
    name: 'Consumable',
  },
  {
    value: 'Vaccination',
    name: 'Vaccination',
  },
  {
    value: 'Service',
    name: 'Service',
  },
  {
    value: 'Lab',
    name: 'Lab',
  },
  {
    value: 'Radiology',
    name: 'Radiology',
  },
]

export const documentCategorys = [
  { value: 1, name: 'Consultation Document' },
  { value: 2, name: 'Form' },
]

export const documentTemplateTypes = [
  {
    value: 1,
    name: 'Referral Letter',
  },
  {
    value: 2,
    name: 'Memo',
  },
  {
    value: 3,
    name: 'Vaccination Certificate',
  },
  {
    value: 4,
    name: 'Others',
  },
  {
    value: 5,
    name: 'Consent Form',
  },
  {
    value: 6,
    name: 'Questionnaire',
  },
]

const isPanelItemRequired = [
  { value: false, name: 'No' },
  { value: true, name: 'Yes' },
]

const pharmacyStatus = [
  {
    statusFK: 1,
    name: 'Ordered',
  },
  {
    statusFK: 2,
    name: 'Prepared',
  },
  {
    statusFK: 3,
    name: 'Verified',
  },
  {
    statusFK: 4,
    name: 'Completed',
  },
]

const examinationSteps = [
  {
    statusFK: 1,
    name: 'Ordered',
  },
  {
    statusFK: 2,
    name: 'PendingReport',
    name: 'Examination Started',
  },
  {
    statusFK: 3,
    name: 'Modality Completed',
  },

  {
    statusFK: 4,
    name: 'Completed',
  },
  {
    statusFK: 5,
    name: 'Cancelled',
  },
]
const individualCommentGroup = [
  {
    value: 1,
    name: '1',
  },
  {
    value: 2,
    name: '2',
  },
  {
    value: 3,
    name: '3',
  },
  {
    value: 4,
    name: '4',
  },
  {
    value: 5,
    name: '5',
  },
  {
    value: 6,
    name: '6',
  },
]

const visitDoctorConsultationStatusColor = [
  { value: VISITDOCTOR_CONSULTATIONSTATUS.WAITING, color: '#4255BD' },
  { value: VISITDOCTOR_CONSULTATIONSTATUS.INPROGRESS, color: '#CF1322' },
  { value: VISITDOCTOR_CONSULTATIONSTATUS.PAUSED, color: '#CF1322' },
  { value: VISITDOCTOR_CONSULTATIONSTATUS.COMPLETED, color: '#777' },
]

const orderItemTypes = [
  { type: 'Medication', displayValue: 'Med' },
  { type: 'Open Prescription', displayValue: 'Med(Opn)' },
  { type: 'External Prescription', displayValue: 'Med(Ext)' },
  { type: 'Consumable', displayValue: 'Con' },
  { type: 'Vaccination', displayValue: 'Vac' },
  { type: 'Service', displayValue: 'Svc' },
  { type: 'Radiology', displayValue: 'Rad' },
  { type: 'Lab', displayValue: 'Lab' },
  { type: 'Drug Mixture', displayValue: 'Med(Mix)' },
]

export {
  appointmentStatus,
  status,
  approvedStatus,
  chasSchemeTypes,
  claimStatus,
  statusString,
  isAutoOrder,
  addressTypes,
  currenciesList,
  currencyRoundingList,
  currencyRoundingToTheClosestList,
  coPayerType,
  appointmentStatusReception,
  messageStatus,
  smsStatus,
  sessionOptions,
  consultationDocumentTypes,
  tagList,
  osBalanceStatus,
  buttonTypes,
  gstEnabled,
  initRoomAssignment,
  scribbleTypes,
  formTypes,
  formStatus,
  gstChargedTypes,
  surgicalRoles,
  ltAdmittingSpecialty,
  month,
  year,
  queueProcessorType,
  queueItemStatus,
  preOrderItemCategory,
  tagCategory,
  isPanelItemRequired,
  languageCategory,
  pharmacyStatus,
  examinationSteps,
  individualCommentGroup,
  visitDoctorConsultationStatusColor,
  orderItemTypes,
}
