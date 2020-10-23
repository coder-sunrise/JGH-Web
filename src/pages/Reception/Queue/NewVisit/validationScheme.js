import * as Yup from 'yup'
// Form field
import FormField from './formField'

const VitalSignMessage = {
  [FormField['visit.visit.queueNo']]: 'Queue No cannot be blank',
  [FormField['vitalsign.temperatureC']]:
    'Temperature must be between 0 and 200 °C',
  [FormField['vitalsign.bpSysMMHG']]:
    'Blood pressure must be between 0 and 999',
  [FormField['vitalsign.bpDiaMMHG']]:
    'Blood pressure must be between 0 and 999',
  [FormField['vitalsign.pulseRateBPM']]: 'Heart rate must be between 0 and 999',
  [FormField['vitalsign.weightKG']]: 'Weight must be between 0 and 999.9',
  [FormField['vitalsign.heightCM']]: 'Height must be between 0 and 999',
}

const schemaVisit = {
  [FormField['visit.queueNo']]: Yup.string().required(
    VitalSignMessage[FormField['visit.queueNo']],
  ),
  [FormField['visit.doctorProfileFk']]: Yup.string().required(
    'Must select an assigned doctor',
  ),
  [FormField['vitalsign.temperatureC']]: Yup.number()
    .transform(
      (value) => (value === null || Number.isNaN(value) ? undefined : value),
    )
    .min(0, VitalSignMessage[FormField['vitalsign.temperatureC']])
    .max(200, VitalSignMessage[FormField['vitalsign.temperatureC']]),
  [FormField['vitalsign.bpSysMMHG']]: Yup.number()
    .transform(
      (value) => (value === null || Number.isNaN(value) ? undefined : value),
    )
    .min(0, VitalSignMessage[FormField['vitalsign.bpSysMMHG']])
    .max(999, VitalSignMessage[FormField['vitalsign.bpSysMMHG']]),
  [FormField['vitalsign.bpDiaMMHG']]: Yup.number()
    .transform(
      (value) => (value === null || Number.isNaN(value) ? undefined : value),
    )
    .min(0, VitalSignMessage[FormField['vitalsign.bpDiaMMHG']])
    .max(999, VitalSignMessage[FormField['vitalsign.bpDiaMMHG']]),
  [FormField['vitalsign.pulseRateBPM']]: Yup.number()
    .transform(
      (value) => (value === null || Number.isNaN(value) ? undefined : value),
    )
    .min(0, VitalSignMessage[FormField['vitalsign.pulseRateBPM']])
    .max(999, VitalSignMessage[FormField['vitalsign.pulseRateBPM']]),
  [FormField['vitalsign.weightKG']]: Yup.number()
    .transform(
      (value) => (value === null || Number.isNaN(value) ? undefined : value),
    )
    .min(0, VitalSignMessage[FormField['vitalsign.weightKG']])
    .max(999.9, VitalSignMessage[FormField['vitalsign.weightKG']]),
  [FormField['vitalsign.heightCM']]: Yup.number()
    .transform(
      (value) => (value === null || Number.isNaN(value) ? undefined : value),
    )
    .integer('Height can only be a whole number')
    .min(0, VitalSignMessage[FormField['vitalsign.heightCM']])
    .max(999, VitalSignMessage[FormField['vitalsign.heightCM']]),
}

const schemaSalesPerson = {
  [FormField['visit.salesPersonUserFK']]: Yup.string().required(
    'Must select a sales person',
  ),
}

const VisitValidationSchema = (props) => {
  const { clinicSettings } = props
  const { settings } = clinicSettings

  let schema = {
    ...schemaVisit,
  }

  if (settings.isSalesPersonMandatoryInVisit)
    schema = Object.assign(schema, { ...schemaSalesPerson })

  return Yup.object().shape({
    ...schema,
  })
}

export default VisitValidationSchema
