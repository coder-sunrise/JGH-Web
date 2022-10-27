import moment from 'moment'
import Yup from '@/utils/yup'
import { notification } from '@/components'

import { getCodes } from '@/utils/codetable'

let schemeTypes = []
getCodes('ctSchemeType').then(codetableData => {
  schemeTypes = codetableData
})

// prettier-ignore
const _multiples = [2, 7, 6, 5, 4, 3, 2]
Yup.addMethod(Yup.string, 'NRIC', function(message) {
  return this.test('isValidNRIC', message, function(value = '') {
    const { parent, createError } = this

    const { patientAccountNoTypeFK, accountNoTypeFK, dob } = parent
    const typeFK = Number(patientAccountNoTypeFK || accountNoTypeFK)
    const firstChar = value[0] || ''
    const lastChar = value[value.length - 1] || ''
    let outputChars = []
    let weight = 0
    switch (typeFK) {
      // case 1: // fin
      case 4: // SO
        if (firstChar === 'F')
          // prettier-ignore
          outputChars = ['X','W','U','T','R','Q','P','N','M','L','K']
        else if (firstChar === 'G') {
          // prettier-ignore
          outputChars = ['X','W','U','T','R','Q','P','N','M','L','K']
          // outputChars = ['R','Q','P','N','M','L','K','X','W','U','T']
          weight = 4
        } else if (firstChar === 'M') {
          // prettier-ignore
          outputChars = ['X','W','U','T','R','Q','P','N','J','L','K']
          weight = 3
        }
      case 1: // SP
      case 2: // SH
      case 3: // SB
        if (firstChar === 'S')
          // prettier-ignore
          outputChars = ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
        else if (firstChar === 'T') {
          // prettier-ignore
          outputChars = ['J','Z','I','H','G','F','E','D','C','B','A']
          // outputChars = ['G','F','E','D','C','B','A','J','Z','I','H']
          weight = 4
        }
        break

      default:
        return true
    }
    if (value.length !== 9)
      return createError({
        message: 'Account number must be 9 digits',
      })
    value = value.toUpperCase()

    const numericNRICString = value.substring(1, value.length - 1)

    if (!new RegExp(/^\d+$/).test(numericNRICString))
      return createError({
        message: ' Invalid account number structure',
      })
    let numberNRIC = Number(numericNRICString)
    let total = 0
    let count = 0
    while (numberNRIC !== 0) {
      total += (numberNRIC % 10) * _multiples[_multiples.length - (1 + count++)]
      numberNRIC /= 10
      numberNRIC = Math.floor(numberNRIC)
    }
    total += weight
    if (
      total % 11 > outputChars.length - 1 ||
      lastChar !== outputChars[total % 11]
    )
      return createError({
        message: ' Invalid account number structure',
      })

    if (dob) {
      const mDob = moment(dob)

      switch (typeFK) {
        //   // nric
        case 1: // SP
        case 2: // SH
        case 3: // SB
          if (mDob.year() >= 2000) {
            if (firstChar !== 'T') {
              return createError({
                message: 'Invalid date of birth',
              })
            }
          } else if (firstChar !== 'S') {
            return createError({
              message: 'Invalid date of birth',
            })
          }
          if (typeFK === 13 && Math.abs(mDob.diff(moment(), 'year')) >= 15) {
            return createError({
              message:
                'For Singaporean age 15 and above, please choose others than SG Birth Cert',
            })
          }
          break

        default:
          return true
      }
    }
    return true
  })
})

const schemaDemographic = {
  name: Yup.string().required(),
  dob: Yup.date().required(),
  patientAccountNoTypeFK: Yup.number().required(),
  patientAccountNo: Yup.string()
    .NRIC()
    .required(),
  genderFK: Yup.number().required(),
  nationalityFK: Yup.number().required(),
  referredBy: Yup.string(),
  referralSourceFK: Yup.number().when('referredBy', {
    is: 'Company',
    then: Yup.number().required(),
  }),
  referredByPatientFK: Yup.number().when('referredBy', {
    is: value => value === 'Patient',
    then: Yup.number().required(),
  }),
  contact: Yup.object().shape({
    contactEmailAddress: Yup.object().shape({
      emailAddress: Yup.string().email(),
    }),
    mobileContactNumber: null,
  }),
}

const schemaEmergencyContact = {
  patientEmergencyContact: Yup.array()
    .compact(v => v.isDeleted)
    .of(
      Yup.object().shape({
        name: Yup.string().required(),
      }),
    ),
  patientFamilyGroup: Yup.object().shape({
    patientFamilyMember: Yup.array()
      .compact(v => v.isDeleted)
      .of(
        Yup.object().shape({
          relationshipFK: Yup.number().required(),
        }),
      ),
  }),
}

const schemaAllergies = {
  patientAllergyMetaData: Yup.array()
    .compact(v => v.isDeleted)
    .of(
      Yup.object().shape({
        noAllergies: Yup.boolean(),
        // isG6PDConfirmed: Yup.boolean(),
        g6PDFK: Yup.number(),
      }),
    ),
  patientAllergy: Yup.array()
    .compact(v => v.isDeleted)
    .of(
      Yup.object().shape({
        type: Yup.string().required(),
        allergyFK: Yup.number().when('type', {
          is: 'Allergy',
          then: Yup.number().required(),
        }),
        ingredientFK: Yup.number().when('type', {
          is: 'Ingredient',
          then: Yup.number().required(),
        }),
        allergyName: Yup.string().required(),
        allergyReactionFK: Yup.number().required(),
        patientAllergyStatusFK: Yup.number().required(),
        // adverseReaction: Yup.string(),
        // onsetDate: Yup.date(),
      }),
    ),
}

const schemaPreOrderList = {
  pendingPreOrderItem: Yup.array()
    .compact(v => v.isDeleted)
    .of(
      Yup.object().shape({
        preOrderItemType: Yup.string().required(),
        itemName: Yup.string().required(),
        quantity: Yup.number()
          .required()
          .min(1),
      }),
    ),
}

const schemaSchemes = {
  patientScheme: Yup.array()
    .compact(v => v.isDeleted)
    .unique(
      v => `${v.schemeTypeFK}-${v.coPaymentSchemeFK}`,
      'error',
      () => {
        notification.error({
          message: 'The Schemes record already exists in the system',
        })
      },
    )
    .of(
      Yup.object().shape({
        schemeTypeFK: Yup.number().required(),
        // accountNumber: Yup.string().required(),
        coPaymentSchemeFK: Yup.number().when('schemeTypeFK', {
          is: val => {
            return schemeTypes.find(
              o =>
                ['CORPORATE', 'INSURANCE'].indexOf(o.code.toUpperCase()) >= 0 &&
                o.id === val,
            )
          },

          then: Yup.number().required(),
          otherwise: Yup.number(),
        }),
        validRange: Yup.array().when('schemeTypeFK', {
          is: val => {
            const st = schemeTypes.find(o => o.id === val)
            if (!st) return false
            const notMedisaveOrPhpc =
              ['MEDIVISIT', 'FLEXIMEDI', 'OPSCAN'].indexOf(st.code) < 0 &&
              !st.code.startsWith('PHPC')

            const isCorporate =
              ['CORPORATE', 'INSURANCE'].indexOf(st.code.toUpperCase()) >= 0

            return notMedisaveOrPhpc && !isCorporate
          },
          then: Yup.array()
            .of(Yup.date())
            .required()
            .min(2),
        }),
      }),
    ),
  schemePayer: Yup.array()
    .compact(v => v.isDeleted)
    .unique(
      v => `${v.schemeFK}-${v.payerID}`,
      'error',
      () => {
        notification.error({
          message: 'Medisave Payer record already exists in the system',
        })
      },
    )
    .of(
      Yup.object().shape({
        payerName: Yup.string().required(),
        payerID: Yup.string().required(),
        relationshipFK: Yup.number()
          .required()
          .when('schemeFK', {
            is: val => {
              const st = schemeTypes.find(o => o.id === val)
              if (!st) return false
              return st.code === 'FLEXIMEDI'
            },
            then: Yup.number().max(
              2,
              '“Patient Is” must be “SELF” or “SPOUSE” for Flexi-Medisave',
            ),
          }),
        schemeFK: Yup.number().required(),
        dob: Yup.date()
          .required()
          .when('schemeFK', {
            is: val => {
              const st = schemeTypes.find(o => o.id === val)
              if (!st) return false
              return st.code === 'FLEXIMEDI'
            },
            then: Yup.date().max(
              moment().subtract(65, 'years'),
              'Payer DOB must be greater than or equal to 65 for Flexi-Medisave',
            ),
          }),
      }),
    ),
}
const schema = props => {
  const { clinicSettings } = props
  if (!clinicSettings.isNationalityMandatoryInRegistration) {
    schemaDemographic.nationalityFK = Yup.number()
  } else {
    schemaDemographic.nationalityFK = Yup.number().required()
  }
  if (!clinicSettings.isContactNoMandatoryInRegistration) {
    schemaDemographic.contact = Yup.object().shape({
      contactEmailAddress: Yup.object().shape({
        emailAddress: Yup.string().email(),
      }),
      contactAddress: Yup.array().of(
        Yup.object().shape({
          street: clinicSettings.isPatientAddressMandatory
            ? Yup.string().required()
            : Yup.string(),
          countryFK: clinicSettings.isPatientAddressMandatory
            ? Yup.string().required()
            : Yup.string(),
        }),
      ),
      mobileContactNumber: Yup.object().shape({
        number: Yup.string(),
        countryCodeFK: Yup.string(),
      }),
    })
  } else {
    schemaDemographic.contact = Yup.object().shape({
      contactEmailAddress: Yup.object().shape({
        emailAddress: Yup.string().email(),
      }),
      contactAddress: Yup.array().of(
        Yup.object().shape({
          street: clinicSettings.isPatientAddressMandatory
            ? Yup.string().required()
            : Yup.string(),
          countryFK: clinicSettings.isPatientAddressMandatory
            ? Yup.string().required()
            : Yup.string(),
        }),
      ),
      mobileContactNumber: Yup.object().shape({
        number: Yup.string().required(),
        countryCodeFK: Yup.string().required(),
      }),
    })
  }
  const patientDatabaseSchema = Yup.object().shape({
    ...schemaDemographic,
    ...schemaEmergencyContact,
    ...schemaAllergies,
    ...schemaSchemes,
    ...schemaPreOrderList,
  })

  patientDatabaseSchema.demographic = schemaDemographic
  patientDatabaseSchema.schemes = schemaSchemes
  patientDatabaseSchema.allergies = schemaAllergies
  patientDatabaseSchema.emergencyContact = schemaEmergencyContact
  patientDatabaseSchema.preOrderList = schemaPreOrderList
  return patientDatabaseSchema
}
export default schema
