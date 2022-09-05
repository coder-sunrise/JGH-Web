import React, { PureComponent } from 'react'
import { Edit, Delete } from '@material-ui/icons'
import CommonTableGrid from '@/components/CommonTableGrid'
import { Button, Tooltip, TextField, Danger } from '@/components'
import PatientResultButton from './PatientResultPrintBtn'
import Authorized from '@/utils/Authorized'
import { ableToViewByAuthority } from '@/utils/utils'
import { DeleteWithPopover } from '@/components/_medisys'

class OverallGrid extends PureComponent {
  state = { showError: false, errorMessage: '', cancelReason: '' }

  configs = {
    columns: [
      { name: 'visitDate', title: 'Visit Date' },
      { name: 'patientAccountNo', title: 'Acc. No' },
      { name: 'referreceNo', title: 'Ref. No' },
      { name: 'patientName', title: 'Patient name' },
      { name: 'visitPurposeFK', title: 'Visit Type' },
      {
        name: 'doctorProfileFKNavigation.ClinicianProfile.Name',
        title: 'Doctor',
      },
      { name: 'filterServiceName', title: 'Service Name' },
      { name: 'serviceCenterName', title: 'Service Center Name' },
      { name: 'supplierName', title: 'Supplier' },
      { name: 'orderedDate', title: 'Ordered Date' },
      { name: 'estimateReceiveDate', title: 'Est. Receive Date' },
      { name: 'receivedDate', title: 'Received Date' },
      { name: 'sentBy', title: 'Sent By' },
      { name: 'remarks', title: 'Remarks' },
      { name: 'labTrackingStatusDisplayValue', title: 'Status' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      { columnName: 'visitDate', type: 'date', width: 100 },
      {
        columnName: 'referreceNo',
        width: 90,
        sortBy:
          'VisitFKNavigation.PatientProfileFkNavigation.PatientReferenceNo',
      },
      { columnName: 'patientAccountNo', width: 100 },
      {
        columnName: 'patientName',
        width: 180,
        render: r => {
          return (
            <Tooltip title={r.patientName}>
              <span
                className='text-auto-hide'
                style={{ position: 'relative', top: 2 }}
              >
                {r.patientName}
              </span>
            </Tooltip>
          )
        },
      },
      { columnName: 'estimateReceiveDate', type: 'date', width: 130 },
      { columnName: 'orderedDate', type: 'date', width: 100 },
      { columnName: 'receivedDate', type: 'date', width: 105 },
      { columnName: 'filterServiceName', width: 200 },
      {
        columnName: 'serviceCenterName',
        width: 200,
        sortBy:
          'ServiceCenterServiceFKNavigation.ServiceCenterFKNavigation.DisplayValue',
      },
      { columnName: 'supplierName', width: 150 },
      {
        columnName: 'labTrackingStatusDisplayValue',
        width: 110,
        render: row => {
          let tooltip = ''
          if (row.labTrackingStatusFK === 5) {
            tooltip = (
              <div>
                <div>
                  {`Discarded by ${row.discardByUser || ''} at ${moment(
                    row.discardDate,
                  ).format(dateFormatLongWithTimeNoSec)}`}
                </div>
                <div>{`Reason: ${row.discardReason}`}</div>
              </div>
            )
          }

          return (
            <Tooltip title={tooltip}>
              <span>{row.labTrackingStatusDisplayValue}</span>
            </Tooltip>
          )
        },
      },
      { columnName: 'sentBy', width: 100 },
      { columnName: 'remarks', width: 200 },
      {
        columnName: 'doctorProfileFKNavigation.ClinicianProfile.Name',
        width: 150,
        render: row => {
          return (
            <Tooltip title={row.doctorName}>
              <span>{row.doctorName}</span>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'visitPurposeFK',
        width: 80,
        sortBy: 'VisitFKNavigation.VisitPurposeFK',
        render: row => {
          const { visitPurpose } = this.props
          var pupose = visitPurpose.find(x => x.id === row.visitPurposeFK)
          return (
            <Tooltip title={pupose?.displayValue}>
              <span>{pupose?.code}</span>
            </Tooltip>
          )
        },
      },
      {
        columnName: 'action',
        sortingEnabled: false,
        align: 'center',
        width: 110,
        render: row => {
          const { clinicSettings, handlePrintClick, classes } = this.props
          const accessRight = Authorized.check('reception/labtracking') || {
            rights: 'hidden',
          }
          const readOnly = accessRight.rights !== 'enable'

          return (
            <React.Fragment>
              <PatientResultButton
                row={row}
                clinicSettings={clinicSettings}
                handlePrint={handlePrintClick}
              />
              <Tooltip title='Edit Patient Lab Result' placement='bottom'>
                <Button
                  disabled={readOnly}
                  size='sm'
                  onClick={() => {
                    this.editRow(row)
                  }}
                  justIcon
                  color='primary'
                  style={{ marginRight: 0 }}
                >
                  <Edit />
                </Button>
              </Tooltip>
              {ableToViewByAuthority(
                'reception.viewexternaltracking.discard',
              ) &&
                row.labTrackingStatusFK !== 5 &&
                (row.labTrackingResults || []).length === 0 && (
                  <DeleteWithPopover
                    index={row.id}
                    title='Discard External Tracking'
                    tooltipText='Discard this external tracking'
                    contentText='Confirm to discard this external tracking?'
                    extraCmd={
                      <div className={classes.errorContainer}>
                        <TextField
                          label='Discard Reason'
                          autoFocus
                          value={this.state.cancelReason}
                          onChange={this.onCancelReasonChange}
                        />
                        {this.state.showError && (
                          <Danger>
                            <span>{this.state.errorMessage}</span>
                          </Danger>
                        )}
                      </div>
                    }
                    onCancelClick={this.handleCancelClick}
                    onConfirmDelete={this.handleConfirmDelete}
                    isUseCallBack
                    buttonProps={{ style: { marginLeft: 8 } }}
                  />
                )}
            </React.Fragment>
          )
        },
      },
    ],
    leftColumns: [
      'visitDate',
      'patientAccountNo',
      'referreceNo',
      'patientName',
    ],
    rightColumns: ['labTrackingStatusDisplayValue', 'action'],
  }

  editRow = (row, e) => {
    const { dispatch, labTrackingDetails, resultType } = this.props
    const { list } = labTrackingDetails

    dispatch({
      type: 'labTrackingDetails/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
        resultType,
      },
    })
  }

  handleCancelClick = () => {
    this.setState({
      showError: false,
      errorMessage: '',
      cancelReason: '',
    })
  }

  onCancelReasonChange = event => {
    if (event.target.value !== '' || event.target.value !== undefined)
      this.setState({
        showError: false,
        cancelReason: event.target.value,
      })
  }

  handleConfirmDelete = async (id, toggleVisibleCallback) => {
    const { dispatch } = this.props
    if (
      this.state.cancelReason === '' ||
      this.state.cancelReason === undefined
    ) {
      this.setState({
        showError: true,
        errorMessage: 'Discard reason is required',
      })
    } else {
      await dispatch({
        type: 'labTrackingDetails/discard',
        payload: {
          id: id,
          cancelReason: this.state.cancelReason,
          cfg: {
            message: 'External tracking discarded.',
          },
        },
      })
      await dispatch({
        type: 'labTrackingDetails/query',
      })
      this.setState({
        showError: false,
        errorMessage: '',
        cancelReason: '',
      })
      toggleVisibleCallback()
    }
  }

  render() {
    const { height } = this.props
    return (
      <CommonTableGrid
        type='labTrackingDetails'
        onRowDoubleClick={this.editRow}
        TableProps={{
          height,
        }}
        {...this.configs}
      />
    )
  }
}

export default OverallGrid
