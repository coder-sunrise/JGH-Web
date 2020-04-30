import React, { PureComponent } from 'react'
import { connect } from 'dva'

import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { CardContainer, withSettingBase } from '@/components'

import Grid from './Grid'

const styles = (theme) => ({
  ...basicStyle(theme),
})

@connect(({ settingRoomAssignment,codetable }) => ({
  settingRoomAssignment,
  codetable,
}))
@withSettingBase({ modelName: 'settingRoomAssignment' })
class RoomAssignment extends PureComponent {
  componentDidMount () {
    this.props.dispatch({
      type: 'settingRoomAssignment/query',
      payload: {
        pagesize: 9999,
      },
    })
  }

  render () {
    return (
      <CardContainer hideHeader>
        <Grid {...this.props} />
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(RoomAssignment)
