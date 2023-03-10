import request from '@/utils/request'
import * as commonService from '@/services/common'

const url = '/api/CannedText'

export const query = (params) =>
  request(`${url}?cannedTextTypeId=${params}`, {
    method: 'GET',
  })
export const changeOrder = async (params) => {
  await request(`${url}/ChangeOrder`, {
    method: 'PUT',
    body: params,
  })
}
export const upsert = (params) => commonService.upsert(url, params)
export const remove = (params) => commonService.remove(url, params)
