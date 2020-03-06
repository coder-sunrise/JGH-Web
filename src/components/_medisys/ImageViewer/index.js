import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import classnames from 'classnames'
// material ui
import { withStyles } from '@material-ui/core'
import Download from '@material-ui/icons/GetApp'
// common components
import { Button, CommonModal } from '@/components'
// services
import { downloadAttachment, getFileByFileID } from '@/services/file'
// utils
import { arrayBufferToBase64 } from '@/components/_medisys/ReportViewer/utils'

const base64Prefix = 'data:image/png;base64,'

const styles = (theme) => ({
  buttonContainer: {
    marginBottom: theme.spacing(2),
  },
  imageContainer: {
    width: '100%',
    textAlign: 'center',
    overflow: 'auto',
  },
  image: {
    maxWidth: '100%',
    width: 'auto',
  },
  imageFixedSize: {
    height: '500px',
  },
  imageOriginalSize: {
    height: 'auto',
  },
})

const ImageViewer = ({
  classes,
  dispatch,
  imageViewer,
  mainDivHeight = 700,
}) => {
  const { attachment } = imageViewer
  const [
    showImageViewer,
    setShowImageViewer,
  ] = useState(false)

  const [
    imageContent,
    setImageContent,
  ] = useState(undefined)

  const [
    showOriginal,
    setShowOriginal,
  ] = useState(false)

  const cleanUp = () => {
    dispatch({
      type: 'imageViewer/updateState',
      payload: {
        attachment: undefined,
      },
    })
    setImageContent(undefined)
  }

  const fetchImageContent = async () => {
    const { fileIndexFK, content } = attachment
    if (fileIndexFK) {
      const response = await getFileByFileID(fileIndexFK)
      if (response && response.status === 200) {
        const { data } = response
        const contentInBase64 = arrayBufferToBase64(data)

        setImageContent(contentInBase64)
      }
    } else {
      setImageContent(content)
    }
  }

  useEffect(
    () => {
      setShowImageViewer(!!attachment)
      if (attachment) {
        fetchImageContent()
      }
    },
    [
      attachment,
    ],
  )

  const handleClose = () => {
    setShowImageViewer(!showImageViewer)
    cleanUp()
  }

  const onShowOriginalClick = () => {
    setShowOriginal(!showOriginal)
  }

  const onDownloadClick = () => {
    if (attachment) downloadAttachment(attachment)
  }

  const title = attachment ? attachment.fileName : 'Image'

  const imageClass = classnames({
    [classes.image]: true,
    [classes.imageFixedSize]: !showOriginal,
    [classes.imageOriginalSize]: showOriginal,
  })

  return (
    <React.Fragment>
      {imageContent && (
        <CommonModal
          open={showImageViewer}
          onClose={handleClose}
          title={title}
          maxWidth='lg'
          disableBackdropClick={false}
        >
          <div className={classes.buttonContainer}>
            <Button color='primary' onClick={onDownloadClick}>
              <Download />Download
            </Button>
            <Button color='primary' onClick={onShowOriginalClick}>
              Show Original
            </Button>
          </div>
          <div
            className={classes.imageContainer}
            style={{ maxHeight: mainDivHeight - 190 }}
          >
            <img
              className={imageClass}
              alt={title}
              src={`${base64Prefix}${imageContent}`}
            />
          </div>
        </CommonModal>
      )}
    </React.Fragment>
  )
}

const Connect = connect(({ imageViewer, global }) => ({
  imageViewer,
  mainDivHeight: global.mainDivHeight,
}))(ImageViewer)

export default withStyles(styles, { name: 'ImageViewer' })(Connect)
