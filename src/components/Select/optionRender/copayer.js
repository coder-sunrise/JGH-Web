import { Tooltip } from '@/components'
const CopayerDropdownOption = props => {
  const {
    option,
    option: { creditFacility = '', copayerAddress = '' },
    labelField = 'displayValue',
  } = props
  return (
    <div
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={`${option.code ? `${option.code} - ` : ''}${
        option[labelField]
      }\nCr. Facility: ${
        creditFacility == '' ? ' - ' : creditFacility
      } \nAddr.: ${copayerAddress || ' - '} `}
    >
      {option.code ? `${option.code} - ` : ''}
      <span style={{ fontWeight: option.code ? 'bold' : 'normal' }}>
        {`${option[labelField]}`}
      </span>
    </div>
  )
}
export default CopayerDropdownOption
