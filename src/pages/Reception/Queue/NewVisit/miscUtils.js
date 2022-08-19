import { sendQueueNotification } from '@/pages/Reception/Queue/utils'
import { bool } from 'prop-types'
import _ from 'lodash'
import { cleanFields } from '@/pages/Consultation/utils'
import {
  VISIT_TYPE,
  VISITDOCTOR_CONSULTATIONSTATUS,
  MEDICALCHECKUP_WORKITEM_STATUS,
} from '@/utils/constants'
import { visitOrderTemplateItemTypes } from '@/utils/codes'
import { notification } from '@/components'
import { VISIT_STATUS } from '../variables'
import { roundTo } from '@/utils/utils'

const filterDeletedFiles = item => {
  // filter out not yet confirmed files
  // fileIndexFK ===
  if (item.fileIndexFK === undefined && item.isDeleted) return false
  return true
}

const mapAttachmentToUploadInput = (
  {
    fileIndexFK,
    fileName,
    attachmentType,
    attachmentTypeFK,
    isDeleted,
    thumbnail,
    ...rest
  },
  index,
) =>
  !fileIndexFK
    ? {
        // file status === uploaded, only 4 info needed for API
        fileIndexFK: rest.id,
        thumbnailIndexFK: thumbnail ? thumbnail.id : undefined,
        sortOrder: index,
        fileName,
        attachmentType,
        attachmentTypeFK,
        isDeleted,
        remarks: rest.remarks,
      }
    : {
        // file status === confirmed, need to provide full object for API
        ...rest,
        fileIndexFK,
        thumbnailIndexFK: thumbnail ? thumbnail.id : undefined,
        fileName,
        attachmentType,
        attachmentTypeFK,
        isDeleted,
        sortOrder: index,
      }

const convertEyeForms = values => {
  let { visitEyeRefractionForm = {}, visitEyeVisualAcuityTest } = values
  const durtyFields = [
    'isDeleted',
    'isNew',
    'IsSelected',
    'rowIndex',
    '_errors',
  ]
  if (
    visitEyeRefractionForm.formData &&
    typeof visitEyeRefractionForm.formData === 'object'
  ) {
    let { formData } = visitEyeRefractionForm
    cleanFields(formData, [...durtyFields, 'OD', 'OS'])

    values.visitEyeRefractionForm.formData = _.isEmpty(formData)
      ? undefined
      : JSON.stringify(formData)
  }
  if (typeof visitEyeVisualAcuityTest === 'object') {
    const { visitEyeVisualAcuityTestForm: testForm } = visitEyeVisualAcuityTest
    const clone = _.cloneDeep(testForm)
    cleanFields(clone, durtyFields)

    const newTestForm = testForm.reduce((p, c) => {
      let newItem = clone.find(i => i.id === c.id)
      if (!newItem) {
        if (c.id > 0 && c.concurrencyToken && c.isDeleted === false) {
          return [
            ...p,
            {
              ...c,
              isDeleted: true,
            },
          ]
        }
      } else {
        return [
          ...p,
          {
            ...newItem,
            isDeleted: c.isDeleted,
          },
        ]
      }

      return p
    }, [])
    values.visitEyeVisualAcuityTest.visitEyeVisualAcuityTestForm = newTestForm
  }

  return values
}

const getVisitOrderTemplateTotal = (vType, template) => {
  let activeItemTotal = 0
  visitOrderTemplateItemTypes.forEach(type => {
    if (vType === VISIT_TYPE.OTC && type.id === 3) return
    const currentTypeItems = template.visitOrderTemplateItemDtos.filter(
      itemType => itemType.inventoryItemTypeFK === type.id,
    )
    currentTypeItems.map(item => {
      if (item[type.dtoName].isActive === true) {
        activeItemTotal += item.totalAftAdj || 0
      }
    })
  })
  return activeItemTotal
}

export const getMCReportLanguage = (patient, clinicSettings) => {
  const {
    primaryPrintoutLanguage = 'EN',
    secondaryPrintoutLanguage = '',
  } = clinicSettings
  const { printLanguageCode = '' } = patient
  if (
    printLanguageCode.trim().length &&
    (printLanguageCode.toUpperCase() ===
      primaryPrintoutLanguage.toUpperCase() ||
      printLanguageCode.toUpperCase() ===
        secondaryPrintoutLanguage.toUpperCase())
  ) {
    return printLanguageCode.toUpperCase()
  }
  return primaryPrintoutLanguage
}

export const formikMapPropsToValues = ({
  clinicInfo,
  queueLog,
  visitRegistration,
  doctorProfiles,
  history,
  clinicSettings,
  patientInfo,
}) => {
  try {
    let qNo = 0.0
    let doctorProfile
    let doctorProfileFK
    let visitPurposeFK
    let roomAssignmentFK
    let consReady
    let currentVisitOrderTemplateFK
    let defaultVisitPreOrderItem = []
    let medicalCheckupWorkitem
    if (clinicInfo) {
      // doctorProfile = doctorProfiles.find(
      //   (item) => item.doctorMCRNo === clinicInfo.primaryMCRNO,
      // )
      doctorProfileFK = clinicInfo.primaryRegisteredDoctorFK
    }

    const { visitInfo, roomFK, appointment, maxQueueNo } = visitRegistration
    if (queueLog) {
      const { list } = queueLog
      const largestQNo = maxQueueNo
        ? parseFloat(maxQueueNo)
        : list.reduce(
            (largest, { queueNo }) =>
              parseFloat(queueNo) > largest ? parseFloat(queueNo) : largest,
            0,
          )
      qNo = parseFloat(largestQNo + 1).toFixed(
        clinicSettings.settings.isQueueNoDecimal ? 1 : 0,
      )
    }

    if (Object.keys(visitInfo).length > 0) {
      qNo = visitInfo.queueNo
    }
    const {
      visit = {
        visitDoctor: [],
        visitBasicExaminations: [{}],
        isDoctorInCharge: true,
      },
    } = visitInfo

    const visitEntries = Object.keys(visit).reduce(
      (entries, key) => ({
        ...entries,
        [key]: visit[key] === null ? undefined : visit[key],
      }),
      {},
    )
    const { location } = history
    if (location.query.pdid) {
      doctorProfile = doctorProfiles.find(
        item => item.clinicianProfile.id === parseInt(location.query.pdid, 10),
      )
      doctorProfileFK = doctorProfile ? doctorProfile.id : doctorProfileFK
    }

    if (clinicSettings) {
      visitPurposeFK = Number(clinicSettings.settings.defaultVisitType)
      if (visitPurposeFK === VISIT_TYPE.MC) {
        medicalCheckupWorkitem = [
          {
            reportPriority: 'Normal',
            statusFK: MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS,
            reportLanguage: getMCReportLanguage(
              patientInfo,
              clinicSettings.settings,
            ),
          },
        ]
      }
    }

    const { visitOrderTemplateFK, visitEyeRefractionForm } = visitEntries

    if (!visitEntries.id) {
      if (doctorProfile) {
        if (doctorProfile.clinicianProfile.roomAssignment) {
          roomAssignmentFK =
            doctorProfile.clinicianProfile.roomAssignment.roomFK
        }
      } else if (doctorProfileFK) {
        const defaultDoctor = doctorProfiles.find(
          doctor => doctor.id === doctorProfileFK,
        )
        if (defaultDoctor.clinicianProfile.roomAssignment) {
          roomAssignmentFK =
            defaultDoctor.clinicianProfile.roomAssignment.roomFK
        }
      }
      if (appointment && appointment.appointments.length) {
        currentVisitOrderTemplateFK =
          appointment.appointments[0].visitOrderTemplateFK

        defaultVisitPreOrderItem = appointment.appointments[0].appointmentPreOrderItem.map(
          po => {
            const {
              actualizedPreOrderItemFK,
              preOrderItemType,
              itemName,
              quantity,
              orderByUser,
              orderDate,
              remarks,
              amount,
              hasPaid,
              dispenseUOM,
              code,
            } = po
            return {
              actualizedPreOrderItemFK,
              preOrderItemType,
              itemName,
              quantity,
              orderByUser,
              orderDate,
              remarks,
              amount,
              hasPaid,
              dispenseUOM,
              code,
            }
          },
        )
      }
    } else {
      currentVisitOrderTemplateFK = visitOrderTemplateFK
    }
    const isVisitOrderTemplateActive = (
      visitRegistration.visitOrderTemplateOptions || []
    )
      .map(option => option.id)
      .includes(currentVisitOrderTemplateFK)

    let newFormData
    if (visitEyeRefractionForm && visitEyeRefractionForm.formData) {
      if (typeof visitEyeRefractionForm.formData === 'string')
        newFormData = JSON.parse(visitEyeRefractionForm.formData)
      else newFormData = visitEyeRefractionForm.formData
    }

    let referralType = 'None'
    // Edit visit
    if (visitEntries.id) {
      if (visitEntries.referralSourceFK || visitEntries.referralPersonFK) {
        referralType = 'Company'
      } else if (visitEntries.referralPatientProfileFK) {
        referralType = 'Patient'
      }

      if (
        visitEntries.visitPurposeFK === VISIT_TYPE.MC &&
        !visitEntries.isForInvoiceReplacement &&
        visitEntries.medicalCheckupWorkitem.length > 0
      ) {
        medicalCheckupWorkitem = [
          {
            ...visitEntries.medicalCheckupWorkitem[0],
            reportLanguage: visitEntries.medicalCheckupWorkitem[0].reportLanguage.split(
              ', ',
            ),
          },
        ]
      }
    } else if (
      patientInfo &&
      (patientInfo.referredBy === 'Company' ||
        patientInfo.referredBy === 'Patient')
    ) {
      referralType = patientInfo.referredBy
    } else if (clinicSettings.settings.isVisitReferralSourceMandatory) {
      referralType = 'Company'
    }

    if (visitRegistration.consReady === undefined) consReady = true

    return {
      queueNo: qNo,
      visitPurposeFK,
      consReady,
      roomFK: roomAssignmentFK || roomFK,
      visitStatus: VISIT_STATUS.WAITING,
      // doctorProfileFK: doctorProfile ? doctorProfile.id : undefined,
      doctorProfileFK,
      ...visitEntries,
      medicalCheckupWorkitem,
      visitOrderTemplateFK: isVisitOrderTemplateActive
        ? currentVisitOrderTemplateFK
        : undefined,
      visitPreOrderItem: !visitEntries.id
        ? defaultVisitPreOrderItem
        : visitEntries.visitPreOrderItem,
      visitOrderTemplateTotal: !visitEntries.id
        ? undefined
        : visitEntries.visitOrderTemplateTotal,
      visitEyeRefractionForm: {
        ...visitEyeRefractionForm,
        formData: newFormData,
      },
      referredBy: referralType,
      referralRemarks: visitEntries.id
        ? visitEntries.referralRemarks
        : patientInfo.referralRemarks,
      referralSourceFK: visitEntries.id
        ? visitEntries.referralSourceFK
        : patientInfo.referralSourceFK,
      referralPersonFK: visitEntries.id
        ? visitEntries.referralPersonFK
        : patientInfo.referralPersonFK,
      referralPatientProfileFK: visitEntries.id
        ? visitEntries.referralPatientProfileFK
        : patientInfo.referredByPatientFK,
      visitDoctor: [
        ...visitEntries.visitDoctor.filter(d => !d.isPrimaryDoctor),
      ],
      visitPrimaryDoctor: visitEntries.visitDoctor.find(d => d.isPrimaryDoctor),
      visitBasicExaminations: visitEntries.visitBasicExaminations.map(be => ({
        ...be,
        visitPurposeFK: visitEntries.visitPurposeFK || visitPurposeFK,
      })),
    }
  } catch (error) {
    console.log({ error })
    return {}
  }
}

const getMedicalCheckupCWorkitemDoctor = (
  medicalCheckupWorkitemDoctor = [],
  visitDoctor = [],
) => {
  const removeDoctor = medicalCheckupWorkitemDoctor.filter(
    item =>
      !visitDoctor.find(
        d => !d.isDeleted && item.doctorProfileFK === d.doctorProfileFK,
      ),
  )

  const remainDoctor = medicalCheckupWorkitemDoctor.filter(item =>
    visitDoctor.find(
      d => !d.isDeleted && item.doctorProfileFK === d.doctorProfileFK,
    ),
  )

  const newDoctor = visitDoctor.filter(
    item =>
      !item.isDeleted &&
      !medicalCheckupWorkitemDoctor.find(
        d => item.doctorProfileFK === d.doctorProfileFK,
      ),
  )

  let newMCWorkitemDoctor = [
    ...remainDoctor,
    ...removeDoctor.map(item => ({
      ...item,
      isDeleted: true,
    })),
    ...newDoctor.map(item => ({
      doctorProfileFK: item.doctorProfileFK,
    })),
  ]

  newMCWorkitemDoctor.forEach(item => {
    var doctor = visitDoctor.find(
      d => !d.isDeleted && item.doctorProfileFK === d.doctorProfileFK,
    )
    if (doctor) {
      item.isPrimaryDoctor = doctor.isPrimaryDoctor
      item.sequence = doctor.sequence
      item.specialtyFK = doctor.specialtyFK
    }
  })

  return newMCWorkitemDoctor
}

export const formikHandleSubmit = (
  values,
  { props, resetForm, setSubmitting },
) => {
  const {
    queueNo,
    visitAttachment,
    referralBy = [],
    visitOrderTemplate,
    ...restValues
  } = values
  const {
    history,
    dispatch,
    queueLog,
    patientInfo,
    visitRegistration,
    clinicSettings,
    onConfirm,
    doctorProfiles,
  } = props

  const { sessionInfo } = queueLog
  const {
    visitInfo: { id = undefined, visit, ...restVisitInfo },
    // patientInfo,
    appointmentFK,
    roomFK,
  } = visitRegistration
  const bizSessionFK = sessionInfo.id

  const visitReferenceNo = `${sessionInfo.sessionNo}-${parseFloat(id).toFixed(
    1,
  )}`

  const patientProfileFK = patientInfo.id

  let uploaded = []
  if (visitAttachment) {
    uploaded = visitAttachment
      .filter(filterDeletedFiles)
      .map(mapAttachmentToUploadInput)
  }

  let _referralBy = null

  if (typeof referralBy === 'string') {
    _referralBy = referralBy
  } else if (Array.isArray(referralBy) && referralBy.length > 0) {
    // eslint-disable-next-line prefer-destructuring
    _referralBy = referralBy[0]
  }

  let { visitEyeRefractionForm = undefined } = convertEyeForms(restValues)

  if (
    visitEyeRefractionForm &&
    visitEyeRefractionForm.formData &&
    typeof visitEyeRefractionForm.formData === 'object'
  ) {
    visitEyeRefractionForm.formData = JSON.stringify(
      visitEyeRefractionForm.formData,
    )
  }

  let newVisitDoctor = restValues.visitDoctor
    .filter(d => d.id > 0 || !d.isDeleted)
    .map((d, index) => {
      return {
        ...d,
        sequence: index,
        consultationStatus:
          d.consultationStatus || VISITDOCTOR_CONSULTATIONSTATUS.WAITING,
      }
    })

  var primaryDoctor = doctorProfiles.find(
    x => x.id === restValues.doctorProfileFK,
  )
  if (restValues.visitPrimaryDoctor) {
    newVisitDoctor.push({
      ...restValues.visitPrimaryDoctor,
      doctorProfileFK: restValues.doctorProfileFK,
      specialtyFK: primaryDoctor?.clinicianProfile?.specialtyFK,
    })
  } else {
    newVisitDoctor.push({
      doctorProfileFK: restValues.doctorProfileFK,
      isPrimaryDoctor: true,
      sequence: -1,
      consultationStatus: VISITDOCTOR_CONSULTATIONSTATUS.WAITING,
      specialtyFK: primaryDoctor?.clinicianProfile?.specialtyFK,
    })
  }

  if (
    values.visitPurposeFK === VISIT_TYPE.MC &&
    !values.isForInvoiceReplacement
  ) {
    restValues.medicalCheckupWorkitem = [
      {
        ...values.medicalCheckupWorkitem[0],
        reportLanguage: values.medicalCheckupWorkitem[0].reportLanguage.join(
          ', ',
        ),
        medicalCheckupWorkitemDoctor: getMedicalCheckupCWorkitemDoctor(
          values.medicalCheckupWorkitem[0].medicalCheckupWorkitemDoctor,
          newVisitDoctor,
        ),
        statusFK:
          values.medicalCheckupWorkitem[0].statusFK ||
          MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS,
      },
    ]
  } else if (
    values.medicalCheckupWorkitem &&
    values.medicalCheckupWorkitem.length > 0
  ) {
    if (values.medicalCheckupWorkitem[0].id) {
      restValues.medicalCheckupWorkitem[0].isDeleted = true
      restValues.medicalCheckupWorkitem[0].medicalCheckupWorkitemDoctor.forEach(
        item => (item.isDeleted = true),
      )
    } else {
      restValues.medicalCheckupWorkitem = []
    }
  }
  const payload = {
    cfg: {
      message: id ? 'Visit updated' : 'Visit created',
    },
    id,
    ...restVisitInfo,
    queueNo: parseFloat(queueNo).toFixed(
      clinicSettings.settings.isQueueNoDecimal ? 1 : 0,
    ),
    queueNoPrefix: sessionInfo.sessionNoPrefix,
    visit: {
      visitAttachment: uploaded,
      patientProfileFK,
      bizSessionFK,
      visitReferenceNo,
      appointmentFK,
      roomFK,
      visitStatus: VISIT_STATUS.WAITING,
      ...restValues, // override using formik values
      visitDoctor: newVisitDoctor,
      referralBy: _referralBy,
      visitEyeRefractionForm,
    },
  }

  dispatch({
    type: 'visitRegistration/upsert',
    payload,
  }).then(response => {
    if (response) {
      const { location } = history
      sendQueueNotification({
        message: 'New visit created.',
        queueNo: payload && payload.queueNo,
      })
      if (location.pathname === '/reception/appointment')
        dispatch({
          type: 'calendar/refresh',
        })
      else {
        dispatch({
          type: 'queueLog/initState',
        })
        dispatch({
          type: 'queueLog/refresh',
        })
      }
      // reset form can not after onConfirm function.
      // bcz in NewVisit component have function 'componentWillUnmount'
      // there will use this.props.values when close registration visit page
      resetForm({})
      onConfirm()
    } else {
      setSubmitting(false)
    }
  })
}
