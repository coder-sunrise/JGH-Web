import moment from 'moment'
import _ from 'lodash'
import request, { axiosRequest } from './request'
import { convertToQuery } from './utils'

import db from './indexedDB'

const multiplyCodetable = (data, multiplier) => {
  if (multiplier === 1) return data
  let result = [ ...data ]
  const maxLength = data.length
  for (let i = 1; i <= multiplier; i++) {
    result = [ ...result, ...data.map((item) => ({ ...item, id: maxLength * i + item.id })) ]
  }
  return result
}

const defaultParams = {
  pagesize: 99999,
  sorting: [ { columnName: 'sortOrder', direction: 'asc' } ],
  isActive: true,
  excludeInactiveCodes: true,
}

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
      sorting: [],
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
      sorting: [ { columnName: 'serviceFKNavigation.displayValue', direction: 'asc' } ],
    },
  ],
  [
    'inventorymedication',
    {
      ...defaultParams,
      sorting: [ { columnName: 'displayValue', direction: 'asc' } ],
    },
  ],
  [
    'inventoryconsumable',
    {
      ...defaultParams,
      sorting: [ { columnName: 'displayValue', direction: 'asc' } ],
    },
  ],
  [
    'inventoryvaccination',
    {
      ...defaultParams,
      sorting: [ { columnName: 'displayValue', direction: 'asc' } ],
    },
  ],
  [
    'inventoryorderset',
    {
      ...defaultParams,
      sorting: [ { columnName: 'displayValue', direction: 'asc' } ],
    },
  ],
  [
    'package',
    {
      ...defaultParams,
      sorting: [ { columnName: 'displayValue', direction: 'asc' } ],
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
    'copaymentscheme',
    {
      ...defaultParams,
    },
  ],
  [
    'ctcopayer',
    {
      ...defaultParams,
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
])

// always get latest codetable
const skipCache = [ 'doctorprofile', 'clinicianprofile' ]

const noSortOrderProp = [ 'doctorprofile', 'clinicianprofile', 'role', 'cttag' ]

const convertExcludeFields = [
  // 'excludeInactiveCodes',
  'temp',
  'refresh',
]

const fetchAndSaveCodeTable = async (code, params, refresh = false, temp = false) => {
  let useGeneral = params === undefined || Object.keys(params).length === 0
  const baseURL = '/api/CodeTable'
  // const generalCodetableURL = `${baseURL}?excludeInactiveCodes=true&ctnames=`
  const searchURL = `${baseURL}/search?excludeInactiveCodes=true&ctname=`

  let url = searchURL

  let criteriaForTenantCodes = defaultParams
  if (tenantCodesMap.has(code.toLowerCase())) {
    url = '/api/'
    useGeneral = false
    criteriaForTenantCodes = tenantCodesMap.get(code.toLowerCase())
  }

  const newParams = {
    ...defaultParams,
    ...params,
  }
  newParams.sorting = noSortOrderProp.includes(code) ? [] : newParams.sorting
  const body = useGeneral
    ? convertToQuery({ ...newParams }, convertExcludeFields)
    : convertToQuery({ ...criteriaForTenantCodes, ...params }, convertExcludeFields)

  const response = await request(`${url}${code}`, {
    method: 'GET',
    body,
  })

  let { status: statusCode, data } = response
  let newData = []
  if (parseInt(statusCode, 10) === 200) {
    newData = [ ...data.data ]
  }

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
  const ct = await db.codetable.toArray((code) => {
    const results = code.filter((_i) => {
      const { updateDate } = _i
      const parsedUpdateDate = updateDate === null ? moment('2001-01-01') : moment(updateDate)
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
    results.forEach((r) => {
      const { code: c, data, ...others } = r
      cts[c.toLowerCase()] = data
      cts.config[c.toLowerCase()] = others
    })
    return cts
  })
  return ct || []
}

const getCodes = async (payload) => {
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
      const parsedUpdateDate = updateDate === null ? moment('2001-01-01') : moment(updateDate)
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

const checkShouldRefresh = async (payload) => {
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

const refreshCodetable = async (url) => {
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

const checkIsCodetableAPI = (url) => {
  try {
    const paths = url.split('/')

    // paths.length >= 3 ? tenantCodes.includes(paths[2].toLowerCase()) : false
    const isTenantCodes = paths.length >= 3 ? tenantCodesMap.has(paths[2].toLowerCase()) : false

    const isCodetable = paths.length >= 3 ? paths[2].startsWith('ct') : false
    // console.log({ isTenantCodes, isCodetable })
    return isTenantCodes || isCodetable
  } catch (error) {
    console.log({ error })
  }
  return false
}

const getTenantCodes = async (tenantCode) => {
  // todo: paging
  const response = await request(`/api/${tenantCode}`, { method: 'GET' })
  const { status: statusCode, data } = response
  if (statusCode === '200' || statusCode === 200) {
    return data
  }
  return {}
}

const getServices = (data) => {
  // eslint-disable-next-line compat/compat
  const services = _.orderBy(
    Object.values(_.groupBy(data, 'serviceId')).map((o) => {
      return {
        value: o[0].serviceId,
        code: o[0].code,
        name: o[0].displayValue,
        serviceCenters: o.map((m) => {
          return {
            value: m.serviceCenterId,
            name: m.serviceCenter,
            unitPrice: m.unitPrice,
            isDefault: m.isDefault,
          }
        }),
      }
    }),
    [ 'name' ],
    [ 'asc' ]
  )
  // eslint-disable-next-line compat/compat
  const serviceCenters = _.orderBy(
    Object.values(_.groupBy(data, 'serviceCenterId')).map((o) => {
      return {
        value: o[0].serviceCenterId,
        name: o[0].serviceCenter,
        services: o.map((m) => {
          return {
            value: m.serviceId,
            name: m.displayValue,
          }
        }),
      }
    }),
    [ 'name' ],
    [ 'asc' ]
  )

  return {
    serviceCenterServices: data,
    services,
    serviceCenters,
  }
}
export {
  getCodes,
  getServices,
  fetchAndSaveCodeTable,
  checkIsCodetableAPI,
  getTenantCodes,
  getAllCodes,
  checkShouldRefresh,
  refreshCodetable,
}
