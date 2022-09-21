import { history } from 'umi'
import { notification } from '@/components'
import { createFormViewModel } from 'medisys-model'
import service from '../../../services'
import { getUserPreference, saveUserPreference } from '@/services/user'

export default createFormViewModel({
  namespace: 'medicalCheckupReportingDetails',
  config: { queryOnLoad: false },
  param: {
    service,
    state: {},
    setting: {},
    subscriptions: ({ dispatch, history }) => {
      history.listen(async loct => {
        const { query = {}, pathname } = loct
        if (
          (pathname === '/medicalcheckup/worklist/reportingdetails' ||
            pathname === '/medicalcheckup/history/reportingdetails') &&
          Number(query.mcid)
        ) {
          dispatch({
            type: 'global/updateState',
            payload: {
              fullscreen: true,
              showMedicalCheckupReportingDetails: true,
            },
          })
          dispatch({
            type: 'initState',
            payload: {
              version: Number(query.v) || undefined,
              visitID: Number(query.vid),
              pid: Number(query.pid),
              mcid: Number(query.mcid),
              qid: Number(query.qid),
            },
          })
        }
      })
    },
    effects: {
      *initState({ payload }, { all, put, select, take }) {
        const { version, visitID, pid, mcid, qid } = payload
        const patientState = yield select(st => st.patient)
        yield put({
          type: 'updateState',
          payload: {
            visitID,
            patientID: pid,
            medicalCheckupWorkitemId: mcid,
          },
        })

        if (pid && (!patientState.entity || patientState.entity.id !== pid)) {
          yield put({
            type: 'patient/query',
            payload: {
              id: payload.pid,
            },
          })
          yield take('patient/query/@@end')
        }

        if (qid)
          yield put({
            type: 'visitRegistration/query',
            payload: { id: payload.qid, version: payload.v },
          })

        yield put({
          type: 'query',
          payload: {
            id: mcid,
            version,
          },
        })
        yield take('query/@@end')
      },
      *closeMedicalCheckupReportingDetailsModal(
        { payload },
        { all, put, select },
      ) {
        const index = window.location.pathname.indexOf('reportingdetails')
        const newUrl = window.location.pathname.substr(0, index - 1)

        history.push(newUrl)
        return yield all([
          yield put({
            type: 'global/updateAppState',
            payload: {
              disableSave: false,
              showMedicalCheckupReportingDetails: false,
              fullscreen: false,
              currentPatientId: null,
            },
          }),
          // reset patient model state to default state
          yield put({
            type: 'updateState',
            payload: {
              entity: undefined,
              medicalCheckupWorkitemId: undefined,
              visitID: undefined,
              patientID: undefined,
              summaryCommentEntity: undefined,
              individualCommentEntity: undefined,
            },
          }),
        ])
      },
      *queryIndividualCommentHistory({ payload }, { call, put }) {
        const response = yield call(
          service.queryIndividualCommentHistory,
          payload,
        )
        if (response && response.status === '200') {
          yield put({
            type: 'updateState',
            payload: {
              individualCommentList: response.data.data,
            },
          })
        }
        return response
      },
      *querySummaryCommentHistory({ payload }, { call, put }) {
        const response = yield call(service.querySummaryCommentHistory, payload)
        if (response && response.status === '200') {
          yield put({
            type: 'updateState',
            payload: {
              summaryCommentList: response.data.data,
            },
          })
        }
        return response
      },
      *deleteSummaryComment({ payload }, { call, put }) {
        const response = yield call(service.deleteSummaryComment, payload)
        return response
      },
      *generateReport({ payload }, { call, put }) {
        const response = yield call(service.generateReport, payload)
        return response
      },
      *copyComment({ payload }, { call, put }) {
        const response = yield call(service.copyComment, payload)
        return response
      },
      *updateReportingDoctor({ payload }, { call, put }) {
        const response = yield call(service.updateReportingDoctor, payload)
        return response
      },
      *queryExternalService({ payload }, { call, put }) {
        const response = yield call(service.queryExternalService, payload)
        return response
      },
      *updateReportStatus({ payload }, { call, put }) {
        const response = yield call(service.updateReportStatus, payload)
        return response
      },
      *unlock({ payload }, { call, put }) {
        const response = yield call(service.unlock, payload)
        return response
      },
      *queryReportData({ payload }, { call, put }) {
        const response = yield call(service.queryReportData, payload)
        return response
      },
      *markCommentAsDone({ payload }, { call, put }) {
        const response = yield call(service.markCommentAsDone, payload)
        return response
      },
      *upsertSummaryComment({ payload }, { call, put }) {
        const response = yield call(service.upsertSummaryComment, payload)
        return response
      },
      *upsertIndividualComment({ payload }, { call, put }) {
        const response = yield call(service.upsertIndividualComment, payload)
        return response
      },
      *queryMedicalCheckupHistory({ payload }, { call, put }) {
        const response = yield call(service.queryMedicalCheckupHistory, payload)
        return response
      },
      *previewReportData({ payload }, { call, put }) {
        const response = yield call(service.previewReportData, payload)
        return response
      },
    },
    reducers: {},
  },
})
