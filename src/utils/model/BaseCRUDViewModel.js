/* eslint-disable consistent-return */
import _ from 'lodash'

import update from 'immutability-helper'
import { notification } from '@/components'
import { sendNotification } from '@/utils/realtime'
import {
  getUniqueGUID,
  checkAuthoritys,
  formatUrlPath,
  cleanFieldValue,
} from '@/utils/utils'
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  SYSTEM_LANGUAGE,
} from '@/utils/constants'
import { getTranslationValue } from '@/utils/utils'
// Pages with a second print language
const secondaryPrintoutLanguageArr = [
  'settingMedicationContraIndication',
  'settingMedicationUOM',
  'settingMedicationDosage',
  'settingMedicationFrequency',
  'settingMedicationConsumptionMethod',
  'settingMedicationInteraction',
  'settingMedicationSideEffect',
  'settingAdministrationRoute',
  'settingSummaryComment',
  'settingIndividualComment',
  'settingMedicationPrecautions',
  'settingMedicineTrivia',
]

let lastLocation = null
export default class BaseCRUDViewModel {
  constructor(options) {
    this.options = options
  }

  create() {
    const { namespace, param, setting = {} } = this.options
    const { service, state, subscriptions, effects, reducers } = param
    return {
      state,
      subscriptions: {},
      effects: {
        ...this.effects({}),
        ...effects,
      },
      reducers: {
        ...this.reducers(),
        ...reducers,
      },
    }
  }

  subscriptions({ dispatch, history }) {
    history.listen(location => {
      const { pathname } = location
      checkAuthoritys(pathname, history)
    })
  }

  state() {
    return {
      // isTouched: false,
      // entity: null,
      // items: [],
      default: {},
    }
  }

  effects({ queryFnName = '' }) {
    const { namespace, param, setting = {}, config = {} } = this.options
    const { service } = param
    const { detailPath = '' } = setting
    if (!config.timer) config.timer = 2000

    return {
      query: [
        function*(
          { payload = { keepFilter: true }, history },
          { call, put, select },
        ) {
          const { keepFilter = true } = payload
          if (!service || !service[queryFnName]) return
          let {
            filter = {},
            fixedFilter = {},
            exclude,
            entity = {},
            version,
            list,
            pagination,
          } = yield select(st => st[namespace])
          // const disableAutoQuery = yield select(st => st[namespace].disableAutoQuery)
          // if (!disableAutoQuery) {
          // console.log(namespace, version, payload.version)
          if (payload.version) payload.version = Number(payload.version)
          if (
            payload.version &&
            version === payload.version &&
            payload.id === entity?.id
          )
            return list || entity
          if (typeof payload === 'object') {
            const { sorting = [], pagesize = 20 } = pagination || {}
            const current = !payload.current ? 1 : payload.current

            filter = {
              sorting,
              pagesize,
              ...fixedFilter,
              ...filter,
              ...payload,
              current,
            }
          } else {
            filter = payload
          }

          // yield put({
          //   type: 'queryBegin',
          //   payload: {
          //     filter,
          //   },
          // })
          // const { list = {} } = config
          // filter = {
          //   ...filter,
          //   // queryExcludeFields: list.exclude || exclude,
          // }
          // console.log({ filter })
          // console.log(filter)

          const response = yield call(service[queryFnName], filter)
          const { data, status, message } = response
          if (status === '200' || data) {
            let isSecondaryPrintoutLanguagePage = secondaryPrintoutLanguageArr.includes(
              namespace,
            )
            const clinicSetting = isSecondaryPrintoutLanguagePage
              ? yield select(st => {
                  return st.clinicSettings
                })
              : {}
            yield put({
              type: 'querySuccess',
              payload: {
                data,
                filter,
                keepFilter,
                version: filter.version,
              },
            })
            yield put({
              type: isSecondaryPrintoutLanguagePage
                ? 'multiLanguageSettingQueryDone'
                : 'queryDone',
              payload: {
                clinicSetting,
                data,
              },
              history,
            })
          }
          return data
        },
        { type: 'throttle', ms: 1000 },
      ],
      // _query: [
      //   function* query (
      //     { payload = { keepFilter: true, defaultQuery: false }, history },
      //     { call, put, select },
      //   ) {
      //     // console.log(namespace, queryFnName, payload, service)
      //     if (!service || !service[queryFnName]) return
      //     let { filter = {} } = yield select((st) => st[namespace])
      //     if (!payload.keepFilter) {
      //       if (typeof payload === 'object') {
      //         filter = {
      //           ...filter,
      //           ...payload,
      //         }
      //       } else {
      //         filter = payload
      //       }
      //     }

      //     const response = yield call(service[queryFnName], filter)
      //     console.log(namespace, response)
      //     const { data, status, message } = response
      //     if (status === '200' || data) {
      //       yield put({
      //         type: 'querySuccess',
      //         payload: { data, filter, version: filter.version },
      //       })
      //       yield put({
      //         type: 'queryDone',
      //         payload: {
      //           data,
      //         },
      //         history,
      //       })
      //     }
      //     return data
      //     // }
      //   },
      //   { type: 'throttle', ms: 20000 },
      // ],

      // *query (
      //   { payload = { keepFilter: true, defaultQuery: false } },
      //   { call, put, select, take },
      // ) {
      //   if (!service || !service[queryFnName]) return
      //   let { entity = {}, version, list } = yield select((st) => st[namespace])
      //   // const disableAutoQuery = yield select(st => st[namespace].disableAutoQuery)
      //   // if (!disableAutoQuery) {
      //   // console.log(namespace, version, payload.version)
      //   if (payload.version) payload.version = Number(payload.version)
      //   console.log(namespace, list, entity)
      //   if (
      //     payload.version &&
      //     version === payload.version &&
      //     payload.id === entity.id
      //   )
      //     return list || entity

      //   const r = yield put({
      //     type: '_query',
      //     payload,
      //   })
      //   yield take('_query/@@end')

      //   console.log(r)
      //   return r
      // },

      *upsert({ payload, history }, { select, call, put }) {
        // console.log('upsert', payload, namespace, config)
        const { cfg = {} } = payload
        const newPayload = cleanFieldValue(_.cloneDeep(payload))
        const r = yield call(service.upsert, newPayload)
        if (r) {
          let message = r.id ? 'Created' : 'Saved'
          if (cfg.message) {
            message = cfg.message
          }
          notification.success({
            // duration:0,`
            message,
          })
        }

        const { codetable } = config
        // console.log(codetable)
        if (codetable) {
          if (typeof codetable === 'function') {
            sendNotification('CodetableUpdated', codetable(newPayload))
          } else {
            sendNotification('CodetableUpdated', {
              ...codetable,
              type: NOTIFICATION_TYPE.CODETABLE,
              status: NOTIFICATION_STATUS.OK,
            })
          }
        }

        return r
      },
      *delete({ payload }, { call, put }) {
        const { cfg = {} } = payload
        const response = yield call(service.remove, payload)
        // console.log(response)
        let _message = 'Deleted'
        if (cfg.message) {
          _message = cfg.message
          notification.success({
            message: _message,
          })
        }
        return response
      },

      *lock({ payload, history }, { call, put, select, take }) {
        const s = yield select(st => st[namespace])
        const { currentItem, newDetailPath } = s
        let data = currentItem
        if (data) {
          if (data.id === '00000000-0000-0000-0000-000000000000') {
            yield put({ type: 'create', payload })
            yield take('create/@@end')
            data = yield select(st => st[namespace].currentItem)
            // console.log(data)
          } else {
            yield put({ type: 'update', payload })
            yield take('update/@@end')
          }
          const lockResponse = yield call(service.lock, { id: data.id })
          if (lockResponse.success) {
            // if (data.id === '00000000-0000-0000-0000-000000000000') {

            // } else {
            //   yield put({ type: 'query', payload: { keepFilter: true } })
            // }
            let path = detailPath
            // console.log(path)
            if (newDetailPath) {
              path = newDetailPath
            }
            // console.log(path)
            const handled = yield put({
              type: 'lockDone',
              payload: {
                response: lockResponse,
              },
              history,
            })
            if (!handled) history.push(formatUrlPath(path, { id: data.id }))
          } else {
            throw lockResponse
          }
        }
      },

      *unlock({ payload, history }, { call, put }) {
        const response = yield call(service.unlock, payload)
        const { data, success } = response
        if (success) {
          yield put({ type: 'reset' })
          history.push(formatUrlPath(detailPath, { id: data.data }))
          yield put({
            type: 'updateState',
            payload: { shouldCompareListUpdate: true },
          })
        } else {
          throw response
        }
      },

      *updateAppState({ payload }, { call, put }) {
        yield put({
          type: 'updateState',
          payload: {
            onConfirmDiscard: undefined,
            ...payload,
          },
        })
      },

      *localAdd({ payload }, { put, select }) {
        let st = yield select(s => s[namespace])
        if (payload.length) {
          yield put({
            type: 'updateState',
            payload: update(st, {
              items: {
                $unshift: payload.map(o => {
                  return {
                    id: getUniqueGUID(),
                    ...o,
                  }
                }),
              },
            }),
          })
        }
        st = yield select(s => s[namespace])
        return st.items
      },
      *localChange({ payload }, { put, select }) {
        let st = yield select(s => s[namespace])
        let { items } = st
        const newItems = items.map(row => {
          const n = payload[row.id] ? { ...row, ...payload[row.id] } : row
          return n
        })
        yield put({
          type: 'updateState',
          payload: update(st, {
            items: { $set: newItems },
          }),
        })
        st = yield select(s => s[namespace])
        return st.items
      },
      *localDelete({ payload }, { put, select }) {
        let st = yield select(s => s[namespace])
        let { items } = st
        // console.log(items)
        const newItems = items.filter(row => !payload.find(o => o === row.id))
        yield put({
          type: 'updateState',
          payload: update(st, {
            items: { $set: newItems },
          }),
        })
        st = yield select(s => s[namespace])
        return st.items
      },
    }
  }

  reducers() {
    // update.extend('$auto', (value, object) => {
    //   return object ?
    //     update(object, value) :
    //     update({}, value)
    // })
    // update.extend('$autoArray', (value, object) => {
    //   return object ?
    //     update(object, value) :
    //     update([], value)
    // })
    const { namespace, param, setting = {}, config = {} } = this.options
    const { state } = param
    // console.log(this.options)
    return {
      // Used for simple state update
      updateState(st, { payload }) {
        // console.log(payload)
        // const newVal = updateInner(payload, st)
        // return newVal
        return {
          ...st,
          ...payload,
        }
      },
      updateFilter(st, { payload }) {
        return {
          ...st,
          filter: {
            ...payload,
            timestamp: new Date().getTime(),
          },
        }
      },
      replaceState(st, { payload }) {
        return payload
      },

      switchIsMotion(st) {
        return { ...st, isMotion: !st.isMotion }
      },

      queryBegin(st, { payload }) {
        const { filter } = payload
        return {
          ...st,
          filter,
        }
      },
      multiLanguageSettingQueryDone(st, { payload }) {
        const {
          data,
          clinicSetting: {
            settings: {
              primaryPrintoutLanguage = '',
              secondaryPrintoutLanguage = '',
            },
          },
        } = payload
        return {
          ...st,
          list: data.data.map(o => {
            return {
              ...o,
              effectiveDates: [o.effectiveStartDate, o.effectiveEndDate],
              translatedDisplayValue:
                primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE ||
                secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE
                  ? getTranslationValue(
                      o.translationData,
                      SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
                      'displayValue',
                    )
                  : '',
            }
          }),
          pagination: {
            ...st.pagination,
            current: data.currentPage || 1,
            pagesize: data.pageSize || 10,
            totalRecords: data.totalRecords,
          },
        }
      },
      save(st, { payload }) {
        const { data } = payload
        return {
          ...st,
          data,
        }
      },

      reset(st, { payload }) {
        return state || {}
      },

      showModal(st, { payload }) {
        return { ...st, ...payload, modalVisible: true }
      },

      hideModal(st) {
        return { ...st, modalVisible: false }
      },

      created(st, { payload }) {
        // //console.log(payload)
        return {
          ...st,
          created: true,
          newCreatedId: payload.id,
        }
      },
    }
  }
}
