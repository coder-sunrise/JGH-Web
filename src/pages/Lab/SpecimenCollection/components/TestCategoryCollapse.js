import React, { useState, useEffect } from 'react'
import _, { head } from 'lodash'
import PropTypes from 'prop-types'
import moment from 'moment'
import { Space, Collapse, Checkbox, InputNumber, Form } from 'antd'
import { useDispatch } from 'umi'
import { makeStyles } from '@material-ui/styles'
import { useCodeTable } from '@/utils/hooks'
import {
  dateFormatLongWithTimeNoSec,
  DatePicker,
  CommonModal,
  NumberInput,
  GridContainer,
  GridItem,
  Select,
} from '@/components'
import { LAB_WORKITEM_STATUS } from '@/utils/constants'
const MODE = { NEW: 'new', EDIT: 'edit', CANCEL: 'cancel' }

const { Panel } = Collapse

const TestCategoryPanel = ({
  categoryWorkitems = [],
  labWorkitems = [],
  onAddWorkitem,
  onRemoveWorkitem,
}) => {
  const ctTestPanels = useCodeTable('cttestpanel')

  const sortedWorkitems = [...categoryWorkitems]
    .map(item => ({
      ...item,
      testPanel: ctTestPanels.find(panel => panel.id === item.testPanelFK)
        ?.displayValue,
      sortOrder: ctTestPanels.find(panel => panel.id === item.testPanelFK)
        ?.sortOrder,
    }))
    .sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1))
  return (
    <GridContainer>
      {sortedWorkitems.length > 0 &&
        sortedWorkitems.map(item => (
          <GridItem md={4} key={item.id}>
            <Checkbox
              disabled={labWorkitems.find(
                cur =>
                  cur.testPanelFK === item.testPanelFK &&
                  cur.id !== item.id &&
                  cur.statusFK === LAB_WORKITEM_STATUS.SPECIMENCOLLECTED,
              )}
              checked={labWorkitems.find(
                cur =>
                  cur.id === item.id &&
                  (cur.statusFK === LAB_WORKITEM_STATUS.SPECIMENCOLLECTED ||
                    cur.statusFK === LAB_WORKITEM_STATUS.CANCELLED ||
                    cur.statusFK === LAB_WORKITEM_STATUS.SPECIMENRECEIVED),
              )}
              onChange={e =>
                e.target.checked ? onAddWorkitem(item) : onRemoveWorkitem(item)
              }
            />
            <span> {item.testPanel}</span>
          </GridItem>
        ))}
    </GridContainer>
  )
}

const TestCategoryCollapse = ({
  labSpecimenId,
  defaultActiveKey = [],
  testCategories = [],
  onChange,
  value,
  mode,
}) => {
  const addItem = (prev, newItem) => {
    const added =
      prev.findIndex(prevItem => prevItem.id === newItem.id) >= 0
        ? prev.map(prevItem =>
            newItem.id === prevItem.id
              ? {
                  ...prevItem,
                  labSpecimenFK: labSpecimenId,
                  statusFK:
                    mode == MODE.CANCEL
                      ? LAB_WORKITEM_STATUS.CANCELLED
                      : LAB_WORKITEM_STATUS.SPECIMENCOLLECTED,
                }
              : prevItem,
          )
        : [
            ...prev,
            {
              ...newItem,
              labSpecimenFK: labSpecimenId,
              statusFK:
                mode == MODE.CANCEL
                  ? LAB_WORKITEM_STATUS.CANCELLED
                  : LAB_WORKITEM_STATUS.SPECIMENCOLLECTED,
            },
          ]

    return added
  }

  const handleAdd = newItems => {
    const isArray = Array.isArray(newItems)

    if (!isArray) {
      const prev = [...value]
      const added = addItem(prev, newItems)
      onChange(added)
    } else {
      let prev = [...value]
      for (const item of newItems) {
        prev = addItem(prev, item)
      }
      const added = prev
      onChange(added)
    }
  }

  const removeItem = (prev, item) => {
    const removed = prev.map(prevItem =>
      item.id === prevItem.id
        ? {
            ...prevItem,
            labSpecimenFK: undefined,
            statusFK: LAB_WORKITEM_STATUS.NEW,
          }
        : prevItem,
    )

    return removed
  }

  const handleRemove = removeItems => {
    const isArray = Array.isArray(removeItems)

    if (!isArray) {
      const prev = [...value]
      const removed = removeItem(prev, removeItems)
      onChange(removed)
    } else {
      let prev = [...value]
      for (const item of removeItems) {
        prev = removeItem(prev, item)
      }
      const removed = prev
      onChange(removed)
    }
  }

  return (
    <Collapse defaultActiveKey={defaultActiveKey}>
      {testCategories.map(item => {
        const { workItems: categoryWorkitems = [] } = item
        const isAnyDuplicateTestPanels =
          new Set(categoryWorkitems.map(x => x.testPanelFK)).size !==
          categoryWorkitems.length

        return (
          <Panel
            header={
              <Space>
                <Checkbox
                  onClick={e => e.stopPropagation()}
                  disabled={isAnyDuplicateTestPanels}
                  checked={
                    categoryWorkitems.length ===
                    value?.filter(
                      x =>
                        (x.statusFK === LAB_WORKITEM_STATUS.CANCELLED &&
                          x.testCategoryFK === item.testCategoryFK) ||
                        (x.statusFK === LAB_WORKITEM_STATUS.SPECIMENCOLLECTED &&
                          x.testCategoryFK === item.testCategoryFK),
                    ).length
                  }
                  onChange={e => {
                    e.target.checked
                      ? handleAdd(categoryWorkitems)
                      : handleRemove(categoryWorkitems)
                  }}
                ></Checkbox>
                <span>{item.testCategory}</span>
              </Space>
            }
            key={item.testCategoryFK}
          >
            <TestCategoryPanel
              mode={mode}
              onAddWorkitem={handleAdd}
              onRemoveWorkitem={handleRemove}
              categoryWorkitems={categoryWorkitems}
              labWorkitems={value}
            />
          </Panel>
        )
      })}
    </Collapse>
  )
}

export default TestCategoryCollapse
