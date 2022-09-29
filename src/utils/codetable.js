import moment from 'moment'
import _ from 'lodash'
import request, { axiosRequest } from './request'
import { convertToQuery } from './utils'

import db from './indexedDB'

const multiplyCodetable = (data, multiplier) => {
  if (multiplier === 1) return data
  let result = [...data]
  const maxLength = data.length
  for (let i = 1; i <= multiplier; i++) {
    result = [
      ...result,
      ...data.map(item => ({ ...item, id: maxLength * i + item.id })),
    ]
  }
  return result
}

const defaultParams = {
  pagesize: 99999,
  sorting: [{ columnName: 'sortOrder', direction: 'asc' }],
  isActive: true,
  excludeInactiveCodes: true,
}

const defaultCodeTablePath = '/codetable'
const customCodetablePath = new Map([
  [
    'ctcopayer',
    {
      path: defaultCodeTablePath,
    },
  ],
  [
    'copaymentscheme',
    {
      path: defaultCodeTablePath,
    },
  ],
  [
    'inventorymedication',
    {
      path: '/fororder',
    },
  ],
  [
    'clinicianprofile',
    {
      path: '/codetable',
    },
  ],
  [
    'userpreference',
    {
      path: '/api/userprofile/allpreference',
      singlePath: true,
    },
  ],
])

const tenantCodesMap = new Map([
  [
    'doctorprofile',
    {
      ...defaultParams,
      isActive: undefined,
      sorting: [],
    },
  ],
  [
    'clinicianprofile',
    {
      ...defaultParams,
      sorting: [{ columnName: 'name', direction: 'asc' }],
    },
  ],
  [
    'ctappointmenttype',
    {
      ...defaultParams,
    },
  ],
  [
    'ctservice',
    {
      ...defaultParams,
      isActive: undefined,
      'ServiceFKNavigation.isActive': true,
      sorting: [
        { columnName: 'serviceFKNavigation.displayValue', direction: 'asc' },
      ],
    },
  ],
  [
    'ctservicecategory',
    {
      ...defaultParams,
    },
  ],
  [
    'ctdrugallergy',
    {
      ...defaultParams,
    },
  ],
  [
    'inventorymedication',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'inventoryconsumable',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'inventoryvaccination',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'inventoryorderset',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'package',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'role',
    {
      ...defaultParams,
      sorting: [],
      isActive: true,
    },
  ],
  [
    'ctsupplier',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmanufacturer',
    {
      ...defaultParams,
    },
  ],
  [
    'ctpaymentmode',
    {
      ...defaultParams,
    },
  ],
  [
    'smstemplate',
    {
      ...defaultParams,
    },
  ],
  [
    'codetable/ctsnomeddiagnosis',
    {
      ...defaultParams,
    },
  ],
  [
    'documenttemplate',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmedicationfrequency',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmedicationdosage',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmedicationunitofmeasurement',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmedicationusage',
    {
      ...defaultParams,
    },
  ],
  [
    'copaymentscheme',
    {
      ...defaultParams,
    },
  ],
  [
    'ctcopayer',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'ctmedicationprecaution',
    {
      ...defaultParams,
    },
  ],
  [
    'cttreatment',
    {
      ...defaultParams,
      isActive: undefined,
    },
  ],
  [
    'ctchartmethod',
    {
      ...defaultParams,
    },
  ],
  [
    'ctcasedescription',
    {
      ...defaultParams,
    },
  ],
  [
    'cttestpanelitemresultoption',
    {
      ...defaultParams,
    },
  ],
  [
    'ctnumericreferencerange',
    {
      ...defaultParams,
    },
  ],
  [
    'ctinvoiceadjustment',
    {
      ...defaultParams,
    },
  ],
  // [
  //   'ctEyeRefractiontestType',
  //   {
  //     ...defaultParams,
  //   },
  // ],
  [
    'ctprocedure',
    {
      ...defaultParams,
    },
  ],
  [
    'cttag',
    {
      ...defaultParams,
      sorting: [],
      isActive: true,
    },
  ],
  [
    'ctmedicationcontraindication',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmedicationinteraction',
    {
      ...defaultParams,
    },
  ],
  [
    'ctmedicationsideeffect',
    {
      ...defaultParams,
    },
  ],
  [
    'ctgenericmedication',
    {
      ...defaultParams,
    },
  ],
  [
    'ctadministrationroute',
    {
      ...defaultParams,
    },
  ],
  [
    'ctchecklist',
    {
      ...defaultParams,
    },
  ],
  [
    'cttestpanelitem',
    {
      ...defaultParams,
    },
  ],
  [
    'cttestpanel',
    {
      ...defaultParams,
    },
  ],
  [
    'ctcalendarresource',
    {
      pagesize: 99999,
    },
  ],
  [
    'ctexaminationitem',
    {
      ...defaultParams,
    },
  ],
  [
    'ctindividualcomment',
    {
      ...defaultParams,
    },
  ],
  [
    'ctsummarycomment',
    {
      ...defaultParams,
    },
  ],
  [
    'userpreference',
    {
      ...defaultParams,
      sorting: [],
    },
  ],
  [
    'ltclinicalrole',
    {
      pagesize: 99999,
      sorting: [{ columnName: 'sortOrder', direction: 'asc' }],
    },
  ],
  [
    'ctresource',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
  [
    'statementgroup',
    {
      ...defaultParams,
      sorting: [{ columnName: 'displayValue', direction: 'asc' }],
    },
  ],
])

// always get latest codetable
const skipCache = ['doctorprofile', 'clinicianprofile', 'ctcalendarresource']

const noSortOrderProp = ['doctorprofile', 'clinicianprofile', 'role', 'cttag']

const convertExcludeFields = [
  // 'excludeInactiveCodes',
  'temp',
  'refresh',
]

const fetchCodeTable = async (code, params, isReturnStatusCode = false) => {
  let useGeneral = params === undefined || Object.keys(params).length === 0
  const baseURL = '/api/CodeTable'
  // const generalCodetableURL = `${baseURL}?excludeInactiveCodes=true&ctnames=`
  const searchURL = `${baseURL}/search?excludeInactiveCodes=true&ctname=`

  let url = searchURL
  let customPath = ''
  let singlePath = false

  let criteriaForTenantCodes = defaultParams
  if (tenantCodesMap.has(code.toLowerCase())) {
    url = '/api/'
    useGeneral = false
    criteriaForTenantCodes = tenantCodesMap.get(code.toLowerCase())
    if (customCodetablePath.has(code.toLowerCase())) {
      customPath = customCodetablePath.get(code.toLowerCase()).path
      singlePath = customCodetablePath.get(code.toLowerCase()).singlePath
    }
  }

  const newParams = {
    ...defaultParams,
    ...params,
  }
  newParams.sorting = noSortOrderProp.includes(code) ? [] : newParams.sorting
  const body = useGeneral
    ? convertToQuery({ ...newParams }, convertExcludeFields)
    : convertToQuery(
        { ...criteriaForTenantCodes, ...params },
        convertExcludeFields,
      )
  let finalUrl = singlePath ? customPath : `${url}${code}${customPath}`
  const response = await request(finalUrl, {
    method: 'GET',
    body,
  })

  let { status: statusCode, data } = response
  let newData = []
  if (parseInt(statusCode, 10) === 200) {
    newData = [...data.data]
  }

  if (code === 'ctcalendarresource') {
    newData = _.orderBy(
      newData,
      ['resourceType', 'sortOrder', source => source.name.toUpperCase()],
      ['asc'],
    )
  }

  if (code === 'doctorprofile') {
    newData = _.orderBy(
      newData,
      [source => source.clinicianProfile.name.toUpperCase()],
      ['asc'],
    )
  }

  if (isReturnStatusCode === true) {
    return { statusCode, newData }
  }

  return newData
}

const fetchAndSaveCodeTable = async (
  code,
  params,
  refresh = false,
  temp = false,
) => {
  const { statusCode, newData } = await fetchCodeTable(code, params, true)

  if (parseInt(statusCode, 10) === 200) {
    if (skipCache.includes(code)) return newData

    await db.codetable.put({
      code: code.toLowerCase(),
      data: newData,
      updateDate: new Date(), // refresh ? null : new Date(),
      params,
    })
    return newData
  }

  return []
}

const getAllCodes = async () => {
  const lastLoginDate = localStorage.getItem('_lastLogin')
  const parsedLastLoginDate = moment(lastLoginDate)
  await db.open()
  const ct = await db.codetable.toArray(code => {
    const results = code.filter(_i => {
      const { updateDate } = _i
      const parsedUpdateDate =
        updateDate === null ? moment('2001-01-01') : moment(updateDate)
      return parsedUpdateDate.isAfter(parsedLastLoginDate)
    })
    // .map((_i) => ({
    //   code: _i.code,
    //   data: _i.data,
    //   updateDate: _i.updateDate,
    // }))

    const cts = {
      config: {},
    }
    results.forEach(r => {
      const { code: c, data, ...others } = r
      cts[c.toLowerCase()] = data
      cts.config[c.toLowerCase()] = others
    })
    return cts
  })
  return ct || []
}

const getCodes = async payload => {
  let ctcode
  let params
  let multiply = 1
  let _force = false
  let _temp = false

  const { refresh = false } = payload
  if (typeof payload === 'string') ctcode = payload
  if (typeof payload === 'object') {
    ctcode = payload.code
    params = payload.filter
    multiply = payload.multiplier
    _force = payload.force
    _temp = payload.temp || false
  }

  let result = []

  try {
    if (!ctcode) throw Error('ctcode is undefined / null')

    ctcode = ctcode.toLowerCase()
    await db.open()
    const ct = await db.codetable.get(ctcode)

    // const cookies = new Cookies()
    // const lastLoginDate = cookies.get('_lastLogin')
    const lastLoginDate = localStorage.getItem('_lastLogin')
    const parsedLastLoginDate = moment(lastLoginDate)

    /* not exist in current table, make network call to retrieve data */
    if (ct === undefined || refresh || _force) {
      result = fetchAndSaveCodeTable(ctcode, params, multiply, refresh)
    } else {
      /*  compare updateDate with lastLoginDate
          if updateDate > lastLoginDate, do nothing
          if updateDate is null, always perform network call to get latest copy
          else perform network call and update indexedDB
      */
      const { updateDate, data: existedData } = ct
      const parsedUpdateDate =
        updateDate === null ? moment('2001-01-01') : moment(updateDate)
      // console.log('should update', {
      //   ctcode,
      //   updateDate: parsedUpdateDate.format(),
      //   lastLogin: parsedLastLoginDate.format(),
      // })
      result = parsedUpdateDate.isBefore(parsedLastLoginDate)
        ? fetchAndSaveCodeTable(ctcode, params, multiply)
        : existedData
    }
  } catch (error) {
    console.log({ error })
  }
  return result
}

const checkShouldRefresh = async payload => {
  try {
    const { code, filter } = payload

    await db.open()
    const ct = await db.codetable.get(code.toLowerCase())

    if (ct === undefined) return true

    const { updateDate, params } = ct
    if (!_.isEqual(params, filter)) return true

    return updateDate === null
  } catch (error) {
    console.log({ error })
  }
  return false
}

const refreshCodetable = async url => {
  try {
    const paths = url.split('/')
    const code = paths[2]
    window.g_app._store.dispatch({
      type: 'codetable/refreshCodes',
      payload: { code },
    })
  } catch (error) {
    console.log({ error })
  }
}

const checkIsCodetableAPI = url => {
  try {
    const paths = url.split('/')

    // paths.length >= 3 ? tenantCodes.includes(paths[2].toLowerCase()) : false
    const isTenantCodes =
      paths.length >= 3 ? tenantCodesMap.has(paths[2].toLowerCase()) : false

    const isCodetable = paths.length >= 3 ? paths[2].startsWith('ct') : false
    // console.log({ isTenantCodes, isCodetable })
    return isTenantCodes || isCodetable
  } catch (error) {
    console.log({ error })
  }
  return false
}

const getTenantCodes = async tenantCode => {
  // todo: paging
  const response = await request(`/api/${tenantCode}`, { method: 'GET' })
  const { status: statusCode, data } = response
  if (statusCode === '200' || statusCode === 200) {
    return data
  }
  return {}
}

const getServices = data => {
  // eslint-disable-next-line compat/compat
  const services = _.orderBy(
    Object.values(_.groupBy(data, 'serviceId')).map(o => {
      return {
        value: o[0].serviceId,
        code: o[0].code,
        name: o[0].displayValue,
        isAutoDisplayInOrderCart: o[0].isAutoDisplayInOrderCart,
        serviceCategoryFK: o[0].serviceCategoryFK,
        isNurseActualizable: o[0].isNurseActualizable,
        serviceCenters: o.map(m => {
          return {
            value: m.serviceCenterId,
            name: m.serviceCenter,
            unitPrice: m.unitPrice,
            isDefault: m.isDefault,
          }
        }),
        serviceTags: (o[0].serviceTag || []).map(m => {
          return {
            value: m.tagFK,
            name: m.tagDisplayValue,
          }
        }),
        serviceTestCategories: (o[0].serviceTestPanel || []).map(m => {
          return {
            value: m.testCategoryFK,
            name: m.testCategory,
          }
        }),
        isDisplayValueChangable: o[0].isDisplayValueChangable,
      }
    }),
    ['name'],
    ['asc'],
  )
  // eslint-disable-next-line compat/compat
  const serviceCenters = _.orderBy(
    Object.values(_.groupBy(data, 'serviceCenterId')).map(o => {
      return {
        value: o[0].serviceCenterId,
        name: o[0].serviceCenter,
        services: o.map(m => {
          return {
            value: m.serviceId,
            name: m.displayValue,
          }
        }),
      }
    }),
    ['name'],
    ['asc'],
  )

  const serviceCatetorys = _.orderBy(
    Object.values(_.groupBy(data, 'serviceCategoryFK')).map(o => {
      return {
        value: o[0].serviceCategoryFK,
        name: o[0].serviceCategory,
      }
    }),
    ['name'],
    ['asc'],
  )

  serviceCatetorys.forEach(category => {
    const items = data.filter(x => x.serviceCategoryFK === category.value)
    let newServiceTags = []
    items.forEach(service => {
      ;(service.serviceTag || []).forEach(tag => {
        newServiceTags = newServiceTags.concat({
          value: tag.tagFK,
          name: tag.tagDisplayValue,
        })
      })
    })
    category.serviceTags = _.orderBy(
      Object.values(_.groupBy(newServiceTags, 'value')).map(o => {
        return {
          value: o[0].value,
          name: o[0].name,
        }
      }),
      ['name'],
      ['asc'],
    )
  })

  let serviceTags = []
  data.forEach(service => {
    ;(service.serviceTag || []).forEach(tag => {
      serviceTags = serviceTags.concat({
        value: tag.tagFK,
        name: tag.tagDisplayValue,
      })
    })
  })
  serviceTags = _.orderBy(
    Object.values(_.groupBy(serviceTags, 'value')).map(o => {
      return {
        value: o[0].value,
        name: o[0].name,
      }
    }),
    ['name'],
    ['asc'],
  )

  let serviceTestCategories = []
  data.forEach(service => {
    ;(service.serviceTestPanel || []).forEach(testPanel => {
      serviceTestCategories = serviceTestCategories.concat({
        value: testPanel.testCategoryFK,
        name: testPanel.testCategory,
      })
    })
  })
  serviceTestCategories = _.orderBy(
    Object.values(_.groupBy(serviceTestCategories, 'value')).map(o => {
      return {
        value: o[0].value,
        name: o[0].name,
      }
    }),
    ['name'],
    ['asc'],
  )
  serviceTestCategories.forEach(category => {
    const items = data.filter(x =>
      (x.serviceTestPanel || []).find(x => x.testCategoryFK === category.value),
    )
    let newServiceTags = []
    items.forEach(service => {
      ;(service.serviceTag || []).forEach(tag => {
        newServiceTags = newServiceTags.concat({
          value: tag.tagFK,
          name: tag.tagDisplayValue,
        })
      })
    })
    category.serviceTags = _.orderBy(
      Object.values(_.groupBy(newServiceTags, 'value')).map(o => {
        return {
          value: o[0].value,
          name: o[0].name,
        }
      }),
      ['name'],
      ['asc'],
    )
  })

  return {
    serviceCenterServices: data,
    services,
    serviceCenters,
    serviceCatetorys,
    serviceTags,
    serviceTestCategories,
  }
}
export {
  getCodes,
  getServices,
  fetchAndSaveCodeTable,
  fetchCodeTable,
  checkIsCodetableAPI,
  getTenantCodes,
  getAllCodes,
  checkShouldRefresh,
  refreshCodetable,
}
