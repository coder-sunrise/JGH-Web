import { createFormViewModel } from 'medisys-model'
import humps from 'humps'
import * as service from '../services/clinicSettings'
import { initClinicSettings } from '@/utils/config'

export default createFormViewModel({
  namespace: 'clinicSettings',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      settings: JSON.parse(localStorage.getItem('clinicSettings') || '{}'),
    },
    subscriptions: ({ dispatch, history, searchField }) => {
      history.listen((loct) => {
        const { pathname } = loct
      })
    },

    effects: {},
    reducers: {
      queryDone (state, { payload }) {
        const { data } = payload
        const settings = {}
        let entity = {}
        data.forEach((p) => {
          entity[humps.camelize(p.settingKey)] = {
            ...p,
          }
          const key = humps.camelize(p.settingKey)
          const value = p.settingValue
          switch (p.dataType) {
            case 'Boolean': {
              const booleanValue = value === 'true'
              settings[key] = booleanValue
              break
            }
            case 'Decimal':
            case 'Double': {
              const decimalValue = parseFloat(value / 100)
              const decimalIntValue = parseInt(value, 10)
              settings[key] = decimalValue
              settings[`${key}Int`] = decimalIntValue
              break
            }
            default: {
              settings[key] = value
            }
          }

          settings.concurrencyToken = p.concurrencyToken
        })

        const clinicSettingsSessionData = JSON.stringify(settings)
        localStorage.setItem('clinicSettings', clinicSettingsSessionData)
        initClinicSettings()
        return {
          settings,
          entity,
        }
      },
    },
  },
})
