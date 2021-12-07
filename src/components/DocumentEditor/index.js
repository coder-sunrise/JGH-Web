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

class DocumentEditor extends SampleBase {
  constructor() {
    super(...arguments)
    this.onLoadDefault = () => {
      const { documentName, document, enableTitleBar } = this.props
      this.container.documentEditor.open(document)
      this.container.documentEditor.documentName = documentName
      if (enableTitleBar) {
        this.titleBar.updateDocumentTitle()
      }
    }
  }

  rendereComplete() {
    const { enableTitleBar } = this.props
    this.container.serviceUrl = this.hostUrl + 'api/documenteditor/'
    this.container.documentEditor.pageOutline = '#E0E0E0'
    this.container.documentEditor.acceptTab = true
    this.container.documentEditor.resize()
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

  static instance = undefined
  static print = ({ ...printProps }) => {
    const { documentName, document: content } = printProps
    if (!DocumentEditor.instance) {
      const container = new DocumentEditorContainerComponent({
        userColor: '#FFFFFF',
        documentEditorSettings: {
          // searchHighlightColor: '#FFFFFF',
          formFieldSettings: {
            shadingColor: '#FFFFFF',
            // applyShading: false,
            // selectionColor: '#FFFFFF',
          },
        },
      })
      container.element = document.createElement('div')
      container.preRender()
      container.render()
      DocumentEditor.instance = container
    }
    const documentEditor = DocumentEditor.instance.documentEditor
    documentEditor.open(typeof content === 'object' ? JSON.stringify(content) : content)
    documentEditor.documentName = documentName
    setTimeout(() => documentEditor.print(), 1)
  }
}

export default DocumentEditor
