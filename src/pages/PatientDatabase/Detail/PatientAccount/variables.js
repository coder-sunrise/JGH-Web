import Authorized from '@/utils/Authorized'
import InvoiceHistory from '@/pages/Widgets/InvoiceHistory'
import PatientDeposit from '@/pages/Finance/Deposit/PatientDeposit'
import { PATIENT_ACCOUNT_TABS } from '@/utils/constants'

const addContent = (type, props) => {
  const {
    patient: { entity },
  } = props
  const patientIsActive = entity && entity.isActive

  switch (type) {
    case PATIENT_ACCOUNT_TABS.INVOICE:
      return <InvoiceHistory mode='integrated' {...props} />
    case PATIENT_ACCOUNT_TABS.DEPOSIT:
      return <PatientDeposit {...props} />
    default:
      return <InvoiceHistory mode='integrated' {...props} />
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

export const PatientAccountTabOption = props => {
  const Tabs = [
    {
      id: PATIENT_ACCOUNT_TABS.INVOICE,
      name: 'Invoice',
      content: addContent(PATIENT_ACCOUNT_TABS.INVOICE, props),
      authority: ['finance/invoicepayment'],
    },
    {
      id: PATIENT_ACCOUNT_TABS.DEPOSIT,
      name: 'Deposit',
      authority: [
        'patientdatabase.patientprofiledetails.patienthistory.deposit',
      ],
      content: addContent(PATIENT_ACCOUNT_TABS.DEPOSIT, props),
    },
  ]
  return Tabs.filter(f => checkAccessRight(f.authority))
}

export const getDefaultTab = () => {
  const accessRight = Authorized.check('finance/invoicepayment') || {
    rights: 'hidden',
  }
  if (accessRight.rights === 'hidden') {
    return PATIENT_ACCOUNT_TABS.DEPOSIT
  }
  return PATIENT_ACCOUNT_TABS.INVOICE
}
