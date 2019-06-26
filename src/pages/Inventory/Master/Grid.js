import React, { useEffect } from 'react'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import { Tooltip } from '@material-ui/core'
import { Edit } from '@material-ui/icons'
import { Button, CommonTableGrid2 } from '@/components'

const Grid = ({
  dispatch,
  namespace,
  history,
  tableParas,
  colExtensions,
  list,
}) => {
  useEffect(() => {
    dispatch({
      type: `${namespace}/query`,
    })
  }, [])
  const showDetail = (row, vmode) => () => {
    history.push(`/inventory/master/${namespace}?uid=${row.id}`)
  }

  const Cell = ({ column, row, classes, ...p }) => {
    if (column.name === 'Action') {
      return (
        <Table.Cell {...p}>
          <Tooltip title='Detail' placement='bottom'>
            <Button
              size='sm'
              onClick={showDetail(row)}
              justIcon
              round
              color='primary'
              style={{ marginRight: 5 }}
            >
              <Edit />
            </Button>
          </Tooltip>
        </Table.Cell>
      )
    }
    return <Table.Cell {...p} />
  }
  const TableCell = (p) => Cell({ ...p, dispatch })

  const ActionProps = { TableCellComponent: TableCell }

  return (
    <React.Fragment>
      <CommonTableGrid2
        rows={list}
        columnExtensions={colExtensions}
        ActionProps={ActionProps}
        FuncProps={{ pager: true }}
        {...tableParas}
      />
    </React.Fragment>
  )
}
export default Grid
