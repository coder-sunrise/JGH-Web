import React, { useState, useEffect, useRef } from 'react'
import { withStyles, Divider, Paper } from '@material-ui/core'
import { connect } from 'dva'

import _ from 'lodash'
import DeleteIcon from '@material-ui/icons/Delete'
import AttachMoney from '@material-ui/icons/AttachMoney'
import FilterList from '@material-ui/icons/FilterList'
import moment from 'moment'
import logo from '@/assets/img/logo/logo_blue.png'
import { getUniqueId } from '@/utils/utils'
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
  SketchField,
  SizeContainer,
  CommonModal,
} from '@/components'

import {
  strokeWidth,
  baseWidth,
  baseHeight,
  zoom,
  fontColor,
  innerFontSize,
  sharedCfg,
  fontCfg,
  groupCfg,
  cellPrefix,
  overlayShapeTypes,
  lockConfig,
  selectablePrefix,
} from './variables'

import ButtonGroup from './ButtonGroup'
import TreatmentForm from './TreatmentForm'
import RightPanel from './RightPanel/index.js'
import Chart from './Chart'

const styles = (theme) => ({
  paper: {
    display: 'flex',
    border: `1px solid ${theme.palette.divider}`,
    flexWrap: 'wrap',
    height: '100%',
  },
  divider: {
    alignSelf: 'stretch',
    height: 'auto',
    margin: theme.spacing(1, 0.5),
    padding: 0,
    width: 0,
  },
  groupBtnRoot: {
    display: 'block',
    marginBottom: theme.spacing(1),
  },
  groupBtnGrouped: {
    '&:not(:first-child)': {
      marginLeft: theme.spacing(0.5),
    },
  },
  toothJournal: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  toothJournalItem: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: theme.spacing(1),
  },
  toothJournalItemSecondaryAction: {
    paddingRight: theme.spacing(3),
  },
  toothJournalItemText: {
    margin: theme.spacing(0),
  },
  // toothJournalSecondaryAction: {
  //   right: theme.spacing(1),
  //   display: 'none',
  // },
  toothIcon: {
    minWidth: 'auto',
  },
  sortableContainer: {
    // overflow: 'hidden',
    // backgroundColor: 'red',
  },
  attachmentContainer: {
    margin: 0,
    width: 'auto',
  },
  buttonIcon: {
    position: 'absolute',
    left: theme.spacing(0.5),
  },
})
const groupWidth = baseWidth * 4 // + strokeWidth
const groupHeight = baseHeight * 3 // + strokeWidth
@connect(({ dentalChartComponent, dentalChartSetup, global }) => ({
  dentalChartComponent,
  dentalChartSetup,
  global,
}))
class DentalChart extends React.Component {
  render () {
    const {
      className,
      canvasDivStyle,
      theme,
      index,
      arrayHelpers,
      diagnosises,
      classes,
      form,
      field,
      style,
      onChange,
      value,
      onDataSouceChange,
      dentalChartComponent,
      dispatch,
      ...props
    } = this.props
    const { mode } = dentalChartComponent
    return (
      <div className={className} style={{ padding: `${theme.spacing(1)}px 0` }}>
        <GridContainer gutter={theme.spacing(0.5)}>
          <GridItem md={8}>
            <div style={{ marginBottom: theme.spacing(1) }}>
              <Chart {...this.props} />
            </div>
            {mode === 'diagnosis' && <ButtonGroup {...this.props} />}
            {mode === 'treatment' && <TreatmentForm {...this.props} />}
          </GridItem>
          <GridItem md={4}>
            <RightPanel {...this.props} />
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(DentalChart)
