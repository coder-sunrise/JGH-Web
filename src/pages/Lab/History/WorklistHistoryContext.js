import React, {
  useContext,
  useEffect,
  useState,
  createContext,
  useRef,
} from 'react'
import { useSelector, useDispatch } from 'dva'
import moment from 'moment'
import { getMappedVisitType } from '@/utils/utils'
import { VISIT_TYPE } from '@/utils/constants'

const WorklistHistoryContext = createContext(null)

export const WorklistHistoryContextProvider = props => {
  const handlerRef = useRef(null)

  const [isAnyWorklistModelOpened, setIsAnyWorklistModelOpened] = useState(
    false,
  )

  const setPaginationChangeHandler = handler => {
    console.log('setPaginationChangeHandler', handler)
    handlerRef.current = handler
  }

  const triggerPaginationChange = (pageNo, pageSize) => {
    console.log('triggerPaginationChange', handlerRef.current, pageNo, pageSize)
    if (handlerRef.current) handlerRef.current(pageNo, pageSize)
  }

  return (
    // this is the provider providing state
    <WorklistHistoryContext.Provider
      value={{
        setPaginationChangeHandler,
        triggerPaginationChange,
        isAnyWorklistModelOpened,
        setIsAnyWorklistModelOpened,
      }}
    >
      {props.children}
    </WorklistHistoryContext.Provider>
  )
}

export default WorklistHistoryContext
