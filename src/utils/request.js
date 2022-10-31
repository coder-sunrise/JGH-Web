import axios from 'axios'

import hash from 'hash.js'
import $ from 'jquery'
import { notification } from '@/components'
import { checkIsCodetableAPI, refreshCodetable } from '@/utils/codetable'
import { sendNotification } from '@/utils/realtime'
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from '@/utils/constants'
import {
  isAntdPro,
  updateLoadingState,
  commonDataWriterTransform,
  commonDataReaderTransform,
} from './utils'

// export const baseUrl = 'http://localhost:9300'
// export const baseUrl = 'http://localhost/SEMR_V2'
export const baseUrl = process.env.url

const uatUrl = 'https://semr2uat2010.emr.com.sg'
const localApiUrl = 'http://localhost:55314'
let dynamicURL = baseUrl
// let dynamicURL = 'http://semr2-dev-api.ap-southeast-1.elasticbeanstalk.com'
// if (process.env.NODE_ENV === 'development')
//   dynamicURL = 'http://localhost:55314'

// const codeMessage = {
//   200: '服务器成功返回请求的数据。',
//   201: '新建或修改数据成功。',
//   202: '一个请求已经进入后台排队（异步任务）。',
//   204: '删除数据成功。',
//   400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
//   401: 'User session has expired. Please logout and login to refresh session.',
//   403: '用户得到授权，但是访问是被禁止的。',
//   404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
//   406: '请求的格式不可得。',
//   410: '请求的资源被永久删除，且不会再得到的。',
//   422: '当创建一个对象时，发生一个验证错误。',
//   500: 'Server error. Please contact administrator',
//   502: '网关错误。',
//   503: '服务不可用，服务器暂时过载或维护。',
//   504: '网关超时。',
// }

const codeMessage = {
  0: 'Service not available',
  200: 'Success',
  201: 'Created',
  202: 'Request in queue',
  204: 'Deleted',
  400: 'An error occured',
  401: 'User session has expired. Please logout and login to refresh session.',
  403: 'Request received but user is unauthorized for such request',
  404: 'Method not allowed',
  406: 'Not Acceptable',
  410: 'Hard delete',
  422: 'Verification error',
  500: 'Server error. Please contact administrator',
  502: 'Bad Gateway',
  503: 'Server overloadded',
  504: 'Request timeout',
}

const _errorMessageMapping = {
  V00031: 'Invalid new password format',
}

export function updateAPIType(type) {
  if (type === 'PROD') {
    dynamicURL = baseUrl
  } else {
    dynamicURL = 'localhost:8000'
  }
}

const showErrorNotification = (header, message) => {
  notification.destroy()
  notification.error({
    message: (
      <div>
        <h4>{header}</h4>
        <p>{message}</p>
      </div>
    ),
    duration: 15,
  })
}

export const axiosRequest = async (
  url,
  options = { contentType: undefined },
  headers = {},
) => {
  let result = {}
  try {
    const token = localStorage.getItem('token')
    const defaultContentType = 'application/json'
    const { contentType, ...option } = options
    const headerConfig = {
      headers: {
        'Content-Type':
          contentType !== undefined ? contentType : defaultContentType,
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
    const apiUrl = dynamicURL + url

    result = await axios({
      url: apiUrl,
      ...option,
      ...headerConfig,
    }).then(response => {
      const { data, status } = response

      if (status >= 200 && status < 300) {
        const { data: nestedData } = data
        return { status, data: nestedData !== undefined ? nestedData : data }
      }
      return status
    })
  } catch (error) {
    const {
      response = {
        data: {},
        status: -1,
        statusText: '',
      },
    } = error
    console.log('axios error', response)
    const {
      data = { message: 'An error occured' },
      status,
      statusText,
    } = response

    status === 401
      ? showErrorNotification('', 'Session Expired')
      : showErrorNotification('', data.message)

    if (status === 401 && !localStorage.getItem('debug')) {
      /* eslint-disable no-underscore-dangle */
      notification.error('Not Authorized')
      // window.g_app._store.dispatch({
      //   type: 'login/logout',
      // })
      return false
    }

    return response
  }
  return result
}

const logError = (showNotification, payload) => {
  if (showNotification) {
    notification.error({
      ...payload,
    })
    const { plainString, requestId } = payload
    const { dispatch, getState } = window.g_app._store

    if (getState) {
      const {
        user = {
          data: {
            clinicianProfile: {
              name: '',
            },
          },
        },
      } = getState()
      const notificationPayload = {
        type: NOTIFICATION_TYPE.ERROR,
        status: NOTIFICATION_STATUS.ERROR,
        message: plainString,
        requestId,
        sender: user.data.clinicianProfile.name,
        senderId: user.data.id,
        timestamp: Date.now(),
      }

      if (dispatch) {
        dispatch({
          type: 'header/appendNotification',
          payload: notificationPayload,
        })
      }
    }
  }
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [option] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
const request = (
  url,
  option,
  showNotification = true,
  // redirectToLoginAfterFail = true,
) => {
  const options = {
    expirys: true,
    ...option,
  }
  /**
   * Produce fingerprints based on url and parameters
   * Maybe url has the same parameters
   */
  const fingerprint = url + (options.body ? JSON.stringify(options.body) : '')
  const hashcode = hash
    .sha256()
    .update(fingerprint)
    .digest('hex')
  let newUrl = url

  // const token = 'CfDJ8NIVLAbYTRpOk2IDmBBb9nQ09BNeoyGSs_wHHE4tfcY_d_w5lgvxw6gKmNhohjJ3vpZohASGm5XG997uWe1fXzuzLYtRzoDTmq7d40T-VSaQkUc2beqjFQNqL4D2xhgJC5-cPIGRGpuCXu1BbmEYThuk89P4aHiKA5WoZy4TNUVaUchuNHfi69qaqgCqWPhi1AMYpRf2isqFAt-dIkk0Z-yXcdFLNoylnQSVPjMtF5ahmWD0_ix-qkM3U15klptxPENvmB9-7gVCp5n-bS9YibPT-rWgudAmgVv5_LzG8OKtUKWHY_CNvoGeqgEKq4GojzGMFzHTl5DHeIlq6bb6YLple9unPtWJylgOgq9SdmiIzHAa5zkNCVaXTpEvNVrA0rFdB4zgWJOy-uDwb6qTGAhG_qqmICwITsTKe6DA7KYcZUP1kUERGoPAK3AtzsUl30aRaVzUo1VtfRy1hWe7lBE0K_7EQxrga7I871jO8s2vmdWIdUEw807vjxvuf7s0km5xbmEn-Watlpqbuken-ZzMGkXJju65mYB2_jm6NfqHDvSRmUB6Sc3SLWTukH3xsC8xIFw71bwT8KLy8UyAVCC7KGI1lhPg3MnIXVeeyhL2AT_-CWsg26h7IKfUmw_HP591Tr046-sDNukuqJwmjUpky2eU8kF6AeHxBm9fPtWQ79WFvO4vi2bxrmz29e-9NmbRd3WwLzivRIFSYRNIJhGyY5EPlJ01Cn2WbWr-hAKhqmucB66KxTtDcnMuxFeJ2EnxQhLtUEgGprgQ8LSqoJGV9BPEbkDcn_4XyYqWoqLAILE1Z2jNCo5rU-e0o9ya9Pwwhq0sgrQkiXAMAVsCvBiNPSBkSq-AJbejB3YXB3EY3Z_FmdFwO_1fgpJeoWkTKD4dYBEDHHgxHBOEGJRc9-chkYJfeFSX93iqD2VG6K68'
  const token = localStorage.getItem('token')
  const defaultOptions = {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const newOptions = { ...defaultOptions, ...options }
  if (
    newOptions.method === 'POST' ||
    newOptions.method === 'PUT' ||
    newOptions.method === 'DELETE'
  ) {
    if (!(newOptions.body instanceof FormData)) {
      //   newOptions.headers = {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json; charset=utf-8',
      //     ...newOptions.headers,
      //   }
      newOptions.body = JSON.stringify(
        commonDataWriterTransform(newOptions.body),
      )

      // } else {
      //   // newOptions.body is FormData
      //   newOptions.headers = {
      //     Accept: 'application/json',
      //     ...newOptions.headers,
      //   }
    }
  } else if (newOptions.method === 'GET' || !newOptions.method) {
    // if (search) {
    //   newUrl += `?${queryString.stringify(newOptions.data)}`
    // }
  }
  if (newOptions.data) {
    newOptions.data = commonDataWriterTransform(newOptions.data)
  }
  // const expirys = options.expirys && 60
  // // options.expirys !== false, return the cache,
  // if (options.expirys !== false) {
  //   console.log('options.expirys', options)
  //   const cached = sessionStorage.getItem(hashcode)
  //   const whenCached = sessionStorage.getItem(`${hashcode}:timestamp`)
  //   if (cached !== null && whenCached !== null) {
  //     const age = (Date.now() - whenCached) / 1000
  //     if (age < expirys) {
  //       const response = new Response(
  //         new Blob([
  //           cached,
  //         ]),
  //       )
  //       return response.json()
  //     }
  //     sessionStorage.removeItem(hashcode)
  //     sessionStorage.removeItem(`${hashcode}:timestamp`)
  //   }
  // }
  // const isProd = process.env.NODE_ENV === 'production'
  // if (isProd) url = `/prod${url}`
  // if (options.uat) console.log(url)
  if (
    ['/api/fake_chart_data', '/api/fake_list?', '/api/currentUser'].indexOf(
      url,
    ) < 0
  ) {
    newUrl = dynamicURL + newUrl
  }
  const requestTimeoutInMs = 120000
  try {
    let r = $.when(
      $.ajax({
        timeout: requestTimeoutInMs,
        ...newOptions,
        url: newUrl,
        type: newOptions.method,
        crossDomain: true,
        cache: true,
        data: newOptions.data || newOptions.body,
        beforeSend: (xhr /* , settings */) => {
          const defaultContentType = 'application/json; charset=utf-8'
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.setRequestHeader('Accept', 'application/json')
          xhr.setRequestHeader(
            'Content-Type',
            options.contentType || defaultContentType,
          )
          // console.time(newUrl)
        },
      }),
    )
      // fetch(newUrl, newOptions)
      // .then(checkStatus)
      // .then((response) => cachedSave(response, hashcode))
      // .then((response) => {
      //   // DELETE and 204 do not return data by default
      //   // using .json will report an error.
      //   if (newOptions.method === 'DELETE' || response.status === 204) {
      //     return response.text()
      //   }
      //   console.log(response)
      //   return response.json()
      // })
      .then((response, s, xhr) => {
        // console.log(response, s, xhr)
        console.timeEnd(newUrl)
        if (typeof response === 'object') {
          commonDataReaderTransform(response, null, options.keepNull)
        }
        const { options: opts = {} } = options
        // console.log(response, s, xhr)
        // console.log(response, status, xhr)
        const { statusText, status } = xhr

        if (status >= 200 && status < 300) {
          // if api is a codetable, need to refresh store
          if (newOptions.method === 'POST' || newOptions.method === 'PUT') {
            const isCodetableAPI = checkIsCodetableAPI(url)
            if (isCodetableAPI) refreshCodetable(url)
          }
          return response || status
        }
        let data = {}
        if (response) {
          data =
            options.fetchType === 'YQL'
              ? response.data.query.results.json
              : response.data
          if (data.message) {
            if (data.messageType === 4 && opts.error !== '') {
              showNotification && notification.error(opts.error || data.message)
            } else if (data.messageType === 3 && opts.warn !== '') {
              showNotification && notification.info(opts.warn || data.message)
            } else if (opts.success !== '') {
              showNotification &&
                notification.success(opts.success || data.message)
            }
          }
          notification.destroy()
        }

        return data
      })
      .catch((response, s, xhr) => {
        // console.log({ response, s, xhr })

        let msg
        let status
        let payload = {}
        if (response) {
          try {
            updateLoadingState()
            let returnObj = {
              title: codeMessage[response.status],
              requestId: response.responseJSON
                ? response.responseJSON.requestId
                : '',
            }

            let errorMsg = codeMessage[response.status]
            // const loginAndResetPasswordUrl = [
            //   '/connect/token',
            // ]
            if (
              // (response.status === 400 && token === null) ||
              response.status === 401 &&
              url !== '/connect/token'
            ) {
              window.g_app._store.dispatch({
                type: 'login/logout',
              })
              return false
            }

            if (s === 'timeout') {
              errorMsg = 'The request timeout'
            }
            if (response.status === 503) {
              errorMsg =
                'Service temporarily unavailable, please contact customer service'
            }
            let isJson = false
            // try {
            //   returnObj = response
            //   isJson = true
            // } catch (error) {}

            const errortext =
              returnObj.title ||
              returnObj.message ||
              returnObj.statusText ||
              errorMsg

            notification.destroy()
            if (response.responseJSON) {
              let overwriteMessage =
                _errorMessageMapping[response.responseJSON.status]

              if (
                overwriteMessage === _errorMessageMapping.V00031 &&
                url === '/api/ClinicianProfile'
              ) {
                overwriteMessage = 'Invalid password format'
              }

              const description =
                overwriteMessage ||
                response.responseJSON.message ||
                response.responseJSON.title

              // showNotification &&
              //   notification.error({
              //     description,
              //     duration: 15,
              //   })
              logError(showNotification, {
                description,
                duration: 15,
                plainString: description,
                requestId: response.responseJSON.requestId,
              })
            } else {
              // console.log('here')
              logError(showNotification, {
                message: (
                  <div>
                    <h4>{errortext}</h4>

                    {JSON.stringify(returnObj.errors || returnObj.responseJSON)}
                  </div>
                ),
                plainString: JSON.stringify(
                  returnObj.errors || returnObj.responseJSON,
                ),
                duration: 15,
                requestId: returnObj.requestId,
              })
              // showNotification &&
              //   notification.error({
              //     message: (
              //       <div>
              //         <h4>{errortext}</h4>

              //         {JSON.stringify(
              //           returnObj.errors || returnObj.responseJSON,
              //         )}
              //       </div>
              //     ),
              //     duration: 15,
              //   })
            }

            // const error = new Error(errortext)
            // error.isJson = isJson
            // error.name = response.status
            // error.response = response
            // throw error

            // const { data, statusText, responseText, responseJSON } = response
            // // console.log(response)
            // if (responseJSON) {
            //   payload = responseJSON
            // } else if (responseText && responseText.startsWith('{')) {
            //   payload = data || JSON.parse(responseText)
            // }
            // status = response.status
            // msg = payload.message || statusText
          } catch (error) {
            console.error(error)
            const errorMsg = error ? error.toString() : ''
            const exception = { success: false, status, errorMsg, payload }
            throw exception
          }
        } else {
          status = 600
          msg = 'Network Error'
        }
        // //console.log(options)
        if (options.suppressException) {
          return { success: false, status, message: msg, payload }
        }
        return false
        // const exception = { success: false, status, message: msg, payload }

        // throw exception
      })

    // .catch((e) => {
    //   console.log(e)
    //   const status = e.name
    //   if (!e.isJson) {
    //     if (status === 401) {
    //       // @HACK
    //       /* eslint-disable no-underscore-dangle */
    //       window.g_app._store.dispatch({
    //         type: 'login/logout',
    //       })
    //       return
    //     }
    //     // environment should not be used
    //     if (status === 403) {
    //       history.push('/exception/403')
    //       return
    //     }
    //     if (status <= 504 && status >= 500) {
    //       history.push('/exception/500')
    //       return
    //     }
    //     if (status >= 404 && status < 422) {
    //       history.push('/exception/404')
    //     }
    //   }
    // })
    // console.log({ r })
    return r
  } catch (error) {
    console.log(error)
  }
}
export const download = async (
  requestUrl,
  { subject = 'file', type = 'excel' },
  options,
) => {
  const data = await request(requestUrl, {
    xhrFields: {
      responseType: 'blob',
    },
    ...options,
  })
  if (data) {
    let a = document.createElement('a')
    let url = window.URL.createObjectURL(data)
    a.href = url
    a.download = `${subject}.${type}`
    document.body.append(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }
}

export default request
