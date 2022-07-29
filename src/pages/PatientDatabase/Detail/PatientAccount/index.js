import React, { PureComponent, useEffect } from 'react'
import { withStyles } from '@material-ui/core'
import { Tabs } from '@/components'
import {
  PatientAccountTabOption,
  getDefaultTab,
} from '@/pages/PatientDatabase/Detail/PatientAccount/variables'

const styles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 'calc(100vh - 80px)',
  },
})

class PatientAccount extends PureComponent {
  constructor() {
    super()
    this.state = {
      activeTab: `${getDefaultTab()}`,
      mounted: '1',
    }
  }

  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.resize.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this))
  }

  resize() {
    if (this.divElement) {
      const height = this.divElement.clientHeight
      if (height > 0) {
        this.setState({ height: height > 0 ? height / 2 - 144 : 300 })
      }
    }
  }

  setActiveTab = e => {
    this.setState({ activeTab: e })
  }

  render() {
    return (
      <Tabs
        activeKey={this.state.activeTab}
        onChange={e => this.setActiveTab(e)}
        options={PatientAccountTabOption(this.props)}
      />
    )
  }
}

export default withStyles(styles, { withTheme: true })(PatientAccount)
