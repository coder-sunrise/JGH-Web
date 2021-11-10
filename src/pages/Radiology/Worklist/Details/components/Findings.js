import React, { useState, useEffect } from 'react'
import withStyles from '@material-ui/core/styles/withStyles'
import { connect, useSelector, useDispatch } from 'dva'
import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromHTML,
} from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import Authorized from '@/utils/Authorized'
import {
  RichEditor,
  ScribbleNoteItem,
  GridContainer,
  GridItem,
  Checklist,
  CommonModal,
} from '@/components'
import { Typography, Input } from 'antd'
import { CHECKLIST_CATEGORY, SCRIBBLE_NOTE_TYPE } from '@/utils/constants'
import { navigateDirtyCheck } from '@/utils/utils'
import ScribbleNote from '@/pages/Shared/ScribbleNote/ScribbleNote'

export const Findings = ({
  item,
  radiologyScribbleNote,
  defaultValue,
  onChange,
  args,
  index,
  loading,
  ...restProps
}) => {
  const dispatch = useDispatch()
  const scriblenotes = useSelector(state => state.scriblenotes)
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const [width, setWidth] = useState(0)
  const [scribbleNoteState, setScribbleNoteState] = useState({
    category: '',
    arrayName: '',
    categoryIndex: '',
    selectedData: '',
  })
  const [scribbleNotes, setScribbleNotes] = useState([])

  useEffect(() => {
    const fields = [item]
    const payload = {
      entity: '',
      selectedIndex: '',
      ...fields.reduce(
        (_result, field) => ({
          ..._result,
          [field.fieldName]: { [field.scribbleField]: radiologyScribbleNote },
        }),
        {},
      ),
    }
    setScribbleNotes(radiologyScribbleNote)
    dispatch({
      type: 'scriblenotes/updateState',
      payload,
    })
  }, [radiologyScribbleNote])

  useEffect(() => {
    if (defaultValue && defaultValue !== '') {
      const blocksFromHTML = convertFromHTML(defaultValue)
      if (blocksFromHTML && blocksFromHTML.contentBlocks !== null) {
        const newState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap,
        )
        setEditorState(EditorState.createWithContent(newState))
      }
    }
  }, [defaultValue])

  const getHtmlFromEditorState = editorState => {
    const currentContent = editorState.getCurrentContent()
    if (currentContent.plainText === '') return

    return draftToHtml(convertToRaw(currentContent))
  }

  const handleEditorStateChange = newEditorState => {
    setEditorState(newEditorState)
    onChange({
      examinationFinding: getHtmlFromEditorState(newEditorState),
      radiologyScribbleNote,
    })
  }

  const scribbleNoteUpdateState = (
    categoryValue,
    arrayNameValue,
    categoryIndexValue,
    selectedDataValue,
  ) => {
    setScribbleNoteState({
      category: categoryValue,
      arrayName: arrayNameValue,
      categoryIndex: categoryIndexValue,
      selectedData: selectedDataValue,
    })
  }

  useEffect(() => {
    resize()
  }, [])
  const resize = () => {
    if (window.innerWidth <= 1785) {
      setWidth(window.innerWidth / 11)
    } else {
      setWidth(window.innerWidth / 5.8)
    }
  }

  const toggleScribbleModal = () => {
    dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        showScribbleModal: !scriblenotes.showScribbleModal,
      },
    })
  }

  const scribbleNoteDrawing = ({ subject, temp, thumbnail = null }) => {
    const { category, arrayName, categoryIndex } = scribbleNoteState
    const fields = [item]

    const scribbleNoteData = fields.reduce(
      (result, field) => ({
        ...result,
        [field.fieldName]: scriblenotes[field.fieldName][field.scribbleField],
      }),
      {},
    )

    let previousData = scribbleNotes

    if (scriblenotes.editEnable) {
      const newArrayItems = [...scriblenotes[category][arrayName]]
      newArrayItems[scriblenotes.selectedIndex].subject = subject
      newArrayItems[scriblenotes.selectedIndex].scribbleNoteLayers = temp
      newArrayItems[scriblenotes.selectedIndex].thumbnail = thumbnail

      dispatch({
        type: 'scriblenotes/updateState',
        payload: {
          ...scriblenotes,
          [category]: {
            [arrayName]: newArrayItems,
          },
        },
      })

      dispatch({
        type: 'scriblenotes/upsert',
        payload: {
          id: newArrayItems[scriblenotes.selectedIndex].scribbleNoteFK,
          scribbleNoteTypeFK:
            newArrayItems[scriblenotes.selectedIndex].scribbleNoteTypeFK,
          scribbleNoteLayers: temp.map(t => {
            return {
              ...t,
              scribbleNoteFK:
                newArrayItems[scriblenotes.selectedIndex].scribbleNoteFK,
            }
          }),
          subject,
          thumbnail,
        },
      })

      scribbleNoteData[category] = newArrayItems
      previousData = Object.keys(scribbleNoteData).reduce((result, key) => {
        return [...result, ...scribbleNoteData[key]]
      }, [])
    } else {
      const newData = {
        subject,
        thumbnail,
        scribbleNoteTypeFK: categoryIndex,
        scribbleNoteTypeName: category,
        scribbleNoteLayers: temp,
      }
      dispatch({
        type: 'scriblenotes/upsert',
        payload: newData,
      }).then(o => {
        if (o) {
          newData.scribbleNoteFK = o.id
        }
      })

      dispatch({
        type: 'scriblenotes/updateState',
        payload: {
          ...scriblenotes,
          [category]: {
            [arrayName]: [...scriblenotes[category][arrayName], newData],
          },
        },
      })
      previousData.push(newData)
    }

    setScribbleNotes(previousData)

    onChange({
      examinationFinding: getHtmlFromEditorState(editorState),
      radiologyScribbleNote: previousData,
    })
  }

  const insertIntoRadiologyFindings = () => {
    // TODO: Not applicable, remove from component
  }

  const deleteScribbleNote = () => {
    const { category, arrayName, categoryIndex } = scribbleNoteState
    const fields = [item]
    let previousData = scribbleNotes

    const currentScribbleNoteData = fields.reduce(
      (result, field) => ({
        ...result,
        [field.category]: scriblenotes[field.category][field.scribbleField],
      }),
      {},
    )
    const tempArrayItems = [...scriblenotes[category][arrayName]]
    const deleteItem = tempArrayItems[scriblenotes.selectedIndex]
    const updatedCategoryScribbleArray = currentScribbleNoteData[
      category
    ].filter((_, index) => index !== scriblenotes.selectedIndex)

    dispatch({
      type: 'scriblenotes/removeScribble',
      payload: deleteItem.scribbleNoteFK,
    })

    dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        ...scriblenotes,
        [category]: {
          [arrayName]: updatedCategoryScribbleArray,
        },
      },
    })

    for (let i = 0; i < previousData.length; i++) {
      if (JSON.stringify(previousData[i]) === JSON.stringify(deleteItem)) {
        if (previousData[i].isDeleted !== undefined) {
          previousData[i].isDeleted = true
        } else {
          previousData.splice(i, 1)
        }
      }
    }

    setScribbleNotes(previousData)

    onChange({
      examinationFinding: getHtmlFromEditorState(editorState),
      radiologyScribbleNote: previousData,
    })

    toggleScribbleModal()
  }

  const isReadOnly =
    Authorized.check('radiologyworklist.examinationfinding').rights ===
    'disable'

  return (
    <div>
      <GridContainer>
        <GridItem sm={9} md={9}>
          <Typography>Examination Findings</Typography>
        </GridItem>
        <GridItem sm={3} md={3}>
          <div
            style={{
              // height: 30,
              textAlign: 'right',
            }}
          >
            <ScribbleNoteItem
              buttonProps={{ disabled: isReadOnly }}
              scribbleNoteUpdateState={scribbleNoteUpdateState}
              category={item.category}
              arrayName={item.scribbleField}
              categoryIndex={item.scribbleNoteTypeFK}
              scribbleNoteArray={
                scriblenotes[item.category][item.scribbleField]
              }
              gridItemWidth={width}
            />

            <Checklist
              buttonProps={{ disabled: isReadOnly }}
              checklistCategory={CHECKLIST_CATEGORY.RADIOLOGY}
              buttonStyle={{ marginRight: '0px' }}
              onChecklistConfirm={checklist => {
                const current = getHtmlFromEditorState(editorState)
                const appended = current + ' ' + checklist

                const blocksFromHTML = convertFromHTML(appended)

                const newState = ContentState.createFromBlockArray(
                  blocksFromHTML.contentBlocks,
                  blocksFromHTML.entityMap,
                )
                handleEditorStateChange(EditorState.createWithContent(newState))
              }}
              {...restProps}
            />
          </div>
        </GridItem>
        <GridItem sm={12} md={12}>
          <RichEditor
            disabled={isReadOnly}
            editorState={editorState}
            onEditorStateChange={handleEditorStateChange}
            stripPastedStyles={false}
            height={250}
          />
        </GridItem>
      </GridContainer>

      <CommonModal
        open={scriblenotes.showScribbleModal}
        title='Scribble'
        fullScreen
        bodyNoPadding
        observe='ScribbleNotePage'
        onClose={() =>
          navigateDirtyCheck({
            onProceed: toggleScribbleModal(),
          })
        }
      >
        <ScribbleNote
          {...restProps}
          addScribble={scribbleNoteDrawing}
          toggleScribbleModal={toggleScribbleModal}
          scribbleData={scribbleNoteState.selectedData}
          deleteScribbleNote={deleteScribbleNote}
        />
      </CommonModal>
    </div>
  )
}
