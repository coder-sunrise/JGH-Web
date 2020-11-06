import React from 'react'
import { connect } from 'dva'
import { formatMessage } from 'umi/locale'
// formik
import { withFormik } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  ProgressButton,
  GridContainer,
  GridItem,
  notification,
  CardContainer,
  Tooltip,
} from '@/components'
import { LoadingWrapper } from '@/components/_medisys'
import Authorized from '@/utils/Authorized'
// sub components
import BaseSearchBar from '../../common/BaseSearchBar'
import TableGrid from '../TableGrid'
// variables
import { RejectedMedisaveColumnExtensions, RejectedMedisaveColumns } from './variables'

const styles = (theme) => ({
  cardContainer: {
    margin: 1,
  },
  buttonGroup: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
})

@connect(({ medisaveClaimSubmissionRejected }) => ({
  medisaveClaimSubmissionRejected,
}))
@withFormik({
  mapPropsToValues: () => ({}),
})
class RejectedMedisave extends React.Component {
  state = {
    selectedRows: [],
    isLoading: false,
  }

  componentDidMount () {
    this.refreshDataGrid()
  }

  onRefreshClicked = () => {
    const { selectedRows } = this.state
    this.props
      .dispatch({
        type: 'medisaveClaimSubmissionRejected/refreshPatientDetails',
        payload: { claimIds: selectedRows },
      })
      .then((r) => {
        if (!r) {
          this.refreshDataGrid()
        }
      })
  }

  refreshDataGrid = () => {
    this.props.dispatch({
      type: 'medisaveClaimSubmissionRejected/query',
    })
  }

  handleSelectionChange = (selection) =>
    this.setState({ selectedRows: selection })

  handleLoadingVisibility = (visibility = false) =>
    this.setState({ isLoading: visibility })

  onReSubmitClaimClicked = () => {
    const { selectedRows } = this.state
    if (selectedRows.length > 0) {
      this.handleLoadingVisibility(true)
      this.props
        .dispatch({
          type: 'medisaveClaimSubmissionRejected/resubmitMedisaveClaim',
          payload: { claimIds: selectedRows },
        })
        .then((r) => {
          this.handleLoadingVisibility(false)
          if (r) {
            if (r.failedCount > 0) {
              console.log('failedCount',r.failedCount)
              this.props.handleSubmitClaimStatus(r.failedCount)
            } else {
              notification.success({
                message: 'Claim Re-Submission Success.',
              })
            }

            this.refreshDataGrid()
          }
        })
    }
  }

  render () {
    const {
      classes,
      medisaveClaimSubmissionRejected,
      handleContextMenuItemClick,
      dispatch,
      values,
    } = this.props
    const { isLoading, selectedRows } = this.state
    const { list } = medisaveClaimSubmissionRejected || []

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
          modelsName='medisaveClaimSubmissionRejected'
        />
        <LoadingWrapper
          linear
          loading={isLoading}
          text='Re-submitting Claim...'
        >
          <GridContainer>
            <GridItem md={12}>
              <TableGrid
                data={list}
                columnExtensions={RejectedMedisaveColumnExtensions}
                columns={RejectedMedisaveColumns}
                // tableConfig={TableConfig}
                FuncProps={{
                  selectable: true,
                  selectConfig: {
                    showSelectAll: true,
                    rowSelectionEnabled: (row) => row.patientIsActive,
                  },
                }}
                selection={this.state.selectedRows}
                onSelectionChange={this.handleSelectionChange}
                onContextMenuItemClick={(row, id) =>
                  handleContextMenuItemClick(row, id, true)}
                type='rejected'
              />
            </GridItem>

            <GridItem md={4} className={classes.buttonGroup}>
              <Tooltip
                placement='bottom-start'
                title={formatMessage({
                  id:
                    'claimsubmission.invoiceClaim.refreshPatientDetail.tooltips',
                })}
              >
                <div style={{ display: 'inline-block' }}>
                  <ProgressButton
                    icon={null}
                    color='info'
                    disabled={selectedRows.length <= 0}
                    onClick={this.onRefreshClicked}
                  >
                    {formatMessage({
                      id: 'claimsubmission.invoiceClaim.refreshPatientDetail',
                    })}
                  </ProgressButton>
                </div>
              </Tooltip>
              <Authorized authority='claimsubmission.submitclaim'>
                <ProgressButton
                  icon={null}
                  color='primary'
                  disabled={selectedRows.length <= 0}
                  onClick={this.onReSubmitClaimClicked}
                >
                  {formatMessage({
                    id: 'claimsubmission.invoiceClaim.ResubmitClaim',
                  })}
                </ProgressButton>
              </Authorized>
            </GridItem>
          </GridContainer>
        </LoadingWrapper>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'RejectedMedisave' })(RejectedMedisave)
