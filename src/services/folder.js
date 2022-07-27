import * as service from '@/services/common'
import request from '@/utils/request'

const url = '/api/ctfolder'

const fns = {
  queryList: params => service.queryList(url, params),
  checkIfEmpty: params => service.query(url + '/isEmpty', params),
  upsert: params => service.upsert(url, params),
  upsertList: params => {
    return request(`${url}/list`, {
      method: 'PUT',
      body: params,
    })
  },
}
export default fns
