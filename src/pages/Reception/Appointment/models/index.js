import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import { timeFormat } from '@/components'
import { getUniqueId } from '@/utils/utils'
import * as service from '../services'

const calculateDuration = (startTime, endTime) => {
  const duration = moment.duration(
    moment(endTime, timeFormat).diff(moment(startTime, timeFormat)),
  )
  const hours = parseInt(duration.asHours(), 10)
  const mins = parseInt(duration.asMinutes(), 10) - hours * 60

  let string = ''
  if (hours > 0) {
    string = hours > 1 ? `${hours} HRS` : `${hours} HR `
    string += ' '
    if (mins > 0) {
      string += mins > 1 ? ` ${mins} MINS` : `${mins} MIN`
    }
  } else if (mins > 0) {
    string = mins > 1 ? ` ${mins} MINS` : `${mins} MIN`
  }

  if (hours === 0 && mins === 0) string = '0 MIN'
  return string
}
const splitApptResource = (data) => {
  let formattedList = []
  for (let i = 0; i < data.length; i++) {
    const { appointment_Resources, ...restValues } = data[i]
    const currentPatientAppts = appointment_Resources.map((appt, idx) => {
      const {
        roomFk,
        startTime,
        endTime,
        appointmentFK,
        clinicianName,
        clinicianTitle,
      } = appt

      const commonValues = {
        ...restValues,
        uid: getUniqueId(),
        id: appt.id,
        roomFk,
        appointmentFK,
        apptTime: startTime,
        doctor: `${clinicianTitle || ''} ${clinicianName}`,
        duration: calculateDuration(startTime, endTime),
        patientName: `${restValues.salutation || ''} ${restValues.patientName}`,
      }

      if (idx === 0) {
        return {
          ...commonValues,
          countNumber: 1,
          rowspan: appointment_Resources.length,
        }
      }
      return {
        ...commonValues,
        countNumber: 0,
        rowspan: 0,
      }
    })

    formattedList = [
      ...formattedList,
      ...currentPatientAppts,
    ]
  }
  return formattedList
}

export default createListViewModel({
  namespace: 'appointment',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      filterTemplates: [],
    },
    effects: {
      *saveFilterTemplate ({ payload }, { call, put, select }) {
        const user = yield select((st) => st.user)
        const r = yield call(service.saveFilterTemplate, user.data.id, {
          userPreferenceDetails: JSON.stringify(payload),
        })

        if (r === 204) return true

        return false
      },
      *getFilterTemplate ({ payload }, { call, put }) {
        const r = yield call(service.getFilterTemplate, payload)
        const { status, data } = r

        if (status === '200') {
          yield put({
            type: 'setFilterTemplate',
            payload: {
              data,
            },
          })
        }
        return false
      },
    },
    reducers: {
      queryOneDone (st, { payload }) {
        const { data } = payload
        data.effectiveDates = [
          data.effectiveStartDate,
          data.effectiveEndDate,
        ]
        return {
          ...st,
          entity: data,
        }
      },
      querySuccess (st, { payload }) {
        console.log('querySuccess', payload)
        const { data, filter = {}, version, keepFilter = true } = payload
        const list = splitApptResource(data) // data.entities ? data.entities : data.data
        const { sorting } = filter
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
        }
      },

      setFilterTemplate (st, { payload }) {
        const { data } = payload

        if (data.userPreferenceDetails) {
          const parsedFilterTemplate = JSON.parse(data.userPreferenceDetails)
          const favFilterTemplate = parsedFilterTemplate.find(
            (template) => template.isFavorite,
          )
          return {
            ...st,
            filterTemplates: parsedFilterTemplate,
            currentFilterTemplate: favFilterTemplate
              ? {
                  ...favFilterTemplate,
                }
              : null,
          }
        }
        return {
          ...st,
        }
      },
      setCurrentFilterTemplate (st, { payload }) {
        const { id } = payload
        const { filterTemplates } = st

        if (id) {
          const { filterByDoctor, filterByApptType } = filterTemplates.find(
            (template) => template.id === id,
          )
          return {
            ...st,
            currentFilterTemplate: {
              filterByDoctor,
              filterByApptType,
            },
          }
        }
        return {
          ...st,
          currentFilterTemplate: null,
        }
      },
    },
  },
})
