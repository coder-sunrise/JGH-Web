import React, { PureComponent } from 'react'
import { Link } from 'umi'
import { connect } from 'dva'
import _ from 'lodash'
import moment from 'moment'
import { Drawer } from 'antd'
import { Paper } from '@material-ui/core'
import { headerHeight } from 'mui-pro-jss'
import Warning from '@material-ui/icons/Error'
import Edit from '@material-ui/icons/Edit'
import Refresh from '@material-ui/icons/Sync'
import { getAppendUrl } from '@/utils/utils'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import PatientNurseNotes from '@/pages/PatientDatabase/Detail/PatientNurseNotes'
import SelectPreOrder from '@/pages/Reception/Appointment/components/form/SelectPreOrder'
import { MoreButton, LoadingWrapper } from '@/components/_medisys'
import {
  GridContainer,
  GridItem,
  CodeSelect,
  DatePicker,
  dateFormatLong,
  Skeleton,
  Tooltip,
  IconButton,
  Popover,
  NumberInput,
  CommonModal,
} from '@/components'

import Authorized from '@/utils/Authorized'
import { currencySymbol } from '@/utils/config'
import { control } from '@/components/Decorator'
import Block from './Block'
import HistoryDiagnosis from './HistoryDiagnosis'
import { SwitcherTwoTone } from '@ant-design/icons'

const headerStyles = {
  color: 'darkblue',
  fontWeight: 500,
  position: 'relative',
  // style={{ color: 'darkblue' }}
}

const styles = theme => ({
  header: {
    color: 'darkblue',
    fontWeight: 500,
    position: 'relative',
  },
  cell: {
    margin: '3px 0',
  },
  part: {
    display: 'inline-block',
  },
})

@control()
@connect(({ patient, codetable, loading }) => ({
  patient,
  codetable,
  ctschemetype: codetable.ctschemetype || [],
  refreshingChasBalance: loading.effects['patient/refreshChasBalance'],
}))
class Banner extends PureComponent {
  state = {
    showWarning: false,
    refreshedSchemeData: {},
    refreshedSchemePayerData: {},
    currPatientCoPaymentSchemeFK: 0,
    currentSchemeType: 0,
    showNotesModal: false,
    showSchemeModal: false,
    showPreOrderModal: false,
  }

  constructor(props) {
    super(props)
    this.fetchCodeTables()
  }

  componentWillMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctg6pd' },
    })
  }

  getAllergyData() {
    const { patient } = this.props
    const { entity } = patient
    const { info } = entity
    const { patientAllergy = [], patientAllergyMetaData = [] } = entity
    const da = _.orderBy(patientAllergy, ['type'], ['asc'])
    const allergyData = da.reduce((data, current) => {
      if (!data) return current.allergyName
      return `${data}, ${current.allergyName}`
    }, '')

    this.setState({
      showWarning: da.length ? true : false,
    })

    // console.log('getAllergyData', allergyData)
    return (
      entity &&
      entity.isActive && (
        <span style={{ marginTop: 5 }}>{allergyData || '-'}</span>
      )
    )
  }

  getAllergyLink(data) {
    const { props } = this
    const {
      patient,
      codetable: { ctg6pd = [] },
	  patientUrl,
    } = props
    const { entity } = patient
    const info = entity
    const { patientAllergy = [], patientAllergyMetaData = [] } = info
    const da = _.orderBy(patientAllergy, ['type'], ['asc'])
    let allergyData = '-'

    if (da.length > 0) {
      if (da.length >= 2) {
        allergyData = `${da[0].allergyName}, ${da[1].allergyName}`
      } else {
        allergyData = `${da[0].allergyName}`
      }
    }

    if (da.length) {
      this.setState({
        showWarning: true,
      })
    } else {
      this.setState({
        showWarning: false,
      })
    }
    let g6PD
    if (patientAllergyMetaData.length > 0) {
      g6PD = ctg6pd.find(o => o.id === patientAllergyMetaData[0].g6PDFK)
    }
    return (
      entity &&
      entity.isActive && (
        <div style={{ display: 'inline-block' }}>
          {data === 'link' ? (
            <Link
              to={getAppendUrl({
                md: 'pt',
                cmt: 3,
                pid: info.id,
              }, patientUrl)}
              tabIndex='-1'
            >
              <IconButton>
                <Edit color='action' />
              </IconButton>
            </Link>
          ) : (
            <div style={{ marginTop: 5 }}>
              {allergyData.length > 25
                ? `${allergyData.substring(0, 25).trim()}...`
                : allergyData}

              {da.length > 0 && (
                <Popover
                  icon={null}
                  content={
                    <div>
                      {da.map((item, i) => {
                        return (
                          <GridContainer>
                            <GridItem>
                              {i + 1}. {item.allergyName}
                            </GridItem>
                          </GridContainer>
                        )
                      })}
                    </div>
                  }
                  trigger='click'
                  placement='bottomLeft'
                >
                  <div style={{ display: 'inline-block' }}>
                    <MoreButton />
                  </div>
                </Popover>
              )}

              <div>
                <span
                  style={{
                    color: 'darkblue',
                    fontWeight: 500,
                    position: 'relative',
                    fontSize: '16.1px',
                  }}
                >
                  G6PD:{' '}
                </span>
                {g6PD ? g6PD.name : '-'}
              </div>
            </div>
          )}
        </div>
      )
    )
  }

  fetchCodeTables = async () => {
    const { dispatch } = this.props
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctdrugallergy',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctsalutation',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'ctschemetype',
      },
    })
    await dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'copaymentscheme',
      },
    })
  }

  openNotes = () => this.setState({ showNotesModal: true })
  closeNotes = () => this.setState({ showNotesModal: false })
  openPreOrders = () => this.setState({ showPreOrderModal: true })
  closePreOrders = () => this.setState({ showPreOrderModal: false })
  openScheme = () => this.setState({ showSchemeModal: true })
  closeScheme = () => this.setState({ showSchemeModal: false })

  getSchemeList = schemeDataList => {
    return schemeDataList.map(s => (
      <Link>
        <span
          style={{
            color: 'black',
            textDecoration: 'underline',
            whiteSpace: 'nowrap',
          }}
          onClick={e => {
            this.openScheme()
          }}
        >
          {s.copaymentSchemeName || s.schemeTypeName}{' '}
          {s.validTo ? `(Exp: ${moment(s.validTo).format('DD/MM/YYYY')})` : ' '}
        </span>{' '}
      </Link>
    ))
  }

  refreshGovtBalance = () => {
    this.refreshChasBalance()
    this.refreshMedisaveBalance()
  }

  refreshChasBalance = () => {
    const { dispatch, patient } = this.props
    const { entity } = patient
    const { currPatientCoPaymentSchemeFK, currentSchemeType } = this.state
    let patientCoPaymentSchemeFK = currPatientCoPaymentSchemeFK
    let oldSchemeTypeFK = currentSchemeType
    let isSaveToDb = true
    dispatch({
      type: 'patient/refreshChasBalance',
      payload: {
        ...entity,
        patientCoPaymentSchemeFK,
        isSaveToDb,
        patientProfileId: entity.id,
      },
    }).then(result => {
      // console.log('result ==========', result)
      if (result) {
        dispatch({
          type: 'patient/query',
          payload: {
            id: entity.id,
          },
        })

        const {
          balance,
          schemeTypeFk,
          validFrom,
          validTo,
          acuteVisitPatientBalance,
          acuteVisitClinicBalance,
          isSuccessful,
          statusDescription,
          acuteBalanceStatusCode,
          chronicBalanceStatusCode,
        } = result
        let isShowReplacementModal = false

        if (!isSuccessful) {
          this.setState({
            refreshedSchemeData: {
              statusDescription,
              isSuccessful,
            },
          })
        } else {
          if (oldSchemeTypeFK !== schemeTypeFk) {
            isShowReplacementModal = true
          }

          this.setState({
            refreshedSchemeData: {
              isShowReplacementModal,
              oldSchemeTypeFK,
              balance,
              patientCoPaymentSchemeFK,
              schemeTypeFK: schemeTypeFk,
              validFrom,
              validTo,
              acuteVisitPatientBalance,
              acuteVisitClinicBalance,
              isSuccessful,
              acuteBalanceStatusCode,
              chronicBalanceStatusCode,
            },
          })
        }
      }
    })
  }

  refreshMedisaveBalance = () => {
    const { dispatch, patient } = this.props
    const { entity } = patient
    const { schemePayers } = entity
    const isSaveToDb = true

    if (!schemePayers || schemePayers.length === 0) return
    dispatch({
      type: 'patient/refreshMedisaveBalance',
      payload: {
        ...entity,
        isSaveToDb,
        patientProfileId: entity.id,
        schemePayers,
      },
    }).then(result => {
      if (result) {
        dispatch({
          type: 'patient/query',
          payload: {
            id: entity.id,
          },
        })

        const {
          // balance,
          // schemeTypeFk,
          validFrom,
          validTo,
          payerBalance,
          isSuccessful,
          status,
          statusDescription,
        } = result
        let isShowReplacementModal = false
        if (!isSuccessful) {
          this.setState({
            refreshedSchemePayerData: {
              payerBalanceList: [],
              statusDescription,
              isSuccessful,
            },
          })
        } else if (payerBalance) {
          let payerBalanceList = []
          payerBalance.forEach(pb => {
            if (pb.enquiryType === 'MSVBAL') return
            /* if (oldSchemeTypeFK !== pb.schemeTypeFK) {
              isShowReplacementModal = true
            } */
            const { finalBalance } = pb
            payerBalanceList.push({
              isShowReplacementModal,
              // oldSchemeTypeFK,
              finalBalance,
              schemeTypeFK: pb.schemeTypeFK,
              schemePayerFK: pb.schemePayerFK,
              validFrom,
              validTo,
              isSuccessful,
            })
          })
          this.setState({
            refreshedSchemePayerData: {
              payerBalanceList,
              statusDescription,
              isSuccessful,
            },
          })
        }
      }
    })
  }

  isMedisave = schemeTypeFK => {
    /* const { ctschemetype } = this.props.codetable
    const r = ctschemetype.find((o) => o.id === schemeTypeFK)
    if(r)
      return (
        [
          'FLEXIMEDI',
          'OPSCAN',
          'MEDIVISIT',
        ].indexOf(r.code) >= 0
      ) */
    if (schemeTypeFK) return [12, 13, 14].indexOf(schemeTypeFK) >= 0

    return false
  }

  getSchemeDetails = schemeData => {
    const { refreshedSchemeData } = this.state

    if (
      !_.isEmpty(refreshedSchemeData) &&
      refreshedSchemeData.isSuccessful === true
    ) {
      return { ...refreshedSchemeData }
    }

    // Scheme Balance
    const balance =
      schemeData.patientSchemeBalance.length <= 0
        ? undefined
        : schemeData.patientSchemeBalance[0].balance
    // Patient Acute Visit Patient Balance
    const acuteVPBal =
      schemeData.patientSchemeBalance.length <= 0
        ? undefined
        : schemeData.patientSchemeBalance[0].acuteVisitPatientBalance
    // Patient Acute Visit Clinic Balance
    const acuteVCBal =
      schemeData.patientSchemeBalance.length <= 0
        ? undefined
        : schemeData.patientSchemeBalance[0].acuteVisitClinicBalance

    const chronicStatus =
      schemeData.patientSchemeBalance.length <= 0
        ? undefined
        : schemeData.patientSchemeBalance[0].chronicBalanceStatusCode

    this.setState({
      currPatientCoPaymentSchemeFK: schemeData.id,
      currentSchemeType: schemeData.schemeTypeFK,
    })

    const { codetable } = this.props
    const { ctschemetype = [], copaymentscheme = [] } = codetable
    const schemeType = ctschemetype.find(o => o.id === schemeData.schemeTypeFK)
    const copaymentScheme = copaymentscheme.find(
      o => o.id === schemeData.coPaymentSchemeFK,
    )
    return {
      balance,
      patientCoPaymentSchemeFK: schemeData.id,
      schemeTypeFK: schemeData.schemeTypeFK,
      coPaymentSchemeFK: schemeData.coPaymentSchemeFK,
      validFrom: schemeData.validFrom,
      validTo: schemeData.validTo,
      acuteVisitPatientBalance: acuteVPBal,
      acuteVisitClinicBalance: acuteVCBal,
      statusDescription: refreshedSchemeData.statusDescription,
      acuteBalanceStatusCode:
        !_.isEmpty(refreshedSchemeData) &&
        refreshedSchemeData.isSuccessful === false
          ? 'ERROR'
          : undefined,
      chronicBalanceStatusCode:
        !_.isEmpty(refreshedSchemeData) &&
        refreshedSchemeData.isSuccessful === false
          ? 'ERROR'
          : chronicStatus,
      isSuccessful:
        refreshedSchemeData.isSuccessful !== ''
          ? refreshedSchemeData.isSuccessful
          : '',
      schemeTypeName: schemeType ? schemeType.name : undefined,
      copaymentSchemeName: copaymentScheme ? copaymentScheme.name : undefined,
    }
  }

  getSchemePayerDetails = schemePayer => {
    const { patientScheme } = this.props.patient.entity
    const schemeData = patientScheme.find(
      row => row.schemeTypeFK === schemePayer.schemeFK,
    )
    const balanceData = schemeData.patientSchemeBalance.find(
      row => row.schemePayerFK === schemePayer.id,
    )

    if (
      !_.isEmpty(this.state.refreshedSchemePayerData.payerBalanceList) &&
      this.state.refreshedSchemePayerData.isSuccessful === true
    ) {
      // return { ...this.state.refreshedSchemePayerData }

      const refreshData = this.state.refreshedSchemePayerData.payerBalanceList.find(
        row => row.schemePayerFK === schemePayer.id,
      )

      if (refreshData)
        return {
          payerName: schemePayer.payerName,
          payerAccountNo: schemePayer.payerID,
          balance: balanceData.balance >= 0 ? balanceData.balance : '-',
          patientCoPaymentSchemeFK: refreshData.finalBalance,
          schemeTypeFK: refreshData.schemeTypeFK,
          schemeType: schemePayer.schemeType,
          validFrom: schemeData.validFrom,
          validTo: schemeData.validTo,
          statusDescription: refreshData.statusDescription,
          isSuccessful:
            refreshData.isSuccessful !== '' ? refreshData.isSuccessful : '',
          schemeTypeName: '',
          copaymentSchemeName: 'Medisave',
        }
    }

    const errorData = this.state.refreshedSchemePayerData

    return {
      payerName: schemePayer.payerName,
      payerAccountNo: schemePayer.payerID,
      balance: balanceData.balance >= 0 ? balanceData.balance : '-',
      patientCoPaymentSchemeFK: balanceData.patientCopaymentSchemeFK,
      schemeTypeFK: schemePayer.schemeFK,
      schemeType: schemePayer.schemeType,
      validFrom: schemeData.validFrom,
      validTo: schemeData.validTo,
      statusDescription:
        errorData.statusDescription || schemeData.statusDescription,
      isSuccessful: errorData.isSuccessful || schemeData.isSuccessful,
      schemeTypeName: '',
      copaymentSchemeName: 'Medisave',
    }
  }

  displayMedicalProblemData(entity = { patientHistoryDiagnosis: [] }) {
    let medicalProblemData = '-'
    const { patientHistoryDiagnosis = [] } = entity

    if (patientHistoryDiagnosis.length > 0) {
      if (patientHistoryDiagnosis.length >= 2) {
        medicalProblemData = `${patientHistoryDiagnosis[0].diagnosisDescription}, ${patientHistoryDiagnosis[1].diagnosisDescription}`
      } else {
        medicalProblemData = `${patientHistoryDiagnosis[0].diagnosisDescription}`
      }
    }

    return (
      <div style={{ display: 'inline-block', marginTop: 5 }}>
        <div style={{ display: 'inline-block' }}>
          {medicalProblemData.length > 25
            ? `${medicalProblemData.substring(0, 25).trim()}...`
            : medicalProblemData}
        </div>

        {patientHistoryDiagnosis.length > 0 && (
          <Popover
            icon={null}
            content={
              <HistoryDiagnosis
                patientHistoryDiagnosis={entity.patientHistoryDiagnosis}
              />
            }
            trigger='click'
            placement='bottomLeft'
          >
            <div style={{ display: 'inline-block' }}>
              <MoreButton />
            </div>
          </Popover>
        )}
      </div>
    )
  }

  onViewPatientProfile = (event) => {
	event.preventDefault()
    const { patient, history, patientUrl, from, dispatch } = this.props
    const { entity } = patient
    const info = entity

	if(from === 'Appointment') {
		
	}

    // history.push(
    //   getAppendUrl({
    //     md: 'pt',
    //     cmt: '1',
    //     pid: info.id,
    //     v: Date.now(),
    //   }, patientUrl),
    // )
	
	this.props.dispatch({
		type: 'global/updateState',
		payload: {
		  fullscreen: true,
		  showPatientInfoPanel: true,
		},
	  })
  }

  getBannerMd =() => {
	const { from, extraCmt } = this.props
	if(from === 'Consultation')
		return 9
	if(extraCmt)
		return 11
	return 12
  }

  render() {
    const { props } = this
    const {
      // patientInfo = {},
      extraCmt,
	  preOrderCmt,
      from,
      patient,
	  patientUrl = '/patient',
      codetable,
      classes,
	  activePreOrderItem,
	  onSelectPreOrder,
	  isEnableRecurrence,
	  apptId,
	  apptMode,
      style = {
        position: 'sticky',
        overflowY: 'auto',
        top: headerHeight,
        zIndex: 998,
        paddingLeft: 16,
        paddingRight: 16,
        // maxHeight: 100,
        backgroundColor: '#f0f8ff',
        marginTop: '-8px',
      },
      refreshingChasBalance,
    } = props
	
    const actualizePreOrderAccessRight = Authorized.check('appointment.actualizepreorder') || { rights: 'hidden' }

	const onSelectPreOrders = () => {this.props.onSelectPreOrder}

    const { entity } = patient
    if (!entity)
      return (
        <Paper>
          <Skeleton variant='rect' width='100%' height={100} />
        </Paper>
      )
    const { ctsalutation = [] } = codetable
    // console.log('banner', entity)
    const info = entity
    const salt = ctsalutation.find(o => o.id === info.salutationFK) || {}
    const name = `${salt.name || ''} ${info.name}`
    /* const allergiesStyle = () => {
      return {
        color: this.state.showWarning ? 'red' : 'darkblue',
        fontWeight: 500,
      }
    } */
    const year = Math.floor(moment.duration(moment().diff(info.dob)).asYears())

    // get scheme details based on scheme type
    const schemeDataList = []
    const notMedisaveSchemes =
      entity.patientScheme && entity.patientScheme.length > 0
        ? entity.patientScheme.filter(o => !this.isMedisave(o.schemeTypeFK))
        : null
    if (notMedisaveSchemes !== null)
      notMedisaveSchemes.forEach(row => {
        schemeDataList.push(this.getSchemeDetails(row))
      })
    const medisaveSchemePayers =
      entity.schemePayer && entity.schemePayer.length > 0
        ? entity.schemePayer
        : null
    if (medisaveSchemePayers !== null)
      medisaveSchemePayers.forEach(row => {
        schemeDataList.push(this.getSchemePayerDetails(row))
      })

    const viewPatientProfileAccess = Authorized.check(
      'patientdatabase.patientprofiledetails',
    )

    const g6PD =
      codetable.ctg6pd &&
      codetable.ctg6pd.length > 0 &&
      entity.patientAllergyMetaData.length > 0
        ? codetable.ctg6pd.find(
            o => o.id === entity.patientAllergyMetaData[0].g6PDFK,
          )
        : null

    // console.log('banner-render', schemeDataList)
	console.log('info',info)
    return (
      <Paper id='patientBanner' style={style}>
        {/* Please do not change the height below (By default is 100) */}
        <GridContainer
          style={{ minHeight: 100, width: '100%', padding: '5px 0' }}
        >
          <GridItem xs={9} md={this.getBannerMd()}>
            <GridContainer>
              <GridItem xs={6} md={5} className={classes.cell}>
                <Link
                  className={classes.header}
                  style={{
                    display: 'inline-flex',
                    paddingRight: 5,
                  }}
                  to={getAppendUrl({
                    md: 'pt',
                    cmt: 1,
                    pid: info.id,
                  })}
                  disabled={
                    !viewPatientProfileAccess ||
                    (viewPatientProfileAccess &&
                      viewPatientProfileAccess.rights !== 'enable')
                  }
                  tabIndex='-1'
                >
                  <Tooltip title={name} placement='bottom-start'>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        textDecoration: 'underline',
                        display: 'inline-block',
                        width: '100%',
                        overflow: 'hidden',
						fontWeight: 500,
                      }}
					//   onClick={this.onViewPatientProfile}
                    >
                      {name}
                    </span>
                  </Tooltip>
                </Link>
                <span className={classes.part}>{info.patientAccountNo}</span>
                {', '}
                <span className={classes.part}>
                  <CodeSelect
                    className={classes.part}
                    text
                    code='ctNationality'
                    value={info.nationalityFK}
                  />
                </span>
                {', '}
                <span className={classes.part}>
                  {year > 1 ? `${year} yrs` : `${year} yr`}
                </span>
                {', '}
                <span className={classes.part}>
                  {
                    <CodeSelect
                      code='ctGender'
                      // optionLabelLength={1}
                      text
                      value={info.genderFK}
                    />
                  }
                </span>
                {', '}
                <span className={classes.part}>
                  <DatePicker
                    className={classes.part}
                    text
                    format={dateFormatLong}
                    value={info.dob}
                  />
                </span>
                <span className={classes.part}>
                  <Link className={classes.header}>
                    <span
                      onClick={e => {
                        this.openNotes()
                      }}
                    >
                      <SwitcherTwoTone />
                    </span>
                  </Link>
                </span>
              </GridItem>
              <GridItem xs={6} md={2} className={classes.cell}>
                <span className={classes.header}>Tag: </span>
                <span>
                  {info.patientTag.length > 0
                    ? info.patientTag.map(t => t.tagName).join(', ')
                    : '-'}
                </span>
              </GridItem>
              <GridItem xs={6} md={3} className={classes.cell}>
                <span
                  style={{
                    ...headerStyles,
                    color: info.patientMedicalHistory.highRiskCondition
                      ? 'red'
                      : headerStyles.color,
                  }}
                >
                  HRP:{' '}
                </span>
                <span>{info.patientMedicalHistory.highRiskCondition}</span>
              </GridItem>
              <GridItem xs={6} md={2} className={classes.cell}>
                <span
                  style={{
                    ...headerStyles,
                    color: info.outstandingBalance ? 'red' : headerStyles.color,
                  }}
                >
                  O/S Bal.:{' '}
                </span>
                <Tooltip
                  title={
                    info.outstandingBalance
                      ? `${currencySymbol}${_.round(
                          info.outstandingBalance,
                          2,
                        )}`
                      : ''
                  }
                >
                  <span
                    style={{
                      fontWeight: 500,
                      marginTop: 5,
                    }}
                  >
                    {info.outstandingBalance ? (
                      <NumberInput
                        text
                        currency
                        value={_.round(info.outstandingBalance, 2)}
                      />
                    ) : (
                      '-'
                    )}
                  </span>
                </Tooltip>
              </GridItem>
              <GridItem xs={6} md={4} className={classes.cell}>
                <span className={classes.header}>Persistent Diagnosis: </span>
                <span>
                  {info.patientHistoryDiagnosis.length > 0
                    ? info.patientHistoryDiagnosis
                        .map(d => d.diagnosisDescription)
                        .join(', ')
                    : '-'}
                </span>
              </GridItem>
              <GridItem xs={6} md={3} className={classes.cell}>
                <span className={classes.header}>Patient Request: </span>
                <span>{info.patientRequest || '-'}</span>
              </GridItem>
              <GridItem xs={6} md={3} className={classes.cell}>
                <span
                  style={{
                    ...headerStyles,
                    color: this.state.showWarning ? 'red' : headerStyles.color,
                  }}
                >
                  {this.state.showWarning && (
                    <Warning style={{ position: 'absolute' }} color='error' />
                  )}
                  <span
                    style={{
                      marginLeft: this.state.showWarning ? 20 : 'inherit',
                    }}
                  >
                    {'Allergies:'}
                  </span>
                </span>
                <span>{this.getAllergyLink('link')}</span>
                <span>{this.getAllergyData()}</span>
              </GridItem>
              <GridItem xs={6} md={2} className={classes.cell}>
                <Link className={classes.header}>
                  <span
                    style={{ textDecoration: 'underline' }}
                    onClick={e => {
                      this.openNotes()
                    }}
                  >
                    Notes
                  </span>
                </Link>
              </GridItem>
              <GridItem xs={6} md={7} className={classes.cell}>
                <span className={classes.header}>Long Term Medication: </span>
                <span>
                  {info.patientMedicalHistory.longTermMedication || '-'}
                </span>
              </GridItem>
              <GridItem xs={6} md={3} className={classes.cell}>
                <div>
                  <span className={classes.header}>G6PD: </span>
                  <span>{g6PD ? g6PD.name : '-'}</span>
                </div>
              </GridItem>
              <GridItem xs={6} md={2} className={classes.cell}>
                {actualizePreOrderAccessRight.rights !== 'hidden' && <Link 
					className={classes.header}
					disabled={actualizePreOrderAccessRight.rights === 'disable'}
				>
                  <span
                    style={{ textDecoration: 'underline' }}
                    onClick={e => {
					  e.preventDefault()
					  console.log('onlick', apptId, isEnableRecurrence, apptMode)
                      if (actualizePreOrderAccessRight.rights === 'disable') return
                      if (activePreOrderItem && activePreOrderItem.length)
                      {
                        if (apptId && apptMode === 'series') {
                          dispatch({
                            type: 'global/updateAppState',
                            payload: {
                              openConfirm: true,
                              isInformType: true,
                              openConfirmText: 'ok',
                              openConfirmContent: `Pre-Order is not allowed for entire series appointment.`,
                            },
                          })
                          return
                        }
                        if (!apptId && isEnableRecurrence) {
                          dispatch({
                            type: 'global/updateAppState',
                            payload: {
                              openConfirm: true,
                              isInformType: true,
                              openConfirmText: 'ok',
                              openConfirmContent: `Pre-Order is not allowed for recurring appointment.`,
                            },
                          })
                          return
                        }
                      }
					  this.openPreOrders()
                    }}
                  >
				  	{`Pre-Order (${activePreOrderItem ? activePreOrderItem.length : 0})`}
                  </span>
                </Link>}
              </GridItem>
              <GridItem xs={6} md={4} className={classes.cell}>
                <span className={classes.header}>Scheme: </span>
                <span>{this.getSchemeList(schemeDataList)}</span>
              </GridItem>
              <GridItem xs={6} md={3} className={classes.cell}>
                <span className={classes.header}>Non-Claimable Info: </span>
                <span>{info.nonClaimableInfo || '-'}</span>
              </GridItem>
              <GridItem xs={6} md={3} className={classes.cell}>
                <span className={classes.header}>Payment Info: </span>
                <span>{info.paymentInfo || '-'}</span>
              </GridItem>
              <GridItem xs={6} md={2} className={classes.cell}>
                <Link
                  className={classes.header}
                  style={{
                    display: 'inline-flex',
                    paddingRight: 10,
                    textDecoration: 'underline',
                  }}
                  to={getAppendUrl({
                    md: 'pt',
                    cmt: 1,
                    pid: info.id,
                  }, patientUrl)}
                  // disabled={}
                  tabIndex='-1'
                >
                  Lab Results
                </Link>
              </GridItem>
            </GridContainer>
          </GridItem>
          <GridItem xs={3} md={12 - this.getBannerMd()}>
            {extraCmt}
          </GridItem>
        </GridContainer>
        <CommonModal
          open={this.state.showNotesModal}
          title='Notes'
          onClose={this.closeNotes}
          maxWidth='lg'
        >
          <PatientNurseNotes {...this.props} />
        </CommonModal>
        <CommonModal
          open={this.state.showPreOrderModal}
          title='Pre-Orders'
          onClose={this.closePreOrders}
          maxWidth='lg'
        >
			<SelectPreOrder onSelectPreOrder={this.onSelectPreOrder} activePreOrderItem={activePreOrderItem} />
        </CommonModal>
        <CommonModal
          open={this.state.showSchemeModal}
          title='Scheme Details'
          onClose={this.closeScheme}
          maxWidth='lg'
        >
          <Paper />
        </CommonModal>
      </Paper>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Banner)
