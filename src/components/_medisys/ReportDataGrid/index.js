import React, { memo } from 'react'
// common components
import { CommonTableGrid } from '@/components'

const ReportDataGrid = ({
  data = [],
  columns,
  height,
  noHeight = false,
  loading = false,
  TableProps,
  ...restProps
}) => {
  let tableProps = TableProps || {}
  const reportDataGridHeight = localStorage.getItem('reportDataGridHeight')
  const gridHeight = parseFloat(reportDataGridHeight)
  tableProps.height =
    noHeight || (data.length <= 15 && height === undefined)
      ? undefined
      : height || gridHeight
  return (
    <div style={{ width: '100%' }}>
      <CommonTableGrid
        size='sm'
        FuncProps={{
          pager: false,
        }}
        TableProps={{
          pageSize: 100,
          totalRowCount: data.length,
          loading,
          ...tableProps,
        }}
        rows={data}
        columns={columns}
        {...restProps}
      />
    </div>
  )
}

export default memo(ReportDataGrid)
