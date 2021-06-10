import React, { PureComponent, Suspense } from 'react'
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout'
import Loadable from 'react-loadable'
import { withFormik, Formik, Form, Field, FastField, FieldArray } from 'formik'
import numeral from 'numeral'
import Search from '@material-ui/icons/Search'
import AttachMoney from '@material-ui/icons/AttachMoney'

import {
  FormControl,
  InputLabel,
  Input,
  Paper,
  MuiThemeProvider,
  createMuiTheme,
  withStyles,
  IconButton,
  Menu,
  MenuItem,
  Popper,
  Fade,
  Divider,
  ClickAwayListener,
} from '@material-ui/core'
import MoreVert from '@material-ui/icons/MoreVert'
import Snackbar from '@material-ui/core/Snackbar'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import WarningIcon from '@material-ui/icons/Warning'
import ErrorIcon from '@material-ui/icons/Error'
import InfoIcon from '@material-ui/icons/Info'
import FilterList from '@material-ui/icons/FilterList'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
import AmountSummary from '@/pages/Shared/AmountSummary'
import {
  CardContainer,
  TextField,
  CodeSelect,
  Button,
  CommonHeader,
  CommonModal,
  PictureUpload,
  GridContainer,
  GridItem,
  Card,
  CardAvatar,
  CardBody,
  notification,
  Select,
  DatePicker,
  DateRangePicker,
  CheckboxGroup,
  ProgressButton,
  Checkbox,
  BaseInput,
  RadioGroup,
  SizeContainer,
  AntdSelect,
  TimePicker,
  NumberInput,
  Switch,
  ButtonSelect,
  OutlinedTextField,
} from '@/components'

import { widgets } from '@/utils/widgets'
import Yup from '@/utils/yup'
import { smallTheme, defaultTheme, largeTheme } from '@/utils/theme'
import Loading from '@/components/PageLoading/index'

// import PatientSearch from '@/pages/PatientDatabase/Search'
// import PatientDetail from '@/pages/PatientDatabase/Detail'
const doctors = [
  { value: 'bao', name: 'Bao' },
  { value: 'cheah', name: 'Cheah' },
  // { value: 'tan', name: 'Tan' },
  // { value: 'tan1', name: 'Tan1' },
  // { value: 'tan2', name: 'Tan2' },
  // { value: 'tan3', name: 'Tan3' },
  // { value: 'tan4', name: 'Tan4' },
  // { value: 'tan5', name: 'Tan5' },
]

const ResponsiveGridLayout = WidthProvider(Responsive)
// let layout = {
//   lg: [
//     { i: 'a', x: 0, y: 0, w: 12, h: 6, static: true }, // static: true
//     { i: 'b', x: 0, y: 0, w: 6, h: 2 }, // minW: 2, maxW: 4
//     { i: 'c', x: 6, y: 0, w: 6, h: 2 },
//   ],
// }
const styles = theme => ({
  ...basicStyle(theme),
  container: {
    width: '100%',
  },
  item: {
    width: 100,
    border: '1px solid #ccc',
  },
  paper: {
    '&> div': {
      overflow: 'auto',
      height: '100%',
    },
    // padding: 10,
  },
  moreWidgetsBtn: {
    position: 'absolute',
    right: -13,
    top: 0,
  },
  labelClass: {
    label: {
      minWidth: 100,
    },
  },
})

const initValues = {
  doctorRemarks: 'Testing multiple lines of input',
  timing2: '08:30',
  numberField: 123,
  doctor: ['bao'],
}
@withFormik({
  mapPropsToValues: () => initValues,
  validationSchema: Yup.object().shape({
    name: Yup.string().required(),
    dob: Yup.date().required(),
    patientAccountNo: Yup.string().required(),
    genderFK: Yup.string().required(),
    doctorRemarks: Yup.string().required(),
    doctor: Yup.array()
      .of(Yup.string().required())
      .required(),
    doctorRadio: Yup.string().required(),
    isPersist: Yup.boolean().required(),
    fromto: Yup.array()
      .of(Yup.date())
      .required()
      .min(2),
    numberField: Yup.number().required(),
    contact: Yup.object().shape({
      contactAddress: Yup.array().of(
        Yup.object().shape({
          line1: Yup.string().required(),
          postcode: Yup.number().required(),
          countryFK: Yup.string().required(),
        }),
      ),
    }),
  }),
  submitForm: v => {
    console.log(v)
  },
  displayName: 'ControlTest',
})
class ControlTest extends PureComponent {
  constructor(props) {
    super(props)
    this.container = React.createRef()

    const title = 'Simple Title'
    const options = {
      body: 'Simple piece of body text.\nSecond line of body text :)',
    }
    // registration.showNotification(title, options)

    //   navigator.serviceWorker.getRegistration().then((reg) => {
    //     console.log(reg)
    //     let options = {
    //       body: 'Here is a notification body!',
    //       icon: 'images/example.png',
    //       vibrate: [
    //         100,
    //         50,
    //         100,
    //       ],
    //       data: {
    //         dateOfArrival: Date.now(),
    //         primaryKey: 1,
    //       },
    //       actions: [
    //         {
    //           action: 'explore',
    //           title: 'Explore this new world',
    //           icon: 'images/checkmark.png',
    //         },
    //         {
    //           action: 'close',
    //           title: 'Close notification',
    //           icon: 'images/xmark.png',
    //         },
    //       ],
    //     }
    //     reg.showNotification('Hello world!', options)
    //   })
  }

  state = {
    val: undefined,
  }

  // componentDidUpdate (prevProps, prevState, snapshot) {
  //   console.log(this.props, prevProps)

  //   console.log(deepDiffMapper.map(this.props, prevProps, true))
  // }

  componentDidMount() {
    // create an instance
  }

  generateConfig = cfg => {
    const { classes, ...resetProps } = this.props
    const { elevation } = this.state
    return {
      elevation: 0,
      className: classes.paper,
      onMouseOver: e => {
        elevation[cfg.id] = 3
        this.setState({ elevation })
      },
      onMouseOut: e => {
        elevation[cfg.id] = 0
        this.setState({ elevation })
      },
    }
  }

  // UNSAFE_componentWillReceiveProps (nextProps) {
  //   console.log(nextProps, this.props)
  // }

  render() {
    const { props, state } = this
    const { classes, theme, ...resetProps } = this.props
    console.log(Notification, Notification.permission)
    const testConfig = {
      onFocus: e => {
        console.log(1)
        console.log(e)
      },
      onChange: e => {
        console.log(2)

        console.log(e)
      },
      onBlur: e => {
        console.log(3)

        console.log(e)
      },
      inputProps: {
        onChange: e => {
          console.log(4)

          console.log(e)
        },
        onBlur: e => {
          console.log(5)

          console.log(e)
        },
        onFocus: e => {
          console.log(6)

          console.log(e)
        },
      },
    }
    const testComponents = (
      <div style={{ marginBottom: theme.spacing(5) }}>
        <GridContainer>
          <GridItem sm={3}>
            {/* <TextField
              value={`${this.state.val}`}
              prefix={<Search />}
              label='Name'
              onChange={(e) => {
                this.setState({
                  val: e.target.value,
                })
              }}
            /> */}

            <FastField
              name='coPaymentSchemeName'
              render={args => (
                <CodeSelect
                  {...args}
                  label='Copayment Scheme name'
                  code='coPaymentScheme'
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            {/* <TextField
              value={`${this.state.val}`}
              prefix={<Search />}
              label='Name'
              onChange={(e) => {
                this.setState({
                  val: e.target.value,
                })
              }}
            /> */}

            <FastField
              name='name'
              render={args => (
                <TextField prefix={<Search />} label='Name' {...args} />
              )}
            />
          </GridItem>
          <GridItem sm={6}>
            <FastField
              name='name'
              render={args => {
                return (
                  <TextField
                    prefix={<Search />}
                    label='Multiline Name'
                    multiline
                    rowsMax={6}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='genderFK'
              render={args => (
                <CodeSelect label='Salutation' code='ctSalutation' {...args} />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='dob'
              render={args => <DatePicker label='DOB' {...args} />}
            />
          </GridItem>
          <GridItem sm={6}>
            <FastField
              name='fromto'
              render={args => (
                <DateRangePicker label='From' label2='To' {...args} />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='time'
              render={args => <TimePicker label='Time' {...args} />}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='name'
              render={args => (
                <TextField
                  prefix={<Search />}
                  label='sdf'
                  prefix='Name'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='isPersist'
              render={args => {
                return (
                  <Checkbox
                    label='Persist'
                    inputLabel='Input Persist'
                    labelPlacement='end'
                    prefix='External Prescription'
                    mode='default'
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='doctor'
              render={args => (
                <CheckboxGroup
                  label='Filter by Doctor'
                  // vertical
                  // simple
                  // value={}
                  // value={{ tan1: true }}
                  textField='name'
                  options={doctors}
                  noUnderline
                  onChange={e => {
                    // console.log(e)
                    // dispatch({
                    //   type: 'consultation/updateState',
                    //   payload: {
                    //     selectedWidgets: e.target.value,
                    //   },
                    // })
                  }}
                  // labelClass={}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='doctorRadio'
              render={args => (
                <RadioGroup
                  label='Filter by Doctor'
                  // vertical
                  // simple
                  // value={}
                  // value={{ tan1: true }}
                  textField='name'
                  options={doctors}
                  onChange={e => {
                    // console.log(e)
                    // dispatch({
                    //   type: 'consultation/updateState',
                    //   payload: {
                    //     selectedWidgets: e.target.value,
                    //   },
                    // })
                  }}
                  // labelClass={}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='numberField'
              render={args => (
                <TextField
                  prefix='External Prescription'
                  label='Text Input'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='doctor'
              render={args => (
                <Select
                  label='Filter by Doctor (Multiple)'
                  mode='multiple'
                  options={doctors}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='doctor'
              render={args => (
                <Select
                  mode='tags'
                  maxSelected={1}
                  label='Filter by Doctor (Tags)'
                  onChange={v => {
                    console.log(v)
                  }}
                  options={doctors}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='doctorsingle'
              render={args => (
                <Select
                  label='Filter by Doctor (Single)'
                  prefix='Filter by Doctor (Single)'
                  options={doctors}
                  {...args}
                />
              )}
            />
          </GridItem>

          <GridItem sm={3}>
            <FastField
              name='numberField'
              render={args => (
                <NumberInput
                  prefix='External Prescription'
                  label='Number Input'
                  step={0.5}
                  currency
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='numberField'
              render={args => (
                <TextField
                  prefix='External Prescription'
                  label='Text Input'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='switch'
              render={args => {
                return <Switch label='Switch' {...args} />
              }}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='numberField'
              render={args => {
                return <NumberInput format='0,0' label='Number' {...args} />
              }}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='diagnosis'
              render={args => {
                return (
                  <CodeSelect
                    label='Diagnosis'
                    code='codetable/ctsnomeddiagnosis'
                    filter={{
                      props:
                        'id,displayvalue,code,complication,isChasAcuteClaimable,isChasChronicClaimable,isHazeClaimable',
                    }}
                    labelField='displayvalue'
                    autoComplete
                    renderDropdown={option => {
                      return (
                        <span>
                          <AttachMoney
                            style={{
                              width: 16,
                              height: 16,
                              top: 3,
                              position: 'relative',
                            }}
                          />
                          {option.displayvalue}
                        </span>
                      )
                    }}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem sm={3}>
            <FastField
              name='name'
              render={args => {
                return (
                  <OutlinedTextField
                    label='Text Input'
                    multiline
                    rowsMax={3}
                    rows={3}
                    maxLength={20}
                    onChange={v => {
                      console.log(v)
                    }}
                    onBlur={v => {
                      console.log('blur', v)
                    }}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
        </GridContainer>
        <GridContainer>
          <GridItem>
            <FastField
              name='doctor'
              render={args => {
                return (
                  <ButtonSelect
                    options={doctors}
                    mode='multiple'
                    textField='name'
                    valueField='value'
                    justIcon
                    onChange={(v, option) => {
                      console.log(v, option)
                    }}
                    {...args}
                  >
                    <FilterList />
                  </ButtonSelect>
                )
              }}
            />
          </GridItem>
        </GridContainer>
        <Divider />
      </div>
    )
    return (
      <CardContainer
        // hideHeader
        style={{
          marginLeft: 5,
          marginRight: 5,
        }}
        title={this.title}
      >
        {/* <GridContainer>
          <GridItem xs={0} md={8} />
          <GridItem xs={12} md={4}>
            <AmountSummary
              rows={[
                {
                  id: 1,
                  totalAfterItemAdjustment: 100,
                },
              ]}
            />
          </GridItem>
        </GridContainer> */}
        <div>
          <Button
            onClick={() => {
              console.log(initValues)
              props.resetForm(initValues)
              // notification.error({
              //   // icon: WarningIcon,
              //   icon: null,
              //   duration: 0,
              //   placement: 'bottomRight',
              //   message: 'Notification Title',
              //   // description:
              //   //   'test test testtest d sd sd d test test test testtest d sd sd d testtest test testtest d sd sd d testtest test testtest d sd sd d testtest test testtest d sd sd d testtest test testtest d sd sd d test',
              // })
            }}
          >
            Reset
          </Button>
          <ProgressButton onClick={props.handleSubmit} />
        </div>
        <SizeContainer size='lg'>{testComponents}</SizeContainer>
        {testComponents}
        <SizeContainer size='sm'>{testComponents}</SizeContainer>

        <div>
          <Button
            onClick={() => {
              console.log(initValues)
              props.resetForm(initValues)
              // notification.error({
              //   // icon: WarningIcon,
              //   icon: null,
              //   duration: 0,
              //   placement: 'bottomRight',
              //   message: 'Notification Title',
              //   // description:
              //   //   'test test testtest d sd sd d test test test testtest d sd sd d testtest test testtest d sd sd d testtest test testtest d sd sd d testtest test testtest d sd sd d testtest test testtest d sd sd d test',
              // })
            }}
          >
            Reset
          </Button>
          <ProgressButton onClick={props.handleSubmit} />
        </div>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(ControlTest)
