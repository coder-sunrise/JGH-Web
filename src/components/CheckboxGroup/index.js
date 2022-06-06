import React from 'react'
import classnames from 'classnames'
import withStyles from '@material-ui/core/styles/withStyles'
import CustomInput from 'mui-pro-components/CustomInput'
import { Checkbox, FormControlLabel, Tooltip, Popover } from '@material-ui/core'
import regularFormsStyle from 'mui-pro-jss/material-dashboard-pro-react/views/regularFormsStyle'
import { control } from '@/components/Decorator'
import Authorized from '@/utils/Authorized'

@control()
class CheckboxGroup extends React.Component {
  state = {}

  constructor(props) {
    super(props)
    const {
      options = [],
      valueField = 'value',
      field,
      value,
      defaultValue,
    } = props
    const v = {}

    options.forEach(o => {
      v[`${o[valueField]}`] = false
    })
    if (field && Array.isArray(field.value)) {
      field.value.forEach(e => {
        v[`${e}`] = true
      })
    } else if (value || defaultValue) {
      ;(value || defaultValue).forEach(e => {
        v[`${e}`] = true
      })
    }
    this.state = v
  }

  static getDerivedStateFromProps(nextProps, preState) {
    const { options, field, value, valueField = 'value' } = nextProps
    const v = preState
    if (field && Array.isArray(field.value)) {
      options.forEach(o => {
        v[`${o[valueField]}`] = false
      })
      field.value.forEach(e => {
        v[`${e}`] = true
      })

      return v
    }
    if (value) {
      options.forEach(o => {
        v[`${o[valueField]}`] = false
      })
      value.forEach(e => {
        v[`${e}`] = true
      })
      return v
    }
    return null
  }

  handleChange = name => event => {
    const newVal = {
      [name]: event.target.checked,
    }
    this.setState(newVal)

    const newSt = {
      ...this.state,
      ...newVal,
    }

    const { form, field, onChange } = this.props
    const v = {
      target: {
        value: Object.keys(newSt)
          .map(o => ({
            v: o,
            selected: newSt[o],
          }))
          .filter(n => n.selected)
          .map(n => n.v),
      },
    }
    if (form && field) {
      v.target.name = field.name
      field.onChange(v, newVal)
    }
    if (onChange) {
      onChange(v, newVal)
    }
  }

  getComponent = ({ inputRef, onChange, className, ...props }) => {
    const { state } = this
    const {
      classes,
      options = [],
      field,
      form,
      vertical,
      disabled,
      valueField = 'value',
      textField = 'label',
      labelClass,
      displayInlineBlock = false,
      ...resetProps
    } = this.props

    return (
      <div
        className={classnames({
          [className]: true,
          'checkbox-container': true,
        })}
        style={{
          width: '100%',
          height: 'auto',
          display: displayInlineBlock ? 'inline-block' : 'block',
        }}
        {...props}
      >
        {options.map(o => {
          const v = `${o[valueField]}`

          return (
            <Tooltip
              title={
                o.tooltip ? (
                  <span style={{ fontSize: '1.2em' }}>{o.tooltip}</span>
                ) : (
                  ''
                )
              }
              disableFocusListener
            >
              <div
                className={`${classes.checkboxAndRadio} ${
                  vertical ? '' : classes.checkboxAndRadioHorizontal
                }`}
                key={v}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      style={o.disabled ? { pointerEvents: 'none' } : {}}
                      checked={state[v]}
                      onChange={this.handleChange(v)}
                      value={v}
                      color='primary'
                      disabled={o.disabled || disabled}
                    />
                  }
                  label={
                    <span dangerouslySetInnerHTML={{ __html: o[textField] }} />
                  }
                />
              </div>
            </Tooltip>
          )
        })}
      </div>
    )
  }

  render() {
    const { classes, form, field, onChange, ...restProps } = this.props
    return (
      <CustomInput
        inputComponent={this.getComponent}
        labelProps={{
          shrink: true,
        }}
        noUnderline
        preventDefaultChangeEvent
        preventDefaultKeyDownEvent
        {...restProps}
      />
    )
  }
}

CheckboxGroup.propTypes = {}

export default withStyles(regularFormsStyle, { withTheme: true })(CheckboxGroup)
