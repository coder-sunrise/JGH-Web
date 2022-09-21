import * as service from '@/services/common'

const url = '/api/specimenCollection'
const queryVisitSpecimenCollection = `${url}/getVisitSpecimenCollection`
import request from '@/utils/request'

const fns = {
  query: params => service.query(url, params),
  queryList: params => service.queryList(url, params),
  queryLabSpecimenById: params => service.query(url, params),
  queryLabSpecimenLabelById: params =>
    service.query(`${url}/labSpecimenLabel`, params),
  queryVisitSpecimenCollection: params =>
    service.query(queryVisitSpecimenCollection, params),
  upsert: params => service.upsert(url, params),
  ack: params => service.upsert(`${url}/ack`, params),
  cancel: async params => {
    const r = await request(`${url}/cancel`, {
      method: 'POST',
      body: params,
    })
    return r
  },
}
export default fns
