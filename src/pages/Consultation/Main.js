import React from 'react'
import { connect } from 'dva'
import { history } from 'umi'
import _ from 'lodash'
import numeral from 'numeral'
import moment from 'moment'
import Timer from 'react-compound-timer'
import { sendNotification } from '@/utils/realtime'
import { withStyles } from '@material-ui/core'
import TimerIcon from '@material-ui/icons/Timer'
import {
  CommonModal,
  GridContainer,
  GridItem,
  notification,
  ProgressButton,
  SizeContainer,
  withFormikExtend,
  NumberInput,
  Tooltip,
} from '@/components'
import Authorized from '@/utils/Authorized'
import PatientBanner from '@/pages/PatientDashboard/Banner'
import Warining from '@material-ui/icons/Error'

import {
  getAppendUrl,
  navigateDirtyCheck,
  commonDataReaderTransform,
} from '@/utils/utils'
import {
  cleanConsultation,
  convertToConsultation,
  convertConsultationDocument,
  isPharmacyOrderUpdated,
  getOrdersData,
} from '@/pages/Consultation/utils'
// import model from '@/pages/Widgets/Orders/models'
import {
  VISIT_TYPE,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  REPORT_ID,
} from '@/utils/constants'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { CallingQueueButton } from '@/components/_medisys'
import {
  initRoomAssignment,
  consultationDocumentTypes,
  ReportsOnSignOffOption,
} from '@/utils/codes'
import ConsumePackage from '@/pages/Widgets/Orders/Detail/ConsumePackage'
import service from '@/services/consultation'
import AutoPrintSelection from './autoPrintSelection'

// import PatientSearch from '@/pages/PatientDatabase/Search'
// import PatientDetail from '@/pages/PatientDatabase/Detail'
// import Test from './Test'
import Layout from './Layout'

import schema from './schema'
import styles from './style'
import { getDrugLabelPrintData } from '../Shared/Print/DrugLabelPrint'
import { getRawData } from '@/services/report'
import * as config from '@/utils/config'
import './Main.css'

const discardMessage = 'Discard consultation?'
const onPageLeaveMessage = 'Do you want to save consultation notes?'
const formName = 'ConsultationPage'

const generatePrintData = async (
  settings,
  consultationDocument,
  user,
  patient,
  orders,
  visitEntity,
) => {
  let documents = convertConsultationDocument(consultationDocument)
  const { autoPrintOnSignOff, autoPrintReportsOnSignOff } = settings

  if (autoPrintOnSignOff === true) {
    let reportsOnSignOff = autoPrintReportsOnSignOff.split(',')
    const {
      corMemo,
      corCertificateOfAttendance,
      corMedicalCertificate,
      corOtherDocuments,
      corReferralLetter,
      corVaccinationCert,
    } = documents
    let printData = []

    let doctor = user.data.clinicianProfile
    const doctorName = (doctor.title ? `${doctor.title} ` : '') + doctor.name
    const doctorMCRNo = doctor.doctorProfile
      ? doctor.doctorProfile.doctorMCRNo
      : ''
    const patientName = patient.entity.name
    const { patientAccountNo } = patient.entity

    let getPrintData = (type, list) => {
      if (list && list.length > 0) {
        const documentType = consultationDocumentTypes.find(
          o => o.name === type,
        )
        return list
          .filter(item => !item.isDeleted)
          .map(item => ({
            item: type,
            description: `  ${item.subject || ''}`,
            Copies: 1,
            print: true,
            ReportId: documentType.downloadConfig.id,
            ReportData: `${JSON.stringify(
              commonDataReaderTransform(
                documentType.downloadConfig.draft({
                  ...item,
                  doctorName,
                  doctorMCRNo,
                  patientName,
                  patientAccountNo,
                }),
              ),
            )}`,
          }))
      }
      return []
    }
    if (reportsOnSignOff.indexOf(ReportsOnSignOffOption.DrugLabel) > -1) {
      // const { versionNumber } = values
      // versionNumber === 1 &&
      if (orders && orders.rows) {
        const { rows = [] } = orders
        // prescriptionItems
        const prescriptionItems = rows.filter(
          f => f.type === '1' && !f.isDeleted,
        )
        let drugLabelData = await getDrugLabelPrintData(
          settings,
          patient.entity,
          visitEntity.id,
          prescriptionItems,
        )
        if (drugLabelData && drugLabelData.length > 0)
          printData = printData.concat(drugLabelData)
      }
    }
    if (reportsOnSignOff.indexOf(ReportsOnSignOffOption.Memo) > -1)
      printData = printData.concat(getPrintData('Memo', corMemo))
    if (
      reportsOnSignOff.indexOf(ReportsOnSignOffOption.MedicalCertificate) > -1
    )
      printData = printData.concat(
        getPrintData('Medical Certificate', corMedicalCertificate),
      )
    if (
      reportsOnSignOff.indexOf(ReportsOnSignOffOption.CertificateofAttendance) >
      -1
    )
      printData = printData.concat(
        getPrintData('Certificate of Attendance', corCertificateOfAttendance),
      )
    if (reportsOnSignOff.indexOf(ReportsOnSignOffOption.OtherDocuments) > -1)
      printData = printData.concat(getPrintData('Others', corOtherDocuments))
    if (reportsOnSignOff.indexOf(ReportsOnSignOffOption.ReferralLetter) > -1)
      printData = printData.concat(
        getPrintData('Referral Letter', corReferralLetter),
      )
    if (
      reportsOnSignOff.indexOf(ReportsOnSignOffOption.VaccinationCertificate) >
      -1
    )
      printData = printData.concat(
        getPrintData('Vaccination Certificate', corVaccinationCert),
      )
    if (
      reportsOnSignOff.indexOf(ReportsOnSignOffOption.PrescriptionSheet) > -1
    ) {
      const { rows = [] } = orders || {}
      if (rows.length > 0) {
        // drug & consumable (pharmacy item)
        const anyPharmacyItem = rows.some(
          f =>
            !f.isDeleted &&
            !f.isPreOrder &&
            !f.isExternalPrescription &&
            f.isDispensedByPharmacy &&
            ['1', '2'].some(x => x === f.type),
        )
        if (anyPharmacyItem)
          printData = printData.concat([
            {
              item: ReportsOnSignOffOption.PrescriptionSheet,
              description: ReportsOnSignOffOption.PrescriptionSheet,
              Copies: 1,
              print: true,
              ReportId: REPORT_ID.PRESCRIPTIONA4,
              ReportDate: null,
            },
          ])
      }
    }
    return printData
  }
  return []
}

const autoPrintSelection = async (action, props) => {
  let printData = []
  let settings = JSON.parse(localStorage.getItem('clinicSettings'))
  const { autoPrintOnSignOff } = settings
  if (autoPrintOnSignOff === true) {
    const {
      consultationDocument = {},
      orders = {},
      visitRegistration: { entity: visitEntity },
      patient,
    } = props
    printData = await generatePrintData(
      settings,
      consultationDocument,
      props.user,
      patient,
      orders,
      visitEntity,
    )
  }

  if (printData && printData.length > 0) {
    const { dispatch, handlePrint, orders = {} } = props
    const { summary } = orders
    dispatch({
      type: 'consultation/showSignOffModal',
      payload: {
        autoPrintTriggerBy: action === 'sign' ? 'sign off' : action,
        showSignOffModal: true,
        printData,
        showInvoiceAmountNegativeWarning: summary && summary.totalWithGST < 0,
        onSignOffConfirm: result => {
          saveConsultation({
            props,
            shouldPromptConfirm: false,
            action: action,
            successCallback: () => {
              dispatch({ type: `consultation/closeSignOffModal` })
              if (result && result.length > 0) {
                let printedData = result
                const token = localStorage.getItem('token')
                if (
                  printedData.some(x => x.ReportId === REPORT_ID.PRESCRIPTIONA4)
                ) {
                  const {
                    visitRegistration: {
                      entity: {
                        visit: { id: visitFK, patientProfileFK },
                      },
                    },
                  } = props
                  getRawData(REPORT_ID.PRESCRIPTIONA4, {
                    visitFK,
                    patientProfileFK,
                  }).then(r => {
                    const { getClinic } = config
                    const { systemTimeZoneInt = 0 } = getClinic() || {}
                    printedData = printedData.map(item => {
                      return {
                        ReportId: item.ReportId,
                        DocumentName:
                          item.ReportId === REPORT_ID.PRESCRIPTIONA4
                            ? item.description
                            : `${item.item}(${item.description})`,
                        ReportData:
                          item.ReportId === REPORT_ID.PRESCRIPTIONA4
                            ? JSON.stringify(
                                (delete r.ReportSettingParameter,
                                delete r.ReportContext,
                                {
                                  ...r,
                                  PatientInfo: r.PatientInfo.map(x => ({
                                    ...x,
                                    dob: moment(x.dob)
                                      .add(-systemTimeZoneInt, 'hour')
                                      .formatUTC(false),
                                    orderDate: moment(x.orderDate)
                                      .add(-systemTimeZoneInt, 'hour')
                                      .formatUTC(false),
                                    _dobIn: false,
                                    _orderDateIn: false,
                                  })),
                                  PrescriptionInfo: r.PrescriptionInfo.map(
                                    x => ({
                                      ...x,
                                      updateDate: moment(x.updateDate)
                                        .add(-systemTimeZoneInt, 'hour')
                                        .formatUTC(false),
                                      _updateDateIn: false,
                                    }),
                                  ),
                                }),
                              )
                            : item.ReportData,
                        Copies: item.Copies,
                        Token: token,
                        BaseUrl: process.env.url,
                      }
                    })
                    handlePrint(JSON.stringify(printedData))
                    dispatch({ type: 'consultation/closeModal' })
                  })
                } else {
                  printedData = printedData.map(item => ({
                    ReportId: item.ReportId,
                    DocumentName: `${item.item}(${item.description})`,
                    ReportData: item.ReportData,
                    Copies: item.Copies,
                    Token: token,
                    BaseUrl: process.env.url,
                  }))
                  handlePrint(JSON.stringify(printedData))
                  dispatch({ type: 'consultation/closeModal' })
                }
              } else {
                dispatch({ type: 'consultation/closeModal' })
              }
            },
          })
        },
      },
    })
    return true
  }
  return false
}

const saveConsultation = ({
  props,
  action,
  confirmMessage,
  successMessage,
  shouldPromptConfirm = true,
  successCallback = undefined,
}) => {
  const {
    dispatch,
    values,
    patient,
    consultationDocument = {},
    corEyeRefractionForm,
    orders = {},
    forms = {},
    user,
    clinicSettings,
    visitRegistration,
  } = props
  const { entity: vistEntity = {} } = visitRegistration
  const { visit = {} } = vistEntity
  const { visitPurposeFK = VISIT_TYPE.CON } = visit

  let settings = JSON.parse(localStorage.getItem('clinicSettings'))
  const { diagnosisDataSource } = settings

  const { isEnablePharmacyModule } = clinicSettings
  if (isEnablePharmacyModule) {
    values.isPrescriptionSheetUpdated = isPharmacyOrderUpdated(orders,true)
    values.isPharmacyOrderUpdated = isPharmacyOrderUpdated(orders)
  }

  const onConfirmSave = () => {
    const newValues = convertToConsultation(
      {
        ...values,
        corDiagnosis: [
          ...values.corDiagnosis.filter(diagnosis =>
            diagnosisDataSource !== 'Snomed'
              ? diagnosis.icD10DiagnosisFK !== undefined
              : diagnosis.diagnosisFK !== undefined,
          ),
        ],
      },
      {
        orders,
        consultationDocument,
        corEyeRefractionForm,
        forms,
      },
    )
    if (!newValues.corDoctorNote.length) {
      newValues.corDoctorNote = [{}]
    }

    newValues.corDoctorNote.forEach(note => {
      note.signedByUserFK = user.data.id
      note.signedDate = moment()
    })

    newValues.corScribbleNotes.forEach(
      note => (note.signedByUserFK = user.data.id),
    )

    newValues.duration = Math.floor(
      Number(sessionStorage.getItem(`${values.id}_consultationTimer`)) || 0,
    )
    if (!newValues.visitConsultationTemplate) {
      newValues.visitConsultationTemplate = {}
    }
    newValues.visitConsultationTemplate.consultationTemplate =
      localStorage.getItem('consultationLayout') || ''

    if (
      newValues.patientMedicalHistory &&
      !newValues.patientMedicalHistory.patientProfileFK
    ) {
      newValues.patientMedicalHistory.patientProfileFK = patient.entity.id
    }
    dispatch({
      type: `consultation/${action}`,
      payload: cleanConsultation(newValues),
    }).then(r => {
      if (r) {
        if (successMessage) {
          notification.success({
            message: successMessage,
          })
        }
        const { visitRegistration } = props
        const { entity: visit = {} } = visitRegistration
        const { id } = visit
        if (action === 'sign') {
          sendNotification('EditedConsultation', {
            type: NOTIFICATION_TYPE.CONSULTAION,
            status: NOTIFICATION_STATUS.OK,
            message: 'Completed Consultation',
            visitID: id,
          })
        }
        if (values.isPharmacyOrderUpdated) {
          const userProfile = user.data.clinicianProfile
          const userName = `${
            userProfile.title && userProfile.title.trim().length
              ? `${userProfile.title}. ${userProfile.name || ''}`
              : `${userProfile.name || ''}`
          }`
          const message = `${userName} amended prescription at ${moment().format(
            'HH:mm',
          )}`
          sendNotification('PharmacyOrderUpdate', {
            type: NOTIFICATION_TYPE.CONSULTAION,
            status: NOTIFICATION_STATUS.OK,
            message,
            visitID: id,
          })
        }

        sessionStorage.removeItem(`${values.id}_consultationTimer`)
        if (successCallback) {
          successCallback()
        }
      }
    })
  }
  if (shouldPromptConfirm)
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: confirmMessage,
        openConfirmText: 'Confirm',
        onConfirmSave,
      },
    })
  else {
    onConfirmSave()
  }
}

const discardConsultation = ({ dispatch, values, user, visitRegistration }) => {
  if (values.id) {
    dispatch({
      type: `consultation/discard`,
      payload: cleanConsultation(values),
    }).then(r => {
      if (r && values.versionNumber === 1) {
        const { entity: visit = {} } = visitRegistration
        const { id } = visit
        const userProfile = user.data.clinicianProfile
        const userName = `${
          userProfile.title && userProfile.title.trim().length
            ? `${userProfile.title}. ${userProfile.name || ''}`
            : `${userProfile.name || ''}`
        }`
        const message = `${userName} discard prescription at ${moment().format(
          'HH:mm',
        )}`
        sendNotification('PharmacyOrderDiscard', {
          type: NOTIFICATION_TYPE.CONSULTAION,
          status: NOTIFICATION_STATUS.OK,
          message,
          visitID: id,
        })
      }
    })
  } else {
    dispatch({
      type: 'consultation/discard',
    })
  }
}

const pauseConsultation = async ({
  dispatch,
  values,
  onClose,
  consultation,
  resetForm,
  patient,
  ...rest
}) => {
  const {
    consultationDocument = {},
    corEyeRefractionForm,
    orders = {},
    forms = {},
    user,
    visitRegistration,
  } = rest
  const { entity: vistEntity = {} } = visitRegistration
  const { visit = {} } = vistEntity
  const { visitPurposeFK = VISIT_TYPE.CON } = visit
  let settings = JSON.parse(localStorage.getItem('clinicSettings'))
  const { diagnosisDataSource, isEnablePharmacyModule } = settings
  if (isEnablePharmacyModule) {
    values.isPrescriptionSheetUpdated = isPharmacyOrderUpdated(orders,true)
    values.isPharmacyOrderUpdated = isPharmacyOrderUpdated(orders)
  }
  const newValues = convertToConsultation(
    {
      ...values,
      corDiagnosis: [
        ...values.corDiagnosis.filter(diagnosis =>
          diagnosisDataSource !== 'Snomed'
            ? diagnosis.icD10DiagnosisFK !== undefined
            : diagnosis.diagnosisFK !== undefined,
        ),
      ],
    },
    {
      orders,
      consultationDocument,
      corEyeRefractionForm,
      forms,
    },
  )

  if (!newValues.corDoctorNote.length) {
    newValues.corDoctorNote = [{}]
  }

  newValues.corDoctorNote.forEach(note => {
    note.signedByUserFK = user.data.id
    note.signedDate = moment()
  })

  newValues.corScribbleNotes.forEach(
    note => (note.signedByUserFK = user.data.id),
  )

  newValues.duration = Math.floor(
    Number(sessionStorage.getItem(`${values.id}_consultationTimer`)) || 0,
  )
  if (!newValues.visitConsultationTemplate) {
    newValues.visitConsultationTemplate = {}
  }
  newValues.visitConsultationTemplate.consultationTemplate =
    localStorage.getItem('consultationLayout') || ''
  if (
    newValues.patientMedicalHistory &&
    !newValues.patientMedicalHistory.patientProfileFK
  ) {
    newValues.patientMedicalHistory.patientProfileFK = patient.entity.id
  }
  if (
    !(await autoPrintSelection('pause', {
      dispatch,
      patient,
      values,
      consultation,
      ...rest,
    }))
  ) {
    dispatch({
      type: `consultation/pause`,
      payload: newValues,
    }).then(r => {
      if (r) {
        sessionStorage.removeItem(`${values.id}_consultationTimer`)
        notification.success({
          message: 'Consultation paused.',
        })
        if (values.isPharmacyOrderUpdated) {
          const { entity: visit = {} } = visitRegistration
          const { id } = visit
          const userProfile = user.data.clinicianProfile
          const userName = `${
            userProfile.title && userProfile.title.trim().length
              ? `${userProfile.title}. ${userProfile.name || ''}`
              : `${userProfile.name || ''}`
          }`
          const message = `${userName} amended prescription at ${moment().format(
            'HH:mm',
          )}`
          sendNotification('PharmacyOrderUpdate', {
            type: NOTIFICATION_TYPE.CONSULTAION,
            status: NOTIFICATION_STATUS.OK,
            message,
            visitID: id,
          })
        }
        dispatch({ type: 'consultation/closeModal' })
      }
    })
  }
}

const saveDraftDoctorNote = ({ values, visitRegistration }) => {
  const { corDoctorNote = [] } = values
  const { entity: visit = {} } = visitRegistration
  const { id } = visit
  const payload = {
    ...(corDoctorNote.length ? corDoctorNote[0] : {}),
    visitFK: id,
    clinicalObjectRecordFK: values.id,
  }
  service.saveDraftDoctorNote(payload)
}

// @skeleton()
@connect(
  ({
    clinicInfo,
    consultation,
    global,
    consultationDocument,
    orders,
    visitRegistration,
    formik,
    cestemplate,
    clinicSettings,
    user,
    patient,
    forms,
    codetable,
  }) => ({
    clinicInfo,
    consultation,
    global,
    consultationDocument,
    orders,
    visitRegistration,
    formik,
    cestemplate,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
    user,
    patient,
    forms,
    codetable,
  }),
)
@withFormikExtend({
  authority: [
    'patientdashboard.startresumeconsultation',
    'patientdashboard.editconsultation',
  ],
  mapPropsToValues: ({ consultation = {}, visitRegistration }) => {
    if (
      window.g_app._store.getState().global.isShowSecondConfirmButton ===
        undefined &&
      visitRegistration &&
      visitRegistration.entity
    ) {
      if (
        visitRegistration.entity.visit.visitStatus &&
        visitRegistration.entity.visit.visitStatus !== VISIT_STATUS.IN_CONS &&
        visitRegistration.entity.visit.visitStatus !== VISIT_STATUS.WAITING
      ) {
        window.g_app._store.dispatch({
          type: 'global/updateAppState',
          payload: {
            isShowSecondConfirmButton: false,
            secondConfirmMessage: discardMessage,
          },
        })
      } else {
        window.g_app._store.dispatch({
          type: 'global/updateAppState',
          payload: {
            isShowSecondConfirmButton: true,
            secondConfirmMessage: 'Do you want to save consultation notes?',
          },
        })
      }
    }
    return consultation.entity || consultation.default
  },
  validationSchema: schema,
  enableReinitialize: false,
  onSecondConfirm: pauseConsultation,
  secondConfirmText: 'Pause',
  confirmText: 'Discard',
  dirtyCheckMessage: onPageLeaveMessage,
  notDirtyDuration: 0, // this page should alwasy show warning message when leave
  onDirtyDiscard: discardConsultation,
  handleSubmit: async (values, { props }) => {
    const { dispatch, handlePrint, orders = {}, clinicSettings } = props
    const { summary } = orders
    const { isEnablePharmacyModule } = clinicSettings
    if (isEnablePharmacyModule) {
    values.isPrescriptionSheetUpdated = isPharmacyOrderUpdated(orders,true)
    values.isPharmacyOrderUpdated = isPharmacyOrderUpdated(orders)
    }
    if (!(await autoPrintSelection('sign', { values, ...props }))) {
      saveConsultation({
        props: {
          values,
          ...props,
        },
        confirmMessage:
          summary && summary.totalWithGST < 0
            ? () => {
                return (
                  <div>
                    <h3>Total invoice amount is negative.</h3>
                    <h3 style={{ marginTop: 0 }}>
                      Confirm sign off current consultation?
                    </h3>
                  </div>
                )
              }
            : 'Confirm sign off current consultation?',
        successMessage: 'Consultation signed',
        action: 'sign',
        successCallback: () => {
          props.dispatch({ type: 'consultation/closeModal' })
        },
      })
    }
  },
  displayName: formName,
})
class Main extends React.Component {
  state = {
    recording: true,
    patientBannerHeight: 0,
  }

  constructor(props) {
    super(props)
    this.fetchCodeTables()
  }
  componentDidMount() {
    setTimeout(() => {
      this.props.setFieldValue('fakeField', 'setdirty')
    }, 500)

    const {
      consultation,
      dispatch,
      clinicSettings: {
        autoSaveClinicNoteInterval = 60,
        isEnableAutoSaveClinicNote = false,
      },
    } = this.props
    if (isEnableAutoSaveClinicNote) {
      this.interval = setInterval(() => {
        saveDraftDoctorNote(this.props)
      }, autoSaveClinicNoteInterval * 1000)
    }
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'consultation/updateState',
      payload: {
        entity: undefined,
      },
    })
    this.props.dispatch({
      type: 'visitRegistration/updateState',
      payload: {
        entity: undefined,
      },
    })
    this.props.dispatch({
      type: 'global/updateAppState',
      payload: {
        isShowSecondConfirmButton: undefined,
        secondConfirmMessage: undefined,
      },
    })

    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  fetchCodeTables = async () => {
    this.props.dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
      },
    })
    this.props.dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'inventoryconsumable' },
    })
    await this.props.dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'userpreference' },
    })
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    if (nextProps.consultation.patientMedicalHistory) {
      const { setFieldValue } = nextProps
      setFieldValue('patientMedicalHistory', {
        ...nextProps.consultation.patientMedicalHistory,
      })
      nextProps.dispatch({
        type: 'consultation/updateState',
        payload: {
          patientMedicalHistory: undefined,
        },
      })
    }
    if (nextProps.values.id !== this.props.values.id) return true
    if (nextProps.consultation.version !== this.props.consultation.version)
      return true
    if (
      nextProps.consultation.showSignOffModal !==
      this.props.consultation.showSignOffModal
    )
      return true
    if (
      nextProps.visitRegistration &&
      nextProps.visitRegistration.version !==
        this.props.visitRegistration.version
    )
      return true
    if (
      nextProps.visitRegistration &&
      nextProps.visitRegistration.entity &&
      nextProps.visitRegistration.entity.id !==
        this.props.visitRegistration?.entity?.id
    )
      return true
    if (
      nextProps.orders.summary.totalWithGST !==
      this.props.orders.summary.totalWithGST
    )
      return true
    if (
      nextProps.orders.summary.totalWithGST !==
      this.props.orders.summary.totalWithGST
    )
      return true
    if (
      nextProps.orders.summary.totalWithGST !==
      this.props.orders.summary.totalWithGST
    )
      return true

    if (
      nextProps.consultation.haveMultiplePendingPackages !==
      this.props.consultation.haveMultiplePendingPackages
    ) {
      return true
    }

    if (nextState.patientBannerHeight !== this.state.patientBannerHeight) {
      return true
    }
    return false
  }

  showInvoiceAdjustment = () => {
    const { theme, ...resetProps } = this.props
    this.props.dispatch({
      type: 'global/updateState',
      payload: {
        openAdjustment: true,
        openAdjustmentConfig: {
          showRemark: true,
          defaultValues: {
            initialAmout: 150,
          },
        },
      },
    })
  }

  setPatientBannerHeight = () => {
    setTimeout(() => {
      let patientBannerHeight =
        document.getElementById('patientBanner').offsetHeight || 0
      this.setState({ patientBannerHeight })
    })
  }
  pauseConsultation = async () => {
    const { validateForm, handleSubmit } = this.props
    const isFormValid = await validateForm()
    if (!_.isEmpty(isFormValid)) {
      handleSubmit()
    } else if (!(await autoPrintSelection('pause', this.props))) {
      saveConsultation({
        props: this.props,
        confirmMessage: 'Pause consultation?',
        successMessage: 'Consultation paused.',
        action: 'pause',
        successCallback: () => {
          this.props.dispatch({ type: 'consultation/closeModal' })
        },
      })
    }
  }
  resumeConsultation = () => {
    const {
      dispatch,
      values,
      consultation,
      resetForm,
      user,
      visitRegistration,
    } = this.props
    dispatch({
      type: 'consultation/resume',
      payload: {
        id: visitRegistration.entity.visit.id,
        // version: Date.now(),
      },
    }).then(r => {
      if (r) {
        notification.success({
          message: 'Consultation resumed',
        })
        resetForm(r)
        history.push(
          getAppendUrl({
            v: Date.now(),
          }),
        )
      }
    })
  }

  signOffAndCompleteBilling = () => {
    const { visitRegistration, dispatch, values, orders } = this.props
    const { entity: vistEntity = {} } = visitRegistration
    const { visit = {} } = vistEntity
    const { id: visitId } = visit
    const { summary } = orders
    if (summary && summary.totalWithGST < 0) {
      window.g_app._store.dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          isInformType: true,
          customWidth: 'md',
          openConfirmContent: () => {
            return (
              <div>
                <Warining
                  style={{
                    width: '1.3rem',
                    height: '1.3rem',
                    marginLeft: '10px',
                    color: 'red',
                  }}
                />
                <h3 style={{ marginLeft: '10px', display: 'inline-block' }}>
                  Unable to complete visit, total amount cannot be{' '}
                  <span style={{ fontWeight: 400 }}>negative</span>.
                </h3>
              </div>
            )
          },
          openConfirmText: 'OK',
          onConfirmClose: () => {
            window.g_app._store.dispatch({
              type: 'global/updateAppState',
              payload: {
                customWidth: undefined,
              },
            })
          },
        },
      })
      return
    }
    const successCallback = () => {
      dispatch({ type: 'consultation/closeModal' })
      dispatch({
        type: 'consultation/completeBillFirstOrder',
        payload: {
          id: visitId,
        },
      })
    }
    saveConsultation({
      props: {
        values,
        ...this.props,
      },
      successMessage: 'Consultation signed',
      shouldPromptConfirm: false,
      action: 'sign',
      successCallback,
    })
  }

  signOffOnly = () => {
    const { values } = this.props
    saveConsultation({
      props: {
        ...this.props,
        values,
      },
      successMessage: 'Consultation signed',
      shouldPromptConfirm: false,
      action: 'sign',
      successCallback: () => {
        dispatch({ type: 'consultation/closeModal' })
      },
    })
  }

  handleSignOffClick = async () => {
    const {
      visitRegistration,
      orders,
      dispatch,
      handleSubmit,
      values,
      forms,
      validateForm,
    } = this.props
    const isFormValid = await validateForm()
    if (!_.isEmpty(isFormValid)) {
      handleSubmit()
    } else {
      const { rows, _originalRows } = orders
      const { entity: vistEntity = {} } = visitRegistration
      const { visit = {} } = vistEntity
      const {
        visitPurposeFK = VISIT_TYPE.CON,
        visitStatus = VISIT_STATUS.DISPENSE,
      } = visit

      const isModifiedOrder = _.isEqual(
        rows.filter(i => !(i.id === undefined && i.isDeleted)),
        _originalRows,
      )
      if (forms.rows.filter(o => o.statusFK === 1 && !o.isDeleted).length > 0) {
        notification.warning({
          message: `Draft forms found, please finalize it before sign off.`,
        })
        return
      }

      if (
        (visitPurposeFK === VISIT_TYPE.BF ||
          visitPurposeFK === VISIT_TYPE.MC) &&
        visitStatus === VISIT_STATUS.BILLING &&
        isModifiedOrder
      ) {
        dispatch({
          type: 'global/updateState',
          payload: {
            showCustomConfirm: true,
            customConfirmCfg: {
              title: 'Confirm',
              content: 'Do you want to complete the visit?',
              actions: [
                {
                  text: 'Cancel',
                  color: 'danger',
                  onClick: () => {
                    // do nothing
                  },
                },
                {
                  text: 'No',
                  color: 'danger',
                  onClick: this.signOffOnly,
                },
                {
                  text: 'Yes',
                  color: 'primary',
                  onClick: this.signOffAndCompleteBilling,
                },
              ],
            },
          },
        })
      } else {
        handleSubmit()
      }
    }
  }

  // discardConsultation =

  getExtraComponent = () => {
    const {
      theme,
      classes,
      values,
      orders = {},
      visitRegistration,
      clinicSettings,
      patient,
    } = this.props
    const { entity: vistEntity = {} } = visitRegistration
    // if (!vistEntity) return null
    const { visit = {}, queueNo } = vistEntity
    const { summary } = orders
    const patientName = patient?.entity?.name
    // const { adjustments, total, gst, totalWithGst } = summary

    return (
      <SizeContainer size='sm'>
        <div
          style={{
            textAlign: 'center',
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            height: '100%',
          }}
        >
          <GridContainer
            // className={classes.actionPanel}
            direction='column'
            justify='space-evenly'
            alignItems='center'
          >
            <Authorized authority='patientdashboard.startresumeconsultation'>
              {({ rights }) => {
                //
                return rights === 'enable' &&
                  [VISIT_STATUS.IN_CONS, VISIT_STATUS.WAITING].includes(
                    visit.visitStatus,
                  ) &&
                  values.id ? (
                  <GridItem>
                    <h5
                      style={{
                        marginTop: -3,
                        fontWeight: 'bold',
                      }}
                    >
                      <Timer
                        initialTime={
                          Number(
                            sessionStorage.getItem(
                              `${values.id}_consultationTimer`,
                            ),
                          ) ||
                          values.duration ||
                          0
                        }
                        direction='forward'
                        startImmediately={this.state.recording}
                      >
                        {({
                          start,
                          resume,
                          pause,
                          stop,
                          reset,
                          getTimerState,
                          getTime,
                        }) => {
                          sessionStorage.setItem(
                            `${values.id}_consultationTimer`,
                            getTime(),
                          )
                          return (
                            <React.Fragment>
                              <TimerIcon
                                style={{
                                  height: 17,
                                  top: 2,
                                  left: -5,
                                  position: 'relative',
                                }}
                              />
                              <Timer.Hours
                                formatValue={value =>
                                  `${numeral(value).format('00')} : `
                                }
                              />
                              <Timer.Minutes
                                formatValue={value =>
                                  `${numeral(value).format('00')} : `
                                }
                              />
                              <Timer.Seconds
                                formatValue={value =>
                                  `${numeral(value).format('00')}`
                                }
                              />
                            </React.Fragment>
                          )
                        }}
                      </Timer>
                    </h5>
                  </GridItem>
                ) : null
              }}
            </Authorized>
            {clinicSettings.showTotalInvoiceAmtInConsultation ? (
              <GridItem>
                <h4
                  style={{
                    position: 'relative',
                    marginTop: 0,
                  }}
                >
                  Total Invoice
                  {summary && (
                    <span>
                      &nbsp;:&nbsp;
                      <NumberInput text currency value={summary.totalWithGST} />
                      {summary.totalWithGST < 0 ? (
                        <Tooltip
                          title='Total invoice amount is negative.'
                          placement='bottom-start'
                        >
                          <span>
                            <Warining
                              style={{
                                position: 'absolute',
                                top: '2px',
                                width: '1.3rem',
                                height: '1.3rem',
                                color: '#faad14',
                              }}
                            />
                          </span>
                        </Tooltip>
                      ) : (
                        undefined
                      )}
                    </span>
                  )}
                </h4>
              </GridItem>
            ) : null}
            <GridItem style={{ display: 'flex' }}>
              <Authorized authority='openqueuedisplay'>
                <div style={{ marginRight: 10 }}>
                  <CallingQueueButton
                    qId={queueNo}
                    patientName={patientName}
                    from='Queue'
                  />
                </div>
              </Authorized>
              {values.status !== 'PAUSED' && (
                <ProgressButton
                  color='danger'
                  onClick={navigateDirtyCheck({
                    displayName: formName,
                    confirmText: 'Confirm',
                    redirectUrl: '/reception/queue',
                    showSecondConfirmButton: false,
                    openConfirmContent: discardMessage,
                  })}
                  icon={null}
                >
                  Discard
                </ProgressButton>
              )}
              <Authorized authority='patientdashboard.startresumeconsultation'>
                <React.Fragment>
                  {[VISIT_STATUS.IN_CONS, VISIT_STATUS.WAITING].includes(
                    visit.visitStatus,
                  ) && (
                    <ProgressButton
                      onClick={this.pauseConsultation}
                      color='info'
                      icon={null}
                    >
                      Pause
                    </ProgressButton>
                  )}
                  {visit.visitStatus === VISIT_STATUS.PAUSED && (
                    <ProgressButton
                      onClick={this.resumeConsultation}
                      color='info'
                      icon={null}
                    >
                      Resume
                    </ProgressButton>
                  )}
                </React.Fragment>
              </Authorized>

              <ProgressButton
                color='primary'
                onClick={this.handleSignOffClick}
                icon={null}
              >
                Sign Off
              </ProgressButton>
            </GridItem>
          </GridContainer>
        </div>
      </SizeContainer>
    )
  }

  saveLayout = layout => {
    this.props
      .dispatch({
        type: 'consultation/saveLayout',
        payload: layout,
      })
      .then(o => {
        if (o)
          notification.success({
            message: 'Favourite widget layout saved successfully.',
          })
      })
  }

  saveFavouriteDiagnognosisLanguage = () => {
    const { consultation } = this.props
    this.props
      .dispatch({
        type: 'consultation/saveUserPreference',
        payload: {
          userPreferenceDetails: {
            value: consultation.favouriteDiagnosisLanguage,
            Identifier: 'FavouriteDiagnosisLanguage',
          },
          itemIdentifier: 'FavouriteDiagnosisLanguage',
          type: '8',
        },
      })
      .then(
        o => {
          if (o) {
            this.props.dispatch({
              type: 'diagnosis/updateState',
              payload: {
                favouriteDiagnosisLanguage:
                  consultation.favouriteDiagnosisLanguage,
              },
            })
          }
        },
        notification.success({
          message: 'Favourite widget layout saved successfully.',
        }),
      )
  }

  loadTemplate = v => {
    const exist = this.props.values
    const { consultationDocument = {}, orders = {}, forms = {} } = this.props
    const mergeArrayProps = [
      'corCertificateOfAttendance',
      'corConsumable',
      'corDiagnosis',
      'corMedicalCertificate',
      'corMemo',
      'corOrderAdjustment',
      'corOtherDocuments',
      'corPrescriptionItem',
      'corReferralLetter',
      'corService',
      'corVaccinationCert',
      'corVaccinationItem',
    ]
    const currentValue = convertToConsultation(exist, {
      orders,
      consultationDocument,
      forms,
    })
    exist.isGstInclusive = currentValue.isGSTInclusive
    mergeArrayProps.forEach(p => {
      exist[p] = [...currentValue[p], ...v[p]]
    })
    if (v.corDoctorNote && v.corDoctorNote.length > 0) {
      if (exist.corDoctorNote && exist.corDoctorNote.length > 0) {
        const {
          chiefComplaints = '',
          clinicianNote = '',
          plan = '',
        } = exist.corDoctorNote[0]

        if (chiefComplaints)
          exist.corDoctorNote[0].chiefComplaints = `${chiefComplaints}<br/>${v.corDoctorNote[0].chiefComplaints}`
        else
          exist.corDoctorNote[0].chiefComplaints =
            v.corDoctorNote[0].chiefComplaints

        if (clinicianNote)
          exist.corDoctorNote[0].clinicianNote = `${clinicianNote}<br/>${v.corDoctorNote[0].clinicianNote}`
        else
          exist.corDoctorNote[0].clinicianNote =
            v.corDoctorNote[0].clinicianNote

        if (plan)
          exist.corDoctorNote[0].plan = `${plan}<br/>${v.corDoctorNote[0].plan}`
        else exist.corDoctorNote[0].plan = v.corDoctorNote[0].plan
      } else {
        exist.corDoctorNote = [...v.corDoctorNote]
      }
    }
    this.props.dispatch({
      type: 'consultation/updateState',
      payload: {
        entity: exist,
        version: Date.now(),
      },
    })
    this.props.dispatch({
      type: 'consultation/queryDone',
      payload: {
        data: exist,
      },
    })
  }

  saveTemplate = () => {
    const { dispatch, orders, consultationDocument, values, forms } = this.props
    dispatch({
      type: 'consultation/updateState',
      payload: {
        entity: convertToConsultation(values, {
          orders,
          consultationDocument,
          forms,
        }),
      },
    })
  }

  onCloseSignOffModal = () => {
    this.props.dispatch({ type: `consultation/closeSignOffModal` })
  }

  closePackageSelectModal = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'consultation/updateState',
      payload: {
        haveMultiplePendingPackages: false,
      },
    })
  }

  onSelectPreOrder = (selectPreOrder = []) => {
    const {
      orders,
      dispatch,
      codetable,
      visitRegistration,
      patient,
      user,
      clinicSettings,
    } = this.props

    dispatch({
      type: 'orders/upsertRows',
      payload: getOrdersData({
        selectPreOrder,
        orders,
        codetable,
        visitRegistration,
        patient,
        user,
        clinicSettings,
      }),
    })
  }

  render() {
    const {
      props,
      state: { patientBannerHeight },
    } = this
    const {
      classes,
      theme,
      dispatch,
      values,
      visitRegistration,
      consultation = {},
      orders = {},
      formik,
      rights,
      disabled,
      patient,
      ...resetProps
    } = this.props

    const {
      entity,
      showSignOffModal,
      printData,
      showInvoiceAmountNegativeWarning,
      onSignOffConfirm,
      autoPrintTriggerBy,
    } = consultation
    const { entity: vistEntity = {} } = visitRegistration
    // if (!vistEntity) return null
    const { visit = {} } = vistEntity
    // const { summary } = orders
    // const { adjustments, total, gst, totalWithGst } = summary
    const matches = {
      rights:
        rights === 'enable' && visit.visitStatus === VISIT_STATUS.PAUSED
          ? 'disable'
          : rights,
    }
    const { rows } = orders
    const draftPreOrderItem = patient?.entity?.pendingPreOrderItem?.map(po => {
      const selectPreOrder = rows.find(
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

    return (
      <div className={classes.root} id='ConsultationMainContainer'>
        <PatientBanner
          from='Consultation'
          onSelectPreOrder={this.onSelectPreOrder}
          setPatientBannerHeight={this.setPatientBannerHeight}
          activePreOrderItems={draftPreOrderItem}
          extraCmt={this.getExtraComponent}
          {...this.props}
        />
        <Authorized.Context.Provider value={matches}>
          <Layout
            {...this.props}
            rights={matches.rights}
            patientBannerHeight={patientBannerHeight}
            onSaveLayout={this.saveLayout}
            onLoadTemplate={this.loadTemplate}
            onSaveTemplate={this.saveTemplate}
            onSaveFavouriteDiagnosisLanguage={
              this.saveFavouriteDiagnognosisLanguage
            }
            userDefaultLayout={values.visitConsultationTemplate}
          />
        </Authorized.Context.Provider>
        <CommonModal
          cancelText='Cancel'
          maxWidth='sm'
          title={`Confirm ${autoPrintTriggerBy} current consultation?`}
          onClose={this.onCloseSignOffModal}
          open={showSignOffModal}
        >
          <AutoPrintSelection
            data={printData}
            showInvoiceAmountNegativeWarning={showInvoiceAmountNegativeWarning}
            handleSubmit={onSignOffConfirm}
            triggerBy={autoPrintTriggerBy}
          />
        </CommonModal>

        <CommonModal
          cancelText='Cancel'
          maxWidth='lg'
          title='Package Details'
          onClose={this.closePackageSelectModal}
          onConfirm={this.closePackageSelectModal}
          open={consultation.haveMultiplePendingPackages || false}
          overrideLoading
        >
          <ConsumePackage {...this.props} />
        </CommonModal>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Main)
