import React, { useState, useEffect, Fragment } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import moment from 'moment'
import { Space, Collapse, Checkbox, InputNumber, Form, Typography } from 'antd'
import { useDispatch } from 'umi'
import { makeStyles } from '@material-ui/styles'
import { useCodeTable } from '@/utils/hooks'
import { REPORT_ID } from '@/utils/constants'
import {
  dateFormatLongWithTimeNoSec,
  DatePicker,
  CommonModal,
  NumberInput,
  GridContainer,
  GridItem,
  Select,
  TextField,
} from '@/components'
import { LAB_WORKITEM_STATUS } from '@/utils/constants'
import TestCategoryCollapse from './TestCategoryCollapse'

const useStyles = makeStyles(theme => ({
  modalBody: {
    '&:first-child': {
      paddingTop: '0',
    },
  },
}))

const MODE = { NEW: 'new', EDIT: 'edit' }

const CollectSpecimen = ({
  open,
  visitId,
  labSpecimenId,
  mode,
  enableReceiveSpecimen = false,
  onConfirm,
  onClose,
}) => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const [workItemsByTestCategory, setWorkitemsByTestCategory] = useState([])
  const [isPrintLabel, setIsPrintLabel] = useState(true)
  const [copies, setCopies] = useState(1)
  const [testPanelValidationError, setTestPanelValidationError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const ctTestCategory = useCodeTable('cttestcategory')
  const ctspecimentype = useCodeTable('ctspecimentype')
  const [form] = Form.useForm()

  function cleanUpStates() {
    setWorkitemsByTestCategory([])
    setTestPanelValidationError('')
    setShowModal(false)
    form.setFieldsValue({})
  }

  useEffect(() => {
    setShowModal(open)
    if (open) {
      setCopies(1)
      setIsPrintLabel(true)
      dispatch({
        type: 'specimenCollection/getVisitSpecimenCollection',
        payload: { id: visitId },
      }).then(visitData => {
        if (visitData) {
          mode === MODE.NEW
            ? initializeNewData(visitData)
            : initializeEditingData(visitData)
        }
      })
    } else {
      cleanUpStates()
    }
  }, [open])

  const PrintLabel = () => (
    <div
      style={{
        margin: '10px 0px',
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'start',
      }}
    >
      <Checkbox
        defaultChecked
        onChange={e => {
          setIsPrintLabel(e.target.checked)
        }}
        checked={isPrintLabel}
      >
        Print Label{' '}
      </Checkbox>
      <InputNumber
        defaultValue={copies}
        size='small'
        min={1}
        max={10}
        onChange={v => {
          setCopies(v)
        }}
        style={{ width: '50px', textAlign: 'right', marginRight: 5 }}
      />
      <span> copies</span>
    </div>
  )
  const initializeNewData = visitData => {
    prepareLabWorkitemsByCategory(
      visitData.labWorkitems.filter(
        item => item.statusFK === LAB_WORKITEM_STATUS.NEW,
      ),
    )
    form.resetFields()
    form.setFieldsValue({
      specimenCollectionDate: moment(),
      dateReceived: enableReceiveSpecimen ? moment() : undefined,
      specimenTypeFK: undefined,
      labWorkitems: [],
    })
  }

  const initializeEditingData = visitData => {
    dispatch({
      type: 'specimenCollection/getLabSpecimenById',
      payload: { id: labSpecimenId },
    }).then(labSpecimenData => {
      if (labSpecimenData) {
        prepareLabWorkitemsByCategory([
          ...visitData.labWorkitems.filter(
            item => item.statusFK === LAB_WORKITEM_STATUS.NEW,
          ),
          ...labSpecimenData.labWorkitems.map(item => item),
        ])
        form.setFieldsValue(labSpecimenData)
      }
    })
  }

  const prepareLabWorkitemsByCategory = labWorkitems => {
    setWorkitemsByTestCategory(
      _(
        labWorkitems.map(item => ({
          testCategoryFK: item.testCategoryFK,
          testCategory: ctTestCategory.find(c => c.id === item.testCategoryFK)
            .name,
          workItems: _.sortBy(
            labWorkitems.filter(w => w.testCategoryFK === item.testCategoryFK),
            'id',
          ),
        })),
      )
        .uniqBy('testCategoryFK')
        .sortBy('testCategory')
        .value(),
    )
  }
  const checkSpecimenWorkitems = (_, value) => {
    if (
      value.filter(
        item => item.statusFK === LAB_WORKITEM_STATUS.SPECIMENCOLLECTED,
      ).length > 0
    ) {
      setTestPanelValidationError('')
      return Promise.resolve()
    }
    const errorMsg = 'At least one test panel is required.'
    setTestPanelValidationError(errorMsg)
    return Promise.reject(new Error(errorMsg))
  }

  const handleFinish = () => {
    var values = form.getFieldsValue(true)
    const payload = {
      id: mode === MODE.EDIT ? labSpecimenId : undefined,
      ...values,
    }

    dispatch({
      type: 'specimenCollection/upsert',
      payload,
    }).then(result => {
      if (result) {
        onConfirm &&
          onConfirm(result.id, { isPrintLabel: isPrintLabel, copies: copies })
        cleanUpStates()
      }
    })
  }

  return (
    <CommonModal
      classes={classes}
      open={showModal}
      title={mode === MODE.NEW ? 'Collect Specimen' : 'Edit Specimen'}
      onClose={() => {
        onClose && onClose()
        cleanUpStates()
      }}
      onConfirm={() => {
        form.validateFields().then(values => form.submit())
      }}
      showFooter={true}
      maxWidth='md'
    >
      <Form form={form} onFinish={handleFinish}>
        <Space align='start' style={{ display: 'flex', marginBottom: 12 }}>
          <Form.Item
            name='specimenTypeFK'
            rules={[{ required: true, message: 'Specimen type is required.' }]}
          >
            <Select
              label='Specimen Type'
              style={{ width: 160 }}
              valueField='id'
              options={ctspecimentype}
            ></Select>
          </Form.Item>
          <Form.Item
            name='specimenCollectionDate'
            rules={[
              { required: true, message: 'Collection date is required.' },
            ]}
          >
            <DatePicker
              disabled={mode !== MODE.NEW}
              showTime
              style={{ width: 150 }}
              label='Collection Date'
              format={dateFormatLongWithTimeNoSec}
            />
          </Form.Item>
          {mode !== MODE.NEW && (
            <Form.Item name='accessionNo' noStyle>
              <TextField label='Accession No.' disabled />
            </Form.Item>
          )}
          {enableReceiveSpecimen && (
            <Fragment>
              <Form.Item name='dateReceived'>
                <DatePicker
                  showTime
                  style={{ width: 150 }}
                  label='Date Received'
                  format={dateFormatLongWithTimeNoSec}
                />
              </Form.Item>
              <Checkbox
                defaultChecked={true}
                onChange={e => {
                  form.setFieldsValue({
                    dateReceived: e.target.checked ? moment() : undefined,
                  })
                }}
                style={{ marginTop: 30 }}
              >
                Receive Specimen
              </Checkbox>
            </Fragment>
          )}
        </Space>
        {workItemsByTestCategory.length > 0 && (
          <Form.Item
            name='labWorkitems'
            rules={[
              {
                validator: checkSpecimenWorkitems,
              },
            ]}
            noStyle
          >
            <TestCategoryCollapse
              labSpecimenId={labSpecimenId}
              testCategories={workItemsByTestCategory}
              defaultActiveKey={workItemsByTestCategory.map(
                item => item.testCategoryFK,
              )}
            />
          </Form.Item>
        )}
        {testPanelValidationError && (
          <Typography.Text type='danger'>
            {testPanelValidationError}
          </Typography.Text>
        )}
        <PrintLabel />
      </Form>
    </CommonModal>
  )
}

CollectSpecimen.propTypes = {
  id: PropTypes.number.isRequired,
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['new', 'edit']).isRequired,
  enableReceiveSpecimen: PropTypes.bool,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
}

export default CollectSpecimen
