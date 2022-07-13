import React, { memo, useState, useEffect } from 'react'
// printjs
import printJS from 'print-js'
// react pdf
import { Document, Page, pdfjs } from 'react-pdf'
// ant design
import { Dropdown, Menu, InputNumber } from 'antd'
// material ui
import { CircularProgress, Divider, withStyles } from '@material-ui/core'
import ArrowLeft from '@material-ui/icons/ArrowLeft'
import ArrowRight from '@material-ui/icons/ArrowRight'
import ZoomIn from '@material-ui/icons/ZoomIn'
import ZoomOut from '@material-ui/icons/ZoomOut'
import Down from '@material-ui/icons/ArrowDropDown'
import Print from '@material-ui/icons/Print'
// common component
import { Button, Danger, GridContainer, GridItem } from '@/components'
import { LoadingWrapper } from '@/components/_medisys'
// utils
import {
  arrayBufferToBase64,
  BASE64_MARKER,
  minScale,
  maxScale,
  defaultScreenSize,
} from './utils'
// services
import {
  getPDF,
  getUnsavedPDF,
  exportUnsavedReport,
  exportPdfReport,
  exportExcelReport,
  exportDocumentReport,
  getPDFFromDocument,
} from '@/services/report'
// styles
import styles from './styles'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

const ReportViewer = ({
  reportID,
  reportParameters = {},
  reportContent = '',
  isFromDocument = false,
  unsavedReport = false,
  classes,
  showTopDivider = true,
  defaultScale = 1.75,
}) => {
  const [exporting, setExporting] = useState(false)
  const [scale, setScale] = useState(defaultScale)
  const [screenSize, setScreenSize] = useState(defaultScreenSize)

  const [pdfData, setPdfData] = useState(undefined)

  const [pageNumber, setPageNumber] = useState(1)

  const [numOfPages, setNumOfPages] = useState(1)

  const [showError, setShowError] = useState(false)

  useEffect(() => {
    setScreenSize({ height: window.innerHeight, width: window.innerWidth })
    // fetchReport().then((result) => setPdfData(result))
    if (isFromDocument) {
      getPDFFromDocument(reportContent).then(result => {
        if (result) {
          const base64Result = arrayBufferToBase64(result)
          setPdfData(base64Result)
        } else {
          setShowError(true)
        }
      })
    } else {
      if (!unsavedReport) {
        getPDF(reportID, reportParameters).then(result => {
          if (result) {
            const base64Result = arrayBufferToBase64(result)
            setPdfData(base64Result)
          } else {
            setShowError(true)
          }
        })
      } else {
        getUnsavedPDF(reportID, reportContent).then(result => {
          if (result) {
            const base64Result = arrayBufferToBase64(result)
            setPdfData(base64Result)
          } else {
            setShowError(true)
          }
        })
      }
    }
    return () => {
      // clean up, invoke on unmounting
      setPdfData(undefined)
      setShowError(false)
    }
  }, [])

  const zoom = type => () => {
    const newScale = type === 0 ? scale + 0.25 : scale - 0.25
    if (newScale > maxScale || newScale < minScale) return

    setScale(newScale)
  }

  const changePage = offset => setPageNumber(pageNumber + offset)

  const onDocumentLoadSuccess = ({ numPages }) => setNumOfPages(numPages)

  const onPreviousClick = () => changePage(-1)

  const onNextClick = () => changePage(1)

  const onPrintClick = () =>
    printJS({
      printable: pdfData,
      type: 'pdf',
      base64: true,
    })

  const onExportClick = async ({ key }) => {
    setExporting(true)
    if (isFromDocument) {
      exportDocumentReport(reportID, reportContent)
    } else {
      if (unsavedReport) {
        const reportFormat = key === 'export-excel' ? 'Excel' : 'PDF'
        await exportUnsavedReport(reportID, reportFormat, reportContent)
        setExporting(false)
        return true
      }
      if (key === 'export-excel') {
        await exportExcelReport(reportID, reportParameters)
        // fileExtension = '.xls'
      } else {
        await exportPdfReport(reportID, reportParameters)
      }
    }
    setExporting(false)
    return true
  }

  const onPageNumberChange = value => {
    if (value <= numOfPages && value > 0) setPageNumber(value)
  }

  const handleDoubleClick = event => {
    event.stopPropagation()
  }

  return (
    <div className={classes.root} onDoubleClick={handleDoubleClick}>
      <LoadingWrapper loading={exporting} text='Exporting report...'>
        {showTopDivider && <Divider className={classes.divider} />}

        <GridContainer className={classes.reportControl}>
          <GridItem md={3}>
            <Dropdown
              disabled={!pdfData}
              overlay={
                <Menu onClick={onExportClick}>
                  <Menu.Item key='export-pdf' id='PDF'>
                    <span>PDF</span>
                  </Menu.Item>
                  {!isFromDocument && (
                    <Menu.Item key='export-excel' id='Excel'>
                      <span>Excel</span>
                    </Menu.Item>
                  )}
                </Menu>
              }
              trigger={['click']}
            >
              <Button color='info' size='sm' disabled={!pdfData}>
                <Down />
                Export As
              </Button>
            </Dropdown>
            <Button
              onClick={onPrintClick}
              size='sm'
              justIcon
              color='info'
              disabled={!pdfData}
            >
              <Print />
            </Button>
          </GridItem>
          <GridItem md={6} className={classes.midButtonGroup}>
            <Button
              size='sm'
              justIcon
              color='primary'
              className={classes.previousPageBtn}
              disabled={!pdfData || pageNumber <= 1}
              onClick={onPreviousClick}
            >
              <ArrowLeft />
            </Button>
            <div className={classes.pageNumber}>
              <span>Page: </span>
              <InputNumber
                min={1}
                max={numOfPages}
                value={pageNumber}
                onChange={onPageNumberChange}
              />
              <span> of {numOfPages}</span>
            </div>
            <Button
              onClick={onNextClick}
              size='sm'
              justIcon
              color='primary'
              disabled={!pdfData || pageNumber >= numOfPages}
            >
              <ArrowRight />
            </Button>
          </GridItem>
          <GridItem md={3} className={classes.rightButtonGroup}>
            <Button
              color='primary'
              // size='sm'
              justIcon
              disabled={!pdfData || scale === maxScale}
              onClick={zoom(0)}
            >
              <ZoomIn />
            </Button>
            <Button
              color='primary'
              // size='sm'
              justIcon
              disabled={!pdfData || scale === minScale}
              onClick={zoom(1)}
            >
              <ZoomOut />
            </Button>
          </GridItem>
        </GridContainer>
        <div className={classes.reportContainerWrapper}>
          <div className={classes.reportContainer}>
            {pdfData && (
              <Document
                // renderMode='svg'
                file={pdfData ? `${BASE64_MARKER}${pdfData}` : ''}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<CircularProgress />}
              >
                <Page
                  className={classes.page}
                  pageNumber={pageNumber}
                  width={screenSize - 200}
                  height={screenSize - 200}
                  scale={scale}
                />
              </Document>
            )}
            {!pdfData && !showError && (
              <React.Fragment>
                <CircularProgress />
                <h5>Loading report...</h5>
              </React.Fragment>
            )}
            {showError && (
              <Danger>
                <h3 style={{ fontWeight: 500 }}>Failed to load report</h3>
              </Danger>
            )}
          </div>
        </div>
      </LoadingWrapper>
    </div>
  )
}

export default memo(withStyles(styles, { name: 'ReportViewer' })(ReportViewer))
