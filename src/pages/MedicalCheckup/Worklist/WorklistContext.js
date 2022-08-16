import React, { useContext, useEffect, useState, createContext } from 'react'
import { useSelector, useDispatch } from 'dva'
import moment from 'moment'
import { getMappedVisitType } from '@/utils/utils'
import { VISIT_TYPE } from '@/utils/constants'

const WorklistContext = createContext(null)

export const WorklistContextProvider = props => {
  const dispatch = useDispatch()
  const [isAnyWorklistModelOpened, setIsAnyWorklistModelOpened] = useState(
    false,
  )
  const [refreshDate, setRefreshDate] = useState(moment())
  const searchWorklist = values => {
    const {
      searchValue,
      isOnlyUrgent,
      isMyPatient,
      visitDoctor,
      dateFrom,
      dateTo,
    } = values
    dispatch({
      type: 'medicalCheckupWorklist/query',
      payload: {
        apiCriteria: {
          searchValue: searchValue,
          isOnlyUrgent,
          isMyPatient,
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
  return (
    // this is the provider providing state
    <WorklistContext.Provider
      value={{
        isAnyWorklistModelOpened,
        setIsAnyWorklistModelOpened,
        refreshDate,
        setRefreshDate,
        searchWorklist,
      }}
    >
      {props.children}
    </WorklistContext.Provider>
  )
}

export default WorklistContext
