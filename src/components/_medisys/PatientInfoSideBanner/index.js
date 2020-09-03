import React, { PureComponent } from 'react'
import { connect } from 'dva'
import classnames from 'classnames'
import moment from 'moment'
import _ from 'lodash'
// material ui
import { withStyles, Divider } from '@material-ui/core'
// common components
import Refresh from '@material-ui/icons/Sync'
import WarningIcon from '@material-ui/icons/Warning'
import { SchemePopover } from 'medisys-components'
import { locationQueryParameters } from '@/utils/utils'
import { getBizSession } from '@/services/queue'
import {
  NumberInput,
  CodeSelect,
  dateFormatLong,
  DatePicker,
  IconButton,
  TextField,
  Switch,
  Tooltip,
} from '@/components'
import { LoadingWrapper } from '@/components/_medisys'
import PrintLabLabelButton from './PatientLabelBtn'
// assets
import styles from './styles.js'

class PatientInfoSideBanner extends PureComponent {
  state = {
    refreshedSchemeData: {},
    patientIntoActiveSession: false,
  }

  componentDidMount = () => {
    const { entity, autoRefreshChas, allowChangePatientStatus } = this.props
    if (autoRefreshChas && entity && entity.patientScheme) {
      entity.patientScheme.filter((o) => o.schemeTypeFK <= 6).map((o) => {
        const schemeData = this.getSchemeDetails(o)
        this.refreshChasBalance(
          schemeData.patientCoPaymentSchemeFK,
          schemeData.schemeTypeFK,
        )
        return schemeData
      })
    }
    if (allowChangePatientStatus && entity)
      this.checkPatientIntoActiveSession(entity.id)
  }

  refreshChasBalance = (patientCoPaymentSchemeFK, oldSchemeTypeFK) => {
    const { dispatch, entity, setValues } = this.props
    const isSaveToDb = true

    dispatch({
      type: 'patient/refreshChasBalance',
      payload: {
        ...entity,
        patientCoPaymentSchemeFK,
        isSaveToDb,
        patientProfileId: entity.id,
      },
    }).then((result) => {
      if (result) {
        const params = locationQueryParameters()
        if (params.md !== 'visreg') {
          dispatch({
            type: 'patient/query',
            payload: {
              id: entity.id,
            },
          }).then((pat) => {
            setValues(pat)
          })
        }

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

  checkPatientIntoActiveSession = (patientId) => {
    const bizSessionPayload = {
      IsClinicSessionClosed: false,
      'Visit.PatientProfileFK': patientId,
    }
    getBizSession(bizSessionPayload).then((result) => {
      const { data: { totalRecords } } = result
      this.setState({ patientIntoActiveSession: totalRecords === 0 })
    })
  }

  getSchemeDetails = (schemeData) => {
    if (
      !_.isEmpty(this.state.refreshedSchemeData) &&
      this.state.refreshedSchemeData.isSuccessful === true
    ) {
      return { ...this.state.refreshedSchemeData }
    }

    let balance = ''
    let acuteVPBal = ''
    let acuteVCBal = ''
    let chronicStatus = ''

    if (!schemeData.isNew) {
      // Scheme Balance
      balance =
        schemeData.patientSchemeBalance.length <= 0
          ? undefined
          : schemeData.patientSchemeBalance[0].balance
      // Patient Acute Visit Patient Balance
      acuteVPBal =
        schemeData.patientSchemeBalance.length <= 0
          ? undefined
          : schemeData.patientSchemeBalance[0].acuteVisitPatientBalance
      // Patient Acute Visit Clinic Balance
      acuteVCBal =
        schemeData.patientSchemeBalance.length <= 0
          ? undefined
          : schemeData.patientSchemeBalance[0].acuteVisitClinicBalance

      chronicStatus =
        schemeData.patientSchemeBalance.length <= 0
          ? undefined
          : schemeData.patientSchemeBalance[0].chronicBalanceStatusCode
    }

    return {
      balance,
      patientCoPaymentSchemeFK: schemeData.id,
      schemeTypeFK: schemeData.schemeTypeFK,
      validFrom: schemeData.validFrom,
      validTo: schemeData.validTo,
      acuteVisitPatientBalance: acuteVPBal,
      acuteVisitClinicBalance: acuteVCBal,
      statusDescription: this.state.refreshedSchemeData.statusDescription,
      acuteBalanceStatusCode:
        !_.isEmpty(this.state.refreshedSchemeData) &&
        this.state.refreshedSchemeData.isSuccessful === false
          ? 'ERROR'
          : undefined,
      chronicBalanceStatusCode:
        !_.isEmpty(this.state.refreshedSchemeData) &&
        this.state.refreshedSchemeData.isSuccessful === false
          ? 'ERROR'
          : chronicStatus,
      isSuccessful:
        this.state.refreshedSchemeData.isSuccessful !== ''
          ? this.state.refreshedSchemeData.isSuccessful
          : '',
    }
  }

  render () {
    const {
      height,
      theme,
      classes,
      entity,
      loading,
      clinicSettings,
      allowChangePatientStatus,
      onActiveStatusChange,
      dispatch,
    } = this.props

    const entityNameClass = classnames({
      [classes.cardCategory]: true,
      [classes.entityName]: true,
      [classes.isInActive]: !entity || !entity.isActive,
    })

    return entity && entity.id ? (
      <React.Fragment>
        <h4 className={entityNameClass}>
          {!entity.isActive && (
            <Tooltip title={entity.isActive ? 'Active' : 'Inactive'}>
              <WarningIcon />
            </Tooltip>
          )}
          <CodeSelect
            // authority='none'
            text
            code='ctSalutation'
            value={entity.salutationFK}
          />&nbsp;
          {entity.name}
        </h4>
        <p>{entity.patientReferenceNo}</p>
        <p>
          {entity.patientAccountNo},&nbsp;
          <CodeSelect text code='ctNationality' value={entity.nationalityFK} />
        </p>

        <p>
          <DatePicker text format={dateFormatLong} value={entity.dob} />
          ({Math.floor(
            moment.duration(moment().diff(entity.dob)).asYears(),
          )},&nbsp;
          <CodeSelect
            code='ctGender'
            // optionLabelLength={1}
            text
            value={entity.genderFK}
          />)
        </p>
        <div style={{ display: 'inline-flex' }}>
          <PrintLabLabelButton
            patientId={entity.id}
            clinicSettings={clinicSettings}
            isEnableScanner
          />
          {allowChangePatientStatus &&
          this.state.patientIntoActiveSession && (
            <div
              style={{
                width: 100,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Switch
                checked={entity.isActive}
                checkedChildren='Active'
                unCheckedChildren='Inactive'
                onClick={(e) => {
                  if (e === false) {
                    dispatch({
                      type: 'global/updateAppState',
                      payload: {
                        openConfirm: true,
                        openConfirmContent: `Are you sure want to inactive this patient?`,
                        onConfirmSave: () => onActiveStatusChange(e),
                      },
                    })
                  } else onActiveStatusChange(true)
                }}
              />
            </div>
          )}
        </div>
        <Divider light />
        <div
          className={classes.schemeContainer}
          style={{ maxHeight: height - 455 - 20 }}
        >
          {entity.patientScheme
            .filter((o) => o.schemeTypeFK <= 6 && !o.isDeleted)
            .map((o) => {
              const schemeData = this.getSchemeDetails(o)

              return (
                <LoadingWrapper loading={loading} text='Retrieving balance...'>
                  <div style={{ marginBottom: theme.spacing(1) }}>
                    <p style={{ fontWeight: 500 }}>
                      {/* <CodeSelect text code='ctSchemeType' value={o.schemeTypeFK} /> */}
                      <CodeSelect
                        text
                        code='ctSchemeType'
                        value={schemeData.schemeTypeFK}
                      />
                      <IconButton>
                        <Refresh
                          onClick={() =>
                            this.refreshChasBalance(
                              schemeData.patientCoPaymentSchemeFK,
                              schemeData.schemeTypeFK,
                            )}
                        />
                      </IconButton>

                      <SchemePopover
                        isShowReplacementModal={
                          schemeData.isShowReplacementModal
                        }
                        handleRefreshChasBalance={() =>
                          this.refreshChasBalance(
                            schemeData.patientCoPaymentSchemeFK,
                            schemeData.schemeTypeFK,
                          )}
                        entity={entity}
                        schemeData={schemeData}
                      />
                    </p>
                    {schemeData.validFrom && (
                      <div>
                        <p>
                          {schemeData.chronicBalanceStatusCode !== 'SC105' ? (
                            <NumberInput
                              prefix='Balance:'
                              text
                              currency
                              value={schemeData.balance}
                            />
                          ) : (
                            <TextField
                              text
                              prefix='Balance:'
                              value='Full Balance'
                            />
                          )}
                        </p>
                        <p>
                          <DatePicker
                            prefix='Validity:'
                            text
                            format={dateFormatLong}
                            // value={o.validFrom}
                            value={schemeData.validFrom}
                          />&nbsp; -&nbsp;
                          <DatePicker
                            text
                            format={dateFormatLong}
                            // value={o.validTo}
                            value={schemeData.validTo}
                          />
                        </p>
                        <p style={{ color: 'red' }}>
                          {schemeData.statusDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </LoadingWrapper>
              )
            })}
        </div>
        {entity.patientScheme.filter((o) => o.schemeTypeFK <= 5).length > 0 && (
          <Divider light />
        )}
      </React.Fragment>
    ) : null
  }
}
const ConnectedPatientInfoSideBanner = connect(
  ({ loading, clinicSettings }) => ({
    loading: loading.models.patient,
    clinicSettings: clinicSettings.settings,
  }),
)(PatientInfoSideBanner)

export default withStyles(styles, {
  withTheme: true,
  name: 'PatientInfoSideBanner',
})(ConnectedPatientInfoSideBanner)
