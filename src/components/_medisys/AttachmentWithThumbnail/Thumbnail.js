import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
// formik
import { FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
import { compose } from 'redux'
import { connect } from 'dva'
// common components
import {
  GridContainer,
  GridItem,
  SizeContainer,
  TextField,
  Tooltip,
} from '@/components'
import { DeleteWithPopover, LoadingWrapper } from '@/components/_medisys'
// utils
import { arrayBufferToBase64 } from '@/components/_medisys/ReportViewer/utils'
// services
import { getFileByFileID } from '@/services/file'
// assets
import dummyThumbnail from '@/assets/thumbnail-icons/dummy-thumbnail-icon.png'
import pdfIcon from '@/assets/thumbnail-icons/pdf-icon.png'
import wordIcon from '@/assets/thumbnail-icons/word-icon.png'
import excelIcon from '@/assets/thumbnail-icons/excel-icon.png'
import {
  imageFileExtensions,
  pdfFileExtensions,
  excelFileExtensions,
  wordFileExtensions,
} from './utils'

const styles = theme => ({
  simpleRoot: {
    position: 'relative',
    display: 'inline-block',
    textAlign: 'center',
    minWidth: 64,
    // margin: 8,
    '& button': {
      marginRight: 0,
      padding: '0px !important',
    },
  },
  root: {
    display: 'inline-block',
    textAlign: 'left',
    width: 140,
    margin: 8,
  },
  filenameContainer: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  imageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing(1),
    '& img': {
      maxWidth: '100%',
      maxHeight: '100%',
      cursor: 'pointer',
    },
  },
  imageBorder: {
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  imageSpacing: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  simpleButtonGroup: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    // left: '24px',
    textAlign: 'right',
    width: '35px',
    height: '35px',
    paddingTop: theme.spacing(1),
    '& button': {
      margin: 4,
      padding: '0px !important',
    },
  },
})

const Thumbnail = ({
  classes,
  dispatch,
  indexInAllAttachments,
  isReadOnly = false,
  simple,
  attachment,
  onConfirmDelete,
  onClickAttachment,
  noBorder = true,
  fieldName,
  size = { width: 64, height: 64 },
  hideRemarks,
  hiddenDelete,
  showImagePreview,
}) => {
  const {
    fileIndexFK,
    fileName,
    fileExtension,
    id,
    thumbnailIndexFK,
    thumbnail = { id: undefined },
    useImageViewer = true,
    remarks,
  } = attachment

  const [imgSrc, setImgSrc] = useState(dummyThumbnail)

  const [loadingThumbnail, setLoadingThumbnail] = useState(true)

  const doFetch = async () => {
    try {
      if (attachment && attachment.thumbnailData) {
        setImgSrc(attachment.thumbnailData)
      } else {
        let src
        const thumbnailId = thumbnailIndexFK || thumbnail.id

        if (thumbnailId) {
          const response = await getFileByFileID(thumbnailId)
          if (response && response.status === 200) {
            const { data } = response
            const thumbnailDataInBase64 = arrayBufferToBase64(data)
            const base64Prefix = 'data:image/png;base64,'
            src = `${base64Prefix}${thumbnailDataInBase64}`
          }
        } else {
          if (pdfFileExtensions.includes(fileExtension)) src = pdfIcon
          if (wordFileExtensions.includes(fileExtension)) src = wordIcon
          if (excelFileExtensions.includes(fileExtension)) src = excelIcon
        }
        setImgSrc(src)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingThumbnail(false)
    }
  }

  const getThumbnail = () => {
    doFetch()
  }

  useEffect(getThumbnail, [attachment.id])

  const handleConfirmDelete = () => {
    onConfirmDelete(fileIndexFK, id)
  }

  const handleAttachmentClicked = () => {
    if (!attachment) return

    if (
      useImageViewer &&
      imageFileExtensions.includes(attachment.fileExtension.toLowerCase())
    ) {
      // show image preview
      if (showImagePreview) {
        showImagePreview(attachment)
      } else {
        dispatch({
          type: 'imageViewer/updateState',
          payload: {
            attachment,
          },
        })
      }
      return
    }

    onClickAttachment(attachment)
  }

  const simpleThumbnailClass = classnames({
    [classes.simpleRoot]: true,
    [classes.imageBorder]: !noBorder,
    [classes.imageSpacing]: !noBorder,
  })
  const thumbnailClass = classnames({
    [classes.root]: true,
    [classes.imageBorder]: !noBorder,
    [classes.imageSpacing]: !noBorder,
  })
  if (simple) {
    return (
      <div className={simpleThumbnailClass}>
        <LoadingWrapper loading={loadingThumbnail}>
          <React.Fragment>
            <Tooltip title={`Click to preview ${fileName}`}>
              <div
                className={classes.imageContainer}
                onClick={handleAttachmentClicked}
              >
                <img
                  src={imgSrc}
                  alt={fileName || ''}
                  width={size.width}
                  height={size.height}
                />
              </div>
            </Tooltip>
            <div className={classes.simpleButtonGroup}>
              <Tooltip title='Delete'>
                <DeleteWithPopover
                  disabled={isReadOnly}
                  onConfirmDelete={handleConfirmDelete}
                  buttonProps={{
                    size: 'sm',
                  }}
                />
              </Tooltip>
            </div>
          </React.Fragment>
        </LoadingWrapper>
      </div>
    )
  }
  // console.log(`${fieldName}[${indexInAllAttachments}].remarks`)
  return (
    <div className={thumbnailClass}>
      <LoadingWrapper loading={loadingThumbnail}>
        <GridContainer>
          <GridItem md={9} className={classes.filenameContainer}>
            <Tooltip title={fileName}>
              <span style={{ fontSize: '0.75rem' }}>{fileName}</span>
            </Tooltip>
          </GridItem>
          <GridItem md={3}>
            {!isReadOnly && !hiddenDelete && (
              <DeleteWithPopover
                disabled={isReadOnly}
                onConfirmDelete={handleConfirmDelete}
              />
            )}
          </GridItem>
          <GridItem md={12} style={{ cursor: 'pointer' }}>
            <div
              className={classes.imageContainer}
              onClick={handleAttachmentClicked}
            >
              <img
                src={imgSrc}
                alt={fileName}
                width={size.width}
                height={size.height}
              />
            </div>
          </GridItem>
          {!hideRemarks && (
            <GridItem md={12}>
              <SizeContainer size='sm'>
                {!isReadOnly ? (
                  <FastField
                    name={`${fieldName}[${indexInAllAttachments}].remarks`}
                    render={args => (
                      <TextField {...args} size='sm' label='Remarks' />
                    )}
                  />
                ) : (
                  <TextField
                    size='sm'
                    label='Remarks'
                    value={remarks}
                    disabled
                  />
                )}
              </SizeContainer>
            </GridItem>
          )}
        </GridContainer>
      </LoadingWrapper>
    </div>
  )
}

export default compose(
  withStyles(styles, { name: 'Thumbnail' }),
  connect(({ imageViewer }) => ({
    imageViewer,
  })),
)(Thumbnail)
