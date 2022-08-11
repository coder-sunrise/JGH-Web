import Authorized from '@/utils/Authorized'
import PatientHistory from '@/pages/Widgets/PatientHistory'
import AppointmentHistory from '@/pages/Widgets/AppointmentHistory'
import DispenseHistory from '@/pages/Widgets/DispenseHistory'
import { PATIENT_HISTORY_TABS } from '@/utils/constants'
import PatientNurseNotes from '@/pages/PatientDatabase/Detail/PatientNurseNotes'
import ViewPatientNurseNotes from '@/pages/Widgets/PatientNurseNotes'
import PatientReferral from '@/pages/Widgets/ReferralHistory'

const addContent = (type, props) => {
  const {
    patient: { entity },
  } = props
  const patientIsActive = entity && entity.isActive

  switch (type) {
    case PATIENT_HISTORY_TABS.VISIT:
      return (
        <PatientHistory
          mode='integrated'
          fromModule='PatientHistory'
          {...props}
        />
      )
    case PATIENT_HISTORY_TABS.DISPENSE:
      return <DispenseHistory mode='integrated' {...props} />
    case PATIENT_HISTORY_TABS.APPOINTMENT:
      return <AppointmentHistory {...props} />
    case PATIENT_HISTORY_TABS.NURSENOTES:
      return <PatientNurseNotes {...props} />
    case PATIENT_HISTORY_TABS.REFERRAL:
      return <PatientReferral mode='integrated' {...props} />
    default:
      return <PatientHistory fromModule='PatientHistory' {...props} />
  }
}

const checkAccessRight = accessRightNames => {
  if (!accessRightNames || accessRightNames.length === 0) return true

  for (let i = 0; i < accessRightNames.length; i++) {
    const accessRight = Authorized.check(accessRightNames[i])
    if (!accessRight || accessRight.rights === 'hidden') {
      return false
    }
    return true
  }
  return false
}

export const PatientHistoryTabOption = props => {
  const Tabs = [
    {
      id: PATIENT_HISTORY_TABS.VISIT,
      name: 'Visit',
      content: addContent(PATIENT_HISTORY_TABS.VISIT, props),
    },
    {
      id: PATIENT_HISTORY_TABS.DISPENSE,
      name: 'Dispense',
      content: addContent(PATIENT_HISTORY_TABS.DISPENSE, props),
    },
    {
      id: PATIENT_HISTORY_TABS.APPOINTMENT,
      name: 'Appointment',
      content: addContent(PATIENT_HISTORY_TABS.APPOINTMENT, props),
    },
    {
      id: PATIENT_HISTORY_TABS.NURSENOTES,
      name: 'Notes',
      content: addContent(PATIENT_HISTORY_TABS.NURSENOTES, props),
      authority: [
        'patientdatabase.patientprofiledetails.patienthistory.nursenotes',
      ],
    },
    {
      id: PATIENT_HISTORY_TABS.REFERRAL,
      name: 'Referral',
      authority: [
        'patientdatabase.patientprofiledetails.patienthistory.referralhistory',
      ],
      content: addContent(PATIENT_HISTORY_TABS.REFERRAL, props),
    },
  ]
  return Tabs.filter(f => checkAccessRight(f.authority))
}
