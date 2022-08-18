/* eslint-disable react/no-multi-comp */
import React, { PureComponent, Component } from 'react'
import $ from 'jquery'
import { connect } from 'dva'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { withStyles, Tooltip } from '@material-ui/core'
import { DataTypeProvider } from '@devexpress/dx-react-grid'
import { CodeSelect, Select, TextField, LocalSearchSelect } from '@/components'

import {
  updateGlobalVariable,
  updateCellValue,
  difference,
} from '@/utils/utils'

import {
  onComponentDidMount,
  onComponentChange,
  getCommonRender,
} from './utils'

class SelectEditor extends PureComponent {
  state = {}

  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  componentDidMount() {
    onComponentDidMount.call(this)
  }

  _onChange = (val, option) => {
    onComponentChange.call(this, { val, option })
  }

  renderComponent = ({
    type,
    code,
    columnName,
    options,
    localFilter,
    row,
    editMode,
    ...commonCfg
  }) => {
    const { codes } = this.props

    if (editMode) {
      commonCfg.onChange = this._onChange
      commonCfg.onBlur = this.props.onBlur
      commonCfg.autoFocus = true
    }

    commonCfg.options =
      typeof options === 'function'
        ? options(row)
        : options || codes[`${columnName}Option`] || []
    // commonCfg.onFocus = () => {
    //   setTimeout(() => {
    //     // console.log($(this.myRef.current).find('.ant-select'))
    //     $(this.myRef.current).find('.ant-select').trigger('click')
    //   }, 1)
    // }

    // if (!commonCfg.error) commonCfg.open = true

    if (localFilter) commonCfg.options = commonCfg.options.filter(localFilter)
    // console.log(commonCfg)
    if (columnName) {
      if (type === 'select') {
        return (
          <div ref={this.myRef}>
            <Select {...commonCfg} />
          </div>
        )
      }
      if (type === 'codeSelect') {
        return (
          <div ref={this.myRef}>
            <CodeSelect {...commonCfg} code={code} />
          </div>
        )
      }
      if (type === 'localSearchSelect') {
        return (
          <div ref={this.myRef}>
            <LocalSearchSelect {...commonCfg} code={code} />
          </div>
        )
      }
      return null
    }

    return <TextField value={commonCfg.value} simple />
  }

  render() {
    return getCommonRender.bind(this)(this.renderComponent)
  }
}

// const SelectDisplay = (columnExtensions, state) => ({
//   value,
//   column: { name: columnName },
//   row,
//   ...restProps
// }) => {
//   const cfg =
//     columnExtensions.find(
//       ({ columnName: currentColumnName }) => currentColumnName === columnName,
//     ) || {}

//   if (value === undefined) return ''
//   const v =
//     (typeof cfg.options === 'function'
//       ? cfg.options(row)
//       : cfg.options || state[`${columnName}Option`] || []).find(
//       (o) => o.value === value || o.id === value,
//     ) || {}

//   const { labelField = 'name', render } = cfg

//   const label = Object.byString(v, labelField)
//   const vEl = v ? (
//     <Tooltip title={label} enterDelay={750}>
//       <span style={{ color: v.color || 'inherit' }}>{label}</span>
//     </Tooltip>
//   ) : (
//     ''
//   )

//   if (render) return render(row)

//   return vEl
// }

@connect(({ codetable }) => ({ codetable }))
class SelectTypeProvider extends React.Component {
  static propTypes = {
    columnExtensions: PropTypes.array,
  }

  constructor(props) {
    super(props)

    const { columnExtensions, codetable, dispatch } = this.props
    const colFor = columnExtensions.filter(
      o => ['select', 'codeSelect', 'localSearchSelect'].indexOf(o.type) >= 0,
    )
    colFor.forEach(o => {
      let { columnName, type, valueField, labelField } = o
      if (!valueField) {
        if (type === 'codeSelect' || type === 'localSearchSelect') {
          valueField = 'id'
        } else {
          valueField = 'value'
        }
      }
      if (!labelField) {
        labelField = 'name'
      }
      o.compare = (a, b) => {
        const codes = this.state[`${columnName}Option`] || []
        const aa = codes.find(m => m[valueField] === a)
        const bb = codes.find(m => m[valueField] === b)

        // eslint-disable-next-line no-nested-ternary
        return (aa ? aa[labelField] : a || '') > (bb ? bb[labelField] : b || '')
          ? 1
          : -1
      }
    })

    const payload = {
      codeLoaded: 0,
    }
    for (let i = 0; i < colFor.length; i++) {
      const f = colFor[i]

      if (f.code) {
        const isExisted = codetable[f.code.toLowerCase()]
        const isPreviouslyFiltered = codetable.hasFilterProps.includes(
          f.code.toLowerCase(),
        )
        // const force = f.remoteFilter !== undefined || isPreviouslyFiltered
        const { force, localFilter } = f

        if (isExisted && !force) {
          payload[`${f.columnName}Option`] = localFilter
            ? codetable[f.code.toLowerCase()].filter(localFilter)
            : codetable[f.code.toLowerCase()]
          payload.codeLoaded += 1
        } else {
          dispatch({
            type: 'codetable/fetchCodes',
            payload: {
              code: f.code.toLowerCase(),
              // filter: f.remoteFilter,
              force: true,
            },
          }).then(response => {
            if (response) {
              this.setState(prevState => {
                const filtered = localFilter
                  ? response.filter(localFilter)
                  : response
                return {
                  [`${f.columnName}Option`]: filtered,
                  codeLoaded: ++prevState.codeLoaded,
                }
              })
            }
          })
        }
      }
    }

    this.state = {
      for: colFor,
      ...payload,
    }

    this.SelectEditor = (ces, text) => editorProps => {
      // console.log(ces, editorProps)
      return (
        <SelectEditor
          editMode={!text}
          columnExtensions={ces}
          {...editorProps}
          codes={this.state}
        />
      )
    }
  }

  // componentDidMount () {

  // }

  shouldComponentUpdate = (nextProps, nextState) => {
    // console.log('props', nextProps, this.props)
    // console.log('state', nextState, this.state)
    return (
      // optionsUpdate ||
      // this.props.editingRowIds !== nextProps.editingRowIds ||
      Object.keys(this.state).length !== Object.keys(nextState).length ||
      this.state.codeLoaded !== nextState.codeLoaded ||
      this.props.commitCount !== nextProps.commitCount
    )
  }

  render() {
    // console.log('texttypeprovider', this.props)
    const { columnExtensions } = this.props
    return (
      <DataTypeProvider
        for={this.state.for.map(o => o.columnName)}
        editorComponent={this.SelectEditor(columnExtensions)}
        formatterComponent={this.SelectEditor(columnExtensions, true)}
      />
    )
  }
}

export default SelectTypeProvider
