import * as service from '@/services/common'

const url = '/api/visitOrderTemplate'

const fns = {
  query: params => service.query(url, params),
  querySimple: params => service.query(url + '/simple', params),
  queryList: params => service.queryList(url, params),
  upsert: params => service.upsert(url, params),
}
export default fns
