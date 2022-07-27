import React, { PureComponent } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
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
  notification,
  Tooltip,
  LocalSearchSelect,
} from '@/components'
import Yup from '@/utils/yup'
import { getUniqueId, getTranslationValue } from '@/utils/utils'
import { qtyFormat } from '@/utils/config'
import {
  openCautionAlertPrompt,
  GetOrderItemAccessRight,
  ReplaceCertificateTeplate,
} from '@/pages/Widgets/Orders/utils'
import Authorized from '@/utils/Authorized'
import {
  isMatchInstructionRule,
  getDrugAllergy,
} from '@/pages/Widgets/Orders/utils'
import {
  ORDER_TYPES,
  RADIOLOGY_CATEGORY,
  LAB_CATEGORY,
} from '@/utils/constants'
import { getClinicianProfile } from '../../ConsultationDocument/utils'

@connect(
  ({
    global,
    codetable,
    user,
    consultationDocument,
    visitRegistration,
    patient,
    clinicSettings,
  }) => ({
    global,
    codetable,
    user,
    consultationDocument,
    visitRegistration,
    patient,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
  }),
)
@withFormikExtend({
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
  handleSubmit: (values, { props, onConfirm, setValues, resetForm }) => {
    const {
      dispatch,
      orders = {},
      codetable,
      getNextSequence,
      user,
      visitRegistration,
      patient,
      consultationDocument: { rows = [] },
      clinicSettings,
    } = props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const { corVitalSign = [] } = orders
    const {
      ctmedicationusage,
      ctmedicationunitofmeasurement,
      ctmedicationfrequency,
      ctmedicationdosage,
      ctvaccinationunitofmeasurement,
      ctmedicationprecaution,
      ctvaccinationusage,
      doctorprofile,
    } = codetable
    const { entity: visitEntity } = visitRegistration
    const clinicianProfile = getClinicianProfile(codetable, visitEntity)
    const { entity } = patient
    const { name, patientAccountNo, genderFK, dob } = entity
    const { ctgender = [] } = codetable
    const gender = ctgender.find(o => o.id === genderFK) || {}
    const allDocs = rows.filter(s => !s.isDeleted)
    let nextDocumentSequence = 1
    if (allDocs && allDocs.length > 0) {
      const { sequence: documentSequence } = _.maxBy(allDocs, 'sequence')
      nextDocumentSequence = documentSequence + 1
    }
    let showNoTemplate

    const { doctorProfileFK } = visitRegistration.entity.visit
    const visitDoctorUserId = doctorprofile.find(d => d.id === doctorProfileFK)
      .clinicianProfile.userProfileFK

    const getInstruction = (
      inventoryMedication,
      matchInstruction,
      language,
    ) => {
      const usage = ctmedicationusage.find(
        usage => usage.id === inventoryMedication.medicationUsageFK,
      )
      const uom = ctmedicationunitofmeasurement.find(
        uom => uom.id === inventoryMedication.prescribingUOMFK,
      )
      const frequency = ctmedicationfrequency.find(
        frequency => frequency.id === matchInstruction?.medicationFrequency?.id,
      )
      const dosage = ctmedicationdosage.find(
        dosage => dosage.id === matchInstruction?.prescribingDosage?.id,
      )

      const itemDuration = matchInstruction?.duration
        ? ` For ${matchInstruction.duration} day(s)`
        : ''

      const instruction = `${getTranslationValue(
        usage?.translationData,
        language,
        'displayValue',
      )} ${getTranslationValue(
        dosage?.translationData,
        language,
        'displayValue',
      )} ${getTranslationValue(
        uom?.translationData,
        language,
        'displayValue',
      )} ${getTranslationValue(
        frequency?.translationData,
        language,
        'displayValue',
      )}${itemDuration}`
      return instruction
    }

    const getOrderMedicationFromOrderSet = (orderSetCode, orderSetItem) => {
      const { inventoryMedication } = orderSetItem
      const { medicationInstructionRule = [] } = inventoryMedication

      let weightKG
      const activeVitalSign = corVitalSign.find(vs => !vs.isDeleted)
      if (activeVitalSign) {
        weightKG = activeVitalSign.weightKG
      } else {
        const visitBasicExaminations =
          visitRegistration.entity?.visit?.visitBasicExaminations || []
        if (visitBasicExaminations.length) {
          weightKG = visitBasicExaminations[0].weightKG
        }
      }

      let age
      if (dob) {
        age = Math.floor(moment.duration(moment().diff(dob)).asYears())
      }
      var matchInstruction = medicationInstructionRule.find(i =>
        isMatchInstructionRule(i, age, weightKG),
      )

      let item
      if (
        inventoryMedication.isActive === true &&
        inventoryMedication.orderable
      ) {
        const medicationdispensingUOM = ctmedicationunitofmeasurement.find(
          uom => uom.id === inventoryMedication.dispensingUOMFK,
        )
        const medicationusage = ctmedicationusage.find(
          usage => usage.id === inventoryMedication.medicationUsageFK,
        )
        const medicationfrequency = matchInstruction?.medicationFrequency
        const medicationdosage = matchInstruction?.prescribingDosage
        const medicationprescribingUOM = ctmedicationunitofmeasurement.find(
          uom => uom.id === inventoryMedication.prescribingUOMFK,
        )
        const medicationPrecautions =
          inventoryMedication.inventoryMedication_MedicationPrecaution
        const isDefaultBatchNo = inventoryMedication.medicationStock.find(
          o => o.isDefault === true,
        )
        let currentMedicationPrecautions = []
        currentMedicationPrecautions = currentMedicationPrecautions.concat(
          medicationPrecautions.map(o => {
            const precuation = ctmedicationprecaution.find(
              t => t.id === o.medicationPrecautionFK,
            )
            return {
              precautionCode: precuation.code,
              Precaution: precuation.displayValue,
              sequence: o.sequence,
              medicationPrecautionFK: o.medicationPrecautionFK,
            }
          }),
        )
        const uom = ctmedicationunitofmeasurement.find(
          uom => uom.id === inventoryMedication.dispensingUOMFK,
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
          instruction: getInstruction(
            inventoryMedication,
            matchInstruction,
            primaryPrintoutLanguage,
          ),
          secondInstruction:
            secondaryPrintoutLanguage !== ''
              ? getInstruction(
                  inventoryMedication,
                  matchInstruction,
                  secondaryPrintoutLanguage,
                )
              : '',
          dispenseUOMFK: inventoryMedication.dispensingUOMFK,
          inventoryDispenseUOMFK: inventoryMedication.dispensingUOMFK,
          inventoryPrescribingUOMFK: inventoryMedication.prescribingUOMFK,
          dispenseUOMCode: medicationdispensingUOM
            ? medicationdispensingUOM.code
            : undefined,
          dispenseUOMDisplayValue: getTranslationValue(
            uom?.translationData,
            primaryPrintoutLanguage,
            'displayValue',
          ),
          secondDispenseUOMDisplayValue:
            secondaryPrintoutLanguage !== ''
              ? getTranslationValue(
                  uom?.translationData,
                  secondaryPrintoutLanguage,
                  'displayValue',
                )
              : '',
          corPrescriptionItemPrecaution: currentMedicationPrecautions,
          subject: inventoryMedication.displayValue,
          corPrescriptionItemInstruction: [
            {
              usageMethodFK: inventoryMedication.medicationUsageFK,
              usageMethodCode: medicationusage
                ? medicationusage.code
                : undefined,
              usageMethodDisplayValue: medicationusage
                ? medicationusage.displayValue
                : undefined,
              dosageFK: medicationdosage ? medicationdosage.id : undefined,
              dosageCode: medicationdosage ? medicationdosage.code : undefined,
              dosageDisplayValue: medicationdosage
                ? medicationdosage.displayValue
                : undefined,
              prescribeUOMFK: inventoryMedication.prescribingUOMFK,
              prescribeUOMCode: medicationprescribingUOM
                ? medicationprescribingUOM.code
                : undefined,
              prescribeUOMDisplayValue: medicationprescribingUOM
                ? medicationprescribingUOM.displayValue
                : undefined,
              drugFrequencyFK: medicationfrequency
                ? medicationfrequency.id
                : undefined,
              drugFrequencyCode: medicationfrequency
                ? medicationfrequency.code
                : undefined,
              drugFrequencyDisplayValue: medicationfrequency
                ? medicationfrequency.displayValue
                : undefined,
              duration: matchInstruction?.duration,
              stepdose: 'AND',
              sequence: 1,
            },
          ],
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
          isDispensedByPharmacy: inventoryMedication.isDispensedByPharmacy,
          isNurseActualizeRequired: inventoryMedication.isNurseActualizable,
          isExclusive: inventoryMedication.isExclusive,
          orderable: inventoryMedication.orderable,
        }
      }
      return item
    }

    const getOrderVaccinationFromOrderSet = (orderSetCode, orderSetItem) => {
      const { inventoryVaccination } = orderSetItem
      let item = {}
      if (inventoryVaccination.isActive === true) {
        const vaccinationUOM = ctvaccinationunitofmeasurement.find(
          uom => uom.id === inventoryVaccination.prescribingUOMFK,
        )
        const vaccinationDispenseUOM = ctvaccinationunitofmeasurement.find(
          uom => uom.id === inventoryVaccination.dispensingUOMFK,
        )
        const vaccinationusage = ctvaccinationusage.find(
          usage => usage.id === inventoryVaccination.vaccinationUsageFK,
        )
        const vaccinationdosage = ctmedicationdosage.find(
          dosage => dosage.id === inventoryVaccination.prescribingDosageFK,
        )
        const isDefaultBatchNo = inventoryVaccination.vaccinationStock.find(
          o => o.isDefault === true,
        )

        item = {
          isActive: inventoryVaccination.isActive,
          inventoryVaccinationFK: inventoryVaccination.id,
          vaccinationGivenDate: moment().format(serverDateTimeFormatFull),
          vaccinationCode: inventoryVaccination.code,
          vaccinationName: inventoryVaccination.displayValue,
          usageMethodFK: inventoryVaccination.vaccinationUsageFK,
          usageMethodCode: vaccinationusage?.code,
          usageMethodDisplayValue: vaccinationusage?.name,
          dosageFK: inventoryVaccination.prescribingDosageFK,
          dosageCode: vaccinationdosage?.code,
          dosageDisplayValue: vaccinationdosage?.displayValue,
          uomfk: inventoryVaccination.prescribingUOMFK,
          uomCode: vaccinationUOM?.code,
          uomDisplayValue: vaccinationUOM?.name,
          dispenseUOMFK: inventoryVaccination.dispensingUOMFK,
          dispenseUOMCode: vaccinationDispenseUOM?.code,
          dispenseUOMDisplayValue: vaccinationDispenseUOM?.name,
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
          type: orderSetItem.type,
          subject: inventoryVaccination.displayValue,
          isGenerateCertificate: inventoryVaccination.isAutoGenerateCertificate,
          isNurseActualizeRequired: inventoryVaccination.isNurseActualizable,
          instruction: `${vaccinationusage?.name ||
            ''} ${vaccinationdosage?.displayValue ||
            ''} ${vaccinationUOM?.name || ''}`,
        }
      }
      let newCORVaccinationCert = []
      if (item.isGenerateCertificate) {
        const { documenttemplate = [] } = codetable
        const defaultTemplate = documenttemplate.find(
          dt =>
            dt.isDefaultTemplate === true && dt.documentTemplateTypeFK === 3,
        )
        if (defaultTemplate) {
          dispatch({
            type: 'settingDocumentTemplate/queryOne',
            payload: { id: defaultTemplate.id },
          }).then(r => {
            if (!r) {
              return
            }
            newCORVaccinationCert = [
              {
                type: '3',
                certificateDate: moment(),
                issuedByUserFK: clinicianProfile.userProfileFK,
                subject: `Vaccination Certificate - ${name}, ${patientAccountNo}, ${gender.code ||
                  ''}, ${Math.floor(
                  moment.duration(moment().diff(dob)).asYears(),
                )}`,
                content: ReplaceCertificateTeplate(r.templateContent, item),
                sequence: nextDocumentSequence,
              },
            ]
            nextDocumentSequence += 1
          })
        } else {
          showNoTemplate = true
        }
      }
      return { ...item, corVaccinationCert: newCORVaccinationCert }
    }

    const getOrderServiceCenterServiceFromOrderSet = (
      orderSetCode,
      orderSetItem,
    ) => {
      const { service } = orderSetItem
      const serviceCenterService = service.ctServiceCenter_ServiceNavigation[0]
      const serviceCenter = serviceCenterService.serviceCenterFKNavigation
      let item
      if (service.isActive === true && serviceCenter.isActive === true) {
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
          serviceCode: service.code,
          serviceName: service.displayValue,
          serviceFK: service.id,
          serviceCenterFK: serviceCenterService.serviceCenterFK,
          subject: service.displayValue,
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
          isNurseActualizeRequired: service.isNurseActualizable,
          serviceCenterCategoryFK: serviceCenter.serviceCenterCategoryFK,
        }
      }
      return item
    }

    const getOrderConsumableFromOrderSet = (orderSetCode, orderSetItem) => {
      const { inventoryConsumable } = orderSetItem

      const isDefaultBatchNo = inventoryConsumable.consumableStock.find(
        o => o.isDefault === true,
      )

      let item
      if (
        inventoryConsumable.isActive === true &&
        inventoryConsumable.orderable
      ) {
        item = {
          inventoryConsumableFK: inventoryConsumable.id,
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
          subject: inventoryConsumable.displayValue,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          performingUserFK: visitDoctorUserId,
          packageGlobalId: '',
          isDispensedByPharmacy: inventoryConsumable.isDispensedByPharmacy,
          isNurseActualizeRequired: inventoryConsumable.isNurseActualizable,
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
        let type = orderSetItems[index].type
        if (orderSetItems[index].type === '3') {
          if (LAB_CATEGORY.indexOf(newOrder.serviceCenterCategoryFK) >= 0) {
            type = ORDER_TYPES.LAB
          } else if (
            RADIOLOGY_CATEGORY.indexOf(newOrder.serviceCenterCategoryFK) >= 0
          ) {
            type = ORDER_TYPES.RADIOLOGY
          }
        }
        const data = {
          isOrderedByDoctor:
            user.data.clinicianProfile.userProfile.role.clinicRoleFK === 1,
          sequence: nextSequence,
          ...newOrder,
          subject: orderSetItems[index].name,
          isDeleted: false,
          type,
        }
        datas.push(data)
        nextSequence += 1
      }
    }
    if (showNoTemplate) {
      notification.warning({
        message:
          'Any changes will not be reflected in the vaccination certificate.',
      })
    }
    dispatch({
      type: 'orders/upsertRows',
      payload: datas,
    })
    if (onConfirm) onConfirm()
    if (resetForm) resetForm()
    setValues({
      ...orders.defaultOrderSet,
      type: orders.type,
    })
  },
  displayName: 'OrderPage',
})
class OrderSet extends PureComponent {
  constructor(props) {
    super(props)
    const { dispatch, classes } = props
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

    dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctmedicationprecaution' },
    })

    this.tableProps = {
      getRowId: r => r.uid,
      columns: [
        { name: 'typeName', title: 'Type' },
        { name: 'name', title: 'Name' },
        { name: 'quantity', title: 'Quantity' },
        { name: 'subTotal', title: 'Total' },
      ],
      columnExtensions: [
        {
          columnName: 'typeName',
          render: row => {
            return (
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    paddingRight: row.isExclusive ? 24 : 0,
                  }}
                >
                  <Tooltip title={row.typeName}>
                    <span>{row.typeName}</span>
                  </Tooltip>
                  <div
                    style={{ position: 'absolute', top: '-1px', right: '-6px' }}
                  >
                    {row.isExclusive && (
                      <Tooltip title='The item has no local stock, we will purchase on behalf and charge to patient in invoice'>
                        <div
                          className={classes.rightIcon}
                          style={{
                            borderRadius: 4,
                            backgroundColor: 'green',
                            display: 'inline-block',
                          }}
                        >
                          Excl.
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            )
          },
        },
        {
          columnName: 'name',
          render: row => {
            if (row.isActive === true) {
              return <CustomInput text value={row.name} />
            }
            return <CustomInput text inActive value={row.name} />
          },
        },
        {
          columnName: 'quantity',
          align: 'right',
          render: row => {
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
          render: row => {
            if (row.isActive === true) {
              return <NumberInput text currency value={row.subTotal} />
            }
            return <NumberInput text inActive currency value={row.subTotal} />
          },
        },
      ],
    }

    this.changeOrderSet = (v, op) => {
      const { setValues, values, orderTypes, codetable, patient } = this.props
      const { inventorymedication = [] } = codetable
      const { entity = {} } = patient
      const { patientAllergy = [] } = entity
      let rows = []
      let cautions = []
      let allergys = []
      const insertAllergys = inventoryMedicationFK => {
        let drug = inventorymedication.find(
          medication => medication.id === inventoryMedicationFK,
        )
        if (!drug) return
        const newAllergys = getDrugAllergy(drug, patientAllergy)
        if (newAllergys.length) {
          allergys = [...allergys, ...newAllergys]
        }
      }

      if (op && op.medicationOrderSetItem) {
        rows = rows.concat(
          op.medicationOrderSetItem.map(o => {
            if (
              o.caution &&
              o.caution.trim() !== '' &&
              !cautions.find(
                f =>
                  f.type === 'Medication' && f.id === o.inventoryMedicationFK,
              )
            ) {
              cautions.push({
                type: 'Medication',
                subject: o.medicationName,
                caution: o.caution,
                id: o.inventoryMedicationFK,
              })
            }

            if (!allergys.find(f => f.id === o.inventoryMedicationFK)) {
              insertAllergys(o.inventoryMedicationFK)
            }
            return {
              ...o,
              name: o.medicationName,
              uid: getUniqueId(),
              type: '1',
              typeName:
                orderTypes.find(type => type.value === '1').name +
                (o.inventoryMedication.isActive === true ? '' : ' (Inactive)'),
              isActive: o.inventoryMedication.isActive === true,
              caution: o.inventoryMedication.caution,
              subject: o.medicationName,
              isExclusive: o.inventoryMedication.isExclusive,
            }
          }),
        )
      }
      if (op && op.vaccinationOrderSetItem) {
        rows = rows.concat(
          op.vaccinationOrderSetItem.map(o => {
            if (
              o.caution &&
              o.caution.trim() !== '' &&
              !cautions.find(
                c =>
                  c.type === 'Vaccination' && c.id === o.inventoryVaccinationFK,
              )
            ) {
              cautions.push({
                type: 'Vaccination',
                subject: o.vaccinationName,
                caution: o.caution,
                id: o.inventoryVaccinationFK,
              })
            }
            return {
              ...o,
              name: o.vaccinationName,
              uid: getUniqueId(),
              type: '2',
              typeName:
                orderTypes.find(type => type.value === '2').name +
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
          op.serviceOrderSetItem.map(o => {
            let typeName = 'Service'
            const { service } = o
            const serviceCenterService =
              service.ctServiceCenter_ServiceNavigation[0]
            const serviceCenter = serviceCenterService.serviceCenterFKNavigation
            if (
              LAB_CATEGORY.indexOf(serviceCenter.serviceCenterCategoryFK) >= 0
            ) {
              typeName = 'Lab'
            } else if (
              RADIOLOGY_CATEGORY.indexOf(
                serviceCenter.serviceCenterCategoryFK,
              ) >= 0
            ) {
              typeName = 'Radiology'
            }
            return {
              ...o,
              name: o.serviceName,
              uid: getUniqueId(),
              type: '3',
              typeName:
                typeName +
                (service.isActive && serviceCenter.isActive === true
                  ? ''
                  : ' (Inactive)'),
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
          op.consumableOrderSetItem.map(o => {
            return {
              ...o,
              name: o.consumableName,
              uid: getUniqueId(),
              type: '4',
              typeName:
                orderTypes.find(type => type.value === '4').name +
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

      if (cautions.length || allergys.length) {
        openCautionAlertPrompt(cautions, allergys, [], () => {})
      }
    }

    this.handleReset = () => {
      const { setValues, orders } = this.props
      setValues({
        ...orders.defaultOrderSet,
        type: orders.type,
      })
    }
  }

  componentWillMount() {
    const { dispatch } = this.props
    const codeTableNameArray = ['inventoryorderset']
    dispatch({
      type: 'codetable/batchFetch',
      payload: {
        codes: codeTableNameArray,
      },
    })
  }

  validateAndSubmitIfOk = async () => {
    const { handleSubmit, validateForm } = this.props
    const validateResult = await validateForm()
    const isFormValid = _.isEmpty(validateResult)
    if (isFormValid) {
      handleSubmit()
      return true
    }
    return false
  }
  matchSearch = (option, input) => {
    const lowerCaseInput = input.toLowerCase()
    return (
      option.code.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
      option.displayValue.toLowerCase().indexOf(lowerCaseInput) >= 0
    )
  }
  render() {
    const {
      theme,
      values,
      footer,
      from,
      codetable: { inventoryorderset = [] },
    } = this.props
    return (
      <Authorized
        authority={GetOrderItemAccessRight(
          from,
          'queue.consultation.order.orderset',
        )}
      >
        <div>
          <GridContainer>
            <GridItem xs={6}>
              <Field
                name='inventoryOrderSetFK'
                render={args => {
                  return (
                    <div id={`autofocus_${values.type}`}>
                      <LocalSearchSelect
                        temp
                        label='Order Set Name'
                        labelField='displayValue'
                        onChange={this.changeOrderSet}
                        options={inventoryorderset}
                        matchSearch={this.matchSearch}
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
      </Authorized>
    )
  }
}
export default OrderSet
