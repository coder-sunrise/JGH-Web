import { createListViewModel } from 'medisys-model'
import service from '../services'
import { fetchCodeTable } from '@/utils/codetable'

export default createListViewModel({
  namespace: 'corporateBilling',
  config: {
    queryOnLoad: true,
  },
  param: {
    service,
    state: {
      ctCoPayer: [],
    },
    effects: {
      *fetchCompany(_, { call, put }) {
        const response = yield call(fetchCodeTable, 'ctCopayer', {
          isActive: undefined,
          excludeInactiveCodes: false,
        })

        if (Array.isArray(response)) {
          yield put({
            type: 'updateState',
            payload: {
              ctCoPayer: response.map(item => {
                return {
                  code: item.code,
                  name: item.displayValue,
                  id: item.id,
                  creditFacility: item.creditFacility,
                  copayerAddress: item.copayerAddress,
                }
              }),
            },
          })
        }
      },
    },
  },
})
