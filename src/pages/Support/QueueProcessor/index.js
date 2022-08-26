import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { CardContainer, Tabs, CommonModal } from '@/components'

import Filter from './FilterBar/Filter'
import Grid from './Grid/Grid'
import SAPFilter from './FilterBar/SAPFilter'
import SAPGrid from './Grid/SAPGrid'
import SAPQueueItemDetails from './SAPQueueItemDetails'

const styles = theme => ({
  ...basicStyle(theme),
})
@connect(({ clinicSettings, global }) => ({
  clinicSettings,
  mainDivHeight: global.mainDivHeight,
}))
class QueueProcessor extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
  }
  sapToggleModal = () => {
    this.setState(prevState => {
      return {
        showSAPQueueItemDetails: !prevState.showSAPQueueItemDetails,
      }
    })
  }
  sapQueueItemRetrigger = async row => {
    const { dispatch } = this.props
    await dispatch({
      type: 'sapQueueProcessor/retrigger',
      payload: {
        ...row,
        retryCount: 0,
        statusFK: 1,
      },
    }).then(r => {
      dispatch({
        type: 'sapQueueProcessor/query',
      })
    })
  }
  cfg = {
    toggleModal: this.sapToggleModal,
    retrigger: this.sapQueueItemRetrigger,
  }
  render() {
    const { showSAPQueueItemDetails } = this.state
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
                  <SAPGrid {...this.props} {...this.cfg} />
                  <CommonModal
                    open={showSAPQueueItemDetails}
                    title='Details'
                    observe='sapQueueProcessor'
                    onClose={this.sapToggleModal}
                    maxWidth='lg'
                  >
                    {showSAPQueueItemDetails ? (
                      <SAPQueueItemDetails {...this.props} {...this.cfg} />
                    ) : null}
                  </CommonModal>
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
