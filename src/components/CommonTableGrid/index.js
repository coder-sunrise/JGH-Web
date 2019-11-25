import React, { PureComponent } from 'react'

import { isNumber } from 'util'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  MuiThemeProvider,
  createMuiTheme,
  withStyles,
} from '@material-ui/core/styles'
// import Paper from '@material-ui/core/Paper'
import { Paper, Tooltip, IconButton } from '@material-ui/core'
import { hoverColor, tableEvenRowColor } from 'mui-pro-jss'
import ArrowDropDown from '@material-ui/icons/ArrowDropDown'
import ArrowDropUp from '@material-ui/icons/ArrowDropUp'

import classNames from 'classnames'
import { connect } from 'dva'
import { Getter, PluginContainer } from '@devexpress/dx-react-core'
import {
  FilteringState,
  GroupingState,
  IntegratedGrouping,
  IntegratedPaging,
  IntegratedSelection,
  IntegratedSorting,
  IntegratedSummary,
  PagingState,
  SelectionState,
  SortingState,
  SummaryState,
  CustomPaging,
  TreeDataState,
  CustomTreeData,
} from '@devexpress/dx-react-grid'

import {
  DragDropProvider,
  Grid as DevGrid,
  GroupingPanel,
  PagingPanel,
  Table,
  TableGroupRow,
  TableHeaderRow,
  TableSummaryRow,
  TableSelection,
  Toolbar,
  TableFixedColumns,
  VirtualTable,
  TableTreeColumn,
} from '@devexpress/dx-react-grid-material-ui'
import { smallTheme, defaultTheme } from '@/utils/theme'
import NumberTypeProvider from './EditCellComponents/NumberTypeProvider'
import TextTypeProvider from './EditCellComponents/TextTypeProvider'
import SelectTypeProvider from './EditCellComponents/SelectTypeProvider'
import DateTypeProvider from './EditCellComponents/DateTypeProvider'
import RangeDateTypeProvider from './EditCellComponents/RangeDateTypeProvider'
import RadioTypeProvider from './EditCellComponents/RadioTypeProvider'
import TimeTypeProvider from './EditCellComponents/TimeTypeProvider'
import RowErrorTypeProvider from './EditCellComponents/RowErrorTypeProvider'
import PatchedTableSelection from './plugins/PatchedTableSelection'
import PatchedIntegratedSelection from './plugins/PatchedIntegratedSelection'
import { LoadingWrapper } from '@/components/_medisys'

window.$tempGridRow = {}

const cellStyle = {
  cell: {
    // borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
  },
}

// console.log(colorManipulator)
const styles = (theme) => ({
  tableCursorPointer: {
    cursor: 'default',
  },

  tableStriped: {
    '& > tbody > tr:nth-of-type(odd), & > thead > tr': {
      // backgroundColor: colorManipulator.fade(
      //   theme.palette.secondary.main,
      //   0.01,
      // ),
      backgroundColor: '#ffffff',
    },
    '& > tbody > tr:nth-of-type(even)': {
      backgroundColor: tableEvenRowColor,
    },
    '& > tbody > tr:hover': {
      // backgroundColor: colorManipulator.fade(
      //   theme.palette.secondary.main,
      //   0.05,
      // ),
      backgroundColor: hoverColor,
    },

    '& > tbody > tr.grid-edit-row': {
      backgroundColor: '#ffffff',
    },

    '& > tbody > tr.grid-edit-row:hover': {
      backgroundColor: '#ffffff',
    },
  },
  paperContainer: {
    // margin: '0 5px',
    '& > div': {
      width: '100%',
    },
  },
})

const Root = (props) => <DevGrid.Root {...props} style={{ height: '100%' }} />

const DefaultTableCell = React.memo(
  ({ dispatch, ...props }) => <Table.Cell {...props} />,
  (prevProps, nextProps) => {
    // console.log(prevProps, nextProps)
    // console.log(prevProps === nextProps, prevProps.row === nextProps.row)
    return prevProps === nextProps || prevProps.row === nextProps.row
  },
)
const getIndexedRows = (rows = [], pagerConfig = {}) => {
  const startIndex = pagerConfig.current
    ? pagerConfig.pagesize * (pagerConfig.current - 1)
    : 0
  // console.log(startIndex)
  // console.log(rows)
  return rows.map((o, i) => {
    return {
      rowIndex: startIndex + i,
      ...o,
    }
  })
}
let uniqueGid = 0
@connect(({ loading, global }) => {
  return { loading, global }
})
class CommonTableGrid extends PureComponent {
  state = {
    pagination: {
      current: 1,
      pagesize: 10,
    },
  }

  static defaultProps = {
    columnExtensions: [],
  }

  constructor (props) {
    super(props)
    const {
      classes,
      theme,
      oddEven = true,
      onRowDoubleClick = undefined,
      onContextMenu = undefined,
      onRowClick = (f) => f,
      rowMoveable = (f) => false,
    } = props
    // console.log(props)
    this.gridId = `view-${uniqueGid++}`
    // this.myRef = React.createRef()
    const cls = classNames({
      [classes.tableStriped]: oddEven,
      [classes.tableCursorPointer]: onRowDoubleClick !== undefined,
    })
    const TableComponent = ({ ...restProps }) => {
      // console.log('TableComponent', restProps)
      return <Table.Table {...restProps} className={cls} />
    }

    this.TableBase = ({ height, scrollable, dispatch, ...restProps }) => {
      return height ? (
        <VirtualTable
          {...restProps}
          height={height}
          // height='auto'
          tableComponent={TableComponent}
        />
      ) : (
        <Table {...restProps} tableComponent={TableComponent} />
      )
    }

    this.TableRow = ({ row, tableRow, ...restProps }) => {
      return (
        <Table.Row
          {...restProps}
          onDoubleClick={(event) => {
            onRowDoubleClick && onRowDoubleClick(row || tableRow.row, event)
          }}
          onClick={(event) => {
            onRowClick(row, event)
          }}
          onContextMenu={(event) => {
            onContextMenu && onContextMenu(row || tableRow.row, event)
          }}
          className={
            typeof rowMoveable === 'function' && rowMoveable(row) ? (
              'moveable'
            ) : (
              ''
            )
          }
        />
      )
    }

    this.TableHeaderRow = ({ row, ...restProps }) => (
      <TableHeaderRow
        {...restProps}
        titleComponent={({ children }) => {
          return (
            <Tooltip title={children} placement='top'>
              <div>{children}</div>
            </Tooltip>
          )
        }}
        sortLabelComponent={({ children, ...p }) => {
          // console.log({ children, p })

          return (
            <TableHeaderRow.SortLabel
              {...p}
              getMessage={(ps) => {
                // console.log(ps)
                return ''
              }}
            >
              <Tooltip title={children} placement='top'>
                <div>{children}</div>
              </Tooltip>
            </TableHeaderRow.SortLabel>
          )
        }}
      />
    )

    this.defaultFunctionConfig = {
      filter: false,
      selectable: false,
      pager: true,
      pagerStateConfig: {
        onCurrentPageChange: (current) => {
          this.search({
            current: current + 1,
          })
        },
        onPageSizeChange: (pagesize) => {
          this.search({
            pagesize,
            current: 1,
          })
        },
      },
      grouping: false,
      groupingConfig: {},
      tree: false,
      sort: true,
      sortConfig: {},
      summary: false,
      summaryConfig: {},
    }

    const tableRowSharedRootConfig = {
      '&.moveable ~ tr td.td-move-cell button:nth-child(1)': {
        display: 'block !important',
      },
      '&.moveable:last-of-type td.td-move-cell button:nth-child(2)': {
        display: 'none !important',
      },
      '& td:not(.td-move-cell) .move-button': {
        visibility: 'hidden',
      },
    }
    const sizeConfig = {
      sm: {
        ...smallTheme.overrides,
        MuiTableRow: {
          head: {
            height: 'auto',
          },
          root: {
            height: 'auto',
            ...tableRowSharedRootConfig,
          },
        },
        TableNoDataCell: {
          cell: {
            padding: '24px 0px',
          },
        },
        MuiTableCell: {
          root: {
            padding: '5px 0',
            fontSize: '1em',
          },
        },
        EditCell: {
          cell: {
            padding: '4px 2px 3px 2px',
            ...cellStyle.cell,
          },
        },
        Pager: {
          pager: {
            padding: `0 8px`,
          },
        },
        Pagination: {
          button: {
            fontWeight: 300,
            margin: `${theme.spacing(0.5)}px 0`,
          },
        },
      },
      md: {
        ...defaultTheme.overrides,
        MuiTableRow: {
          root: {
            ...tableRowSharedRootConfig,
          },
        },
        PageSizeSelector: {
          label: {
            fontSize: '0.9rem',
            marginBottom: 3,
          },
        },
        Pagination: {
          rowsLabel: {
            fontSize: '0.9rem',
          },
        },
      },
    }
    const size = props.size || theme.props.size
    this.theme = createMuiTheme({
      overrides: {
        RootBase: {
          root: {
            width: '100%',
          },
        },
        TableFixedCell: {
          fixedCell: {
            zIndex: 1,
            overflow: 'visible',
            backgroundColor: 'inherit',
            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
          },
          dividerRight: {
            borderRightWidth: 0,
          },
        },
        TableCell: cellStyle,
        EditCell: {
          cell: {
            padding: '7px 8px 7px 8px',
            ...cellStyle.cell,
          },
        },
        TableHeaderCell: cellStyle,
        Table: {
          table: {
            borderCollapse: 'collapse',
          },
          stickyTable: {
            ' & > thead > tr': {
              backgroundColor: '#ffffff',
            },
          },
        },
        MuiTableCell: {
          root: {
            padding: '7px 4px 7px 4px',
            fontSize: '1em',
          },
        },
        // PrivateRadioButtonIcon: {
        //   root: {
        //     display: 'none',
        //   },
        // },
        PrivateSwitchBase: {
          root: {
            padding: 0,
          },
        },
        Pagination: {
          button: {
            fontWeight: 300,
          },
        },
        SortLabel: {
          root: {
            '& .Mui-disabled > svg': {
              display: 'none',
            },
          },
        },
        ...sizeConfig[size],
      },
    })
    // console.log(this.theme)
    // this.search()
    // console.log(props.query, ' c grid')
  }

  static getDerivedStateFromProps (nextProps, preState) {
    const { entity, type, columnExtensions } = nextProps
    // console.log(nextProps)
    let _entity = entity
    if (type) {
      _entity = window.g_app._store.getState()[type]
    }

    if (
      _entity &&
      !_.isEqual(_entity, preState.entity)
      // (_entity.pagination !== preState.pagination ||
      //   _entity.filter !== preState.filter ||
      //   )
    ) {
      // console.log(_entity.filter)
      if (_entity.filter && _entity.filter.sorting) {
        _entity.filter.sorting.forEach((o) => {
          const c = columnExtensions.find((m) => m.sortBy === o.columnName)
          if (c) {
            o.columnName = c.sortBy || c.columnName
          }
        })
      }
      return {
        pagination: _entity.pagination,
        rows: _entity.list,
        filter: _entity.filter,
        entity: _entity,
      }
    }
    if (nextProps.rows && nextProps.rows !== preState.rows) {
      return {
        rows: nextProps.rows,
      }
    }

    return null
  }

  // componentDidMount () {
  //   watchForElementChange({
  //     container: this.myRef.current,
  //     selector: 'tr.grid-new-row',
  //     config: {
  //       // subtree: true,
  //       childList: true,
  //     },
  //     ongoing: true,
  //     callback: (mutation) => {
  //       console.log(mutation)
  //     },
  //   })
  // }

  // shouldComponentUpdate = (nextProps, nextState) => {
  //   const { values, nameDateFrom, nameDateTo } = this.props
  //   // const { values: nextValues } = nextProps

  //   // const { checkedAllDate } = this.state

  //   // const isValuesEmpty =
  //   //   Object.entries(values).length === 0 && values.constructor === Object
  //   // const isNextValuesEmpty =
  //   //   Object.entries(nextValues).length === 0 &&
  //   //   nextValues.constructor === Object

  //   // if (!isValuesEmpty && !isNextValuesEmpty) {
  //   //   return (
  //   //     nextValues[nameDateFrom] !== values[nameDateFrom] ||
  //   //     nextValues[nameDateTo] !== values[nameDateTo] ||
  //   //     nextState.checkedAllDate !== checkedAllDate
  //   //   )
  //   // }
  //   console.log(nextProps, nextState)
  //   console.log(this.props, this.state)
  //   console.log(nextProps === this.props, nextState === this.state)
  //   return true
  // }

  search = (payload) => {
    const { query, dispatch, type, queryMethod = 'query' } = this.props
    // window.$tempGridRow[this.gridId] = {}
    if (query) {
      query({
        callback: (data) => {
          // console.log(data)
          if (data) {
            const { current, data: list, pagesize, totalRecords } = data

            this.setState({
              data: list,
              pagination: {
                totalRecords,
                current,
                pagesize,
                ...payload,
              },
            })
          }
        },
        ...payload,
      })
    } else if (this.state.entity) {
      const p = {
        ...this.state.entity.pagination,
        ...payload,
      }
      dispatch({
        type: `${type}/${queryMethod}`,
        payload: p,
      }).then(() => {
        this.setState((ps) => {
          return {
            pagination: {
              ...ps.pagination,
              ...payload,
            },
          }
        })
      })
    } else {
      const { pagination } = this.state
      // console.log(payload.sorting[0].direction)
      // if (payload.sorting) {
      //   payload.sorting[0].columnName
      //   // payload.sorting[0].direction =
      //   //   payload.sorting[0].direction === 'asc' ? 'desc' : 'asc'
      // }
      // payload.current &&

      this.setState({
        pagination: {
          ...pagination,
          ...payload,
        },
      })
    }
  }

  moveRow = (row, direction) => () => {
    const { onRowMove } = this.props
    if (onRowMove) onRowMove(row, direction)
  }

  Cell = (p) => {
    const { columnExtensions = [], extraState, getRowId } = this.props
    const { classes, onClick, ...restProps } = p
    const { column, row } = restProps
    // const { cellEditingDisabled } = column
    // console.log(p2)
    // return null
    // console.log(restProps)
    let cfg = {
      // tabIndex: 0,
    }
    if (extraState) {
      const colCfg = columnExtensions.find((o) => o.columnName === column.name)
      const latestRow = window.$tempGridRow[this.gridId]
        ? window.$tempGridRow[this.gridId][getRowId(row)] || row
        : row
      // try {
      //   console.log(!colCfg, !colCfg.isDisabled, !colCfg.isDisabled(latestRow))
      // } catch (error) {}
      if (!colCfg || !colCfg.isDisabled || !colCfg.isDisabled(latestRow)) {
        cfg = {
          tabIndex: 0,
          onFocus: onClick,
          // onBlur: () => {
          //   console.log(111)
          // },
        }
      }
      if (colCfg && colCfg.disabled) cfg = {}
    }
    // console.log(p, columnExtensions)

    if (column && column.name === 'rowMove') {
      const cls = {
        width: 18,
        height: 18,
        padding: 1,
        margin: '0 auto',
      }

      if (!this.props.rowMoveable || !this.props.rowMoveable(row))
        return <Table.Cell {...restProps} />

      return (
        <Table.Cell
          {...restProps}
          // {...cfg}
          editingEnabled={false}
          className='td-move-cell'
          style={{ padding: 0 }}
        >
          <div style={{ display: 'flex', flexFlow: 'column' }}>
            <IconButton
              className='move-button'
              style={{ ...cls, display: 'none' }}
              onClick={this.moveRow(row, 'UP')}
            >
              <ArrowDropUp />
            </IconButton>
            <IconButton
              className='move-button'
              style={cls}
              onClick={this.moveRow(row, 'DOWN')}
            >
              <ArrowDropDown />
            </IconButton>
          </div>
        </Table.Cell>
      )
    }
    return <Table.Cell {...cfg} {...restProps} />
  }

  getChildRows = (row, rootRows) => {
    // if (row) {
    //   return null
    // }
    // const childRows = rows.filter((r) => r.parentId === (row ? row.id : 0))
    // console.log(row, rows, childRows)
    // return childRows.length ? childRows : null
    const { getRowId = (r) => (r.Id ? r.Id : r.id) } = this.props
    const childRows = rootRows.filter(
      (r) => r.parentId === (row ? getRowId(row) : null),
    )
    // console.log(childRows)
    return childRows.length ? childRows : null
  }

  render () {
    const {
      classes,
      pageSizes = [
        5,
        10,
        50,
        100,
      ],
      columns = [],
      type,
      rows = [],
      TableCell = DefaultTableCell,
      filteringColExtensions = [],
      defaultSorting = [],
      height = undefined,
      rightColumns = [],
      leftColumns = [],
      showRowNumber = false,
      rowMoveable = null,
      header = true,
      selection = [],
      errors = [],
      query,
      getRowId = (row) => (row.Id ? row.Id : row.id),
      onSelectionChange = (f) => f,
      FuncProps = {},
      TableProps = {},
      ActionProps = {},
      FilteringProps: {
        defaultFilters = [],
        onFiltersChange = (f) => f,
        filterColumnExtensions = [],
      } = {},
      LoadingProps: { isLoading = false, loadingMessage = 'Retrieve data' } = {
        isLoading: false,
        loadingMessage: 'Retrieve data',
      },
      extraState = [],
      extraRow = [],
      extraColumn = [],
      extraGetter = [],
      containerComponent,
      schema,
      editingRowIds,
      global,
      loading,
      gridId,
    } = this.props

    const {
      grouping,
      selectable,
      selectConfig = {
        showSelectAll: false,
        rowSelectionEnabled: (row) => true,
      },
      pager,
      pagerConfig = {},
      pagerStateConfig,
      tree,
      treeColumnConfig,
      groupingConfig,
      summary,
      summaryConfig,
      sort,
      sortConfig,
      filter,
    } = {
      ...this.defaultFunctionConfig,
      ...FuncProps,
    }

    let { columnExtensions = [] } = this.props

    if (containerComponent) {
      pagerConfig.containerComponent = containerComponent
    }
    // console.log('index', rows)
    // console.log(this.props)
    // console.log(
    //   filter,
    //   grouping,
    //   selectable,
    //   pager,
    //   pagerConfig,
    //   groupingConfig,
    //   summary,
    //   summaryConfig,
    //   sort,
    //   sortConfig,
    // )
    // console.log(this.state)
    const { TableBase } = this
    const actionColDefaultCfg = {
      columnName: 'action',
      width: 95,
      align: 'center',
      sortingEnabled: false,
    }
    columnExtensions = columnExtensions.concat([
      ...[
        {
          columnName: 'rowIndex',
          width: 80,
          align: 'left',
          disabled: true,
          render: (row) => {
            return isNumber(row.rowIndex) ? row.rowIndex + 1 : ''
          },
          editRender: (row) => {
            return isNumber(row.rowIndex) ? row.rowIndex + 1 : ''
          },
        },
        {
          columnName: 'rowMove',
          width: 40,
          align: 'center',
          disabled: true,
        },
      ],
      ...columns
        .filter((o) => !columnExtensions.find((m) => m.columnName === o.name))
        .map((o) => {
          let extraCfg = {}
          if (o.name === 'action') {
            extraCfg = {
              ...actionColDefaultCfg,
            }
          }
          return {
            ...extraCfg,
            columnName: o.name,
            type: 'text',
          }
        }),
    ])
    let actionCol = columnExtensions.find((o) => o.columnName === 'action')
    if (actionCol) {
      columnExtensions = columnExtensions.filter(
        (o) => o.columnName !== 'action',
      )
      columnExtensions.push({
        ...actionColDefaultCfg,
        ...actionCol,
      })
    } else {
      columnExtensions.push(actionColDefaultCfg)
    }
    // console.log(errors, columnExtensions)

    const tableProps = {
      ...TableProps,
      columnExtensions,
      cellComponent:
        (this.props.ActionProps || {}).TableCellComponent || this.Cell,
    }
    // console.log('tableProps',tableProps)
    // const extraPagerConfig = {
    //   ...pagerConfig,
    // }
    // console.log(leftColumns, rightColumns, header)
    // console.log(errors)
    // if (errors.length > 0) {

    // }
    columnExtensions.forEach((c) => {
      c.validationSchema = schema
      c.gridId = gridId || this.gridId
      c.getRowId = getRowId

      if (c.type === 'number' || c.type === 'currency') {
        if (!c.align) {
          c.align = 'right'
        }
      }
      // c.errors = []
      // errors.forEach((e, i) => {
      //   if (e) {
      //     // console.log(i)
      //     const m = Object.keys(e).find((es) => es === c.columnName)
      //     if (m) {
      //       c.errors.push({
      //         index: i + 1,
      //         columnName: c.columnName,
      //         error: e[c.columnName],
      //       })
      //     }
      //   }
      // })
      // console.log(error, c)
    })
    // console.log(pager, pagerConfig)
    const cellComponentConfig = {
      columnExtensions,
      editingRowIds,
      commitCount: global.commitCount,
      errorCount: global.errorCount,
    }
    // const allowSelectRowByClick =
    //   columns.find((col) => col.name.toUpperCase() === 'ACTION') === undefined

    const HeaderRow = this.TableHeaderRow

    let newColumns = columns
    let newLeftCols = leftColumns
    if (rowMoveable && !newColumns.find((o) => o.name === 'rowMove')) {
      newLeftCols = [
        'rowMove',
      ].concat(newLeftCols)
      newColumns.unshift({ name: 'rowMove', title: ' ' })
    }
    if (showRowNumber && !newColumns.find((o) => o.name === 'rowIndex')) {
      newLeftCols = [
        'rowIndex',
      ].concat(newLeftCols)
      newColumns.unshift({ name: 'rowIndex', title: 'No.' })
    }
    // console.log(window.$tempGridRow)
    // console.log(this.state.entity.list)
    const _loading = type ? loading.effects[`${type}/query`] : false

    return (
      <MuiThemeProvider theme={this.theme}>
        <Paper
          className={classNames({
            [classes.paperContainer]: true,
            [this.props.className]: true,
            'medisys-table': true,
          })}
          style={{
            ...this.props.style,
            // height,
          }}
        >
          {/* isLoading && (
            <div>
              <LinearProgress />
              <span>{loadingMessage}</span>
            </div>
          ) */}
          <LoadingWrapper loading={_loading} linear text='Loading...'>
            <DevGrid
              rows={getIndexedRows(
                this.state.entity
                  ? this.state.entity.list
                  : rows.filter((o) => !o.isDeleted),
                this.state.pagination,
              )} // this.state.data ||
              columns={newColumns}
              getRowId={getRowId}
              rootComponent={Root}
            >
              {filter && (
                <FilteringState
                  defaultFilters={defaultFilters}
                  onFiltersChange={onFiltersChange}
                  columnExtensions={filterColumnExtensions}
                />
              )}
              {sort && (
                <SortingState
                  sorting={this.state.pagination.sorting}
                  defaultSorting={defaultSorting}
                  onSortingChange={(sorting) => {
                    sorting.forEach((o) => {
                      const c = columnExtensions.find(
                        (m) => m.columnName === o.columnName,
                      )
                      o.sortBy = c.sortBy
                    })
                    this.search({
                      sorting,
                    })
                  }}
                  columnExtensions={columnExtensions}
                  {...sortConfig}
                />
              )}
              {selectable && (
                <SelectionState
                  selection={selection}
                  onSelectionChange={onSelectionChange}
                />
              )}
              {summary && <SummaryState {...summaryConfig.state} />}
              {grouping && <GroupingState {...groupingConfig.state} />}
              {pager && (
                <PagingState
                  currentPage={this.state.pagination.current - 1}
                  pageSize={this.state.pagination.pagesize}
                  {...pagerStateConfig}
                />
              )}
              {tree && <TreeDataState />}
              {extraState.map((o) => o)}

              {grouping && (
                <IntegratedGrouping
                  columnExtensions={groupingConfig.columnExtensions || []}
                />
              )}
              {/* <IntegratedFiltering /> */}
              {sort &&
              !type && (
                <IntegratedSorting columnExtensions={columnExtensions} />
              )}
              {summary && <IntegratedSummary {...summaryConfig.integrated} />}
              {pager && !this.state.entity && <IntegratedPaging />}
              {pager &&
              this.state.entity && (
                <CustomPaging totalCount={this.state.pagination.totalRecords} />
              )}
              {selectable && (
                // <IntegratedSelection />
                <PatchedIntegratedSelection
                  rowSelectionEnabled={selectConfig.rowSelectionEnabled}
                />
              )}
              <TextTypeProvider {...cellComponentConfig} />

              <NumberTypeProvider {...cellComponentConfig} />
              <SelectTypeProvider {...cellComponentConfig} />
              <RadioTypeProvider {...cellComponentConfig} />
              <DateTypeProvider {...cellComponentConfig} />
              <RangeDateTypeProvider {...cellComponentConfig} />
              <TimeTypeProvider {...cellComponentConfig} />

              {/* 
              

              <RowErrorTypeProvider {...cellComponentConfig} /> */}

              {grouping && <DragDropProvider />}
              {tree && <CustomTreeData getChildRows={this.getChildRows} />}

              <TableBase
                // height={height}
                rowComponent={this.TableRow}
                {...tableProps}
              />
              {selectable && (
                // <TableSelection
                //   highlightRow
                //   // selectByRowClick={allowSelectRowByClick}
                //   showSelectionColumn
                //   rowComponent={this.TableRow}
                //   {...selectConfig}
                // />
                <PatchedTableSelection
                  highlightRow
                  // selectByRowClick={allowSelectRowByClick}
                  showSelectionColumn
                  rowComponent={this.TableRow}
                  // rowSelectionEnabled={selectionConfig.rowSelectionEnabled}
                  {...selectConfig}
                />
              )}

              {header && <HeaderRow showSortingControls />}
              {extraRow.map((o) => o)}
              {pager && <PagingPanel pageSizes={pageSizes} {...pagerConfig} />}

              {grouping && <TableGroupRow {...groupingConfig.row} />}
              {grouping && groupingConfig.showToolbar && <Toolbar />}
              {grouping &&
              groupingConfig.showToolbar && (
                <GroupingPanel showSortingControls />
              )}
              {summary && <TableSummaryRow {...summaryConfig.row} />}
              {tree && <TableTreeColumn {...treeColumnConfig} />}
              {extraColumn.map((o) => o)}
              <TableFixedColumns
                rightColumns={
                  rightColumns.length > 0 ? (
                    rightColumns
                  ) : (
                    [
                      'action',
                      'Action',
                      'editCommand',
                    ]
                  )
                }
                leftColumns={newLeftCols}
              />
              {extraGetter.map((o) => o)}
            </DevGrid>
          </LoadingWrapper>
        </Paper>
      </MuiThemeProvider>
    )
  }
}
CommonTableGrid.propTypes = {
  // required
  rows: PropTypes.array,
  columns: PropTypes.array.isRequired,
  // optional
  pageSizes: PropTypes.array,
  TableCell: PropTypes.object,
  columnExtensions: PropTypes.array,
  filteringColExtensions: PropTypes.array,
  defaultSorting: PropTypes.array,
  selection: PropTypes.array,
  onSelectionChange: PropTypes.func,
  FuncProps: PropTypes.shape({
    filter: PropTypes.bool,
    grouping: PropTypes.bool,
    pager: PropTypes.bool,
    pagerConfig: PropTypes.object,
    selectable: PropTypes.bool,
  }),
  FilteringProps: PropTypes.shape({
    defaultFilters: PropTypes.array,
    onFiltersChange: PropTypes.func,
    filterColumnExtensions: PropTypes.array,
  }),
  ActionProps: PropTypes.shape({
    TableCellComponent: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
    ]),
  }),
  LoadingProps: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    loadingMessage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
  }),
}

export default withStyles(styles, {
  name: 'CommonTableGrid',
  withTheme: true,
})(CommonTableGrid)
