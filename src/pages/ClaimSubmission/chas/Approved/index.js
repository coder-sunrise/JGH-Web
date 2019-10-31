import React from 'react'
import { connect } from 'dva'
import moment from 'moment'
// formik
import { withFormik, FastField } from 'formik'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import { LoadingWrapper } from '@/components/_medisys'
import {
  ProgressButton,
  GridContainer,
  GridItem,
  Select,
  notification,
  CardContainer,
  CommonModal,
} from '@/components'
// sub components
import BaseSearchBar from '../../common/BaseSearchBar'
import TableGrid from '../../common/TableGrid'
import CollectPaymentModal from '../../common/CollectPaymentModal'
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

@connect(({ claimSubmission, claimSubmissionApproved }) => ({
  claimSubmission,
  claimSubmissionApproved,
}))
@withFormik({
  mapPropsToValues: () => ({}),
})
class ApprovedCHAS extends React.Component {
  state = {
    selectedRows: [],
    isLoading: false,
    showCollectPayment: false,
  }

  componentDidMount () {
    this.refreshDataGrid()
  }

  onRefreshClicked = () => this.refreshDataGrid()

  handleLoadingVisibility = (visibility = false) =>
    this.setState({ isLoading: visibility })

  handleSelectionChange = (selection) => {
    this.setState({
      selectedRows: [
        selection.pop(),
      ],
    })
  }

  refreshDataGrid = () => {
    this.props.dispatch({
      type: 'claimSubmissionApproved/query',
    })
  }

  handleGetStatusClicked = () => {
    const { selectedRows } = this.state
    if (selectedRows.length > 0) {
      this.handleLoadingVisibility(true)
      this.props
        .dispatch({
          type: 'claimSubmissionApproved/getApprovedStatus',
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

  onClickCollectPayment = () => {
    const { dispatch, claimSubmissionApproved } = this.props
    const { selectedRows } = this.state
    const { list } = claimSubmissionApproved || []
    const rows = []
    selectedRows.map((selected) => {
      const row = list.find((x) => x.id === selected)

      // Dev: CollectPaymentModal purpose (Pls delete after complete) -Start
      row.approvedAmount = Math.floor(Math.random() * 100 + 1)
      row.collectedPayment = Math.floor(Math.random() * row.approvedAmount + 1)
      // Dev: CollectPaymentModal purpose (Pls delete after complete) -End

      return rows.push(row)
    })

    let outstandingPayment = []

    outstandingPayment = rows
      .filter(
        (x) =>
          x.approvedAmount > 0 || x.approvedAmount - x.collectedPayment > 0,
      )
      .map((x) => {
        x.amountReceived = x.approvedAmount - x.collectedPayment
        return x
      })

    dispatch({
      type: 'claimSubmission/queryById',
      payload: {
        id: rows[0].id,
      },
    }).then((r) => {
      dispatch({
        type: 'claimSubmissionApproved/updateState',
        payload: {
          entity: {
            rows: outstandingPayment,
            paymentDate: moment(),
            invoicePayerFK: r.payload.invoicePayerFK,
          },
        },
      })
      this.setState({ showCollectPayment: true })
    })
  }

  onCloseCollectPayment = () => this.setState({ showCollectPayment: false })

  render () {
    const {
      classes,
      claimSubmissionApproved,
      handleContextMenuItemClick,
      dispatch,
      values,
    } = this.props
    const { isLoading } = this.state
    const { list } = claimSubmissionApproved || []
    const { showCollectPayment } = this.state
    const { selectedRows } = this.state

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
          modelsName='claimSubmissionApproved'
        >
          <GridItem md={12}>
            <FastField
              name='claimStatus'
              render={(args) => (
                <Select {...args} label='Claim Status' options={[]} />
              )}
            />
          </GridItem>
        </BaseSearchBar>{' '}
        <LoadingWrapper linear loading={isLoading} text='Get status...'>
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
                type='approved'
              />
            </GridItem>
            <GridItem md={4} className={classes.buttonGroup}>
              <ProgressButton
                icon={null}
                color='primary'
                onClick={this.handleGetStatusClicked}
              >
                Get Status
              </ProgressButton>
              <ProgressButton
                icon={null}
                color='success'
                onClick={this.onClickCollectPayment}
                disabled={selectedRows.length <= 0}
              >
                Collect Payment
              </ProgressButton>
            </GridItem>
          </GridContainer>
        </LoadingWrapper>
        <CommonModal
          title='Collect Payment'
          maxWidth='lg'
          open={showCollectPayment}
          onClose={this.onCloseCollectPayment}
          onConfirm={this.onCloseCollectPayment}
        >
          <CollectPaymentModal closeModal={this.onCloseCollectPayment} />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { name: 'ApprovedCHAS' })(ApprovedCHAS)
