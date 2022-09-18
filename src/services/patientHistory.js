import * as service from '@/services/common'

const url = '/api/PatientHistory'
const invoiceHistoryUrl = '/api/invoice/patient'
const invoiceHistoryDetailsUrl = '/api/invoice/historyDetails'
const queueUrl = '/api/queue'

const fns = {
  // remove: (params) => service.remove(url, params),
  queryList: params => {
    return service.queryList(url, { ...params, pagesize: 9999 })
  },
  query: params => {
    return service.query(url, params)
  },

  queryRetailHistory: params => {
    return service.query(`${url}/Retail`, params)
  },
  queryDispenseHistory: params => {
    return service.query(`${url}/Dispense`, params)
  },
  queryInvoiceHistory: params => {
    return service.queryList(invoiceHistoryUrl, params)
  },
  queryInvoiceHistoryDetails: params => {
    return service.query(invoiceHistoryDetailsUrl, params)
  },
  queryPrevDoctorNotes: params => {
    return service.query(`${url}/PreviousDoctorNote/${params.visitId}`, params)
  },
  // upsert: (params) => {
  //   return service.upsert(url, params)
  // },

  queryMedicationHistory: params => {
    return service.query(`${url}/MedicationHistory`, params)
  },
  queryVisitHistory: params => {
    return service.query(`${url}/VisitHistory`, params)
  },

  queryDiagnosisHistory: params => {
    return service.query(`${url}/DiagnosisHistory`, params)
  },
  queryReferralHistory: params => {
    return service.queryList(`${url}/Referral`, params)
  },

  saveReferralHistory: params => {
    return service.upsert(`${queueUrl}/ReferralHistory`, params)
  },

  queryPersistentDiagnosis: params => {
    return service.query(`${url}/PersistentDiagnosis`, params)
  },
}
export default fns
