import React, { useState } from 'react'
import Edit from '@material-ui/icons/Edit'

import { status } from '@/utils/codes'
import Authorized from '@/utils/Authorized'
import { Button, CommonTableGrid, Tooltip, notification } from '@/components'

const viewSchemDetailAuthority = 'scheme.schemedetails'

const Grid = ({ history, height }) => {
  const [tableParas] = useState({
    columns: [
      { name: 'code', title: 'Scheme Code' },
      { name: 'name', title: 'Scheme Name' },
      { name: 'description', title: 'Description' },
      { name: 'schemeTypeName', title: 'Scheme Type' },
      { name: 'coPayerCode', title: 'Co-Payer Code' },
      { name: 'coPayerName', title: 'Co-Payer Name' },
      { name: 'coPayerType', title: 'Co-Payer Type' },
      { name: 'isActive', title: 'Status' },
      { name: 'action', title: 'Action' },
    ],
    leftColumns: [],
  })
  const editRow = (row, e) => {
    const accessRight = Authorized.check(viewSchemDetailAuthority)
    if (!accessRight || accessRight.rights !== 'enable') {
      notification.error({
        message: 'Current user is not authorized to access',
      })
      return
    }

    history.push(`/finance/scheme/details?id=${row.id}`)
  }

  const colExtenstions = [
    {
      columnName: 'code',
      width: 120,
    },
    {
      columnName: 'schemeTypeName',
      sortBy: 'SchemeTypeFKNavigation.displayValue',
      width: 120,
    },
    {
      columnName: 'coPayerType',
      sortBy: 'CopayerFKNavigation.copayerTypeFK',
      width: 120,
    },
    {
      columnName: 'coPayerName',
      sortBy: 'CopayerFKNavigation.displayValue',
      width: 300,
      render: row => {
        let {
          coPayerCode,
          coPayerName = '',
          creditFacility = '',
          copayerAddress = '',
        } = row
        return (
          <Tooltip
            title={
              <>
                <div>
                  <span>{coPayerCode ? `${coPayerCode} - ` : ''} </span>
                  <span> {coPayerName} </span>
                </div>
                <div>{`Cr. Facility: ${
                  creditFacility !== '' ? creditFacility : '-'
                }`}</div>
                <div>{`Addr.: ${copayerAddress || ' - '}`}</div>
              </>
            }
          >
            <div>{coPayerName}</div>
          </Tooltip>
        )
      },
    },
    {
      columnName: 'coPayerCode',
      sortBy: 'CopayerFKNavigation.Code',
      width: 130,
    },
    {
      columnName: 'isActive',
      sortingEnabled: false,
      width: 90,
      type: 'select',
      options: status,
    },
    {
      columnName: 'action',
      width: 90,
      align: 'center',
      render: row => (
        <Authorized authority={viewSchemDetailAuthority}>
          <Tooltip title='Edit' placement='bottom'>
            <Button
              size='sm'
              onClick={() => editRow(row)}
              justIcon
              color='primary'
              style={{ marginRight: 5 }}
            >
              <Edit />
            </Button>
          </Tooltip>
        </Authorized>
      ),
    },
  ]

  return (
    <React.Fragment>
      <CommonTableGrid
        type='copaymentScheme'
        columnExtensions={colExtenstions}
        onRowDoubleClick={editRow}
        TableProps={{
          height,
        }}
        {...tableParas}
      />
    </React.Fragment>
  )
}
export default Grid
