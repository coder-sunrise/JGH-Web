import { Tooltip } from '@/components'
const CopayerDropdownOption = props => {
  const {
    option,
    option: { creditFacility = '', copayerAddress = '' },
    labelField = 'displayValue',
  } = props
  return (
    <Tooltip
      placement='right'
      title={
        <>
          <div>
            {option.code ? `${option.code} - ` : ''}
            <span>{`${option[labelField]}`}</span>
          </div>
          <div>{`Cr. Facility: ${
            creditFacility == '' ? ' - ' : creditFacility
          } `}</div>
          <div>{`Addr.: ${
            copayerAddress == '' ? ' - ' : copayerAddress
          } `}</div>
        </>
      }
    >
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {option.code ? `${option.code} - ` : ''}
        <span style={{ fontWeight: option.code ? 'bold' : 'normal' }}>
          {`${option[labelField]}`}
        </span>
      </div>
    </Tooltip>
  )
}
export default CopayerDropdownOption
