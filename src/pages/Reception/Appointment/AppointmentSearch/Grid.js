import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
// react dev grid
import { Table } from '@devexpress/dx-react-grid-material-ui'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  CommonTableGrid,
  timeFormat,
  timeFormat24HourWithSecond,
  Tooltip,
  Button,
} from '@/components'
// utils
import Authorized from '@/utils/Authorized'
import { AppointmentTypeLabel } from '@/components/_medisys'
import { mapApptStatus, INVALID_APPOINTMENT_STATUS} from '@/utils/constants'
import { grayColors } from '@/assets/jss'
import { FileAddTwoTone } from '@ant-design/icons'

const styles = (theme) => ({
  subRow: {
    '& > td:first-child': {
      paddingLeft: theme.spacing(1),
    },
  },
  disabledRow: {
    '& > td':{
      color: grayColors[3],
    }
  },
})

@connect(({ codetable }) => ({
  appointmentTypes: codetable.ctappointmenttype,
}))
class Grid extends PureComponent {
  appointmentRow = (p) => {
    const { classes, handleDoubleClick } = this.props
    const { row, children, tableRow } = p
    let newchildren = []
    const middleColumns = children.slice(3, 9)

    if (row.countNumber === 1) {
      newchildren.push(
        children.filter((value, index) => index < 3).map((item) => ({
          ...item,
          props: {
            ...item.props,
            rowSpan: row.rowspan,
          },
        })),
      )

      newchildren.push(middleColumns)

      newchildren.push(
        children.filter((value, index) => index > 8).map((item) => ({
          ...item,
          props: {
            ...item.props,
            rowSpan: row.rowspan,
          },
        })),
      )
    } else {
      newchildren.push(middleColumns)
    }

    const selectedData = {
      ...tableRow.row,
      doctor: null,
    }

    const isDisabledRow = () => {
      return (INVALID_APPOINTMENT_STATUS.indexOf(selectedData.appointmentStatusFk) > -1)
    }

    const doubleClick = () => {
      const accessRight = Authorized.check('appointment.appointmentdetails')

      if (!accessRight || (accessRight && accessRight.rights !== 'enable'))
        return

      if(isDisabledRow())
        return
      
      handleDoubleClick(selectedData)
    }

    const disabledRowClass = isDisabledRow() ? ` ${classes.disabledRow}` : null
    if (row.countNumber === 1) {
      return (
        <Table.Row {...p} onDoubleClick={doubleClick} className={disabledRowClass}>
          {newchildren}
        </Table.Row>
      )
    }
    return (
      <Table.Row {...p} className={classes.subRow + disabledRowClass} onDoubleClick={doubleClick}>
        {newchildren}
      </Table.Row>
    )
  }

  render () {
    const { height, handleCopyAppointmentClick } = this.props
    return (
      <CommonTableGrid
        style={{ marginTop: 10 }}
        type='appointment'
        getRowId={(row) => row.uid}
        columns={[
          { name: 'patientName', title: 'Patient' },
          { name: 'patientRefrenceNo', title: 'Ref. No.' },
          { name: 'patientAccountNo', title: 'Acc. No.' },
          { name: 'patientContactNo', title: 'Contact No.' },
          { name: 'appointmentDate', title: 'Appt Date' },
          { name: 'duration', title: 'Duration' },
          { name: 'doctor', title: 'Doctor' },
          { name: 'appointmentTypeFK', title: 'Appt Type' },
          { name: 'roomFk', title: 'Room' },
          { name: 'appointmentRemarks', title: 'Remarks' },
          { name: 'appointmentStatusFk', title: 'Appt Status' },
          { name: 'bookedByUser', title: 'Book By' },
          { name: 'bookOn', title: 'Book On' },
          { name: 'updateByUser', title: 'Update By' },
          { name: 'updateDate', title: 'Update On' },
          { name: 'action', title: 'Action' },
        ]}
        columnExtensions={[
          {
            columnName: 'patientName',
            sortingEnabled: false,
          },
          {
            columnName: 'patientRefrenceNo',
            sortBy: 'patientRefrenceNo',
            width: 130,
          },
          {
            columnName: 'patientAccountNo',
            sortBy: 'patientAccountNo',
            width: 130,
          },
          {
            columnName: 'patientContactNo',
            sortBy: 'contactNumber',
            width: 130,
          },
          {
            columnName: 'appointmentDate',
            type: 'date',
            width: 140,
            render: (row) => `${moment(row.appointmentDate).format('DD MMM YYYY')} ${moment(row.apptTime, 'HH:mm').format('HH:mm')}`
          },
          {
            columnName: 'duration',
            sortingEnabled: false,
            width: 80,
          },
          {
            columnName: 'doctor',
            sortingEnabled: false,
          },
          {
            columnName: 'appointmentTypeFK',
            sortingEnabled: false,
            render: (row) => {
              const { appointmentTypeFK } = row
              const { appointmentTypes = [] } = this.props
              const appointmentType = appointmentTypes.find(
                (item) => item.id === appointmentTypeFK,
              )

              if (!appointmentType) return null
              return (
                <AppointmentTypeLabel
                  color={appointmentType.tagColorHex}
                  label={appointmentType.displayValue}
                />
              )
            },
          },
          {
            columnName: 'roomFk',
            type: 'codeSelect',
            code: 'ctroom',
            sortingEnabled: false,
          },
          {
            columnName: 'appointmentRemarks',
            sortingEnabled: false,
          },
          {
            columnName: 'appointmentStatusFk',
            type: 'codeSelect',
            code: 'ltappointmentstatus',
            sortBy: 'status',
            width: 130,
          },
          {
            columnName: 'bookedByUser',
            sortingEnabled: false,
          },
          {
            columnName: 'bookOn',
            type: 'date',
            width: 100,
          },
          {
            columnName: 'updateByUser',
            sortingEnabled: false,
            render:(row)=> {
              const content = `${mapApptStatus(row.appointmentStatusFk)} by ${row.updateByUser}`
              return <Tooltip title={content}><span>{content}</span></Tooltip>
            }
          },
          {
            columnName: 'updateDate',
            type: 'date',
            width: 140,
            sortingEnabled: false,
            render:(row)=> moment(row.updateDate).format('DD MMM YYYY HH:mm')
          },
          {
            columnName: 'action',
            width: 60,
            sortingEnabled: false,
            align:'center',
            render:(row)=> {
              const accessRight = Authorized.check('appointment.appointmentdetails')
              const createApptAccessRight = Authorized.check('appointment.newappointment')
              if (!accessRight ||  accessRight.rights !== 'enable' || !createApptAccessRight || createApptAccessRight.rights !== 'enable')
                return
              return INVALID_APPOINTMENT_STATUS.indexOf(row.appointmentStatusFk) === -1 && (
                <Tooltip title='Copy'>
                  <Button color='transparent' style={{float:'right'}} justIcon onClick={()=>handleCopyAppointmentClick(row.appointmentFK)}>
                    <FileAddTwoTone />
                  </Button>
                </Tooltip>
              )
            }
          },
        ]}
        TableProps={{ rowComponent: this.appointmentRow, height }}
        FuncConfig={{
          pager: true,
          pagerDefaultState: {
            pagesize: 100,
          },
          sort: true,
          sortConfig: {
            defaultSorting: [{ columnName: 'appointmentDate', direction: 'asc' }],
          },
        }}
      />
    )
  }
}

export default withStyles(styles, { withTheme: true })(Grid)
