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
import { ImageElementBox, EditRangeStartElementBox, EditRangeEndElementBox, Point } from '@syncfusion/ej2-react-documenteditor'

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
    const { selection, editor } = this.DEContainer.documentEditor

    const isSelectionInEditRegion = selection.isSelectionInEditRegion()
    const isImageSelected = selection.isImageSelected
    const isSignatured = true

    editor.enforceProtection('', isSigningMode ? 'ReadOnly' : 'FormFieldsOnly')
    this.setState({ isSigningMode, isSelectionInEditRegion, isImageSelected, isSignatured })
  }

  addSignature = () => {
    this.setState({ showSignature: true })
  }

  notificationWarning = _.debounce(
    message => notification.warning(message),
    500,
  )

  selectionChange = e => {
    const isDisabledEdit = this.props.values.statusFK == 2
    if(isDisabledEdit) return

    const { isSigningMode, signatureCounter } =  this.state
    if(!isSigningMode) return

    const { selection } = e.source.documentEditor
    const { start, documentHelper } = selection
    const { currentWidget: { children }} = start    

    const isFormField = selection.isFormField()
    const isSelectionInEditRegion = selection.isSelectionInEditRegion()
    const isImageSelected = selection.isImageSelected
    let isSignatured = true


    if(_.isEqual(this.mouseDownPoint,this.mouseUpPoint)) {
      documentHelper.editableDiv.contentEditable = false
      if (signatureCounter > 0 && isFormField)
        this.notificationWarning({message: 'Please remove signatures to update form content.'})
      else if(!isFormField) {
        const editRangeElementList = children.filter(i => i instanceof EditRangeStartElementBox)
        if(editRangeElementList.length > 0) {
          const editRangePositionList = editRangeElementList.map(i => {
            const position = selection.getPosition(i)
            return {element: i, position , abs: Math.abs(position.endPosition.location.x - documentHelper.mouseDownOffset.x)}
          })
          //Find the closest editable range
          const { element, position:{ endPosition :{ currentWidget, location } } } = _.minBy(editRangePositionList, 'abs')

          //Check if signature exists in scope 
          for (
            var currentElement = element.nextElement;
            currentElement && currentElement != element.editRangeEnd;
            currentElement = currentElement.nextElement
          ) {
            isSignatured = currentElement instanceof ImageElementBox
            if (isSignatured || currentElement instanceof EditRangeEndElementBox)
              break
          }

          if (!isSignatured && !_.isEqual(documentHelper.mouseDownOffset, location)) {
            documentHelper.mouseDownOffset = location
            selection.updateTextPosition(currentWidget, location)
            return
          }
        }
    }
  }

    this.setState({ isSelectionInEditRegion, isImageSelected, isSignatured })
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

  documentMouseDown = e => {
    this.mouseDownPoint = new Point(e.offsetX, e.offsetY);
  }

  documentMouseUp = e => {
    this.mouseUpPoint = new Point(e.offsetX, e.offsetY);
  }

  documentChange = () => {
    if (!this.DEContainer) return
    const {
      statusFK,
      formData: { content, signatureCounter = 0 },
    } = this.props.values
    const isSigningMode = statusFK === 2 || signatureCounter > 0
    this.DEContainer.documentEditor.editor.enforceProtection('',isSigningMode ? 'ReadOnly' : 'FormFieldsOnly')

    this.fillFormFields()
    this.DEContainer.documentEditor.showRestrictEditingPane(false)
    this.DEContainer.showHidePropertiesPane(false)
    const deElement = this.DEContainer.documentEditor.getDocumentEditorElement()
    deElement.addEventListener('mousedown', this.documentMouseDown.bind(this))
    deElement.addEventListener('mouseup', this.documentMouseUp.bind(this))
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
