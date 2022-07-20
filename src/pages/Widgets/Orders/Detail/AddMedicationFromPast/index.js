import React, { PureComponent } from 'react'
import _ from 'lodash'
import { connect } from 'dva'
import * as Yup from 'yup'
import moment from 'moment'
// medisys components
import { LoadingWrapper } from '@/components/_medisys'
// custom component
import { notification } from '@/components'
import { withFormik } from 'formik'
// sub components
import {
  openCautionAlertPrompt,
  ReplaceCertificateTeplate,
  getDrugAllergy,
} from '@/pages/Widgets/Orders/utils'
import { getTranslationValue, getUniqueId } from '@/utils/utils'
import FitlerBar from './FilterBar'
import Grid from './Grid'
import { getClinicianProfile } from '../../../ConsultationDocument/utils'

const defaultValue = {
  visitFromDate: moment(new Date())
    .startOf('day')
    .toDate(),
  visitToDate: moment(new Date())
    .endOf('day')
    .toDate(),
  searchName: '',
  isAllDate: true,
}

@connect(
  ({
    loading,
    codetable,
    visitRegistration,
    clinicSettings,
    patient,
    consultationDocument,
  }) => ({
    loading,
    codetable,
    visitRegistration,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
    patient,
    consultationDocument,
  }),
)
@withFormik({
  displayName: 'PastMedication',
  validationSchema: Yup.object().shape({}),
  mapPropsToValues: () => ({
    ...defaultValue,
  }),
  handleSubmit: () => ({}),
})
class PastMedication extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      addedItems: [],
      visitFromDate: moment(new Date())
        .startOf('day')
        .toDate(),
      visitToDate: moment(new Date())
        .endOf('day')
        .toDate(),
      searchName: '',
      isAllDate: true,
      pageIndex: 0,
      loadVisits: [],
      totalVisits: 0,
      activeKey: [],
    }
  }

  componentWillMount() {
    this.searchHistory()
  }

  setAddedItems = v => {
    this.setState({
      addedItems: v,
    })
  }

  getInstruction = (instructions, language) => {
    const { codetable } = this.props
    const {
      ctmedicationusage,
      ctmedicationdosage,
      ctmedicationunitofmeasurement,
      ctmedicationfrequency,
    } = codetable
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

  getVisitDoctorUserId = props => {
    const { doctorprofile } = props.codetable
    const { doctorProfileFK } = props.visitRegistration.entity.visit
    let visitDoctorUserId
    if (doctorprofile && doctorProfileFK) {
      visitDoctorUserId = doctorprofile.find(d => d.id === doctorProfileFK)
        .clinicianProfile.userProfileFK
    }

    return visitDoctorUserId
  }

  GetNewMedication = () => {
    const { getNextSequence, codetable, type, clinicSettings } = this.props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const {
      inventorymedication,
      ctmedicationusage,
      ctmedicationdosage,
      ctmedicationunitofmeasurement,
      ctmedicationfrequency,
      ctmedicationprecaution,
    } = codetable

    const medications = this.state.addedItems
    let data = []
    let sequence = getNextSequence()
    data = data.concat(
      medications.map(item => {
        let currentSequence = sequence
        sequence += 1

        let itemInstructions =
          item.corPrescriptionItemInstruction ||
          item.retailPrescriptionItemInstruction
        itemInstructions = itemInstructions.map(instruction => {
          let usage = ctmedicationusage.find(
            drugusage => drugusage.id === instruction.usageMethodFK,
          )
          let dosage = ctmedicationdosage.find(
            drugdosage => drugdosage.id === instruction.dosageFK,
          )
          let uom = ctmedicationunitofmeasurement.find(
            druguom => druguom.id === instruction.prescribeUOMFK,
          )
          let frequency = ctmedicationfrequency.find(
            drugfrequency => drugfrequency.id === instruction.drugFrequencyFK,
          )
          return {
            usageMethodFK: usage ? usage.id : undefined,
            usageMethodCode: usage ? usage.code : undefined,
            usageMethodDisplayValue: usage ? usage.displayValue : undefined,
            dosageFK: dosage ? dosage.id : undefined,
            dosageCode: dosage ? dosage.code : undefined,
            dosageDisplayValue: dosage ? dosage.displayValue : undefined,
            prescribeUOMFK: uom ? uom.id : undefined,
            prescribeUOMCode: uom ? uom.code : undefined,
            prescribeUOMDisplayValue: uom ? uom.displayValue : undefined,
            drugFrequencyFK: frequency ? frequency.id : undefined,
            drugFrequencyCode: frequency ? frequency.code : undefined,
            drugFrequencyDisplayValue: frequency
              ? frequency.displayValue
              : undefined,
            duration: instruction.duration,
            sequence: instruction.sequence,
            stepdose: instruction.stepdose,
            isDeleted: false,
            uid: getUniqueId(),
          }
        })

        const instruction = this.getInstruction(
          itemInstructions,
          primaryPrintoutLanguage,
        )
        const secondInstruction =
          secondaryPrintoutLanguage !== ''
            ? this.getInstruction(itemInstructions, secondaryPrintoutLanguage)
            : ''

        let itemExpiryDate
        let itemBatchNo
        let itemCostPrice
        let itemUnitPrice
        let itemDispenseUOMCode
        let itemDispenseUOMDisplayValue
        let itemSecondDispenseUOMDisplayValue
        let itemDispenseUOMFK
        let itemInventoryDispenseUOMFK
        let itemInventoryPrescribingUOMFK
        let itemDrugCode
        let itemDrugName
        let itemTotalPrice
        let newTotalQuantity
        let ItemPrecautions = []
        let itemCorPrescriptionItemDrugMixture = []
        let itemDrugCaution
        let isDispensedByPharmacy
        let isNurseActualizeRequired
        let isExclusive
        let orderable
        if (item.inventoryMedicationFK) {
          // Normal Drug
          let drug = inventorymedication.find(
            medication => medication.id === item.inventoryMedicationFK,
          )
          let defaultBatch = drug.medicationStock.find(
            o => o.isDefault === true,
          )

          let precautionIndex = 0
          if (
            drug.inventoryMedication_MedicationPrecaution &&
            drug.inventoryMedication_MedicationPrecaution.length > 0
          ) {
            ItemPrecautions = ItemPrecautions.concat(
              drug.inventoryMedication_MedicationPrecaution.map(o => {
                let currentPrecautionSequence = precautionIndex
                precautionIndex += 1
                const precaution = ctmedicationprecaution.find(
                  x => x.id === o.medicationPrecautionFK,
                )
                return {
                  medicationPrecautionFK: o.medicationPrecautionFK,
                  precaution: precaution.displayValue,
                  precautionCode: precaution.code,
                  sequence: currentPrecautionSequence,
                  isDeleted: false,
                  uid: getUniqueId(),
                }
              }),
            )
          } else {
            ItemPrecautions = [
              {
                precaution: '',
                sequence: 0,
                uid: getUniqueId(),
              },
            ]
          }

          newTotalQuantity = item.quantity

          itemTotalPrice = item.isExternalPrescription
            ? 0
            : newTotalQuantity * drug.sellingPrice

          itemExpiryDate =
            !item.isExternalPrescription && defaultBatch
              ? defaultBatch.expiryDate
              : undefined
          itemBatchNo =
            !item.isExternalPrescription && defaultBatch
              ? defaultBatch.batchNo
              : undefined

          itemCostPrice = drug.averageCostPrice
          itemUnitPrice = drug.sellingPrice

          itemDispenseUOMCode = drug.dispensingUOM
            ? drug.dispensingUOM.code
            : undefined

          const uom = ctmedicationunitofmeasurement.find(
            uom => uom.id === drug?.dispensingUOM?.id,
          )
          itemDispenseUOMDisplayValue = getTranslationValue(
            uom?.translationData,
            primaryPrintoutLanguage,
            'displayValue',
          )
          itemSecondDispenseUOMDisplayValue =
            secondaryPrintoutLanguage !== ''
              ? getTranslationValue(
                  uom?.translationData,
                  secondaryPrintoutLanguage,
                  'displayValue',
                )
              : ''

          itemDispenseUOMFK = drug.dispensingUOM
            ? drug.dispensingUOM.id
            : undefined
          itemInventoryDispenseUOMFK = drug?.dispensingUOM?.id
          itemInventoryPrescribingUOMFK = drug?.prescribingUOM?.id
          itemDrugCode = drug.code
          itemDrugName = drug.displayValue
          itemDrugCaution = drug.caution
          isDispensedByPharmacy = drug.isDispensedByPharmacy
          isNurseActualizeRequired = drug.isNurseActualizable
          isExclusive = drug.isExclusive
          orderable = drug.orderable
        } else if (item.isDrugMixture) {
          // Drug Mixture
          itemExpiryDate = item.expiryDate
          itemBatchNo = item.batchNo
          itemCostPrice = item.costPrice || 0
          itemUnitPrice = item.unitPrice || 0
          itemDispenseUOMCode = item.dispenseUOMCode
          const uom = ctmedicationunitofmeasurement.find(
            uom => uom.id === item.dispenseUOMFK,
          )
          itemDispenseUOMDisplayValue = getTranslationValue(
            uom?.translationData,
            primaryPrintoutLanguage,
            'displayValue',
          )
          itemSecondDispenseUOMDisplayValue =
            secondaryPrintoutLanguage !== ''
              ? getTranslationValue(
                  uom?.translationData,
                  secondaryPrintoutLanguage,
                  'displayValue',
                )
              : ''
          itemDispenseUOMFK = item.dispenseUOMFK
          itemDrugCode = item.drugCode
          itemDrugName = item.drugName
          itemTotalPrice = item.totalPrice
          newTotalQuantity = item.quantity

          let precautionIndex = 0
          const precautions =
            item.corPrescriptionItemPrecaution ||
            item.retailPrescriptionItemPrecaution
          if (precautions && precautions.length > 0) {
            ItemPrecautions = ItemPrecautions.concat(
              precautions.map(o => {
                let currentPrecautionSequence = precautionIndex
                precautionIndex += 1
                return {
                  medicationPrecautionFK: o.medicationPrecautionFK,
                  precaution: o.precaution,
                  precautionCode: o.precautionCode,
                  sequence: currentPrecautionSequence,
                  isDeleted: false,
                  uid: getUniqueId(),
                }
              }),
            )
          } else {
            ItemPrecautions = [
              {
                precaution: '',
                sequence: 0,
                uid: getUniqueId(),
              },
            ]
          }

          let drugMixtureIndex = 0
          const drugMixtures =
            item.corPrescriptionItemDrugMixture ||
            item.retailPrescriptionItemDrugMixture
          if (drugMixtures && drugMixtures.length > 0) {
            itemCorPrescriptionItemDrugMixture = itemCorPrescriptionItemDrugMixture.concat(
              drugMixtures.map(o => {
                let drug = inventorymedication.find(
                  medication => medication.id === o.inventoryMedicationFK,
                )
                let currentDrugMixtureSequence = drugMixtureIndex
                drugMixtureIndex += 1

                const uom = ctmedicationunitofmeasurement.find(
                  uom => uom.id === drug.dispensingUOM.id,
                )
                return {
                  inventoryMedicationFK: o.inventoryMedicationFK,
                  drugCode: drug.code,
                  drugName: drug.displayValue,
                  quantity: o.quantity,
                  costPrice: drug.averageCostPrice || 0,
                  unitPrice: drug.sellingPrice || 0,
                  totalPrice: (drug.sellingPrice || 0) * o.quantity,
                  uomfk: drug.dispensingUOM.id,
                  uomCode: drug.dispensingUOM.code,
                  uomDisplayValue: getTranslationValue(
                    uom?.translationData,
                    primaryPrintoutLanguage,
                    'displayValue',
                  ),
                  secondUOMDisplayValue:
                    secondaryPrintoutLanguage !== ''
                      ? getTranslationValue(
                          uom?.translationData,
                          secondaryPrintoutLanguage,
                          'displayValue',
                        )
                      : '',
                  prescribeUOMFK: drug.prescribingUOM?.id,
                  prescribeUOMCode: drug.prescribingUOM?.code,
                  prescribeUOMDisplayValue: drug.prescribingUOM?.name,
                  batchNo: o.batchNo,
                  expiryDate: o.expiryDate,
                  revenueCategoryFK: drug.revenueCategoryFK,
                  sequence: currentDrugMixtureSequence,
                  isDeleted: false,
                  isNew: true,
                  subject: drug.displayValue,
                  caution: drug.caution,
                  isDispensedByPharmacy: drug.isDispensedByPharmacy,
                  isNurseActualizeRequired: drug.isNurseActualizable,
                  inventoryDispenseUOMFK: drug.dispensingUOM.id,
                  inventoryPrescribingUOMFK: drug.prescribingUOM?.id,
                  isActive: drug.isActive,
                  orderable: drug.orderable,
                }
              }),
            )
          }
          if (
            itemCorPrescriptionItemDrugMixture.find(
              dm => dm.isDispensedByPharmacy,
            )
          )
            isDispensedByPharmacy = true
          if (
            itemCorPrescriptionItemDrugMixture.find(
              dm => dm.isNurseActualizeRequired,
            )
          )
            isNurseActualizeRequired = true
        }

        return {
          type,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          expiryDate: itemExpiryDate,
          batchNo: itemBatchNo,
          corPrescriptionItemInstruction: itemInstructions,
          corPrescriptionItemPrecaution: ItemPrecautions,
          corPrescriptionItemDrugMixture: itemCorPrescriptionItemDrugMixture,
          costPrice: itemCostPrice,
          unitPrice: itemUnitPrice,
          dispenseUOMCode: itemDispenseUOMCode,
          dispenseUOMDisplayValue: itemDispenseUOMDisplayValue,
          secondDispenseUOMDisplayValue: itemSecondDispenseUOMDisplayValue,
          dispenseUOMFK: itemDispenseUOMFK,
          inventoryDispenseUOMFK: itemInventoryDispenseUOMFK,
          inventoryPrescribingUOMFK: itemInventoryPrescribingUOMFK,
          drugCode: itemDrugCode,
          drugName: itemDrugName,
          instruction,
          secondInstruction,
          inventoryMedicationFK: item.inventoryMedicationFK,
          isActive: true,
          isDeleted: false,
          quantity: newTotalQuantity,
          remarks: item.remarks,
          sequence: currentSequence,
          subject: item.drugName,
          totalPrice: itemTotalPrice,
          totalAfterItemAdjustment: itemTotalPrice,
          isExternalPrescription: item.isExternalPrescription,
          visitPurposeFK: undefined,
          isDrugMixture: item.isDrugMixture,
          isClaimable: item.isClaimable,
          caution: itemDrugCaution,
          performingUserFK: this.getVisitDoctorUserId(this.props),
          packageGlobalId: '',
          isDispensedByPharmacy,
          isNurseActualizeRequired,
          isExclusive,
          orderable,
        }
      }),
    )
    return data
  }

  GetNewVaccination = () => {
    const {
      getNextSequence,
      codetable,
      type,
      visitRegistration,
      patient,
      consultationDocument: { rows = [] },
    } = this.props
    const {
      inventoryvaccination,
      ctvaccinationusage,
      ctmedicationdosage,
      ctvaccinationunitofmeasurement,
    } = codetable

    const vaccinations = this.state.addedItems
    let data = []
    let sequence = getNextSequence()
    const { entity: visitEntity } = visitRegistration
    const clinicianProfile = getClinicianProfile(codetable, visitEntity)
    const { entity } = patient
    const { name, patientAccountNo, genderFK, dob } = entity
    const { ctgender = [] } = codetable
    const gender = ctgender.find(o => o.id === genderFK) || {}
    const allDocs = rows.filter(s => !s.isDeleted)
    let nextSequence = 1
    if (allDocs && allDocs.length > 0) {
      const { sequence: documentSequence } = _.maxBy(allDocs, 'sequence')
      nextSequence = documentSequence + 1
    }
    let showNoTemplate
    data = data.concat(
      vaccinations.map(item => {
        let currentSequence = sequence
        sequence += 1

        let vaccination = inventoryvaccination.find(
          vacc => vacc.id === item.inventoryVaccinationFK,
        )
        let defaultBatch = vaccination.vaccinationStock.find(
          o => o.isDefault === true,
        )

        let usage = ctvaccinationusage.find(
          vaccUsage => vaccUsage.id === item.usageMethodFK,
        )

        let dosage = ctmedicationdosage.find(
          vaccdosage => vaccdosage.id === item.dosageFK,
        )

        let uom = ctvaccinationunitofmeasurement.find(
          vaccuom => vaccuom.id === item.uomfk,
        )
        let dispenseUOM = ctvaccinationunitofmeasurement.find(
          vaccuom => vaccuom.id === item.dispenseUOMFK,
        )
        let newTotalQuantity = item.quantity

        const totalPrice = newTotalQuantity * vaccination.sellingPrice

        let newVaccination = {
          type,
          inventoryVaccinationFK: item.inventoryVaccinationFK,
          vaccinationGivenDate: item.vaccinationGivenDate,
          vaccinationCode: vaccination.code,
          vaccinationName: vaccination.displayValue,
          usageMethodFK: usage?.id,
          usageMethodCode: usage?.code,
          usageMethodDisplayValue: usage?.name,
          dosageFK: dosage?.id,
          dosageCode: dosage?.code,
          dosageDisplayValue: dosage?.displayValue,
          uomfk: uom?.id,
          uomCode: uom?.code,
          uomDisplayValue: uom?.name,
          dispenseUOMFK: dispenseUOM?.id,
          dispenseUOMCode: dispenseUOM?.code,
          dispenseUOMDisplayValue: dispenseUOM?.name,
          quantity: newTotalQuantity,
          unitPrice: vaccination.sellingPrice,
          totalPrice,
          adjAmount: 0.0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment: totalPrice,
          sequence: currentSequence,
          expiryDate: defaultBatch ? defaultBatch.expiryDate : undefined,
          batchNo: defaultBatch ? defaultBatch.batchNo : undefined,
          remarks: item.remarks,
          isActive: true,
          isDeleted: false,
          subject: vaccination.displayValue,
          caution: vaccination.caution,
          isGenerateCertificate: vaccination.isAutoGenerateCertificate,
          performingUserFK: this.getVisitDoctorUserId(this.props),
          packageGlobalId: '',
          isNurseActualizeRequired: vaccination.isNurseActualizable,
          instruction: `${usage?.name || ''} ${dosage?.displayValue ||
            ''} ${uom?.name || ''}`,
        }
        let newCORVaccinationCert = []
        if (newVaccination.isGenerateCertificate) {
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
                  content: ReplaceCertificateTeplate(
                    r.templateContent,
                    newVaccination,
                  ),
                  sequence: nextSequence,
                },
              ]
              nextSequence += 1
            })
          } else {
            showNoTemplate = true
          }
        }
        return {
          ...newVaccination,
          corVaccinationCert: newCORVaccinationCert,
        }
      }),
    )
    if (showNoTemplate) {
      notification.warning({
        message:
          'Any changes will not be reflected in the vaccination certificate.',
      })
    }
    return data
  }

  onSelectItems = items => {
    let addedItems = this.state.addedItems.map(o => {
      return {
        ...o,
      }
    })

    if (items instanceof Array) {
      items.forEach(item => {
        if (!addedItems.find(o => o.id === item.id)) {
          addedItems.push(item)
        }
      })
    } else {
      let exxistsItem = addedItems.find(o => o.id === items.id)
      if (exxistsItem) {
        addedItems = addedItems.filter(o => o.id !== items.id)
      } else {
        addedItems.push(items)
      }
    }
    this.setAddedItems(addedItems)
  }

  handleSubmit = () => {
    const { dispatch, onConfirm, type, codetable, patient } = this.props
    const { inventorymedication = [] } = codetable
    const { entity = {} } = patient
    const { patientAllergy = [] } = entity
    let data = []
    let cautionItems = []
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

    if (type === '1') {
      data = this.GetNewMedication()
      data.map(m => {
        if (m.isDrugMixture) {
          const mixtureItems = m.corPrescriptionItemDrugMixture || []
          mixtureItems.forEach(mixture => {
            if (
              mixture.caution &&
              mixture.caution.trim().length &&
              !cautionItems.find(
                f =>
                  f.type === 'Medication' &&
                  f.id === mixture.inventoryMedicationFK,
              )
            ) {
              cautionItems.push({
                type: 'Medication',
                subject: mixture.subject,
                caution: mixture.caution,
                id: mixture.inventoryMedicationFK,
              })
            }

            if (!allergys.find(f => f.id === mixture.inventoryMedicationFK)) {
              insertAllergys(mixture.inventoryMedicationFK)
            }
          })
        } else {
          if (
            m.caution &&
            m.caution.trim().length > 0 &&
            !cautionItems.find(
              f => f.type === 'Medication' && f.id === m.inventoryMedicationFK,
            )
          ) {
            cautionItems.push({
              type: 'Medication',
              subject: m.subject,
              caution: m.caution,
              id: m.inventoryMedicationFK,
            })
          }

          if (!allergys.find(f => f.id === m.inventoryMedicationFK)) {
            insertAllergys(m.inventoryMedicationFK)
          }
        }
      })
    } else if (type === '2') {
      data = this.GetNewVaccination()
      data
        .filter(f => f.caution && f.caution.trim().length > 0)
        .map(m => {
          if (
            !cautionItems.find(
              c =>
                c.type === 'Vaccination' && c.id === m.inventoryVaccinationFK,
            )
          ) {
            cautionItems.push({
              type: 'Vaccination',
              subject: m.subject,
              caution: m.caution,
              id: m.inventoryVaccinationFK,
            })
          }
        })
    }

    const updateRows = () => {
      dispatch({
        type: 'orders/upsertRows',
        payload: data,
      }).then(() => {
        if (onConfirm) onConfirm()
      })
    }

    if (cautionItems.length || allergys.length) {
      openCautionAlertPrompt(cautionItems, allergys, [], updateRows)
    } else {
      updateRows()
    }
  }

  handelSearch = () => {
    const { values } = this.props
    const { visitFromDate, visitToDate, searchName, isAllDate } = values
    this.setState(
      {
        visitFromDate,
        visitToDate,
        searchName,
        isAllDate,
        pageIndex: 0,
        loadVisits: [],
        addedItems: [],
        totalVisits: 0,
        activeKey: [],
      },
      this.searchHistory,
    )
  }

  handelLoadMore = () => {
    this.searchHistory()
  }

  searchHistory = () => {
    const {
      visitFromDate,
      visitToDate,
      searchName,
      isAllDate,
      pageIndex,
    } = this.state
    const { dispatch, visitRegistration, clinicSettings, type } = this.props
    const { patientProfileFK } = visitRegistration.entity.visit
    const { viewVisitPageSize = 10 } = clinicSettings
    dispatch({
      type: 'medicationHistory/queryMedicationHistory',
      payload: {
        visitFromDate: visitFromDate
          ? moment(visitFromDate)
              .startOf('day')
              .formatUTC()
          : undefined,
        visitToDate: visitToDate
          ? moment(visitToDate)
              .endOf('day')
              .formatUTC(false)
          : undefined,
        searchName,
        isAllDate,
        pageIndex: pageIndex + 1,
        pageSize: viewVisitPageSize,
        patientProfileId: patientProfileFK,
        IsSearchMedication: type === '1',
      },
    }).then(r => {
      if (r) {
        this.setState(preState => {
          return {
            ...preState,
            loadVisits: [...preState.loadVisits, ...r.list],
            totalVisits: r.totalVisits,
            pageIndex: preState.pageIndex + 1,
            activeKey: [...preState.activeKey, ...r.list.map(o => o.id)],
          }
        })
      }
    })
  }

  clickCollapseHeader = visitID => {
    this.setState(preState => {
      if (preState.activeKey.find(key => key === visitID)) {
        return {
          ...preState,
          activeKey: preState.activeKey.filter(key => key !== visitID),
        }
      }
      return {
        ...preState,
        activeKey: [...preState.activeKey, visitID],
      }
    })
  }

  render() {
    const { loading, type, footer, clinicSettings } = this.props
    const { viewVisitPageSize = 10 } = clinicSettings
    const { pageIndex, loadVisits, totalVisits, activeKey } = this.state
    const moreData = totalVisits > pageIndex * viewVisitPageSize
    const show = loading.effects['medicationHistory/queryMedicationHistory']
    return (
      <LoadingWrapper
        loading={show}
        text='Retrieving medication history list...'
      >
        <div>
          <FitlerBar
            type={type}
            selectItemCount={this.state.addedItems.length}
            handelSearch={this.handelSearch}
            {...this.props}
          />
          <Grid
            onSelectMedication={this.onSelectMedication}
            onSelectItems={this.onSelectItems}
            addedItems={this.state.addedItems}
            moreData={moreData}
            handelLoadMore={this.handelLoadMore}
            loadVisits={loadVisits}
            activeKey={activeKey}
            clickCollapseHeader={this.clickCollapseHeader}
            {...this.props}
          />
        </div>
        {footer &&
          footer({
            onConfirm: this.handleSubmit,
            confirmBtnText: 'Confirm',
            confirmProps: {
              disabled: this.state.addedItems.length <= 0,
            },
          })}
      </LoadingWrapper>
    )
  }
}

export default PastMedication
