import { Tabs } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop, DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import styles from './DraggableTabs.module.css'

const { TabPane } = Tabs
const type = 'DraggableTabNode'
const DraggableTabNode = ({ index, children, moveNode }) => {
  const ref = useRef(null)
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: monitor => {
      const { index: dragIndex } = monitor.getItem() || {}
      if (dragIndex === index) {
        return {}
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: styles.dropping,
      }
    },
    drop: item => {
      moveNode(item.index, index)
    },
  })
  const [, drag] = useDrag({
    type,
    item: {
      type,
      index,
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  })
  drop(drag(ref))
  return (
    <div
      ref={ref}
      style={{
        marginRight: 5,
      }}
      className={isOver ? dropClassName : ''}
    >
      {children}
    </div>
  )
}

const DraggableTabs = props => {
  const { children } = props
  const [order, setOrder] = useState([])

  const moveTabNode = (dragKey, hoverKey) => {
    const newOrder = order.slice()
    React.Children.forEach(children, c => {
      if (c.key && newOrder.indexOf(c.key) === -1) {
        newOrder.push(c.key)
      }
    })
    const dragIndex = newOrder.indexOf(dragKey)
    const hoverIndex = newOrder.indexOf(hoverKey)
    newOrder.splice(dragIndex, 1)
    newOrder.splice(hoverIndex, 0, dragKey)
    props.getSubjectSortOrderArray(newOrder)
    setOrder(newOrder)
  }

  const renderTabBar = (tabBarProps, DefaultTabBar) => (
    <DefaultTabBar {...tabBarProps}>
      {node => (
        <DraggableTabNode
          key={node.key}
          index={node.key}
          moveNode={moveTabNode}
        >
          {node}
        </DraggableTabNode>
      )}
    </DefaultTabBar>
  )

  const tabs = []
  React.Children.forEach(children, c => {
    tabs.push(c)
  })
  const orderTabs = tabs.slice().sort((a, b) => {
    const orderA = order.indexOf(a.key)
    const orderB = order.indexOf(b.key)

    if (orderA !== -1 && orderB !== -1) {
      return orderA - orderB
    }

    if (orderA !== -1) {
      return -1
    }

    if (orderB !== -1) {
      return 1
    }

    const ia = tabs.indexOf(a)
    const ib = tabs.indexOf(b)
    return ia - ib
  })
  return (
    <Tabs renderTabBar={renderTabBar} {...props}>
      {orderTabs}
    </Tabs>
  )
}
export default DragDropContext(HTML5Backend)(DraggableTabs)