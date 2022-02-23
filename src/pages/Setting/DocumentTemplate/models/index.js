import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import service from '../services'
import { DOCUMENT_CATEGORY } from '@/utils/constants'

const pathname = window.location.pathname.trim().toLowerCase()
export default createListViewModel({
  namespace: 'settingDocumentTemplate',
  config: {
    codetable: {
      message: 'Document Template updated',
      code: 'documenttemplate',
    },
  },
  param: {
    service,
    state: {
      documentCategoryFK: DOCUMENT_CATEGORY.CONSULTATIONDOCUMENT,
      default: {
        isUserMaintainable: true,
        effectiveDates: [
          moment().formatUTC(),
          moment('2099-12-31T23:59:59').formatUTC(false),
        ],
      },
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
      })
    },
    effects: {},
    reducers: {
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
