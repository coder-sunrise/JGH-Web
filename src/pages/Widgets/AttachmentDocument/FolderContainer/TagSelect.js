import React, { useState, useEffect, useRef } from 'react'
import moment from 'moment'
import { Tag, Input, Tooltip, Select, Divider, Typography } from 'antd'
import { SaveFilled, PlusOutlined } from '@ant-design/icons'
import Authorized from '@/utils/Authorized'

const TagSelect = ({
  defaultTagIds = [],
  label,
  disabled,
  tagList = [],
  onChange = () => {},
  saveAsNewTag = () => {},
  displayField = 'displayValue',
  isEnableEditFolder = true,
  isEnableEditDocument = true,
}) => {
  const [inputVisible, setInputVisible] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef()
  const [currentTags, setCurrentTags] = useState([])
  const [currentCategoryTags, setTagsUnderCategory] = useState([])
  const [validTagIds, setValidTagIds] = useState([])
  const [newTagInput, setNewTagInput] = useState(undefined)

  useEffect(() => {
    setTagsUnderCategory([...tagList])
  }, [tagList])

  useEffect(() => {
    setCurrentTags(
      defaultTagIds.map(dt => {
        var selectTag = tagList.find(t => t.id === dt) || {}
        return {
          id: dt,
          value: selectTag[displayField],
        }
      }),
    )
  }, [defaultTagIds])

  useEffect(() => {
    setValidTagIds(
      currentCategoryTags
        .filter(t => !currentTags.find(v => v.id === t.id))
        .map(t => {
          return { id: t.id, value: t[displayField] }
        }),
    )
  }, [currentTags, currentCategoryTags])

  useEffect(() => {
    inputRef.current?.focus()
  }, [inputVisible])

  const handleRemoveTag = remoeTag => {
    const newTags = currentTags.filter(tag => tag.id !== remoeTag.id)
    setCurrentTags(newTags)
    onChange(newTags.map(t => t.id))
  }

  const showInput = () => {
    setInputVisible(true)
  }

  const handleInputConfirm = (val, option) => {
    let newTags = []
    if (option && !currentTags.find(t => t.id == option.id)) {
      newTags = [...currentTags, { id: option.id, value: option.name }]
    }
    setCurrentTags(newTags)
    setInputVisible(false)
    setNewTagInput(undefined)
    onChange(newTags.map(t => t.id))
  }

  const handleInputCancel = () => {
    if (!dropdownOpen) {
      setInputVisible(false)
      setNewTagInput(undefined)
    }
  }

  return (
    <div>
      <Typography.Text disabled={disabled}>{label} </Typography.Text>

      {currentTags.map((tag, index) => {
        {
          const tagElem = (
            <Tag
              key={tag.id}
              style={
                disabled
                  ? { cursor: 'no-drop', margin: '3px' }
                  : { margin: '3px' }
              }
              closable={!disabled}
              onClose={() => handleRemoveTag(tag)}
            >
              <span>{tag.value}</span>
            </Tag>
          )
          return disabled ? (
            tagElem
          ) : (
            <Tooltip title={tag.value} key={tag.id}>
              {tagElem}
            </Tooltip>
          )
        }
      })}

      {inputVisible && (
        <Select
          showSearch
          ref={inputRef}
          style={{ width: 150 }}
          size={'small'}
          onChange={handleInputConfirm}
          onSearch={v => setNewTagInput(v)}
          onBlur={e => handleInputCancel(e)}
          dropdownMatchSelectWidth={false}
          onDropdownVisibleChange={open => {
            setDropdownOpen(open)
          }}
          dropdownRender={menu => (
            <div>
              {menu}
              {newTagInput !== undefined &&
                newTagInput !== null &&
                newTagInput.trim().length > 0 &&
                isEnableEditFolder && (
                  <div>
                    <Divider style={{ margin: '4px 0' }} />
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        padding: 4,
                      }}
                    >
                      <a
                        style={{
                          flex: 'none',
                          padding: '4px',
                          display: 'block',
                          cursor: 'pointer',
                        }}
                        onClick={() => saveAsNewTag(newTagInput)}
                      >
                        Save As New Tag <SaveFilled />
                      </a>
                    </div>
                  </div>
                )}
            </div>
          )}
        >
          {validTagIds.map(item => (
            <Option
              key={item.id}
              value={item.value}
              id={item.id}
              name={item.value}
            >
              {item.value}
            </Option>
          ))}
        </Select>
      )}
      {!disabled && !inputVisible && isEnableEditDocument && (
        <Tag className='site-tag-plus' onClick={showInput}>
          <PlusOutlined /> New Tag
        </Tag>
      )}
    </div>
  )
}

export default TagSelect
