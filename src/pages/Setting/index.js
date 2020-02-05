import React, { PureComponent } from 'react'
import { connect } from 'dva'
import classnames from 'classnames'
import _ from 'lodash'
import ListAlt from '@material-ui/icons/ListAlt'
import Search from '@material-ui/icons/Search'
import Business from '@material-ui/icons/Business'
import FolderOpen from '@material-ui/icons/FolderOpen'
import { withStyles } from '@material-ui/core'
import Authorized from '@/utils/Authorized'

import {
  GridContainer,
  GridItem,
  CardContainer,
  TextField,
  Accordion,
  Button,
} from '@/components'
// import Banner from './Banner'
// import Orders from './Orders'
// import ConsultationDocument from './ConsultationDocument'
// import ResultHistory from './ResultHistory'
// import Invoice from './Invoice'

const menuData = [
  {
    authority: 'settings.mastersetting',
    title: 'Master Setting',
    text: 'Clinic Information',
    url: '/setting/clinicinfo',
  },
  {
    authority: 'settings.mastersetting',
    title: 'Master Setting',
    text: 'GST Setup',
    url: '/setting/gstsetup',
  },
  {
    authority: 'settings.mastersetting',
    title: 'Master Setting',
    text: 'General Setting',
    url: '/setting/generalsetting',
  },
  {
    title: 'Clinic Setting',
    text: 'Service',
    url: '/setting/service',
  },
  {
    title: 'Clinic Setting',
    text: 'Service Center',
    // icon: <Business />,
    url: '/setting/servicecenter',
  },
  {
    title: 'Clinic Setting',
    text: 'Service Center Category',
    // icon: <FolderOpen />,
    url: '/setting/servicecentercategory',
  },
  {
    title: 'Clinic Setting',
    text: 'Service Category',
    // icon: <FolderOpen />,
    url: '/setting/servicecategory',
  },
  {
    title: 'Clinic Setting',
    text: 'Revenue Category',
    // icon: <FolderOpen />,
    url: '/setting/revenuecategory',
  },
  {
    title: 'Clinic Setting',
    text: 'Room',
    url: '/setting/room',
  },
  {
    title: 'Clinic Setting',
    text: 'Clinic Operation Hour',
    url: '/setting/clinicoperationhour',
  },
  {
    title: 'Clinic Setting',
    text: 'Clinic Break Hour',
    url: '/setting/clinicbreakhour',
  },
  {
    title: 'Clinic Setting',
    text: 'Public Holiday',
    url: '/setting/publicholiday',
  },
  {
    title: 'Clinic Setting',
    text: 'Doctor Block',
    url: '/setting/doctorblock',
  },
  // {
  //   title: 'Clinic Setting',
  //   text: 'Participant Role',
  //   url: '/setting/participantrole',
  // },
  {
    title: 'Clinic Setting',
    text: 'Room Block',
    url: '/setting/roomblock',
  },
  {
    title: 'Clinic Setting',
    text: 'Medication UOM',
    url: '/setting/medicationuom',
  },
  {
    title: 'Clinic Setting',
    text: 'Consumable UOM',
    url: '/setting/consumableuom',
  },
  {
    title: 'Clinic Setting',
    text: 'Medication Group',
    url: '/setting/medicationgroup',
  },
  {
    title: 'Clinic Setting',
    text: 'Consumable Category',
    url: '/setting/consumablegroup',
  },
  {
    title: 'Clinic Setting',
    text: 'Medication Dosage',
    url: '/setting/medicationdosage',
  },
  {
    title: 'Clinic Setting',
    text: 'Medication Precaution',
    url: '/setting/medicationprecautions',
  },
  {
    title: 'Clinic Setting',
    text: 'Medication Frequency',
    url: '/setting/medicationfrequency',
  },
  {
    title: 'Clinic Setting',
    text: 'Medication Consumption Method',
    longText: true,
    url: '/setting/medicationconsumptionmethod',
  },
  {
    title: 'Clinic Setting',
    text: 'Payment Mode',
    url: '/setting/paymentmode',
  },
  {
    title: 'Clinic Setting',
    text: 'Appointment Type',
    url: '/setting/appointmenttype',
  },
  {
    title: 'Clinic Setting',
    text: 'Treatment',
    // icon: <FolderOpen />,
    url: '/setting/treatment',
  },
  {
    title: 'Clinic Setting',
    text: 'Treatment Category',
    // icon: <FolderOpen />,
    url: '/setting/treatmentcategory',
  },
  {
    title: 'System User',
    text: 'System User',
    url: '/setting/userprofile',
  },
  {
    title: 'Print Setup',
    text: 'Printout Setting',
    url: '/setting/printoutsetting',
  },
  {
    title: 'Templates',
    text: 'SMS Template',
    url: '/setting/smstemplate',
  },
  {
    title: 'Templates',
    text: 'Document Template',
    url: '/setting/documenttemplate',
  },
  // {
  //   title: 'Contact',
  //   text: 'Co-Payer',
  //   url: '/setting/company/1',
  // },
  {
    title: 'Contact',
    text: 'Supplier',
    url: '/setting/company/2',
  },
]
const styles = (theme) => ({
  baseBtn: {
    minHeight: 56,
    '& svg': {
      width: 24,
      height: 24,
    },
    '& > span': {
      display: 'flex',
      justifyContent: 'space-between',
    },
    '& > span > span': {
      width: '100%',
    },
  },
  bigviewBtn: {
    // width: 180,
    marginRight: 0,
    minHeight: 106,
  },
  longTextBtn: {
    '& span': {
      whiteSpace: 'initial',
    },
    '& svg': {
      width: 50,
      height: 50,
    },
  },
  searchField: {
    width: '20%',
  },
})

const Authority = {
  'Master Setting': 'settings.mastersetting',
  'Clinic Setting': 'settings.clinicsetting',
  'Print Setup': 'settings.printsetup',
  'System User': 'settings.systemuser',
  'User Preference': 'settings.userpreference',
  Templates: 'settings.template',
  Contact: 'settings.contact',
}

@connect(({ systemSetting, global, user }) => ({
  systemSetting,
  global,
  user,
}))
class SystemSetting extends PureComponent {
  constructor (props) {
    super(props)
    this.group = _.groupBy(menuData, 'title')

    // console.log(menuData, group, Object.keys(group))
    const { classes, theme } = props
  }

  state = {
    searchText: '',
    selectedOptions: [],
    active: 0,
  }

  componentDidMount () {}

  componentWillUnmount () {}

  menus = () => {
    const { classes, theme } = this.props

    return Object.keys(this.group).map((o) => {
      return {
        authority: Authority[o],
        title: o,
        items: this.group[o],
        key: o,
        content: (
          <GridContainer style={{ marginTop: theme.spacing(1) }} key={o}>
            {this.group[o]
              .filter((m) => {
                return (
                  m.text.toLocaleLowerCase().indexOf(this.state.searchText) >=
                    0 || !this.state.searchText
                )
              })
              .map((item, i) => {
                return (
                  <GridItem
                    key={i}
                    xs={4}
                    md={2}
                    style={{ marginBottom: theme.spacing(2) }}
                  >
                    <Button
                      fullWidth
                      // bigview
                      color='primary'
                      className={classnames({
                        [classes.baseBtn]: true,
                        // [classes.bigviewBtn]: false,
                        // [classes.longTextBtn]: item.longText,
                      })}
                      variant='outlined'
                      onClick={() => {
                        this.props.history.push(item.url)
                      }}
                    >
                      <ListAlt />
                      <span>{item.text}</span>
                    </Button>
                  </GridItem>
                )
              })}
          </GridContainer>
        ),
      }
    })
  }

  render () {
    const {
      theme,
      classes,
      height,
      user,
      history,
      linkProps = {},
      onMenuClick = (p) => p,
      ...resetProps
    } = this.props
    const { accessRights = [] } = user
    return (
      <CardContainer hideHeader>
        {/* <Select
          options={menuData}
          mode='multiple'
          prefix={<Search />}
          labelField='text'
          valueField='text'
          groupField='title'
          simple
          onChange={(v) => {
            this.setState({
              selectedOptions: v,
            })
          }}
        /> */}
        <TextField
          className={classes.searchField}
          prefix={<Search />}
          onChange={(e) => {
            this.setState(() => {
              return {
                searchText: e.target.value.toLowerCase(),
              }
            })
          }}
          value={this.state.searchText}
        />
        <Accordion
          defaultActive={0}
          mode={this.state.searchText.length > 0 ? 'multiple' : 'default'}
          collapses={this.menus().filter((item) => {
            const accessRight = accessRights.find(
              (menuItem) => menuItem.name === item.authority,
            )
            const canAccess =
              accessRight === undefined
                ? true
                : accessRight.rights === 'readwrite'
            return (
              canAccess &&
              (!this.state.searchText ||
                // item.title.toLocaleLowerCase().indexOf(this.state.searchText) >=
                //   0 ||
                item.items.find(
                  (m) =>
                    m.text.toLocaleLowerCase().indexOf(this.state.searchText) >=
                    0,
                ))
            )
          })}
        />
        {/* <Accordion
          defaultActive={0}
          mode={this.state.selectedOptions.length > 0 ? 'multiple' : 'default'}
          collapses={this.menus().filter((item) => {
            const seletedOptions = menuData.filter(
              (o) => this.state.selectedOptions.indexOf(o.text) >= 0,
            )
            return (
              this.state.selectedOptions.length === 0 ||
              seletedOptions.find((m) => m.title === item.title)
            )
          })}
        /> */}
        {/* <Button color='primary'>Test Test TestTest Test Test</Button>
        <MuiButton color='primary' variant='contained'>
          Test Test TestTest Test Test
        </MuiButton> */}
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(SystemSetting)
