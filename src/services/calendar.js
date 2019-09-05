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

export const upsert = (params) => commonService.upsert(url, params)

export const insert = (params) => request(url, { method: 'POST', body: params })

export const save = (params) => request(url, { method: 'PUT', body: params })

export const reschedule = (params) =>
  request(rescheduleURL, { method: 'PUT', body: params })

export const query = (payload) => {
  const urlPrefix = payload.isEditedAsSingleAppointment ? '/single' : '/series'
  return request(`${url}${urlPrefix}/${payload.id}`, { method: 'GET' })
}

export const queryList = (params) =>
  commonService.queryList(url, { pagesize: 9999, ...params })

export const deleteDraft = (id) => commonService.remove(`${url}/${id}`)

export const validate = (params) =>
  request(`${url}/validate`, { method: 'POST', body: params })
