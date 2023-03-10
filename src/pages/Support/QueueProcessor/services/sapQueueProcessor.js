import * as service from '@/services/common'
import request from '@/utils/request'

const url = '/api/sapqueueprocessor'

const fns = {
  query: params => service.query(url, params),
  queryList: params => service.queryList(url, params),
  retrigger: params => service.upsert(`${url}/retrigger`, params),
  getDetails: params =>
    request(`${url}/${params.id}?type=${params.type}`, {
      method: 'GET',
    }),
}

export default fns
