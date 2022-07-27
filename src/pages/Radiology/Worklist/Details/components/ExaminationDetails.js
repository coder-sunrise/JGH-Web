import React, { useEffect, useState, useContext } from 'react'
import { useSelector } from 'dva'
import { Radio, Input } from 'antd'
import moment from 'moment'
import Authorized from '@/utils/Authorized'
import { GridContainer, GridItem, CommonModal } from '@/components'
import {
  RightAlignGridItem,
  SectionTitle,
  TextGridItem,
} from '../../../Components'
import WorklistContext from '@/pages/Radiology/Worklist/WorklistContext'
import {
  RADIOLOGY_WORKITEM_STATUS,
  CLINICAL_ROLE,
  CANNED_TEXT_TYPE,
  SCRIBBLE_NOTE_TYPE,
} from '@/utils/constants'
import { CannedTextButton, Findings } from './index'
import RadiographerTag from './RadiographerTag'
import { scribbleTypes } from '@/utils/codes'
import ScribbleNote from '@/pages/Shared/ScribbleNote/ScribbleNote'

const findingSettings = {
  authority: 'queue.consultation.clinicalnotes.history',
  category: 'RadiologyFindings',
  fieldName: 'RadiologyFindings',
  fieldTitle: 'RadiologyFindings',
  scribbleField: 'radiologyFindingsScribbleArray',
  scribbleNoteTypeFK: SCRIBBLE_NOTE_TYPE.RADIOLOGY,
  index: 0,
  height: 390,
  enableSetting: 'isEnableClinicNoteHistory',
}

export const ExaminationDetails = ({
  workitem = {},
  onChange,
  showRequiredField = false,
  ...restProps
}) => {
  const currentUser = useSelector(state => state.user.data)
  const [assignedRadiographers, setAssignedRadiographers] = useState([])
  const [comment, setComment] = useState('')
  const [findings, setFindings] = useState({})
  const [hasChanged, setHasChanged] = useState(false)
  const [scribbleNoteSelectedData, setSribbleNoteSelectedData] = useState({})
  const [isShowScribbleNote, setIsShowScribbleNote] = useState(false)
  const { isReadOnly } = useContext(WorklistContext)
  const base64Prefix = 'data:image/jpeg;base64,'

  if (!workitem) return <div></div>

  useEffect(() => {
    if (hasChanged) {
      onChange({ assignedRadiographers, comment, ...findings })
      setHasChanged(false)
    }
  }, [assignedRadiographers, comment, findings, hasChanged])

  useEffect(() => {
    if (workitem) {
      setComment(workitem.comment)
      setFindings({
        examinationFinding: workitem.examinationFinding,
        radiologyScribbleNote: workitem.radiologyScribbleNote,
      })
      setAssignedRadiographers(workitem.assignedRadiographers ?? [])

      // If no user assigned to the current workitem, default to current radiographer
      if (
        !workitem.assignedRadiographers ||
        workitem.assignedRadiographers.length === 0
      ) {
        const currentClinician = currentUser.clinicianProfile
        if (
          currentClinician.userProfile.role.clinicRoleFK ===
            CLINICAL_ROLE.RADIOGRAPHER &&
          workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW
        ) {
          setAssignedRadiographers([currentClinician])
          setHasChanged(true)
        }
      }
    }

    return () => {
      setAssignedRadiographers([])
      setComment('')
      setFindings({})
      setHasChanged(false)
    }
  }, [workitem])

  const isHiddenExaminationFinding =
    Authorized.check('radiologyworklist.examinationfinding')?.rights ===
    'hidden'

  let currentScribbleNotes = []
  const scribbleType = scribbleTypes.find(o => o.type === 'radiology')
  if (scribbleType && workitem?.radiologyScribbleNote) {
    currentScribbleNotes = _.orderBy(
      workitem.radiologyScribbleNote.filter(
        o => o.scribbleNoteTypeFK === scribbleType.typeFK,
      ),
      ['subject'],
      ['asc'],
    )
  }

  const viewScribbleNote = scribbleNote => {
    setSribbleNoteSelectedData(scribbleNote)
    setIsShowScribbleNote(true)
    window.g_app._store.dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        showViewScribbleModal: true,
        isReadonly: true,
        entity: scribbleNote,
      },
    })
  }

  const scribbleLink = currentScribbleNotes.map(o => {
    let src
    if (o.thumbnail && o.thumbnail !== '') {
      src = `${base64Prefix}${o.thumbnail}`
    }
    return (
      <div
        style={{
          marginRight: 10,
          fontSize: '0.85rem',
          fontWeight: 'bold',
        }}
      >
        <span>{o.subject}</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #CCCCCC',
            width: 277,
            height: 152,
            cursor: 'pointer',
          }}
          onClick={() => {
            viewScribbleNote(o)
          }}
        >
          {src ? (
            <img src={src} alt={o.subject} width={275} height={150} />
          ) : (
            <span>No Image</span>
          )}
        </div>
      </div>
    )
  })

  const toggleScribbleModal = () => {
    setIsShowScribbleNote(false)
    window.g_app._store.dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        showViewScribbleModal: isShowScribbleNote,
        isReadonly: false,
      },
    })
  }

  return (
    <div>
      <div>
        <SectionTitle title='Examination Details' />

        {!isReadOnly &&
        workitem.statusFK <= RADIOLOGY_WORKITEM_STATUS.MODALITYCOMPLETED ? (
          <GridContainer style={{ rowGap: 10 }}>
            <GridItem md={2}>
              <RightAlignGridItem md={12}>
                <span style={{ position: 'relative', top: 3 }}>
                  Radiology Technologist :
                </span>
              </RightAlignGridItem>
            </GridItem>

            <GridItem md={10}>
              {workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW ||
              workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.INPROGRESS ? (
                <div style={{ display: 'flex' }}>
                  <RadiographerTag
                    value={assignedRadiographers}
                    onChange={newVal => {
                      setAssignedRadiographers(newVal)
                      setHasChanged(true)
                    }}
                  />
                  {showRequiredField && assignedRadiographers.length === 0 && (
                    <span style={{ color: 'red' }}>
                      * This is a required field
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ position: 'relative', top: 3 }}>
                  {' '}
                  {assignedRadiographers.map(r => r.name).join(', ')}
                </span>
              )}
            </GridItem>

            <GridItem md={2}>
              <RightAlignGridItem md={12}>
                <div style={{ position: 'relative', top: 10 }}>
                  Technologist Comments :
                </div>
              </RightAlignGridItem>
            </GridItem>
            <GridItem md={10} style={{ textAlign: 'right' }}>
              <CannedTextButton
                buttonType='text'
                cannedTextTypeFK={CANNED_TEXT_TYPE.RADIOGRAPHERCOMMENT}
                style={{
                  marginRight: 8,
                  marginBottom: 0,
                }}
                handleSelectCannedText={cannedText => {
                  setComment((comment ? comment + '\n' : '') + cannedText.text)
                  setHasChanged(true)
                }}
              />
            </GridItem>
            <GridItem md={12}>
              <div style={{ margin: '0px 8px' }}>
                <Input.TextArea
                  maxLength={2000}
                  value={comment}
                  onChange={e => {
                    setComment(e.target.value)
                    setHasChanged(true)
                  }}
                  autoSize={{ minRows: 3, maxRows: 5 }}
                />
              </div>
            </GridItem>
            {workitem.statusFK ===
              RADIOLOGY_WORKITEM_STATUS.MODALITYCOMPLETED &&
              !isHiddenExaminationFinding && (
                <GridItem md={12}>
                  <Findings
                    defaultValue={workitem.examinationFinding}
                    radiologyScribbleNote={workitem.radiologyScribbleNote}
                    onChange={value => {
                      setFindings(value)
                      setHasChanged(true)
                    }}
                    workItem={workitem}
                    item={findingSettings}
                    {...restProps}
                  />
                </GridItem>
              )}
          </GridContainer>
        ) : (
          <GridContainer style={{ rowGap: 10 }}>
            <GridItem md={2}>
              <RightAlignGridItem md={12}>
                Radiology Technologist :
              </RightAlignGridItem>
            </GridItem>
            <TextGridItem md={10}>
              {assignedRadiographers.map(r => r.name).toString()}
            </TextGridItem>
            <GridItem md={2}>
              <RightAlignGridItem md={12}>
                Technologist Comments :
              </RightAlignGridItem>
            </GridItem>
            <TextGridItem style={{ whiteSpace: 'pre-wrap' }} md={10}>
              {workitem.comment}
            </TextGridItem>

            {workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.COMPLETED ? (
              !isHiddenExaminationFinding && (
                <React.Fragment>
                  <GridItem md={2}>
                    <RightAlignGridItem md={12}>
                      Examination Findings :
                    </RightAlignGridItem>
                  </GridItem>

                  <GridItem md={10}>
                    {workitem.examinationFinding ? (
                      <div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: workitem.examinationFinding.replaceAll('<br></p>','</p><br>'),
                          }}
                        />
                        {scribbleLink.length > 0 && (
                          <GridContainer>{scribbleLink}</GridContainer>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </GridItem>
                </React.Fragment>
              )
            ) : (
              <React.Fragment>
                <GridItem md={2}>
                  <RightAlignGridItem md={12}>
                    Cancel Reason:
                  </RightAlignGridItem>
                </GridItem>

                <TextGridItem md={10}>
                  {workitem.cancellationReason}
                </TextGridItem>
              </React.Fragment>
            )}
          </GridContainer>
        )}
      </div>
      <CommonModal
        open={isShowScribbleNote}
        title='Scribble'
        fullScreen
        bodyNoPadding
        observe='ScribbleNotePage'
        onClose={toggleScribbleModal}
      >
        <ScribbleNote
          {...restProps}
          toggleScribbleModal={toggleScribbleModal}
          scribbleData={scribbleNoteSelectedData}
        />
      </CommonModal>
    </div>
  )
}
