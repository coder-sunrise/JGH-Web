import * as service from '@/services/common'

const url = '/api/appointment'

module.exports = {
  queryList: (params) => service.queryList(url, params),

  upsert: (params) => service.upsert(url, params),
}
