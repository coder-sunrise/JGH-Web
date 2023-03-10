import request, { axiosRequest } from '@/utils/request'

const url = '/api/files'

// sample payload
// {
//   "fileName": "f2",
//   "fileExtension": "jpg",
//   "fileCategoryFK": "1",
//   "fileSize": "11111",
//   "content": "{base64 content}",
//   "IsConfirmed": "false"
// }
export const uploadFile = async payload => {
  // console.log(payload)
  const response = await request(url, {
    method: 'POST',
    data: JSON.stringify(payload),
  })
  // console.log(response)
  return response
}

export const getFileByFileID = async fileID => {
  const response = await axiosRequest(`${url}/${fileID}`, {
    method: 'GET',
    responseType: 'arraybuffer',
  })
  return response
}

export const downloadFile = async (data, fileName) => {
  try {
    const dataUrl = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = dataUrl
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    return true
  } catch (error) {
    console.log({ error })
    return false
  }
}

export const downloadAttachment = async attachment => {
  try {
    const { fileIndexFK, id } = attachment
    const response = await getFileByFileID(!fileIndexFK ? id : fileIndexFK)

    const { data, status } = response
    if (status >= 200 && status < 300)
      return downloadFile(data, attachment.fileName)
  } catch (error) {
    console.log({ error })
  }
}

export const getImagePreview = async id => {
  try {
    const response = await getFileByFileID(id)

    const { data, status } = response
    if (status >= 200 && status < 300) return response
  } catch (error) {
    console.log({ error })
  }
  return false
}

export const deleteFileByFileID = async fileID => {
  const response = await request(`${url}/${fileID}`, { method: 'DELETE' })
  return response
}

export const getFileContentByFileID = async fileID => {
  const response = await axiosRequest(`${url}/Content/${fileID}`, {
    method: 'GET',
  })
  return response
}
