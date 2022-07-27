import moment from 'moment'
// common component
import { timeFormat24Hour, dateFormatLong } from '@/components'
// utils
import { COUNTRY_CODE_NUMBER, NUMBER_TYPE } from '@/utils/constants'

export const getTimeString = value => {
  if (moment(value, timeFormat24Hour).isValid()) {
    return moment(value, timeFormat24Hour).format(timeFormat24Hour)
  }
  return 'N/A'
}

export const constructTitle = (
  patientName,
  patientProfile,
  patientContactNo,
  patientDOB,
) => {
  if (patientProfile) {
    const { contactNumbers = [] } = patientProfile
    const mobile = contactNumbers.find(
      contact => contact.numberTypeFK === NUMBER_TYPE.MOBILE,
    )
    const countryCode = mobile ? COUNTRY_CODE_NUMBER[mobile.countryCodeFK] : ''
    const number = mobile ? mobile.number : ''
    return `${patientName} (${countryCode} ${number})`
  }
  return `${patientName} (${patientContactNo}${
    patientDOB ? `, ${moment(patientDOB).format(dateFormatLong)}` : ''
  })`
}

export const parseDateToDay = date => date.format('dddd')
export const parseDateToFullDate = date => date.format('DD MMM YYYY')
export const parseDurationToString = (durationInMoment = moment.duration()) => {
  if (!moment.isDuration(durationInMoment)) return ''

  const durationInMinute = durationInMoment.asMinutes() || 0
  if (durationInMinute < 60) {
    if (durationInMinute === 1) return `${durationInMinute} MIN`
    return `${durationInMinute} MINS`
  }
  if (durationInMinute === 60) return '1 HOUR'
  const minute = durationInMinute % 60
  const hour = Math.floor(durationInMinute / 60).toFixed(0)
  const pluralS = 'S'

  const minuteLabel =
    minute > 0 ? `${minute} MIN${minute > 1 ? pluralS : ''}` : ''
  const hourLabel = `${hour} HOUR${hour > 1 ? pluralS : ''}`
  return `${hourLabel} ${minuteLabel}`
}

export const getDuration = appointment => {
  const momentStartTime = moment(appointment.startTime, 'HH:mm')
  const momentEndTime = moment(appointment.endTime, 'HH:mm')
  const momentDuration = moment.duration(momentEndTime.diff(momentStartTime))
  return momentDuration
}

export const getTimeRange = (apptResources = [], appointment) => {
  let firstAppt = apptResources.find(item => item.isPrimaryClinician)
  if (!firstAppt) firstAppt = appointment
  if (firstAppt) {
    const momentDuration = getDuration(firstAppt)
    const durationString = parseDurationToString(momentDuration)

    const duration = durationString !== '' ? ` (${durationString})` : ''

    return `${getTimeString(firstAppt.startTime)} - ${getTimeString(
      firstAppt.endTime,
    )}${duration}`
  }
  return ''
}
