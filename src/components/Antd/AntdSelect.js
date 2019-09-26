import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import classnames from 'classnames'
import AutosizeInput from 'react-input-autosize'
import _ from 'lodash'
// material ui
import withStyles from '@material-ui/core/styles/withStyles'
import Input from '@material-ui/core/Input'

// ant
import { Select, Spin } from 'antd'
import { CustomInput } from '@/components'
import { control } from '@/components/Decorator'
import { extendFunc } from '@/utils/utils'

const STYLES = () => {
  return {
    // dropdownMenu: {
    //   zIndex: 1310,
    // },
    selectContainer: {
      width: '100%',
      boxSizing: 'content-box',
      lineHeight: '1rem',
      color: 'currentColor',

      '& > div': {
        // erase all border, and boxShadow
        // height: 31,
        border: 'none',
        boxShadow: 'none !important',
        borderRadius: 0,
        // borderBottom: '1px solid rgba(0, 0, 0, 0.4)',
      },
      '& .ant-select-selection': {
        background: 'none',
      },
      // '& .ant-select-selection-selected-value': {
      //   height: 40,
      // },
      '& .ant-select-selection__rendered': {
        lineHeight: 'inherit',
        marginRight: 0,
      },
      '& .ant-select-selection--single': {
        height: '100%',
        lineHeight: '1em',
      },
      '& .ant-select-selection--multiple': {
        height: '100%',
        minHeight: '20px',
        // to match the same line
        // with ant-select-select--single
        paddingBottom: 0,
        position: 'relative',
        top: -4,
      },
      '& .ant-select-selection > div': {
        marginLeft: 0,
        // fontSize: '1rem',
        // fontWeight: 400,
        // paddingTop: 3,
      },
    },
  }
}

@control()
class AntdSelect extends React.PureComponent {
  static propTypes = {
    // required props
    options: PropTypes.array,
    // optional props
    label: PropTypes.string,
    labelField: PropTypes.string,
    valueField: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    size: PropTypes.string,
    renderDropdown: PropTypes.func,
    max: PropTypes.number,
    allValue: PropTypes.number,
    allLabel: PropTypes.string,
    maxTagCount: PropTypes.number,
  }

  static defaultProps = {
    options: [],
    label: undefined,
    labelField: 'name',
    valueField: 'value',
    disabled: false,
    size: 'default',
    max: 50,
    allValue: -99,
    allLabel: 'All',
    maxTagCount: 0,
  }

  constructor (props) {
    super(props)
    const {
      form,
      field,
      mode,
      options = [],
      autoComplete,
      valueField,
      max,
      allValue,
      value,
    } = props
    let v = form && field ? field.value : props.value || props.defaultValue

    if (field) {
      v = mode === 'multiple' ? field.value || [] : field.value
      if (mode === 'multiple') {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [
            allValue,
            ...options.map((o) => o[valueField]),
          ]
          form.setFieldValue(field.name, v)
        }
      }
    } else if (value) {
      v = mode === 'multiple' ? value || [] : value
      if (mode === 'multiple') {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [
            allValue,
            ...options.map((o) => o[valueField]),
          ]
        }
      }
    }
    const shrink = mode === 'multiple' ? v && v.length > 0 : v !== undefined
    this.state = {
      shrink,
      value: v,
      data:
        autoComplete && options && options.length > max
          ? _.filter(options, (o) => o[valueField] === v)
          : options,
      fetching: false,
      fetchId: 0,
    }

    this.lastFetchId = 0
    this.fetchData = _.debounce(props.onFetchData || this.fetchData, 800)
  }

  componentDidMount () {
    if (this.state.value && this.props.query && this.state.data.length === 0) {
      // for remote datasouce, get the selected value by default
      // console.log(this.state.value)
      this.fetchData(this.state.value)
    }
  }

  // eslint-disable-next-line camelcase
  // eslint-disable-next-line react/sort-comp
  UNSAFE_componentWillReceiveProps (nextProps) {
    const {
      field,
      form,
      value,
      options,
      valueField,
      autoComplete,
      mode,
      allValue,
    } = nextProps
    let v = this.state.value

    if (field) {
      v = mode === 'multiple' ? field.value || [] : field.value
      if (mode === 'multiple') {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [
            allValue,
            ...options.map((o) => o[valueField]),
          ]
          form.setFieldValue(field.name, v)
        }
      }
      this.setState({
        value: v,
        shrink: mode === 'multiple' ? v && v.length > 0 : v !== undefined,
      })
    } else if (value) {
      v = mode === 'multiple' ? value || [] : value
      if (mode === 'multiple') {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [
            allValue,
            ...options.map((o) => o[valueField]),
          ]
        }
      }

      this.setState({
        value: v,
        shrink: mode === 'multiple' ? v && v.length > 0 : v !== undefined,
      })
    } else {
      this.setState({
        value: mode === 'multiple' ? [] : undefined,
        shrink: false,
      })
    }
    if (autoComplete && options && this.state.data.length === 0) {
      this.setState({
        data: _.filter(options, (o) => o[valueField] === v),
      })
    }
  }

  handleFilter = (input, option) => {
    // console.log(input, option, option.props.children, this.props.labelField)
    try {
      if (Array.isArray(option.props.children)) {
        // return (
        //   option.props.children.filter(
        //     (o) =>
        //       o.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0,
        //   ).length > 0
        // )
        return false
      }
      return (
        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    } catch (error) {
      console.log({ error })
      return false
    }
  }

  handleFocus = () => {
    this.setState({ shrink: true })
  }

  handleBlur = () => {
    // console.log(this.state.value)
    if (
      this.state.value === undefined ||
      this.state.value === null ||
      this.state.value === '' ||
      (this.state.value && this.state.value.length === 0)
    ) {
      this.setState({ shrink: false })
    }
  }

  handleValueChange = (val, a, b, c) => {
    const {
      form,
      field,
      allValue,
      mode,
      onChange,
      options,
      autoComplete,
      query,
      valueField,
    } = this.props
    let newVal = val
    if (mode === 'multiple') {
      if (val.indexOf(allValue) >= 0) {
        if (this.state.value.indexOf(allValue) >= 0) {
          newVal = _.reject(newVal, (v) => v === allValue)
        } else {
          newVal = [
            allValue,
            ...options.map((o) => o[valueField]),
          ]
        }
      } else if (this.state.value.indexOf(allValue) >= 0) {
        newVal = []
      }
    }

    let proceed = true
    if (onChange) {
      if (!mode || mode === 'default') {
        const option = (autoComplete || query ? this.state.data : options).find(
          (o) => o[valueField] === newVal,
        )
        proceed = onChange(newVal, option) !== false
      } else {
        const opts = (autoComplete || query
          ? this.state.data
          : options).filter((o) => newVal.find((m) => m === o[valueField]))
        proceed = onChange(newVal, opts) !== false
      }
    }
    if (proceed) {
      if (form && field) {
        form.setFieldValue(field.name, newVal)
        form.setFieldTouched(field.name, true)
      }
      this.setState({
        shrink:
          mode === 'multiple'
            ? newVal && newVal.length > 0
            : newVal !== undefined,
        value: newVal,
      })
    }
  }

  fetchData = async (value) => {
    console.log('fetching data', value)
    this.setState((prevState) => {
      return { data: [], fetching: true, fetchId: ++prevState.fetchId }
    })
    if (this.props.query) {
      const q = await this.props.query(value)
      // console.log(q)
      let data = []
      try {
        data = q.data.data
      } catch (error) {}
      this.setState({
        fetching: false,
        data: data.map((o) => {
          return {
            ...o,
            name: o.name,
            value: o.id,
          }
        }),
      })
    } else {
      const search = value.toLowerCase()

      const { props } = this
      const { options, valueField, labelField, max } = props

      this.setState({
        data: _.filter(
          options,
          (o) => o[labelField].toLowerCase().indexOf(search) >= 0,
        ).splice(0, max),
        fetching: false,
      })
    }
  }

  getSelectOptions = (source, renderDropdown) => {
    const { valueField, labelField, optionLabelLength = 0 } = this.props

    return source
      .map((s) => {
        // console.log({ label: Object.byString(s, labelField) })
        return {
          ...s,
          value: Object.byString(s, valueField),
          label: Object.byString(s, labelField),
          // value: s[valueField],
          // label: s[labelField],
        }
      })
      .map((option) => (
        <Select.Option
          data={option}
          key={option.value}
          title={option.label}
          label={
            optionLabelLength ? (
              option.label.substring(0, optionLabelLength)
            ) : (
              option.label
            )
          }
          value={option.value}
          disabled={!!option.disabled}
        >
          {typeof renderDropdown === 'function' ? (
            renderDropdown(option)
          ) : (
            option.label
          )}
        </Select.Option>
      ))
  }

  getComponent = ({ inputRef, ...props }) => {
    const {
      valueField,
      labelField,
      groupField,
      options,
      allValue,
      allLabel,
      disableAll,
      classes,
      defaultValue,
      renderDropdown,
      onChange,
      onFocus,
      onBlur,
      allowClear = true,
      style,
      dropdownMatchSelectWidth = true,
      autoComplete,
      query,
      optionLabelLength,
      className,
      maxTagPlaceholder,
      value,
      ...restProps
    } = this.props
    // console.log(options)

    const source =
      autoComplete || query
        ? this.state.data
        : [
            ...(restProps.mode === 'multiple' && !disableAll
              ? [
                  {
                    [valueField]: allValue,
                    [labelField]: allLabel,
                  },
                ]
              : []),
            ...options,
          ]

    const cfg = {
      value: this.state.value,
    }

    let opts = []
    if (source[0] && source[0][groupField]) {
      const groups = _.groupBy(source, groupField)
      const group = Object.values(groups)
      opts = group.map((g) => {
        return (
          <Select.OptGroup key={g[0].title} label={g[0].title}>
            {this.getSelectOptions(g, renderDropdown)}
          </Select.OptGroup>
        )
      })
    } else {
      opts = this.getSelectOptions(source, renderDropdown)
    }

    if (this.props.text) {
      const match = source.find(
        (o) => o[this.props.valueField] === this.state.value,
      )
      let text = ''
      if (match) text = match[this.props.labelField]
      return (
        <AutosizeInput
          readOnly
          inputClassName={props.className}
          value={
            optionLabelLength ? text.substring(0, optionLabelLength) : text
          }
        />
      )
    }
    // console.log(classes.selectContainer, classes.className)
    return (
      <div style={{ width: '100%' }} {...props}>
        <Select
          className={classnames([
            classes.selectContainer,
            className,
          ])}
          dropdownClassName={classnames(classes.dropdownMenu)}
          showSearch
          // defaultOpen
          onChange={this.handleValueChange}
          onFocus={extendFunc(onFocus, this.handleFocus)}
          onBlur={extendFunc(onBlur, this.handleBlur)}
          onSearch={this.fetchData}
          defaultValue={defaultValue}
          filterOption={this.handleFilter}
          allowClear={allowClear}
          dropdownMatchSelectWidth={dropdownMatchSelectWidth}
          maxTagPlaceholder={(vv) => {
            return `${vv.filter((o) => o !== allValue).length} options selected`
          }}
          optionLabelProp='label'
          notFoundContent={
            this.state.fetching ? (
              <Spin size='small' />
            ) : (
              <p>
                {this.state.fetchId === 0 && (autoComplete || query) ? (
                  'Input Search Text'
                ) : (
                  'Not Found'
                )}
              </p>
            )
          }
          {...cfg}
          {...restProps}
        >
          {opts}
        </Select>
      </div>
    )
  }

  render () {
    const { props } = this
    const { classes, mode, onChange, ...restProps } = props
    const { value } = this.state
    const labelProps = {}
    if (!mode || mode === 'default') {
      labelProps.shrink =
        (value !== undefined && value !== null) || this.state.shrink
    } else {
      // console.log(
      //   value,
      //   this.state.shrink,
      //   value !== undefined,
      //   value !== null,
      //   value !== '',
      //   value.length > 0,
      // )
      labelProps.shrink = (value && value.length > 0) || this.state.shrink
    }
    // console.log(labelProps)

    return (
      <CustomInput
        labelProps={labelProps}
        inputComponent={this.getComponent}
        preventDefaultChangeEvent
        preventDefaultKeyDownEvent
        {...restProps}
      />
    )
  }
}

export default withStyles(STYLES, { name: 'AntdSelect' })(AntdSelect)
