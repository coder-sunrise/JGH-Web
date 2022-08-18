import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'dva'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import styles from './DosageRule.less'
import {
  Table,
  Input,
  InputNumber,
  Button,
  Popconfirm,
  Form,
  Typography,
  Select,
} from 'antd'
import { GridContainer, GridItem, CodeSelect, Popover } from '@/components'
import DetailsContext from '../../Details/DetailsContext'
import { DOSAGE_RULE, DOSAGE_RULE_OPERATOR } from '@/utils/constants'
import Edit from '@material-ui/icons/Edit'
import Save from '@material-ui/icons/Save'
import Cancel from '@material-ui/icons/Cancel'
import Delete from '@material-ui/icons/Delete'
import './DosageRule.less'

const formItemStyle = {
  margin: 0,
  display: 'block',
}

const EditableRow = ({ index, ...props }) => {
  return <tr {...props} style={{ verticalAlign: 'top' }} />
}

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  return (
    <td {...restProps}>
      <div>{children}</div>
    </td>
  )
}

const SingleDecimalInput = ({ onChange, ...props }) => {
  const [currentValue, setCurrentValue] = useState(null)

  function handlChange(val) {
    if (val === null) {
      setCurrentValue(val)
      if (onChange) {
        onChange(val)
      }
      return
    }

    let singleDecimalRegex = /^(([0-9]+)|([0-9]+.[0-9]?))$/

    if (!singleDecimalRegex.test(val)) return

    if (singleDecimalRegex.test(val)) setCurrentValue(val)
    if (onChange) onChange(val)
  }

  return <InputNumber value={currentValue} onChange={handlChange} {...props} />
}

const DosageRuleTable = ({
  initialData,
  rule,
  medicationUsageFK,
  dispenseUomFK,
  prescribeUomFK,
  onChange,
  editenable,
}) => {
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [selectedOperator, setSelectedOperator] = useState(null)
  const [rangeValidation, setRangeValidation] = useState({
    message: '',
  })
  const [editingKey, setEditingKey] = useState('')
  const codetable = useSelector(s => s.codetable)
  const maxInput = 999

  const { isEditingDosageRule, setIsEditingDosageRule } = useContext(
    DetailsContext,
  )

  useEffect(() => {
    setIsEditingDosageRule(editingKey !== '')
    if (data.length === 0) form.resetFields()
  }, [editingKey])

  useEffect(() => {
    if (initialData) {
      setEditingKey('')

      const sortedInitialData =
        rule !== DOSAGE_RULE.default
          ? _.sortBy(initialData, s => getRangeMinMax(s)?.max)
          : initialData

      setData(
        sortedInitialData.map((item, index) => ({ ...item, key: index + 1 })),
      )
    }
  }, [rule, initialData])

  const isEditing = record => record.key === editingKey
  const dispatch = useDispatch()

  const getDisplayValue = (code, id) => {
    if (id) {
      const item = codetable[code]?.filter(c => c.id === id)[0]
      if (item) {
        return 'displayValue' in item ? item.displayValue : item.name
      }
    }
    return ''
  }

  useEffect(() => {
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedicationdosage',
      },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedicationfrequency',
      },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedicationusage',
      },
    })
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctmedicationunitofmeasurement',
      },
    })
  }, [])

  const edit = record => {
    form.setFieldsValue({
      ...record,
    })
    setEditingKey(record.key)
    setSelectedOperator(record.operator ?? DOSAGE_RULE_OPERATOR.to)
  }

  const cancel = key => {
    if (key === -1) setData(data.filter(r => r.key !== key))

    form.resetFields()
    setRangeValidation({
      message: '',
    })
    setEditingKey('')
  }

  const getRangeMinMax = ({ operator, leftOperand, rightOperand }) => {
    if (operator === DOSAGE_RULE_OPERATOR.to)
      return { min: leftOperand, max: rightOperand }
    if (operator === DOSAGE_RULE_OPERATOR.lessThan)
      return { min: 0, max: rightOperand - 0.1 }
    if (operator === DOSAGE_RULE_OPERATOR.moreThan)
      return { min: rightOperand + 0.1, max: maxInput }
  }

  const validate = async () => {
    const fields = form.getFieldsValue(true)
    let rangeValidationErrorMessage = ''
    let rangeValidationErrorDetails = null
    let validationSuccess = true
    const operator = fields?.operator
    const leftOperand = fields?.leftOperand
    const rightOperand = fields?.rightOperand

    try {
      await form.validateFields()
    } catch {
      validationSuccess = false
    }

    const validAgeExpressioin = /^(([0-9]+)|(0.5))+$/

    if (rule === DOSAGE_RULE.age || rule === DOSAGE_RULE.weight) {
      if (!operator) {
        rangeValidationErrorMessage = `Required.`
        validationSuccess = false
      } else if (operator === DOSAGE_RULE_OPERATOR.to) {
        if (
          leftOperand === undefined ||
          leftOperand === null ||
          rightOperand === undefined ||
          rightOperand === null
        ) {
          rangeValidationErrorMessage = 'Both from and to are required.'
          validationSuccess = false
        }

        if (leftOperand > rightOperand) {
          rangeValidationErrorMessage = `${rule} to must be larger than ${rule} from.`
          validationSuccess = false
        }
      } else {
        if (rightOperand === undefined || rightOperand === null) {
          rangeValidationErrorMessage = `Required.`
          validationSuccess = false
        } else if (
          operator === DOSAGE_RULE_OPERATOR.lessThan &&
          rightOperand === 0
        ) {
          rangeValidationErrorMessage = `Invalid ${rule} range.`
          validationSuccess = false
        }
      }
      if (rule === DOSAGE_RULE.age) {
        if (
          (leftOperand && !validAgeExpressioin.test(leftOperand)) ||
          (rightOperand && !validAgeExpressioin.test(rightOperand))
        ) {
          rangeValidationErrorMessage =
            'Invalid age range. 0.5 (6 months) or full year only.'
          validationSuccess = false
        }
      }

      //To ensure that mandatory fields have the value before checking conflict with other rules.
      if (rangeValidationErrorMessage.length === 0) {
        const conflictValidationResult = validateRangeConflicts({
          operator,
          leftOperand,
          rightOperand,
        })

        if (!conflictValidationResult.validationSuccess) {
          ;({
            rangeValidationErrorMessage,
            rangeValidationErrorDetails,
            validationSuccess,
          } = conflictValidationResult)
        }
      }
    }

    setRangeValidation({
      message: rangeValidationErrorMessage,
      details: rangeValidationErrorDetails,
    })
    if (validationSuccess) return validationSuccess ? fields : undefined
  }

  const validateRangeConflicts = ({ operator, leftOperand, rightOperand }) => {
    let rangeValidationErrorMessage = ''
    let rangeValidationErrorDetails = null
    let validationSuccess = true

    // checking lenght as 1 because there is a temporary record added in state duing adding new row.
    if (!data || data.length === 1) {
      return {
        validationSuccess,
        rangeValidationErrorMessage,
      }
    }

    const ranges = data
      .filter(d => d.key !== -1 && d.key !== editingKey)
      .map(d => {
        const minMax = getRangeMinMax({ ...d })
        return { ...d, ...minMax }
      })

    const currentRange = getRangeMinMax({ operator, leftOperand, rightOperand })

    const conflict = ranges.filter(
      item =>
        (currentRange.min >= item.min && currentRange.min <= item.max) ||
        (currentRange.max >= item.min && currentRange.max <= item.max) ||
        (currentRange.min <= item.min && currentRange.max >= item.max),
    )

    if (conflict.length > 0) {
      rangeValidationErrorMessage = 'Range conflicting with other rules.'
      rangeValidationErrorDetails = conflict.map(item => (
        <div>{`${item.leftOperand ?? ''} ${item.operator} ${
          item.rightOperand
        }`}</div>
      ))
      validationSuccess = false
    }

    return {
      validationSuccess,
      rangeValidationErrorMessage,
      rangeValidationErrorDetails,
    }
  }

  const save = async key => {
    const row = await validate()

    if (!row) return

    const newData = [...data]
    const index = newData.findIndex(item => key === item.key)

    const item = newData[index]
    if (item.key === -1) {
      item.key = data.length
    }

    newData.splice(index, 1, { ...item, ...row })
    setData(newData)
    setEditingKey('')
    form.resetFields()

    if (onChange) onChange(newData)
  }

  const deleteData = async key => {
    const newData = data.filter(d => d.key !== key)
    setData(newData)
    form.resetFields()

    if (onChange) onChange(newData)
  }

  const ruleLabel = {
    age: 'By Age (Years)',
    weight: 'By Weight (KG)',
    default: 'Default',
  }
  const columns = [
    {
      title: ruleLabel[rule ?? DOSAGE_RULE.default],
      dataIndex: 'range',
      editable: true,
      render: (item = {}, record) => {
        if (rule === DOSAGE_RULE.default) return <></>
        const editing = isEditing(record)
        return (
          <>
            {editing ? (
              <GridContainer gutter={4}>
                <GridItem md={3}>
                  {selectedOperator === DOSAGE_RULE_OPERATOR.to && (
                    <Form.Item name={['leftOperand']} style={formItemStyle}>
                      <SingleDecimalInput
                        style={{ width: '100%' }}
                        min={0}
                        max={maxInput}
                        placeholder={rule}
                      ></SingleDecimalInput>
                    </Form.Item>
                  )}
                </GridItem>

                <GridItem md={6}>
                  <Form.Item name={['operator']} style={formItemStyle}>
                    <Select
                      getPopupContainer={node => node.parentNode}
                      value={selectedOperator}
                      style={{ width: '100%' }}
                      onChange={val => {
                        setSelectedOperator(val)
                        if (val !== DOSAGE_RULE_OPERATOR.to)
                          form.setFieldsValue({ ['leftOperand']: null })
                      }}
                    >
                      <Option value={DOSAGE_RULE_OPERATOR.lessThan}>
                        {DOSAGE_RULE_OPERATOR.lessThan}
                      </Option>
                      <Option value={DOSAGE_RULE_OPERATOR.to}>
                        {DOSAGE_RULE_OPERATOR.to}
                      </Option>
                      <Option value={DOSAGE_RULE_OPERATOR.moreThan}>
                        {DOSAGE_RULE_OPERATOR.moreThan}
                      </Option>
                    </Select>
                  </Form.Item>
                </GridItem>
                <GridItem md={3}>
                  <Form.Item name={['rightOperand']} style={formItemStyle}>
                    <SingleDecimalInput
                      style={{ width: '100%' }}
                      min={0}
                      max={maxInput}
                      placeholder={rule}
                    ></SingleDecimalInput>
                  </Form.Item>
                </GridItem>
                {rangeValidation.message.length > 0 && (
                  <GridItem md={12}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Typography.Text type='danger'>
                        {rangeValidation.message}
                      </Typography.Text>
                      {rangeValidation.details !== null &&
                        rangeValidation.details !== undefined && (
                          <Popover
                            placement='bottom'
                            icon={null}
                            title='Conflict Rule(s)'
                            content={rangeValidation.details}
                            trigger='click'
                          >
                            <Typography.Link> view </Typography.Link>
                          </Popover>
                        )}
                    </div>
                  </GridItem>
                )}
              </GridContainer>
            ) : (
              <span>
                {`${record.leftOperand ?? ''} ${record.operator} ${
                  record.rightOperand
                }`}
              </span>
            )}
          </>
        )
      },
    },
    {
      title: 'Usage',
      dataIndex: 'usage',
      editable: true,
      width: 200,
      render: (item = {}, record) => {
        return (
          <span>{getDisplayValue('ctmedicationusage', medicationUsageFK)}</span>
        )
      },
    },
    {
      title: 'Dosage',
      dataIndex: 'prescribingDosageFK',

      editable: true,
      width: 120,
      render: (item = {}, record) => {
        const editing = isEditing(record)
        return (
          <>
            {editing ? (
              <Form.Item name={['prescribingDosageFK']} style={formItemStyle}>
                <Select
                  allowClear
                  getPopupContainer={node => node.parentNode}
                  options={codetable.ctmedicationdosage?.map(item => {
                    return { label: item.displayValue, value: item.id }
                  })}
                  maxLength={10}
                  style={{ width: '100%' }}
                  placeholder='Dosage'
                />
              </Form.Item>
            ) : (
              <span>
                {getDisplayValue(
                  'ctmedicationdosage',
                  record.prescribingDosageFK,
                )}
              </span>
            )}
          </>
        )
      },
    },
    {
      title: 'Prescribe UOM',
      dataIndex: 'prescribeUom',

      editable: true,
      width: 180,
      render: (item = {}, record) => {
        return (
          <span>
            {getDisplayValue('ctmedicationunitofmeasurement', prescribeUomFK)}
          </span>
        )
      },
    },
    {
      title: 'Frequency',
      dataIndex: 'medicationFrequencyFK',

      editable: true,
      width: 200,
      render: (item = {}, record) => {
        const editing = isEditing(record)
        return (
          <>
            {editing ? (
              <Form.Item name={['medicationFrequencyFK']} style={formItemStyle}>
                <Select
                  allowClear
                  getPopupContainer={node => node.parentNode}
                  options={codetable.ctmedicationfrequency?.map(item => {
                    return { label: item.displayValue, value: item.id }
                  })}
                  style={{ width: '100%' }}
                  maxLength={10}
                  placeholder='Frequency'
                />
              </Form.Item>
            ) : (
              <span>
                {getDisplayValue(
                  'ctmedicationfrequency',
                  record.medicationFrequencyFK,
                )}
              </span>
            )}
          </>
        )
      },
    },
    {
      title: 'Duration(Days)',
      dataIndex: 'duration',
      editable: true,
      width: 120,
      render: (item = {}, record) => {
        const editing = isEditing(record)
        return (
          <div>
            {editing ? (
              <Form.Item name={['duration']} style={formItemStyle}>
                <SingleDecimalInput
                  style={{ width: '100%' }}
                  min={1}
                  max={maxInput}
                ></SingleDecimalInput>
              </Form.Item>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'left' }}>
                  <span>{record.duration}</span>
                  {record.duration && (
                    <span style={{ marginLeft: 3 }}>
                      {record.duration == 1 ? 'day' : 'days'}{' '}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )
      },
    },
    {
      title: 'Dispense Qty.',
      dataIndex: 'dispensingQuantity',
      width: 120,
      render: (item = {}, record) => {
        const editing = isEditing(record)
        return (
          <>
            {editing ? (
              <Form.Item
                name={['dispensingQuantity']}
                style={formItemStyle}
                rules={[
                  {
                    required: true,
                    message: `Required.`,
                  },
                ]}
              >
                <SingleDecimalInput
                  style={{ width: '100%' }}
                  min={0}
                  max={maxInput}
                ></SingleDecimalInput>
              </Form.Item>
            ) : (
              <span>{record.dispensingQuantity}</span>
            )}
          </>
        )
      },
    },
    {
      title: 'Dispense UOM',
      dataIndex: 'dispenseUom',
      editable: true,
      width: 180,
      render: (item = {}, record) => {
        return (
          <span>
            {getDisplayValue('ctmedicationunitofmeasurement', dispenseUomFK)}
          </span>
        )
      },
    },
    {
      title: 'Action',
      dataIndex: 'operation',

      width: 80,
      render: (item = {}, record) => {
        const editing = isEditing(record)
        return editing ? (
          <>
            <div
              style={{ display: 'flex', justifyContent: 'space-around' }}
              title='Save'
            >
              <Typography.Link onClick={() => save(record.key)}>
                <Save />
              </Typography.Link>
              <Typography.Link title='Cancel'>
                <Popconfirm
                  title='Sure to cancel?'
                  cancelText='No'
                  okText='Yes'
                  onConfirm={() => cancel(record.key)}
                >
                  <Cancel style={{ color: '#f5222d' }} />
                </Popconfirm>
              </Typography.Link>
            </div>
          </>
        ) : (
          <div
            style={{ display: 'flex', justifyContent: 'space-around' }}
            title='Edit'
          >
            <Typography.Link
              disabled={!editenable || editingKey !== ''}
              onClick={() => edit(record)}
            >
              <Edit />
            </Typography.Link>
            <Typography.Link
              disabled={!editenable || editingKey !== ''}
              title='Delete'
            >
              <Popconfirm
                title='Sure to delete?'
                cancelText='No'
                okText='Yes'
                onConfirm={() => deleteData(record.key)}
              >
                <Delete
                  style={{
                    color: '#f5222d',
                  }}
                />
              </Popconfirm>
            </Typography.Link>
          </div>
        )
      },
    },
  ]
  const mergedColumns = columns.map(col => {
    if (!col.editable) {
      return col
    }

    return {
      ...col,
      onCell: record => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })
  return (
    <Form form={form} component={false}>
      <Table
        id='InstructionSettingTable'
        components={{
          body: {
            row: EditableRow,
            cell: EditableCell,
          },
        }}
        size='middle'
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName={(record, index) =>
          isEditing(record) ? styles.editingRow : styles.editableRow
        }
        pagination={false}
      />
      {editenable && (rule !== DOSAGE_RULE.default || data.length === 0) && (
        <Button
          disabled={editingKey !== ''}
          onClick={() => {
            const newRecord = { key: -1 }
            setData([...data, newRecord])
            edit(newRecord)
          }}
          type='link'
          style={{
            marginBottom: 16,
          }}
        >
          + NEW
        </Button>
      )}
    </Form>
  )
}

export default DosageRuleTable
