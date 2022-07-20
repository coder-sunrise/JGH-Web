import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import classnames from 'classnames'
import AutosizeInput from 'react-input-autosize'
import $ from 'jquery'
import _ from 'lodash'
// material ui
import withStyles from '@material-ui/core/styles/withStyles'
import Input from '@material-ui/core/Input'

// ant
import { Select, Spin } from 'antd'
import { CustomInput, Tooltip } from '@/components'
import { control } from '@/components/Decorator'
import { extendFunc } from '@/utils/utils'

const STYLES = () => {
  return {
    // dropdownMenu: {
    //   zIndex: 1310,
    // },
    selectContainer: {
      width: '100%',
      overflow: 'hidden',
      boxSizing: 'content-box',
      // lineHeight: '1rem',
      color: 'currentColor',
      position: 'absolute !important',
      '& > div': {
        // erase all border, and boxShadow
        // height: 31,
        border: 'none',
        boxShadow: 'none !important',
        borderRadius: 0,
        // borderBottom: '1px solid rgba(0, 0, 0, 0.4)',
      },
      '& .ant-select-selection': {
        paddingRight: 22,
        background: 'none',
      },
      // '& .ant-select-selection-selected-value': {
      //   height: 40,
      // },
      '& .ant-select-selection__rendered': {
        lineHeight: 'inherit',
        marginRight: 0,
      },
      '& .ant-select-selection__rendered >ul': {
        width: 99999,
      },
      '& .ant-select-selection--single': {
        height: '100%',
        lineHeight: '1.4em',
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

      '& .ant-select-selector': {
        float: 'left',
        width: '100%',
        overflow: 'hidden',
        // height: '24px !important',
        border: '0px solid #fff !important',
        backgroundColor: 'transparent !important',
        padding: '0px !important',
        transition: 'none !important',
      },

      '& .ant-select-selection-item': {
        // lineHeight: '23px !important',
      },
      '& .ant-select-selection-search': {
        left: '0px !important',
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
    maxTagTextLength: PropTypes.number,
    maxSelected: PropTypes.number,
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
    maxTagCount: 5,
    maxTagTextLength: 10,
    maxSelected: 0,
  }

  constructor(props) {
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
      disableAll,
    } = props
    this.myRef = React.createRef()

    let v = form && field ? field.value : props.value || props.defaultValue
    if (field) {
      v = ['multiple', 'tags'].includes(mode) ? field.value || [] : field.value
      if (['multiple', 'tags'].includes(mode)) {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [...options.map(o => o[valueField])]
          if (disableAll === false) v.unshift(allValue)
          form.setFieldValue(field.name, v)
        }
      }
    } else if (value !== undefined) {
      v = ['multiple', 'tags'].includes(mode) ? value || [] : value
      if (['multiple', 'tags'].includes(mode)) {
        if (
          Array.isArray(v) &&
          v.indexOf(allValue) >= 0 &&
          options.length > 1 &&
          v.length === 1
        ) {
          v = [...options.map(o => o[valueField])]

          if (disableAll === false) v.unshift(allValue)
        }
      }
    }

    const shrink = ['multiple', 'tags'].includes(mode)
      ? v && v.length > 0
      : v !== undefined
    this.state = {
      shrink,
      value: v,
      data:
        autoComplete && options && options.length > max
          ? _.filter(options, o => o[valueField] === v)
          : options,
      fetching: false,
      fetchId: 0,
    }

    this.lastFetchId = 0
    this.fetchData = _.debounce(props.onFetchData || this.fetchData, 800)

    const focus = el => {
      if (!this.mouseover)
        $(el)
          .find('.ant-select')
          .trigger('click')
    }
    this.debounceFocus = _.debounce(focus, 100, {
      leading: true,
      trailing: false,
    })
  }

  componentDidMount() {
    if (
      this.state.value &&
      ((Array.isArray(this.state.value) && this.state.value.length > 0) ||
        !!this.state.value) &&
      this.props.query &&
      this.state.data.length === 0
    ) {
      // for remote datasouce, get the selected value by default
      this.fetchData(this.state.value)
    }
  }

  // eslint-disable-next-line camelcase
  // eslint-disable-next-line react/sort-comp
  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      field,
      form,
      value,
      options,
      valueField,
      autoComplete,
      mode,
      allValue,
      disableAll,
      maxSelected,
    } = nextProps
    let v = this.state.value
    // console.log(v)
    if (field) {
      v = ['multiple', 'tags'].includes(mode) ? field.value || [] : field.value
      if (['multiple', 'tags'].includes(mode)) {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [allValue, ...options.map(o => Object.byString(o, valueField))]

          if (maxSelected) {
            v = v.slice(Math.max(v.length - maxSelected, 1))
          }
          form.setFieldValue(field.name, v)
        }
        if (
          mode === 'multiple' &&
          v.indexOf(allValue) < 0 &&
          options.length &&
          options.length === v.length
        ) {
          v.unshift(allValue)
          form.setFieldValue(field.name, v)
        }
      }

      if (mode === 'multiple' && disableAll === true && Array.isArray(v)) {
        v = _.reject(v, o => o === allValue)
      }

      if (!_.isEqual(v, this.state.value)) {
        this.setState({
          value: v,
          shrink: v !== undefined && v !== null && v.length > 0,
        })
      }
    } else if (value !== undefined) {
      v = ['multiple', 'tags'].includes(mode)
        ? value || []
        : value === null
        ? undefined
        : value
      if (['multiple', 'tags'].includes(mode)) {
        if (v.indexOf(allValue) >= 0 && options.length > 1 && v.length === 1) {
          v = [allValue, ...options.map(o => Object.byString(o, valueField))]
        }
        if (
          mode === 'multiple' &&
          v.indexOf(allValue) < 0 &&
          options.length &&
          options.length === v.length
        ) {
          v.unshift(allValue)
        }
      }
      if (mode === 'multiple' && disableAll === true && Array.isArray(v)) {
        v = _.reject(v, o => o === allValue)
      }
      if (!_.isEqual(v, this.state.value)) {
        this.setState({
          value: v,
          shrink: v !== undefined && v !== null && v.length > 0,
        })
      }
    } else if (!this.state.value || this.state.value.length) {
      this.setState({
        value: ['multiple', 'tags'].includes(mode) ? [] : undefined,
        shrink: false,
      })
    }
    if (
      autoComplete &&
      options
      // && this.state.data.length === 0
    ) {
      this.setState({
        data: _.filter(options, o => o[valueField] === v),
      })
    }
  }

  handleFilter = (input, option) => {
    const { handleFilter, additionalSearchField } = this.props
    let match = false

    if (handleFilter && typeof handleFilter === 'function') {
      return handleFilter(input, option)
    }
    try {
      if (Array.isArray(option.props.children)) {
        match = false
      }
      match =
        (option.props.label ?? option.props.title)
          .toLowerCase()
          .indexOf(input.toLowerCase()) >= 0
      if (
        !match &&
        additionalSearchField &&
        option.data &&
        option.data[additionalSearchField]
      ) {
        match =
          option.data[additionalSearchField]
            .toLowerCase()
            .indexOf(input.toLowerCase()) >= 0
      }
    } catch (error) {
      console.log({ error })
      match = false
    }
    return match
  }

  handleFocus = e => {
    this.setState({ shrink: true, focus: true })
    this.debounceFocus(this.myRef.current)
    this.resizeChoiceContents()
  }

  resizeChoiceContents = () => {
    if (this.myRef.current) {
      const antdSel = $(this.myRef.current).find('.ant-select')
      const contentLi = antdSel.find('.ant-select-selection__choice').eq(0)
      const contentEl = antdSel
        .find('.ant-select-selection__choice__content')
        .eq(0)

      if (contentEl) {
        if (antdSel.width() < contentLi.width() + 20) {
          const adjWidth = contentLi.width() - 30
          contentEl.width(adjWidth + 10)
          contentLi.width(adjWidth)
        }
      }
    }
  }

  handleBlur = () => {
    // console.log(this.state.value, 'handleBlur')
    if (
      this.state.value === undefined ||
      this.state.value === null ||
      this.state.value === '' ||
      (this.state.value && this.state.value.length === 0)
    ) {
      this.setState({ shrink: false })
    }
    this.setState({ focus: false })
  }

  handleValueChange = val => {
    const {
      form,
      field,
      allValue,
      allValueOption,
      mode,
      onChange,
      options,
      autoComplete,
      query,
      valueField,
      maxSelected,
      disableAll,
    } = this.props
    let newVal = val
    if (['multiple', 'tags'].includes(mode)) {
      // let _allValue = Object.byString(allValueOption, allValueOption)
      // console.log({ _allValue })
      if (val.indexOf(allValue) >= 0) {
        if (this.state.value.indexOf(allValue) >= 0) {
          newVal = _.reject(newVal, v => v === allValue)
        } else {
          newVal = [
            allValue,
            ...options.map(o => Object.byString(o, valueField)),
          ]
        }
      } else if (this.state.value.indexOf(allValue) >= 0) {
        newVal = []
      }
      if (maxSelected && newVal.length > maxSelected) {
        newVal = _.reject(newVal, v => v === allValue)
        newVal = newVal.slice(-maxSelected)
      }

      this.resizeChoiceContents()
    }
    let proceed = true

    if (onChange) {
      if (!mode || mode === 'default') {
        const option = (autoComplete || query ? this.state.data : options).find(
          o => o[valueField] === newVal,
        )
        proceed = onChange(newVal, option) !== false
      } else if (mode === 'multiple') {
        const opts = (autoComplete || query
          ? this.state.data
          : options
        ).filter(o =>
          newVal.find(m =>
            valueField === 'id'
              ? parseInt(m, 10) === o[valueField]
              : m === o[valueField],
          ),
        )
        proceed = onChange(newVal, opts) !== false
      } else if (mode === 'tags') {
        const opts = (autoComplete || query
          ? this.state.data
          : options
        ).filter(o => newVal.find(m => m === o[valueField]))
        newVal = newVal.length === 0 ? '' : newVal
        proceed = onChange(newVal, opts) !== false
      }
    }
    if (proceed) {
      if (form && field) {
        field.onChange({
          target: {
            name: field.name,
            value: newVal,
          },
        })
      }
      this.setState(ps => {
        return {
          shrink: ['multiple', 'tags'].includes(mode)
            ? newVal && newVal.length > 0
            : newVal !== undefined || ps.focus,
          value: newVal,
        }
      })
    }
  }

  fetchData = async value => {
    this.setState(prevState => {
      return { data: [], fetching: true, fetchId: ++prevState.fetchId }
    })
    if (this.props.query) {
      const { valueField, labelField } = this.props
      const q = await this.props.query(value)
      let data = []
      try {
        if (q instanceof Array) data = q
        // this condition use for dropdown get option by selected id.
        else if (q instanceof Object && q.data.id) data = [q.data]
        else data = q.data.data
      } catch (error) {
        data = []
      }
      this.setState({
        fetching: false,
        data: data.map(o => {
          return {
            ...o,
            name: o[labelField],
            value: o[valueField],
          }
        }),
      })
      if (this.props.onDataSouceChange) {
        this.props.onDataSouceChange(data)
      }
    } else {
      const search = value.toLowerCase()

      const { props } = this
      const {
        options,
        valueField,
        labelField,
        additionalSearchField,
        max,
        localFilter = () => true,
      } = props
      console.log(
        _.filter(
          options,
          // (o) => o[labelField].toLowerCase().indexOf(search) >= 0,
          o =>
            (Object.byString(o, labelField)
              .toLowerCase()
              .indexOf(search) >= 0 ||
              (additionalSearchField &&
                Object.byString(o, additionalSearchField)
                  .toLowerCase()
                  .indexOf(search) >= 0)) &&
            localFilter(o),
        ),
      )
      this.setState({
        data: _.filter(
          options,
          // (o) => o[labelField].toLowerCase().indexOf(search) >= 0,
          o =>
            (Object.byString(o, labelField)
              .toLowerCase()
              .indexOf(search) >= 0 ||
              (additionalSearchField &&
                Object.byString(o, additionalSearchField)
                  .toLowerCase()
                  .indexOf(search) >= 0)) &&
            localFilter(o),
        ).splice(0, max),
        fetching: false,
      })
    }
  }

  getSelectOptions = (source, renderDropdown) => {
    const {
      valueField,
      labelField,
      tooltipField,
      optionLabelLength = 0,
      mode,
      showOptionTitle = true,
    } = this.props

    return source
      .map(s => {
        // console.log({ label: Object.byString(s, labelField) })
        return {
          ...s,
          value: Object.byString(s, mode === 'tags' ? labelField : valueField),
          // value: Object.byString(s, valueField),
          label: Object.byString(s, labelField),
          // value: s[valueField],
          // label: s[labelField],
        }
      })
      .map((option, index) => {
        const hasIsActive = option.isActive !== undefined
        const isActive = hasIsActive ? option.isActive : true
        let tooltip = showOptionTitle
          ? option.customTooltipField || option.label
          : undefined
        if (tooltipField) {
          tooltip = option[tooltipField]
        }
        return (
          <Select.Option
            data={option}
            title={tooltip}
            label={
              optionLabelLength
                ? option.label.substring(0, optionLabelLength)
                : option.label
            }
            key={`select-${option.value}`}
            value={mode === 'tags' ? `${option.value}` : option.value}
            // key={option.id ? `${option.id}` : option.value}
            disabled={!!option.disabled || !isActive}
          >
            {typeof renderDropdown === 'function'
              ? renderDropdown(option)
              : option.label}
          </Select.Option>
        )
      })
  }

  getComponent = ({ inputRef, ...props }) => {
    const {
      valueField,
      labelField,
      groupField,
      options,
      allValue,
      allLabel,
      allValueOption,
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
      isLoading,
      ...restProps
    } = this.props
    // console.log(options, valueField, labelField)
    const source =
      autoComplete || query
        ? this.state.data
        : [
            ...(['multiple', 'tags'].includes(restProps.mode) && !disableAll
              ? [
                  allValueOption || {
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
      opts = group.map(g => {
        return (
          <Select.OptGroup key={g[0].title} label={g[0].title}>
            {this.getSelectOptions(g, renderDropdown)}
          </Select.OptGroup>
        )
      })
    } else {
      opts = this.getSelectOptions(source, renderDropdown)
    }
    // console.log(opts)
    if (this.props.text) {
      const match = source.find(
        o => Object.byString(o, this.props.valueField) === this.state.value,
      )
      let text = ''
      if (match) {
        text = Object.byString(match, labelField)
        if (match.render) {
          return match.render(text)
        }
      }
      text =
        optionLabelLength && text && text.length > optionLabelLength
          ? `${text.substring(0, optionLabelLength)}...`
          : text

      return (
        <Tooltip title={text} enterDelay={750}>
          <AutosizeInput
            title=''
            tabIndex='-1'
            readOnly
            // onMouseLeave={onMouseLeave}
            inputClassName={props.className}
            value={text}
          />
        </Tooltip>
      )
    }
    // console.log(classes.selectContainer, classes.className)
    // console.log(
    //   this.state.fetchId,
    //   this.state.fetchId === 0,
    //   autoComplete,
    //   query,
    // )
    const customTagPlaceholder = maxTagPlaceholder || 'options'
    return (
      <div
        style={{ width: '100%' }}
        {...props}
        ref={this.myRef}
        // onMouseLeave={onMouseLeave}
      >
        <Select
          className={classnames([classes.selectContainer, className])}
          dropdownClassName={classnames(classes.dropdownMenu)}
          showSearch
          // defaultOpen
          onChange={this.handleValueChange}
          onMouseEnter={e => {
            this.mouseover = true
          }}
          onMouseLeave={e => {
            this.mouseover = false
          }}
          onFocus={extendFunc(onFocus, this.handleFocus)}
          onBlur={extendFunc(onBlur, this.handleBlur)}
          onSearch={this.fetchData}
          defaultValue={defaultValue}
          filterOption={this.handleFilter}
          // optionFilterProp={labelField}
          allowClear={allowClear}
          dropdownMatchSelectWidth={dropdownMatchSelectWidth}
          maxTagPlaceholder={vv => {
            const selectItem = vv.filter(o => o.value !== allValue)
            if (selectItem.length < 1) return null
            if (selectItem.length === 1) {
              const selectOption = opts.find(
                opt => opt.props.value === selectItem[0].value,
              )
              if (selectOption) return selectOption.props.label
              return null
            }
            return `${selectItem.length} ${customTagPlaceholder} selected`
          }}
          optionLabelProp='label'
          notFoundContent={
            this.state.fetching || isLoading ? (
              <Spin size='small' />
            ) : (
              <p>
                {this.state.fetchId === 0 && (autoComplete || query)
                  ? 'Input Search Text'
                  : 'Not Found'}
              </p>
            )
          }
          getPopupContainer={node => {
            //Issue: The dropdown position will be fixed on scroll if not stick to the wrapper component.

            //Get the MUI CustomInput container of the wrapper custom component.
            var customInputContainer = node.closest(
              '[class^="MuiFormControl-root"]',
            )
            //Get the underlying modal component of the wrapper custom component.
            var customModalContainer = node.closest(
              '[class^="MuiDialog-container"],[class^="ant-drawer"]',
            )

            //Only fix Select popup container if used as GlobalModalContainer
            if (
              customInputContainer &&
              customModalContainer &&
              customInputContainer.parentNode
            ) {
              return customInputContainer.parentNode
            }
            return document.body
          }}
          {...cfg}
          {...restProps}
        >
          {opts}
        </Select>
      </div>
    )
  }

  render() {
    const { props } = this
    const { classes, mode, onChange, isLoading, ...restProps } = props
    const { value } = this.state
    const labelProps = {}
    if (!mode || mode === 'default') {
      labelProps.shrink =
        (value !== undefined && value !== null) ||
        this.state.shrink ||
        this.state.focus
    } else {
      labelProps.shrink =
        (value && value.length > 0) || this.state.shrink || this.state.focus
      if (labelProps.shrink === undefined) {
        labelProps.shrink = false
      }
    }
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
