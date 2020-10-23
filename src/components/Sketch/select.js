import { Tools } from '@/components'
import FabricCanvasTool from './fabrictool'

class Select extends FabricCanvasTool {
  configureCanvas () {
    const canvas = this._canvas
    canvas.isDrawingMode = false
    canvas.selection = false
    canvas.forEachObject((o) => {
      o.selectable = true
      o.evented = true
    })
    canvas.defaultCursor = 'pointer'
  }

  getToolName () {
    return Tools.Select
  }

  doMouseDown () {
    this.isDown = true
    const canvas = this._canvas
    this.isDown = true
    let obj = canvas.getActiveObject()
    if (obj) {
      obj.set({
        id: 'move',
      })
    }
  }

  doMouseUp () {
    const canvas = this._canvas
    this.isDown = false
    let obj = canvas.getActiveObject()
    if (obj) {
      obj.set({
        id: 'move',
      })
    }
  }
}

export default Select
