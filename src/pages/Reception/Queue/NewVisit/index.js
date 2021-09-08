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
} from '@/components'
// medisys-components
import { ErrorWrapper, LoadingWrapper } from '@/components/_medisys'
// Sub-components
import PatientBanner from '@/pages/PatientDashboard/Banner'
import { deleteFileByFileID } from '@/services/file'
import { VISIT_TYPE } from '@/utils/constants'
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
import VisitValidationSchema from './validationScheme'
import FormFieldName from './formField'
// services
// misc utils
import { formikMapPropsToValues, formikHandleSubmit } from './miscUtils'
import { VISIT_STATUS } from '../variables'
import PreOrderCard from './PreOrderCard'

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

  const modalMargin = 64
  const footerAndHeaderHeight = 95
  return propsHeight - footerAndHeaderHeight - modalMargin
}

@connect(
  ({
    clinicSettings,
    clinicInfo,
    queueLog,
    loading,
    visitRegistration,
    patient,
    codetable,
  }) => ({
    clinicSettings,
    clinicInfo,
    queueLog,
    loading,
    visitRegistration,
    patientInfo: patient.entity || {},
    doctorProfiles: codetable.doctorprofile,
    ctinvoiceadjustment: codetable.ctinvoiceadjustment,
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
  }

  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  componentDidMount = async () => {
    const { dispatch } = this.props
    const response = await dispatch({
      type: 'visitRegistration/getVisitOrderTemplateList',
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
    this.setState({ hasActiveSession: data.length > 0 })
    await this.getCodeTables()
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

  calculateBMI = () => {
    const { heightCM, weightKG } = this.props.values

    const { setFieldValue, setFieldTouched } = this.props
    if (heightCM && weightKG) {
      const heightM = heightCM / 100
      const bmi = weightKG / heightM ** 2
      const bmiInTwoDecimal = Math.round(bmi * 100) / 100
      setFieldValue(FormFieldName['vitalsign.bmi'], bmiInTwoDecimal)
    } else {
      setFieldValue(FormFieldName['vitalsign.bmi'], null)
    }
    setFieldTouched(FormFieldName['vitalsign.bmi'], true)
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

  validatePatient = () => {
    const {
      queueLog: { list = [] } = { list: [] },
      patientInfo,
      dispatch,
      handleSubmit,
      errors,
      values,
    } = this.props

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
        visitPreOrderItem = [...visitPreOrderItem, { ...restPreOrderItem, actualizedPreOrderItemFK: id }]
      }
    })
    setFieldValue('visitPreOrderItem', [...visitPreOrderItem])
  }

  deletePreOrderItem = (actualizedPreOrderItemFK) => {
    const { values, setFieldValue } = this.props
    let { visitPreOrderItem = [] } = values

    var item = visitPreOrderItem.find(poi => poi.actualizedPreOrderItemFK === actualizedPreOrderItemFK)
    if (item) {
      if (item.id) {
        item.isDeleted = true
      }
      else {
        visitPreOrderItem = [...visitPreOrderItem.filter(poi => poi.actualizedPreOrderItemFK !== actualizedPreOrderItemFK)]
      }
    }
    setFieldValue("visitPreOrderItem", [...visitPreOrderItem])
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
      },
      values,
      isSubmitting,
      dispatch,
      setFieldValue,
      clinicSettings,
      patientInfo,
      ctinvoiceadjustment,
      codetable,
    } = this.props

    const { visitPreOrderItem = [] } = values

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
      (values.visitStatus !== VISIT_STATUS.WAITING &&
        values.visitStatus !== VISIT_STATUS.UPCOMING_APPT) ||
      !patientInfo ||
      !patientInfo.isActive
    const isReadonlyAfterSigned =
      clinicSettings.settings.isVisitEditableAfterEndConsultation &&
      values.isLastClinicalObjectRecordSigned
        ? false
        : isReadOnly
    const isEdit = !!values.id
    const fetchingVisitInfo =
      loading.effects['visitRegistration/fetchVisitInfo']
    const fetchingInfoText = fetchingVisitInfo
      ? 'Loading visit info...'
      : undefined
    const loadingText = isEdit ? 'Saving visit...' : 'Registering visit...'
    const isRetail = values.visitPurposeFK === VISIT_TYPE.RETAIL
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

    const draftPreOrderItem = patientInfo?.pendingPreOrderItem
      ?.filter(item => !item.isDeleted)
      .map(po => {
        const selectPreOrder = visitPreOrderItem.find(
          apo => !apo.isDeleted && apo.actualizedPreOrderItemFK === po.id,
        )
        if (selectPreOrder) {
          return {
            ...po,
            preOrderItemStatus: selectPreOrder.isDeleted
              ? 'New'
              : 'Actualizing',
          }
        }
        return { ...po }
      })

    return (
      <React.Fragment>
        <LoadingWrapper
          loading={isSubmitting || fetchingVisitInfo}
          text={!fetchingInfoText ? loadingText : fetchingInfoText}
        >
          {/* <Chip label='Read Only' className={classes.readOnlyChip} /> */}
          <GridContainer className={classes.gridContainer}>
            <GridItem xs sm={12} md={12}>
              <div style={{ padding: 8, marginTop: -20 }}>
                <PatientBanner
                  from='VisitReg'
                  onSelectPreOrder={this.onSelectPreOrder}
                  activePreOrderItem={draftPreOrderItem}
                  extraCmt={
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
                  }
                  {...this.props}
                />
              </div>
            </GridItem>
            <GridItem
              container
              xs
              md={12}
              style={{
                height: height - (this.state.bannerHeight || 0) - 50,
                overflow: 'auto',
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
                          // isReadOnly={isReadOnly}
                          isVisitReadonlyAfterSigned={isReadonlyAfterSigned}
                          isSigned={values.isLastClinicalObjectRecordSigned}
                          existingQNo={existingQNo}
                          copaymentScheme={(
                            patientInfo?.patientScheme || []
                          ).filter(t => t.schemeTypeFK === 15)}
                          handleUpdateAttachments={this.updateAttachments}
                          attachments={values.visitAttachment}
                          visitType={values.visitPurposeFK}
                          dispatch={dispatch}
                          visitOrderTemplateOptions={visitOrderTemplateOptions}
                          {...this.props}
                        />
                      </GridItem>
                    </Authorized.Context.Provider>
                    <Authorized.Context.Provider
                      value={{
                        rights:
                          (isReadOnly || isRetail) && isReadonlyAfterSigned
                            ? 'disable'
                            : 'enable',
                      }}
                    >
                      <React.Fragment>
                        <Authorized authority='queue.registervisit.vitalsign'>
                          {({ rights: vitalAccessRight }) => (
                            <Authorized.Context.Provider
                              value={{
                                rights:
                                  (vitalAccessRight === 'readwrite' ||
                                    vitalAccessRight === 'enable') &&
                                  isReadonlyAfterSigned
                                    ? 'disable'
                                    : vitalAccessRight,
                              }}
                            >
                              <GridItem xs={12} className={classes.row}>
                                <VitalSignCard
                                  // isReadOnly={isReadOnly}
                                  handleCalculateBMI={this.calculateBMI}
                                />
                              </GridItem>
                            </Authorized.Context.Provider>
                          )}
                        </Authorized>
                        <GridItem xs={12} className={classes.row}>
                          <CommonCard title='Referral'>
                            <ReferralCard
                              {...this.props}
                              mode='visitregistration'
                              isVisitReadonlyAfterSigned={isReadonlyAfterSigned}
                              isSigned={values.isLastClinicalObjectRecordSigned}
                              handleUpdateAttachments={this.updateAttachments}
                              attachments={values.visitAttachment}
                              dispatch={dispatch}
                              values={values}
                              referralType={referralType}
                              setFieldValue={setFieldValue}
                            />
                          </CommonCard>
                        </GridItem>
                        {values.visitPreOrderItem?.length !== 0 && (
                          <GridItem xs={12} className={classes.row}>
                            <CommonCard title='Pre-Order Actualization'>
                              <PreOrderCard
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
                                    payload: { expandRefractionForm: false },
                                  })
                                }
                              }}
                              collapses={this.getEyeWidgets(
                                isReadOnly,
                                isRetail,
                              )}
                            />
                          </div>
                        </GridItem>
                      </React.Fragment>
                    </Authorized.Context.Provider>
                  </React.Fragment>
                </SizeContainer>
              </ErrorWrapper>
              {/*
                <GridItem xs={12} container>
                  <GridItem xs={12} className={classes.cardContent}>
                    <ParticipantCard />
                  </GridItem>
                </GridItem>
              */}
            </GridItem>
          </GridContainer>
        </LoadingWrapper>
        <div style={{ position: 'relative' }}>
          {footer &&
            footer({
              confirmBtnText: isEdit ? 'Save' : 'Register visit',
              onConfirm: this.validatePatient,
              confirmProps: {
                disabled: isReadonlyAfterSigned || !this.state.hasActiveSession,
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
