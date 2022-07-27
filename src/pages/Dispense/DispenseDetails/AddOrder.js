import React, { useEffect } from 'react'
import { withStyles } from '@material-ui/core/styles'
import _ from 'lodash'
import { connect } from 'dva'
import { compose } from 'redux'
import moment from 'moment'
import { SizeContainer, withFormikExtend } from '@/components'
import { convertToConsultation } from '@/pages/Consultation/utils'
import { sendNotification } from '@/utils/realtime'
import {
  VISIT_TYPE,
  INVOICE_ITEM_TYPE_BY_NAME,
  ORDER_TYPE_TAB,
  CLINIC_TYPE,
  REVENUE_CATEGORY,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  RADIOLOGY_CATEGORY,
  LAB_CATEGORY,
} from '@/utils/constants'
import { roundTo, getUniqueId } from '@/utils/utils'
import { isPharmacyOrderUpdated } from '@/pages/Consultation/utils'
import {
  getRetailCautionAlertContent,
  getCautionAlertContent,
} from '@/pages/Widgets/Orders/utils'
import Order from '../../Widgets/Orders'

const styles = () => ({})

const AddOrder = ({
  footer,
  handleSubmit,
  dispatch,
  dispense,
  height,
  codetable: {
    ctservice = [],
    inventoryconsumable = [],
    inventorymedication = [],
    inventoryvaccination = [],
  },
  visitType,
  location,
  clinicInfo,
  isFirstLoad,
  visitRegistration,
}) => {
  const displayExistingOrders = async id => {
    const r = await dispatch({
      type: 'dispense/queryAddOrderDetails',
      payload: {
        invoiceId: id,
        isInitialLoading: location?.query?.isInitialLoading,
      },
    })

    if (r) {
      const {
        retailInvoiceAdjustment,
        retailInvoiceItem,
        drugAllergies = [],
      } = r
      const mapRetailItemPropertyToOrderProperty = o => {
        let obj
        switch (o.invoiceItemTypeFK) {
          case INVOICE_ITEM_TYPE_BY_NAME.MEDICATION: {
            const {
              retailPrescriptionItemInstruction,
              retailPrescriptionItemPrecaution,
              ...restValues
            } = o.retailVisitInvoiceDrug.retailPrescriptionItem

            let medicationItem
            if (o.retailVisitInvoiceDrug.inventoryMedicationFK) {
              medicationItem = inventorymedication.find(
                medication =>
                  medication.id ===
                    o.retailVisitInvoiceDrug.inventoryMedicationFK &&
                  medication.isActive,
              )
            } else {
              // for open prescription item
              medicationItem = {}
            }

            obj = {
              type:
                o.retailVisitInvoiceDrug.inventoryMedicationFK ||
                o.retailVisitInvoiceDrug.retailPrescriptionItem.isDrugMixture
                  ? o.invoiceItemTypeFK.toString()
                  : ORDER_TYPE_TAB.OPENPRESCRIPTION,
              ...o.retailVisitInvoiceDrug,
              innerLayerId: o.retailVisitInvoiceDrug.id,
              innerLayerConcurrencyToken:
                o.retailVisitInvoiceDrug.concurrencyToken,
              ...restValues,
              corPrescriptionItemInstruction: o.retailVisitInvoiceDrug.retailPrescriptionItem.retailPrescriptionItemInstruction.map(
                instruction => {
                  return {
                    ...instruction,
                    stepdose: instruction.stepdose || 'AND',
                    uid: getUniqueId(),
                  }
                },
              ),
              corPrescriptionItemPrecaution: retailPrescriptionItemPrecaution.map(
                pp => {
                  return {
                    ...pp,
                    uid: getUniqueId(),
                  }
                },
              ),
              corPrescriptionItemDrugMixture:
                o.retailVisitInvoiceDrug.retailPrescriptionItem
                  .retailPrescriptionItemDrugMixture,
              isActive: !!medicationItem,
              _itemId: medicationItem?.id,
              _itemType: INVOICE_ITEM_TYPE_BY_NAME.MEDICATION,
              _caution: medicationItem?.caution,
            }
            break
          }

          case INVOICE_ITEM_TYPE_BY_NAME.SERVICE: {
            const serviceItem = ctservice.find(
              service =>
                service.serviceCenter_ServiceId ===
                o.retailVisitInvoiceService.serviceCenterServiceFK,
            )
            obj = {
              type: ORDER_TYPE_TAB.SERVICE,
              serviceFK: serviceItem?.serviceId,
              serviceCenterFK: serviceItem?.serviceCenterId,
              innerLayerId: o.retailVisitInvoiceService.id,
              innerLayerConcurrencyToken:
                o.retailVisitInvoiceService.concurrencyToken,
              ...o.retailVisitInvoiceService,
              ...o.retailVisitInvoiceService.retailService,
              isActive: serviceItem?.isActive,
              serviceCenterCategoryFK: serviceItem.serviceCenterCategoryFK,
            }
            break
          }

          case INVOICE_ITEM_TYPE_BY_NAME.CONSUMABLE: {
            const consumableItem = inventoryconsumable.find(
              consumable =>
                consumable.id ===
                  o.retailVisitInvoiceConsumable.inventoryConsumableFK &&
                consumable.isActive,
            )
            obj = {
              type: ORDER_TYPE_TAB.CONSUMABLE,
              innerLayerId: o.retailVisitInvoiceConsumable.id,
              innerLayerConcurrencyToken:
                o.retailVisitInvoiceConsumable.concurrencyToken,
              ...o.retailVisitInvoiceConsumable,
              ...o.retailVisitInvoiceConsumable.retailConsumable,
              isActive: !!consumableItem,
            }
            break
          }
          case INVOICE_ITEM_TYPE_BY_NAME.VACCINATION: {
            const vaccinationItem = inventoryvaccination.find(
              v => v.displayValue === o.itemName && v.isActive,
            )
            obj = {
              type: ORDER_TYPE_TAB.VACCINATION,
              _itemId: vaccinationItem?.id,
              _itemType: INVOICE_ITEM_TYPE_BY_NAME.VACCINATION,
              _caution: vaccinationItem?.caution,
            }
            break
          }
          default: {
            break
          }
        }

        return {
          outerLayerId: o.id,
          outerLayerConcurrencyToken: o.concurrencyToken,
          subject: o.itemName,
          uid: o.id,
          revenueCategoryFK: o.revenueCategoryFK,
          ...obj,
          adjAmt: o.adjAmt,
          adjAmount: o.adjAmt,
          adjType: o.adjType,
          adjValue: o.adjValue,
          gstAmount: o.gstAmount,
          totalAfterGST: o.totalAfterGST,
          totalAfterItemAdjustment: o.totalAfterItemAdjustment,
          totalAfterOverallAdjustment: o.totalAfterOverallAdjustment,
        }
      }

      const assignRetailAdjustmentIdToOrderAdjustmentUid = o => {
        return {
          ...o,
          uid: getUniqueId(),
        }
      }

      const newRows = retailInvoiceItem.map(
        mapRetailItemPropertyToOrderProperty,
      )

      const newRetailInvoiceAdjustment = retailInvoiceAdjustment.map(
        assignRetailAdjustmentIdToOrderAdjustmentUid,
      )

      const { clinicTypeFK = CLINIC_TYPE.GP } = clinicInfo
      const removeItems =
        clinicTypeFK === CLINIC_TYPE.GP
          ? newRows.filter(
              row =>
                row.type === ORDER_TYPE_TAB.VACCINATION ||
                (row.type === ORDER_TYPE_TAB.SERVICE &&
                  (LAB_CATEGORY.indexOf(row.serviceCenterCategoryFK) >= 0 ||
                    RADIOLOGY_CATEGORY.indexOf(row.serviceCenterCategoryFK) >=
                      0)),
            )
          : []

      const cuationItems = []
      if (isFirstLoad) {
        newRows
          .filter(f => f._itemId && f._caution && f._caution.trim().length > 0)
          .map(m => {
            const existItem = cuationItems.find(
              c => c.id === m._itemId && c.type === m._itemType,
            )
            if (!existItem) {
              cuationItems.push({
                id: m._itemId,
                type: m._itemType,
                subject: m.subject,
                caution: m._caution,
              })
            }
          })

        if (removeItems.length || cuationItems.length || drugAllergies.length) {
          dispatch({
            type: 'global/updateAppState',
            payload: {
              openConfirm: true,
              customWidth: 'md',
              openConfirmContent: getCautionAlertContent(
                cuationItems.map(x => {
                  return {
                    ...x,
                    type: x.type === 1 ? 'Medication' : 'Vaccination',
                  }
                }),
                drugAllergies,
                removeItems,
              ),
              alignContent: 'left',
              isInformType: true,
              onConfirmSave: () => {},
            },
          })
        }
      }

      const activeRows = newRows
        .filter(
          row =>
            row.type !== ORDER_TYPE_TAB.VACCINATION &&
            (row.type !== ORDER_TYPE_TAB.SERVICE ||
              (LAB_CATEGORY.indexOf(row.serviceCenterCategoryFK) < 0 &&
                RADIOLOGY_CATEGORY.indexOf(row.serviceCenterCategoryFK) < 0)),
        )
        .map(row => {
          return {
            ...row,
            uid: getUniqueId(),
          }
        })
      dispatch({
        type: 'orders/updateState',
        payload: {
          rows: activeRows,
          _originalRows: activeRows.map(r => ({ ...r })),
          finalAdjustments: newRetailInvoiceAdjustment,
          isGSTInclusive: r.isGSTInclusive,
          gstValue: r.gstValue,
        },
      })

      dispatch({
        type: 'orders/calculateAmount',
        payload: {
          isGSTInclusive: r.isGSTInclusive,
          gstValue: r.gstValue,
        },
      })
    }
    if (dispense.ordersData) {
      dispatch({
        type: 'orders/upsertRows',
        payload: dispense.ordersData,
      })
      dispatch({
        type: 'dispense/updateState',
        payload: { ordersData: undefined },
      })
    }
  }
  useEffect(() => {
    const { entity } = dispense
    const { invoice } = entity || {}
    if (visitType === VISIT_TYPE.OTC && invoice) {
      displayExistingOrders(invoice.id)
    }
  }, [])
  return (
    <React.Fragment>
      <SizeContainer size='sm'>
        <div style={{ maxHeight: height - 128, overflow: 'auto' }}>
          <Order
            visitRegistration={visitRegistration}
            fromDispense={visitType === VISIT_TYPE.OTC}
            from='AddOrder'
          />
        </div>
      </SizeContainer>
      {footer &&
        footer({
          onConfirm: handleSubmit,
          confirmBtnText: 'Save',
          confirmProps: {
            disabled: false,
          },
        })}
    </React.Fragment>
  )
}
export default compose(
  withStyles(styles, { withTheme: true }),
  connect(
    ({
      dispense,
      orders,
      codetable,
      consultation,
      clinicInfo,
      forms,
      clinicSettings,
      user,
    }) => ({
      dispense,
      orders,
      consultation,
      codetable,
      clinicInfo,
      forms,
      clinicSettings: clinicSettings.settings || clinicSettings.default,
      user,
    }),
  ),
  withFormikExtend({
    handleSubmit: (values, { props }) => {
      const {
        dispatch,
        consultation,
        orders,
        onConfirm,
        dispense,
        onReloadClick,
        codetable: { inventoryconsumable, inventorymedication, ctservice },
        visitType,
        history,
        forms,
        clinicSettings,
        user,
      } = props
      const { rows, summary, finalAdjustments } = orders
      const { addOrderDetails } = dispense
      const { isEnablePharmacyModule } = clinicSettings
      if (visitType === VISIT_TYPE.OTC) {
        const removeIdAndConcurrencyTokenForNewPrecautionsOrInstructions = existingIDArray => instructionOrPrecaution => {
          if (existingIDArray.includes(instructionOrPrecaution.id)) {
            return {
              ...instructionOrPrecaution,
            }
          }

          return {
            ...instructionOrPrecaution,
            id: undefined,
            concurrencyToken: undefined,
          }
        }

        const setIsDeletedIfWholeItemIsDeleted = (o, itemIsDeleted) => {
          if (o.isDeleted) return o

          return {
            ...o,
            isDeleted: itemIsDeleted,
          }
        }

        const medicationPrecautionsArray = (
          corPrescriptionItemPrecaution,
          retailPrescriptionItemPrecaution,
          itemIsDeleted,
        ) => {
          const combinedOldNewPrecautions = _.intersectionWith(
            corPrescriptionItemPrecaution,
            retailPrescriptionItemPrecaution,
            _.isEqual,
          )

          const newAddedPrecautions = _.differenceWith(
            corPrescriptionItemPrecaution,
            combinedOldNewPrecautions,
            _.isEqual,
          )

          const precautionsIDArray = retailPrescriptionItemPrecaution.map(
            precaution => precaution.id,
          )

          const formatNewAddedPrecautions = newAddedPrecautions.map(
            removeIdAndConcurrencyTokenForNewPrecautionsOrInstructions(
              precautionsIDArray,
            ),
          )

          const returnedPrecautionsArray = [
            ...combinedOldNewPrecautions,
            ...formatNewAddedPrecautions,
          ].map(o => setIsDeletedIfWholeItemIsDeleted(o, itemIsDeleted))

          return returnedPrecautionsArray
        }

        const medicationInstructionsArray = (
          corPrescriptionItemInstruction,
          retailPrescriptionItemInstruction,
          itemIsDeleted,
        ) => {
          const combinedOldNewInstructions = _.intersectionWith(
            corPrescriptionItemInstruction,
            retailPrescriptionItemInstruction,
            _.isEqual,
          )

          const newAddedInstructions = _.differenceWith(
            corPrescriptionItemInstruction,
            retailPrescriptionItemInstruction,
            _.isEqual,
          )

          const instructionIDArray = retailPrescriptionItemInstruction.map(
            instruction => instruction.id,
          )

          const formatNewAddedInstructions = newAddedInstructions.map(
            removeIdAndConcurrencyTokenForNewPrecautionsOrInstructions(
              instructionIDArray,
            ),
          )

          const returnedInstructionsArray = [
            ...combinedOldNewInstructions,
            ...formatNewAddedInstructions,
          ].map(o => setIsDeletedIfWholeItemIsDeleted(o, itemIsDeleted))

          return returnedInstructionsArray
        }

        const medicationDrugMixturesArray = (
          corPrescriptionItemDrugMixture,
          retailPrescriptionItemDrugMixture,
          itemIsDeleted,
        ) => {
          const combinedOldNewDrugMixtures = _.intersectionWith(
            corPrescriptionItemDrugMixture,
            retailPrescriptionItemDrugMixture,
            _.isEqual,
          )

          const newAddedDrugMixtures = _.differenceWith(
            corPrescriptionItemDrugMixture,
            combinedOldNewDrugMixtures,
            _.isEqual,
          )

          const drugMixturesIDArray = retailPrescriptionItemDrugMixture.map(
            drugMixture => drugMixture.id,
          )

          const formatNewAddedDrugMixtures = newAddedDrugMixtures.map(
            removeIdAndConcurrencyTokenForNewPrecautionsOrInstructions(
              drugMixturesIDArray,
            ),
          )

          const returnedDrugMixturesArray = [
            ...combinedOldNewDrugMixtures,
            ...formatNewAddedDrugMixtures,
          ].map(o => setIsDeletedIfWholeItemIsDeleted(o, itemIsDeleted))

          return returnedDrugMixturesArray
        }

        const getDrugMixtureRevenueCategory = corPrescriptionItemDrugMixture => {
          let revenueCategoryId = REVENUE_CATEGORY.OTHER
          const activeDrugMixtureItems = corPrescriptionItemDrugMixture.filter(
            item => !item.isDeleted,
          )

          if (activeDrugMixtureItems.length > 0)
            revenueCategoryId = activeDrugMixtureItems[0].revenueCategoryFK

          return revenueCategoryId
        }

        const mapRetailItemPropertyToApi = o => {
          let obj
          switch (o.type) {
            case ORDER_TYPE_TAB.MEDICATION:
            case ORDER_TYPE_TAB.OPENPRESCRIPTION: {
              let revenueCategory
              const medication = inventorymedication.find(
                c => c.id === o.inventoryMedicationFK,
              )
              revenueCategory = medication
                ? { id: medication.revenueCategoryFK }
                : { id: REVENUE_CATEGORY.OTHER }
              const {
                corPrescriptionItemInstruction,
                corPrescriptionItemPrecaution,
                corPrescriptionItemDrugMixture,
                retailPrescriptionItem = {},
                ...restO
              } = o
              const {
                retailPrescriptionItemInstruction = [],
                retailPrescriptionItemPrecaution = [],
                retailPrescriptionItemDrugMixture = [],
              } = retailPrescriptionItem
              let actualUnitPrice = o.unitPrice
              if (_.round(o.unitPrice * o.quantity, 2) !== o.totalPrice) {
                actualUnitPrice = _.round(o.totalPrice / o.quantity, 2)
              }
              actualUnitPrice = actualUnitPrice || 0
              obj = {
                adjType: o.adjType,
                adjValue: o.adjValue,
                itemCode: o.drugCode,
                itemName: o.drugName,
                invoiceItemTypeFK: INVOICE_ITEM_TYPE_BY_NAME.MEDICATION,
                unitPrice: o.isDrugMixture
                  ? _.round((o.totalPrice || 0) / (o.quantity || 1), 2) || 0
                  : actualUnitPrice,
                quantity: o.quantity,
                subTotal: roundTo(o.totalPrice),
                itemRevenueCategoryFK: o.isDrugMixture
                  ? getDrugMixtureRevenueCategory(
                      o.corPrescriptionItemDrugMixture,
                    )
                  : revenueCategory.id,
                // "adjType": "string",
                // "adjValue": 0,
                isDrugMixture: o.isDrugMixture,
                isClaimable: o.isDrugMixture ? o.isClaimable : true,
                isDispensedByPharmacy: o.isDispensedByPharmacy,
                isNurseActualizeRequired: o.isNurseActualizeRequired,
                retailVisitInvoiceDrug: {
                  id: o.innerLayerId,
                  concurrencyToken: o.innerLayerConcurrencyToken,
                  inventoryMedicationFK: o.inventoryMedicationFK,
                  expiryDate: o.expiryDate,
                  batchNo: o.batchNo,
                  dispensedQuanity: o.dispensedQuanity,
                  isDeleted: o.isDeleted,
                  drugLabelRemarks: o.drugLabelRemarks,
                  isExclusive: o.isExclusive,
                  visitOrderTemplateItemFK: o.visitOrderTemplateItemFK,
                  retailPrescriptionItem: {
                    ...restO,
                    drugName: o.drugName,
                    isDeleted: o.isDeleted,
                    unitPrice: roundTo(o.totalPrice / o.quantity) || 0,
                    retailPrescriptionItemInstruction: medicationInstructionsArray(
                      corPrescriptionItemInstruction,
                      retailPrescriptionItemInstruction,
                      o.isDeleted,
                    ),
                    retailPrescriptionItemPrecaution: medicationPrecautionsArray(
                      corPrescriptionItemPrecaution,
                      retailPrescriptionItemPrecaution,
                      o.isDeleted,
                    ),
                    retailPrescriptionItemDrugMixture: medicationDrugMixturesArray(
                      corPrescriptionItemDrugMixture,
                      retailPrescriptionItemDrugMixture,
                      o.isDeleted,
                    ),
                  },
                },
              }

              break
            }
            case ORDER_TYPE_TAB.SERVICE: {
              const { retailService, ...restValues } = o
              const { revenueCategoryFK } = ctservice.find(
                c => c.serviceCenter_ServiceId === o.serviceCenterServiceFK,
              )
              obj = {
                adjType: o.adjType,
                adjValue: o.adjValue,
                itemCode: o.serviceCode,
                itemName:
                  o.newServiceName && o.newServiceName.trim() !== ''
                    ? o.newServiceName
                    : o.serviceName,
                subTotal: roundTo(o.total),
                invoiceItemTypeFK: INVOICE_ITEM_TYPE_BY_NAME.SERVICE,
                unitPrice: roundTo(o.total) || 0,
                quantity: o.quantity,
                itemRevenueCategoryFK: revenueCategoryFK,
                isDrugMixture: false,
                isClaimable: true,
                isDispensedByPharmacy: o.isDispensedByPharmacy,
                isNurseActualizeRequired: o.isNurseActualizeRequired,
                retailVisitInvoiceService: {
                  id: o.innerLayerId,
                  concurrencyToken: o.innerLayerConcurrencyToken,
                  serviceCenterServiceFK: o.serviceCenterServiceFK,
                  isDeleted: restValues.isDeleted,
                  visitOrderTemplateItemFK: restValues.visitOrderTemplateItemFK,
                  retailService: {
                    unitPrice: roundTo(o.total) || 0,
                    ...restValues,
                  },
                },
              }
              break
            }
            case ORDER_TYPE_TAB.CONSUMABLE: {
              const { uom, revenueCategory } = inventoryconsumable.find(
                c => c.id === o.inventoryConsumableFK,
              )
              const { retailConsumable, ...restValues } = o
              let actualUnitPrice = o.unitPrice || 0
              if (_.round(o.unitPrice * o.quantity, 2) !== o.totalPrice) {
                actualUnitPrice = _.round(o.totalPrice / o.quantity, 4)
              }
              actualUnitPrice = actualUnitPrice || 0
              obj = {
                invoiceItemTypeFK: INVOICE_ITEM_TYPE_BY_NAME.CONSUMABLE,
                adjType: o.adjType,
                adjValue: o.adjValue,
                itemCode: o.consumableCode,
                itemName: o.consumableName,
                subTotal: roundTo(o.totalPrice),
                unitPrice: actualUnitPrice,
                quantity: o.quantity,
                itemRevenueCategoryFK: revenueCategory.id,
                isDrugMixture: false,
                isClaimable: true,
                isDispensedByPharmacy: o.isDispensedByPharmacy,
                isNurseActualizeRequired: o.isNurseActualizeRequired,
                retailVisitInvoiceConsumable: {
                  id: o.innerLayerId,
                  concurrencyToken: o.innerLayerConcurrencyToken,
                  inventoryConsumableFK: o.inventoryConsumableFK,
                  expiryDate: o.expiryDate,
                  batchNo: o.batchNo,
                  isDeleted: restValues.isDeleted,
                  visitOrderTemplateItemFK: restValues.visitOrderTemplateItemFK,
                  retailConsumable: {
                    unitOfMeasurement: uom.name,
                    unitofMeasurementFK: uom.id,
                    unitPrice: actualUnitPrice,
                    ...restValues,
                  },
                },
              }
              break
            }
            default: {
              break
            }
          }
          return {
            id: o.outerLayerId,
            visitOrderTemplateItemFK: o.visitOrderTemplateItemFK,
            concurrencyToken: o.outerLayerConcurrencyToken,
            description: o.subject,
            adjAmt: o.adjAmount,
            totalAfterItemAdjustment: roundTo(o.totalAfterItemAdjustment),
            totalAfterOverallAdjustment: roundTo(o.totalAfterOverallAdjustment),
            totalAfterGST: roundTo(o.totalAfterGST),
            gstAmount: o.gstAmount,
            isDeleted: o.isDeleted,
            performingUserFK: o.performingUserFK,
            ...obj,
            revenueCategoryFK: obj.itemRevenueCategoryFK || o.revenueCategoryFK,
          }
        }

        const retailInvoiceItem = rows.map(mapRetailItemPropertyToApi)
        const isPharmacyOrderUpdate =
          isEnablePharmacyModule && isPharmacyOrderUpdated(orders)
        const payload = {
          ...addOrderDetails,
          ...summary,
          isPharmacyOrderUpdated: isPharmacyOrderUpdate,
          retailInvoiceItem,
          retailInvoiceAdjustment: finalAdjustments,
          isPrescriptionSheetUpdated: isPharmacyOrderUpdated(orders,true)
        }

        dispatch({
          type: 'dispense/saveAddOrderDetails',
          payload,
        }).then(r => {
          if (r) {
            if (isPharmacyOrderUpdate) {
              const userProfile = user.data.clinicianProfile
              const userName = `${
                userProfile.title && userProfile.title.trim().length
                  ? `${userProfile.title}. ${userProfile.name || ''}`
                  : `${userProfile.name || ''}`
              }`
              const message = `${userName} amended prescription at ${moment().format(
                'HH:mm',
              )}`
              sendNotification('PharmacyOrderUpdate', {
                type: NOTIFICATION_TYPE.CONSULTAION,
                status: NOTIFICATION_STATUS.OK,
                message,
                visitID: dispense.visitID,
              })
            }
            if (onConfirm) onConfirm()
            history.push({
              pathname: history.location.pathname,
              query: {
                ...history.location.query,
                isInitialLoading: false,
              },
            })
            onReloadClick()
          }
        })
      }
      if (visitType === VISIT_TYPE.BF || visitType === VISIT_TYPE.MC) {
        const billFirstPayload = convertToConsultation(consultation.entity, {
          consultationDocument: { rows: [] },
          orders,
          forms,
        })
        dispatch({
          type: `consultation/signOrder`,
          payload: {
            ...billFirstPayload,
            id: consultation.entity.id,
          },
        }).then(response => {
          if (response) {
            dispatch({
              type: `dispense/refresh`,
              payload: dispense.visitID,
            })
            if (onConfirm) onConfirm()
            onReloadClick()
          }
        })
      }
    },
    displayName: 'AddOrder',
  }),
)(AddOrder)
