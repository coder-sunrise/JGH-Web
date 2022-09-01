import * as service from '@/services/common'
import request from '@/utils/request'

const url = '/api/LabTrackingDetails'

const fns = {
  queryList: params => service.queryList(url, params),
  query: params => service.query(url, params),
  upsert: params => service.upsert(url, params),
  getLabTrackingDetailsForVisit: async params => {
    return await request(`${url}/visit`, {
      method: 'GET',
      body: { visitId: params.visitId },
    })
  },
  discard: async params => {
    return await request(`${url}/Discard/${params.id}`, {
      method: 'PUT',
      body: params,
    })
  },
}

export default fns
