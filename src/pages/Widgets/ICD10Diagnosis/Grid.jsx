import React, { useState, useEffect } from 'react'
import { CommonTableGrid } from '@/components'
import { primaryColor } from '@/assets/jss'
import { render } from 'react-dom'
import { useSelector } from 'umi'
import moment from 'moment'
import { Tooltip } from '@material-ui/core'
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
    { name: 'icD10DiagnosisDescription', title: 'Diagnosis' },
    { name: 'icD10JpnDiagnosisDescription', title: 'Diagnosis (JP)' },
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
          <span>&nbsp;&nbsp;diagnosis selected</span>
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
          size='sm'
          forceRender
          columns={columns}
          rows={diagnosisHistoryData}
          FuncProps={{ pager: false }}
          columnExtensions={[
            {
              columnName: 'visitDate',
              type: 'date',
              width: 110,
              sortingEnabled: false,
            },
            {
              columnName: 'firstVisitDate',
              type: 'date',
              width: 110,
              sortingEnabled: false,
            },
            {
              columnName: 'onsetDate',
              type: 'date',
              width: 110,
              sortingEnabled: false,
            },
            {
              columnName: 'diagnosisType',
              width: 110,
              sortingEnabled: false,
              render: row => {
                return (
                  <span>
                    {row.diagnosisType == null ? '-' : row.validityDays}
                  </span>
                )
              },
            },
            {
              columnName: 'validityDays',
              width: 110,
              align: 'center',
              sortingEnabled: false,
              render: row => {
                return (
                  <span>
                    {row.validityDays == null ? '-' : row.validityDays}
                  </span>
                )
              },
            },
            {
              columnName: 'icD10DiagnosisDescription',
              sortingEnabled: false,
              render: row => {
                if (
                  Date.now() > Date.parse(row.effectiveStartDate) &&
                  Date.now() < Date.parse(row.effectiveEndDate)
                ) {
                  return (
                    <Tooltip
                      title={
                        <div style={{ fontSize: '13px' }}>
                          {row.icD10DiagnosisDescription}
                        </div>
                      }
                      placement='top'
                    >
                      <span>{row.icD10DiagnosisDescription}</span>
                    </Tooltip>
                  )
                } else {
                  return (
                    <Tooltip
                      title={
                        <div style={{ fontSize: '13px' }}>
                          {row.icD10DiagnosisDescription}
                        </div>
                      }
                      placement='top'
                    >
                      <span>
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                          <sup>#1&nbsp;</sup>
                        </span>
                        &nbsp; {row.icD10DiagnosisDescription}
                      </span>
                    </Tooltip>
                  )
                }
              },
            },
            {
              columnName: 'icD10JpnDiagnosisDescription',
              sortingEnabled: false,
              render: row => {
                if (
                  Date.now() > Date.parse(row.effectiveStartDate) &&
                  Date.now() < Date.parse(row.effectiveEndDate)
                ) {
                  return (
                    <Tooltip
                      title={
                        <div style={{ fontSize: '13px', fontWeight: 570 }}>
                          {row.icD10JpnDiagnosisDescription == null
                            ? '-'
                            : row.icD10JpnDiagnosisDescription}
                        </div>
                      }
                      placement='top'
                    >
                      <span style={{ fontWeight: 500 }}>
                        {row.icD10JpnDiagnosisDescription == null
                          ? '-'
                          : row.icD10JpnDiagnosisDescription}
                      </span>
                    </Tooltip>
                  )
                } else {
                  return (
                    <Tooltip
                      title={
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>
                          {row.icD10JpnDiagnosisDescription}
                        </div>
                      }
                      placement='top'
                    >
                      <span>
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                          <sup>#1&nbsp;</sup>
                        </span>
                        &nbsp;
                        <span style={{ fontWeight: 500 }}>
                          {row.icD10JpnDiagnosisDescription}
                        </span>
                      </span>
                    </Tooltip>
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
    </>
  )
}
