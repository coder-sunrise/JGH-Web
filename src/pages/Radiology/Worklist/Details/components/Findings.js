import React, { useState, useEffect } from 'react'
import withStyles from '@material-ui/core/styles/withStyles'
import { makeStyles } from '@material-ui/styles'
import { connect, useSelector, useDispatch } from 'dva'
import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromHTML,
} from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import htmlToDraft from 'html-to-draftjs'
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
import { getUniqueId, navigateDirtyCheck } from '@/utils/utils'
import ScribbleNote from '@/pages/Shared/ScribbleNote/ScribbleNote'
import { scribbleTypes } from '@/utils/codes'

const useStyles = makeStyles(theme => ({
  editor: {
    fontSize: '14px',
    minHeight: '500px',
  },
}))

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
  const classes = useStyles()
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
    const newRadiologyScribbleNote = radiologyScribbleNote.map(scribbleNote => {
      return {
        ...scribbleNote,
        uid: getUniqueId(),
      }
    })
    const fields = [item]
    const payload = {
      entity: '',
      selectedItemUid: '',
      ...fields.reduce(
        (_result, field) => ({
          ..._result,
          [field.fieldName]: {
            [field.scribbleField]: newRadiologyScribbleNote,
          },
        }),
        {},
      ),
    }
    setScribbleNotes(newRadiologyScribbleNote)
    dispatch({
      type: 'scriblenotes/updateState',
      payload,
    })
  }, [radiologyScribbleNote])

  useEffect(() => {
    if (defaultValue && defaultValue !== '') {
      const blocksFromHTML = htmlToDraft(defaultValue)
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
    const raw = convertToRaw(currentContent)
    raw.blocks
      .filter(b => b.type === 'unstyled' && b.text == '')
      .forEach(b => (b.text = ' '))
    return draftToHtml(raw)
  }

  const handleEditorStateChange = newEditorState => {
    setEditorState(newEditorState)
    onChange({
      examinationFinding: getHtmlFromEditorState(newEditorState),
      radiologyScribbleNote: scribbleNotes,
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

  const scribbleNoteDrawing = ({
    subject,
    temp,
    thumbnail = null,
    origin = null,
  }) => {
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
      const updateItem = newArrayItems.find(
        x => x.uid === scriblenotes.selectedItemUid,
      )
      updateItem.subject = subject
      updateItem.scribbleNoteLayers = temp
      updateItem.thumbnail = thumbnail

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
          id: updateItem.scribbleNoteFK,
          scribbleNoteTypeFK: updateItem.scribbleNoteTypeFK,
          scribbleNoteLayers: temp.map(t => {
            return {
              ...t,
              scribbleNoteFK: updateItem.scribbleNoteFK,
            }
          }),
          subject,
          thumbnail,
          origin,
        },
      })

      scribbleNoteData[category] = newArrayItems
      previousData = Object.keys(scribbleNoteData).reduce((result, key) => {
        return [...result, ...scribbleNoteData[key]]
      }, [])
    } else {
      const newData = {
        uid: getUniqueId(),
        subject,
        thumbnail,
        origin,
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
          newData.origin = undefined
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
    previousData = _.concat(
      previousData.filter(x => !x.isDeleted),
      scribbleNotes.filter(x => x.id && x.isDeleted),
    )
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
    const deleteItem = tempArrayItems.find(
      x => x.uid === scriblenotes.selectedItemUid,
    )
    const updatedCategoryScribbleArray = currentScribbleNoteData[
      category
    ].filter(x => x.uid !== scriblenotes.selectedItemUid)

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
    Authorized.check('radiologyworklist.examinationfinding')?.rights ===
    'disable'

  return (
    <div>
      <GridContainer>
        <GridItem sm={9} md={9}>
          <Typography style={{ position: 'relative', top: 10 }}>
            Examination Findings :
          </Typography>
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
              onChecklistConfirm={(checklist = '') => {
                if (!checklist.trim().length) return
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
            classes={classes}
            disabled={isReadOnly}
            editorState={editorState}
            onEditorStateChange={handleEditorStateChange}
            stripPastedStyles={false}
            // height={250}
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
          scribbleNoteType={
            scribbleTypes.find(x => x.typeFK === SCRIBBLE_NOTE_TYPE.RADIOLOGY)
              ?.type
          }
        />
      </CommonModal>
    </div>
  )
}
