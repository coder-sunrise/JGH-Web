import React, { PureComponent, Fragment } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import { CardContainer } from '@/components'
import LabTrackingDetails from '@/pages/Widgets/LabTrackingDetails'
import { PATIENT_LAB } from '@/utils/constants'

const styles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 'calc(100vh - 80px)',
  },
})

class ExternalTracking extends PureComponent {
  render() {
    const {
      patient: { entity },
      resultType = PATIENT_LAB.PATIENT_PROFILE,
    } = this.props
    const isPatientInactive = !entity || !entity.isActive
    return (
      <div>
        <LabTrackingDetails
          isPatientInactive={isPatientInactive}
          {...this.props}
          resultType={resultType}
        />
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(ExternalTracking)
