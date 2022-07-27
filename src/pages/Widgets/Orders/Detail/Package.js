import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import moment from 'moment'
import _ from 'lodash'
import {
  GridContainer,
  GridItem,
  CodeSelect,
  withFormikExtend,
  EditableTableGrid,
  Field,
  serverDateTimeFormatFull,
  notification,
  DatePicker,
  Tooltip,
} from '@/components'
import Yup from '@/utils/yup'
import {
  getUniqueId,
  getUniqueGUID,
  roundTo,
  getTranslationValue,
} from '@/utils/utils'
import {
  openCautionAlertPrompt,
  ReplaceCertificateTeplate,
} from '@/pages/Widgets/Orders/utils'
import {
  DURATION_UNIT,
  ORDER_TYPES,
  LAB_CATEGORY,
  RADIOLOGY_CATEGORY,
} from '@/utils/constants'
import {
  isMatchInstructionRule,
  getDrugAllergy,
} from '@/pages/Widgets/Orders/utils'
import { getClinicianProfile } from '../../ConsultationDocument/utils'
import { CollectionsOutlined } from '@material-ui/icons'

@connect(
  ({
    global,
    codetable,
    user,
    visitRegistration,
    consultationDocument,
    patient,
    clinicSettings,
  }) => ({
    global,
    codetable,
    user,
    visitRegistration,
    consultationDocument,
    patient,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
  }),
)
@withFormikExtend({
  authority: ['queue.consultation.order.package'],
  mapPropsToValues: ({ orders = {}, type }) => {
    const v = {
      ...(orders.entity || orders.defaultPackage),
      type,
    }
    return v
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    packageFK: Yup.number().required(),
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
      ctmedicationusage = [],
      ctmedicationunitofmeasurement = [],
      ctmedicationfrequency = [],
      ctmedicationdosage = [],
      inventorymedication = [],
      inventoryvaccination = [],
      inventoryconsumable = [],
      doctorprofile,
      ctservice = [],
    } = codetable

    const { doctorProfileFK } = visitRegistration.entity.visit
    const visitDoctorUserId = doctorprofile.find(d => d.id === doctorProfileFK)
      .clinicianProfile.userProfileFK

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

    const packageGlobalId = getUniqueGUID()

    const getInstruction = (medication, matchInstruction, language) => {
      const usage = ctmedicationusage.find(
        usage => usage.id === medication.medicationUsage?.id,
      )
      const uom = ctmedicationunitofmeasurement.find(
        uom => uom.id === medication.prescribingUOM?.id,
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

    const getOrderMedicationFromPackage = (
      packageCode,
      packageName,
      packageItem,
    ) => {
      const medication = inventorymedication.find(
        item => item.id === packageItem.inventoryMedicationFK,
      )
      const { medicationInstructionRule = [] } = medication
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
      const uom = ctmedicationunitofmeasurement.find(
        uom => uom.id === medication.dispensingUOM.id,
      )
      let item
      if (medication.isActive === true && medication.orderable) {
        const medicationdispensingUOM = medication.dispensingUOM
        const medicationusage = medication.medicationUsage
        const medicationfrequency = matchInstruction?.medicationFrequency
        const medicationdosage = matchInstruction?.prescribingDosage
        const medicationprescribingUOM = medication.prescribingUOM
        const medicationPrecautions =
          medication.inventoryMedication_MedicationPrecaution
        const isDefaultBatchNo = medication.medicationStock.find(
          o => o.isDefault === true,
        )
        let currentMedicationPrecautions = []
        currentMedicationPrecautions = currentMedicationPrecautions.concat(
          medicationPrecautions.map(o => {
            return {
              precautionCode: o.medicationPrecautionCode,
              Precaution: o.medicationPrecautionName,
              sequence: o.sequence,
              medicationPrecautionFK: o.medicationPrecautionFK,
            }
          }),
        )

        item = {
          isActive: medication.isActive,
          inventoryMedicationFK: medication.id,
          drugCode: medication.code,
          drugName: medication.displayValue,
          quantity: packageItem.quantity,
          costPrice: medication.averageCostPrice,
          unitPrice: packageItem.unitPrice,
          totalPrice: packageItem.subTotal,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          isClaimable: true,
          totalAfterItemAdjustment: packageItem.subTotal,
          totalAfterOverallAdjustment: packageItem.subTotal,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isExternalPrescription: false,
          instruction: getInstruction(
            medication,
            matchInstruction,
            primaryPrintoutLanguage,
          ),
          secondInstruction:
            secondaryPrintoutLanguage !== ''
              ? getInstruction(
                  medication,
                  matchInstruction,
                  secondaryPrintoutLanguage,
                )
              : '',
          dispenseUOMFK: medication?.dispensingUOM?.id,
          inventoryDispenseUOMFK: medication?.dispensingUOM?.id,
          inventoryPrescribingUOMFK: medication?.prescribingUOM?.id,
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
          corPrescriptionItemInstruction: [
            {
              usageMethodFK: medicationusage ? medicationusage.id : undefined,
              usageMethodCode: medicationusage
                ? medicationusage.code
                : undefined,
              usageMethodDisplayValue: medicationusage
                ? medicationusage.name
                : undefined,
              dosageFK: medicationdosage ? medicationdosage.id : undefined,
              dosageCode: medicationdosage ? medicationdosage.code : undefined,
              dosageDisplayValue: medicationdosage
                ? medicationdosage.name
                : undefined,
              prescribeUOMFK: medicationprescribingUOM
                ? medicationprescribingUOM.id
                : undefined,
              prescribeUOMCode: medicationprescribingUOM
                ? medicationprescribingUOM.code
                : undefined,
              prescribeUOMDisplayValue: medicationprescribingUOM
                ? medicationprescribingUOM.name
                : undefined,
              drugFrequencyFK: medicationfrequency
                ? medicationfrequency.id
                : undefined,
              drugFrequencyCode: medicationfrequency
                ? medicationfrequency.code
                : undefined,
              drugFrequencyDisplayValue: medicationfrequency
                ? medicationfrequency.name
                : undefined,
              duration: matchInstruction?.duration,
              stepdose: 'AND',
              sequence: 0,
            },
          ],
          isPackage: true,
          packageCode,
          packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.quantity,
          performingUserFK: visitDoctorUserId,
          packageGlobalId,
          isDispensedByPharmacy: medication.isDispensedByPharmacy,
          isNurseActualizeRequired: medication.isNurseActualizable,
          isExclusive: medication.isExclusive,
          orderable: medication.orderable,
        }
      }
      return item
    }

    const getOrderVaccinationFromPackage = (
      packageCode,
      packageName,
      packageItem,
    ) => {
      const vaccination = inventoryvaccination.find(
        item => item.id === packageItem.inventoryVaccinationFK,
      )

      let item
      if (vaccination.isActive === true) {
        const vaccinationUOM = vaccination.prescribingUOM
        const vaccinationDispenseUOM = vaccination.despensingUOM
        const vaccinationusage = vaccination.vaccinationUsage
        const vaccinationdosage = vaccination.prescribingDosage
        const isDefaultBatchNo = vaccination.vaccinationStock.find(
          o => o.isDefault === true,
        )

        item = {
          isActive: vaccination.isActive,
          inventoryVaccinationFK: vaccination.id,
          vaccinationGivenDate: moment().format(serverDateTimeFormatFull),
          vaccinationCode: vaccination.code,
          vaccinationName: vaccination.displayValue,
          usageMethodFK: vaccinationusage?.id,
          usageMethodCode: vaccinationusage?.code,
          usageMethodDisplayValue: vaccinationusage?.name,
          dosageFK: vaccinationdosage?.id,
          dosageCode: vaccinationdosage?.code,
          dosageDisplayValue: vaccinationdosage?.name,
          uomfk: vaccinationUOM?.id,
          uomCode: vaccinationUOM?.code,
          uomDisplayValue: vaccinationUOM?.name,
          dispenseUOMFK: vaccinationDispenseUOM?.id,
          dispenseUOMCode: vaccinationDispenseUOM?.code,
          dispenseUOMDisplayValue: vaccinationDispenseUOM?.name,
          quantity: packageItem.quantity,
          unitPrice: packageItem.unitPrice,
          totalPrice: packageItem.subTotal,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment: packageItem.subTotal,
          totalAfterOverallAdjustment: packageItem.subTotal,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isPackage: true,
          packageCode,
          packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.quantity,
          performingUserFK: visitDoctorUserId,
          packageGlobalId,
          type: packageItem.type,
          subject: vaccination.displayValue,
          isGenerateCertificate: vaccination.isAutoGenerateCertificate,
          isNurseActualizeRequired: vaccination.isNurseActualizable,
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

    const getOrderServiceCenterServiceFromPackage = (
      packageCode,
      packageName,
      packageItem,
    ) => {
      const service = ctservice.find(
        item => item.id === packageItem.serviceCenterServiceFK,
      )
      let item
      item = {
        isActive: packageItem.isActive,
        serviceCenterServiceFK: packageItem.serviceCenterServiceFK,
        quantity: packageItem.quantity,
        unitPrice: packageItem.unitPrice,
        total: packageItem.subTotal,
        adjAmount: 0,
        adjType: 'ExactAmount',
        adjValue: 0,
        totalAfterItemAdjustment: packageItem.subTotal,
        totalAfterOverallAdjustment: packageItem.subTotal,
        serviceCode: packageItem.serviceCode,
        serviceName: packageItem.serviceName,
        serviceFK: packageItem.serviceFK,
        serviceCenterFK: packageItem.serviceCenterFK,
        isPackage: true,
        packageCode,
        packageName,
        defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
        packageConsumeQuantity: packageItem.consumeQuantity,
        remainingQuantity: packageItem.quantity,
        performingUserFK: visitDoctorUserId,
        packageGlobalId,
        isNurseActualizeRequired: service.isNurseActualizable,
        serviceCenterCategoryFK: service.serviceCenterCategoryFK,
      }
      return item
    }

    const getOrderConsumableFromPackage = (
      packageCode,
      packageName,
      packageItem,
    ) => {
      const consumable = inventoryconsumable.find(
        item => item.id === packageItem.inventoryConsumableFK,
      )

      let item
      if (consumable.isActive === true && consumable.orderable) {
        let isDefaultBatchNo
        let unitOfMeasurement
        if (consumable) {
          isDefaultBatchNo = consumable.consumableStock.find(
            o => o.isDefault === true,
          )

          unitOfMeasurement = consumable.uom ? consumable.uom.name : undefined
        }

        item = {
          inventoryConsumableFK: packageItem.inventoryConsumableFK,
          isActive: packageItem.isActive,
          quantity: packageItem.quantity,
          unitPrice: packageItem.unitPrice,
          totalPrice: packageItem.subTotal,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment: packageItem.subTotal,
          totalAfterOverallAdjustment: packageItem.subTotal,
          consumableCode: packageItem.consumableCode,
          consumableName: packageItem.consumableName,
          unitOfMeasurement,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isPackage: true,
          packageCode,
          packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.quantity,
          performingUserFK: visitDoctorUserId,
          packageGlobalId,
          isDispensedByPharmacy: consumable.isDispensedByPharmacy,
          isNurseActualizeRequired: consumable.isNurseActualizable,
        }
      }
      return item
    }

    const getOrderFromPackage = (packageCode, packageName, packageItem) => {
      let item
      if (packageItem.type === '1') {
        item = getOrderMedicationFromPackage(
          packageCode,
          packageName,
          packageItem,
        )
      }
      if (packageItem.type === '2') {
        item = getOrderVaccinationFromPackage(
          packageCode,
          packageName,
          packageItem,
        )
      }
      if (packageItem.type === '3') {
        item = getOrderServiceCenterServiceFromPackage(
          packageCode,
          packageName,
          packageItem,
        )
      }
      if (packageItem.type === '4') {
        item = getOrderConsumableFromPackage(
          packageCode,
          packageName,
          packageItem,
        )
      }
      return item
    }

    const { packageItems, selectedPackage, expiryDate } = values
    let datas = []
    let nextSequence = getNextSequence()
    for (let index = 0; index < packageItems.length; index++) {
      const newOrder = getOrderFromPackage(
        selectedPackage.code,
        selectedPackage.displayValue,
        packageItems[index],
      )
      if (newOrder) {
        let type = packageItems[index].type
        if (packageItems[index].type === '3') {
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
          subject: packageItems[index].name,
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

    if (datas.length > 0) {
      dispatch({
        type: 'orders/addPackage',
        payload: {
          packageFK: selectedPackage.id,
          packageCode: selectedPackage.code,
          packageName: selectedPackage.displayValue,
          expiryDate,
          totalPrice: _.sumBy(datas, 'totalAfterItemAdjustment') || 0,
          packageGlobalId,
        },
      })
    }

    if (onConfirm) onConfirm()
    if (resetForm) resetForm()
    setValues({
      ...orders.defaultPackage,
      type: orders.type,
    })
  },
  displayName: 'PackagePage',
})
class Package extends PureComponent {
  constructor(props) {
    super(props)
    const { dispatch, classes } = props
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
        force: true,
        filter: {
          'serviceFKNavigation.IsActive': true,
          'serviceCenterFKNavigation.IsActive': true,
          combineCondition: 'and',
        },
      },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventorymedication',
        force: true,
        isActive: true,
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryvaccination',
        force: true,
        isActive: true,
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryconsumable',
        force: true,
        isActive: true,
      },
    })
    dispatch({
      type: 'codetable/batchFetch',
      payload: {
        codes: [
          'ctmedicationusage',
          'ctmedicationunitofmeasurement',
          'ctmedicationfrequency',
          'ctmedicationdosage',
        ],
      },
    })

    const calUnitPrice = e => {
      const { row } = e
      const { subTotal, quantity } = row
      row.unitPrice = 0
      if (subTotal && quantity && quantity !== 0) {
        row.unitPrice = roundTo(subTotal / quantity)
      }
    }

    this.packageItemSchema = Yup.object().shape({
      quantity: Yup.number()
        .required()
        .min(1),
      consumeQuantity: Yup.number()
        .required()
        .min(0, 'Consumed quantity must be greater than or equal to 0')
        .max(Yup.ref('quantity'), 'Consumed quantity cannot exceed Quantity'),
      subTotal: Yup.number()
        .required()
        .min(0),
    })

    this.tableProps = {
      getRowId: r => r.uid,
      columns: [
        { name: 'typeName', title: 'Type' },
        { name: 'name', title: 'Name' },
        { name: 'consumeQuantity', title: 'Consumed' },
        { name: 'quantity', title: 'Quantity' },
        { name: 'subTotal', title: 'Total' },
      ],
      columnExtensions: [
        {
          columnName: 'typeName',
          width: 180,
          type: 'text',
          sortingEnabled: false,
          disabled: true,
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
          type: 'text',
          sortingEnabled: false,
          disabled: true,
        },
        {
          columnName: 'consumeQuantity',
          width: 90,
          type: 'number',
          format: '0.0',
          sortingEnabled: false,
          isDisabled: row => row.isActive !== true,
        },
        {
          columnName: 'quantity',
          width: 90,
          type: 'number',
          format: '0.0',
          sortingEnabled: false,
          isDisabled: row => row.isActive !== true,
          onChange: calUnitPrice,
        },
        {
          columnName: 'subTotal',
          width: 130,
          type: 'number',
          currency: true,
          sortingEnabled: false,
          isDisabled: row => row.isActive !== true,
          onChange: calUnitPrice,
        },
      ],
    }

    const calculateExpiryDate = (duration, durationUnit) => {
      const today = new Date()
      let untilDate
      if (duration) {
        switch (durationUnit) {
          case DURATION_UNIT.DAY:
            untilDate = moment(today)
              .add(duration, 'days')
              .toDate()
            break
          case DURATION_UNIT.WEEK:
            untilDate = moment(today)
              .add(duration, 'weeks')
              .toDate()
            break
          case DURATION_UNIT.MONTH:
            untilDate = moment(today)
              .add(duration, 'months')
              .toDate()
            break
          case DURATION_UNIT.YEAR:
            untilDate = moment(today)
              .add(duration, 'years')
              .toDate()
            break
          default:
            break
        }

        untilDate = new Date(
          Date.UTC(
            untilDate.getUTCFullYear(),
            untilDate.getUTCMonth(),
            untilDate.getUTCDate(),
          ),
        )
      }

      return untilDate
    }

    this.changePackage = (v, op) => {
      const { setValues, values, orderTypes, codetable, patient } = this.props
      const { inventorymedication = [], ctservice = [] } = codetable
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
      if (op && op.medicationPackageItem) {
        rows = rows.concat(
          op.medicationPackageItem.map(o => {
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
            const medication = inventorymedication.find(
              item => item.id === o.inventoryMedicationFK,
            )
            return {
              ...o,
              name: o.medicationName,
              uid: getUniqueId(),
              type: '1',
              typeName:
                orderTypes.find(type => type.value === '1').name +
                (o.isActive === true ? '' : ' (Inactive)'),
              isActive: o.isActive === true,
              caution: o.caution,
              subject: o.medicationName,
              isExclusive: medication.isExclusive,
            }
          }),
        )
      }
      if (op && op.vaccinationPackageItem) {
        rows = rows.concat(
          op.vaccinationPackageItem.map(o => {
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
                (o.isActive === true ? '' : ' (Inactive)'),
              isActive: o.isActive === true,
              caution: o.caution,
              subject: o.vaccinationName,
            }
          }),
        )
      }
      if (op && op.servicePackageItem) {
        rows = rows.concat(
          op.servicePackageItem.map(o => {
            const service = ctservice.find(
              item => item.id === o.serviceCenterServiceFK,
            )
            let typeName = 'Service'
            if (LAB_CATEGORY.indexOf(service.serviceCenterCategoryFK) >= 0) {
              typeName = 'Lab'
            } else if (
              RADIOLOGY_CATEGORY.indexOf(service.serviceCenterCategoryFK) >= 0
            ) {
              typeName = 'Radiology'
            }
            return {
              ...o,
              name: o.serviceName,
              uid: getUniqueId(),
              type: '3',
              typeName: typeName + (o.isActive ? '' : ' (Inactive)'),
              isActive: o.isActive === true,
            }
          }),
        )
      }
      if (op && op.consumablePackageItem) {
        rows = rows.concat(
          op.consumablePackageItem.map(o => {
            return {
              ...o,
              name: o.consumableName,
              uid: getUniqueId(),
              type: '4',
              typeName:
                orderTypes.find(type => type.value === '4').name +
                (o.isActive === true ? '' : ' (Inactive)'),
              isActive: o.isActive === true,
            }
          }),
        )
      }

      let untilDate
      if (op)
        untilDate = calculateExpiryDate(op.validDuration, op.durationUnitFK)

      setValues({
        ...values,
        packageItems: rows,
        selectedPackage: op,
        expiryDate: untilDate,
      })

      if (cautions.length || allergys.length) {
        openCautionAlertPrompt(cautions, allergys, [], () => {})
      }
    }

    this.handleReset = () => {
      const { setValues, orders } = this.props
      setValues({
        ...orders.defaultPackage,
        type: orders.type,
      })
    }
  }

  validateAndSubmitIfOk = async () => {
    const {
      handleSubmit,
      validateForm,
      values: { packageItems = [] },
    } = this.props
    const validateResult = await validateForm()
    const isFormValid = _.isEmpty(validateResult)
    if (isFormValid) {
      const inactivePackageItems = packageItems.filter(f => f.isActive !== true)
      if (inactivePackageItems.length > 0) {
        notification.error({
          message: 'One or more items in the package are inactive.',
        })
        return false
      }

      handleSubmit()
      return true
    }
    return false
  }

  render() {
    const { theme, values, footer, handleSubmit } = this.props

    const SummaryRow = p => {
      const { children } = p
      let countCol = children.find(c => {
        if (!c.props.tableColumn.column) return false
        return c.props.tableColumn.column.name === 'subTotal'
      })

      if (countCol) {
        const newChildren = [
          {
            ...countCol,
            props: {
              ...countCol.props,
              colSpan: 5,
              tableColumn: {
                ...countCol.props.tableColumn,
                align: 'right',
              },
            },
            key: 1111,
          },
        ]
        return <Table.Row {...p}>{newChildren}</Table.Row>
      }
      return <Table.Row {...p}>{children}</Table.Row>
    }

    return (
      <div>
        <GridContainer>
          <GridItem xs={6}>
            <Field
              name='packageFK'
              render={args => {
                return (
                  <div id={`autofocus_${values.type}`}>
                    <CodeSelect
                      temp
                      label='Package Name'
                      code='package'
                      labelField='displayValue'
                      onChange={this.changePackage}
                      {...args}
                    />
                  </div>
                )
              }}
            />
          </GridItem>
          <GridItem xs={2}>
            <Field
              name='expiryDate'
              render={args => {
                return <DatePicker label='Expiry Date' {...args} />
              }}
            />
          </GridItem>
          <GridItem xs={12}>
            <EditableTableGrid
              rows={values.packageItems}
              style={{
                margin: `${theme.spacing(1)}px 0`,
              }}
              {...this.tableProps}
              schema={this.packageItemSchema}
              EditingProps={{
                showCommandColumn: false,
              }}
              FuncProps={{
                pager: false,
                summary: true,
                summaryConfig: {
                  state: {
                    totalItems: [{ columnName: 'subTotal', type: 'sum' }],
                  },
                  integrated: {
                    calculator: IntegratedSummary.defaultCalculator,
                  },
                  row: {
                    totalRowComponent: SummaryRow,
                    messages: {
                      sum: 'Sub Total',
                    },
                  },
                },
              }}
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
export default Package
