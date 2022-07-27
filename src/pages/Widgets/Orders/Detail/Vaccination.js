import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import _ from 'lodash'
import Add from '@material-ui/icons/Add'
import { isNumber } from 'util'
import { Alert } from 'antd'
import {
  GridContainer,
  GridItem,
  TextField,
  CodeSelect,
  DatePicker,
  NumberInput,
  FastField,
  Field,
  withFormikExtend,
  CommonModal,
  ProgressButton,
  Tooltip,
  Switch,
  Checkbox,
  notification,
  LocalSearchSelect,
} from '@/components'
import Authorized from '@/utils/Authorized'
import Yup from '@/utils/yup'
import { calculateAdjustAmount } from '@/utils/utils'
import { NURSE_WORKITEM_STATUS } from '@/utils/constants'
import { currencySymbol } from '@/utils/config'
import {
  GetOrderItemAccessRight,
  ReplaceCertificateTeplate,
} from '@/pages/Widgets/Orders/utils'
import LowStockInfo from './LowStockInfo'
import AddFromPast from './AddMedicationFromPast'
import { getClinicianProfile } from '../../ConsultationDocument/utils'
import { DoctorProfileSelect } from '@/components/_medisys'

let i = 0
@connect(
  ({
    global,
    codetable,
    visitRegistration,
    user,
    patient,
    consultationDocument,
  }) => ({
    global,
    codetable,
    visitRegistration,
    user,
    patient,
    consultationDocument,
  }),
)
@withFormikExtend({
  mapPropsToValues: ({ orders = {}, type, codetable, visitRegistration }) => {
    const newOrders = orders.entity || orders.defaultVaccination

    if (newOrders.uid) {
      if (newOrders.adjAmount <= 0) {
        newOrders.adjValue = Math.abs(newOrders.adjValue)
        newOrders.isMinus = true
      } else {
        newOrders.isMinus = false
      }

      newOrders.isExactAmount = newOrders.adjType !== 'Percentage'
    }

    if (_.isEmpty(orders.entity)) {
      const { doctorprofile } = codetable
      if (visitRegistration && visitRegistration.entity) {
        const { doctorProfileFK } = visitRegistration.entity.visit
        if (doctorprofile && doctorProfileFK) {
          newOrders.performingUserFK = doctorprofile.find(
            d => d.id === doctorProfileFK,
          ).clinicianProfile.userProfileFK
        }
      }
    }

    return {
      minQuantity: 1,
      ...newOrders,
      type,
      isEditVaccination: !_.isEmpty(orders.entity),
      editingVaccinationFK: orders.entity
        ? orders.entity.inventoryVaccinationFK
        : undefined,
    }
  },

  enableReinitialize: true,

  validationSchema: Yup.object().shape({
    inventoryVaccinationFK: Yup.number().required(),
    totalPrice: Yup.number().required(),
    vaccinationGivenDate: Yup.date().required(),
    quantity: Yup.number().required(),
    uomfk: Yup.number().required(),
    dispenseUOMFK: Yup.number().required(),
    totalAfterItemAdjustment: Yup.number().min(
      0.0,
      'The amount should be more than 0.00',
    ),
    performingUserFK: Yup.number().required(),
    expiryDate: Yup.date().min(moment(), 'EXPIRED!'),
  }),

  handleSubmit: (values, { props, onConfirm, setValues }) => {
    const {
      dispatch,
      orders,
      currentType,
      getNextSequence,
      user,
      codetable,
      patient,
      visitRegistration,
      clinicSettings,
      consultationDocument: { rows = [] },
    } = props
    const {
      inventoryvaccination = [],
      ctvaccinationusage = [],
      ctmedicationdosage = [],
      ctvaccinationunitofmeasurement = [],
    } = codetable
    let { batchNo } = values
    if (batchNo instanceof Array) {
      if (batchNo && batchNo.length > 0) {
        batchNo = batchNo[0]
      }
    }

    // create certificate when create vaccination that auto generate certificate checked
    const { isGenerateCertificate, corVaccinationCert = [] } = values

    let newCORVaccinationCert = corVaccinationCert
    if (isGenerateCertificate) {
      const { documenttemplate = [] } = codetable
      if (corVaccinationCert.find(vc => !vc.isDeleted)) {
        notification.warning({
          message:
            'Any changes will not be reflected in the vaccination certificate.',
        })
      } else {
        const defaultTemplate = documenttemplate.find(
          dt =>
            dt.isDefaultTemplate === true && dt.documentTemplateTypeFK === 3,
        )
        if (!defaultTemplate) {
          notification.warning({
            message:
              'No template found. Select a template in Document Template.',
          })
        } else {
          const { entity: visitEntity } = visitRegistration
          const clinicianProfile = getClinicianProfile(codetable, visitEntity)
          const { entity } = patient
          const { name, patientAccountNo, genderFK, dob } = entity
          const { ctgender = [] } = codetable
          const gender = ctgender.find(o => o.id === genderFK) || {}
          const allDocs = rows.filter(s => !s.isDeleted)
          let nextSequence = 1
          if (allDocs && allDocs.length > 0) {
            const { sequence } = _.maxBy(allDocs, 'sequence')
            nextSequence = sequence + 1
          }
          dispatch({
            type: 'settingDocumentTemplate/queryOne',
            payload: { id: defaultTemplate.id },
          }).then(r => {
            if (!r) {
              return
            }
            newCORVaccinationCert = [
              ...corVaccinationCert,
              {
                type: '3',
                certificateDate: moment(),
                issuedByUserFK: clinicianProfile.userProfileFK,
                subject: `Vaccination Certificate - ${name}, ${patientAccountNo}, ${gender.code ||
                  ''}, ${Math.floor(
                  moment.duration(moment().diff(dob)).asYears(),
                )}`,
                content: ReplaceCertificateTeplate(r.templateContent, {
                  ...values,
                  subject: currentType.getSubject(values),
                }),
                sequence: nextSequence,
              },
            ]
          })
        }
      }
    }

    const vaccination = inventoryvaccination.find(
      c => c.id === values.inventoryVaccinationFK,
    )
    values.vaccinationName = vaccination.displayValue

    const usage = ctvaccinationusage.find(c => c.id === values.usageMethodFK)
    const dosage = ctmedicationdosage.find(c => c.id === values.dosageFK)
    const uom = ctvaccinationunitofmeasurement.find(c => c.id === values.uomfk)
    const dispensingUOM = ctvaccinationunitofmeasurement.find(
      c => c.id === values.dispenseUOMFK,
    )

    values.usageMethodDisplayValue = usage?.name
    values.dosageDisplayValue = dosage?.displayValue
    values.uomDisplayValue = uom?.name
    values.dispenseUOMDisplayValue = dispensingUOM?.name

    const getInstruction = () => {
      let instruction = ''
      instruction += `${usage?.name || ''} ${dosage?.displayValue ||
        ''} ${uom?.name || ''}`
      return instruction
    }

    const instruction = getInstruction()

    values.instruction = instruction

    const data = {
      isOrderedByDoctor:
        user.data.clinicianProfile.userProfile.role.clinicRoleFK === 1,
      sequence: getNextSequence(),
      ...values,
      subject: currentType.getSubject(values),
      isDeleted: false,
      batchNo,
      adjValue:
        values.adjAmount < 0
          ? -Math.abs(values.adjValue)
          : Math.abs(values.adjValue),
      corVaccinationCert: newCORVaccinationCert,
      packageGlobalId:
        values.packageGlobalId !== undefined ? values.packageGlobalId : '',
    }
    dispatch({
      type: 'orders/upsertRow',
      payload: data,
    })

    if (onConfirm) onConfirm()
    setValues({
      ...orders.defaultVaccination,
      type: orders.type,
    })
  },
  displayName: 'OrderPage',
})
class Vaccination extends PureComponent {
  constructor(props) {
    super(props)

    const { codetable, values } = this.props
    const { inventoryvaccination = [] } = codetable
    const { inventoryVaccinationFK } = values

    let selectedVaccination = {
      vaccinationStock: [],
    }
    const vaccination = inventoryVaccinationFK
      ? inventoryvaccination.find(item => item.id === inventoryVaccinationFK)
      : undefined

    if (vaccination) selectedVaccination = vaccination

    this.state = {
      selectedVaccination,
      batchNo: '',
      expiryDate: '',
      showAddFromPastModal: false,
      isPreOrderItemExists: false,
    }
  }

  componentWillMount() {
    const { dispatch } = this.props
    const codeTableNameArray = [
      'inventoryvaccination',
      'ctMedicationDosage',
      'ctMedicationFrequency',
      'ctVaccinationUsage',
      'ctVaccinationUnitOfMeasurement',
      'documenttemplate',
    ]
    dispatch({
      type: 'codetable/batchFetch',
      payload: {
        codes: codeTableNameArray,
      },
    })
  }
  getVaccinationOptions = () => {
    const {
      codetable: { inventoryvaccination = [] },
    } = this.props
    return inventoryvaccination.reduce((p, c) => {
      const { code, displayValue, sellingPrice = 0, dispensingUOM = {} } = c
      const { name: uomName = '' } = dispensingUOM
      let opt = {
        ...c,
        combinDisplayValue: `${displayValue} - ${code} (${currencySymbol}${sellingPrice.toFixed(
          2,
        )} / ${uomName})`,
      }
      return [...p, opt]
    }, [])
  }

  changeVaccination = (v, op = {}) => {
    const { setFieldValue, values, disableEdit, codetable } = this.props
    const { instruction = [] } = values
    setFieldValue('isNurseActualizeRequired', op.isNurseActualizable)
    let defaultBatch
    if (op.vaccinationStock) {
      defaultBatch = op.vaccinationStock.find(o => o.isDefault === true)
      if (defaultBatch)
        this.setState({
          batchNo: defaultBatch.batchNo,
          expiryDate: defaultBatch.expiryDate,
        })
    }

    const { isPreOrderItemExists } = this.state

    this.setState({
      selectedVaccination: op,
    })

    setFieldValue('instruction', instruction)
    setFieldValue('isActive', op.isActive)
    setFieldValue(
      'dosageFK',
      op.prescribingDosage ? op.prescribingDosage.id : undefined,
    )
    setFieldValue(
      'dosageCode',
      op.prescribingDosage ? op.prescribingDosage.code : undefined,
    )
    setFieldValue(
      'dosageDisplayValue',
      op.prescribingDosage ? op.prescribingDosage.name : undefined,
    )
    setFieldValue('uomfk', op.prescribingUOM ? op.prescribingUOM.id : undefined)
    setFieldValue(
      'uomCode',
      op.prescribingUOM ? op.prescribingUOM.code : undefined,
    )
    setFieldValue(
      'uomDisplayValue',
      op.prescribingUOM ? op.prescribingUOM.name : undefined,
    )
    setFieldValue(
      'dispenseUOMFK',
      op.dispensingUOM ? op.dispensingUOM.id : undefined,
    )
    setFieldValue(
      'dispenseUOMCode',
      op.dispensingUOM ? op.dispensingUOM.code : undefined,
    )
    setFieldValue(
      'dispenseUOMDisplayValue',
      op.dispensingUOM ? op.dispensingUOM.name : undefined,
    )
    setFieldValue(
      'usageMethodFK',
      op.vaccinationUsage ? op.vaccinationUsage.id : undefined,
    )
    setFieldValue(
      'usageMethodCode',
      op.vaccinationUsage ? op.vaccinationUsage.code : undefined,
    )
    setFieldValue(
      'usageMethodDisplayValue',
      op.vaccinationUsage ? op.vaccinationUsage.name : undefined,
    )
    setFieldValue('vaccinationName', op.displayValue)
    setFieldValue('vaccinationCode', op.code)

    setFieldValue('isMinus', true)
    setFieldValue('isExactAmount', true)
    setFieldValue('adjValue', 0)

    // 17882
    let unitprice = op.sellingPrice || 0
    setFieldValue('unitPrice', unitprice)
    setFieldValue('totalPrice', unitprice * values.quantity)
    this.updateTotalPrice(unitprice * values.quantity)

    if (disableEdit === false) {
      setFieldValue('batchNo', defaultBatch ? defaultBatch.batchNo : undefined)
      setFieldValue(
        'expiryDate',
        defaultBatch ? defaultBatch.expiryDate : undefined,
      )
    }
    setFieldValue('isGenerateCertificate', op.isAutoGenerateCertificate)
    setTimeout(() => {
      this.calculateQuantity(op)
    }, 1)
    this.onExpiryDateChange()

    if (values.isPreOrder) this.props.setFieldValue('isPreOrder', false)
    if (isPreOrderItemExists) this.setState({ isPreOrderItemExists: false })
  }

  calculateQuantity = vaccination => {
    const { codetable, setFieldValue, values } = this.props
    if (values.isPackage) return
    const { minQuantity = 0 } = values
    let currentVaccination =
      vaccination && Object.values(vaccination).length ? vaccination : undefined
    if (!currentVaccination) currentVaccination = this.state.selectedVaccination
    let newTotalQuantity = 0
    if (
      vaccination &&
      currentVaccination &&
      currentVaccination.dispensingQuantity
    ) {
      newTotalQuantity = currentVaccination.dispensingQuantity
    } else {
      const { ctmedicationdosage } = codetable

      const dosage = ctmedicationdosage.find(
        o =>
          o.id ===
          (values.dosageFK ||
            (currentVaccination && currentVaccination.prescribingDosage
              ? currentVaccination.prescribingDosage.id
              : undefined)),
      )
      if (dosage) {
        newTotalQuantity = Math.ceil(dosage.multiplier)
      }
      const { prescriptionToDispenseConversion } = currentVaccination
      if (prescriptionToDispenseConversion)
        newTotalQuantity = Math.ceil(
          newTotalQuantity / prescriptionToDispenseConversion,
        )
    }
    newTotalQuantity =
      newTotalQuantity < minQuantity ? minQuantity : newTotalQuantity

    setFieldValue(`quantity`, newTotalQuantity)

    // 17882
    let unitprice = currentVaccination.sellingPrice || 0
    setFieldValue('unitPrice', unitprice)
    setFieldValue('totalPrice', unitprice * newTotalQuantity)
    this.updateTotalPrice(unitprice * newTotalQuantity)
  }

  updateTotalPrice = v => {
    if (v || v === 0) {
      const { isExactAmount, isMinus, adjValue, isPackage } = this.props.values
      if (isPackage) return

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
    } else {
      this.props.setFieldValue('totalAfterItemAdjustment', undefined)
      this.props.setFieldValue('adjAmount', undefined)
    }
  }

  handleReset = () => {
    const { setValues, orders } = this.props
    setValues({
      ...orders.defaultVaccination,
      type: orders.type,
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

    const { values: nextValues } = nextProps
    const { values: currentValues } = this.props

    if (
      !!nextValues.id &&
      nextValues.id !== currentValues.id &&
      nextValues.type === '2'
    ) {
      const { codetable } = this.props
      const { inventoryvaccination = [] } = codetable
      const { inventoryVaccinationFK } = nextValues
      const vaccination = inventoryvaccination.find(
        item => item.id === inventoryVaccinationFK,
      )

      if (vaccination)
        this.setState({
          selectedVaccination: vaccination,
        })
      else
        this.setState({
          selectedVaccination: {
            vaccinationStock: [],
          },
        })
    }
  }

  onSearchVaccinationHistory = async () => {
    this.toggleAddFromPastModal()
  }

  toggleAddFromPastModal = () => {
    const { showAddFromPastModal } = this.state
    this.setState({ showAddFromPastModal: !showAddFromPastModal })
  }

  validateAndSubmitIfOk = async () => {
    const { handleSubmit, validateForm } = this.props
    const validateResult = await validateForm()
    const isFormValid = _.isEmpty(validateResult)

    if (isFormValid) {
      handleSubmit()
      return true
    }
    handleSubmit()
    return false
  }

  resetVaccinationHistoryResult = () => {
    this.props.dispatch({
      type: 'medicationHistory/updateState',
      payload: {
        filter: {},
        list: [],
      },
    })
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

  getCaution = () => {
    const {
      values,
      codetable: { inventoryvaccination = [] },
    } = this.props
    let cautions

    const { inventoryVaccinationFK } = values
    const selectVaccination = inventoryvaccination.find(
      vaccination => vaccination.id === inventoryVaccinationFK,
    )
    if (
      selectVaccination &&
      selectVaccination.caution &&
      selectVaccination.caution.trim().length
    ) {
      cautions = selectVaccination.caution
    }
    return cautions
  }

  onExpiryDateChange = async () => {
    window.setTimeout(async () => {
      const { handleSubmit, validateForm } = this.props
      const validateResult = await validateForm()
      const isFormValid = _.isEmpty(validateResult)
      if (!isFormValid) {
        handleSubmit()
      }
    }, 300)
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
      const vacinnationPreOrderItem = patient?.entity?.pendingPreOrderItem.filter(
        x => x.preOrderItemType === 'Vaccination',
      )
      if (vacinnationPreOrderItem) {
        vacinnationPreOrderItem.filter(item => {
          const { preOrderVaccinationItem = {} } = item
          const CheckIfPreOrderItemExists =
            preOrderVaccinationItem.inventoryVaccinationFK ===
            values.inventoryVaccinationFK
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
      handleSubmit,
      setFieldValue,
      classes,
      disableEdit,
      getNextSequence,
      from,
      orders,
      ...reset
    } = this.props
    const { isEditVaccination, workitem = {} } = values
    const { showAddFromPastModal, isPreOrderItemExists } = this.state
    const caution = this.getCaution()
    const totalPriceReadonly =
      Authorized.check('queue.consultation.modifyorderitemtotalprice')
        .rights !== 'enable'

    const isDisabledHasPaidPreOrder =
      orders.entity?.actualizedPreOrderItemFK && orders.entity?.hasPaid == true
        ? true
        : false

    const isDisabledNoPaidPreOrder = orders.entity?.actualizedPreOrderItemFK
      ? true
      : false

    if (orders.isPreOrderItemExists === false && !values.isPreOrder)
      this.setState({ isPreOrderItemExists: false })

    const { nurseWorkitem = {} } = workitem
    const isStartedVaccination =
      !values.isPreOrder &&
      nurseWorkitem.statusFK === NURSE_WORKITEM_STATUS.ACTUALIZED
    return (
      <Authorized
        authority={GetOrderItemAccessRight(
          from,
          'queue.consultation.order.vaccination',
        )}
      >
        <div>
          <GridContainer>
            <GridItem xs={8}>
              <Field
                name='inventoryVaccinationFK'
                render={args => {
                  return (
                    <div
                      id={`autofocus_${values.type}`}
                      style={{ position: 'relative' }}
                    >
                      <LocalSearchSelect
                        temp
                        label='Vaccination Name'
                        labelField='combinDisplayValue'
                        onChange={this.changeVaccination}
                        options={this.getVaccinationOptions()}
                        {...args}
                        style={{ paddingRight: 20 }}
                        disabled={
                          values.isPackage ||
                          isDisabledNoPaidPreOrder ||
                          isStartedVaccination
                        }
                        matchSearch={this.matchSearch}
                      />
                      <LowStockInfo sourceType='vaccination' {...this.props} />
                    </div>
                  )
                }}
              />
            </GridItem>
            <GridItem xs={4}>
              {!isEditVaccination && (
                <Tooltip title='Add From Past'>
                  <ProgressButton
                    color='primary'
                    icon={<Add />}
                    style={{
                      marginTop: theme.spacing(2),
                      marginLeft: theme.spacing(7),
                    }}
                    onClick={this.onSearchVaccinationHistory}
                  >
                    Add From Past
                  </ProgressButton>
                </Tooltip>
              )}
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={12}>
              <div
                style={{
                  position: 'relative',
                  paddingLeft: 90,
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
                {caution && (
                  <Alert
                    message={
                      <Tooltip
                        useTooltip2
                        title={
                          <div>
                            <div style={{ fontWeight: 500 }}>Caution:</div>
                            <div style={{ marginLeft: 10 }}>{caution}</div>
                          </div>
                        }
                      >
                        <span>{caution}</span>
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
            </GridItem>
            <GridItem xs={2}>
              <Field
                name='usageMethodFK'
                render={args => {
                  return (
                    <CodeSelect
                      label='Usage'
                      allowClear={false}
                      code='ctVaccinationUsage'
                      onChange={(v, op = {}) => {
                        setFieldValue(
                          'usageMethodCode',
                          op ? op.code : undefined,
                        )
                        setFieldValue(
                          'usageMethodDisplayValue',
                          op ? op.name : undefined,
                        )
                      }}
                      {...args}
                      disabled={
                        isDisabledHasPaidPreOrder || isStartedVaccination
                      }
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={2}>
              <FastField
                name='dosageFK'
                render={args => {
                  return (
                    <CodeSelect
                      label='Dosage'
                      labelField='displayValue'
                      allowClear={false}
                      code='ctmedicationdosage'
                      onChange={(v, op = {}) => {
                        setFieldValue('dosageCode', op ? op.code : undefined)
                        setFieldValue(
                          'dosageDisplayValue',
                          op ? op.displayValue : undefined,
                        )
                        setTimeout(this.calculateQuantity, 1)
                      }}
                      valueFiled='id'
                      {...args}
                      disabled={
                        isDisabledHasPaidPreOrder || isStartedVaccination
                      }
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={2}>
              <FastField
                name='uomfk'
                render={args => {
                  return (
                    <CodeSelect
                      disabled
                      label='UOM'
                      allowClear={false}
                      code='ctvaccinationunitofmeasurement'
                      onChange={(v, op = {}) => {
                        setFieldValue('uomCode', op ? op.code : undefined)
                        setFieldValue(
                          'uomDisplayValue',
                          op ? op.name : undefined,
                        )
                      }}
                      {...args}
                      disabled={
                        isDisabledHasPaidPreOrder || isStartedVaccination
                      }
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={2}>
              <FastField
                name='vaccinationGivenDate'
                render={args => {
                  return (
                    <DatePicker
                      label='Date Given'
                      {...args}
                      disabled={isStartedVaccination}
                    />
                  )
                }}
              />
            </GridItem>
            {values.isPackage && (
              <React.Fragment>
                <GridItem xs={3}>
                  <Field
                    name='packageConsumeQuantity'
                    render={args => {
                      return (
                        <NumberInput
                          label='Consumed Quantity'
                          style={{
                            marginLeft: theme.spacing(7),
                            paddingRight: theme.spacing(6),
                          }}
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
                <GridItem xs={1}>
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
              <GridItem xs={2}>
                <Field
                  name='quantity'
                  render={args => {
                    return (
                      <NumberInput
                        label='Quantity'
                        step={1}
                        min={values.minQuantity}
                        onChange={e => {
                          if (values.unitPrice) {
                            const total = e.target.value * values.unitPrice
                            setFieldValue('totalPrice', total)
                            this.updateTotalPrice(total)
                          }
                        }}
                        {...args}
                        disabled={
                          isDisabledHasPaidPreOrder || isStartedVaccination
                        }
                      />
                    )
                  }}
                />
              </GridItem>
            )}
            <GridItem xs={2}>
              <FastField
                name='dispenseUOMFK'
                render={args => {
                  return (
                    <CodeSelect
                      disabled
                      label='Dispense UOM'
                      allowClear={false}
                      code='ctvaccinationunitofmeasurement'
                      onChange={(v, op = {}) => {
                        setFieldValue(
                          'dispenseUOMCode',
                          op ? op.code : undefined,
                        )
                        setFieldValue(
                          'dispenseUOMDisplayValue',
                          op ? op.name : undefined,
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
            <GridItem xs={4} className={classes.editor}>
              <Field
                name='batchNo'
                render={args => {
                  return (
                    <CodeSelect
                      mode='tags'
                      maxSelected={1}
                      disableAll
                      label='Batch No.'
                      labelField='batchNo'
                      valueField='batchNo'
                      options={this.state.selectedVaccination.vaccinationStock}
                      onChange={(e, op = {}) => {
                        if (op && op.length > 0) {
                          const { expiryDate } = op[0]
                          setFieldValue(`expiryDate`, expiryDate)
                        } else {
                          setFieldValue(`expiryDate`, undefined)
                        }
                        this.onExpiryDateChange()
                      }}
                      disabled={disableEdit || isStartedVaccination}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={4} className={classes.editor}>
              <FastField
                name='expiryDate'
                render={args => {
                  return (
                    <DatePicker
                      label='Expiry Date'
                      onChange={() => {
                        this.onExpiryDateChange()
                      }}
                      disabled={disableEdit || isStartedVaccination}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={4} className={classes.editor}>
              <Field
                name='totalPrice'
                render={args => {
                  return (
                    <NumberInput
                      label='Total'
                      currency
                      onChange={e => {
                        this.updateTotalPrice(e.target.value)
                      }}
                      min={0}
                      disabled={
                        totalPriceReadonly ||
                        values.isPackage ||
                        isDisabledHasPaidPreOrder
                      }
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={8} className={classes.editor}>
              <FastField
                name='remarks'
                render={args => {
                  return (
                    <TextField
                      rowsMax='5'
                      label='Remarks'
                      {...args}
                      disabled={isStartedVaccination}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={3} className={classes.editor}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{ marginTop: theme.spacing(2), position: 'absolute' }}
                >
                  <Field
                    name='isMinus'
                    render={args => {
                      return (
                        <Switch
                          checkedChildren='-'
                          unCheckedChildren='+'
                          label=''
                          onChange={() => {
                            setTimeout(() => {
                              this.onAdjustmentConditionChange()
                            }, 1)
                          }}
                          disabled={
                            totalPriceReadonly ||
                            values.isPackage ||
                            isDisabledHasPaidPreOrder
                          }
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
                          onChange={() => {
                            setTimeout(() => {
                              this.onAdjustmentConditionChange()
                            }, 1)
                          }}
                          disabled={
                            totalPriceReadonly ||
                            values.isPackage ||
                            isDisabledHasPaidPreOrder
                          }
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
                        max={100}
                        noSuffix
                        label='Adjustment'
                        onChange={() => {
                          setTimeout(() => {
                            this.onAdjustmentConditionChange()
                          }, 1)
                        }}
                        disabled={
                          totalPriceReadonly ||
                          values.isPackage ||
                          isDisabledHasPaidPreOrder
                        }
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
                        onChange={() => {
                          setTimeout(() => {
                            this.onAdjustmentConditionChange()
                          }, 1)
                        }}
                        disabled={
                          totalPriceReadonly ||
                          values.isPackage ||
                          isDisabledHasPaidPreOrder
                        }
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={3} className={classes.editor}>
              <FastField
                name='isGenerateCertificate'
                render={args => {
                  return (
                    <Checkbox
                      style={{ position: 'absolute', bottom: 2 }}
                      label='Generate Certificate'
                      disabled={isStartedVaccination}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={5} className={classes.editor}>
              {values.isPackage ? (
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
              ) : (
                <div>
                  <Field
                    name='isPreOrder'
                    render={args => {
                      return (
                        <Checkbox
                          label='Pre-Order'
                          disabled={
                            isDisabledNoPaidPreOrder || isStartedVaccination
                          }
                          style={{ position: 'absolute', bottom: 2 }}
                          {...args}
                          onChange={e => {
                            if (!e.target.value) {
                              setFieldValue('isChargeToday', false)
                            }
                            this.checkIsPreOrderItemExistsInListing(
                              e.target.value,
                            )
                          }}
                        />
                      )
                    }}
                  />
                  {values.isPreOrder && (
                    <FastField
                      name='isChargeToday'
                      render={args => {
                        return (
                          <Checkbox
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: '100px',
                            }}
                            label='Charge Today'
                            {...args}
                          />
                        )
                      }}
                    />
                  )}
                  {isPreOrderItemExists && (
                    <Alert
                      message={
                        "Item exists in Pre-Order. Plesae check patient's Pre-Order."
                      }
                      type='warning'
                      style={{
                        position: 'absolute',
                        top: 45,
                        left: 10,
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
              )}
            </GridItem>
            <GridItem xs={4} className={classes.editor}>
              <FastField
                name='totalAfterItemAdjustment'
                render={args => {
                  return (
                    <NumberInput
                      label='Total After Adj.'
                      currency
                      disabled
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={8} className={classes.editor} />
          </GridContainer>
          {footer({
            onSave: this.validateAndSubmitIfOk,
            onReset: this.handleReset,
          })}
          <CommonModal
            open={showAddFromPastModal}
            title='Add Vaccination From Past'
            onClose={this.toggleAddFromPastModal}
            onConfirm={this.toggleAddFromPastModal}
            maxWidth='md'
            showFooter={false}
            overrideLoading
            cancelText='Cancel'
          >
            <AddFromPast {...this.props} />
          </CommonModal>
        </div>
      </Authorized>
    )
  }
}
export default Vaccination
