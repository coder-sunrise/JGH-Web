import React, { useState, useEffect } from 'react'
import { CommonTableGrid } from '@/components'
import { primaryColor } from '@/assets/jss'
import { render } from 'react-dom'
import { useSelector } from 'umi'
import moment from 'moment'
export default function Grid(props) {
  const { diagnosis, visitRegistration, footer } = props
  const { patientDiansiosHistoryList } = useSelector(
    state => state.patientHistory,
  )
  const [diagnosisHistoryData, setDiagnosisHistoryData] = useState(
    patientDiansiosHistoryList.list
      .filter(
        item =>
          item.icD10JpnDiagnosisDescription != null ||
          item.icD10DiagnosisDescription != null,
      )
      .map(item => {
        return {
          ...item,
          isSelected: true,
        }
      }),
  )
  const columns = [
    { name: 'visitDate', title: 'Visit Date' },
    { name: 'Diagnosis', title: 'Diagnosis' },
    { name: 'diagnosisType', title: 'Type' },
    { name: 'onsetDate', title: 'Onset Date' },
    { name: 'firstVisitDate', title: 'First Visit Date' },
    { name: 'validityDays', title: 'Validity (Days)' },
    { name: 'action', title: 'Action' },
  ]
  const [confirmPropsSave, setConfirmPropsSave] = useState(true)
  const [getDiagnosisHistoryNewData, setDiagnosisHistoryNewData] = useState()
  // Change add and minus icon
  const onSelectItems = (row, iconName) => {
    const newOnSelectItems = diagnosisHistoryData.map(item => {
      if (item.id === row.id) {
        item.isSelected = iconName
      }
      return item
    })
    setDiagnosisHistoryData(newOnSelectItems)
    // Gets the selected nums
    const AddFromPastModal = newOnSelectItems.filter(
      item => item.isSelected === false,
    ).length
    if (AddFromPastModal >= 1) {
      setConfirmPropsSave(false)
    } else {
      setConfirmPropsSave(true)
    }
    // Gets the selected data
    const getDiagnosisHistoryID = newOnSelectItems.filter(
      item => item.isSelected === false,
    )
    setDiagnosisHistoryNewData(getDiagnosisHistoryID)
  }
  return (
    <>
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'right',
            marginTop: '-10px',
            height: '30px',
          }}
        >
          <span style={{ color: 'red ' }}>
            {
              diagnosisHistoryData.filter(item => item.isSelected === false)
                .length
            }
          </span>
          <span>&nbsp;&nbsp;diagnosis select</span>
        </div>
      </div>
      <div
        style={{
          maxHeight: '70vh',
          overflowY: 'auto',
          width: '955px',
          padding: '8px',
        }}
      >
        <CommonTableGrid
          forceRender
          columns={columns}
          rows={diagnosisHistoryData}
          FuncProps={{ pager: false }}
          columnExtensions={[
            {
              columnName: 'visitDate',
              type: 'date',
              width: 110,
            },
            {
              columnName: 'firstVisitDate',
              type: 'date',
              width: 110,
              render: row => {
                if (row.firstVisitDate != null) {
                  return moment(row.firstVisitDate).format('DD MMM YYYY')
                }
              },
            },
            {
              columnName: 'onsetDate',
              type: 'date',
              width: 110,
              render: row => {
                if (row.onsetDate != null) {
                  return moment(row.onsetDate).format('DD MMM YYYY')
                }
              },
            },
            {
              columnName: 'diagnosisType',
              width: 110,
            },
            {
              columnName: 'validityDays',
              width: 110,
              align: 'center',
            },
            {
              columnName: 'Diagnosis',
              width: 300,
              render: row => {
                if (
                  Date.now() > Date.parse(row.effectiveStartDate) &&
                  Date.now() < Date.parse(row.effectiveEndDate)
                ) {
                  return (
                    <span>
                      {row.icD10DiagnosisDescription}&nbsp;
                      {row.icD10JpnDiagnosisDescription}
                    </span>
                  )
                } else {
                  return (
                    <span>
                      <span style={{ color: 'red', fontStyle: 'italic' }}>
                        <sup>#1&nbsp;</sup>
                      </span>
                      &nbsp; {row.icD10DiagnosisDescription}&nbsp;
                      {row.icD10JpnDiagnosisDescription}
                    </span>
                  )
                }
              },
            },
            {
              columnName: 'action',
              align: 'center',
              sortingEnabled: false,
              width: 80,
              render: row => {
                if (row.isSelected === true) {
                  if (
                    Date.now() > Date.parse(row.effectiveStartDate) &&
                    Date.now() < Date.parse(row.effectiveEndDate)
                  ) {
                    return (
                      <div style={{ height: '10px', width: '10px' }}>
                        <span
                          justIcon
                          className='material-icons'
                          style={{
                            cursor: 'pointer',
                            color: primaryColor,
                            marginTop: -6,
                            marginLeft: 20,
                          }}
                          onClick={() => {
                            onSelectItems(row, false)
                          }}
                        >
                          add_circle_outline
                        </span>
                      </div>
                    )
                  } else {
                    return (
                      <div style={{ height: '10px', width: '10px' }}>
                        <span
                          justIcon
                          className='material-icons'
                          style={{
                            cursor: 'pointer',
                            color: '#ccc',
                            marginTop: -6,
                            marginLeft: 20,
                          }}
                        >
                          add_circle_outline
                        </span>
                      </div>
                    )
                  }
                } else {
                  if (row.isSelected != true) {
                    return (
                      <div style={{ height: '10px', width: '10px' }}>
                        <span
                          justIcon
                          className='material-icons'
                          style={{
                            cursor: 'pointer',
                            color: 'red',
                            marginTop: -6,
                            marginLeft: 20,
                          }}
                          onClick={() => {
                            onSelectItems(row, true)
                          }}
                        >
                          remove_circle_outline
                        </span>
                      </div>
                    )
                  }
                }
              },
            },
          ]}
        ></CommonTableGrid>
      </div>
      {footer &&
        footer({
          onConfirm: () => {
            const { getGridDiangnosisHistoryID } = props
            getGridDiangnosisHistoryID(getDiagnosisHistoryNewData)
          },
          confirmBtnText: 'Confirm',
          confirmProps: {
            disabled: confirmPropsSave,
          },
        })}
      <div
        style={{
          height: 30,
          paddingTop: 10,
          marginTop: '-20px',
        }}
      >
        <span>
          Note:&nbsp;
          <span style={{ color: 'red', fontStyle: 'italic' }}>
            <sup>#1&nbsp;</sup>
          </span>
          inactive diagnosis
        </span>
      </div>
    </>
  )
}
