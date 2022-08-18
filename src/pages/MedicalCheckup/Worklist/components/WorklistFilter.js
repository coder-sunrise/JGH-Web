import React, { useState, useContext, useEffect } from 'react'
import { Form, Card } from 'antd'
import { formatMessage } from 'umi'
import { useDispatch, useSelector } from 'dva'
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined'
import moment from 'moment'
import Search from '@material-ui/icons/Search'
import Refresh from '@material-ui/icons/Refresh'
import { CLINICAL_ROLE, PRIORITY_OPTIONS, VISIT_TYPE } from '@/utils/constants'
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
  Tooltip,
} from '@/components'
import WorklistContext from '../WorklistContext'

export const WorklistFilter = ({ medicalCheckupWorklist }) => {
  const [form] = Form.useForm()
  const { isAnyWorklistModelOpened } = useContext(WorklistContext)
  const [refreshDate, setRefreshDate] = useState(moment())
  const dispatch = useDispatch()

  const { settings } = useSelector(s => s.clinicSettings)
  const { doctorprofile = [] } = useSelector(s => s.codetable)
  const clinicianProfile = useSelector(
    state => state.user.data.clinicianProfile,
  )

  const { autoRefreshMedicalCheckupWorklistInterval = 30 } = settings

  const timer = React.useRef(null)

  const startTimer = () => {
    timer.current = setInterval(() => {
      handleSearch()
    }, autoRefreshMedicalCheckupWorklistInterval * 1000)
  }

  const stopTimer = () => {
    clearInterval(timer.current)
  }

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
  }, [])

  useEffect(() => {
    if (isAnyWorklistModelOpened) {
      stopTimer()
    } else {
      handleSearch()
      startTimer()
    }

    return () => clearInterval(timer.current)
  }, [isAnyWorklistModelOpened])

  const handleSearch = () => {
    const {
      searchValue,
      isOnlyUrgent,
      isMyPatient,
      visitDoctor,
      dateFrom,
      dateTo,
    } = form.getFieldsValue(true)

    dispatch({
      type: 'medicalCheckupWorklist/updateState',
      payload: {
        filterBar: {
          ...form.getFieldsValue(true),
        },
        list: [],
      },
    })
    dispatch({
      type: 'medicalCheckupWorklist/query',
      payload: {
        apiCriteria: {
          searchValue: searchValue,
          isOnlyUrgent,
          isMyPatient: clinicRoleFK === 1 ? isMyPatient : false,
          visitDoctor:
            visitDoctor && !visitDoctor.includes(-99)
              ? visitDoctor.join(',')
              : undefined,
          filterFrom: dateFrom,
          filterTo: dateTo
            ? moment(dateTo)
                .endOf('day')
                .formatUTC(false)
            : undefined,
        },
      },
    }).then(response => {
      if (response) {
        setRefreshDate(moment())
      }
    })
  }

  const clinicRoleFK = clinicianProfile.userProfile?.role?.clinicRoleFK
  return (
    <Card bordered={false}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ flex: 'auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            <Form
              form={form}
              layout='inline'
              initialValues={{
                ...(medicalCheckupWorklist?.filterBar || {}),
              }}
            >
              <Form.Item name='searchValue'>
                <TextField
                  label='Patient Name, Acc. No., Patient Ref. No.'
                  style={{ width: 350 }}
                />
              </Form.Item>
              <Form.Item name='visitDoctor'>
                <Tooltip
                  placement='right'
                  title='Select "All" will retrieve active and inactive doctors'
                >
                  <Select
                    label='Visit Doctor'
                    options={doctorprofile.map(item => ({
                      value: item.id,
                      name: item.clinicianProfile.name,
                    }))}
                    style={{ width: 180 }}
                    mode='multiple'
                    maxTagCount={0}
                    maxTagPlaceholder='Visit Doctor'
                  />
                </Tooltip>
              </Form.Item>

              <Form.Item name='dateFrom'>
                <DatePicker style={{ width: 140 }} label='Visit Date From' />
              </Form.Item>
              <Form.Item name='dateTo'>
                <DatePicker
                  bordered={true}
                  label='Visit Date To'
                  style={{ width: 140, marginRight: 20 }}
                />
              </Form.Item>

              <Form.Item name='isOnlyUrgent'>
                <Checkbox
                  simple
                  label='Urgent'
                  style={{ marginTop: 25 }}
                  defaultChecked={
                    medicalCheckupWorklist?.filterBar?.isOnlyUrgent
                  }
                />
              </Form.Item>

              {clinicRoleFK === 1 && (
                <Form.Item name='isMyPatient'>
                  <Checkbox
                    simple
                    label='My Patient'
                    style={{ marginTop: 25 }}
                    defaultChecked={
                      medicalCheckupWorklist?.filterBar?.isMyPatient
                    }
                  />
                </Form.Item>
              )}

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
            </Form>
          </div>
        </div>
        <div>
          <div style={{ width: 180, position: 'relative', top: 20 }}>
            <span>Last Refresh:</span>
            <span style={{ color: '#1890f8', fontWeight: 500, marginLeft: 10 }}>
              {refreshDate.format('HH:mm')}
            </span>
            <Button
              color='primary'
              justIcon
              style={{ marginLeft: 10 }}
              onClick={handleSearch}
            >
              <Refresh />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
