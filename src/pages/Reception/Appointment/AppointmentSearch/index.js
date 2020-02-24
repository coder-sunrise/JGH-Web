import React, { Fragment, useEffect } from 'react'
import { connect } from 'dva'

import FitlerBar from './FilterBar'
import Grid from './Grid'

const AppointmentSearch = ({
  dispatch,
  handleSelectEvent,
  handleAddAppointmentClick,
}) => {
  useEffect(() => {
    return () => {
      dispatch({
        type: 'appointment/reset',
      })
      dispatch({
        type: 'appointment/updateState',
        payload: {
          pagination: {
            current: 1,
            totalRecords: 0,
          },
        },
      })
    }
  }, [])

  return (
    <Fragment>
      <FitlerBar
        dispatch={dispatch}
        handleAddAppointmentClick={handleAddAppointmentClick}
      />
      <Grid handleSelectEvent={handleSelectEvent} />
    </Fragment>
  )
}

export default connect()(AppointmentSearch)
