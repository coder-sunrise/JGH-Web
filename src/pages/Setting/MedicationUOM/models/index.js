import { createListViewModel } from 'medisys-model'
import moment from 'moment'
import service from '../services'
import { getTranslationValue } from '@/utils/utils'

export default createListViewModel({
  namespace: 'settingMedicationUOM',
  config: {
    codetable: {
      message: 'Medication UOM updated',
      code: 'ctmedicationunitofmeasurement',
    },
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
      },
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
      })
    },

  },
})
