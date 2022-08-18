import moment from 'moment'
import { commonDataReaderTransform } from '@/utils/utils'
import { dateFormatLong } from '@/components'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
import $ from 'jquery'

const setComment = (
  comment,
  style = {
    height: 0,
    display: 'inline-block',
    fontFamily: 'MS PGothic',
    fontSize: '14.6px',
  },
  maxLineWidth = 700,
  minLineLength = 40,
) => {
  if (!comment || !comment.trim().length) return ''
  $('#div_text_width').css(style)
  let newComment = ''
  const comments = comment.split('\n')
  comments.forEach(item => {
    $('#div_text_width').html(item)
    //if less than one line, return comment
    if ($('#div_text_width').width() <= maxLineWidth) {
      newComment = item
    } else {
      let startIndex = 0
      let subLength = minLineLength
      while (startIndex + subLength <= item.length) {
        $('#div_text_width').html(item.substr(startIndex, subLength))
        if ($('#div_text_width').width() <= maxLineWidth) {
          subLength += 1
        } else {
          if (newComment === '') {
            newComment = item.substr(startIndex, subLength - 1)
          } else {
            newComment += '\n' + item.substr(startIndex, subLength - 1)
          }
          startIndex += subLength - 1
          subLength = minLineLength
          $('#div_text_width').html(
            item.substr(startIndex, item.length - startIndex),
          )
          //if remain line less than one line, return comment
          if ($('#div_text_width').width() <= maxLineWidth) {
            newComment +=
              '\n' + item.substr(startIndex, item.length - startIndex)
            break
          }
        }
      }
    }
  })
  $('#div_text_width').html('')
  return newComment
}

export const getMedicalCheckupReportPayload = data => {
  const {
    patientInfo = [],
    basicExamination = [],
    visualAcuity = [],
    intraocularPressure = [],
    audiometry = [],
    individualComment = [],
    summaryComment = [],
    labTestPanel = [],
    reportContext = [],
    reportingDoctor = [],
  } = data

  let newIndividualComment = []
  individualComment.forEach(item => {
    const {
      groupFK,
      groupJapaneseName,
      groupEnglishName,
      groupDescription,
      groupSortOrder,
      code,
      japaneseName = '',
      englishName = '',
      japaneseComment = '',
      englishComment = '',
      sortOrder,
    } = item
    const jpnComments = japaneseComment.split('\n')
    const enComments = englishComment.split('\n')
    jpnComments.forEach((jpnComment, index) => {
      if (hasValue(jpnComment) && jpnComment.trim().length) {
        newIndividualComment.push({
          groupFK,
          groupJapaneseName,
          groupEnglishName,
          groupDescription,
          groupSortOrder,
          code,
          japaneseName,
          englishName,
          sortOrder,
          language: 'JP',
          comment: jpnComment,
          itemSortOrder: index,
        })
      }
    })
    enComments.forEach((enComment, index) => {
      if (hasValue(enComment) && enComment.trim().length) {
        newIndividualComment.push({
          groupFK,
          groupJapaneseName,
          groupEnglishName,
          groupDescription,
          groupSortOrder,
          code,
          japaneseName,
          englishName,
          sortOrder,
          language: 'EN',
          comment: enComment,
          itemSortOrder: index,
        })
      }
    })
  })

  const printData = {
    PatientInfo: patientInfo.map(p => ({
      ...p,
      patientAge: p.patientAge ? `${p.patientAge} yrs` : '',
      patientDOB: p.patientDOB
        ? moment(p.patientDOB).format(dateFormatLong)
        : '',
      visitDate: p.visitDate ? moment(p.visitDate).format(dateFormatLong) : '',
      currentDate: p.currentDate
        ? moment(p.currentDate).format(dateFormatLong)
        : '',
      lastDate: p.lastDate ? moment(p.lastDate).format(dateFormatLong) : '',
      beforeLastDate: p.beforeLastDate
        ? moment(p.beforeLastDate).format(dateFormatLong)
        : '',
    })),
    BasicExamination: basicExamination,
    VisualAcuity: visualAcuity,
    IntraocularPressure: intraocularPressure,
    Audiometry: audiometry,
    IndividualComment: newIndividualComment,
    SummaryComment: summaryComment.map(item => ({
      ...item,
      japaneseComment: setComment(
        item.japaneseComment,
        {
          height: 0,
          display: 'inline-block',
          fontFamily: 'MS PGothic',
          fontSize: '14.6px',
        },
        665,
        40,
      ),
    })),
    LabTestPanel: labTestPanel.map(item => ({
      ...item,
      japaneseName: item.japaneseName || '',
    })),
    ReportingDoctor: reportingDoctor.map(x => ({
      ...x,
      japaneseName: x.japaneseName || '',
    })),
    ReportContext: reportContext.map(o => {
      const {
        customLetterHeadHeight = 0,
        isDisplayCustomLetterHead = false,
        standardHeaderInfoHeight = 0,
        isDisplayStandardHeader = false,
        footerInfoHeight = 0,
        isDisplayFooterInfo = false,
        footerDisclaimerHeight = 0,
        isDisplayFooterInfoDisclaimer = false,
        ...restProps
      } = o
      return {
        customLetterHeadHeight,
        isDisplayCustomLetterHead,
        standardHeaderInfoHeight,
        isDisplayStandardHeader,
        footerInfoHeight,
        isDisplayFooterInfo,
        footerDisclaimerHeight,
        isDisplayFooterInfoDisclaimer,
        ...restProps,
      }
    }),
  }
  const payload = [
    {
      ReportId: 93,
      Copies: 1,
      ReportData: JSON.stringify({
        ...commonDataReaderTransform(printData),
      }),
    },
  ]

  return payload
}

export const getVisitOrderTemplateContent = visitOrderTemplateDetails => {
  let indicate
  if (visitOrderTemplateDetails) {
    const temp = JSON.parse(visitOrderTemplateDetails)
    indicate = {
      indicateString: temp.visitPurpose,
      removedItemString: (temp.removedItems || []).join(' - '),
      newItemString: (temp.addedItems || []).join(' + '),
    }
  }
  if (!indicate) return

  const indicateStringContent = (
    <span>
      {indicate?.indicateString ? (
        <span>{indicate.indicateString}</span>
      ) : (
        <span></span>
      )}
      {indicate?.removedItemString ? (
        <span style={{ color: '#FF0000' }}>
          {` - ${indicate.removedItemString}`}
        </span>
      ) : (
        <span></span>
      )}
      {indicate?.newItemString ? (
        <span style={{ color: '#389e0d' }}>
          {` + ${indicate.newItemString}`}
        </span>
      ) : (
        <span></span>
      )}
    </span>
  )

  return indicateStringContent
}
