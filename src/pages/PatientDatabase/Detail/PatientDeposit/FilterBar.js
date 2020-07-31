import React, { PureComponent } from 'react'
import { findGetParameter } from '@/utils/utils'
import Printer from '@material-ui/icons/Print'
import { ReportViewer } from '@/components/_medisys'
import Authorized from '@/utils/Authorized'
import {
  GridItem,
  FastField,
  CodeSelect,
  Button,
  CommonModal,
} from '@/components'
import Modal from '@/pages/Finance/Deposit/Modal'

class FilterBar extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      reportViewerOpen: false,
      showDepositRefundModal: false,
      isDeposit: true,
    }
  }

  openReportViewer = () => {
    this.setState({ reportViewerOpen: true })
  }

  closeReportViewer = () => {
    this.setState({ reportViewerOpen: false })
  }

  addDepositRefund = async (isDeposit) => {
    const { dispatch, patient: { deposit } } = this.props
    const patientId = Number(findGetParameter('pid'))

    if (deposit && deposit.id > 0) {
      await dispatch({
        type: 'deposit/queryOne',
        payload: {
          id: deposit.id,
        },
      })
    } else {
      dispatch({
        type: 'deposit/updateState',
        payload: {
          showModal: true,
          entity: {
            patientProfileFK: patientId,
          },
        },
      })
    }

    this.setState({
      showDepositRefundModal: true,
      isDeposit,
    })
  }

  toggleModal = () => {
    this.setState((prevState) => ({
      showDepositRefundModal: !prevState.showDepositRefundModal,
    }))
    this.props.refresh()
  }

  render () {
    const { isDeposit, showDepositRefundModal } = this.state
    const { disabled, refundableAmount, selectedTypeIds } = this.props
    const patientId = Number(findGetParameter('pid'))

    return (
      <React.Fragment>
        <GridItem md={3}>
          <CodeSelect
            label='Type'
            value={selectedTypeIds}
            code='LTDepositTransactionType'
            mode='multiple'
            onChange={this.props.handleTypeChange}
          />
        </GridItem>

        <GridItem md={9} style={{ alignSelf: 'center', textAlign: 'right' }}>
          <Button size='lg' onClick={this.openReportViewer} color='primary'>
            <Printer /> Transaction Details
          </Button>
          <Authorized authority='deposit.deposit'>
            <Button
              size='lg'
              onClick={() => {
                this.addDepositRefund(true)
              }}
              disabled={disabled}
              color='primary'
            >
              Deposit
            </Button>
          </Authorized>

          <Authorized authority='deposit.refund'>
            <Button
              size='lg'
              onClick={() => {
                this.addDepositRefund(false)
              }}
              disabled={disabled || refundableAmount <= 0}
              color='primary'
            >
              Refund
            </Button>
          </Authorized>
        </GridItem>
        <CommonModal
          open={showDepositRefundModal}
          title={isDeposit ? 'Deposit' : 'Refund'}
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
          maxWidth='sm'
          observe='Deposit'
          showFooter={false}
          bodyNoPadding
        >
          <Modal isDeposit={isDeposit} />
        </CommonModal>

        <CommonModal
          open={this.state.reportViewerOpen}
          onClose={this.closeReportViewer}
          title='Patient Deposit Transaction Details'
          maxWidth='lg'
        >
          <ReportViewer reportID={57} reportParameters={{ patientId }} />
        </CommonModal>
      </React.Fragment>
    )
  }
}

export default FilterBar
