import { Switch } from 'antd'
import { primaryColor, dangerColor, successColor } from 'mui-pro-jss'
import React from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import classnames from 'classnames'
import _ from 'lodash'
// material ui
import withStyles from '@material-ui/core/styles/withStyles'

// ant
import { CustomInputWrapper, CustomInput } from '@/components'
import { control } from '@/components/Decorator'

import { extendFunc } from '@/utils/utils'

const STYLES = () => {
  return {
    switchContainer: {
      lineHeight: '1em',
      height: '100%',
      color: 'currentColor',
      borderRadius: 3,
    },
    switchUnchecked: {
      backgroundColor: `${primaryColor} !important`,
    },
    minusChecked: {
      backgroundColor: `${dangerColor} !important`,
    },
    plusChecked: {
      backgroundColor: `${successColor} !important`,
    },
  }
}
@control()
class AntdSwitch extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    onOffMode: PropTypes.bool,
    checkedValue: PropTypes.any,
    unCheckedValue: PropTypes.any,
  }

  static defaultProps = {
    label: undefined,
    disabled: false,
    checkedValue: true,
    unCheckedValue: false,
    onOffMode: true,
  }

  constructor (props) {
    super(props)
    const { form, field, checkedValue } = props
    this.state = {
      value:
        form && field
          ? field.value === checkedValue
          : (props.value || props.defaultValue) === checkedValue,
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    const { field, value, checkedValue, unCheckedValue } = nextProps
    // console.log(checkedValue, field.value)
    if (field) {
      this.setState({
        value: field.value === checkedValue,
      })
    } else if (value) {
      this.setState({
        value: value === checkedValue,
      })
    }
  }

  handleValueChange = (checked) => {
    const { form, field, onChange, checkedValue, unCheckedValue } = this.props
    // console.log(checkedValue, field.value)

    if (form && field) {
      form.setFieldValue(field.name, checked ? checkedValue : unCheckedValue)
      form.setFieldTouched(field.name, true)
    }
    if (onChange) {
      onChange(checked ? checkedValue : unCheckedValue)
    }
    this.setState({
      value: checked,
    })
  }

  getComponent = ({ inputRef, ...props }) => {
    const {
      classes,
      onChange,
      style,
      form,
      field,
      onOffMode,
      unCheckedValue,
      ...restProps
    } = this.props

    const cfg = {
      checked: this.state.value,
    }

    const getSwtichCheckedClass = () => {
      if (
        [
          '$',
          '%',
        ].includes(restProps.unCheckedChildren)
      )
        return classes.switchUnchecked
      if (
        [
          '+',
          '-',
        ].includes(restProps.unCheckedChildren)
      ) {
        if (this.state.value) return classes.minusChecked
        return classes.plusChecked
      }

      return ''
    }

    // console.log(newOptions, this.state.value, restProps)
    return (
      <div style={{ width: '100%' }} {...props}>
        <Switch
          className={classnames(
            classes.switchContainer,
            onOffMode && getSwtichCheckedClass(),
          )}
          onChange={this.handleValueChange}
          checkedChildren='Yes'
          unCheckedChildren='No'
          {...cfg}
          {...restProps}
        />
      </div>
    )
  }

  render () {
    const { props } = this
    const { classes, mode, onChange, ...restProps } = props
    const labelProps = {
      shrink: restProps.label && restProps.label.length > 0,
    }

    return (
      <CustomInput
        labelProps={labelProps}
        inputComponent={this.getComponent}
        preventDefaultChangeEvent
        noUnderline
        {...restProps}
      />
    )
  }
}

export default withStyles(STYLES, { name: 'AntdSwitch' })(AntdSwitch)
