import React, { PureComponent } from 'react'

import { TitleBar } from './titleBar'
import { SampleBase } from './sample-base'
import { Button, GridContainer, GridItem } from '@/components'
import './index.css'
import moment from 'moment'
import {
  DocumentEditorContainerComponent,
  Toolbar,
  CustomToolbarItemModel,
} from '@syncfusion/ej2-react-documenteditor'

DocumentEditorContainerComponent.Inject(Toolbar)
const pageFitType = {
  FitOnePage: 'FitOnePage',
  FitPageWidth: 'FitPageWidth',
}
class DocumentEditor extends SampleBase {
  constructor() {
    super(...arguments)
    this.onLoadDefault = () => {
      const {
        documentName,
        document,
        enableTitleBar,
        zoomTarget,
        initialized,
      } = this.props
      this.container.documentEditor.open(document)
      this.container.documentEditor.documentName = documentName
      if (initialized) initialized.call()
      if (enableTitleBar) {
        this.titleBar.updateDocumentTitle()
      }
      if (zoomTarget) {
        if (pageFitType[zoomTarget]) {
          this.container.documentEditor.fitPage(zoomTarget)
        } else {
          const zoomValue = parseInt(zoomTarget, 10)
          if (zoomValue < 0) return
          this.container.documentEditor.zoomFactor = zoomValue / 100
        }
        this.container.documentEditor.notify('internalZoomFactorChange') //trigger updateZoomContent();
      }
    }
  }

  rendereComplete() {
    const {
      enableTitleBar,
      enableContextMenu = true,
      enableImageResizer = true,
    } = this.props
    this.container.serviceUrl = this.hostUrl + 'api/documenteditor/'
    this.container.documentEditor.pageOutline = '#E0E0E0'
    this.container.documentEditor.acceptTab = true
    this.container.documentEditor.resize()
    this.container.documentEditor.enableContextMenu = enableContextMenu
    this.container.documentEditor.enableImageResizer = enableImageResizer
    if (enableTitleBar) {
      this.titleBar = new TitleBar(
        document.getElementById('documenteditor_titlebar'),
        this.container.documentEditor,
        true,
      )
    }
    this.onLoadDefault()
  }

  render() {
    const { enableTitleBar } = this.props
    return (
      <GridContainer>
        <GridItem md={12}>
          <div className='control-pane'>
            <div className='control-section'>
              {enableTitleBar && (
                <div
                  id='documenteditor_titlebar'
                  className='e-de-ctn-title'
                ></div>
              )}
              <div id='documenteditor_container_body'>
                <DocumentEditorContainerComponent
                  id='container'
                  ref={scope => {
                    this.container = scope
                  }}
                  locale='en-US'
                  {...this.props}
                />
              </div>
            </div>
          </div>
        </GridItem>
      </GridContainer>
    )
  }

  static showHideHighligth(isShow) {
    const selection = this.instance.documentEditor.editor.selection
    const formFieldSettings = this.instance.documentEditorSettings
      .formFieldSettings
    formFieldSettings.applyShading = isShow
    selection.isHighlightEditRegion = isShow
  }

  static instance = undefined
  static print = ({ ...printProps }) => {
    const { documentName, document: content } = printProps
    if (!this.instance) {
      const container = new DocumentEditorContainerComponent()
      container.element = document.createElement('div')
      container.preRender()
      container.render()
      this.instance = container
    }
    const documentEditor = this.instance.documentEditor
    documentEditor.open(
      typeof content === 'object' ? JSON.stringify(content) : content,
    )
    documentEditor.documentName = documentName
    setTimeout(() => {
      this.showHideHighligth(false)
      documentEditor.print()
      this.showHideHighligth(true)
    }, 1)
  }
}

export default DocumentEditor
