import { CommonTableGrid, DatePicker, dateFormatLong } from '@/components'
import React from 'react'
import { Table } from 'antd'
import tablestyles from './PatientHistoryStyle.less'
import moment from 'moment'
import { DIAGNOSIS_TYPE } from '@/utils/constants'

const wrapCellTextStyle = {
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
}

export default ({ current, classes, theme, codetable, clinicSettings }) => {
  const { settings } = clinicSettings
  const complicationData = (complicationList) => {
    const { ctcomplication = [] } = codetable

    let currentComplication = complicationList.map((c) => {
      const selectItem = ctcomplication.find((cc) => cc.id === c.complicationFK)
      return {
        ...c,
        name: selectItem ? selectItem.name : undefined,
      }
    })
    return currentComplication.filter((c) => c.name).map((c) => c.name).join(', ')
  }

  let columns = [
    {
      dataIndex: 'diagnosisDescription',
      title: 'Diagnosis (EN)',
      render: (text) => <div style={wrapCellTextStyle}>{text}</div>,
    },
    {
      dataIndex: 'jpnDiagnosisDescription',
      title: 'Diagnosis (JP)',
      render: (text) => <div style={wrapCellTextStyle}>{text}</div>,
    },
    {
      dataIndex: 'diagnosisType',
      title: 'Type',
      render: (text) => <div style={wrapCellTextStyle}>{text}</div>,
    },
    {
      dataIndex: 'onsetDate',
      title: 'Onset Date',
      format: dateFormatLong,
      render: (text) => <div style={wrapCellTextStyle}>{moment(text).format('DD MMM YYYY')}</div>,
    },
    {
      dataIndex: 'firstVisitDate',
      title: 'First Visit Date',
      render: (text) => <div style={wrapCellTextStyle}>{moment(text).format('DD MMM YYYY')}</div>,
    },
    {
      dataIndex: 'validityDays',
      title: 'Validity (Days)',
      render: (text) => <div style={wrapCellTextStyle}>{text}</div>,
    },
    {
      dataIndex: 'remarks',
      title: 'Remarks',
      render: (text) => <div style={wrapCellTextStyle}>{text}</div>,
    },
  ]

  return (
    <div>
      {clinicSettings.settings.diagnosisDataSource !== DIAGNOSIS_TYPE['ICD10DIANOGSIS'] ? (
        <div>
          <div className={classes.paragraph}>
            <ul
              style={{
                listStyle: 'decimal',
                paddingLeft: theme.spacing(2),
              }}
            >
              {(current.diagnosis || []).map((o, i) => (
                <li key={i} style={{ paddingBottom: 10 }}>
                  {o.diagnosisDescription} (<DatePicker text value={o.onsetDate} />)
                  {o.corComplication.length > 0 ? <br /> : ''}
                  {o.corComplication.length > 0 ? `Complication: ${complicationData(o.corComplication)}` : ''}
                  {o.remarks ? <br /> : ''}
                  {o.remarks ? `Remark: ${o.remarks}` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <Table
            size="small"
            bordered
            pagination={false}
            columns={
              settings.isEnableJapaneseICD10Diagnosis === false ? (
                columns.filter((col) => col.dataIndex !== 'jpnDiagnosisDescription')
              ) : (
                columns
              )
            }
            dataSource={current.diagnosis || []}
            rowClassName={(record, index) => {
              return index % 2 === 0 ? tablestyles.once : tablestyles.two
            }}
            className={tablestyles.table}
          />
        </div>
      )}
    </div>
  )
}
