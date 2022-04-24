import React from 'react'

import _ from 'lodash'
import { Table } from '@devexpress/dx-react-grid-material-ui'

class TableRow extends React.Component {
  shouldComponentUpdate(nextProps) {
    // console.log(nextProps.extraCellConfig, this.props.extraCellConfig)
    // console.log(nextProps.row === this.props.row)
    if (window._forceTableUpdate) {
      return true
    }
    const { extraCellConfig: orgConfig, row: orgRow } = this.props

    const {
      getRowId,
      extraCellConfig,
      columnExtensions = [],
      row,
      forceRender,
    } = nextProps
    if (forceRender) return true
    if (
      window._forceTableRowUpdate &&
      window._forceTableRowUpdate.includes(getRowId(nextProps.row))
    )
      return true

    if (
      extraCellConfig &&
      extraCellConfig.editingCells &&
      extraCellConfig.editingCells.find(
        o => o.rowId === getRowId(nextProps.row),
      )
    )
      return true

    if (
      orgConfig &&
      orgConfig.editingCells &&
      orgConfig.editingCells.find(o => o.rowId === getRowId(this.props.row))
    )
      return true

    // if (columnExtensions.find((o) => typeof o.options === 'function')) {
    //   return true
    // }
    if (orgRow && row && !_.isEqual(orgRow._errors, row._errors)) return true
    if (!_.isEqual(orgRow, row)) return true
    return false
  }

  render() {
    const {
      onRowDoubleClick = undefined,
      onContextMenu = undefined,
      onRowClick = f => f,
      rowMoveable = f => false,
      row,
      tableRow,
      rowSelectionEnabled,
      children,
      ...restProps
    } = this.props
    return (
      <Table.Row
        // {...restProps}
        onDoubleClick={event => {
          onRowDoubleClick && onRowDoubleClick(row || tableRow.row, event)
        }}
        onClick={event => {
          onRowClick(row, event)
        }}
        onContextMenu={event => {
          onContextMenu && onContextMenu(row || tableRow.row, event)
        }}
        className={
          typeof rowMoveable === 'function' && rowMoveable(row)
            ? 'moveable'
            : ''
        }
      >
        {children}
      </Table.Row>
    )
  }
}

export default TableRow
