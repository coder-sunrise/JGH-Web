import React, { PureComponent } from 'react'
import moment from 'moment'
import numeral from 'numeral'
import { qtyFormat } from '@/utils/config'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import { CommonTableGrid, Button, Tooltip } from '@/components'
import { queryList as queryAppointments } from '@/services/calendar'
import Authorized from '@/utils/Authorized'
import { LoadingWrapper } from '@/components/_medisys'
import { APPOINTMENT_STATUSOPTIONS } from '@/utils/constants'
import { showCurrency } from '@/utils/utils'
import { InventoryTypes } from '@/utils/codes'
import { futureApptTableParams, previousApptTableParams } from './variables'
import { Delete } from '@material-ui/icons'
const PreOrder = ({ values, deletePreOrderItem, disabled }) => {
  const {
    currentAppointment: { appointmentPreOrderItem = [] },
  } = values

  const actualizePreOrderAccessRight = Authorized.check(
    'patientdatabase.modifypreorder.actualizepreorder',
  ) || { rights: 'hidden' }

  return (
    <div>
      <div style={{ margin: '6px 0px' }}>Pre-Order Actualization</div>
      <CommonTableGrid
        forceRender
        size='sm'
        defaultSorting={[{ columnName: 'orderDateDisplay', direction: 'desc' }]}
        rows={appointmentPreOrderItem
          .filter(x => !x.isDeleted)
          .map(appt => {
            const { quantity, dispenseUOM = '' } = appt
            const displayQty = `${numeral(quantity).format(
              qtyFormat,
            )} ${dispenseUOM}`
            return {
              ...appt,
              disabled,
              orderDateDisplay: moment(appt.orderDate).format(
                'DD MMM YYYY HH:mm',
              ),
              displayQty,
              hasPaid: appt.hasPaid ? 'Yes' : 'No',
            }
          })}
        FuncProps={{ pager: false }}
        getRowId={row => row.actualizedPreOrderItemFK}
        columns={[
          { name: 'preOrderItemType', title: 'Type' },
          { name: 'itemName', title: 'Name' },
          { name: 'displayQty', title: 'Order Qty.' },
          { name: 'orderByUser', title: 'Order By' },
          { name: 'orderDateDisplay', title: 'Order Date' },
          { name: 'remarks', title: 'Remarks' },
          { name: 'amount', title: 'Total' },
          { name: 'hasPaid', title: 'Paid' },
          { name: 'action', title: 'Action' },
        ]}
        columnExtensions={[
          { columnName: 'preOrderItemType', sortingEnabled: false, width: 100 },
          {
            columnName: 'itemName',
            sortingEnabled: false,
            render: row => {
              return (
                <Tooltip
                  title={
                    <div>
                      {`Code: ${row.code}`}
                      <br />
                      {`Name: ${row.itemName}`}
                    </div>
                  }
                >
                  <div>{row.itemName}</div>
                </Tooltip>
              )
            },
          },
          {
            columnName: 'displayQty',
            type: 'number',
            precision: 1,
            sortingEnabled: false,
            width: 120,
            render: row => {
              const displayQty = `${numeral(row.quantity).format(
                '0.0',
              )} ${row.dispenseUOM || ''}`
              return (
                <Tooltip title={displayQty}>
                  <span>{displayQty}</span>
                </Tooltip>
              )
            },
          },
          { columnName: 'orderByUser', sortingEnabled: false },
          { columnName: 'orderDateDisplay', sortingEnabled: false, width: 140 },
          { columnName: 'remarks', sortingEnabled: false },
          {
            columnName: 'amount',
            width: 80,
            type: 'currency',
            sortingEnabled: false,
            isDisabled: () => true,
            render: row => {
              return row.hasPaid === 'Yes' ? showCurrency(row.amount) : '-'
            },
          },
          { columnName: 'hasPaid', sortingEnabled: false, width: 50 },
          {
            columnName: 'action',
            width: 60,
            render: row => {
              return (
                actualizePreOrderAccessRight.rights === 'enable' && (
                  <Button
                    size='sm'
                    justIcon
                    color='danger'
                    disabled={row.disabled}
                    onClick={() => {
                      if (deletePreOrderItem) {
                        deletePreOrderItem(row.actualizedPreOrderItemFK)
                      }
                    }}
                  >
                    <Delete />
                  </Button>
                )
              )
            },
          },
        ]}
      />
    </div>
  )
}

export default PreOrder
