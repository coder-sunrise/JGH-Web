import React, { PureComponent } from 'react'
import { FastField } from 'formik'
import _ from 'lodash'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import { getBizSession } from '@/services/queue'
import { Tag, Input } from 'antd'
import { Tooltip } from '@/components'
import { PlusOutlined } from '@ant-design/icons'
import {
  GridContainer,
  GridItem,
  TextField,
  Field,
  DateRangePicker,
  Switch,
  EditableTableGrid,
  CodeSelect,
  withFormikExtend,
  notification,
  Checkbox,
  CheckboxGroup,
  TagPanel,
} from '@/components'
import { tagCategory } from '@/utils/codes'

const styles = theme => ({
  sectionHeader: {
    fontWeight: 400,
  },
  serviceSettingStyle: {
    margin: theme.spacing(2),
    color: '#cf1322',
    fontSize: ' 0.75rem',
    minHeight: '1em',
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontWeight: 400,
    lineHeight: '1em',
    letterSpacing: ' 0.03333em',
  },
})

const RadioAndLabCategories = {
  internalRadiology: 3,
  internalLab: 4,
  externalRadiology: 5,
  externalLab: 6,
}

const checkAnyInternalLabServiceCenter = (
  currentServiceCenters = [],
  allServiceCenters = [],
) => {
  const internalLabServiceCenterIds = allServiceCenters
    .filter(
      sc => RadioAndLabCategories.internalLab === sc.serviceCenterCategoryFK,
    )
    .map(sc => sc.id)

  const hasInternalLabServiceCenter =
    _.intersection(
      internalLabServiceCenterIds,
      currentServiceCenters.map(x => x.serviceCenterFK),
    ).length > 0

  return hasInternalLabServiceCenter
}

const itemSchema = Yup.object().shape({
  serviceCenterFK: Yup.string().required(),
  costPrice: Yup.number()
    .required()
    .min(0, 'Cost Price must be greater than or equal to $0.00'),
  unitPrice: Yup.number()
    .required()
    .min(0, 'Unit Price must be greater than or equal to $0.00'),
})
const modalityItemSchema = Yup.object().shape({
  modalityFK: Yup.string().required(),
})

const testPanelSchema = Yup.object().shape({
  testPanelFK: Yup.string().required(),
})

@connect(({ clinicSettings }) => ({
  clinicSettings,
}))
@withFormikExtend({
  mapPropsToValues: ({ settingClinicService }) => {
    const {
      serviceCenterList: allServiceCenters,
      entity = {},
    } = settingClinicService
    const {
      ctServiceCenter_ServiceNavigation: currentServiceCenters,
      ctService_ExaminationItem,
    } = entity

    const returnValue =
      settingClinicService.entity || settingClinicService.default
    const { isAutoOrder, ctServiceCenter_ServiceNavigation } = returnValue
    if (isAutoOrder) {
      const checkDefaultExist = ctServiceCenter_ServiceNavigation.find(
        o => o.isDefault === true,
      )
      if (!checkDefaultExist && ctServiceCenter_ServiceNavigation.length > 0) {
        ctServiceCenter_ServiceNavigation[0].isDefault = true
      }
    }
    return {
      ...returnValue,
      hasInternalLabServiceCenter: checkAnyInternalLabServiceCenter(
        currentServiceCenters,
        allServiceCenters,
      ),
      examinationItems: (ctService_ExaminationItem || []).map(
        x => x.examinationItemFK,
      ),
    }
  },

  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string()
      .test(
        'len',
        'Service name cannot exceed 40 characters.',
        val => val && val.length <= 40,
      )
      .required(),
    serviceCategoryFK: Yup.string().required(),
    revenueCategoryFK: Yup.string().required(),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
    serviceSettingItem: Yup.array()
      .compact(v => v.isDeleted)
      .of(itemSchema),
    ctServiceCenter_ServiceNavigation: Yup.array()
      .compact(v => v.isDeleted)
      .required('At least one service setting is required.'),
    modalitySettingItem: Yup.array()
      .compact(v => v.isDeleted)
      .of(modalityItemSchema),
    ctService_TestPanel: Yup.array().when('hasInternalLabServiceCenter', {
      is: true,
      then: Yup.array()
        .compact(v => v.isDeleted)
        .required('At least one lab test panel is required.'),
    }),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const {
      effectiveDates,
      hasInternalLabServiceCenter,
      ...restValues
    } = values
    const { dispatch, onConfirm } = props
    const selectedOptions = {}
    dispatch({
      type: 'settingClinicService/upsert',
      payload: {
        ...restValues,
        ...selectedOptions,
        ctServiceCenter_ServiceNavigation: restValues.ctServiceCenter_ServiceNavigation.map(
          item => {
            return {
              ...item,
              effectiveStartDate:
                item.effectiveStartDate || moment().formatUTC(),
              effectiveEndDate:
                item.effectiveEndDate ||
                moment('2099-12-31T23:59:59').formatUTC(false),
            }
          },
        ),
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
        examinationItems: restValues.examinationItems.filter(v => v !== -99),
      },
    }).then(r => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingClinicService/query',
        })

        dispatch({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'ctservice',
            filter: {
              'serviceFKNavigation.IsActive': true,
              'serviceCenterFKNavigation.IsActive': true,
              combineCondition: 'and',
            },
          },
        })
      }
    })
  },
  validate: values => {
    const errors = {}
    if (
      values.isMedisaveHealthScreening &&
      values.medisaveHealthScreeningDiagnosisFK == null
    ) {
      errors.medisaveHealthScreeningDiagnosisFK = 'This is a required field'
    }

    if (values.isOutpatientScan && values.outPatientScanDiagnosisFK == null) {
      errors.outPatientScanDiagnosisFK = 'This is a required field'
    }
    return errors
  },
  displayName: 'ServiceModal',
})
class Detail extends PureComponent {
  state = {
    ddlIsCdmpClaimable: this.props.initialValues.isCdmpClaimable,
    ddlMedisaveHealthScreening: this.props.initialValues
      .isMedisaveHealthScreening,
    ddlOutpatientScan: this.props.initialValues.isOutpatientScan,
    serviceSettings: this.props.values.ctServiceCenter_ServiceNavigation,
    modalitySettings: this.props.values.ctService_Modality,
    testPanels: this.props.values.ctService_TestPanel,
  }

  tableParas = {
    columns: [
      { name: 'serviceCenterFK', title: 'Service Center' },
      { name: 'costPrice', title: 'Cost' },
      { name: 'unitPrice', title: 'Selling Price/Unit' },
      { name: 'isTrackResults', title: 'Track Results' },
      { name: 'isDefault', title: 'Default' },
    ],
    columnExtensions: [
      {
        columnName: 'serviceCenterFK',
        type: 'codeSelect',
        code: 'ctServiceCenter',
        onChange: ({ val, row }) => {
          const { serviceSettings } = this.state
          const rs = serviceSettings.filter(
            o => !o.isDeleted && o.serviceCenterFK === val && o.id !== row.id,
          )
          if (rs.length > 0) {
            notification.error({
              message: 'The service center already exist in the list',
            })
          }
        },
        isDisabled: row => row.isUsedByOthers,
      },
      { columnName: 'costPrice', type: 'number', currency: true, width: 110 },
      { columnName: 'unitPrice', type: 'number', currency: true, width: 160 },
      {
        columnName: 'isTrackResults',
        type: 'checkbox',
        checkedValue: true,
        width: 135,
        uncheckedValue: false,
      },
      {
        columnName: 'isDefault',
        type: 'radio',
        width: 80,
        checkedValue: true,
        uncheckedValue: false,
        onChange: ({ row, checked }) => {
          if (checked) {
            const { values, setFieldValue, setFieldTouched } = this.props
            const serviceSettingItem = _.cloneDeep(
              values.ctServiceCenter_ServiceNavigation,
            )
            serviceSettingItem.forEach(pec => {
              pec.isDefault = false
            })
            const r = serviceSettingItem.find(o => o.id === row.id)
            if (r) {
              r.isDefault = true
            }
            this.setState({ serviceSettings: serviceSettingItem })
            setFieldValue(
              'ctServiceCenter_ServiceNavigation',
              serviceSettingItem,
            )
            setFieldTouched('ctServiceCenter_ServiceNavigation', true)
          }
        },
      },
    ],
  }

  modalityTableParas = {
    columns: [{ name: 'modalityFK', title: 'Modality' }],
    columnExtensions: [
      {
        columnName: 'modalityFK',
        type: 'codeSelect',
        code: 'ctModality',
        onChange: ({ val, row }) => {
          const { modalitySettings } = this.state
          const rs = modalitySettings.filter(
            o => !o.isDeleted && o.modalityFK === val && o.id !== row.id,
          )
          if (rs.length > 0) {
            notification.error({
              message: 'The modality already exist in the list',
            })
          }
        },
      },
    ],
  }

  testPanelTableParas = {
    columns: [{ name: 'testPanelFK', title: 'Lab Test Panel' }],
    columnExtensions: [
      {
        columnName: 'testPanelFK',
        type: 'codeSelect',
        code: 'ctTestPanel',
        valueField: 'id',
        labelField: 'displayValue',
        onChange: ({ val, row }) => {
          const { testPanels } = this.state
          const rs = testPanels.filter(
            o => !o.isDeleted && o.testPanelFK === val && o.id !== row.id,
          )
          if (rs.length > 0) {
            notification.error({
              message: 'The lab test panel already exist in the list',
            })
          }
        },
        isDisabled: row => {
          if (!row.id || row.id <= 0) return false
          const { serviceSettings } = this.state
          const isUsedByOthers =
            (serviceSettings ?? []).findIndex(s => s.isUsedByOthers) !== -1

          return isUsedByOthers
        },
      },
    ],
  }

  componentDidMount() {
    this.checkHasActiveSession()

    const {
      serviceCategoryFK,
      ctService_Tag = [],
      isRequiredSpecimen = false,
      id,
    } = this.props.values
    const { dispatch } = this.props

    dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'cttag', force: true },
    }).then(result => {
      if (result) {
        this.setState({
          serviceTags: result
            .filter(
              t =>
                t.category === 'Service' &&
                ctService_Tag.findIndex(st => st.tagFK === t.id) !== -1,
            )
            .map(t => t.displayValue),
        })
      }
    })
    if (id) {
      setTimeout(async () => {
        if (!_.isEmpty(await this.props.validateForm())) {
          this.props.handleSubmit()
        }
      }, 100)
    }
  }

  checkHasActiveSession = async () => {
    const bizSessionPayload = {
      IsClinicSessionClosed: false,
    }
    const result = await getBizSession(bizSessionPayload)
    const { data } = result.data
    this.setState(() => {
      return {
        hasActiveSession: data.length > 0,
      }
    })
  }

  initMedisaveSetting = () => {
    const { settingClinicService } = this.props
    if (settingClinicService.entity) {
      this.setState({
        ddlMedisaveHealthScreening:
          settingClinicService.entity.isMedisaveHealthScreening,
        ddlOutpatientScan: settingClinicService.entity.isOutpatientScan,
        ddlIsCdmpClaimable: settingClinicService.entity.isCdmpClaimable,
      })
    }
  }

  onChangeMedisaveHealthScreening = e => {
    if (e) {
      this.setState(() => ({
        ddlMedisaveHealthScreening: e.target.value,
      }))

      const { values, setFieldValue } = this.props
      setFieldValue('isMedisaveHealthScreening', e.target.value)
      if (e.target.value === false)
        values.medisaveHealthScreeningDiagnosisFK = null
    }
  }

  onChangeOutpatientScan = e => {
    if (e) {
      this.setState(() => ({
        ddlOutpatientScan: e.target.value,
      }))

      const { values, setFieldValue } = this.props
      setFieldValue('isOutpatientScan', e.target.value)
      if (e.target.value === false) values.outPatientScanDiagnosisFK = null
    }
  }

  onChangeCdmpClaimable = e => {
    if (e) {
      this.setState(() => ({
        ddlIsCdmpClaimable: e.target.value,
      }))
    }

    if (!e.target.value) {
      this.onChangeMedisaveHealthScreening(e)
      this.onChangeOutpatientScan(e)
    }
  }

  checkIsServiceCenterUnique = ({ rows, changed }) => {
    if (!changed) return rows
    const key = Object.keys(changed)[0]
    const obj = changed[key]
    if (obj.serviceCenterFK !== undefined) {
      const hasDuplicate = rows.filter(
        i => !i.isDeleted && i.serviceCenterFK === obj.serviceCenterFK,
      )
      if (hasDuplicate.length >= 2) {
        return rows.map(row =>
          row.id === parseInt(key, 10)
            ? { ...row, serviceCenterFK: undefined }
            : row,
        )
      }
    }
    return rows
  }

  commitChanges = temp => {
    const { rows, changed } = temp
    const _rows = this.checkIsServiceCenterUnique({ rows, changed })
    const { setFieldValue, values } = this.props
    const { ctService_TestPanel = [] } = values

    _rows.forEach((val, i) => {
      val.serviceFK = values.id
      val.serviceCenterFKNavigation = null
    })

    const isDefaultExists = _rows.find(
      o =>
        (o.isDefault === true && o.isDeleted === undefined) ||
        (o.isDeleted === false && o.isDefault === true),
    )
    if (!isDefaultExists) {
      const getRow = _rows.find(
        o =>
          (o.isDeleted === undefined || o.isDeleted === false) && !o.isDefault,
      )
      if (getRow) {
        getRow.isDefault = true
      }
    }

    const hiddenFields = this.computeHiddenFields(_rows)

    //Reset the field if the fields are being hidden
    if (hiddenFields.includes('ctService_Tag'))
      setFieldValue('ctService_Tag', [])

    if (hiddenFields.includes('ctService_TestPanel')) {
      //To use in the validation of test panel is required or not. Test Panel is required only if any lab service center for the service.
      setFieldValue('hasInternalLabServiceCenter', false)
      const testPanels = ctService_TestPanel.map(i => ({
        ...i,
        isDeleted: true,
      }))

      setFieldValue('ctService_TestPanel', testPanels)
      this.setState(() => {
        return {
          testPanels: testPanels,
        }
      })
    } else {
      setFieldValue('hasInternalLabServiceCenter', true)
    }

    setFieldValue('ctServiceCenter_ServiceNavigation', _rows)
    this.setState(() => {
      return {
        serviceSettings: _rows,
      }
    })

    return _rows
  }

  handleAutoOrder = e => {
    if (e) {
      const { serviceSettings } = this.state
      const checkDefaultExist = serviceSettings.find(o => o.isDefault === true)
      if (!checkDefaultExist && serviceSettings.length > 0) {
        serviceSettings[0].isDefault = true
      }
    }
  }

  handleDisableAutoOrder = () => {
    const { serviceSettings } = this.state

    if (serviceSettings.length === 0) {
      return true
    }
    const validRow = serviceSettings.find(
      o => o.isDeleted === undefined || o.isDeleted === false,
    )
    if (validRow) {
      return false
    }

    return true
  }

  checkIsDefaultExist = () => {
    return this.state.serviceSettings.find(
      o =>
        (o.isDefault === true && o.isDeleted === undefined) ||
        (o.isDeleted === false && o.isDefault === true),
    )
  }

  onAddedRowsChange = addedRows => {
    if (addedRows.length > 0) {
      const newRow = addedRows[0]
      const serviceSettingsRow = this.state.serviceSettings.length
      if (serviceSettingsRow <= 0) {
        newRow.isDefault = true
      } else {
        const checkIsDefaultExist = this.checkIsDefaultExist()
        if (!checkIsDefaultExist) {
          newRow.isDefault = true
        } else {
          newRow.isDefault = false
        }
      }
    }
    return addedRows
  }

  checkIsModalityUnique = ({ rows, changed }) => {
    if (!changed) return rows
    const key = Object.keys(changed)[0]
    const obj = changed[key]
    if (obj.modalityFK !== undefined) {
      const hasDuplicate = rows.filter(
        i => !i.isDeleted && i.modalityFK === obj.modalityFK,
      )
      if (hasDuplicate.length >= 2) {
        return rows.map(row =>
          row.id === parseInt(key, 10)
            ? { ...row, modalityFK: undefined }
            : row,
        )
      }
    }
    return rows
  }

  commitModalityChanges = ({ rows, changed }) => {
    const _rows = this.checkIsModalityUnique({ rows, changed })
    const { setFieldValue, values } = this.props

    _rows.forEach((val, i) => {
      val.serviceFK = values.id
      val.modalityFKNavigation = null
    })

    setFieldValue('CTService_Modality', _rows)
    this.setState(() => {
      return {
        modalitySettings: _rows,
      }
    })
    return _rows
  }

  checkIsTestPanelUnique = ({ rows, changed }) => {
    if (!changed) return rows
    const key = Object.keys(changed)[0]
    const obj = changed[key]
    if (obj.testPanelFK !== undefined) {
      const hasDuplicate = rows.filter(
        i => !i.isDeleted && i.testPanelFK === obj.testPanelFK,
      )
      if (hasDuplicate.length >= 2) {
        return rows.map(row =>
          row.id === parseInt(key, 10)
            ? { ...row, testPanelFK: undefined }
            : row,
        )
      }
    }
    return rows
  }

  commitTestPanelChanges = ({ rows, changed }) => {
    const _rows = this.checkIsTestPanelUnique({ rows, changed })
    const { setFieldValue, values } = this.props

    _rows.forEach((val, i) => {
      val.serviceFK = values.id
      val.testPanelFKNavigation = null
    })

    setFieldValue('ctService_TestPanel', _rows)
    this.setState(() => {
      return {
        testPanels: _rows,
      }
    })
    return _rows
  }

  handleTagPanelChange = (value, tags, setFieldValue) => {
    const {
      ctService_Tag: originalTags = [],
      id: serviceId,
    } = this.props.initialValues

    const currentTags = tags.map(t => {
      return {
        serviceFK: serviceId,
        tagFK: t.id,
        isDeleted: false,
      }
    })

    const deletedTags = originalTags
      .filter(t => !value.includes(t.displayValue))
      .map(t => {
        return { ...t, isDeleted: true }
      })

    setFieldValue('ctService_Tag', [...currentTags, ...deletedTags])
  }

  handleExaminationItemChange = examinationItems => {
    examinationItems = examinationItems.filter(v => v !== -99)
    const { setFieldValue } = this.props
    const {
      ctService_ExaminationItem: originalExaminationItems = [],
      id: serviceId,
    } = this.props.initialValues

    const currentExaminations = examinationItems.map(t => {
      return {
        serviceFK: serviceId,
        examinationItemFK: t,
        isDeleted: false,
        ...originalExaminationItems.find(x => x.examinationItemFK === t),
      }
    })

    const deletedExaminationItems = originalExaminationItems
      .filter(t => !examinationItems.includes(t.examinationItemFK))
      .map(t => {
        return {
          ...t,
          isDeleted: true,
        }
      })

    setFieldValue('ctService_ExaminationItem', [
      ...currentExaminations,
      ...deletedExaminationItems,
    ])
  }
  computeHiddenFields = rows => {
    const serviceSettings = rows.filter(r => !r.isDeleted)

    const hiddenFields = []
    const { settingClinicService, clinicSettings, setFieldValue } = this.props
    const { serviceCenterList = [], entity } = settingClinicService

    const { isEnableNurseWorkItem } = clinicSettings.settings

    const radioAndLabServiceCenterIds = serviceCenterList
      .filter(sc =>
        Object.values(RadioAndLabCategories).includes(
          sc.serviceCenterCategoryFK,
        ),
      )
      .map(sc => sc.id)

    if (
      serviceSettings.findIndex(sc =>
        radioAndLabServiceCenterIds.includes(sc.serviceCenterFK),
      ) === -1
    ) {
      //hiddenFields.push('ctService_Tag')
    }

    const hasInternalLabServiceCenter = checkAnyInternalLabServiceCenter(
      serviceSettings,
      serviceCenterList,
    )
    if (!hasInternalLabServiceCenter) {
      hiddenFields.push('ctService_TestPanel')
    }

    if (!isEnableNurseWorkItem) hiddenFields.push('isNurseActualizable')

    return hiddenFields
  }

  validationOfFormFields = fieldArray => {
    let errorArr = []
    fieldArray.forEach(item =>
      '_errors' in item && item.isDeleted !== true && item._errors.length > 0
        ? errorArr.push(item)
        : null,
    )
    if (errorArr.length > 0) {
      return true
    }
    return false
  }
  render() {
    const { props } = this

    const {
      classes,
      theme,
      footer,
      clinicSettings,
      settingClinicService,
      ctService_Tag,
      errors,
    } = props
    let settingsFiledArray = [
      ...(this.state.modalitySettings || []),
      ...(this.state.serviceSettings || []),
      ...(this.state.testPanels || []),
    ]

    const { ctService_TestPanel: originalTestPanels } = props.initialValues

    const {
      serviceSettings,
      ddlMedisaveHealthScreening,
      ddlOutpatientScan,
      ddlIsCdmpClaimable,
      isPanelItemRequired,
    } = this.state
    const serviceSettingsErrMsg = errors.ctServiceCenter_ServiceNavigation
    const testPanelErrMsg = errors.ctService_TestPanel
    const shoudDisableSaveButton = () =>
      serviceSettings.filter(row => !row.isDeleted).length === 0 ||
      this.validationOfFormFields(settingsFiledArray)
    const { settings = [] } = clinicSettings
    const labAndRadiologySetting =
      settings.isEnableLabModule || settings.isEnableRadiologyModule
    const hiddenFields = this.computeHiddenFields(this.state.serviceSettings)
    return (
      <React.Fragment>
        <GridContainer
          style={{
            height: 700,
            alignItems: 'start',
            overflowY: 'scroll',
          }}
        >
          <div style={{ margin: theme.spacing(2) }}>
            <h4 style={{ fontWeight: 400 }}>
              <b>Service Details</b>
            </h4>
            <div>
              <div style={{ margin: theme.spacing(1) }}>
                <GridContainer>
                  <GridItem xs={6}>
                    <FastField
                      name='code'
                      render={args => (
                        <TextField
                          label='Code'
                          autoFocus
                          {...args}
                          disabled={!!settingClinicService.entity}
                        />
                      )}
                    />
                  </GridItem>
                  <GridItem xs={6}>
                    <FastField
                      name='displayValue'
                      render={args => (
                        <TextField label='Display Value' {...args} />
                      )}
                    />
                  </GridItem>
                  <GridItem xs={6}>
                    <Field
                      name='effectiveDates'
                      render={args => {
                        return (
                          <DateRangePicker
                            label='Effective Start Date'
                            label2='End Date'
                            disabled={
                              settingClinicService.entity
                                ? this.state.hasActiveSession &&
                                  settingClinicService.entity.isActive
                                : false
                            }
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem xs={6}>
                    <FastField
                      name='serviceCategoryFK'
                      render={args => {
                        return (
                          <CodeSelect
                            label='Service Category'
                            code='CTServiceCategory'
                            labelField='displayValue'
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem xs={6}>
                    <FastField
                      name='revenueCategoryFK'
                      render={args => {
                        return (
                          <CodeSelect
                            label='Revenue Category'
                            code='CTRevenueCategory'
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem xs={6}>
                    <FastField
                      name='description'
                      render={args => {
                        return (
                          <TextField
                            label='Description'
                            multiline
                            rowsMax={4}
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  {settings.isEnableMedicalCheckupModule && (
                    <GridItem xs={6}>
                      <Tooltip
                        title='When this service is ordered in Medical Checkup, comment for this service will be written in the selected examination'
                        placement='right-start'
                      >
                        <div>
                          <FastField
                            name='examinationItems'
                            render={args => {
                              return (
                                <CodeSelect
                                  label='Medical Checkup Examination'
                                  code='ctexaminationitem'
                                  labelField='displayValueWithCategory'
                                  allClear={true}
                                  maxTagCount={0}
                                  mode='multiple'
                                  onChange={v => {
                                    this.handleExaminationItemChange(v)
                                  }}
                                  {...args}
                                />
                              )
                            }}
                          />
                        </div>
                      </Tooltip>
                    </GridItem>
                  )}
                  {settings.isEnableMedisave && (
                    <GridItem xs={12}>
                      <FastField
                        name='isCdmpClaimable'
                        render={args => {
                          return (
                            <span>
                              <Checkbox
                                checked={ddlIsCdmpClaimable}
                                // formControlProps={{ className: classes.medisaveCheck }}
                                onChange={e => this.onChangeCdmpClaimable(e)}
                                label='CDMP Claimable'
                                {...args}
                              />
                            </span>
                          )
                        }}
                      />
                    </GridItem>
                  )}
                  {labAndRadiologySetting &&
                    !hiddenFields.includes('ctService_Tag') && (
                      <GridItem xs={12}>
                        <Field
                          name='ctService_Tag'
                          render={args => (
                            <TagPanel
                              label='Tags:'
                              tagCategory='Service'
                              defaultTagNames={this.state.serviceTags}
                              {...args}
                              onChange={(value, tags) =>
                                this.handleTagPanelChange(
                                  value,
                                  tags,
                                  args.form.setFieldValue,
                                )
                              }
                            ></TagPanel>
                          )}
                        />
                      </GridItem>
                    )}
                  <GridItem xs={12}>
                    <GridContainer>
                      <GridItem xs={3}>
                        <Field
                          name='isAutoOrder'
                          render={args => {
                            return (
                              <Switch
                                label='Consultation Auto Order'
                                onChange={e => this.handleAutoOrder(e)}
                                // disabled={this.handleDisableAutoOrder()}
                                {...args}
                              />
                            )
                          }}
                        />
                      </GridItem>
                      {/* <GridItem xs={4}>
                        <Field
                          name='isTrackResults'
                          render={args => {
                            return <Switch label='Track Results' {...args} />
                          }}
                        />{' '}
                      </GridItem> */}
                      <GridItem xs={3}>
                        <Field
                          name='isDisplayValueChangable'
                          render={args => {
                            return (
                              <Switch label='Change Display Value' {...args} />
                            )
                          }}
                        />
                      </GridItem>
                      {!hiddenFields.includes('isNurseActualizable') && (
                        <GridItem xs={3}>
                          <Field
                            name='isNurseActualizable'
                            render={args => {
                              return (
                                <Switch label='Actualized by Nurse' {...args} />
                              )
                            }}
                          />
                        </GridItem>
                      )}
                      <GridItem xs={3}>
                        <Field
                          name='isAutoDisplayInOrderCart'
                          render={args => {
                            return (
                              <Switch
                                label='Show in order cart as a priority'
                                {...args}
                              />
                            )
                          }}
                        />
                      </GridItem>
                    </GridContainer>
                  </GridItem>
                </GridContainer>
              </div>
              {settings.isEnableMedisave && ddlIsCdmpClaimable && (
                <div style={{ margin: theme.spacing(1, 2) }}>
                  <h4 style={{ fontWeight: 400 }}>
                    <b>Medisave Settings</b>
                  </h4>
                  <div>
                    <GridContainer>
                      <GridItem
                        xs={1}
                        className={classes.detailHeaderContainer}
                        style={{
                          paddingLeft: 20,
                          paddingTop: 10,
                        }}
                      >
                        <FastField
                          name='isMedisaveHealthScreening'
                          render={args => {
                            return (
                              <Checkbox
                                style={{ verticalAlign: 'bottom' }}
                                checked={ddlMedisaveHealthScreening}
                                // formControlProps={{ className: classes.medisaveCheck }}
                                onChange={e =>
                                  this.onChangeMedisaveHealthScreening(e)
                                }
                                {...args}
                              />
                            )
                          }}
                        />
                      </GridItem>
                      <GridItem xs={8}>
                        <FastField
                          name='medisaveHealthScreeningDiagnosisFK'
                          render={args => {
                            return (
                              <CodeSelect
                                label='Medisave Health Screening'
                                code='ctmedisavehealthscreeningdiagnosis'
                                disabled={!ddlMedisaveHealthScreening}
                                {...args}
                              />
                            )
                          }}
                        />
                      </GridItem>
                      <GridItem xs={3} />
                      <GridItem
                        xs={1}
                        className={classes.detailHeaderContainer}
                        style={{
                          paddingLeft: 20,
                          paddingTop: 10,
                        }}
                      >
                        <FastField
                          name='isOutpatientScan'
                          render={args => {
                            return (
                              <Checkbox
                                checked={ddlOutpatientScan}
                                // formControlProps={{ className: classes.medisaveCheck }}
                                onChange={e => this.onChangeOutpatientScan(e)}
                              />
                            )
                          }}
                        />
                      </GridItem>
                      <GridItem xs={8}>
                        <FastField
                          name='outPatientScanDiagnosisFK'
                          render={args => {
                            return (
                              <CodeSelect
                                label='Medisave Outpatient Scan'
                                code='ctmedisaveoutpatientscandiagnosis'
                                disabled={!ddlOutpatientScan}
                                {...args}
                              />
                            )
                          }}
                        />
                      </GridItem>
                      <GridItem xs={3} />
                    </GridContainer>
                  </div>
                </div>
              )}
              <h4 style={{ fontWeight: 400 }}>
                <b>Service Settings</b>
              </h4>
              {serviceSettingsErrMsg && (
                <p className={classes.serviceSettingStyle}>
                  {serviceSettingsErrMsg}
                </p>
              )}
              <EditableTableGrid
                style={{
                  marginTop: theme.spacing(1),
                  margin: theme.spacing(2),
                }}
                rows={this.state.serviceSettings}
                FuncProps={{
                  pagerConfig: {
                    containerExtraComponent: this.PagerContent,
                  },
                }}
                EditingProps={{
                  showAddCommand: true,
                  onCommitChanges: this.commitChanges,
                  onAddedRowsChange: this.onAddedRowsChange,
                  isDeletable: row => {
                    return !row.isUsedByOthers
                  },
                }}
                schema={itemSchema}
                {...this.tableParas}
              />

              {settings.isEnableServiceModality === true && (
                <React.Fragment>
                  <h4 style={{ fontWeight: 400 }}>
                    <b>Modality Settings</b>
                  </h4>
                  <EditableTableGrid
                    forceRender
                    style={{
                      marginTop: theme.spacing(1),
                      margin: theme.spacing(2),
                    }}
                    rows={this.state.modalitySettings}
                    FuncProps={{
                      pagerConfig: {
                        containerExtraComponent: this.PagerContent,
                      },
                    }}
                    EditingProps={{
                      showAddCommand: true,
                      onCommitChanges: this.commitModalityChanges,
                    }}
                    schema={modalityItemSchema}
                    {...this.modalityTableParas}
                  />
                </React.Fragment>
              )}

              {!hiddenFields.includes('ctService_TestPanel') &&
                settings.isEnableLabModule && (
                  <React.Fragment>
                    <h4 style={{ fontWeight: 400 }}>
                      <b>Lab Test Panel Settings</b>
                    </h4>
                    {testPanelErrMsg && (
                      <p className={classes.serviceSettingStyle}>
                        {testPanelErrMsg}
                      </p>
                    )}
                    <EditableTableGrid
                      forceRender
                      style={{
                        marginTop: theme.spacing(1),
                        margin: theme.spacing(2),
                      }}
                      rows={this.state.testPanels}
                      FuncProps={{
                        pagerConfig: {
                          containerExtraComponent: this.PagerContent,
                        },
                      }}
                      EditingProps={{
                        showAddCommand: true,
                        onCommitChanges: this.commitTestPanelChanges,
                        isDeletable: row => {
                          if (row.id && row.id <= 0) return true //Newly added row can be deletable before saving.

                          const isUsedByOthers =
                            (serviceSettings ?? []).findIndex(
                              s => s.isUsedByOthers,
                            ) !== -1

                          return !isUsedByOthers
                        },
                      }}
                      schema={testPanelSchema}
                      {...this.testPanelTableParas}
                    />
                  </React.Fragment>
                )}
            </div>
          </div>
        </GridContainer>
        {/* </SizeContainer> */}
        {footer &&
          footer({
            onConfirm: props.handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: shoudDisableSaveButton(),
            },
          })}
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Detail)
