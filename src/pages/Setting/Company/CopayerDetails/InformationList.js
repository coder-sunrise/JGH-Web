import React, { useEffect, useState, useContext, useRef } from 'react'
import {
  GridContainer,
  GridItem,
  Button,
  Checkbox,
  TextField,
  FastField,
  Field,
  Popconfirm,
  Tooltip,
} from '@/components'
import { Table, Radio, Input, InputNumber, Form, Typography, Space } from 'antd'
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  CloseCircleFilled,
  SaveFilled,
  DeleteFilled,
  EditFilled,
} from '@ant-design/icons'
import Print from '@material-ui/icons/Print'
import styles from './ContactPersonList.less'

const { TextArea } = Input
const EditableCell = ({
  col,
  editing,
  editingKey,
  record,
  index,
  children,
  onErrorStatusChanged,
  ...restProps
}) => {
  let cellContainerStyle = {
    verticalAlign: 'top',
  }
  let cell = <React.Fragment>{children}</React.Fragment>

  //=============== Non-editing / non-editable cell (e.g. Action Column) ===============
  if (!col) {
    return <td {...restProps}>{cell}</td>
  }
  if (!editing) {
    if (col.inputType && col.inputType === 'number') {
      cellContainerStyle = {
        ...cellContainerStyle,
        textAlign: 'center',
      }
    } else {
      cellContainerStyle = {
        ...cellContainerStyle,
        whiteSpace: 'pre-line',
      }
    }

    return (
      <td {...restProps} style={cellContainerStyle}>
        <p>{cell}</p>
      </td>
    )
  }

  //=============== Editable cell ===============//
  //===== State =====//
  const [validationError, setValidationError] = useState({
    hasError: false,
    errorMsg: '',
  })
  const [initialized, setInitialized] = useState(false)
  const inputRef = useRef(null)

  //===== Hooks =====//
  useEffect(() => {
    if (col.key === 'type') {
      inputRef.current.focus()
    }
  }, [initialized])

  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      validateField(record[col.dataIndex])
    }
  })

  //===== Events =====//
  const onFieldChanged = e => {
    validateField(e.target.value)
  }

  const validateField = fieldValue => {
    if (!col.editableRules || col.editableRules.length <= 0) return

    let error = { hasError: false, errorMsg: '' }
    for (let i = 0; i < col.editableRules.length; i++) {
      let editableRule = col.editableRules[i]

      if (editableRule.required && fieldValue === '') {
        error = { hasError: true, errorMsg: editableRule.message }
        break
      }

      if (editableRule.max && fieldValue.length > editableRule.max) {
        error = { hasError: true, errorMsg: editableRule.message }
        break
      }
    }

    if (
      error.hasError != validationError.hasError ||
      error.errorMsg != validationError.errorMsg
    ) {
      if (onErrorStatusChanged) {
        onErrorStatusChanged(col.dataIndex, error)
      }

      setValidationError(error)
    }
  }

  //===== Styles =====//
  let inputContainerStyle = {
    display: 'flex',
    width: '100%',
  }
  let inputBoxStyle = {
    borderStyle: 'none none solid none',
    borderRadius: 0,
    outline: 'none',
    boxShadow: 'none',
  }

  //===== Component (Error Icon) =====//
  let errorIcon = undefined
  if (validationError && validationError.hasError) {
    let errorIconStyle = {
      color: 'red',
      minWidth: 18,
      marginTop: 10,
      marginLeft: 4,
    }

    errorIcon = (
      <Tooltip title={validationError.errorMsg} placement='bottom'>
        <ExclamationCircleOutlined style={errorIconStyle} />
      </Tooltip>
    )

    inputBoxStyle = {
      ...inputBoxStyle,
      borderColor: 'red',
    }
  }

  //===== Component (Main) =====//
  cell = (
    <React.Fragment>
      <div style={inputContainerStyle}>
        <Form.Item name={col.dataIndex} style={{ margin: 0, width: '100%' }}>
          {/* <Input 
            key={col.dataIndex}
            style={inputBoxStyle}
            onChange={onFieldChanged} 
            autoComplete='off'
            ref={inputRef}/> */}
          {col.inputType === 'number' ? (
            <InputNumber
              key={col.dataIndex}
              style={inputBoxStyle}
              autoComplete='off'
              ref={inputRef}
              min={0}
              max={2147483647}
            />
          ) : (
            <TextArea
              key={col.dataIndex}
              style={inputBoxStyle}
              onChange={onFieldChanged}
              autoComplete='off'
              ref={inputRef}
              autoSize={{ minRows: 1 }}
            />
          )}
        </Form.Item>
        {errorIcon}
      </div>
    </React.Fragment>
  )

  return (
    <td {...restProps} style={cellContainerStyle}>
      {cell}
    </td>
  )
}

export const InformationList = props => {
  const { dispatch, values, onEditingListControl, enableEditDetails } = props
  const { informations } = values

  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [editingKey, setEditingKey] = useState('')
  const [editingHasError, setEditingHasError] = useState(false)
  const [editingErrorFields, setEditingErrorFields] = useState([])

  const isEditing = record => record.key === editingKey

  useEffect(() => {
    setData(informations)
  }, [informations])

  let filteredData = []
  if (data && data.length > 0) {
    filteredData = data.filter(function(x) {
      return x.isDeleted !== true
    })
    filteredData = _.sortBy(filteredData, 'sortOrder')
  }

  //========== Events ==========//
  const addNew = () => {
    let nextKey = 0
    if (data && data.length > 0) {
      nextKey = data[data.length - 1].key + 1
    }

    let newInfo = {
      key: nextKey,
      type: '',
      summary: '',
      description: '',
      sortOrder: 99,
      isDeleted: false,
      isNewRecord: true,
      recordStatus: 'Adding',
    }

    edit(newInfo)

    let newInfoList = [...data, newInfo]
    props.setFieldValue('informations', newInfoList)
  }

  const edit = record => {
    form.setFieldsValue({ ...record })
    setEditingHasError(false)
    setEditingKey(record.key)

    if (onEditingListControl) {
      onEditingListControl('Information', true)
    }
  }

  const save = async recordKey => {
    try {
      const row = await form.validateFields()
      const newData = [...data]
      const index = newData.findIndex(item => recordKey === item.key)

      if (index > -1) {
        const info = newData[index]

        if (info.isNewRecord === true) {
          info.recordStatus = 'New'
        }

        newData.splice(index, 1, { ...info, ...row })
        setData(newData)
        setEditingKey('')

        props.setFieldValue('informations', newData)

        if (onEditingListControl) {
          onEditingListControl('Information', false)
        }
      }
    } catch (errInfo) {
      console.log('Validation Failed:', errInfo)
    }
  }

  const cancel = async record => {
    try {
      setEditingHasError(false)
      if (record.recordStatus === 'Adding') {
        setEditingKey('')
        deleteExisting(record)
      } else {
        setEditingKey('')
      }

      if (onEditingListControl) {
        onEditingListControl('Information', false)
      }
    } catch (errInfo) {
      console.log('Validation Failed:', errInfo)
    }
  }

  const deleteExisting = record => {
    if (record.isNewRecord === true) {
      const newData = data.filter(function(x) {
        return x.key !== record.key
      })
      setData(newData)

      props.setFieldValue('informations', newData)
    } else {
      const newData = [...data]
      const index = newData.findIndex(item => record.key === item.key)

      if (index > -1) {
        const info = newData[index]
        record.isDeleted = true

        newData.splice(index, 1, { ...info, ...record })
        setData(newData)

        props.setFieldValue('informations', newData)
      }
    }
  }

  const onEditingErrorStatusChanged = (fieldName, errorInfo) => {
    let newErrorList = []

    if (errorInfo.hasError) {
      newErrorList = editingErrorFields.concat(fieldName)
    } else {
      if (editingErrorFields && editingErrorFields.length > 0) {
        newErrorList = editingErrorFields.filter(function(x) {
          return x !== fieldName
        })
      }
    }

    setEditingErrorFields(newErrorList)
    if (newErrorList && newErrorList.length > 0) {
      setEditingHasError(true)
    } else {
      setEditingHasError(false)
    }
  }

  //========== Table Setup ==========//
  const components = {
    body: {
      cell: EditableCell,
    },
  }

  const informationColumns = [
    {
      title: 'Type',
      width: 150,
      dataIndex: 'type',
      key: 'type',
      editable: true,
      inputType: 'text',
      editableRules: [
        { max: 30, message: 'Type should not exceed 30 characters' },
      ],
    },
    {
      title: 'Summary',
      width: 400,
      dataIndex: 'summary',
      key: 'summary',
      editable: true,
      inputType: 'text',
      editableRules: [
        { required: true, message: 'This is a required field' },
        { max: 250, message: 'Summary should not exceed 250 characters' },
      ],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      editable: true,
      inputType: 'text',
      editableRules: [
        { max: 2500, message: 'Description should not exceed 2500 characters' },
      ],
    },
    {
      title: 'Sort Order',
      width: 90,
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      align: 'center',
      editable: true,
      inputType: 'number',
      editableRules: [],
    },
    {
      title: 'Action',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const actionIconStyle = {
          fontSize: 16,
          marginLeft: 4,
          marginRight: 4,
          marginTop: 4,
        }

        const alertActionIconStyle = {
          ...actionIconStyle,
          color: 'red',
        }

        //=== Not Editing ===//
        if (editingKey === '') {
          return enableEditDetails ? (
            <div>
              <Typography.Link color='primary' onClick={() => edit(record)}>
                <EditFilled style={actionIconStyle} />
              </Typography.Link>
              <Typography.Link>
                <Popconfirm
                  overlayStyle={{ width: 180 }}
                  title='Sure to delete?'
                  cancelText='No'
                  okText='Yes'
                  onConfirm={() => deleteExisting(record)}
                >
                  <DeleteFilled style={alertActionIconStyle} />
                </Popconfirm>
              </Typography.Link>
            </div>
          ) : (
            ''
          )
        }

        const editable = isEditing(record)
        if (!editable) {
          return (
            <React.Fragment>
              <Typography.Link disabled>
                <EditFilled style={actionIconStyle} />
              </Typography.Link>
              <Typography.Link disabled>
                <DeleteFilled style={actionIconStyle} />
              </Typography.Link>
            </React.Fragment>
          )
        }

        //=== Editing ===//
        // useEffect(() => {}, [editingHasError])

        return (
          <React.Fragment>
            {editingHasError ? (
              <Typography.Link
                color='primary'
                disabled
                onClick={() => save(record.key)}
              >
                <SaveFilled style={actionIconStyle} />
              </Typography.Link>
            ) : (
              <Tooltip title='Confirm Changes' placement='bottom'>
                <Typography.Link
                  color='primary'
                  onClick={() => save(record.key)}
                >
                  <SaveFilled style={actionIconStyle} />
                </Typography.Link>
              </Tooltip>
            )}

            <Tooltip title='Cancel' placement='bottom'>
              <Typography.Link>
                <Popconfirm
                  overlayStyle={{ width: 180 }}
                  title='Sure to cancel?'
                  cancelText='No'
                  okText='Yes'
                  onConfirm={() => cancel(record)}
                >
                  <CloseCircleFilled style={alertActionIconStyle} />
                </Popconfirm>
              </Typography.Link>
            </Tooltip>
          </React.Fragment>
        )
      },
    },
  ]

  const columns = informationColumns.map(col => {
    if (!col.editable) {
      return col
    }

    return {
      ...col,
      onCell: record => ({
        record,
        col: col,
        editing: isEditing(record),
        editingKey: editingKey,
        onErrorStatusChanged: onEditingErrorStatusChanged,
      }),
    }
  })

  //========== Component ==========//
  return (
    <React.Fragment>
      {/* //===== Information List =====// */}
      <GridItem style={{ marginTop: 30 }}>
        <h4 style={{ fontWeight: 500 }}>Information</h4>
      </GridItem>

      <Form form={form} component={false}>
        <Table
          className={styles.editableTable}
          rowClassName={record =>
            isEditing(record) ? styles.editingRow : styles.editableRow
          }
          components={components}
          columns={columns}
          dataSource={filteredData}
          pagination={{ position: ['none', 'none'] }}
        />
      </Form>

      {enableEditDetails && (
        <div style={{ padding: 10 }}>
          <Typography.Link
            color='primary'
            disabled={editingKey !== ''}
            onClick={addNew}
          >
            <PlusOutlined style={{ marginRight: 6 }} />
            New Information
          </Typography.Link>
        </div>
      )}
    </React.Fragment>
  )
}
