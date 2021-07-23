import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import Select from '../Antd/AntdSelect'

@connect(({ codetable }) => ({ codetable }))
class CodeSelect extends React.PureComponent {
  constructor(props) {
    super(props)
    // console.log({ props })
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
          force: props.temp,
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
    const { codetable, code, localFilter, formatCodes } = this.props
    const options =
      code !== undefined ? codetable[code.toLowerCase()] || [] : []
    const filteredOptions = localFilter ? options.filter(localFilter) : options
    const formattedFilteredOptions = formatCodes
      ? formatCodes(filteredOptions)
      : filteredOptions
    let selectProps = this.props
    if (
      this.props.maxTagCount === undefined &&
      this.props.mode &&
      this.props.mode === 'multiple'
    ) {
      selectProps = { ...this.props, maxTagCount: this.state.maxTagCount }
    }
    return (
      <Select
        options={formattedFilteredOptions || []}
        valueField='id'
        {...selectProps}
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
