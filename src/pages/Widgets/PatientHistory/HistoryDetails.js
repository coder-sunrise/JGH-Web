import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import {
  GridContainer,
  GridItem,
  TextField,
  DatePicker,
  CardContainer,
} from '@/components'
import Authorized from '@/utils/Authorized'
import { VISIT_TYPE } from '@/utils/constants'
import { List, ListItem, ListItemText } from '@material-ui/core'
import classnames from 'classnames'
import * as WidgetConfig from './config'

@connect(({ patientHistory }) => ({
  patientHistory,
}))
class HistoryDetails extends PureComponent {
  constructor(props) {
    super(props)

    this.widgets = WidgetConfig.widgets(
      props,
      props.scribbleNoteUpdateState,
      this.getSelectNoteTypes,
    ).filter(o => {
      if (o.id === WidgetConfig.WIDGETS_ID.DOCTORNOTE) {
        return this.getSelectNoteTypes().length > 0
      }
      return props.getCategoriesOptions().find(c => c.value === o.id)
    })
  }

  getSelectNoteTypes = () => {
    return [
      WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY,
      WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS,
      WidgetConfig.WIDGETS_ID.CLINICAL_NOTE,
      WidgetConfig.WIDGETS_ID.PLAN,
    ].filter(
      n =>
        this.props
          .getCategoriesOptions()
          .map(c => c.value)
          .indexOf(n) >= 0,
    )
  }

  componentWillMount() {
    const { selectHistory } = this.props
    const isRetailVisit = selectHistory.visitPurposeFK === VISIT_TYPE.OTC
    if (isRetailVisit) {
      this.handleRetailVisitHistory(selectHistory)
    } else
      this.props
        .dispatch({
          type: 'patientHistory/queryOne',
          payload: selectHistory.coHistory[0].id,
        })
        .then(r => {
          if (r) {
            this.props.dispatch({
              type: 'patientHistory/updateState',
              payload: {
                selectedSubRow: selectHistory.coHistory[0],
              },
            })
          }
        })
  }

  handleRetailVisitHistory = v => {
    this.props
      .dispatch({
        type: 'patientHistory/queryRetailHistory',
        payload: {
          id: v.invoiceFK,
        },
      })
      .then(r => {
        if (r) {
          this.props.dispatch({
            type: 'patientHistory/updateState',
            payload: {
              selectedSubRow: v,
            },
          })
        }
      })
  }

  leftPanel = () => {
    const { patientHistory, clinicSettings, selectHistory } = this.props
    const { settings = [] } = clinicSettings
    const { selectedSubRow } = patientHistory
    const isRetailVisit = selectHistory.visitPurposeFK === VISIT_TYPE.OTC
    let newArray = []

    if (isRetailVisit) {
      newArray.push(selectHistory)
    } else if (
      settings.showConsultationVersioning === false ||
      settings.showConsultationVersioning === undefined
    ) {
      if (selectHistory.coHistory.length >= 1) {
        newArray.push(selectHistory.coHistory[0])
      }
    } else {
      newArray = selectHistory.coHistory
    }
    return (
      <List
        component='nav'
        classes={{
          root: this.props.classes.listRoot,
        }}
        disablePadding
        onClick={() => {}}
        style={{ overflow: 'auto', height: window.innerHeight - 96 }}
      >
        {newArray.map(o => {
          const updateByUser = o.userName
            ? `${o.userTitle || ''} ${o.userName || ''}`
            : undefined
          const lastUpdateDate = moment(
            selectHistory.visitPurposeFK === VISIT_TYPE.OTC
              ? o.visitDate
              : o.signOffDate,
          ).format('DD MMM YYYY HH:mm')
          const {
            visitDate,
            timeIn,
            timeOut,
            userTitle,
            userName,
          } = selectHistory
          const docotrName = userName
            ? `${userTitle || ''} ${userName || ''}`
            : undefined
          return (
            <React.Fragment>
              <ListItem
                style={{ paddingLeft: 15 }}
                alignItems='flex-start'
                classes={{
                  root: this.props.classes.listItemRoot,
                }}
                selected={selectedSubRow && o.id === selectedSubRow.id}
                divider
                disableGutters
                button
                onClick={() => {
                  if (selectedSubRow && selectedSubRow.id === o.id) {
                    return
                  }
                  if (isRetailVisit) {
                    this.handleRetailVisitHistory(selectHistory)
                  } else
                    this.props
                      .dispatch({
                        type: 'patientHistory/queryOne',
                        payload: o.id,
                      })
                      .then(r => {
                        if (r) {
                          this.props.dispatch({
                            type: 'patientHistory/updateState',
                            payload: {
                              selectedSubRow: o,
                            },
                          })
                        }
                      })
                }}
              >
                <ListItemText
                  primary={
                    <div
                      style={{
                        width: '100%',
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {`${moment(visitDate).format(
                          'DD MMM YYYY',
                        )} (Time In: ${moment(timeIn).format(
                          'HH:mm',
                        )} Time Out: ${
                          timeOut ? moment(timeOut).format('HH:mm') : '-'
                        })${docotrName ? ` - ${docotrName}` : ''}`}
                      </div>
                      <div>
                        {settings.showConsultationVersioning && !isRetailVisit
                          ? `${selectHistory.visitPurposeName} (V${
                              o.versionNumber
                            }), Last Update By: ${updateByUser || ''}${
                              lastUpdateDate ? ` on ${lastUpdateDate}` : ''
                            }`
                          : `${
                              selectHistory.visitPurposeName
                            }, Last Update By: ${updateByUser || ''}${
                              lastUpdateDate ? ` on ${lastUpdateDate}` : ''
                            }`}
                      </div>
                    </div>
                  }
                />
              </ListItem>
            </React.Fragment>
          )
        })}
      </List>
    )
  }

  detailPanel = () => {
    const {
      classes,
      override = {},
      patientHistory,
      selectHistory,
      getCategoriesOptions,
    } = this.props
    let visitDetails = {
      visitDate: selectHistory.visitDate,
      patientName: selectHistory.patientName,
      patientAccountNo: selectHistory.patientAccountNo,
    }
    const { visitPurposeFK } = selectHistory
    let current = {
      ...patientHistory.entity,
      visitAttachments: selectHistory.visitAttachments,
      visitRemarks: selectHistory.visitRemarks,
      referralSourceFK: selectHistory.referralSourceFK,
      referralPersonFK: selectHistory.referralPersonFK,
      referralPatientProfileFK: selectHistory.referralPatientProfileFK,
      referralSource: selectHistory.referralSource,
      referralPerson: selectHistory.referralPerson,
      referralPatientName: selectHistory.referralPatientName,
      referralRemarks: selectHistory.referralRemarks,
      visitPurposeFK: visitPurposeFK,
      patientGender: selectHistory.patientGender,
    }
    return (
      <CardContainer
        hideHeader
        size='sm'
        className={classnames({
          [classes.rightPanel]: true,
          [override.rightPanel]: true,
        })}
        style={{ overflow: 'auto', height: window.innerHeight - 80 }}
      >
        <div>
          {this.widgets
            .filter(_widget => {
              if (visitPurposeFK === VISIT_TYPE.OTC) {
                return (
                  _widget.id === WidgetConfig.WIDGETS_ID.INVOICE &&
                  WidgetConfig.showWidget(current, _widget.id)
                )
              }
              return WidgetConfig.showWidget(
                current,
                _widget.id,
                [
                  WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY,
                  WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS,
                  WidgetConfig.WIDGETS_ID.CLINICAL_NOTE,
                  WidgetConfig.WIDGETS_ID.PLAN,
                ].filter(w => getCategoriesOptions().find(c => c.value === w)),
              )
            })
            .map(o => {
              const Widget = o.component
              return (
                <div>
                  <span
                    style={{
                      fontWeight: 500,
                      color: 'darkBlue',
                      fontSize: '0.85rem',
                    }}
                  >
                    {o.name}
                  </span>
                  <Widget
                    current={current}
                    visitDetails={visitDetails}
                    {...this.props}
                    setFieldValue={this.props.setFieldValue}
                  />
                </div>
              )
            })}
        </div>
      </CardContainer>
    )
  }

  render() {
    const { classes } = this.props
    return (
      <div style={{ marginLeft: 8, marginRight: 8 }}>
        <CardContainer hideHeader size='sm' className={classes.leftPanel}>
          {this.leftPanel()}
        </CardContainer>
        {this.detailPanel()}
      </div>
    )
  }
}

export default HistoryDetails
