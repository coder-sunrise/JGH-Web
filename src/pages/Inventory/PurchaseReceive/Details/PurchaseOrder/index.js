import React, { Component } from 'react'
// import { connect } from 'dva'
import { formatMessage } from 'umi/locale'
import { notification, withFormikExtend, GridContainer, GridItem, Button } from '@/components'
import POForm from './POForm'
import POGrid from './POGrid'
import POSummary from './POSummary'
import { calculateItemLevelAdjustment } from '@/utils/utils'
import { isPOStatusFinalized } from '../../variables'

// @connect(({ purchaseOrderDetails, clinicSettings, clinicInfo }) => ({
//   purchaseOrderDetails,
//   clinicSettings,
//   clinicInfo,
// }))
@withFormikExtend({
  displayName: 'purchaseOrderDetails',
  enableReinitialize: true,
  mapPropsToValues: ({ purchaseOrderDetails }) => {
    return purchaseOrderDetails
  },
})
class index extends Component {
  state = {
    settingGSTEnable: true,
    settingGSTPercentage: 7,
  }

  static getDerivedStateFromProps (props, state) {
    const { clinicSettings } = props
    const { settings } = clinicSettings

    if (settings) {
      if (settings.IsEnableGST !== state.settingGSTEnable &&
        settings.GSTPercentageInt !== state.settingGSTPercentage)
        return {
          ...state,
          settingGSTEnable: !settings.IsEnableGST,
          settingGSTPercentage: settings.GSTPercentageInt,
        }
    }
    return null
  }

  componentDidMount () {
    const { purchaseOrderDetails } = this.props
    const { id, type } = purchaseOrderDetails
    switch (type) {
      // Duplicate order
      case 'dup':
        this.props.dispatch({
          type: 'purchaseOrderDetails/duplicatePurchaseOrder',
          payload: { id, type },
        })
        break
      // Edit order
      case 'edit':
        this.props.dispatch({
          type: 'purchaseOrderDetails/queryPurchaseOrder',
          payload: { id, type },
        })
        break
      // Create new order
      default:
        this.props.dispatch({
          type: 'purchaseOrderDetails/initializePurchaseOrder',
        })
        break
    }
  }

  dummyOnSubmitPO = () => {
    const { dispatch, purchaseOrderDetails, values } = this.props
    const { id, type } = purchaseOrderDetails
    dispatch({
      type: 'purchaseOrderDetails/submitPurchaseOrder',
      payload: values,
    })

    setTimeout(() => this.updateURL(), 1000)
  }

  updateURL = () => {
    // Redirect to parent page 
    // (Only need to POST + wait for 200 --> then push to parent)
    // If: Save Purchase Order Click 
    // If: Cancel Purchase Order Click

    // Redirect to same page 
    // (POST + wait for 200 --> then call model/refresh + remain in same tab)
    // If: Finalize Purchase Order (W/ Finalized notify)
    // If: Save Delivery Order (From popup) 
    // If: Save Payment Clicked

    const { dispatch, history, values } = this.props
    const { location } = history
    const { id, type } = values

    // history.push(`${location.pathname}?id=${id}&type=${type}`)

    history.push('/inventory/pr')

    notification.success({ message: 'Dev: Saved!' })

    // dispatch({
    //   type: 'purchaseOrderDetails/refresh',
    //   payload: { id, type },
    // })
  }

  onPrintClick = () => { }

  showInvoiceAdjustment = () => {
    const { values, dispatch } = this.props
    const { purchaseOrder } = values
    dispatch({
      type: 'global/updateState',
      payload: {
        openAdjustment: true,
        openAdjustmentConfig: {
          showRemark: true,
          defaultValues: {
            initialAmout: purchaseOrder.invoiceTotal,
          },
          callbackConfig: {
            model: 'purchaseOrderDetails',
            reducer: 'addAdjustment',
          },
          callbackMethod: this.calcPurchaseOrderSummary,
        },
      },
    })
  }

  calcPurchaseOrderSummary = () => {
    const { settingGSTEnable, settingGSTPercentage } = this.state
    const { values, setFieldValue } = this.props
    const { rows, purchaseOrderAdjustment, purchaseOrder } = values
    const { IsGSTEnabled, IsGSTInclusive } = purchaseOrder || false
    let tempInvoiceTotal = 0
    let invoiceTotal = 0
    let invoiceGST = 0

    const filteredPurchaseOrderAdjustment = purchaseOrderAdjustment.filter(
      (x) => !x.isDeleted,
    )
    const filteredPurchaseOrderItem = rows.filter((x) => !x.isDeleted)

    // Calculate all unitPrice
    filteredPurchaseOrderItem.map((row) => {
      tempInvoiceTotal += row.totalPrice
      row.tempSubTotal = row.totalPrice
      return null
    })

    // Check is there any adjustment was added
    if (
      filteredPurchaseOrderAdjustment &&
      filteredPurchaseOrderAdjustment.length > 0
    ) {
      // Calculate adjustment for added items
      filteredPurchaseOrderAdjustment.map((adj, adjKey, adjArr) => {
        if (!adj.isDeleted) {
          // Init adjAmount for percentage
          if (adj.adjType === 'Percentage') {
            adj.adjDisplayAmount = 0
          }

          filteredPurchaseOrderItem.map((item) => {
            const itemLevelAmount = calculateItemLevelAdjustment(
              adj.adjType,
              adj.adjValue,
              item.tempSubTotal,
              tempInvoiceTotal,
              settingGSTEnable,
              settingGSTPercentage,
              IsGSTEnabled,
              IsGSTInclusive,
            )

            if (adj.adjType === 'Percentage') {
              item[adj.id] = itemLevelAmount.itemLevelAdjustmentAmount
              item.tempSubTotal += itemLevelAmount.itemLevelAdjustmentAmount
              adj.adjDisplayAmount += itemLevelAmount.itemLevelAdjustmentAmount
            } else {
              item[adj.id] = itemLevelAmount.itemLevelAdjustmentAmount
              item.tempSubTotal += itemLevelAmount.itemLevelAdjustmentAmount
            }

            item.itemLevelGST = itemLevelAmount.itemLevelGSTAmount

            // Sum up all itemLevelGST & invoiceTotal at last iteration
            if (Object.is(adjArr.length - 1, adjKey)) {
              // Calculate item level totalAfterAdjustments & totalAfterGst
              if (IsGSTInclusive) {
                item.totalAfterGst = item.tempSubTotal
                invoiceTotal += item.tempSubTotal
              } else {
                item.totalAfterGst = item.tempSubTotal + item.itemLevelGST
                invoiceTotal += item.itemLevelGST + item.tempSubTotal
              }

              item.totalAfterAdjustments = item.tempSubTotal
              invoiceGST += item.itemLevelGST
            }
            return null
          })
        }
        return null
      })
    } else {
      filteredPurchaseOrderItem.map((item) => {
        if (settingGSTEnable) {
          if (!IsGSTEnabled) {
            item.itemLevelGST = 0
          } else if (IsGSTInclusive) {
            item.itemLevelGST = item.tempSubTotal * (settingGSTPercentage / 107)
          } else {
            item.itemLevelGST = item.tempSubTotal * (settingGSTPercentage / 100)
          }
        } else {
          item.itemLevelGST = 0
        }

        // Calculate item level totalAfterAdjustments & totalAfterGst
        item.totalAfterAdjustments = item.tempSubTotal
        item.totalAfterGst = item.tempSubTotal + item.itemLevelGST

        // Sum up all and display at summary
        invoiceGST += item.itemLevelGST
        invoiceTotal += item.itemLevelGST + item.tempSubTotal
        return null
      })
    }

    setTimeout(() => {
      setFieldValue('purchaseOrder.invoiceGST', invoiceGST)
    }, 1)

    setTimeout(() => {
      setFieldValue('purchaseOrder.invoiceTotal', invoiceTotal)
    }, 1)
  }

  render () {
    const { purchaseOrderDetails } = this.props
    const { purchaseOrder } = purchaseOrderDetails
    const poStatus = (purchaseOrder) ? purchaseOrder.status : ''
    return (
      <div>
        <POForm isPOFinalized={!isPOStatusFinalized(poStatus)} {...this.props} />
        <POGrid
          calcPurchaseOrderSummary={this.calcPurchaseOrderSummary}
          isEditable={!isPOStatusFinalized(poStatus)}
          {...this.props}
        />
        <POSummary
          toggleInvoiceAdjustment={this.showInvoiceAdjustment}
          calcPurchaseOrderSummary={this.calcPurchaseOrderSummary}
          {...this.props}
        />
        <GridContainer direction='row' style={{ marginTop: 20 }}>
          <GridItem xs={4} md={8} />
          <GridItem xs={8} md={4}>
            {!isPOStatusFinalized(poStatus) ? (
              <Button color='danger' onClick={this.dummyOnSubmitPO}>
                {formatMessage({
                  id: 'inventory.pr.detail.pod.cancelpo',
                })}
              </Button>
            ) : (
                ''
              )}
            <Button color='primary' onClick={this.dummyOnSubmitPO}>
              {formatMessage({
                id: 'inventory.pr.detail.pod.save',
              })}
            </Button>
            <Button color='success' onClick={this.dummyOnSubmitPO}>
              {formatMessage({
                id: 'inventory.pr.detail.pod.finalize',
              })}
            </Button>
            <Button color='info' onClick={this.dummyOnSubmitPO}>
              {formatMessage({
                id: 'inventory.pr.detail.print',
              })}
            </Button>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default index
