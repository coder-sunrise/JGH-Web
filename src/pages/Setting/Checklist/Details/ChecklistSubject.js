import React, { PureComponent } from 'react'
import { FastField } from 'formik'
import { Tabs } from 'antd'
import _ from 'lodash'
import { GridContainer, GridItem, TextField, Tooltip } from '@/components'
import ChecklistObservation from './ChecklistObservation'
import DraggableTabs from './DraggableTabs'
const { TabPane } = Tabs

class ChecklistSubject extends PureComponent {
  newTabIndex = 0

  constructor(props) {
    super(props)

    const checklistSubject = this.getChecklistSubject()

    let activeKey
    if (checklistSubject.length > 0) {
      activeKey =
        (
          checklistSubject.find(subjectItem => subjectItem.sortOrder == 0) ??
          checklistSubject.find(subjectItem => subjectItem.sortOrder == 1)
        ).key ?? checklistSubject[0].key
    }

    this.state = {
      activeKey,
    }
  }

  wrapChecklistSubject = checklistSubject => {
    const checklistSubjectWithTabKey = checklistSubject.map(itemSubject => ({
      ...itemSubject,
      key: itemSubject.id ? itemSubject.id.toString() : itemSubject.key,
    }))

    return checklistSubjectWithTabKey
  }

  getChecklistSubject = () => {
    const { values } = this.props
    const checklistSubject = values.checklistSubject
    return checklistSubject
  }

  updateState = newState => {
    this.setState({ ...newState })
  }

  setChecklistSubject = checklistSubject => {
    const { setFieldValue } = this.props
    setFieldValue('checklistSubject', [...checklistSubject])
  }

  addObservation = subjectKey => {
    const newChecklistSubject = this.getChecklistSubject()

    const currentSubject = _.find(newChecklistSubject, ['key', subjectKey])

    let maxSortOrder = 1
    if (
      currentSubject.checklistObservation &&
      currentSubject.checklistObservation.length > 0
    ) {
      const sortedObservation = _.orderBy(
        currentSubject.checklistObservation,
        ['sortOrder'],
        ['desc'],
      )
      maxSortOrder = sortedObservation[0].sortOrder + 1
    }

    currentSubject.checklistObservation.push({
      displayValue: '',
      isHasMultiNature: true,
      isHasRemark: false,
      isWithTitleForInterpretation: false,
      sortOrder: maxSortOrder,
      natures: [],
    })

    this.setChecklistSubject(newChecklistSubject)
    this.props.manuallyTriggerDirty()
  }

  removeObservation = observationItem => {
    const { activeKey } = this.state
    const checklistSubject = this.getChecklistSubject()
    const currentSubject = _.find(checklistSubject, ['key', activeKey])

    const currentSubjectIndex = _.indexOf(checklistSubject, currentSubject)
    if (currentSubjectIndex >= 0) {
      if (observationItem.id) {
        observationItem.isDeleted = true
      } else {
        const index = _.indexOf(
          checklistSubject[currentSubjectIndex].checklistObservation,
          observationItem,
        )

        if (index >= 0) {
          checklistSubject[currentSubjectIndex].checklistObservation.splice(
            index,
            1,
          )
        }
      }
    }

    this.setChecklistSubject(checklistSubject)
    this.props.manuallyTriggerDirty()
  }

  onChange = activeKey => {
    this.setState({ activeKey })
  }

  onEdit = (targetKey, action) => {
    this.props.manuallyTriggerDirty()
    this[action](targetKey)
  }

  add = () => {
    const newChecklistSubject = this.getChecklistSubject()
    let newSortOrder = 0
    if (newChecklistSubject && newChecklistSubject.length > 0) {
      newSortOrder = _.maxBy(newChecklistSubject, 'sortOrder')?.sortOrder + 1
    }
    const subjectLenth = newChecklistSubject.push({
      displayValue: 'Subject Title',
      sortOrder: newSortOrder,
      isDeleted: false,
      key: `newTabIndex${this.newTabIndex++}`,
      checklistObservation: [],
    })

    const displayChecklistSubject = newChecklistSubject.filter(
      itemSubject => itemSubject.isDeleted === false,
    )

    this.setChecklistSubject(newChecklistSubject)
    this.updateState({
      activeKey:
        displayChecklistSubject[displayChecklistSubject.length - 1].key,
    })
  }

  remove = targetKey => {
    const { activeKey } = this.state

    const newChecklistSubject = this.getChecklistSubject()
    let newActiveKey = activeKey

    const toDeletedSubject = _.find(newChecklistSubject, { key: targetKey })

    if (!toDeletedSubject) return

    let toRemoveSubject = false
    let deletedIndex = 0
    let deletedCount = 0
    let index = 0
    for (; index < newChecklistSubject.length; index++) {
      let subject = newChecklistSubject[index]
      if (subject.key === targetKey) {
        if (subject.id) {
          subject.isDeleted = true
        } else {
          toRemoveSubject = true
        }
        deletedCount++
        deletedIndex = index
        break
      }

      if (subject.isDeleted === true) {
        deletedCount++
      }
    }

    if (toRemoveSubject) {
      newChecklistSubject.splice(deletedIndex, 1)
    }

    const displayChecklistSubject = newChecklistSubject.filter(
      itemSubject => itemSubject.isDeleted === false,
    )

    if (displayChecklistSubject.length && newActiveKey === targetKey) {
      if (deletedIndex - deletedCount >= 0) {
        newActiveKey = displayChecklistSubject[deletedIndex - deletedCount].key
      } else {
        newActiveKey = displayChecklistSubject[0].key
      }
    }

    this.setChecklistSubject(newChecklistSubject)
    this.updateState({
      activeKey: newActiveKey,
    })
  }

  tabSubjectTitle = item => {
    const { activeKey } = this.state
    const checklistSubject = this.getChecklistSubject()
    const index = _.indexOf(checklistSubject, item)

    return (
      <>
        <Tooltip title="Drag">
          {index >= 0 && activeKey !== item.key ? (
            <span
              style={
                item.displayValue
                  ? {}
                  : {
                      color: 'red',
                    }
              }
            >
              {item.displayValue || '*   '}
            </span>
          ) : (
            <FastField
              name={`checklistSubject[${index}].displayValue`}
              render={args => (
                <TextField style={{ width: '150px', margin: '0' }} {...args} />
              )}
            />
          )}
        </Tooltip>
      </>
    )
  }

  subjectInputChange = (key, e) => {
    const newChecklistSubject = this.getChecklistSubject()

    newChecklistSubject.forEach(item => {
      if (item.key === key) {
        item.displayValue = e.target.value
      }
    })

    this.setChecklistSubject(newChecklistSubject)
  }

  render() {
    const { activeKey } = this.state

    const checklistSubject = this.getChecklistSubject()

    const displayChecklistSubject = _.orderBy(
      checklistSubject.filter(itemSubject => itemSubject.isDeleted === false),
      ['sortOrder'],
      ['asc'],
    )

    return (
      <GridContainer>
        <GridItem md={12}>
          <DraggableTabs
            type='editable-card'
            style={{ minHeight: '360px' }}
            onChange={this.onChange}
            activeKey={activeKey}
            onEdit={this.onEdit}
            {...this.props}
          >
            {displayChecklistSubject.map(itemSubject => {
              return (
                <TabPane
                  tab={this.tabSubjectTitle(itemSubject)}
                  key={itemSubject.key}
                >
                  <ChecklistObservation
                    {...this.props}
                    subjectKey={itemSubject.key}
                    addObservation={this.addObservation}
                    removeObservation={this.removeObservation}
                  />
                </TabPane>
              )
            })}
          </DraggableTabs>
        </GridItem>
      </GridContainer>
    )
  }
}

export default ChecklistSubject
