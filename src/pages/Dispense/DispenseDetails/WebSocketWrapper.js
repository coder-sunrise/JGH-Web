import React from 'react'
import { history } from 'umi'
// common component
import { notification } from '@/components'
import withWebSocket from '@/components/Decorator/withWebSocket'
// utils
import { consultationDocumentTypes } from '@/utils/codes'
import { getReportContext, getRawData } from '@/services/report'
import service from '@/services/dispense'
import { REPORT_ID } from '@/utils/constants'
import { getAppendUrl } from '@/utils/utils'
import CONSTANTS from './constants'
import DispenseDetails from './index'

const { queryDrugLabelDetails, queryDrugLabelsDetails } = service
const WebSocketWrapper = ({
  handlePrint,
  selectedDrugs,
  selectedLanguage,
  sendingJob,
  onPrintRef,
  ...restProps
}) => {
  const withoutPrintPreview = [
    CONSTANTS.ALL_DRUG_LABEL,
    CONSTANTS.DRUG_LABEL,
    CONSTANTS.PATIENT_LABEL,
  ]

  const getDrugLabelDetails = (drugLabel, prescripationItem) => {
    const expiryDate = prescripationItem
      ? prescripationItem.expiryDate
      : undefined
    const batchNo =
      prescripationItem && Array.isArray(prescripationItem.batchNo)
        ? prescripationItem.batchNo[0]
        : prescripationItem.batchNo
    return {
      PatientName: drugLabel.patientName,
      PatientReferenceNo: drugLabel.patientReferenceNo,
      PatientAccountNo: drugLabel.patientAccountNo,
      DrugName: drugLabel.name,
      ConsumptionMethod: drugLabel.instruction,
      Precaution: drugLabel.precaution,
      IssuedDate: drugLabel.issueDate,
      ExpiryDate: expiryDate,
      UOM: drugLabel.dispenseUOM,
      Quantity: drugLabel.dispensedQuanity,
      BatchNo: batchNo,
      CurrentPage: drugLabel.currentPage.toString(),
      TotalPage: drugLabel.totalPage.toString(),
    }
  }

  const generateDrugLablePrintSource = async row => {
    const drugLabelDetails1 = await queryDrugLabelDetails(row.id)
    const { data } = drugLabelDetails1
    if (data && data.length > 0) {
      let drugLabelDetail = []
      drugLabelDetail = drugLabelDetail.concat(
        data.map(o => {
          return getDrugLabelDetails(o, row)
        }),
      )
      return drugLabelDetail
    }
    notification.warn({
      message: `No prescription found. Add prescription to print drug label.`,
    })
    return null
  }

  const generateDrugLablesPrintSource = async (
    visitID,
    prescriptions = [],
    packageItem = [],
    printAllDrugLabel = false,
  ) => {
    const drugLabelsDetails1 = await queryDrugLabelsDetails(visitID)
    const { data } = drugLabelsDetails1

    if (data && data.length > 0) {
      let drugLabelDetail = []
      const newdata = data.filter(
        x =>
          selectedDrugs.findIndex(
            value => value.id === x.id && (printAllDrugLabel || value.selected),
          ) > -1,
      )
      newdata.map(o => {
        let copy = selectedDrugs.find(x => x.id === o.id).no
        for (let no = 0; no < copy; no++) {
          let prescriptionItem = prescriptions.find(p => p.id === o.id)
          if (prescriptionItem === undefined)
            prescriptionItem = packageItem.find(p => p.id === o.id)
          drugLabelDetail.push(getDrugLabelDetails(o, prescriptionItem))
        }
      })

      return drugLabelDetail
    }
    notification.warn({
      message: `No prescription found. Add prescription to print drug label.`,
    })
    return null
  }

  const getPrintResult = async (type, row, printAllDrugLabel) => {
    let drugLabelReportID = REPORT_ID.DRUG_LABEL_80MM_45MM
    let patientLabelReportID = REPORT_ID.PATIENT_LABEL_80MM_45MM
    try {
      let settings = JSON.parse(localStorage.getItem('clinicSettings'))
      if (settings && settings.labelPrinterSize === '8.9cmx3.6cm') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_89MM_36MM
        patientLabelReportID = REPORT_ID.PATIENT_LABEL_89MM_36MM
      } else if (settings && settings.labelPrinterSize === '7.6cmx3.8cm') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_76MM_38MM
        patientLabelReportID = REPORT_ID.PATIENT_LABEL_76MM_38MM
      } else if (settings && settings.labelPrinterSize === '8.0cmx4.5cm_V2') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_80MM_45MM_V2
      }

      if (type === CONSTANTS.ALL_DRUG_LABEL) {
        const { dispense, values } = restProps
        const { prescription, packageItem } = values
        console.log(dispense, '111')
        const visitinvoicedrugids = _.join(
          selectedDrugs
            .filter(t => t.selected)
            .map(x => {
              return x.visitInvoiceDrugId
            }),
        )
        const instructionIds = _.join(
          selectedDrugs
            .filter(t => t.selected)
            .map(x => {
              return _.join(x.instructionId, '|')
            }),
          ',',
        )

        const data = await getRawData(drugLabelReportID, {
          selectedDrugs: JSON.stringify(
            selectedDrugs
              .filter(t => t.selected)
              .map(t => {
                return {
                  id: t.id,
                  vidId: t.visitInvoiceDrugId,
                  pinfo: t.PageInfo,
                  insId: _.join(t.instructionId, ','),
                }
              }),
          ),
          // visitinvoicedrugids,
          // instructionIds,
          language: _.join(selectedLanguage, ','),
          visitId: dispense.visitID,
        })
        data.DrugLabelDetails.forEach(t => {
          t.ExpiryDate = '20 Jun 2021'
          t.BatchNo = '23332032'
        })
        const payload = [
          {
            ReportId: drugLabelReportID,
            ReportData: JSON.stringify({
              ...data,
            }),
          },
        ]
        handlePrint(JSON.stringify(payload))
      }

      if (type === CONSTANTS.DRUG_LABEL) {
        const reportContext = await getReportContext(drugLabelReportID)
        const drugLabel = await generateDrugLablePrintSource(row)
        if (drugLabel) {
          const payload = drugLabel.map(details => {
            return {
              ReportId: drugLabelReportID,
              ReportData: JSON.stringify({
                DrugLabelDetails: [{ ...details }],
                ReportContext: reportContext,
              }),
            }
          })
          return payload
        }
      }

      if (type === CONSTANTS.PATIENT_LABEL) {
        const { patient, values } = restProps

        const data = await getRawData(patientLabelReportID, {
          patientId: patient ? patient.id : values.patientProfileFK,
        })
        return [
          {
            ReportId: patientLabelReportID,
            ReportData: JSON.stringify({
              ...data,
            }),
          },
        ]
      }
    } catch (error) {
      console.log({ error })
    }
    return null
  }
  // Click print in drug lable selector will trigger this
  const handleOnPrint = async ({ type, row, printAllDrugLabel, printData }) => {
    if (withoutPrintPreview.includes(type)) {
      let printResult = await getPrintResult(type, row, printAllDrugLabel)
      if (printData && printData.length > 0)
        printResult = (printResult || []).concat(printData)

      if (!printResult || printResult.length <= 0) return
      await handlePrint(JSON.stringify(printResult))
    } else {
      const documentType = consultationDocumentTypes.find(
        o =>
          o.name.toLowerCase() === row.type.toLowerCase() ||
          (o.name === 'Others' && row.type === 'Other Documents'),
      )
      if (!documentType || !documentType.downloadConfig) {
        notification.error({ message: 'No configuration found' })
        return
      }
      const { downloadConfig } = documentType
      const reportParameters = {
        [downloadConfig.key]: row.sourceFK,
      }
      restProps.dispatch({
        type: 'report/updateState',
        payload: {
          reportTypeID: downloadConfig.id,
          reportParameters: {
            ...reportParameters,
            isSaved: true,
          },
        },
      })
    }
  }

  const handleFinalize = async (voidPayment = false, voidReason = '') => {
    const { onFinalizeClick } = restProps
    const finalized = await onFinalizeClick(voidPayment, voidReason)
    if (finalized) {
      let settings = JSON.parse(localStorage.getItem('clinicSettings'))
      const { autoPrintDrugLabelOnFinalize = false } = settings
      if (autoPrintDrugLabelOnFinalize === true)
        await handleOnPrint({
          type: CONSTANTS.ALL_DRUG_LABEL,
          printAllDrugLabel: true,
        })
      history.push(getAppendUrl({}, '/reception/queue/billing'))
    }
  }

  if (onPrintRef) onPrintRef(handleOnPrint)

  return (
    <DispenseDetails
      {...restProps}
      onFinalizeClick={handleFinalize}
      onPrint={handleOnPrint}
      sendingJob={sendingJob}
      selectedDrugs={selectedDrugs}
      selectedLanguage={selectedLanguage}
    />
  )
}

export default withWebSocket()(WebSocketWrapper)
