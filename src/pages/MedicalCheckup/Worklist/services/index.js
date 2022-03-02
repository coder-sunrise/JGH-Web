import * as service from '@/services/common'
import request from '@/utils/request'
const url = '/api/medicalCheckupWorklist'

const fns = {
  query: params => service.query(url, { ...params, pagesize: 9999 }),
  queryList: params => service.queryList(url, { ...params, pagesize: 9999 }),
  upsert: params => service.upsert(url, params),
  queryIndividualCommentHistory: params =>
    service.queryList(`${url}/IndividualCommentHistory`, {
      ...params,
      pagesize: 9999,
    }),
  querySummaryCommentHistory: params =>
    service.queryList(`${url}/SummaryCommentHistory`, {
      ...params,
      pagesize: 9999,
    }),
  deleteSummaryComment: params => {
    return request(`${url}/DeleteSummaryComment/${params.id}`, {
      method: 'DELETE',
    })
  },
  generateReport: params => service.upsert(`${url}/GenerateReport`, params),
  copyComment: params => service.upsert(`${url}/CopyComment`, params),
  updateReportingDoctor: params =>
    service.upsert(`${url}/UpdateReportingDoctor`, params),
  queryExternalService: params =>
    service.queryList(`${url}/ExternalService`, {
      ...params,
      pagesize: 9999,
    }),
  verifyReport: params => service.upsert(`${url}/VerifyReport`, params),
}
export default fns
