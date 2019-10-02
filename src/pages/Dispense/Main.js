import React, { Component } from 'react'
import router from 'umi/router'
import { connect } from 'dva'
// material ui
import { withStyles } from '@material-ui/core'
import Refresh from '@material-ui/icons/Refresh'
import Print from '@material-ui/icons/Print'
// common component
import { Button, GridContainer, GridItem, withFormikExtend } from '@/components'
// sub component
// import PatientBanner from './components/PatientBanner'
import PatientBanner from '@/pages/PatientDashboard/Banner'
import DispenseDetails from './DispenseDetails'
import style from './style'
// utils
import { getAppendUrl } from '@/utils/utils'
// model

@withFormikExtend({
  authority: {
    view: 'dispense.view',
    edit: 'dispense.edit',
  },
  mapPropsToValues: ({ dispense = {} }) => {
    return dispense.entity || dispense.default
  },

  handleSubmit: (values, { props }) => {
    const { dispatch, onConfirm, codetable, visitRegistration } = props
    const vid = visitRegistration.entity.visit.id
    console.log(values)
    dispatch({
      type: `dispense/save`,
      payload: {
        id: vid,
        values,
      },
    }).then((o) => {
      if (o) {
        dispatch({
          type: `dispense/refresh`,
          payload: vid,
        })
      }
    })
  },
  displayName: 'DispensePage',
})
class Main extends Component {
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
        this.refresh()
      }
    })
  }

  refresh = () => {
    const { dispatch, dispense, visitRegistration } = this.props

    dispatch({
      type: `dispense/refresh`,
      payload: visitRegistration.entity.visit.id,
    })
  }

  render () {
    const { classes, dispense, handleSubmit } = this.props

    return (
      <div className={classes.root}>
        <GridContainer direction='column' className={classes.content}>
          <GridItem justify='flex-end' container>
            <Button color='info' size='sm' onClick={this.refresh}>
              <Refresh />
              Refresh
            </Button>
            <Button color='primary' size='sm'>
              <Print />
              Print All Label
            </Button>
            <Button color='primary' size='sm'>
              <Print />
              Print Label
            </Button>
          </GridItem>
          <DispenseDetails {...this.props} />
          <GridItem justify='flex-end' container className={classes.footerRow}>
            <Button color='success' size='sm' onClick={handleSubmit}>
              Save Dispense
            </Button>
            <Button color='primary' size='sm' onClick={this.editOrder}>
              Edit Order
            </Button>
            <Button color='primary' size='sm' onClick={this.makePayment}>
              Make Payment
            </Button>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default Main
