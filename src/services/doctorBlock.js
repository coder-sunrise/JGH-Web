import request from '@/utils/request'
import * as commonService from '@/services/common'

const url = '/api/doctorblock'

export const upsert = (params) => commonService.upsert(url, params)
export const query = (payload) => {
  return request(`${url}/${payload.id}/${payload.mode === 'series'}`, {
    method: 'GET',
  })
}
export const queryList = (params) =>
  commonService.queryList(url, { ...params, pagesize: 999 })
export const getAllList = (params) => commonService.queryAll(url, params)
export const remove = (params) => {
  request(`${url}/${params.id}/${params.includeSeries}`, { method: 'DELETE' })
}
export const insert = (params) => request(url, { method: 'POST', body: params })
export const save = (params) => request(url, { method: 'PUT', body: params })
export const pasteDoctorBlock = (params) => request(`${url}/PasteDoctorBlock`, { method: 'POST', body: params })
