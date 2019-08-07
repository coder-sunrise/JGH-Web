import Moment from 'moment'
import * as Yup from 'yup'
import _ from 'lodash'
import { camelizeKeys, pascalizeKeys } from 'humps'

// console.log(Yup)
function _printValue (value, quoteStrings) {
  let toString = Object.prototype.toString
  let errorToString = Error.prototype.toString
  let regExpToString = RegExp.prototype.toString
  let symbolToString =
    typeof Symbol !== 'undefined'
      ? Symbol.prototype.toString
      : function () {
          return ''
        }
  let SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/

  function printNumber (val) {
    if (val != +val) return 'NaN'
    let isNegativeZero = val === 0 && 1 / val < 0
    return isNegativeZero ? '-0' : `${val}`
  }

  function printSimpleValue (val, quoteStrings) {
    if (quoteStrings === void 0) {
      quoteStrings = false
    }

    if (val == null || val === true || val === false) return `${val}`
    let typeOf = typeof val
    if (typeOf === 'number') return printNumber(val)
    if (typeOf === 'string') return quoteStrings ? `"${val}"` : val
    if (typeOf === 'function') return `[Function ${val.name || 'anonymous'}]`
    if (typeOf === 'symbol')
      return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)')
    let tag = toString.call(val).slice(8, -1)
    if (tag === 'Date')
      return isNaN(val.getTime()) ? `${val}` : val.toISOString(val)
    if (tag === 'Error' || val instanceof Error)
      return `[${errorToString.call(val)}]`
    if (tag === 'RegExp') return regExpToString.call(val)
    return null
  }
  let r = printSimpleValue(value, quoteStrings)
  if (r !== null) return r
  return JSON.stringify(
    value,
    function (key, v) {
      let r2 = printSimpleValue(this[key], quoteStrings)
      if (r2 !== null) return r
      return v
    },
    2,
  )
}

Yup.setLocale({
  mixed: {
    //   default: 'Não é válido',
    required: 'This is a required field',
    number: '',
    notType: function notType (_ref) {
      // console.log(_ref)
      const path = _ref.path

      const type = _ref.type
      const value = _ref.value

      const originalValue = _ref.originalValue
      let isCast = originalValue != null && originalValue !== value
      // let msg = `${path} ${_printValue(
      //   originalValue,
      //   true,
      // )} is not a valid "${type}" type` // , ` + `but the final vaasdasdlue was: \`${  _printValue(value, true)  }\`${  isCast ? ` (cast from the value \`${  _printValue(originalValue, true)  }\`).` : '.'}`

      // if (value === null) {
      //   msg +=
      //     '\n If "null" is intended as an empty value be sure to mark the schema as `.nullable()`'
      // }

      return "Please check the value, it's not valid"
    },
  },
  string: {
    email: 'This field must be a valid email',
  },
  number: {
    //   min: 'Deve ser maior que ${min}',
    required: '',
  },
  array: {
    min: 'This field must have at least ${min} items',
    max: 'This field must have less than or equal to ${max} items',
  },
})

let parseFormats = [
  'DD-MM-YYYY',
]
let invalidDate = new Date('')
const orgDate = Yup.date
Yup.date = () => {
  const r = orgDate().transform(function (value, originalValue) {
    // console.log(value, originalValue)
    if (this.isType(value)) return value
    // the default coercion transform failed so lets try it with Moment instead
    value = Moment(originalValue, parseFormats)
    if (
      parseFormats.find(
        (format) =>
          Moment(originalValue, format).format(format) === originalValue,
      )
    ) {
      return value.toDate()
    }
    return invalidDate

    // return value.isValid() ? value.toDate() : invalidDate
  })
  return r
}
Yup.addMethod(Yup.array, 'unique', function (
  mapper,
  message = 'This collection not allow dupication',
  callback,
) {
  return this.test('isUnique', message, function (value = []) {
    const { parent, createError, options } = this
    // const { originalValue } = options

    const compareValues = value.map(mapper)
    // console.log(value, compareValues, value.filter((o) => !o.isDeleted))
    if (
      _.uniq(compareValues).length !== value.filter((o) => !o.isDeleted).length
    ) {
      createError({
        message,
      })
      if (callback) callback(message)
      return false
    }
    return true
  })
})
export default Yup

// module.exports = Yup.date().transform(function (value, originalValue) {
//   if (this.isType(value)) return value
//   // the default coercion transform failed so lets try it with Moment instead
//   value = Moment(originalValue, parseFormats)
//   return value.isValid() ? value.toDate() : invalidDate
// })
