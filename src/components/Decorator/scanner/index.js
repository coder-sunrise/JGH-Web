import React, { Component } from 'react'
import $ from 'jquery'
import { connect } from 'dva'
import classnames from 'classnames'
import { withStyles, Fab } from '@material-ui/core'
import PropTypes from 'prop-types'
import {
  GridContainer,
  GridItem,
  CardContainer,
  Accordion,
  withFormikExtend,
  IconButton,
  Button,
  SketchField,
  Tools,
  Tooltip,
  Tabs,
  Popconfirm,
} from '@/components'
import { roundUp } from '@/utils/utils'
import Authorized from '@/utils/Authorized'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import ToggleButton from '@material-ui/lab/ToggleButton'
import { Delete, ImageSearch } from '@material-ui/icons'

import { getThumbnail } from '@/components/_medisys/AttachmentWithThumbnail/utils'
import { leftTools, ToolTypes } from './variables'
import { Scanconfig } from './scanconfig'
import { ImageList } from './imagelist'

const base64Prefix = 'data:image/png;base64,'
const thumbnailSize = { width: 100, height: 80 }

const styles = (theme) => ({
  root: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },

  tabArea: {
    border: '1px solid #e8e8e8',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
})
class Scanner extends Component {
  constructor (props) {
    super(props)
    this.state = {
      tool: Tools.None,
    }
    this.sketchs = []
    this._imagelistRef = React.createRef()
  }

  componentDidMount = () => {
    window.addEventListener('resize', this._resize, false)
    setTimeout(this._resize, 100)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._resize)
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const nextImages = nextProps.imageDatas || []
    const thisImages = this.props.imageDatas || []
    if (nextImages.length !== thisImages.length) {
      this.setState({ activeKey: nextImages[nextImages.length - 1].uid })
    }
  }

  getContainerHeight = () => {
    return window.innerHeight - 190
  }

  _resize = (e) => {
    if (this._imagelistRef.current) {
      let current = $(this._imagelistRef.current)
      let prev = current.prev()
      const containerHeight = this.getContainerHeight()
      // console.log(containerHeight, prev[0].offsetHeight)

      let currentHeight = containerHeight - prev[0].offsetHeight - 20
      const gridDiv = current.find('.medisys-edit-table>div')
      if (gridDiv && gridDiv.length > 0) {
        gridDiv.eq(0).height(currentHeight)
        gridDiv[0].style.overflow = 'auto'
      }
    }
  }

  scaleToViewWH = (sketch) => {
    const canvas = sketch._fc
    const container = sketch._container
    let { offsetWidth, clientHeight } = container
    const currentZoom = canvas.getZoom()

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()

    const sw = offsetWidth / canvasWidth
    const sh = clientHeight / canvasHeight

    let newZoom = Math.min(sw, sh)
    const zoomBy = roundUp(newZoom / currentZoom, 6)

    const zoomHeight = roundUp(canvasHeight * zoomBy, 6)
    const zoomWidth = roundUp(canvasWidth * zoomBy, 6)

    canvas.setHeight(zoomHeight)
    canvas.setWidth(zoomWidth)

    canvas.setZoom(newZoom)

    // console.log({
    //   offsetWidth,
    //   clientHeight,
    //   canvasWidth,
    //   canvasHeight,
    //   currentZoom,
    // })
  }

  setBackgroundFromData = (activeKey) => {
    if (this.sketchs[activeKey]) {
      const { imageDatas = [] } = this.props

      const selectedImage = imageDatas.find((i) => i.uid === activeKey)
      if (selectedImage && selectedImage.image) {
        const base64Data = `${base64Prefix}${selectedImage.image}`
        this.sketchs[activeKey].setBackgroundFromData(
          base64Data,
          true,
          {
            hasControls: false,
            hasBorders: false,
          },
          (img) => {
            const sketch = this.sketchs[activeKey]
            this.scaleToViewWH(sketch)
          },
        )
      }
    }
  }

  generateThumbnail = async (imageSource, size = thumbnailSize) => {
    try {
      let thumbnailData
      await new Promise((resolve) => {
        const image = new Image()
        image.src = imageSource
        image.onload = () => {
          const thumbnail = getThumbnail(image, size)
          thumbnailData = thumbnail.toDataURL(`image/png`)

          resolve()
        }
      })
      return thumbnailData
    } catch (error) {
      return null
    }
  }

  handelConfirmDelete = (uid) => {
    const { imageDatas = [], onDeleteItem } = this.props
    {
      const item = imageDatas.find((f) => f.uid === uid)
      const activeItems = imageDatas.filter((f) => f.uid !== uid)
      if (activeItems.length > 0 && this.state.activeKey === uid) {
        this.setState({
          activeKey: activeItems[activeItems.length - 1].uid,
        })
      } else if (
        imageDatas.length >= 2 &&
        imageDatas.indexOf(item) === imageDatas.length - 1
      ) {
        this.setState({
          activeKey: imageDatas[imageDatas.length - 2].uid,
        })
      }
      delete this.sketchs[uid]
      onDeleteItem(uid)
    }
  }

  handleCommitChanges = ({ rows, deleted }) => {
    rows.forEach((r) => {
      if (deleted && r.isDeleted === true) {
        this.handelConfirmDelete(r.uid)
      } else {
        this.props.onUpdateName(r)
      }
    })
  }

  renderThumbnailImg = (imageData) => {
    const { uid, image } = imageData
    if (this.sketchs[uid]) {
      // console.log('renderThumbnailImg --1')
      // this.updateThumbnail(this.sketchs[uid], uid)
    } else {
      const base64Data = `${base64Prefix}${image}`
      this.generateThumbnail(base64Data, {
        width: 300,
        height: 300,
      }).then((thumbnail) => {
        this.updateThumbnailToElement(uid, thumbnail)
      })
    }
  }

  updateThumbnail = (sketch, uid) => {
    const imgData = sketch.exportToImageDataUrl()
    this.generateThumbnail(imgData, {
      width: 300,
      height: 300,
    }).then((thumbnail) => {
      this.updateThumbnailToElement(uid, thumbnail)
    })
  }

  updateThumbnailToElement = (uid, thumbnail) => {
    let imgs = $(`img[uid='${uid}']`) || []
    for (let index = 0; index < imgs.length; index++) {
      const element = imgs[index]
      element.src = thumbnail
    }
  }

  getTabOptions = () => {
    const { imageDatas = [] } = this.props
    return imageDatas.reduce((p, cur) => {
      const { uid, name } = cur
      const opt = {
        id: uid,
        name: (
          <React.Fragment>
            {this.renderThumbnailImg(cur)}
            <div
              style={
                this.state.activeKey !== uid ? { opacity: 0.4 } : thumbnailSize
              }
            >
              <img uid={`${uid}`} alt='' style={thumbnailSize} />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Popconfirm
                title='Are you sure delete this item?'
                onConfirm={() => {
                  this.handelConfirmDelete(uid)
                }}
              >
                <Tooltip title={`delete ${name}`}>
                  <Button
                    style={{
                      position: 'absolute',
                      left: thumbnailSize.width - 2,
                      top: 5,
                    }}
                    justIcon
                    size='sm'
                    color='danger'
                  >
                    <Delete />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </div>
          </React.Fragment>
        ),
        content: (
          <SketchField
            name={`image-${uid}`}
            ref={(c) => {
              if (c) {
                if (!this.sketchs[uid]) {
                  // console.log('ref-->', c)
                  this.sketchs[uid] = c
                  this.setBackgroundFromData(uid)
                }
              }
            }}
            tool={this.state.tool}
            lineWidth={1}
            lineColor='blue'
            fillColor='transparent'
            backgroundColor='transparent'
            forceValue
            height={window.innerHeight - 300}
            disableResize
            style={{ overflow: 'auto' }}
            canvasStyle={{ border: '1px solid #EDF3FF' }}
            onDoubleClick={() => this.Zoom(0.2)}
            onChange={(e) => {
              if (
                this.sketchs[uid]._selectedTool.getToolName() === Tools.Crop
              ) {
                this.setState({
                  tool: Tools.None,
                })
                this.updateThumbnail(this.sketchs[uid], uid)
              }
            }}
          />
        ),
      }

      return [
        ...p,
        opt,
      ]
    }, [])
  }

  doChangeImages = (process) => {
    if (!process) return

    const { imageDatas = [] } = this.props
    let { activeKey } = this.state
    if (imageDatas.length === 1) {
      activeKey = imageDatas[0].uid
    }
    const selected = this.sketchs[activeKey]
    if (selected) {
      const objects = selected._fc.getObjects()
      selected._fc.setActiveObject(objects[0])
      process(selected, objects[0])
      objects[0].selectable = false
      objects[0].evented = false
    }
  }

  rotate90 = (direction) => {
    this.doChangeImages((selected, obj) => {
      let rotateNum = 0
      if (direction === 'left') {
        rotateNum -= 90
      } else {
        rotateNum += 90
      }
      const canvas = selected._fc
      let canvasHeight = canvas.getHeight()
      let canvasWidth = canvas.getWidth()

      canvas.setHeight(canvasWidth)
      canvas.setWidth(canvasHeight)

      selected.setAngle(rotateNum, (rotateObj, num) => {
        const { width, height, angle } = rotateObj
        // let width = canvas.getWidth()
        // let height = canvas.getHeight()
        // let { angle } = rotateObj
        if (angle === 0) {
          obj.set({ top: 0, left: 0 })
        } else if (angle === -90 || angle === 270) {
          obj.set({ top: width, left: 0 })
        } else if (Math.abs(angle) === 180) {
          obj.set({ top: height, left: width })
        } else if (angle === -270 || angle === 90) {
          obj.set({ top: 0, left: height })
        }
      })

      setTimeout(() => {
        this.updateThumbnail(selected, this.state.activeKey)
      }, 100)
    })
  }

  mirror = () => {
    this.doChangeImages((selected) => {
      selected.mirror()
      setTimeout(() => {
        this.updateThumbnail(selected, this.state.activeKey)
      }, 100)
    })
  }

  download = () => {
    this.doChangeImages((selected, obj) => {
      const canvas = selected._fc
      const origZoom = canvas.getZoom()
      const origWidth = canvas.getWidth()
      const origHeight = canvas.getHeight()

      canvas.setZoom(1)
      canvas.setWidth(obj.width)
      canvas.setHeight(obj.height)

      selected.downloadImage()

      canvas.setZoom(origZoom)
      canvas.setWidth(origWidth)
      canvas.setHeight(origHeight)
    })
  }

  Zoom = (factor) => {
    this.doChangeImages((selected, obj) => {
      let canvas = selected._fc

      const currentZoom = canvas.getZoom()
      const newZoom = currentZoom * (1 + factor)

      const height = canvas.getHeight()
      const width = canvas.getWidth()
      const zoomBy = roundUp(newZoom / currentZoom, 6)

      const zoomHeight = roundUp(height * zoomBy, 6)
      const zoomWidth = roundUp(width * zoomBy, 6)

      canvas.setHeight(zoomHeight)
      canvas.setWidth(zoomWidth)

      canvas.setZoom(newZoom)
    })
  }

  handleToolClick = (toolId) => {
    switch (toolId) {
      case ToolTypes.ZoomIn:
        this.Zoom(0.1)
        break
      case ToolTypes.ZoomOut:
        this.Zoom(-0.1)
        break
      case ToolTypes.RotateLeft:
        this.rotate90('left')
        break
      case ToolTypes.RotateRight:
        this.rotate90('right')
        break
      case ToolTypes.Mirror:
        this.mirror()
        break
      case ToolTypes.Crop:
        this.setState((preState) => ({
          tool: preState.tool === Tools.Crop ? Tools.None : Tools.Crop,
        }))
        break
      case ToolTypes.Download:
        this.download()
        break

      default:
        break
    }
  }

  handleUploading = async () => {
    const { onUploading, imageDatas = [] } = this.props
    const uploadImages = []
    if (this.sketchs) {
      // eslint-disable-next-line guard-for-in
      for (let k in this.sketchs) {
        const item = imageDatas.find((f) => f.uid === k)
        const imgData = this.sketchs[k].exportToImageDataUrl()
        const thumbnailData = await this.generateThumbnail(imgData)
        uploadImages.push({
          uid: k,
          imgData: imgData.split(',')[1],
          thumbnailData: thumbnailData.split(',')[1],
          name: item.name,
          fileExtension: '.png',
        })
      }
    }
    onUploading(uploadImages)
  }

  render () {
    const { classes, onScaning, imageDatas = [] } = this.props
    // console.log('----------------------------------------render scanner')
    return (
      <GridContainer style={{ height: this.getContainerHeight() }}>
        <GridItem xs={9} md={9}>
          <div
            style={{
              display: 'flex',
            }}
          >
            <ToggleButtonGroup
              exclusive
              size='small'
              orientation='vertical'
              onChange={(e) => {
                if (e.target.value === 'select') {
                  this.setState({
                    tool: e.target.value,
                  })
                } else if (e.target.value === 'eraser') {
                  this.setState({
                    tool: e.target.value,
                  })
                  this._removeSelected()
                }
              }}
              value={this.state.tool || Tools.None}
              outline='none'
            >
              {leftTools({ currentTool: this.state.tool }).map((t) => {
                const { id, title, icon } = t
                return (
                  <Tooltip title={title}>
                    <ToggleButton
                      key={id}
                      onClick={(e) => {
                        this.handleToolClick(id, e)
                      }}
                    >
                      {icon}
                    </ToggleButton>
                  </Tooltip>
                )
              })}
            </ToggleButtonGroup>

            <div className={classes.tabArea}>
              <Tabs
                activeKey={this.state.activeKey}
                type='line'
                tabPosition='bottom'
                size='large'
                centered
                animated='false'
                tabStyle={{}}
                tabBarGutter={12}
                options={this.getTabOptions()}
                onChange={(k) => {
                  this.setState({ activeKey: k })
                }}
              />
            </div>
          </div>
        </GridItem>
        <GridItem xs={3} md={3}>
          <React.Fragment>
            <div>
              <Scanconfig
                onScaning={onScaning}
                onUploading={this.handleUploading}
                onSizeChanged={this._resize}
                canUploading={imageDatas.length > 0}
              />
            </div>
            <div ref={this._imagelistRef} style={{ marginTop: 20 }}>
              <ImageList
                imgRows={imageDatas}
                handleCommitChanges={this.handleCommitChanges}
              />
            </div>
          </React.Fragment>
        </GridItem>
      </GridContainer>
    )
  }
}
export default withStyles(styles, { withTheme: true })(Scanner)
