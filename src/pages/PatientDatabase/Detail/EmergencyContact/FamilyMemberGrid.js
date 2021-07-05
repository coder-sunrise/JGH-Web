import React, { PureComponent } from 'react'
import _ from 'lodash'
import Loadable from 'react-loadable'
import Add from '@material-ui/icons/Add'
import {
  FastEditableTableGrid,
  Button,
  CommonModal,
  notification,
  Tooltip,
} from '@/components'
import Loading from '@/components/PageLoading/index'
import service from '@/services/patient'
import { getUniqueId,getAppendUrl } from '@/utils/utils'
import { Link } from 'umi'

const { query } = service
class FamilyMemberGrid extends PureComponent {
  state = {
    editingRowIds: [],
    showModal: false,
  }

  tableParas = {
    columns: [
      { name: 'name', title: 'Name' },
      { name: 'accountNoTypeFK', title: 'Account Type' },
      { name: 'accountNo', title: 'Account No.' },
      { name: 'relationshipFK', title: 'Relationship' },
      { name: 'contactNo', title: 'Contact No.' },
      { name: 'remarks', title: 'Remarks' },
    ],
    columnExtensions: [
      {
        columnName: 'name',
        isDisabled: row => true,
        render: (row) => {
          return(
            <div>
              <Link
                to={getAppendUrl({
                  md: 'pt',
                  cmt: 1,
                  pid: row.familyMemberFK,
                },'/patientdb')}
                >
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    textDecoration: 'underline',
                    display: 'inline-block',
                    width: '100%',
                    overflow: 'hidden',
                  }}
                  >
                {row.name}
              </span>
              </Link>
            </div>
          )
        },
      },
      {
        columnName: 'accountNoTypeFK',
        type: 'codeSelect',
        code: 'ctPatientAccountNoType',
        isDisabled: row => true,
        dropdownMatchSelectWidth: false,
      },
      {
        columnName: 'accountNo',
        isDisabled: row => true,
      },
      {
        columnName: 'relationshipFK',
        type: 'codeSelect',
        code: 'ctrelationship',
        sortBy: 'relationshipFK',
        dropdownMatchSelectWidth: false,
      },
      {
        columnName: 'contactNo',
        isDisabled: row => true,
      },      
      {
        columnName: 'remarks',
        maxLength: 100,
      },
    ],
  }

  SearchPatient = Loadable({
    loader: () => import('@/pages/PatientDatabase/Search'),
    loading: Loading,
    render: (loaded, p) => {
      let Component = loaded.default
      return (
        <Component
          renderActionFn={this.renderActionFn}
          onRowDblClick={this.onAddExistPatient}
          simple
          disableAdd
          disableQueryOnLoad
        />
      )
    },
  })

  onRowDoubleClick = row => {
    if (!this.state.editingRowIds.find(o => o === row.id)) {
      this.setState(prevState => ({
        editingRowIds: prevState.editingRowIds.concat([row.id]),
      }))
    }
  }

  toggleModal = () => {
    this.setState(prevState => ({
      showModal: !prevState.showModal,
    }))
  }

  onEditingRowIdsChange = ids => {
    this.setState({
      editingRowIds: ids,
    })
    return ids
  }

  commitChanges = ({ rows }) => {
    const { setFieldValue } = this.props
    setFieldValue('patientFamilyGroup.patientFamilyMember', rows)
  }

  onAddExistPatient = async row => {
    const { props } = this
    const { values, setFieldValue, dispatch } = props
    if (!row || !row.id) return
    const r = await query(row.id)
    const o = r.data
    const patientFamilyMember = _.cloneDeep(values.patientFamilyGroup.patientFamilyMember)
    if (
        patientFamilyMember.find(
        m => m.familyMemberFK === o.id && !m.isDeleted,
      )
    ) {
      notification.warn({
        message: 'This contact person already existed',
      })
      return
    }
    if (o.id === values.id) {
      notification.warn({
        message: 'Can not add this patient himself as contact person',
      })
      return
    }
    if (o.familyGroupFK)
    {
      notification.warn({
        message: 'This patient belongs other family group',
      })
      return
    }    
    const newId = getUniqueId()
    patientFamilyMember.push({
      id: newId,
      isNew: true,
      primaryPatientFK: values.patientFamilyGroup.primaryPatientFK,
      familyGroupFK: values.patientFamilyGroup.id,
      familyMemberFK: o.id,
      relationshipFK: undefined,
      name: o.name,
      remarks: '-',
      accountNoTypeFK:o.patientAccountNoTypeFK,
      accountNo:o.patientAccountNo,
      contactNo:o.contact.mobileContactNumber.number,
    })
    setFieldValue('patientFamilyGroup.patientFamilyMember', patientFamilyMember)
    this.toggleModal()
  }

  renderActionFn = row => {
    return (
      <Tooltip title='Add' placement='bottom'>
        <Button
          size='sm'
          onClick={() => {
            this.onAddExistPatient(row)
          }}
          justIcon
          round
          color='primary'
          style={{ marginRight: 5 }}
        >
          <Add />
        </Button>
      </Tooltip>
    )
  }

  render() {
    const { values, schema } = this.props
    const { SearchPatient = f => f } = this
    if(!values.patientFamilyGroup){
      values.patientFamilyGroup = {
        id : 0,
        name:values.name,
        primaryPatientFK:values.id,
        patientFamilyMember:[],
      }
    }

    return (
      <div>
          <h4><span style={{color:'#cccccc'}}>Family members to</span> <strong>{values.patientFamilyGroup.name}</strong></h4>
        <FastEditableTableGrid
          rows={values.patientFamilyGroup.patientFamilyMember}
          schema={schema.patientFamilyMember._subType}
          FuncProps={{
            pagerConfig: {
              containerExtraComponent: (
                <Button
                  onClick={this.toggleModal}
                  // hideIfNoEditRights
                  color='info'
                  link
                >
                    <Add />
                  Add From Existing Patient
                </Button>
              ),
            },
            pager: false,
          }}
          EditingProps={{
            showAddCommand: false,
            onCommitChanges: this.commitChanges,
            onAddedRowsChange: rows => {
              return rows.map(o => {
                return { contactNo: '', ...o }
              })
            },
          }}
          {...this.tableParas}
        />
        <CommonModal
          open={this.state.showModal}
          title='Search Patient'
          onClose={this.toggleModal}
          showFooter={false}
          maxWidth='lg'
          onConfirm={this.toggleModal}
        >
          <SearchPatient />
        </CommonModal>
      </div>
    )
  }
}

export default FamilyMemberGrid
