import React, { PureComponent } from 'react'
import { FastField } from 'formik'
import _ from 'lodash'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import { getBizSession } from '@/services/queue'
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
} from '@/components'

const styles = (theme) => ({
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
// const itemSchema = Yup.array()
//   .compact((item) => item.isDeleted)
//   .unique(
//     (v) => {
//       console.log({ v })
//       return v.serviceCenterFK
//     },
//     'error',
//     () => {
//       // notification.error({
//       //   message: 'The Schemes record already exists in the system',
//       // })
//     },
//   )
//   .of(
//     Yup.object().shape({
//       serviceCenterFK: Yup.string().required(),
//       costPrice: Yup.number().required(),
//       unitPrice: Yup.number().required(),
//     }),
//   )

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
        (o) => o.isDefault === true,
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
    effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
    serviceSettingItem: Yup.array().compact((v) => v.isDeleted).of(itemSchema),
    ctServiceCenter_ServiceNavigation: Yup.array()
      .compact((v) => v.isDeleted)
      .required('At least one service setting is required.'),
    modalitySettingItem: Yup.array()
      .compact((v) => v.isDeleted)
      .of(modalityItemSchema),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    // console.log('handleSubmit', values)
    dispatch({
      type: 'settingClinicService/upsert',
      payload: {
        ...restValues,
        ctServiceCenter_ServiceNavigation: restValues.ctServiceCenter_ServiceNavigation.map(
          (item) => {
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
    }).then((r) => {
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
  validate: (values) => {
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
    ddlMedisaveHealthScreening: this.props.initialValues.isMedisaveHealthScreening,
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
            (o) => !o.isDeleted && o.serviceCenterFK === val && o.id !== row.id,
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
            serviceSettingItem.forEach((pec) => {
              pec.isDefault = false
            })
            const r = serviceSettingItem.find((o) => o.id === row.id)
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
    columns: [
      { name: 'modalityFK', title: 'Modality' },
    ],
    columnExtensions: [
      {
        columnName: 'modalityFK',
        type: 'codeSelect',
        code: 'ctModality',
        onChange: ({ val, row }) => {
          const { modalitySettings } = this.state
          const rs = modalitySettings.filter(
            (o) => !o.isDeleted && o.modalityFK === val && o.id !== row.id,
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

  componentDidMount () {
    this.checkHasActiveSession()
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

  onChangeMedisaveHealthScreening = (e) => {
    if (e) {
      this.setState(() => ({
        ddlMedisaveHealthScreening: e.target.value,
      }))

      const { values, setFieldValue } = this.props
      setFieldValue('isMedisaveHealthScreening', e.target.value)
      if(e.target.value === false)
        values.medisaveHealthScreeningDiagnosisFK = null
    }
    
  }

  onChangeOutpatientScan = (e) => {    
    if (e) {
      this.setState(() => ({
        ddlOutpatientScan: e.target.value,
      }))

      const { values, setFieldValue } = this.props
      setFieldValue('isOutpatientScan', e.target.value)
      if(e.target.value === false)
        values.outPatientScanDiagnosisFK = null
    }
  }

  onChangeCdmpClaimable = (e) => {    
    if (e) {
      this.setState(() => ({
        ddlIsCdmpClaimable: e.target.value,
      }))
    }

    if(!e.target.value)
    {
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
        (i) => !i.isDeleted && i.serviceCenterFK === obj.serviceCenterFK,
      )
      if (hasDuplicate.length >= 2) {
        return rows.map(
          (row) =>
            row.id === parseInt(key, 10)
              ? { ...row, serviceCenterFK: undefined }
              : row,
        )
      }
    }
    return rows
  }

  commitChanges = ({ rows, changed }) => {
    const _rows = this.checkIsServiceCenterUnique({ rows, changed })
    const { setFieldValue, values } = this.props

    _rows.forEach((val, i) => {
      val.serviceFK = values.id
      val.serviceCenterFKNavigation = null
    })

    const isDefaultExists = _rows.find(
      (o) =>
        (o.isDefault === true && o.isDeleted === undefined) ||
        (o.isDeleted === false && o.isDefault === true),
    )
    if (!isDefaultExists) {
      const getRow = _rows.find(
        (o) =>
          (o.isDeleted === undefined || o.isDeleted === false) && !o.isDefault,
      )
      if (getRow) {
        getRow.isDefault = true
      }
    }

    setFieldValue('ctServiceCenter_ServiceNavigation', _rows)
    this.setState(() => {
      return {
        serviceSettings: _rows,
      }
    })
    return _rows
  }

  handleAutoOrder = (e) => {
    if (e) {
      const { serviceSettings } = this.state
      const checkDefaultExist = serviceSettings.find(
        (o) => o.isDefault === true,
      )
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
      (o) => o.isDeleted === undefined || o.isDeleted === false,
    )
    if (validRow) {
      return false
    }

    return true
  }

  checkIsDefaultExist = () => {
    return this.state.serviceSettings.find(
      (o) =>
        (o.isDefault === true && o.isDeleted === undefined) ||
        (o.isDeleted === false && o.isDefault === true),
    )
  }

  onAddedRowsChange = (addedRows) => {
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
        (i) => !i.isDeleted && i.modalityFK === obj.modalityFK,
      )
      if (hasDuplicate.length >= 2) {
        return rows.map(
          (row) =>
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

  render () {
    const { props } = this
    const {
      classes,
      theme,
      footer,
      clinicSettings,
      settingClinicService,
      errors,
    } = props
    const { serviceSettings, ddlMedisaveHealthScreening, ddlOutpatientScan, ddlIsCdmpClaimable } = this.state
    const serviceSettingsErrMsg = errors.ctServiceCenter_ServiceNavigation
    const shoudDisableSaveButton =
      serviceSettings.filter((row) => !row.isDeleted).length === 0
    const { settings = [] } = clinicSettings

    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(2) }}>
          {/* <SizeContainer style={{ padding: 20 }}> */}
          <h4 style={{ fontWeight: 400 }}>
            <b>Service Details</b>
          </h4>
          <div>
            <div style={{ margin: theme.spacing(1) }}>
              <GridContainer>
                <GridItem xs={6}>
                  <FastField
                    name='code'
                    render={(args) => (
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
                    render={(args) => (
                      <TextField label='Display Value' {...args} />
                    )}
                  />
                </GridItem>
                <GridItem xs={6}>
                  <Field
                    name='effectiveDates'
                    render={(args) => {
                      return (
                        <DateRangePicker
                          label='Effective Start Date'
                          label2='End Date'
                          disabled={
                            settingClinicService.entity ? (
                              this.state.hasActiveSession
                            ) : (
                              false
                            )
                          }
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
                <GridItem xs={3}>
                  <Field
                    name='isAutoOrder'
                    render={(args) => {
                      return (
                        <Switch
                          label='Consultation Auto Order'
                          onChange={(e) => this.handleAutoOrder(e)}
                          // disabled={this.handleDisableAutoOrder()}
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
                <GridItem xs={3}>
                  <Field
                    name='isTrackResults'
                    render={(args) => {
                      return <Switch label='Track Results' {...args} />
                    }}
                  />
                </GridItem>
                <GridItem xs={6}>
                  <FastField
                    name='serviceCategoryFK'
                    render={(args) => {
                      return (
                        <CodeSelect
                          label='Service Category'
                          code='CTServiceCategory'
                          {...args}
                        />
                      )
                    }}
                  />
                </GridItem>
                <GridItem xs={6}>
                  <FastField
                    name='revenueCategoryFK'
                    render={(args) => {
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
                <GridItem xs={12}>
                  <FastField
                    name='description'
                    render={(args) => {
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
                <GridItem xs={12}>
                  <FastField
                    name='isCdmpClaimable'
                    render={(args) => {
                      return (
                        <span>
                          <Checkbox
                            disabled
                            checked={ddlIsCdmpClaimable}
                            // formControlProps={{ className: classes.medisaveCheck }}
                            onChange={(e) => this.onChangeCdmpClaimable(e)}
                            label='CDMP Claimable'
                            {...args}
                          />
                        </span>
                      )
                    }}
                  />
                </GridItem>
              </GridContainer>
            </div>
            {ddlIsCdmpClaimable && 
            <div style={{ margin: theme.spacing(1,2) }}>
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
                      render={(args) => {
                        return (
                          <Checkbox
                            style={{ verticalAlign: 'bottom' }}
                            checked={ddlMedisaveHealthScreening}
                            // formControlProps={{ className: classes.medisaveCheck }}
                            onChange={(e) => this.onChangeMedisaveHealthScreening(e)}
                            {...args}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem xs={8}>
                    <FastField
                      name='medisaveHealthScreeningDiagnosisFK'
                      render={(args) => {
                        return (
                          <CodeSelect
                            label='Medisave Health Screening'
                            code='ctmedisavehealthscreeningdiagnosis'
                            disabled={!ddlMedisaveHealthScreening}
                            {...args}
                          />
                        )}
                      }
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
                      render={(args) => {
                        return (
                          <Checkbox
                            checked={ddlOutpatientScan}
                            // formControlProps={{ className: classes.medisaveCheck }}
                            onChange={(e) => this.onChangeOutpatientScan(e)}
                          />
                        )
                      }}
                    />
                  </GridItem>
                  <GridItem xs={8}>
                    <FastField
                      name='outPatientScanDiagnosisFK'
                      render={(args) => {
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
            </div>}
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
                isDeletable: () => {
                  return !this.state.hasActiveSession
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
