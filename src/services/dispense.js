import request from '@/utils/request'
import { getUniqueGUID, convertToQuery } from '@/utils/utils'
import * as service from '@/services/common'

const url = '/api/dispense'
const urlQueue = '/api/queue'

const fns = {
  remove: params => service.remove(url, params),
  query: params => {
    // console.log(url, params)
    return service.query(url, params)
  },
  create: async params => {
    const r = await request(`${url}/${params.id}`, {
      method: 'POST',
      body: params,
    })
    return r
  },
  save: async params => {
    // console.log(params)
    const r = await request(`${url}/save/${params.id}`, {
      method: 'PUT',
      body: params.values,
    })
    return r
  },
  finalize: async params => {
    const r = await request(`${url}/finalize/${params.id}`, {
      method: 'PUT',
      body: params.values,
    })
    return r
  },
  unlock: async params => {
    const r = await request(`${url}/unlock/${params.id}`, {
      method: 'PUT',
    })
    return r
  },
  refresh: async id => {
    const r = await request(`${url}/refresh/${id}`, {
      method: 'PUT',
    })
    return r
  },
  edit: async id => {
    const r = await request(`${url}/edit/${id}`, {
      method: 'PUT',
    })
    return r
  },
  sign: async params => {
    const r = await request(`${url}/sign/${params.id}`, {
      method: 'PUT',
      body: params,
    })
    return r
  },

  queryDrugLabelDetails: async visitInvoiceDrugId => {
    const r = await request(`${url}/DrugLabel/${visitInvoiceDrugId}`, {
      method: 'GET',
      keepNull: true,
    })
    return r
  },

  queryDrugLabelsDetails: async visitId => {
    const r = await request(`${url}/DrugLabelByVisitID/${visitId}`, {
      method: 'GET',
      keepNull: true,
    })
    return r
  },

  queryAddOrderDetails: async ({ invoiceId, isInitialLoading }) => {
    const r = await request(
      `${url}/retailOrder/${invoiceId}?isInitialLoading=${isInitialLoading ||
        false}`,
      {
        method: 'GET',
      },
    )
    return r
  },
  saveAddOrderDetails: async params => {
    const r = await request(`${url}/retailOrder/${params.id}`, {
      method: 'PUT',
      body: params,
    })
    return r
  },
  removeAddOrderDetails: params => service.remove(`${url}/retailOrder`, params),
  removeBillFirstVisit: params =>
    service.remove(`${url}/billFirstOrder`, params),

  getServingPersons: async params => {
    const r = await request(`${urlQueue}/getServingPersons/${params.visitFK}`, {
      method: 'GET',
    })
    return r
  },
  setServingPerson: async params => {
    const r = await request(`${urlQueue}/setServingPerson/${params.visitFK}`, {
      method: 'POST',
    })
    return r
  },
  addActualize: async params => {
    const r = await request(`${url}/addActualize`, {
      method: 'POST',
      body: params,
    })
    return r
  },
  getActualize: async params => {
    const r = await request(
      `${url}/getActualize/${params.status}?nurseWorkitemIds=${params.nurseWorkitemIds}`,
      {
        method: 'GET',
      },
    )
    return r
  },
  cancelActualize: async params => {
    const r = await request(`${url}/cancelActualize`, {
      method: 'PUT',
      body: params,
    })
    return r
  },
  getSeparatedDrugInstructions: async params =>
    await request(
      `/api/pharmacyWorklist/GetSeparatedDrugInstructions/${params.id}`,
      {
        method: 'GET',
        data: {
          ...params,
        },
      },
    ),
}
export default fns
