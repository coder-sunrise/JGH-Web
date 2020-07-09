import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import { notification } from '@/components'
import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from '@/utils/constants'
import * as service from '../services'

let companyTypes = [
  { id: 1, name: 'copayer' },
  { id: 2, name: 'supplier' },
]

export default createListViewModel({
  namespace: 'settingCompany',
  config: {
    codetable: ({ companyTypeFK }) =>
      companyTypeFK === 1
        ? {
            message: 'Copayer updated',
            code: 'ctcopayer',
            type: NOTIFICATION_TYPE.CODETABLE,
            status: NOTIFICATION_STATUS.OK,
          }
        : {
            message: 'Supplier updated',
            code: 'ctsupplier',
            type: NOTIFICATION_TYPE.CODETABLE,
            status: NOTIFICATION_STATUS.OK,
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
        adminCharge: 0,
        adminChargeType: 'Percentage',
        autoInvoiceAdjustmentType: 'Percentage',
        autoInvoiceAdjustment: 0,
        coPayerTypeFK: 1,
        isGSTEnabled: false,
        contact: {
          contactAddress: [
            {
              street: '',
              postcode: '',
              countryFK: undefined,
            },
          ],
          mobileContactNumber: {
            number: undefined,
          },
          officeContactNumber: {
            number: undefined,
          },
          faxContactNumber: {
            number: undefined,
          },
          contactWebsite: {
            website: undefined,
          },
          contactEmailAddress: {
            emailAddress: undefined,
          },
        },
      },
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen((loct, method) => {
        const { pathname, search, query = {} } = loct
        if (pathname.toLowerCase().indexOf('/setting/company/') === 0) {
          const companyType = companyTypes.find(
            (o) =>
              o.id ===
              Number(pathname.toLowerCase().replace('/setting/company/', '')),
          )
          dispatch({
            type: 'updateState',
            payload: {
              companyType,
              filter: {
                companyTypeFK: companyType.id,
              },
            },
          })
        }

        if (pathname === '/finance/copayer') {
          const companyType = companyTypes.find((o) => o.id === 1)
          dispatch({
            type: 'updateState',
            payload: {
              companyType,
              filter: {
                companyTypeFK: companyType.id,
              },
            },
          })
        }
      })
    },
    effects: {
      *upsertCopayer ({ payload }, { call, put }) {
        const r = yield call(service.upsertCop, payload)
        if (r.id) {
          notification.success({ message: 'Created' })
          return true
        }
        if (r) {
          notification.success({ message: 'Saved' })
          return true
        }
        return r
      },

      *upsertSupplier ({ payload }, { call, put }) {
        const r = yield call(service.upsertSup, payload)
        if (r.id) {
          notification.success({ message: 'Created' })
          return true
        }
        if (r) {
          notification.success({ message: 'Saved' })
          return true
        }
        return r
      },
    },

    reducers: {
      queryDone (st, { payload }) {
        const { data } = payload

        return {
          ...st,
          list: data.data.map((o) => {
            return {
              ...o,
              effectiveDates: [
                o.effectiveStartDate,
                o.effectiveEndDate,
              ],
            }
          }),
        }
      },
    },
  },
})
