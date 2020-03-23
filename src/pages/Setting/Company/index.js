import React, { PureComponent } from 'react'
import { connect } from 'dva'

import { withStyles, Divider } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
import { CardContainer, CommonModal, withSettingBase } from '@/components'
import Authorized from '@/utils/Authorized'
import Filter from './Filter'
import Grid from './Grid'
import Detail from './Detail'

const styles = (theme) => ({
  ...basicStyle(theme),
})

@connect(({ settingCompany }) => ({
  settingCompany,
}))
@withSettingBase({ modelName: 'settingCompany' })
class Supplier extends PureComponent {
  state = {}

  componentDidMount () {
    const { route, dispatch } = this.props
    const suppSorting = [
      { columnName: 'effectiveEndDate', direction: 'desc' },
      { columnName: 'displayValue', direction: 'asc' },
    ]
    const copayerSorting = [
      { columnName: 'effectiveEndDate', direction: 'desc' },
      { columnName: 'coPayerTypeFK', direction: 'asc' },
      { columnName: 'displayValue', direction: 'asc' },
    ]
    const copayer = route.name === 'copayer'
    dispatch({
      type: 'settingCompany/query',
      payload: {
        companyTypeFK: copayer ? 1 : 2,
        sorting: copayer ? copayerSorting : suppSorting,
      },
    })
  }

  toggleModal = () => {
    this.props.dispatch({
      type: 'settingCompany/updateState',
      payload: {
        showModal: !this.props.settingCompany.showModal,
      },
    })
  }

  render () {
    const {
      classes,
      settingCompany,
      dispatch,
      theme,
      route,
      ...restProps
    } = this.props
    const cfg = {
      toggleModal: this.toggleModal,
    }
    const { name } = route
    const companyType = name === 'copayer' ? 'Co-Payer' : 'Supplier'
    const accessRight = Authorized.check('finance/copayer')
    return (
      <CardContainer hideHeader>
        <Filter {...cfg} {...this.props} />
        <Authorized.Context.Provider value={accessRight}>
          <Grid {...cfg} {...this.props} />

          <CommonModal
            open={settingCompany.showModal}
            observe='CompanyDetail'
            title={
              settingCompany.entity ? (
                `Edit ${companyType}`
              ) : (
                `Add ${companyType}`
              )
            }
            maxWidth='md'
            bodyNoPadding
            onClose={this.toggleModal}
            onConfirm={this.toggleModal}
          >
            <Detail {...cfg} {...this.props} />
          </CommonModal>
        </Authorized.Context.Provider>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Supplier)
