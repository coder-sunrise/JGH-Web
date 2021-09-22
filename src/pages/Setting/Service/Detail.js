import React, { PureComponent } from 'react'
import { FastField } from 'formik'
import _ from 'lodash'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import { getBizSession } from '@/services/queue'
import { Tag, Input, Tooltip } from 'antd'
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

@connect(({ clinicSettings }) => ({
  clinicSettings,
}))
@withFormikExtend({
  mapPropsToValues: ({ settingClinicService }) => {
    // console.log('settingClinicService', settingClinicService)
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

    return returnValue
  },

  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
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
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
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
  }

  tableParas = {
    columns: [
      { name: 'serviceCenterFK', title: 'Service Center' },
      { name: 'costPrice', title: 'Cost' },
      { name: 'unitPrice', title: 'Selling Price/Unit' },
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
      },
      { columnName: 'costPrice', type: 'number', currency: true },
      { columnName: 'unitPrice', type: 'number', currency: true },
      {
        columnName: 'isDefault',
        type: 'radio',
        checkedValue: true,
        uncheckedValue: false,
        onChange: ({ row, checked }) => {
          // console.log(this)
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

  componentDidMount() {
    this.checkHasActiveSession()

    const {
      serviceCategoryFK,
      ctService_Tag = [],
      isRequiredSpecimen = false,
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

    const hiddenFields = this.getHiddenFields(_rows)

    //Reset the field if the fields are being hidden
    if (hiddenFields.includes('ctService_Tag'))
      setFieldValue('ctService_Tag', [])
    if (hiddenFields.includes('panelItems')) setFieldValue('panelItems', [])
    if (hiddenFields.includes('isRequiredSpecifyPanelItem'))
      setFieldValue('isRequiredSpecifyPanelItem', false)

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

  getHiddenFields = serviceSettings => {
    const radioAndLabCategories = {
      internalRadiology: 3,
      internalLab: 4,
      externalRadiology: 5,
      externalLab: 6,
    }

    const hiddenFields = []
    const { settingClinicService, clinicSettings, setFieldValue } = this.props
    const { serviceCenterList = [], entity } = settingClinicService

    const { isEnableNurseWorkItem } = clinicSettings.settings

    const radioAndLabServiceCenterIds = serviceCenterList
      .filter(sc =>
        Object.values(radioAndLabCategories).includes(
          sc.serviceCenterCategoryFK,
        ),
      )
      .map(sc => sc.id)

    const internalLabServiceCenterIds = serviceCenterList
      .filter(
        sc => radioAndLabCategories.internalLab === sc.serviceCenterCategoryFK,
      )
      .map(sc => sc.id)

    if (
      serviceSettings.findIndex(sc =>
        radioAndLabServiceCenterIds.includes(sc.serviceCenterFK),
      ) === -1
    ) {
      hiddenFields.push('ctService_Tag')
    }

    const hasInternalLabServiceCenter =
      serviceSettings.findIndex(sc =>
        internalLabServiceCenterIds.includes(sc.serviceCenterFK),
      ) !== -1
    if (!hasInternalLabServiceCenter) {
      hiddenFields.push('panelItems')
      hiddenFields.push('isRequiredSpecifyPanelItem')
    }

    if (!isEnableNurseWorkItem) hiddenFields.push('isNurseActualizable')

    return hiddenFields
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

    const {
      serviceSettings,
      ddlMedisaveHealthScreening,
      ddlOutpatientScan,
      ddlIsCdmpClaimable,
      isPanelItemRequired,
    } = this.state
    const serviceSettingsErrMsg = errors.ctServiceCenter_ServiceNavigation
    const shoudDisableSaveButton =
      serviceSettings.filter(row => !row.isDeleted).length === 0
    const { settings = [] } = clinicSettings

    const hiddenFields = this.getHiddenFields(this.state.serviceSettings)
    return (
      <React.Fragment>
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
                              ? this.state.hasActiveSession
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
                {!hiddenFields.includes('panelItems') && (
                  <GridItem xs={12}>
                    <FastField
                      name='panelItems'
                      render={args => {
                        return (
                          <CodeSelect
                            mode='multiple'
                            maxTagCount='responsive'
                            maxTagPlaceholder={<span>...</span>}
                            onChange={val => {
                              //If all panel items are removed, set false to Specify Panel Item toggle
                              if (!val || val.length === 0)
                                args.form.setFieldValue(
                                  'isRequiredSpecifyPanelItem',
                                  false,
                                )
                            }}
                            disableAll
                            label='Panel Items'
                            code='CTRevenueCategory'
                            {...args}
                          />
                        )
                      }}
                    />
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

                {!hiddenFields.includes('ctService_Tag') && (
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
                    <GridItem xs={4}>
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
                    <GridItem xs={4}>
                      <Field
                        name='isTrackResults'
                        render={args => {
                          return <Switch label='Track Results' {...args} />
                        }}
                      />{' '}
                    </GridItem>
                    <GridItem xs={4}>
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
                      <GridItem xs={4}>
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

                    {!hiddenFields.includes('isRequiredSpecifyPanelItem') && (
                      <GridItem xs={4}>
                        <Field
                          name='isRequiredSpecifyPanelItem'
                          render={args => {
                            return (
                              <Switch
                                disabled={
                                  !this.props.values.panelItems ||
                                  this.props.values.panelItems.length === 0
                                }
                                label='Specify Panel Item'
                                {...args}
                              />
                            )
                          }}
                        />
                      </GridItem>
                    )}
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
              style={{ marginTop: theme.spacing(1), margin: theme.spacing(2) }}
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
                  return !this.state.hasActiveSession || !row.isUsedByOthers
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
          </div>
        </div>
        {/* </SizeContainer> */}
        {footer &&
          footer({
            onConfirm: props.handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: shoudDisableSaveButton,
            },
          })}
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Detail)
