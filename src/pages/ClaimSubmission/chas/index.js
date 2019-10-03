import React from 'react'
import { connect } from 'dva'
// common components
import { CommonModal, CardContainer, NavPills } from '@/components'
// sub components
import Draft from './Draft'
import New from './New'
import Submitted from './Submitted'
import Approved from './Approved'
import Rejected from './Rejected'
import ClaimDetails from '../common/ClaimDetails'

@connect(({ claimSubmission }) => ({
  claimSubmission,
}))
class CHAS extends React.Component {
  state = {
    showClaimDetails: false,
    claimDetails: {},
  }

  // openClaimDetails = ({ claimDetails }) =>
  //   this.setState({ showClaimDetails: true, claimDetails })

  openClaimDetails = () => this.setState({ showClaimDetails: true })

  closeClaimDetails = () =>
    this.setState({ showClaimDetails: false, claimDetails: {} })

  navigateToInvoiceDetails = (row) => {
    const { history } = this.props
    const { invoiceNo } = row
    const processedInvoiceNo = invoiceNo.replace('/', '-')

    history.push(`/claim-submission/chas/invoice/${processedInvoiceNo}`)
  }

  handleContextMenuItemClick = (row, id) => {
    const { dispatch } = this.props
    switch (id) {
      case '0':
        dispatch({
          type: 'claimSubmission/queryById',
          payload: row.id,
        })
        // this.openClaimDetails({ claimDetails: row })
        this.openClaimDetails()
        break
      case '1':
        this.navigateToInvoiceDetails(row)
        break
      default:
        break
    }
  }

  render () {
    const { showClaimDetails, claimDetails } = this.state
    return (
      <CardContainer hideHeader size='sm'>
        <NavPills
          active={0}
          tabs={[
            {
              tabButton: 'Draft',
              tabContent: (
                <Draft
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              tabButton: 'New',
              tabContent: (
                <New
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              tabButton: 'Submitted',
              tabContent: (
                <Submitted
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              tabButton: 'Approved',
              tabContent: (
                <Approved
                  handleContextMenuItemClick={this.handleContextMenuItemClick}
                />
              ),
            },
            {
              tabButton: 'Rejected',
              tabContent: (
                <Rejected
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
          onConfirm={this.closeClaimDetails}
        >
          <ClaimDetails claimDetails={claimDetails} />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default CHAS
