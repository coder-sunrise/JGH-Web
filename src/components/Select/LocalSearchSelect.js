import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from '@/components'
import { connect } from 'dva'
import Select from '../Antd/AntdSelect'
@connect(({ codetable }) => ({ codetable }))
class LocalSearchSelect extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      options: [],
      filterOptions: [],
    }
  }

  componentDidMount = async () => {
    const {
      code,
      dispatch,
      options = [],
      localFilter = () => true,
    } = this.props
    if (this.state.options.length) {
      this.setSelectValue(this.props)
    } else {
      let currentOptions = [...options]
      if (code && code.trim().length) {
        const result = await dispatch({
          type: 'codetable/fetchCodes',
          payload: {
            code,
          },
        })
        if (result) {
          currentOptions = result
        }
      }

      this.setState(
        { options: currentOptions.filter(x => localFilter(x)) },
        () => {
          this.setSelectValue(this.props)
        },
      )
    }
  }

  setSelectValue = props => {
    const { value, valueField = 'id' } = props
    let defaultOptions = []
    const { options = [] } = this.state
    if (props.field) {
      defaultOptions = options.filter(x => x[valueField] === props.field.value)
    } else {
      defaultOptions = options.filter(x => x[valueField] === props.value)
    }
    this.setState({ filterOptions: defaultOptions })
  }

  onSearch = v => {
    const {
      setFieldValue,
      matchSearch = (option, input) => {
        const lowerCaseInput = input.toLowerCase()
        return (
          (option.code || '').toLowerCase().indexOf(lowerCaseInput) >= 0 ||
          (option.name || '').toLowerCase().indexOf(lowerCaseInput) >= 0 ||
          (option.displayValue || '').toLowerCase().indexOf(lowerCaseInput) >= 0
        )
      },
    } = this.props
    if (v === undefined || v === null || !v.trim().length) {
      this.setSelectValue(this.props)
      return
    }
    const { options = [] } = this.state

    let currentOptions = []
    for (let index = 0; index < options.length; index++) {
      if (matchSearch(options[index], v)) {
        currentOptions.push(options[index])
        if (currentOptions.length === 20) {
          break
        }
      }
    }

    this.setState({ filterOptions: currentOptions })
  }

  onChange = (v, op) => {
    const { onChange = () => {} } = this.props
    if (v) {
      this.setState({ filterOptions: [{ ...op }] })
    } else {
      this.setState({ filterOptions: [] })
    }
    onChange(v, op)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { code, options = [], localFilter = () => true } = nextProps
    if (!code || !code.trim().length) {
      if (this.state.options.length) {
        this.setSelectValue(nextProps)
      } else {
        this.setState({ options: options.filter(x => localFilter(x)) }, () => {
          this.setSelectValue(nextProps)
        })
      }
    }
  }
  render() {
    const { filterOptions } = this.state
    const { valueField = 'id' } = this.props
    return (
      <Select
        {...this.props}
        valueField={valueField}
        onChange={this.onChange}
        options={filterOptions}
        onSearch={this.onSearch}
      />
    )
  }
}

LocalSearchSelect.propTypes = {}

export default LocalSearchSelect
