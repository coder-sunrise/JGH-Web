import React, { PureComponent } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import Add from '@material-ui/icons/Add'
import Delete from '@material-ui/icons/Delete'
import { formatMessage } from 'umi'
import { isNumber } from 'util'
import { qtyFormat } from '@/utils/config'
import numeral from 'numeral'
import { Alert } from 'antd'
import {
  VISIT_TYPE,
  CANNED_TEXT_TYPE,
  NURSE_WORKITEM_STATUS,
} from '@/utils/constants'
import {
  Button,
  GridContainer,
  GridItem,
  TextField,
  Select,
  CodeSelect,
  DatePicker,
  Checkbox,
  NumberInput,
  withFormikExtend,
  FastField,
  FieldArray,
  Tooltip,
  Field,
  CommonModal,
  ProgressButton,
  notification,
  EditableTableGrid,
  Switch,
  LocalSearchSelect,
} from '@/components'
import Yup from '@/utils/yup'
import {
  calculateAdjustAmount,
  getUniqueId,
  getTranslationValue,
} from '@/utils/utils'
import { ENABLE_PRESCRIPTION_SET_CLINIC_ROLE } from '@/utils/constants'
import { currencySymbol } from '@/utils/config'
import Authorized from '@/utils/Authorized'
import {
  GetOrderItemAccessRight,
  getDrugAllergy,
} from '@/pages/Widgets/Orders/utils'
import { DoctorProfileSelect } from '@/components/_medisys'
import moment from 'moment'
import CannedTextButton from '@/pages/Widgets/Orders/Detail/CannedTextButton'
import { isMatchInstructionRule } from '@/pages/Widgets/Orders/utils'
import LowStockInfo from './LowStockInfo'
import AddFromPast from './AddMedicationFromPast'
import PrescriptionSet from './PrescriptionSet'
import consultationDocument from '@/models/consultationDocument'
import { SubscriptionsOutlined } from '@material-ui/icons'
import { openCautionAlertPrompt } from '@/pages/Widgets/Orders/utils'

const authorityCfg = {
  '1': 'queue.consultation.order.medication',
  '5': 'queue.consultation.order.openprescription',
}

const drugMixtureItemSchema = Yup.object().shape({
  inventoryMedicationFK: Yup.string().required(),
  quantity: Yup.number().min(0),
  totalPrice: Yup.number().min(0),
})

const showCautions = (
  inventorymedication = [],
  isDrugMixture,
  corPrescriptionItemDrugMixture = [],
  inventoryMedicationFK,
  patient,
) => {
  const { entity = {} } = patient
  const { patientAllergy = [] } = entity
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

  if (isDrugMixture) {
    corPrescriptionItemDrugMixture
      .filter(o => !o.isDeleted)
      .forEach(item => {
        const selectMedication = inventorymedication.find(
          medication => medication.id === item.inventoryMedicationFK,
        )
        if (selectMedication) {
          if (
            selectMedication.caution &&
            selectMedication.caution.trim().length
          ) {
            cautions.push({
              type: 'Medication',
              subject: selectMedication.displayValue,
              caution: selectMedication.caution,
              id: item.id,
            })
          }

          insertAllergys(item.inventoryMedicationFK)
        }
      })
  } else {
    const selectMedication = inventorymedication.find(
      medication => medication.id === inventoryMedicationFK,
    )
    insertAllergys(inventoryMedicationFK)

    if (
      selectMedication &&
      selectMedication.caution &&
      selectMedication.caution.trim().length
    ) {
      cautions.push({
        type: 'Medication',
        subject: selectMedication.displayValue,
        caution: selectMedication.caution,
        id: inventoryMedicationFK,
      })
    }
  }
  if (cautions.length || allergys.length) {
    openCautionAlertPrompt(cautions, allergys, [], () => {})
  }
}

const getVisitDoctorUserId = props => {
  const { doctorprofile } = props.codetable
  const { doctorProfileFK } = props.visitRegistration.entity.visit
  let visitDoctorUserId
  if (doctorprofile && doctorProfileFK) {
    visitDoctorUserId = doctorprofile.find(d => d.id === doctorProfileFK)
      .clinicianProfile.userProfileFK
  }

  return visitDoctorUserId
}

@connect(
  ({
    global,
    codetable,
    visitRegistration,
    user,
    patient,
    clinicSettings,
  }) => ({
    global,
    codetable,
    visitRegistration,
    user,
    patient,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
  }),
)
@withFormikExtend({
  mapPropsToValues: ({
    orders = {},
    type,
    codetable,
    visitRegistration,
    clinicSettings,
  }) => {
    const isDrugMixture = orders.entity && orders.entity.isDrugMixture
    const editingMedicationFK = []
    if (isDrugMixture) {
      const mixtureItems = orders.entity.corPrescriptionItemDrugMixture || []
      mixtureItems
        .filter(o => !o.isDeleted)
        .map(m => editingMedicationFK.push(m.inventoryMedicationFK))
    } else if (orders.entity && orders.entity.inventoryMedicationFK) {
      editingMedicationFK.push(orders.entity.inventoryMedicationFK)
    }

    const v = {
      ...(orders.entity || orders.defaultMedication),
      type,
      visitPurposeFK: orders.visitPurposeFK,
      isEditMedication: !_.isEmpty(orders.entity),
      editingMedicationFK,
    }
    if (type === '5') {
      const { isEnablePharmacyModule = false } = clinicSettings
      v.drugCode = 'MISC'
      v.isDispensedByPharmacy = isEnablePharmacyModule
    }
    if (v.uid) {
      if (v.adjAmount <= 0) {
        v.adjValue = Math.abs(v.adjValue || 0)
        v.isMinus = true
      } else {
        v.isMinus = false
      }

      v.isExactAmount = v.adjType !== 'Percentage'
    }

    if (_.isEmpty(orders.entity)) {
      const { doctorprofile } = codetable
      if (visitRegistration && visitRegistration.entity) {
        const { doctorProfileFK } = visitRegistration.entity.visit
        if (doctorprofile && doctorProfileFK) {
          v.performingUserFK = doctorprofile.find(
            d => d.id === doctorProfileFK,
          ).clinicianProfile.userProfileFK
        }
      }
    }

    let sequence = 0
    const newCorPrescriptionItemPrecaution = (
      v.corPrescriptionItemPrecaution || []
    ).map(precaution => {
      sequence += 1
      return {
        ...precaution,
        sequence,
      }
    })

    let newDrugMixtureRowId = 0
    const newCorPrescriptionItemDrugMixture = (
      v.corPrescriptionItemDrugMixture || []
    ).map(drugMixture => {
      newDrugMixtureRowId -= 1
      return {
        ...drugMixture,
        id: drugMixture.isNew ? newDrugMixtureRowId : drugMixture.id,
      }
    })

    const { inventorymedication = [] } = codetable

    const medication = inventorymedication.find(
      item => item.id === v.inventoryMedicationFK,
    )
    return {
      ...v,
      corPrescriptionItemPrecaution:
        newCorPrescriptionItemPrecaution.length > 0
          ? newCorPrescriptionItemPrecaution
          : [{}],
      corPrescriptionItemDrugMixture:
        newCorPrescriptionItemDrugMixture.length > 0
          ? newCorPrescriptionItemDrugMixture
          : [],
      selectedMedication: medication || {
        medicationStock: [],
      },
    }
  },
  enableReinitialize: true,

  validationSchema: Yup.object().shape({
    quantity: Yup.number()
      .min(0.0, 'Quantity must be between 0.0 and 999')
      .max(999, 'Quantity must be between 0.0 and 999')
      .required(),
    dispenseUOMFK: Yup.number().required(),
    totalPrice: Yup.number().required(),
    totalAfterItemAdjustment: Yup.number().min(
      0.0,
      'The amount should be more than 0.00',
    ),
    type: Yup.string(),
    inventoryMedicationFK: Yup.number().when(
      ['type', 'isDrugMixture'],
      (type, isDrugMixture) => {
        if (type === '1' && !isDrugMixture) return Yup.number().required()
        return Yup.number()
      },
    ),

    drugName: Yup.string().when(
      ['type', 'isDrugMixture'],
      (type, isDrugMixture) => {
        if (type === '5') return Yup.string().required()
        if (type === '1' && isDrugMixture) return Yup.string().required()
        return Yup.string()
      },
    ),
    corPrescriptionItemInstruction: Yup.array().of(
      Yup.object().shape({
        sequence: Yup.number().required(),
        stepdose: Yup.string().required(),
      }),
    ),
    corPrescriptionItemDrugMixture: Yup.array().when(
      ['type', 'isDrugMixture'],
      (type, isDrugMixture) => {
        if (type === '1' && isDrugMixture)
          return Yup.array()
            .compact(v => v.isDeleted)
            .of(drugMixtureItemSchema)
        return Yup.array().compact(v => v.isDeleted)
      },
    ),
    performingUserFK: Yup.number().required(),
  }),

  handleSubmit: (values, { props, onConfirm, setValues }) => {
    const {
      dispatch,
      currentType,
      getNextSequence,
      user,
      orders,
      clinicSettings,
      codetable,
      openPrescription,
    } = props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const {
      inventorymedication = [],
      ctmedicationusage = [],
      ctmedicationunitofmeasurement = [],
      ctmedicationfrequency = [],
      ctmedicationdosage = [],
    } = codetable

    if (!values.isDrugMixture && !openPrescription) {
      const medication = inventorymedication.find(
        drug => drug.id === values.inventoryMedicationFK,
      )
      const uom = ctmedicationunitofmeasurement.find(
        uom => uom.id === values.dispenseUOMFK,
      )
      values.drugName = medication?.displayValue
      values.dispenseUOMDisplayValue = getTranslationValue(
        uom?.translationData,
        primaryPrintoutLanguage,
        'displayValue',
      )
      values.secondDispenseUOMDisplayValue =
        secondaryPrintoutLanguage !== ''
          ? getTranslationValue(
              uom?.translationData,
              secondaryPrintoutLanguage,
              'displayValue',
            )
          : ''
    } else {
      const uom = ctmedicationunitofmeasurement.find(
        uom => uom.id === values.dispenseUOMFK,
      )
      values.dispenseUOMDisplayValue = getTranslationValue(
        uom?.translationData,
        primaryPrintoutLanguage,
        'displayValue',
      )
      values.secondDispenseUOMDisplayValue =
        secondaryPrintoutLanguage !== ''
          ? getTranslationValue(
              uom?.translationData,
              secondaryPrintoutLanguage,
              'displayValue',
            )
          : ''
    }

    const getInstruction = (instructions, language) => {
      let instruction = ''
      let nextStepdose = ''
      const activeInstructions = instructions
        ? instructions.filter(item => !item.isDeleted)
        : undefined
      if (activeInstructions) {
        for (let index = 0; index < activeInstructions.length; index++) {
          let item = activeInstructions[index]
          const usage = ctmedicationusage.find(
            usage => usage.id === item.usageMethodFK,
          )
          const uom = ctmedicationunitofmeasurement.find(
            uom => uom.id === item.prescribeUOMFK,
          )
          const frequency = ctmedicationfrequency.find(
            frequency => frequency.id === item.drugFrequencyFK,
          )
          const dosage = ctmedicationdosage.find(
            dosage => dosage.id === item.dosageFK,
          )
          if (instruction !== '') {
            instruction += ' '
          }

          if (index < activeInstructions.length - 1) {
            nextStepdose = ` ${activeInstructions[index + 1].stepdose}`
          } else {
            nextStepdose = ''
          }
          let itemDuration = item.duration ? ` For ${item.duration} day(s)` : ''
          let separator = nextStepdose
          if (language === 'JP') {
            separator = nextStepdose === '' ? '<br>' : ''
            itemDuration = item.duration ? `${item.duration} 日分` : ''
          }
          let usagePrefix = ''
          if (language === 'JP' && item.dosageFK) {
            usagePrefix = '1回'
          } else {
            usagePrefix = getTranslationValue(
              usage?.translationData,
              language,
              'displayValue',
            )
          }
          instruction += `${usagePrefix} ${getTranslationValue(
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
          )}${itemDuration}${separator}`
        }
      }
      return instruction
    }

    const instruction = getInstruction(
      values.corPrescriptionItemInstruction,
      primaryPrintoutLanguage,
    )
    const secondInstruction =
      secondaryPrintoutLanguage !== ''
        ? getInstruction(
            values.corPrescriptionItemInstruction,
            secondaryPrintoutLanguage,
          )
        : ''

    const corPrescriptionItemPrecaution = values.corPrescriptionItemPrecaution.filter(
      i => i.medicationPrecautionFK !== undefined,
    )

    const activeInstruction = values.corPrescriptionItemInstruction.filter(
      item => !item.isDeleted,
    )

    // reorder and overwrite sequence
    corPrescriptionItemPrecaution.forEach((item, index) => {
      if (!item.isDeleted) item.sequence = index + 1
    })

    // reorder and overwrite sequence
    activeInstruction.forEach((item, index) => {
      const usage = ctmedicationusage.find(
        usage => usage.id === item.usageMethodFK,
      )
      const prescribeUOM = ctmedicationunitofmeasurement.find(
        uom => uom.id === item.prescribeUOMFK,
      )
      const drugFrequency = ctmedicationfrequency.find(
        frequency => frequency.id === item.drugFrequencyFK,
      )
      const dosage = ctmedicationdosage.find(
        dosage => dosage.id === item.dosageFK,
      )
      item.usageMethodDisplayValue = usage?.displayValue
      item.prescribeUOMDisplayValue = prescribeUOM?.displayValue
      item.drugFrequencyDisplayValue = drugFrequency?.displayValue
      item.dosageDisplayValue = dosage?.displayValue

      item.sequence = index + 1
    })

    if (values.corPrescriptionItemDrugMixture) {
      const activeDrugMixtureItems = values.corPrescriptionItemDrugMixture.filter(
        item => !item.isDeleted,
      )
      // reorder and overwrite sequence, get combined drug name
      activeDrugMixtureItems.forEach((item, index) => {
        const medication = inventorymedication.find(
          drug => drug.id === item.inventoryMedicationFK,
        )
        const uom = ctmedicationunitofmeasurement.find(
          uom => uom.id === item.uomfk,
        )
        const prescribeUOM = ctmedicationunitofmeasurement.find(
          uom => uom.id === item.prescribeUOMFK,
        )
        item.drugName = medication?.displayValue
        item.uomDisplayValue = getTranslationValue(
          uom?.translationData,
          primaryPrintoutLanguage,
          'displayValue',
        )
        item.secondUOMDisplayValue =
          secondaryPrintoutLanguage !== ''
            ? getTranslationValue(
                uom?.translationData,
                secondaryPrintoutLanguage,
                'displayValue',
              )
            : ''
        item.prescribeUOMDisplayValue = prescribeUOM?.displayValue
        item.sequence = index
        if (item.isNew && item.id < 0) item.id = undefined
      })
    }

    const data = {
      isOrderedByDoctor:
        user.data.clinicianProfile.userProfile.role.clinicRoleFK === 1,
      sequence: getNextSequence(),
      ...values,
      corPrescriptionItemPrecaution,
      instruction,
      secondInstruction,
      subject: currentType.getSubject({ ...values }),
      isDeleted: false,
      adjValue:
        values.adjAmount < 0
          ? -Math.abs(values.adjValue)
          : Math.abs(values.adjValue),
      adjType: values.isExactAmount ? 'ExactAmount' : 'Percentage',
      packageGlobalId:
        values.packageGlobalId !== undefined ? values.packageGlobalId : '',
    }
    dispatch({
      type: 'orders/upsertRow',
      payload: data,
    })

    if (onConfirm) onConfirm()

    setValues({
      ...orders.defaultMedication,
      type: orders.type,
      visitPurposeFK: orders.visitPurposeFK,
      drugCode: orders.type === '5' ? 'MISC' : undefined,
      selectedMedication: {
        medicationStock: [],
      },
      performingUserFK: getVisitDoctorUserId(props),
    })
    return true
  },
  displayName: 'OrderPage',
})
class Medication extends PureComponent {
  state = {
    showAddFromPastModal: false,
    showAddFromPrescriptionSetModal: false,
    isPreOrderItemExists: false,
  }

  getActionItem = (
    i,
    arrayHelpers,
    prop,
    tooltip,
    defaultValue,
    isStartedMedication,
  ) => {
    const { theme, values, setFieldValue } = this.props
    const activeRows = values[prop].filter(item => !item.isDeleted) || []
    return (
      <div style={{ position: 'absolute', bottom: 4, right: 0 }}>
        {activeRows.length > 1 && (
          <Button justIcon color='danger' disabled={isStartedMedication}>
            <Delete
              onClick={() => {
                setFieldValue(`${prop}[${i}].isDeleted`, true)
                if (prop === 'corPrescriptionItemInstruction') {
                  setTimeout(() => {
                    this.calculateQuantity()
                  }, 1)
                }
              }}
            />
          </Button>
        )}
        {activeRows.length < 3 && (
          <Button
            disabled={isStartedMedication}
            justIcon
            color='info'
            onClick={() => {
              this.handleAddStepdose(arrayHelpers, defaultValue, prop)
            }}
          >
            <Tooltip title={tooltip}>
              <Add />
            </Tooltip>
          </Button>
        )}
      </div>
    )
  }

  checkIsPreOrderItemExistsInListing = isPreOrderChecked => {
    const {
      setFieldValue,
      values,
      codetable,
      visitRegistration,
      patient,
      orders = {},
    } = this.props
    if (isPreOrderChecked) {
      const medicationPreOrderItem = patient?.entity?.pendingPreOrderItem.filter(
        x => x.preOrderItemType === 'Medication',
      )
      if (medicationPreOrderItem) {
        medicationPreOrderItem.filter(item => {
          const { preOrderMedicationItem = {} } = item
          const CheckIfPreOrderItemExists =
            preOrderMedicationItem.inventoryMedicationFK ===
            values.inventoryMedicationFK
          if (CheckIfPreOrderItemExists) {
            this.setState({ isPreOrderItemExists: true })
            return
          }
        })
      }
    } else {
      this.setState({ isPreOrderItemExists: false })
    }
  }

  calculateQuantity = medication => {
    const { codetable, setFieldValue, values } = this.props
    if (values.isDrugMixture || values.isPackage) return
    let currentMedication = medication || values.selectedMedication

    const { form } = this.descriptionArrayHelpers
    let newTotalQuantity = 0

    // when select medication, TotalQuantity = dispensingQuantity, else calculate quantity by Instructions

    const prescriptionItem = form.values.corPrescriptionItemInstruction.filter(
      item => !item.isDeleted,
    )
    const dosageUsageList = codetable.ctmedicationdosage
    const medicationFrequencyList = codetable.ctmedicationfrequency
    for (let i = 0; i < prescriptionItem.length; i++) {
      if (
        prescriptionItem[i].dosageFK &&
        prescriptionItem[i].drugFrequencyFK &&
        prescriptionItem[i].duration
      ) {
        const dosage = dosageUsageList.find(
          o => o.id === prescriptionItem[i].dosageFK,
        )

        const frequency = medicationFrequencyList.find(
          o => o.id === prescriptionItem[i].drugFrequencyFK,
        )

        newTotalQuantity +=
          dosage.multiplier *
          frequency.multiplier *
          prescriptionItem[i].duration
      }
    }

    newTotalQuantity = Math.ceil(newTotalQuantity * 10) / 10 || 0
    const { conversion } = currentMedication
    if (conversion) newTotalQuantity = Math.ceil(newTotalQuantity / conversion)
    setFieldValue(`quantity`, newTotalQuantity)

    if (
      values.isExternalPrescription === undefined ||
      values.isExternalPrescription === false
    ) {
      let unitprice = currentMedication.sellingPrice || 0
      setFieldValue('unitPrice', unitprice)
      this.updateTotalPrice(unitprice * newTotalQuantity)
    }
  }

  setTotalPrice = () => {
    const { values, disableEdit } = this.props
    if (values.isDrugMixture || values.isPackage) return

    if (disableEdit === false) {
      const total = (values.quantity || 0) * (values.unitPrice || 0)
      this.updateTotalPrice(total)
    }
  }

  handleAddStepdose = (arrayHelpers, defaultValue, prop) => {
    const { values } = this.props
    arrayHelpers.push(defaultValue)
    if (prop === 'corPrescriptionItemInstruction') {
      this.setInstruction(values.corPrescriptionItemInstruction.length)

      setTimeout(() => {
        this.calculateQuantity()
      }, 1)
    }
  }

  setInstruction = (index = 0) => {
    const { setFieldValue, codetable, values } = this.props
    const { selectedMedication } = values
    let op = selectedMedication

    if (!selectedMedication || !selectedMedication.id) {
      op = codetable.inventorymedication.find(
        o => o.id === values.inventoryMedicationFK,
      )
    }

    if (!op) return

    setFieldValue(
      `corPrescriptionItemInstruction[${index}].usageMethodFK`,
      op.medicationUsage ? op.medicationUsage.id : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].usageMethodCode`,
      op.medicationUsage ? op.medicationUsage.code : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].usageMethodDisplayValue`,
      op.medicationUsage ? op.medicationUsage.name : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].dosageFK`,
      op.prescribingDosage ? op.prescribingDosage.id : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].dosageCode`,
      op.prescribingDosage ? op.prescribingDosage.code : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].dosageDisplayValue`,
      op.prescribingDosage ? op.prescribingDosage.name : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].prescribeUOMFK`,
      op.prescribingUOM ? op.prescribingUOM.id : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].prescribeUOMCode`,
      op.prescribingUOM ? op.prescribingUOM.code : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].prescribeUOMDisplayValue`,
      op.prescribingUOM ? op.prescribingUOM.name : undefined,
    )

    setFieldValue(
      `corPrescriptionItemInstruction[${index}].drugFrequencyFK`,
      op.medicationFrequency ? op.medicationFrequency.id : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].drugFrequencyCode`,
      op.medicationFrequency ? op.medicationFrequency.code : undefined,
    )
    setFieldValue(
      `corPrescriptionItemInstruction[${index}].drugFrequencyDisplayValue`,
      op.medicationFrequency ? op.medicationFrequency.name : undefined,
    )
    if (op.duration)
      setFieldValue(
        `corPrescriptionItemInstruction[${index}].duration`,
        op.duration,
      )
  }

  getMedicationOptions = () => {
    const {
      codetable: { inventorymedication = [] },
    } = this.props
    return inventorymedication
      .filter(m => m.orderable)
      .reduce((p, c) => {
        const { code, displayValue, sellingPrice = 0, dispensingUOM = {} } = c
        const { name: uomName = '' } = dispensingUOM
        let opt = {
          ...c,
          combinDisplayValue: `${displayValue} - ${code}`,
        }
        return [...p, opt]
      }, [])
  }

  changeMedication = (
    v,
    op = {
      medicationStock: [],
    },
  ) => {
    const {
      setFieldValue,
      values,
      codetable,
      visitRegistration,
      patient,
      orders = {},
    } = this.props
    const { corVitalSign = [] } = orders
    const { ctmedicationprecaution } = codetable
    setFieldValue('costPrice', op.averageCostPrice || 0)
    const {
      corPrescriptionItemInstruction = [],
      corPrescriptionItemPrecaution = [],
      visitPurposeFK,
    } = values
    let defaultInstruction = {
      sequence: 0,
      stepdose: 'AND',
      uid: getUniqueId(),
    }

    const { isPreOrderItemExists } = this.state

    let matchInstruction
    if (op.id) {
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
      const { dob } = patient.entity
      const { medicationInstructionRule = [] } = op
      let age
      if (dob) {
        age = Math.floor(moment.duration(moment().diff(dob)).asYears())
      }
      matchInstruction = medicationInstructionRule.find(i =>
        isMatchInstructionRule(i, age, weightKG),
      )
      const medicationfrequency = matchInstruction?.medicationFrequency
      const medicationdosage = matchInstruction?.prescribingDosage

      defaultInstruction = {
        ...defaultInstruction,
        usageMethodFK: op.medicationUsage ? op.medicationUsage.id : undefined,
        usageMethodCode: op.medicationUsage
          ? op.medicationUsage.code
          : undefined,
        usageMethodDisplayValue: op.medicationUsage
          ? op.medicationUsage.name
          : undefined,
        dosageFK: medicationdosage ? medicationdosage.id : undefined,
        dosageCode: medicationdosage ? medicationdosage.code : undefined,
        dosageDisplayValue: medicationdosage
          ? medicationdosage.name
          : undefined,
        prescribeUOMFK: op.prescribingUOM ? op.prescribingUOM.id : undefined,
        prescribeUOMCode: op.prescribingUOM
          ? op.prescribingUOM.code
          : undefined,
        prescribeUOMDisplayValue: op.prescribingUOM
          ? op.prescribingUOM.name
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
      }
      if (values.isPreOrder) this.props.setFieldValue('isPreOrder', false)
      if (isPreOrderItemExists) this.setState({ isPreOrderItemExists: false })
    }

    const isEdit = !!values.id
    const newPrescriptionInstruction = isEdit
      ? [
          ...corPrescriptionItemInstruction.map(i => ({
            ...i,
            isDeleted: true,
          })),
          defaultInstruction,
        ]
      : [defaultInstruction]

    setFieldValue('corPrescriptionItemInstruction', newPrescriptionInstruction)
    setFieldValue('isActive', op.isActive)
    setFieldValue('orderable', op.orderable)
    setFieldValue('selectedMedication', op)

    if (
      op.inventoryMedication_MedicationPrecaution &&
      op.inventoryMedication_MedicationPrecaution.length > 0
    ) {
      op.inventoryMedication_MedicationPrecaution.forEach((im, i) => {
        const precaution = ctmedicationprecaution.find(
          t => t.id === im.medicationPrecautionFK,
        )
        setFieldValue(
          `corPrescriptionItemPrecaution[${i}].medicationPrecautionFK`,
          im.medicationPrecautionFK,
        )
        setFieldValue(
          `corPrescriptionItemPrecaution[${i}].precaution`,
          precaution.displayValue,
        )
        setFieldValue(
          `corPrescriptionItemPrecaution[${i}].precautionCode`,
          precaution.code,
        )
        setFieldValue(`corPrescriptionItemPrecaution[${i}].sequence`, i)
        setFieldValue(`corPrescriptionItemPrecaution[${i}].uid`, getUniqueId())
      })
    } else {
      const defaultPrecaution = {
        precaution: '',
        sequence: 0,
        uid: getUniqueId(),
      }
      const newPrescriptionPrecaution = isEdit
        ? [
            ...corPrescriptionItemPrecaution.map(i => ({
              ...i,
              isDeleted: true,
            })),
            defaultPrecaution,
          ]
        : [defaultPrecaution]

      setFieldValue(`corPrescriptionItemPrecaution`, newPrescriptionPrecaution)
    }

    setFieldValue('dispenseUOMFK', op?.dispensingUOM?.id)
    setFieldValue('inventoryDispenseUOMFK', op?.dispensingUOM?.id)
    setFieldValue('inventoryPrescribingUOMFK', op?.prescribingUOM?.id)
    setFieldValue(
      'dispenseUOMCode',
      op.dispensingUOM ? op.dispensingUOM.code : [],
    )
    setFieldValue(
      'dispenseUOMDisplayValue',
      op.dispensingUOM ? op.dispensingUOM.name : [],
    )

    if (!values.isDrugMixture) {
      setFieldValue('drugCode', op.code)
      setFieldValue('drugName', op.displayValue)

      setFieldValue('isMinus', true)
      setFieldValue('isExactAmount', true)
      setFieldValue('adjValue', 0)
      setFieldValue('quantity', matchInstruction?.dispensingQuantity || 0)
      let unitprice = op.sellingPrice || 0
      setFieldValue('unitPrice', unitprice)
      this.updateTotalPrice(
        unitprice * (matchInstruction?.dispensingQuantity || 0),
      )
      setFieldValue('isDispensedByPharmacy', op.isDispensedByPharmacy)
      setFieldValue('isNurseActualizeRequired', op.isNurseActualizable)
      setFieldValue('isExclusive', op.isExclusive)
      if (op) {
        const { codetable } = this.props
        const { inventorymedication = [] } = codetable

        showCautions(
          inventorymedication,
          values.isDrugMixture,
          values.corPrescriptionItemDrugMixture,
          op.id,
          patient,
        )
      }
    }
  }

  updateTotalPrice = v => {
    if (v || v === 0) {
      const { isExactAmount, isMinus, adjValue } = this.props.values
      let value = adjValue
      if (!isMinus) {
        value = Math.abs(adjValue)
      } else {
        value = -Math.abs(adjValue)
      }

      const finalAmount = calculateAdjustAmount(
        isExactAmount,
        v,
        value || adjValue,
      )
      this.props.setFieldValue('totalAfterItemAdjustment', finalAmount.amount)
      this.props.setFieldValue('adjAmount', finalAmount.adjAmount)
      this.props.setFieldValue(
        'adjType',
        isExactAmount ? 'ExactAmount' : 'Percentage',
      )
      this.props.setFieldValue('totalPrice', v)
    } else {
      this.props.setFieldValue('totalPrice', v)
      this.props.setFieldValue('totalAfterItemAdjustment', undefined)
      this.props.setFieldValue('adjAmount', undefined)
    }
  }

  handleReset = () => {
    const { setValues, orders, dispatch } = this.props

    setValues({
      ...orders.defaultMedication,
      type: orders.type,
      visitPurposeFK: orders.visitPurposeFK,
      drugCode: orders.type === '5' ? 'MISC' : undefined,
      selectedMedication: {
        medicationStock: [],
      },
      performingUserFK: getVisitDoctorUserId(this.props),
    })

    dispatch({
      type: 'global/updateState',
      payload: {
        disableSave: false,
      },
    })
  }

  filterOptions = (input = '', option) => {
    let match = false
    try {
      const lowerCaseInput = input.toLowerCase()

      const { props } = option
      const { code, name, displayValue } = props.data
      let title = name ? name.toLowerCase() : displayValue.toLowerCase()
      match =
        code.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
        title.toLowerCase().indexOf(lowerCaseInput) >= 0
    } catch (error) {
      console.log(error)
      match = false
    }
    return match
  }

  componentDidMount = async () => {
    const { codetable, dispatch } = this.props
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'inventorymedication', force: true },
    })
    const { inventorymedication = [] } = codetable
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctmedicationprecaution' },
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.orders.type === this.props.type)
      if (
        (!this.props.global.openAdjustment &&
          nextProps.global.openAdjustment) ||
        nextProps.orders.shouldPushToState
      ) {
        if (nextProps.values.uid) {
          nextProps.dispatch({
            type: 'orders/updateState',
            payload: {
              entity: nextProps.values,
              shouldPushToState: false,
            },
          })
        }
      }
  }

  onSearchMedicationHistory = async () => {
    this.toggleAddFromPastModal()
  }

  toggleAddFromPastModal = () => {
    const { showAddFromPastModal } = this.state
    this.setState({ showAddFromPastModal: !showAddFromPastModal })
  }

  onSearchPrescriptionSet = async () => {
    this.toggleAddFromPrescriptionSetModal()
  }

  toggleAddFromPrescriptionSetModal = () => {
    const { showAddFromPrescriptionSetModal } = this.state
    this.setState({
      showAddFromPrescriptionSetModal: !showAddFromPrescriptionSetModal,
    })
  }

  validateAndSubmitIfOk = async () => {
    const {
      handleSubmit,
      validateForm,
      values,
      codetable,
      setFieldValue,
    } = this.props
    const validateResult = await validateForm()
    const isFormValid = _.isEmpty(validateResult)
    if (isFormValid) {
      const {
        type,
        isDrugMixture,
        corPrescriptionItemDrugMixture = [],
      } = values

      let drugMixtureItems
      if (type === '1' && isDrugMixture) {
        const { inventorymedication = [] } = codetable
        let sequence = 0
        drugMixtureItems = corPrescriptionItemDrugMixture
          .filter(o => o.id > 0 || !o.isDeleted)
          .map(m => {
            let drug =
              inventorymedication.find(f => f.id === m.inventoryMedicationFK) ||
              {}
            return {
              ...m,
              sequence: sequence++,
              subject: m.drugName,
              caution: drug.caution,
            }
          })
        if (drugMixtureItems.filter(o => !o.isDeleted).length < 2) {
          notification.warn({
            message: 'At least two medications are required',
          })
          return false
        }

        setFieldValue('corPrescriptionItemDrugMixture', drugMixtureItems)
      }
      handleSubmit()
      return true
    }
    handleSubmit()
    return false
  }

  handleDrugMixtureItemOnChange = e => {
    const { option, row } = e
    const {
      values,
      setFieldValue,
      visitRegistration,
      patient,
      orders = {},
      codetable,
    } = this.props
    const { corVitalSign = [] } = orders
    const { drugName = '' } = values
    const activeDrugMixtureRows = (
      values.corPrescriptionItemDrugMixture || []
    ).filter(item => !item.isDeleted)
    const rs = values.corPrescriptionItemDrugMixture.filter(
      o =>
        !o.isDeleted &&
        o.inventoryMedicationFK === option.id &&
        o.id !== row.id,
    )
    if (rs.length > 0) {
      e.row.inventoryMedicationFK = undefined
      if (activeDrugMixtureRows[0].id === row.id) {
        this.changeMedication()
      }
      notification.warn({
        message: 'The medication already exist in the list',
      })
      e.onValueChange()
    } else {
      setFieldValue(
        'drugName',
        (drugName === ''
          ? option.displayValue
          : `${drugName}/${option.displayValue}`
        ).substring(0, 60),
      )
      const { inventorymedication = [] } = codetable
      showCautions(
        inventorymedication,
        values.isDrugMixture,
        [
          ...values.corPrescriptionItemDrugMixture.filter(
            o => o.id !== e.row.id,
          ),
          { inventoryMedicationFK: option.id },
        ],
        null,
        patient,
      )
      if (activeDrugMixtureRows[0].id === row.id) {
        const currentMedication = inventorymedication.find(
          o => o.id === row.inventoryMedicationFK,
        )
        if (currentMedication) {
          this.changeMedication(
            activeDrugMixtureRows[0].inventoryMedicationFK,
            currentMedication,
          )
        }
      }
    }

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

    const { dob } = patient.entity
    const { medicationInstructionRule = [] } = option
    let age
    if (dob) {
      age = Math.floor(moment.duration(moment().diff(dob)).asYears())
    }
    const matchInstruction = medicationInstructionRule.find(i =>
      isMatchInstructionRule(i, age, weightKG),
    )

    row.quantity = matchInstruction?.dispensingQuantity || 0
    row.uomfk = option.dispensingUOM.id
    row.uomCode = option.dispensingUOM.code
    row.uomDisplayValue = option.dispensingUOM.name
    row.costPrice = option.averageCostPrice || 0
    row.unitPrice = option.sellingPrice || 0
    row.totalPrice = row.unitPrice * row.quantity
    row.drugCode = option.code
    row.drugName = option.displayValue
    row.revenueCategoryFK = option.revenueCategoryFK
    row.isDispensedByPharmacy = option.isDispensedByPharmacy
    row.isNurseActualizeRequired = option.isNurseActualizable
    row.prescribeUOMFK = option.prescribingUOM?.id
    row.prescribeUOMCode = option.prescribingUOM?.code
    row.prescribeUOMDisplayValue = option.prescribingUOM?.name
    row.inventoryDispenseUOMFK = option.dispensingUOM.id
    row.inventoryPrescribingUOMFK = option.prescribingUOM?.id
    row.isActive = option.isActive
    row.orderable = option.orderable
  }

  handleDrugMixtureItemQuantityOnChange = e => {
    const { row } = e
    row.totalPrice = row.unitPrice * row.quantity
  }

  checkIsDrugMixtureItemUnique = ({ rows, changed }) => {
    if (!changed) return rows
    const key = Object.keys(changed)[0]
    const obj = changed[key]
    if (obj.inventoryMedicationFK !== undefined) {
      const hasDuplicate = rows.filter(
        i =>
          !i.isDeleted && i.inventoryMedicationFK === obj.inventoryMedicationFK,
      )
      if (hasDuplicate.length >= 2) {
        return rows.map(row =>
          row.id === parseInt(key, 10)
            ? { ...row, inventoryMedicationFK: undefined }
            : row,
        )
      }
    }
    return rows
  }

  commitDrugMixtureItemChanges = ({ rows, deleted, added, changed }) => {
    const { setFieldValue, values, codetable } = this.props
    let tempDrugMixtureRows = []

    if (deleted) {
      const tempArray = [...values.corPrescriptionItemDrugMixture]
      const actviceItem = tempArray.filter(i => !i.isDeleted)
      if (actviceItem.length > 1 && actviceItem[0].id === deleted[0]) {
        const { inventorymedication = [] } = codetable
        const currentMedication = inventorymedication.find(
          o => o.id === actviceItem[1].inventoryMedicationFK,
        )
        this.changeMedication(
          actviceItem[1].inventoryMedicationFK,
          currentMedication,
        )
      }

      const newArray = tempArray.map(o => {
        if (o.id === deleted[0]) {
          return {
            ...o,
            isDeleted: true,
          }
        }
        return {
          ...o,
        }
      })

      tempDrugMixtureRows = newArray
      setFieldValue('corPrescriptionItemDrugMixture', newArray)

      if (!newArray.find(i => !i.isDeleted)) {
        this.changeMedication()
      }
    } else {
      let _rows = this.checkIsDrugMixtureItemUnique({ rows, changed })
      if (added) {
        _rows = [...values.corPrescriptionItemDrugMixture, rows[0]]
      }

      tempDrugMixtureRows = _rows
      var tempSequnence = 0
      _rows.forEach(item => (item.sequence = tempSequnence++))
      setFieldValue('corPrescriptionItemDrugMixture', _rows)
    }

    let totalQuantity = 0
    let totalPrice = 0
    const activeDrugMixtureRows = tempDrugMixtureRows.filter(
      item => !item.isDeleted,
    )

    activeDrugMixtureRows.forEach(item => {
      totalQuantity += item.quantity || 0
      totalPrice += item.totalPrice || 0
    })

    if (activeDrugMixtureRows.find(r => r.isDispensedByPharmacy)) {
      setFieldValue('isDispensedByPharmacy', true)
    } else {
      setFieldValue('isDispensedByPharmacy', false)
    }

    if (activeDrugMixtureRows.find(r => r.isNurseActualizeRequired)) {
      setFieldValue('isNurseActualizeRequired', true)
    } else {
      setFieldValue('isNurseActualizeRequired', false)
    }

    setFieldValue('quantity', totalQuantity)
    this.updateTotalPrice(totalPrice)
  }

  onAdjustmentConditionChange = v => {
    const { values } = this.props
    const { isMinus, adjValue, isExactAmount } = values
    if (!isNumber(adjValue)) {
      this.props.setFieldValue('adjValue', 0)
    }

    let value = adjValue || 0
    if (!isExactAmount && adjValue > 100) {
      value = 100
      this.props.setFieldValue('adjValue', 100)
    }

    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }
    v = value

    this.getFinalAmount({ value })
  }

  getFinalAmount = ({ value } = {}) => {
    const { values, setFieldValue } = this.props
    const { isExactAmount, adjValue, totalPrice = 0 } = values
    const finalAmount = calculateAdjustAmount(
      isExactAmount,
      totalPrice,
      value || adjValue,
    )

    setFieldValue('totalAfterItemAdjustment', finalAmount.amount)
    setFieldValue('adjAmount', finalAmount.adjAmount)
    setFieldValue('adjType', isExactAmount ? 'ExactAmount' : 'Percentage')
  }

  drugMixtureTableParas = () => {
    return {
      columns: [
        { name: 'inventoryMedicationFK', title: 'Name' },
        { name: 'quantity', title: 'Quantity' },
        { name: 'uomfk', title: 'UOM' },
        { name: 'totalPrice', title: 'Total' },
      ],
      columnExtensions: [
        {
          columnName: 'inventoryMedicationFK',
          type: 'localSearchSelect',
          labelField: 'combinDisplayValue',
          options: this.getMedicationOptions,
          handleFilter: () => true,
          width: 400,
          dropdownMatchSelectWidth: false,
          dropdownStyle: {
            maxWidth: 600,
            width: '600px!important',
          },
          dropdownClassName: 'ant-select-dropdown-bottom-bordered',
          renderDropdown: option => {
            return this.renderMedication(option)
          },
          sortingEnabled: false,
          showOptionTitle: false,
          onChange: e => {
            const { values, setFieldValue } = this.props
            const { row = {} } = e
            if (e.option) {
              this.handleDrugMixtureItemOnChange(e)
              const {
                codetable: { inventorymedication = [] },
              } = this.props
            } else {
              row.quantity = undefined
              row.uomfk = null
              row.uomCode = undefined
              row.uomDisplayValue = undefined
              row.costPrice = undefined
              row.unitPrice = undefined
              row.totalPrice = undefined
              row.drugCode = undefined
              row.drugName = undefined
              row.revenueCategoryFK = undefined
              row.isDispensedByPharmacy = undefined
              row.isNurseActualizeRequired = undefined
              row.prescribeUOMFK = null
              row.prescribeUOMCode = undefined
              row.prescribeUOMDisplayValue = undefined
              const activeDrugMixtureRows = (
                values.corPrescriptionItemDrugMixture || []
              ).filter(item => !item.isDeleted)
              if (activeDrugMixtureRows[0].id === row.id) {
                this.changeMedication()
              }
            }
          },
          matchSearch: this.matchSearch,
          isDisabled: row => row.isStartedMedication,
        },
        {
          columnName: 'quantity',
          width: 100,
          type: 'number',
          format: '0.0',
          sortingEnabled: false,
          onChange: e => {
            this.handleDrugMixtureItemQuantityOnChange(e)
          },
          isDisabled: row =>
            row.isStartedMedication || row.inventoryMedicationFK === undefined,
        },
        {
          columnName: 'uomfk',
          type: 'codeSelect',
          code: 'ctMedicationUnitOfMeasurement',
          labelField: 'displayValue',
          sortingEnabled: false,
          disabled: true,
        },
        {
          columnName: 'totalPrice',
          width: 100,
          type: 'number',
          currency: true,
          sortingEnabled: false,
          isDisabled: row => row.inventoryMedicationFK === undefined,
        },
      ],
    }
  }

  filterMedicationOptions = (input = '', option) => {
    let match = false
    try {
      const lowerCaseInput = input.toLowerCase()

      const { props } = option
      const { code = '', displayValue = '', medicationGroupName } = props.data
      match =
        code.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
        displayValue.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
        (medicationGroupName || '').toLowerCase().indexOf(lowerCaseInput) >= 0
    } catch (error) {
      match = false
    }
    return match
  }

  renderMedication = option => {
    const {
      code,
      displayValue,
      sellingPrice = 0,
      medicationGroupName,
      stock = 0,
      dispensingUOM = {},
      isExclusive,
    } = option
    const { name: uomName = '' } = dispensingUOM

    return (
      <div
        style={{
          height: 40,
          lineHeight: '40px',
        }}
      >
        <div
          style={{
            height: '20px',
            lineHeight: '20px',
          }}
        >
          <Tooltip
            useTooltip2
            title={
              <div>
                <div
                  style={{ fontWeight: 'bold' }}
                >{`Name: ${displayValue}`}</div>
                <div>{`Code: ${code}`}</div>
              </div>
            }
          >
            <div
              style={{
                width: 535,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              <span
                style={{ fontWeight: '550', fontSize: 15 }}
              >{`${displayValue} - `}</span>
              <span>{code}</span>
            </div>
          </Tooltip>

          {isExclusive && (
            <div
              style={{
                backgroundColor: 'green',
                color: 'white',
                fontSize: '0.7rem',
                position: 'relative',
                right: '0px',
                marginLeft: 3,
                top: '-6px',
                display: 'inline-block',
                height: 18,
                lineHeight: '18px',
                borderRadius: 4,
                padding: '1px 3px',
                fontWeight: 500,
                lineHeight: '16px',
              }}
              title='The item has no local stock, we will purchase on behalf and charge to patient in invoice'
            >
              Excl.
            </div>
          )}
        </div>
        <div
          style={{
            height: '20px',
            lineHeight: '20px',
          }}
        >
          <Tooltip
            title={
              <div>
                Unit Price:
                <span
                  style={{ color: 'darkblue' }}
                >{` ${currencySymbol}${sellingPrice.toFixed(2)}`}</span>
              </div>
            }
          >
            <div
              style={{
                width: 130,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                height: '100%',
              }}
            >
              Unit Price:
              <span
                style={{ color: 'darkblue' }}
              >{` ${currencySymbol}${sellingPrice.toFixed(2)}`}</span>
            </div>
          </Tooltip>

          <Tooltip
            title={
              <div>
                Stock:{' '}
                <span
                  style={{
                    color: stock < 0 ? 'red' : 'black',
                  }}
                >{` ${numeral(stock || 0).format(qtyFormat)} `}</span>
                {uomName || ''}
              </div>
            }
          >
            <div
              style={{
                width: 150,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                marginLeft: 3,
                height: '100%',
              }}
            >
              Stock:{' '}
              <span
                style={{
                  color: stock < 0 ? 'red' : 'black',
                }}
              >{` ${numeral(stock || 0).format(qtyFormat)} `}</span>
              {uomName || ''}
            </div>
          </Tooltip>

          <Tooltip
            useTooltip2
            title={medicationGroupName ? `Group: ${medicationGroupName}` : ''}
          >
            <div
              style={{
                width: 290,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                marginLeft: 3,
                height: '100%',
              }}
            >
              {' '}
              {medicationGroupName ? `Grp.: ${medicationGroupName}` : ''}
            </div>
          </Tooltip>
        </div>
      </div>
    )
  }

  renderOthers = isStartedMedication => {
    const { classes, values, setDisable, orders } = this.props
    const { isPreOrderItemExists } = this.state

    const isDisabledHasPaidPreOrder =
      orders.entity?.actualizedPreOrderItemFK && orders.entity?.hasPaid == true
        ? true
        : false

    const isDisabledNoPaidPreOrder = orders.entity?.actualizedPreOrderItemFK
      ? true
      : false
    return (
      <GridItem xs={8} className={classes.editor}>
        {values.visitPurposeFK !== VISIT_TYPE.OTC &&
        !values.isDrugMixture &&
        !values.isPackage ? (
          <div style={{ position: 'absolute', bottom: 2 }}>
            <div style={{ display: 'inline-block' }}>
              <Field
                name='isExternalPrescription'
                render={args => {
                  if (args.field.value) {
                    setDisable(true)
                  } else {
                    setDisable(false)
                  }
                  return (
                    <Checkbox
                      label='External Prescription'
                      {...args}
                      disabled={isDisabledNoPaidPreOrder || isStartedMedication}
                      onChange={e => {
                        if (e.target.value) {
                          this.props.setFieldValue('adjAmount', 0)
                          this.props.setFieldValue(
                            'totalAfterItemAdjustment',
                            0,
                          )
                          this.props.setFieldValue('totalPrice', 0)
                          this.props.setFieldValue('isMinus', true)
                          this.props.setFieldValue('isExactAmount', true)
                          this.props.setFieldValue('adjValue', 0)
                          this.props.setFieldValue('isPreOrder', false)
                        } else {
                          setTimeout(() => {
                            this.calculateQuantity()
                          }, 1)
                        }
                        setDisable(e.target.value)
                      }}
                    />
                  )
                }}
              />
            </div>
            {values.type === '1' && (
              <div style={{ display: 'inline-block' }}>
                <Field
                  name='isPreOrder'
                  render={args => {
                    return (
                      <Checkbox
                        label='Pre-Order'
                        {...args}
                        disabled={
                          isDisabledNoPaidPreOrder ||
                          values.isExternalPrescription ||
                          isStartedMedication
                        }
                        onChange={e => {
                          if (!e.target.value) {
                            this.props.setFieldValue('isChargeToday', false)
                          }
                          this.checkIsPreOrderItemExistsInListing(
                            e.target.value,
                          )
                        }}
                      />
                    )
                  }}
                />
              </div>
            )}
            {values.isPreOrder && (
              <div style={{ display: 'inline-block' }}>
                <FastField
                  name='isChargeToday'
                  render={args => {
                    return <Checkbox label='Charge Today' {...args} />
                  }}
                />
              </div>
            )}
            {isPreOrderItemExists && (
              <Alert
                message={
                  "Item exists in Pre-Order. Plesae check patient's Pre-Order."
                }
                type='warning'
                style={{
                  position: 'absolute',
                  top: 30,
                  left: 150,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'inline-block',
                  overflow: 'hidden',
                  lineHeight: '25px',
                  fontSize: '0.85rem',
                }}
              />
            )}
          </div>
        ) : (
          ''
        )}
        {values.isDrugMixture && (
          <FastField
            name='isClaimable'
            render={args => {
              return (
                <Checkbox
                  style={{ position: 'absolute', bottom: 2 }}
                  label='Claimable'
                  {...args}
                />
              )
            }}
          />
        )}
        {values.isPackage && (
          <Field
            name='performingUserFK'
            render={args => (
              <DoctorProfileSelect
                label='Performed By'
                {...args}
                valueField='clinicianProfile.userProfileFK'
              />
            )}
          />
        )}
      </GridItem>
    )
  }

  matchSearch = (option, input) => {
    const lowerCaseInput = input.toLowerCase()
    return (
      option.code.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
      option.displayValue.toLowerCase().indexOf(lowerCaseInput) >= 0 ||
      (option.medicationGroupName || '')
        .toLowerCase()
        .indexOf(lowerCaseInput) >= 0
    )
  }

  render() {
    const {
      theme,
      classes,
      values,
      openPrescription,
      footer,
      setFieldValue,
      setDisable,
      from,
      orders = {},
      clinicSettings,
      user,
    } = this.props

    const { corVitalSign = [] } = orders
    const {
      isEditMedication,
      drugName,
      remarks,
      drugLabelRemarks,
      workitem = {},
      isPreOrder,
    } = values
    const {
      showAddFromPastModal,
      showAddFromPrescriptionSetModal,
      isPreOrderItemExists,
    } = this.state

    const commonSelectProps = {
      handleFilter: this.filterOptions,
      dropdownMatchSelectWidth: false,
      dropdownStyle: {
        width: 300,
      },
    }

    if (orders.isPreOrderItemExists === false && !values.isPreOrder)
      this.setState({ isPreOrderItemExists: false })

    const totalPriceReadonly =
      Authorized.check('queue.consultation.modifyorderitemtotalprice')
        .rights !== 'enable'
    const accessRight = authorityCfg[values.type]

    const isDisabledHasPaidPreOrder =
      orders.entity?.actualizedPreOrderItemFK && orders.entity?.hasPaid == true
        ? true
        : false

    const isDisabledNoPaidPreOrder = orders.entity?.actualizedPreOrderItemFK
      ? true
      : false
    const { labelPrinterSize } = clinicSettings
    const showDrugLabelRemark = labelPrinterSize === '8.0cmx4.5cm_V2'
    const showPrescriptionSet =
      ENABLE_PRESCRIPTION_SET_CLINIC_ROLE.indexOf(
        user.data.clinicianProfile.userProfile.role.clinicRoleBitValue,
      ) >= 0

    const { nurseWorkitem = {} } = workitem
    const isStartedMedication =
      !isPreOrder && nurseWorkitem.statusFK === NURSE_WORKITEM_STATUS.ACTUALIZED
    return (
      <Authorized authority={GetOrderItemAccessRight(from, accessRight)}>
        <div>
          <GridContainer>
            {!openPrescription && !values.isDrugMixture && (
              <GridItem xs={6}>
                <Field
                  name='inventoryMedicationFK'
                  render={args => {
                    return (
                      <div
                        id={`autofocus_${values.type}`}
                        style={{ position: 'relative' }}
                      >
                        <LocalSearchSelect
                          {...args}
                          label='Medication Name, Drug Group'
                          labelField='combinDisplayValue'
                          onChange={this.changeMedication}
                          options={this.getMedicationOptions()}
                          handleFilter={() => true}
                          dropdownMatchSelectWidth={false}
                          dropdownStyle={{
                            width: 600,
                          }}
                          dropdownClassName='ant-select-dropdown-bottom-bordered'
                          renderDropdown={this.renderMedication}
                          style={{ paddingRight: 20 }}
                          disabled={
                            values.isPackage ||
                            isDisabledNoPaidPreOrder ||
                            isStartedMedication
                          }
                          showOptionTitle={false}
                          id='medication'
                          matchSearch={this.matchSearch}
                        />
                        <LowStockInfo
                          sourceType='medication'
                          {...this.props}
                          corVitalSign={corVitalSign}
                        />
                      </div>
                    )
                  }}
                />
              </GridItem>
            )}
            {openPrescription && (
              <GridItem xs={6}>
                <FastField
                  name='drugName'
                  render={args => {
                    return (
                      <div id={`autofocus_${values.type}`}>
                        <TextField label='Open Prescription Name' {...args} />
                      </div>
                    )
                  }}
                />
              </GridItem>
            )}
            {values.isDrugMixture && (
              <GridItem xs={6} style={{ paddingRight: 85 }}>
                <div style={{ position: 'relative' }}>
                  <FastField
                    name='drugName'
                    render={args => {
                      return (
                        <div id={`autofocus_${values.type}`}>
                          <TextField
                            label='Drug Mixture'
                            {...args}
                            maxLength={70}
                            disabled={isStartedMedication}
                          />
                        </div>
                      )
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: -110,
                      top: 24,
                      marginLeft: 'auto',
                    }}
                  >
                    <span
                      style={{
                        color: 'gray',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {`Characters left: ${70 -
                        (drugName ? drugName.length : 0)}`}
                    </span>
                  </div>
                </div>
              </GridItem>
            )}
            <GridItem
              xs={6}
              style={{
                marginTop: theme.spacing(2),
                textAlign: 'right',
              }}
            >
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'inline-block' }}>
                  {!openPrescription && (
                    <Field
                      name='isDrugMixture'
                      render={args => {
                        return (
                          <Checkbox
                            label='Drug Mixture'
                            disabled={isEditMedication || isStartedMedication}
                            {...args}
                            onChange={e => {
                              const { setValues, orders } = this.props
                              setValues({
                                ...orders.defaultMedication,
                                isDrugMixture: e.target.value,
                                type: orders.type,
                                visitPurposeFK: orders.visitPurposeFK,
                                selectedMedication: {
                                  medicationStock: [],
                                },
                                performingUserFK: getVisitDoctorUserId(
                                  this.props,
                                ),
                              })

                              if (e.target.value) {
                                this.props.setFieldValue(
                                  'drugCode',
                                  'DrugMixture',
                                )
                                this.props.setFieldValue('isClaimable', true)
                              } else {
                                this.props.setFieldValue('drugCode', undefined)
                                this.props.setFieldValue('drugName', undefined)
                                this.props.setFieldValue(
                                  'isClaimable',
                                  undefined,
                                )
                              }

                              setDisable(false)

                              this.props.dispatch({
                                type: 'global/updateState',
                                payload: {
                                  disableSave: false,
                                },
                              })
                            }}
                          />
                        )
                      }}
                    />
                  )}
                </div>
                {!openPrescription && !isEditMedication && (
                  <div style={{ display: 'inline-block', top: 0 }}>
                    <Tooltip title={`Add Medication From patient's History`}>
                      <ProgressButton
                        color='primary'
                        icon={<Add />}
                        onClick={this.onSearchMedicationHistory}
                      >
                        History
                      </ProgressButton>
                    </Tooltip>
                    {showPrescriptionSet && (
                      <Tooltip title='Add Medication From Prescription Set'>
                        <ProgressButton
                          color='primary'
                          icon={<Add />}
                          style={{ marginRight: '0' }}
                          onClick={this.onSearchPrescriptionSet}
                        >
                          Prescription Set
                        </ProgressButton>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </GridItem>
          </GridContainer>
          {values.isDrugMixture && (
            <GridContainer>
              <GridItem xs={12}>
                <EditableTableGrid
                  forceRender
                  style={{
                    marginTop: theme.spacing(1),
                  }}
                  getRowId={r => r.id}
                  rows={(
                    values.corPrescriptionItemDrugMixture || []
                  ).map(x => ({ ...x, isStartedMedication }))}
                  FuncProps={{
                    pager: false,
                  }}
                  EditingProps={{
                    showAddCommand: !isStartedMedication,
                    showCommandColumn: !isStartedMedication,
                    onCommitChanges: this.commitDrugMixtureItemChanges,
                  }}
                  schema={drugMixtureItemSchema}
                  {...this.drugMixtureTableParas()}
                />
              </GridItem>
            </GridContainer>
          )}
          <GridContainer gutter={0}>
            <GridItem xs={12}>
              <div>
                <div
                  style={{
                    position: 'relative',
                    paddingLeft: 90,
                    marginLeft: 10,
                    marginTop: 4,
                    fontSize: '0.85rem',
                    height: 26,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      paddingTop: 3,
                      paddingBottom: 3,
                      lineHeight: '25px',
                    }}
                  >
                    Instructions
                  </div>
                </div>
                <FieldArray
                  name='corPrescriptionItemInstruction'
                  render={arrayHelpers => {
                    this.descriptionArrayHelpers = arrayHelpers
                    if (!values || !values.corPrescriptionItemInstruction)
                      return null
                    const activeRows = values.corPrescriptionItemInstruction.filter(
                      val => !val.isDeleted,
                    )
                    return activeRows.map((val, activeIndex) => {
                      if (val && val.isDeleted) return null
                      const i = values.corPrescriptionItemInstruction.findIndex(
                        item =>
                          val.id ? item.id === val.id : val.uid === item.uid,
                      )

                      return (
                        <div key={i}>
                          <GridContainer>
                            {activeIndex > 0 && (
                              <GridItem xs={3}>
                                <FastField
                                  name={`corPrescriptionItemInstruction[${i}].stepdose`}
                                  render={args => {
                                    return (
                                      <Select
                                        style={{
                                          paddingLeft: 15,
                                          marginBottom: theme.spacing(1),
                                        }}
                                        allowClear={false}
                                        simple
                                        options={[
                                          {
                                            value: 'AND',
                                            name: 'And',
                                          },
                                          {
                                            value: 'THEN',
                                            name: 'Then',
                                          },
                                        ]}
                                        disabled={isStartedMedication}
                                        {...args}
                                      />
                                    )
                                  }}
                                />
                              </GridItem>
                            )}
                            {activeIndex > 0 && <GridItem xs={9} />}
                            <GridItem xs={3}>
                              <Field
                                name={`corPrescriptionItemInstruction[${i}].usageMethodFK`}
                                render={args => {
                                  return (
                                    <div style={{ position: 'relative' }}>
                                      <span
                                        style={{
                                          position: 'absolute',
                                          bottom: 4,
                                        }}
                                      >
                                        {activeIndex + 1}.
                                      </span>
                                      <CodeSelect
                                        label={formatMessage({
                                          id: 'inventory.master.setting.usage',
                                        })}
                                        style={{
                                          marginLeft: 15,
                                          paddingRight: 15,
                                        }}
                                        labelField='displayValue'
                                        code='ctMedicationUsage'
                                        onChange={(v, op = {}) => {
                                          setFieldValue(
                                            `corPrescriptionItemInstruction[${i}].usageMethodCode`,
                                            op ? op.code : undefined,
                                          )
                                          setFieldValue(
                                            `corPrescriptionItemInstruction[${i}].usageMethodDisplayValue`,
                                            op ? op.displayValue : undefined,
                                          )
                                        }}
                                        {...commonSelectProps}
                                        {...args}
                                        disabled={
                                          isDisabledHasPaidPreOrder ||
                                          isStartedMedication
                                        }
                                      />
                                    </div>
                                  )
                                }}
                              />
                            </GridItem>
                            <GridItem xs={2}>
                              <FastField
                                name={`corPrescriptionItemInstruction[${i}].dosageFK`}
                                render={args => {
                                  return (
                                    <CodeSelect
                                      label={formatMessage({
                                        id: 'inventory.master.setting.dosage',
                                      })}
                                      code='ctMedicationDosage'
                                      labelField='displayValue'
                                      {...commonSelectProps}
                                      {...args}
                                      onChange={(v, op = {}) => {
                                        setFieldValue(
                                          `corPrescriptionItemInstruction[${i}].dosageCode`,
                                          op ? op.code : undefined,
                                        )
                                        setFieldValue(
                                          `corPrescriptionItemInstruction[${i}].dosageDisplayValue`,
                                          op ? op.displayValue : undefined,
                                        )
                                        setTimeout(() => {
                                          this.calculateQuantity()
                                        }, 1)
                                      }}
                                      disabled={
                                        isDisabledHasPaidPreOrder ||
                                        isStartedMedication
                                      }
                                    />
                                  )
                                }}
                              />
                            </GridItem>
                            <GridItem xs={2}>
                              <Field
                                name={`corPrescriptionItemInstruction[${i}].prescribeUOMFK`}
                                render={args => {
                                  return (
                                    <CodeSelect
                                      label={formatMessage({
                                        id:
                                          'inventory.master.setting.prescribeUOM',
                                      })}
                                      allowClear={false}
                                      code='ctMedicationUnitOfMeasurement'
                                      labelField='displayValue'
                                      onChange={(v, op = {}) => {
                                        setFieldValue(
                                          `corPrescriptionItemInstruction[${i}].prescribeUOMCode`,
                                          op ? op.code : undefined,
                                        )
                                        setFieldValue(
                                          `corPrescriptionItemInstruction[${i}].prescribeUOMDisplayValue`,
                                          op ? op.displayValue : undefined,
                                        )
                                      }}
                                      disabled={
                                        !openPrescription ||
                                        isDisabledHasPaidPreOrder ||
                                        isStartedMedication
                                      }
                                      {...commonSelectProps}
                                      {...args}
                                    />
                                  )
                                }}
                              />
                            </GridItem>
                            <GridItem xs={2}>
                              <FastField
                                name={`corPrescriptionItemInstruction[${i}].drugFrequencyFK`}
                                render={args => {
                                  return (
                                    <CodeSelect
                                      label={formatMessage({
                                        id:
                                          'inventory.master.setting.frequency',
                                      })}
                                      labelField='displayValue'
                                      code='ctMedicationFrequency'
                                      {...commonSelectProps}
                                      {...args}
                                      onChange={(v, op = {}) => {
                                        setFieldValue(
                                          `corPrescriptionItemInstruction[${i}].drugFrequencyCode`,
                                          op ? op.code : undefined,
                                        )
                                        setFieldValue(
                                          `corPrescriptionItemInstruction[${i}].drugFrequencyDisplayValue`,
                                          op ? op.displayValue : undefined,
                                        )
                                        setTimeout(() => {
                                          this.calculateQuantity()
                                        }, 1)
                                      }}
                                      disabled={
                                        isDisabledHasPaidPreOrder ||
                                        isStartedMedication
                                      }
                                    />
                                  )
                                }}
                              />
                            </GridItem>
                            <GridItem xs={3}>
                              <div style={{ position: 'relative' }}>
                                <FastField
                                  name={`corPrescriptionItemInstruction[${i}].duration`}
                                  render={args => {
                                    return (
                                      <NumberInput
                                        style={{ paddingRight: 80 }}
                                        precision={0}
                                        label={formatMessage({
                                          id:
                                            'inventory.master.setting.duration',
                                        })}
                                        step={1}
                                        min={0}
                                        {...args}
                                        onChange={() => {
                                          setTimeout(() => {
                                            this.calculateQuantity()
                                          }, 1)
                                        }}
                                        disabled={
                                          isDisabledHasPaidPreOrder ||
                                          isStartedMedication
                                        }
                                      />
                                    )
                                  }}
                                />
                                {this.getActionItem(
                                  i,
                                  arrayHelpers,
                                  'corPrescriptionItemInstruction',
                                  'Add step dose',
                                  {
                                    stepdose: 'AND',
                                    sequence: activeRows.length + 1,
                                    uid: getUniqueId(),
                                  },
                                  isStartedMedication,
                                )}
                              </div>
                            </GridItem>
                          </GridContainer>
                        </div>
                      )
                    })
                  }}
                />
              </div>
            </GridItem>
          </GridContainer>

          <GridContainer gutter={0}>
            <GridItem xs={12}>
              <div>
                <div
                  style={{
                    marginLeft: 10,
                    marginTop: 8,
                    paddingTop: 3,
                    paddingBottom: 3,
                    fontSize: '0.85rem',
                    height: 26,
                  }}
                >
                  Precaution
                </div>
                <FieldArray
                  name='corPrescriptionItemPrecaution'
                  render={arrayHelpers => {
                    if (!values || !values.corPrescriptionItemPrecaution)
                      return null
                    const activeRows = values.corPrescriptionItemPrecaution.filter(
                      val => !val.isDeleted,
                    )

                    const maxSeq = _.maxBy(
                      values.corPrescriptionItemPrecaution,
                      'sequence',
                    )

                    let newMaxSeq = maxSeq
                      ? maxSeq.sequence + 1
                      : values.corPrescriptionItemPrecaution.length + 1
                    return activeRows.map((val, activeIndex) => {
                      if (val && val.isDeleted) return null
                      const i = values.corPrescriptionItemPrecaution.findIndex(
                        cor =>
                          val.id ? cor.id === val.id : val.uid === cor.uid,
                      )

                      return (
                        <div key={i}>
                          <GridContainer>
                            <GridItem xs={12}>
                              <Field
                                name={`corPrescriptionItemPrecaution[${i}].medicationPrecautionFK`}
                                render={args => {
                                  return (
                                    <div
                                      style={{
                                        position: 'relative',
                                        marginBottom: 5,
                                      }}
                                    >
                                      <span
                                        style={{
                                          position: 'absolute',
                                          top: 5,
                                        }}
                                      >
                                        {activeIndex + 1}.
                                      </span>
                                      <CodeSelect
                                        style={{
                                          paddingLeft: 15,
                                          paddingRight: 80,
                                        }}
                                        code='ctmedicationprecaution'
                                        labelField='displayValue'
                                        onChange={(v, option = {}) => {
                                          setFieldValue(
                                            `corPrescriptionItemPrecaution[${i}].precaution`,
                                            option.displayValue,
                                          )
                                          setFieldValue(
                                            `corPrescriptionItemPrecaution[${i}].precautionCode`,
                                            option.code,
                                          )
                                        }}
                                        disabled={isStartedMedication}
                                        {...args}
                                      />
                                      {this.getActionItem(
                                        i,
                                        arrayHelpers,
                                        'corPrescriptionItemPrecaution',
                                        'Add precaution',
                                        {
                                          action: '1',
                                          count: 1,
                                          unit: '1',
                                          drugFrequencyFK: '1',
                                          day: 1,
                                          precaution: '1',
                                          sequence: newMaxSeq,
                                          uid: getUniqueId(),
                                        },
                                        isStartedMedication,
                                      )}
                                    </div>
                                  )
                                }}
                              />
                            </GridItem>
                          </GridContainer>
                        </div>
                      )
                    })
                  }}
                />
              </div>
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem
              xs={8}
              className={classes.editor}
              style={{ paddingRight: 35 }}
            >
              <div style={{ position: 'relative' }}>
                <Field
                  name='remarks'
                  render={args => {
                    return (
                      <TextField
                        rowsMax='5'
                        label='Remarks'
                        disabled={isStartedMedication}
                        {...args}
                      />
                    )
                  }}
                />
                <CannedTextButton
                  disabled={isStartedMedication}
                  cannedTextTypeFK={CANNED_TEXT_TYPE.MEDICATIONREMARKS}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: -35,
                  }}
                  handleSelectCannedText={cannedText => {
                    const newRemaks = `${
                      remarks ? remarks + '\n' : ''
                    }${cannedText.text || ''}`.substring(0, 2000)
                    setFieldValue('remarks', newRemaks)
                  }}
                />
              </div>
            </GridItem>
            {values.isPackage && (
              <React.Fragment>
                <GridItem xs={1} className={classes.editor}>
                  <Field
                    name='packageConsumeQuantity'
                    render={args => {
                      return (
                        <NumberInput
                          label='Consumed Quantity'
                          step={1}
                          min={0}
                          max={values.remainingQuantity}
                          disabled={
                            this.props.visitRegistration.entity.visit
                              .isInvoiceFinalized
                          }
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
                <GridItem xs={1} className={classes.editor}>
                  <Field
                    name='remainingQuantity'
                    render={args => {
                      return (
                        <NumberInput
                          style={{
                            marginTop: theme.spacing(3),
                          }}
                          formatter={v => `/ ${parseFloat(v).toFixed(1)}`}
                          text
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
              </React.Fragment>
            )}
            {!values.isPackage && (
              <GridItem xs={2} className={classes.editor}>
                <Field
                  name='quantity'
                  render={args => {
                    return (
                      <NumberInput
                        label='Quantity'
                        step={1}
                        min={0}
                        onChange={() => {
                          setTimeout(() => {
                            this.setTotalPrice()
                          }, 1)
                        }}
                        {...args}
                        disabled={
                          isDisabledHasPaidPreOrder || isStartedMedication
                        }
                      />
                    )
                  }}
                />
              </GridItem>
            )}
            <GridItem xs={2} className={classes.editor}>
              <Field
                name='dispenseUOMFK'
                render={args => {
                  return (
                    <CodeSelect
                      disabled={!openPrescription}
                      label='Dispense UOM'
                      allowClear={false}
                      code='ctMedicationUnitOfMeasurement'
                      labelField='displayValue'
                      onChange={(v, op = {}) => {
                        setFieldValue(
                          'dispenseUOMCode',
                          op ? op.code : undefined,
                        )
                        setFieldValue(
                          'dispenseUOMDisplayValue',
                          op ? op.displayValue : undefined,
                        )
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            {showDrugLabelRemark ? (
              <GridItem
                xs={8}
                className={classes.editor}
                style={{ paddingRight: 115 }}
              >
                <div style={{ position: 'relative' }}>
                  <Field
                    name='drugLabelRemarks'
                    render={args => {
                      return (
                        <TextField
                          disabled={isStartedMedication}
                          maxLength={30}
                          label='Drug Label Remarks'
                          {...args}
                        />
                      )
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: -115,
                      top: 24,
                      marginLeft: 'auto',
                    }}
                  >
                    <span
                      style={{
                        color: 'gray',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {`Characters left: ${30 -
                        (drugLabelRemarks ? drugLabelRemarks.length : 0)}`}
                    </span>
                  </div>
                </div>
              </GridItem>
            ) : (
              this.renderOthers(isStartedMedication)
            )}
            <GridItem xs={4} className={classes.editor}>
              <Field
                name='totalPrice'
                render={args => {
                  return (
                    <NumberInput
                      label='Total'
                      onChange={e => {
                        this.updateTotalPrice(e.target.value)
                      }}
                      min={0}
                      disabled={
                        values.isExternalPrescription ||
                        (totalPriceReadonly && !openPrescription) ||
                        values.isPackage ||
                        isDisabledHasPaidPreOrder
                      }
                      currency
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            {showDrugLabelRemark ? (
              this.renderOthers(isStartedMedication)
            ) : (
              <GridItem xs={8} className={classes.editor} />
            )}
            <GridItem xs={3} className={classes.editor}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    marginTop: theme.spacing(2),
                    position: 'absolute',
                  }}
                >
                  <Field
                    name='isMinus'
                    render={args => {
                      return (
                        <Switch
                          checkedChildren='-'
                          unCheckedChildren='+'
                          label=''
                          disabled={
                            values.isExternalPrescription ||
                            (totalPriceReadonly && !openPrescription) ||
                            values.isPackage ||
                            isDisabledHasPaidPreOrder
                          }
                          onChange={() => {
                            setTimeout(() => {
                              this.onAdjustmentConditionChange()
                            }, 1)
                          }}
                          {...args}
                        />
                      )
                    }}
                  />
                </div>
                <Field
                  name='adjValue'
                  render={args => {
                    args.min = 0
                    args.precision = 2
                    if (values.isExactAmount) {
                      return (
                        <NumberInput
                          style={{
                            marginLeft: theme.spacing(7),
                            paddingRight: theme.spacing(6),
                          }}
                          currency
                          noSuffix
                          label='Adjustment'
                          disabled={
                            values.isExternalPrescription ||
                            (totalPriceReadonly && !openPrescription) ||
                            values.isPackage ||
                            isDisabledHasPaidPreOrder
                          }
                          onChange={() => {
                            setTimeout(() => {
                              this.onAdjustmentConditionChange()
                            }, 1)
                          }}
                          {...args}
                        />
                      )
                    }
                    return (
                      <NumberInput
                        style={{
                          marginLeft: theme.spacing(7),
                          paddingRight: theme.spacing(6),
                        }}
                        percentage
                        noSuffix
                        max={100}
                        label='Adjustment'
                        disabled={
                          values.isExternalPrescription ||
                          (totalPriceReadonly && !openPrescription) ||
                          values.isPackage ||
                          isDisabledHasPaidPreOrder
                        }
                        onChange={() => {
                          setTimeout(() => {
                            this.onAdjustmentConditionChange()
                          }, 1)
                        }}
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
            <GridItem xs={1} className={classes.editor}>
              <div style={{ marginTop: theme.spacing(2) }}>
                <Field
                  name='isExactAmount'
                  render={args => {
                    return (
                      <Switch
                        checkedChildren='$'
                        unCheckedChildren='%'
                        label=''
                        disabled={
                          values.isExternalPrescription ||
                          (totalPriceReadonly && !openPrescription) ||
                          values.isPackage ||
                          isDisabledHasPaidPreOrder
                        }
                        onChange={() => {
                          setTimeout(() => {
                            this.onAdjustmentConditionChange()
                          }, 1)
                        }}
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={8} className={classes.editor} />
            <GridItem xs={4}>
              <Field
                name='totalAfterItemAdjustment'
                render={args => {
                  return (
                    <NumberInput
                      label='Total After Adj.'
                      disabled
                      currency
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          {footer({
            onSave: this.validateAndSubmitIfOk,
            onReset: this.handleReset,
          })}
          <CommonModal
            open={showAddFromPastModal}
            title="Add Medication From Patient's History"
            onClose={this.toggleAddFromPastModal}
            onConfirm={this.toggleAddFromPastModal}
            maxWidth='md'
            showFooter={false}
            overrideLoading
            cancelText='Cancel'
          >
            <AddFromPast
              isRetail={values.visitPurposeFK === VISIT_TYPE.OTC}
              {...this.props}
            />
          </CommonModal>

          <CommonModal
            open={showAddFromPrescriptionSetModal}
            title='Add Medication From Prescription Set'
            onClose={this.toggleAddFromPrescriptionSetModal}
            onConfirm={this.toggleAddFromPrescriptionSetModal}
            maxWidth='md'
            showFooter={false}
            overrideLoading
            cancelText='Cancel'
          >
            <PrescriptionSet
              isRetail={values.visitPurposeFK === VISIT_TYPE.OTC}
              {...this.props}
            />
          </CommonModal>
        </div>
      </Authorized>
    )
  }
}
export default Medication
