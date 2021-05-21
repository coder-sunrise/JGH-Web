import React from 'react'
import { formatMessage, FormattedMessage } from 'umi'
import classNames from 'classnames'
import ModalWrapper from '@/components/ModalWrapper'
import { SweetAlert } from '@/components'

import CircularProgress from '@material-ui/core/CircularProgress'
import { withStyles } from '@material-ui/core/styles'
import sweetAlertStyle from 'mui-pro-jss/material-dashboard-pro-react/views/sweetAlertStyle.jsx'

const styles = theme => ({
  ...sweetAlertStyle,
})
class SimpleModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      done: false,
      hide: true,
      error: false,
    }
    if (props.defaultOpen) {
      this.state.hide = false
    }
  }

  static getDerivedStateFromProps(nextProps, preState) {
    // console.log(nextProps, preState)
    if (
      nextProps.status &&
      nextProps.status.submissionStatus === 'done' &&
      !preState.done
    ) {
      return {
        done: true,
      }
    }
    if (nextProps.open) {
      return {
        hide: false,
        done: false,
      }
    }
    return null
  }

  onConfirm = () => {
    if (this.props.onAsyncOk) {
      this.props.onAsyncOk(r => {
        // console.log(r, 's')
        if (r) {
          this.setState({
            done: true,
          })
        }
      })
    } else if (this.props.onOk) {
      this.props.onOk()
      this.setState({
        done: true,
        hide: true,
      })
    } else {
      this.setState(
        {
          done: true,
        },
        () => {},
      )
    }
  }

  hideAlert = () => {
    this.setState(
      {
        hide: true,
        done: true,
      },
      () => {
        if (this.props.onCancel) this.props.onCancel()
      },
    )
  }

  render() {
    const { status, classes } = this.props
    const submitting = status && status.submissionStatus === 'pending'
    const { onCancel, onOk, ...resetProps } = this.props

    if (this.state.hide) return null
    if (this.state.done) {
      return (
        <ModalWrapper>
          <SweetAlert
            success
            // style={{ display: "block", marginTop: "-100px" }}
            title='Done!'
            onConfirm={this.hideAlert}
            onCancel={this.hideAlert}
            cancelBtnCssClass={`${classes.button} ${classes.contained} ${classes.danger} ${classes.containeddanger}`}
            confirmBtnCssClass={`${classes.button} ${classes.contained} ${classes.primary} ${classes.containedprimary}`}
          />
        </ModalWrapper>
      )
    }
    if (this.state.error) {
      return (
        <ModalWrapper>
          <SweetAlert
            error
            // style={{ display: "block", marginTop: "-100px" }}
            title='Error!'
            onConfirm={this.hideAlert}
            onCancel={this.hideAlert}
            cancelBtnCssClass={`${classes.button} ${classes.contained} ${classes.danger} ${classes.containeddanger}`}
            confirmBtnCssClass={`${classes.button} ${classes.contained} ${classes.primary} ${classes.containedprimary}`}
          />
        </ModalWrapper>
      )
    }
    // if (!this.props.open && this.state.hide) return null

    return (
      <ModalWrapper>
        <SweetAlert
          // input
          disabled={submitting}
          showCancel
          confirmBtnText={submitting ? 'Processing...' : 'Confirm'}
          // style={{ display: "block", marginTop: "-100px" }}
          //   title={`Void the Payment ${ row.itemCode  }?`}
          onConfirm={this.onConfirm}
          onCancel={this.hideAlert}
          cancelBtnCssClass={`${classes.button} ${classes.contained} ${classes.danger} ${classes.containeddanger}`}
          confirmBtnCssClass={`${classes.button} ${classes.contained} ${
            submitting ? classes.default : classes.primary
          } ${classes.containedprimary}`}
          {...resetProps}
        >
          {this.props.children}
        </SweetAlert>
      </ModalWrapper>
    )
  }
}
export default withStyles(styles, { withTheme: true })(SimpleModal)
