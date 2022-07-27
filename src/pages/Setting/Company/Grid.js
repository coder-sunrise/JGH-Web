import React, { PureComponent, Fragment } from 'react'
import Edit from '@material-ui/icons/Edit'
import Print from '@material-ui/icons/Print'
import { connect } from 'dva'
import {
  CommonTableGrid,
  Button,
  Tooltip,
  Popover,
  notification,
} from '@/components'
import { status, gstEnabled } from '@/utils/codes'
import Authorized from '@/utils/Authorized'
import { ableToViewByAuthority } from '@/utils/utils'
import { InputNumber } from 'antd'
import { MenuList, ClickAwayListener, MenuItem } from '@material-ui/core'

@connect(({ clinicSettings }) => ({
  clinicSettings,
}))
class Grid extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      showPrintPoper: false,
      copayerLabelCopies: 1,
      coverPageCopies: 1,
      targetPrintId: undefined,
    }
  }
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
      if (accessRight && accessRight.rights === 'hidden') {
        return
      }
    } else {
      const accessRight = Authorized.check(
        'settings.manufacturer.manufacturerdetails',
      )
      if (accessRight && accessRight.rights === 'hidden') {
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
      onPrint(copayerId, undefined, this.state.copayerLabelCopies)
    }
  }

  handleCoverPageClick = async copayerId => {
    const { onPrintCoverPage } = this.props
    if (onPrintCoverPage) {
      onPrintCoverPage(copayerId, this.state.coverPageCopies)
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
                  { name: 'code', title: 'Code' },
                  { name: 'displayValue', title: 'Name' },
                  { name: 'coPayerTypeName', title: 'Type' },
                  { name: 'creditFacility', title: 'Credit Facility' },
                  { name: 'copayerAddress', title: 'Address' },
                  { name: 'copayerContactPerson', title: 'Contact Person' },
                  { name: 'contactNo', title: 'Contact No.' },
                  { name: 'copayerContactPersonEmail', title: 'Email' },
                  { name: 'remark', title: 'Remarks' },
                  { name: 'isActive', title: 'Status' },
                  { name: 'action', title: 'Action' },
                ]
              : name === 'supplier'
              ? [
                  { name: 'code', title: 'Code' },
                  { name: 'displayValue', title: 'Name' },
                  { name: 'contactPerson', title: 'Contact Person' },
                  { name: 'contactNo', title: 'Contact No.' },
                  { name: 'officeNum', title: 'Office Number' },
                  { name: 'faxNo', title: 'Fax Number' },
                  { name: 'isGSTEnabled', title: 'GST Enable' },
                  { name: 'isActive', title: 'Status' },
                  { name: 'action', title: 'Action' },
                ]
              : [
                  { name: 'code', title: 'Code' },
                  { name: 'displayValue', title: 'Name' },
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
              columnName: 'remark',
              sortingEnabled: false,
              width: 200,
              render: row => {
                const title = (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{row.remark}</span>
                )
                return (
                  <Tooltip title={title}>
                    <span>{row.remark}</span>
                  </Tooltip>
                )
              },
            },
            {
              columnName: 'copayerAddress',
              sortingEnabled: false,
              width: 350,
              render: row => {
                let address = `${
                  row.address?.blockNo ? row.address?.blockNo + ', ' : ''
                }${row.address?.street ? row.address?.street + ', ' : ''}${
                  row.address?.unitNo ? row.address?.unitNo + ', ' : ''
                }${
                  row.address?.buildingName
                    ? row.address?.buildingName + ', '
                    : ''
                }${
                  row.address?.countryName
                    ? row.address?.countryName + ', '
                    : ''
                }${row.address?.postcode ? row.address?.postcode + ', ' : ''}`
                address = _.trimEnd(address, ', ')
                return (
                  <Tooltip title={address}>
                    <span>{address}</span>
                  </Tooltip>
                )
              },
            },
            {
              columnName: 'coPayerTypeName',
              sortBy: 'coPayerTypeFK',
              width: 90,
            },
            {
              columnName: 'code',
              sortBy: 'code',
              width: 120,
            },
            {
              columnName: 'displayValue',
              width: 300,
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
              width: 150,
              render: row => (
                <span>{row.contactPerson ? row.contactPerson : '-'}</span>
              ),
            },
            {
              columnName: 'copayerContactPerson',
              sortingEnabled: false,
              width: 150,
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
              width: 150,
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
              width: 200,
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
              width: 80,
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

                      <Popover
                        overlayClassName='noPaddingPopover'
                        visible={
                          this.state.showPrintPoper &&
                          row.id === this.state.targetPrintId
                        }
                        placement='bottomLeft'
                        trigger='click'
                        transition
                        onVisibleChange={val => {
                          if (!val) {
                            this.setState({ showPrintPoper: false })
                          }
                        }}
                        content={
                          <MenuList role='menu'>
                            <MenuItem>
                              <Button
                                color='primary'
                                size='sm'
                                style={{ width: 150 }}
                                onClick={() => this.handleClick(row.id)}
                                disabled={
                                  !Number.isInteger(
                                    this.state.copayerLabelCopies,
                                  )
                                }
                              >
                                Co-Payer Label
                              </Button>
                              <InputNumber
                                size='small'
                                min={1}
                                max={10}
                                value={this.state.copayerLabelCopies}
                                onChange={value =>
                                  this.setState({ copayerLabelCopies: value })
                                }
                                style={{ width: '50px', textAlign: 'right' }}
                              />
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                }}
                              >
                                &nbsp;Copies
                              </span>
                            </MenuItem>
                            <MenuItem>
                              <Button
                                color='primary'
                                size='sm'
                                style={{ width: 150 }}
                                onClick={() =>
                                  this.handleCoverPageClick(row.id)
                                }
                                disabled={
                                  !Number.isInteger(this.state.coverPageCopies)
                                }
                              >
                                Co-Payer Cover Page
                              </Button>
                              <InputNumber
                                size='small'
                                min={1}
                                max={10}
                                value={this.state.coverPageCopies}
                                onChange={value =>
                                  this.setState({ coverPageCopies: value })
                                }
                                style={{ width: '50px', textAlign: 'right' }}
                              />
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                }}
                              >
                                &nbsp;Copies
                              </span>
                            </MenuItem>
                          </MenuList>
                        }
                      >
                        <Tooltip title='Print Label/Cover Page Without Contact Person'>
                          <Button
                            color='primary'
                            justIcon
                            onClick={() => {
                              this.setState({
                                targetPrintId: row.id,
                                showPrintPoper: true,
                              })
                            }}
                            size='sm'
                          >
                            <Print />
                          </Button>
                        </Tooltip>
                      </Popover>
                    </div>
                  )
                }
                const editSupplierDetailAccessRight = Authorized.check(
                  'settings.supplier.supplierdetails',
                ) || {
                  rights: 'hidden',
                }
                const editManufacturerAccessRight = Authorized.check(
                  'settings.manufacturer.manufacturerdetails',
                ) || {
                  rights: 'hidden',
                }
                return (
                  <Fragment>
                    {name == 'manufacturer' ? (
                      <Fragment>
                        {editManufacturerAccessRight.rights !== 'hidden' && (
                          <Tooltip
                            title={`Edit ${name.charAt(0).toUpperCase() +
                              name.slice(1)}`}
                            placement='bottom'
                          >
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
                      </Fragment>
                    ) : (
                      <Fragment>
                        {editSupplierDetailAccessRight.rights !== 'hidden' && (
                          <Tooltip
                            title={`Edit ${name.charAt(0).toUpperCase() +
                              name.slice(1)}`}
                            placement='bottom'
                          >
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
                      </Fragment>
                    )}
                    {name !== 'manufacturer' && (
                      <Tooltip
                        title={`Print ${name.charAt(0).toUpperCase() +
                          name.slice(1)} Label`}
                        placement='bottom'
                      >
                        <Button
                          size='sm'
                          justIcon
                          color='primary'
                          onClick={() => this.handleClick(row.id)}
                        >
                          <Print />
                        </Button>
                      </Tooltip>
                    )}
                  </Fragment>
                )
              },
            },
          ]}
          leftColumns={['code', 'displayValue']}
        />
      </Fragment>
    )
  }
}

export default Grid
