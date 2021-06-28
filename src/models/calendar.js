// big calendar
import BigCalendar from 'react-big-calendar'
// moment
import moment from 'moment'
// medisys model
import { history } from 'umi'
import { createListViewModel } from 'medisys-model'
// common components
import { notification } from '@/components'
import { APPOINTMENT_STATUS } from '@/utils/constants'
import * as service from '@/services/calendar'
import phServices from '@/pages/Setting/PublicHoliday/services'
import cbServices from '@/pages/Setting/ClinicBreakHour/services'
import cohServices from '@/pages/Setting/ClinicOperationHour/services'
// utils
import {
  generateRecurringAppointments,
  filterRecurrenceDto,
  mapDatagridToAppointmentResources,
  compareDto,
} from '@/pages/Reception/Appointment/components/form/formUtils'
import {
  constructClinicBreakHoursData,
  mapOperationHour,
  mapBreakHour,
  isSavePayloadOk,
} from '@/pages/Reception/Appointment/utils'
import { getTimeObject, compare } from '@/utils/yup'

const ACTION_KEYS = {
  insert: 'insertAppointment',
  save: 'saveAppointment',
  reschedule: 'rescheduleAppointment',
  delete: 'deleteDraft',
}

const sortDataGrid = (a, b) => {
  const start = getTimeObject(a.startTime)
  const end = getTimeObject(b.startTime)
  const aLessThanB = compare(start, end)
  if (aLessThanB) return -1
  if (!aLessThanB) return 1
  return 0
}

const updateApptResources = oldResources => (
  currentResources,
  apptResource,
) => {
  const old = oldResources.find(
    oldItem => oldItem.sortOrder === apptResource.sortOrder,
  )
  if (old === undefined)
    return [...currentResources, { ...apptResource, isDeleted: true }]

  return [
    ...currentResources,
    {
      ...apptResource,
      ...old,
    },
  ]
}

export default createListViewModel({
  namespace: 'calendar',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      list: [],
      conflicts: [],
      calendarEvents: [],
      currentViewDate: new Date(),
      currentViewAppointment: {
        appointments: [],
      },
      calendarView: BigCalendar.Views.DAY,
      publicHolidayList: [],
      clinicBreakHourList: {},
      clinicOperationHourList: {},
      isEditedAsSingleAppointment: false,
      mode: 'single',
    },
    subscriptions: ({ dispatch }) => {
      history.listen(location => {
        const { pathname } = location
        const allowedPaths = ['/reception/appointment']

        if (allowedPaths.includes(pathname)) {
          dispatch({
            type: 'getActiveBizSessionQueue',
          })
        }
      })
    },
    effects: {
      *initState ({ payload }, { all, put }) {
        yield all([
          put({ type: 'getPublicHolidayList', payload }),
          put({ type: 'getClinicBreakHourList', payload }),
          put({ type: 'getClinicOperationHourList', payload }),
          put({
            type: 'patient/updateState',
            payload: { entity: null, conflicts: [] },
          }),
        ])
      },
      *getActiveBizSessionQueue (_, { put, select }) {
        const queueLog = yield select(state => state.queueLog)
        const { sessionInfo } = queueLog
        if (sessionInfo.id === '') {
          // initialize biz session
          yield put({
            type: 'queueLog/getSessionInfo',
            payload: { shouldGetTodayAppointments: false },
          })
        }
      },
      *submit ({ payload }, { select, put }) {
        const calendarState = yield select(state => state.calendar)
        // const { ltsppointmentstatus } = yield select((state) => state.codetable)
        try {
          const {
            validate,
            formikValues,
            datagrid = [],
            newAppointmentStatusFK,
          } = payload
          const {
            currentAppointment: formikCurrentAppointment,
            appointments: formikAppointments,
            recurrenceDto,
            overwriteEntireSeries,
            rescheduleReason,
            rescheduledByFK,
            ...restFormikValues
          } = formikValues

          const isEdit = formikValues.id !== undefined
          let isRecurrenceChanged =
            formikValues.isEnableRecurrence &&
            compareDto(
              recurrenceDto,
              calendarState.currentViewAppointment.recurrenceDto || {},
            )

          const appointmentResources = datagrid
            // .filter((item) => item.id > 0 && !item.isDeleted)
            .map(mapDatagridToAppointmentResources(isRecurrenceChanged))
            .sort(sortDataGrid)
            .map((item, index) => ({
              ...item,
              sortOrder: index,
            }))
          const currentAppointment = {
            ...formikCurrentAppointment,
            isEditedAsSingleAppointment: !isEdit
              ? false
              : calendarState.mode === 'single',
            appointmentStatusFk: newAppointmentStatusFK,
            appointments_Resources: appointmentResources.map(o => {
              return {
                ...o,
                clinicianFK: o.isDeleted ? o.preClinicianFK : o.clinicianFK,
              }
            }),
            rescheduleReason,
            rescheduledByFK,
          }

          const shouldGenerateRecurrence = !isEdit

          let appointments = []

          if (shouldGenerateRecurrence) {
            appointments = generateRecurringAppointments(
              recurrenceDto,
              currentAppointment,
              formikValues.isEnableRecurrence,
              isRecurrenceChanged,
            )
          } else if (calendarState.mode === 'single') {
            appointments = [currentAppointment]
          } else {
            /*
              update all other recurrences
              - appointmentStatusFK
              - appointmentRemarks
              - appointmentsResources
            */
            const newResources = appointmentResources.filter(item => item.isNew)
            const oldResources = appointmentResources.filter(
              item => !item.isNew,
            )

            const updatedOldResources = oldResources.map(item => ({
              clinicianFK: item.clinicianFK,
              appointmentTypeFK: item.appointmentTypeFK,
              startTime: item.startTime,
              endTime: item.endTime,
              roomFk: item.roomFk,
              isPrimaryClinician: item.isPrimaryClinician,
              sortOrder: item.sortOrder,
            }))

            appointments = formikValues.appointments.reduce((updated, appt) => {
              if (overwriteEntireSeries) {
                return [
                  ...updated,
                  {
                    ...appt,
                    rescheduleReason,
                    rescheduledByFK,
                    appointmentStatusFk: newAppointmentStatusFK,
                    appointmentRemarks: currentAppointment.appointmentRemarks,
                    appointments_Resources: [
                      ...newResources,
                      ...appt.appointments_Resources.reduce(
                        updateApptResources(updatedOldResources),
                        [],
                      ),
                    ]
                      .sort(sortDataGrid)
                      .map((item, index) => ({
                        ...item,
                        sortOrder: index,
                      })),
                  },
                ]
              }

              if (appt.isEditedAsSingleAppointment) return [...updated, appt]

              return [
                ...updated,
                {
                  ...appt,
                  rescheduleReason,
                  rescheduledByFK,
                  appointmentStatusFk: newAppointmentStatusFK,
                  appointmentRemarks: currentAppointment.appointmentRemarks,
                  appointments_Resources: [
                    ...newResources,
                    ...appt.appointments_Resources.reduce(
                      updateApptResources(updatedOldResources),
                      [],
                    ),
                  ]
                    .sort(sortDataGrid)
                    .map((item, index) => ({
                      ...item,
                      sortOrder: index,
                    })),
                },
              ]
            }, [])
          }

          // const cancelRecurrence =
          //   formikValues.isEnableRecurrence === false &&
          //   calendarState.currentViewAppointment.isEnableRecurrence === true
          // if (cancelRecurrence) {
          //   isRecurrenceChanged = true
          //   appointments = appointments.map(
          //     (appt) =>
          //       appt.id === currentAppointment.id
          //         ? { ...appt }
          //         : { ...appt, isDeleted: true },
          //   )
          // }

          const recurrence = formikValues.isEnableRecurrence
            ? filterRecurrenceDto(recurrenceDto)
            : null

          let actionKey = ACTION_KEYS.insert
          if (isEdit) actionKey = ACTION_KEYS.save
          if (newAppointmentStatusFK === 5) actionKey = ACTION_KEYS.reschedule
          let savePayload = {
            ...restFormikValues,
            appointments,
            recurrenceDto: recurrence,
          }
          if (validate) {
            return yield put({
              type: 'validate',
              payload: savePayload,
            })
            // return false
          }
          if (isEdit) {
            savePayload = {
              recurrenceChanged: isRecurrenceChanged,
              overwriteEntireSeries,
              editSingleAppointment: calendarState.mode === 'single',
              appointmentGroupDto: {
                ...restFormikValues,
                appointments,
                recurrenceDto: recurrence,
              },
            }
          }

          return yield put({
            type: actionKey,
            payload: savePayload,
          })
        } catch (error) {
          console.log({ error })
        }
        return false
      },
      *validate ({ payload }, { call, put }) {
        const result = yield call(service.validate, payload)
        const { status, data } = result

        if (parseInt(status, 10) === 200) {
          // yield put({
          //   type: 'saveConflict',
          //   payload: {
          //     conflicts: data.resourceConflict,
          //   },
          // })
          return data.resourceConflict
        }
        return null
      },
      *refresh (_, { put }) {
        yield put({ type: 'navigateCalendar', payload: {} })
      },
      *getAppointmentDetails ({ payload }, { call, put }) {
        const result = yield call(service.query, payload)
        const { status, data } = result
        if (parseInt(status, 10) === 200) {
          yield put({
            type: 'setViewAppointment',
            data,
          })
          yield put({
            type: 'setEditType',
            payload: payload.mode,
          })
          yield put({
            type: 'cachePayload',
            payload,
          })
          return true
        }
        return false
      },
      *getCalendarList ({ payload }, { call, put }) {
        const result = yield call(service.queryList, {
          apiCriteria: {
            ...payload,
            isCancelled: false,
          },
        })
        const { status, data } = result
        if (status === '200' && data.data) {
          yield put({
            type: 'updateState',
            payload: {
              list: data.data,
            },
          })
        }
      },
      *getClinicBreakHourList (_, { call, put }) {
        const result = yield call(cbServices.queryList, {
          isActive: true,
          pagesize: 999,
        })

        if (result.status === '200') {
          const { data } = result

          yield put({
            type: 'saveClinicBreakHours',
            payload: data.data,
          })
        }
      },
      *getClinicOperationHourList (_, { call, put }) {
        const result = yield call(cohServices.queryList, {
          isActive: true,
          pagesize: 999,
        })

        if (result.status === '200') {
          yield put({
            type: 'saveClinicOperationHours',
            payload: result.data.data,
          })
        }
      },
      *getPublicHolidayList ({ payload }, { call, put }) {
        const result = yield call(phServices.queryList, {
          isActive: true,
          lgteql_startDate: payload.start,
          pagesize: 999,
        })

        if (result.status === '200') {
          yield put({
            type: 'savePublicHolidays',
            payload: result.data.data,
          })
        }
      },
      *insertAppointment ({ payload }, { call, put }) {
        const result = yield call(service.insert, payload)
        if (result) {
          yield put({ type: 'refresh' })
          notification.success({ message: 'Appointment created' })
          return true
        }
        return false
      },
      *saveAppointment ({ payload }, { call, put }) {
        const result = yield call(service.save, payload)
        if (result) {
          yield put({ type: 'refresh' })
          notification.success({ message: 'Appointment(s) updated' })
          return true
        }
        return false
      },

      *rescheduleAppointment ({ payload }, { call, put }) {
        const result = yield call(service.reschedule, payload)
        if (result) {
          yield put({ type: 'refresh' })
          notification.success({ message: 'Appointment(s) updated' })
          return true
        }
        return false
      },
      *deleteDraft ({ payload, callback }, { call, put }) {
        const result = yield call(service.deleteDraft, payload)
        if (result === 204) notification.success({ message: 'Deleted' })
        yield put({ type: 'refresh' })
        callback && callback()
      },
      *cancelAppointment ({ payload }, { call, put }) {
        const result = yield call(service.cancel, payload)
        if (result && result.status === '200') {
          notification.success({ message: 'Appointment(s) cancelled' })
          yield put({ type: 'refresh' })
          return true
        }
        return false
      },
      *navigateCalendar ({ payload }, { all, select, put }) {
        const calendarState = yield select(state => state.calendar)
        const { date, view } = payload
        const targetDate =
          date !== undefined ? date : calendarState.currentViewDate
        const targetView =
          view !== undefined ? view : calendarState.calendarView
        yield put({
          type: 'setCurrentViewDate',
          payload: targetDate,
        })
        let start
        let end
        let isDayView = false
        let calendarView = 'month'

        if (targetView === BigCalendar.Views.WEEK) calendarView = 'week'
        if (targetView === BigCalendar.Views.DAY) {
          isDayView = true
          calendarView = 'day'
        }

        start = moment(targetDate)
          .startOf(calendarView)
          .formatUTC()
        end = moment(targetDate)
          .endOf(calendarView)
          .endOf('day')
          .formatUTC(false)
        const getCalendarListPayload = {
          apptDateFrom: start,
          apptDateTo: end,
          appStatus: [
            APPOINTMENT_STATUS.CONFIRMED,
            APPOINTMENT_STATUS.DRAFT,
            // APPOINTMENT_STATUS.CANCELLED,
            APPOINTMENT_STATUS.TURNEDUP,
            APPOINTMENT_STATUS.RESCHEDULED,
            APPOINTMENT_STATUS.PFA_RESCHEDULED,
            APPOINTMENT_STATUS.PFA_CANCELLED,
            APPOINTMENT_STATUS.TURNEDUPLATE,
            APPOINTMENT_STATUS.PFA_NOSHOW,
          ].join(),
        }
        // const getCalendarListPayload = {
        //   apptDateFrom: start,
        //   apptDateTo: end,
        // }

        yield all([
          put({ type: 'getCalendarList', payload: getCalendarListPayload }),
          put({
            type: 'doctorBlock/query',
            payload: {
              lgteql_startDateTime: start,
            },
          }),
        ])
      },
      *updateAppointmentLinking ({ payload }, { call, put }) {
        const response = yield call(service.updateLinking, payload)
        return response
      },
      *pasteAppointment ({ payload }, { call, put }) {
        const result = yield call(service.pasteAppointment, payload)
        if (result) {
          notification.success({ message: 'Appointment pasted' })
          return true
        }
        return false
      },
    },
    reducers: {
      saveConflict (state, { payload }) {
        return { ...state, conflicts: payload.conflicts }
      },
      cachePayload (state, { payload }) {
        return { ...state, cachedPayload: payload }
      },
      setEditType (state, { payload }) {
        return { ...state, mode: payload }
      },
      setCurrentViewDate (state, { payload }) {
        return { ...state, currentViewDate: payload }
      },
      setViewAppointment (state, { data }) {
        const { appointments = [] } = data

        let newAppointments = appointments.map(o => {
          const { appointments_Resources = [] } = o
          let newRes = appointments_Resources.map(m => {
            const { startTime = '', endTime = '' } = m
            const startMoment = moment(
              `${moment().format('YYYY MM DD')} ${startTime}`,
            )
            const endMoment = moment(
              `${moment().format('YYYY MM DD')} ${endTime}`,
            )

            let difMinute = endMoment.diff(startMoment, 'minutes')
            const difH = parseInt(difMinute / 60, 10)
            const difM = difMinute % 60

            return {
              ...m,
              apptDurationHour: difH,
              apptDurationMinute: difM,
              preClinicianFK: m.clinicianFK,
            }
          })
          return {
            ...o,
            appointments_Resources: newRes,
          }
        })
        return {
          ...state,
          currentViewAppointment: { ...data, appointments: newAppointments },
        }
      },
      setCalendarView (state, { payload }) {
        return { ...state, calendarView: payload }
      },
      savePublicHolidays (state, { payload }) {
        return {
          ...state,
          publicHolidayList: [...payload],
        }
      },
      saveClinicBreakHours (state, { payload }) {
        const breakHour = mapBreakHour(payload)
        return {
          ...state,
          clinicBreakHourList: breakHour,
        }
      },
      saveClinicOperationHours (state, { payload }) {
        const operationHour = mapOperationHour(payload)
        return {
          ...state,
          clinicOperationHourList: operationHour,
        }
      },
    },
  },
})
