import { VISIT_STATUS } from '../variables'
import { sendQueueNotification } from '@/pages/Reception/Queue/utils'

const filterDeletedFiles = (item) => {
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
    let roomAssignmentFK

    const { location } = history
    if (location.query.pdid) {
      doctorProfile = doctorProfiles.find(
        (item) =>
          item.clinicianProfile.id === parseInt(location.query.pdid, 10),
      )
      if (doctorProfile && !visitEntries.id) {
        if (doctorProfile.clinicianProfile.roomAssignment) {
          roomAssignmentFK =
            doctorProfile.clinicianProfile.roomAssignment.roomFK
          roomAssignmentFK = 11
        }
      }
      doctorProfileFK = doctorProfile ? doctorProfile.id : doctorProfileFK
    }

    if (clinicSettings) {
      visitPurposeFK = Number(clinicSettings.settings.defaultVisitType)
    }

    const { visitOrderTemplateFK } = visitEntries
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
            doctorProfile.clinicianProfile.roomAssignment.roomFK
        }
      }
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
      visitRemarks: null,
      temperatureC: null,
      bpSysMMHG: null,
      bpDiaMMHG: null,
      heightCM: null,
      weightKG: null,
      bmi: null,
      pulseRateBPM: null,
      priorityTime: null,
      priorityType: null,
      referralPersonFK: null,
      referralCompanyFK: null,
      referralPerson: null,
      referralDate: null,
      ...restValues, // override using formik values
      referralBy: referralBy.length > 0 ? referralBy[0] : null,
    },
  }

  // console.log({ payload })
  dispatch({
    type: 'visitRegistration/upsert',
    payload,
  }).then((response) => {
    if (response) {
      resetForm({})
      const { location } = history
      if (location.pathname === '/reception/appointment')
        dispatch({
          type: 'calendar/refresh',
        })
      else
        dispatch({
          type: 'queueLog/refresh',
        })

      onConfirm()
      sendQueueNotification({
        message: 'New visit created.',
        queueNo: payload && payload.queueNo,
      })
    } else {
      setSubmitting(false)
    }
  })
}
