import React, { Component } from 'react'
import router from 'umi/router'
// material ui
import Refresh from '@material-ui/icons/Refresh'
import Print from '@material-ui/icons/Print'
// common component
import { Button, GridContainer, GridItem, notification } from '@/components'
import { convertToConsultation } from '@/pages/PatientDashboard/Consultation/utils'
// utils
import { getAppendUrl, navigateDirtyCheck } from '@/utils/utils'
import { widgets } from '@/utils/widgets'
// model
class EditOrder extends Component {
  makePayment = () => {
    const { dispatch, dispense } = this.props
    const { patientInfo } = dispense
    dispatch({
      type: 'dispense/closeDispenseModal',
    })
    const parameters = {
      pid: patientInfo.id,
      md2: 'bill',
    }
    router.push(getAppendUrl(parameters, '/reception/queue'))
    // this.props.history.push(`${location.pathname}/billing`)
  }

  editOrder = () => {
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
      }
    })
  }

  cancelOrder = (e) => {
    navigateDirtyCheck(() => {
      this.props.dispatch({
        type: `dispense/updateState`,
        payload: {
          editingOrder: false,
        },
      })
    })(e)
  }

  signOrder = (values) => {
    const {
      consultationDocument,
      orders,
      dispatch,
      visitRegistration,
    } = this.props
    dispatch({
      type: `consultation/signOrder`,
      payload: convertToConsultation(values, { consultationDocument, orders }),
    }).then((o) => {
      if (o) {
        dispatch({
          type: `dispense/updateState`,
          payload: {
            editingOrder: false,
          },
        })

        dispatch({
          type: `dispense/refresh`,
          payload: visitRegistration.entity.visit.id,
        })
        notification.success({
          message: 'Order signed',
        })
      }
    })
  }

  render () {
    const { classes, dispense, consultation, dispatch } = this.props
    const orderWidget = widgets.find((o) => o.id === '5')
    const cdWidget = widgets.find((o) => o.id === '3')
    const Order = orderWidget.component
    const ConsultationDocument = cdWidget.component

    return (
      <div className={classes.root}>
        <GridContainer>
          <GridItem xs={12} md={6}>
            <h5>Orders</h5>
            <Order className={classes.orderPanel} status={''} />
          </GridItem>
          <GridItem xs={12} md={6}>
            <h5>
              <span style={{ display: 'inline-block' }}>
                Consultation Document
              </span>
              <span className={classes.cdAddButton}>
                {cdWidget.toolbarAddon}
              </span>
            </h5>
            <ConsultationDocument
              forDispense
              parentProps={{
                values: consultation.entity,
              }}
              onCancel={this.cancelOrder}
              onSave={this.signOrder}
            />
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default EditOrder
