import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
import { withStyles } from '@material-ui/core/styles'
import { getAppendUrl, navigateDirtyCheck } from '@/utils/utils'
import DetailPanel from './Detail'
import InventoryTypeListing from './InventoryTypeListing'
import { OrderSetDetailOption } from './variables'
import { AuthorizationWrapper } from '@/components/_medisys'

import {
  NavPills,
  ProgressButton,
  Button,
  withFormikExtend,
  Tabs,
} from '@/components'
import Yup from '@/utils/yup'

const styles = () => ({
  actionDiv: {
    textAlign: 'center',
    marginTop: '22px',
    position: 'sticky',
    bottom: 0,
    width: '100%',
    paddingBottom: 10,
  },
})

const Detail = ({
  classes,
  dispatch,
  orderSetDetail,
  history,
  setFieldValue,
  handleSubmit,
  codetable,
  values,
  ...props
}) => {
  const [
    selectedItem,
    setSelectedItem,
  ] = useState(() => {})

  const [
    serviceCenterServicess,
    setServiceCenterServicess,
  ] = useState(() => [])
  const [
    serviceCenterFK,
    setServiceCenterFK,
  ] = useState(() => {})
  const [
    price,
    setPrice,
  ] = useState(() => undefined)

  // useEffect(() => {
  //   const fetchCodes = async () => {
  //     await podoOrderType.forEach((x) => {
  //       dispatch({
  //         type: 'codetable/fetchCodes',
  //         payload: {
  //           code: x.ctName,
  //         },
  //       }).then((list) => {
  //         const { inventoryItemList } = inventoryItemList(list)
  //         console.log(x.stateName)
  //         switch (x.stateName) {
  //           case 'ConsumableItemList': {
  //             return setConsumableItemList(inventoryItemList)
  //           }
  //           case 'MedicationItemList': {
  //             return setMedicationItemList(inventoryItemList)
  //           }
  //           case 'VaccinationItemList': {
  //             return setVaccinationItemList(inventoryItemList)
  //           }
  //           default: {
  //             return null
  //           }
  //         }
  //       })

  //       dispatch({
  //         type: 'codetable/fetchCodes',
  //         payload: {
  //           code: 'ctservice',
  //         },
  //       }).then((list) => {
  //         const {
  //           services,
  //           serviceCenters,
  //           serviceCenterServices,
  //         } = getServices(list)

  //         setServicess(services)
  //         setServiceCenterss(serviceCenters)
  //         setServiceCenterServicess(serviceCenterServices)
  //       })
  //     })

  //     dispatch({
  //       // force current edit row components to update
  //       type: 'global/updateState',
  //       payload: {
  //         commitCount: (commitCount += 1),
  //       },
  //     })
  //   }
  //   fetchCodes()
  // }, [])

  // const handleItemOnChange = (e) => {
  //   const { option, row } = e
  //   const { sellingPrice } = option
  //   setSelectedItem(option)

  //   return { ...row, unitPrice: sellingPrice }
  // }

  const detailProps = {
    values,
    orderSetDetail,
    dispatch,
    setFieldValue,
    showTransfer: false,
    errors: props.errors,
  }

  const [
    totalPrice,
    setTotalPrice,
  ] = useState(0)

  const typeListingProps = {
    dispatch,
    orderSetDetail,
    setFieldValue,
    values,
    selectedItem,
    setSelectedItem,
    price,
    serviceCenterFK,
    serviceCenterServicess,
    totalPrice,
    setTotalPrice,
    ...props,
  }

  // const [
  //   total,
  //   setTotal,
  // ] = useState(0)
  // const calTotal = () => {
  //   setTotal(0)
  //   medicationOrderSetItem.map((row) => {
  //     return setTotal(total + row.subTotal)
  //   })

  //   serviceOrderSetItem.map((row) => {
  //     return setTotal(total + row.subTotal)
  //   })

  //   consumableOrderSetItem.map((row) => {
  //     return setTotal(total + row.subTotal)
  //   })

  //   vaccinationOrderSetItem.map((row) => {
  //     return setTotal(total + row.subTotal)
  //   })
  // }
  // console.log('orderSetDetail', orderSetDetail)
  return (
    <React.Fragment>
      {/* <NavPills
        color='primary'
        onChange={(event, active) => {
          history.push(
            getAppendUrl({
              t: active,
            }),
          )
        }}
        index={currentTab}
        contentStyle={{ margin: '0 -5px' }}
        tabs={[
          {
            tabButton: 'Details',
            tabContent: <DetailPanel {...detailProps} />,
          },
          {
            tabButton: 'Order Item',
            tabContent: (
              <InventoryTypeListing
                dispatch={dispatch}
                orderSetDetail={orderSetDetail}
                setFieldValue={setFieldValue}
                values={values}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                price={price}
                serviceCenterFK={serviceCenterFK}
                serviceCenterServicess={serviceCenterServicess}
                totalPrice={totalPrice}
                setTotalPrice={setTotalPrice}
                {...props}
              />
            ),
          },
        ]}
      /> */}
      <AuthorizationWrapper authority='inventorymaster.orderset'>
        <Tabs
          style={{ marginTop: 20 }}
          defaultActiveKey='0'
          options={OrderSetDetailOption(detailProps, typeListingProps)}
        />
        <div className={classes.actionDiv}>
          <Button
            color='danger'
            authority='none'
            onClick={navigateDirtyCheck({
              redirectUrl: '/inventory/master?t=3',
            })}
          >
            Close
          </Button>
          <ProgressButton
            submitKey='orderSetDetail/submit'
            onClick={handleSubmit}
          />
        </div>
      </AuthorizationWrapper>
    </React.Fragment>
  )
}
export default compose(
  withStyles(styles, { withTheme: true }),
  connect(({ orderSetDetail, codetable }) => ({
    orderSetDetail,
    codetable,
  })),
  withFormikExtend({
    enableReinitialize: true,
    mapPropsToValues: ({ orderSetDetail }) => {
      const returnValue = orderSetDetail.entity || orderSetDetail.default
      const { serviceOrderSetItem } = returnValue
      let newserviceOrderSetItem = []
      if (serviceOrderSetItem.length > 0) {
        newserviceOrderSetItem = serviceOrderSetItem.map((o) => {
          const { service } = o
          return {
            ...o,
            tempServiceCenterServiceFK: o.serviceCenterServiceFK,
            serviceCenterServiceFK:
              service.ctServiceCenter_ServiceNavigation[0].serviceFK,
            serviceName:
              service.ctServiceCenter_ServiceNavigation[0].serviceCenterFK,
          }
        })
      }
      return {
        ...returnValue,
        serviceOrderSetItem: newserviceOrderSetItem,
      }
    },

    validationSchema: Yup.object().shape({
      code: Yup.string().when('id', {
        is: (id) => !!id,
        then: Yup.string().trim().required(),
      }),
      displayValue: Yup.string().required(),
      effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
    }),

    handleSubmit: (values, { props, resetForm }) => {
      const { dispatch, history, codetable } = props
      const { serviceOrderSetItem } = values

      const newServiceOrderSetArray = serviceOrderSetItem.map((o) => {
        return {
          ...o,
          serviceCenterServiceFK:
            o.tempServiceCenterServiceFK || o.serviceCenterServiceFK,
          // serviceName: o.tempServiceName,
        }
      })
      dispatch({
        type: 'orderSetDetail/upsert',
        payload: {
          ...values,
          effectiveStartDate: values.effectiveDates[0],
          effectiveEndDate: values.effectiveDates[1],
          serviceOrderSetItem: newServiceOrderSetArray,
        },
      }).then((r) => {
        if (r) {
          resetForm()
          history.push('/inventory/master?t=3')
        }
      })
    },

    displayName: 'InventoryOrderSetDetail',
  }),
)(Detail)
