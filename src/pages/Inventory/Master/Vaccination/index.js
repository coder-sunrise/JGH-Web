import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
import { withStyles } from '@material-ui/core/styles'
import { CardContainer } from '@/components'
import FilterBar from './FilterBar'
import Grid from '../Grid'
import { status } from '@/utils/codes'

const styles = () => ({})

const Vaccination = ({
  dispatch,
  history,
  vaccination,
  values,
  setActiveTab,
}) => {
  const [tableParas, setTableParas] = useState({
    columns: [
      { name: 'code', title: 'Code' },
      { name: 'displayValue', title: 'Name' },
      { name: 'favouriteSupplier', title: 'Supplier' },
      { name: 'dispensingUOMName', title: 'Disp. UOM' },
      { name: 'stock', title: 'Stock' },
      { name: 'averageCostPrice', title: 'Avg Cost Price' },
      { name: 'sellingPrice', title: 'Selling Price' },
      { name: 'isActive', title: 'Status' },
      { name: 'action', title: 'Action' },
    ],
    leftColumns: [],
  })

  const [colExtensions, setColExtensions] = useState([
    { columnName: 'code', width: 130 },
    { columnName: 'action', width: 80, align: 'center' },
    {
      columnName: 'favouriteSupplier',
      type: 'codeSelect',
      code: 'ctSupplier',
      labelField: 'displayValue',
      sortBy: 'FavouriteSupplierFkNavigation.displayValue',
    },
    {
      columnName: 'dispensingUOMName',
    },
    {
      columnName: 'stock',
      type: 'number',
      width: 110,
      sortingEnabled: false,
      precision: 1,
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
      columnName: 'averageCostPrice',
      type: 'number',
      currency: true,
      width: 120,
      precision: 4,
    },
    { columnName: 'sellingPrice', type: 'number', currency: true, width: 120 },
  ])

  const filterProps = {
    dispatch,
    history,
    values,
  }

  const gridProps = {
    ...filterProps,
    vaccination,
    namespace: 'vaccination',
    list: vaccination.list || [],
    tableParas,
    colExtensions,
  }

  useEffect(() => {
    dispatch({
      type: 'vaccination/query',
      payload: {
        isActive: true,
        sorting: [
          { columnName: 'effectiveEndDate', direction: 'desc' },
          { columnName: 'displayValue', direction: 'asc' },
        ],
      },
    })

    setActiveTab('2')
    dispatch({
      type: 'inventoryMaster/updateState',
      payload: {
        currentTab: '2',
      },
    })
  }, [])
  return (
    <CardContainer
      hideHeader
      style={{
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      <div className='filtervaccinationBar'>
        <FilterBar {...filterProps} />
      </div>
      <Grid {...gridProps} />
    </CardContainer>
  )
}
export default compose(
  withStyles(styles),
  connect(({ vaccination }) => ({
    vaccination,
  })),
)(Vaccination)
