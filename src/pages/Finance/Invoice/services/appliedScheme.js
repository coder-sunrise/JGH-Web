import * as service from '@/services/common'
import request from '@/utils/request'

// /api/Invoice/InvoicePayer/{id}/{invoiceVersionNo}
const apiUrl = '/api/Invoice'
const invoiceApiUrl = '/api/Invoice'

export const queryInvoicePayerByIdAndInvoiceVersionNo = async ({
  id,
  invoiceVersionNo,
}) => {
  const url = `${apiUrl}/${id}/${invoiceVersionNo}`
  return request(url, {
    method: 'GET',
  })
}

export const saveAppliedScheme = (payload) => {
  const { visitId } = payload
  return request(`${invoiceApiUrl}/save/${visitId}`, {
    method: 'PUT',
    body: payload,
  })
}

export const validateInvoicePayer = (payload) => {
  return request(`${apiUrl}/validate`, { method: 'POST', body: payload })
}
