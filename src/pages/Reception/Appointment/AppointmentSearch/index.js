import React, { Fragment, useEffect, useState } from 'react'
import { connect } from 'dva'
import $ from 'jquery'
import Authorized from '@/utils/Authorized'
import FilterBar from './FilterBar'
import Grid from './Grid'

const AppointmentSearch = ({
  dispatch,
  handleDoubleClick,
  handleAddAppointmentClick,
  handleCopyAppointmentClick,
  appointment,
  currentUser,
  ctcalendarresource = [],
  mainDivHeight = 700,
}) => {
  const [headerHeight, setHeaderHeight] = useState(0)
  const viewOtherApptAccessRight = Authorized.check(
    'appointment.viewotherappointment',
  )
  const isActiveCalendarResource = ctcalendarresource.find(
    resource =>
      resource.isActive && resource.clinicianProfileDto?.id === currentUser,
  )

  useEffect(() => {
    let defaultDoctor = []
    if (
      !viewOtherApptAccessRight ||
      viewOtherApptAccessRight.rights !== 'enable'
    ) {
      if (isActiveCalendarResource) {
        defaultDoctor = [isActiveCalendarResource.id]
      } else {
        defaultDoctor = [-1]
      }
    }

    if ($('.filterAppointmentSearchBar').height() !== headerHeight) {
      setHeaderHeight($('.filterAppointmentSearchBar').height())
    }
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

  let height = mainDivHeight - 160 - headerHeight
  if (height < 300) height = 300
  return (
    <Fragment>
      <div className='filterAppointmentSearchBar'>
        <FilterBar
          dispatch={dispatch}
          handleAddAppointmentClick={handleAddAppointmentClick}
          appointment={appointment}
          filterByDoctor={
            (!viewOtherApptAccessRight ||
              viewOtherApptAccessRight.rights !== 'enable') &&
            isActiveCalendarResource
              ? [isActiveCalendarResource.id]
              : []
          }
          viewOtherApptAccessRight={viewOtherApptAccessRight}
          isActiveCalendarResource={isActiveCalendarResource}
        />
      </div>
      <Grid
        handleCopyAppointmentClick={handleCopyAppointmentClick}
        handleDoubleClick={data => {
          handleDoubleClick({ ...data, isHistory: true })
        }}
        height={height}
      />
    </Fragment>
  )
}

export default connect(({ appointment, global }) => ({
  appointment,
  mainDivHeight: global.mainDivHeight,
}))(AppointmentSearch)
