import moment from 'moment'
import { createListViewModel } from 'medisys-model'
// common components
import { constructObj } from '@/pages/Reception/Appointment/utils'
import { notification, timeFormat24Hour } from '@/components'
import * as service from '@/services/doctorBlock'
import cohServices from '@/pages/Setting/ClinicOperationHour/services'

export default createListViewModel({
  namespace: 'doctorBlock',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      currentViewDoctorBlock: {},
      isEditedAsSingleDoctorBlock: false,
      mode: 'single',
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async location => {
        const { pathname } = location
        if (pathname === '/setting/doctorblock') {
          const dateFrom = moment().formatUTC()
          const dateTo = moment()
            .add(6, 'months')
            .endOf('day')
            .formatUTC(false)
          dispatch({
            type: 'query',
            payload: {
              // pagesize: 999,
              lgteql_startDateTime: dateFrom,
              lsteql_endDateTime: dateTo,
            },
          })
        }
      })
    },
    effects: {
      *refresh(_, { call, put }) {
        yield put({
          type: 'query',
        })
      },
      *update({ payload }, { call }) {
        const result = yield call(service.save, payload)
        if (result) {
          notification.success({ message: 'Doctor Block(s) updated' })
          return true
        }
        return false
      },
      *getDoctorBlockDetails({ payload }, { call, put }) {
        const result = yield call(service.query, payload)
        const { status, data } = result
        if (parseInt(status, 10) === 200) {
          yield put({
            type: 'setDoctorBlockView',
            payload: data,
          })
          yield put({
            type: 'setEditType',
            payload: payload.mode,
          })
          return data
        }
        return false
      },
      *copyDoctorBlock({ payload }, { call, put }) {
        const { updateReource, ...other } = payload
        const result = yield call(service.query, other)
        const { status, data } = result
        if (parseInt(status, 10) === 200) {
          const {
            id,
            recurrenceDto,
            doctorBlockRecurrenceFK,
            ...restData
          } = data
          const doctorBlock = data.doctorBlocks[0]
          let doctorBlockUserFk = restData.doctorBlockUserFk
          let start = moment(doctorBlock.startDateTime)
          let end = moment(doctorBlock.endDateTime)
          if (updateReource) {
            const { newStartTime, newEndTime, newResourceId } = updateReource
            start = moment(newStartTime)
            end = moment(newEndTime)
            if (newResourceId) {
              doctorBlockUserFk = newResourceId
            }
          }
          const copyBlock = {
            ...restData,
            doctorBlocks: data.doctorBlocks.map(item => {
              const { id, doctorBlockGroupFK, ...restItem } = item
              return {
                ...restItem,
                startDateTime: start,
                endDateTime: end,
                isEditedAsSingleDoctorBlock: true,
              }
            }),
            doctorBlockUserFk,
            isEnableRecurrence: false,
            isFromCopy: true,
          }
          yield put({
            type: 'getClinicOperationhour',
            payload: {
              apptDate: moment(start)
                .startOf('day')
                .formatUTC(),
            },
          })
          yield put({
            type: 'setDoctorBlockView',
            payload: copyBlock,
          })
          yield put({
            type: 'setEditType',
            payload: payload.mode,
          })
          return true
        }
        return false
      },
      *getClinicOperationhour({ payload }, { call, select, put }) {
        const { apptDate } = payload
        const result = yield call(cohServices.queryList, {
          lsteql_effectiveStartDate: apptDate,
          lgteql_effectiveEndDate: apptDate,
        })
        if (result.status === '200') {
          const clinicSettings = yield select(state => state.clinicSettings)
          const {
            clinicOperationStartTime = '07:00',
            clinicOperationEndTime = '22:00',
          } = clinicSettings.settings
          let clinicOperationhour = {
            clinicOperationStartTime,
            clinicOperationEndTime,
          }
          const list = result.data.data
          if (list.length) {
            const currentDayOfWeek = moment(apptDate).weekday()
            const value = constructObj({
              value: list[0],
              fromSuffix: 'FromOpHour',
              toSuffix: 'ToOpHour',
            })
            const operationHour = value[currentDayOfWeek]
            clinicOperationhour = {
              startTime: operationHour.start || clinicOperationStartTime,
              endTime: operationHour.end || clinicOperationEndTime,
            }
          }
          yield put({
            type: 'updateState',
            payload: {
              clinicOperationhour: {
                startTime: moment(
                  clinicOperationhour.startTime,
                  timeFormat24Hour,
                )
                  .add(-30, 'minute')
                  .format(timeFormat24Hour),
                endTime: moment(clinicOperationhour.endTime, timeFormat24Hour)
                  .add(30, 'minute')
                  .format(timeFormat24Hour),
              },
            },
          })
        }
      },
    },
    reducers: {
      queryOneDone(state, { payload }) {
        return { ...state, currentViewDoctorBlock: payload.data }
      },
      setDoctorBlockView(state, { payload }) {
        return { ...state, currentViewDoctorBlock: payload }
      },
      setEditType(state, { payload }) {
        return { ...state, mode: payload }
      },
    },
  },
})
