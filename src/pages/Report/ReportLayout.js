import React, { useState } from 'react'
import { connect } from 'dva'
// printjs
import printJS from 'print-js'
// ant design
import { Dropdown, Menu } from 'antd'
// material ui
import { Divider } from '@material-ui/core'
import SolidExpandMore from '@material-ui/icons/ArrowDropDown'
import Print from '@material-ui/icons/Print'
// common components
import { Button, CardContainer } from '@/components'
import { LoadingWrapper } from '@/components/_medisys'
import { arrayBufferToBase64 } from '@/components/_medisys/ReportViewer/utils'
// services
import { getPDF, getExcel } from '@/services/report'
import { downloadFile } from '@/services/file'

const BodyWrapper = ({ children, simple }) =>
  simple ? (
    <React.Fragment>{children}</React.Fragment>
  ) : (
    <CardContainer hideHeader>{children}</CardContainer>
  )

const ReportLayoutWrapper = ({
  children,
  simple = false,
  loading = false,
  reportID = -1,
  loaded = false,
  fileName = 'Report',
  reportParameters = {},
  height,
  global,
}) => {
  const [
    isExporting,
    setIsExporting,
  ] = useState(false)

  const onExportPDFClick = async () => {
    setIsExporting(true)
    const result = await getPDF(reportID, reportParameters)
    if (result) {
      const fileExtensions = '.pdf'
      downloadFile(result, `${fileName}${fileExtensions}`)
    }
    setIsExporting(false)
  }

  const onExportExcelClick = async () => {
    setIsExporting(true)
    const result = await getExcel(reportID, reportParameters)
    if (result) {
      const fileExtensions = '.xls'
      downloadFile(result, `${fileName}${fileExtensions}`)
    }
    setIsExporting(false)
  }

  const onPrintClick = async () => {
    setIsExporting(true)
    const result = await getPDF(reportID, reportParameters)
    if (result) {
      const base64Result = arrayBufferToBase64(result)
      printJS({ printable: base64Result, type: 'pdf', base64: true })
    }
    setIsExporting(false)
  }
  let loadingText = `Generating ${fileName}...`
  if (isExporting) loadingText = `Exporting ${fileName}...`
  const maxHeight = !height ? '100%' : height - 200
  return (
    <LoadingWrapper loading={loading || isExporting} text={loadingText}>
      <BodyWrapper simple={simple}>
        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          <Dropdown
            disabled={!loaded || isExporting}
            overlay={
              <Menu>
                <Menu.Item
                  key='export-pdf'
                  disabled={!loaded || isExporting}
                  id='pdf'
                  onClick={onExportPDFClick}
                >
                  <span>PDF</span>
                </Menu.Item>
                <Menu.Item
                  key='export-excel'
                  disabled={!loaded || isExporting}
                  id='Excel'
                  onClick={onExportExcelClick}
                >
                  <span>Excel</span>
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button color='info' size='sm' disabled={!loaded || isExporting}>
              <SolidExpandMore />
              Export As
            </Button>
          </Dropdown>
          <Button
            color='info'
            size='sm'
            justIcon
            disabled={!loaded || isExporting}
            onClick={onPrintClick}
          >
            <Print />
          </Button>
        </div>
        <Divider style={{ marginBottom: 8 }} />
        <div style={{ overflow: 'auto', maxHeight, padding: 8 }}>
          {children}
        </div>
      </BodyWrapper>
    </LoadingWrapper>
  )
}

export default connect(({ global }) => ({ global }))(ReportLayoutWrapper)
