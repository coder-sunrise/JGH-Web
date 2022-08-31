import React, { Fragment, useState, useEffect } from 'react'
import { CommonTableGrid, Button } from '@/components'
import { primaryColor, grayColor, border } from '@/assets/jss'
import { render } from 'react-dom'
import AddIcon from '@material-ui/icons/Add'
export default function Grid(props) {
  const { diagnosis, visitRegistration } = props
  const [diagnosisHistoryData, setDiagnosisHistoryData] = useState([])
  const [selectItemsNum, setSelectItemsNum] = useState()
  const [newVisitdate, setNewVisitdate] = useState(
    visitRegistration?.entity?.visit?.visitDate,
  )
  const [addIconDisabled, setAddIconDisabled] = useState(false)
  const columns = [
    { name: 'visitdate', title: 'Visit Date' },
    { name: 'icD10JpnDiagnosisDescription', title: 'Diagnosis' },
    { name: 'diagnosisType', title: 'Type' },
    { name: 'onsetDate', title: 'Onset Date' },
    { name: 'firstVisitDate', title: 'First Visit Date' },
    { name: 'validityDays', title: 'Validity(Days)' },
    { name: 'action', title: 'Action' },
  ]
  const styles = () => ({
    nameColumn: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: 'inline-block',
      textOverflow: 'ellipsis',
      width: 330,
      paddingLeft: 8,
      float: 'left',
      marginTop: 6,
    },
    instructionColumn: {
      display: 'inline-block',
      width: 400,
      paddingLeft: 8,
      float: 'left',
      marginTop: 6,
    },
    quantityColumn: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: 'inline-block',
      textOverflow: 'ellipsis',
      width: 150,
      paddingLeft: 8,
      float: 'left',
      marginTop: 6,
    },
    actionColumn: {
      width: 30,
      float: 'left',
    },
    addIcon: {
      cursor: 'pointer',
      color: primaryColor,
    },
    rightIcon: {
      position: 'relative',
      fontWeight: 600,
      color: 'white',
      fontSize: '0.7rem',
      padding: '2px 3px',
      height: 20,
      cursor: 'pointer',
      margin: '0px 1px',
      lineHeight: '16px',
    },
  })
  useEffect(() => {
    console.log(diagnosis)
    setNewVisitdate(111)
    if (diagnosisHistoryData.length === 0) {
      setDiagnosisHistoryData(
        diagnosis.rows.map(item => {
          return {
            ...item,
            visitdate: visitRegistration?.entity?.visit?.visitDate,
            action: 'add',
          }
        }),
      )
    }
  }, [diagnosis])
  const data = diagnosis.rows.map(item => {
    return {
      ...item,
      visitdate: visitRegistration?.entity?.visit?.visitDate,
      action: 'add',
    }
  })
  console.log(diagnosisHistoryData)
  const onChangeItems = (row, iconName) => {
    console.log(diagnosisHistoryData, 'diagnosisHistoryData')
    console.log(newVisitdate)
    setDiagnosisHistoryData(data)
    // const newOnSelectItems = diagnosisHistoryData.map(item => {
    //   if (item.id === row.id) {
    //     item.action = iconName
    //   }
    //   return item
    // })
    // setDiagnosisHistoryData(newOnSelectItems)
    // const { getGridSelectNum } = props
    // const AddFromPastModal = newOnSelectItems.filter(
    //   item => item.action === 'minus',
    // ).length
    // getGridSelectNum(AddFromPastModal)
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
            {diagnosisHistoryData.filter(item => item.action === 'add').length}
          </span>
          <span>&nbsp;&nbsp;diagnosis select</span>
        </div>
      </div>
      <CommonTableGrid
        forceRender
        columns={columns}
        rows={data}
        FuncProps={{ pager: false }}
        columnExtensions={[
          {
            columnName: 'visitdate',
            type: 'date',
          },
          {
            columnName: 'firstVisitDate',
            type: 'date',
          },
          {
            columnName: 'onsetDate',
            type: 'date',
          },
          {
            columnName: 'icD10JpnDiagnosisDescription',
            sortingEnabled: false,
            width: 150,
          },
          {
            columnName: 'validityDays',
            sortingEnabled: false,
            align: 'center',
          },
          {
            columnName: 'action',
            align: 'center',
            sortingEnabled: false,
            width: 100,
            render: row => {
              return row.action === 'add' ? (
                <Button
                  color='primary'
                  justIcon
                  onClick={() => {
                    onChangeItems(row, 'add')
                  }}
                >
                  <AddIcon></AddIcon>
                </Button>
              ) : (
                <Button disabled color='#ccc' justIcon>
                  <AddIcon></AddIcon>
                </Button>
              )
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
