import * as service from '@/services/common'
import request from '@/utils/request'

const url = '/api/Statement'
const invoiceUrl = '/api/Invoice/InvoicesNotInsideStatment'
const refreshUrl = '/api/Statement/Refresh'
const extractUrl = '/api/Statement/ExtractAsSingle'
const bizSessionUrl = '/api/bizSession'
const statementPaymentUrl = '/api/StatementPayment'

// const runningNoUrl = '/api/InventoryAdjustment/GenerateRunningNo'
// const stockUrl = '/api/InventoryAdjustment/StockDetails'

module.exports = {
  queryList: (params) => service.queryList(url, params),
  query: (params) => {
    return service.query(url, params)
  },
  upsert: (params) => service.upsert(url, params),

  queryInvoiceList: (params) => service.queryList(invoiceUrl, params),
  // queryStockDetails: (params) => service.query(stockUrl, params),

  queryPaymentList: async (params) => service.queryList(statementPaymentUrl, params),
  queryStatementPaymentById: (statmentPaymentId) => {
    return service.query(statementPaymentUrl, { id: statmentPaymentId })
  },
  cancelPayment: async (id, params) => {
    await request(`${statementPaymentUrl}/${id}`, {
      method: 'PUT',
      body: params,
    })
  },
  refresh: async (params) => {
    let r
    if (params.id) {
      r = await request(`${refreshUrl}/${params.id}`, {
        method: 'PUT',
        body: params,
      })
    }
    return r
  },

  extract: async (params) => {
    let r
    if (params.id) {
      r = await request(`${extractUrl}/${params.id}`, {
        method: 'PUT',
        body: params,
      })
    }
    return r
  },

  queryBizSession: (params) => service.queryList(bizSessionUrl, params),
  remove: (params) => {
    return request(`${url}/${params.id}`, {
      method: 'DELETE',
      body: 'Statement cancelled',
    })
  },
}
