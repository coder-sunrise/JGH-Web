import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import Select from '../Antd/AntdSelect'
import _ from 'lodash'

@connect(({ codetable }) => ({ codetable }))
class CodeSelect extends React.PureComponent {
  constructor(props) {
    super(props)
    if (
      this.props.maxTagCount === undefined &&
      this.props.mode &&
      this.props.mode === 'multiple'
    ) {
      const initMaxTagCount =
        this.props.field &&
        this.props.field.value &&
        this.props.field.value.length === 1
          ? 1
          : 0
      this.state = {
        maxTagCount:
          this.props.maxTagCount !== undefined
            ? this.props.maxTagCount
            : initMaxTagCount,
      }
    }

    const { dispatch, codetable } = props
    if (props.code) {
      const isExisted = codetable[props.code.toLowerCase()]
      const { temp } = props
      if (isExisted && !temp) {
        return
      }
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: props.code.toLowerCase(),
          temp: props.temp,
          force: props.force,
          filter: props.remoteFilter,
        },
      })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.code !== nextProps.code) {
      const { codetable, dispatch, code } = nextProps
      const isExisted = codetable[code.toLowerCase()]
      if (isExisted) {
        return
      }
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: nextProps.code.toLowerCase(),
          temp: nextProps.temp,
          force: nextProps.temp,
          filter: nextProps.remoteFilter,
        },
      })
    }
  }

  render() {
    const {
      codetable,
      code,
      localFilter,
      formatCodes,
      orderBy,
      customOrder,
      isCheckedShowOnTop,
    } = this.props
    const options = this.props.options
      ? //if options set explicitly, to use the options that have been set.
        //This is only for legacy purpose and options should not be set for codeselect, and use Select component instead.
        this.props.options
      : code !== undefined
      ? codetable[code.toLowerCase()] || []
      : []
    let filteredOptions = localFilter ? options.filter(localFilter) : options
    let checkedArray =
      this.props.form?.values[this.props.field.name] ?? this.props.value ?? []

    if (customOrder) {
      filteredOptions = _.orderBy(
        filteredOptions,
        [
          isCheckedShowOnTop
            ? option =>
                checkedArray.includes(option[this.props.valueField || 'id'])
            : null,
          ...orderBy[0],
        ],
        [isCheckedShowOnTop ? 'desc' : null, ...orderBy[1]],
      )
    } else if (orderBy) {
      filteredOptions = _.orderBy(
        filteredOptions,
        [
          isCheckedShowOnTop
            ? option =>
                checkedArray.includes(option[this.props.valueField || 'id'])
            : null,

          option => (_.get(option, orderBy[0]) || '').toString().toLowerCase(),
        ],
        [isCheckedShowOnTop ? 'desc' : null, orderBy[1]],
      )
    } else if (isCheckedShowOnTop) {
      filteredOptions = _.orderBy(
        filteredOptions,
        [
          option =>
            checkedArray.includes(option[this.props.valueField || 'id']),
        ],
        ['desc'],
      )
    }
    const formattedFilteredOptions = formatCodes
      ? formatCodes(filteredOptions)
      : filteredOptions
    let selectProps = this.props
    if (
      this.props.maxTagCount === undefined &&
      this.props.mode &&
      this.props.mode === 'multiple'
    ) {
      selectProps = {
        ...this.props,
        maxTagCount: this.state.maxTagCount,
      }
    }
    return (
      <Select
        valueField='id'
        {...selectProps}
        options={formattedFilteredOptions || []}
        // prevent to show default '请输入' placeholder
        placeholder=''
        onChange={(values, opts) => {
          if (
            this.props.maxTagCount === undefined &&
            this.props.mode &&
            this.props.mode === 'multiple'
          ) {
            this.setState({
              maxTagCount: values && values.length === 1 ? 1 : 0,
            })
          }
          if (this.props.onChange) {
            this.props.onChange(values, opts)
          }
        }}
      />
    )
  }
}

CodeSelect.propTypes = {
  code: PropTypes.string,
  tenantCode: PropTypes.string,
}

// export default withStyles(extendedFormsStyle)(CodeSelect)
export default CodeSelect
