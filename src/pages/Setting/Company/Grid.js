import React, { PureComponent } from 'react'
import Edit from '@material-ui/icons/Edit'
import { CommonTableGrid, Button, Tooltip, notification } from '@/components'
import { status, gstEnabled } from '@/utils/codes'
import Authorized from '@/utils/Authorized'

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
    const accessRight = Authorized.check('copayer.copayerdetails')
    if (accessRight !== 'enable') {
      notification.error({
        message: 'Current user is not authorized to access',
      })
      return
    }
    const { dispatch, settingCompany } = this.props

    const { list } = settingCompany

    dispatch({
      type: 'settingCompany/updateState',
      payload: {
        showModal: true,
        entity: list.find((o) => o.id === row.id),
      },
    })
  }

  render () {
    const { settingCompany, route } = this.props
    const { name } = route
    const { companyType } = settingCompany

    return (
      <CommonTableGrid
        style={{ margin: 0 }}
        type='settingCompany'
        onRowDoubleClick={this.editRow}
        FuncProps={this.FuncConfig}
        columns={
          name === 'copayer' ? (
            [
              {
                name: 'code',
                title: 'Co-payer Code',
              },

              {
                name: 'displayValue',
                title: 'Co-payer Name',
              },

              { name: 'coPayerTypeName', title: 'Co-payer Type' },

              {
                name: 'contactNo',
                title: 'Contact No.',
              },

              { name: 'url', title: 'URL' },

              { name: 'isActive', title: 'Status' },
              { name: 'action', title: 'Action' },
            ]
          ) : (
            [
              {
                name: 'code',
                title: 'Company Code',
              },

              {
                name: 'displayValue',
                title: 'Company Name',
              },

              { name: 'contactPerson', title: 'Contact Person' },
              { name: 'contactNo', title: 'Contact No.' },

              { name: 'officeNum', title: 'Office Number' },

              { name: 'faxNo', title: 'Fax Number' },
              { name: 'isGSTEnabled', title: 'GST Enable' },
              { name: 'isActive', title: 'Status' },
              { name: 'action', title: 'Action' },
            ]
          )
        }
        // FuncProps={{ pager: false }}
        columnExtensions={[
          {
            columnName: 'url',
            sortingEnabled: false,
            width: 400,
            render: (row) => {
              return (
                <a
                  rel='noopener noreferrer'
                  target='_blank'
                  href={
                    row.contact &&
                    row.contact.contactWebsite &&
                    row.contact.contactWebsite.website !== '' ? (
                      row.contact.contactWebsite.website
                    ) : (
                      '-'
                    )
                  }
                >
                  {row.contact &&
                  row.contact.contactWebsite &&
                  row.contact.contactWebsite.website !== '' ? (
                    row.contact.contactWebsite.website
                  ) : (
                    '-'
                  )}
                </a>
              )
            },
          },
          {
            columnName: 'coPayerTypeName',
            sortBy: 'coPayerTypeFK',
            width: 200,
          },
          {
            columnName: 'officeNum',
            sortingEnabled: false,
            width: 120,
            render: (row) => (
              <span>
                {row.contact &&
                row.contact.officeContactNumber &&
                row.contact.officeContactNumber.number !== '' ? (
                  row.contact.officeContactNumber.number
                ) : (
                  '-'
                )}
              </span>
            ),
          },
          {
            columnName: 'contactPerson',
            render: (row) => (
              <span>{row.contactPerson ? row.contactPerson : '-'}</span>
            ),
          },
          {
            columnName: 'faxNo',
            sortingEnabled: false,
            width: 120,
            render: (row) => (
              <span>
                {row.contact &&
                row.contact.faxContactNumber &&
                row.contact.faxContactNumber.number !== '' ? (
                  row.contact.faxContactNumber.number
                ) : (
                  '-'
                )}
              </span>
            ),
          },
          {
            columnName: 'displayValue',
            width: 500,
          },

          {
            columnName: 'contactNo',
            sortingEnabled: false,
            width: 120,
            render: (row) => (
              <span>
                {row.contact &&
                row.contact.mobileContactNumber &&
                row.contact.mobileContactNumber.number !== '' ? (
                  row.contact.mobileContactNumber.number
                ) : (
                  '-'
                )}
              </span>
            ),
          },
          {
            columnName: 'isActive',
            sortingEnabled: false,
            type: 'select',
            options: status,
            align: 'center',
            width: 120,
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
            render: (row) => {
              return (
                <Authorized authority='copayer.copayerdetails'>
                  <Tooltip
                    title={
                      companyType.id === 1 ? 'Edit Co-Payer' : 'Edit Supplier'
                    }
                    placement='bottom'
                  >
                    <Button
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
                </Authorized>
              )
            },
          },
        ]}
      />
    )
  }
}

export default Grid
