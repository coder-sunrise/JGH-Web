import { sendQueueNotification } from '@/pages/Reception/Queue/utils'
import { bool } from 'prop-types'
import { VISIT_STATUS } from '../variables'

const filterDeletedFiles = (item) => {
  // filter out not yet confirmed files
  // fileIndexFK ===
  if (item.fileIndexFK === undefined && item.isDeleted) return false
  return true
}

export const mapAttachmentToUploadInput = (
  {
    fileIndexFK,
    fileName,
    attachmentType,
    attachmentTypeFK,
    isDeleted,
    fileExtension,
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
        fileExtension,
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
        fileExtension,
        sortOrder: index,
      }

const convertEyeForms = (values) => {
  let { visitEyeRefractionForm = undefined } = values

  const removeFields = (obj, fields = []) => {
    if (Array.isArray(obj)) {
      for (let n = 0; n < obj.length; n++) {
        const isEmpty = removeFields(obj[n], fields)
        if (isEmpty) {
          obj.splice(n, 1)
          n--
        }
      }
    } else if (typeof obj === 'object') {
      for (let value in obj) {
        if (Array.isArray(obj[value])) {
          removeFields(obj[value], fields)
        }
      }
      fields.forEach((o) => {
        delete obj[o]
      })

      // check all of fields is empty
      let allFieldIsEmtpy = true
      for (let i in obj) {
        if (i !== 'id' && obj[i] !== undefined && obj[i] !== '') {
          allFieldIsEmtpy = false
          break
        }
      }

      return allFieldIsEmtpy
    }
  }

  const durtyFields = [
    'isDeleted',
    'isNew',
    'IsSelected',
    'rowIndex',
    '_errors',
    'OD',
    'OS',
  ]
  if (
    visitEyeRefractionForm &&
    visitEyeRefractionForm.formData &&
    typeof visitEyeRefractionForm.formData === 'object'
  ) {
    let { formData } = visitEyeRefractionForm
    removeFields(formData, durtyFields)

    values.visitEyeRefractionForm.formData = JSON.stringify(formData)
  }

  return values
}

export const formikMapPropsToValues = ({
  clinicInfo,
  queueLog,
  visitRegistration,
  doctorProfiles,
  history,
  clinicSettings,
}) => {
  try {
    let qNo = 0.0
    let doctorProfile
    let doctorProfileFK
    let visitPurposeFK
    let roomAssignmentFK
    if (clinicInfo) {
      // doctorProfile = doctorProfiles.find(
      //   (item) => item.doctorMCRNo === clinicInfo.primaryMCRNO,
      // )
      doctorProfileFK = clinicInfo.primaryRegisteredDoctorFK
    }

    if (queueLog) {
      const { list } = queueLog
      const largestQNo = list.reduce(
        (largest, { queueNo }) =>
          parseFloat(queueNo) > largest ? parseFloat(queueNo) : largest,
        0,
      )
      qNo = parseFloat(largestQNo + 1).toFixed(1)
    }

    const { visitInfo, roomFK } = visitRegistration

    if (Object.keys(visitInfo).length > 0) {
      qNo = visitInfo.queueNo
    }
    const { visit = {} } = visitInfo

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
        (item) =>
          item.clinicianProfile.id === parseInt(location.query.pdid, 10),
      )
      doctorProfileFK = doctorProfile ? doctorProfile.id : doctorProfileFK
    }

    if (clinicSettings) {
      visitPurposeFK = Number(clinicSettings.settings.defaultVisitType)
    }

    const { visitOrderTemplateFK, visitEyeRefractionForm } = visitEntries
    const isVisitOrderTemplateActive = (visitRegistration.visitOrderTemplateOptions ||
      [])
      .map((option) => option.id)
      .includes(visitEntries.visitOrderTemplateFK)

    if (!visitEntries.id) {
      if (doctorProfile) {
        if (doctorProfile.clinicianProfile.roomAssignment) {
          roomAssignmentFK =
            doctorProfile.clinicianProfile.roomAssignment.roomFK
        }
      } else if (doctorProfileFK) {
        const defaultDoctor = doctorProfiles.find(
          (doctor) => doctor.id === doctorProfileFK,
        )
        if (defaultDoctor.clinicianProfile.roomAssignment) {
          roomAssignmentFK =
            defaultDoctor.clinicianProfile.roomAssignment.roomFK
        }
      }
    }

    let newFormData
    if (visitEyeRefractionForm && visitEyeRefractionForm.formData) {
      if (typeof visitEyeRefractionForm.formData === 'string')
        newFormData = JSON.parse(visitEyeRefractionForm.formData)
      else newFormData = visitEyeRefractionForm.formData
    }

    return {
      queueNo: qNo,
      visitPurposeFK,
      roomFK: roomAssignmentFK || roomFK,
      visitStatus: VISIT_STATUS.WAITING,
      // doctorProfileFK: doctorProfile ? doctorProfile.id : undefined,
      doctorProfileFK,
      ...visitEntries,
      visitOrderTemplateFK: isVisitOrderTemplateActive
        ? visitOrderTemplateFK
        : undefined,
      visitEyeRefractionForm: {
        ...visitEyeRefractionForm,
        formData: newFormData,
      },
    }
  } catch (error) {
    console.log({ error })
    return {}
  }
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
    onConfirm,
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

  const payload = {
    cfg: {
      message: id ? 'Visit updated' : 'Visit created',
    },
    id,
    ...restVisitInfo,
    queueNo: parseFloat(queueNo).toFixed(1),
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
      referralBy: _referralBy,
      visitEyeRefractionForm,
    },
  }

  dispatch({
    type: 'visitRegistration/upsert',
    payload,
  }).then((response) => {
    if (response) {
      const { location } = history
      onConfirm()
      sendQueueNotification({
        message: 'New visit created.',
        queueNo: payload && payload.queueNo,
      })
      if (location.pathname === '/reception/appointment')
        dispatch({
          type: 'calendar/refresh',
        })
      else
        dispatch({
          type: 'queueLog/refresh',
        })

      resetForm({})
    } else {
      setSubmitting(false)
    }
  })
}
