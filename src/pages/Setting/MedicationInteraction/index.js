import React, { PureComponent } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { CardContainer, CommonModal, withSettingBase } from '@/components'

import Filter from './Filter'
import Grid from './Grid'
import Detail from './Detail'

const styles = (theme) => ({
  ...basicStyle(theme),
})

@connect(({ settingMedicationInteraction, global, codetable, clinicSettings }) => ({
  settingMedicationInteraction,
  mainDivHeight: global.mainDivHeight,
  codetable,
  clinicSettings: clinicSettings.settings || clinicSettings.default,
}))
@withSettingBase({ modelName: 'settingMedicationInteraction' })
class ServiceCenter extends PureComponent {
  state = {}

  componentDidMount () {
    this.props.dispatch({
      type: 'settingMedicationInteraction/query',
    })

    this.props.dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctLanguage' },
    })
  }

  toggleModal = () => {
    this.props.dispatch({
      type: 'settingMedicationInteraction/updateState',
      payload: {
        showModal: !this.props.settingMedicationInteraction.showModal,
      },
    })
  }

  render () {
    const { settingMedicationInteraction, mainDivHeight = 700 } = this.props
    const cfg = {
      toggleModal: this.toggleModal,
    }
    let height = mainDivHeight - 110 - ($('.filterBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer hideHeader>
        <div className='filterBar'>
          <Filter {...cfg} {...this.props} />
        </div>
        <Grid {...cfg} {...this.props} height={height} />
        <CommonModal
          open={settingMedicationInteraction.showModal}
          observe='MedicationInteractionDetail'
          title={
            settingMedicationInteraction.entity ? (
              'Edit Medication Interaction'
            ) : (
              'Add Medication Interaction'
            )
          }
          maxWidth='md'
          bodyNoPadding
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
        >
          <Detail {...cfg} {...this.props} />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(ServiceCenter)
