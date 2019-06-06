import React, { Component } from 'react'
import moment from 'moment'
import classnames from 'classnames'
// material ui
import withStyles from '@material-ui/core/styles/withStyles'
// ant
import { DatePicker, TimePicker } from 'antd'
// assets
import inputStyle from 'mui-pro-jss/material-dashboard-pro-react/antd/input'
// wrapper
import AntdWrapper from './AntdWrapper'
import { extendFunc } from '@/utils/utils'

const _dateFormat = 'YYYY-MM-DD'

const _toMoment = (value, format) => {
  if (!value) return value
  try {
    if (moment(value, format).isValid()) return moment(value, format)
    return null
  } catch (error) {
    return null
  }
}

const STYLES = (theme) => ({
  ...inputStyle(theme),
  dropdownMenu: {
    zIndex: 1305,
  },
  timePickerContainer: {
    width: '100%',
    '& > input': {
      // erase all border, and box-shadow
      border: 'none',
      boxShadow: 'none !important',
      borderRadius: 0,
      borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
      paddingLeft: 0,
      fontSize: '1rem',
      height: 30,
    },
  },
})

class AntdTimePicker extends Component {
  static defaultProps = {
    label: 'Select date',
    format: 'HH:mm',
    disabled: false,
    size: 'default',
  }

  shouldComponentUpdate = (nextProps) => {
    const { form, field, value } = this.props
    const { form: nextForm, field: nextField, value: nextValue } = nextProps

    const currentDateValue = form && field ? field.value : value
    const nextDateValue = nextForm && nextField ? nextField.value : nextValue

    if (form && nextForm)
      return (
        nextDateValue !== currentDateValue ||
        form.errors[field.name] !== nextForm.errors[nextField.name] ||
        form.touched[field.name] !== nextForm.touched[nextField.name]
      )

    return nextDateValue !== currentDateValue
  }

  handleChange = (time, timeString) => {
    const { form, field, onChange } = this.props
    if (form && field) {
      form.setFieldValue(field.name, timeString)
    }

    if (onChange) {
      const { name } = this.props
      onChange(timeString, name)
    }
  }

  render () {
    const { classes, onChange, ...restProps } = this.props
    const { format, form, field, value } = restProps
    const selectValue = form && field ? field.value : value

    // date picker component dont pass formik props into wrapper
    // date picker component should handle the value change event itself
    return (
      <AntdWrapper {...restProps} isChildDatePicker>
        <TimePicker
          className={classnames(classes.timePickerContainer)}
          // dropdownClassName={classnames(classes.dropdownMenu)}
          popupStyle={{ zIndex: 1400 }}
          allowClear
          placeholder=''
          defaultOpenValue={moment('00:00', 'HH:mm')}
          onChange={extendFunc(onChange, this.handleChange)}
          value={_toMoment(selectValue, format)}
        />
      </AntdWrapper>
    )
  }
}

export default withStyles(STYLES, { name: 'AntdDatePicker' })(AntdTimePicker)
