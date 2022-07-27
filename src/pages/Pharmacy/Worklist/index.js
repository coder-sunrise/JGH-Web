import React, { Fragment, useState, useEffect, useContext } from 'react'
import ProCard from '@ant-design/pro-card'
import { compose } from 'redux'
import { Icon } from 'antd'
import { useSelector, useDispatch, connect } from 'dva'
import { PharmacyWorkitemStatus } from '@/utils/constants'
import Refresh from '@material-ui/icons/Refresh'
import moment from 'moment'
import _ from 'lodash'
import { HistoryOutlined } from '@ant-design/icons'
import { CommonModal, Button, Tooltip } from '@/components'
import { Worklist } from '../Components'
import WorklistContext, {
  WorklistContextProvider,
} from '@/pages/Radiology/Worklist/WorklistContext'
import PharmacyDetails from './Details'
import { WorklistFilter } from '../Components'
import { withStyles } from '@material-ui/core'
import withWebSocket from '@/components/Decorator/withWebSocket'
const columnsTemplate = [
  {
    backgroundColor: '#009933',
    title: 'New',
    workitems: [],
  },
  {
    backgroundColor: '#960',
    title: 'Prepared',
    workitems: [],
  },
  {
    backgroundColor: '#099',
    title: 'Verified',
    workitems: [],
  },
  {
    backgroundColor: '#366',
    title: 'Completed',
    workitems: [],
  },
]

const styles = () => ({
  customProCard: {
    '& > .ant-pro-card-header': {
      padding: '4px 8px',
    },
  },
})

const PharmacyWorklist = props => {
  const dispatch = useDispatch()
  const [columns, setColumns] = useState([])
  const entity = useSelector(s => s.pharmacyWorklist)
  const clinicSettings = useSelector(s => s.clinicSettings)
  const [refreshDate, setRefreshDate] = useState(moment())
  const [filterValue, setFilterValue] = useState('')
  const { autoRefreshPharmacyWorklistInterval = 60 } =
    clinicSettings.settings || {}
  const timer = React.useRef(null)
  const { pharmacyQueueCallList = [] } = useContext(WorklistContext)
  useEffect(() => {
    dispatch({
      type: 'pharmacyWorklist/query',
      payload: { pagesize: 9999 },
    })
    stopRefreshTimer()
    startRefreshTimer()
    return () => {
      stopRefreshTimer()
    }
  }, [])

  useEffect(() => {
    if (entity && entity.list) {
      const worklist = entity.list
        .filter(
          w =>
            w.patientReferenceNo
              .toUpperCase()
              .indexOf(filterValue.toUpperCase()) >= 0 ||
            w.patientAccountNo
              .toUpperCase()
              .indexOf(filterValue.toUpperCase()) >= 0 ||
            w.name.toUpperCase().indexOf(filterValue.toUpperCase()) >= 0,
        )
        .map(w => {
          return {
            ...w,
            status: PharmacyWorkitemStatus[w.statusFK],
          }
        })
      const mapped = columnsTemplate.map(item => {
        let filterItems = worklist.filter(w => w.status === item.title)
        if (item.title === 'Completed') {
          filterItems = _.orderBy(
            filterItems,
            ['isOrderUpdate', 'updateDate'],
            ['desc', 'desc'],
          )
        } else if (item.title === 'New') {
          filterItems = _.orderBy(
            filterItems,
            ['paymentDate', 'generateDate'],
            ['asc'],
          )
        } else {
          filterItems = _.orderBy(
            filterItems,
            ['isOrderUpdate', 'paymentDate', 'updateDate'],
            ['desc', 'asc', 'asc'],
          )
        }
        return {
          ...item,
          workitems: filterItems,
        }
      })

      setColumns(mapped)
    }
  }, [entity, filterValue])
  const startRefreshTimer = () => {
    timer.current = setInterval(() => {
      refreshClick()
    }, autoRefreshPharmacyWorklistInterval * 1000)
  }

  const stopRefreshTimer = () => {
    clearInterval(timer.current)
  }

  const refreshClick = () => {
    dispatch({
      type: 'pharmacyWorklist/query',
      payload: { pagesize: 9999 },
    })
    setRefreshDate(moment())
  }

  const debouncedAction = _.debounce(
    e => {
      setFilterValue(e.target.value)
    },
    100,
    {
      leading: true,
      trailing: false,
    },
  )

  let nowServing = undefined
  if (pharmacyQueueCallList.length > 0) {
    nowServing = `${pharmacyQueueCallList?.[0]?.qNo}.0 (${pharmacyQueueCallList?.[0]?.patientName})`
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ProCard
        style={{
          height: '100%',
        }}
        className={props.classes.customProCard}
        gutter={[16, 16]}
        title={
          <WorklistFilter
            valueChange={debouncedAction}
            filterValue={filterValue}
          />
        }
        extra={
          <div style={{ display: 'flex', width: 265, flexDirection: 'column' }}>
            <div>
              <span>
                Now Serving:
                <Tooltip title={nowServing || '-'}>
                  <span
                    style={{
                      color: '#1890f8',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      left: 6,
                      position: 'relative',
                      fontWeight: 500,
                      top: 5,
                      width: 180,
                    }}
                  >
                    {nowServing || '-'}
                  </span>
                </Tooltip>
              </span>
            </div>
            <div>
              <span style={{ minWidth: 80 }}>Last Refresh:</span>
              <span
                style={{ color: '#1890f8', fontWeight: 500, marginLeft: 6 }}
              >
                {refreshDate.format('HH:mm')}
              </span>
              <Button
                color='primary'
                justIcon
                style={{
                  marginLeft: 5,
                }}
                onClick={refreshClick}
              >
                <Refresh />
              </Button>
            </div>
          </div>
        }
      >
        <Worklist columns={columns} {...props} />
        <PharmacyDetails
          refreshClick={refreshClick}
          startRefreshTimer={startRefreshTimer}
          stopRefreshTimer={stopRefreshTimer}
        />
      </ProCard>
    </div>
  )
}

const PharmacyWorklistWithProvider = props => (
  <WorklistContextProvider>
    <PharmacyWorklist {...props}></PharmacyWorklist>
  </WorklistContextProvider>
)

export default compose(
  withStyles(styles, { name: 'PharmacyWorklistWithProvider' }),
  withWebSocket(),
)(PharmacyWorklistWithProvider)

