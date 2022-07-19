import React, { PureComponent } from 'react'
import Yup from '@/utils/yup'
import { connect } from 'dva'
import { getUniqueId, getTranslationValue } from '@/utils/utils'
import { compose } from 'redux'
import classnames from 'classnames'
import { Divider } from '@material-ui/core'
import { Add, Delete } from '@material-ui/icons'
import { Alert } from 'antd'
import { formatMessage } from 'umi'
import {
  withFormikExtend,
  FastField,
  Field,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  NumberInput,
  CodeSelect,
  Checkbox,
  ProgressButton,
  Button,
  EditableTableGrid,
  FieldArray,
  Tooltip,
  Select,
  notification,
  LocalSearchSelect,
} from '@/components'
import { currencySymbol } from '@/utils/config'
import CannedTextButton from '@/pages/Widgets/Orders/Detail/CannedTextButton'
import { CANNED_TEXT_TYPE } from '@/utils/constants'
import LowStockInfo from '../../LowStockInfo'
import { useForkRef } from '@material-ui/core'

const getCautions = (
  inventorymedication = [],
  isDrugMixture,
  prescriptionSetItemDrugMixture = [],
  inventoryMedicationFK,
) => {
  let Cautions = []
  if (isDrugMixture) {
    prescriptionSetItemDrugMixture
      .filter(o => !o.isDeleted)
      .forEach(item => {
        const selectMedication = inventorymedication.find(
          medication => medication.id === item.inventoryMedicationFK,
        )
        if (
          selectMedication &&
          selectMedication.caution &&
          selectMedication.caution.trim().length
        ) {
          Cautions.push({
            id: item.id,
            name: selectMedication.displayValue || '',
            message: selectMedication.caution,
          })
        }
      })
  } else {
    const selectMedication = inventorymedication.find(
      medication => medication.id === inventoryMedicationFK,
    )
    if (
      selectMedication &&
      selectMedication.caution &&
      selectMedication.caution.trim().length
    ) {
      Cautions.push({ message: selectMedication.caution })
    }
  }
  return Cautions
}

const drugMixtureItemSchema = Yup.object().shape({
  inventoryMedicationFK: Yup.string().required(),
  quantity: Yup.number().min(0),
})

@connect(({ prescriptionSet, codetable, clinicSettings }) => ({
  prescriptionSet,
  codetable,
  clinicSettings: clinicSettings.settings || clinicSettings.default,
}))
@withFormikExtend({
  enableReinitialize: true,
  mapPropsToValues: ({ prescriptionSet, codetable }) => {
    const isDrugMixture =
      prescriptionSet.editPrescriptionSetItem &&
      prescriptionSet.editPrescriptionSetItem.isDrugMixture
    const editingMedicationFK = []
    if (isDrugMixture) {
      const mixtureItems =
        prescriptionSet.editPrescriptionSetItem
          .prescriptionSetItemDrugMixture || []
      mixtureItems
        .filter(o => !o.isDeleted)
        .map(m => editingMedicationFK.push(m.inventoryMedicationFK))
    } else if (
      prescriptionSet.editPrescriptionSetItem &&
      prescriptionSet.editPrescriptionSetItem.inventoryMedicationFK
    ) {
      editingMedicationFK.push(
        prescriptionSet.editPrescriptionSetItem.inventoryMedicationFK,
      )
    }

    const v = {
      ...(prescriptionSet.editPrescriptionSetItem ||
        prescriptionSet.defaultPrescriptionSetItem),
      isEditMedication: !_.isEmpty(prescriptionSet.editPrescriptionSetItem),
      editingMedicationFK,
    }

    let sequence = 0
    const newPrescriptionSetItemPrecaution = (
      v.prescriptionSetItemPrecaution || []
    ).map(precaution => {
      sequence += 1
      return {
        ...precaution,
        sequence,
      }
    })

    let newDrugMixtureRowId = 0
    const newPrescriptionSetItemDrugMixture = (
      v.prescriptionSetItemDrugMixture || []
    ).map(drugMixture => {
      newDrugMixtureRowId -= 1
      return {
        ...drugMixture,
        id: drugMixture.isNew ? newDrugMixtureRowId : drugMixture.id,
        uomfk: drugMixture.inventoryDispenseUOMFK,
        prescribeUOMFK: drugMixture.inventoryPrescribingUOMFK,
      }
    })

    const { inventorymedication = [] } = codetable

    let cautions = getCautions(
      inventorymedication,
      isDrugMixture,
      newPrescriptionSetItemDrugMixture,
      v.inventoryMedicationFK,
    )

    const medication = inventorymedication.find(
      item => item.id === v.inventoryMedicationFK,
    )

    const firstDrugMixture = _.orderBy(
      newPrescriptionSetItemDrugMixture.filter(d => !d.isDeleted),
      ['sequence'],
      ['asc'],
    )[0]

    return {
      ...v,
      dispenseUOMFK: isDrugMixture
        ? firstDrugMixture.inventoryDispenseUOMFK
        : v.inventoryDispenseUOMFK,
      dispenseUOMDisplayValue: isDrugMixture
        ? v.dispenseUOMDisplayValue
        : medication?.dispensingUOM?.name,
      prescriptionSetItemInstruction: (
        v.prescriptionSetItemInstruction || []
      ).map(i => {
        return {
          ...i,
          prescribeUOMFK: isDrugMixture
            ? firstDrugMixture.inventoryPrescribingUOMFK
            : v.inventoryPrescribingUOMFK,
        }
      }),
      prescriptionSetItemPrecaution:
        newPrescriptionSetItemPrecaution.length > 0
          ? newPrescriptionSetItemPrecaution
          : [{}],
      prescriptionSetItemDrugMixture:
        newPrescriptionSetItemDrugMixture.length > 0
          ? newPrescriptionSetItemDrugMixture
          : [],
      cautions,
      selectedMedication: medication || {},
    }
  },
  validationSchema: Yup.object().shape({
    quantity: Yup.number()
      .min(0.0, 'Quantity must be between 0.0 and 999')
      .max(999, 'Quantity must be between 0.0 and 999')
      .required(),
    dispenseUOMFK: Yup.number().required(),
    inventoryMedicationFK: Yup.number().when('isDrugMixture', isDrugMixture => {
      if (!isDrugMixture) return Yup.number().required()
      return Yup.number()
    }),
    drugName: Yup.string().when('isDrugMixture', isDrugMixture => {
      if (isDrugMixture) return Yup.string().required()
      return Yup.string()
    }),
    prescriptionSetItemInstruction: Yup.array().of(
      Yup.object().shape({
        sequence: Yup.number().required(),
        stepdose: Yup.string().required(),
      }),
    ),
    prescriptionSetItemDrugMixture: Yup.array().when(
      'isDrugMixture',
      isDrugMixture => {
        if (isDrugMixture)
          return Yup.array()
            .compact(v => v.isDeleted)
            .of(drugMixtureItemSchema)
        return Yup.array().compact(v => v.isDeleted)
      },
    ),
  }),

  handleSubmit: (values, { props, onConfirm, setValues }) => {
    const { dispatch, prescriptionSet, codetable, clinicSettings } = props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const {
      inventorymedication,
      ctmedicationdosage,
      ctmedicationusage,
      ctmedicationfrequency,
      ctmedicationunitofmeasurement,
    } = codetable

    const getNextSequence = () => {
      const {
        prescriptionSet: { prescriptionSetItems = [] },
      } = props

      const allItems = prescriptionSetItems.filter(s => !s.isDeleted)
      let nextSequence = 1
      if (allItems && allItems.length > 0) {
        const { sequence } = _.maxBy(allItems, 'sequence')
        nextSequence = sequence + 1
      }
      return nextSequence
    }

    if (!values.isDrugMixture) {
      const medication = inventorymedication.find(
        drug => drug.id === values.inventoryMedicationFK,
      )
      values.drugName = medication?.displayValue
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
          const dosage = ctmedicationdosage.find(d => d.id === item.dosageFK)
          const usage = ctmedicationusage.find(u => u.id === item.usageMethodFK)
          const frequency = ctmedicationfrequency.find(
            f => f.id === item.drugFrequencyFK,
          )
          const uom = ctmedicationunitofmeasurement.find(
            m => m.id === item.prescribeUOMFK,
          )

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
      values.prescriptionSetItemInstruction,
      primaryPrintoutLanguage,
    )
    let secondInstruction =
      secondaryPrintoutLanguage !== ''
        ? getInstruction(
            values.prescriptionSetItemInstruction,
            secondaryPrintoutLanguage,
          )
        : ''

    const prescriptionSetItemPrecaution = values.prescriptionSetItemPrecaution.filter(
      i => i.medicationPrecautionFK !== undefined,
    )

    const activeInstruction = values.prescriptionSetItemInstruction.filter(
      item => !item.isDeleted,
    )

    // reorder and overwrite sequence
    prescriptionSetItemPrecaution.forEach((item, index) => {
      if (!item.isDeleted) item.sequence = index + 1
    })

    // reorder and overwrite sequence
    activeInstruction.forEach((item, index) => {
      item.sequence = index + 1
    })

    if (values.prescriptionSetItemDrugMixture) {
      const activeDrugMixtureItems = values.prescriptionSetItemDrugMixture.filter(
        item => !item.isDeleted,
      )
      // reorder and overwrite sequence, get combined drug name
      activeDrugMixtureItems.forEach((item, index) => {
        const medication = inventorymedication.find(
          drug => drug.id === item.inventoryMedicationFK,
        )
        item.drugName = medication?.displayValue
        if (item.isNew && item.id < 0) item.id = undefined
      })
    }

    const data = {
      sequence: getNextSequence(),
      ...values,
      prescriptionSetItemPrecaution,
      instruction,
      secondInstruction,
      isDeleted: false,
    }

    dispatch({
      type: 'prescriptionSet/upsertRow',
      payload: data,
    })

    if (onConfirm) onConfirm()

    setValues({
      ...prescriptionSet.defaultPrescriptionSetItem,
      selectedMedication: {},
    })
    return true
  },
  displayName: 'PrescriptionItem',
})
class Detail extends PureComponent {
  componentDidMount = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctmedicationprecaution' },
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
      match = false
    }
    return match
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
      <div style={{ height: 40, lineHeight: '40px' }}>
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
                style={{ fontWeight: 550, fontSize: 15 }}
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
            useTooltip2
            title={medicationGroupName ? `Group: ${medicationGroupName}` : ''}
          >
            <div
              style={{
                width: 570,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
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

  changeMedication = (v, op = {}) => {
    const { setFieldValue, values, codetable } = this.props
    const { ctmedicationprecaution } = codetable
    const {
      prescriptionSetItemInstruction = [],
      prescriptionSetItemPrecaution = [],
    } = values
    let defaultInstruction = {
      sequence: 0,
      stepdose: 'AND',
      uid: getUniqueId(),
    }

    if (op.id) {
      defaultInstruction = {
        ...defaultInstruction,
        usageMethodFK: op.medicationUsage ? op.medicationUsage.id : undefined,
        usageMethodCode: op.medicationUsage
          ? op.medicationUsage.code
          : undefined,
        usageMethodDisplayValue: op.medicationUsage
          ? op.medicationUsage.name
          : undefined,
        prescribeUOMFK: op.prescribingUOM ? op.prescribingUOM.id : undefined,
        prescribeUOMCode: op.prescribingUOM
          ? op.prescribingUOM.code
          : undefined,
        prescribeUOMDisplayValue: op.prescribingUOM
          ? op.prescribingUOM.name
          : undefined,
      }
    }

    const isEdit = !!values.id
    const newPrescriptionInstruction = isEdit
      ? [
          ...prescriptionSetItemInstruction.map(i => ({
            ...i,
            isDeleted: true,
          })),
          defaultInstruction,
        ]
      : [defaultInstruction]

    setFieldValue('prescriptionSetItemInstruction', newPrescriptionInstruction)

    setFieldValue('isActive', op.isActive)
    setFieldValue('orderable', op.orderable)
    setFieldValue('selectedMedication', op)

    if (
      op.inventoryMedication_MedicationPrecaution &&
      op.inventoryMedication_MedicationPrecaution.length > 0
    ) {
      op.inventoryMedication_MedicationPrecaution.forEach((im, i) => {
        const precaution = ctmedicationprecaution.find(
          x => x.id === im.medicationPrecautionFK,
        )
        setFieldValue(
          `prescriptionSetItemPrecaution[${i}].medicationPrecautionFK`,
          im.medicationPrecautionFK,
        )
        setFieldValue(
          `prescriptionSetItemPrecaution[${i}].precaution`,
          precaution.displayValue,
        )
        setFieldValue(
          `prescriptionSetItemPrecaution[${i}].precautionCode`,
          precaution.code,
        )
        setFieldValue(`prescriptionSetItemPrecaution[${i}].sequence`, i)
        setFieldValue(`prescriptionSetItemPrecaution[${i}].uid`, getUniqueId())
      })
    } else {
      const defaultPrecaution = {
        precaution: '',
        sequence: 0,
        uid: getUniqueId(),
      }
      const newPrescriptionPrecaution = isEdit
        ? [
            ...prescriptionSetItemPrecaution.map(i => ({
              ...i,
              isDeleted: true,
            })),
            defaultPrecaution,
          ]
        : [defaultPrecaution]

      setFieldValue(`prescriptionSetItemPrecaution`, newPrescriptionPrecaution)
    }

    setFieldValue(
      'dispenseUOMFK',
      op.dispensingUOM ? op.dispensingUOM.id : undefined,
    )
    setFieldValue(
      'inventoryDispenseUOMFK',
      op.dispensingUOM ? op.dispensingUOM.id : undefined,
    )
    setFieldValue(
      'inventoryPrescribingUOMFK',
      op.prescribingUOM ? op.prescribingUOM.id : undefined,
    )

    setFieldValue(
      'dispenseUOMDisplayValue',
      op.dispensingUOM ? op.dispensingUOM.name : [],
    )

    if (!values.isDrugMixture) {
      setFieldValue('drugName', op.displayValue)
      setFieldValue('isExclusive', op.isExclusive)

      setTimeout(() => {
        this.calculateQuantity(op)
      }, 1)

      if (op) {
        const { codetable } = this.props
        const { inventorymedication = [] } = codetable
        let cautions = getCautions(
          inventorymedication,
          values.isDrugMixture,
          values.corPrescriptionItemDrugMixture,
          op.id,
        )
        setFieldValue('cautions', cautions)
      } else {
        setFieldValue('cautions', [])
      }
    }
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

  handleReset = () => {
    const { setValues, prescriptionSet, dispatch } = this.props

    setValues({
      ...prescriptionSet.defaultPrescriptionSetItem,
      selectedMedication: {},
    })

    dispatch({
      type: 'global/updateState',
      payload: {
        disableSave: false,
      },
    })
  }

  footerBtns = () => {
    const { classes, prescriptionSet, dispatch, theme } = this.props
    const { editPrescriptionSetItem } = prescriptionSet
    return (
      <React.Fragment>
        <Divider />

        <div
          style={{
            textAlign: 'right',
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(1),
          }}
        >
          <Button
            color='danger'
            size='sm'
            onClick={() => {
              if (editPrescriptionSetItem) {
                dispatch({
                  type: 'prescriptionSet/updateState',
                  payload: {
                    editPrescriptionSetItem: undefined,
                  },
                })
              }
              this.handleReset()
            }}
          >
            Discard
          </Button>
          <ProgressButton
            color='primary'
            size='sm'
            onClick={this.validateAndSubmitIfOk}
            icon={null}
          >
            {!editPrescriptionSetItem ? 'Add' : 'Save'}
          </ProgressButton>
        </div>
      </React.Fragment>
    )
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
      `prescriptionSetItemInstruction[${index}].usageMethodFK`,
      op.medicationUsage ? op.medicationUsage.id : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].usageMethodCode`,
      op.medicationUsage ? op.medicationUsage.code : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].usageMethodDisplayValue`,
      op.medicationUsage ? op.medicationUsage.name : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].dosageFK`,
      op.prescribingDosage ? op.prescribingDosage.id : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].dosageCode`,
      op.prescribingDosage ? op.prescribingDosage.code : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].dosageDisplayValue`,
      op.prescribingDosage ? op.prescribingDosage.name : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].prescribeUOMFK`,
      op.prescribingUOM ? op.prescribingUOM.id : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].prescribeUOMCode`,
      op.prescribingUOM ? op.prescribingUOM.code : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].prescribeUOMDisplayValue`,
      op.prescribingUOM ? op.prescribingUOM.name : undefined,
    )

    setFieldValue(
      `prescriptionSetItemInstruction[${index}].drugFrequencyFK`,
      op.medicationFrequency ? op.medicationFrequency.id : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].drugFrequencyCode`,
      op.medicationFrequency ? op.medicationFrequency.code : undefined,
    )
    setFieldValue(
      `prescriptionSetItemInstruction[${index}].drugFrequencyDisplayValue`,
      op.medicationFrequency ? op.medicationFrequency.name : undefined,
    )
    if (op.duration)
      setFieldValue(
        `prescriptionSetItemInstruction[${index}].duration`,
        op.duration,
      )
  }

  handleAddStepdose = (arrayHelpers, defaultValue, prop) => {
    const { values } = this.props
    arrayHelpers.push(defaultValue)
    if (prop === 'prescriptionSetItemInstruction') {
      this.setInstruction(values.prescriptionSetItemInstruction.length)

      setTimeout(() => {
        this.calculateQuantity()
      }, 1)
    }
  }

  getActionItem = (i, arrayHelpers, prop, tooltip, defaultValue) => {
    const { theme, values, setFieldValue } = this.props
    const activeRows = values[prop].filter(item => !item.isDeleted) || []
    return (
      <div style={{ position: 'absolute', bottom: 4, right: 0 }}>
        {activeRows.length > 1 && (
          <Button justIcon color='danger'>
            <Delete
              onClick={() => {
                setFieldValue(`${prop}[${i}].isDeleted`, true)
                if (prop === 'prescriptionSetItemInstruction') {
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

  calculateQuantity = medication => {
    const { codetable, setFieldValue, values } = this.props
    if (values.isDrugMixture) return
    let currentMedication = medication || values.selectedMedication

    const { form } = this.descriptionArrayHelpers
    let newTotalQuantity = 0

    const prescriptionItem = form.values.prescriptionSetItemInstruction.filter(
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

  handleDrugMixtureItemOnChange = e => {
    const { option, row } = e
    const { values, setFieldValue, codetable } = this.props
    const { drugName = '' } = values
    const activeDrugMixtureRows = (
      values.prescriptionSetItemDrugMixture || []
    ).filter(item => !item.isDeleted)
    const rs = values.prescriptionSetItemDrugMixture.filter(
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
      if (activeDrugMixtureRows[0].id === row.id) {
        const { inventorymedication = [] } = codetable
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

    row.quantity = 0
    row.uomfk = option.dispensingUOM.id
    row.uomCode = option.dispensingUOM.code
    row.uomDisplayValue = option.dispensingUOM.name
    row.prescribeUOMFK = option.prescribingUOM.id
    row.prescribeUOMCode = option.prescribingUOM.code
    row.prescribeUOMDisplayValue = option.prescribingUOM.name
    row.drugName = option.displayValue
    row.revenueCategoryFK = option.revenueCategoryFK
    row.inventoryDispenseUOMFK = option.dispensingUOM.id
    row.inventoryPrescribingUOMFK = option.prescribingUOM.id
    row.isActive = option.isActive
    row.orderable = option.orderable
  }

  commitDrugMixtureItemChanges = ({ rows, deleted, added, changed }) => {
    const { setFieldValue, values, codetable } = this.props
    let tempDrugMixtureRows = []

    if (deleted) {
      const tempArray = [...values.prescriptionSetItemDrugMixture]
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
      setFieldValue('prescriptionSetItemDrugMixture', newArray)
      const newCautions = [...values.cautions].filter(o => o.id !== deleted[0])
      setFieldValue('cautions', newCautions)

      if (!newArray.find(i => !i.isDeleted)) {
        this.changeMedication()
      }
    } else {
      let _rows = this.checkIsDrugMixtureItemUnique({ rows, changed })

      if (added) {
        _rows = [...values.prescriptionSetItemDrugMixture, rows[0]]
      }

      tempDrugMixtureRows = _rows
      setFieldValue('prescriptionSetItemDrugMixture', _rows)
    }

    let totalQuantity = 0
    const activeDrugMixtureRows = tempDrugMixtureRows.filter(
      item => !item.isDeleted,
    )

    activeDrugMixtureRows.forEach(item => {
      totalQuantity += item.quantity || 0
    })

    setFieldValue('quantity', totalQuantity)
  }

  drugMixtureTableParas = () => {
    return {
      columns: [
        { name: 'inventoryMedicationFK', title: 'Name' },
        { name: 'quantity', title: 'Quantity' },
        { name: 'uomfk', title: 'UOM' },
      ],
      columnExtensions: [
        {
          columnName: 'inventoryMedicationFK',
          type: 'localSearchSelect',
          labelField: 'combinDisplayValue',
          options: this.getMedicationOptions,
          handleFilter: () => true,
          width: 595,
          dropdownMatchSelectWidth: false,
          dropdownStyle: {
            width: 600,
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
            let newCautions = [...values.cautions]
            if (e.option) {
              this.handleDrugMixtureItemOnChange(e)

              const {
                codetable: { inventorymedication = [] },
              } = this.props
              const selectMedication = inventorymedication.find(
                medication => medication.id === e.row.inventoryMedicationFK,
              )
              if (
                selectMedication &&
                selectMedication.caution &&
                selectMedication.caution.trim().length
              ) {
                const existsCaution = newCautions.find(o => o.id === row.id)
                if (existsCaution) {
                  newCautions = newCautions.map(o => {
                    return {
                      ...o,
                      name: selectMedication.displayValue || '',
                      message:
                        o.id === row.id ? selectMedication.caution : o.message,
                    }
                  })
                } else {
                  newCautions = [
                    ...newCautions,
                    {
                      id: row.id,
                      name: selectMedication.displayValue || '',
                      message: selectMedication.caution,
                    },
                  ]
                }
              } else {
                newCautions = newCautions.filter(o => o.id !== row.id)
              }
            } else {
              newCautions = newCautions.filter(o => o.id !== row.id)
              row.quantity = undefined
              row.uomfk = null
              row.uomCode = undefined
              row.uomDisplayValue = undefined
              row.prescribeUOMFK = null
              row.prescribeUOMCode = undefined
              row.prescribeUOMDisplayValue = undefined
              row.costPrice = undefined
              row.unitPrice = undefined
              row.totalPrice = undefined
              row.drugCode = undefined
              row.drugName = undefined
              row.revenueCategoryFK = undefined
              row.isDispensedByPharmacy = undefined
              row.isNurseActualizeRequired = undefined
              const activeDrugMixtureRows = (
                values.prescriptionSetItemDrugMixture || []
              ).filter(item => !item.isDeleted)
              if (activeDrugMixtureRows[0].id === row.id) {
                this.changeMedication()
              }
            }

            setFieldValue('cautions', newCautions)
          },
          matchSearch: this.matchSearch,
        },
        {
          columnName: 'quantity',
          width: 100,
          type: 'number',
          format: '0.0',
          sortingEnabled: false,
          isDisabled: row => row.inventoryMedicationFK === undefined,
        },
        {
          columnName: 'uomfk',
          type: 'codeSelect',
          code: 'ctMedicationUnitOfMeasurement',
          labelField: 'displayValue',
          sortingEnabled: false,
          disabled: true,
        },
      ],
    }
  }

  validateAndSubmitIfOk = async () => {
    const { handleSubmit, validateForm, values, codetable } = this.props
    const validateResult = await validateForm()
    const isFormValid = _.isEmpty(validateResult)
    if (isFormValid) {
      const { isDrugMixture, prescriptionSetItemDrugMixture = [] } = values

      let drugMixtureItems
      if (isDrugMixture) {
        const { inventorymedication = [] } = codetable
        drugMixtureItems = prescriptionSetItemDrugMixture
          .filter(o => !o.isDeleted)
          .map(m => {
            let drug =
              inventorymedication.find(f => f.id === m.inventoryMedicationFK) ||
              {}
            return { ...m, subject: m.drugName, caution: drug.caution }
          })
        if (drugMixtureItems.length < 2) {
          notification.warn({
            message: 'At least two medications are required',
          })
          return false
        }
      }
      handleSubmit()
      return true
    }
    handleSubmit()
    return false
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
      footer,
      setFieldValue,
      setDisable,
      from,
    } = this.props

    const {
      isDrugMixture,
      prescriptionSetItemDrugMixture = [],
      isEditMedication,
      cautions = [],
      drugName,
      remarks,
    } = values

    const commonSelectProps = {
      handleFilter: this.filterOptions,
      dropdownMatchSelectWidth: false,
      dropdownStyle: {
        width: 300,
      },
    }
    return (
      <React.Fragment>
        <GridContainer>
          {!isDrugMixture && (
            <GridItem xs={6}>
              <Field
                name='inventoryMedicationFK'
                render={args => {
                  return (
                    <div style={{ position: 'relative' }}>
                      <LocalSearchSelect
                        {...args}
                        label='Medication Name, Drug Group'
                        labelField='combinDisplayValue'
                        onChange={this.changeMedication}
                        options={this.getMedicationOptions()}
                        handleFilter={() => true}
                        dropdownMatchSelectWidth={false}
                        dropdownClassName='ant-select-dropdown-bottom-bordered'
                        dropdownStyle={{
                          width: 600,
                        }}
                        renderDropdown={this.renderMedication}
                        style={{ paddingRight: 20 }}
                        showOptionTitle={false}
                        matchSearch={this.matchSearch}
                      />
                      <LowStockInfo
                        sourceType='prescriptionSet'
                        {...this.props}
                      />
                    </div>
                  )
                }}
              />
            </GridItem>
          )}
          {isDrugMixture && (
            <GridItem xs={6} style={{ paddingRight: 115 }}>
              <div style={{ position: 'relative' }}>
                <FastField
                  name='drugName'
                  render={args => {
                    return (
                      <TextField
                        label='Drug Mixture'
                        {...args}
                        autocomplete='off'
                        maxLength={70}
                      />
                    )
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: -115,
                    top: 26,
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
                    {`Characters left: ${70 - (values.drugName || '').length}`}
                  </span>
                </div>
              </div>
            </GridItem>
          )}
          <GridItem xs={6} style={{ marginTop: theme.spacing(2) }}>
            <Field
              name='isDrugMixture'
              render={args => {
                return (
                  <Checkbox
                    label='Drug Mixture'
                    disabled={values.isEditMedication}
                    {...args}
                    onChange={e => {
                      const {
                        setValues,
                        prescriptionSet,
                        setFieldValue,
                      } = this.props
                      setValues({
                        ...prescriptionSet.defaultPrescriptionSetItem,
                        isDrugMixture: e.target.value,
                        selectedMedication: {},
                      })

                      if (!e.target.value) {
                        setFieldValue('drugName', undefined)
                      }

                      setFieldValue('cautions', [])
                    }}
                  />
                )
              }}
            />
          </GridItem>
          {isDrugMixture && (
            <GridItem xs={12}>
              <EditableTableGrid
                forceRender
                style={{
                  marginTop: theme.spacing(1),
                  marginBottom: theme.spacing(1),
                }}
                getRowId={r => r.id}
                rows={prescriptionSetItemDrugMixture}
                FuncProps={{
                  pager: false,
                }}
                EditingProps={{
                  showAddCommand: true,
                  onCommitChanges: this.commitDrugMixtureItemChanges,
                }}
                schema={drugMixtureItemSchema}
                {...this.drugMixtureTableParas()}
              />
            </GridItem>
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
                  {cautions.length > 0 && (
                    <Alert
                      message={
                        <Tooltip
                          useTooltip2
                          title={
                            <div>
                              <div style={{ fontWeight: 500 }}>Cautions:</div>
                              {cautions.map(o => {
                                if (isDrugMixture) {
                                  return (
                                    <div style={{ marginLeft: 10 }}>
                                      <span>
                                        <span
                                          style={{
                                            fontWeight: 500,
                                          }}
                                        >
                                          {`${o.name} - `}
                                        </span>
                                        <span>{o.message}</span>
                                      </span>
                                    </div>
                                  )
                                }
                                return (
                                  <div style={{ marginLeft: 10 }}>
                                    <span>{o.message}</span>
                                  </div>
                                )
                              })}
                            </div>
                          }
                        >
                          <span>
                            {[...cautions].reverse().map((o, index) => {
                              if (isDrugMixture) {
                                return (
                                  <span>
                                    <span
                                      style={{
                                        fontWeight: 500,
                                      }}
                                    >
                                      {`${o.name} - `}
                                    </span>
                                    <span>
                                      {`${o.message}${
                                        index < cautions.length - 1 ? '; ' : ''
                                      }`}
                                    </span>
                                  </span>
                                )
                              }
                              return <span>{o.message}</span>
                            })}
                          </span>
                        </Tooltip>
                      }
                      banner
                      style={{
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        overflow: 'hidden',
                        paddingTop: 3,
                        paddingBottom: 3,
                        lineHeight: '25px',
                        fontSize: '0.85rem',
                      }}
                    />
                  )}
                </div>
                {true && (
                  <FieldArray
                    name='prescriptionSetItemInstruction'
                    render={arrayHelpers => {
                      this.descriptionArrayHelpers = arrayHelpers

                      if (!values || !values.prescriptionSetItemInstruction)
                        return null
                      const activeRows = values.prescriptionSetItemInstruction.filter(
                        val => !val.isDeleted,
                      )
                      return activeRows.map((val, activeIndex) => {
                        if (val && val.isDeleted) return null
                        const i = values.prescriptionSetItemInstruction.findIndex(
                          cor =>
                            val.id ? cor.id === val.id : val.uid === cor.uid,
                        )

                        return (
                          <div key={i}>
                            <GridContainer>
                              {activeIndex > 0 && (
                                <GridItem xs={3}>
                                  <FastField
                                    name={`prescriptionSetItemInstruction[${i}].stepdose`}
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
                                            { value: 'AND', name: 'And' },
                                            { value: 'THEN', name: 'Then' },
                                          ]}
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
                                  name={`prescriptionSetItemInstruction[${i}].usageMethodFK`}
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
                                            id:
                                              'inventory.master.setting.usage',
                                          })}
                                          style={{
                                            marginLeft: 15,
                                            paddingRight: 15,
                                          }}
                                          labelField='displayValue'
                                          code='ctMedicationUsage'
                                          onChange={(v, op = {}) => {
                                            setFieldValue(
                                              `prescriptionSetItemInstruction[${i}].usageMethodCode`,
                                              op ? op.code : undefined,
                                            )
                                            setFieldValue(
                                              `prescriptionSetItemInstruction[${i}].usageMethodDisplayValue`,
                                              op ? op.displayValue : undefined,
                                            )
                                          }}
                                          {...commonSelectProps}
                                          {...args}
                                        />
                                      </div>
                                    )
                                  }}
                                />
                              </GridItem>
                              <GridItem xs={2}>
                                <FastField
                                  name={`prescriptionSetItemInstruction[${i}].dosageFK`}
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
                                            `prescriptionSetItemInstruction[${i}].dosageCode`,
                                            op ? op.code : undefined,
                                          )
                                          setFieldValue(
                                            `prescriptionSetItemInstruction[${i}].dosageDisplayValue`,
                                            op ? op.displayValue : undefined,
                                          )
                                          setTimeout(() => {
                                            this.calculateQuantity()
                                          }, 1)
                                        }}
                                      />
                                    )
                                  }}
                                />
                              </GridItem>
                              <GridItem xs={2}>
                                <Field
                                  name={`prescriptionSetItemInstruction[${i}].prescribeUOMFK`}
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
                                            `prescriptionSetItemInstruction[${i}].prescribeUOMCode`,
                                            op ? op.code : undefined,
                                          )
                                          setFieldValue(
                                            `prescriptionSetItemInstruction[${i}].prescribeUOMDisplayValue`,
                                            op ? op.displayValue : undefined,
                                          )
                                        }}
                                        disabled
                                        {...commonSelectProps}
                                        {...args}
                                      />
                                    )
                                  }}
                                />
                              </GridItem>
                              <GridItem xs={2}>
                                <FastField
                                  name={`prescriptionSetItemInstruction[${i}].drugFrequencyFK`}
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
                                            `prescriptionSetItemInstruction[${i}].drugFrequencyCode`,
                                            op ? op.code : undefined,
                                          )
                                          setFieldValue(
                                            `prescriptionSetItemInstruction[${i}].drugFrequencyDisplayValue`,
                                            op ? op.displayValue : undefined,
                                          )
                                          setTimeout(() => {
                                            this.calculateQuantity()
                                          }, 1)
                                        }}
                                      />
                                    )
                                  }}
                                />
                              </GridItem>
                              <GridItem xs={3}>
                                <div style={{ position: 'relative' }}>
                                  <FastField
                                    name={`prescriptionSetItemInstruction[${i}].duration`}
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
                                        />
                                      )
                                    }}
                                  />
                                  {this.getActionItem(
                                    i,
                                    arrayHelpers,
                                    'prescriptionSetItemInstruction',
                                    'Add step dose',
                                    {
                                      stepdose: 'AND',
                                      sequence: activeRows.length + 1,
                                      uid: getUniqueId(),
                                    },
                                  )}
                                </div>
                              </GridItem>
                            </GridContainer>
                          </div>
                        )
                      })
                    }}
                  />
                )}
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
                  name='prescriptionSetItemPrecaution'
                  render={arrayHelpers => {
                    if (!values || !values.prescriptionSetItemPrecaution)
                      return null
                    const activeRows = values.prescriptionSetItemPrecaution.filter(
                      val => !val.isDeleted,
                    )

                    const maxSeq = _.maxBy(
                      values.prescriptionSetItemPrecaution,
                      'sequence',
                    )

                    let newMaxSeq = maxSeq
                      ? maxSeq.sequence + 1
                      : values.prescriptionSetItemPrecaution.length + 1

                    return activeRows.map((val, activeIndex) => {
                      if (val && val.isDeleted) return null
                      const i = values.prescriptionSetItemPrecaution.findIndex(
                        cor =>
                          val.id ? cor.id === val.id : val.uid === cor.uid,
                      )

                      return (
                        <div key={i}>
                          <GridContainer>
                            <GridItem xs={12}>
                              <Field
                                name={`prescriptionSetItemPrecaution[${i}].medicationPrecautionFK`}
                                render={args => {
                                  return (
                                    <div
                                      style={{
                                        position: 'relative',
                                      }}
                                    >
                                      <span
                                        style={{
                                          position: 'absolute',
                                          top: 10,
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
                                            `prescriptionSetItemPrecaution[${i}].precaution`,
                                            option.displayValue,
                                          )
                                          setFieldValue(
                                            `prescriptionSetItemPrecaution[${i}].precautionCode`,
                                            option.code,
                                          )
                                        }}
                                        {...args}
                                      />
                                      {this.getActionItem(
                                        i,
                                        arrayHelpers,
                                        'prescriptionSetItemPrecaution',
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

          <GridItem
            xs={8}
            className={classes.editor}
            style={{ paddingRight: 35 }}
          >
            <div style={{ position: 'relative' }}>
              <FastField
                name='remarks'
                render={args => {
                  return <TextField rowsMax='5' label='Remarks' {...args} />
                }}
              />
              <CannedTextButton
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

          <GridItem xs={2} className={classes.editor}>
            <Field
              name='quantity'
              render={args => {
                return (
                  <NumberInput label='Quantity' step={1} min={0} {...args} />
                )
              }}
            />
          </GridItem>
          <GridItem xs={2} className={classes.editor}>
            <Field
              name='dispenseUOMFK'
              render={args => {
                return (
                  <CodeSelect
                    disabled
                    label='Dispense UOM'
                    allowClear={false}
                    code='ctMedicationUnitOfMeasurement'
                    labelField='displayValue'
                    onChange={(v, op = {}) => {
                      setFieldValue('dispenseUOMCode', op ? op.code : undefined)
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

          <GridItem xs={8} className={classes.editor}>
            {!values.isDrugMixture ? (
              <FastField
                name='isExternalPrescription'
                render={args => {
                  return <Checkbox label='External Prescription' {...args} />
                }}
              />
            ) : (
              ''
            )}
          </GridItem>

          <GridItem xs={12}>{this.footerBtns()}</GridItem>
        </GridContainer>
      </React.Fragment>
    )
  }
}
export default Detail
