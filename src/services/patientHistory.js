import * as service from '@/services/common'

const url = '/api/PatientHistory'
const invoiceHistoryUrl = '/api/invoice'

module.exports = {
  // remove: (params) => service.remove(url, params),
  queryList: (params) => {
    return service.queryList(url, { ...params, pagesize: 9999 })
  },
  query: (params) => {
    return service.query(url, params)
  },

  queryRetailHistory: (params) => {
    return service.query(`${url}/Retail`, params)
  },
  queryDispenseHistory: (params) => {
    return service.query(`${url}/Dispense`, params)
  },
  queryInvoiceHistory: (params) => {
    return service.queryList(invoiceHistoryUrl, params)
  },
  queryPrevDoctorNotes: (params) => {
    return service.query(`${url}/PreviousDoctorNote/${params.visitId}`, params)
  },
  // upsert: (params) => {
  //   return service.upsert(url, params)
  // },

  queryMedicationHistory: (params) => {
    return service.query(`${url}/MedicationHistory`, params)
  },
  queryVisitHistory: (params) => {
    return service.query(`${url}/VisitHistory`, params)
  },
}
