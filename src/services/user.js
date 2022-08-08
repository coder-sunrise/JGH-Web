import { stringify } from 'qs'
import request from '@/utils/request'

const userProfileURL = '/api/UserProfile'

export async function query() {
  return request('/api/users')
}

export async function queryCurrent() {
  return request('/api/userprofile/current')
}

export const changeCurrentUserPassword = payload =>
  request(`${userProfileURL}/ChangeCurrentUserPassword`, {
    method: 'PUT',
    body: payload,
  })

export const changeUserPassword = payload =>
  request(`${userProfileURL}/ChangePassworByUserId`, {
    method: 'PUT',
    body: payload,
  })

export const resetToDefaultPassword = payload =>
  request(`${userProfileURL}/ResetToDefaultPassworByUserName`, {
    method: 'POST',
    data: stringify(payload),
    contentType: 'application/x-www-form-urlencoded',
  })

export const getOTP = async payload =>
  request(
    `${userProfileURL}/generateResetPasswordCode`,
    {
      method: 'POST',
      data: stringify(payload),
      contentType: 'application/x-www-form-urlencoded',
    },
    true,
    false,
  )

export const resetPassword = payload =>
  request(`${userProfileURL}/ResetPassword`, {
    method: 'POST',
    data: stringify(payload),
    contentType: 'application/x-www-form-urlencoded',
  })

export const saveUserPreference = async payload => {
  if (!payload.List) {
    payload = { List: [payload] }
  }
  const r = await request(`${userProfileURL}/SaveUserPreference`, {
    method: 'POST',
    body: payload,
    suppressException: true,
  })
  return r
}

export const getUserPreference = async payload => {
  const r = await request(`${userProfileURL}/GetUserPreference/${payload}`, {
    method: 'GET',
  })
  return r
}
