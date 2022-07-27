import * as service from '@/services/common'
import request from '@/utils/request'

const url = '/api/patientResult'

const fns = {
  queryBasicDataList: params =>
    service.queryList(`${url}/basicHistory`, params),
  queryExaminationsList: async params => {
    return await request(`${url}/examinations`, {
      method: 'GET',
      data: params,
    })
  },
}
export default fns
