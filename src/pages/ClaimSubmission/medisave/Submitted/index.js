import React from 'react'
import { connect } from 'dva'
import { formatMessage } from 'umi/locale'
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
  SubmittedMedisaveColumnExtensions,
  SubmittedMedisaveColumns,
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

@connect(({ medisaveClaimSubmissionSubmitted }) => ({
  medisaveClaimSubmissionSubmitted,
}))
@withFormik({
  mapPropsToValues: () => ({}),
})
class SubmittedMedisave extends React.Component {
  state = {
    selectedRows: [],
    isLoading: false,
  }

  componentDidMount () {
    this.refreshDataGrid()
  }

  handleLoadingVisibility = (visibility = false) =>
    this.setState({ isLoading: visibility })

  handleSelectionChange = (selection) =>
    this.setState({ selectedRows: selection })

  refreshDataGrid = () => {
    this.props.dispatch({
      type: 'medisaveClaimSubmissionSubmitted/query',
    })
  }

  handleGetStatusClicked = () => {
    const { selectedRows } = this.state
    if (selectedRows.length > 0) {
      this.handleLoadingVisibility(true)
      this.props
        .dispatch({
          type: 'medisaveClaimSubmissionSubmitted/getSubmittedStatus',
          payload: { claimIds: selectedRows },
        })
        .then((r) => {
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

  render () {
    const {
      classes,
      medisaveClaimSubmissionSubmitted,
      handleContextMenuItemClick,
      dispatch,
      values,
    } = this.props
    const { isLoading, selectedRows } = this.state
    const { list } = medisaveClaimSubmissionSubmitted || []

    return (
      <CardContainer
        hideHeader
        style={{
          marginLeft: 5,
          marginRight: 5,
        }}
      >
        <BaseSearchBar
          dispatch={dispatch}
          values={values}
          modelsName='medisaveClaimSubmissionSubmitted'
        />
        <LoadingWrapper linear loading={isLoading} text='Get status...'>
          <GridContainer>
            <GridItem md={12}>
              <TableGrid
                data={list}
                columnExtensions={SubmittedMedisaveColumnExtensions}
                columns={SubmittedMedisaveColumns}
                // tableConfig={TableConfig}
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
              />
            </GridItem>
            <GridItem md={4} className={classes.buttonGroup}>
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
        </LoadingWrapper>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'SubmittedMedisave' })(SubmittedMedisave)