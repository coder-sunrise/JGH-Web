import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import PerfectScrollbar from 'perfect-scrollbar'
import Link from 'umi/link'
import DateRange from '@material-ui/icons/DateRange'
import {
  withStyles,
  MenuItem,
  MenuList,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
} from '@material-ui/core'

import { unstable_Box as Box } from '@material-ui/core/Box'
import { Icon, Input, AutoComplete, Form } from 'antd'
import Loadable from 'react-loadable'
import inputStyle from 'mui-pro-jss/material-dashboard-pro-react/antd/input'
import {
  PictureUpload,
  GridContainer,
  GridItem,
  CardContainer,
  Transition,
  TextField,
  AntdInput,
  Select,
  Accordion,
  Button,
  notification,
} from '@/components'

import avatar from '@/assets/img/faces/marc.jpg'
import { getAppendUrl } from '@/utils/utils'

import Loading from '@/components/PageLoading/index'
import Banner from './Banner'
import PatientHistory from '@/pages/Widgets/PatientHistory'

const styles = (theme) => ({
  ...inputStyle(theme),
  root: {},
  hide: {
    display: 'none',
  },
  title: {
    fontSize: '1rem',
  },
  note: {
    fontSize: '0.75em',
    fontWeight: 400,
    // marginTop: -3,
    lineHeight: '10px',
  },
  listRoot: {
    width: '100%',
  },
  listItemRoot: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  listItemDate: {
    position: 'absolute',
    right: '21%',
  },
  paragraph: {
    marginLeft: theme.spacing(1),
  },
  leftPanel: {
    top: 164,
  },

  rightPanel: {
    marginTop: theme.spacing(1),
  },
})
@connect(({ patientDashboard, visitRegistration, global }) => ({
  patientDashboard,
  visitRegistration,
  global,
}))
class PatientDashboard extends PureComponent {
  componentDidMount () {
    if (this.props.patientDashboard.currentId) {
      this.props.dispatch({
        type: 'patientDashboard/query',
        payload: {
          id: this.props.patientDashboard.currentId,
        },
      })
    }
  }

  componentWillUnmount () {}

  handleListItemClick = (e, i) => {
    this.setState({ selectedIndex: i })
  }

  startConsultation = () => {
    // this.props.dispatch({
    //   type: 'patientDashboard/openConsultationModal',
    // })
    // this.props.history.push(
    //   '/reception/queue/patientdashboard/consultation/new',
    // )
    // const { clinicalObjectRecordID } = this.props.patientDashboard
    // if (clinicalObjectRecordID) {
    //   this.props.history.push(
    //     getAppendUrl({
    //       md: 'cons',
    //       // vid: visitID,
    //     }),
    //   )
    // } else {
    //   notification.error({
    //     message: 'Visit info not found, please start over',
    //   })
    // }
    const { visitRegistration } = this.props
    const { visitInfo = {} } = visitRegistration

    this.props.history.push(
      getAppendUrl({
        md2: 'cons',
      }),
    )
  }

  render () {
    const {
      theme,
      classes,
      height,
      linkProps = {},
      onMenuClick = (p) => p,
      ...resetProps
    } = this.props

    const { patientDashboard, visitRegistration, global, history } = resetProps

    const { visitInfo = {} } = visitRegistration

    return (
      <div className={classes.root}>
        <Banner
          extraCmt={
            <Button
              color='primary'
              onClick={this.startConsultation}
              style={{ marginTop: 25 }}
            >
              Start Consultation
            </Button>
          }
          {...this.props}
        />
        <PatientHistory
          override={{
            leftPanel: classes.leftPanel,
            rightPanel: classes.rightPanel,
          }}
        />
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(PatientDashboard)
