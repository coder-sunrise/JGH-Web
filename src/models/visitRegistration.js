import router from 'umi/router'
import { createFormViewModel } from 'medisys-model'
import { query as queryPatient } from '@/services/patient'
import { getRemovedUrl } from '@/utils/utils'
import * as service from '../services/visit'

const openModal = {
  type: 'global/updateAppState',
  payload: {
    showVisitRegistration: true,
  },
}

const closeModal = {
  type: 'global/updateAppState',
  payload: {
    showVisitRegistration: false,
  },
}

export default createFormViewModel({
  namespace: 'visitRegistration',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      entity: {
        queueNo: '',
        visit: {
          visitRemarks: undefined,
        },
      },
      patientInfo: {},
      visitInfo: {},
      errorState: {},
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (location) => {
        const { query } = location
        if (query.md === 'visreg') {
          query.vis
            ? dispatch({
                type: 'fetchVisitInfo',
                payload: { id: query.vis },
              })
            : dispatch({
                type: 'patient/query',
                payload: { id: query.pid },
              })
          if (query.apptid) {
            dispatch({
              type: 'updateState',
              payload: { appointmentFK: query.apptid },
            })
          }
          if (query.pdroomid) {
            const pdroomidInt = parseInt(query.pdroomid, 10)
            dispatch({
              type: 'updateState',
              payload: { roomFK: pdroomidInt || undefined },
            })
          }
          dispatch(openModal)
        }
      })
    },
    effects: {
      *closeModal (_, { put }) {
        router.push(
          getRemovedUrl([
            'md',
            'cmt',
            'pid',
            'vis',
            'acc',
            'refno',
            'new',
            'type',
            'apptid',
            'pdid',
            'pdroomid',
          ]),
        )
        yield put({
          type: 'updateState',
          payload: {
            visitInfo: {},
            patientInfo: {},
            errorState: {},
            roomFK: undefined,
            appointmentFK: undefined,
            expandRefractionForm: undefined,
            expandExaminationForm: undefined,
          },
        })
        yield put({
          type: 'patient/updateState',
          payload: {
            callback: undefined,
          },
        })
        return yield put(closeModal)
      },
      *fetchVisitInfo ({ payload }, { call, put, take }) {
        yield put({
          type: 'updateErrorState',
          errorKey: 'visitInfo',
          errorMessage: undefined,
        })
        try {
          const response = yield call(service.query, payload)
          const { data = {} } = response
          const { visit: { patientProfileFK, visitEyeRefractionForm } } = data

          if (patientProfileFK) {
            // const { patientProfileFK } = visit
            if (patientProfileFK) {
              const patientPayload = {
                id: patientProfileFK,
              }
              yield put({
                type: 'patient/query',
                payload: patientPayload,
              })
            }
            // yield take('fetchPatientInfoByPatientID/@@end')
            let refractionFormData
            if (visitEyeRefractionForm) {
              if (
                visitEyeRefractionForm.formData &&
                typeof visitEyeRefractionForm.formData === 'string'
              ) {
                refractionFormData = JSON.parse(visitEyeRefractionForm.formData)
              } else {
                // eslint-disable-next-line prefer-destructuring
                refractionFormData = visitEyeRefractionForm.formData
              }
            }

            yield put({
              type: 'updateState',
              payload: {
                visitInfo: {
                  ...data,
                  visitEyeRefractionForm: {
                    ...visitEyeRefractionForm,
                    formData: refractionFormData,
                  },
                },
                attachmentOriList: [
                  ...data.visit.visitAttachment,
                ],
                expandRefractionForm: !!visitEyeRefractionForm,
              },
            })
          }
        } catch (error) {
          console.log({ error })
          yield put({
            type: 'updateErrorState',
            payload: {
              visitInfo: 'Failed to retrieve visit info...',
            },
          })
        }
      },
      *fetchPatientInfoByPatientID ({ payload }, { call, put }) {
        try {
          const response = yield call(queryPatient, payload)
          const { data } = response

          yield put({
            type: 'updateState',
            payload: {
              patientInfo: { ...data },
            },
          })
        } catch (error) {
          yield put({
            type: 'updateErrorState',
            payload: {
              patientInfo: 'Failed to retrieve patient info',
            },
          })
        }
      },
      *getVisitOrderTemplateList ({ payload }, { call, put }) {
        try {
          const response = yield call(service.queryVisitOrderTemplate, payload)
          const { data } = response
          return data
        } catch (error) {
          yield put({
            type: 'updateErrorState',
            payload: {
              patientInfo: 'Failed to retrieve visit order templates',
            },
          })
          return false
        }
      },
      *getReferralList ({ payload }, { call, put }) {
        try {
          const response = yield call(service.queryReferralList)
          const { data } = response
          return data
        } catch (error) {
          yield put({
            type: 'updateErrorState',
            payload: {
              patientInfo: 'Failed to retrieve referral list',
            },
          })
          return false
        }
      },
    },
    reducers: {
      // resetState (state, { payload }) {
      //   return { ...state, ...payload }
      // },
      updateErrorState (state, { payload }) {
        return {
          ...state,
          errorState: { ...state.errorState, ...payload },
        }
      },
    },
  },
})
