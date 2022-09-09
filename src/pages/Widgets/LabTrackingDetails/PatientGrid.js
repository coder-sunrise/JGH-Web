import React, { PureComponent } from 'react'
import moment from 'moment'
import { Edit, Delete } from '@material-ui/icons'
import CommonTableGrid from '@/components/CommonTableGrid'
import {
  Button,
  Tooltip,
  TextField,
  Danger,
  dateFormatLongWithTimeNoSec,
} from '@/components'
import PatientResultButton from './PatientResultPrintBtn'
import Authorized from '@/utils/Authorized'
import { ableToViewByAuthority } from '@/utils/utils'
import { PATIENT_LAB } from '@/utils/constants'
import { Attachment, DeleteWithPopover } from '@/components/_medisys'

class PatientGrid extends PureComponent {
  state = {
    showError: false,
    errorMessage: '',
    cancelReason: '',
    isShowPopover: false,
  }
  configs = {
    columns: [
      { name: 'visitDate', title: 'Visit Date' },
      {
        name: 'doctorProfileFKNavigation.ClinicianProfile.Name',
        title: 'Doctor',
      },
      { name: 'filterServiceName', title: 'Service Name' },
      { name: 'serviceCenterName', title: 'Service Center Name' },
      { name: 'visitPurposeFK', title: 'Visit Type' },
      { name: 'sentBy', title: 'Sent By' },
      { name: 'result', title: 'Attachment' },
      { name: 'labTrackingStatusDisplayValue', title: 'Status' },
      { name: 'remarks', title: 'Remarks' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      { columnName: 'sentBy', width: 100 },
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
      { columnName: 'visitDate', type: 'date', width: 100 },
      {
        columnName: 'doctorProfileFKNavigation.ClinicianProfile.Name',
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
          const pupose = visitPurpose.find(x => x.id === row.visitPurposeFK)
          return (
            <Tooltip title={pupose?.displayValue}>
              <span>{pupose?.code}</span>
            </Tooltip>
          )
        },
      },
      { columnName: 'filterServiceName', sortingEnabled: false },
      {
        columnName: 'serviceCenterName',
        sortBy: 'ServiceCenterFKNavigation.DisplayValue',
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
              <Tooltip title='Edit external tracking record' placement='bottom'>
                <Button
                  size='sm'
                  onClick={() => {
                    this.editRow(row)
                  }}
                  justIcon
                  color='primary'
                  style={{ marginRight: 0 }}
                  disabled={readOnly}
                >
                  <Edit />
                </Button>
              </Tooltip>
              {ableToViewByAuthority(
                'reception.viewexternaltracking.discard',
              ) &&
                row.labTrackingStatusFK !== 5 && (
                  <DeleteWithPopover
                    index={row.id}
                    title='Discard External Tracking'
                    tooltipText='Discard external tracking record'
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
                    onVisibleChange={visible => {
                      this.setState({ isShowPopover: visible })
                    }}
                    isUseCallBack
                    buttonProps={{ style: { marginLeft: 8 } }}
                  />
                )}
            </React.Fragment>
          )
        },
      },
      {
        columnName: 'result',
        width: 220,
        sortingEnabled: false,
        render: row => (
          <div>
            {row.labTrackingResults && (
              <Attachment
                label='Attachment'
                attachments={row.labTrackingResults}
                isReadOnly={true}
                hideRemarks
                listOnly={true}
                simple
                hiddenDelete
                fieldName='labTrackingResults'
              />
            )}
          </div>
        ),
      },
    ],
  }

  editRow = (row, e) => {
    const { dispatch, labTrackingDetails, readOnly, resultType } = this.props
    const { list } = labTrackingDetails
    if (readOnly) return

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
    const { height, resultType } = this.props
    return (
      <CommonTableGrid
        type='labTrackingDetails'
        onRowDoubleClick={(row, e) => {
          if (this.state.isShowPopover) return
          this.editRow(row, e)
        }}
        TableProps={{
          height,
        }}
        {...this.configs}
        columns={
          resultType === PATIENT_LAB.MEDICAL_CHECKUP
            ? this.configs.columns.filter(
                column => ['sentBy', 'remarks'].indexOf(column.name) < 0,
              )
            : this.configs.columns.filter(column => column.name !== 'result')
        }
      />
    )
  }
}

export default PatientGrid
