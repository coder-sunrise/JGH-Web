import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core'
import { CommonModal } from '@/components'
import AttachmentDocument from '@/pages/Widgets/AttachmentDocument'
import { FOLDER_TYPE } from '@/utils/constants'
import Authorized from '@/utils/Authorized'

const styles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 'calc(100vh - 80px)',
  },
})

class Document extends PureComponent {
  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.resize.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  resize() {
    if (this.divElement) {
      const height = this.divElement.clientHeight
      if (height > 0) {
        this.setState({ height: height > 0 ? height / 2 - 144 : 300 })
      }
    }
  }

  render() {
    const {
      patient: { entity },
      folder,
    } = this.props

    const editDocumentAccessRight = Authorized.check(
      'patientdatabase.patientprofiledetails.patientdocument.viewpatientdocument.editpatientdocument',
    ) || {
      rights: 'hidden',
    }
    const deleteDocumentAccessRight = Authorized.check(
      'patientdatabase.patientprofiledetails.patientdocument.viewpatientdocument.deletepatientdocument',
    ) || {
      rights: 'hidden',
    }

    const editFolderAccessRight = Authorized.check(
      'patientdatabase.patientprofiledetails.patientdocument.viewpatientdocument.editfolder',
    ) || {
      rights: 'hidden',
    }
    const deleteFolderAccessRight = Authorized.check(
      'patientdatabase.patientprofiledetails.patientdocument.viewpatientdocument.deletefolder',
    ) || {
      rights: 'hidden',
    }

    const patientIsActive = entity && entity.isActive
    return (
      <CommonModal
        open
        fullScreen
        onClose={this.props.onClose}
        showFooter={true}
        footProps={{
          confirmProps: {
            hidden: true,
          },
        }}
        title='Patient Document'
        keepMounted={false}
      >
        <div style={{ height: '85vh' }}>
          <div style={{ marginLeft: 8, marginTop: '-10px' }}>
            Name:&nbsp;
            <span style={{ fontWeight: 600 }}>{`${entity.name ||
              ''} (${entity.patientReferenceNo || ''})`}</span>
            &nbsp;-&nbsp;
            <span>{entity.patientAccountNo || ''}</span>
          </div>
          <AttachmentDocument
            {...this.props}
            type={FOLDER_TYPE.PATIENT}
            readOnly={!patientIsActive}
            modelName='patientAttachment'
            isEnableEditDocument={editDocumentAccessRight.rights === 'enable'}
            isEnableDeleteDocument={
              deleteDocumentAccessRight.rights === 'enable'
            }
            isEnableEditFolder={editFolderAccessRight.rights === 'enable'}
            isEnableDeleteFolder={deleteFolderAccessRight.rights === 'enable'}
          />
        </div>
      </CommonModal>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Document)
