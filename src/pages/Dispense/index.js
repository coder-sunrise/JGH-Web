import React, { PureComponent } from 'react'
import { connect } from 'dva'
// material ui
import { withStyles } from '@material-ui/core'
// common component
import { GridContainer, SizeContainer, NumberInput } from '@/components'
// sub component
import Banner from '@/pages/PatientDashboard/Banner'
// utils
import { LoadingWrapper } from '@/components/_medisys'
import Main from './Main'
import EditOrder from './EditOrder'
import style from './style'
import { VISIT_TYPE } from '@/utils/constants'
import { getOrdersData } from '@/pages/Consultation/utils'

@connect(
  ({
    dispense,
    visitRegistration,
    consultation,
    consultationDocument,
    orders,
    patient,
    clinicSettings,
    loading,
    forms,
    codetable,
    user,
  }) => ({
    loading,
    dispense,
    visitRegistration,
    consultation,
    consultationDocument,
    orders,
    patient: patient.entity || {},
    clinicSettings,
    forms,
    codetable,
    user,
  }),
)
class Dispense extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { isCodeTableLoaded: false }
    this.getCodeTables()
  }

  componentWillUnmount() {
    const { dispatch } = this.props
    dispatch({
      type: 'orders/reset',
    })
    // reset dispense screen load count
    dispatch({
      type: 'dispense/updateState',
      payload: {
        loadCount: 0,
        shouldRefreshOrder: false,
        entity: null,
      },
    })
  }

  getExtraComponent = () => {
    const { dispense, orders } = this.props
    const { totalWithGST, editingOrder } = dispense

    if (!editingOrder) return null
    let amount = 0
    if (editingOrder) {
      const { summary } = orders
      if (summary) {
        amount = summary.totalWithGST
      }
    } else {
      amount = totalWithGST
    }
    return (
      <GridContainer
        direction='column'
        justify='space-evenly'
        alignItems='center'
      >
        <h4 style={{ position: 'relative', marginTop: 0 }}>
          Total Invoice
          <span>
            &nbsp;:&nbsp;
            <NumberInput text currency value={amount} />
          </span>
        </h4>
      </GridContainer>
    )
  }

  getCodeTables = () => {
    const { dispatch } = this.props
    Promise.all([
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'inventorymedication',
          force: true,
        },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'inventoryvaccination',
          force: true,
        },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'inventoryconsumable',
          force: true,
        },
      }),
      dispatch({
        type: 'codetable/fetchCodes',
        payload: {
          code: 'ctservice',
          force: true,
        },
      }),
    ]).then(r => {
      dispatch({
        type: 'dispense/updateState',
        payload: {
          queryCodeTablesDone: true,
        },
      })
      this.setState({ isCodeTableLoaded: true })
    })
  }

  onSelectPreOrder = (selectPreOrder = []) => {
    const {
      orders,
      dispatch,
      codetable,
      visitRegistration,
      patient,
      user,
      clinicSettings,
      dispense,
    } = this.props
    const { entity } = visitRegistration
    const { visit = {} } = entity
    const { editingOrder } = dispense

    if (!editingOrder && visit.visitPurposeFK === VISIT_TYPE.OTC) {
      dispatch({
        type: 'dispense/updateState',
        payload: {
          openOrderPopUpAfterActualize: true,
          ordersData: getOrdersData({
            selectPreOrder,
            orders,
            codetable,
            visitRegistration,
            patient,
            user,
            clinicSettings,
          }),
        },
      })
    } else {
      dispatch({
        type: 'orders/upsertRows',
        payload: getOrdersData({
          selectPreOrder,
          orders,
          codetable,
          visitRegistration,
          patient,
          user,
          clinicSettings,
        }),
      })
    }
  }

  render() {
    const {
      classes,
      dispense,
      loading,
      patient,
      orders,
      visitRegistration,
    } = this.props
    const { editingOrder } = dispense
    const { rows } = orders
    const { entity = {} } = visitRegistration
    const { visit = {} } = entity

    const draftPreOrderItem = patient?.pendingPreOrderItem?.map(po => {
      const selectPreOrder = rows.find(
        apo => apo.actualizedPreOrderItemFK === po.id,
      )
      if (selectPreOrder) {
        return {
          ...po,
          preOrderItemStatus: selectPreOrder.isDeleted ? 'New' : 'Actualizing',
        }
      }
      return { ...po }
    })

    return (
      <div className={classes.root}>
        <LoadingWrapper loading={loading.models.dispense}>
          <Banner
            from='Dispense'
            editingOrder={
              editingOrder || visit.visitPurposeFK === VISIT_TYPE.OTC
            }
            onSelectPreOrder={this.onSelectPreOrder}
            activePreOrderItems={draftPreOrderItem}
            extraCmt={this.getExtraComponent}
            isRetail={visit.visitPurposeFK === VISIT_TYPE.OTC}
          />
          <SizeContainer size='sm'>
            <React.Fragment>
              {!editingOrder ? (
                <Main
                  {...this.props}
                  isCodeTableLoaded={this.state.isCodeTableLoaded}
                />
              ) : (
                <EditOrder {...this.props} />
              )}
            </React.Fragment>
          </SizeContainer>
        </LoadingWrapper>
      </div>
    )
  }
}

export default withStyles(style, { name: 'DispenseIndex' })(Dispense)
