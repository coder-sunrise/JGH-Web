import React, { useState, useEffect } from 'react'
import { CommonTableGrid } from '@/components'
import { primaryColor } from '@/assets/jss'
import { render } from 'react-dom'
import { useSelector } from 'umi'
export default function Grid(props) {
  const { diagnosis, visitRegistration } = props
  const { patientDiansiosHistoryList } = useSelector(
    state => state.patientHistory,
  )
  const [diagnosisHistoryData, setDiagnosisHistoryData] = useState(
    patientDiansiosHistoryList.list.map(item => {
      return {
        ...item,
        action: 'add',
      }
    }),
  )
  const [selectItemsNum, setSelectItemsNum] = useState()
  const columns = [
    { name: 'visitDate', title: 'Visit Date' },
    // { name: 'icD10DiagnosisDescription', title: 'Diagnosis' },
    { name: 'icD10JpnDiagnosisDescription', title: 'Diagnosis' },
    { name: 'diagnosisType', title: 'Type' },
    { name: 'onsetDate', title: 'Onset Date' },
    { name: 'firstVisitDate', title: 'First Visit Date' },
    { name: 'validityDays', title: 'Validity(Days)' },
    { name: 'action', title: 'Action' },
  ]
  // Change add and minus icon
  const onSelectItems = (row, iconName) => {
    const newOnSelectItems = diagnosisHistoryData.map(item => {
      if (item.id === row.id) {
        item.action = iconName
      }
      return item
    })
    setDiagnosisHistoryData(newOnSelectItems)
    // Gets the selected nums,pass to the parent component
    const { getGridSelectNum, getGridDiangnosisHistoryID } = props
    const AddFromPastModal = newOnSelectItems.filter(
      item => item.action === 'minus',
    ).length
    getGridSelectNum(AddFromPastModal)
    // Gets the selected data,pass to the parent component
    const getDiagnosisHistoryID = newOnSelectItems.filter(
      item => item.action === 'minus',
    )
    getGridDiangnosisHistoryID(getDiagnosisHistoryID)
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
              diagnosisHistoryData.filter(item => item.action === 'minus')
                .length
            }
          </span>
          <span>&nbsp;&nbsp;diagnosis select</span>
        </div>
      </div>
      <CommonTableGrid
        forceRender
        columns={columns}
        rows={diagnosisHistoryData}
        FuncProps={{ pager: false }}
        columnExtensions={[
          {
            columnName: 'visitDate',
            type: 'date',
            align: 'center',
          },
          {
            columnName: 'firstVisitDate',
            type: 'date',
            align: 'center',
          },
          {
            columnName: 'onsetDate',
            type: 'date',
            align: 'center',
          },
          {
            columnName: 'diagnosisType',
            align: 'center',
          },
          {
            columnName: 'icD10JpnDiagnosisDescription',
            width: 250,
            render: row => {
              if (
                Date.parse(row.onsetDate) >
                  Date.parse(row.effectiveStartDate) &&
                Date.parse(row.firstVisitDate) <
                  Date.parse(row.effectiveEndDate)
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
                      inactive diagnosis {row.icD10JpnDiagnosisDescription}
                    </span>
                  )
                } else {
                  return (
                    <span>
                      <span style={{ color: 'red', fontStyle: 'italic' }}>
                        <sup>#1&nbsp;</sup>
                      </span>
                      inactive diagnosis {row.icD10DiagnosisDescription}
                    </span>
                  )
                }
              }
            },
          },
          {
            columnName: 'validityDays',
            align: 'center',
          },
          {
            columnName: 'action',
            align: 'center',
            sortingEnabled: false,
            width: 70,
            render: row => {
              if (row.action == 'add') {
                if (
                  Date.parse(row.onsetDate) >
                    Date.parse(row.effectiveStartDate) &&
                  Date.parse(row.firstVisitDate) <
                    Date.parse(row.effectiveEndDate)
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
                        onSelectItems(row, 'minus')
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
                if (row.action != 'add') {
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
                        onSelectItems(row, 'add')
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
      <div
        style={{
          height: 30,
          paddingTop: 10,
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
