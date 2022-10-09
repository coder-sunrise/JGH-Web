import { CommonModal, CommonTableGrid } from '@/components'
import React, { Component } from 'react'
import { useDispatch } from 'dva'

const addressColumns = [
  { name: 'name', title: 'Name' },
  // { name: 'relationship', title: 'Relationship' },
  { name: 'addressInfo', title: 'Current Address' },
]
const schemeColumns = [
  { name: 'name', title: 'Name' },
  // { name: 'relationship', title: 'Relationship' },
  { name: 'schemeInfo', title: 'Current Corporate Scheme' },
]
const columnExtensions = [
  { columnName: 'name', type: 'Text', width: '25%' },
  { columnName: 'relationship', type: 'Text', width: '30%' },
  { columnName: 'addressInfo', type: 'Text' },
  { columnName: 'schemeInfo', type: 'Text' },
]

export default class FamilyMembersInfoUpdate extends Component {
  constructor(props) {
    super(props)
    this.state = {
      familyMembersInfo: [],
    }
  }
  componentWillMount = () => {
    const { dispatch, patientProfileFK, familyMembers = [] } = this.props
    dispatch({
      type: 'patient/getFamilyMembersInfo',
      payload: {
        patientProfileFK,
        familyMembers: JSON.stringify(familyMembers),
      },
    }).then(r => {
      if (r) {
        this.setState({ familyMembersInfo: r })
      }
    })
  }
  render() {
    const {
      familyMembersInfo = [],
      selectedAddressRows = [],
      selectedSchemeRows = [],
    } = this.state
    const {
      onSelectionChange,
      contactAddressUpdateRequired,
      patientFamilyMemberUpdateRequired,
    } = this.props
    const addressList = familyMembersInfo.filter(x => x.addressInfo)
    const schemeList = familyMembersInfo.filter(x => x.schemeInfo)

    return (
      <div>
        {contactAddressUpdateRequired && (
          <div>
            <h5>Do you want to update your Family Members' Address too?</h5>
            <CommonTableGrid
              rows={addressList}
              getRowId={r => r.familyMemberFK}
              columns={addressColumns}
              columnExtensions={columnExtensions}
              selection={selectedAddressRows}
              onSelectionChange={rows => {
                familyMembersInfo.forEach(x => {
                  x.isUpdateAddress = false
                  if (rows.some(i => i === x.familyMemberFK))
                    x.isUpdateAddress = true
                })
                this.setState({ familyMembersInfo, selectedAddressRows: rows })
                onSelectionChange(familyMembersInfo)
              }}
              FuncProps={{
                pager: false,
                selectable: true,
                selectConfig: {
                  showSelectAll: true,
                  rowSelectionEnabled: () => true,
                },
              }}
            />
          </div>
        )}
        {patientFamilyMemberUpdateRequired && (
          <>
            <div>
              <h5>
                Do you want to update your Family Members' Corporate Scheme too?
              </h5>
              <CommonTableGrid
                rows={schemeList}
                getRowId={r => r.familyMemberFK}
                columns={schemeColumns}
                columnExtensions={columnExtensions}
                selection={selectedSchemeRows}
                onSelectionChange={rows => {
                  familyMembersInfo.forEach(x => {
                    x.isUpdateScheme = false
                    if (rows.some(i => i === x.familyMemberFK))
                      x.isUpdateScheme = true
                  })
                  this.setState({ familyMembersInfo, selectedSchemeRows: rows })
                  onSelectionChange(familyMembersInfo)
                }}
                FuncProps={{
                  pager: false,
                  selectable: true,
                  selectConfig: {
                    showSelectAll: true,
                    rowSelectionEnabled: () => true,
                  },
                }}
              />
            </div>
            <div>
              <h5>Do you want to update your Family Members' Address too?</h5>
              <CommonTableGrid
                rows={addressList}
                getRowId={r => r.familyMemberFK}
                columns={addressColumns}
                columnExtensions={columnExtensions}
                selection={selectedAddressRows}
                onSelectionChange={rows => {
                  familyMembersInfo.forEach(x => {
                    x.isUpdateAddress = false
                    if (rows.some(i => i === x.familyMemberFK))
                      x.isUpdateAddress = true
                  })
                  this.setState({
                    familyMembersInfo,
                    selectedAddressRows: rows,
                  })
                  onSelectionChange(familyMembersInfo)
                }}
                FuncProps={{
                  pager: false,
                  selectable: true,
                  selectConfig: {
                    showSelectAll: true,
                    rowSelectionEnabled: () => true,
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    )
  }
}
