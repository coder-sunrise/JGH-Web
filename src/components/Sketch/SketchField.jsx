/* eslint-disable */
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import History from './history'
import { uuid4 } from './utils'
import Select from './select'
import Pencil from './pencil'
import Line from './line'
import Arrow from './arrow'
import Rectangle from './rectangle'
import Circle from './circle'
import Pan from './pan'
import Eraser from './eraser'
import Tool from './tools'
import None from './none'
import Crop from './crop'

const { fabric } = require('fabric')

/**
 *   based on FabricJS for React Applications
 */
class SketchField extends PureComponent {
  static propTypes = {
    // the color of the line
    lineColor: PropTypes.string,
    // The width of the line
    lineWidth: PropTypes.number,
    // the fill color of the shape when applicable
    fillColor: PropTypes.string,
    // the background color of the sketch
    backgroundColor: PropTypes.string,
    // the opacity of the object
    opacity: PropTypes.number,
    // number of undo/redo steps to maintain
    undoSteps: PropTypes.number,
    // The tool to use, can be pencil, rectangle, circle, brush;
    tool: PropTypes.string,
    // image format when calling toDataURL
    imageFormat: PropTypes.string,
    // Sketch data for controlling sketch from
    // outside the component
    value: PropTypes.object,
    // Set to true if you wish to force load the given value, even if it is  the same
    forceValue: PropTypes.bool,
    // Specify some width correction which will be applied on auto resize
    widthCorrection: PropTypes.number,
    // Specify some height correction which will be applied on auto resize
    heightCorrection: PropTypes.number,
    // Specify action on change
    onChange: PropTypes.func,
    onDoubleClick: PropTypes.func,
    // Default initial value
    defaultValue: PropTypes.object,
    // Sketch width
    width: PropTypes.number,
    // Sketch height
    height: PropTypes.number,
    // Class name to pass to container div of canvas
    className: PropTypes.string,
    // Style options to pass to container div of canvas
    style: PropTypes.object,
  }

  static defaultProps = {
    lineColor: 'black',
    lineWidth: 10,
    fillColor: 'transparent',
    backgroundColor: 'transparent',
    opacity: 1.0,
    undoSteps: 25,
    tool: Tool.Pencil,
    widthCorrection: 2,
    heightCorrection: 0,
    forceValue: false,
  }

  state = {
    parentWidth: 550,
    action: true,
    indexCount: 1,
    initialData: [],
    templateSet: false,
  }

  _initTools = (fabricCanvas) => {
    this._tools = {}
    this._tools[Tool.Select] = new Select(fabricCanvas)
    this._tools[Tool.Pencil] = new Pencil(fabricCanvas)
    this._tools[Tool.Line] = new Line(fabricCanvas)
    this._tools[Tool.Arrow] = new Arrow(fabricCanvas)
    this._tools[Tool.Rectangle] = new Rectangle(fabricCanvas)
    this._tools[Tool.Circle] = new Circle(fabricCanvas)
    this._tools[Tool.Pan] = new Pan(fabricCanvas)
    this._tools[Tool.Eraser] = new Eraser(fabricCanvas)
    this._tools[Tool.None] = new None(fabricCanvas)
    this._tools[Tool.Crop] = new Crop(fabricCanvas)
  }

  /**
   * Enable touch Scrolling on Canvas
   */
  enableTouchScroll = () => {
    let canvas = this._fc
    if (canvas.allowTouchScrolling) return
    canvas.allowTouchScrolling = true
  }

  /**
   * Disable touch Scrolling on Canvas
   */
  disableTouchScroll = () => {
    let canvas = this._fc
    if (canvas.allowTouchScrolling) {
      canvas.allowTouchScrolling = false
    }
  }

  /**
   * Add an image as object to the canvas
   *
   * @param dataUrl the image url or Data Url
   * @param options object to pass and change some options when loading image, the format of the object is:
   *
   * {
   *   left: <Number: distance from left of canvas>,
   *   top: <Number: distance from top of canvas>,
   *   scale: <Number: initial scale of image>
   * }
   */
  addImg = (dataUrl, options = {}) => {
    let canvas = this._fc
    fabric.Image.fromURL(dataUrl, (oImg) => {
      let opts = {
        left: Math.random() * (canvas.getWidth() - oImg.width * 0.5),
        top: Math.random() * (canvas.getHeight() - oImg.height * 0.5),
        scale: 0.5,
      }
      Object.assign(opts, options)
      oImg.scale(opts.scale)
      oImg.set({
        left: opts.left,
        top: opts.top,
      })
      canvas.add(oImg)
    })
  }

  /**
   * Action when an object is added to the canvas
   */
  _onObjectAdded = (e) => {
    if (!this.state.action) {
      this.setState({ action: true })
      return
    }
    // if(e.target.type != "image"){
    if (e.target.id !== 'SKIP') {
      let obj = e.target
      obj.__version = 1
      // record current object state as json and save as originalState
      let objState = obj.toJSON()
      obj.__originalState = objState
      let state = JSON.stringify(objState)
      // object, previous state, current state
      this._history.keep([
        obj,
        state,
        state,
      ])
    }
    //  }
  }

  getAllLayerData = () => {
    let canvas = this._fc
    const DefaultFilterList = this._history.getSaveLayerList()
    const objects = canvas.getObjects()
    let FilteredObjectList = []

    FilteredObjectList = DefaultFilterList.filter(({ layerContent }) =>
      objects.find(
        (item) => JSON.stringify(item.__originalState) === layerContent,
      ),
    )

    return FilteredObjectList
  }

  initializeData = (data) => {
    let history = this._history
    let canvas = this._fc
    let allList = data
    let { indexCount } = this.state
    let latestIndex = 0
    let count = allList[allList.length - 1].layerNumber
    let initializeData = { objects: [] }
    this.initialData = data

    //history.getInitializeList(data, count)
    for (let i = 0; i < allList.length; i++) {
      // let decodeObject = JSON.parse(allList[i].layerContent)

      let obj = JSON.parse(allList[i].layerContent)

      initializeData.objects.push(obj)

      // this.setState({ action: false }, () => {
      //   this._fc.add(obj)
      //   if (obj.zindex != null) {
      //     canvas.moveTo(obj, obj.zindex)

      //     if (obj.id === 'template') {
      //       canvas.moveTo(obj, -100)
      //     } else {
      //       latestIndex = obj.zindex
      //     }

      //     if (i === allList.length - 1) {
      //       if (latestIndex !== 0) {
      //         latestIndex += 1
      //         this.setState({
      //           indexCount: latestIndex,
      //         })
      //       }
      //     }
      //   }
      //   obj.__version -= 1
      //   obj.__removed = false
      // })
    }

    this.fromJSON(initializeData)
  }

  /**
   * Action when an object is moving around inside the canvas
   */
  _onObjectMoving = () => {}

  /**
   * Action when an object is scaling inside the canvas
   */
  _onObjectScaling = () => {}

  /**
   * Action when an object is rotating inside the canvas
   */
  _onObjectRotating = () => {}

  _onObjectModified = (e) => {
    let obj = e.target
    obj.__version += 1
    let prevState = JSON.stringify(obj.__originalState)
    let objState = obj.toJSON()
    // record current object state as json and update to originalState
    obj.__originalState = objState
    let currState = JSON.stringify(objState)
    this._history.keep([
      obj,
      prevState,
      currState,
    ])
  }

  _checkActiveObject = () => {
    const canvas = this._fc
    const objects = canvas.getObjects()
    let result = false
    if (objects.length > 0) {
      result = true
    } else {
      result = false
    }

    return result
  }

  _deleteSelectedObject = () => {
    const canvas = this._fc
    let result = false
    let obj = canvas.getActiveObject()

    if (obj) {
      if (canvas.getActiveObject().type === 'activeSelection') {
        obj._objects.forEach(function (object, key) {
          object.set({
            id: 'delete',
            removeObject: true,
          })
          canvas.remove(object)
        })

        result = true
      } else {
        obj.set({
          id: 'delete',
          removeObject: true,
        })
        canvas.remove(obj)
        result = true
      }
      canvas.discardActiveObject()
    }
    return result
  }

  /**
   * Action when an object is removed from the canvas
   */
  _onObjectRemoved = (e) => {
    const obj = e.target
    let canvas = this._fc
    if (obj.id === 'delete' || obj.id === 'oldTemplate') {
      let activeObj = obj
      if (activeObj) {
        let selected = []
        if (activeObj.type === 'activeSelection') {
          activeObj.forEachObject((obj) => selected.push(obj))
        } else {
          selected.push(activeObj)
        }
        selected.forEach((obj) => {
          obj.__removed = true
          let objState = obj.toJSON()
          obj.__originalState = objState
          let state = JSON.stringify(objState)
          this._history.keep([
            obj,
            state,
            state,
          ])
        })
        canvas.discardActiveObject()
        canvas.requestRenderAll()
      }
    }

    obj.set({
      id: '',
    })

    if (obj.__removed) {
      obj.__version += 1
      return
    }
    obj.__version = 0
  }

  /**
   * re-arrange the history list
   */

  /**
   * Action when the mouse button is pressed down
   */
  _onMouseDown = (e) => {
    this._selectedTool.doMouseDown(e)
  }

  /**
   * Action when the mouse cursor is moving around within the canvas
   */
  _onMouseMove = (e) => {
    this._selectedTool.doMouseMove(e)
  }

  /**
   * Action when the mouse cursor is moving out from the canvas
   */
  _onMouseOut = () => {
    // this._selectedTool.doMouseOut(e)
    // if (this.props.onChange) {
    //   let onChange = this.props.onChange
    //   setTimeout(() => {
    //     onChange(e.e)
    //   }, 10)
    // }
  }

  _onDoubleClick = (e) => {
    const { onDoubleClick } = this.props
    if (onDoubleClick) {
      onDoubleClick(e)
    }
  }

  _onMouseUp = (e) => {
    this._selectedTool.doMouseUp(e)
    // Update the final state to new-generated object
    // Ignore Path object since it would be created after mouseUp
    // Assumed the last object in canvas.getObjects() in the newest object
    if (this.props.tool !== Tool.Pencil) {
      const canvas = this._fc
      const objects = canvas.getObjects()
      const newObj = objects[objects.length - 1]
      if (newObj && newObj.__version === 1) {
        //  newObj.__originalState = newObj.toJSON()
      }
    }
    if (this.props.onChange) {
      let { onChange } = this.props
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
  }

  /**
   * Track the resize of the window and update our state
   *
   * @param e the resize event
   * @private
   */
  _resize = (e) => {
    if (e) e.preventDefault()
    let { widthCorrection, heightCorrection, disableResize } = this.props
    if (disableResize) return
    let canvas = this._fc
    let { offsetWidth, clientHeight } = this._container
    let prevWidth = canvas.getWidth()
    let prevHeight = canvas.getHeight()
    let wfactor = ((offsetWidth - widthCorrection) / prevWidth).toFixed(2)
    let hfactor = ((clientHeight - heightCorrection) / prevHeight).toFixed(2)
    canvas.setWidth(offsetWidth - widthCorrection)
    canvas.setHeight(clientHeight - heightCorrection)
    if (canvas.backgroundImage) {
      // Need to scale background images as well
      let bi = canvas.backgroundImage
      bi.width *= wfactor
      bi.height *= hfactor
    }
    let objects = canvas.getObjects()
    for (let i in objects) {
      let obj = objects[i]
      let scaleX = obj.scaleX
      let scaleY = obj.scaleY
      let left = obj.left
      let top = obj.top
      let tempScaleX = scaleX * wfactor
      let tempScaleY = scaleY * hfactor
      let tempLeft = left * wfactor
      let tempTop = top * hfactor
      obj.scaleX = tempScaleX
      obj.scaleY = tempScaleY
      obj.left = tempLeft
      obj.top = tempTop
      obj.setCoords()
    }
    this.setState({
      parentWidth: offsetWidth,
    })
    canvas.renderAll()
    canvas.calcOffset()
  }

  /**
   * Sets the background color for this sketch
   * @param color in rgba or hex format
   */
  _backgroundColor = (color) => {
    if (!color) return
    let canvas = this._fc
    canvas.setBackgroundColor(color, () => canvas.renderAll())
  }

  /**
   * Zoom the drawing by the factor specified
   *
   * The zoom factor is a percentage with regards the original, for example if factor is set to 2
   * it will double the size whereas if it is set to 0.5 it will half the size
   *
   * @param factor the zoom factor
   */
  zoom = (factor) => {
    let canvas = this._fc

    let objects = canvas.getObjects()
    for (let i in objects) {
      objects[i].factor = factor
      objects[i].scaleX = objects[i].scaleX * factor
      objects[i].scaleY = objects[i].scaleY * factor
      objects[i].left = objects[i].left * factor
      objects[i].top = objects[i].top * factor
      objects[i].setCoords()
    }
    canvas.renderAll()
    canvas.calcOffset()
  }

  /*
    hide drawing

  */

  hideDrawing = (hideEnable) => {
    let history = this._history
    let allList = []
    allList = history.getOriginalList()

    for (let i = 0; i < allList.length; i++) {
      let [
        obj,
      ] = allList[i]

      if (obj.type !== 'image') {
        if (hideEnable) {
          obj.set({
            opacity: 0,
          })
        } else {
          obj.set({
            opacity: 1,
          })
        }
      }
    }
    this._fc.renderAll()
  }

  /**
   * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
   */
  undo = () => {
    let history = this._history
    let canvas = this._fc
    let [
      obj,
      prevState,
    ] = history.getCurrent()

    let objects = canvas.getObjects()

    history.undo()
    if (obj.__removed) {
      this.setState({ action: false }, () => {
        this._fc.add(obj)
        if (obj.zindex != null) {
          if (obj.zindex === -100) {
            canvas.sendToBack(obj)
          } else {
            canvas.moveTo(obj, obj.zindex)
          }
        }
        obj.__version -= 1
        //obj.__removed = false
      })
    } else if (obj.__version <= 1) {
      this._fc.remove(obj)
    } else {
      obj.__version -= 1
      obj.setOptions(JSON.parse(prevState))
      // const initializeData = { objects: [] }
      // initializeData.objects.push(JSON.parse(prevState))
      // this._fc.loadFromJSON(initializeData, () => {
      //   this._fc.renderAll()
      //   // if (this.props.onChange) {
      //   //   this.props.onChange()
      //   // }
      // })
      obj.setCoords()
      this._fc.renderAll()
    }
    if (this.props.onChange) {
      this.props.onChange()
    }
  }

  /**
   * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
   */
  redo = () => {
    let history = this._history
    if (history.canRedo()) {
      let canvas = this._fc

      let [
        obj,
        currState,
        prevState,
      ] = history.redo()

      if (obj.removeObject === true) {
        this._fc.remove(obj)
        return
      }

      if (obj.__version === 0) {
        this.setState({ action: false }, () => {
          canvas.add(obj)
          if (obj.zindex != null) {
            if (obj.zindex === -100) {
              canvas.sendToBack(obj)
            } else {
              canvas.moveTo(obj, obj.zindex)
            }
          }
          obj.__version = 1
        })
      } else {
        obj.__version += 1
        obj.setOptions(JSON.parse(prevState))
        // const initializeData = { objects: [] }
        // initializeData.objects.push(JSON.parse(prevState))
        // this._fc.loadFromJSON(initializeData, () => {
        //   this._fc.renderAll()
        //   // if (this.props.onChange) {
        //   //   this.props.onChange()
        //   // }
        // })
      }
      obj.setCoords()
      canvas.renderAll()
      if (this.props.onChange) {
        this.props.onChange()
      }
    }
  }

  /**
   * Delegation method to check if we can perform an undo Operation, useful to disable/enable possible buttons
   *
   * @returns {*} true if we can undo otherwise false
   */
  canUndo = () => {
    return this._history.canUndo()
  }

  /**
   * Delegation method to check if we can perform a redo Operation, useful to disable/enable possible buttons
   *
   * @returns {*} true if we can redo otherwise false
   */
  canRedo = () => {
    return this._history.canRedo()
  }

  /**
   * Exports canvas element to a dataurl image. Note that when multiplier is used, cropping is scaled appropriately
   *
   * Available Options are
   * <table style="width:100%">
   *
   * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Argument</b></td><td><b>Default</b></td><td><b>Description</b></td></tr>
   * <tr><td>format</td> <td>String</td> <td><optional></td><td>png</td><td>The format of the output image. Either "jpeg" or "png"</td></tr>
   * <tr><td>quality</td><td>Number</td><td><optional></td><td>1</td><td>Quality level (0..1). Only used for jpeg.</td></tr>
   * <tr><td>multiplier</td><td>Number</td><td><optional></td><td>1</td><td>Multiplier to scale by</td></tr>
   * <tr><td>left</td><td>Number</td><td><optional></td><td></td><td>Cropping left offset. Introduced in v1.2.14</td></tr>
   * <tr><td>top</td><td>Number</td><td><optional></td><td></td><td>Cropping top offset. Introduced in v1.2.14</td></tr>
   * <tr><td>width</td><td>Number</td><td><optional></td><td></td><td>Cropping width. Introduced in v1.2.14</td></tr>
   * <tr><td>height</td><td>Number</td><td><optional></td><td></td><td>Cropping height. Introduced in v1.2.14</td></tr>
   *
   * </table>
   *
   * @returns {String} URL containing a representation of the object in the format specified by options.format
   */
  toDataURL = (options) => this._fc.toDataURL(options)

  /**
   * Returns JSON representation of canvas
   *
   * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
   * @returns {string} JSON string
   */
  toJSON = (propertiesToInclude) => this._fc.toJSON(propertiesToInclude)

  /**
   * Populates canvas with data from the specified JSON.
   *
   * JSON format must conform to the one of fabric.Canvas#toDatalessJSON
   *
   * @param json JSON string or object
   */
  fromJSON = (json) => {
    let history = this._history

    if (!json) return
    let canvas = this._fc
    // setTimeout(() => {
    //   canvas.loadFromJSON(json, () => {
    //     canvas.renderAll()
    //     // if (this.props.onChange) {
    //     //   this.props.onChange()
    //     // }
    //   })
    // }, 10000)

    canvas.loadFromJSON(json, () => {
      this._selectedTool.configureCanvas(this.props)
      canvas.renderAll()
      // if (this.props.onChange) {
      //   this.props.onChange()
      // }
    })

    setTimeout(() => {
      let originalList = history.getOriginalList()
      for (let i = 0; i < this.initialData.length; i++) {
        let [
          mainObject,
        ] = originalList[i]
        if (this.initialData[i].layerNumber != 0) {
          if (this.initialData[i].layerNumber == -100) {
            mainObject.set({
              zindex: this.initialData[i].layerNumber,
              id: 'template',
            })
            canvas.sendToBack(mainObject)
          } else {
            mainObject.set({
              zindex: this.initialData[i].layerNumber,
            })
            this.setState({
              indexCount: this.initialData[i].layerNumber + 1,
            })
            mainObject.set({
              zindex: this.initialData[i].layerNumber,
            })
            canvas.moveTo(mainObject, this.initialData[i].layerNumber)
          }
        }
      }

      for (let i = 0; i < this.initialData.length; i++) {
        let [
          mainObject,
        ] = originalList[i]
        if (this.initialData[i].layerType !== 'image') {
          canvas.bringToFront(mainObject)
        }
      }
      history.reset()
    }, 400)
  }

  /**
   * Clear the content of the canvas, this will also clear history but will return the canvas content as JSON to be
   * used as needed in order to undo the clear if possible
   *
   * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
   * @returns {string} JSON string of the canvas just cleared
   */
  clear = (propertiesToInclude) => {
    const canvas = this._fc
    this.setState({
      indexCount: 1,
    })
    let discarded = this.toJSON(propertiesToInclude)
    this._fc.clear()
    this._history.clear()
    return discarded
  }

  /**
   * Remove selected object from the canvas
   */
  removeSelected = () => {
    let canvas = this._fc
    let activeObj = canvas.getActiveObject()
    if (activeObj) {
      let selected = []
      if (activeObj.type === 'activeSelection') {
        activeObj.forEachObject((obj) => selected.push(obj))
      } else {
        selected.push(activeObj)
      }
      selected.forEach((obj) => {
        obj.__removed = true
        let objState = obj.toJSON()
        obj.__originalState = objState
        let state = JSON.stringify(objState)
        this._history.keep([
          obj,
          state,
          state,
        ])
        canvas.remove(obj)
      })
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }
  }

  copy = () => {
    let canvas = this._fc
    canvas.getActiveObject().clone((cloned) => {
      this._clipboard = cloned
    })
  }

  paste = () => {
    // clone again, so you can do multiple copies.
    this._clipboard.clone((clonedObj) => {
      let canvas = this._fc
      canvas.discardActiveObject()
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      })
      if (clonedObj.type === 'activeSelection') {
        // active selection needs a reference to the canvas.
        clonedObj.canvas = canvas
        clonedObj.forEachObject((obj) => canvas.add(obj))
        clonedObj.setCoords()
      } else {
        canvas.add(clonedObj)
      }
      this._clipboard.top += 10
      this._clipboard.left += 10
      canvas.setActiveObject(clonedObj)
      canvas.requestRenderAll()
    })
  }

  /**
   * Sets the background from the dataUrl given
   *
   * @param dataUrl the dataUrl to be used as a background
   * @param options
   */
  setBackgroundFromDataUrl = (dataUrl) => {
    let canvas = this._fc
    let { indexCount, templateSet } = this.state
    let history = this._history
    let oldIndexCount = indexCount
    let newIndexCount = indexCount + 1

    history.updateCount(oldIndexCount)

    this.setState({
      indexCount: newIndexCount,
    })

    // const context = canvas.getContext('2d')
    const image = new Image()
    image.src = dataUrl
    image.onload = () => {
      let imgbase64 = new fabric.Image(image, {})
      imgbase64.set({
        zindex: oldIndexCount,
      })
      // canvas.bringForward(imgbase64)
      canvas.add(imgbase64)
      imgbase64.selectable = false
      imgbase64.evented = false

      if (!templateSet) {
        this.setState({
          templateSet: true,
        })
        canvas.sendToBack(imgbase64)
      } else {
        canvas.moveTo(imgbase64, oldIndexCount)
      }

      // context.drawImage(imgbase64, 0, 0);
    }

    // fabric.Image.fromURL(
    //   dataUrl,
    //   function (img) {
    //     img.set({
    //       width: canvas.width,
    //       height: canvas.height,
    //       originX: 'left',
    //       originY: 'top',
    //     })
    //     canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
    //   },
    // )

    // let img = new Image()
    // img.setAttribute('crossOrigin', 'anonymous')
    // img.onload = () =>
    //   canvas.setBackgroundImage(new fabric.Image(img), () => canvas.renderAll())
    // img.src = dataUrl
  }

  setBackgroundFromData = (imageData, resizeCanvas, propertys = {}, loaded) => {
    let canvas = this._fc
    let { indexCount } = this.state
    let history = this._history
    let oldIndexCount = indexCount
    let newIndexCount = indexCount + 1

    history.updateCount(oldIndexCount)

    this.setState({
      indexCount: newIndexCount,
    })

    const image = new Image()
    image.src = imageData
    image.onload = () => {
      let imgbase64 = new fabric.Image(image, {})

      if (resizeCanvas) {
        canvas.setWidth(imgbase64.width)
        canvas.setHeight(imgbase64.height)
      } else {
        imgbase64.width = canvas.width
        imgbase64.height = canvas.height
      }
      imgbase64.set({
        zindex: oldIndexCount,
      })
      canvas.add(imgbase64)
      imgbase64.selectable = false
      imgbase64.evented = false

      for (let k in propertys) {
        imgbase64[k] = propertys[k]
      }

      canvas.sendToBack(imgbase64)
      if (loaded) loaded(imgbase64)
    }
  }

  setTemplate = (dataUrl, id) => {
    let { templateSet } = this.state
    let history = this._history
    let allList = history.getOriginalList()
    let prevTemplate = ''

    if (!templateSet) {
      this.setState({
        templateSet: true,
      })
    }

    for (let i = 0; i < allList.length; i++) {
      let [
        obj,
      ] = allList[i]
      if (obj.id === 'template') {
        obj.set({
          id: 'oldTemplate',
        })
        prevTemplate = obj
      }
    }
    if (prevTemplate !== '') {
      let canvas = this._fc
      let activeObj = prevTemplate
      if (activeObj) {
        let selected = []
        if (activeObj.type === 'activeSelection') {
          activeObj.forEachObject((obj) => selected.push(obj))
        } else {
          selected.push(activeObj)
        }
        selected.forEach((obj) => {
          obj.__removed = true
          let objState = obj.toJSON()
          obj.__originalState = objState
          let state = JSON.stringify(objState)
          this._history.keep([
            obj,
            state,
            state,
          ])
          canvas.remove(obj)
        })
        canvas.discardActiveObject()
        canvas.requestRenderAll()
      }
    }
    history.updateCount(-100, id)
    let canvas = this._fc
    const image = new Image()

    image.onload = () => {
      let imgbase64 = new fabric.Image(image, {})

      imgbase64.set({
        zindex: -100,
        id: 'template',
      })

      canvas.add(imgbase64)
      imgbase64.selectable = false
      imgbase64.evented = false
      canvas.sendToBack(imgbase64)

      // canvas.moveTo(imgbase64, -500)
    }
    image.src = dataUrl
    //   var img = new Image();
    //   img.src = dataUrl
    //   img.onload = function() {
    //     var f_img = new fabric.Image(img);

    //     canvas.setBackgroundImage(f_img);

    //     canvas.renderAll();
    // };
  }

  downloadImage = () => {
    let canvas = this._fc
    // let url = canvas.toDataURL('image/png')

    const result = canvas.toDataURL()
    let link = document.createElement('a')
    link.download = 'drawing.png'
    link.href = result

    // canvas.toDataURL().set({
    //   id: 'template',
    // })

    link.click()
  }

  exportToImageDataUrl = () => {
    const canvas = this._fc
    const sizeLimit = 500
    const shouldResize = canvas.width > sizeLimit || canvas.height > sizeLimit

    const result = canvas.toDataURL()
    return result
  }

  setAngle = (number, calback) => {
    let canvas = this._fc
    //let obj = canvas.getActiveObject()
    const objects = canvas.getObjects()

    if (objects) {
      let absNum = Math.abs(number)
      if (absNum > 360) {
        absNum = absNum - parseInt(absNum / 360, 10) * 360
      }

      var num = absNum * (number >= 0 ? 1 : -1)
      objects.forEach((obj) => {
        let targetNum = (obj.angle || 0) + num
        targetNum = Math.abs(targetNum) === 360 ? 0 : targetNum

        obj.rotate(targetNum)
        canvas.sendToBack(obj)
        if (calback) calback(obj, targetNum)

        const { angle, width, height, left, top, flipX, flipY } = obj
        // console.log({
        //   angle,
        //   width,
        //   height,
        //   left,
        //   top,
        //   flipX,
        //   flipY,
        // })
      })
    }
  }
  mirror = () => {
    this.flipY()
    this.setAngle(-180)
  }
  flipX = () => {
    let canvas = this._fc
    const objects = canvas.getObjects()
    if (objects) {
      objects.forEach((obj) => {
        obj.set('flipX', !obj.flipX)
      })
      canvas.renderAll()
    }
  }

  flipY = () => {
    let canvas = this._fc
    const objects = canvas.getObjects()
    if (objects) {
      objects.forEach((obj) => {
        obj.set('flipY', !obj.flipY)
      })
      canvas.renderAll()
    }
  }

  addText = (text, color, options = {}) => {
    let canvas = this._fc
    let iText = new fabric.IText(text, options)

    let opts = {
      left: (canvas.getWidth() - iText.width) * 0.5,
      top: (canvas.getHeight() - iText.height) * 0.5,
    }
    Object.assign(options, opts)
    iText.set({
      left: options.left,
      top: options.top,
      fill: color,
    })
    iText.editable = true
    canvas.add(iText).setActiveObject(iText)
    iText.enterEditing()
    iText.selectAll()
  }

  componentDidMount = () => {
    let { tool, value, undoSteps, defaultValue, backgroundColor } = this.props
    this._fc = new fabric.Canvas(this._canvas, {
      preserveObjectStacking: true,
      // renderOnAddRemove: false,
      // skipTargetFind: true
    })
    let canvas = this._fc

    this._initTools(canvas)

    // set initial backgroundColor
    this._backgroundColor(backgroundColor)

    let selectedTool = this._tools[tool]
    selectedTool.configureCanvas(this.props)
    this._selectedTool = selectedTool

    // Control resize
    window.addEventListener('resize', this._resize, false)

    // Initialize History, with maximum number of undo steps
    this._history = new History(undoSteps)

    // Events binding
    canvas.on('object:added', this._onObjectAdded)
    canvas.on('object:modified', this._onObjectModified)
    canvas.on('object:removed', this._onObjectRemoved)
    canvas.on('mouse:down', this._onMouseDown)
    canvas.on('mouse:move', this._onMouseMove)
    canvas.on('mouse:up', this._onMouseUp)
    canvas.on('mouse:out', this._onMouseOut)
    canvas.on('mouse:dblclick', this._onDoubleClick)
    canvas.on('object:moving', this._onObjectMoving)
    canvas.on('object:scaling', this._onObjectScaling)
    canvas.on('object:rotating', this._onObjectRotating)
    // IText Events fired on Adding Text
    // canvas.on("text:event:changed", console.log)
    // canvas.on("text:selection:changed", console.log)
    // canvas.on("text:editing:entered", console.log)
    // canvas.on("text:editing:exited", console.log)

    this.disableTouchScroll()

    this._resize()

    // initialize canvas with controlled value if exists
    ;(value || defaultValue) && this.fromJSON(value || defaultValue)
  }

  componentWillUnmount = () =>
    window.removeEventListener('resize', this._resize)

  componentDidUpdate = (prevProps, prevState) => {
    if (
      this.state.parentWidth !== prevState.parentWidth ||
      this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height
    ) {
      this._resize()
    }

    if (this.props.tool !== prevProps.tool) {
      this._selectedTool =
        this._tools[this.props.tool] || this._tools[Tool.Pencil]
    }

    // Bring the cursor back to default if it is changed by a tool
    this._fc.defaultCursor = 'default'
    this._selectedTool.configureCanvas(this.props)

    if (this.props.backgroundColor !== prevProps.backgroundColor) {
      this._backgroundColor(this.props.backgroundColor)
    }

    if (
      this.props.value !== prevProps.value ||
      (this.props.value && this.props.forceValue)
    ) {
      this.fromJSON(this.props.value)
    }
  }

  render = () => {
    let { className, style, width, height, canvasStyle = {} } = this.props

    let canvasDivStyle = Object.assign(
      {},
      style || {},
      width ? { width } : {},
      height ? { height } : { height: 512 },
    )

    return (
      <div
        className={className}
        ref={(c) => {
          this._container = c
        }}
        style={canvasDivStyle}
      >
        <canvas
          id={uuid4()}
          ref={(c) => {
            this._canvas = c
          }}
          style={canvasStyle}
        >
          Sorry, Canvas HTML5 element is not supported by your browser :(
        </canvas>
      </div>
    )
  }
}

export default SketchField
