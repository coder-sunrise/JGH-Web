import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'dva'
import moment from 'moment'
import { Tag, Input, Tooltip, Select, Divider, Typography } from 'antd'
import { SaveFilled, PlusOutlined } from '@ant-design/icons'
import * as service from '../../services/tag'
import Authorized from '@/utils/Authorized'

export interface TagPanelProps {
  tagCategory: 'Service' | 'Patient'
  onChange: (value: string[], tags: object[]) => void
  defaultTagNames: string[]
  label: string
  disabled: Boolean
}

type Tag = {
  description: string
  displayValue: string
  category: 'Service' | 'Patient'
  isUserMaintainable: Boolean
  effectiveStartDate: string
  effectiveEndDate: string
}

const TagPanel: React.FC<TagPanelProps> = ({
  tagCategory,
  onChange,
  defaultTagNames = [],
  label,
  disabled,
}) => {
  const [inputVisible, setInputVisible] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<Input>(null)
  const [currentTagNames, setCurrentTagNames] = useState<string[]>([])
  const [currentCategoryTags, setTagsUnderCategory] = useState<Tag[]>([])
  const [validTagNames, setValidTagNames] = useState<{ value: string }[]>([])
  const [newTagInput, setNewTagInput] = useState([])
  const dispatch = useDispatch()

  function fetchTags() {
    dispatch({
      type: 'codetable/fetchCodes',

      payload: { code: 'cttag', force: true },
    }).then(result => {
      if (result) {
        setTagsUnderCategory(result.filter(t => t.category === tagCategory))
      }
    })
  }

  useEffect(() => {
    fetchTags()
  }, [tagCategory])

  useEffect(() => {
    setCurrentTagNames(defaultTagNames)
  }, [defaultTagNames])

  useEffect(() => {
    setValidTagNames(
      currentCategoryTags
        .filter(
          t => currentTagNames.findIndex(v => v === t.displayValue) === -1,
        )
        .map(t => {
          return { value: t.displayValue }
        }),
    )
  }, [currentTagNames, currentCategoryTags])

  useEffect(() => {
    inputRef.current?.focus()
  }, [inputVisible])

  const handleRemoveTag = (remoeTagName: string) => {
    const newTags = currentTagNames.filter(tag => tag !== remoeTagName)
    setCurrentTagNames(newTags)
    onChange(
      newTags,
      currentCategoryTags.filter(t => newTags.includes(t.displayValue)),
    )
  }

  const showInput = () => {
    setInputVisible(true)
  }

  const handleInputConfirm = (val: string) => {
    let newTags: string[] = []
    if (val && currentTagNames.indexOf(val) === -1) {
      newTags = [...currentTagNames, val]
    }
    setCurrentTagNames(newTags)
    setInputVisible(false)

    onChange(
      newTags,
      currentCategoryTags.filter(t => newTags.includes(t.displayValue)),
    )
  }

  const handleInputCancel = () => {
    if (!dropdownOpen) {
      setInputVisible(false)
    }
  }

  const saveAsNewTag = async () => {
    await service.default.upsert({
      description: newTagInput,
      displayValue: newTagInput,
      category: tagCategory,
      isUserMaintainable: true,
      effectiveStartDate: moment().formatUTC(),
      effectiveEndDate: moment('2099-12-31T23:59:59').formatUTC(false),
    })
    fetchTags()
  }

  return (
    <div>
      <Typography.Text disabled={disabled}>{label} </Typography.Text>

      {currentTagNames.map((tag, index) => {
        {
          const tagElem = (
            <Tag
              key={tag}
              style={
                disabled
                  ? { cursor: 'no-drop', margin: '3px' }
                  : { margin: '3px' }
              }
              closable={!disabled}
              onClose={() => handleRemoveTag(tag)}
            >
              <span>{tag}</span>
            </Tag>
          )
          return disabled ? (
            tagElem
          ) : (
            <Tooltip title={tag} key={tag}>
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
          onDropdownVisibleChange={open => {
            setDropdownOpen(open)
          }}
          dropdownRender={menu => (
            <div>
              {menu}
              {currentCategoryTags.findIndex(t =>
                t.displayValue.includes(newTagInput),
              ) === -1 && (
                <>
                  <Authorized authority='settings.clinicsetting.tag'>
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
                        onClick={saveAsNewTag}
                      >
                        Save As New Tag <SaveFilled />
                      </a>
                    </div>
                  </Authorized>
                </>
              )}
            </div>
          )}
        >
          {validTagNames.map(item => (
            <Option key={item.value}>{item.value}</Option>
          ))}
        </Select>
      )}
      {!disabled && !inputVisible && (
        <Tag
          className='site-tag-plus'
          style={{ margin: '3px' }}
          onClick={showInput}
        >
          <PlusOutlined /> New Tag
        </Tag>
      )}
    </div>
  )
}

export default TagPanel
