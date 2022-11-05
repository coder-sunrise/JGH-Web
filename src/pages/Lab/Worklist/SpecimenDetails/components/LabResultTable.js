import React, { useContext, useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { Table, Input, Button, Form, InputNumber, Select } from 'antd'
import { Popconfirm } from '@/components'
import { useCodeTable } from '@/utils/hooks'
import styles from './LabResultTable.less'
import { LAB_RESULT_TYPE } from '@/utils/constants'
import { FlagIndicator } from '../../components'

const EditableContext = React.createContext(null)

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm()

  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  render,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false)
  const form = useContext(EditableContext)

  const fieldName =
    typeof dataIndex === 'function' ? dataIndex(record) : dataIndex

  if (typeof dataIndex === 'function')
    console.log('Editable Cell: fieldName', fieldName)

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        [fieldName]: record[fieldName],
      })
    }
  }, [record])

  const save = async () => {
    try {
      const values = await form.validateFields()
      handleSave({ ...record, ...values })
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  let childNode = (
    <Form.Item
      noStyle
      style={{
        margin: 0,
      }}
      name={fieldName}
    >
      {render ? render(record, record[fieldName], save) : children}
    </Form.Item>
  )

  return <td {...restProps}>{childNode}</td>
}

const ResultSelect = ({
  value,
  defaultValue,
  options,
  shouldFlag,
  onChange,
}) => {
  return (
    <div style={{ display: 'flex' }}>
      <Select
        className={shouldFlag ? styles.flaggedSelect : styles.normalSelect}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        options={options}
        allowClear
      />
      {shouldFlag && <FlagIndicator />}
    </div>
  )
}

export const LabResultTable = ({
  value,
  onChange,
  showRawData = false,
  isReadonly = false,
}) => {
  const cttestpanelitem = useCodeTable('cttestpanelitem')
  const ctresultoption = useCodeTable('cttestpanelitemresultoption')
  const ctnumericreferencerange = useCodeTable('ctnumericreferencerange')
  const allColumns = [
    {
      title: 'Test Panel Item',
      dataIndex: 'testPanelItemFK',
      width: 150,
      render: record => {
        const testPanelItem = cttestpanelitem.find(
          x => x.id === record.testPanelItemFK,
        )
        return <span>{testPanelItem?.displayValue}</span>
      },
    },
    {
      title: 'Result',
      dataIndex: 'finalResult',
      width: 175,
      editable: true,
      render: (record = {}, text, onSave) => {
        // console.log('record.shouldFlag', record.shouldFlag)
        if (isReadonly)
          return record.shouldFlag ? (
            <React.Fragment>
              <span style={{ color: 'red' }}>{text}</span>
              <FlagIndicator />
            </React.Fragment>
          ) : (
            <span>{text}</span>
          )

        const testpanelItem = cttestpanelitem.find(
          item => item.id === record?.testPanelItemFK,
        )

        if (testpanelItem?.resultTypeFK === LAB_RESULT_TYPE.NUMERIC) {
          return (
            <Form.Item
              name='NumericInput'
              rules={[
                testpanelItem.code !== 'CRP_Quant' && {
                  pattern: new RegExp(/^[0-9]*[.]?[0-9]*$/),
                  message: 'Invalid format.',
                },
                testpanelItem.code === 'CRP_Quant' && {
                  pattern: new RegExp(/^([<]?[0]*[.]?[5]|[0-9]*[.]?[0-9])*$/),
                  message: 'Invalid format.',
                },
              ]}
            >
              <div>
                <Input
                  style={{
                    color: record.shouldFlag ? 'red' : 'black',
                    width: 100,
                  }}
                  defaultValue={text}
                  controls={false}
                  onPressEnter={onSave}
                  onBlur={onSave}
                />
                {record.shouldFlag && <FlagIndicator />}
              </div>
            </Form.Item>
          )
        } else if (testpanelItem?.resultTypeFK === LAB_RESULT_TYPE.STRING) {
          const options = ctresultoption
            .filter(x => x.testPanelItemFK === testpanelItem.id)
            .map(x => ({ label: x.resultOption, value: x.resultOption }))

          return (
            <ResultSelect
              defaultValue={text}
              shouldFlag={record.shouldFlag}
              onChange={onSave}
              options={options}
            />
          )
        }
        //Attachement
        else {
          return <div>Result is an attachment.</div>
        }
      },
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      width: 100,
    },
    {
      title: 'Raw Data',
      dataIndex: 'resultBeforeInterpretation',
      width: 150,
    },
    {
      title: 'Reference Range',
      dataIndex: 'referenceRangeDescription',
    },
  ]

  const displayColumns = showRawData
    ? allColumns
    : allColumns.filter(x => x.dataIndex !== 'resultBeforeInterpretation')

  const checkShouldFlag = (finalResult, refereneceRangeId, testPanelItemId) => {
    const testPanelItem = cttestpanelitem.find(x => x.id === testPanelItemId)

    const currentResultOption = ctresultoption.find(
      x =>
        x.testPanelItemFK === testPanelItemId && x.resultOption === finalResult,
    )

    if (finalResult === null || finalResult === undefined || finalResult === '')
      return false

    if (testPanelItem.resultTypeFK === LAB_RESULT_TYPE.NUMERIC) {
      if (refereneceRangeId === null || refereneceRangeId === undefined)
        return false

      const currentRange = ctnumericreferencerange.find(
        x => x.id === refereneceRangeId,
      )

      if (currentResultOption) return currentResultOption.shouldFlag

      const hasMetMinimumRange = currentRange.isMinValInclusive
        ? parseFloat(finalResult) >= currentRange.referenceRangeMin
        : parseFloat(finalResult) > currentRange.referenceRangeMin

      const hasMetMaximumRange = currentRange.isMaxValInclusive
        ? parseFloat(finalResult) <= currentRange.referenceRangeMax
        : parseFloat(finalResult) < currentRange.referenceRangeMax

      return !hasMetMinimumRange || !hasMetMaximumRange
    } else if (testPanelItem.resultTypeFK === LAB_RESULT_TYPE.STRING) {
      return currentResultOption.shouldFlag
    } else {
      return false
    }
  }

  const handleSave = row => {
    const newData = [...value]
    const index = newData.findIndex(item => row.id === item.id)
    const item = newData[index]

    const shouldFlag = checkShouldFlag(
      row.finalResult,
      item.referenceRangeSource,
      item.testPanelItemFK,
    )

    newData.splice(index, 1, { ...item, ...row, shouldFlag })
    // console.log('newData', newData)
    onChange(newData)
  }

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }
  const tableColumns = displayColumns.map(col => {
    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        width: col.width,
        handleSave: handleSave,
        ...col,
      }),
    }
  })
  return (
    <div>
      <Table
        components={components}
        bordered
        dataSource={value}
        columns={tableColumns}
        pagination={false}
        size='small'
      />
    </div>
  )
}

LabResultTable.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func,
  showRawData: PropTypes.bool,
  isReadonly: PropTypes.bool,
}
