import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import _ from 'lodash'
import { visitOrderTemplateItemTypes } from '@/utils/codes'
import { getUniqueId } from '@/utils/utils'
import service from '../services'

export default createListViewModel({
  namespace: 'settingVisitOrderTemplate',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      default: {
        isUserMaintainable: true,
        effectiveDates: [
          moment().formatUTC(),
          moment('2099-12-31T23:59:59').formatUTC(false),
        ],
        description: '',
        rows: [],
      },
    },
    effects: {},
    reducers: {
      reset(st) {
        return {
          ...st,
          default: {
            ...st.default,
            rows: [],
          },
        }
      },
      queryOneDone(st, { payload }) {
        const {
          effectiveStartDate,
          effectiveEndDate,
          visitOrderTemplateItemDtos,
          ...restValues
        } = payload.data

        let itemTypesRows = []
        visitOrderTemplateItemTypes.forEach(type => {
          const currentTypeItems = visitOrderTemplateItemDtos.filter(
            itemType => itemType.inventoryItemTypeFK === type.id,
          )
          itemTypesRows = [
            ...itemTypesRows,
            ...currentTypeItems.map(item => {
              return {
                uid: getUniqueId(),
                type: item.inventoryItemTypeFK,
                itemFK: item[type.dtoName][type.itemFKName],
                name: item.inventoryItemName,
                code: item.inventoryItemCode,
                isActive: item[type.dtoName].isActive,
                isMinus:
                  item.adjAmt == 0 ? true : !!(item.adjAmt && item.adjAmt < 0),
                isExactAmount: !!(
                  item.adjType && item.adjType === 'ExactAmount'
                ),
                ...item,
              }
            }),
          ]
        })

        return {
          ...st,
          entity: {
            ...restValues,
            rows: _.sortBy(itemTypesRows, 'sortOrder'),
            effectiveDates: [effectiveStartDate, effectiveEndDate],
          },
        }
      },
      queryDone(st, { payload }) {
        const { data } = payload

        return {
          ...st,
          list: data.data.map(o => {
            return {
              ...o,
              effectiveDates: [o.effectiveStartDate, o.effectiveEndDate],
            }
          }),
        }
      },
    },
  },
})
