import React, { Component } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import { formatMessage } from 'umi/locale'
// material ui
import { withStyles, Chip } from '@material-ui/core'
import { Print, Save, Delete } from '@material-ui/icons'
import {
  GridContainer,
  GridItem,
  Select,
  Button,
  TextField,
  dateFormatLong,
  Popconfirm,
} from '@/components'
import { LoadingWrapper } from 'medisys-components'
import printJS from 'print-js'
// import 'react-responsive-carousel/lib/styles/carousel.min.css'
import { getFileByFileID } from '@/services/file'
import { arrayBufferToBase64 } from '@/components/_medisys/ReportViewer/utils'
import { Carousel } from 'antd'
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos'
import $ from 'jquery'
import _ from 'lodash'
import SetFolderWithPopover from './SetFolderWithPopover'
import ZImage from './ZImage'

// import 'antd/dist/antd.css'
import './style.css'

const ScaleMode = {
  FixedWH: 1,
  FixedW: 2,
  FixedH: 3,
  MaxWH: 4,
}
const base64Prefix = 'data:image/png;base64,'
const styles = (theme) => ({
  previous: {
    paddingLeft: 10,
    width: 25,
    display: 'table-cell',
    verticalAlign: 'middle',
    backgroundColor: 'black',
    // '&:hover': {
    //   backgroundColor: 'Gray',
    // },
  },
  next: {
    paddingRight: 10,
    width: 25,
    display: 'table-cell',
    verticalAlign: 'middle',
    backgroundColor: 'black',
    // '&:hover': {
    //   backgroundColor: 'Gray',
    // },
  },
  imageContainer: {
    // border: '1px solid #cccf',
    display: 'inherit',
    textAlign: 'center',
    width: '100%',
  },
})

@connect(({ folder }) => ({
  folder,
}))
class ImagePreviewer extends Component {
  constructor (props) {
    super(props)
    this.carouselRef = React.createRef()
    this.state = {
      imageList: [],
    }
  }

  componentDidMount () {
    const { defaultFileFK, files } = this.props

    // console.log('componentDidMount', { defaultFileFK, files })
    this.cacheImageList(files, defaultFileFK)
    window.addEventListener('resize', this.resize.bind(this))
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize)
  }

  // eslint-disable-next-line react/sort-comp
  UNSAFE_componentWillReceiveProps (nextProps) {
    const { files: nextFiles = [] } = nextProps
    const { imageList } = this.state

    // handle on removed selected image
    if (nextFiles.length > 0) {
      if (imageList.length !== nextFiles.length) {
        const preSelectedIndex = imageList.findIndex((f) => f.isSelected)
        const nextSelectedIndex =
          preSelectedIndex <= 0 ? 0 : preSelectedIndex - 1
        const selectedFileIndexFK = nextFiles[nextSelectedIndex].fileIndexFK

        this.cacheImageList(nextFiles, selectedFileIndexFK)
      }
    } else {
      this.setState({ imageList: [] })
    }
  }

  cacheImageList = (files, fileIndexFK) => {
    const imageList = files.map((m, i) => {
      const stateFile =
        (this.state.imageList || []).find((x) => x.id === m.id) || {}
      return {
        ...m,
        slideNumber: i,
        image: stateFile.image,
        width: stateFile.width,
        height: stateFile.height,
        isSelected: false,
      }
    })

    const imageWH = this.getImageContainerWH()
    this.setState({ ...imageWH, imageList }, () => {
      const currentImg = imageList.find((s) => s.fileIndexFK === fileIndexFK)
      if (!currentImg || !currentImg.image)
        this.fetchImage(imageList, fileIndexFK)
      else {
        currentImg.isSelected = true
        this.setState({ imageList })
      }
    })
  }

  getImageContainerWH = () => {
    const imageContainerHeight = window.innerHeight - 80
    const containerWidth = window.innerWidth - 50
    const imageContainerWidth = containerWidth - 400
    return { imageContainerHeight, imageContainerWidth }
  }

  resize = () => {
    const { imageList = [] } = this.state
    const {
      imageContainerHeight,
      imageContainerWidth,
    } = this.getImageContainerWH()

    imageList.filter((s) => s.image && s.image.src).map((img) => {
      let scaleWH = this.scaleImage(
        img.image,
        imageContainerWidth,
        imageContainerHeight,
        ScaleMode.MaxWH,
      )
      img.width = scaleWH.width
      img.height = scaleWH.height
    })

    this.setState({ imageContainerHeight, imageContainerWidth, imageList })
  }

  fetchImage = (imageList, fileIndexFK) => {
    const {
      imageContainerWidth: width,
      imageContainerHeight: height,
    } = this.state

    const loadImage = (contentInBase64) => {
      if (contentInBase64) {
        this.processImage(contentInBase64, width, height).then((content) => {
          let selectedImg
          imageList.map((i) => {
            if (i.fileIndexFK === fileIndexFK) {
              i.isSelected = true
              selectedImg = i
            } else {
              i.isSelected = false
            }
          })
          if (selectedImg) {
            selectedImg.image = content.image
            selectedImg.width = content.width
            selectedImg.height = content.height
            selectedImg.imageData = contentInBase64

            this.setState({ imageList, loading: false })
            setTimeout(() => {
              this.carouselRef.goTo(selectedImg.slideNumber, true)
            }, 100)
          }
        })
      }
    }

    const currentFile = imageList.find((i) => i.fileIndexFK === fileIndexFK)
    if (currentFile && currentFile.imageData) {
      loadImage(currentFile.imageData)
    } else {
      this.setState({ loading: true })
      getFileByFileID(fileIndexFK).then((response) => {
        this.setState({ loading: false })
        const { data } = response
        const contentInBase64 = base64Prefix + arrayBufferToBase64(data)
        loadImage(contentInBase64)
        this.props.onImageLoaded(fileIndexFK, contentInBase64)
      })
    }
  }

  processImage = async (data, containerWidth, containerHeight) => {
    let scaleWH = {}
    const image = new Image()
    await new Promise((resolve, reject) => {
      try {
        image.src = data
        image.onload = () => {
          scaleWH = this.scaleImage(
            image,
            containerWidth,
            containerHeight,
            ScaleMode.MaxWH,
          )
          resolve()
        }
      } catch (ex) {
        reject(ex)
      }
    })

    return {
      image,
      ...scaleWH,
    }
  }

  scaleImage = (image, containerWidth, containerHeight, mode) => {
    let towidth = containerWidth
    let toheight = containerHeight

    switch (mode) {
      case ScaleMode.FixedWH:
        break
      case ScaleMode.FixedW:
        toheight = image.height * containerWidth / image.width
        break
      case ScaleMode.FixedH:
        towidth = image.width * containerHeight / image.height
        break
      case ScaleMode.MaxWH:
        // eslint-disable-next-line no-case-declarations
        const rmaxW = image.width * 1.0 / containerWidth
        // eslint-disable-next-line no-case-declarations
        const rmaxH = image.height * 1.0 / containerHeight

        if (rmaxW > rmaxH) {
          if (rmaxW <= 1) {
            towidth = image.width
            containerHeight = image.height
            toheight = containerHeight
            // goto case ScaleMode.FixedWH;
            break
          }
          towidth = containerWidth
          // goto case ScaleMode.FixedW;
          toheight = image.height * containerWidth / image.width
          break
        }
        if (rmaxH <= 1) {
          towidth = image.width
          containerHeight = image.height
          toheight = containerHeight
          // goto case ScaleMode.FixedWH;
          break
        }
        toheight = containerHeight
        // goto case ScaleMode.FixedH;
        towidth = image.width * containerHeight / image.height
        break
      default:
        break
    }
    return { width: towidth, height: toheight }
  }

  previous = (current) => {
    this.checkFileChanged(current, () => {
      this.carouselRef.prev()
    })
  }

  next = (current) => {
    this.checkFileChanged(current, () => {
      this.carouselRef.next()
    })
  }

  afterChangeImage = (current) => {
    const { imageList } = this.state
    imageList.map((m) => {
      m.isSelected = false
    })

    const currentImg = imageList.find((s) => s.slideNumber === current)
    if (currentImg) {
      currentImg.isSelected = true
      if (currentImg.image) {
        this.setState({ imageList })
      } else {
        this.fetchImage(imageList, currentImg.fileIndexFK)
      }
    }
  }

  deleteImage = (file) => {
    this.props
      .dispatch({
        type: 'patientAttachment/removeRow',
        payload: {
          id: file.id,
        },
      })
      .then(() => {
        if (this.state.imageList.filter((f) => f.id !== file.id).length === 0)
          this.props.onClose()

        this.props.dispatch({
          type: 'patientAttachment/query',
        })
      })
  }

  checkFileChanged = (file, onConfirm) => {
    const origFile = this.props.files.find((f) => f.id === file.id)
    if (origFile) {
      const { fileName, folderFKs } = origFile
      if (
        file.fileName !== fileName ||
        _.sortedUniq(file.folderFKs).join(',') !==
          _.sortedUniq(folderFKs).join(',')
      ) {
        this.props.dispatch({
          type: 'global/updateAppState',
          payload: {
            openConfirm: true,
            openConfirmContent: formatMessage({
              id: 'app.general.leave-without-save',
            }),
            onConfirmSave: () => {
              // restore file to state
              const { imageList } = this.state
              const changedFile = imageList.find((f) => f.id === file.id)
              changedFile.fileName = fileName
              changedFile.folderFKs = _.sortedUniq(folderFKs)
              this.setState({ imageList })
              onConfirm()
            },
          },
        })
      } else {
        onConfirm()
      }
    }
  }

  render () {
    const {
      imageList = [],
      loading = false,
      imageContainerWidth,
      imageContainerHeight,
    } = this.state
    const {
      classes,
      readOnly,
      folder: { list: folderList },
      onFileUpdated,
      onAddNewFolders,
    } = this.props
    const selectedImage = this.state.imageList.find((s) => s.isSelected) || {}

    return (
      <div
        style={{ display: 'table', height: '100%' }}
        ref={(ref) => {
          this.main = ref
        }}
      >
        <div
          className={classes.previous}
          onClick={() => {
            this.previous(selectedImage)
          }}
        >
          <ArrowBackIosIcon style={{ color: 'white' }} />
        </div>
        <LoadingWrapper
          loading={loading}
          text={<font color='white'>loading...</font>}
        >
          <div
            style={{
              backgroundColor: 'black',
              width: imageContainerWidth,
              // minHeight: 400,
            }}
          >
            <Carousel
              ref={(el) => {
                this.carouselRef = el
              }}
              effect='fade'
              afterChange={this.afterChangeImage}
            >
              {this.state.imageList.map((img) => {
                const { image, width, height, fileIndexFK, isSelected } = img
                return (
                  <div>
                    <div
                      className={classes.imageContainer}
                      style={{
                        height: imageContainerHeight,
                      }}
                    >
                      {image &&
                      isSelected && (
                        <ZImage
                          key={fileIndexFK}
                          src={image.src}
                          width={width}
                          height={height}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </Carousel>
          </div>
        </LoadingWrapper>
        <div
          className={classes.next}
          onClick={() => {
            this.next(selectedImage)
          }}
        >
          <ArrowBackIosIcon
            style={{ transform: 'rotate(180deg)', color: 'white' }}
          />
        </div>
        <div>
          <GridContainer>
            <GridItem xs={12} md={12}>
              <TextField
                label='Created By'
                text
                value={selectedImage.createByUserName}
                style={{ width: '100%' }}
              />
            </GridItem>
            <GridItem md={12}>
              <TextField
                label='Create Date'
                value={moment(selectedImage.createDate).format(dateFormatLong)}
                text
              />
            </GridItem>
            <GridItem md={12}>
              <TextField
                label='File Name'
                value={selectedImage.fileName}
                maxLength={50}
                onChange={(e) => {
                  selectedImage.fileName = e.target.value
                  this.setState({ imageList })
                }}
                text={readOnly}
                style={{ width: '100%' }}
              />
            </GridItem>
            <GridItem md={12} style={{ marginTop: 10 }}>
              <div>
                <span style={{ marginRight: 10 }}>Folder as:</span>
                {!readOnly && (
                  <SetFolderWithPopover
                    key={selectedImage.id}
                    folderList={folderList}
                    selectedFolderFKs={selectedImage.folderFKs || []}
                    onClose={(selectedFolder) => {
                      const originalFolders = _.sortedUniq(
                        selectedImage.folderFKs || [],
                      )
                      const newFolders = _.sortedUniq(selectedFolder)

                      if (
                        originalFolders.length !== newFolders.length ||
                        originalFolders.join(',') !== newFolders.join(',')
                      ) {
                        selectedImage.folderFKs = newFolders
                        this.setState({ imageList })
                      }
                    }}
                    onAddNewFolders={onAddNewFolders}
                  />
                )}
              </div>
            </GridItem>
            {selectedImage.folderFKs &&
            Array.isArray(selectedImage.folderFKs) && (
              <GridItem
                md={12}
                style={{
                  padding: 0,
                  minHeight: 50,
                  maxHeight: 200,
                  overflow: 'scroll',
                }}
              >
                {_.uniq(selectedImage.folderFKs).map((item) => {
                  const folderEntity = folderList.find((f) => f.id === item)
                  return (
                    <Chip
                      style={{ margin: 8 }}
                      key={item}
                      size='small'
                      variant='outlined'
                      label={folderEntity.displayValue}
                      color='primary'
                      onDelete={() => {
                        selectedImage.folderFKs = selectedImage.folderFKs.filter(
                          (i) => i !== item,
                        )
                        this.setState({ imageList })
                      }}
                    />
                  )
                })}
              </GridItem>
            )}
            <GridItem md={12}>
              <div>
                <Button
                  color='primary'
                  onClick={() => {
                    printJS({
                      printable: selectedImage.image.src,
                      type: 'image',
                      base64: true,
                      header: '',
                    })
                  }}
                >
                  <Print /> Print
                </Button>
                {!readOnly && (
                  <React.Fragment>
                    <Button
                      color='primary'
                      disabled={
                        selectedImage.fileName === undefined ||
                        selectedImage.fileName.trim() === ''
                      }
                      onClick={() => {
                        onFileUpdated(selectedImage)
                      }}
                    >
                      <Save /> Save
                    </Button>

                    <Popconfirm
                      title='Permanently delete this file in all folders?'
                      onConfirm={() => {
                        this.deleteImage(selectedImage)
                      }}
                    >
                      <Button color='danger'>
                        <Delete /> Delete
                      </Button>
                    </Popconfirm>
                  </React.Fragment>
                )}
              </div>
            </GridItem>
          </GridContainer>
        </div>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(ImagePreviewer)
