import React, { useState, useEffect } from 'react'
import { CommonTableGrid } from '@/components'
import { primaryColor } from '@/assets/jss'
import { render } from 'react-dom'
import { useSelector } from 'umi'
export default function Grid(props) {
  const { diagnosis, visitRegistration, footer } = props
  const { patientDiansiosHistoryList } = useSelector(
    state => state.patientHistory,
  )
  const [diagnosisHistoryData, setDiagnosisHistoryData] = useState(
    patientDiansiosHistoryList.list.map(item => {
      return {
        ...item,
        isSelected: true,
      }
    }),
  )
  const columns = [
    { name: 'visitDate', title: 'Visit Date' },
    { name: 'icD10JpnDiagnosisDescription', title: 'Diagnosis' },
    { name: 'diagnosisType', title: 'Type' },
    { name: 'onsetDate', title: 'Onset Date' },
    { name: 'firstVisitDate', title: 'First Visit Date' },
    { name: 'validityDays', title: 'Validity(Days)' },
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
              align: 'center',
            },
            {
              columnName: 'firstVisitDate',
              type: 'date',
              align: 'center',
              width: 110,
            },
            {
              columnName: 'onsetDate',
              type: 'date',
              align: 'center',
              width: 110,
            },
            {
              columnName: 'diagnosisType',
              align: 'center',
              width: 110,
            },
            {
              columnName: 'validityDays',
              align: 'center',
              width: 110,
            },
            {
              columnName: 'icD10JpnDiagnosisDescription',
              width: 300,
              render: row => {
                if (
                  Date.now() > Date.parse(row.effectiveStartDate) &&
                  Date.now() < Date.parse(row.effectiveEndDate)
                ) {
                  if (diagnosis.favouriteDiagnosisLanguage === 'JP') {
                    return <span>{row.icD10JpnDiagnosisDescription}</span>
                  } else {
                    return <span>{row.icD10DiagnosisDescription}</span>
                  }
                } else {
                  if (diagnosis.favouriteDiagnosisLanguage === 'JP') {
                    return (
                      <span>
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                          <sup>#1&nbsp;</sup>
                        </span>
                        &nbsp;
                        {row.icD10JpnDiagnosisDescription}
                      </span>
                    )
                  } else {
                    return (
                      <span>
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                          <sup>#1&nbsp;</sup>
                        </span>
                        &nbsp;
                        {row.icD10DiagnosisDescription}
                      </span>
                    )
                  }
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
                      <span
                        className='material-icons'
                        style={{
                          cursor: 'pointer',
                          color: primaryColor,
                          marginTop: 4,
                          marginLeft: 5,
                        }}
                        onClick={() => {
                          onSelectItems(row, false)
                        }}
                      >
                        add_circle_outline
                      </span>
                    )
                  } else {
                    return (
                      <span
                        className='material-icons'
                        style={{
                          cursor: 'pointer',
                          color: '#ccc',
                          marginTop: 4,
                          marginLeft: 5,
                        }}
                      >
                        add_circle_outline
                      </span>
                    )
                  }
                } else {
                  if (row.isSelected != true) {
                    return (
                      <span
                        className='material-icons'
                        style={{
                          cursor: 'pointer',
                          color: 'red',
                          marginTop: 4,
                          marginLeft: 5,
                        }}
                        onClick={() => {
                          onSelectItems(row, true)
                        }}
                      >
                        remove_circle_outline
                      </span>
                    )
                  }
                }
              },
            },
          ]}
        ></CommonTableGrid>
      </div>
      {footer({
        onConfirm: () => {
          const { getGridDiangnosisHistoryID } = props
          getGridDiangnosisHistoryID(getDiagnosisHistoryNewData)
        },
        confirmBtnText: 'Save',
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
          inactive diagnosis1
        </span>
      </div>
    </>
  )
}
