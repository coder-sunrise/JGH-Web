import React, { PureComponent } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
// material ui
import { withStyles } from '@material-ui/core'
// custom component
import {
  CommonCard,
  GridContainer,
  GridItem,
  SizeContainer,
  withFormikExtend,
  Accordion,
  notification,
} from '@/components'
// medisys-components
import { ErrorWrapper, LoadingWrapper } from '@/components/_medisys'
// Sub-components
import PatientBanner from '@/pages/PatientDashboard/Banner'
import { deleteFileByFileID } from '@/services/file'
import { VISIT_TYPE, SCHEME_TYPE } from '@/utils/constants'
import { locationQueryParameters } from '@/utils/utils'
import Authorized from '@/utils/Authorized'
import PatientInfoCard from './PatientInfoCard'
import VisitInfoCard from './VisitInfoCard'
import VitalSignCard from './VitalSignCard'
import ReferralCard from './ReferralCard'
import EyeVisualAcuityCard from './EyeVisualAcuityCard'
import RefractionFormCard from './RefractionFormCard'
import PrintLabLabelButton from '@/components/_medisys/PatientInfoSideBanner/PatientLabelBtn'

// import ParticipantCard from './ParticipantCard'
import {
  VisitValidationSchema,
  reportingDoctorSchema,
} from './validationScheme'
import FormFieldName from './formField'
// services
// misc utils
import { formikMapPropsToValues, formikHandleSubmit } from './miscUtils'
import { VISIT_STATUS } from '../variables'
import PreOrderCard from './PreOrderCard'
import MCCard from './MCCard'
import { preOrderItemCategory } from '@/utils/codes'
import _ from 'lodash'

const styles = theme => ({
  gridContainer: {
    marginBottom: theme.spacing(1),
  },
  cardContent: {
    padding: `0px ${16}px !important`,
  },
  row: {
    marginBottom: theme.spacing(3),
  },
  footerContent: {
    paddingRight: `${theme.spacing.unit * 2}px !important`,
    paddingTop: `${theme.spacing.unit * 2}px !important`,
  },
  loadingIndicator: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    minHeight: '50vh',
    '& > p': {
      fontSize: '1.1rem',
    },
  },
  readOnlyChip: {
    position: 'absolute',
    zIndex: 20,
    top: 0,
    right: 0,
  },
})

const getHeight = propsHeight => {
  if (propsHeight < 0) return '100%'
  return propsHeight - 64
}

@connect(
  ({
    clinicSettings,
    clinicInfo,
    queueLog,
    loading,
    global,
    visitRegistration,
    patient,
    codetable,
  }) => ({
    clinicSettings,
    clinicInfo,
    queueLog,
    global,
    loading,
    visitRegistration,
    patientInfo: patient.entity || {},
    doctorProfiles: codetable.doctorprofile,
    ctinvoiceadjustment: codetable.ctinvoiceadjustment,
    ctvisitpurpose: codetable.ctvisitpurpose,
    ctlanguage: codetable.ctlanguage,
  }),
)
@withFormikExtend({
  displayName: 'VisitRegistration',
  enableReinitialize: true,
  validationSchema: VisitValidationSchema,
  mapPropsToValues: formikMapPropsToValues,
  handleSubmit: formikHandleSubmit,
})
class NewVisit extends PureComponent {
  state = {
    hasActiveSession: false,
    currentVisitOrderTemplate: undefined,
  }

  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  componentDidMount = async () => {
    const { dispatch, patientInfo, values, visitRegistration } = this.props
    const response = await dispatch({
      type: 'visitRegistration/getVisitOrderTemplateListForDropdown',
      payload: {
        pagesize: 9999,
      },
    })
    if (response) {
      const { data } = response
      const templateOptions = data
        .filter(template => template.isActive)
        .map(template => {
          return {
            ...template,
            value: template.id,
            name: template.displayValue,
          }
        })

      dispatch({
        type: 'visitRegistration/updateState',
        payload: {
          visitOrderTemplateOptions: templateOptions,
        },
      })

      this.setBannerHeight()
    }

    const bizSession = await dispatch({
      type: 'visitRegistration/getBizSession',
      payload: {
        IsClinicSessionClosed: false,
      },
    })
    const { data = [] } = bizSession
    this.setState({
      hasActiveSession: data.length > 0,
    })
    await this.getCodeTables()
    setTimeout(() => {
      if (
        visitRegistration.visitOrderTemplateFK &&
        visitRegistration.fromAppt
      ) {
        dispatch({
          type: 'settingVisitOrderTemplate/queryOne',
          payload: {
            id: visitRegistration.visitOrderTemplateFK,
          },
        }).then(template => {
          if (template) {
            this.setState({ currentVisitOrderTemplate: template })
          }
        })
      }
    }, 200)
  }

  getCodeTables = async () => {
    const { dispatch } = this.props
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctinvoiceadjustment',
        force: true,
        filter: {
          isActive: true,
        },
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctvisitpurpose',
        force: true,
        filter: {
          isActive: true,
        },
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctlanguage',
        force: true,
      },
    })
  }
  componentWillUnmount() {
    // call file index API METHOD='DELETE'
    // for Attachments where fileStatus === 'Uploaded' but not 'Confirmed'
    // unmount will be invoked too when submit succeeded,
    // but this.props.values will be empty after submit succeeed

    const { values } = this.props
    if (values && values.visitAttachment) {
      const { visitAttachment } = values

      const notConfirmedFiles = visitAttachment.filter(
        attachment => attachment.fileIndexFK === undefined,
      )

      notConfirmedFiles.forEach(item => {
        !item.isDeleted && deleteFileByFileID(item.id)
      })
    }
  }

  updateAttachments = ({ added, deleted }) => {
    const {
      values: { visitAttachment = [] },
      setFieldValue,
    } = this.props
    let updated = [...visitAttachment]

    if (added) updated = [...updated, ...added]

    if (deleted)
      updated = updated.reduce((attachments, item) => {
        if (
          (item.fileIndexFK !== undefined && item.fileIndexFK === deleted) ||
          (item.fileIndexFK === undefined && item.id === deleted)
        )
          return [...attachments, { ...item, isDeleted: true }]

        return [...attachments, { ...item }]
      }, [])
    setFieldValue('visitAttachment', updated)
  }
  getVisitOrderTemplateDetails = id => {
    if (!id) {
      this.setState({ currentVisitOrderTemplate: undefined })
      return
    }
    if (this.state.currentVisitOrderTemplate?.id === id) return
    this.props
      .dispatch({
        type: 'settingVisitOrderTemplate/queryOne',
        payload: {
          id: id,
        },
      })
      .then(template => {
        if (template) {
          this.setState({ currentVisitOrderTemplate: template })
        }
      })
  }

  validatePatient = () => {
    const {
      queueLog: { list = [] } = { list: [] },
      patientInfo,
      dispatch,
      handleSubmit,
      errors,
      values,
    } = this.props

    const { visitPreOrderItem = [], doctorProfileFK, visitDoctor = [] } = values
    const isUnableActualizePreOrderItemFound = visitPreOrderItem
      .filter(x => x.isDeleted !== true)
      .find(c =>
        patientInfo?.pendingPreOrderItem
          .filter(
            m =>
              m.isPreOrderItemActive === false ||
              m.isPreOrderItemOrderable === false ||
              m.isUOMChanged === true,
          )
          .find(x => x.id === c.actualizedPreOrderItemFK),
      )

    if (isUnableActualizePreOrderItemFound) {
      notification.error({
        message: 'Please remove the invalid Pre-Order item.',
      })
      return
    }
    const msg = []
    let errorMessage =
      'cannot be added in Over-The-Counter visit type. Please remove the Pre-Order item.'
    if (values.visitPurposeFK === VISIT_TYPE.OTC) {
      const isVaccinationFound =
        visitPreOrderItem?.filter(
          x =>
            x.isDeleted !== true &&
            x.preOrderItemType === preOrderItemCategory[2].value,
        ).length > 0

      const isLabFound =
        visitPreOrderItem?.filter(
          x =>
            x.isDeleted !== true &&
            x.preOrderItemType === preOrderItemCategory[4].value,
        ).length > 0

      const isRadiologyFound =
        visitPreOrderItem?.filter(
          x =>
            x.isDeleted !== true &&
            x.preOrderItemType === preOrderItemCategory[5].value,
        ).length > 0

      if (isVaccinationFound) msg.push('Vaccination')
      if (isLabFound) msg.push('Lab test')
      if (isRadiologyFound) msg.push('Radiology examination')

      if (msg.length > 0) {
        errorMessage = `${msg.join(', ')} ${errorMessage}`
      }
    }
    if (msg.length > 0) {
      notification.error({ message: errorMessage })
      return
    }

    if (
      visitDoctor.find(
        x => !x.isDeleted && x.doctorProfileFK === doctorProfileFK,
      )
    ) {
      notification.error({
        message: 'Primary doctor and reporting doctor cannot be the same.',
      })
      return
    }

    if (
      visitDoctor.filter(x => !x.isDeleted).length !==
      _.uniqBy(
        visitDoctor.filter(x => !x.isDeleted),
        'doctorProfileFK',
      ).length
    ) {
      notification.error({
        message: 'Can not select duplicate doctor.',
      })
      return
    }

    if (Object.keys(errors).length > 0) return handleSubmit()

    const alreadyRegisteredVisit = list.reduce(
      (registered, queue) =>
        !registered ? queue.patientProfileFK === patientInfo.id : registered,
      false,
    )

    if (!values.id && alreadyRegisteredVisit)
      return dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmTitle: 'Confirm Register New Visit',
          openConfirmContent:
            'This patient already registered in current session, are you sure to continue?',
          onConfirmSave: handleSubmit,
        },
      })
    return handleSubmit()
  }

  getEyeWidgets = (isReadOnly, isRetail) => {
    const { values, classes } = this.props

    const checkAccessright = authority => {
      const accessRight = Authorized.check(authority)
      if (accessRight) {
        const { rights } = accessRight
        return (rights === 'readwrite' || rights === 'enable') &&
          (isReadOnly || isRetail)
          ? 'disable'
          : rights
      }

      return undefined
    }

    return [
      {
        title: 'Visual Acuity Test',
        authority: 'queue.visitregistrationdetails.eyevisualacuity',
        content: (
          <GridItem xs={12} className={classes.row}>
            <EyeVisualAcuityCard
              handleUpdateAttachments={this.updateAttachments}
              attachments={values.visitAttachment}
            />
          </GridItem>
        ),
      },
      {
        title: 'Refraction Form',
        authority: 'queue.visitregistrationdetails.eyerefractionform',
        content: (
          <GridItem xs={12} className={classes.row}>
            <RefractionFormCard {...this.props} />
          </GridItem>
        ),
      },
    ].reduce((result, item) => {
      let right = checkAccessright(item.authority)
      if (right === 'readwrite' || right === 'enable') {
        return [...result, item]
      }

      return result
    }, [])
  }

  setBannerHeight = () => {
    const banner = document.getElementById('patientBanner')
    const bannerHeight = banner ? banner.offsetHeight : 0
    this.setState({
      bannerHeight: bannerHeight,
    })
    if (bannerHeight === 0) setTimeout(this.setBannerHeight, 1000)
  }

  onSelectPreOrder = (selectPreOrder = []) => {
    const { values, setFieldValue } = this.props
    let { visitPreOrderItem = [] } = values
    selectPreOrder.forEach(po => {
      let currentPreOrder = visitPreOrderItem.find(
        apo => apo.actualizedPreOrderItemFK === po.id,
      )
      if (currentPreOrder) {
        currentPreOrder.isDeleted = false
      } else {
        const { id, ...restPreOrderItem } = po
        visitPreOrderItem = [
          ...visitPreOrderItem,
          { ...restPreOrderItem, actualizedPreOrderItemFK: id },
        ]
      }
    })
    setFieldValue('visitPreOrderItem', [...visitPreOrderItem])
  }

  deletePreOrderItem = actualizedPreOrderItemFK => {
    const { values, setFieldValue } = this.props
    let { visitPreOrderItem = [] } = values

    var item = visitPreOrderItem.find(
      poi => poi.actualizedPreOrderItemFK === actualizedPreOrderItemFK,
    )
    if (item) {
      if (item.id) {
        item.isDeleted = true
      } else if (!item.id && item.actualizedPreOrderItemFK) {
        item.isDeleted = true
      } else {
        visitPreOrderItem = [
          ...visitPreOrderItem.filter(
            poi => poi.actualizedPreOrderItemFK !== actualizedPreOrderItemFK,
          ),
        ]
      }
    }
    setFieldValue('visitPreOrderItem', [...visitPreOrderItem])
  }

  getExtraComponent = () => {
    const { clinicSettings, patientInfo } = this.props
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          height: '100%',
          width: '90%',
        }}
      >
        {patientInfo && (
          <PrintLabLabelButton
            patientId={patientInfo.id}
            clinicSettings={clinicSettings?.settings}
            isEnableScanner
          />
        )}
      </div>
    )
  }

  render() {
    const {
      classes,
      footer,
      theme,
      queueLog: { list = [] } = { list: [] },
      loading,
      visitRegistration: {
        errorState,
        visitOrderTemplateOptions,
        expandRefractionForm,
        visitMode,
      },
      values,
      global,
      isSubmitting,
      dispatch,
      setFieldValue,
      clinicSettings,
      patientInfo,
      ctinvoiceadjustment,
      codetable,
    } = this.props

    const fromMedicalCheckupReporting =
      global.showMedicalCheckupReportingDetails || false
    const { visitPreOrderItem = [] } = values

    const vitalAccessRight = Authorized.check(
      'queue.registervisit.vitalsign',
    ) || { rights: 'hidden' }
    const vitalSignEditAccessRight =
      vitalAccessRight.rights === 'readwrite' ||
      vitalAccessRight.rights === 'enable'
    if (expandRefractionForm) {
      let div = $(this.myRef.current).find('div[aria-expanded]:eq(1)')
      if (div.attr('aria-expanded') === 'false') div.click()
    }

    const defaultActive = []
    if (expandRefractionForm) {
      defaultActive.push(1)
    }
    const height = getHeight(this.props.height)

    const existingQNo = list.reduce(
      (queueNumbers, queue) =>
        queue.visitFK === values.id
          ? [...queueNumbers]
          : [...queueNumbers, queue.queueNo],
      [],
    )
    const isReadOnly =
      !patientInfo || !patientInfo.isActive || visitMode === 'view'
    const isEdit = !!values.id
    const fetchingVisitInfo =
      loading.effects['visitRegistration/fetchVisitInfo']
    const fetchingInfoText = fetchingVisitInfo
      ? 'Loading visit info...'
      : undefined
    const loadingText = isEdit ? 'Saving visit...' : 'Registering visit...'
    const isRetail = values.visitPurposeFK === VISIT_TYPE.OTC
    const params = locationQueryParameters()
    const vis = parseInt(params.vis, 10)
    const autoRefreshChas = !(params.md === 'visreg' && vis > 0)
    let referralType = 'None'
    // Edit visit
    if (values.id) {
      if (values.referralSourceFK || values.referralPersonFK) {
        referralType = 'Company'
      } else if (values.referralPatientProfileFK) {
        referralType = 'Patient'
      }
    } else if (clinicSettings.settings.isVisitReferralSourceMandatory) {
      referralType = 'Company'
    }
    if (!values.referredBy) {
      this.props.setFieldValue('referredBy', referralType)
    }

    const draftPreOrderItem = patientInfo?.pendingPreOrderItem?.map(po => {
      const selectPreOrder = visitPreOrderItem.find(
        apo => apo.actualizedPreOrderItemFK === po.id,
      )
      if (selectPreOrder) {
        return {
          ...po,
          preOrderItemStatus: selectPreOrder.isDeleted ? 'New' : 'Actualizing',
        }
      }
      return { ...po }
    })
    const validateReportLanguage =
      values.visitPurposeFK !== VISIT_TYPE.MC ||
      values.isForInvoiceReplacement ||
      ((values.medicalCheckupWorkitem || [{}])[0].reportLanguage || []).length >
        0

    // console.log(values)
    // console.log(this.props)
    // console.log(
    //   !vitalSignEditAccessRight ||
    //     visitMode === 'view' ||
    //     values.isDoctorConsulted,
    // )
    const isBasicExaminationDisabled =
      !patientInfo || !patientInfo.isActive || visitMode === 'view'
        ? true
        : values.isDoctorConsulted
    return (
      <React.Fragment>
        <LoadingWrapper
          loading={isSubmitting || fetchingVisitInfo}
          text={!fetchingInfoText ? loadingText : fetchingInfoText}
        >
          <GridContainer className={classes.gridContainer}>
            {!fromMedicalCheckupReporting && (
              <GridItem xs sm={12} md={12}>
                <div style={{ padding: 8, marginTop: -20 }}>
                  <PatientBanner
                    from='VisitReg'
                    isReadOnly={isReadOnly}
                    onSelectPreOrder={this.onSelectPreOrder}
                    activePreOrderItems={draftPreOrderItem}
                    isRetail={isRetail}
                    // extraCmt={this.getExtraComponent}
                    {...this.props}
                  />
                </div>
              </GridItem>
            )}
            <GridItem
              container
              xs
              md={12}
              style={{
                height: !fromMedicalCheckupReporting
                  ? height - (this.state.bannerHeight || 0) - 10
                  : height - 10,
                overflow: 'scroll',
              }}
            >
              <ErrorWrapper errorState={errorState} errorKey='visitInfo'>
                <SizeContainer size='sm'>
                  <React.Fragment>
                    <Authorized.Context.Provider
                      value={{
                        rights: isReadOnly ? 'disable' : 'enable',
                      }}
                    >
                      <GridItem xs={12} className={classes.row}>
                        <VisitInfoCard
                          fromMedicalCheckupReporting={
                            fromMedicalCheckupReporting
                          }
                          isDoctorConsulted={values.isDoctorConsulted}
                          existingQNo={existingQNo}
                          visitMode={visitMode}
                          copaymentScheme={(
                            patientInfo?.patientScheme || []
                          ).filter(
                            t =>
                              [
                                SCHEME_TYPE.CORPORATE,
                                SCHEME_TYPE.INSURANCE,
                              ].indexOf(t.schemeTypeFK) >= 0,
                          )}
                          isReadOnly={isReadOnly}
                          handleUpdateAttachments={this.updateAttachments}
                          getVisitOrderTemplateDetails={
                            this.getVisitOrderTemplateDetails
                          }
                          currentVisitTemplate={
                            this.state.currentVisitOrderTemplate
                          }
                          attachments={values.visitAttachment}
                          visitType={values.visitPurposeFK}
                          visitRemarks={
                            this.props.visitRegistration?.appointment
                              ?.appointments[0]?.appointmentRemarks
                          }
                          dispatch={dispatch}
                          visitOrderTemplateOptions={visitOrderTemplateOptions}
                          {...this.props}
                        />
                      </GridItem>
                    </Authorized.Context.Provider>
                    <React.Fragment>
                      <GridItem xs={12} className={classes.row}>
                        <Authorized.Context.Provider
                          value={{
                            rights: isBasicExaminationDisabled
                              ? 'disable'
                              : 'enable',
                          }}
                        >
                          <VitalSignCard
                            {...this.props}
                            disabled={
                              !vitalSignEditAccessRight ||
                              visitMode === 'view' ||
                              values.isDoctorConsulted
                            }
                          />
                        </Authorized.Context.Provider>
                      </GridItem>
                      <GridItem xs={12} className={classes.row}>
                        <CommonCard title='Referral'>
                          <ReferralCard
                            {...this.props}
                            mode='visitregistration'
                            visitMode={visitMode}
                            disabled={isReadOnly}
                            handleUpdateAttachments={this.updateAttachments}
                            attachments={values.visitAttachment}
                            dispatch={dispatch}
                            values={values}
                            referralType={referralType}
                            setFieldValue={setFieldValue}
                          />
                        </CommonCard>
                      </GridItem>
                    </React.Fragment>
                    {!isRetail && (
                      <Authorized
                        value={{
                          rights: isReadOnly ? 'disable' : 'enable',
                        }}
                      >
                        {values.visitPurposeFK === VISIT_TYPE.MC &&
                          !values.isForInvoiceReplacement && (
                            <GridItem xs={12} className={classes.row}>
                              <CommonCard title='Medical Check Up'>
                                <MCCard
                                  {...this.props}
                                  mode='visitregistration'
                                  isDoctorConsulted={values.isDoctorConsulted}
                                  fromMedicalCheckupReporting={
                                    fromMedicalCheckupReporting
                                  }
                                  visitMode={visitMode}
                                  reportingDoctorSchema={reportingDoctorSchema}
                                  validateReportLanguage={
                                    validateReportLanguage
                                  }
                                />
                              </CommonCard>
                            </GridItem>
                          )}
                      </Authorized>
                    )}
                    <Authorized.Context.Provider
                      value={{
                        rights: isReadOnly || isRetail ? 'disable' : 'enable',
                      }}
                    >
                      {values.visitPreOrderItem &&
                        values.visitPreOrderItem?.length !== 0 && (
                          <GridItem xs={12} className={classes.row}>
                            <CommonCard title='Pre-Order Actualization'>
                              <PreOrderCard
                                isReadOnly={
                                  values.visitStatus === VISIT_STATUS.WAITING
                                    ? false
                                    : isReadOnly
                                }
                                {...this.props}
                                deletePreOrderItem={this.deletePreOrderItem}
                                dispatch={dispatch}
                              />
                            </CommonCard>
                          </GridItem>
                        )}
                      <GridItem xs={12} className={classes.row}>
                        <div ref={this.myRef}>
                          <Accordion
                            mode='multiple'
                            onChange={(event, p, expanded) => {
                              if (p.key === 1 && expanded) {
                                dispatch({
                                  type: 'visitRegistration/updateState',
                                  payload: {
                                    expandRefractionForm: false,
                                  },
                                })
                              }
                            }}
                            collapses={this.getEyeWidgets(isReadOnly, isRetail)}
                          />
                        </div>
                      </GridItem>
                    </Authorized.Context.Provider>
                  </React.Fragment>
                </SizeContainer>
              </ErrorWrapper>
            </GridItem>
          </GridContainer>
        </LoadingWrapper>
        <div style={{ position: 'relative' }}>
          {footer &&
            footer({
              confirmBtnText: isEdit ? 'Save' : 'Register Visit',
              onConfirm: this.validatePatient,
              confirmProps: {
                disabled: fromMedicalCheckupReporting
                  ? false
                  : !validateReportLanguage || visitMode === 'view',
              },
            })}
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { name: 'NewVisitModal', withTheme: true })(
  NewVisit,
)
