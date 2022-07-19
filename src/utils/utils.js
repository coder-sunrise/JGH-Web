import moment from 'moment'
import React from 'react'
import _ from 'lodash'
import { camelizeKeys, pascalizeKeys } from 'humps'

import nzh from 'nzh/cn'
import { formatMessage, setLocale, getLocale, history } from 'umi'

import { parse, stringify } from 'qs'
import numeral from 'numeral'
import Authorized from '@/utils/Authorized'

import { serverDateTimeFormatFull, serverDateFormat } from '@/components'
import * as config from './config'
import RouterConfig from '../../config/router.config'

window.addEventListener('unhandledrejection', event => {
  console.log(event)
  event.preventDefault()
})

document.addEventListener('click', () => {
  window.alreadyFocused = false
})

Object.byString = function(o, s) {
  if (o === undefined || o === null) return ''
  // console.log(o, s)
  s = s.replace(/\[(\w+)\]/g, '.$1') // convert indexes to properties
  s = s.replace(/^\./, '') // strip a leading dot
  let a = s.split('.')
  for (let i = 0, n = a.length; i < n; ++i) {
    let k = a[i]
    if (o === undefined || o === null || typeof o !== 'object') continue
    try {
      if (k in o) {
        o = o[k]
        if (o === undefined) return ''
      } else {
        return ''
      }
    } catch (error) {
      console.log(error)
      return ''
    }
  }
  return o
}

String.prototype.replaceAll = function(search, replacement) {
  let target = this
  return target.replace(new RegExp(search, 'g'), replacement)
}

Number.prototype.currencyString = function() {
  if (this === undefined || this === null) return '-'
  return `${config.currencySymbol}${numeral(Math.abs(this)).format(
    config.currencyFormat,
  )}`
}
Number.prototype.formatString = function() {
  if (this === undefined || this === null) return '-'
  return `${numeral(Math.abs(this)).format(config.numberFormat)}`
}
// function toLocal (m) {
//   // console.log(m, m.formatUTC(), moment(m.formatUTC()).add(8, 'hours'))
//   return m.add(8, 'hours')
// }

// function toUTC (m) {
//   return moment(m.formatUTC()).add(-8, 'hours')
// }

moment.prototype.formatUTC = function(dateOnly = true) {
  return this.format(
    dateOnly ? `${serverDateFormat}T00:00:00` : serverDateTimeFormatFull,
  )
}

String.prototype.format = function() {
  if (arguments.length === 0) return this
  for (var s = this, i = 0; i < arguments.length; i++)
    s = s.replace(new RegExp(`\\{${i}\\}`, 'g'), arguments[i])
  return s
}

// moment.prototype.toUTC = function () {
//   return this.clone().add(-8, 'hours')
// }

/* eslint-disable */
export const roundTo = (amount, decimal = 2) => {
  if (isNaN(amount)) return undefined
  if (isNaN(parseFloat(amount))) return amount
  return _.round(amount, decimal)
}

export const roundUp = (num, decimal = 2) => {
  return Number(Math.ceil(num + 'e' + decimal) + 'e-' + decimal)
}
/* eslint-disable */

export function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val
}

export function getTimeDistance(type) {
  const now = new Date()
  const oneDay = 1000 * 60 * 60 * 24

  if (type === 'today') {
    now.setHours(0)
    now.setMinutes(0)
    now.setSeconds(0)
    return [moment(now), moment(now.getTime() + (oneDay - 1000))]
  }

  if (type === 'week') {
    let day = now.getDay()
    now.setHours(0)
    now.setMinutes(0)
    now.setSeconds(0)

    if (day === 0) {
      day = 6
    } else {
      day -= 1
    }

    const beginTime = now.getTime() - day * oneDay

    return [moment(beginTime), moment(beginTime + (7 * oneDay - 1000))]
  }

  if (type === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const nextDate = moment(now).add(1, 'months')
    const nextYear = nextDate.year()
    const nextMonth = nextDate.month()

    return [
      moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`),
      moment(
        moment(
          `${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`,
        ).valueOf() - 1000,
      ),
    ]
  }

  const year = now.getFullYear()
  return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)]
}

export function getPlainNode(nodeList, parentPath = '') {
  const arr = []
  nodeList.forEach(node => {
    const item = node
    item.path = `${parentPath}/${item.path || ''}`.replace(/\/+/g, '/')
    item.exact = true
    if (item.children && !item.component) {
      arr.push(...getPlainNode(item.children, item.path))
    } else {
      if (item.children && item.component) {
        item.exact = false
      }
      arr.push(item)
    }
  })
  return arr
}

export function digitUppercase(n) {
  return nzh.toMoney(n)
}

function getRelation(str1, str2) {
  if (str1 === str2) {
    console.warn('Two path are equal!') // eslint-disable-line
  }
  const arr1 = str1.split('/')
  const arr2 = str2.split('/')
  if (arr2.every((item, index) => item === arr1[index])) {
    return 1
  }
  if (arr1.every((item, index) => item === arr2[index])) {
    return 2
  }
  return 3
}

function getRenderArr(routes) {
  let renderArr = []
  renderArr.push(routes[0])
  for (let i = 1; i < routes.length; i += 1) {
    // 去重
    renderArr = renderArr.filter(item => getRelation(item, routes[i]) !== 1)
    // 是否包含
    const isAdd = renderArr.every(item => getRelation(item, routes[i]) === 3)
    if (isAdd) {
      renderArr.push(routes[i])
    }
  }
  return renderArr
}

/**
 * Get router routing configuration
 * { path:{name,...param}}=>Array<{name,path ...param}>
 * @param {string} path
 * @param {routerData} routerData
 */
export function getRoutes(path, routerData) {
  let routes = Object.keys(routerData).filter(
    routePath => routePath.indexOf(path) === 0 && routePath !== path,
  )
  // Replace path to '' eg. path='user' /user/name => name
  routes = routes.map(item => item.replace(path, ''))
  // Get the route to be rendered to remove the deep rendering
  const renderArr = getRenderArr(routes)
  // Conversion and stitching parameters
  const renderRoutes = renderArr.map(item => {
    const exact = !routes.some(
      route => route !== item && getRelation(route, item) === 1,
    )
    return {
      exact,
      ...routerData[`${path}${item}`],
      prop: `${path}${item}`,
      path: `${path}${item}`,
    }
  })
  return renderRoutes
}

export function getPageQuery(url) {
  return parse((url || window.location.href).split('?')[1])
}

export function getQueryPath(path = '', query = {}) {
  const search = stringify(query)
  if (search.length) {
    return `${path}?${search}`
  }
  return path
}

/* eslint no-useless-escape:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/

export function isUrl(path) {
  return reg.test(path)
}

export function formatWan(val) {
  const v = val * 1
  if (!v || Number.isNaN(v)) return ''

  let result = val
  if (val > 10000) {
    result = Math.floor(val / 10000)
    result = (
      <span>
        {result}
        <span
          styles={{
            position: 'relative',
            top: -2,
            fontSize: 14,
            fontStyle: 'normal',
            lineHeight: 20,
            marginLeft: 2,
          }}
        >
          万
        </span>
      </span>
    )
  }
  return result
}

// 给官方演示站点用，用于关闭真实开发环境不需要使用的特性
export function isAntdPro() {
  return window.location.hostname === 'preview.pro.ant.design'
}

export function extendFunc(...args) {
  const funcNew = function() {
    for (let i = 0; i < args.length; i++) {
      if (args[i]) {
        const r = args[i].apply(this, arguments)
        if (r === false) break
      }
    }
  }
  return funcNew
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const sumReducer = (p, n) => {
  return p + n
}
const maxReducer = (p, n) => {
  return p >= n ? p : n
}

export function difference(object, base) {
  function changes(o, b = {}) {
    const v = lodash.transform(o, (result, value, key) => {
      // console.log(value, b, key, result, o, React.isValidElement(o))
      if (_.isFunction(value) || React.isValidElement(value)) {
        // result[key] = {}
      } else if (!lodash.isEqual(value, b[key])) {
        // console.log(value, b, key, result, o, React.isValidElement(o))
        const r =
          lodash.isObject(value) && lodash.isObject(b[key])
            ? changes(value, b[key])
            : value
        // console.log(r)
        result[key] = r
      }
    })
    // console.log(v)
    return v
  }
  return changes(object, base)
}

const searchToObject = () => {
  const pairs = window.location.search.substring(1).split('&')
  const obj = {}

  for (const i in pairs) {
    if (Object.prototype.hasOwnProperty.call(pairs, i)) {
      if (!pairs[i]) continue
      const pair = pairs[i].split('=')
      obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
    }
  }

  return obj
}

const getAppendUrl = (param, targetUrl) => {
  let url = targetUrl || window.location.pathname
  // let existP = {}

  let newPs = ''
  if (typeof param === 'object') {
    const n = {
      ...(searchToObject() || {}),
      ...param,
    }
    Object.keys(n).forEach(k => {
      newPs += `&${k}=${n[k]}`
    })
  } else if (typeof param === 'string') {
    url += window.location.search + param
  }
  if (newPs) {
    url = `${url}?${newPs.substring(1)}`
  }

  return url
}
const getRemovedUrl = (ary = [], targetUrl) => {
  let url = targetUrl || window.location.pathname

  const p = getPageQuery(targetUrl)
  // let existP = {}
  // console.debug(p)
  if (Array.isArray(ary)) {
    ary.forEach(a => {
      delete p[a]
    })
    // const n = {
    //   ...(searchToObject() || {}),
    // }
    // Object.keys(n).forEach((k) => {
    //   if (!ary.find((o) => o === k)) {
    //     newPs += `&${k}=${n[k]}`
    //   }
    // })
  }
  // console.debug(p)

  return getQueryPath(window.location.pathname, p)
}

const findGetParameter = parameterName => {
  let result = null
  let tmp = []
  // eslint-disable-next-line no-restricted-globals
  location.search
    .substr(1)
    .split('&')
    .forEach(item => {
      tmp = item.split('=')
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1])
    })
  return result
}

let runningId = 0
export const getUniqueId = (prefix = 'sys-gen-') => {
  runningId -= 1
  return `${prefix}${runningId}`
}
export const getUniqueGUID = () => {
  let d = new Date().getTime()
  let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}
export const getUniqueNumericId = () => {
  runningId -= 1
  return runningId
}

const convertToQuery = (query = {}, convertExcludeFields = ['create']) => {
  // //console.log(query)
  const {
    current,
    pagesize,
    pageSize,
    combineCondition,
    includeDeleted,
    includeParentDeleted,
    // queryExcludeFields,
    sorting = [],
    props,
    sort,
    apiCriteria,
  } = query
  // console.log(query)
  let customQuerys = { ...query }
  delete customQuerys.keepFilter
  delete customQuerys.current
  delete customQuerys.pagesize
  delete customQuerys.pageSize
  delete customQuerys.sortby
  delete customQuerys.order
  delete customQuerys.sorting
  delete customQuerys.sort
  delete customQuerys.includeDeleted
  delete customQuerys.includeParentDeleted
  // delete customQuerys.queryExcludeFields
  delete customQuerys.totalRecords
  delete customQuerys.combineCondition
  delete customQuerys.version
  delete customQuerys.excludeInactiveCodes
  delete customQuerys.props
  delete customQuerys.apiCriteria

  // console.log(query)
  let newQuery = {}
  const refilter = /\b([^_]{0,6}(?=_))?_?(.*)\b/
  newQuery.columnCriteria = []
  newQuery.conditionGroups = []
  // //console.log('convert to query')
  // sort[0][sortby]=patientaccountno&sort[0][order]=desc
  // sorting.forEach((s) => {
  //   // sort[0][sortby]=patientaccountno&sort[0][order]=desc
  // })
  // console.log(query)
  const { valueType, filterType } = config
  for (let p in customQuerys) {
    if (Object.prototype.hasOwnProperty.call(customQuerys, p)) {
      // console.log(customQuerys[p])
      if (customQuerys[p] !== undefined && customQuerys[p] !== '') {
        let val = customQuerys[p]
        if (typeof val === 'string') {
          val = val.trim()
          if (val === '') continue
          const match = refilter.exec(p)
          if (!!match && match.length > 1) {
            newQuery.columnCriteria.push({
              prop: match[2],
              val,
              opr: filterType[match[1]] || filterType.like,
              // property: match[3] ? s.substring(0, s.length - 1) : null,
              // valueType: match[4] ? valueType[match[4]] : null,
            })
          } else {
            newQuery.columnCriteria.push({
              prop: p,
              val,
              opr: filterType.like,
            })
          }
        } else if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            const obj = convertToQuery(val[i])
            // console.log(val[i], obj, JSON.stringify(obj))
            // newQuery.conditionGroups.push(obj)
            if (obj.columnCriteria && obj.columnCriteria.length > 0) {
              obj.columnCriteria.forEach((c, j) => {
                newQuery[`conditionGroups[${i}].columnCriteria[${j}][prop]`] =
                  c.prop
                newQuery[`conditionGroups[${i}].columnCriteria[${j}][val]`] =
                  c.val
                newQuery[`conditionGroups[${i}].columnCriteria[${j}][opr]`] =
                  c.opr
              })
              newQuery[`conditionGroups[${i}].combineCondition`] =
                obj.combineCondition
            }
          }
          // console.log({ newQuery })
        } else if (typeof val === 'object' && Object.keys(val).length === 1) {
          const v = val[Object.keys(val)[0]]
          if (v !== undefined && v.toString().trim() !== '') {
            newQuery.columnCriteria.push({
              prop: `${p}.${Object.keys(val)[0]}`,
              val: v,
              opr:
                ['boolean', 'number'].indexOf(typeof v) >= 0
                  ? filterType.eql
                  : filterType.like,
            })
          }
        } else if (convertExcludeFields.indexOf(p) < 0) {
          // let valType = null
          // if (typeof val === 'boolean') valType = valueType.b
          // else if (typeof val === 'number') valType = valType.i
          if (val.toString().trim() !== '') {
            newQuery.columnCriteria.push({
              prop: p,
              val,
              // valueType: valType,
              opr:
                ['boolean', 'number'].indexOf(typeof val) >= 0
                  ? filterType.eql
                  : filterType.like,
            })
          }
        }
      }
    }
  }

  const returnVal = {
    ...newQuery,
    sort: sort
      ? sort
      : sorting.map(o => ({
          sortby: o.sortBy || o.columnName,
          order: o.direction,
        })),
    current,
    pagesize,
    combineCondition,
    includeDeleted,
    includeParentDeleted,
    props,
    apiCriteria,

    // queryExcludeFields,
  }
  convertExcludeFields.forEach(p => {
    if (customQuerys[p] !== undefined) returnVal[p] = customQuerys[p]
  })
  // if (returnVal.columnCriteria && returnVal.columnCriteria.length > 0) {
  //   returnVal.columnCriteria = JSON.stringify(returnVal.columnCriteria)
  // }

  return returnVal
}

export const updateGlobalVariable = (key, value) => {
  if (!window.medisys) {
    window.medisys = {}
  }
  window.medisys[key] = value
}

export const getGlobalVariable = key => {
  if (!window.medisys) {
    window.medisys = {}
  }
  return window.medisys[key]
}

export const updateLoadingState = (type = '@@DVA_LOADING/HIDE') => {
  const { dispatch, getState } = window.g_app._store
  const { loading } = getState()
  if (loading) {
    Object.keys(loading.effects).forEach(o => {
      if (loading.effects[o]) {
        dispatch({
          type,
          payload: {
            namespace: o.substr(0, o.indexOf('/')),
            actionType: o,
          },
        })
      }
    })
  }
}

let errorCount = 0

export const updateCellValue = (
  {
    column: { name: columnName },
    value,
    onValueChange,
    columnExtensions,
    classes,
    config = {},
    row = {},
    editMode,
  },
  element,
  val,
  col,
) => {
  const cfg =
    columnExtensions.find(
      ({ columnName: currentColumnName }) => currentColumnName === columnName,
    ) || {}
  const { validationSchema, gridId, getRowId, ...restConfig } = cfg
  // console.log({ columnName, val, value, editMode }, row, 'dsad')
  if (!window.$tempGridRow[gridId]) {
    window.$tempGridRow[gridId] = {}
  }
  if (!window.$tempGridRow[gridId][getRowId(row)]) {
    // console.log('1312323', row, getRowId(row))
    window.$tempGridRow[gridId][getRowId(row)] = row
  }
  // console.log(columnName, val)
  // console.log({ row, val })
  if (editMode) {
    window.$tempGridRow[gridId][getRowId(row)][columnName] = val
  } else {
    window.$tempGridRow[gridId][getRowId(row)][columnName] = value
  }
  // console.log(val, columnName)
  // console.log({ t1: window.$tempGridRow })
  if (validationSchema) {
    try {
      if (editMode && value !== val && typeof onValueChange === 'function') {
        onValueChange(val)
      }
      if (getRowId(row)) {
        const r = validationSchema.validateSync(
          window.$tempGridRow[gridId][getRowId(row)],
          {
            abortEarly: false,
          },
        )

        // if (element)
        //   $(element).parents('tr').find('.grid-commit').removeAttr('disabled')
      }
      return []
      // row._$error = false
    } catch (er) {
      // console.log(er)
      // window.g_app._store.dispatch({
      //   type: 'global/updateState',
      //   payload: {
      //     errorCount: errorCount++,
      //   },
      // })
      // const { inner } = er
      // if (inner) {
      //   if (!inner.find((o) => o.path === columnName)) {
      //     return
      //   }
      // }
      // $(element).parents('tr').find('.grid-commit').attr('disabled', true)

      return er.inner || []
      // row._$error = true
    }
  } else if (value !== val && onValueChange) {
    onValueChange(val)
  }
  return []
}

const observers = {}
export const watchForElementChange = e => {
  let t = e.selector

  let n = e.ongoing

  let a = e.callback

  let i = e.config

  let r =
    undefined === i
      ? {
          childList: true,
          characterData: true,
          subtree: true,
          attributes: true,
        }
      : i
  ;(observers[t] = new MutationObserver(e1 => {
    e1.forEach(e2 => {
      a(e2)
    }),
      n || observers[t].disconnect()
  })),
    observers[t].observe(e.container || document, r)
}

const confirmBeforeReload = e => {
  e.preventDefault()
  // Chrome requires returnValue to be set
  e.returnValue = ''
}

const _checkCb = ({ redirectUrl, onProceed }, e) => {
  if (onProceed) {
    onProceed(e)
  }
  if (redirectUrl) {
    history.push(redirectUrl)
  }
}

const navigateDirtyCheck = ({
  onConfirm,
  displayName,
  showSecondConfirmButton,
  openConfirmContent,
  confirmText,
  onSecondConfirm,
  ...restProps
}) => e => {
  if (window.beforeReloadHandlerAdded) {
    let f = {}

    if (displayName) {
      f = window.dirtyForms[displayName]

      const ob = window.g_app._store.getState().formik[displayName]
      if ((ob && !ob.dirty) || !f) {
        _checkCb(restProps, e)
        return
      }
    }
    let showSecConfirmButton = false
    if (showSecondConfirmButton === undefined) {
      showSecConfirmButton = f.showSecondConfirmButton
    } else {
      showSecConfirmButton = showSecondConfirmButton
    }
    let confirmButtonText = onConfirm ? 'Save Changes' : 'Confirm'
    if (f.confirmText) {
      confirmButtonText = f.confirmText
    }
    if (confirmText) {
      confirmButtonText = confirmText
    }
    window.g_app._store.dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        showSecondConfirmButton: showSecConfirmButton,
        onSecondConfirm: null || f.onSecondConfirm,
        openConfirmContent:
          openConfirmContent ||
          (typeof f.dirtyCheckMessage === 'function'
            ? f.dirtyCheckMessage()
            : f.dirtyCheckMessage) ||
          formatMessage({
            id: 'app.general.leave-without-save',
          }),
        onConfirmSave: onConfirm,
        openConfirmText: confirmButtonText,
        onConfirmClose: () => {
          window.g_app._store.dispatch({
            type: 'global/updateAppState',
            payload: {
              openConfirm: false,
            },
          })
        },
        onConfirmDiscard: () => {
          if (displayName) {
            window.g_app._store.dispatch({
              type: 'formik/updateState',
              payload: {
                [displayName]: undefined,
              },
            })

            if (f.onDirtyDiscard) f.onDirtyDiscard()
            delete window.dirtyForms[displayName]
          } else {
            Object.values(window.dirtyForms).forEach(f => {
              window.g_app._store.dispatch({
                type: 'formik/updateState',
                payload: {
                  [f.displayName]: undefined,
                },
              })
              if (f.onDirtyDiscard) f.onDirtyDiscard()
            })
            window.dirtyForms = {}
            // delete window._localFormik[displayName]
          }
          if (Object.values(window.dirtyForms).length === 0) {
            window.beforeReloadHandlerAdded = false
            window.removeEventListener('beforeunload', confirmBeforeReload)
          }

          _checkCb(restProps, e)
        },
      },
    })
    e.preventDefault()
  } else {
    _checkCb(restProps, e)
    // window._localFormik = {}
    // console.log(window._localFormik)
  }
}

const calculateAdjustAmount = (
  isExactAmount = true,
  initialAmout = 0,
  adj = 0,
) => {
  // console.log({ initialAmout, adj })
  let amount = initialAmout
  let adjAmount
  if (isExactAmount) {
    adjAmount = adj
  } else {
    adjAmount = initialAmout * adj * 0.01
  }
  amount += adjAmount
  return {
    amount,
    adjAmount,
  }
}

const errMsgForOutOfRange = field => `${field} must between 0 and 999,999.99`
const calculateItemLevelAdjustment = (
  adjType = 'ExactAmount',
  adjValue = 0,
  tempSubTotal = 0,
  tempInvoiceTotal = 0,
  gstPercentage = 0,
  gstEnabled = false,
  gstIncluded = false,
  count = 0,
) => {
  let itemLevelAdjustmentAmount = 0
  let itemLevelGSTAmount = 0

  if (adjType === 'Percentage') {
    itemLevelAdjustmentAmount = tempSubTotal * (adjValue / 100)
    tempSubTotal += itemLevelAdjustmentAmount
  } else {
    itemLevelAdjustmentAmount = adjValue / count
    tempSubTotal += itemLevelAdjustmentAmount
  }

  if (!gstEnabled) {
    itemLevelGSTAmount = 0
  } else if (gstIncluded) {
    itemLevelGSTAmount = tempSubTotal * (gstPercentage / 107)
  } else {
    itemLevelGSTAmount = tempSubTotal * (gstPercentage / 100)
  }

  return {
    itemLevelAdjustmentAmount,
    itemLevelGSTAmount,
  }
}

const htmlEncode = html => {
  // 1.首先动态创建一个容器标签元素，如DIV
  let temp = document.createElement('div')
  // 2.然后将要转换的字符串设置为这个元素的innerText(ie支持)或者textContent(火狐，google支持)
  temp.textContent !== undefined
    ? (temp.textContent = html)
    : (temp.innerText = html)
  // 3.最后返回这个元素的innerHTML，即得到经过HTML编码转换的字符串了
  let output = temp.innerHTML
  temp = null
  return output
}
const htmlDecode = text => {
  // 1.首先动态创建一个容器标签元素，如DIV
  let temp = document.createElement('div')
  // 2.然后将要转换的字符串设置为这个元素的innerHTML(ie，火狐，google都支持)
  temp.innerHTML = text
  // 3.最后返回这个元素的innerText(ie支持)或者textContent(火狐，google支持)，即得到经过HTML解码的字符串了。
  let output = temp.innerText || temp.textContent
  temp = null
  return output
}

const htmlEncodeByRegExp = (str = '') => {
  let s = ''
  if (str.length === 0) return ''
  s = str.replace(/&/g, '&amp;')
  s = s.replace(/</g, '&lt;')
  s = s.replace(/>/g, '&gt;')
  s = s.replace(/ /g, '&nbsp;')
  s = s.replace(/\'/g, '&#39;')
  s = s.replace(/\"/g, '&quot;')
  return s
}
const htmlDecodeByRegExp = (str = '') => {
  let s = ''
  if (str.length === 0) return ''
  s = str.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&#39;/g, "'")
  s = s.replace(/&quot;/g, '"')
  return s
}

const getRefreshChasBalanceStatus = (status = []) => {
  let defaultResponse = { isSuccessful: false, statusDescription: '' }
  if (_.isEmpty(status)) {
    return { ...defaultResponse }
  }

  const successCode = 'SC100'
  const fullBalanceSuccessCode = 'SC105'
  const { statusCode, statusDescription } = status[0]

  if (
    statusCode.trim().toLowerCase() ===
    fullBalanceSuccessCode.trim().toLowerCase()
  ) {
    return {
      ...defaultResponse,
      isSuccessful: true,
    }
  }

  if (statusCode.trim().toLowerCase() !== successCode.trim().toLowerCase()) {
    return {
      ...defaultResponse,
      statusDescription,
    }
  }

  return { ...defaultResponse, isSuccessful: true }
}

const getRefreshMedisaveBalanceStatus = (response = []) => {
  let defaultResponse = { isSuccessful: false, statusDescription: '' }
  if (_.isEmpty(response)) {
    return { ...defaultResponse }
  }

  const successCode = 'WN800'
  const { status, statusDescription } = response

  if (
    status &&
    status.trim().toLowerCase() !== successCode.trim().toLowerCase()
  ) {
    return {
      ...defaultResponse,
      statusDescription,
    }
  }

  return { ...defaultResponse, isSuccessful: true }
}

const sortAdjustment = (a, b) => {
  const { sequence: aSequence } = a
  const { sequence: bSequence } = b
  if (aSequence < bSequence) return -1
  if (aSequence > bSequence) return 1
  return 0
}

const calculateGSTAdj = ({
  isGSTInclusive = false,
  activeOrderRows,
  totalAfterAdj,
  gstValue = 0,
  gstAmtField = 'gstAmount',
}) => {
  let gst = roundTo((totalAfterAdj * gstValue) / 100)
  if (isGSTInclusive) {
    gst = roundTo(totalAfterAdj - totalAfterAdj / (1 + gstValue / 100))
  }

  const totalItemizedGST = roundTo(
    activeOrderRows.map(i => i[gstAmtField]).reduce(sumReducer, 0),
  )
  const diff = roundTo(gst - totalItemizedGST)
  // include the diff of GST value only to the last items
  activeOrderRows
    .filter(x => x.totalBeforeGST > 0)
    .forEach((r, index) => {
      if (
        index ===
        activeOrderRows.filter(x => x.totalBeforeGST > 0).length - 1
      ) {
        r[gstAmtField] += diff
        if (!isGSTInclusive) {
          r.totalAfterGST += diff
        }
      }
    })

  return {
    gst,
    gstAdjustment: diff,
  }
}

const calculateAmount = (
  allOrderRows,
  adjustments,
  {
    itemFkField = 'invoiceItemFK',
    itemAdjustmentFkField = 'invoiceAdjustmentFK',
    invoiceItemAdjustmentField = 'invoiceItemAdjustment',
    adjAmountField = 'adjAmt',
    totalField = 'totalAfterItemAdjustment',
    adjustedField = 'totalAfterOverallAdjustment',
    gstField = 'totalAfterGST',
    gstAmtField = 'gstAmount',
    isGSTInclusive = false,
    gstValue = undefined,
  } = {},
) => {
  let gst = 0
  allOrderRows
    .filter(o => !o.isDeleted && o.isPreOrder && !o.hasPaid)
    .forEach(r => {
      r[adjustedField] = r[totalField]
      r[gstField] = r[adjustedField]
      r[gstAmtField] = 0
    })
  // pre-order
  const activeOrderRows = allOrderRows.filter(
    o =>
      !o.isDeleted &&
      (!o.isPreOrder || o.isChargeToday) &&
      !o.hasPaid &&
      o[totalField] > 0,
  )
  // zero amount
  allOrderRows
    .filter(
      o =>
        !o.isDeleted &&
        (!o.isPreOrder || o.isChargeToday) &&
        !o.hasPaid &&
        o[totalField] === 0,
    )
    .forEach(r => {
      r[adjustedField] = r[totalField]
      r[gstField] = r[adjustedField]
      r[gstAmtField] = 0
    })

  const activeAdjustments = adjustments.filter(o => !o.isDeleted)

  const total = roundTo(
    activeOrderRows.map(o => o[totalField]).reduce(sumReducer, 0),
  )

  activeOrderRows.forEach(r => {
    r.weightage = r[totalField] / total || 0
    // console.log(r[totalField], total, r.weightage)

    r[adjustedField] = r[totalField]

    // console.log(r)
  })
  if (total === 0 && activeOrderRows[0]) {
    activeOrderRows[0].weightage = 1
  }
  // using for calculate the total adjustment from the beginning
  // total - totalAdjustment will be use for calculate the next adjustment amount
  let totalAdjustment = 0
  activeAdjustments
    .filter(o => !o.isDeleted)
    .forEach((fa, i) => {
      activeOrderRows.forEach(o => {
        o.subAdjustment = 0
      })
      let adjAmount = 0
      // the finale adjustment amount for on adjustment always equal to the sub total before previous adjusmtent
      // not sum of each item invoice adjustment;
      if (fa.adjType === 'Percentage') {
        adjAmount = roundTo((fa.adjValue / 100) * (total + totalAdjustment))
      } else {
        adjAmount = roundTo(fa.adjValue)
      }
      let otherItemsAdjAmount = 0
      activeOrderRows.forEach((r, j) => {
        // console.log(r.weightage * fa.adjAmount, r)
        let adj = 0
        let initalRowToal = r[totalField]
        for (let idx = 0; idx < i; idx++) {
          initalRowToal += r[`adjustmen${idx}`]
        }
        if (fa.adjType === 'ExactAmount') {
          // --- If is last item, should use [totalAdjAmount] - [sum of other items adj amt] ---//
          if (activeOrderRows.length - 1 === j) {
            adj = roundTo(fa.adjValue - otherItemsAdjAmount)
          } else {
            adj = roundTo(Math.abs(r.weightage) * Math.abs(fa.adjValue), 2)

            if (fa.adjValue < 0) adj = -adj
          }
        } else if (fa.adjType === 'Percentage') {
          // for percentage, the remaining of adjustment amount of current adjustment will assign to the last time
          adj = roundTo(fa.adjValue / 100) * initalRowToal
          if (activeOrderRows.length - 1 === j) {
            adj = roundTo(Math.abs(adjAmount) - Math.abs(otherItemsAdjAmount))
          }
          if (fa.adjValue < 0 && adj > 0) adj = -adj
        }
        // console.log(r.subAdjustment + adj, r.subAdjustment, adj)
        // adjAmount += adj
        // r[adjustedField] = roundTo(r[adjustedField] + adj)
        // r.subAdjustment += adj
        r[`adjustmen${i}`] = adj
        r[adjustedField] = roundTo(initalRowToal + adj)
        otherItemsAdjAmount += roundTo(adj)
      })
      fa.adjAmount = adjAmount
      totalAdjustment += fa.adjAmount
    })
  // activeOrderRows.forEach((r) => {
  //   r[adjustedField] = roundTo(r[adjustedField])
  // })
  const totalAfterAdj = roundTo(
    activeOrderRows.map(o => o[adjustedField]).reduce(sumReducer, 0),
  )

  if (gstValue) {
    if (isGSTInclusive) {
      activeOrderRows.forEach(r => {
        gst += roundTo(
          r[adjustedField] - r[adjustedField] / (1 + gstValue / 100),
        )
      })
    } else {
      gst = roundTo((totalAfterAdj * gstValue) / 100)
    }
    let currentItemTotalGst = 0
    activeOrderRows.forEach(r => {
      if (isGSTInclusive) {
        let itemGST = roundTo(
          r[adjustedField] - r[adjustedField] / (1 + gstValue / 100),
        )
        if (currentItemTotalGst + itemGST > gst) {
          itemGST = gst - currentItemTotalGst
        }
        r[gstAmtField] = itemGST
        r[gstField] = r[adjustedField]
        currentItemTotalGst += itemGST
      } else {
        let itemGST = roundTo((r[adjustedField] * gstValue) / 100)
        if (currentItemTotalGst + itemGST > gst) {
          itemGST = gst - currentItemTotalGst
        }
        r[gstAmtField] = itemGST
        r[gstField] = r[adjustedField] + itemGST
      }
      // console.log(r[gstField], r[gstAmtField])
    })
  } else {
    activeOrderRows.forEach(r => {
      r[gstAmtField] = 0
      r[gstField] = r[adjustedField]
    })
  }
  // console.log({ activeOrderRows, adjustments })
  const mapInvoiceItemAdjustment = (adjustment, index) => invoiceItem => {
    let itemAdj
    if (adjustment.invoiceItemAdjustment)
      itemAdj = adjustment.invoiceItemAdjustment.find(
        ss => ss.invoiceItemFK === invoiceItem.id,
      )
    return {
      [itemFkField]: invoiceItem.id,
      [itemAdjustmentFkField]: adjustment.id,
      adjAmount: roundTo(invoiceItem[`adjustmen${index}`]),
      isDeleted: !!adjustment.isDeleted,
      id: itemAdj ? itemAdj.id : 0,
      concurrencyToken: itemAdj ? itemAdj.concurrencyToken : undefined,
    }
  }

  const { gst: absoluteGST, gstAdjustment } = calculateGSTAdj({
    activeOrderRows,
    totalAfterAdj,
    gstValue,
    isGSTInclusive,
  })
  const r = {
    allOrderRows,
    adjustments: adjustments
      .map((o, index) => ({
        ...o,
        index,
        sequence: index + 1,
        [invoiceItemAdjustmentField]: activeOrderRows.map(
          mapInvoiceItemAdjustment(o, index),
        ),
      }))
      .sort(sortAdjustment),
    summary: {
      subTotal: roundTo(
        activeOrderRows.map(row => row[totalField]).reduce(sumReducer, 0),
      ),
      gst: absoluteGST,
      gstAdj: gstAdjustment,
      total,
      totalAfterAdj,
      totalWithGST: isGSTInclusive
        ? totalAfterAdj
        : roundTo(absoluteGST + totalAfterAdj),
      gstValue,
      isGSTInclusive,
    },
  }

  return r
}

const removeFields = (obj, fields = []) => {
  if (Array.isArray(obj)) {
    obj.forEach(v => {
      removeFields(v, fields)
    })
  } else if (typeof obj === 'object') {
    for (let [
      key, // dun remove
      value,
    ] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        removeFields(value, fields)
      }
    }
    fields.forEach(o => {
      delete obj[o]
    })
  }
}

export const currencyFormatter = value =>
  numeral(value).format(`$${config.currencyFormat}`)

const regDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/s
const commonDataReaderTransform = (data, fieldName, keepNull = false) => {
  // console.log(commonDataReaderTransform)
  const { getClinic } = config
  const { systemTimeZoneInt = 0 } = getClinic() || {}

  // console.log(data, fieldName)
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      if (fieldName) data = data.sort((a, b) => a[fieldName] - b[fieldName])
      data.forEach(element => {
        commonDataReaderTransform(element, fieldName, keepNull)
      })
    } else {
      for (let field in data) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
          const v = data[field]
          if (!keepNull && (v === null || v === undefined)) {
            delete data[field]
            continue
          }
          if (Array.isArray(v)) {
            if (fieldName)
              data[field] = lodash.sortBy(data[field], [o => o[fieldName]])
            for (let subfield in v) {
              if (Object.prototype.hasOwnProperty.call(v, subfield)) {
                commonDataReaderTransform(
                  data[field][subfield],
                  fieldName,
                  keepNull,
                )
              }
            }
          }
          if (typeof v === 'object') {
            commonDataReaderTransform(data[field], fieldName, keepNull)
          } else if (
            typeof v === 'string' &&
            regDate.test(v) &&
            !data[`_${field}In`]
          ) {
            data[`_${field}In`] = true
            data[field] = moment(v, 'YYYY-MM-DDTHH:mm:ss')
              .add(systemTimeZoneInt, 'hours')
              .format('YYYY-MM-DDTHH:mm:ss')
          }
        }
      }
    }
  }
  return data
}

const commonDataWriterTransform = data => {
  const { getClinic } = config
  const { systemTimeZoneInt = 8 } = getClinic() || {}
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      data.forEach(element => {
        commonDataWriterTransform(element)
      })
    } else {
      for (let field in data) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
          const v = data[field]

          if (Array.isArray(v)) {
            for (let subfield in v) {
              if (Object.prototype.hasOwnProperty.call(v, subfield)) {
                commonDataWriterTransform(data[field][subfield])
              }
            }
          }
          if (typeof v === 'object') {
            commonDataWriterTransform(data[field])
          } else if (
            typeof v === 'string' &&
            regDate.test(v) &&
            !data[`_${field}Out`]
          ) {
            // console.log(v, moment(v).add(-8, 'hours'))
            data[`_${field}Out`] = true
            data[field] = moment(v, 'YYYY-MM-DDTHH:mm:ss')
              .add(-systemTimeZoneInt, 'hours')
              .format('YYYY-MM-DDTHH:mm:ss')
          }
        }
      }
    }
  }
  return data
}
const locationQueryParameters = () => {
  let searchParams = window.location.search.split('&')
  const params = searchParams.reduce((pre, cur) => {
    let kv = (cur.startsWith('?') ? cur.substring(1) : cur).split('=')
    return {
      ...pre,
      [`${kv[0]}`]: kv[1],
    }
  }, {})
  return params
}

export const convertToBase64 = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = error => reject(error)
  })

const enableTableForceRender = (duration = 1000) => {
  window._forceTableUpdate = true
  setTimeout(() => {
    window._forceTableUpdate = false
  }, duration)
}

const generateHashCode = s =>
  `${s
    .split('')
    .reduce((a, b) => Math.abs((a << 5) - a + b.charCodeAt(0)) | 0, 0)}`

const stringToBytesFaster = str => {
  // http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string
  let ch
  let st
  let re = []
  let j = 0
  for (let i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i)
    if (ch < 127) {
      re[j++] = ch & 0xff
    } else {
      st = [] // clear stack
      do {
        st.push(ch & 0xff) // push byte to stack
        ch >>= 8 // shift value down by 1 byte
      } while (ch)
      // add stack contents to result
      // done because chars have "wrong" endianness
      st = st.reverse()
      for (let k = 0; k < st.length; ++k) re[j++] = st[k]
    }
  }
  // return an array of bytes
  return re
}

const checkAuthoritys = (pathname, history) => {
  if (sessionStorage.getItem('user')) {
    const getAuthoritys = (routes = []) => {
      for (let index = 0; index < routes.length; index++) {
        if (routes[index].path === pathname) {
          return routes[index].authority
        }
        if (routes[index].routes) {
          let authority = getAuthoritys(routes[index].routes)
          if (authority) {
            return authority
          }
        }
      }
    }
    let authoritys = getAuthoritys(RouterConfig)
    if (authoritys) {
      authoritys.forEach(authority => {
        const accessRight = Authorized.check(authority)
        if (!accessRight || accessRight.rights === 'hidden') {
          history.push('/forbidden')
        }
      })
    }
  }
}

const ableToViewByAuthority = authority => {
  const accessRight = Authorized.check(authority) || {
    rights: 'hidden',
  }
  return accessRight.rights === 'enable'
}

const getModuleSequence = moduleName => {
  const sequence = RouterConfig[2].routes
    .filter(r => r.moduleName)
    .map(r => r.moduleName.toUpperCase())
    .indexOf(moduleName.toUpperCase())
  if (sequence >= 0) return sequence
  else return 1000
}

export const formatUrlPath = (url, data) => {
  const newData = camelizeKeys({
    ...data,
  })
  let newUrl = url
  try {
    let domin = ''
    if (newUrl.match(/[a-zA-z]+:\/\/[^/]*/)) {
      domin = newUrl.match(/[a-zA-z]+:\/\/[^/]*/)[0]
      newUrl = newUrl.slice(domin.length)
    }
    const match = pathToRegexp.parse(newUrl)
    if (match.length > 1) {
      for (let index = 1; index < match.length; index++) {
        let element = match[index]
        if (!newData[element.name]) {
          newUrl = newUrl.replace(`:${element.name}`, '')
        }
      }
      newUrl = pathToRegexp.compile(newUrl)(newData)
      const index = newUrl.indexOf('?')
      if (index >= 0) {
        const subUrl = newUrl.substring(index + 1)
        const para = queryString.parse(subUrl)
        newUrl = `${newUrl.substring(0, index + 1)}${encrypt(para)}`
      }
      // for (let item of match) {
      //   if (item instanceof Object && item.name in newData) {
      //     delete data[item.name]
      //   }
      // }
    }

    return domin + newUrl
  } catch (e) {
    message.error(e.message)
    return url
  }
}

export const cleanFieldValue = data => {
  // console.log(data, fieldName)
  if (data === undefined || data === null) return data
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      data.forEach(element => {
        cleanFieldValue(element)
      })
    } else {
      if (data.isNew) {
        delete data.id
      }
      for (let field in data) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
          if (Array.isArray(data[field])) {
            // data[field] = lodash.sortBy(data[field], [
            //   (o) => o[fieldName],
            // ])
            for (let subfield in data[field]) {
              if (Object.prototype.hasOwnProperty.call(data[field], subfield)) {
                cleanFieldValue(data[field][subfield])
              }
            }
          }
          if (typeof data[field] === 'object') {
            cleanFieldValue(data[field])
          }
        }
      }
    }
  }
  return data
}
export const removeEmpty = values => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Object.fromEntries(
    Object.entries(values).filter(([_, v]) => v !== '' && v.length !== 0),
  )
}

const getTranslationValue = (translationDatas = [], language, key) => {
  let displayValue = ''
  const translationData = translationDatas.find(t => t.language === language)
  if (translationData) {
    const displayValueItem = (translationData.list || []).find(
      l => l.key === key,
    )
    if (displayValueItem) {
      displayValue = displayValueItem.value
    }
  }
  return displayValue
}

const getMappedVisitType = (visitpurpose, visitTypeSettingsObj) => {
  return visitpurpose
    .map((item, index) => {
      const { name, code, sortOrder, ...rest } = item
      const visitType = visitTypeSettingsObj
        ? visitTypeSettingsObj[index]
        : undefined
      return {
        ...rest,
        name: visitType?.displayValue || name,
        code: visitType?.code || code,
        isEnabled: visitType?.isEnabled || 'true',
        sortOrder: visitType?.sortOrder || 0,
        customTooltipField: `Code: ${visitType?.code ||
          code}\nName: ${visitType?.displayValue || name}`,
      }
    })
    .sort((a, b) => (a.sortOrder >= b.sortOrder ? 1 : -1))
}

const getNameWithTitle = (title, name) =>
  `${title && name.trim().length ? `${title}. ` : ''}${name || ''}`

const showCurrency = (value = 0) => {
  if (value >= 0)
    return (
      <div style={{ color: 'darkBlue', fontWeight: 500 }}>
        {`${config.currencySymbol}${numeral(value).format('0,0.00')}`}
      </div>
    )
  return (
    <div style={{ color: 'red', fontWeight: 500 }}>
      {`(${config.currencySymbol}${numeral(value * -1).format('0,0.00')})`}
    </div>
  )
}
export {
  sleep,
  sumReducer,
  maxReducer,
  getAppendUrl,
  getRemovedUrl,
  convertToQuery,
  confirmBeforeReload,
  navigateDirtyCheck,
  calculateAdjustAmount,
  errMsgForOutOfRange,
  calculateItemLevelAdjustment,
  findGetParameter,
  htmlEncode,
  htmlDecode,
  htmlEncodeByRegExp,
  htmlDecodeByRegExp,
  getRefreshChasBalanceStatus,
  getRefreshMedisaveBalanceStatus,
  calculateAmount,
  removeFields,
  commonDataReaderTransform,
  commonDataWriterTransform,
  locationQueryParameters,
  enableTableForceRender,
  generateHashCode,
  stringToBytesFaster,
  checkAuthoritys,
  getModuleSequence,
  getTranslationValue,
  getMappedVisitType,
  ableToViewByAuthority,
  getNameWithTitle,
  showCurrency,
  // toUTC,
  // toLocal,
}
