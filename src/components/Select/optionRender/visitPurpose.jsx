import React from 'react'
import { Tooltip } from '@/components'
import { withStyles } from '@material-ui/core'
import clsx from 'clsx'
import PropTypes from 'prop-types'

const styles = theme => ({
  VisitPurposeOption: {
    width: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  VisitPurposeOption_Name: {
    fontWeight: '550',
  },
  VisitPurposeOption_Copayers: {
    color: '#4255bd',
  },
  VisitPurposeOption_General: {
    color: 'green',
  },
})

function VisitPurposeDropdownOption(props) {
  let { option, classes, labelField } = props

  const copayers = _.orderBy(
    option?.visitOrderTemplate_Copayers,
    [data => data?.copayerName?.toLowerCase()],
    ['asc'],
  )
    .map(x => x.copayerName)
    .join(', ')

  const tooltip = (
    <div>
      <div>{option[labelField]}</div>
      {(option?.visitOrderTemplate_Copayers || []).length > 0 && (
        <div>Co-Payer(s): {copayers}</div>
      )}
      {(option?.visitOrderTemplate_Copayers || []).length === 0 && (
        <div>
          <i>General</i>
        </div>
      )}
    </div>
  )

  return (
    <Tooltip placement='right' title={tooltip}>
      <div>
        <div
          className={clsx(
            classes.VisitPurposeOption,
            classes.VisitPurposeOption_Name,
          )}
        >
          {option[labelField]}
        </div>
        {(option?.visitOrderTemplate_Copayers || []).length > 0 && (
          <div className={classes.VisitPurposeOption}>
            <span>Co-Payer(s): </span>
            <span className={classes.VisitPurposeOption_Copayers}>
              {copayers}
            </span>
          </div>
        )}
        {(option?.visitOrderTemplate_Copayers || []).length === 0 && (
          <div className={classes.VisitPurposeOption}>
            <span className={classes.VisitPurposeOption_General}>
              <i>General</i>
            </span>
          </div>
        )}
      </div>
    </Tooltip>
  )
}

VisitPurposeDropdownOption.propTypes = {
  option: PropTypes.object.isRequired,
  labelField: PropTypes.string,
}
export default withStyles(styles)(VisitPurposeDropdownOption)