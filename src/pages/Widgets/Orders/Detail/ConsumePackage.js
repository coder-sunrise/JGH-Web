import React, { Component } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import moment from 'moment'
import {
  CardContainer,
  EditableTableGrid,
  withFormikExtend,
  serverDateTimeFormatFull,
  NumberInput,
} from '@/components'
import Yup from '@/utils/yup'
import { DoctorProfileSelect, DoctorLabel } from '@/components/_medisys'
import { isMatchInstructionRule } from '@/pages/Widgets/Orders/utils'

const getNextSequence = (props) => {
  const { orders: { rows } } = props

  const allDocs = rows.filter((s) => !s.isDeleted)
  let nextSequence = 1
  if (allDocs && allDocs.length > 0) {
    const { sequence } = _.maxBy(allDocs, 'sequence')
    nextSequence = sequence + 1
  }
  return nextSequence
}

const getType = (typeId) => {
  let type = ''
  switch (typeId) {
    case 1:
      type = '1'
      break
    case 2:
      type = '4'
      break
    case 3:
      type = '2'
      break
    case 4:
      type = '3'
      break
    default:
      break
  }

  return type
}

@connect(({ codetable, visitRegistration, patient }) => ({
  codetable,
  visitRegistration,
  patient
}))
@withFormikExtend({
  mapPropsToValues: ({ consultation }) => consultation.entity,
  handleSubmit: (values, { props }) => {
    const { dispatch, onConfirm, user, codetable, visitRegistration, patient } = props
    const { pendingPackage } = values
    const {
      inventorymedication = [],
      inventoryvaccination = [],
      inventoryconsumable = [],
      ctservice = []
    } = codetable
    const { weightKG } = visitRegistration.entity.visit
    const { dob } = patient.entity
    let datas = []
    const updateRows = () => {
      dispatch({
        type: 'orders/upsertRows',
        payload: datas,
      }).then(() => {
        if (onConfirm) onConfirm()
      })
    }

    const getInstruction = (medication, matchInstruction) => {
      let instruction = ''
      const usageMethod = medication.medicationUsage
      instruction += `${usageMethod ? usageMethod.name : ''} `
      const dosage = matchInstruction?.prescribingDosage
      instruction += `${dosage ? dosage.name : ''} `
      const prescribe = medication.prescribingUOM
      instruction += `${prescribe ? prescribe.name : ''} `
      const drugFrequency = matchInstruction?.medicationFrequency
      instruction += `${drugFrequency ? drugFrequency.name : ''}`
      const itemDuration = matchInstruction?.duration
        ? ` For ${matchInstruction.duration} day(s)`
        : ''
      instruction += itemDuration
      return instruction
    }

    const getMedicationFromPackage = (packageItem) => {
      const medication = inventorymedication.find(
        (item) =>
          item.id === packageItem.inventoryMedicationFK,
      )
      const { medicationInstructionRule = [] } = medication
      let age
      if (dob) {
        age = Math.floor(moment.duration(moment().diff(dob)).asYears())
      }
      var matchInstruction = medicationInstructionRule.find(i => isMatchInstructionRule(i, age, weightKG))

      let item
      if (medication.isActive === true) {
        const medicationdispensingUOM = medication.dispensingUOM
        const medicationusage = medication.medicationUsage
        const medicationfrequency = matchInstruction?.medicationFrequency
        const medicationdosage = matchInstruction?.medicationFrequency
        const medicationprescribingUOM = medication.prescribingUOM
        const medicationPrecautions =
          medication.inventoryMedication_MedicationPrecaution
        const isDefaultBatchNo = medication.medicationStock.find(
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
          isActive: medication.isActive,
          inventoryMedicationFK: medication.id,
          drugCode: medication.code,
          drugName: medication.displayValue,
          quantity: 0,
          costPrice: medication.averageCostPrice,
          unitPrice: packageItem.unitPrice,
          totalPrice: 0,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          isClaimable: true,
          totalAfterItemAdjustment: 0,
          totalAfterOverallAdjustment: 0,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isExternalPrescription: false,
          instruction: getInstruction(medication, matchInstruction),
          dispenseUOMFK: medication.dispensingUOM.id,
          dispenseUOMCode: medicationdispensingUOM
            ? medicationdispensingUOM.code
            : undefined,
          dispenseUOMDisplayValue: medicationdispensingUOM
            ? medicationdispensingUOM.name
            : undefined,
          corPrescriptionItemPrecaution: currentMedicationPrecautions,
          corPrescriptionItemInstruction: [
            {
              usageMethodFK: medication.medicationUsage.id,
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
              prescribeUOMFK: medication.prescribingUOM.id,
              prescribeUOMCode: medicationprescribingUOM
                ? medicationprescribingUOM.code
                : undefined,
              prescribeUOMDisplayValue: medicationprescribingUOM
                ? medicationprescribingUOM.name
                : undefined,
              drugFrequencyFK: medication.medicationFrequency.id,
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
          packageCode: packageItem.packageCode,
          packageName: packageItem.packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.remainingQuantity,
          performingUserFK: packageItem.performingUserFK,
          packageGlobalId: packageItem.packageGlobalId,
          isDispensedByPharmacy: medication.isDispensedByPharmacy,
          isNurseActualizeRequired: medication.isNurseActualizable,
        }
      }
      return item
    }

    const getVaccinationFromPackage = (packageItem) => {
      const vaccination = inventoryvaccination.find(
        (item) =>
          item.id === packageItem.inventoryVaccinationFK,
      )

      let item
      if (vaccination.isActive === true) {
        const vaccinationUOM = vaccination.prescribingUOM
        const vaccinationusage = vaccination.vaccinationUsage
        const vaccinationdosage = vaccination.prescribingDosage
        const isDefaultBatchNo = vaccination.vaccinationStock.find(
          (o) => o.isDefault === true,
        )

        item = {
          isActive: vaccination.isActive,
          inventoryVaccinationFK: vaccination.id,
          vaccinationGivenDate: moment().format(serverDateTimeFormatFull),
          vaccinationCode: vaccination.code,
          vaccinationName: vaccination.displayValue,
          usageMethodFK: vaccination.vaccinationUsage.id,
          usageMethodCode: vaccinationusage ? vaccinationusage.code : undefined,
          usageMethodDisplayValue: vaccinationusage
            ? vaccinationusage.name
            : undefined,
          dosageFK: vaccination.prescribingDosage.id,
          dosageCode: vaccinationdosage ? vaccinationdosage.code : undefined,
          dosageDisplayValue: vaccinationdosage
            ? vaccinationdosage.name
            : undefined,
          uomfk: vaccination.prescribingUOM.id,
          uomCode: vaccinationUOM ? vaccinationUOM.code : undefined,
          uomDisplayValue: vaccinationUOM ? vaccinationUOM.name : undefined,
          quantity: 0,
          unitPrice: packageItem.unitPrice,
          totalPrice: 0,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment: 0,
          totalAfterOverallAdjustment: 0,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isPackage: true,
          packageCode: packageItem.packageCode,
          packageName: packageItem.packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.remainingQuantity,
          performingUserFK: packageItem.performingUserFK,
          packageGlobalId: packageItem.packageGlobalId,
          corVaccinationCert: [],
          isNurseActualizeRequired: vaccination.isNurseActualizable,
        }
      }
      return item
    }

    const getServiceCenterServiceFromPackage = (packageItem) => {      
      const service = ctservice.find(
        (item) => item.id === packageItem.serviceCenterServiceFK,
      )
      let item
      if (packageItem.isActive) {
        item = {
          isActive: packageItem.isActive,
          serviceCenterServiceFK: packageItem.serviceCenterServiceFK,
          quantity: 0,
          unitPrice: packageItem.unitPrice,
          total: 0,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment: 0,
          totalAfterOverallAdjustment: 0,
          serviceCode: packageItem.itemCode,
          serviceName: packageItem.itemName,
          serviceFK: packageItem.serviceFK,
          serviceCenterFK: packageItem.serviceCenterFK,
          isPackage: true,
          packageCode: packageItem.packageCode,
          packageName: packageItem.packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.remainingQuantity,
          performingUserFK: packageItem.performingUserFK,
          packageGlobalId: packageItem.packageGlobalId,
          isNurseActualizeRequired: service.isNurseActualizable,
          serviceCenterCategoryFK: service.serviceCenterCategoryFK
        }
      }
      return item
    }

    const getConsumableFromPackage = (packageItem) => {
      const consumable = inventoryconsumable.find(
        (item) =>
          item.id === packageItem.inventoryConsumableFK,
      )

      let item
      let isDefaultBatchNo
      if (consumable) {
        isDefaultBatchNo = consumable.consumableStock.find(
          (o) => o.isDefault === true,
        )
      }

      if (packageItem.isActive) {
        item = {
          inventoryConsumableFK: packageItem.inventoryConsumableFK,
          isActive: packageItem.isActive,
          quantity: 0,
          unitPrice: packageItem.unitPrice,
          totalPrice: 0,
          adjAmount: 0,
          adjType: 'ExactAmount',
          adjValue: 0,
          totalAfterItemAdjustment: 0,
          totalAfterOverallAdjustment: 0,
          consumableCode: packageItem.itemCode,
          consumableName: packageItem.itemName,
          expiryDate: isDefaultBatchNo
            ? isDefaultBatchNo.expiryDate
            : undefined,
          batchNo: isDefaultBatchNo ? isDefaultBatchNo.batchNo : undefined,
          isPackage: true,
          packageCode: packageItem.packageCode,
          packageName: packageItem.packageName,
          defaultConsumeQuantity: packageItem.defaultConsumeQuantity,
          packageConsumeQuantity: packageItem.consumeQuantity,
          remainingQuantity: packageItem.remainingQuantity,
          performingUserFK: packageItem.performingUserFK,
          packageGlobalId: packageItem.packageGlobalId,
          isDispensedByPharmacy: consumable.isDispensedByPharmacy,
          isNurseActualizeRequired: consumable.isNurseActualizable,
        }
      }

      return item
    }

    const getItemFromPackage = (packageItem) => {
      let item
      if (packageItem.invoiceItemTypeFK === 1) {
        item = getMedicationFromPackage(packageItem)
      }
      if (packageItem.invoiceItemTypeFK === 2) {
        item = getConsumableFromPackage(packageItem)
      }
      if (packageItem.invoiceItemTypeFK === 3) {
        item = getVaccinationFromPackage(packageItem)
      }
      if (packageItem.invoiceItemTypeFK === 4) {
        item = getServiceCenterServiceFromPackage(packageItem)
      }

      return item
    }

    if (pendingPackage) {
      const consumeItems = pendingPackage.filter(p => p.consumeQuantity > 0 && p.isActive)
      let nextSequence = getNextSequence(props)
      for (let index = 0; index < consumeItems.length; index++) {
        const newOrder = getItemFromPackage(consumeItems[index])
        if (newOrder) {
          let type = pendingPackage[index].type
          if (pendingPackage[index].type === '3') {
            if (newOrder.serviceCenterCategoryFK === 3) { type = '9' }
            else if (newOrder.serviceCenterCategoryFK === 4) { type = '10' }
          }
          const data = {
            isOrderedByDoctor:
              user.data.clinicianProfile.userProfile.role.clinicRoleFK === 1,
            sequence: nextSequence,
            ...newOrder,
            subject: consumeItems[index].itemName,
            isDeleted: false,
            type,
            packageDrawdown: consumeItems[index].packageDrawdown,
            packageDrawdownAsAtDate: consumeItems[index].packageDrawdownAsAtDate,
            packageDrawdownFK: consumeItems[index].id,
          }
          datas.push(data)
          nextSequence += 1
        }
      }
    }

    updateRows()
  },
  displayName: 'ConsumePackage',
})

class ConsumePackage extends Component {
  gridColumnExtensions = [
    {
      columnName: 'itemCode',
      width: 160,
      type: 'text',
      sortingEnabled: false,
      disabled: true,
    },
    {
      columnName: 'itemName',
      sortingEnabled: false,
      disabled: true,
      render: (row) => {
        let texts = []

        texts = [
          row.itemName,
          row.isActive ? '' : '(Inactive)',
        ].join(' ')

        return (
          <div>
            {texts}
          </div>
        )
      },
    },
    {
      columnName: 'unitPrice',
      width: 100,
      type: 'number',
      currency: true,
      sortingEnabled: false,
      disabled: true,
    },
    {
      columnName: 'consumeQuantity',
      width: 140,
      sortingEnabled: false,
      type: 'number',
      format: '0.0',
      isDisabled: (row) => row.isActive !== true,
    },
    {
      columnName: 'remainingQuantity',
      width: 140,
      type: 'number',
      format: '0.0',
      sortingEnabled: false,
      disabled: true,
    },
    {
      columnName: 'performingUserFK',
      width: 150,
      sortingEnabled: false,
      type: 'codeSelect',
      code: 'doctorprofile',
      labelField: 'clinicianProfile.name',
      valueField: 'clinicianProfile.userProfileFK',
      remoteFilter: {
        'clinicianProfile.isActive': true,
      },
      renderDropdown: (option) => <DoctorLabel doctor={option} />,
      onChange: ({ option, row }) => {
        const { pendingPackage } = this.props.values
        const changedRow = pendingPackage.find(p => p.id === row.id)
        if (changedRow) {
          changedRow.performingUserFK = row.performingUserFK
        }
      },
    },
  ]

  constructor (props) {
    super(props)
    const { dispatch } = props
    const codeTableNameArray = [
      'ctmedicationfrequency',
      'ctmedicationdosage',
    ]
    dispatch({
      type: 'codetable/batchFetch',
      payload: {
        codes: codeTableNameArray,
      },
    })

    const newColumnExtensions = this.gridColumnExtensions.map((column) => {
      if (column.columnName === 'consumeQuantity') {
        return {
          ...column,
          render: (row) => {
            return (
              <NumberInput
                value={row.consumeQuantity}
                format='0.0'
                text={row.isActive !== true}
              />
            )
          },
        }
      }
      if (column.columnName === 'performingUserFK') {
        return {
          ...column,
          render: (row) => {
            return (
              <DoctorProfileSelect
                label=''
                value={row.performingUserFK}
                valueField='clinicianProfile.userProfileFK'
                disabled={row.isActive !== true}
              />
            )
          },
        }
      }

      return { ...column }
    })

    this.newColumnExtensions = [
      ...newColumnExtensions,
    ]
  }

  state = {
    expandedGroups: [],
  }

  componentDidMount = () => {
    const { values } = this.props
    this.expandAllPackages(values)
  }

  expandAllPackages = (values) => {
    if (values.pendingPackage) {
      const groups = values.pendingPackage.reduce(
        (distinct, data) =>
          distinct.includes(data.patientPackageFK.toString())
            ? [
              ...distinct,
            ]
            : [
              ...distinct,
              data.patientPackageFK.toString(),
            ],
        [],
      )

      this.setState({
        expandedGroups: groups,
      })
    }
  }

  render () {
    const { footer, values, setFieldValue, theme } = this.props
    const { pendingPackage } = values

    const pendingPackageSchema = Yup.object().shape({
      consumeQuantity: Yup.number().required()
        .min(0, 'Consumed quantity must be greater than or equal to 0')
        .max(Yup.ref('remainingQuantity'), 'Consumed quantity cannot exceed Remaining Quantity'),
      performingUserFK: Yup.number().required(),
    })

    const tableProps = {
      columns: [
        { name: 'itemCode', title: 'Code' },
        { name: 'itemName', title: 'Name' },
        { name: 'unitPrice', title: 'Unit Price' },
        { name: 'consumeQuantity', title: 'Consume Quantity' },
        { name: 'remainingQuantity', title: 'Remaining Quantity' },
        { name: 'performingUserFK', title: 'Performed By' },
        { name: 'patientPackageFK', title: '' },
      ],
      columnExtensions: this.newColumnExtensions,
    }

    const handleCommitChanges = ({ rows }) => {
      setFieldValue('pendingPackage', rows)
    }

    const handleExpandedGroupsChange = (e) => {
      this.setState({
        expandedGroups: e,
      })
    }

    const packageGroupCellContent = ({ row }) => {
      if (row.value === undefined || row.value === '')
        return null

      let label = 'Package'
      let expiryDateLabel = '-'
      if (!pendingPackage) return ''
      const data = pendingPackage.filter(
        (item) => item.patientPackageFK === row.value,
      )
      if (data.length > 0) {
        label = `${data[0].packageCode} - ${data[0].packageName} (Total: `
        expiryDateLabel = `Exp. Date: ${data[0].expiryDate ? moment(data[0].expiryDate).format('DD MMM YYYY') : '-'}`
      }
      return (
        <span style={{ verticalAlign: 'middle' }}>
          <strong>
            {label}
            <NumberInput text currency value={data[0].packageTotalPrice} />
            )
          </strong>
          <span style={{ marginLeft: theme.spacing(5) }}>
            {expiryDateLabel}
          </span>
        </span>
      )
    }

    return (
      <CardContainer hideHeader>
        <div>
          <EditableTableGrid
            size='sm'
            forceRender
            rows={pendingPackage}
            {...tableProps}
            schema={pendingPackageSchema}
            EditingProps={{
              showCommandColumn: false,
              onCommitChanges: handleCommitChanges,
            }}
            FuncProps={{
              pager: false,
              grouping: true,
              groupingConfig: {
                state: {
                  grouping: [
                    { columnName: 'patientPackageFK' },
                  ],
                  expandedGroups: [
                    ...this.state.expandedGroups,
                  ],
                  onExpandedGroupsChange: handleExpandedGroupsChange,
                },
                row: {
                  contentComponent: packageGroupCellContent,
                },
              },
            }}
          />
        </div>
        {footer && footer({
          onConfirm: this.props.handleSubmit,
          confirmBtnText: 'Confirm',
        })}
      </CardContainer>
    )
  }
}

export default ConsumePackage