import React, { Component, Fragment } from 'react'
import { connect } from 'dva'
import {
  withStyles,
  MenuList,
  Popper,
  Paper,
  Grow,
  ClickAwayListener,
  MenuItem,
} from '@material-ui/core'
// common components
import { CardContainer, Danger, GridContainer, CommonModal } from '@/components'
import { Button } from 'antd'
import { CloudUploadOutlined, ScanOutlined } from '@ant-design/icons'
import { LoadingWrapper } from '@/components/_medisys'
// sub components
import {
  downloadAttachment,
  uploadFile,
  deleteFileByFileID,
} from '@/services/file'
import { convertToBase64 } from '@/utils/utils'
import { FILE_STATUS, FILE_CATEGORY, ATTACHMENT_TYPE } from '@/utils/constants'
import { corAttchementTypes } from '@/utils/codes'
import Authorized from '@/utils/Authorized'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { generateThumbnailAsync } from './utils'
import styles from './styles'
import Thumbnail from './Thumbnail'
import ImagePreviewer from './ImagePreviewer'
const imageExt = ['JPG', 'JPEG', 'PNG', 'BMP', 'GIF']

const allowedFiles = '.png, .jpg, .jpeg, .xls, .xlsx, .doc, .docx, .pdf'

const getFileExtension = filename => {
  return filename.split('.').pop()
}

const AttachmentMenuItems = [
  {
    name: ATTACHMENT_TYPE.CLINICALNOTES,
    title: 'Consultation Attachment',
    // authority:
  },
  {
    name: ATTACHMENT_TYPE.EYEVISUALACUITY,
    title: 'Visual Acuity Test',
    authority: 'queue.consultation.widgets.eyevisualacuity',
  },
]

class AttachmentWithThumbnail extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showPopper: false,
      errorText: undefined,
      uploading: false,
      downloading: false,
      showImagePreview: false,
      selectedFileId: 0,
    }

    this.inputEl = React.createRef()
    this.popperRef = React.createRef()
  }

  componentDidMount() {
    this.props.onRef(this)
  }

  setDownloading = val => {
    this.setState({ downloading: val })
  }

  setUploading = val => {
    this.setState({ uploading: val })
  }

  setErrorText = val => {
    this.setState({
      errorText: val,
    })
  }

  stopUploading = reason => {
    this.setErrorText(reason)
    this.setUploading(false)
    this.props.dispatch({
      type: 'global/updateState',
      payload: {
        disableSave: false,
      },
    })
  }

  generateFileDto = async (name, size, base64File) => {
    const {
      attachmentType = '',
      thumbnailSize = {
        height: 64,
        width: 64,
      },

      fileCategory,
      fileStatus,
    } = this.props

    const type = corAttchementTypes.find(o => o.type === attachmentType) || {}
    const fileStatusFK = fileStatus || FILE_STATUS.UPLOADED
    const fileExtension = getFileExtension(name).toLowerCase()
    let _thumbnailDto
    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      // const imgEle = document.createElement('img')
      // imgEle.src = `data:image/${fileExtension};base64,${base64File}`
      const imgSrc = `data:image/${fileExtension};base64,${base64File}`

      // await setTimeout(() => {
      //   // wait for 1 milli second for img to set src successfully
      // }, 100)
      const thumbnail = await generateThumbnailAsync(
        imgSrc,
        thumbnailSize,
        fileExtension,
      )
      let [base64Prefix, thumbnailData] = thumbnail.split(',')

      _thumbnailDto = {
        fileExtension: '.png',
        fileSize: 0,
        content: thumbnailData,
        isDeleted: false,
      }
    }

    const originalFile = {
      fileName: name,
      fileSize: size,
      fileCategoryFK: fileCategory || FILE_CATEGORY.VISITREG,
      content: base64File,
      thumbnail: _thumbnailDto,
      fileExtension,
      fileStatusFK,
      attachmentType,
      attachmentTypeFK: type.id,
    }

    return originalFile
  }

  mapToFileDto = async file => {
    // file type and file size validation
    const base64 = await convertToBase64(file)
    const dtos = await this.generateFileDto(file.name, file.size, base64)
    return dtos
  }

  mapUploadResponseToAttachmentDto = (files, response) => {
    return response.map((item, index) => {
      const { thumbnail, ...rest } = item
      const file = files[index]
      return {
        ...rest,
        ...file,
        thumbnail: {
          ...thumbnail,
          content: file.thumbnail ? file.thumbnail.content : null,
        },
        content: file.content,
      }
    })
  }

  validateFiles = files => {
    const {
      attachments = [],
      maxFilesAllowUpload,
      restrictFileTypes = [],
    } = this.props

    // const numberOfNewFiles = Object.keys(files).length
    let totalFilesSize = 0
    const maxUploadSize = 31457280
    const filesArray = [...files]

    const currentFilesLength = filesArray.length + attachments.length

    if (maxFilesAllowUpload && currentFilesLength > maxFilesAllowUpload) {
      this.stopUploading(`Cannot upload more than ${maxFilesAllowUpload} files`)
      return false
    }

    if (restrictFileTypes.length > 0) {
      const invalidFileExist = filesArray.some(
        file => !restrictFileTypes.includes(file.type),
      )

      if (invalidFileExist) {
        this.stopUploading(
          `Only the file types (${restrictFileTypes.toString()}) are allowed`,
        )
        return false
      }
    }

    filesArray &&
      filesArray.forEach(o => {
        totalFilesSize += o.size
      })
    attachments.forEach(o => {
      if (!o.isDeleted) {
        totalFilesSize += o.fileSize
      }
    })

    if (totalFilesSize > maxUploadSize) {
      this.stopUploading('Cannot upload more than 30MB')
      return false
    }
    return true
  }

  beginUpload = async dtos => {
    const { dispatch, handleUpdateAttachments } = this.props

    const uploadResponse = await uploadFile(dtos)

    let uploadedAttachment = []
    if (uploadResponse) {
      uploadedAttachment = this.mapUploadResponseToAttachmentDto(
        dtos,
        uploadResponse,
      )
    }

    this.setUploading(false)
    dispatch({
      type: 'global/updateState',
      payload: {
        disableSave: false,
      },
    })
    handleUpdateAttachments({
      added: uploadedAttachment,
    })
  }

  onFileChange = async event => {
    try {
      this.setUploading(true)
      this.props.dispatch({
        type: 'global/updateState',
        payload: {
          disableSave: true,
        },
      })

      const { files } = event.target

      const isValid = this.validateFiles(files)
      if (!isValid) {
        this.props.dispatch({
          type: 'global/updateState',
          payload: {
            disableSave: false,
          },
        })
        return
      }

      const selectedFilesDto = []
      for (let i = 0; i < files.length; i++) {
        let f = await this.mapToFileDto(files[i])
        selectedFilesDto.push(f)
      }

      await this.beginUpload(selectedFilesDto)
    } catch (error) {
      console.log({ error })
    }
  }

  onUploadFromScan = async datas => {
    try {
      this.setUploading(true)
      this.props.dispatch({
        type: 'global/updateState',
        payload: {
          disableSave: true,
        },
      })

      if (!this.validateFiles(datas)) {
        this.props.dispatch({
          type: 'global/updateState',
          payload: {
            disableSave: false,
          },
        })
        return
      }

      const selectedFilesDto = await Promise.all(
        datas.map(m => this.generateFileDto(m.name, m.size, m.imgData)),
      )

      await this.beginUpload(selectedFilesDto)
    } catch (error) {
      console.log({ error })
    }
  }

  clearValue = e => {
    e.target.value = null
  }

  onUploadClick = () => {
    this.inputEl.current.click()
  }

  onDelete = (fileIndexFK, id) => {
    if (!fileIndexFK && id) {
      deleteFileByFileID(id)
    }
    this.props.handleUpdateAttachments({
      deleted: !fileIndexFK ? id : fileIndexFK,
    })
  }

  onClick = async attachment => {
    this.setDownloading(true)
    await downloadAttachment(attachment)
    this.setDownloading(false)
  }

  onDropDownClick = selectedAttachmentType => {
    this.props.handleSelectedAttachmentType(selectedAttachmentType)
    if (this.state.uploadFrom === 'scan') {
      this.props.handleOpenScanner()
    } else {
      this.onUploadClick()
    }
  }
  showImagePreview = attachment => {
    this.setState({
      ...this.state,
      showImagePreview: true,
      selectedFileId: attachment.id,
    })
  }

  render() {
    const {
      classes,
      cardStyles,
      dispatch,
      label,
      isReadOnly,
      buttonOnly = false,
      attachments = [],
      filterTypes = [],
      allowedMultiple = true,
      simple = false,
      attachmentType = '',
      fieldName,
      thumbnailSize = {
        height: 64,
        width: 64,
      },
      renderBody = undefined,
      withDropDown,
      hideRemarks = false,
      disableScanner = false,
      handleOpenScanner,
      extenstions = '',
      hiddenDelete,
    } = this.props
    let { showPopper, uploading, errorText, downloading } = this.state

    const fileAttachments = attachments.filter(
      attachment =>
        (!attachmentType ||
          attachment.attachmentType === attachmentType ||
          filterTypes.indexOf(attachment.attachmentType) >= 0) &&
        !attachment.isDeleted,
    )

    let UploadButton = (
      <Fragment>
        {withDropDown ? (
          <ClickAwayListener
            onClickAway={e => {
              this.setState({
                showPopper: false,
                uploadFrom: undefined,
              })
            }}
          >
            <div style={{ marginBottom: 5 }}>
              <Button
                type='primary'
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  this.setState({
                    showPopper: true,
                    uploadFrom: 'upload',
                  })
                }}
                disabled={isReadOnly || uploading || global.disableSave}
                className={fileAttachments.length >= 1 ? classes.uploadBtn : ''}
                buttonRef={node => {
                  this.popperRef = node
                }}
                icon={<CloudUploadOutlined />}
                style={{ marginRight: 8 }}
              >
                Upload
              </Button>
              {!disableScanner && (
                <Button
                  type='primary'
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    this.setState({
                      showPopper: true,
                      uploadFrom: 'scan',
                    })
                  }}
                  // onClick={handleOpenScanner}
                  disabled={isReadOnly || uploading || global.disableSave}
                  className={
                    fileAttachments.length >= 1 ? classes.uploadBtn : ''
                  }
                  icon={<ScanOutlined />}
                >
                  Scan
                </Button>
              )}
              <Popper
                open={showPopper}
                anchorEl={this.popperRef}
                transition
                disablePortal
                placement='bottom-end'
                style={{
                  zIndex: 999,
                  // marginTop: 65,
                  marginLeft: this.state.uploadFrom === 'scan' ? 90 : 0,
                  fontSize: '1em',
                }}
              >
                {({ TransitionProps, placement }) => (
                  <Grow
                    {...TransitionProps}
                    id='menu-list'
                    style={{ transformOrigin: '0 0 -30' }}
                  >
                    <Paper className={classes.dropdown}>
                      <MenuList role='menu'>
                        {AttachmentMenuItems.map(m => {
                          return (
                            <Authorized authority={m.authority}>
                              <MenuItem
                                onClick={() => this.onDropDownClick(m.name)}
                              >
                                {m.title}
                              </MenuItem>
                            </Authorized>
                          )
                        })}
                      </MenuList>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </div>
          </ClickAwayListener>
        ) : (
          <React.Fragment>
            <Button
              type='primary'
              size='small'
              onClick={this.onUploadClick}
              disabled={isReadOnly || uploading || global.disableSave}
              className={fileAttachments.length >= 1 ? classes.uploadBtn : ''}
              icon={<CloudUploadOutlined />}
              style={{ marginRight: 8 }}
            >
              Upload
            </Button>
            {!disableScanner && (
              <Button
                type='primary'
                size='small'
                onClick={handleOpenScanner}
                disabled={isReadOnly || uploading || global.disableSave}
                className={fileAttachments.length >= 1 ? classes.uploadBtn : ''}
                icon={<ScanOutlined />}
              >
                Scan
              </Button>
            )}
          </React.Fragment>
        )}
      </Fragment>
    )

    if (!allowedMultiple && fileAttachments.length >= 1) UploadButton = null

    const commonProps = {
      dispatch,
      isReadOnly,
      simple,
      size: thumbnailSize,
      onConfirmDelete: this.onDelete,
      onClickAttachment: this.onClick,
      noBorder: simple && !allowedMultiple,
      fieldName,
      hideRemarks,
      hiddenDelete,
    }

    let Body =
      fileAttachments.length > 0 ? (
        <CardContainer hideHeader styles={cardStyles}>
          <GridContainer>
            {fileAttachments.map((attachment, index) => {
              let indexInAllAttachments = attachments.findIndex(
                item => item.id === attachment.id,
              )
              if (attachment.fileIndexFK)
                indexInAllAttachments = attachments.findIndex(
                  item => item.fileIndexFK === attachment.fileIndexFK,
                )
              return (
                <Thumbnail
                  index={index}
                  indexInAllAttachments={indexInAllAttachments}
                  attachment={attachment}
                  showImagePreview={this.showImagePreview}
                  {...commonProps}
                />
              )
            })}
          </GridContainer>
        </CardContainer>
      ) : null

    if (simple && !allowedMultiple)
      Body = fileAttachments.map((attachment, index) => {
        return (
          <Thumbnail
            index={index}
            attachment={attachment}
            showImagePreview={this.showImagePreview}
            {...commonProps}
          />
        )
      })

    if (buttonOnly) Body = null
    let loadingPrefix = 'Uploading'

    if (downloading) loadingPrefix = 'Downloading'

    if (renderBody) {
      Body = renderBody(attachments)
    }
    return (
      <div className={classes.root}>
        <CommonModal
          open={this.state.showImagePreview}
          title='Results Attachment Preview'
          fullScreen
          onClose={() =>
            this.setState({ ...this.state, showImagePreview: false })
          }
        >
          <ImagePreviewer
            defaultSelectedFileId={this.state.selectedFileId}
            files={fileAttachments.filter(attachmentItem =>
              imageExt.includes(attachmentItem.fileExtension.toUpperCase())
                ? attachmentItem
                : null,
            )}
          />
        </CommonModal>
        <input
          style={{ display: 'none' }}
          type='file'
          accept={extenstions ? extenstions : allowedFiles}
          id='uploadVisitAttachment'
          ref={this.inputEl}
          multiple={allowedMultiple}
          onChange={this.onFileChange}
          onClick={this.clearValue}
        />
        <div style={{ display: 'flex' }}>
          {label && <span className={classes.attachmentLabel}>{label}</span>}
          {!isReadOnly && UploadButton}
        </div>
        {errorText && (
          <Danger style={{ display: 'inline-block' }}>
            <span style={{ fontWeight: 500 }}>{errorText}</span>
          </Danger>
        )}
        <LoadingWrapper
          loading={uploading || downloading}
          text={`${loadingPrefix} attachment...`}
        >
          {Body}
        </LoadingWrapper>
      </div>
    )
  }
}

const Connected = connect(({ global }) => ({ global }))(AttachmentWithThumbnail)

export default withWebSocket()(withStyles(styles)(Connected))
