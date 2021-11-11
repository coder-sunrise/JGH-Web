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
import { now } from '@umijs/deps/compiled/lodash'
DocumentEditorContainerComponent.Inject(Toolbar)

class DocumentEditor extends SampleBase {
  constructor() {
    super(...arguments)
    this.hostUrl = 'https://ej2services.syncfusion.com/production/web-services/'
    this.onLoadDefault = () => {
      // // Load document and readonly
      // let data = `{"sections":[{"sectionFormat":{"pageWidth":612,"pageHeight":792,"leftMargin":72,"rightMargin":72,"topMargin":72,"bottomMargin":72,"differentFirstPage":false,"differentOddAndEvenPages":false,"headerDistance":36,"footerDistance":36,"bidi":false},"blocks":[{"paragraphFormat":{"afterSpacing":30,"styleName":"Heading 1","listFormat":{}},"characterFormat":{},"inlines":[{"characterFormat":{},"text":"Adventure Works Cycles"}]}],"headersFooters":{"header":{"blocks":[{"paragraphFormat":{"listFormat":{}},"characterFormat":{},"inlines":[]}]},"footer":{"blocks":[{"paragraphFormat":{"listFormat":{}},"characterFormat":{},"inlines":[]}]}}}],"characterFormat":{"bold":false,"italic":false,"fontSize":11,"fontFamily":"Calibri","underline":"None","strikethrough":"None","baselineAlignment":"Normal","highlightColor":"NoColor","fontColor":"empty","fontSizeBidi":11,"fontFamilyBidi":"Calibri","allCaps":false},"paragraphFormat":{"leftIndent":0,"rightIndent":0,"firstLineIndent":0,"textAlignment":"Left","beforeSpacing":0,"afterSpacing":0,"lineSpacing":1.0791666507720947,"lineSpacingType":"Multiple","listFormat":{},"bidi":false},"defaultTabWidth":36,"trackChanges":false,"enforcement":false,"hashValue":"","saltValue":"","formatting":false,"protectionType":"NoProtection","dontUseHTMLParagraphAutoSpacing":false,"formFieldShading":true,"styles":[{"name":"Normal","type":"Paragraph","paragraphFormat":{"lineSpacing":1.149999976158142,"lineSpacingType":"Multiple","listFormat":{}},"characterFormat":{"fontFamily":"Calibri"},"next":"Normal"},{"name":"Default Paragraph Font","type":"Character","characterFormat":{}},{"name":"Heading 1 Char","type":"Character","characterFormat":{"fontSize":16,"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Default Paragraph Font"},{"name":"Heading 1","type":"Paragraph","paragraphFormat":{"beforeSpacing":12,"afterSpacing":0,"outlineLevel":"Level1","listFormat":{}},"characterFormat":{"fontSize":16,"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Normal","link":"Heading 1 Char","next":"Normal"},{"name":"Heading 2 Char","type":"Character","characterFormat":{"fontSize":13,"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Default Paragraph Font"},{"name":"Heading 2","type":"Paragraph","paragraphFormat":{"beforeSpacing":2,"afterSpacing":6,"outlineLevel":"Level2","listFormat":{}},"characterFormat":{"fontSize":13,"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Normal","link":"Heading 2 Char","next":"Normal"},{"name":"Heading 3","type":"Paragraph","paragraphFormat":{"leftIndent":0,"rightIndent":0,"firstLineIndent":0,"textAlignment":"Left","beforeSpacing":2,"afterSpacing":0,"lineSpacing":1.0791666507720947,"lineSpacingType":"Multiple","outlineLevel":"Level3","listFormat":{}},"characterFormat":{"fontSize":12,"fontFamily":"Calibri Light","fontColor":"#1F3763"},"basedOn":"Normal","link":"Heading 3 Char","next":"Normal"},{"name":"Heading 3 Char","type":"Character","characterFormat":{"fontSize":12,"fontFamily":"Calibri Light","fontColor":"#1F3763"},"basedOn":"Default Paragraph Font"},{"name":"Heading 4","type":"Paragraph","paragraphFormat":{"leftIndent":0,"rightIndent":0,"firstLineIndent":0,"textAlignment":"Left","beforeSpacing":2,"afterSpacing":0,"lineSpacing":1.0791666507720947,"lineSpacingType":"Multiple","outlineLevel":"Level4","listFormat":{}},"characterFormat":{"italic":true,"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Normal","link":"Heading 4 Char","next":"Normal"},{"name":"Heading 4 Char","type":"Character","characterFormat":{"italic":true,"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Default Paragraph Font"},{"name":"Heading 5","type":"Paragraph","paragraphFormat":{"leftIndent":0,"rightIndent":0,"firstLineIndent":0,"textAlignment":"Left","beforeSpacing":2,"afterSpacing":0,"lineSpacing":1.0791666507720947,"lineSpacingType":"Multiple","outlineLevel":"Level5","listFormat":{}},"characterFormat":{"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Normal","link":"Heading 5 Char","next":"Normal"},{"name":"Heading 5 Char","type":"Character","characterFormat":{"fontFamily":"Calibri Light","fontColor":"#2F5496"},"basedOn":"Default Paragraph Font"},{"name":"Heading 6","type":"Paragraph","paragraphFormat":{"leftIndent":0,"rightIndent":0,"firstLineIndent":0,"textAlignment":"Left","beforeSpacing":2,"afterSpacing":0,"lineSpacing":1.0791666507720947,"lineSpacingType":"Multiple","outlineLevel":"Level6","listFormat":{}},"characterFormat":{"fontFamily":"Calibri Light","fontColor":"#1F3763"},"basedOn":"Normal","link":"Heading 6 Char","next":"Normal"},{"name":"Heading 6 Char","type":"Character","characterFormat":{"fontFamily":"Calibri Light","fontColor":"#1F3763"},"basedOn":"Default Paragraph Font"}],"lists":[],"abstractLists":[],"comments":[],"revisions":[],"customXml":[]}`
      // this.container.documentEditor.open(data)
      // this.container.documentEditor.isReadOnly = true

      this.container.documentEditor.documentName = 'Consent Form'
      this.titleBar.updateDocumentTitle()
      this.container.documentChange = () => {
        this.titleBar.updateDocumentTitle()
        this.container.documentEditor.focusIn()
      }
    }
  }
  rendereComplete() {
    this.container.serviceUrl = this.hostUrl + 'api/documenteditor/'
    this.container.documentEditor.pageOutline = '#E0E0E0'
    this.container.documentEditor.acceptTab = true
    this.container.documentEditor.resize()
    this.titleBar = new TitleBar(
      document.getElementById('documenteditor_titlebar'),
      this.container.documentEditor,
      true,
    )
    this.onLoadDefault()
  }
  onUploadClick = () => {}
  onToolbarClick = args => {
    switch (args.item.id) {
      case 'saveDocument':
        console.log(this.container.documentEditor.serialize())
        break
      case 'fillData':
        this.container.documentEditor.importFormData([
          { fieldName: 'PatientName', value: 'Jack Ma' },
          {
            fieldName: 'Today',
            value: moment(new Date()).format('YYYY-MM-DD'),
          },
        ])
        break
      case 'setField':
        this.container.documentEditor.editor.insertFormField('Text')
        break
      default:
        break
    }
  }
  render() {
    let saveDocumentToolbarItem = {
      prefixIcon: 'e-de-ctnr-lock',
      text: 'Save',
      id: 'saveDocument',
    }

    let fillDataToolbarItem = {
      prefixIcon: 'e-de-ctnr-lock',
      text: 'Fill Data',
      id: 'fillData',
    }

    let setFieldItem = {
      prefixIcon: 'e-de-ctnr-lock',
      text: 'Set Field',
      id: 'setField',
    }

    let items = [
      'Undo',
      'Redo',
      'Separator',
      'Image',
      'Table',
      'Hyperlink',
      'Separator',
      'Header',
      'Footer',
      'PageSetup',
      'PageNumber',
      'Break',
      'Separator',
      'Find',
      'Separator',
      'LocalClipboard',
      'RestrictEditing',
      'FormFields',
      'Separator',
      saveDocumentToolbarItem,
      fillDataToolbarItem,
      setFieldItem,
    ]
    return (
      <GridContainer>
        <GridItem md={12}>
          <div className='control-pane'>
            <div className='control-section'>
              <div
                id='documenteditor_titlebar'
                className='e-de-ctn-title'
              ></div>
              <div id='documenteditor_container_body'>
                <DocumentEditorContainerComponent
                  id='container'
                  toolbarItems={items}
                  ref={scope => {
                    this.container = scope
                  }}
                  toolbarClick={this.onToolbarClick.bind(this)}
                  style={{ display: 'block' }}
                  height={'590px'}
                  showPropertiesPane={false}
                  locale='en-US'
                />
              </div>
            </div>
            <script>
              {
                (window.onbeforeunload = function() {
                  return 'Want to save your changes?'
                })
              }
            </script>
          </div>
        </GridItem>
      </GridContainer>
    )
  }
}

export default DocumentEditor
