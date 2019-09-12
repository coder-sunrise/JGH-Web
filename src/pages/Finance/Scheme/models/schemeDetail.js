import { createFormViewModel } from 'medisys-model'
import moment from 'moment'
import * as service from '../services'
const { upsert } = service
import { getUniqueId } from '@/utils/utils'
import { InventoryTypes } from '@/utils/codes'

export default createFormViewModel({
  namespace: 'schemeDetail',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      default: {
        schemeTypeFK: 11,
        companyCoPaymentSchemeDto: [
          { coPaymentSchemeFk: 1 },
        ],
        effectiveDates: [
          moment(),
          moment('2099-12-31'),
        ],
        itemGroupMaxCapacityDtoRdoValue: 'all',
        itemGroupValueDtoRdoValue: 'all',
        patientMinCoPaymentAmountType: 'ExactAmount',
        overalCoPaymentValueType: 'ExactAmount',

        // consumableValueDto: [],
        // medicationValueDto: [],
        // vaccinationValueDto: [],
        // serviceValueDto: [],
        // packageValueDto: [],

        rows: [],
        // itemGroupMaxCapacityDto: {
        //   medicationMaxCapacity: {},
        //   vaccinationMaxCapacity: {},
        //   consumableMaxCapacity: {},
        //   serviceMaxCapacity: {},
        //   packageMaxCapacity: {},
        // },
        // itemGroupValueDto: {
        //   medicationGroupValue: {
        //     // groupValueType: 'ExactAmount',
        //   },
        //   vaccinationGroupValue: {
        //     // groupValueType: 'ExactAmount',
        //   },
        //   consumableGroupValue: {
        //     // groupValueType: 'ExactAmount',
        //   },
        //   serviceGroupValue: {
        //     // groupValueType: 'ExactAmount',
        //   },
        //   packageGroupValue: {
        //     // groupValueType: 'ExactAmount',
        //   },
        // },
        // packageValueDto: [
        //   {
        //     id: 1,
        //     itemValueType: 'ExactAmount',
        //     itemValue: 788,
        //     unitPrice: 5,
        //     inventoryPackageFK: 1,
        //   },
        // ],
      },
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen((loct) => {
        const { pathname, search, query = {} } = loct
        // console.log(pathname)
        if (pathname.indexOf('/finance/scheme/') === 0) {
          dispatch({
            type: 'updateState',
            payload: {
              currentTab: Number(query.t) || 0,
              currentId: query.id,
            },
          })
        }
      })
    },
    effects: {
      *submit ({ payload }, { call }) {
        return yield call(upsert, payload)
      },
    },
    reducers: {
      queryDone (state, { payload }) {
        const { data } = payload
        let itemRows = []
        InventoryTypes.forEach((x) => {
          itemRows = itemRows.concat(
            (data[x.prop] || []).map((y) => {
              const d = {
                uid: getUniqueId(),
                type: x.value,
                itemFK: y[x.itemFKName],
                ...y,
              }
              return x.convert ? x.convert(d) : d
            }),
          )
        })

        console.log('queryDone', itemRows)

        return {
          ...state,
          entity: {
            ...state.entity,
            rows: itemRows,
          },
        }
      },

      deleteRow (state, { payload }) {
        const { rows } = state.entity
        console.log('deleteRow', rows)
        return {
          ...state,
          entity: {
            ...state.entity,
            rows: rows.filter((o) => o.uid !== payload.id),
          },
        }
      },
    },
  },
})
