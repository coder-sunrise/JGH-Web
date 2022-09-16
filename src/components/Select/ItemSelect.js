import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect, useDispatch } from 'dva'
import CodeSelect from './CodeSelect'
import { Select } from '@/components'
import { fetchCodeTable } from '@/utils/codetable'
import { withStyles, Divider } from '@material-ui/core'
import { set } from '@umijs/deps/compiled/lodash'
import { preOrderItemCategory } from '@/utils/codes'
import { RADIOLOGY_CATEGORY, LAB_CATEGORY } from '@/utils/constants'
const ItemSelect = ({ codetable, itemType, ...props }) => {
  const {
    inventorymedication,
    inventoryconsumable,
    inventoryvaccination,
    ctservice = [],
  } = codetable
  const dispatch = useDispatch()
  let selectProps = props
  const initMaxTagCount =
    props.field && props.field.value && props.field.value.length === 1 ? 1 : 0
  const [maxTagCount, setMaxTagCount] = useState(
    props.maxTagCount !== undefined ? props.maxTagCount : initMaxTagCount,
  )
  if (
    props.maxTagCount === undefined &&
    props.mode &&
    props.mode === 'multiple'
  ) {
    selectProps = { ...props, maxTagCount }
  }
  useEffect(() => {
    fetchCodeTables()
  }, [])

  const fetchCodeTables = async () => {
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctservice',
        force: true,
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventorymedication',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryconsumable',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'inventoryvaccination',
      },
    })
  }

  const labsFilter =
    ctservice.length > 0
      ? ctservice.filter(
          c => LAB_CATEGORY.indexOf(c.serviceCenterCategoryFK) >= 0,
        )
      : []

  const radiologysFilter =
    ctservice.length > 0
      ? ctservice.filter(
          c => RADIOLOGY_CATEGORY.indexOf(c.serviceCenterCategoryFK) >= 0,
        )
      : []

  const servicesFilter =
    ctservice.length > 0
      ? ctservice.filter(
          c =>
            LAB_CATEGORY.indexOf(c.serviceCenterCategoryFK) < 0 &&
            RADIOLOGY_CATEGORY.indexOf(c.serviceCenterCategoryFK) < 0,
        )
      : []

  const optionsList =
    itemType === preOrderItemCategory[0].value
      ? inventorymedication
      : itemType === preOrderItemCategory[1].value
      ? inventoryconsumable
      : itemType === preOrderItemCategory[2].value
      ? inventoryvaccination
      : itemType === preOrderItemCategory[3].value
      ? servicesFilter
      : itemType === preOrderItemCategory[4].value
      ? labsFilter
      : itemType === preOrderItemCategory[5].value
      ? radiologysFilter
      : []
  return (
    <Select
      valueField='id'
      mode='multiple'
      options={optionsList || []}
      onChange={(values, opts) => {
        if (
          props.maxTagCount === undefined &&
          props.mode &&
          props.mode === 'multiple'
        ) {
          setMaxTagCount(values && values.length === 1 ? 1 : 0)
        }
        if (props.onChange) {
          props.onChange(values, opts)
        }
      }}
      {...selectProps}
    />
  )
}

const Connected = connect(({ codetable }) => ({ codetable }))(ItemSelect)

export default withStyles({ withTheme: true })(Connected)
