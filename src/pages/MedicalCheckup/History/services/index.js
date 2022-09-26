import * as service from '@/services/common'
import request from '@/utils/request'
const url = '/api/medicalCheckupWorklistHistory'

const fns = {
  query: params => service.query(url, params),
  queryList: params => service.queryList(url, params),
  revert: params => service.upsert(`${url}/Revert`, params),
}
export default fns
