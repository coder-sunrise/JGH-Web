import React, { Component, useEffect, useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { notification } from '@/components'
import FilterBar from './FilterBar'
import LabExaminations from './LabExaminations'
import RadiologyExaminations from './RadiologyExaminations'
import { SelectionState } from '@devexpress/dx-react-grid'
import moment from 'moment'
import { Link } from 'umi'
import { useDispatch } from 'react-redux'

const styles = theme => ({})
const Examinations = props => {
  const [category, setCategory] = useState('Lab')
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState([])
  const [activeKey, setActiveKey] = useState([])
  const [allRetrieved, setAllRetrieved] = useState(false)
  const [firstLoad, setFirstLoad] = useState(false)
  const [filterCondition, setFilterCondition] = useState(undefined)
  const dispatch = useDispatch()
  const { patientProfileFK } = props
  const search = (values, append) => {
    const {
      visitDate,
      allDate,
      category,
      examinationName,
      doctorIDs,
      status,
      currentPage,
    } = values
    if (!append) {
      setCurrentPage(1)
      setAllRetrieved(false)
      setCategory(category)
    }
    const visitFromDate =
      visitDate && visitDate.length > 0
        ? moment(visitDate[0])
            .startOf('day')
            .formatUTC()
        : undefined
    const visitToDate =
      visitDate && visitDate.length > 1
        ? moment(visitDate[1])
            .endOf('day')
            .formatUTC(false)
        : undefined
    const payload = {
      patientProfileFK: patientProfileFK,
      visitFromDate: allDate ? undefined : visitFromDate || undefined,
      visitToDate: allDate ? undefined : visitToDate || undefined,
      examinationName: examinationName || undefined,
      category: category,
      doctorIds: doctorIDs,
      status: status,
    }
    setFilterCondition(payload)
    console.log(payload)
    dispatch({
      type: 'patientResults/queryExaminationsList',
      payload: { ...payload, currentPage: append ? currentPage : 1 },
    }).then(response => {
      if (response && response.status === '200') {
        if (response.data?.length == 0) {
          setAllRetrieved(true)
          if (append) {
            notification.success({
              message: 'All records has been loaded.',
            })
          } else {
            setData([])
            setActiveKey([])
          }
        } else {
          if (response.data?.length < 10) {
            setAllRetrieved(true)
          }

          if (append) {
            setData(_.concat(data, response.data))
            setActiveKey(
              _.concat(
                activeKey,
                response.data.filter(t => !t.isAcknowledged).map(x => x.id),
              ),
            )
          } else {
            setData(response.data)
            setActiveKey(
              response.data.filter(t => !t.isAcknowledged).map(x => x.id),
            )
          }
        }
      }
    })
  }
  const examinationPanelOnChange = key => {
    setActiveKey(key)
  }
  const loadMore = () => {
    const newPage = currentPage + 1
    setCurrentPage(newPage)
    search({ ...filterCondition, currentPage: newPage }, true)
  }
  useEffect(() => {
    if (!firstLoad) {
      const payload = {
        category: 'Lab',
        patientProfileFK: patientProfileFK,
        currentPage: currentPage,
        visitFromDate: moment(new Date())
          .startOf('day')
          .formatUTC(),
        visitToDate: moment(new Date())
          .endOf('day')
          .formatUTC(false),
        status: 6,
      }
      setFilterCondition(payload)
      dispatch({
        type: 'patientResults/queryExaminationsList',
        payload: payload,
      }).then(response => {
        if (response && response.status === '200') {
          setData(_.concat(data, response.data))
          setFirstLoad(true)
          if (response.data?.length < 10) {
            setAllRetrieved(true)
          }
          setActiveKey(
            response.data.filter(t => !t.isAcknowledged).map(x => x.id),
          )
        }
      })
    }
  }, [firstLoad])

  const acknowledge = id => {
    dispatch({
      type: 'specimenCollection/ack',
      payload: { id: id },
    }).then(r => {
      if (r) {
        notification.success({ message: 'Acknowledged' })

        dispatch({
          type: 'specimenCollection/getLabSpecimenById',
          payload: { id: id },
        }).then(r => {
          var newData = [...data]
          var currentSpecimen = newData.find(t => t.id === id)
          currentSpecimen.isAcknowledged = r.isAcknowledged
          currentSpecimen.acknowledgedByUserTitle = r.acknowledgedByUserTitle
          currentSpecimen.acknowledgeDate = r.acknowledgeDate
          currentSpecimen.acknowledgedByUser = r.acknowledgedByUser
          setData(newData)
        })
      } else {
        notification.error({ message: 'Acknowledge Failed' })
      }
    })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ minHeight: 60 }}>
        <FilterBar search={search} {...props}></FilterBar>
      </div>
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {category === 'Lab' && (
          <LabExaminations
            acknowledge={acknowledge}
            data={data}
            activeKey={activeKey}
            examinationPanelOnChange={examinationPanelOnChange}
          ></LabExaminations>
        )}
        {category === 'Radiology' && (
          <RadiologyExaminations data={data}></RadiologyExaminations>
        )}
        <div style={{ textAlign: 'right' }}>
          {!allRetrieved && (
            <Link
              style={{
                float: 'right',
                position: 'relative',
                textDecoration: 'underline',
                top: 3,
              }}
              onClick={e => {
                e.preventDefault()
                loadMore()
              }}
            >
              <span>Load More</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
export default withStyles(styles, { name: 'Examinations', withTheme: true })(
  Examinations,
)
