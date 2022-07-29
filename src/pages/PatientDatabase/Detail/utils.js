import { navigateDirtyCheck, getRemovedUrl, getAppendUrl } from '@/utils/utils'

const mapEntityToValues = entity => {
  const mappedValues = {
    ...entity,
    pdpaConsent: entity.patientPdpaConsent.reduce(
      (consents, item) =>
        item.isConsent ? [...consents, item.pdpaConsentTypeFK] : [...consents],
      [],
    ),
  }
  let referralType = 'None'
  if (entity.id) {
    if (entity.referralSourceFK || entity.referralPersonFK) {
      referralType = 'Company'
    } else if (entity.referredByPatientFK) {
      referralType = 'Patient'
    }
  }
  return {
    ...mappedValues,
    // nationalityFK: entity.id ? entity.nationalityFK : 173,
    referredBy: referralType,
  }
}

const upsertPatient = async ({
  values,
  history,
  dispatch,
  patient,
  onConfirm,
  resetForm,
}) => {
  const { location } = history
  const cfg = {
    message: 'Patient profile saved.',
  }

  const shouldCloseForm = location.pathname
    ? !location.pathname.includes('patient')
    : false

  const response = await dispatch({
    type: 'patient/upsert',
    payload: {
      ...values,
      patientScheme: values.patientScheme.map(ps => {
        if (ps.isDeleted)
          return {
            ...ps,
            schemeTypeFK: ps.schemeTypeFK || ps.preSchemeTypeFK,
          }
        return ps
      }),
      cfg,
    },
  })

  dispatch({
    type: 'global/updateState',
    payload: {
      disableSave: false,
    },
  })
  dispatch({
    type: 'patient/updateState',
    payload: {
      shouldQueryOnClose: location.pathname.includes('patient'),
    },
  })

  if (response) {
    if (response.id) {
      if (!patient.callback) {
        history.push(
          getRemovedUrl(
            ['new'],
            getAppendUrl({
              pid: response.id,
            }),
          ),
        )
      }
    }
    // form submit then call back refresh data
    if (patient.submitCallback) {
      patient.submitCallback()
    }
    const newPatient = await dispatch({
      type: 'patient/query',
      payload: {
        id: response.id || values.id,
      },
    })

    if (newPatient) {
      if (patient.callback) patient.callback(response.id)
      const newEntity = mapEntityToValues(newPatient)
      resetForm(newEntity)
      dispatch({
        type: 'consultation/updateState',
        payload: {
          patientMedicalHistory: newEntity.patientMedicalHistory,
        },
      })
    }
    if (onConfirm && shouldCloseForm) {
      onConfirm()
    }
  }
  return response
}
export { upsertPatient, mapEntityToValues }
