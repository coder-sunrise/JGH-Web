import * as service from '@/services/common'

const url = '/api/InvoiceClaim'
const countUrl = '/api/InvoiceClaim/Count'
const chasClaimUrl = '/api/InvoiceClaim/SubmitChasClaim'
const chasClaimStatusUrl = '/api/InvoiceClaim/Status'

module.exports = {
  // remove: (params) => service.remove(url, params),
  queryById: (params) => service.query(url, params),
  queryList: (params) => service.queryList(url, params),
  upsert: (params) => service.upsert(url, params),
  queryBadgeCount: (params) => service.query(countUrl, params),
  submitChasClaim: (params) => service.upsert(chasClaimUrl, params),
  getStatus: (params) => service.upsert(chasClaimStatusUrl, params),
}
