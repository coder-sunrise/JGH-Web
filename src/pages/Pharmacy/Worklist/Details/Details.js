import React, { useState } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
import { history } from 'umi'
import { withStyles } from '@material-ui/core'
import { SizeContainer } from '@/components'
import Banner from '@/pages/PatientDashboard/Banner'
import Main from './Main'
import EditOrder from '@/pages/Dispense/EditOrder'
import style from '@/pages/Dispense/style'
import { LoadingWrapper } from '@/components/_medisys'

import { getOrdersData } from '@/pages/Consultation/utils'
import { VISIT_TYPE } from '@/utils/constants'

const styles = theme => ({
  ...style,
  contentPanel: {
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
})

const Details = props => {
  const {
    patient,
    classes,
    pharmacyDetails,
    dispatch,
    loading,
    orders,
    fromModule,
    visitRegistration,
  } = props
  const { entity = {} } = visitRegistration
  const { visit = {} } = entity
  const { rows } = orders

  const [editingOrder, setEditingOrder] = useState(false)
  const closeEditOrder = () => {
    dispatch({
      type: 'pharmacyDetails/query',
      payload: { id: pharmacyDetails.entity.id },
    })
    setEditingOrder(false)
  }
  const banner = document.getElementById('patientBanner')
  const contentHeight = (props.height || 0) - (banner?.offsetHeight || 0)

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

  const onSelectPreOrder = async (selectPreOrder = []) => {
    const {
      orders,
      dispatch,
      codetable,
      visitRegistration,
      patient,
      user,
      clinicSettings,
    } = props
    const { entity = {} } = visitRegistration
    const { visit = {} } = entity
    await props.dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
      },
    })

    if (!editingOrder && visit.visitPurposeFK === VISIT_TYPE.OTC) {
      dispatch({
        type: 'pharmacyDetails/updateState',
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
          editingOrder,
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
      dispatch({
        type: 'pharmacyDetails/updateState',
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
          editingOrder,
        },
      })
    }
  }

  return (
    <div>
      <LoadingWrapper
        loading={loading.models.dispense || loading.models.pharmacyDetails}
      >
        <div style={{ paddingTop: 8, marginTop: -20 }}>
          <Banner
            from='Pharmacy'
            patientInfo={patient}
            editingOrder={
              editingOrder ||
              (visit?.visitPurposeFK !== VISIT_TYPE.MC &&
                pharmacyDetails.entity.statusFK === 1)
            }
            onSelectPreOrder={onSelectPreOrder}
            activePreOrderItems={draftPreOrderItem}
            isRetail={visit?.visitPurposeFK === VISIT_TYPE.OTC}
          />
        </div>
        <div className={classes.contentPanel} style={{ height: contentHeight }}>
          <React.Fragment>
            {!editingOrder ? (
              <Main {...props} setEditingOrder={setEditingOrder} />
            ) : (
              <SizeContainer size='sm'>
                <EditOrder
                  from='Pharmacy'
                  {...props}
                  closeEditOrder={closeEditOrder}
                />
              </SizeContainer>
            )}
          </React.Fragment>
        </div>
      </LoadingWrapper>
    </div>
  )
}

export default compose(
  withStyles(styles),
  connect(
    ({
      patient,
      forms,
      dispense,
      consultation,
      consultationDocument,
      clinicSettings,
      pharmacyDetails,
      orders,
      visitRegistration,
      loading,
      codetable,
      user,
    }) => ({
      patient: patient.entity || {},
      forms,
      dispense,
      consultation,
      consultationDocument,
      clinicSettings,
      pharmacyDetails,
      orders,
      visitRegistration,
      loading,
      codetable,
      user,
    }),
  ),
)(Details)
