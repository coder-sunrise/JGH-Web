import React, { useState, useContext, useEffect } from 'react'
import { Form, Card } from 'antd'
import { formatMessage } from 'umi'
import { useDispatch, useSelector } from 'dva'
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined'
import moment from 'moment'
import Search from '@material-ui/icons/Search'
import Refresh from '@material-ui/icons/Refresh'
import {
  CLINICAL_ROLE,
  PRIORITY_OPTIONS,
  VISIT_TYPE,
  LAB_SPECIMEN_STATUS,
  LAB_SPECIMEN_STATUS_LABELS,
} from '@/utils/constants'
import {
  TextField,
  DatePicker,
  Checkbox,
  Select,
  ProgressButton,
  CodeSelect,
  dateFormatLong,
  IconButton,
  Popover,
  Button,
  VisitTypeSelect,
} from '@/components'
import WorklistHistoryContext from '../WorklistHistoryContext'

export const STATUS_OPTIONS = [
  {
    value: LAB_SPECIMEN_STATUS.COMPLETED,
    name: LAB_SPECIMEN_STATUS_LABELS[LAB_SPECIMEN_STATUS.COMPLETED],
  },
  {
    value: LAB_SPECIMEN_STATUS.DISCARDED,
    name: LAB_SPECIMEN_STATUS_LABELS[LAB_SPECIMEN_STATUS.DISCARDED],
  },
]

export const WorklistHistoryFilter = () => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const { setPaginationChangeHandler, isAnyWorklistModelOpened } = useContext(
    WorklistHistoryContext,
  )

  const { settings } = useSelector(s => s.clinicSettings)
  const { doctorprofile = [] } = useSelector(s => s.codetable)
  const clinicianProfile = useSelector(
    state => state.user.data.clinicianProfile,
  )

  useEffect(() => {
    dispatch({
      force: true,
      type: 'codetable/fetchCodes',
      payload: {
        code: 'doctorprofile',
        filter: {
          'clinicianProfile.isActive': true,
        },
      },
    })
    handleSearch()
    setPaginationChangeHandler(handleSearch)
  }, [])

  useEffect(() => {
    if (!isAnyWorklistModelOpened) handleSearch()
  }, [isAnyWorklistModelOpened])

  const handleSearch = (pageNo = 1, pageSize = 20) => {
    const {
      searchValue,
      visitType,
      status,
      visitDoctor,
      dateFrom,
      dateTo,
    } = form.getFieldsValue(true)
    dispatch({
      type: 'labWorklistHistory/query',
      payload: {
        current: pageNo,
        pagesize: pageSize,
        apiCriteria: {
          searchValue: searchValue,
          visitType: visitType
            ? visitType.filter(t => t !== -99).join(',')
            : undefined,
          status: status ? status.filter(t => t !== -99).join(',') : undefined,
          visitDoctor:
            visitDoctor && !visitDoctor.includes(-99)
              ? visitDoctor.join(',')
              : undefined,
          filterFrom: dateFrom,
          filterTo: moment(dateTo)
            .endOf('day')
            .formatUTC(false),
        },
      },
    })
  }

  return (
    <Card bordered={false}>
      <Form form={form} layout='inline' initialValues={{}}>
        <div style={{ display: 'flex', width: '100%' }}>
          <Form.Item name='searchValue'>
            <TextField
              label={formatMessage({
                id: 'lab.worklisthistory.search.general',
              })}
              style={{ width: 350 }}
            />
          </Form.Item>
          <Form.Item name='visitDoctor' initialValue={[-99]}>
            <Select
              label={formatMessage({
                id: 'lab.worklisthistory.search.visitDoctor',
              })}
              options={doctorprofile.map(item => ({
                value: item.id,
                name: item.clinicianProfile.name,
              }))}
              style={{ width: 180 }}
              mode='multiple'
              maxTagCount={0}
              maxTagPlaceholder='Visit Doctor'
            />
          </Form.Item>

          <Form.Item name='visitType' initialValue={[-99]}>
            <VisitTypeSelect
              label={formatMessage({
                id: 'lab.worklisthistory.search.visittype',
              })}
              mode='multiple'
              maxTagCount={0}
              maxTagPlaceholder='Visit Types'
              style={{ width: 170 }}
              localFilter={item => {
                return item.id !== VISIT_TYPE.OTC
              }}
              allowClear={true}
            />
          </Form.Item>

          <Form.Item
            name='dateFrom'
            initialValue={moment(moment().subtract(7, 'd')).formatUTC()}
          >
            <DatePicker
              style={{ width: 115 }}
              label={formatMessage({
                id: 'lab.worklisthistory.search.dateFrom',
              })}
            />
          </Form.Item>
          <Form.Item
            name='dateTo'
            initialValue={moment()
              .endOf('day')
              .formatUTC(false)}
          >
            <DatePicker
              bordered={true}
              label={formatMessage({ id: 'lab.worklisthistory.search.dateTo' })}
              style={{ width: 115 }}
            />
          </Form.Item>
          <Form.Item name='status' initialValue={[]}>
            <Select
              label={formatMessage({ id: 'lab.worklisthistory.search.status' })}
              options={STATUS_OPTIONS}
              style={{ width: 170 }}
              mode='multiple'
              maxTagCount={0}
              maxTagPlaceholder='Status'
            />
          </Form.Item>
          <Form.Item style={{ alignSelf: 'center' }}>
            <ProgressButton
              variant='contained'
              color='primary'
              icon={<Search />}
              size='small'
              onClick={() => {
                handleSearch()
              }}
            >
              {formatMessage({ id: 'form.search' })}
            </ProgressButton>
          </Form.Item>
        </div>
      </Form>
    </Card>
  )
}
