import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { withFormik } from 'formik'
import * as Yup from 'yup'

import { withStyles } from '@material-ui/core'

import { CardContainer, CommonHeader, GridContainer, GridItem } from '@/components'
import PatientHistory from '@/pages/Widgets/PatientHistory'



const styles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 'calc(100vh - 80px)',
  },
})



class History extends PureComponent {

  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.resize.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  resize() {
    if (this.divElement) {
      const height = this.divElement.clientHeight
      if (height > 0) {
        this.setState({ height: height > 0 ? height / 2 - 144 : 300 })
      }
    }
  }

  render() {
    return (
      <PatientHistory {...this.props}></PatientHistory>

    )
  }
}

export default withStyles(styles, { withTheme: true })(History)

