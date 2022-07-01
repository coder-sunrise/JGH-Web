import React, { PureComponent } from 'react'
import { Edit } from '@material-ui/icons'
import CommonTableGrid from '@/components/CommonTableGrid'
import { Button, Tooltip } from '@/components'
import PatientResultButton from './PatientResultPrintBtn'
import Authorized from '@/utils/Authorized'

class PatientGrid extends PureComponent {
  configs = {
    columns: [
      { name: 'visitDate', title: 'Visit Date' },
      {
        name: 'doctorProfileFKNavigation.ClinicianProfile.Name',
        title: 'Doctor',
      },
      { name: 'serviceName', title: 'Service Name' },
      { name: 'serviceCenterName', title: 'Service Center Name' },
      { name: 'visitPurposeFK', title: 'Visit Type' },
      { name: 'labTrackingStatusDisplayValue', title: 'Status' },
      { name: 'sentBy', title: 'Sent By' },
      { name: 'remarks', title: 'Remarks' },
      { name: 'action', title: 'Action' },
    ],
    columnExtensions: [
      { columnName: 'sentBy', width: 100 },
      { columnName: 'labTrackingStatusDisplayValue', width: 110 },
      { columnName: 'visitDate', type: 'date' },
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
      {
        columnName: 'action',
        sortingEnabled: false,
        align: 'center',
        width: 100,
        render: row => {
          const { clinicSettings, handlePrintClick } = this.props
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
            </React.Fragment>
          )
        },
      },
    ],
  }

  editRow = (row, e) => {
    const { dispatch, labTrackingDetails, readOnly } = this.props
    const { list } = labTrackingDetails
    if (readOnly) return

    dispatch({
      type: 'labTrackingDetails/updateState',
      payload: {
        showModal: true,
        entity: list.find(o => o.id === row.id),
      },
    })
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

export default PatientGrid
