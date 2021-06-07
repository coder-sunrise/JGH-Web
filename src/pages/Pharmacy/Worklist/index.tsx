import { CardContainer } from '@/components'
import { ManOutlined, WomanOutlined, FileDoneOutlined } from '@ant-design/icons'
import React, { useState, CSSProperties } from 'react'
import patientService from '@/services/patient'
import { primaryColor } from 'mui-pro-jss'
import { DragDropList, DragDropListTypes } from '@medisys/component'
import { Card, Button } from 'antd'
import lists from './sample-data'
import styles from './index.less'

const linkButtonStyle: CSSProperties = {
  textDecoration: 'underline',
  cursor: 'pointer',
  marginRight: '1rem',
  color: primaryColor,
}

const ParmacyWorklist = () => {
  const initData: {
    lists: DragDropListTypes.List[]
    backgroundColor: Property.BackgroundColor
  } = {
    lists: lists,
    backgroundColor: 'none',
  }

  const [state, setState] = useState(initData)

  const onDragEndHandler = (
    dragEndRespond: DragDropListTypes.DragEndRespond,
  ) => {
    const { sourceListId, destListId, destIndex } = dragEndRespond

    if (destListId === undefined || destIndex === undefined) return

    const { lists } = state

    let modifiedLists =
      sourceListId !== destListId
        ? moveBewteenLists(lists, dragEndRespond)
        : orderInsideTheList(lists, dragEndRespond)

    setState({ ...state, lists: modifiedLists })
  }

  const onTitleRender = (listId: string) => {
    return (
      <h4
        style={{
          textAlign: 'center',
          color: 'white',
          verticalAlign: 'middle',
          fontWeight: 'bold',
          margin: '10px',
        }}
      >
        {state.lists.filter(list => list.id === listId)[0].title}
      </h4>
    )
  }

  const getItemTitle = item => {
    return (
      <div
        style={{
          display: 'flex',
          fontSize: '0.8rem',
        }}
      >
        <div>
          <div style={{ color: primaryColor, fontSize: '1rem' }}>
            {item.name}
          </div>
          <div>{item.patientReferenceNo}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div>
            {item.gender === 'male' ? (
              <ManOutlined style={{ color: primaryColor, fontSize: '1rem' }} />
            ) : (
              <WomanOutlined style={{ color: '#d4237a', fontSize: '1rem' }} />
            )}
            {` ${item.age}yrs`}
          </div>
          <div>{item.patientAccountNo}</div>
        </div>
      </div>
    )
  }

  const getItemBody = item => {
    return (
      <div
        style={{
          display: 'flex',
          fontSize: '0.8rem',
        }}
      >
        <div>
          <div>{item.doctor}</div>
          <div>
            <FileDoneOutlined style={{ color: primaryColor }} />
            {item.orderCreatedTime}
          </div>
          <div>
            <span style={linkButtonStyle}>Details</span>
            <span style={linkButtonStyle}>Print Prescription</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div>
            <ManOutlined style={{ color: primaryColor }} />
            {` ${item.age}yrs`}
          </div>
          <div>{item.patientAccountNo}</div>
        </div>
      </div>
    )
  }

  const onItemRender = (itemId: string) => {
    console.log('styles.card', styles.card)
    const item = state.lists
      .flatMap(l => l.items)
      ?.filter(item => item.id === itemId)[0]
    return (
      <Card
        className={styles.card}
        hoverable
        style={{ margin: '5px', lineHeight: '2', paddingTop: 0 }}
        title={getItemTitle(item)}
      >
        {getItemBody(item)}
      </Card>
    )
  }

  return (
    <CardContainer hideHeader>
      <DragDropList
        {...state}
        onDragEnd={onDragEndHandler}
        onTitleRender={onTitleRender}
        onItemRender={onItemRender}
      />
    </CardContainer>
  )
}

function moveBewteenLists(
  lists: DragDropListTypes.List[],
  dragEndRespond: DragDropListTypes.DragEndRespond,
): any {
  return lists.map(list => {
    const { sourceListId, itemId, destListId, destIndex } = dragEndRespond
    debugger
    //Remove the item from the source
    if (list.id === sourceListId)
      return {
        ...list,
        items: list.items.filter(item => item.id !== itemId),
      }

    //Add the item to the source
    if (list.id === destListId) {
      const sourceList = lists.filter(list => list.id === sourceListId)[0]
      const sourceItem = sourceList.items.filter(item => item.id === itemId)[0]
      return {
        ...list,
        items: [
          ...list.items.slice(0, destIndex),
          sourceItem,
          ...list.items.slice(destIndex),
        ],
      }
    }

    return { ...list }
  })
}

function orderInsideTheList(
  lists: DragDropListTypes.List[],
  dragEndRespond: DragDropListTypes.DragEndRespond,
): any {
  const {
    sourceListId,
    itemId: itemId,
    destListId,
    destIndex,
    sourceIndex,
  } = dragEndRespond

  if (sourceIndex === destIndex) return lists

  return lists.map(list => {
    if (list.id !== destListId) {
      return list
    }

    const sourceItem = list.items.filter(item => item.id === itemId)[0]

    const clone = [...list.items]
    clone.splice(sourceIndex, 1)
    clone.splice(destIndex, 0, sourceItem)

    return {
      ...list,
      items: [...clone],
    }
  })
}

export default ParmacyWorklist
