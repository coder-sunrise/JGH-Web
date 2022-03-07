import React, { PureComponent, Fragment } from 'react'
import Edit from '@material-ui/icons/Edit'
import Print from '@material-ui/icons/Print'
import { connect } from 'dva'
import { CommonTableGrid, Button, Tooltip, notification } from '@/components'
import { status, gstEnabled } from '@/utils/codes'
import Authorized from '@/utils/Authorized'

@connect(({ clinicSettings }) => ({
  clinicSettings,
}))
class Grid extends PureComponent {
  FuncConfig = {
    sort: true,
    sortConfig: {
      defaultSorting: [
        { columnName: 'isActive', direction: 'asc' },
        { columnName: 'coPayerTypeName', direction: 'asc' },
      ],
    },
  }

  editRow = (row, e) => {
    const { dispatch, settingCompany, route, history } = this.props
    const { name } = route
    if (name === 'copayer') {
      const accessRight = Authorized.check('copayer.copayerdetails') || {
        rights: 'hidden',
      }
      if (accessRight && accessRight.rights === 'hidden') {
        return
      }
    } else if (name === 'supplier') {
      const accessRight = Authorized.check('settings.supplier.supplierdetails')
      if (accessRight && accessRight.rights !== 'enable') {
        notification.error({
          message: 'Current user is not authorized to access',
        })
        return
      }
    } else {
      const accessRight = Authorized.check(
        'settings.manufacturer.manufacturerdetails',
      )
      if (accessRight && accessRight.rights !== 'enable') {
        notification.error({
          message: 'Current user is not authorized to access',
        })
        return
      }
    }

    const { list } = settingCompany

    if (name === 'copayer') {
      history.push(`/finance/copayer/editcopayer?id=${row.id}`)
    } else {
      dispatch({
        type: 'settingCompany/updateState',
        payload: {
          showModal: true,
          entity: list.find(o => o.id === row.id),
        },
      })
    }
  }

  handleClick = async copayerId => {
    const { onPrint } = this.props
    if (onPrint) {
      onPrint(copayerId)
    }
  }

  render() {
    const { route, height } = this.props
    const { name } = route

    return (
      <Fragment>
        <CommonTableGrid
          style={{ margin: 0 }}
          type='settingCompany'
          onRowDoubleClick={this.editRow}
          TableProps={{
            height,
          }}
          FuncProps={this.FuncConfig}
          forceRender
          columns={
            name === 'copayer'
              ? [
                  { name: 'code', title: 'Co-Payer Code' },
                  { name: 'displayValue', title: 'Co-Payer Name' },
                  { name: 'coPayerTypeName', title: 'Co-Payer Type' },
                  { name: 'copayerContactPerson', title: 'Contact Person' },
                  { name: 'contactNo', title: 'Contact No.' },
                  { name: 'copayerContactPersonEmail', title: 'Email' },
                  { name: 'url', title: 'Website' },
                  { name: 'creditFacility', title: 'Credit Facility' },
                  { name: 'isActive', title: 'Status' },
                  { name: 'action', title: 'Action' },
                ]
              : name === 'supplier'
              ? [
                  { name: 'code', title: 'Company Code' },
                  { name: 'displayValue', title: 'Company Name' },
                  { name: 'contactPerson', title: 'Contact Person' },
                  { name: 'contactNo', title: 'Contact No.' },
                  { name: 'officeNum', title: 'Office Number' },
                  { name: 'faxNo', title: 'Fax Number' },
                  { name: 'isGSTEnabled', title: 'GST Enable' },
                  { name: 'isActive', title: 'Status' },
                  { name: 'action', title: 'Action' },
                ]
              : [
                  { name: 'code', title: 'Company Code' },
                  { name: 'displayValue', title: 'Company Name' },
                  { name: 'contactPerson', title: 'Contact Person' },
                  { name: 'contactNo', title: 'Contact No.' },
                  { name: 'officeNum', title: 'Office Number' },
                  { name: 'faxNo', title: 'Fax Number' },
                  { name: 'isActive', title: 'Status' },
                  { name: 'action', title: 'Action' },
                ]
          }
          columnExtensions={[
            {
              columnName: 'url',
              sortingEnabled: false,
              width: 300,
              render: row => {
                return (
                  <a
                    rel='noopener noreferrer'
                    target='_blank'
                    href={
                      row.contact &&
                      row.contact.contactWebsite &&
                      row.contact.contactWebsite.website !== ''
                        ? row.contact.contactWebsite.website
                        : '-'
                    }
                  >
                    {row.contact &&
                    row.contact.contactWebsite &&
                    row.contact.contactWebsite.website !== ''
                      ? row.contact.contactWebsite.website
                      : '-'}
                  </a>
                )
              },
            },
            {
              columnName: 'coPayerTypeName',
              sortBy: 'coPayerTypeFK',
              width: 140,
            },
            {
              columnName: 'officeNum',
              sortingEnabled: false,
              width: 120,
              render: row => (
                <span>
                  {row.contact &&
                  row.contact.officeContactNumber &&
                  row.contact.officeContactNumber.number
                    ? row.contact.officeContactNumber.number
                    : '-'}
                </span>
              ),
            },
            {
              columnName: 'contactPerson',
              render: row => (
                <span>{row.contactPerson ? row.contactPerson : '-'}</span>
              ),
            },
            {
              columnName: 'copayerContactPerson',
              sortingEnabled: false,
              render: row => {
                let cell = <span>-</span>
                if (
                  row.defaultContactPerson &&
                  row.defaultContactPerson.name &&
                  row.defaultContactPerson.name !== ''
                ) {
                  cell = (
                    <Tooltip
                      title={row.defaultContactPerson.name}
                      placement='top'
                    >
                      <span>{row.defaultContactPerson.name}</span>
                    </Tooltip>
                  )
                }

                return cell
              },
            },
            {
              columnName: 'copayerContactPersonEmail',
              sortingEnabled: false,
              render: row => {
                let cell = <span>-</span>
                if (
                  row.defaultContactPerson &&
                  row.defaultContactPerson.emailAddress &&
                  row.defaultContactPerson.emailAddress !== ''
                ) {
                  cell = (
                    <Tooltip
                      title={row.defaultContactPerson.emailAddress}
                      placement='top'
                    >
                      <span>{row.defaultContactPerson.emailAddress}</span>
                    </Tooltip>
                  )
                }

                return cell
              },
            },
            {
              columnName: 'creditFacility',
              sortBy: 'creditFacilityFKNavigation.DisplayValue',
            },
            {
              columnName: 'faxNo',
              sortingEnabled: false,
              width: 120,
              render: row => (
                <span>
                  {row.contact &&
                  row.contact.faxContactNumber &&
                  row.contact.faxContactNumber.number
                    ? row.contact.faxContactNumber.number
                    : '-'}
                </span>
              ),
            },
            {
              columnName: 'code',
              width: 180,
            },
            {
              columnName: 'contactNo',
              sortingEnabled: false,
              width: 120,
              render: function(row) {
                //copayer
                if (row.defaultContactPerson) {
                  return (
                    <span>
                      {row.defaultContactPerson.mobileNumber &&
                      row.defaultContactPerson.mobileNumber !== ''
                        ? row.defaultContactPerson.mobileNumber
                        : '-'}
                    </span>
                  )
                }
                // supplier
                else {
                  return (
                    <span>
                      {row.contact &&
                      row.contact.mobileContactNumber &&
                      row.contact.mobileContactNumber.number
                        ? row.contact.mobileContactNumber.number
                        : '-'}
                    </span>
                  )
                }
              },
            },
            {
              columnName: 'isActive',
              sortingEnabled: false,
              type: 'select',
              options: status,
              align: 'center',
              width: 100,
            },
            {
              columnName: 'isGSTEnabled',
              type: 'select',
              options: gstEnabled,
              width: 120,
              sortBy: 'isGSTEnabled',
            },
            {
              columnName: 'action',
              align: 'center',
              width: 100,
              render: row => {
                if (name === 'copayer') {
                  const editDetailAccessRight = Authorized.check(
                    'copayer.copayerdetails',
                  ) || {
                    rights: 'hidden',
                  }
                  return (
                    <div>
                      {editDetailAccessRight.rights !== 'hidden' && (
                        <Tooltip title='Edit Co-Payer' placement='bottom'>
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
                        </Tooltip>
                      )}
                      <Tooltip title='Print Co-Payer Label' placement='bottom'>
                        <Button
                          size='sm'
                          justIcon
                          color='primary'
                          onClick={() => this.handleClick(row.id)}
                        >
                          <Print />
                        </Button>
                      </Tooltip>
                    </div>
                  )
                }
                return (
                  <Authorized authority='settings.supplier.supplierdetails'>
                    <Fragment>
                      <Tooltip title='Edit Supplier' placement='bottom'>
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
                      </Tooltip>
                      <Tooltip title='Print Supplier Label' placement='bottom'>
                        <Button
                          size='sm'
                          justIcon
                          color='primary'
                          onClick={() => this.handleClick(row.id)}
                        >
                          <Print />
                        </Button>
                      </Tooltip>
                    </Fragment>
                  </Authorized>
                )
              },
            },
          ]}
        />
      </Fragment>
    )
  }
}

export default Grid
