import React, { PureComponent } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { CardContainer, CommonModal, withSettingBase } from '@/components'

import Filter from './Filter'
import Grid from './Grid'
import Detail from './Details'

const styles = theme => ({
  ...basicStyle(theme),
})

@connect(({ settingChecklist, global }) => ({
  settingChecklist,
  mainDivHeight: global.mainDivHeight,
}))
@withSettingBase({ modelName: 'settingChecklist' })
class Checklist extends PureComponent {
  state = {
    SubjectSortOrderArray: [],
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'settingChecklist/query',
      payload: {
        isActive: true,
      },
    })
  }

  toggleModal = () => {
    this.props.dispatch({
      type: 'settingChecklist/updateState',
      payload: {
        showModal: !this.props.settingChecklist.showModal,
      },
    })
  }
  getSubjectSortOrderArray = arr =>
    this.setState({ SubjectSortOrderArray: arr })

  render() {
    const { settingChecklist, mainDivHeight = 700 } = this.props
    const cfg = {
      toggleModal: this.toggleModal,
    }
    let height = mainDivHeight - 120 - ($('.filterChecklistBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer hideHeader>
        <div className='filterChecklistBar'>
          <Filter {...cfg} {...this.props} />
        </div>
        <Grid {...cfg} {...this.props} height={height} />

        <CommonModal
          open={settingChecklist.showModal}
          observe='ChecklistDetail'
          title={settingChecklist.entity ? 'Edit Checklist' : 'Add Checklist'}
          maxWidth='lg'
          bodyNoPadding
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
        >
          <Detail
            {...cfg}
            {...this.props}
            getSubjectSortOrderArray={this.getSubjectSortOrderArray}
            SubjectSortOrderArray={this.state.SubjectSortOrderArray}
          />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Checklist)
