import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
// material ui
import withStyles from '@material-ui/core/styles/withStyles'
import RemoveCircle from '@material-ui/icons/RemoveCircle'
// ant
import { Input } from 'antd'
import { extendFunc, currencyFormat } from '@/utils/utils'

import inputStyle from 'mui-pro-jss/material-dashboard-pro-react/antd/input'
import AntdWrapper from './AntdWrapper'

const STYLES = (theme) => {
  return {
    ...inputStyle(theme),
    container: {
      width: '100%',
    },
    control: {
      '& .ant-form-item': {
        paddingTop: '24px',
        transformOrigin: 'top left',
      },
    },
    selectContainer: {
      width: '100%',
      '& > div': {
        // erase all border, and boxShadow
        border: 'none',
        boxShadow: 'none !important',
        borderRadius: 0,
        borderBottom: '1px solid',
        marginLeft: 5,
        marginRight: 5,
      },
      '& .ant-select-selection--multiple': {
        // to match the same line
        // with ant-select-select--single
        paddingBottom: 0,
      },
      '& .ant-select-selection > div': {
        marginLeft: 0,
        fontSize: '1rem',
        fontWeight: 400,
        paddingTop: 3,
      },
    },
  }
}

class AntdInput extends React.PureComponent {
  static propTypes = {
    // conditionally required
    name: (props, propName, componentName) => {
      const { onChange } = props
      if (onChange && props[propName] === undefined)
        return new Error(
          `prop { name } is REQUIRED for ${componentName} but not supplied`,
        )
      return ''
    },
    value: (props, propName, componentName) => {
      const { onChange } = props
      if (onChange && props[propName] === undefined)
        return new Error(
          `prop ${propName} is REQUIRED for ${componentName} but not supplied`,
        )
      return ''
    },
    // optional props
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    size: PropTypes.string,
  }

  static defaultProps = {
    disabled: false,
    size: 'default',
  }

  render () {
    return (
      <AntdWrapper {...this.props}>
        <Input />
      </AntdWrapper>
    )
  }
}

export default withStyles(STYLES, { name: 'AntdInput' })(AntdInput)
