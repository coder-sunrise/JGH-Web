import React, { PureComponent } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import _ from 'lodash'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
import {
  GridContainer,
  withFormikExtend,
  ProgressButton,
  WarningSnackbar,
} from '@/components'
import { INVOICE_STATUS } from '@/utils/constants'
import { navigateDirtyCheck, roundTo } from '@/utils/utils'
import AuthorizedContext from '@/components/Context/Authorized'
import Authorized from '@/utils/Authorized'
import Grid from './Grid'
import Header from './Header'

const styles = (theme) => ({
  ...basicStyle(theme),
})

const { Secured } = Authorized
@Secured('purchasingandreceiving.purchasingandreceivingdetails')
@connect(({ podoPayment, purchaseOrderDetails, global }) => ({
  podoPayment,
  purchaseOrderDetails,
  mainDivHeight: global.mainDivHeight,
}))
@withFormikExtend({
  displayName: 'podoPayment',
  enableReinitialize: true,
  mapPropsToValues: ({ podoPayment }) => {
    let outstandingAmount = {}
    let newPurchaseOrderPayment = []
    if (podoPayment && podoPayment.purchaseOrderDetails) {
      const osAmt = roundTo(
        podoPayment.purchaseOrderDetails.outstandingAmount || 0,
      )
      outstandingAmount = {
        outstandingAmt: osAmt,
        currentOutstandingAmt: osAmt,
        invoiceAmount: podoPayment.purchaseOrderDetails.totalAftGst,
      }

      const { purchaseOrderPayment } = podoPayment
      newPurchaseOrderPayment = purchaseOrderPayment.map((o) => {
        let tempOutstandingAmount = {}
        if (o.id) {
          tempOutstandingAmount = {
            outstandingAmt: o.paymentAmount,
          }
        }
        return {
          ...o,
          ...tempOutstandingAmount,
        }
      })
    }

    return {
      ...podoPayment,
      ...outstandingAmount,
      purchaseOrderPayment: newPurchaseOrderPayment,
    }
  },
  handleSubmit: (values, { props }) => {
    const { dispatch, onConfirm } = props
    const { purchaseOrderPayment, currentBizSessionInfo } = values

    let paymentData = purchaseOrderPayment.map((x, index) => {
      x.isCancelled = x.isDeleted
      if (_.has(x, 'isNew')) {
        return {
          purchaseOrderFK: values.id,
          sequence: index + 1,
          clinicPaymentDto: {
            ...x,
            id: x.cpId,
            concurrencyToken: x.cpConcurrencyToken,
            createdOnBizSessionFK: currentBizSessionInfo.id,
            clinicPaymentTypeFK: 1,
            transactionOnBizSessionFK: currentBizSessionInfo.id,
            isCancelled: x.isCancelled,
            paymentMode: x.paymentModeTypeName,
            creditCardType: x.creditCardTypeName,
          },
        }
      }

      delete x.isDeleted
      return {
        ...x,
        clinicPaymentDto: {
          ...x.clinicPaymentDto,
          cancelReason: x.cancelReason,
          isCancelled: x.isCancelled,
        },
      }
    })

    paymentData.forEach((o) => {
      o.clinicPaymentDto.paymentModeFK =
        o.clinicPaymentDto.creditCardId || undefined
      o.clinicPaymentDto.creditCardTypeFK =
        o.clinicPaymentDto.typeId || undefined
    })

    dispatch({
      type: 'podoPayment/upsertPodoPayment',
      payload: {
        purchaseOrderId: values.id,
        paymentData,
      },
    }).then((r) => {
      if (r) {
        if (onConfirm) onConfirm()
        if (r) {
          dispatch({
            type: 'purchaseOrderDetails/queryPurchaseOrder',
            payload: {
              id: props.purchaseOrderDetails.id,
            },
          }).then((v) => {
            dispatch({
              type: 'podoPayment/queryPodoPayment',
              payload: {
                ...v,
              },
            })
          })
        }
      }
    })
  },
})
class index extends PureComponent {
  componentDidMount = () => {
    this.refreshPodoPayment()
  }

  refreshPodoPayment = () => {
    this.props.dispatch({
      type: 'podoPayment/queryPodoPayment',
      payload: this.props.purchaseOrderDetails,
    })
  }

  onClickCancelPayment = () => {
    const { dispatch, values, resetForm, history } = this.props
    resetForm()
    dispatch({
      type: 'purchaseOrderDetails/refresh',
      payload: {
        id: values.id,
      },
    }).then(() => {
      setTimeout(() => this.refreshPodoPayment(), 500)
      history.push('/inventory/pr')
    })
  }

  getTotalPaid = () => {
    const activeRows = this.props.values.purchaseOrderPayment.filter(
      (payment) => !payment.isDeleted,
    )
    return _.sumBy(activeRows, 'paymentAmount') || 0
  }

  render () {
    const {
      purchaseOrderDetails,
      rights,
      values: { currentBizSessionInfo },
      mainDivHeight = 700,
    } = this.props
    const { purchaseOrder: po } = purchaseOrderDetails
    const isWriteOff = po
      ? po.invoiceStatusFK === INVOICE_STATUS.WRITEOFF
      : false
    const hasActiveSession =
      currentBizSessionInfo && currentBizSessionInfo.id > 0

    let height =
      mainDivHeight - 170 - $('.filterBar').height() ||
      0 - $('.footerBar').height() ||
      0
    if (height < 300) height = 300
    return (
      <AuthorizedContext.Provider
        value={{
          rights: isWriteOff === true || !hasActiveSession ? 'disable' : rights,
        }}
      >
        <div className='filterBar'>
          {!hasActiveSession && (
            <div style={{ paddingTop: 5 }}>
              <WarningSnackbar
                variant='warning'
                message='Action(s) is not allowed due to no active session was found.'
              />
            </div>
          )}
          <Header {...this.props} />
        </div>
        <GridContainer>
          <Grid
            {...this.props}
            getTotalPaid={this.getTotalPaid}
            height={height}
          />
        </GridContainer>
        <div style={{ textAlign: 'center' }} className='footerBar'>
          <ProgressButton
            color='danger'
            icon={null}
            onClick={navigateDirtyCheck({
              onProceed: this.onClickCancelPayment,
            })}
          >
            Cancel
          </ProgressButton>
          <ProgressButton onClick={this.props.handleSubmit} />
        </div>
      </AuthorizedContext.Provider>
    )
  }
}

export default withStyles(styles, { withTheme: true })(index)
