import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { CardContainer, Tabs } from '@/components'

import Filter from './FilterBar/Filter'
import Grid from './Grid/Grid'
import SAPFilter from './FilterBar/SAPFilter'
import SAPGrid from './Grid/SAPGrid'

const styles = theme => ({
  ...basicStyle(theme),
})
@connect(({ clinicSettings, global }) => ({
  clinicSettings,
  mainDivHeight: global.mainDivHeight,
}))
class QueueProcessor extends PureComponent {
  render() {
    return (
      <CardContainer hideHeader>
        <Tabs
          options={[
            {
              id: 1,
              name: 'Queue',
              content: (
                <React.Fragment>
                  <div className='filterQueueProcessorBar'>
                    <Filter {...this.props} />
                  </div>
                  <Grid {...this.props} />
                </React.Fragment>
              ),
            },
            {
              id: 2,
              name: 'SAP Interface',
              content: (
                <React.Fragment>
                  <div className='filterSAPQueueProcessorBar'>
                    <SAPFilter {...this.props} />
                  </div>
                  <SAPGrid {...this.props} />
                </React.Fragment>
              ),
            },
          ]}
        />
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(QueueProcessor)
