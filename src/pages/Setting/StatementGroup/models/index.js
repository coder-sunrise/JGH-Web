import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import service from '../services'

export default createListViewModel({
  namespace: 'settingStatementGroup',
  config: {
    codetable: {
      message: 'Statement group updated',
      code: 'statementGroup',
    },
  },
  param: {
    service,
    state: {
      default: {
        isUserMaintainable: true,
        effectiveDates: [
          moment().formatUTC(),
          moment('2099-12-31T23:59:59').formatUTC(false),
        ],
        description: '',
      },
    },
    effects: {},
    reducers: {
      queryOneDone(st, { payload }) {
        const { data } = payload
        data.effectiveDates = [data.effectiveStartDate, data.effectiveEndDate]
        return {
          ...st,
          entity: data,
        }
      },
      queryDone(st, { payload }) {
        const { data } = payload

        return {
          ...st,
          list: data.data.map(o => {
            return {
              ...o,
              effectiveDates: [o.effectiveStartDate, o.effectiveEndDate],
            }
          }),
        }
      },
    },
  },
})
