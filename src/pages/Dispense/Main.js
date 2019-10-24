import React, { Component } from 'react'
import router from 'umi/router'
import { connect } from 'dva'
// material ui
import { withStyles } from '@material-ui/core'
import Refresh from '@material-ui/icons/Refresh'
import Print from '@material-ui/icons/Print'
// common component
import {
  Button,
  GridContainer,
  GridItem,
  withFormikExtend,
  notification,
} from '@/components'
// sub component
// import PatientBanner from './components/PatientBanner'
import PatientBanner from '@/pages/PatientDashboard/Banner'
import DispenseDetails from './DispenseDetails'
import style from './style'
// utils
import {
  getAppendUrl,
  navigateDirtyCheck,
  roundToTwoDecimals,
} from '@/utils/utils'
import Yup from '@/utils/yup'
import Authorized from '@/utils/Authorized'

const reloadDispense = (props, effect = 'query') => {
  const { dispatch, dispense, visitRegistration, resetForm } = props

  dispatch({
    type: `dispense/${effect}`,
    payload: visitRegistration.entity.visit.id,
  }).then((o) => {
    resetForm(o)
    dispatch({
      type: `formik/clean`,
      payload: 'DispensePage',
    })
  })
}
@withFormikExtend({
  authority: 'queue.dispense',
  enableReinitialize: true,
  mapPropsToValues: ({ dispense = {}, clinicSettings }) => {
    const _temp = dispense.entity || dispense.default
    const { settings } = clinicSettings
    const invoiceTotal = roundToTwoDecimals(
      _temp.invoice.invoiceItem.reduce(
        (sum, item) => sum + item.totalAfterItemAdjustment,
        0,
      ),
    )
    let invoiceGSTAmt = 0

    if (settings.isEnableGST) {
      if (_temp.isGSTInclusive) {
        invoiceGSTAmt = roundToTwoDecimals(
          _temp.invoice.invoiceItem.reduce(
            (gstamt, item) =>
              gstamt +
              item.totalAfterOverallAdjustment -
              item.totalAfterOverallAdjustment / (1 + settings.gSTPercentage),
            0,
          ),
        )
      } else {
        invoiceGSTAmt = roundToTwoDecimals(
          invoiceTotal * settings.gSTPercentage,
        )
      }
    }

    const invoiceTotalAftGST = _temp.isGSTInclusive
      ? invoiceTotal
      : roundToTwoDecimals(invoiceGSTAmt + invoiceTotal)
    const outstandingBalance = invoiceTotalAftGST

    return {
      ...(dispense.entity || dispense.default),
      invoice: {
        ...(dispense.entity.invoice || dispense.default.invoice),
        invoiceTotal,
        invoiceGSTAmt,
        invoiceTotalAftGST,
        outstandingBalance,
      },
    }
  },
  validationSchema: Yup.object().shape({
    prescription: Yup.array().of(
      Yup.object().shape({
        batchNo: Yup.string(),
        expiryDate: Yup.date(),
      }),
    ),
  }),
  handleSubmit: (values, { props, ...restProps }) => {
    const { dispatch, onConfirm, codetable, visitRegistration } = props
    const vid = visitRegistration.entity.visit.id
    dispatch({
      type: `dispense/save`,
      payload: {
        id: vid,
        values,
      },
    }).then((o) => {
      if (o) {
        notification.success({
          message: 'Dispense saved',
        })
        reloadDispense({
          ...props,
          ...restProps,
        })
      }
    })
  },
  displayName: 'DispensePage',
})
class Main extends Component {
  makePayment = () => {
    const { dispatch, visitRegistration, values } = this.props

    // dispatch({
    //   type: 'dispense/closeModal',
    //   payload: {
    //     toBillingPage: true,
    //   },
    // })
    dispatch({
      type: 'dispense/finalize',
      payload: {
        id: visitRegistration.entity.visit.id,
        values,
      },
    }).then((response) => {
      if (response) {
        const parameters = {
          md2: 'bill',
        }
        router.push(
          getAppendUrl(parameters, '/reception/queue/patientdashboard'),
        )
      }
    })
  }

  _editOrder = () => {
    const { dispatch, dispense, visitRegistration } = this.props

    dispatch({
      type: `consultation/editOrder`,
      payload: {
        id: visitRegistration.entity.visit.id,
        version: dispense.version,
      },
    }).then((o) => {
      if (o) {
        dispatch({
          type: `dispense/updateState`,
          payload: {
            editingOrder: true,
          },
        })
        reloadDispense(this.props)
      }
    })
  }

  editOrder = (e) => {
    const { handleSubmit } = this.props

    navigateDirtyCheck(this._editOrder, () => {
      handleSubmit()
      this._editOrder()
    })(e)
  }

  render () {
    const { classes, dispense, handleSubmit } = this.props
    console.log({ values: this.props.values })
    return (
      <div className={classes.root}>
        <GridContainer direction='column' className={classes.content}>
          <GridItem justify='flex-end' container>
            <Button
              color='info'
              size='sm'
              onClick={() => {
                reloadDispense(this.props, 'refresh')
              }}
            >
              <Refresh />
              Refresh
            </Button>
            <Button color='primary' size='sm'>
              <Print />
              Print Drug Label
            </Button>
            <Button color='primary' size='sm'>
              <Print />
              Patient Label
            </Button>
          </GridItem>
          <DispenseDetails {...this.props} />
          <GridItem justify='flex-end' container className={classes.footerRow}>
            <Authorized authority='queue.dispense.savedispense'>
              <Button color='success' size='sm' onClick={handleSubmit}>
                Save Dispense
              </Button>
            </Authorized>
            <Authorized authority='queue.dispense.editorder'>
              <Button color='primary' size='sm' onClick={this.editOrder}>
                Edit Order
              </Button>
            </Authorized>
            <Authorized authority='queue.dispense.makepayment'>
              <Button color='primary' size='sm' onClick={this.makePayment}>
                Make Payment
              </Button>
            </Authorized>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default Main
