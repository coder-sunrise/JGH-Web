import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import { CustomInput } from 'mui-pro-components'
import numeral from 'numeral'
import {
  GridContainer,
  GridItem,
  CodeSelect,
  withFormikExtend,
  CommonTableGrid,
  serverDateTimeFormatFull,
  Field,
  NumberInput,
} from '@/components'
import Yup from '@/utils/yup'
import { getUniqueId } from '@/utils/utils'
import config from '@/utils/config'
import { openCautionAlertPrompt } from '@/pages/Widgets/Orders/utils'

const { qtyFormat } = config

@connect(({ global, codetable, user, visitRegistration }) => ({ global, codetable, user, visitRegistration }))
@withFormikExtend({
  authority: [
    'queue.consultation.order.orderset',
  ],
  mapPropsToValues: ({ orders = {}, type }) => {
    const v = {
      ...(orders.entity || orders.defaultOrderSet),
      type,
    }
    return v
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    inventoryOrderSetFK: Yup.number().required(),
  }),
  handleSubmit: (values, { props, onConfirm, setValues }) => {
    const { dispatch, orders, codetable, getNextSequence, user, visitRegistration } = props
    const { rows } = orders
    const {
      ctmedicationusage,
      ctmedicationunitofmeasurement,
      ctmedicationfrequency,
      ctmedicationdosage,
      ctvaccinationunitofmeasurement,
      ctvaccinationusage,
      doctorprofile,
    } = codetable

    const { doctorProfileFK } = visitRegistration.entity.visit
    const visitDoctorUserId = doctorprofile.find(d => d.id === doctorProfileFK).clinicianProfile.userProfileFK

    const getInstruction = (inventoryMedication) => {
      let instruction = ''
      const usageMethod = ctmedicationusage.find(
        (codeTableItem) =>
          codeTableItem.id === inventoryMedication.medicationUsageFK,
      )
      instruction += `${usageMethod ? usageMethod.name : ''} `
      const dosage = ctmedicationdosage.find(
        (codeTableItem) =>
          codeTableItem.id === inventoryMedication.prescribingDosageFK,
      )
      instruction += `${dosage ? dosage.displayValue : ''} `
      const prescribe = ctmedicationunitofmeasurement.find(
        (codeTableItem) =>
          codeTableItem.id === inventoryMedication.prescribingUOMFK,
      )
      instruction += `${prescribe ? prescribe.name : ''} `
      const drugFrequency = ctmedicationfrequency.find(
        (codeTableItem) =>
          codeTableItem.id === inventoryMedication.medicationFrequencyFK,
      )
      instruction += `${drugFrequency ? drugFrequency.displayValue : ''} For `
      instruction += `${inventoryMedication.duration
        ? inventoryMedication.duration
        : ''} day(s)`
      return instruction
    }

    const getOrderMedicationFromOrderSet = (orderSetCode, orderSetItem) => {
      const { inventoryMedication } = orderSetItem

      let item
      if (inventoryMedication.isActive === true) {
        const medicationdispensingUOM = ctmedicationunitofmeasurement.find(
          (uom) => uom.id === inventoryMedication.dispensingUOMFK,
        )
        const medicationusage = ctmedicationusage.find(
          (usage) => usage.id === inventoryMedication.medicationUsageFK,
        )
        const medicationfrequency = ctmedicationfrequency.find(
          (frequency) =>
            frequency.id === inventoryMedication.medicationFrequencyFK,
        )
        const medicationdosage = ctmedicationdosage.find(
          (dosage) => dosage.id === inventoryMedication.prescribingDosageFK,
        )
        const medicationprescribingUOM = ctmedicationunitofmeasurement.find(
          (uom) => uom.id === inventoryMedication.prescribingUOMFK,
        )
        const medicationPrecautions =
          inventoryMedication.inventoryMedication_MedicationPrecaution
        const isDefaultBatchNo = inventoryMedication.medicationStock.find(
          (o) => o.isDefault === true,
        )
        let currentMedicationPrecautions = []
        currentMedicationPrecautions = currentMedicationPrecautions.concat(
          medicationPrecautions.map((o) => {
            return {
              precautionCode: o.medicationPrecaution.code,
              Precaution: o.medicationPrecaution.name,
              sequence: o.sequence,
              medicationPrecautionFK: o.medicationPrecautionFK,
            }
          }),
        )

        item = {
          isActive: inventoryMedication.isActive,
          inventoryMedicationFK: inventoryMedication.id,
          drugCode: inventoryMedication.code,
          drugName: inventoryMedication.displayValue,
          quantity: orderSetItem.quantity,
          costPrice: inventoryMedication.costPrice,
          unitPrice: orderSetItem.unitPrice,
          totalPrice: orderSetItem.unitPrice * orderSetItem.quantity,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          isClaimable: true,
          totalAfterItemAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          totalAfterOverallAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          orderSetCode,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isExternalPrescription: false,
          instruction: getInstruction(inventoryMedication),
          dispenseUOMFK: inventoryMedication.dispensingUOMFK,
          dispenseUOMCode: medicationdispensingUOM
            ? medicationdispensingUOM.code
            : undefined,
          dispenseUOMDisplayValue: medicationdispensingUOM
            ? medicationdispensingUOM.name
            : undefined,
          corPrescriptionItemPrecaution: currentMedicationPrecautions,
          corPrescriptionItemInstruction: [
            {
              usageMethodFK: inventoryMedication.medicationUsageFK,
              usageMethodCode: medicationusage
                ? medicationusage.code
                : undefined,
              usageMethodDisplayValue: medicationusage
                ? medicationusage.name
                : undefined,
              dosageFK: inventoryMedication.prescribingDosageFK,
              dosageCode: medicationdosage ? medicationdosage.code : undefined,
              dosageDisplayValue: medicationdosage
                ? medicationdosage.displayValue
                : undefined,
              prescribeUOMFK: inventoryMedication.prescribingUOMFK,
              prescribeUOMCode: medicationprescribingUOM
                ? medicationprescribingUOM.code
                : undefined,
              prescribeUOMDisplayValue: medicationprescribingUOM
                ? medicationprescribingUOM.name
                : undefined,
              drugFrequencyFK: inventoryMedication.medicationFrequencyFK,
              drugFrequencyCode: medicationfrequency
                ? medicationfrequency.code
                : undefined,
              drugFrequencyDisplayValue: medicationfrequency
                ? medicationfrequency.displayValue
                : undefined,
              duration: inventoryMedication.duration,
              stepdose: 'AND',
              sequence: 0,
            },
          ],
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
        }
      }
      return item
    }

    const getOrderVaccinationFromOrderSet = (orderSetCode, orderSetItem) => {
      const { inventoryVaccination } = orderSetItem
      let item
      if (inventoryVaccination.isActive === true) {
        const vaccinationUOM = ctvaccinationunitofmeasurement.find(
          (uom) => uom.id === inventoryVaccination.prescribingUOMFK,
        )
        const vaccinationusage = ctvaccinationusage.find(
          (usage) => usage.id === inventoryVaccination.vaccinationUsageFK,
        )
        const vaccinationdosage = ctmedicationdosage.find(
          (dosage) => dosage.id === inventoryVaccination.prescribingDosageFK,
        )
        const isDefaultBatchNo = inventoryVaccination.vaccinationStock.find(
          (o) => o.isDefault === true,
        )

        item = {
          isActive: inventoryVaccination.isActive,
          inventoryVaccinationFK: inventoryVaccination.id,
          vaccinationGivenDate: moment().format(serverDateTimeFormatFull),
          vaccinationCode: inventoryVaccination.code,
          vaccinationName: inventoryVaccination.displayValue,
          // vaccinationSequenceDisplayValue:
          usageMethodFK: inventoryVaccination.vaccinationUsageFK,
          usageMethodCode: vaccinationusage ? vaccinationusage.code : undefined,
          usageMethodDisplayValue: vaccinationusage
            ? vaccinationusage.name
            : undefined,
          dosageFK: inventoryVaccination.prescribingDosageFK,
          dosageCode: vaccinationdosage ? vaccinationdosage.code : undefined,
          dosageDisplayValue: vaccinationdosage
            ? vaccinationdosage.displayValue
            : undefined,
          uomfk: inventoryVaccination.prescribingUOMFK,
          uomCode: vaccinationUOM ? vaccinationUOM.code : undefined,
          uomDisplayValue: vaccinationUOM ? vaccinationUOM.name : undefined,
          quantity: inventoryVaccination.dispensingQuantity,
          unitPrice: orderSetItem.unitPrice,
          totalPrice: orderSetItem.unitPrice * orderSetItem.quantity,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          totalAfterOverallAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          orderSetCode,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
        }
      }
      return item
    }

    const getOrderServiceCenterServiceFromOrderSet = (
      orderSetCode,
      orderSetItem,
    ) => {
      const { service } = orderSetItem
      const serviceCenterService = service.ctServiceCenter_ServiceNavigation[0]
      const serviceCenter = serviceCenterService.serviceCenterFKNavigation
      let item
      if (
        service.isActive === true &&
        // serviceCenterService.isActive === true &&
        serviceCenter.isActive === true
      ) {
        item = {
          isActive: serviceCenter.isActive && service.isActive,
          serviceCenterServiceFK: serviceCenterService.id,
          quantity: orderSetItem.quantity,
          unitPrice: orderSetItem.unitPrice,
          total: orderSetItem.unitPrice * orderSetItem.quantity,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          totalAfterOverallAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          orderSetCode,
          // priority:,
          serviceCode: service.code,
          serviceName: service.displayValue,
          serviceFK: service.id,
          serviceCenterFK: serviceCenterService.serviceCenterFK,
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
        }
      }
      return item
    }

    const getOrderConsumableFromOrderSet = (orderSetCode, orderSetItem) => {
      const { inventoryConsumable } = orderSetItem

      const isDefaultBatchNo = inventoryConsumable.consumableStock.find(
        (o) => o.isDefault === true,
      )

      let item
      if (inventoryConsumable.isActive === true) {
        item = {
          inventoryConsumableFK: inventoryConsumable.id,
          // unitOfMeasurement:,
          isActive: inventoryConsumable.isActive,
          quantity: orderSetItem.quantity,
          unitPrice: orderSetItem.unitPrice,
          totalPrice: orderSetItem.unitPrice * orderSetItem.quantity,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          totalAfterOverallAdjustment:
            orderSetItem.unitPrice * orderSetItem.quantity,
          orderSetCode,
          consumableCode: inventoryConsumable.code,
          consumableName: inventoryConsumable.displayValue,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
        }
      }

      return item
    }
    const getOrderFromOrderSet = (orderSetCode, orderSetItem) => {
      let item
      if (orderSetItem.type === '1') {
        item = getOrderMedicationFromOrderSet(orderSetCode, orderSetItem)
      }
      if (orderSetItem.type === '2') {
        item = getOrderVaccinationFromOrderSet(orderSetCode, orderSetItem)
      }
      if (orderSetItem.type === '3') {
        item = getOrderServiceCenterServiceFromOrderSet(
          orderSetCode,
          orderSetItem,
        )
      }
      if (orderSetItem.type === '4') {
        item = getOrderConsumableFromOrderSet(orderSetCode, orderSetItem)
      }
      return item
    }

    const { orderSetItems, orderSetCode } = values
    let datas = []
    let nextSequence = getNextSequence()
    for (let index = 0; index < orderSetItems.length; index++) {
      const newOrder = getOrderFromOrderSet(orderSetCode, orderSetItems[index])
      if (newOrder) {
        const data = {
          isOrderedByDoctor:
            user.data.clinicianProfile.userProfile.role.clinicRoleFK === 1,
          sequence: nextSequence,
          ...newOrder,
          subject: orderSetItems[index].name,
          isDeleted: false,
          type: orderSetItems[index].type,
        }
        datas.push(data)
        nextSequence += 1
      }
    }
    dispatch({
      type: 'orders/upsertRows',
      payload: datas,
    })
    if (onConfirm) onConfirm()
    setValues({
      ...orders.defaultOrderSet,
      type: orders.type,
    })
  },
  displayName: 'OrderPage',
})
class OrderSet extends PureComponent {
  constructor (props) {
    super(props)
    const { dispatch } = props
    const codeTableNameArray = [
      'ctmedicationusage',
      'ctmedicationunitofmeasurement',
      'ctmedicationfrequency',
      'ctmedicationdosage',
      'ctvaccinationunitofmeasurement',
      'ctvaccinationusage',
    ]
    dispatch({
      type: 'codetable/batchFetch',
      payload: {
        codes: codeTableNameArray,
      },
    })

    this.tableProps = {
      getRowId: (r) => r.uid,
      columns: [
        { name: 'typeName', title: 'Type' },
        { name: 'name', title: 'Name' },
        { name: 'quantity', title: 'Quantity' },
        { name: 'subTotal', title: 'Total' },
      ],
      columnExtensions: [
        {
          columnName: 'typeName',
          render: (row) => {
            if (row.isActive === true) {
              return <CustomInput text value={row.typeName} />
            }
            return <CustomInput text inActive value={row.typeName} />
          },
        },
        {
          columnName: 'name',
          render: (row) => {
            if (row.isActive === true) {
              return <CustomInput text value={row.name} />
            }
            return <CustomInput text inActive value={row.name} />
          },
        },
        {
          columnName: 'quantity',
          align: 'right',
          render: (row) => {
            if (row.isActive === true) {
              return (
                <CustomInput
                  text
                  currency
                  value={numeral(row.quantity).format(qtyFormat)}
                />
              )
            }
            return (
              <CustomInput
                text
                inActive
                value={numeral(row.quantity).format(qtyFormat)}
              />
            )
          },
        },
        {
          columnName: 'subTotal',
          align: 'right',
          render: (row) => {
            if (row.isActive === true) {
              return <NumberInput text currency value={row.subTotal} />
            }
            return <NumberInput text inActive currency value={row.subTotal} />
          },
        },
      ],
    }

    this.changeOrderSet = (v, op) => {
      const { setValues, values, orderTypes } = this.props
      let rows = []
      if (op && op.medicationOrderSetItem) {
        rows = rows.concat(
          op.medicationOrderSetItem.map((o) => {
            return {
              ...o,
              name: o.medicationName,
              uid: getUniqueId(),
              type: '1',
              typeName:
                orderTypes.find((type) => type.value === '1').name +
                (o.inventoryMedication.isActive === true ? '' : ' (Inactive)'),
              isActive: o.inventoryMedication.isActive === true,
              caution: o.inventoryMedication.caution,
              subject: o.medicationName,
            }
          }),
        )
      }
      if (op && op.vaccinationOrderSetItem) {
        rows = rows.concat(
          op.vaccinationOrderSetItem.map((o) => {
            return {
              ...o,
              name: o.vaccinationName,
              uid: getUniqueId(),
              type: '2',
              typeName:
                orderTypes.find((type) => type.value === '2').name +
                (o.inventoryVaccination.isActive === true ? '' : ' (Inactive)'),
              isActive: o.inventoryVaccination.isActive === true,
              caution: o.inventoryVaccination.caution,
              subject: o.vaccinationName,
            }
          }),
        )
      }
      if (op && op.serviceOrderSetItem) {
        rows = rows.concat(
          op.serviceOrderSetItem.map((o) => {
            return {
              ...o,
              name: o.serviceName,
              uid: getUniqueId(),
              type: '3',
              typeName:
                orderTypes.find((type) => type.value === '3').name +
                // o.service.ctServiceCenter_ServiceNavigation[0].isActive &&
                (o.service.isActive &&
                o.service.ctServiceCenter_ServiceNavigation[0]
                  .serviceCenterFKNavigation.isActive === true
                  ? ''
                  : ' (Inactive)'),
              // o.service.ctServiceCenter_ServiceNavigation[0].isActive &&
              isActive:
                o.service.isActive &&
                o.service.ctServiceCenter_ServiceNavigation[0]
                  .serviceCenterFKNavigation.isActive,
            }
          }),
        )
      }
      if (op && op.consumableOrderSetItem) {
        rows = rows.concat(
          op.consumableOrderSetItem.map((o) => {
            return {
              ...o,
              name: o.consumableName,
              uid: getUniqueId(),
              type: '4',
              typeName:
                orderTypes.find((type) => type.value === '4').name +
                (o.inventoryConsumable.isActive === true ? '' : ' (Inactive)'),
              isActive: o.inventoryConsumable.isActive === true,
            }
          }),
        )
      }
      setValues({
        ...values,
        orderSetItems: rows,
        orderSetCode: op ? op.code : '',
      })
    }

    this.handleReset = () => {
      const { setValues, orders } = this.props
      setValues({
        ...orders.defaultOrderSet,
        type: orders.type,
      })
    }
  }

  validateAndSubmitIfOk = async (callback) => {
    const {
      handleSubmit,
      validateForm,
      dispatch,
      values: { orderSetItems = [] },
    } = this.props
    const validateResult = await validateForm()
    const isFormValid = _.isEmpty(validateResult)
    if (isFormValid) {
      const hasCautionItems = orderSetItems.filter(
        (f) => f.caution && f.caution.trim().length > 0,
      )
      if (hasCautionItems.length > 0) {
        openCautionAlertPrompt(hasCautionItems, () => {
          handleSubmit()
          if (callback) callback(true)
        })
      } else {
        handleSubmit()
        return true
      }
    }
    return false
  }

  render () {
    const { theme, values, footer, handleSubmit } = this.props
    return (
      <div>
        <GridContainer>
          <GridItem xs={6}>
            <Field
              name='inventoryOrderSetFK'
              render={(args) => {
                return (
                  <div id={`autofocus_${values.type}`}>
                    <CodeSelect
                      temp
                      label='Order Set Name'
                      code='inventoryorderset'
                      labelField='displayValue'
                      onChange={this.changeOrderSet}
                      {...args}
                    />
                  </div>
                )
              }}
            />
          </GridItem>
          <GridItem xs={12}>
            <CommonTableGrid
              rows={values.orderSetItems}
              style={{
                margin: `${theme.spacing(1)}px 0`,
              }}
              {...this.tableProps}
            />
          </GridItem>
        </GridContainer>
        {footer({
          onSave: this.validateAndSubmitIfOk,
          onReset: this.handleReset,
          showAdjustment: false,
        })}
      </div>
    )
  }
}
export default OrderSet
