/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { FastField } from 'formik'
import { withStyles } from '@material-ui/core'
import { DataTypeProvider } from '@devexpress/dx-react-grid'
import debounce from 'lodash/debounce'
import { TextField, OutlinedTextField, Tooltip } from '@/components'
import { updateGlobalVariable, updateCellValue } from '@/utils/utils'

import {
  onComponentDidMount,
  onComponentChange,
  getCommonRender,
} from './utils'

class TextEditorBase extends PureComponent {
  state = {}

  componentDidMount () {
    onComponentDidMount.call(this)
  }

  _onChange = (e) => {
    onComponentChange.call(this, { value: e.target.value })
  }

  // _onChange = (e) => {
  //   const {
  //     columnExtensions,
  //     column: { name: columnName },
  //     value,
  //     onValueChange,
  //     row,
  //   } = this.props

  //   const {
  //     type,
  //     code,
  //     validationSchema,
  //     isDisabled = () => false,
  //     onChange,
  //     gridId,
  //     getRowId,
  //     ...restProps
  //   } = this.state.cfg

  //   const errors = updateCellValue(
  //     this.props,
  //     this.myRef.current,
  //     e.target.value,
  //   )

  //   const latestRow = window.$tempGridRow[gridId]
  //     ? window.$tempGridRow[gridId][getRowId(row)] || row
  //     : row
  //   latestRow._errors = errors
  //   const error = errors.find((o) => o.path === this.state.cfg.columnName)
  //   console.log(error, errors)
  //   if (!error) {
  //     if (onChange) {
  //       onChange(e.target.value, latestRow)
  //     }
  //   }
  // }

  renderComponent = ({
    type,
    render,
    onClick,
    row,
    link,
    editMode,
    getLinkText,
    ...commonCfg
  }) => {
    if (type === 'link') {
      let displayText =
        typeof getLinkText === 'function' ? getLinkText(row) : commonCfg.value
      return (
        <Tooltip title={displayText} enterDelay={750}>
          <a
            onClick={(e) => {
              e.preventDefault()
              if (onClick) onClick(row)
            }}
            href={link || '#'}
          >
            {displayText}
          </a>
        </Tooltip>
      )
    }
    if (editMode) {
      commonCfg.onChange = this._onChange
      commonCfg.onKeyDown = this.props.onKeyDown
      commonCfg.onBlur = this.props.onBlur
      commonCfg.onFocus = this.props.onFocus
      commonCfg.autoFocus = true
      commonCfg.debounceDuration = 0
    }
    if (commonCfg.text) {
      commonCfg.style = {
        display: 'inline-block',
      }
    }
    // console.log(commonCfg, window.$tempGridRow)
    return <TextField {...commonCfg} />
  }

  render () {
    return getCommonRender.bind(this)(this.renderComponent)
  }
}

export const TextEditor = TextEditorBase

class TextTypeProvider extends React.Component {
  static propTypes = {
    for: PropTypes.array, // .isRequired,
    columnExtensions: PropTypes.array,
  }

  constructor (props) {
    super(props)
    this.TextEditor = (columns, text) => (editorProps) => {
      return (
        <TextEditor
          editMode={!text}
          columnExtensions={columns}
          {...editorProps}
        />
      )
    }
    const { columnExtensions } = props
    // console.log(columnExtensions)
    const cols = columnExtensions.filter(
      (o) =>
        [
          'number',
          'select',
          'date',
          'action',
          'custom,',
        ].indexOf(o.type) < 0,
    )
    // .filter(
    //   (o) =>
    //     [
    //       'rowSort',
    //     ].indexOf(o.columnName) < 0,
    // )
    // console.log(cols)

    for (let i = 0; i < cols.length; i++) {
      // console.log(cols[i].columnName, cols[i].type)
      // delete cols[i].type
      const defaultCompare = (a, b) => {
        if (isFinite(a) && isFinite(b)) {
          return a - b
        }

        // eslint-disable-next-line no-nested-ternary
        return (a || '').toString().localeCompare(b || '').toString()
      }
      cols[i].compare = cols[i].compare || defaultCompare
      // cols[i].index = i
    }

    this.state = {
      for: cols,
    }
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    return (
      this.props.editingRowIds !== nextProps.editingRowIds ||
      this.props.commitCount !== nextProps.commitCount
    )
  }

  render () {
    const { columnExtensions } = this.props
    return (
      <DataTypeProvider
        for={this.state.for.map((o) => o.columnName)}
        formatterComponent={this.TextEditor(columnExtensions, true)}
        editorComponent={this.TextEditor(columnExtensions)}
      />
    )
  }
}

export default TextTypeProvider
