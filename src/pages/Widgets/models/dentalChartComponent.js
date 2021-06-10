import { createFormViewModel } from 'medisys-model'
import moment from 'moment'
import _ from 'lodash'
import { dateFormatLong } from '@/components'
import service from '../DentalChart/services'

const updateData = (data, payload) => {
  const {
    toothNo,
    id,
    action,
    target,
    forceSelect,
    name,
    subTarget,
    deleted,
    remark,
  } = payload
  const exist = data.find(
    o =>
      o.toothNo === toothNo &&
      o.id === id &&
      target === o.target &&
      o.subTarget === subTarget &&
      o.name === name,
  )
  if (action.code === 'SYS01') return _.reject(data, o => o.toothNo === toothNo)

  if (deleted) {
    return _.reject(data, o => o.toothNo === toothNo && o.id === id)
  }
  if (exist) {
    if (remark) {
      exist.remark = payload.remark
    } else if (
      data.find(
        o =>
          o.toothNo === toothNo &&
          o.target === target &&
          o.subTarget === subTarget &&
          o.timestamp > exist.timestamp,
      ) ||
      forceSelect
    ) {
      exist.timestamp = Date.now()
    } else {
      data = _.reject(
        data,
        o =>
          o.toothNo === toothNo &&
          o.id === id &&
          target === o.target &&
          o.subTarget === subTarget &&
          o.name === name,
      )
    }
    // exist.timestamp = Date.now()
    // exist.hide = !exist.hide
  } else {
    // data = _.reject(
    //   data,
    //   (o) =>
    //     o.id !== id && o.toothNo === toothNo && target === o.target,
    // )
    data.push({
      remark: '',
      ...payload,
      timestamp: Date.now(),
      date: moment().format(dateFormatLong),
      key: payload.id + payload.target,
      // id: getUniqueId(),
    })
  }

  return data
}
export default createFormViewModel({
  namespace: 'dentalChartComponent',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      mode: 'diagnosis',
      data: [],
    },
    subscriptions: ({ dispatch, history }) => {},
    effects: {},
    reducers: {
      clean(state, { payload }) {
        let data = _.cloneDeep(state.data)

        return {
          ...state,
          data: _.reject(data, o => o.toothNo === payload.toothNo),
        }
      },

      toggleMultiSelect(state, { payload = [] }) {
        let data = _.cloneDeep(state.data)
        payload.map(o => {
          data = updateData(data, o)
        })

        return {
          ...state,
          data,
        }
      },
      toggleSelect(state, { payload }) {
        // console.log(payload)
        const data = updateData(_.cloneDeep(state.data), payload)
        const selected = data.find(o => o.key === payload.id + payload.target)
        // console.log(selected)
        return {
          ...state,
          data,
          selected,
          lastClicked: selected ? payload.id + payload.target : undefined,
        }
      },
      deleteTreatment(state, { payload }) {
        const { itemNotes, treatmentFK } = payload

        return {
          ...state,
          data: state.data.filter(o => {
            if (!o.action) return false
            if (o.action.dentalTreatmentFK !== treatmentFK) return true

            if (!o.nodes && itemNotes.indexOf(`#${o.toothNo}`) < 0) return true

            if (
              o.nodes &&
              itemNotes.indexOf(`#${o.nodes[0]} - ${o.nodes[1]}`) < 0
            )
              return true

            return false
          }),
        }
      },
      sortItems(state, { payload }) {
        const { index, oldIndex, currentItems, items } = payload
        return {
          ...state,
          data: [
            ...state.data.filter(
              o =>
                (o.toothNo === Number(index) && o.key !== items[oldIndex]) ||
                o.toothNo !== Number(index),
            ),
            ...currentItems,
          ],
        }
      },
    },
  },
})
