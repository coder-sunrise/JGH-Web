import { notification } from '@/components'
import { createListViewModel } from 'medisys-model'
import service from '../services'

export default createListViewModel({
  namespace: 'labWorklist',
  config: { queryOnLoad: false },
  param: {
    service,
    state: {},
    setting: {},
    subscriptions: ({ dispatch }) => {},
    effects: {
      *receiveSpecimen({ payload }, { call, put }) {
        const status = yield call(service.receiveSpecimen, payload)

        if (status === 200 || status === 204) {
          notification.success({ message: 'Lab specimen received.' })
          return true
        }
        return status
      },
      *editSpecimen({ payload }, { call, put }) {
        const status = yield call(service.editSpecimen, payload)
        if (status === 200 || status === 204) {
          notification.success({ message: 'Lab specimen updated.' })
          return true
        }
        return status
      },
      *discardSpecimen({ payload }, { call, put }) {
        const status = yield call(service.discardSpecimen, payload)

        if (status === 200 || status === 204) {
          notification.success({ message: 'Lab specimen discarded.' })
          return true
        }
        return status
      },
      *selectRetestResult({ payload }, { call, put }) {
        const status = yield call(service.selectRetestResult, payload)

        if (status === 200 || status === 204) {
          notification.success({ message: 'Retest result saved successfully.' })
          return true
        }
        return status
      },
      *getRetestDetails({ payload }, { call, put }) {
        const r = yield call(service.getRetestDetails, payload)
        const { status, data } = r

        if (status === '200') {
          if (data) {
            return data
          }
          return null
        }
      },
    },
    reducers: {},
  },
})
