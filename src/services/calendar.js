import { stringify } from 'qs'
import request from '@/utils/request'
import * as commonService from '@/services/common'

// export async function fetchPatientListByName (patientName) {
//   const criteria = [
//     { prop: 'name', val: patientName, opr: 'like' },
//   ]
//   const response = await request('/api/patient', {
//     method: 'GET',
//     data: patientName === '' ? {} : stringify({ criteria }),
//   })

//   return response
// }

// export async function fetchPatientInfoByPatientID (patientID) {
//   // const entities = await request(`/api/fake_patientInfo?patientID=${patientID}`)
//   const response = await request(`/api/patient/${patientID}`, {
//     method: 'GET',
//   })
//   return response
// }

const url = '/api/appointment'
const rescheduleURL = '/api/appointment/reschedule'
const cancelURL = '/api/appointment/cancel'
const updateAppointmentLinkingURL = '/api/Appointment/updatepatient'

export const upsert = (params) => commonService.upsert(url, params)

export const insert = (params) => request(url, { method: 'POST', body: params })

export const save = (params) => request(url, { method: 'PUT', body: params })

export const reschedule = (params) =>
  request(rescheduleURL, { method: 'PUT', body: params })

export const cancel = (params) =>
  request(cancelURL, { method: 'POST', body: params })

export const query = (payload) => {
  const urlPrefix = `/${payload.mode}`
  return request(`${url}${urlPrefix}/${payload.id}`, { method: 'GET' })
}

export const queryList = (params) => {
  return commonService.queryList(url, {
    pagesize: 9999,
    ...params,
  })
}

export const deleteDraft = (payload) => commonService.remove(url, payload)

export const validate = (params) =>
  request(`${url}/validate`, { method: 'POST', body: params })

export const updateLinking = (params) =>
  request(updateAppointmentLinkingURL, { method: 'PUT', body: params })

export const pasteAppointment = (params) => request(`${url}/PasteAppointment`, { method: 'POST', body: params })
