import React, { Component } from 'react'
import withStyles from '@material-ui/core/styles/withStyles'
import { RichEditor, ScribbleNoteItem } from '@/components'
import Authorized from '@/utils/Authorized'
import CannedTextButton from './CannedText/CannedTextButton'

class NoteDetails extends Component {
  constructor (props) {
    super(props)
    this.richEditor = React.createRef()
  }

  onPrevDoctorNoteClick = async () => {
    const result = await this.getPrevDoctorNotes()
    if (this.richEditor && this.richEditor.props) {
      const { editorState } = this.richEditor.props
      this.richEditor.update(RichEditor.insertHtml(editorState, result))
      setTimeout(() => {
        this.richEditor.focus()
      }, 1)
    }
  }

  handleSelectCannedText = async (cannedText) => {
    const result = await this.getCannedText(cannedText)
    if (this.richEditor && this.richEditor.props) {
      const { editorState } = this.richEditor.props
      this.richEditor.update(RichEditor.insertHtml(editorState, result))
      setTimeout(() => {
        this.richEditor.focus()
      }, 1)
    }
  }

  getPrevDoctorNotes = async () => {
    const { visitRegistration, item: { cannedTextTypeFK } } = this.props
    const visitId = ((visitRegistration.entity || {}).visit || {}).id
    let previousDoctorNote = await this.props.dispatch({
      type: 'cannedText/queryPrevDoctorNotes',
      payload: { visitId },
    })

    let text = ''
    if (previousDoctorNote) {
      if (cannedTextTypeFK === 1) {
        text = previousDoctorNote.note || ''
      } else if (cannedTextTypeFK === 6) {
        text = previousDoctorNote.plan || ''
      } else if (cannedTextTypeFK === 2) {
        text = previousDoctorNote.chiefComplaints || ''
      } else if (cannedTextTypeFK === 3) {
        text = previousDoctorNote.history || ''
      }
    }
    return text
  }

  getCannedText = (cannedText) => {
    const { cannedTextRow = {} } = this.props
    const { authority } = cannedTextRow
    const accessRight = Authorized.check(authority)

    if (accessRight && accessRight.rights !== 'enable') return ''
    const { text } = cannedText
    return text
  }

  render () {
    const {
      item,
      scriblenotes,
      width,
      args,
      index,
      scribbleNoteUpdateState,
      onSettingClick,
      onCannedTextClick,
      loading,
      onRichEditorBlur,
    } = this.props
    return (
      <div>
        <div
          style={{
            position: 'absolute',
            zIndex: 1,
            left: 305,
            right: 0,
            top: 10,
          }}
        >
          <ScribbleNoteItem
            scribbleNoteUpdateState={scribbleNoteUpdateState}
            category={item.category}
            arrayName={item.scribbleField}
            categoryIndex={item.scribbleNoteTypeFK}
            scribbleNoteArray={scriblenotes[item.category][item.scribbleField]}
            gridItemWidth={width}
          />

          <Authorized authority='settings.cannedtext'>
            <CannedTextButton
              onSettingClick={onSettingClick}
              onPrevDoctorNoteClick={this.onPrevDoctorNoteClick}
              onCannedTextClick={onCannedTextClick}
              cannedTextTypeFK={item.cannedTextTypeFK}
              handleSelectCannedText={this.handleSelectCannedText}
            />
          </Authorized>
        </div>

        <RichEditor
          editorRef={(ref) => {
            this.richEditor = ref
          }}
          autoFocus={index === 0}
          disabled={loading.global}
          style={{ marginBottom: 0 }}
          strongLabel
          onRichEditorBlur={onRichEditorBlur}
          height={item.height}
          {...args}
        />
      </div>
    )
  }
}
export default NoteDetails
