import React, { useEffect } from 'react'
import { withStyles } from '@material-ui/core/styles'
import _ from 'lodash'
import { connect } from 'dva'
import { compose } from 'redux'
import { SizeContainer, withFormikExtend } from '@/components'
import { convertToConsultation } from '@/pages/Consultation/utils'
import {
  VISIT_TYPE,
  INVOICE_ITEM_TYPE_BY_NAME,
  ORDER_TYPE_TAB,
  CLINIC_TYPE,
  REVENUE_CATEGORY,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
} from '@/utils/constants'
import { roundTo, getUniqueId } from '@/utils/utils'
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
    ctservice,
    inventoryconsumable,
    inventorymedication,
    inventoryvaccination,
  },
  visitType,
  location,
  clinicInfo,
  isFirstLoad,
  patient
}) => {
  const displayExistingOrders = async (id, servicesList) => {
    const r = await dispatch({
      type: 'dispense/queryAddOrderDetails',
      payload: {
        invoiceId: id,
        isInitialLoading: location.query.isInitialLoading,
      },
    })

    if (r) {
      let allergys = []
      const { patientAllergy = [] } = patient

      const { retailInvoiceAdjustment, retailInvoiceItem } = r

      const insertAllergys = (inventoryMedicationFK) => {
        let drug = inventorymedication.find(
          (medication) => medication.id === inventoryMedicationFK,
        )
        if (!drug) return
        drug.inventoryMedication_DrugAllergy.forEach(allergy => {
          var drugAllergy = patientAllergy.find(a => a.type === 'Allergy' && a.allergyFK === allergy.drugAllergyFK)
          if (drugAllergy) {
            allergys.push({
              drugName: drug.displayValue,
              allergyName: drugAllergy.allergyName,
              allergyType: 'Drug',
              allergyReaction: drugAllergy.allergyReaction,
              onsetDate: drugAllergy.onsetDate,
              id: inventoryMedicationFK,
            })
          }
        })
        drug.inventoryMedication_MedicationIngredient.forEach(ingredient => {
          var drugIngredient = patientAllergy.find(a => a.type === 'Ingredient' && a.ingredientFK === ingredient.medicationIngredientFK)
          if (drugIngredient) {
          allergys.push({
            drugName: drug.displayValue,
            allergyName: drugIngredient.allergyName,
            allergyType: 'Ingredient',
            allergyReaction: drugIngredient.allergyReaction,
            onsetDate: drugIngredient.onsetDate,
            id: inventoryMedicationFK,
          })
          }
        })
      }

      const mapRetailItemPropertyToOrderProperty = o => {
        let obj
        switch (o.invoiceItemTypeFK) {
          case INVOICE_ITEM_TYPE_BY_NAME.MEDICATION: {
            const {
              retailPrescriptionItemInstruction,
              retailPrescriptionItemPrecaution,
              ...restValues
            } = o.retailVisitInvoiceDrug.retailPrescriptionItem

            if (!allergys.find(
              (f) => f.id === o.retailVisitInvoiceDrug.inventoryMedicationFK,
            )) {
              insertAllergys(o.retailVisitInvoiceDrug.inventoryMedicationFK)
            }

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
              medicationItem = true
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
                  }
                },
              ),
              corPrescriptionItemPrecaution:
                o.retailVisitInvoiceDrug.retailPrescriptionItem
                  .retailPrescriptionItemPrecaution,
              corPrescriptionItemDrugMixture:
                o.retailVisitInvoiceDrug.retailPrescriptionItem
                  .retailPrescriptionItemDrugMixture,
              isActive: !!medicationItem,
              _itemId: medicationItem.id,
              _itemType: INVOICE_ITEM_TYPE_BY_NAME.MEDICATION,
              _caution: medicationItem.caution,
            }
            break
          }

          case INVOICE_ITEM_TYPE_BY_NAME.SERVICE: {
            const { serviceId, serviceCenterId } = servicesList.find(
              s =>
                s.serviceCenter_ServiceId ===
                o.retailVisitInvoiceService.serviceCenterServiceFK &&
                s.isActive,
            )
            const serviceItem = ctservice.find(
              service =>
                service.serviceCenter_ServiceId ===
                o.retailVisitInvoiceService.serviceCenterServiceFK,
            )
            obj = {
              type: ORDER_TYPE_TAB.SERVICE,
              serviceFK: serviceId,
              serviceCenterFK: serviceCenterId,
              innerLayerId: o.retailVisitInvoiceService.id,
              innerLayerConcurrencyToken:
                o.retailVisitInvoiceService.concurrencyToken,
              ...o.retailVisitInvoiceService,
              ...o.retailVisitInvoiceService.retailService,
              isActive: !!serviceItem,
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
              _itemId: vaccinationItem.id,
              _itemType: INVOICE_ITEM_TYPE_BY_NAME.VACCINATION,
              _caution: vaccinationItem.caution,
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
      const isVaccinationExist =
        clinicTypeFK === CLINIC_TYPE.GP ? newRows.filter(row => !row.type) : []

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
      }

      if (isVaccinationExist.length || cuationItems.length || allergys.length) {
        dispatch({
          type: 'global/updateAppState',
          payload: {
            openConfirm: true,
            customWidth: 'md',
            openConfirmContent: getCautionAlertContent(cuationItems.map(x => {
              return {
                ...x, type: x.type === 1 ? 'Medication' : 'Vaccination'
              }
            }), allergys, isVaccinationExist),
            alignContent: 'left',
            isInformType: true,
            onConfirmSave: () => { },
          },
        })
      }

      const rowsWithoutVaccination = newRows
        .filter(row => row.type)
        .map(row => {
          return {
            ...row,
            uid: getUniqueId(),
          }
        })
      dispatch({
        type: 'orders/updateState',
        payload: {
          rows: rowsWithoutVaccination,
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
  }

  useEffect(() => {
    const { entity } = dispense
    const { invoice } = entity

    if (visitType === VISIT_TYPE.RETAIL)
      displayExistingOrders(invoice.id, ctservice)
  }, [])
  return (
    <React.Fragment>
      <SizeContainer size='sm'>
        <div style={{ maxHeight: height - 128, overflow: 'auto' }}>
          <Order
            fromDispense={visitType === VISIT_TYPE.RETAIL}
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
    ({ dispense, orders, codetable, consultation, clinicInfo, forms }) => ({
      dispense,
      orders,
      consultation,
      codetable,
      clinicInfo,
      forms,
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
      } = props
      const { rows, summary, finalAdjustments } = orders
      const { addOrderDetails } = dispense
      if (visitType === VISIT_TYPE.RETAIL) {
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
                ? medication.revenueCategory
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
                itemName: o.serviceName,
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

        const payload = {
          ...addOrderDetails,
          ...summary,
          retailInvoiceItem,
          retailInvoiceAdjustment: finalAdjustments,
        }

        dispatch({
          type: 'dispense/saveAddOrderDetails',
          payload,
        }).then(r => {
          if (r) {
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
      if (visitType === VISIT_TYPE.BILL_FIRST) {
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
