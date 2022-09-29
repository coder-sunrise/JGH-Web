import React, { PureComponent } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import { withStyles, Divider } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { CardContainer, CommonModal, withSettingBase } from '@/components'

import Filter from './Filter'
import Grid from './Grid'
import Detail from './Detail'

const styles = theme => ({
  ...basicStyle(theme),
})

@connect(({ settingStatementGroup, global }) => ({
  settingStatementGroup,
  mainDivHeight: global.mainDivHeight,
}))
@withSettingBase({ modelName: 'settingStatementGroup' })
class StatementGroup extends PureComponent {
  state = {}

  componentDidMount() {
    this.props.dispatch({
      type: 'settingStatementGroup/query',
      payload: {
        isActive: true,
      },
    })
  }

  toggleModal = () => {
    this.props.dispatch({
      type: 'settingStatementGroup/updateState',
      payload: {
        showModal: !this.props.settingStatementGroup.showModal,
      },
    })
  }

  render() {
    const { settingStatementGroup, mainDivHeight = 700 } = this.props
    const cfg = {
      toggleModal: this.toggleModal,
    }
    let height =
      mainDivHeight - 120 - ($('.filterStatementGroupBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer hideHeader>
        <div className='filterStatementGroupBar'>
          <Filter {...cfg} {...this.props} />
        </div>
        <Grid {...this.props} height={height} />
        <CommonModal
          open={settingStatementGroup.showModal}
          observe='StatementGroupDetail'
          title={
            settingStatementGroup.entity
              ? 'Edit Statement Group'
              : 'Add Statement Group'
          }
          maxWidth='md'
          bodyNoPadding
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
        >
          <Detail {...this.props} />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(StatementGroup)
