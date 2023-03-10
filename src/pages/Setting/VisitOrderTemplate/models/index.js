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
      selectedExistEntity: {
        rows: [],
      },
    },
    effects: {
      *queryAll({ payload }, { call, put }) {
        let allVisitPurpose = yield call(service.querySimple, {})
        return allVisitPurpose
      },
      *generateExistingFormEntity({ payload }, { select, call, put }) {
        let data = yield call(service.query, { id: payload.id })
        yield put({
          type: 'queryOneDone',
          payload: {
            data: data.data,
            isFromExisting: true,
          },
        })
      },
    },
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
      queryOneDone(st, { payload, payload: { isFromExisting = false } }) {
        const {
          effectiveStartDate,
          effectiveEndDate,
          visitOrderTemplateItemDtos,
          visitOrderTemplate_Resources,
          visitOrderTemplate_Copayers,
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
              if (isFromExisting) {
                delete item.id
                delete item.visitOrderTemplateFK
                delete item.visitOrderTemplateMedicationItemDto?.id
                delete item.visitOrderTemplateMedicationItemDto
                  ?.visitOrderTemplateItemFK
                delete item.visitOrderTemplateConsumableItemDto?.id
                delete item.visitOrderTemplateConsumableItemDto
                  ?.visitOrderTemplateItemFK
                delete item.visitOrderTemplateServiceItemDto?.id
                delete item.visitOrderTemplateServiceItemDto
                  ?.visitOrderTemplateItemFK
                delete item.visitOrderTemplateVaccinationItemDto?.id
                delete item.visitOrderTemplateVaccinationItemDto
                  ?.visitOrderTemplateItemFK
              }
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
          entity:
            isFromExisting === false
              ? {
                  ...restValues,
                  visitOrderTemplate_Resources,
                  visitOrderTemplate_Copayers,
                  rows: _.sortBy(itemTypesRows, 'sortOrder'),
                  effectiveDates: [effectiveStartDate, effectiveEndDate],
                }
              : undefined,
          selectedExistEntity: isFromExisting && {
            effectiveDates: [
              moment().formatUTC(),
              moment('2099-12-31T23:59:59').formatUTC(false),
            ],
            rows: _.sortBy(itemTypesRows, 'sortOrder'),
            visitOrderTemplate_Resources: visitOrderTemplate_Resources.map(
              item => {
                delete item.id
                delete item.visitOrderTemplateFK
                return item
              },
            ),
            visitOrderTemplate_Copayers: visitOrderTemplate_Copayers.map(
              item => {
                delete item.id
                delete item.visitOrderTemplateFK
                return item
              },
            ),
          },
          isFromExisting,
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
