// moment
import moment from 'moment'
// medisys model
import { history } from 'umi'
import { createListViewModel } from 'medisys-model'
// common components
import { notification, timeFormat24Hour } from '@/components'
import {
  APPOINTMENT_STATUS,
  CALENDAR_VIEWS,
  CALENDAR_RESOURCE,
} from '@/utils/constants'
import { roundTo } from '@/utils/utils'
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
  constructObj,
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

const calculateDuration = (startTime, endTime) => {
  const hour = endTime.diff(startTime, 'hour')
  const minute = roundTo((endTime.diff(startTime, 'minute') / 60 - hour) * 60)
  return { hour, minute }
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
      calendarView: CALENDAR_VIEWS.DAY,
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
      *initState({ payload }, { all, put }) {
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
      *getActiveBizSessionQueue(_, { put, select }) {
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
      *submit({ payload }, { select, put }) {
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
                calendarResourceFK: o.isDeleted
                  ? o.preCalendarResourceFK
                  : o.calendarResourceFK,
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
              calendarResourceFK: item.calendarResourceFK,
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
                    isUpdatedInSeries: true,
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
                  isUpdatedInSeries: true,
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
        } catch (error) {}
        return false
      },
      *validate({ payload }, { call, put }) {
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
      *refresh(_, { put }) {
        yield put({ type: 'navigateCalendar', payload: {} })
      },
      *getAppointmentDetails({ payload }, { call, put }) {
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
          return data
        }
        return false
      },
      *copyAppointment({ payload }, { call, put, select }) {
        const { updateReource, ...other } = payload
        const result = yield call(service.query, other)
        const { status, data } = result
        if (parseInt(status, 10) === 200) {
          const { id, recurrenceDto, recurrenceFK, ...restData } = data
          let appointmentDate = moment()
            .startOf('day')
            .formatUTC()
          let apptResources = [...data.appointments[0].appointments_Resources]
          if (updateReource) {
            const codetable = yield select(st => st.codetable)
            const { ctcalendarresource = [] } = codetable
            const {
              updateApptResourceId,
              newStartTime,
              newEndTime,
              newResourceId,
              view,
            } = updateReource

            appointmentDate = moment(newStartTime)
              .startOf('day')
              .formatUTC()
            let updateResource = apptResources.find(
              r => r.id === updateApptResourceId,
            )

            if (view !== CALENDAR_VIEWS.MONTH) {
              const startTime = moment(newStartTime, timeFormat24Hour)
              const endTime = moment(newEndTime, timeFormat24Hour)
              const { hour, minute } = calculateDuration(startTime, endTime)
              updateResource.startTime = startTime.format(timeFormat24Hour)
              updateResource.endTime = endTime.format(timeFormat24Hour)
              updateResource.apptDurationHour = hour
              updateResource.apptDurationMinute = minute
            }
            if (newResourceId) {
              const source = ctcalendarresource.find(
                source => source.id === newResourceId,
              )
              if (source.resourceType === CALENDAR_RESOURCE.RESOURCE) {
                updateResource.isPrimaryClinician = false
              } else if (
                !apptResources.find(
                  r => r.id !== updateApptResourceId && r.isPrimaryClinician,
                )
              ) {
                updateResource.isPrimaryClinician = true
              }
              updateResource.calendarResourceFK = newResourceId
              updateResource.calendarResource = { ...source }
            }
          }
          const copyAppt = {
            ...restData,
            appointments: data.appointments.map(item => {
              const { id, appointmentGroupFK, ...restApptData } = item
              return {
                ...restApptData,
                appointmentDate: appointmentDate,
                appointmentStatusFk: APPOINTMENT_STATUS.DRAFT, //undefined is new, will updated to Darft
                isEditedAsSingleAppointment: false,
                appointmentPreOrderItem: [],
                appointments_Resources: [
                  ...apptResources.map((res, index) => {
                    const { id, appointmentFK, ...restResourceData } = res
                    return {
                      id: -1 * (index + 1),
                      ...restResourceData,
                    }
                  }),
                ],
              }
            }),
            bookedByUserFk: payload.bookedByUserFk,
            isEnableRecurrence: false,
            isFromCopy: true,
          }
          yield put({
            type: 'getClinicOperationhour',
            payload: { apptDate: appointmentDate },
          })
          yield put({
            type: 'setViewAppointment',
            data: copyAppt,
          })
          yield put({
            type: 'setEditType',
            payload: payload.mode,
          })
          yield put({
            type: 'cachePayload',
            payload,
          })
          return copyAppt
        }
        return false
      },
      *getCalendarList({ payload }, { call, put }) {
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
      *getClinicBreakHourList(_, { call, put }) {
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
      *getClinicOperationHourList(_, { call, put }) {
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
      *getPublicHolidayList({ payload }, { call, put }) {
        const result = yield call(phServices.queryList, {
          isActive: true,
          lgteql_endDate: payload.start,
          pagesize: 999,
        })

        if (result.status === '200') {
          yield put({
            type: 'savePublicHolidays',
            payload: result.data.data,
          })
        }
      },
      *insertAppointment({ payload }, { call, put }) {
        const result = yield call(service.insert, payload)
        if (result) {
          yield put({ type: 'refresh' })
          notification.success({ message: 'Appointment created' })
          return true
        }
        return false
      },
      *saveAppointment({ payload }, { call, put }) {
        const result = yield call(service.save, payload)
        if (result) {
          yield put({ type: 'refresh' })
          notification.success({ message: 'Appointment(s) updated' })
          return true
        }
        return false
      },

      *rescheduleAppointment({ payload }, { call, put }) {
        const result = yield call(service.reschedule, payload)
        if (result) {
          yield put({ type: 'refresh' })
          notification.success({ message: 'Appointment(s) updated' })
          return true
        }
        return false
      },
      *deleteDraft({ payload, callback }, { call, put }) {
        const result = yield call(service.deleteDraft, payload)
        if (result === 204) notification.success({ message: 'Deleted' })
        yield put({ type: 'refresh' })
        callback && callback()
      },
      *cancelAppointment({ payload }, { call, put }) {
        const result = yield call(service.cancel, payload)
        if (result && result.status === '200') {
          notification.success({ message: 'Appointment(s) cancelled' })
          yield put({ type: 'refresh' })
          return true
        }
        return false
      },
      *navigateCalendar({ payload }, { all, select, put }) {
        const calendarState = yield select(state => state.calendar)
        const {
          filters: { filterByApptType = [] },
        } = yield select(state => state.appointment)
        const { date, view, doctor = [] } = payload
        const targetDate =
          date !== undefined ? date : calendarState.currentViewDate
        const targetView =
          view !== undefined ? view : calendarState.calendarView
        if (date) {
          yield put({
            type: 'setCurrentViewDate',
            payload: targetDate,
          })
        }
        let start
        let end
        let isDayView = false
        let calendarView = 'month'

        if (targetView === CALENDAR_VIEWS.WEEK) calendarView = 'week'
        if (targetView === CALENDAR_VIEWS.DAY) {
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
          doctor: doctor.join(),
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
          dob: null,
          appType: filterByApptType.join(),
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
      *updateAppointmentLinking({ payload }, { call, put }) {
        const response = yield call(service.updateLinking, payload)
        return response
      },
      *filterCalendar({ payload }, { all, select, put }) {
        const calendarState = yield select(state => state.calendar)
        const { search, dob, doctor = [], appType = [] } = payload
        const {
          currentViewDate: targetDate,
          calendarView: targetView,
        } = calendarState

        let start
        let end
        let calendarView = 'month'

        if (targetView === CALENDAR_VIEWS.WEEK) calendarView = 'week'
        if (targetView === CALENDAR_VIEWS.DAY) calendarView = 'day'

        start = moment(targetDate)
          .startOf(calendarView)
          .formatUTC()
        end = moment(targetDate)
          .endOf(calendarView)
          .endOf('day')
          .formatUTC(false)
        const getCalendarListPayload = {
          searchValue: search,
          doctor: doctor.join(),
          appType:
            appType.length == 0 || appType.indexOf(-99) > -1
              ? null
              : appType.join(),
          apptDateFrom: start,
          apptDateTo: end,
          appStatus: [
            APPOINTMENT_STATUS.CONFIRMED,
            APPOINTMENT_STATUS.DRAFT,
            APPOINTMENT_STATUS.TURNEDUP,
            APPOINTMENT_STATUS.RESCHEDULED,
            APPOINTMENT_STATUS.PFA_RESCHEDULED,
            APPOINTMENT_STATUS.PFA_CANCELLED,
            APPOINTMENT_STATUS.TURNEDUPLATE,
            APPOINTMENT_STATUS.PFA_NOSHOW,
          ].join(),
          dob: dob,
        }

        yield all([
          put({ type: 'getCalendarList', payload: getCalendarListPayload }),
          put({
            type: 'doctorBlock/query',
            payload: {
              lgteql_startDateTime: start,
            },
          }),
          put({
            type: 'appointment/updateState',
            payload: {
              filters: {
                filterByDoctor: doctor,
                filterByApptType: appType,
              },
            },
          }),
        ])
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
      saveConflict(state, { payload }) {
        return { ...state, conflicts: payload.conflicts }
      },
      cachePayload(state, { payload }) {
        return { ...state, cachedPayload: payload }
      },
      setEditType(state, { payload }) {
        return { ...state, mode: payload }
      },
      setCurrentViewDate(state, { payload }) {
        return { ...state, currentViewDate: payload }
      },
      setViewAppointment(state, { data }) {
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
              preCalendarResourceFK: m.calendarResourceFK,
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
      setCalendarView(state, { payload }) {
        return { ...state, calendarView: payload }
      },
      savePublicHolidays(state, { payload }) {
        return {
          ...state,
          publicHolidayList: [...payload],
        }
      },
      saveClinicBreakHours(state, { payload }) {
        const breakHour = mapBreakHour(payload)
        return {
          ...state,
          clinicBreakHourList: breakHour,
        }
      },
      saveClinicOperationHours(state, { payload }) {
        const operationHour = mapOperationHour(payload)
        return {
          ...state,
          clinicOperationHourList: operationHour,
        }
      },
    },
  },
})
