import React, { useState, useEffect } from 'react'
import { Paper } from '@material-ui/core'
import _ from 'lodash'
import HistoryIcon from '@material-ui/icons/History'
import {
  Button,
  GridContainer,
  GridItem,
  TextField,
  CodeSelect,
  DatePicker,
  Checkbox,
  Popover,
  Tooltip,
  Select,
  ButtonSelect,
  CommonModal,
  Tabs,
} from '@/components'
import Diagnosis from './Diagnosis'
import Treatment from './Treatment'
import History from './History'

const RightPanel = (props) => {
  const {
    dispatch,
    theme,
    index,
    arrayHelpers,
    classes,
    form,
    field,
    style,
    onChange,
    value,
    mode,
    onDataSouceChange,
    dentalChartComponent,
    height,
    ...restProps
  } = props
  const { isPedoChart, isSurfaceLabel } = dentalChartComponent
  const [
    openHistory,
    setOpenHistory,
  ] = React.useState(false)
  return (
    <Paper className={classes.paper}>
      <div style={{ width: '100%' }}>
        <GridContainer style={{ height: 'auto' }}>
          <GridItem xs={5}>
            <Checkbox
              label='Pedo Chart'
              checked={isPedoChart}
              style={{ marginLeft: 8 }}
              onChange={(v) => {
                dispatch({
                  type: 'dentalChartComponent/updateState',
                  payload: {
                    isPedoChart: v.target.value,
                  },
                })
              }}
            />
          </GridItem>
          <GridItem xs={6}>
            <Checkbox
              label='Surface Label'
              checked={isSurfaceLabel}
              onChange={(v) => {
                dispatch({
                  type: 'dentalChartComponent/updateState',
                  payload: {
                    isSurfaceLabel: v.target.value,
                  },
                })
              }}
            />
          </GridItem>
          <GridItem
            xs={1}
            gutter={0}
            style={{ lineHeight: theme.props.singleRowHeight }}
          >
            <Tooltip title='Chart History' placement='left'>
              <Button
                size='sm'
                onClick={() => {
                  setOpenHistory(true)
                }}
                justIcon
                color='primary'
              >
                <HistoryIcon />
              </Button>
            </Tooltip>
          </GridItem>
          <GridItem xs={12}>
            <Tabs
              // style={{ marginTop: 20 }}
              defaultActiveKey='0'
              onChange={(tabId) => {
                if (tabId === '1') {
                  dispatch({
                    type: 'dentalChartComponent/updateState',
                    payload: {
                      mode: 'diagnosis',
                      action: undefined,
                    },
                  })
                } else {
                  dispatch({
                    type: 'dentalChartComponent/updateState',
                    payload: {
                      mode: 'treatment',
                      action: undefined,
                    },
                  })
                }
              }}
              options={[
                {
                  id: '1',
                  name: 'Diagnosis',
                  content: <Diagnosis {...props} />,
                },
                {
                  id: '2',
                  name: 'Treatment',
                  content: <Treatment {...props} />,
                },
              ]}
            />
          </GridItem>
        </GridContainer>
        <CommonModal
          open={openHistory}
          title='Dental Chart History'
          maxWidth='md'
          // fullScreen
          bodyNoPadding
          onConfirm={() => {
            setOpenHistory(false)
          }}
          onClose={() => setOpenHistory(false)}
          // showFooter
          confirmText='Save'
        >
          <History {...props} />
        </CommonModal>
      </div>
    </Paper>
  )
}

export default RightPanel
