// material ui icons
import Edit from '@material-ui/icons/Edit'
import Money from '@material-ui/icons/AttachMoney'
import Delete from '@material-ui/icons/Delete'
import Person from '@material-ui/icons/Person'
import Book from '@material-ui/icons/LibraryBooks'
import Play from '@material-ui/icons/PlayArrow'
import PlayCircle from '@material-ui/icons/PlayCircleOutlineOutlined'
import Assignment from '@material-ui/icons/Assignment'
import Description from '@material-ui/icons/Description'
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf'

export const StatusIndicator = {
  ALL: 'All',
  APPOINTMENT: 'Appointment',
  WAITING: 'Waiting',
  IN_PROGRESS: 'In Progress',
  BILLING: 'Billing',
  COMPLETED: 'Completed',
}

export const modelKey = 'queueLog/'

export const VISIT_STATUS = {
  WAITING: 'Waiting',
  IN_CONS: 'In Cons',
  PAUSED: 'Paused',
  DISPENSE: 'Dispense',
  BILLING: 'Billing',
  ORDER_UPDATED: 'Order Updated',
  COMPLETED: 'Completed',
  UPCOMING_APPT: 'Upcoming Appt.',
}

export const filterMap = {
  [StatusIndicator.ALL]: [
    ...Object.keys(VISIT_STATUS).map(key => VISIT_STATUS[key]),
  ].filter(item => item !== VISIT_STATUS.UPCOMING_APPT),
  [StatusIndicator.APPOINTMENT]: [VISIT_STATUS.UPCOMING_APPT],
  [StatusIndicator.WAITING]: [VISIT_STATUS.WAITING],
  [StatusIndicator.BILLING]: [VISIT_STATUS.BILLING],
  [StatusIndicator.IN_PROGRESS]: [
    VISIT_STATUS.DISPENSE,
    VISIT_STATUS.IN_CONS,
    VISIT_STATUS.PAUSED,
    VISIT_STATUS.ORDER_UPDATED,
  ],
  [StatusIndicator.COMPLETED]: [VISIT_STATUS.COMPLETED],
}

export const AppointmentContextMenu = [
  {
    id: 8,
    label: 'New Visit',
    Icon: Edit,
    disabled: true,
    authority: 'queue.registervisit',
  },
  {
    id: 9,
    label: 'Register Patient',
    Icon: Person,
    disabled: true,
    authority: 'patientdatabase.newpatient',
  },
]

export const ContextMenuOptions = [
  {
    id: 0,
    label: 'Edit Visit',
    Icon: Edit,
    disabled: false,
    authority: 'queue.visitregistrationdetails',
  },
  {
    id: 0.1,
    label: 'View Visit',
    Icon: Assignment,
    disabled: false,
    hidden: true,
  },
  {
    id: 1,
    label: 'Dispense',
    Icon: Money,
    disabled: false,
    authority: 'queue.dispense',
  },
  {
    id: 1.1,
    label: 'Billing',
    Icon: Money,
    disabled: false,
    authority: 'queue.dispense.makepayment',
  },
  {
    id: 2,
    label: 'Delete Visit',
    Icon: Delete,
    disabled: false,
    authority: 'queue.deletevisitregistration',
  },
  { isDivider: true },
  {
    id: 3,
    label: 'Patient Profile',
    Icon: Person,
    disabled: false,
    authority: 'patientdatabase.patientprofiledetails',
  },
  {
    id: 3.1,
    label: 'Patient Document',
    Icon: PictureAsPdfIcon,
    disabled: false,
    authority: 'patientdatabase.patientprofiledetails.patientdocument',
  },
  {
    id: 4,
    label: 'Patient Dashboard',
    Icon: Book,
    disabled: false,
    authority: 'patientdashboard',
  },
  { isDivider: true },
  {
    id: 5,
    label: 'Start Consultation',
    Icon: Play,
    disabled: false,
    authority: 'patientdashboard.startresumeconsultation',
  },
  {
    id: 6,
    label: 'Resume Consultation',
    Icon: PlayCircle,
    disabled: true,
    hidden: true,
    authority: 'patientdashboard.startresumeconsultation',
  },
  {
    id: 7,
    label: 'Edit Consultation',
    Icon: Edit,
    disabled: true,
    hidden: false,
    authority: 'patientdashboard.editconsultation',
  },
  {
    id: 10,
    label: 'Forms',
    Icon: Description,
    disabled: false,
    hidden: false,
    authority: 'queue.consultation.form',
  },
]
