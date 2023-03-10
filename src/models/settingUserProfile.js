import { createListViewModel } from 'medisys-model'
import * as service from '@/pages/Setting/UserProfile/services'
import * as serviceQueue from '../services/queue'

export default createListViewModel({
  namespace: 'settingUserProfile',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      list: [],
      currentSelectedUser: {},
      showUserProfileModal: false,
      // filter: {
      //   sorting: [
      //     { sortby: 'name', order: 'asc', columnName: 'name' },
      //   ],
      // },
    },
    subscriptions: {},
    effects: {
      *fetchUserProfileByID ({ payload }, { call, put }) {
        const resultSession = yield call(serviceQueue.getBizSession, {
          IsClinicSessionClosed: false,
        })
        yield put({
          type: 'queueLog/updateState',
          payload: {
            hasActiveSession:
              resultSession.data &&
              resultSession.data.data &&
              resultSession.data.data.length > 0,
          },
        })

        const response = yield call(service.query, payload)
        const { data = {}, status } = response
        return yield put({
          type: 'updateCurrentSelected',
          userProfile: { ...data },
        })
      },
      *refreshAllRelatedCodetables (_, { put }) {
        yield put({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'doctorprofile',
            filter: {
              'clinicianProfile.isActive': true,
            },
            force: true,
          },
        })
        yield put({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'clinicianprofile',
            force: true,
          },
        })
      },
    },
    reducers: {
      openModal (state) {
        return { ...state, showUserProfileModal: true }
      },
      closeModal (state) {
        return {
          ...state,
          showUserProfileModal: false,
          currentSelectedUser: {},
        }
      },
      updateCurrentSelected (state, { userProfile }) {
        return {
          ...state,
          // showUserProfileModal: !!userProfile,
          currentSelectedUser: { ...userProfile },
        }
      },
    },
  },
})
