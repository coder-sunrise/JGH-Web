import * as service from '@/services/common'

const url = '/api/labWorklist'

const fns = {
  query: params => service.query(url, { ...params, pagesize: 9999 }),
  queryList: params => service.queryList(url, { ...params, pagesize: 9999 }),
  getRetestDetails: params => service.query(`${url}/getRetestDetails`, params),
  receiveSpecimen: params => service.upsert(`${url}/receiveSpecimen`, params),
  editSpecimen: params => service.upsert(`${url}/editSpecimen`, params),
  discardSpecimen: params => service.upsert(`${url}/discardSpecimen`, params),
  startLabTest: params => service.upsert(`${url}/startLabTest`, params),
  saveLabTest: params => service.upsert(`${url}/saveLabTest`, params),
  retestSpecimen: params => service.upsert(`${url}/retestSpecimen`, params),
  verifyLabTest: params => service.upsert(`${url}/verifyLabTest`, params),
  resendOrder: params => service.upsert(`${url}/resendOrder`, params),
  selectRetestResult: params =>
    service.upsert(`${url}/selectRetestResult`, params),
  upsert: params => service.upsert(url, params),
}
export default fns
