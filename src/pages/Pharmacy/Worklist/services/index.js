import * as service from '@/services/common'

const url = '/api/PharmacyWorklist'

const worklistService = {
  // remove: (params) => service.remove(url, params),
  query: params => service.queryList(url, params),
  queryList: params => service.queryList(url, params),
  upsert: params => service.upsert(url, params),
}

export default worklistService
