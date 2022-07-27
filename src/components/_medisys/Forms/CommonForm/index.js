// import { connect } from 'dva'
import React, { PureComponent } from 'react'
import { DocumentEditor, CommonModal, Button, notification } from '@/components'
import { formatMessage, FormattedMessage } from 'umi'
// import moment from 'moment'
import AddPhotoAlternateIcon from '@material-ui/icons/AddPhotoAlternate'
import HideImageIcon from '@material-ui/icons/Image'
import DownloadIcon from '@material-ui/icons/CloudDownload'
import Print from '@material-ui/icons/Print'
import Signature from '../Signature'
import {
  PdfBitmap,
  PdfDocument,
  PdfPageOrientation,
  PdfPageSettings,
  PdfSection,
  SizeF,
} from '@syncfusion/ej2-pdf-export'
import { ImageElementBox } from '@syncfusion/ej2-react-documenteditor'

const base64Prefix = 'data:image/jpeg;base64,'

const exportPDF = container => {
  if (!container) return
  let pdfdocument = new PdfDocument()
  let count = container.documentEditor.pageCount
  let loadedPage = 0
  for (let i = 1; i <= count; i++) {
    // setTimeout(() =>
    {
      let format = 'image/jpeg'
      // Getting pages as image
      let image = container.documentEditor.exportAsImage(i, format)
      image.onload = function() {
        let imageHeight = parseInt(
          image.style.height.toString().replace('px', ''),
        )
        let imageWidth = parseInt(
          image.style.width.toString().replace('px', ''),
        )
        let section = pdfdocument.sections.add()
        let settings = new PdfPageSettings(0)
        if (imageWidth > imageHeight) {
          settings.orientation = PdfPageOrientation.Landscape
        }
        settings.size = new SizeF(imageWidth, imageHeight)
        section.setPageSettings(settings)
        let page = section.pages.add()
        let graphics = page.graphics
        let imageStr = image.src.replace('data:image/jpeg;base64,', '')
        let pdfImage = new PdfBitmap(imageStr)
        graphics.drawImage(pdfImage, 0, 0, imageWidth, imageHeight)
        loadedPage++
        if (loadedPage == count) {
          // Exporting the document as pdf
          pdfdocument.save(
            (container.documentEditor.documentName === ''
              ? 'document'
              : container.documentEditor.documentName) + '.pdf',
          )
        }
      }
    }
    // , 1)
  }
}

class CommonForm extends PureComponent {
  componentDidMount() {
    const {
      values: {
        formData: { content },
        formTemplateFK,
      },
    } = this.props
    if (content) return
    // setTimeout(() => {
    this.props
      .dispatch({
        type: 'settingDocumentTemplate/queryOne',
        payload: { id: formTemplateFK },
      })
      .then(r => {
        this.DEContainer.documentEditor.open(r.templateContent)
        this.documentChange()
      })
    // })
  }

  switchMode = () => {
    let isSigningMode = !this.state.isSigningMode
    this.DEContainer.documentEditor.editor.enforceProtection(
      '',
      isSigningMode ? 'ReadOnly' : 'FormFieldsOnly',
    )
    this.setState({ isSigningMode })
  }

  addSignature = () => {
    this.setState({ showSignature: true })
  }

  notificationWarning = _.debounce(
    message => notification.warning(message),
    500,
  )

  selectionChange = e => {
    const isImageSelected = e.source.documentEditor.selection.isImageSelected
    const isSelectionInEditRegion = e.source.documentEditor.selection.isSelectionInEditRegion()
    let isSignatured = false
    if (isSelectionInEditRegion) {
      const { start, end, documentHelper } = e.source.documentEditor.selection
      documentHelper.editableDiv.contentEditable = false
      documentHelper.editableDiv.contenteditable = false

      if (start.currentWidget.children.some(x => x instanceof ImageElementBox))
        isSignatured = true
    }
    if (
      this.mouseClicked &&
      this.props.values.statusFK !== 2 &&
      !isSelectionInEditRegion &&
      this.state.signatureCounter > 0
    )
      this.notificationWarning({
        message: 'Please remove signatures to update form content.',
      })
    this.setState({ isSelectionInEditRegion, isImageSelected, isSignatured })
    this.mouseClicked = false
  }

  deleteSignature = () => {
    if (this.state.isImageSelected) {
      this.DEContainer.documentEditor.selection.isImageSelected = false
      this.DEContainer.documentEditor.editor.deleteEditElement(
        this.DEContainer.documentEditor.selection,
      )
      this.setState({ isImageSelected: false })
      this.updateSignatureCounter(-1)
    }
  }

  updateSignature = ({ thumbnail }) => {
    const imageString =
      thumbnail && thumbnail.trim() != ''
        ? `${base64Prefix}${thumbnail}`
        : thumbnail
    this.DEContainer.documentEditor.editor.insertImage(imageString, 120, 60)
    this.updateSignatureCounter(+1)
  }

  updateSignatureCounter = val => {
    if (!val) return
    const newSignatureCounter = (this.state.signatureCounter || 0) + val
    this.props.setFieldValue('formData.signatureCounter', newSignatureCounter)
    this.setState({ signatureCounter: newSignatureCounter })
  }

  signatureChange = dirty => {
    this.signatureDirty = dirty
  }

  closeSignature = force => {
    if (!force && this.signatureDirty)
      this.props.dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmContent: formatMessage({
            id: 'app.general.leave-without-save',
          }),
          onConfirmSave: () => this.setState({ showSignature: false }),
        },
      })
    else this.setState({ showSignature: false })
  }

  showHideHighligth(isShow) {
    const selection = this.DEContainer.documentEditor.editor.selection
    const formFieldSettings = this.DEContainer.documentEditorSettings
      .formFieldSettings
    formFieldSettings.applyShading = isShow
    selection.isHighlightEditRegion = isShow
  }

  download = () => {
    this.showHideHighligth(false)
    // this.DEContainer.documentEditor.save(this.props.values.formName, 'Docx')
    exportPDF(this.DEContainer)
    this.showHideHighligth(true)
  }

  print = () => {
    this.showHideHighligth(false)
    this.DEContainer.documentEditor.print()
    this.showHideHighligth(true)
  }

  contentChange = () => {
    this.props.setFieldValue(
      'formData.content',
      this.DEContainer.documentEditor.serialize(),
    )
  }

  fillFormFields = () => {
    const fillData = this.props.values.fillData
    if (fillData) {
      const formFieldData = this.DEContainer.documentEditor.exportFormData()
      let newFormFieldData = []
      Object.entries(fillData).forEach(p => {
        formFieldData.forEach(f => {
          if (
            f.fieldName
              .toLowerCase()
              .trim()
              .startsWith(p[0].toLowerCase())
          ) {
            newFormFieldData.push({ ...f, value: p[1] })
          }
        })
      })
      this.DEContainer.documentEditor.importFormData(newFormFieldData)
    }
  }

  documentClick = e => {
    this.mouseClicked = true
  }

  documentChange = () => {
    if (!this.DEContainer) return
    const {
      statusFK,
      formData: { content, signatureCounter = 0 },
    } = this.props.values
    const isSigningMode = statusFK === 2 || signatureCounter > 0
    this.DEContainer.documentEditor.editor.enforceProtection(
      '',
      isSigningMode ? 'ReadOnly' : 'FormFieldsOnly',
    )
    // if (!content) return
    this.fillFormFields()
    this.DEContainer.documentEditor.showRestrictEditingPane(false)
    this.DEContainer.showHidePropertiesPane(false)
    const deElement = this.DEContainer.documentEditor.getDocumentEditorElement()
    deElement.addEventListener('click', this.documentClick.bind(this))
    this.setState({ isSigningMode, signatureCounter })
  }

  state = {}

  render() {
    const {
      showSignature,
      isSigningMode,
      isImageSelected,
      isSelectionInEditRegion,
      isSignatured,
      signatureCounter,
    } = this.state
    const {
      values: {
        statusFK,
        formName,
        formData: { content },
      },
      height,
    } = this.props
    const disableEdit = statusFK === 2 //Finalize
    return (
      <div>
        <div style={{ float: 'right', margin: '-15px 0 5px 0' }}>
          <Button
            disabled={disableEdit || signatureCounter > 0}
            color='primary'
            onClick={this.switchMode}
          >
            {isSigningMode ? 'Switch to Edit Mode' : 'Switch to Signing Mode'}
          </Button>
          <Button
            disabled={
              disableEdit ||
              !isSigningMode ||
              !isSelectionInEditRegion ||
              isSignatured
            }
            size='sm'
            color='primary'
            icon
            onClick={this.addSignature}
          >
            <AddPhotoAlternateIcon /> Add Signature
          </Button>
          <Button
            size='sm'
            color='primary'
            disabled={disableEdit || !isSigningMode || !isImageSelected}
            icon
            onClick={this.deleteSignature}
          >
            <HideImageIcon /> Delete Signature
          </Button>
          <Button size='sm' color='primary' icon onClick={this.download}>
            <DownloadIcon /> Download
          </Button>
          <Button size='sm' color='primary' icon onClick={this.print}>
            <Print /> Print
          </Button>
        </div>
        <DocumentEditor
          documentName={formName}
          document={content}
          ref={r => (this.DEContainer = r?.container)}
          initialized={() => {
            const {
              values: { statusFK },
            } = this.props
            this.documentChange()
            this.DEContainer.contentChange = this.contentChange
            this.DEContainer.documentChange = this.documentChange
            this.DEContainer.selectionChange = _.debounce(
              this.selectionChange,
              100,
            )
            this.DEContainer.disableEdit = statusFK === 2
          }}
          zoomTarget='FitPageWidth'
          // height={'78vh'}
          height={height - 105}
          showPropertiesPane={false}
          enableToolbar={false}
          restrictEditing={disableEdit}
          enableContextMenu={false}
          enableImageResizer={false}
          // userColor={'#FFFF00'}
          // contentChange={this.contentChange}
          // documentChange={this.documentChange}
          // selectionChange={this.selectionChange}
          documentEditorSettings={{
            printDevicePixelRatio: 3,
            // searchHighlightColor: '#FFE97F',
            // formFieldSettings: {
            //   shadingColor: '#cfcfcf',
            //   applyShading: true,
            //   selectionColor: '#cccccc',
            //   formFillingMode: 'Popup',//'Inline',
            // },
          }}
        />

        <CommonModal
          open={showSignature}
          title='Signature'
          observe='Signature'
          onClose={this.closeSignature}
        >
          {showSignature && (
            <Signature
              onChange={this.signatureChange}
              updateSignature={this.updateSignature}
            />
          )}
        </CommonModal>
      </div>
    )
  }
}
export default CommonForm
