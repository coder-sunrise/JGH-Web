import { stringify } from 'qs'
import request, { download } from '@/utils/request'
import { convertToQuery, commonDataWriterTransform } from '@/utils/utils'
import { REPORT_FILE_NAME } from '@/utils/constants'
// static data
// import { QueueListingDummyData } from '@/pages/Report/dummyData'
const reportContextUrl = '/api/Reports/context'

export const getReportContext = async reportID => {
  return request(`${reportContextUrl}/${reportID}`, {
    method: 'GET',
  })
}

export const getRawData = async (reportID, payload) => {
  const baseRawDataURL = '/api/reports/datas'
  return request(`${baseRawDataURL}/${reportID}`, {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    data: {
      reportParameters: JSON.stringify({
        ...commonDataWriterTransform(payload),
      }),
    },
  })
}

export const getPDF = async (reportID, payload) => {
  const baseURL = '/api/reports'
  return request(`${baseURL}/${reportID}`, {
    method: 'GET',
    xhrFields: {
      responseType: 'arraybuffer',
    },
    body: stringify({
      reportFormat: 'Pdf',
      reportParameters: JSON.stringify({
        ...commonDataWriterTransform(payload),
      }),
    }),
  })
}

export const getPDFFromDocument = async payload => {
  const baseURL = '/api/reports'
  return request(`${baseURL}/DocumentToPDF`, {
    method: 'POST',
    xhrFields: {
      responseType: 'arraybuffer',
    },
    body: payload,
  })
}

export const getUnsavedPDF = async (reportID, payload) => {
  const baseURL = '/api/reports'
  return request(`${baseURL}/${reportID}?ReportFormat=pdf`, {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    xhrFields: {
      responseType: 'arraybuffer',
    },
    data: {
      reportContent: payload,
    },
  })
}

export const getExcel = async (reportID, payload) => {
  const baseURL = '/api/reports'
  return request(`${baseURL}/${reportID}`, {
    method: 'GET',
    xhrFields: {
      responseType: 'arraybuffer',
    },
    body: stringify({
      reportFormat: 'Excel',
      reportParameters: JSON.stringify({
        ...commonDataWriterTransform(payload),
      }),
    }),
  })
}

export const getCsv = async (reportID, payload, tableName) => {
  const baseURL = '/api/reports'
  return request(`${baseURL}/${reportID}`, {
    method: 'GET',
    xhrFields: {
      responseType: 'arraybuffer',
    },
    body: stringify({
      reportFormat: 'CSV',
      reportParameters: JSON.stringify({
        ...commonDataWriterTransform(payload),
      }),
      tableName,
    }),
  })
}

export const exportPdfReport = async (reportID, payload, subject) => {
  const baseURL = '/api/reports'
  const _subject = subject || REPORT_FILE_NAME[reportID]

  return download(
    `${baseURL}/${reportID}?reportFormat=pdf&ReportParameters=${JSON.stringify(
      payload,
    )}`,
    {
      subject:
        (_subject || 'Report') + `${payload._key ? '_' + payload._key : ''}`,
      type: 'pdf',
    },
  )
}

export const exportExcelReport = async (reportID, payload) => {
  const baseURL = '/api/reports'
  return download(
    `${baseURL}/${reportID}?reportFormat=Excel&ReportParameters=${JSON.stringify(
      commonDataWriterTransform(payload),
    )}`,
    {
      subject:
        (REPORT_FILE_NAME[reportID] || 'Report') +
        `${payload._key ? '_' + payload._key : ''}`,
      type: 'xls',
    },
  )
}

export const getPatientListingReport = async payload => {
  /* use this when API is ready to return raw data */
  const url = '/api/reports/2'
  return request(url, {
    method: 'GET',
    body: convertToQuery(
      { reportParameters: commonDataWriterTransform(payload) },
      ['reportParameters'],
    ),
  })
}

export const exportUnsavedReport = (
  reportID,
  reportFormat = 'PDF',
  reportContent,
  subject,
) => {
  const _subject = subject || REPORT_FILE_NAME[reportID]
  let type = 'PDF'
  if (reportFormat === 'Excel') type = 'xlsx'
  download(
    `/api/Reports/${reportID}?ReportFormat=${reportFormat}`,
    {
      subject: _subject,
      type: type,
    },
    {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      data: {
        reportContent,
      },
    },
  )
}

export const exportDocumentReport = (reportID, reportContent, subject) => {
  const _subject = subject || REPORT_FILE_NAME[reportID]
  let type = 'PDF'
  download(
    `/api/Reports/DocumentToPDF`,
    {
      subject: _subject,
      type: type,
    },
    {
      method: 'POST',
      body: reportContent,
    },
  )
}

export const postPDF = async (reportID, payload) => {
  const baseURL = '/api/reports'
  let response = request(`${baseURL}/${reportID}`, {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    xhrFields: {
      responseType: 'arraybuffer',
    },
    data: {
      reportContent: JSON.stringify(payload),
    },
  })
  return response
}
