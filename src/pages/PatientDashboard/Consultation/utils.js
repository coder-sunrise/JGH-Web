import { consultationDocumentTypes, orderTypes } from '@/utils/codes'

const convertToConsultation = (values, { consultationDocument, orders }) => {
  const { rows = [] } = consultationDocument
  consultationDocumentTypes.forEach((p) => {
    values[p.prop] = rows.filter((o) => o.type === p.value)
  })

  const { rows: orderRows = [], finalAdjustments = [] } = orders
  values.corOrderAdjustment = finalAdjustments
  orderTypes.forEach((p) => {
    values[p.prop] = (values[p.prop] || [])
      .concat(orderRows.filter((o) => o.type === p.value))
  })
  return values
}

module.exports = {
  ...module.exports,
  convertToConsultation,
}
