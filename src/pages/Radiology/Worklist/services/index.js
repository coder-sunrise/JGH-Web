import * as service from '@/services/common'

const url = '/api/radiologyWorklist'

const fns = {
  query: params => service.query(url, params),
  queryList: params => service.queryList(url, params),
  upsert: params => service.upsert(url, params),
  cancel: params => service.upsert(url + '/cancel', params),
}
export default fns
