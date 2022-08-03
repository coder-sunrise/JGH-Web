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
    const { setFieldValue, matchSearch = () => true } = this.props
    if (v === undefined || v === null || !v.trim().length) {
      this.setState({ filterOptions: [] })
      return
    }
    const { options = [] } = this.state

    const currentOptions = _.take(
      options.filter(m => matchSearch(m, v)),
      20,
    )
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
    this.setSelectValue(nextProps)
    //this.setDefaultOption(nextProps)
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
