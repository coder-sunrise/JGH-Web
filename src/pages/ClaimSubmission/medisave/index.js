import React from 'react'
import { connect } from 'dva'
// common components
import { CommonModal, Tabs } from '@/components'
// sub components
import ClaimDetails from '../common/ClaimDetails'
import SubmitClaimStatus from '../common/SubmitClaimStatus'
import { ClaimSubmissionMedisaveTabOption } from './variables'
import Draft from './Draft'
import New from './New'
import Submitted from './Submitted'
import Approved from './Approved'
import Rejected from './Rejected'

@connect(({ claimSubmission, global }) => ({
  claimSubmission,
  global,
}))
class Medisave extends React.Component {
  constructor(props) {
    super(props)
    const { dispatch } = props
    /* dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctschemetype',
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedisavecdmpdiagnosis',
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedisavehealthscreeningdiagnosis',
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedisaveoutpatientscandiagnosis',
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedisavevaccination',
      },
    }) */
  }

  state = {
    showClaimDetails: false,
    showSubmitClaimStatus: false,
    failedCount: 0,
    claimDetails: {},
    activeTab: '2',
    allowEdit: false,
  }

  openClaimDetails = allowEdit =>
    this.setState({ showClaimDetails: true, allowEdit })

  openSubmitClaimStatus = count =>
    this.setState({ showSubmitClaimStatus: true, failedCount: count })

  closeClaimDetailsModal = () => {
    this.setState({
      showClaimDetails: false,
      claimDetails: {},
      allowEdit: false,
    })
  }

  closeClaimDetails = () => {
    this.closeClaimDetailsModal()
  }

  saveClaimDetails = () => {
    if (!this.state.allowEdit) return this.closeClaimDetailsModal()
    const { claimSubmission, dispatch } = this.props
    const { entity } = claimSubmission
    dispatch({
      type: 'medisaveClaimSubmissionNew/upsert',
      payload: { ...entity },
    }).then(r => {
      if (r) {
        this.closeClaimDetailsModal()
      }
    })
    return null
  }

  closeSubmitClaimStatus = () =>
    this.setState({ showSubmitClaimStatus: false, failedCount: 0 })

  navigateToInvoiceDetails = row => {
    const { history } = this.props
    const { invoiceFK } = row
    history.push(`/claim-submission/medisave/invoice/details?id=${invoiceFK}`)
  }

  handleContextMenuItemClick = (row, id, allowEdit = false) => {
    const { dispatch } = this.props
    switch (id) {
      case '0':
        dispatch({
          type: 'claimSubmission/queryById',
          payload: {
            id: row.id,
          },
        }).then(r => {
          if (r) {
            const { patientDetail = {} } = r
            this.openClaimDetails(allowEdit && !!patientDetail.isActive)
          }
        })
        break
      case '1':
        // this.navigateToInvoiceDetails(row)
        dispatch({
          type: 'claimSubmission/queryById',
          payload: {
            id: row.id,
          },
        }).then(r => {
          if (r) this.navigateToInvoiceDetails(r)
        })
        break
      default:
        break
    }
  }

  onChangeTab = e => {
    this.setState({ activeTab: e })
  }

  render() {
    const {
      showClaimDetails,
      showSubmitClaimStatus,
      failedCount,
      claimDetails,
      allowEdit,
    } = this.state
    const claimSubmissionActionProps = {
      handleContextMenuItemClick: this.handleContextMenuItemClick,
      handleSubmitClaimStatus: this.openSubmitClaimStatus,
    }
    const { activeTab } = this.state

    return (
      // <CardContainer hideHeader size='sm'>
      <div>
        <Tabs
          style={{ marginTop: 20 }}
          activeKey={activeTab}
          defaultActivekey='2'
          onChange={this.onChangeTab}
          // options={ClaimSubmissionMedisaveTabOption(claimSubmissionActionProps)}
          options={[
            {
              id: 1,
              name: 'Draft',
              content: (
                <Draft
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              id: 2,
              name: 'New',
              content: (
                <New
                  handleSubmitClaimStatus={this.openSubmitClaimStatus}
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              id: 3,
              name: 'Submitted',
              content: (
                <Submitted
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              id: 4,
              name: 'Approved',
              content: (
                <Approved
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              id: 5,
              name: 'Rejected',
              content: (
                <Rejected
                  handleSubmitClaimStatus={this.openSubmitClaimStatus}
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
          ]}
        />
        <CommonModal
          title='Claim Details'
          open={showClaimDetails}
          onClose={this.closeClaimDetails}
          onConfirm={this.saveClaimDetails}
        >
          <ClaimDetails claimDetails={claimDetails} allowEdit={allowEdit} />
        </CommonModal>

        <CommonModal
          title='Submit Claim Status'
          maxWidth='sm'
          open={showSubmitClaimStatus}
          onClose={this.closeSubmitClaimStatus}
          onConfirm={this.closeSubmitClaimStatus}
        >
          <SubmitClaimStatus count={failedCount} />
        </CommonModal>
      </div>
      // </CardContainer>
    )
  }
}

export default Medisave
