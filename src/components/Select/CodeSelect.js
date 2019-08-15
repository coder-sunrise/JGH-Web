import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import Select from '../Antd/AntdSelect'
import { getTenantCodes } from '@/utils/codes'

@connect(({ codetable }) => ({ codetable }))
class CodeSelect extends React.PureComponent {
  state = {
    options: [],
    width: 'auto',
  }

  constructor (props) {
    super(props)
    const { dispatch } = props
    if (props.code) {
      dispatch({
        type: 'codetable/fetchCodes',
        code: props.code,
      })
    }
    // else if (props.tenantCode) {
    //   getTenantCodes(props.tenantCode).then((response) => {
    //     const { data = [] } = response

    //     const tenantCodeOptions = data.reduce((options, opt) => {
    //       return [
    //         ...options,
    //         {
    //           name:
    //             opt && opt.clinicianInfomation
    //               ? opt.clinicianInfomation.name
    //               : '',
    //           id: opt.id,
    //         },
    //       ]
    //     }, [])
    //     this.setState({
    //       options: tenantCodeOptions,
    //     })
    //   })
    // }
  }

  render () {
    const { codetable, code } = this.props

    const options =
      code !== undefined ? codetable[code.toLowerCase()] : this.state.options

    return <Select options={options || []} valueField='id' {...this.props} />
  }
}

CodeSelect.propTypes = {
  code: PropTypes.string,
  tenantCode: PropTypes.string,
}

// export default withStyles(extendedFormsStyle)(CodeSelect)
export default CodeSelect
