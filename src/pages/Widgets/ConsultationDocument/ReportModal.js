import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { CommonModal } from '@/components'
import { ReportViewer } from '@/components/_medisys'
import { REPORT_TYPE } from '@/utils/constants'

const ReportModal = ({ dispatch, report }) => {
  const { reportTypeID, reportParameters } = report
  const [showReport, setShowReport] = useState(false)

  const [reportConfig, setReportConfig] = useState({})

  const resetReportParameters = () => {
    dispatch({
      type: 'report/reset',
    })
  }

  const toggleReport = () => {
    if (showReport) {
      resetReportParameters()
    }
    setShowReport(!showReport)
  }

  useEffect(() => {
    if (reportTypeID) {
      setShowReport(true)
    }

    const { isSaved, ...restParams } = reportParameters
    if (isSaved) {
      setReportConfig({
        reportParameters: { ...restParams },
        unsavedReport: false,
        isFromDocument: reportParameters.isFromDocument,
      })
    } else {
      setReportConfig({
        reportContent: restParams.reportContent,
        unsavedReport: true,
        isFromDocument: reportParameters.isFromDocument,
      })
    }
  }, [reportTypeID, reportParameters])

  return (
    <React.Fragment>
      {/* <ReportViewer /> */}
      <CommonModal
        open={showReport}
        onClose={toggleReport}
        title={REPORT_TYPE[reportTypeID]}
        maxWidth='lg'
      >
        <ReportViewer
          showTopDivider={false}
          reportID={reportTypeID}
          {...reportConfig}
        />
      </CommonModal>
    </React.Fragment>
  )
}

export default connect(({ report }) => ({ report }))(ReportModal)
