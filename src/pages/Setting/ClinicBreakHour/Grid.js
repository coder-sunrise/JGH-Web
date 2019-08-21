import React, { PureComponent } from 'react'
import { CommonTableGrid, Button } from '@/components'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import { status } from '@/utils/codes'
import Delete from '@material-ui/icons/Delete'
import Edit from '@material-ui/icons/Edit'
import moment from 'moment'
import * as service from './services'
import FromToTime from './FromToTime'

export default class Grid extends PureComponent {
  editRow = (row, e) => {
    const { dispatch, settingClinicBreakHour } = this.props

    const { list } = settingClinicBreakHour

    dispatch({
      type: 'settingClinicBreakHour/updateState',
      payload: {
        showModal: true,
        entity: list.find((o) => o.id === row.id),
      },
    })
  }
  render () {
    const {
      dispatch,
      classes,
      settingClinicBreakHour,
      toggleModal,
    } = this.props
    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='settingClinicBreakHour'
        onRowDoubleClick={this.editRow}
        columns={[
          { name: 'displayValue', title: 'Display Value' },
          { name: 'code', title: 'Code' },
          { name: 'isActive', title: 'Status' },
          { name: 'mondayTiming', title: 'Monday' },
          { name: 'tuesdayTiming', title: 'Tuesday' },
          { name: 'wednesdayTiming', title: 'Wednesday' },
          { name: 'thurdayTiming', title: 'Thursday' },
          { name: 'fridayTiming', title: 'Friday' },
          { name: 'saturdayTiming', title: 'Saturday' },
          { name: 'sundayTiming', title: 'Sunday' },
          { name: 'action', title: 'Action' },
        ]}
        // FuncProps={{ pager: false }}
        columnExtensions={[
          {
            columnName: 'isActive',
            sortingEnabled: false,
            type: 'select',
            options: status,
          },
          {
            columnName: 'action',
            align: 'center',
            render: (row) => {
              return (
                <Button
                  size='sm'
                  onClick={() => {
                    this.editRow(row)
                  }}
                  justIcon
                  color='primary'
                >
                  <Edit />
                </Button>
              )
            },
          },
          {
            columnName: 'mondayTiming',

            align: 'center',
            render: (row) => {
              return <FromToTime from={row.monFromBreak} to={row.monToBreak} />
            },
          },
          {
            columnName: 'tuesdayTiming',
            align: 'center',
            render: (row) => {
              return <FromToTime from={row.tueFromBreak} to={row.tueToBreak} />
            },
          },
          {
            columnName: 'wednesdayTiming',
            align: 'center',
            render: (row) => {
              return <FromToTime from={row.wedFromBreak} to={row.wedToBreak} />
            },
          },
          {
            columnName: 'thurdayTiming',
            align: 'center',
            render: (row) => {
              return (
                <FromToTime from={row.thursFromBreak} to={row.thursToBreak} />
              )
            },
          },
          {
            columnName: 'fridayTiming',
            align: 'center',
            render: (row) => {
              return <FromToTime from={row.friFromBreak} to={row.friToBreak} />
            },
          },
          {
            columnName: 'saturdayTiming',
            align: 'center',
            render: (row) => {
              return <FromToTime from={row.satFromBreak} to={row.satToBreak} />
            },
          },
          {
            columnName: 'sundayTiming',
            align: 'center',
            render: (row) => {
              return <FromToTime from={row.sunFromBreak} to={row.sunToBreak} />
            },
          },
        ]}
      />
    )
  }
}
