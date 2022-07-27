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
import { Paper } from '@material-ui/core'

import {
  SortableContainer,
  SortableElement,
  arrayMove,
} from 'react-sortable-hoc'
import classNames from 'classnames'
import { connect } from 'dva'
import {
  FilteringState,
  GroupingState,
  IntegratedGrouping,
  IntegratedPaging,
  IntegratedSorting,
  IntegratedSummary,
  PagingState,
  SelectionState,
  SortingState,
  SummaryState,
  CustomPaging,
  TreeDataState,
  CustomTreeData,
  VirtualTableState,
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
  Toolbar,
  TableFixedColumns,
  VirtualTable,
  TableColumnVisibility,
  ColumnChooser,
  TableTreeColumn,
  TableColumnResizing,
  TableColumnReordering,
} from '@devexpress/dx-react-grid-material-ui'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'
import ArrowDownward from '@material-ui/icons/ArrowDownward'
import ArrowUpward from '@material-ui/icons/ArrowUpward'
import SettingsApplicationsIcon from '@material-ui/icons/SettingsApplications'
import * as userService from '@/services/user'
import { control } from '@/components/Decorator'
import { smallTheme, defaultTheme } from '@/utils/theme'
import { enableTableForceRender, generateHashCode } from '@/utils/utils'
import { LoadingWrapper } from '@/components/_medisys'
import {
  Badge,
  SizeContainer,
  IconButton,
  Popper,
  Button,
  Tooltip,
  notification,
} from '@/components'
import NumberTypeProvider from './EditCellComponents/NumberTypeProvider'
import TextTypeProvider from './EditCellComponents/TextTypeProvider'
import SelectTypeProvider from './EditCellComponents/SelectTypeProvider'
import DateTypeProvider from './EditCellComponents/DateTypeProvider'
import RangeDateTypeProvider from './EditCellComponents/RangeDateTypeProvider'
import RadioTypeProvider from './EditCellComponents/RadioTypeProvider'
import CheckboxTypeProvider from './EditCellComponents/CheckboxTypeProvider'
import TimeTypeProvider from './EditCellComponents/TimeTypeProvider'
import CustomTypeProvider from './EditCellComponents/CustomTypeProvider'
import PatchedTableSelection from './plugins/PatchedTableSelection'
import PatchedIntegratedSelection from './plugins/PatchedIntegratedSelection'
import TableRow from './plugins/TableRow'
import TableCell from './plugins/TableCell'
import styles from './style'

window.$tempGridRow = {}
const cellStyle = {
  cell: {
    // borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
  },
}

const Root = props => <DevGrid.Root {...props} style={{ height: '100%' }} />

const getIndexedRows = (rows = [], pagerConfig = {}) => {
  const startIndex = pagerConfig.current
    ? pagerConfig.pagesize * (pagerConfig.current - 1)
    : 0
  // console.log(startIndex)
  // console.log(rows)
  return rows.map((o, i) => {
    return {
      rowIndex: rows.length > pagerConfig.pagesize ? i : startIndex + i,
      ...o,
    }
  })
}
const SortingIcon = ({ direction }) =>
  direction === 'asc' ? (
    <ArrowUpward style={{ fontSize: '18px' }} />
  ) : (
    <ArrowDownward style={{ fontSize: '18px' }} />
  )

let uniqueGid = 0
@connect(({ loading, global }, { type }) => {
  return {
    loading: type ? loading.effects[`${type}/query`] : false,
    commitCount: global.commitCount,
  }
})
@control()
class CommonTableGrid extends PureComponent {
  static defaultProps = {
    columnExtensions: [],
    getRowId: row => (row.Id ? row.Id : row.id),
  }

  constructor(props) {
    super(props)
    const {
      classes,
      theme,
      oddEven = true,
      onRowDoubleClick = undefined,
      rowDragable = false,
      height: pHeight,
      onRowDrop,
      editableGrid,
      getRowId,
      FuncProps = {},
      columns = [],
      identifier,
    } = props
    // console.log(props)
    this.gridId = `view-${uniqueGid++}`
    this.isScrollable = !!pHeight
    this.hashCode =
      identifier || generateHashCode(JSON.stringify(columns.map(o => o.name)))
    const { gridSetting = [] } = JSON.parse(localStorage.getItem('user'))
    const gs = gridSetting.find(o => o.Identifier === this.hashCode) || {}
    if (gs.ColumnsOrder && gs.ColumnsOrder.length !== columns.length) {
      gs.ColumnsOrder = columns.map(o => o.name)
    }
    // this.myRef = React.createRef()
    const { pagerDefaultState = {} } = FuncProps
    this.state = {
      pagination: {
        current: 1,
        pagesize: 10,
        ...pagerDefaultState,
      },
      rows: [],
      gridSetting: gs,
      selectedItem: [],
    }
    const cls = classNames({
      [classes.tableStriped]: oddEven,
      [classes.tableCursorPointer]: onRowDoubleClick !== undefined,
    })
    const TableComponent = ({ ...restProps }) => {
      // console.log('TableComponent', restProps)
      return <Table.Table {...restProps} className={cls} />
    }

    this.TableBase = ({ height, scrollable, dispatch, ...restProps }) => {
      const isScrollable = !!height
      // const dragCfg = {}
      // if(rowDragable){
      //   dragCfg.rowComponent=({ row, ...restProps }) => {
      //     const TableRow = SortableElement(this.TableRow);
      //     const index = dataSource.map((i) => i.id).indexOf(row.id)
      //     return <TableRow {...restProps} index={index} />;
      //   }
      // }
      return isScrollable ? (
        <VirtualTable
          tableComponent={TableComponent}
          {...restProps}
          height={height}
        />
      ) : (
        <Table tableComponent={TableComponent} {...restProps} />
      )
    }

    this.TableBody = Table.TableBody
    this.TableRow = this.Row // tableRowRender
    if (!editableGrid && rowDragable) {
      this.TableRow = rowProps => {
        const { tableRow } = rowProps
        const { row } = tableRow
        // console.log(rowProps)
        const index = this.getData()
          .map(i => i.id)
          .indexOf(getRowId(row))
        const DragableRow = SortableElement(this.Row)
        return <DragableRow {...rowProps} index={index} />
      }
      const onSortEnd = ({ newIndex, oldIndex }) => {
        // console.log(newIndex, oldIndex)
        const rows = this.getData()
        // console.log(_.minBy(rows,(n)=>n.sortOrder))
        const newRows = arrayMove(rows, oldIndex, newIndex)
        // console.log(rows,newRows)
        if (onRowDrop) onRowDrop(newRows)
        // const newRows = arrayMove(dataSource, oldIndex, newIndex)
        // onRowDrop(newRows)
        // dispatch({
        //   type: 'global/incrementCommitCount',
        // })
      }
      this.TableBody = ({ row, ...restProps }) => {
        const TableBody = SortableContainer(Table.TableBody)
        return (
          <TableBody
            {...restProps}
            onSortEnd={onSortEnd}
            useDragHandle
            helperClass={classes.sortableContainer}
          />
        )
      }
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
        contentComponent={({ children }) => {
          let {
            props: {
              column: { fullTitle },
            },
          } = children
          if (fullTitle) {
            return (
              <TableHeaderRow.Content>
                <Tooltip title={fullTitle} placement='top'>
                  <div>{children}</div>
                </Tooltip>
              </TableHeaderRow.Content>
            )
          } else {
            return children
          }
        }}
        sortLabelComponent={({ children, ...p }) => {
          return (
            <TableHeaderRow.SortLabel
              {...p}
              getMessage={() => {
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
      resizable: false,
      selectRowHighlightable: false,
      pager: true,
      pagerStateConfig: {
        onCurrentPageChange: current => {
          this.search({
            current: current + 1,
          })
        },
        onPageSizeChange: pagesize => {
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

    this.debouncedUploadGridSetting = _.debounce(this.uploadGridSetting, 2000, {
      leading: true,
    })

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
          footer: {
            // color: 'red',
            // fontSize: 'inherit',
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
          footer: {
            fontSize: 'inherit',
          },
          body: {
            color: '#000000',
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
            // overflow: 'visible',
            backgroundColor: 'inherit',
            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundClip: 'border-box',
          },
          dividerRight: {
            borderRightWidth: 1,
          },
        },
        TableCell: cellStyle,
        EditCell: {
          cell: {
            padding: '7px 8px 7px 8px',
            ...cellStyle.cell,
          },
        },
        EditColumn: {
          headingCell: {
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          },
        },
        TableHeaderCell: {
          cell: {
            ...cellStyle.cell,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          },
        },
        TableSelectAllCell: {
          cell: {
            ...cellStyle.cell,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          },
        },
        Table: {
          table: {
            // tableLayout: 'auto',
            // borderCollapse: 'collapse',
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
          footer: {
            fontSize: 'inherit',
            lineHeight: '1em',
          },
          body: {
            color: '#000000',
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
        Toolbar: {
          toolbar: {
            minHeight: 'auto !important',
            zIndex: 600,
            '& > .grid-setting-popover': {
              backgroundColor: 'white',
              position: 'absolute',
              right: 0,
              top: 7,
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

  static getDerivedStateFromProps(nextProps, preState) {
    // console.log(JSON.stringify(nextProps))
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
        _entity.filter.sorting.forEach(o => {
          const c = columnExtensions.find(m => m.sortBy === o.columnName)
          if (c) {
            o.columnName = c.sortBy || c.columnName
          }
        })
      }
      return {
        pagination: _entity.pagination || {},
        rows: _entity.list,
        filter: _entity.filter,
        entity: _entity,
      }
    }
    // console.log(nextProps.rows)
    if (nextProps.rows) {
      if (
        // if user add new row from 2nd page, move the new row to current page
        nextProps.rows.length &&
        nextProps.rows[0].isNew &&
        preState.pagination.current > 1
      ) {
        const newRow = nextProps.rows[0]
        const newRows = _.cloneDeep(nextProps.rows)
        newRows.splice(0, 1)
        newRows.splice(
          (preState.pagination.current - 1) * preState.pagination.pagesize,
          0,
          newRow,
        )
        // console.log(newRows)
        return {
          rows: newRows,
        }
      }
      // if(rows.)
      // console.log(v, preState)

      if (nextProps.rows !== preState.rows) {
        // console.log(nextProps.rows !== preState.rows)
        return {
          rows: nextProps.rows,
        }
      }
    }

    return null
  }

  componentDidMount() {
    // console.log('componentDidMount')
    const { forceRenderDuration = 1000, forceRender } = this.props
    if (!forceRender) enableTableForceRender(forceRenderDuration)
  }

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

  search = payload => {
    const { query, dispatch, type, queryMethod = 'query' } = this.props
    // window.$tempGridRow[this.gridId] = {}
    if (query) {
      query({
        callback: data => {
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
        ...this.state.entity.currentFilter,
        ...payload,
      }
      dispatch({
        type: `${type}/${queryMethod}`,
        payload: p,
      }).then(() => {
        this.setState(ps => {
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
  // Body = (bodyProps) => {
  //   const {
  //     classes,
  //     rowDragable,
  //     onRowDrop
  //   } = this.props

  //   if (!rowDragable) return <Table.TableBody {...bodyProps} />
  //   const TableBody = SortableContainer(Table.TableBody)
  //   const onSortEnd = ({ newIndex, oldIndex }) => {
  //     console.log(newIndex, oldIndex)
  //     const newRows = arrayMove(this.getData(), oldIndex, newIndex)
  //     if(onRowDrop)onRowDrop(newRows)
  //     // const newRows = arrayMove(dataSource, oldIndex, newIndex)
  //     // onRowDrop(newRows)
  //     // dispatch({
  //     //   type: 'global/incrementCommitCount',
  //     // })
  //   }
  //   return (
  //     <TableBody
  //       {...bodyProps}
  //       onSortEnd={onSortEnd}
  //       useDragHandle
  //       helperClass={classes.sortableContainer}
  //     />
  //   )
  // }

  Row = p => {
    const { classes, FuncProps = {}, ...restProps } = this.props
    const { selectRowHighlightable = false } = FuncProps
    return (
      <TableRow
        {...restProps}
        {...p}
        onRowClick={(row, event) => {
          if (selectRowHighlightable) {
            const rowId = this.props.getRowId(row || p.row)
            if (this.state.selectedItem.includes(rowId)) {
              this.setState({
                selectedItem: [],
              })
            } else {
              this.setState({
                selectedItem: [rowId],
              })
            }
          }
        }}
      />
    )
  }

  Cell = p => {
    const { rows = [], FuncProps = {}, ...restProps } = this.props
    // console.log(restProps, p)
    const { selectRowHighlightable = false } = FuncProps
    const row = rows.find(
      o => this.props.getRowId(o) === this.props.getRowId(p.row),
    )
    const rowId = this.props.getRowId(row || p.row)
    const highlitSytle =
      selectRowHighlightable && this.state.selectedItem.includes(rowId)
    const { style } = { ...restProps, ...p }

    return (
      <TableCell
        {...restProps}
        {...p}
        row={row || p.row}
        style={{
          ...style,
          backgroundColor: highlitSytle ? '#c8dafd' : undefined,
        }}
      />
    )
  }

  getChildRows = (row, rootRows) => {
    // if (row) {
    //   return null
    // }
    // const childRows = rows.filter((r) => r.parentId === (row ? row.id : 0))
    // console.log(row, rows, childRows)
    // return childRows.length ? childRows : null
    const { getRowId = r => (r.Id ? r.Id : r.id) } = this.props
    const childRows = rootRows.filter(
      r => r.parentId === (row ? getRowId(row) : null),
    )
    // console.log(childRows)
    return childRows.length ? childRows : null
  }

  getData = () => {
    const { showIsDeleted } = this.props
    const { rows = [] } = this.state
    return getIndexedRows(
      this.state.entity
        ? this.state.entity.list
        : rows.filter(o => !o.isDeleted || showIsDeleted),
      this.state.pagination,
    )
  }

  uploadGridSetting = (data, cb) => {
    // console.log(this.props.columns.map((o) => o.name))
    // console.log(hashids.encode(this.props.columns.map((o) => o.name)))
    enableTableForceRender()

    this.setState({
      gridSetting: data,
    })
    const newData = {
      Identifier: this.hashCode,
      ...data,
    }

    window.g_app._store.dispatch({
      type: 'user/saveUserPreference',
      payload: {
        data: newData,
        itemIdentifier: this.hashCode,
      },
    })

    if (cb) cb()
  }

  renderColumnChooser = ({ onToggle }) => {
    const { state, props } = this
    const { classes } = props
    return (
      <div className='grid-setting-popover'>
        <Popper
          hideOnClick
          overlay={
            <MenuList role='menu'>
              <MenuItem onClick={onToggle}>Change Column Visibility</MenuItem>
              <MenuItem
                onClick={() => {
                  enableTableForceRender()
                  const gridSetting = {
                    ...state.gridSetting,
                    HiddenColumns: [],
                    ColumnsOrder: undefined,
                  }
                  this.setState({
                    gridSetting,
                  })
                  this.debouncedUploadGridSetting(gridSetting, () => {
                    notification.success({
                      message:
                        'Grid reset to default, refresh current page to load default setting',
                    })
                  })
                }}
              >
                Reset Grid Setting
              </MenuItem>
            </MenuList>
          }
        >
          <IconButton authority='none' className={classes.settingBtn}>
            <SettingsApplicationsIcon />
          </IconButton>
        </Popper>
      </div>
    )
  }

  render() {
    const { state, props } = this
    const {
      classes,
      pageSizes = [10, 20, 50, 100],
      columns = [],
      type,
      defaultSorting = [],
      height = undefined,
      rightColumns = [],
      leftColumns = [],
      showRowNumber = false,
      rowMoveable = null,
      rowDragable = false,
      header = true,
      selection = [],
      errors = [],
      query,
      getRowId,
      onSelectionChange = f => f,
      FuncProps = {},
      TableProps = {},
      ActionProps = {},
      FilteringProps: {
        defaultFilters = [],
        onFiltersChange = f => f,
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
      // global,
      commitCount,
      loading,
      gridId,
      extraCellConfig,
      editableGrid,
    } = props

    const {
      grouping,
      selectable,
      resizable,
      selectRowHighlightable,
      selectConfig = {
        showSelectAll: false,
        rowSelectionEnabled: row => true,
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
      columnSelectable = false,
      fixedHiddenColumns = [],
      columnReorderable = false,
    } = {
      ...this.defaultFunctionConfig,
      ...FuncProps,
    }

    let { columnExtensions = [] } = this.props

    if (containerComponent) {
      pagerConfig.containerComponent = containerComponent
    }
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
          render: row => {
            return isNumber(row.rowIndex) ? row.rowIndex + 1 : ''
          },
          editRender: row => {
            return isNumber(row.rowIndex) ? row.rowIndex + 1 : ''
          },
        },
        {
          columnName: 'rowMove',
          width: 40,
          align: 'center',
          disabled: true,
        },
        {
          columnName: 'rowDrag',
          width: 60,
          // align: 'center',
          disabled: true,
        },
      ],
      ...columns
        .filter(o => !columnExtensions.find(m => m.columnName === o.name))
        .map(o => {
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
    let actionCol = columnExtensions.find(o => o.columnName === 'action')
    if (actionCol) {
      columnExtensions = columnExtensions.filter(o => o.columnName !== 'action')
      columnExtensions.push({
        ...actionColDefaultCfg,
        ...actionCol,
      })
    } else {
      columnExtensions.push(actionColDefaultCfg)
    }
    // console.log(errors, columnExtensions)

    const tableProps = {
      cellComponent:
        (this.props.ActionProps || {}).TableCellComponent || this.Cell,
      rowComponent: this.TableRow,
      columnExtensions,

      ...TableProps,
    }
    columnExtensions.forEach(c => {
      c.validationSchema = schema
      c.gridId = gridId || this.gridId
      c.getRowId = getRowId
      c.control = extraCellConfig

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
      commitCount,
      // errorCount: global.errorCount,
    }

    // const allowSelectRowByClick =
    //   columns.find((col) => col.name.toUpperCase() === 'ACTION') === undefined

    const HeaderRow = this.TableHeaderRow

    let newColumns = columns
    let newLeftCols = leftColumns

    if (
      !editableGrid &&
      rowDragable &&
      !newColumns.find(o => o.name === 'rowDrag')
    ) {
      newLeftCols = ['rowDrag'].concat(newLeftCols)
      newColumns.unshift({ name: 'rowDrag', title: ' ' })
    }
    if (rowMoveable && !newColumns.find(o => o.name === 'rowMove')) {
      newLeftCols = ['rowMove'].concat(newLeftCols)
      newColumns.unshift({ name: 'rowMove', title: ' ' })
    }
    if (showRowNumber && !newColumns.find(o => o.name === 'rowIndex')) {
      newLeftCols = ['rowIndex'].concat(newLeftCols)
      newColumns.unshift({ name: 'rowIndex', title: 'No.' })
    }
    // console.log(window.$tempGridRow)
    // console.log(this.state.entity.list)
    // const _loading = type ? loading.effects[`${type}/query`] : false
    const rowData = this.getData()
    // console.log(rowData, this.state)
    const showToolbar =
      (grouping && groupingConfig.showToolbar) || columnSelectable

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
          <LoadingWrapper loading={loading} linear text='Loading...'>
            <DevGrid
              rows={rowData} // this.state.data ||
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
                  onSortingChange={_cmptSortings => {
                    // console.log(_cmptSortings, this.state.entity.pagination)
                    _cmptSortings.forEach((o, i) => {
                      const c = columnExtensions.find(
                        m => m.columnName === o.columnName,
                      )
                      if (this.state.entity) {
                        const { sorting = [] } = this.state.entity.pagination
                        if (
                          sorting[i] &&
                          o.columnName !== sorting[i].columnName
                        )
                          o.direction = o.direction === 'asc' ? 'desc' : 'asc'
                      }

                      o.sortBy = c.sortBy
                    })
                    this.search({
                      sorting: _cmptSortings,
                    })
                  }}
                  columnExtensions={columnExtensions}
                  {...sortConfig}
                />
              )}
              {selectable && (
                <SelectionState
                  selection={selection}
                  disabled
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
              {extraState.map(o => o)}
              {grouping && (
                <IntegratedGrouping
                  columnExtensions={groupingConfig.columnExtensions || []}
                />
              )}
              {/* <IntegratedFiltering /> */}
              {sort && !type && (
                <IntegratedSorting columnExtensions={columnExtensions} />
              )}
              {summary && <IntegratedSummary {...summaryConfig.integrated} />}
              {pager && !this.state.entity && <IntegratedPaging />}
              {pager && this.state.entity && (
                <CustomPaging totalCount={this.state.pagination.totalRecords} />
              )}
              {selectable && (
                // <IntegratedSelection />
                <PatchedIntegratedSelection
                  disabled
                  rowSelectionEnabled={selectConfig.rowSelectionEnabled}
                />
              )}
              <TextTypeProvider {...cellComponentConfig} />
              <NumberTypeProvider {...cellComponentConfig} />
              <SelectTypeProvider {...cellComponentConfig} />
              <RadioTypeProvider {...cellComponentConfig} />
              <CheckboxTypeProvider {...cellComponentConfig} />
              <DateTypeProvider {...cellComponentConfig} />
              <RangeDateTypeProvider {...cellComponentConfig} />
              <TimeTypeProvider {...cellComponentConfig} />
              <CustomTypeProvider {...cellComponentConfig} />
              {/* 
              

              <RowErrorTypeProvider {...cellComponentConfig} /> */}
              {(columnReorderable || grouping) && <DragDropProvider />}
              {tree && <CustomTreeData getChildRows={this.getChildRows} />}

              <TableBase
                // height={height}
                bodyComponent={this.TableBody}
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
                  selection={selection}
                  // rowSelectionEnabled={selectionConfig.rowSelectionEnabled}
                  {...selectConfig}
                />
              )}
              {columnReorderable && (
                <TableColumnReordering
                  defaultOrder={
                    state.gridSetting.ColumnsOrder ||
                    newColumns.map(o => o.name)
                  }
                  onOrderChange={ary => {
                    const gridSetting = {
                      ...state.gridSetting,
                      ColumnsOrder: ary,
                    }
                    this.debouncedUploadGridSetting(gridSetting)
                  }}
                />
              )}
              {header && resizable && (
                <TableColumnResizing
                  defaultColumnWidths={columnExtensions.map(o => {
                    return {
                      columnName: o.columnName,
                      width: o.width || 100,
                    }
                  })}
                />
              )}
              {header && <HeaderRow showSortingControls />}
              {extraRow.map(o => o)}
              {pager && <PagingPanel pageSizes={pageSizes} {...pagerConfig} />}
              {grouping && (
                <TableGroupRow
                  rowComponent={p => {
                    return (
                      <TableGroupRow.Row
                        className={
                          groupingConfig.isDisableExpandedGroups
                            ? 'disableexpandedgroup'
                            : 'group'
                        }
                        {...p}
                        style={{
                          backgroundColor: groupingConfig.backgroundColor,
                        }}
                      />
                    )
                  }}
                  {...groupingConfig.row}
                />
              )}
              {showToolbar && <Toolbar />}
              {grouping && groupingConfig.showToolbar && (
                <GroupingPanel showSortingControls />
              )}
              {summary && (
                <TableSummaryRow
                  itemComponent={p => {
                    return (
                      <TableSummaryRow.Item
                        className={classes.cleanFormat}
                        {...p}
                      />
                    )
                  }}
                  {...summaryConfig.row}
                />
              )}
              {columnSelectable && (
                <TableColumnVisibility
                  defaultHiddenColumnNames={state.gridSetting.HiddenColumns}
                  // hiddenColumnNames={this.state.hiddenCols}
                  onHiddenColumnNamesChange={ary => {
                    const gridSetting = {
                      ...state.gridSetting,
                      HiddenColumns: ary,
                    }
                    this.debouncedUploadGridSetting(gridSetting)
                  }}
                />
              )}
              {fixedHiddenColumns.length > 0 && !columnSelectable && (
                <TableColumnVisibility
                  defaultHiddenColumnNames={fixedHiddenColumns}
                />
              )}
              {columnSelectable && (
                <ColumnChooser
                  toggleButtonComponent={this.renderColumnChooser}
                />
              )}
              {tree && <TableTreeColumn {...treeColumnConfig} />}
              {extraColumn.map(o => o)}
              <TableFixedColumns
                rightColumns={
                  rightColumns.length > 0
                    ? rightColumns
                    : ['action', 'Action', 'editCommand']
                }
                leftColumns={newLeftCols}
              />
              {extraGetter.map(o => o)}
              {/* <Getter
                key='Getter-totalSummaryItems'
                name='totalSummaryItems'
                computed={(p) => {
                  console.log(p)
                  console.debug('11')
                  return [
                    {
                      columnName: 'incomeAmount',
                      type: 'sum',
                    },
                  ]
                }}
              />, */}
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
    resizable: PropTypes.bool,
    selectRowHighlightable: PropTypes.bool,
  }),
  FilteringProps: PropTypes.shape({
    defaultFilters: PropTypes.array,
    onFiltersChange: PropTypes.func,
    filterColumnExtensions: PropTypes.array,
  }),
  ActionProps: PropTypes.shape({
    TableCellComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  }),
  LoadingProps: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    loadingMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }),
}

export default withStyles(styles, {
  name: 'CommonTableGrid',
  withTheme: true,
})(CommonTableGrid)
