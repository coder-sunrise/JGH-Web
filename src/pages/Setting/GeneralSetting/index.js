import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'

import { getBizSession } from '@/services/queue'

import {
  currenciesList,
  currencyRoundingList,
  currencyRoundingToTheClosestList,
  labelPrinterList,
  ReportsOnSignOff,
  ReportsOnCompletePayment,
} from '@/utils/codes'

import {
  withFormikExtend,
  Field,
  GridContainer,
  GridItem,
  CardContainer,
  Select,
  Button,
  Switch,
  Checkbox,
  CheckboxGroup,
  WarningSnackbar,
  CodeSelect,
} from '@/components'
import { navigateDirtyCheck } from '@/utils/utils'

const styles = (theme) => ({
  ...basicStyle(theme),
  boldText: {
    fontWeight: '700',
    marginTop: theme.spacing(1),
  },
  marginTop: {
    marginTop: theme.spacing(1),
  },
})

@connect(({ clinicSettings }) => ({
  clinicSettings,
}))
@withFormikExtend({
  enableReinitialize: true,

  mapPropsToValues: ({ clinicSettings }) => {
    if (
      clinicSettings.entity &&
      clinicSettings.entity.showConsultationVersioning
    ) {
      const {
        showConsultationVersioning,
        autoPrintDrugLabelOnFinalize,
        autoPrintOnSignOff,
        autoPrintOnCompletePayment,
        autoRefresh,
        defaultVisitType,
        showTotalInvoiceAmtInConsultation,
        autoPrintReportsOnCompletePayment,
        autoPrintReportsOnSignOff,
      } = clinicSettings.entity
      return {
        ...clinicSettings.entity,
        defaultVisitType: {
          ...defaultVisitType,
          settingValue: Number(defaultVisitType.settingValue),
        },
        autoRefresh: {
          ...autoRefresh,
          settingValue: autoRefresh.settingValue === 'true',
        },
        autoPrintDrugLabelOnFinalize: {
          ...autoPrintDrugLabelOnFinalize,
          settingValue:
            autoPrintDrugLabelOnFinalize && autoPrintDrugLabelOnFinalize.settingValue === 'true',
        },
        showConsultationVersioning: {
          ...showConsultationVersioning,
          settingValue: showConsultationVersioning.settingValue === 'true',
        },
        autoPrintOnSignOff: {
          ...autoPrintOnSignOff,
          settingValue: autoPrintOnSignOff && autoPrintOnSignOff.settingValue === 'true',
        },
        autoPrintOnCompletePayment: {
          ...autoPrintOnCompletePayment,
          settingValue: autoPrintOnCompletePayment && autoPrintOnCompletePayment.settingValue === 'true',
        },
        showTotalInvoiceAmtInConsultation: {
          ...showTotalInvoiceAmtInConsultation,
          settingValue: showTotalInvoiceAmtInConsultation.settingValue === 'true',
        },
        autoPrintReportsOnCompletePayment: {
          ...autoPrintReportsOnCompletePayment,
          settingValue: autoPrintReportsOnCompletePayment.settingValue.split(','),
        },
        autoPrintReportsOnSignOff: {
          ...autoPrintReportsOnSignOff,
          settingValue: autoPrintReportsOnSignOff.settingValue.split(','),
        },
      }
    }
    return clinicSettings.entity
  },

  handleSubmit: (values, { props }) => {
    const { dispatch, history } = props
    const payload = Object.keys(values).map((o) => {
      if (o === 'autoPrintReportsOnCompletePayment' || o === 'autoPrintReportsOnSignOff') {
        return {
          ...values[o],
          settingValue: values[o].settingValue.join(','),
        }
      }
      return values[o]
    })

    dispatch({
      type: 'clinicSettings/upsert',
      payload,
    }).then((r) => {
      if (r) {
        history.push('/setting')
        dispatch({
          type: 'clinicSettings/query',
        })
      }
    })
  },
  displayName: 'clinicSettings',
})
class GeneralSetting extends PureComponent {
  state = {
    hasActiveSession: false,
  }

  componentDidMount = () => {
    this.checkHasActiveSession()
    this.props.dispatch({
      type: 'clinicSettings/query',
    })
  }

  checkHasActiveSession = async () => {
    const bizSessionPayload = {
      IsClinicSessionClosed: false,
    }
    const result = await getBizSession(bizSessionPayload)
    const { data } = result.data

    this.setState(() => {
      return {
        hasActiveSession: data.length > 0,
      }
    })
  }

  render () {
    const {
      classes,
      clinicSettings,
      dispatch,
      theme,
      handleSubmit,
      values,
      ...restProps
    } = this.props
    const { hasActiveSession } = this.state
    return (
      <React.Fragment>
        {hasActiveSession && (
          <div style={{ paddingTop: 5 }}>
            <WarningSnackbar
              variant='warning'
              className={classes.margin}
              message='Active Session detected!'
            />
          </div>
        )}
        <CardContainer hideHeader>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='locale.settingValue'
                render={(args) => (
                  <Select
                    label='System Currency'
                    {...args}
                    options={currenciesList}
                    disabled
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='currencyRounding.settingValue'
                render={(args) => (
                  <Select
                    label='Currency Rounding'
                    options={currencyRoundingList}
                    {...args}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>

            <GridItem md={3}>
              <Field
                name='currencyRoundingToTheClosest.settingValue'
                render={(args) => (
                  <Select
                    label='To The Closest'
                    options={currencyRoundingToTheClosestList}
                    {...args}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='showConsultationVersioning.settingValue'
                render={(args) => (
                  <Switch
                    label='Show Consultation Versioning'
                    {...args}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='autoRefresh.settingValue'
                render={(args) => (
                  <Switch
                    label='Queue Listing Auto Refresh'
                    {...args}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={12}>
              <span style={{ position: 'relative', color: 'rgba(0, 0, 0, 0.5)', display: 'inline-block', marginTop: 8 }}>Auto Print Drug Label</span>
            </GridItem>
            <GridItem md={2} style={{ margin: 0, marginTop: -10 }}>
              <Field
                name='defaultVisitType.settingValue'
                render={(args) => (
                  <CodeSelect
                    label='Default Visit Type'
                    {...args}
                    code='ctvisitpurpose'
                    disabled={!!hasActiveSession}
                    allowClear={false}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='labelPrinterSize.settingValue'
                render={(args) => (
                  <Select
                    label='Label Printer Size'
                    options={labelPrinterList}
                    {...args}
                    disabled={!!hasActiveSession}
                    allowClear={false}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='showTotalInvoiceAmtInConsultation.settingValue'
                render={(args) => (
                  <Switch
                    label='Show Total Invoice Amount In Consultation'
                    {...args}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer className={classes.marginTop}>
            <GridItem md={3}>
              <h5 className={classes.boldText}>Auto Print</h5>
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <h5> Finalize Order </h5>
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <Field
                name='autoPrintDrugLabel.settingValue'
                render={(args) => {
                  return (
                    <Checkbox
                      label='Drug Label'
                      labelPlacement='end'
                      mode='default'
                      disabled={!!hasActiveSession}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <h5> Consultation Sign Off</h5>
            </GridItem>
            <GridItem md={3}>
              <Field
                name='autoPrintOnSignOff.settingValue'
                render={(args) => (
                  <Switch
                    {...args}
                    style={{ marginTop: 0 }}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={12}>
              <Field
                name='autoPrintReportsOnSignOff.settingValue'
                render={(args) => {
                  return (
                    <CheckboxGroup
                      valueField='code'
                      textField='description'
                      disabled={!!hasActiveSession}
                      options={ReportsOnSignOff}
                      noUnderline
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={3}>
              <h5>Complete Payment</h5>
            </GridItem>
            <GridItem md={3}>
              <Field
                name='autoPrintOnCompletePayment.settingValue'
                render={(args) => (
                  <Switch
                    {...args}
                    style={{ marginTop: 0 }}
                    disabled={!!hasActiveSession}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={12}>
              <Field
                name='autoPrintReportsOnCompletePayment.settingValue'
                render={(args) => {
                  return (
                    <CheckboxGroup
                      disabled={!!hasActiveSession}
                      valueField='code'
                      textField='description'
                      options={ReportsOnCompletePayment}
                      noUnderline
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <div
            className={classes.actionBtn}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <Button
              color='danger'
              onClick={navigateDirtyCheck({
                redirectUrl: '/setting',
              })}
              disabled={hasActiveSession}
            >
              Cancel
            </Button>

            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={hasActiveSession}
            >
              Save
            </Button>
          </div>
        </CardContainer>
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { withTheme: true })(GeneralSetting)
