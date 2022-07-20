import React, { PureComponent } from 'react'
import _ from 'lodash'
import { connect } from 'dva'
import * as Yup from 'yup'
import moment from 'moment'
// medisys components
import { LoadingWrapper } from '@/components/_medisys'
// custom component
import { notification, CommonModal } from '@/components'
import { withFormik } from 'formik'
// sub components
import {
  openCautionAlertPrompt,
  ReplaceCertificateTeplate,
  getDrugAllergy,
} from '@/pages/Widgets/Orders/utils'
import Authorized from '@/utils/Authorized'
import { getUniqueId, getTranslationValue } from '@/utils/utils'
import FitlerBar from './FilterBar'
import Grid from './Grid'
import Details from './Details'
import { getClinicianProfile } from '../../../ConsultationDocument/utils'

@connect(({ loading, codetable, user, visitRegistration, clinicSettings }) => ({
  loading,
  codetable,
  user,
  visitRegistration,
  clinicSettings: clinicSettings.settings || clinicSettings.default,
}))
@withFormik({
  displayName: 'PrescriptionSetList',
  validationSchema: Yup.object().shape({}),
  mapPropsToValues: () => ({}),
  handleSubmit: () => ({}),
})
class PrescriptionSetList extends PureComponent {
  constructor(props) {
    super(props)

    this.generalAccessRight = Authorized.check(
      'queue.consultation.order.medication.generalprescriptionset',
    ) || { rights: 'hidden' }

    let defaultType = 'All'
    if (this.generalAccessRight.rights === 'hidden') {
      defaultType = 'Personal'
    }
    this.state = {
      addedPrescriptionSets: [],
      searchName: '',
      loadPrescriptionSets: [],
      activeKey: [],
      showPrescriptionSetDetailModal: false,
      isNewPrescriptionSet: false,
      selectType: defaultType,
    }
  }

  componentWillMount() {
    this.searchPrescriptionSet()
  }

  setAddedPrescriptionSets = v => {
    this.setState({
      addedPrescriptionSets: v,
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
    const { getNextSequence, codetable, isRetail, clinicSettings } = this.props
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
    } = codetable

    const { loadPrescriptionSets = [], addedPrescriptionSets = [] } = this.state

    const setectPrescriptionSet = loadPrescriptionSets.filter(
      ps => addedPrescriptionSets.indexOf(ps.id) >= 0,
    )
    let data = []
    let sequence = getNextSequence()
    setectPrescriptionSet.forEach(ps => {
      data = data.concat(
        ps.prescriptionSetItem
          .filter(drug => !isRetail || !drug.isExternalPrescription)
          .map(item => {
            let currentSequence = sequence
            sequence += 1

            let itemInstructions = item.prescriptionSetItemInstruction
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
                drugfrequency =>
                  drugfrequency.id === instruction.drugFrequencyFK,
              )
              return {
                usageMethodFK: usage ? usage.id : undefined,
                usageMethodCode: usage ? usage.code : undefined,
                usageMethodDisplayValue: usage ? usage.displayVaue : undefined,
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
                ? this.getInstruction(
                    itemInstructions,
                    secondaryPrintoutLanguage,
                  )
                : ''

            let itemCostPrice
            let itemUnitPrice
            let itemDispenseUOMCode
            let itemDispenseUOMDisplayValue
            let itemSecondDispenseUOMDisplayValue
            let itemDispenseUOMFK
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
            let inventoryDispenseUOMFK
            let inventoryPrescribingUOMFK
            let orderable

            const precautions = item.prescriptionSetItemPrecaution
            if (precautions && precautions.length > 0) {
              ItemPrecautions = ItemPrecautions.concat(
                precautions.map((o, index) => {
                  return {
                    medicationPrecautionFK: o.medicationPrecautionFK,
                    precaution: o.precaution,
                    precautionCode: o.precautionCode,
                    sequence: index,
                    isDeleted: false,
                    uid: getUniqueId(),
                  }
                }),
              )
            }

            if (item.inventoryMedicationFK) {
              // Normal Drug
              let drug = inventorymedication.find(
                medication => medication.id === item.inventoryMedicationFK,
              )

              newTotalQuantity = item.quantity

              itemTotalPrice = item.isExternalPrescription
                ? 0
                : newTotalQuantity * drug.sellingPrice

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
              itemDrugCode = drug.code
              itemDrugName = drug.displayValue
              itemDrugCaution = drug.caution
              isDispensedByPharmacy = drug.isDispensedByPharmacy
              isNurseActualizeRequired = drug.isNurseActualizable
              isExclusive = drug.isExclusive
              inventoryDispenseUOMFK = drug.dispensingUOM.id
              inventoryPrescribingUOMFK = drug.prescribingUOM?.id
              orderable = drug.orderable
            } else if (item.isDrugMixture) {
              // Drug Mixture
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
              itemDrugCode = 'DrugMixture'
              itemDrugName = item.drugName
              itemTotalPrice = 0
              newTotalQuantity = item.quantity

              let drugMixtureIndex = 0
              const drugMixtures = item.prescriptionSetItemDrugMixture
              if (drugMixtures && drugMixtures.length > 0) {
                itemCorPrescriptionItemDrugMixture = itemCorPrescriptionItemDrugMixture.concat(
                  drugMixtures.map(o => {
                    const drug = inventorymedication.find(
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
              type: '1',
              adjAmount: 0,
              adjType: 'ExactAmount',
              adjValue: 0,
              corPrescriptionItemInstruction: itemInstructions,
              corPrescriptionItemPrecaution: ItemPrecautions,
              corPrescriptionItemDrugMixture: itemCorPrescriptionItemDrugMixture,
              costPrice: itemCostPrice,
              unitPrice: itemUnitPrice,
              dispenseUOMCode: itemDispenseUOMCode,
              dispenseUOMDisplayValue: itemDispenseUOMDisplayValue,
              secondDispenseUOMDisplayValue: itemSecondDispenseUOMDisplayValue,
              dispenseUOMFK: itemDispenseUOMFK,
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
              inventoryDispenseUOMFK,
              inventoryPrescribingUOMFK,
              orderable,
            }
          }),
      )
    })
    return data
  }

  onSelectItems = prescriptionSetId => {
    if (this.state.addedPrescriptionSets.indexOf(prescriptionSetId) < 0) {
      this.setAddedPrescriptionSets([
        ...this.state.addedPrescriptionSets,
        prescriptionSetId,
      ])
    } else {
      this.setAddedPrescriptionSets([
        ...this.state.addedPrescriptionSets.filter(
          ps => ps !== prescriptionSetId,
        ),
      ])
    }
  }

  handleSubmit = () => {
    const { dispatch, onConfirm, codetable, patient } = this.props
    const { inventorymedication = [] } = codetable
    const { entity = {} } = patient
    const { patientAllergy = [] } = entity
    let data = []
    const cautionItems = []
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

    data = this.GetNewMedication()
    data.map(m => {
      if (m.isDrugMixture) {
        const mixtureItems = m.corPrescriptionItemDrugMixture || []
        mixtureItems.forEach(mixture => {
          if (
            mixture.caution &&
            mixture.caution.trim().length &&
            !cautionItems.find(f => f.id === mixture.inventoryMedicationFK)
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
          !cautionItems.find(f => f.id === m.inventoryMedicationFK)
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
    const { searchName } = values
    this.setState(
      {
        searchName,
        loadPrescriptionSets: [],
        addedPrescriptionSets: [],
        activeKey: [],
      },
      this.searchPrescriptionSet,
    )
  }

  searchPrescriptionSet = () => {
    const { searchName } = this.state
    const { dispatch, user } = this.props
    dispatch({
      type: 'prescriptionSet/query',
      payload: {
        prescriptionSetName: searchName,
        pageSize: 99999,
        group: [
          {
            ownedByUserFK: user.data.id,
            type: 'General',
            combineCondition: 'or',
          },
        ],
        sorting: [
          { columnName: 'type', direction: 'desc' },
          { columnName: 'sortOrder', direction: 'asc' },
          { columnName: 'prescriptionSetName', direction: 'asc' },
        ],
      },
    }).then(r => {
      if (r) {
        this.setState(preState => {
          return {
            ...preState,
            loadPrescriptionSets: [
              ...preState.loadPrescriptionSets,
              ...(r.data || []),
            ],
            activeKey: [
              ...preState.activeKey,
              ...(r.data || []).map(o => o.id),
            ],
          }
        })
      }
    })
  }

  clickCollapseHeader = prescriptionSetID => {
    this.setState(preState => {
      if (preState.activeKey.find(key => key === prescriptionSetID)) {
        return {
          ...preState,
          activeKey: preState.activeKey.filter(
            key => key !== prescriptionSetID,
          ),
        }
      }
      return {
        ...preState,
        activeKey: [...preState.activeKey, prescriptionSetID],
      }
    })
  }

  deletePrescriptionSet = prescriptionSetID => {
    const { dispatch } = this.props
    dispatch({
      type: 'prescriptionSet/delete',
      payload: {
        id: prescriptionSetID,
      },
    }).then(r => {
      this.setState(
        {
          loadPrescriptionSets: [],
          addedPrescriptionSets: [],
          activeKey: [],
        },
        this.searchPrescriptionSet,
      )
    })
  }

  editPrescriptionSet = async prescriptionSet => {
    const { dispatch } = this.props
    await dispatch({
      type: 'prescriptionSet/updateState',
      payload: {
        entity: { ...prescriptionSet },
        prescriptionSetItems: [
          ...prescriptionSet.prescriptionSetItem.map(psi => {
            return {
              ...psi,
              uid: getUniqueId(),
            }
          }),
        ],
      },
    })

    this.setState({ showPrescriptionSetDetailModal: true })
  }

  toggleShowPrescriptionSetDetailModal = isUpdateEntity => {
    const { dispatch } = this.props
    dispatch({
      type: 'prescriptionSet/updateState',
      payload: {
        entity: undefined,
        prescriptionSetItems: [],
        editPrescriptionSetItem: undefined,
      },
    })

    this.setState({
      showPrescriptionSetDetailModal: false,
      isNewPrescriptionSet: false,
    })

    if (isUpdateEntity) {
      this.setState(
        {
          loadPrescriptionSets: [],
          addedPrescriptionSets: [],
          activeKey: [],
        },
        this.searchPrescriptionSet,
      )
    }
  }

  render() {
    const { loading, footer } = this.props
    const {
      loadPrescriptionSets = [],
      activeKey,
      addedPrescriptionSets = [],
      showPrescriptionSetDetailModal,
      isNewPrescriptionSet,
      selectType,
    } = this.state
    const show = loading.effects['medicationHistory/queryMedicationHistory']
    const setectPrescriptionSet = loadPrescriptionSets.filter(
      ps => addedPrescriptionSets.indexOf(ps.id) >= 0,
    )
    const disableFilterPrescriptionSet =
      this.generalAccessRight.rights === 'hidden'

    return (
      <LoadingWrapper loading={show} text='Retrieving prescription set list...'>
        <div>
          <FitlerBar
            handelNewPrescriptionSet={async () => {
              const {
                dispatch,
                orders: { rows = [] },
              } = this.props
              await dispatch({
                type: 'prescriptionSet/updateState',
                payload: {
                  entity: undefined,
                  prescriptionSetItems: rows
                    .filter(r => !r.isDeleted && r.type === '1')
                    .map((drug, index) => {
                      return {
                        ...drug,
                        id: undefined,
                        uid: getUniqueId(),
                        prescriptionSetItemPrecaution: drug.corPrescriptionItemPrecaution
                          .filter(p => !p.isDeleted)
                          .map(p => {
                            return { ...p, id: undefined }
                          }),
                        prescriptionSetItemInstruction: drug.corPrescriptionItemInstruction
                          .filter(i => !i.isDeleted)
                          .map(i => {
                            return { ...i, id: undefined }
                          }),
                        prescriptionSetItemDrugMixture: (
                          drug.corPrescriptionItemDrugMixture || []
                        )
                          .filter(dm => !dm.isDeleted)
                          .map(dm => {
                            return { ...dm, id: undefined }
                          }),
                        sequence: index,
                      }
                    }),
                },
              })
              this.setState({
                showPrescriptionSetDetailModal: true,
                isNewPrescriptionSet: true,
              })
            }}
            selectItemCount={setectPrescriptionSet.length}
            handelSearch={this.handelSearch}
            selectType={selectType}
            typeChange={e => {
              this.setState({ selectType: e.target.value })
            }}
            generalAccessRight={this.generalAccessRight}
            {...this.props}
          />
          <Grid
            onSelectMedication={this.onSelectMedication}
            onSelectItems={this.onSelectItems}
            addedPrescriptionSets={this.state.addedPrescriptionSets}
            loadPrescriptionSets={loadPrescriptionSets}
            activeKey={activeKey}
            clickCollapseHeader={this.clickCollapseHeader}
            handelDelete={this.deletePrescriptionSet}
            handelEdit={this.editPrescriptionSet}
            selectType={selectType}
            generalAccessRight={this.generalAccessRight}
            {...this.props}
          />
        </div>
        {footer &&
          footer({
            onConfirm: this.handleSubmit,
            confirmBtnText: 'Confirm',
            confirmProps: {
              disabled: this.state.addedPrescriptionSets.length <= 0,
            },
          })}
        <CommonModal
          open={showPrescriptionSetDetailModal}
          title={`${
            isNewPrescriptionSet ? 'Add New' : 'Edit'
          } Prescription Set`}
          onClose={this.toggleShowPrescriptionSetDetailModal}
          onConfirm={() => this.toggleShowPrescriptionSetDetailModal(true)}
          observe='PrescriptionSetDetail'
          maxWidth='md'
          showFooter={false}
          overrideLoading
          cancelText='Cancel'
        >
          <Details
            {...this.props}
            generalAccessRight={this.generalAccessRight}
          />
        </CommonModal>
      </LoadingWrapper>
    )
  }
}

export default PrescriptionSetList
