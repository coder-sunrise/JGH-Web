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

@connect(({ settingMedicationDosage, global, codetable, clinicSettings }) => ({
  settingMedicationDosage,
  mainDivHeight: global.mainDivHeight,
  codetable,
  clinicSettings: clinicSettings.settings || clinicSettings.default,
}))
@withSettingBase({ modelName: 'settingMedicationDosage' })
class MedicationDosage extends PureComponent {
  state = {}

  componentDidMount () {
    this.props.dispatch({
      type: 'settingMedicationDosage/query',
    })

    this.props.dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctlanguage' },
    })
  }

  toggleModal = () => {
    this.props.dispatch({
      type: 'settingMedicationDosage/updateState',
      payload: {
        showModal: !this.props.settingMedicationDosage.showModal,
      },
    })
  }

  render () {
    const { settingMedicationDosage, mainDivHeight = 700 } = this.props
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
          open={settingMedicationDosage.showModal}
          observe='MedicationDosageDetail'
          title={
            settingMedicationDosage.entity ? (
              'Edit Medication Dosage'
            ) : (
              'Add Medication Dosage'
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

export default withStyles(styles, { withTheme: true })(MedicationDosage)
