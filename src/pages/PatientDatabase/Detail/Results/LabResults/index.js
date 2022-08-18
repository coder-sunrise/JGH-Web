import React, { Component, Fragment, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { withStyles } from '@material-ui/core/styles'
import { connect } from 'dva'
import moment from 'moment'
import { Tooltip } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useVisitTypes } from '@/utils/hooks'
import Print from '@material-ui/icons/Print'
import { Link } from 'umi'
import { CommonModal } from '@/components'
import { ReportViewer } from '@/components/_medisys'
import { FileCopySharp } from '@material-ui/icons'
import ResultDetails from '@/pages/MedicalCheckup/Worklist/components/ReportingDetails/ResultDetails'
import { GridContainer, GridItem, Checkbox, RadioGroup } from '@/components'
import './index.css'
import { Button } from 'antd'
import { useEffect } from 'react'
import { useDispatch } from 'dva'
import { getMappedVisitType } from '@/utils/utils'
import { formatDatesToUTC } from '@/utils/dateUtils'
import { Table } from 'antd'
import _ from 'lodash'
const styles = theme => ({})

const LabResults = ({
  clinicSettings,
  currentVisitId,
  height,
  patientProfileFK,
}) => {
  const onCloseReport = () => {
    setShowModal(false)
  }
  const onCloseResultDetails = () => {
    setShowResultDetails(false)
  }
  const defaultColumns = () => {
    return [
      {
        dataIndex: 'testName',
        title: (
          <div
            style={{
              paddingLeft: 4,
            }}
          >
            <div>Test Name</div>
          </div>
        ),
        width: 200,
        fixed: 'left',
        render: (text, row) => {
          if (row.dataType === 'testCategory') {
            return (
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    paddingLeft: 4,
                    paddingTop: 2,
                    paddingBottom: 2,
                    left: 0,
                    width: 152,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Tooltip title={row.testCategory} placement='bottomLeft'>
                    <span style={{ fontWeight: 'bold' }}>
                      {row.testCategory}
                    </span>
                  </Tooltip>
                </div>
              </div>
            )
          }
          return (
            <div
              style={{
                paddingLeft: row.dataType === 'testpanelitem' ? 16 : 4,
                paddingTop: 2,
                fontWeight:
                  row.dataType === 'testpanelitem' ? 'normal' : 'bold',
                paddingBottom: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Tooltip title={row.itemName} placement='bottomLeft'>
                <span> {row.itemName}</span>
              </Tooltip>
            </div>
          )
        },
        onCell: row => {
          if (row.dataType === 'testcategory')
            return {
              style: { backgroundColor: '#daecf5' },
            }
        },
      },
      {
        dataIndex: 'referenceRange',
        align: 'right',
        title: (
          <div
            style={{
              paddingRight: 4,
            }}
          >
            <div>Ref. Range</div>
          </div>
        ),
        width: 120,
        fixed: 'left',
        render: (text, row) => {
          return (
            <div
              style={{
                padding: '2px 4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Tooltip title={row.referenceRange} placement='bottomLeft'>
                <span>{row.referenceRange}</span>
              </Tooltip>
            </div>
          )
        },
        onCell: row => {
          if (row.dataType === 'testcategory')
            return {
              style: { backgroundColor: '#daecf5' },
            }
        },
      },
    ]
  }
  const actionColumn = () => {
    return [
      {
        dataIndex: 'action',
        title: '',
        width: '100%',
      },
    ]
  }
  const dispatch = useDispatch()
  const [visitType, setVisitType] = useState([])
  const [maxVisitDate, setMaxVisitDate] = useState(undefined)
  const [visitId, setVisitId] = useState(currentVisitId)
  const [allRetrieved, setAllRetrieved] = useState(false)
  const [onlyMC, setOnlyMC] = useState(false)
  const [outOfRangeAll, setOutOfRangeAll] = useState(false)
  const [outOfRangeLatest, setOutOfRangeLatest] = useState(false)
  const [allData, setAllData] = useState([])
  const [originalTestPanelItems, setOriginalTestPanelItems] = useState([])
  const [newCols, setNewCols] = useState([])
  const [columns, setColumns] = useState(defaultColumns())
  const [showModal, setShowModal] = useState(false)
  const [showResultDetails, setShowResultDetails] = useState(false)
  const [targetVisitId, setTargetVisitId] = useState(false)
  const [allColumns, setAllColumns] = useState([
    ...defaultColumns(),
    ...actionColumn(),
  ])
  const [finalColumns, setFinalColumns] = useState([])
  const [finalData, setFinalData] = useState([])
  const [filteredAllColumns, setFilteredAllColumns] = useState([
    ...defaultColumns(),
    ...actionColumn(),
  ])
  useEffect(() => {
    if (patientProfileFK && visitType && visitType.length > 0) {
      dispatch({
        type: 'workitem/getTestPanelItemWithRefRange',
        payload: { patientProfileFK },
      }).then(data => {
        if (data) {
          const original = constructTestPanelItem(data)
          // load first page data
          loadData(true, original)
        }
      })
    }
  }, [visitType])
  useEffect(() => {
    if (!patientProfileFK) return
    const { visitTypeSetting } = clinicSettings.settings
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctvisitpurpose',
      },
    }).then(v => {
      let visitTypeSettingsObj = undefined
      if (visitTypeSetting) {
        try {
          visitTypeSettingsObj = JSON.parse(visitTypeSetting)
        } catch {}
      }

      if ((v || []).length > 0) {
        setVisitType(getMappedVisitType(v, visitTypeSettingsObj))
      }
    })
  }, [patientProfileFK])

  const constructTestPanelItem = data => {
    let category = _.uniqWith(
      data.map(item => {
        return {
          testCategoryFK: item.testCategoryFK,
          itemName: item.testCategory,
        }
      }),
      _.isEqual,
    )
    let newCategory = []
    category.forEach(item => {
      newCategory = newCategory.concat({ dataType: 'testcategory', ...item })
      newCategory = newCategory.concat(
        data
          .filter(x => x.testCategoryFK === item.testCategoryFK)
          .map(subItem => {
            return {
              testCategoryFK: subItem.testCategoryFK,
              testCategory: subItem.testCategory,
              id: subItem.id,
              itemName: subItem.displayValue,
              testPanelFK: subItem.testPanelFK,
              referenceRange: subItem.referenceRange,
              visible: false,
              dataType: 'testpanelitem',
            }
          }),
      )
    })
    // console.log(newCategory)
    setOriginalTestPanelItems(newCategory)
    return newCategory
  }
  const loadData = (includeCurrentVisit, original) => {
    dispatch({
      type: 'workitem/getLabResults',
      payload: {
        patientProfileFK: patientProfileFK,
        currentVisitId: visitId,
        pageSize: 10,
        includeCurrentVisit: includeCurrentVisit ?? false,
      },
    }).then(data => {
      if (data) {
        if (data.labResultDetails?.length > 0) {
          if (!maxVisitDate) {
            // console.log(data.labResultDetails[0])
            setMaxVisitDate(data.labResultDetails[0].visitDate)
          }
          prepareData(data, original)
        } else {
          setAllRetrieved(true)
        }
      }
    })
  }

  const getVisitTypeCode = typeFK => {
    const currentVisitType = visitType?.find(item => item.id === typeFK)
    return currentVisitType?.code
  }
  const visitColumnHeader = x => {
    return (
      <div style={{ textAlign: 'center', height: 34, lineHeight: '17px' }}>
        <div>
          {`${moment(x.visitDate).format('DD MMM YYYY')}`}
          <div>
            <span
              style={{
                position: 'relative',
                top: '-3px',
              }}
            >
              {`(${getVisitTypeCode(x.visitTypeFK)})`}
            </span>
            {!x.isMigrate && (
              <Tooltip
                style={{ display: 'inline-block' }}
                title='Print Lab Report'
              >
                <Print
                  style={{
                    display: 'inline-block',
                    marginLeft: 4,
                    cursor: 'pointer',
                    color: '#4255bd',
                  }}
                  onClick={() => {
                    setShowModal(true)
                    setTargetVisitId(x.visitId)
                  }}
                />
              </Tooltip>
            )}
            {x.hasLabRemarks && (
              <Tooltip
                style={{ display: 'inline-block' }}
                title='Result Details'
              >
                <FileCopySharp
                  style={{
                    width: 15,
                    height: 15,
                    display: 'inline-block',
                    marginLeft: 4,
                    cursor: 'pointer',
                    color: '#4255bd',
                  }}
                  onClick={() => {
                    setTargetVisitId(x.visitId)
                    setShowResultDetails(true)
                  }}
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    )
  }
  const prepareData = (data, original) => {
    let newData = original || originalTestPanelItems
    // iterate the returned data and based on the test panel item FK to update the value of each test panel item
    // console.log(newData)
    let newColumns = []
    data.labResultDetails.forEach(visitData => {
      newColumns.push({
        dataIndex: `v_${visitData.visitId}_finalResult`,
        headerText: `${moment(visitData.visitDate).format('DD MMM YYYY')}`,
        ...visitData,
      })
      visitData.testPanelItemResults.forEach(result => {
        newData.forEach(d => {
          let target = newData.find(x => x.id === result.testPanelItemFK)
          if (target) {
            target[`v_${visitData.visitId}_originalResult`] =
              result.originalResult
            target[`v_${visitData.visitId}_finalResult`] = result.finalResult
            target[`v_${visitData.visitId}_shouldFlag`] = result.shouldFlag
            target[`v_${visitData.visitId}_referenceRange`] =
              result.referenceRange
          }
        })
      })
    })
    setVisitId(_.minBy(data.labResultDetails, 'visitId').visitId)
    setAllRetrieved(data.allRetrieved)
    // console.log(newData)
    // console.log(newColumns)
    setAllData(newData)
    // setOriginalTestPanelItems(originalTestPanelItems)
    setNewCols(newCols.concat(newColumns))
    let allCols = [
      ...columns,
      ...getVisitColumns(newCols.concat(newColumns)),
      ...actionColumn(),
    ]
    setAllColumns(allCols)
  }
  const getVisitColumns = newCol => {
    return newCol.map(visitColumn => {
      return {
        dataIndex: visitColumn.dataIndex,
        align: 'right',
        title: visitColumnHeader(visitColumn),
        visitType: visitColumn.visitTypeFK,
        className:
          visitColumn.dataIndex === newCol[0].dataIndex ? 'latestVisit' : '',
        visitId: visitColumn.visitId,
        width: 120,
        render: (text, row) => {
          const title = (
            <div>
              {row[`v_${visitColumn.visitId}_originalResult`] && (
                <div>
                  Raw Result: {row[`v_${visitColumn.visitId}_originalResult`]}
                </div>
              )}
              {row[`v_${visitColumn.visitId}_finalResult`] && (
                <div>
                  Final Result: {row[`v_${visitColumn.visitId}_finalResult`]}
                </div>
              )}
              {row[`v_${visitColumn.visitId}_referenceRange`] && (
                <div>
                  Ref. Range: {row[`v_${visitColumn.visitId}_referenceRange`]}
                </div>
              )}
            </div>
          )
          return (
            <Tooltip title={title} placement='right'>
              <span
                style={{
                  display: 'inline-block',
                  width: '100%',
                  color: row[`v_${visitColumn.visitId}_shouldFlag`]
                    ? 'red'
                    : 'inherit',
                }}
              >
                {row[`${visitColumn.dataIndex}`]}
              </span>
            </Tooltip>
          )
        },
        onCell: row => {
          // console.log(_.maxBy(allColumns, 'visitDate'), allColumns)
          if (
            row.dataType === 'testcategory' ||
            visitColumn.visitDate === _.maxBy(allColumns, 'visitDate')
          )
            return {
              style: { backgroundColor: '#daecf5' },
            }
        },
      }
    })
  }

  useEffect(() => {
    // console.log(outOfRangeLatest)
    if (onlyMC) {
      setFilteredAllColumns(
        allColumns.filter(
          x =>
            x.dataIndex === 'testName' ||
            x.dataIndex === 'referenceRange' ||
            x.dataIndex === 'action' ||
            x.visitType === 4,
        ),
      )
    }
    if (outOfRangeAll) {
      let tempData = _.clone(allData)
      tempData.forEach(data => {
        data.visible = false
        allColumns.forEach(column => {
          if (column.visitId && data[`v_${column.visitId}_shouldFlag`]) {
            data.visible = true
            tempData.find(
              parent =>
                parent.dataType === 'testcategory' &&
                parent.testCategoryFK === data.testCategoryFK,
            ).visible = true
          }
        })
      })
      // console.log(tempData.filter(x => x.visible))
      setFinalData(tempData.filter(x => x.visible))
    } else if (outOfRangeLatest) {
      let tempData = _.clone(allData)
      tempData.forEach(data => {
        data.visible = false
        if (allColumns.length > 2) {
          let latestColumn = allColumns[2]
          if (data[`v_${latestColumn.visitId}_shouldFlag`]) {
            data.visible = true
            tempData.find(
              parent =>
                parent.dataType === 'testcategory' &&
                parent.testCategoryFK === data.testCategoryFK,
            ).visible = true
          }
        }
      })
      // console.log(tempData.filter(x => x.visible))
      setFinalData(tempData.filter(x => x.visible))
    } else {
      let tempData = _.clone(allData)
      tempData.forEach(data => {
        data.visible = false
        allColumns.forEach(column => {
          // by default as long as result then show
          if (column.visitId && data[`v_${column.visitId}_finalResult`]) {
            data.visible = true
            tempData.find(
              parent =>
                parent.dataType === 'testcategory' &&
                parent.testCategoryFK === data.testCategoryFK,
            ).visible = true
          }
        })
      })
      // console.log(tempData)
      // console.log(allData)
      setFinalData(tempData.filter(x => x.visible))
    }
  }, [onlyMC, outOfRangeAll, outOfRangeLatest, allData, allColumns])
  return (
    <div>
      <GridContainer>
        <GridItem md={9}>
          {clinicSettings?.settings?.isEnableMedicalCheckupModule && (
            <Checkbox
              label='Display MC Only'
              style={{
                display: 'inline-block',
                fontSize: '14px!important',
                width: 160,
              }}
              checked={onlyMC}
              onChange={e => {
                setOnlyMC(e.target?.value)
              }}
            ></Checkbox>
          )}
          <Checkbox
            style={{
              display: 'inline-block',
              width: 210,
            }}
            checked={outOfRangeLatest}
            label='Out of Range (Latest Visit)'
            onChange={e => {
              setOutOfRangeLatest(e.target.value)
              if (e.target.value) {
                setOutOfRangeAll(false)
              }
            }}
          ></Checkbox>
          <Checkbox
            style={{
              display: 'inline-block',
              width: 200,
            }}
            label='Out of Range (All Visit)'
            checked={outOfRangeAll}
            onChange={e => {
              setOutOfRangeAll(e.target.value)
              if (e.target.value) {
                setOutOfRangeLatest(false)
              }
            }}
          ></Checkbox>
        </GridItem>
        <GridItem md={3}>
          {!allRetrieved && (
            <Link
              style={{
                float: 'right',
                position: 'relative',
                textDecoration: 'underline',
                marginRight: -8,
                top: 3,
              }}
              onClick={e => {
                e.preventDefault()
                loadData()
              }}
            >
              <span>Load More</span>
            </Link>
          )}
        </GridItem>
      </GridContainer>
      <Table
        size='small'
        bordered
        className='noBgTable minorPaddingTable'
        pagination={false}
        columns={onlyMC ? filteredAllColumns : allColumns}
        dataSource={finalData}
        scroll={{ y: height - 110 }}
      />
      <CommonModal
        open={showModal}
        onClose={onCloseReport}
        title='Laboratory Test Report'
        maxWidth='lg'
      >
        <ReportViewer
          reportID={94}
          reportParameters={{ visitId: targetVisitId }}
        />
      </CommonModal>
      <CommonModal
        open={showResultDetails}
        onClose={onCloseResultDetails}
        title='Result Details'
        maxWidth='md'
      >
        <ResultDetails showResultDetails={true} visitId={targetVisitId} />
      </CommonModal>
    </div>
  )
}
export default LabResults
