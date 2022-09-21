import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core'
import { Button, CommonModal, GridContainer, GridItem } from '@/components'

import CHASCardReplacement from '@/components/_medisys/SchemePopover/CHASCardReplacement'
import { locationQueryParameters } from '@/utils/utils'
import SchemesGrid from './SchemesGrid'
import PayersGrid from './PayersGrid'
import CopayerDetails from '@/pages/Setting/Company/CopayerDetails'

const styles = () => ({})
class Schemes extends PureComponent {
  state = {
    showReplacementModal: false,
    refreshedSchemeData: {},
    targetPrintId: undefined,
    showCopayerDetailModal: false,
  }

  handleReplacementModalVisibility = (show = false) => {
    this.setState({
      showReplacementModal: show,
    })
  }

  prepareReplacementModel = (
    result,
    oldSchemeTypeFK,
    patientCoPaymentSchemeFK,
  ) => {
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

    if (!isSuccessful) {
      this.setState({
        refreshedSchemeData: {
          statusDescription,
          isSuccessful,
        },
      })
    } else {
      if (oldSchemeTypeFK !== schemeTypeFk && oldSchemeTypeFK !== 0) {
        this.handleReplacementModalVisibility(true)
      }
      this.setState({
        refreshedSchemeData: {
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

  isMedisave = schemeTypeFK => {
    if (schemeTypeFK) return [12, 13, 14].indexOf(schemeTypeFK) >= 0
    return false
  }

  toggleCopayerDetailModal = () => {
    this.setState({
      ...this.state,
      showCopayerDetailModal: !this.state.showCopayerDetailModal,
    })
  }
  closeCopayerDetail = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'copayerDetail/updateState',
      payload: {
        entity: undefined,
      },
    })
    this.toggleCopayerDetailModal()
  }
  createNewScheme = (result, values) => {
    let newPatientScheme = {}
    newPatientScheme.isNew = true
    newPatientScheme.validRange = []
    newPatientScheme.validFrom = result.validFrom
    newPatientScheme.validTo = result.validTo
    newPatientScheme.validRange.push(result.validFrom)
    newPatientScheme.validRange.push(result.validTo)
    newPatientScheme.schemeTypeFK = result.schemeTypeFk
    newPatientScheme.accountNumber = result.PatientNric
    newPatientScheme.coPaymentScheme = undefined
    values.patientScheme.push(newPatientScheme)
  }

  refreshChasBalance = (
    patientCoPaymentSchemeFK,
    oldSchemeTypeFK,
    isSaveToDb,
  ) => {
    const { values, dispatch } = this.props
    const { patientAccountNo, id } = values

    dispatch({
      type: 'patient/refreshChasBalance',
      payload: {
        patientAccountNo,
        patientCoPaymentSchemeFK,
        isSaveToDb,
        patientProfileId: id,
      },
    }).then(result => {
      this.prepareReplacementModel(
        result,
        oldSchemeTypeFK,
        patientCoPaymentSchemeFK,
      )

      if (result && result.schemeTypeFk) {
        let chasScheme = values.patientScheme.filter(
          x => x.schemeTypeFK <= 6 && !x.isDeleted,
        )
        let isNewChasScheme = false

        if (chasScheme && chasScheme.length > 0) {
          let chasSchemeObject = chasScheme[0]

          if (chasSchemeObject.schemeTypeFK === result.schemeTypeFk) {
            // If same scheme type , update valid from and to date
            chasSchemeObject.validFrom = result.validFrom
            chasSchemeObject.validTo = result.validTo
            chasSchemeObject.validRange = []
            chasSchemeObject.validRange.push(result.validFrom)
            chasSchemeObject.validRange.push(result.validTo)

            if (
              chasSchemeObject._errors &&
              chasSchemeObject._errors.length > 0
            ) {
              const errorsLength = chasSchemeObject._errors.length
              chasSchemeObject._errors.splice(0, errorsLength)
            }
          } else {
            // Delete old chas Scheme and allow add new Scheme
            chasScheme[0].isDeleted = true
            isNewChasScheme = true
          }
        } else {
          // No chas scheme , allow add new Scheme
          isNewChasScheme = true
        }

        if (isNewChasScheme) {
          // Add a new Scheme to Grid
          this.createNewScheme(result, values)
        }
      } else {
        let ChasScheme = values.patientScheme.filter(
          x => x.schemeTypeFK <= 6 && !x.isDeleted,
        )
      }

      dispatch({
        type: 'patient/updateState',
        payload: {
          patientScheme: values.patientScheme,
        },
      })
    })
  }

  onPrintButtonClick = id => {
    this.setState({ targetPrintId: id })
  }
  render() {
    const {
      classes,
      schemes,
      payers,
      dispatch,
      values,
      schema,
      entity,
      theme,
      setValues,
      global,
      ...restProps
    } = this.props

    const { disableSave } = global
    const { patientScheme } = values

    const params = locationQueryParameters()
    const isCreatingPatient = params.new
    let isSaveToDb = !isCreatingPatient

    const SchemeData = patientScheme.filter(
      o => o.schemeTypeFK <= 6 && !o.isDeleted,
    )
    let tempPatientCoPaymentSchemeFK = 0
    let tempSchemeTypeFK = 0

    if (SchemeData && SchemeData[0]) {
      const { patientCoPaymentSchemeFK, schemeTypeFK } = SchemeData[0]

      tempPatientCoPaymentSchemeFK = SchemeData[0].id

      tempSchemeTypeFK = schemeTypeFK
    }

    const { isEnableCHAS } = this.props.clinicSettings
    return (
      <div>
        <div>
          <GridContainer>
            <GridItem md={6}>
              <h4>Schemes</h4>
            </GridItem>
            <GridItem md={4} style={{ color: 'red' }}>
              {this.state.refreshedSchemeData &&
              !this.state.refreshedSchemeData.isSuccessful
                ? this.state.refreshedSchemeData.statusDescription
                : ''}
            </GridItem>
            <GridItem md={2}>
              {isEnableCHAS && (
                <Button
                  color='primary'
                  size='sm'
                  style={{ float: 'right' }}
                  onClick={() =>
                    this.refreshChasBalance(
                      tempPatientCoPaymentSchemeFK,
                      tempSchemeTypeFK,
                      isSaveToDb,
                    )
                  }
                  disabled={disableSave}
                >
                  Get CHAS
                </Button>
              )}
            </GridItem>
          </GridContainer>
        </div>
        <SchemesGrid
          rows={values.patientScheme}
          schema={schema.patientScheme._subType}
          values={values}
          targetPrintId={this.state.targetPrintId}
          onPrintButtonClick={this.onPrintButtonClick}
          entity={entity}
          toggleCopayerDetailModal={this.toggleCopayerDetailModal}
          {...restProps}
        />
        <CommonModal
          open={this.state.showReplacementModal}
          title='CHAS Card Replacement'
          maxWidth='sm'
          onConfirm={() => this.handleReplacementModalVisibility(false)}
          onClose={() => this.handleReplacementModalVisibility(false)}
        >
          <CHASCardReplacement
            entity={values}
            refreshedSchemeData={this.state.refreshedSchemeData}
            handleOnClose={() => this.handleReplacementModalVisibility(false)}
          />
        </CommonModal>
        <CommonModal
          open={this.state.showCopayerDetailModal}
          title='Co-Payer Details'
          onClose={this.closeCopayerDetail}
          onConfirm={this.closeCopayerDetail}
          fullScreen
        >
          <CopayerDetails fromCommonModal />
        </CommonModal>
        <div
          style={{
            display:
              values.patientScheme.filter(
                o => this.isMedisave(o.schemeTypeFK) && !o.isDeleted,
              ).length > 0
                ? ''
                : 'none',
          }}
        >
          <h4
            style={{
              marginTop: theme.spacing(2),
              marginLeft: theme.spacing(1),
            }}
          >
            Medisave Payer
          </h4>
          <PayersGrid
            enableAdd={
              values.patientScheme
                ? values.patientScheme.find(
                    o => this.isMedisave(o.schemeTypeFK) && !o.isDeleted,
                  )
                : false
            }
            rows={values.schemePayer}
            schema={schema.schemePayer._subType}
            values={values}
            {...restProps}
          />
        </div>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Schemes)
