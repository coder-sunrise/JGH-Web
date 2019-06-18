import React, { PureComponent } from 'react'
import { PagingPanel } from '@devexpress/dx-react-grid-material-ui'
import { status } from '@/utils/codes'
import {
  Button,
  CommonModal,
  CommonTableGrid2,
  EditableTableGrid2,
  CardContainer,
} from '@/components'

class AllergyGrid extends PureComponent {
  state = {
    editingRowIds: [],
    rowChanges: {},
  }

  tableParas = {
    columns: [
      { name: 'allergyName', title: 'Allergy Name' },
      { name: 'description', title: 'Allergic Reaction' },
      { name: 'date', title: 'Date' },
      { name: 'status', title: 'Status' }
    ],
    columnExtensions: [
      {
        columnName: 'date',
        type: 'date',
      },
      {
        columnName: 'status',
        type: 'select',
        options: status,
        label: 'Status',
      },
    ],
  }

  constructor (props) {
    super(props)

    const { state } = this
    const { title, titleChildren, dispatch, type } = props

    this.titleComponent = (
      <div style={{ position: 'relative' }}>
        {title}
        {titleChildren}
      </div>
    )

    this.changeEditingRowIds = (editingRowIds) =>
      this.setState({ editingRowIds })
    this.changeRowChanges = (rowChanges) => this.setState({ rowChanges })

    this.onRowDoubleClick = (row) => {
      if (!state.editingRowIds.find((o) => o === row.Id)) {
        this.setState({
          editingRowIds: state.editingRowIds.concat([
            row.Id,
          ]),
        })
      }
    }

    this.commitChanges = ({ added, changed, deleted }) => {
      if (added) {
        this.props.dispatch({
          type: `allergy/add`,
          payload: added.map((o) => {
            return {
              type,
              ...o,
            }
          }),
        })
      }
      if (changed) {
        this.props.dispatch({
          type: `allergy/change`,
          payload: changed,
        })
      }
      if (deleted) {
        dispatch({
          type: `allergy/delete`,
          payload: deleted,
        })
      }
    }

    this.PagerContent = (me) => (p) => {
      return (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute'
            
            }}
          >
          </div>
          <PagingPanel.Container {...p} />
        </div>
      )
    }
  }

  render () {
    const { editingRowIds, rowChanges } = this.state
    const { entity: { items }, type } = this.props

    const EditingProps = {
      showAddCommand: true,
      editingRowIds,
      rowChanges,
      onEditingRowIdsChange: this.changeEditingRowIds,
      onRowChangesChange: this.changeRowChanges,
      onCommitChanges: this.commitChanges,
    }
    return (
      // <CardContainer title={this.titleComponent} hideHeader>
        <EditableTableGrid2
          // height={height}
          rows={items.filter((o) => o.type === type)}
          onRowDoubleClick={this.onRowDoubleClick}
          FuncProps={{
            edit: true,
            pagerConfig: {
              containerComponent: this.PagerContent(this),
            },
          }}
          EditingProps={{
            showAddCommand: true,
            editingRowIds: this.state.editingRowIds,
            rowChanges: this.state.rowChanges,
            onEditingRowIdsChange: this.changeEditingRowIds,
            onRowChangesChange: this.changeRowChanges,
            onCommitChanges: this.commitChanges,
          }}
          {...this.tableParas}
        />
      // </CardContainer>
    )
  }
}

export default AllergyGrid
