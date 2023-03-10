import React from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import { formatMessage } from 'umi'
// formik
import { withFormik } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import { LoadingWrapper } from '@/components/_medisys'
import {
  GridContainer,
  GridItem,
  notification,
  ProgressButton,
  CardContainer,
} from '@/components'
// sub components
import BaseSearchBar from '../../common/BaseSearchBar'
import TableGrid from '../TableGrid'
// variables
import {
  SubmittedCHASColumnExtensions,
  SubmittedCHASColumns,
} from './variables'

const styles = theme => ({
  cardContainer: {
    margin: 1,
  },
  buttonGroup: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
})

@connect(({ chasClaimSubmissionSubmitted, global }) => ({
  chasClaimSubmissionSubmitted,
  mainDivHeight: global.mainDivHeight,
}))
@withFormik({
  mapPropsToValues: () => ({}),
})
class SubmittedCHAS extends React.Component {
  state = {
    selectedRows: [],
    isLoading: false,
  }

  componentDidMount() {
    this.refreshDataGrid()
  }

  handleLoadingVisibility = (visibility = false) =>
    this.setState({ isLoading: visibility })

  handleSelectionChange = selection =>
    this.setState({ selectedRows: selection })

  refreshDataGrid = () => {
    this.props.dispatch({
      type: 'chasClaimSubmissionSubmitted/query',
    })
  }

  handleGetStatusClicked = () => {
    const { selectedRows } = this.state
    if (selectedRows.length > 0) {
      this.handleLoadingVisibility(true)
      this.props
        .dispatch({
          type: 'chasClaimSubmissionSubmitted/getSubmittedStatus',
          payload: { claimIds: selectedRows },
        })
        .then(r => {
          this.handleLoadingVisibility(false)
          if (r) {
            notification.success({
              message: 'Get Status Success.',
            })
            this.refreshDataGrid()
          }
        })
    }
  }

  render() {
    const {
      classes,
      chasClaimSubmissionSubmitted,
      handleContextMenuItemClick,
      dispatch,
      values,
      mainDivHeight = 700,
    } = this.props
    const { isLoading, selectedRows } = this.state
    const { list } = chasClaimSubmissionSubmitted || []
    let height =
      mainDivHeight -
      185 -
      ($('.filterChasSubmittedBar').height() || 0) -
      ($('.footerChasSubmittedBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer
        hideHeader
        style={{
          marginLeft: 5,
          marginRight: 5,
        }}
      >
        <div className='filterChasSubmittedBar'>
          <BaseSearchBar
            dispatch={dispatch}
            values={values}
            modelsName='chasClaimSubmissionSubmitted'
          />
        </div>
        <LoadingWrapper linear loading={isLoading} text='Get status...'>
          <GridContainer>
            <GridItem md={12}>
              <TableGrid
                data={list}
                columnExtensions={SubmittedCHASColumnExtensions}
                columns={SubmittedCHASColumns}
                FuncProps={{
                  selectable: true,
                  selectConfig: {
                    showSelectAll: true,
                    rowSelectionEnabled: () => true,
                  },
                }}
                selection={this.state.selectedRows}
                onSelectionChange={this.handleSelectionChange}
                onContextMenuItemClick={handleContextMenuItemClick}
                type='submitted'
                height={height}
              />
            </GridItem>
          </GridContainer>
          <div className='footerChasSubmittedBar'>
            <GridContainer>
              <GridItem md={12} className={classes.buttonGroup}>
                <ProgressButton
                  icon={null}
                  color='primary'
                  disabled={selectedRows.length <= 0}
                  onClick={this.handleGetStatusClicked}
                >
                  {formatMessage({
                    id: 'claimsubmission.invoiceClaim.GetStatus',
                  })}
                </ProgressButton>
              </GridItem>
            </GridContainer>
          </div>
        </LoadingWrapper>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'SubmittedCHAS' })(SubmittedCHAS)
