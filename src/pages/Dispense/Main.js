import React, { Component } from 'react'
// common component
import { connect } from 'dva'
import { formatMessage } from 'umi'
import moment from 'moment'
import {
  withFormikExtend,
  notification,
  CommonModal,
  Button,
} from '@/components'
import { calculateAmount, navigateDirtyCheck } from '@/utils/utils'
import Yup from '@/utils/yup'
import { VISIT_TYPE, SYSTEM_LANGUAGE } from '@/utils/constants'
import Authorized from '@/utils/Authorized'
import { openCautionAlertOnStartConsultation } from '@/pages/Widgets/Orders/utils'
import ViewPatientHistory from '@/pages/Consultation/ViewPatientHistory'
import AddOrder from './DispenseDetails/AddOrder'
import DispenseDetails from './DispenseDetails/WebSocketWrapper'
import { DispenseItemsColumnExtensions } from './variables'
import _ from 'lodash'
import patient from '@/models/patient'

const calculateInvoiceAmounts = entity => {
  const obj = { ...entity }
  const output = calculateAmount(
    obj.invoice.invoiceItem,
    obj.invoice.invoiceAdjustment,
    {
      isGSTInclusive: obj.invoice.isGSTInclusive,
      totalField: 'totalAfterItemAdjustment',
      adjustedField: 'totalAfterOverallAdjustment',
      gstField: 'totalAfterGST',
      gstAmtField: 'gstAmount',
      gstValue: obj.invoice.gstValue,
    },
  )
  let invoiceSummary = {}
  if (output && output.summary) {
    const { summary } = output

    invoiceSummary = {
      invoiceTotal: summary.total,
      invoiceTotalAftAdj: summary.totalAfterAdj,
      invoiceTotalAftGST: summary.totalWithGST,
      outstandingBalance: summary.totalWithGST - obj.invoice.totalPayment,
      invoiceGSTAdjustment: summary.gstAdj,
      invoiceGSTAmt: Math.round(summary.gst * 100) / 100,
    }
  }

  return {
    ...obj,
    invoice: {
      ...obj.invoice,
      ...invoiceSummary,
    },
  }
}

const reloadDispense = (props, effect = 'query') => {
  const { dispatch, dispense, resetForm, codetable, clinicSettings } = props
  dispatch({
    type: `dispense/${effect}`,
    payload: dispense.visitID,
  })
}

const constructPayload = values => {
  const getTransaction = item => {
    const {
      stockFK,
      batchNo,
      expiryDate,
      dispenseQuantity,
      uomDisplayValue,
      secondUOMDisplayValue,
    } = item
    return {
      inventoryStockFK: stockFK,
      batchNo,
      expiryDate,
      transactionQty: dispenseQuantity,
      uomDisplayValue,
      secondUOMDisplayValue,
    }
  }

  const updateTempDispenseItem = (items, inventoryFiledName) => {
    return items?.map(m => {
      let tempDispenseItem = []
      if (!m.isPreOrder || (m.isPreOrder && m.isChargeToday)) {
        const matchItem = values.dispenseItems.filter(
          d =>
            d.type === m.type &&
            d.id === m.id &&
            d.dispenseQuantity > 0 &&
            !d.isDispensedByPharmacy,
        )
        if (matchItem.length) {
          matchItem.forEach(item => {
            tempDispenseItem.push({
              ...getTransaction(item),
              inventoryFK: item[inventoryFiledName],
            })
          })
        }
      }
      return {
        ...m,
        tempDispenseItem,
      }
    })
  }

  const _values = {
    ...values,
    prescription: updateTempDispenseItem(
      values.prescription,
      'inventoryMedicationFK',
    ),
    vaccination: updateTempDispenseItem(
      values.vaccination,
      'inventoryVaccinationFK',
    ),
    consumable: updateTempDispenseItem(
      values.consumable,
      'inventoryConsumableFK',
    ),
    dispenseItems: undefined,
    defaultExpandedGroups: undefined,
  }
  return _values
}

const validDispense = (dispenseItems = []) => {
  let isValid = true
  const dispensedItems = dispenseItems.filter(
    d => !d.isPreOrder && d.stockFK && !d.isDispensedByPharmacy,
  )
  for (let index = 0; index < dispensedItems.length; index++) {
    if (
      dispensedItems[index].dispenseQuantity > dispensedItems[index].quantity
    ) {
      notification.error({
        message: 'Dispense quantity cannot be more than orderd quantity.',
      })
      isValid = false
      break
    }

    if (
      !dispensedItems[index].isDefault &&
      dispensedItems[index].dispenseQuantity > dispensedItems[index].stock
    ) {
      notification.error({
        message: 'Dispense quantity cannot be more than stock quantity.',
      })
      isValid = false
      break
    }

    let matchItems = []
    if (dispensedItems[index].isDrugMixture) {
      matchItems = dispenseItems.filter(
        d =>
          d.type === dispensedItems[index].type &&
          dispensedItems[index].isDrugMixture &&
          d.drugMixtureFK === dispensedItems[index].drugMixtureFK,
      )
    } else {
      matchItems = dispenseItems.filter(
        d =>
          d.type === dispensedItems[index].type &&
          d.id === dispensedItems[index].id,
      )
    }

    if (
      dispensedItems[index].quantity !== _.sumBy(matchItems, 'dispenseQuantity')
    ) {
      notification.error({
        message: 'Dispense quantity not equal order quantity.',
      })
      isValid = false
      break
    }

    if (!dispensedItems[index].isDefault) {
      const matchInventoryItems = dispenseItems.filter(
        d =>
          d.type === dispensedItems[index].type &&
          d.stockFK === dispensedItems[index].stockFK,
      )
      if (
        dispensedItems[index].stock <
        _.sumBy(matchInventoryItems, 'dispenseQuantity')
      ) {
        notification.error({
          message: 'Dispense quantity cannot be more than total stock.',
        })
        isValid = false
        break
      }
    }
  }
  return isValid
}

@withFormikExtend({
  authority: 'queue.dispense',
  enableReinitialize: true,
  notDirtyDuration: 3,
  mapPropsToValues: pops => {
    const { dispense = {} } = pops
    let obj = dispense.entity || dispense.default
    const result = calculateInvoiceAmounts(obj)
    return result
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
    const { dispatch, dispense } = props
    if (!validDispense(values.dispenseItems)) return
    const vid = dispense.visitID
    const _values = constructPayload(values)

    dispatch({
      type: `dispense/save`,
      payload: {
        id: vid,
        values: _values,
      },
    }).then(o => {
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
@connect(({ orders, formik, dispense, patient, clinicSettings }) => ({
  orders,
  formik,
  dispense,
  clinicSettings: clinicSettings.settings || clinicSettings.default,
  patient,
}))
class Main extends Component {
  state = {
    showOrderModal: false,
    hasShowOrderModal: false,
    showDrugLabelSelection: false,
    showCautionAlert: false,
    isShowOrderUpdated: false,
    currentDrugToPrint: {},
    packageItem: [],
    dispenseItems: [],
    packageItem: [],
    dispenseItems: [],
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { prescription = [], packageItem = [] } = nextProps.values

    let drugList = []
    prescription.forEach(item => {
      drugList.push(item)
    })
    packageItem.forEach(item => {
      if (item.type === 'Medication') {
        drugList.push({
          ...item,
          name: item.description,
          dispensedQuanity: item.packageConsumeQuantity,
        })
      }
    })

    this.setState(() => {
      return {
        selectedDrugs: drugList.map(x => {
          return { ...x, no: 1, selected: true }
        }),
      }
    })
  }

  componentWillUnmount = () => {
    this.props.dispatch({
      type: `dispense/updateState`,
      payload: {
        queryCodeTablesDone: false,
      },
    })
  }
  componentDidMount = async () => {
    const {
      dispatch,
      values,
      dispense,
      clinicSettings,
      visitRegistration,
    } = this.props

    const { entity = {} } = visitRegistration
    const { visit = {} } = entity
    dispatch({
      type: 'dispense/incrementLoadCount',
    })
    const { otherOrder = [], prescription = [], packageItem = [] } = values
    const isEmptyDispense = otherOrder.length === 0 && prescription.length === 0

    // set default language based on patient tranlsation and clinic setting.
    const preferLanguage =
      (patient && patient.translationLinkFK) === 5
        ? SYSTEM_LANGUAGE.SECONDLANGUAGE
        : clinicSettings.primaryPrintoutLanguage
    this.setState({ selectedLanguage: [preferLanguage] })
  }

  makePayment = async (voidPayment = false, voidReason = '') => {
    const { dispatch, dispense, values } = this.props
    if (!validDispense(values.dispenseItems)) return false
    const _values = constructPayload(values)
    const finalizeResponse = await dispatch({
      type: 'dispense/finalize',
      payload: {
        id: dispense.visitID,
        values: {
          ..._values,
          voidPayment,
          voidReason,
        },
      },
    })
    if (finalizeResponse === 204) {
      return true
    }
    return false
  }

  _editOrder = () => {
    const { dispatch, dispense, values, history } = this.props
    const { location } = history
    const { query } = location
    const { visitPurposeFK } = values
    const addOrderList = [VISIT_TYPE.OTC]
    const shouldShowAddOrderModal = addOrderList.includes(visitPurposeFK)

    if (shouldShowAddOrderModal) {
      this.handleOrderModal()
    }
    if (visitPurposeFK !== VISIT_TYPE.OTC) {
      dispatch({
        type: `consultation/editOrder`,
        payload: {
          id: values.id,
          queueID: query.qid,
          version: dispense.version,
        },
      }).then(o => {
        if (o) {
          dispatch({
            type: `dispense/updateState`,
            payload: {
              editingOrder: !shouldShowAddOrderModal,
            },
          })
          reloadDispense(this.props)

          if (this.state.showCautionAlert) {
            this.setState({ showCautionAlert: false })
            openCautionAlertOnStartConsultation(o)
          }
        }
      })
    }
  }

  editOrder = e => {
    const { values } = this.props
    const { visitPurposeFK } = values

    if (visitPurposeFK === VISIT_TYPE.OTC) {
      this._editOrder()
    } else {
      navigateDirtyCheck({
        onProceed: this._editOrder,
      })(e)
    }
  }

  actualizeEditOrder = () => {
    const { dispatch, values, dispense, orders } = this.props
    this.setState(
      prevState => {
        return {
          showOrderModal: !prevState.showOrderModal,
          isFirstAddOrder: false,
        }
      },
      () => {
        this.openFirstTabAddOrder()
      },
    )
  }

  openFirstTabAddOrder = () => {
    const { dispatch, values } = this.props
    if (this.state.showOrderModal) {
      dispatch({
        type: 'orders/updateState',
        payload: {
          type: '1',
          visitPurposeFK: values.visitPurposeFK,
        },
      })
    } else {
      dispatch({
        type: 'orders/updateState',
        payload: {
          visitPurposeFK: values.visitPurposeFK,
        },
      })
    }
  }

  handleOrderModal = () => {
    this.props.dispatch({
      type: 'orders/reset',
    })

    this.setState(
      prevState => {
        return {
          showOrderModal: !prevState.showOrderModal,
          isFirstAddOrder: false,
        }
      },
      () => {
        this.openFirstTabAddOrder()
      },
    )
  }

  handleReloadClick = () => {
    reloadDispense(this.props, 'refresh')
  }

  showConfirmationBox = () => {
    const { dispatch, history } = this.props
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: formatMessage({
          id: 'app.general.leave-without-save',
        }),
        onConfirmSave: () => {
          history.push({
            pathname: history.location.pathname,
            query: {
              ...history.location.query,
              isInitialLoading: false,
            },
          })
          this.handleOrderModal()
        },
      },
    })
  }

  handleCloseAddOrder = () => {
    const {
      dispatch,
      consultation,
      values,
      orders: { rows },
      formik,
    } = this.props
    const { visitPurposeFK } = values
    const newOrderRows = rows.filter(row => !row.id && !row.isDeleted)

    if (
      (formik.OrderPage && !formik.OrderPage.dirty) ||
      newOrderRows.length > 0
    )
      this.showConfirmationBox()
    else if (
      visitPurposeFK === VISIT_TYPE.BF ||
      visitPurposeFK === VISIT_TYPE.MC
    ) {
      dispatch({
        type: 'consultation/discard',
        payload: {
          id: consultation.entity.id,
        },
      }).then(response => {
        dispatch({
          type: 'dispense/query',
          payload: {
            id: values.id,
            version: Date.now(),
          },
        })
        if (response) this.handleOrderModal()
      })
    } else {
      this.handleOrderModal()
    }
  }
  // click Drug Label button to show drug label selection
  handleDrugLabelClick = row => {
    this.setState({ currentDrugToPrint: row })
    this.setState(prevState => {
      return {
        showDrugLabelSelection: !prevState.showDrugLabelSelection,
      }
    })
  }
  handleDrugLabelSelectionClose = () => {
    this.setState(prevState => {
      return {
        showDrugLabelSelection: !prevState.showDrugLabelSelection,
      }
    })
  }

  showRefreshOrder = () => {
    const { dispense } = this.props
    const { shouldRefreshOrder } = dispense
    if (shouldRefreshOrder) {
      if (!this.state.isShowOrderUpdated) {
        this.props.dispatch({
          type: 'global/updateState',
          payload: {
            openAdjustment: false,
          },
        })
        this.setState({
          isShowOrderUpdated: true,
          showDrugLabelSelection: false,
        })
      }
    }
  }

  checkExpiredItems = () => {
    if (
      (this.props.values.dispenseItems || []).find(
        item =>
          item.expiryDate &&
          moment(item.expiryDate).startOf('day') < moment().startOf('day'),
      )
    ) {
      return true
    }
    return false
  }

  checkOTCAddOrder = () => {
    const {
      dispatch,
      values,
      dispense,
      clinicSettings,
      visitRegistration,
    } = this.props
    if (this.state.hasShowOrderModal || !dispense.queryCodeTablesDone) {
      return
    }
    const { entity = {} } = visitRegistration
    const { visit = {} } = entity
    const { service = [], prescription = [], consumable = [] } = values
    const isEmptyDispense =
      service.length === 0 &&
      prescription.length === 0 &&
      consumable.length === 0
    const noClinicalObjectRecord = !values.clinicalObjectRecordFK
    if (visit.visitPurposeFK === VISIT_TYPE.OTC && isEmptyDispense) {
      this.setState(
        prevState => {
          return {
            showOrderModal: !prevState.showOrderModal,
            hasShowOrderModal: true,
            isFirstAddOrder: true,
          }
        },
        () => {
          this.openFirstTabAddOrder()
        },
      )
    }
  }

  checkBillFirstAndMC = () => {
    const {
      dispatch,
      values,
      dispense,
      clinicSettings,
      visitRegistration,
    } = this.props
    if (!dispense.queryCodeTablesDone || this.state.hasShowOrderModal) {
      return
    }

    const { entity = {} } = visitRegistration
    const { visit = {} } = entity
    const {
      service = [],
      prescription = [],
      consumable = [],
      vaccination = [],
      packageItem = [],
    } = values
    const isEmptyDispense =
      service.length === 0 &&
      prescription.length === 0 &&
      consumable.length === 0 &&
      vaccination.length === 0
    const accessRights = Authorized.check('queue.dispense.editorder')
    const noClinicalObjectRecord = !values.clinicalObjectRecordFK
    if (
      accessRights &&
      accessRights.rights !== 'hidden' &&
      (visit.visitPurposeFK === VISIT_TYPE.BF ||
        visit.visitPurposeFK === VISIT_TYPE.MC) &&
      isEmptyDispense &&
      noClinicalObjectRecord
    ) {
      this.setState(
        prevState => {
          return {
            showCautionAlert: !prevState.showCautionAlert,
            hasShowOrderModal: true,
          }
        },
        () => {
          this.editOrder()
          dispatch({
            type: 'dispense/incrementLoadCount',
          })
        },
      )
    }

    let drugList = []
    prescription.forEach(item => {
      drugList.push(item)
    })
    packageItem.forEach(item => {
      if (item.type === 'Medication') {
        drugList.push({
          ...item,
          name: item.description,
          dispensedQuanity: item.packageConsumeQuantity,
        })
      }
    })
    if (dispense.loadCount === 0) {
      this.setState(() => {
        return {
          selectedDrugs: drugList.map(x => {
            return { ...x, no: 1, selected: true }
          }),
        }
      })
      dispatch({
        type: 'dispense/incrementLoadCount',
      })
    }
  }
  render() {
    this.checkOTCAddOrder()
    this.checkBillFirstAndMC()
    const {
      classes,
      handleSubmit,
      values,
      dispense,
      codetable,
      isActualizeInRetail,
      testProps,
    } = this.props

    if (dispense.openOrderPopUpAfterActualize) {
      this.actualizeEditOrder()
      dispense.openOrderPopUpAfterActualize = false
    }
    return (
      <div className={classes.root}>
        <DispenseDetails
          {...this.props}
          onSaveClick={handleSubmit}
          onEditOrderClick={this.editOrder}
          onFinalizeClick={this.makePayment}
          onReloadClick={this.handleReloadClick}
          onDrugLabelClick={this.handleDrugLabelClick}
          onLabLabelClick={this.handleLabLabelClick}
          showDrugLabelSelection={this.state.showDrugLabelSelection}
          onDrugLabelSelectionClose={this.handleDrugLabelSelectionClose}
          currentDrugToPrint={this.state.currentDrugToPrint}
          isIncludeExpiredItem={this.checkExpiredItems()}
        />
        <CommonModal
          title='Orders'
          open={this.state.showOrderModal && dispense.queryCodeTablesDone}
          onClose={this.handleCloseAddOrder}
          onConfirm={this.handleOrderModal}
          maxWidth='md'
          observe='OrderPage'
        >
          <AddOrder
            visitType={
              this.props.visitRegistration?.entity?.visit?.visitPurposeFK
            }
            visitRegistration={this.props.visitRegistration}
            isFirstLoad={this.state.isFirstAddOrder}
            onReloadClick={() => {
              reloadDispense(this.props)
            }}
            {...this.props}
          />
        </CommonModal>
        <ViewPatientHistory top='213px' />

        <CommonModal
          title='Orders Updated'
          maxWidth='sm'
          open={this.state.isShowOrderUpdated}
          showFooter={false}
        >
          <div
            style={{
              marginLeft: 20,
              marginRight: 20,
            }}
          >
            <div
              style={{
                marginTop: -20,
              }}
            >
              <h3>
                Orders has been updated by other user. Click OK to refresh
                orders.
              </h3>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Button
                color='primary'
                icon={null}
                onClick={() => {
                  const { dispatch } = this.props
                  dispatch({
                    type: 'dispense/updateState',
                    payload: {
                      shouldRefreshOrder: false,
                    },
                  })
                  this.setState({ isShowOrderUpdated: false })
                  if (this.handleReloadClick) {
                    this.handleReloadClick()
                  }
                }}
              >
                ok
              </Button>
            </div>
          </div>
        </CommonModal>
        {this.showRefreshOrder()}
      </div>
    )
  }
}

export default Main
