import React from 'react'
import { connect } from 'dva'
// formik
import { withFormik, FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  Button,
  CardContainer,
  GridContainer,
  GridItem,
  Select,
} from '@/components'
// sub components
import BaseSearchBar from '../../common/BaseSearchBar'
import TableGrid from '../../common/TableGrid'
// variables
import {
  NewCHASColumnExtensions,
  NewCHASColumns,
  TableConfig,
} from './variables'

const styles = (theme) => ({
  cardContainer: {
    margin: 1,
  },
  buttonGroup: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
})

@connect(({ claimSubmissionApproved }) => ({
  claimSubmissionApproved,
}))
@withFormik({
  mapPropsToValues: () => ({}),
})
class ApprovedCHAS extends React.Component {
  state = {
    selectedRows: [],
  }

  componentDidMount () {
    this.refreshDataGrid()
  }

  onRefreshClicked = () => this.refreshDataGrid()

  handleSelectionChange = (selection) =>
    this.setState({ selectedRows: selection })


  refreshDataGrid = () => {
    this.props.dispatch({
      type: 'claimSubmissionApproved/query',
      payload: {
        status: 'approved',
      },
    })
  }

  render () {
    const {
      classes,
      claimSubmissionApproved,
      handleContextMenuItemClick,
    } = this.props
    const { list } = claimSubmissionApproved || []

    return (
      <CardContainer hideHeader size='sm'>
        <BaseSearchBar>
          <GridItem md={12}>
            <FastField
              name='claimStatus'
              render={(args) => (
                <Select {...args} label='Claim Status' options={[]} />
              )}
            />
          </GridItem>
        </BaseSearchBar>
        <GridContainer>
          <GridItem md={12}>
            <TableGrid
              data={list}
              columnExtensions={NewCHASColumnExtensions}
              columns={NewCHASColumns}
              tableConfig={TableConfig}
              selection={this.state.selectedRows}
              onSelectionChange={this.handleSelectionChange}
              onContextMenuItemClick={handleContextMenuItemClick}
            />
          </GridItem>
          <GridItem md={4} className={classes.buttonGroup}>
            <Button color='primary'>Get Status</Button>
            <Button color='success'>Collect Payment</Button>
          </GridItem>
        </GridContainer>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'ApprovedCHAS' })(ApprovedCHAS)
