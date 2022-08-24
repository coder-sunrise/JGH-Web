import lodash from 'lodash'
import BaseCRUDViewModel from './BaseCRUDViewModel'

export default class BaseListViewModel extends BaseCRUDViewModel {
  constructor(options) {
    super(options)
    this.options = options
  }

  effects() {
    const { namespace, param, queryFnName = 'queryList' } = this.options
    const { service, effects } = param
    return {
      ...super.effects({ queryFnName: queryFnName }),

      *queryOne(
        { payload = { keepFilter: true, defaultQuery: false }, history },
        { call, put, select },
      ) {
        const response = yield call(service.query, payload)
        const { data, status, message } = response
        if (status === '200' || data) {
          yield put({
            type: 'querySingleSuccess',
            payload: {
              data,
            },
          })
          yield put({
            type: 'queryOneDone',
            payload: {
              data,
            },
          })
        }
        return data
      },

      *create({ payload }, { select, call, put }) {
        const state = yield select(st => st[namespace])
        const newObj = state.currentItem
        const newEntity = payload || newObj
        const response = yield call(service.create, newEntity)
        if (response.success) {
          const { data } = response
          yield put({ type: 'hideModal' })
          if (!state.disableAutoRefresh) {
            yield put({ type: 'query' })
          }
          yield put({
            type: 'created',
            payload: {
              id: data.data.id,
            },
          })
          return data.data
        }
        throw response
      },

      *update({ payload }, { select, call, put }) {
        const data = yield select(st => st[namespace].currentItem)
        if (data) {
          const { id } = data
          const newEntity = payload ? { ...payload, id } : data
          const response = yield call(service.update, newEntity)
          if (response.success) {
            yield put({ type: 'hideModal' })
            yield put({ type: 'query', payload: { keepFilter: true } })
          } else {
            throw response
          }
        }
      },

      *lock({ payload }, { call, put }) {
        const response = yield call(service.lock, payload)
        if (response.success) {
          yield put({ type: 'hideModal' })
          yield put({ type: 'query', payload: { keepFilter: true } })
        } else {
          throw response
        }
      },

      *unlock({ payload }, { call, put }) {
        const response = yield call(service.unlock, payload)
        if (response.success) {
          yield put({ type: 'hideModal' })
          yield put({ type: 'query', payload: { keepFilter: true } })
        } else {
          throw response
        }
      },

      ...effects,
    }
  }

  reducers() {
    const { param } = this.options
    const { reducers } = param
    return {
      ...super.reducers(),
      querySuccess(st, { payload = {} }) {
        // console.log(st)
        const { data, filter = {}, version, keepFilter = true } = payload
        // const { entities, filter } = data
        // // //console.log('list query')
        // console.log(filter)
        const list = data.entities ? data.entities : data.data
        // commonDataReaderTransform(list)
        const { sorting } = filter
        // console.log(list)
        const cfg = {}
        if (version) {
          cfg.version = Number(version)
        }
        return {
          ...st,
          list,
          filter: keepFilter ? filter : {},
          pagination: {
            ...st.pagination,
            current: data.currentPage || 1,
            pagesize: data.pageSize || 10,
            totalRecords: data.totalRecords,
            sorting,
          },
          ...cfg,
          // currentItem: entities[0],
        }
      },

      querySingleSuccess(st, { payload }) {
        // console.log(payload)
        const { data } = payload
        // console.log('commonDataReaderTransform', 2)

        // commonDataReaderTransform(data)
        return {
          ...st,
          entity: data,
          queryCount: (st.queryCount || 0) + 1,
        }
      },

      add(st, { payload }) {
        const { data } = payload
        let { id } = data
        if (!id) {
          id = getUniqueId()
        }
        const { list } = st
        list.push({ ...data, id, key: id })
        return {
          ...st,
          list,
        }
      },
      addMany(st, { payload }) {
        const { list: newList = [] } = payload
        newList.forEach(element => {
          let { id } = element
          if (!id) {
            id = getUniqueId()
            element.id = id
          }
        }, this)

        const { list } = st
        const listUpdated = [...list, ...newList]
        return {
          ...st,
          list: listUpdated,
        }
      },
      save(st, { payload }) {
        const { data } = payload
        const { id } = data
        const { list } = st
        let index = lodash.findIndex(list, { id })
        list.splice(index, 1, data)
        return {
          ...st,
          list,
        }
      },
      remove(st, { payload }) {
        const { data } = payload
        const { id } = data
        const { list } = st

        lodash.remove(list, { id })
        return {
          ...st,
          list,
        }
      },

      ...reducers,
    }
  }

  create() {
    const _this = this
    const { namespace, param, config = {} } = this.options
    const { queryOnLoad = false } = config
    const { state, subscriptions } = param
    const superSubscription = super.subscriptions
    const combinedState = {
      ...super.state(),
      // currentItem: {},
      // modalVisible: false,
      // selectedRowKeys: [],
      // list: null,
      pagination: {
        // showSizeChanger: true,
        // showQuickJumper: true,
        // showTotal: (total) => `Total ${total} Items`,
        current: 1,
        totalRecords: 0,
        // query: null,
      },
      ...state,
    }
    return {
      namespace,
      state: combinedState,

      subscriptions: {
        setup({ dispatch, history }) {
          superSubscription.call(_this, { dispatch, history })
          history.listen(location => {
            // // console.log(location.pathname.toLowerCase() , `/${namespace.replace('_', '/').toLowerCase()}`)
            // if (queryOnLoad) {
            //   const query = decrypt(location.search.substring(1))
            //   // //console.log(query)
            //   // const query2 = decryptToString(location.search.substring(1))
            //   dispatch({
            //     type: 'query',
            //     payload: {
            //       ...(combinedState.filter || {}),
            //       ...query,
            //     },
            //   })
            // }
          })
          if (typeof subscriptions === 'function') {
            subscriptions({ dispatch, history })
          }
        },
      },

      effects: this.effects(),

      reducers: this.reducers(),
    }
  }
}
