import React, { PureComponent } from 'react'
import { ReportDataGrid } from '@/components/_medisys'
import { DIAGNOSIS_TYPE, SYSTEM_LANGUAGE } from '@/utils/constants'

class DiagnosisGroupDetails extends PureComponent {
  render() {
    let listData = []
    const { reportDatas } = this.props
    if (!reportDatas) return null
    if (reportDatas.DiagnosisDetails) {
      listData = reportDatas.DiagnosisGroupDetails.map((item, index) => ({
        ...item,
        id: `DiagnosisDetails-${index}-${item.diagnosisCode}`,
      }))
    }
    const FuncProps = {
      pager: false,
      grouping: true,
      groupingConfig: {
        state: {
          grouping: [{ columnName: 'groupName' }],
        },
      },
    }

    let DiagnosisDetailsColumns = []
    const showJpnDiagnosis =
      reportDatas.ListingDetails[0].diagnosisDataSource ===
        DIAGNOSIS_TYPE.ICD10DIANOGSIS &&
      reportDatas.ListingDetails[0].isEnableJapaneseICD10Diagnosis === 'true'
    if (!showJpnDiagnosis) {
      DiagnosisDetailsColumns = [
        { name: 'groupName', title: 'Date' },
        { name: 'diagnosisCode', title: 'Diagnosis Code' },
        { name: 'diagnosisName', title: 'Diagnosis Name' },
        { name: 'patientCount', title: 'Patients' },
        { name: 'visitCount', title: 'Visits' },
      ]
    } else {
      DiagnosisDetailsColumns = [
        { name: 'groupName', title: 'Date' },
        { name: 'diagnosisCode', title: 'Diagnosis Code' },
        {
          name: 'diagnosisName',
          title: `Diagnosis Name (${SYSTEM_LANGUAGE.PRIMARYLANGUAGE})`,
        },
        {
          name: 'diagnosisJpnName',
          title: `Diagnosis Name (${SYSTEM_LANGUAGE.SECONDLANGUAGE})`,
        },
        { name: 'patientCount', title: 'Patients' },
        { name: 'visitCount', title: 'Visits' },
      ]
    }
    const DiagnosisDetailsExtensions = [
      { columnName: 'groupName', sortingEnabled: false },
      { columnName: 'diagnosisCode', sortingEnabled: false },
      { columnName: 'diagnosisName', sortingEnabled: false },
      { columnName: 'diagnosisJpnName', sortingEnabled: false },
      { columnName: 'patientCount', sortingEnabled: false },
      { columnName: 'visitCount', sortingEnabled: false },
    ]

    return (
      <ReportDataGrid
        data={listData}
        columns={DiagnosisDetailsColumns}
        columnExtensions={DiagnosisDetailsExtensions}
        FuncProps={FuncProps}
      />
    )
  }
}
export default DiagnosisGroupDetails
