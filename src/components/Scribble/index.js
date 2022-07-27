import React from 'react'
import {
  Paper,
  withStyles,
  Typography,
  Slider,
  List,
  Divider,
} from '@material-ui/core'
import { CloudUploadOutlined, CopyOutlined } from '@ant-design/icons'
import { CompactPicker } from 'react-color'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import MoreVert from '@material-ui/icons/MoreVert'
import ColorLens from '@material-ui/icons/ColorLens'
import Pen from '@material-ui/icons/Create'
import InsertPhoto from '@material-ui/icons/InsertPhoto'
import Title from '@material-ui/icons/TextFields'
import Dropzone from 'react-dropzone'
import UndoIcon from '@material-ui/icons/Undo'
import RedoIcon from '@material-ui/icons/Redo'
import DeleteIcon from '@material-ui/icons/Delete'
import Save from '@material-ui/icons/SaveAlt'
import SaveIcon from '@material-ui/icons/Save'
import Erase from '@material-ui/icons/HowToVote'
import Remove from '@material-ui/icons/Remove'
import Backspace from '@material-ui/icons/CompareArrowsTwoTone'
import Rectangle from '@material-ui/icons/CropSquare'
import Circle from '@material-ui/icons/PanoramaFishEye'
import Move from '@material-ui/icons/OpenWith'
import SelectIcon from '@material-ui/icons/PanTool'
import Visibility from '@material-ui/icons/Visibility'
import InVisibility from '@material-ui/icons/VisibilityOff'
import EditIcon from '@material-ui/icons/Edit'
import AddIcon from '@material-ui/icons/Add'
import MaterialTextField from '@material-ui/core/TextField'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import ReplayIcon from '@material-ui/icons/Replay'
import keydown, { Keys } from 'react-keydown'
import { Radio } from 'antd'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import {
  getThumbnail,
  generateThumbnailAsync,
} from '@/components/_medisys/AttachmentWithThumbnail/utils'
import {
  GridContainer,
  GridItem,
  Popover,
  Switch,
  SketchField,
  Tools,
  Tooltip,
  TextField,
  ProgressButton,
  Button,
  withFormikExtend,
  FastField,
  Select,
  notification,
  Popconfirm,
} from '@/components'
import _ from 'lodash'
import {
  errMsgForOutOfRange as errMsg,
  navigateDirtyCheck,
  getUniqueGUID,
} from '@/utils/utils'
import { Add } from '@material-ui/icons'
import moment from 'moment'
import './index.css'

const styles = () => ({
  container: {
    border: '1px solid #0d3349',
    backgroundColor: '#ffffff',
  },
  dropArea: {
    width: '100%',
    // height: '30px',
    border: '2px dashed rgb(102, 102, 102)',
    borderStyle: 'dashed',
    borderRadius: '5px',
    textAlign: 'center',
    // paddingTop: '30px',
    paddingLeft: '10px',
    paddingRight: '10px',
  },
  actionDiv: {
    float: 'right',
    textAlign: 'center',
    marginTop: '5px',
  },
  layout: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  gridItem: {
    position: 'relative',
  },
  scribbleSubject: {
    width: 250,
    display: 'flex',
    float: 'left',
    paddingRight: 10,
  },
  radioButtonPadding: {
    paddingTop: 5,
  },
  templateImage: {
    maxHeight: 'calc(100vh - 260px)',
    overflow: 'auto',
    alignItems: 'center',
    padding: '5px 0px',
    marginBottom: 10,
  },
  imageOption: {
    alignItems: 'center',
    textAlign: 'center',
    display: 'block',
  },
  rightButton: {
    display: 'flex',
    float: 'right',
    padding: 2,
    position: 'relative',
    top: 8,
  },
  sketchArea: {
    paddingTop: 10,
    paddingRight: 0,
  },
  templateItemActions: {
    width: 250,
    position: 'relative',
    '& > #templateItemActions': {
      display: 'none',
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    '&:hover > #templateItemActions': {
      display: 'inline-block',
    },
    '& > div > div > input:not([disabled])': {
      width: 'calc(100% - 44px)',
    },
    '&:hover > span#readOnlyDescription': {
      paddingRight: 66,
    },
    '& > span#readOnlyDescription': {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      display: 'block',
      textAlign: 'left',
      borderBottom: '1px solid gray',
      padding: '1.5px 0',
    },
  },
  templateItemEditActions: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
})

class ScribbleTemplateItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isEdit: false,
      item: props.item,
      description: props.item.description,
    }
  }
  buttonProps = {
    justIcon: true,
    color: 'transparent',
    style: { marginRight: -4 },
  }
  render() {
    const { isEdit, item, description } = this.state
    const {
      setTemplate,
      upsertTemplate,
      classes,
      item: { concurrencyToken },
      onEditingTemplate,
      isTemplateEditing,
      onInsertImage,
    } = this.props
    return (
      <div style={{ paddingBottom: 5 }} class='noselectable'>
        <Tooltip title='Double click to apply template'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #CCCCCC',
              width: 253,
              height: 140,
              cursor: 'pointer',
              backgroundColor: 'white',
            }}
            onDoubleClick={() => {
              setTemplate(item.id)
            }}
          >
            {item.layerContentThumbnail ? (
              <img
                src={item.layerContentThumbnail}
                style={{
                  maxHeight: 138,
                  maxWidth: 250,
                  disabled: true,
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <span>No Image</span>
            )}
          </div>
        </Tooltip>
        <div className={classes.templateItemActions}>
          {isEdit ? (
            <TextField
              ref={this.inputRef}
              disabled={!isEdit}
              label=''
              maxLength={50}
              style={{ margin: 0 }}
              inputProps={{
                id: 'templateItemName',
                maxLength: 50,
                style: { fontSize: 14, padding: 0 },
              }}
              value={description}
              onChange={e => {
                this.setState({ description: e.target.value })
              }}
            />
          ) : (
            <Tooltip title={item.description}>
              <span id='readOnlyDescription'>{item.description}</span>
            </Tooltip>
          )}
          {isEdit ? (
            <span className={classes.templateItemEditActions}>
              <Tooltip title='Restore'>
                <Button
                  {...this.buttonProps}
                  onClick={() => {
                    this.setState({
                      isEdit: false,
                      description: item.description,
                    })
                    onEditingTemplate(false)
                  }}
                >
                  <ReplayIcon />
                </Button>
              </Tooltip>
              <Tooltip title='Save'>
                <Button
                  {...this.buttonProps}
                  onClick={() => {
                    if (!description || !description.trim()) {
                      notification.warning({
                        message: 'Template name is mandatory.',
                      })
                      return
                    }
                    const savedItem = {
                      ...item,
                      description,
                      concurrencyToken,
                    }
                    this.setState({
                      isEdit: false,
                      item: savedItem,
                      description,
                    })
                    upsertTemplate.call(this, savedItem)
                    onEditingTemplate(false)
                  }}
                >
                  <SaveIcon />
                </Button>
              </Tooltip>
            </span>
          ) : (
            <span id='templateItemActions'>
              <Tooltip title='Edit'>
                <Button
                  {...this.buttonProps}
                  disabled={isTemplateEditing}
                  onClick={() => {
                    onEditingTemplate(true)
                    this.setState({ isEdit: true })
                  }}
                >
                  <EditIcon />
                </Button>
              </Tooltip>
              <Tooltip title='Apply'>
                <Button
                  disabled={isTemplateEditing}
                  {...this.buttonProps}
                  onClick={() => {
                    setTemplate(item.id)
                  }}
                >
                  <CopyOutlined />
                </Button>
              </Tooltip>
              <Popconfirm
                title='Are you sure?'
                onConfirm={() => {
                  const deledItem = {
                    ...item,
                    isDeleted: true,
                    concurrencyToken,
                  }
                  this.setState({ item: deledItem })
                  upsertTemplate(deledItem)
                }}
              >
                <Tooltip title='Delete'>
                  <Button disabled={isTemplateEditing} {...this.buttonProps}>
                    <DeleteIcon />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </span>
          )}
        </div>
      </div>
    )
  }
}

let temp = null
@withFormikExtend({
  notDirtyDuration: 0.5,
  mapPropsToValues: ({ scriblenotes }) => {
    return scriblenotes.entity === '' ? '' : scriblenotes.entity
  },
  validationSchema: Yup.object().shape({
    subject: Yup.string()
      .required()
      .max(50, 'Subject should not exceed 50 characters'),
  }),

  handleSubmit: (values, { props }) => {
    const payload = {
      subject: values.subject,
      thumbnail: values.thumbnail,
      origin: values.origin,
      temp,
    }
    props.addScribble(payload)
    props.toggleScribbleModal()
  },
  displayName: 'ScribbleNotePage',
})
@connect(({ scriblenotes, global }) => ({
  scriblenotes,
  mainDivHeight: global.mainDivHeight,
}))
class Scribble extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tool: props.scriblenotes.isReadonly ? Tools.None : Tools.Pencil,
      lineWidth: 10,
      lineColor: 'black',
      backgroundColor: 'transparent',
      toolsDrawVisible: false,
      toolsShapeVisible: false,
      colorVisible: false,
      imageVisible: false,
      textVisible: false,
      text: '',
      fillColor: '#FFFFFF',
      fillWithColor: false,
      fillWithBackgroundColor: false,
      canUndo: false,
      canRedo: false,
      canClear: false,
      hideEnable: false,
      disableAddImage: false,
      indexCount: 1,
      deleteEnable: false,
      toolsDrawingColor: false,
      toolsShapeColor: false,
      selectColorColor: false,
      imageColor: false,
      textColor: false,
      selectColor: false,
      eraserColor: false,
      templateList: [],
      filterItem: '',
    }
    this.inputEl = React.createRef()
  }

  componentDidMount() {
    const { scriblenotes, dispatch } = this.props

    if (scriblenotes.editEnable) {
      this.setState({
        deleteEnable: true,
      })
    } else {
      this.setState({
        deleteEnable: false,
      })
    }

    this.queryTemplateList()

    if (this.props.scribbleData !== '') {
      if (this.props.scribbleData.scribbleNoteLayers.length > 0) {
        this._sketch.initializeData(this.props.scribbleData.scribbleNoteLayers)
        this.setState({
          canClear: true,
          // canUndo: true,
        })
      }
    }
  }

  handleToolsDrawVisibleChange = toolsDrawVisible => {
    this.setState({ toolsDrawVisible })
    if (!toolsDrawVisible) {
      this.setState({ toolsDrawingColor: false })
    }
  }

  handleToolsShapeVisibleChange = toolsShapeVisible => {
    this.setState({ toolsShapeVisible })
    if (!toolsShapeVisible) {
      this.setState({ toolsShapeColor: false })
    }
  }

  handleColorVisibleChange = colorVisible => {
    this.setState({ colorVisible })
    if (!colorVisible) {
      this.setState({ selectColorColor: false })
    }
  }

  handleInsertImageVisibleChange = imageVisible => {
    this.setState({ imageVisible })
    if (!imageVisible) {
      this.setState({ imageColor: false })
    }
  }

  handleTextVisibleChange = textVisible => {
    this.setState({ textVisible })
    if (!textVisible) {
      this.setState({ textColor: false })
    }
  }

  _removeSelected = () => {
    this._sketch.removeSelected()
  }

  _undo = () => {
    this._sketch.undo()
    this.setState({
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo(),
    })
  }

  _redo = () => {
    this._sketch.redo()
    this.setState({
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo(),
      canClear: this._sketch._checkActiveObject(),
    })
  }

  _hideDrawing = () => {
    const { hideEnable } = this.state

    const newHideEnable = !hideEnable

    if (newHideEnable) {
      this.setState({
        canUndo: false,
        canRedo: false,
        canClear: false,
        hideEnable: !hideEnable,
      })
    } else {
      this.setState({
        canUndo: this._sketch.canUndo(),
        canRedo: this._sketch.canRedo(),
        canClear: this._sketch._checkActiveObject(),
        hideEnable: !hideEnable,
      })
    }
    this._sketch.hideDrawing(newHideEnable)
  }

  _clear = () => {
    this._sketch.clear()
    this.setState({
      backgroundColor: 'transparent',
      fillWithBackgroundColor: false,
      canUndo: this._sketch.canUndo(),
      canRedo: this._sketch.canRedo(),
      canClear: false,
    })
  }

  // _test = () => {
  //   this._sketch.test()
  // }

  // testPassValue = () => {
  //   let value = this._sketch.getValue()
  //   return value
  // }

  _download = () => {
    this._sketch.downloadImage()
  }

  _generateThumbnail = async () => {
    try {
      const result = this._sketch.exportToImageDataUrl()
      const imgEle = document.createElement('img')
      imgEle.src = result
      await setTimeout(() => {
        // wait for 1 milli second for img to set src successfully
      }, 100)

      const size = { width: 275, height: 150 }
      let newWidth = size.width
      let newHeight = size.height

      if (imgEle.height * (size.width / imgEle.width) > size.height) {
        newWidth = (imgEle.width * size.height) / imgEle.height
      } else {
        newHeight = imgEle.height * (size.width / imgEle.width)
      }
      const thumbnail = getThumbnail(imgEle, {
        width: newWidth,
        height: newHeight,
      })
      const thumbnailData = thumbnail.toDataURL(`image/jpeg`)

      return { origin: result, thumbnail: thumbnailData }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  _onSketchChange = action => {
    const { scriblenotes } = this.props
    if (scriblenotes.isReadonly) return
    const prev = this.state.canUndo
    const now = this._sketch.canUndo()
    if (prev !== now || action === 'deleteAction') {
      this.setState({
        canUndo: now,
        hideEnable: false,
      })
      this._sketch.hideDrawing(false)
    }

    setTimeout(() => {
      if (now && this._sketch._checkActiveObject()) {
        this.setState({
          canClear: true,
        })
      } else {
        this.setState({
          canClear: this._sketch._checkActiveObject(),
        })
      }
    }, 100)

    this.props.setFieldValue('drawing', 'dirty')
  }

  _selectTool = event => {
    this.setState({
      tool: event.target.value,
      // enableRemoveSelected: event.target.value === Tools.Select,
      // enableCopyPaste: event.target.value === Tools.Select,
    })
  }

  _addText = () => {
    this.setState({
      tool: 'select',
    })
    this._sketch.addText(this.state.text, this.state.lineColor)
  }

  _performSetTextAndReset = () => {
    this.setState({
      tool: 'select',
      eraserColor: false,
      selectColor: true,
      toolsDrawingColor: false,
      toolsShapeColor: false,
      selectColorColor: false,
      imageColor: false,
      textColor: false,
    })
    this._addText()
  }

  _onBackgroundImageDrop = accepted => {
    const { indexCount } = this.state
    if (accepted && accepted.length > 0) {
      const sketch = this._sketch
      const reader = new FileReader()
      reader.addEventListener(
        'load',
        () => sketch.setBackgroundFromDataUrl(reader.result),
        false,
      )
      reader.readAsDataURL(accepted[0])
    }
  }

  uploadTemplate = file => {
    let reader = new FileReader()
    reader.onloadend = () => {
      this.generateScribbleTemplateDto(
        file.name.substring(0, 50),
        reader.result,
      )
    }
    reader.readAsDataURL(file)
  }

  generateScribbleTemplateDto = (name, base64) => {
    generateThumbnailAsync(base64, { width: 275, height: 150 }).then(
      thumbnail => {
        const dto = {
          code: getUniqueGUID(),
          displayValue: name,
          description: name,
          layerContent: base64,
          layerContentThumbnail: thumbnail,
          isUserMaintainable: true,
          isDeleted: false,
          sortOrder:
            this.state.templateList.reduce(
              (maxSortOrder, t) => Math.max(maxSortOrder, t.sortOrder || 0),
              0,
            ) + 1,
          effectiveStartDate: moment().formatUTC(false),
          effectiveEndDate: moment('2099-12-31').formatUTC(false),
          scribbleNoteType: this.props.scribbleNoteType,
        }
        this.upsertTemplate(dto)
      },
    )
  }

  queryTemplateList = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'scriblenotes/queryTemplateList',
      payload: {
        pagesize: 999,
        scribbleNoteType: this.props.scribbleNoteType,
      },
    }).then(templateList => {
      if (templateList && templateList.data)
        this.setState({
          templateList: templateList.data.data,
        })
    })
  }

  upsertTemplate = item => {
    const { dispatch } = this.props
    dispatch({
      type: 'scriblenotes/upsertTemplate',
      payload: item,
    }).then(r => {
      if (r) this.queryTemplateList()
    })
  }

  handleEditingTemplate = mode => {
    this.setState({ isTemplateEditing: mode })
  }

  onUploadTemplateClick = () => {
    this.inputEl.current.click()
  }

  clearValue = e => {
    e.target.value = null
  }

  onFileChange = async event => {
    const { files } = event.target
    if (files.length > 0) await this.uploadTemplate(files[0])
  }

  _setTemplate = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'scriblenotes/queryTemplate',
      payload: { id },
    }).then(r => {
      if (r && r.status === '200') {
        this._sketch.setTemplate(r.data.layerContent, id)
        this.props.setFieldValue('subject', r.data.description.substr(0, 50))
      }
    })
  }

  toolDrawingHandleClickAway = () => {
    this.setState({
      toolsDrawingColor: false,
    })
  }

  toolShapeHandleClickAway = () => {
    this.setState({
      toolsShapeColor: false,
    })
  }

  colorHandleClickAway = () => {
    this.setState({
      selectColorColor: false,
    })
  }

  imageHandleClickAway = () => {
    this.setState({
      imageColor: false,
    })
  }

  textHandleClickAway = () => {
    this.setState({
      textColor: false,
    })
  }

  @keydown('ctrl+z')
  shortcutKeyUndo() {
    if (this.props.scriblenotes.isReadonly) return
    if (this.state.canUndo) {
      this._undo()
    }
  }

  @keydown('ctrl+y')
  shortcutKeyRedo() {
    if (this.props.scriblenotes.isReadonly) return
    if (this.state.canRedo) {
      this._redo()
    }
  }

  @keydown('delete')
  shortcutKeyDelete() {
    if (this.props.scriblenotes.isReadonly) return
    const result = this._sketch._deleteSelectedObject()
    if (!result) {
      this.setState({
        tool: 'eraser',
        eraserColor: true,
        selectColor: false,
        toolsDrawingColor: false,
        toolsShapeColor: false,
        selectColorColor: false,
        imageColor: false,
        textColor: false,
      })
    }
    this._onSketchChange('deleteAction')
  }

  onSaveClick = async () => {
    temp = this._sketch.getAllLayerData()
    const { origin, thumbnail } = await this._generateThumbnail()
    await this.props.setFieldValue('thumbnail', thumbnail.split(',')[1])
    await this.props.setFieldValue('origin', origin.split(',')[1])
    this.props.handleSubmit()
  }

  onInsertClick = event => {
    const imageDataUrl = this._sketch.exportToImageDataUrl()
    const { dispatch, exportToClinicalNote } = this.props
    if (exportToClinicalNote) {
      exportToClinicalNote(imageDataUrl)
    }
    navigateDirtyCheck({
      displayName: 'ScribbleNotePage',
      onProceed: this.props.toggleScribbleModal,
    })(event)
  }

  render() {
    const {
      classes,
      toggleScribbleModal,
      handleSubmit,
      deleteScribbleNote,
      setFieldValue,
      dispatch,
      scriblenotes,
      mainDivHeight = 700,
    } = this.props
    const { templateList, filterItem } = this.state
    const filteredTemplateList =
      filterItem && filterItem.trim() !== ''
        ? templateList.filter(x =>
            x.description.toLowerCase().includes(filterItem.toLowerCase()),
          )
        : templateList
    const sortedTemplateList = _.orderBy(
      filteredTemplateList,
      ['sortOrder'],
      ['asc'],
    )
    const { isReadonly = false } = scriblenotes
    return (
      <div className={classes.layout}>
        <GridContainer>
          <GridItem xs={12} md={12} className={classes.gridItem}>
            <div className={classes.scribbleSubject}>
              <FastField
                name='subject'
                render={args => (
                  <TextField
                    {...args}
                    label='Scribble Subject'
                    inputProps={{ maxLength: 50 }}
                    disabled={scriblenotes.isReadonly}
                    maxLength={50}
                    // onChange={(e) => {
                    //   const subject = e.target.value
                    //   if (subject.length > 20) {
                    //     setFieldValue('subject', subject.substring(0, 20))
                    //   }
                    // }}
                  />
                )}
              />
            </div>
            {!scriblenotes.isReadonly && (
              <ToggleButtonGroup
                // size='small'
                // value={alignment}
                exclusive
                onChange={e => {
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
                value={this.state.tool}
                outline='none'
                style={{ position: 'relative', top: 6 }}
              >
                <Tooltip title='Select'>
                  <ToggleButton
                    key={1}
                    value={Tools.Select}
                    onClick={() => {
                      this.setState({
                        tool: 'select',
                        eraserColor: false,
                        selectColor: true,
                        toolsDrawingColor: false,
                        toolsShapeColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    <SelectIcon
                      color={this.state.selectColor ? 'primary' : ''}
                      style={{
                        color: this.state.selectColor ? '' : '#191919',
                      }}
                    />
                  </ToggleButton>
                </Tooltip>

                <Popover
                  icon={null}
                  content={
                    <ClickAwayListener
                      onClickAway={this.toolDrawingHandleClickAway}
                    >
                      <div style={{ paddingTop: 10, width: 200 }}>
                        <GridContainer>
                          <GridItem xs={12} md={12}>
                            <Radio.Group
                              // defaultValue={Tools.Pencil}
                              value={this.state.tool}
                              buttonStyle='solid'
                              onChange={e => {
                                this.setState({
                                  tool: e.target.value,
                                  eraserColor: false,
                                  selectColor: false,
                                  toolsDrawingColor: true,
                                })
                              }}
                            >
                              <Tooltip title='Pencil'>
                                <Radio.Button
                                  value={Tools.Pencil}
                                  className={classes.radioButtonPadding}
                                >
                                  <Pen />
                                </Radio.Button>
                              </Tooltip>

                              <Radio.Button
                                value={Tools.Line}
                                className={classes.radioButtonPadding}
                              >
                                <Remove />
                              </Radio.Button>
                              <Radio.Button
                                value={Tools.Arrow}
                                className={classes.radioButtonPadding}
                              >
                                <Backspace />
                              </Radio.Button>
                            </Radio.Group>
                          </GridItem>
                        </GridContainer>

                        <GridContainer style={{ paddingTop: 10 }}>
                          <GridItem xs={12} md={12}>
                            <Typography>Line Weight</Typography>
                            <Slider
                              // ValueLabelComponent={ValueLabelComponent}
                              step={1}
                              min={1}
                              max={50}
                              aria-labelledby='slider'
                              value={this.state.lineWidth}
                              onChange={(e, v) =>
                                this.setState({ lineWidth: v })
                              }
                            />
                          </GridItem>
                        </GridContainer>
                      </div>
                    </ClickAwayListener>
                  }
                  // title='Select Tools'
                  trigger='click'
                  placement='bottomLeft'
                  visible={this.state.toolsDrawVisible}
                  onVisibleChange={this.handleToolsDrawVisibleChange}
                  onClick={() => {
                    const { toolsDrawingColor } = this.state
                    this.setState(() => ({
                      toolsDrawingColor: true,
                      toolsShapeColor: false,
                      selectColorColor: false,
                      imageColor: false,
                      textColor: false,
                      eraserColor: false,
                    }))
                  }}
                >
                  <Tooltip title='Drawing type'>
                    <ToggleButton key={2} type='primary'>
                      <Pen
                        color={this.state.toolsDrawingColor ? 'primary' : ''}
                        style={{
                          color: this.state.toolsDrawingColor ? '' : '#191919',
                        }}
                      />
                    </ToggleButton>
                  </Tooltip>
                </Popover>

                <Popover
                  icon={null}
                  content={
                    <ClickAwayListener
                      onClickAway={this.toolShapeHandleClickAway}
                    >
                      <div style={{ paddingTop: 10, width: 200 }}>
                        <GridContainer>
                          <GridItem xs={10} md={10}>
                            <Radio.Group
                              // defaultValue={Tools.Pencil}
                              value={this.state.tool}
                              buttonStyle='solid'
                              onChange={e => {
                                this.setState({
                                  tool: e.target.value,
                                  eraserColor: false,
                                  selectColor: false,
                                })
                              }}
                            >
                              <Radio.Button
                                value={Tools.Rectangle}
                                className={classes.radioButtonPadding}
                              >
                                <Rectangle />
                              </Radio.Button>
                              <Radio.Button
                                value={Tools.Circle}
                                className={classes.radioButtonPadding}
                              >
                                <Circle />
                              </Radio.Button>
                            </Radio.Group>
                          </GridItem>
                        </GridContainer>

                        <GridContainer style={{ paddingTop: 20 }}>
                          <GridItem xs={10} md={10}>
                            <Typography>Fill Enable</Typography>
                            <Switch
                              value={this.state.fillWithColor}
                              onChange={() =>
                                this.setState(preState => ({
                                  fillWithColor: !preState.fillWithColor,
                                }))
                              }
                            />
                          </GridItem>
                        </GridContainer>

                        <GridContainer>
                          <GridItem xs={12} md={12}>
                            <Typography>Line Weight</Typography>
                            <Slider
                              // ValueLabelComponent={ValueLabelComponent}
                              step={1}
                              min={1}
                              max={50}
                              aria-labelledby='slider'
                              value={this.state.lineWidth}
                              onChange={(e, v) =>
                                this.setState({ lineWidth: v })
                              }
                            />
                          </GridItem>
                        </GridContainer>
                      </div>
                    </ClickAwayListener>
                  }
                  // title='Select Tools'
                  trigger='click'
                  placement='bottomLeft'
                  visible={this.state.toolsShapeVisible}
                  onVisibleChange={this.handleToolsShapeVisibleChange}
                  onClick={() => {
                    this.setState(() => ({
                      toolsDrawingColor: false,
                      toolsShapeColor: true,
                      selectColorColor: false,
                      imageColor: false,
                      textColor: false,
                      eraserColor: false,
                    }))
                  }}
                >
                  <Tooltip title='Shape'>
                    <ToggleButton key={3} type='primary'>
                      <Rectangle
                        color={this.state.toolsShapeColor ? 'primary' : ''}
                        style={{
                          color: this.state.toolsShapeColor ? '' : '#191919',
                        }}
                      />
                    </ToggleButton>
                  </Tooltip>
                </Popover>

                <Popover
                  icon={null}
                  content={
                    <ClickAwayListener onClickAway={this.colorHandleClickAway}>
                      <div>
                        <GridContainer>
                          <GridItem xs={12} md={12}>
                            <div style={{ paddingBottom: 10 }} />
                            <Typography>Line Color</Typography>
                            <CompactPicker
                              id='lineColor'
                              color={this.state.lineColor}
                              onChange={color =>
                                this.setState({ lineColor: color.hex })
                              }
                            />
                          </GridItem>
                        </GridContainer>

                        <GridContainer>
                          <GridItem xs={12} md={12}>
                            <Typography>Fill Color</Typography>
                            <CompactPicker
                              color={this.state.fillColor}
                              onChange={color =>
                                this.setState({ fillColor: color.hex })
                              }
                            />

                            {/* <Typography>Fill Enable</Typography>
                      <Switch
                        value={this.state.fillWithColor}
                        onChange={() =>
                          this.setState((preState) => ({
                            fillWithColor: !preState.fillWithColor,
                          }))}
                      /> */}
                          </GridItem>
                        </GridContainer>
                      </div>
                    </ClickAwayListener>
                  }
                  // title='Colors'
                  trigger='click'
                  placement='bottomLeft'
                  visible={this.state.colorVisible}
                  onVisibleChange={this.handleColorVisibleChange}
                  onClick={() => {
                    this.setState(() => ({
                      toolsDrawingColor: false,
                      toolsShapeColor: false,
                      selectColorColor: true,
                      imageColor: false,
                      textColor: false,
                      eraserColor: false,
                    }))
                  }}
                >
                  <Tooltip title='Colors'>
                    <ToggleButton key={4}>
                      <ColorLens
                        color={this.state.selectColorColor ? 'primary' : ''}
                        style={{
                          color: this.state.selectColorColor ? '' : '#191919',
                        }}
                      />
                    </ToggleButton>
                  </Tooltip>
                </Popover>
                <Popover
                  icon={null}
                  content={
                    <ClickAwayListener onClickAway={this.textHandleClickAway}>
                      <div style={{ width: 300 }}>
                        <GridContainer>
                          <GridItem xs={12} md={12}>
                            <TextField
                              label='Text'
                              onChange={e =>
                                this.setState({ text: e.target.value })
                              }
                              // value={this.state.text}
                            />
                          </GridItem>
                        </GridContainer>
                        <GridContainer style={{ paddingTop: 10 }}>
                          <GridItem xs={12} md={12}>
                            <Button
                              color='primary'
                              onClick={this._addText}
                              style={{ paddingTop: 20 }}
                            >
                              Add Text
                            </Button>
                          </GridItem>
                        </GridContainer>
                      </div>
                    </ClickAwayListener>
                  }
                  // title='Text'
                  trigger='click'
                  placement='bottomLeft'
                  visible={this.state.textVisible}
                  onVisibleChange={this.handleTextVisibleChange}
                  onClick={() => {
                    this.setState(() => ({
                      toolsDrawingColor: false,
                      toolsShapeColor: false,
                      selectColorColor: false,
                      imageColor: false,
                      eraserColor: false,
                      textColor: true,
                    }))
                  }}
                >
                  <Tooltip title='Add Text'>
                    <ToggleButton key={6}>
                      <Title
                        color={this.state.textColor ? 'primary' : ''}
                        style={{
                          color: this.state.textColor ? '' : '#191919',
                        }}
                      />
                    </ToggleButton>
                  </Tooltip>
                </Popover>

                <Tooltip title='Erase'>
                  <ToggleButton
                    key={7}
                    value={Tools.Eraser}
                    onClick={() => {
                      this._sketch._deleteSelectedObject()
                      this.setState({
                        tool: 'eraser',
                        eraserColor: true,
                        selectColor: false,
                        toolsDrawingColor: false,
                        toolsShapeColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    <Erase
                      color={this.state.eraserColor ? 'primary' : ''}
                      style={{
                        color: this.state.eraserColor ? '' : '#191919',
                      }}
                    />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title='Save'>
                  <ToggleButton
                    key={6}
                    onClick={() => {
                      this._download()

                      this.setState({
                        toolsDrawingColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    <Save style={{ color: '#191919' }} />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title='Undo'>
                  <ToggleButton
                    key={7}
                    color='primary'
                    disabled={!this.state.canUndo}
                    onClick={() => {
                      this._undo()

                      this.setState({
                        toolsDrawingColor: false,
                        toolsShapeColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    <UndoIcon
                      color={this.state.canUndo ? 'primary' : 'disabled'}
                    />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title='Redo'>
                  <ToggleButton
                    key={8}
                    color='primary'
                    disabled={!this.state.canRedo}
                    onClick={() => {
                      this._redo()

                      this.setState({
                        toolsDrawingColor: false,
                        toolsShapeColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    <RedoIcon
                      color={this.state.canRedo ? 'primary' : 'disabled'}
                    />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title='Remove All'>
                  <ToggleButton
                    key={9}
                    color='primary'
                    disabled={!this.state.canClear}
                    onClick={() => {
                      this._clear()

                      this.setState({
                        toolsDrawingColor: false,
                        toolsShapeColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    <DeleteIcon
                      color={this.state.canClear ? 'primary' : 'disabled'}
                    />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title='Hide'>
                  <ToggleButton
                    key={10}
                    checked={this.state.hideEnable}
                    onClick={() => {
                      this._hideDrawing()

                      this.setState({
                        toolsDrawingColor: false,
                        toolsShapeColor: false,
                        selectColorColor: false,
                        imageColor: false,
                        textColor: false,
                      })
                    }}
                  >
                    {this.state.hideEnable ? (
                      <InVisibility color='disabled' />
                    ) : (
                      <Visibility color='primary' />
                    )}
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            )}
            <div className={classes.rightButton}>
              {!scriblenotes.isReadonly ? (
                <div className={classes.actionDiv}>
                  {this.state.deleteEnable ? (
                    <Button
                      color='danger'
                      onClick={() => {
                        dispatch({
                          type: 'global/updateAppState',
                          payload: {
                            openConfirm: true,
                            openConfirmContent: 'Delete this scribble note?',
                            onConfirmSave: () => deleteScribbleNote(),
                          },
                        })
                      }}
                    >
                      Delete
                    </Button>
                  ) : (
                    ''
                  )}

                  {/* <Button color='danger' onClick={this.onInsertClick}>
                  Insert Into
                </Button> */}
                  <Button
                    color='danger'
                    onClick={navigateDirtyCheck({
                      displayName: 'ScribbleNotePage',
                      onProceed: toggleScribbleModal,
                      showSecondConfirmButton: false,
                      openConfirmContent: 'Discard the changes?',
                    })}
                  >
                    Cancel
                  </Button>
                  <ProgressButton onClick={this.onSaveClick} />
                </div>
              ) : (
                <Button
                  color='danger'
                  onClick={() => {
                    toggleScribbleModal()
                  }}
                >
                  Close
                </Button>
              )}
            </div>
          </GridItem>
          <GridItem
            xs={12}
            md={12}
            container
            style={{
              position: 'relative',
              //paddingRight: !isReadonly ? 300 : 0,
            }}
          >
            <div className={classes.sketchArea}>
              <FastField name='drawing' render={args => ''} />
              <SketchField
                name='sketch'
                ref={c => {
                  this._sketch = c
                }}
                lineWidth={this.state.lineWidth}
                lineColor={this.state.lineColor}
                className={classes.container}
                tool={this.state.tool}
                fillColor={
                  this.state.fillWithColor
                    ? this.state.fillColor
                    : 'transparent'
                }
                backgroundColor={
                  this.state.fillWithBackgroundColor
                    ? this.state.backgroundColor
                    : 'transparent'
                }
                onChange={this._onSketchChange}
                forceValue
                height={mainDivHeight - 100}
                width={`calc(100vw - ${!isReadonly ? '320px' : '40px'})`}
              />
            </div>
            {!isReadonly && (
              <div style={{ position: 'absolute', right: 0, width: 280 }}>
                <GridContainer>
                  <GridItem xs={12} md={12}>
                    <div style={{ position: 'relative' }}>
                      <TextField
                        label='Image Templates'
                        maxLength={500}
                        inputProps={{ maxLength: 500 }}
                        style={{ paddingRight: 35 }}
                        value={filterItem}
                        onChange={e => {
                          this.setState({ filterItem: e.target.value })
                        }}
                      />
                      <Tooltip title='Upload image to save as image template'>
                        <Button
                          color='success'
                          justIcon
                          onClick={this.onUploadTemplateClick}
                          style={{
                            position: 'absolute',
                            right: -10,
                            bottom: 10,
                          }}
                        >
                          <CloudUploadOutlined />
                        </Button>
                      </Tooltip>
                    </div>
                    <div className={classes.templateImage}>
                      {sortedTemplateList.length > 0 && (
                        <List>
                          <div className={classes.imageOption}>
                            {sortedTemplateList.map(item => (
                              <ScribbleTemplateItem
                                key={item.id}
                                item={item}
                                setTemplate={this._setTemplate}
                                upsertTemplate={this.upsertTemplate}
                                onEditingTemplate={this.handleEditingTemplate}
                                isTemplateEditing={this.state.isTemplateEditing}
                                classes={classes}
                              />
                            ))}
                          </div>
                        </List>
                      )}
                    </div>
                  </GridItem>
                </GridContainer>
                <GridContainer>
                  <GridItem xs={12} md={12}>
                    <Dropzone
                      onDrop={this._onBackgroundImageDrop}
                      accept='image/*'
                      multiple={false}
                    >
                      {({ getRootProps, getInputProps }) => (
                        <section>
                          <div {...getRootProps()} style={styles.dropArea}>
                            <input {...getInputProps()} />
                            <p className={classes.dropArea}>
                              Drag and drop some files here, <br />
                              or click to select files
                            </p>
                          </div>
                        </section>
                      )}
                    </Dropzone>
                  </GridItem>
                  <GridItem xs={12} md={12}>
                    <input
                      style={{ display: 'none' }}
                      type='file'
                      accept='image/*'
                      id='uploadTemplate'
                      ref={this.inputEl}
                      multiple={false}
                      onChange={this.onFileChange}
                      onClick={this.clearValue}
                    />
                  </GridItem>
                </GridContainer>
              </div>
            )}
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Scribble)
