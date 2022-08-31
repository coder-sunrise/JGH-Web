import * as service from '@/services/common'
import request from '@/utils/request'
const url = '/api/medicalCheckupWorklist'

const fns = {
  query: params => service.query(url, params),
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
  updateReportStatus: params =>
    service.upsert(`${url}/UpdateReportStatus`, params),
  unlock: params => service.upsert(`${url}/Unlock`, params),
  queryReportData: params => service.query(`${url}/GetReportData`, params),
  queryLastReportData: params =>
    service.query(`${url}/GetLastReportData`, params),
  markCommentAsDone: params =>
    service.upsert(`${url}/MarkCommentAsDone`, params),
  generateAutoComment: params =>
    service.upsert(`${url}/GenerateAutoComment`, params),
  upsertSummaryComment: params =>
    service.upsert(`${url}/SummaryComment`, params),
  upsertIndividualComment: params =>
    service.upsert(`${url}/IndividualComment`, params),
  cancel: params => service.upsert(`${url}/Cancel`, params),
  complete: params => service.upsert(`${url}/Complete`, params),
}
export default fns
