import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { DragSource, DropTarget, useDrag, useDrop } from 'react-dnd'
import { MenuItem, ListItemText, ListItemIcon } from '@material-ui/core'
import _ from 'lodash'
import { IconButton, Badge, TextField, Tooltip } from '@/components'
import { Button, Tag } from 'antd'
import { DeleteFilled } from '@ant-design/icons'
import { DragIndicator, ImportContactsOutlined } from '@material-ui/icons'

const Types = {
  Folder: 'Folder',
}
const ItemSource = {
  canDrag(props, monitor, component) {
    const { item } = props
    return item.id > 0
  },
  beginDrag(props, monitor, component) {
    return {
      index: props.index,
    }
  },
  endDrag(props, monitor, component) {
    props.onEndDrag && props.onEndDrag(props)
  },
}
const ItemTarget = {
  canDrop(props, monitor) {
    return props.index > 0
  },
  hover(props, monitor, component) {
    if (!component) {
      return null
    }
    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index
    if (dragIndex === props.lastIndex || hoverIndex === props.lastIndex) {
      return null
    }
    if (dragIndex === hoverIndex) {
      return null
    }
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
    const clientOffset = monitor.getClientOffset()
    const hoverClientY = clientOffset.y - hoverBoundingRect.top
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return null
    }
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return null
    }
    props.onMoving && props.onMoving(dragIndex, hoverIndex)
    monitor.getItem().index = hoverIndex
  },
}
function dropCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType(),
  }
}
function dragCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
  }
}

class DragableItem extends Component {
  render() {
    const {
      isDragging,
      connectDragSource,
      connectDropTarget,
      connectDragPreview,
      item,
      isSelected,
      onItemClick,
      onItemChanged,
      isEditMode,
      readOnly,
      isEnableEditFolder = true,
      isEnableDeleteFolder = true,
    } = this.props

    let opacity = isDragging ? 0.4 : 1
    const isItemAll = item.id === -99
    return connectDropTarget(
      <div>
        {connectDragPreview(
          <div
            style={{
              border: isDragging ? '1px dashed gray' : '0px',
              opacity,
            }}
          >
            {isEditMode ? (
              !isItemAll && (
                <div style={{ margin: '5px 0px' }}>
                  <div
                    style={{
                      float: 'left',
                      width: '100%',
                      paddingLeft: 10,
                      paddingRight: 30,
                      marginRight: -35,
                      overflow: 'hidden',
                    }}
                  >
                    <TextField
                      maxLength={50}
                      value={item.displayValue}
                      onChange={e => {
                        onItemChanged({ ...item, displayValue: e.target.value })
                      }}
                    />
                  </div>
                  {isEnableDeleteFolder && (
                    <Button
                      type='danger'
                      size='small'
                      // disabled={!item.isEmpty}
                      style={{
                        float: 'right',
                        marginTop: 8,
                      }}
                      onClick={e => {
                        onItemChanged({ ...item, isDeleted: true })
                      }}
                      icon={<DeleteFilled />}
                    ></Button>
                  )}
                </div>
              )
            ) : (
              <MenuItem
                key={item.id}
                selected={isSelected}
                onClick={e => {
                  onItemClick(item)
                }}
              >
                {!readOnly &&
                  !isItemAll &&
                  isEnableEditFolder &&
                  connectDragSource(
                    <div style={{ cursor: 'move' }}>
                      <ListItemIcon style={{ minWidth: 25, marginTop: 5 }}>
                        <DragIndicator
                          onMouseDown={e => {
                            e.stopPropagation()
                          }}
                        />
                      </ListItemIcon>
                    </div>,
                  )}

                <Tooltip title={item.displayValue}>
                  <ListItemText
                    primary={
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          width: '100%',
                          overflow: 'hidden',
                        }}
                      >
                        {item.displayValue}
                      </span>
                    }
                    style={{
                      marginRight: 15,
                      paddingLeft:
                        isItemAll && !readOnly && isEnableEditFolder ? 25 : 0,
                      overflow: 'hidden',
                    }}
                  />
                </Tooltip>
                <Badge
                  badgeContent={item.fileCount}
                  color='primary'
                  overlap='circle'
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                />
              </MenuItem>
            )}

            <div style={{ clear: 'both' }} />
          </div>,
        )}
      </div>,
    )
  }
}

export default _.flow(
  DropTarget(Types.Folder, ItemTarget, dropCollect),
  DragSource(Types.Folder, ItemSource, dragCollect),
)(DragableItem)
