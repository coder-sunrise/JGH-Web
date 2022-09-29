import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
import { useDispatch } from 'dva'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import {
  Tooltip,
  dateFormatLong,
  CommonTableGrid,
  GridContainer,
  GridItem,
} from '@/components'
import { ListBoxComponent } from '@syncfusion/ej2-react-dropdowns'

const styles = theme => ({
  cell: {
    padding: 4,
  },
  toDo: {
    fontSize: 12,
    lineHeight: '17px',
    width: 17,
    textAlign: 'center',
  },
})
const CombineVisit = ({
  patientProfileId,
  footer,
  onConfirm,
  selectedLanguage,
  medicalCheckupReportingDetails,
  mainDivHeight = 700,
}) => {
  const dispatch = useDispatch()
  const [mcHistory, setMCHistory] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [combineComments, setCombineComments] = useState([])

  useEffect(() => {
    if (patientProfileId) {
      dispatch({
        type: 'medicalCheckupReportingDetails/queryMedicalCheckupHistory',
        payload: {
          id: patientProfileId,
        },
      }).then(response => {
        if (response && response.status === '200') {
          setMCHistory(response.data.data)
          setDefaultComments(response.data.data)
        }
      })
    }
  }, [patientProfileId])

  const setDefaultComments = medicalCheckupWorkitems => {
    let newComments = (
      medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemGroup
        ?.medicalCheckupWorkitemCombineSummaryComment || []
    ).map(item => ({ ...item }))
    const selectMCs = (
      medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemGroup
        ?.medicalCheckupWorkitemCombine || []
    ).map(item => item.medicalCheckupWorkitemFK)
    const selectComments = getSelectComments(
      medicalCheckupWorkitems,
      selectedRows,
    )
    selectComments.forEach(comment => {
      const selectComment = newComments.find(
        newComment =>
          !newComment.isDeleted &&
          newComment.medicalCheckupSummaryCommentFK === comment.id,
      )
      if (!selectComment) {
        newComments.push({
          medicalCheckupSummaryCommentFK: comment.id,
          englishComment: comment.englishComment,
          japaneseComment: comment.japaneseComment,
        })
      }
    })
    setSelectedRows(selectMCs)
    setCombineComments(newComments)
  }
  const getSelectComments = (medicalCheckupWorkitems, selectMCs) => {
    let selectComments = []
    var currentMC = medicalCheckupWorkitems.find(
      item => item.id === medicalCheckupReportingDetails.entity?.id,
    )
    selectComments = selectComments.concat(
      _.orderBy(currentMC.medicalCheckupSummaryComment, ['sequence']),
    )
    var selectMC = medicalCheckupWorkitems.filter(
      item => selectMCs.indexOf(item.id) >= 0,
    )
    selectMC.forEach(item => {
      selectComments = selectComments.concat(
        _.orderBy(item.medicalCheckupSummaryComment, ['sequence']),
      )
    })
    return selectComments
  }

  const onConfirmClick = async () => {
    const newActiveCombineComments = combineComments
      .filter(item => !item.isDeleted)
      .map((item, index) => ({
        ...item,
        sequence: index,
      }))

    let newMedicalCheckupWorkitemGroup
    if (medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemGroup) {
      let newCombineMC =
        medicalCheckupReportingDetails.entity.medicalCheckupWorkitemGroup
          .medicalCheckupWorkitemCombine || []
      let newCombineComments =
        medicalCheckupReportingDetails.entity.medicalCheckupWorkitemGroup
          .medicalCheckupWorkitemCombineSummaryComment || []
      //insert new checked mc
      selectedRows
        .filter(
          val =>
            !newCombineMC.find(item => item.medicalCheckupWorkitemFK === val),
        )
        .forEach(val => {
          var selectMC = mcHistory.find(mc => mc.id === val)
          newCombineMC.push({
            medicalCheckupWorkitemFK: val,
            reportId: selectMC.reportId,
          })
        })
      // remove unchecked mc
      newCombineMC
        .filter(item => selectedRows.indexOf(item.medicalCheckupWorkitemFK) < 0)
        .forEach(item => (item.isDeleted = true))
      //insert or update select commet
      newActiveCombineComments.forEach(comment => {
        var selectComment = newCombineComments.find(
          item =>
            item.medicalCheckupSummaryCommentFK ===
            comment.medicalCheckupSummaryCommentFK,
        )
        if (selectComment) {
          selectComment.sequence = comment.sequence
        } else {
          newCombineComments.push({ ...comment })
        }
      })
      //remove unselect comments
      newCombineComments
        .filter(
          item =>
            !newActiveCombineComments.find(
              comment =>
                comment.medicalCheckupSummaryCommentFK ===
                item.medicalCheckupSummaryCommentFK,
            ),
        )
        .forEach(item => (item.isDeleted = true))

      newMedicalCheckupWorkitemGroup = {
        ...medicalCheckupReportingDetails.entity?.medicalCheckupWorkitemGroup,
        medicalCheckupWorkitemCombine: newCombineMC,
        medicalCheckupWorkitemCombineSummaryComment: newCombineComments,
      }
    } else {
      newMedicalCheckupWorkitemGroup = {
        primaryMedicalCheckupWorkitemFK:
          medicalCheckupReportingDetails.entity.id,
        medicalCheckupWorkitemCombine: selectedRows.map(val => {
          var selectMC = mcHistory.find(mc => mc.id === val)
          return {
            medicalCheckupWorkitemFK: val,
            reportId: selectMC.reportId,
          }
        }),
        medicalCheckupWorkitemCombineSummaryComment: newActiveCombineComments,
      }
    }
    const response = await dispatch({
      type: 'medicalCheckupReportingDetails/upsert',
      payload: {
        ...medicalCheckupReportingDetails.entity,
        medicalCheckupWorkitemGroup: newMedicalCheckupWorkitemGroup,
      },
    })
    if (response) {
      onConfirm()
    }
  }

  const handleSelectionChange = selection => {
    setSelectedRows(selection)
    let newComments = [...combineComments]
    const selectComments = getSelectComments(mcHistory, selection)
    // add new select comment
    selectComments.forEach(comment => {
      const selectComment = newComments.find(
        newComment =>
          !newComment.isDeleted &&
          newComment.medicalCheckupSummaryCommentFK === comment.id,
      )
      if (!selectComment) {
        newComments.push({
          medicalCheckupSummaryCommentFK: comment.id,
          englishComment: comment.englishComment,
          japaneseComment: comment.japaneseComment,
        })
      }
    })

    //remove unselect comment
    newComments
      .filter(
        comment =>
          !comment.isDeleted &&
          !selectComments.find(
            selectComment =>
              selectComment.id === comment.medicalCheckupSummaryCommentFK,
          ),
      )
      .forEach(comment => (comment.isDeleted = true))

    setCombineComments(newComments)
  }
  const onDropGroup = e => {
    if (e.previousIndex === e.currentIndex) {
      return
    }
    setCombineComments(e.source.currentData)
  }
  return (
    <div>
      <GridContainer>
        <GridItem md={7}>
          <div>
            <h4>Current Available Medical Checkup Visits:</h4>
            <CommonTableGrid
              forceRender
              rows={mcHistory.filter(
                mc => mc.id !== medicalCheckupReportingDetails.entity?.id,
              )}
              columnExtensions={[
                {
                  columnName: 'reportId',
                  sortingEnabled: false,
                  width: 110,
                },
                {
                  columnName: 'visitDate',
                  sortingEnabled: false,
                  width: 100,
                  render: row => (
                    <span>{moment(row.visitDate).format(dateFormatLong)}</span>
                  ),
                },
                {
                  columnName: 'visitPurpose',
                  sortingEnabled: false,
                  width: 160,
                },
                {
                  columnName: 'visitRemarks',
                  sortingEnabled: false,
                },
              ]}
              columns={[
                { name: 'reportId', title: 'Report ID' },
                { name: 'visitDate', title: 'Visit Date' },
                { name: 'visitPurpose', title: 'Visit Purpose' },
                { name: 'visitRemarks', title: 'Visit Remarks' },
              ]}
              FuncProps={{
                pager: false,
                selectable: true,
                selectConfig: {
                  showSelectAll: true,
                  rowSelectionEnabled: row => true,
                },
              }}
              selection={selectedRows}
              onSelectionChange={handleSelectionChange}
              type='new'
              TableProps={{
                height: mainDivHeight - 170,
              }}
            />
          </div>
        </GridItem>
        <GridItem md={5}>
          <div>
            <h4>Combine Summary Comments:</h4>
            <div
              style={{
                overflowY: 'auto',
                maxHeight: mainDivHeight - 170,
              }}
            >
              <ListBoxComponent
                dataSource={combineComments.filter(
                  comment => !comment.isDeleted,
                )}
                allowDragAndDrop={true}
                scope='combined-list'
                fields={{ text: 'medicalCheckupSummaryCommentFK' }}
                selectionSettings={{ mode: 'Single' }}
                itemTemplate={row => (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderBottom: '1px solid #CCCCCC',
                    }}
                  >
                    {selectedLanguage === 'EN'
                      ? row.englishComment
                      : row.japaneseComment}
                  </div>
                )}
                drop={onDropGroup}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </GridItem>
      </GridContainer>
      {footer &&
        footer({
          onConfirm: onConfirmClick,
          confirmBtnText: 'Save',
        })}
    </div>
  )
}
export default compose(
  withStyles(styles),
  connect(({ medicalCheckupReportingDetails, user }) => ({
    medicalCheckupReportingDetails,
    user,
  })),
)(CombineVisit)
