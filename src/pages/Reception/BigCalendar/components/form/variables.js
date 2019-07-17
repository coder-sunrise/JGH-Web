import moment from 'moment'

export const RECURRENCE_PATTERN = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
}

export const recurrencePattern = [
  { name: 'Daily', value: RECURRENCE_PATTERN.DAILY },
  { name: 'Weekly', value: RECURRENCE_PATTERN.WEEKLY },
  { name: 'Monthly', value: RECURRENCE_PATTERN.MONTHLY },
]

export const RECURRENCE_RANGE = {
  AFTER: 'after',
  BY: 'by',
}

export const DAYS_OF_WEEK = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
}

export const days = [
  { value: 0, name: 'Monday' },
  { value: 1, name: 'Tuesday' },
  { value: 2, name: 'Wednesday' },
  { value: 3, name: 'Thursday' },
  { value: 4, name: 'Friday' },
  { value: 5, name: 'Saturday' },
  { value: 6, name: 'Sunday' },
]

export const AppointmentDataColumn = [
  { name: 'conflict', title: ' ' },
  { name: 'doctor', title: 'Doctor' },
  { name: 'appointmentType', title: 'Appointment Type' },
  { name: 'timeFrom', title: 'Time From' },
  { name: 'timeTo', title: 'Time To' },
  { name: 'roomNo', title: 'Room' },
  { name: 'primaryDoctor', title: 'Primary Doctor' },
]

export const AppointmentDataColExtensions = [
  {
    columnName: 'conflict',
    type: 'none',
    editingEnabled: false,
    disabled: true,
    width: 80,
  },
  { columnName: 'timeFrom', type: 'time', format: 'hh:mm a' },
  { columnName: 'timeTo', type: 'time', format: 'hh:mm a' },
  {
    columnName: 'primaryDoctor',
    type: 'radio',
  },
  {
    columnName: 'doctor',
    type: 'select',
    options: [
      { name: 'Medisys', value: 'medisys' },
      { name: 'Levinne', value: 'levinne' },
      { name: 'Cheah', value: 'cheah' },
      { name: 'Tab', value: 'tan' },
    ],
  },
  {
    columnName: 'roomNo',
    type: 'select',
    options: [
      { name: 'Room 1', value: 'room1' },
      { name: 'Room 2', value: 'room2' },
      { name: 'Room 3', value: 'room3' },
    ],
  },
  { columnName: 'appointmentType', type: 'select' },
]

const generateDummyAppointmentData = () => {
  let data = []
  for (let i = 0; i < 5; i++) {
    data.push({
      id: i,
      doctor: 'cheah',
      appointmentType: 'Check up',
      timeFrom: moment().format('hh:mm a'),
      timeTo: moment().format('hh:mm a'),
      room: `Room ${i}`,
    })
  }
  return data
}

export const DummyAppointmentData = generateDummyAppointmentData()

export const _dateFormat = 'DD MMM YYYY'

export const initialAptInfo = {
  patientName: '',
  isRegisteredPatient: false,
  contactNo: '',
  doctor: '',
  remarks: '',
  enableRecurrence: false,
}
