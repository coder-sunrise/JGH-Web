/* eslint-disable no-nested-ternary */
import React, { Component } from 'react'
import { Collapse } from 'antd'
import _ from 'lodash'
import moment from 'moment'
import { Edit, Print } from '@material-ui/icons'
import SvgIcon from '@material-ui/core/SvgIcon'
import { connect } from 'dva'
import { history, formatMessage } from 'umi'
import { InvoiceReplacement } from '@/components/Icon/customIcons'
import { Field } from 'formik'
import numeral from 'numeral'
import Search from '@material-ui/icons/Search'
import { VisitTypeTag } from '@/components/_medisys'
// material ui
import { withStyles, Link } from '@material-ui/core'
import { Tooltip } from '@/components'
// common components
import {
  CardContainer,
  withFormikExtend,
  CommonModal,
  Button,
  Checkbox,
  ProgressButton,
  CodeSelect,
  DateRangePicker,
  VisitTypeSelect,
  dateFormatLong,
  dateFormatLongWithTimeNoSec,
  timeFormat24Hour,
} from '@/components'
import Authorized from '@/utils/Authorized'
// utils
import { findGetParameter, commonDataReaderTransform } from '@/utils/utils'
import { VISIT_TYPE, CLINIC_TYPE } from '@/utils/constants'
import { scribbleTypes } from '@/utils/codes'
import { DoctorProfileSelect, ServePatientButton } from '@/components/_medisys'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { getReportContext } from '@/services/report'
import { getFileContentByFileID } from '@/services/file'
import * as WidgetConfig from './config'
import ScribbleNote from '../../Shared/ScribbleNote/ScribbleNote'
import HistoryDetails from './HistoryDetails'
import customtyles from './PatientHistoryStyle.less'
import NurseActualization from '@/pages/Dispense/DispenseDetails/NurseActualization'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { getMedicalCheckupReportPayload } from '@/pages/MedicalCheckup/Worklist/components/Util'

const defaultValue = {
  visitDate: [
    moment(new Date())
      .startOf('day')
      .toDate(),
    moment(new Date())
      .endOf('day')
      .toDate(),
  ],
  selectDoctors: [],
  visitTypeIDs: [-99],
  selectCategories: [],
  isAllDate: true,
}

const styles = theme => ({
  root: {},
  hide: {
    display: 'none',
  },
  title: {
    fontSize: '1em',
  },
  note: {
    fontSize: '0.85em',
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
    fontSize: '0.85em',
  },
  listItemDate: {
    position: 'absolute',
    right: '21%',
  },
  paragraph: {
    marginLeft: theme.spacing(1),
    fontSize: '0.85em',
  },
  leftPanel: {
    position: 'sticky',
    width: 400,
    top: 0,
    float: 'left',
    marginRight: theme.spacing(1),
    marginTop: 0,
  },
  rightPanel: {
    marginTop: 0,

    '& h5': {
      textDecoration: 'underline',
      marginTop: theme.spacing(2),
      fontSize: '1em',
    },
  },
  integratedLeftPanel: {
    width: '100%',
  },
  rightIcon: {
    position: 'relative',
    fontWeight: 600,
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 3px',
    height: 20,
    cursor: 'pointer',
    margin: '0px 1px',
    lineHeight: '16px',
  },
})
@connect(
  ({
    clinicInfo,
    clinicSettings,
    codetable,
    user,
    scriblenotes,
    patient,
    patientHistory,
    global,
  }) => ({
    clinicSettings,
    codetable,
    user,
    clinicInfo,
    scriblenotes,
    patient: patient.entity || patient.default,
    patientHistory,
    global,
  }),
)
@withFormikExtend({
  enableReinitialize: true,
  mapPropsToValues: () => ({
    ...defaultValue,
  }),
})
class PatientHistory extends Component {
  constructor(props) {
    super(props)
    this.widgets = WidgetConfig.widgets(
      props,
      this.scribbleNoteUpdateState,
      this.getSelectNoteTypes,
    ).filter(o => {
      if (o.id === WidgetConfig.WIDGETS_ID.DOCTORNOTE) {
        return this.getCategoriesOptions().find(
          c =>
            [
              WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY,
              WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS,
              WidgetConfig.WIDGETS_ID.CLINICAL_NOTE,
              WidgetConfig.WIDGETS_ID.PLAN,
            ].indexOf(c.value) >= 0,
        )
      }
      return this.getCategoriesOptions().find(c => c.value === o.id)
    })

    this.state = {
      selectedData: '',
      showHistoryDetails: false,
      selectHistory: undefined,
      activeKey: [],
      selectItems: [],
      visitDate: [
        moment(new Date())
          .startOf('day')
          .toDate(),
        moment(new Date())
          .endOf('day')
          .toDate(),
      ],
      selectDoctors: [],
      selectCategories: [],
      visitTypeIDs: [],
      isAllDate: true,
      pageIndex: 0,
      loadVisits: [],
      totalVisits: 0,
      currentHeight: window.innerHeight,
      isLoadingData: true,
      currentOrders: [],
      showActualizationHistory: false,
    }
  }

  componentWillMount() {
    const { dispatch } = this.props

    dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctg6pd' },
    })

    dispatch({
      type: 'codetable/fetchCodes',
      payload: { code: 'ctcomplication' },
    })

    dispatch({
      type: 'patientHistory/initState',
      payload: {
        queueID: Number(findGetParameter('qid')) || 0,
        version: Number(findGetParameter('v')) || undefined,
        visitID: findGetParameter('visit'),
        patientID: Number(findGetParameter('pid')) || 0,
      },
    }).then(() => {
      dispatch({
        type: 'patientHistory/getUserPreference',
        payload: {},
      }).then(result => {
        const { setFieldValue, clinicSettings } = this.props
        let selectCategories = [
          -99,
          ...this.getCategoriesOptions().map(o => o.value),
        ]
        if (result) {
          selectCategories = result
            .find(xx => xx.Identifier === 'SelectCategories')
            .SelectCategories.filter(o => selectCategories.find(c => c === o))
          let preferVisitTypeIDs =
            result.find(tt => tt.Identifier === 'SelectedVisitTypeIDs')
              ?.SelectedVisitTypeIDs || []

          const visitTypeSetting = JSON.parse(
            clinicSettings.settings.visitTypeSetting,
          )
          preferVisitTypeIDs = _.intersection(
            preferVisitTypeIDs,
            visitTypeSetting.filter(x => x.isEnabled === 'true').map(x => x.id),
          )
          this.setState({ visitTypeIDs: preferVisitTypeIDs }, () => {
            setFieldValue('visitTypeIDs', preferVisitTypeIDs)
          })
        }
        this.setState({ selectCategories }, () => {
          setFieldValue('selectCategories', selectCategories)
        })
        this.queryVisitHistory(5)
      })
    })
  }

  componentDidMount() {
    window.addEventListener('resize', () => {
      this.setState({ currentHeight: window.innerHeight })
    })
  }

  getCategoriesOptions = () => {
    const { clinicInfo, clinicSettings } = this.props
    const { clinicTypeFK = CLINIC_TYPE.GP } = clinicInfo
    let categories = []
    if (clinicTypeFK === CLINIC_TYPE.GP) {
      categories = WidgetConfig.GPCategory
    } else if (clinicTypeFK === CLINIC_TYPE.DENTAL) {
      categories = WidgetConfig.DentalCategory
    } else if (clinicTypeFK === CLINIC_TYPE.EYE) {
      categories = WidgetConfig.EyeCategory
    }

    const { settings = {} } = clinicSettings
    const {
      isEnableClinicNoteHistory = false,
      isEnableClinicNoteChiefComplaints = false,
      isEnableClinicNotes = false,
      isEnableClinicNotePlan = false,
    } = settings
    categories = categories.filter(
      c =>
        (c !== WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY ||
          isEnableClinicNoteHistory) &&
        (c !== WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS ||
          isEnableClinicNoteChiefComplaints) &&
        (c !== WidgetConfig.WIDGETS_ID.CLINICAL_NOTE || isEnableClinicNotes) &&
        (c !== WidgetConfig.WIDGETS_ID.PLAN || isEnableClinicNotePlan),
    )

    return WidgetConfig.categoryTypes
      .filter(o => {
        const accessRight = Authorized.check(o.authority)
        if (!accessRight || accessRight.rights === 'hidden') return false

        if (categories.find(c => c === o.value)) {
          return true
        }
        return false
      })
      .map(o => {
        return { ...o }
      })
  }

  queryVisitHistory = pageSize => {
    const {
      isAllDate,
      pageIndex,
      selectDoctors = [],
      visitDate,
      visitTypeIDs = [],
      selectCategories = [],
    } = this.state
    const {
      dispatch,
      clinicSettings,
      patientHistory,
      setFieldValue,
      values,
    } = this.props
    const { settings = {} } = clinicSettings
    const { viewVisitPageSize = 10 } = settings

    let visitFromDate
    let visitToDate
    if (visitDate && visitDate.length > 0) {
      visitFromDate = visitDate[0]
    }

    if (visitDate && visitDate.length > 1) {
      visitToDate = visitDate[1]
    }
    let searchCategories
    if (!selectCategories.length) {
      searchCategories = this.getCategoriesOptions()
        .map(v => v.value)
        .join(',')
    } else {
      searchCategories = selectCategories.join(',')
    }
    dispatch({
      type: 'patientHistory/queryVisitHistory',
      payload: {
        visitFromDate: visitFromDate
          ? moment(visitFromDate)
              .startOf('day')
              .formatUTC()
          : undefined,
        visitToDate: visitToDate
          ? moment(visitToDate)
              .endOf('day')
              .formatUTC(false)
          : undefined,
        isAllDate,
        visitTypeIDs: visitTypeIDs.join(','),
        pageIndex: pageIndex + 1,
        pageSize: pageSize || viewVisitPageSize,
        patientProfileId: patientHistory.patientID,
        selectDoctors: selectDoctors.join(','),
        searchCategories,
        isViewNurseNote:
          selectCategories.length === 0 ||
          !_.isEmpty(
            selectCategories.find(
              o => o === WidgetConfig.WIDGETS_ID.NURSENOTES,
            ),
          ),
      },
    }).then(r => {
      if (r) {
        this.setState(preState => {
          const list = (r.list || []).map(o => {
            return {
              ...o,
              currentId: `${o.isNurseNote ? 'NurseNote' : 'Visit'}-${o.id}`,
            }
          })
          const currentVisits = [...preState.loadVisits, ...list]
          return {
            ...preState,
            loadVisits: currentVisits,
            totalVisits: r.totalVisits,
            pageIndex: preState.pageIndex + 1,
            activeKey: [...preState.activeKey, ...list.map(o => o.currentId)],
            isLoadingData: false,
          }
        })
        if (values.isSelectAll) setFieldValue('isSelectAll', false)
      }
    })
  }

  selectOnChange = (e, row) => {
    const { setFieldValue, values } = this.props
    if (e.target.value) {
      this.setState(
        preState => {
          const currentSelectItem = [...preState.selectItems, row.currentId]
          return { ...preState, selectItems: currentSelectItem }
        },
        () => {
          if (this.state.selectItems.length === this.state.loadVisits.length)
            setFieldValue('isSelectAll', true)
        },
      )
    } else {
      this.setState(
        preState => {
          const currentSelectItem = preState.selectItems.filter(
            o => o !== row.currentId,
          )
          return { ...preState, selectItems: currentSelectItem }
        },
        () => {
          if (values.isSelectAll) setFieldValue('isSelectAll', false)
        },
      )
    }
  }

  getTitle = row => {
    const {
      theme,
      patientHistory,
      dispatch,
      codetable,
      user,
      clinicSettings,
      patient = {},
      fromModule,
      global,
    } = this.props
    const {
      userTitle,
      userName,
      visitDate,
      signOffDate,
      visitPurposeFK,
      timeIn,
      timeOut,
      isForInvoiceReplacement,
      visitPurposeName,
      coHistory = [],
      isNurseNote,
      visitStatus,
      medicalCheckupWorkitemFK,
      isExistsVerifiedReport,
    } = row
    const { settings = [] } = clinicSettings
    const { patientID, ableToEditConsultation } = patientHistory
    const isRetailVisit = visitPurposeFK === VISIT_TYPE.OTC
    const patientIsActive = patient.isActive
    const docotrName = userName
      ? `${userTitle || ''} ${userName || ''}`
      : undefined
    let LastUpdateBy
    if (coHistory.length > 0) {
      LastUpdateBy = coHistory[0].userName
        ? `${coHistory[0].userTitle || ''} ${coHistory[0].userName || ''}`
        : undefined
    } else {
      LastUpdateBy = userName
        ? `${userTitle || ''} ${userName || ''}`
        : undefined
    }
    const isSelect = !!this.state.selectItems.find(o => o === row.currentId)
    return (
      <div
        style={{
          padding: '5px 0px 4px 0px',
          height: 40,
        }}
        onClick={() => {
          this.setState(preState => {
            if (preState.activeKey.find(key => key === row.currentId)) {
              return {
                ...preState,
                activeKey: preState.activeKey.filter(
                  key => key !== row.currentId,
                ),
              }
            }
            return {
              ...preState,
              activeKey: [...preState.activeKey, row.currentId],
            }
          })
        }}
      >
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {fromModule !== 'Consultation' && (
              <div
                style={{
                  marginTop:
                    fromModule === 'History' || fromModule === 'MedicalCheckup'
                      ? -12
                      : -16,
                  height: 24,
                  width: 30,
                }}
                onClick={event => {
                  event.stopPropagation()
                }}
              >
                <Checkbox
                  label=''
                  checked={isSelect}
                  onChange={e => this.selectOnChange(e, row)}
                  style={{ width: 20, position: 'relative', top: 3 }}
                />
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: fromModule !== 'Consultation' ? -14 : 0,
            }}
          >
            <span
              className='material-icons'
              style={{ position: 'relative', top: 3 }}
            >
              {this.state.activeKey.find(key => key === row.currentId)
                ? 'expand_more'
                : 'navigate_next'}
            </span>
          </div>
          {isNurseNote && (
            <div style={{ fontSize: '0.9em', fontWeight: 500, marginTop: 14 }}>
              {`${moment(visitDate).format(
                dateFormatLongWithTimeNoSec,
              )} - Notes${docotrName ? ` - ${docotrName}` : ''}`}
            </div>
          )}
          {!isNurseNote && (
            <div style={{ fontSize: '0.9em' }}>
              <div style={{ fontWeight: 500, marginTop: 6 }}>
                {`${moment(visitDate).format(
                  dateFormatLong,
                )} (Time In: ${moment(timeIn).format(
                  timeFormat24Hour,
                )} Time Out: ${
                  timeOut ? moment(timeOut).format(timeFormat24Hour) : '-'
                })${docotrName ? ` - ${docotrName}` : ''}`}
              </div>
              <div style={{ marginTop: 18 }}>
                <span>
                  {`Last Update By: ${LastUpdateBy || ''} on ${moment(
                    signOffDate,
                  ).format(dateFormatLongWithTimeNoSec)}`}
                </span>
                <span style={{ marginLeft: 5 }}>
                  {row.servingByList?.length > 0
                    ? `Served by ${row.servingByList
                        .map(x => x.servingBy)
                        .join(', ')}.`
                    : null}
                </span>
              </div>
            </div>
          )}
          {!isNurseNote && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {patientIsActive &&
                !isRetailVisit &&
                visitStatus != VISIT_STATUS.PAUSED &&
                fromModule !== 'Consultation' &&
                fromModule !== 'History' &&
                ableToEditConsultation &&
                fromModule !== 'MedicalCheckup' && (
                  <Authorized authority='patientdashboard.editconsultation'>
                    <Tooltip title='Edit Consultation'>
                      <Button
                        color='primary'
                        style={{
                          marginLeft: theme.spacing(2),
                          position: 'relative',
                          top: 3,
                        }}
                        size='sm'
                        justIcon
                        onClick={event => {
                          event.stopPropagation()
                          const closeOtherPopup = () => {
                            if (global.showVisitRegistration) {
                              dispatch({
                                type: 'visitRegistration/closeModal',
                              })
                            }
                            if (global.showMedicalCheckupReportingDetails) {
                              dispatch({
                                type:
                                  'medicalCheckupReportingDetails/closeMedicalCheckupReportingDetailsModal',
                              })
                            }
                            dispatch({
                              type: 'patient/closePatientModal',
                            })
                          }

                          dispatch({
                            type: `consultation/edit`,
                            payload: {
                              id: row.id,
                              version: patientHistory.version,
                            },
                          }).then(o => {
                            if (o) {
                              if (o.updateByUserFK !== user.data.id) {
                                const { clinicianprofile = [] } = codetable
                                const version = Date.now()
                                const editingUser = clinicianprofile.find(
                                  m => m.userProfileFK === o.updateByUserFK,
                                ) || {
                                  name: 'Someone',
                                }
                                dispatch({
                                  type: 'global/updateAppState',
                                  payload: {
                                    openConfirm: true,
                                    openConfirmContent: `${editingUser.name} is currently editing the patient note, do you want to overwrite?`,
                                    onConfirmSave: () => {
                                      dispatch({
                                        type: `consultation/overwrite`,
                                        payload: {
                                          id: row.id,
                                          version,
                                        },
                                      }).then(c => {
                                        closeOtherPopup()
                                        history.push(
                                          `/reception/queue/consultation?qid=${row.queueFK}&pid=${patientID}&cid=${c.id}&v=${version}`,
                                        )
                                      })
                                    },
                                  },
                                })
                              } else {
                                closeOtherPopup()
                                history.push(
                                  `/reception/queue/consultation?qid=${
                                    row.queueFK
                                  }&pid=${patientID}&cid=${
                                    o.id
                                  }&v=${patientHistory.version || Date.now()}`,
                                )
                              }
                            }
                          })
                        }}
                      >
                        <Edit />
                      </Button>
                    </Tooltip>
                  </Authorized>
                )}
            </div>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        >
          {isExistsVerifiedReport && (
            <div style={{ display: 'inline-block' }}>
              <Tooltip title='Medical Checkup Report'>
                <Button
                  color='primary'
                  icon={null}
                  size='sm'
                  onClick={event => {
                    event.stopPropagation()
                    this.handelPrintMedicalCheckup(medicalCheckupWorkitemFK)
                  }}
                >
                  <Print />
                  MC Report
                </Button>
              </Tooltip>
            </div>
          )}
          {isForInvoiceReplacement && (
            <Tooltip title='For Invoice Replacement'>
              <div
                style={{
                  display: 'inline-block',
                  marginRight: 10,
                  position: 'relative',
                  top: 6,
                }}
              >
                <InvoiceReplacement />
              </div>
            </Tooltip>
          )}
          <div style={{ display: 'inline-block', width: 40, marginRight: 10 }}>
            {visitPurposeFK && <VisitTypeTag type={visitPurposeFK} />}
          </div>
          <div
            style={{
              display: 'inline-block',
              width: 24,
              position: 'relative',
              top: 8,
              height: 24,
              marginRight: 6,
            }}
          >
            {!isNurseNote &&
              settings.showConsultationVersioning &&
              !isRetailVisit && (
                <Tooltip title='View History'>
                  <span
                    className='material-icons'
                    style={{ color: 'gray' }}
                    onClick={event => {
                      event.stopPropagation()
                      this.setState({
                        showHistoryDetails: true,
                        selectHistory: { ...row },
                      })
                    }}
                  >
                    history
                  </span>
                </Tooltip>
              )}
          </div>
        </div>
      </div>
    )
  }

  checkSelectWidget = widgetId => {
    const { selectCategories = [] } = this.state
    if (selectCategories.length > 0) {
      if (widgetId === WidgetConfig.WIDGETS_ID.DOCTORNOTE)
        return selectCategories.find(
          c =>
            [
              WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY,
              WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS,
              WidgetConfig.WIDGETS_ID.CLINICAL_NOTE,
              WidgetConfig.WIDGETS_ID.PLAN,
            ].indexOf(c) >= 0,
        )
      return selectCategories.find(c => c === widgetId) || false
    }
    return true
  }

  viewActualizationHistory = orders => {
    this.setState({
      currentOrders: orders,
      showActualizationHistory: true,
    })
  }

  closeActualizationHistory = () => {
    this.setState({ currentOrders: [], showActualizationHistory: false })
  }

  getDetailPanel = history => {
    const { isFullScreen = true, classes, clinicSettings } = this.props
    const { visitPurposeFK, isNurseNote, nurseNotes } = history
    if (isNurseNote) {
      let e = document.createElement('div')
      e.innerHTML = nurseNotes
      let htmlData = e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue
      return (
        <div
          style={{
            padding: 10,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: 'darkBlue',
              fontSize: '0.85rem',
            }}
          >
            Notes
          </span>
          <div
            style={{ fontSize: '0.85rem' }}
            className={classes.paragraph}
            dangerouslySetInnerHTML={{ __html: htmlData }}
          />
        </div>
      )
    }
    let current = {
      ...history.patientHistoryDetail,
      visitAttachments: history.visitAttachments,
      visitRemarks: history.visitRemarks,
      referralSourceFK: history.referralSourceFK,
      referralPersonFK: history.referralPersonFK,
      referralPatientProfileFK: history.referralPatientProfileFK,
      referralSource: history.referralSource,
      referralPerson: history.referralPerson,
      referralPatientName: history.referralPatientName,
      referralRemarks: history.referralRemarks,
      visitPurposeFK: history.visitPurposeFK,
      patientGender: history.patientGender,
      visitOrderTemplateDetails: history.visitOrderTemplateDetails,
    }
    let visitDetails = {
      visitDate: history.visitDate,
      patientName: history.patientName,
      patientAccountNo: history.patientAccountNo,
    }
    let currentTagWidgets = this.widgets.filter(_widget => {
      return this.checkShowData(
        _widget.id,
        current,
        visitPurposeFK,
        isNurseNote,
      )
    })

    const { settings = {} } = clinicSettings
    const { labelPrinterSize } = settings
    const showDrugLabelRemark = labelPrinterSize === '8.0cmx4.5cm_V2'

    const isShowContent = currentTagWidgets.length > 0

    return (
      <div
        style={{
          padding: 10,
        }}
      >
        {isShowContent ? (
          <div>
            {currentTagWidgets.map(o => {
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
                    <span>{o.name}</span>
                    {o.name === 'Orders' &&
                      current.isExistsActualizationHistory && (
                        <span>
                          <Link
                            style={{
                              marginLeft: 10,
                              textDecoration: 'underline',
                            }}
                            onClick={() => {
                              this.viewActualizationHistory(current.orders)
                            }}
                          >
                            Actualization History
                          </Link>
                        </span>
                      )}
                  </span>
                  {Widget ? (
                    <Widget
                      current={current}
                      visitDetails={visitDetails}
                      {...this.props}
                      setFieldValue={this.props.setFieldValue}
                      isFullScreen={isFullScreen}
                      showDrugLabelRemark={showDrugLabelRemark}
                    />
                  ) : (
                    ''
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div> No Data</div>
        )}
      </div>
    )
  }

  toggleScribbleModal = () => {
    const { scriblenotes } = this.props
    this.props.dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        showViewScribbleModal: !scriblenotes.showViewScribbleModal,
        isReadonly: false,
      },
    })
  }

  scribbleNoteUpdateState = selectedDataValue => {
    this.setState({
      selectedData: selectedDataValue,
    })
  }

  setExpandAll = (isExpandAll = false) => {
    const { loadVisits } = this.state
    if (isExpandAll) {
      this.setState({ activeKey: loadVisits.map(o => o.currentId) })
    } else {
      this.setState({ activeKey: [] })
    }
  }

  selectAllOnChange = e => {
    if (e.target.value) {
      this.setState(preState => {
        return {
          ...preState,
          selectItems: [...preState.loadVisits.map(o => o.currentId)],
        }
      })
    } else {
      this.setState({ selectItems: [] })
    }
  }

  getPatientInfo = () => {
    const {
      patient = {},
      codetable: { ctg6pd = [], ctnationality = [], ctgender = [] },
    } = this.props
    const {
      name,
      patientAccountNo,
      nationalityFK,
      dob,
      patientAllergy,
      genderFK,
      patientAllergyMetaData,
      patientMedicalHistory = {},
    } = patient
    const {
      medicalHistory,
      familyHistory,
      socialHistory,
    } = patientMedicalHistory
    const gender = ctgender.find(o => o.id === genderFK)
    const nationality = ctnationality.find(o => o.id === nationalityFK)
    let g6PD
    let patientNoAllergies
    if (patientAllergyMetaData.length > 0) {
      g6PD = ctg6pd.find(o => o.id === patientAllergyMetaData[0].g6PDFK)
      patientNoAllergies = patientAllergyMetaData[0].noAllergies
    }

    let age = '0'
    const years = Math.floor(moment.duration(moment().diff(dob)).asYears())
    if (years > 0) {
      age = `${years} ${years > 1 ? 'yrs' : 'yr'}`
    } else {
      const months = Math.floor(moment.duration(moment().diff(dob)).asMonths())
      age = `{${months} ${years > 1 ? 'months' : 'month'}}`
    }

    const allergies = _.orderBy(patientAllergy, ['type'], ['asc'])
    return [
      {
        patientName: name,
        patientAccountNo,
        patientNationality: nationality ? nationality.name : '',
        patientAge: age,
        patientSex: gender ? gender.name : '',
        patientG6PD: g6PD ? g6PD.name : '',
        patientAllergy: allergies.length
          ? allergies.map(o => o.allergyName).join(', ')
          : patientNoAllergies
          ? 'NKDA'
          : '',
        patientSocialHistory: socialHistory,
        patientFamilyHistory: familyHistory,
        patientMajorInvestigation: medicalHistory,
      },
    ]
  }

  getSelectNoteTypes = () => {
    const { selectCategories = [] } = this.state
    if (selectCategories.length) {
      return [
        WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY,
        WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS,
        WidgetConfig.WIDGETS_ID.CLINICAL_NOTE,
        WidgetConfig.WIDGETS_ID.PLAN,
      ].filter(n => selectCategories.indexOf(n) >= 0)
    }
    return [
      WidgetConfig.WIDGETS_ID.ASSOCIATED_HISTORY,
      WidgetConfig.WIDGETS_ID.CHIEF_COMPLAINTS,
      WidgetConfig.WIDGETS_ID.CLINICAL_NOTE,
      WidgetConfig.WIDGETS_ID.PLAN,
    ].filter(
      n =>
        this.getCategoriesOptions()
          .map(c => c.value)
          .indexOf(n) >= 0,
    )
  }

  checkShowData = (widgetId, current, visitPurposeFK, isNurseNote) => {
    if (isNurseNote) return false
    if (visitPurposeFK === VISIT_TYPE.OTC) {
      return (
        (widgetId === WidgetConfig.WIDGETS_ID.ORDERS ||
          widgetId === WidgetConfig.WIDGETS_ID.INVOICE ||
          widgetId === WidgetConfig.WIDGETS_ID.VISITREMARKS ||
          widgetId === WidgetConfig.WIDGETS_ID.REFERRAL ||
          widgetId === WidgetConfig.WIDGETS_ID.ATTACHMENT) &&
        this.checkSelectWidget(widgetId) &&
        WidgetConfig.showWidget(current, widgetId)
      )
    }
    return (
      this.checkSelectWidget(widgetId) &&
      WidgetConfig.showWidget(current, widgetId, this.getSelectNoteTypes())
    )
  }

  checkShowNoteInReport = (widgetId, current, visitPurposeFK, isNurseNote) => {
    if (isNurseNote) return false
    if (visitPurposeFK === VISIT_TYPE.OTC) return false
    const checkContainsNote = () => {
      const notesType = WidgetConfig.notesTypes.find(
        type => type.value === widgetId,
      )
      if (!notesType) return false

      const { doctorNotes = [], scribbleNotes = [] } = current
      const scribbleType = scribbleTypes.find(
        o => o.type === notesType.fieldName,
      )
      if (
        !doctorNotes.find(
          note =>
            note[notesType.fieldName] !== undefined &&
            note[notesType.fieldName] !== null &&
            note[notesType.fieldName].trim().length,
        ) &&
        !scribbleNotes.find(
          sn => sn.scribbleNoteTypeFK === scribbleType?.typeFK,
        )
      ) {
        return false
      }
      return true
    }
    return this.checkSelectWidget(widgetId) && checkContainsNote()
  }

  getReferral = current => {
    let referral = ''
    if (current.referralPatientProfileFK) {
      referral = `Referred By Patient: ${current.referralPatientName}`
    } else if (current.referralSourceFK) {
      referral = `Referred By: ${current.referralSource}`
      if (current.referralPersonFK) {
        referral = `Referred By: ${current.referralSource}        Referral Person: ${current.referralPerson}`
      }
    }
    if (current.referralRemarks) {
      referral += `\r\n\r\nRemarks: ${current.referralRemarks}`
    }
    return {
      isShowReferral: true,
      referralContent: referral,
    }
  }

  getEyeVisualAcuityTest = current => {
    const eyeVisualAcuityTest = current.eyeVisualAcuityTestForms[0] || {}
    return {
      isAided: eyeVisualAcuityTest.isAided,
      isOwnSpecs: eyeVisualAcuityTest.isOwnSpecs,
      isRefractionOn: eyeVisualAcuityTest.isRefractionOn,
      refractionOnRemarks: eyeVisualAcuityTest.refractionOnRemarks,
      nearVADOD: eyeVisualAcuityTest.nearVADOD,
      nearVAPHOD: eyeVisualAcuityTest.nearVAPHOD,
      nearVANOD: eyeVisualAcuityTest.nearVANOD,
      nearVAcmOD: eyeVisualAcuityTest.nearVAcmOD,
      nearVADOS: eyeVisualAcuityTest.nearVADOS,
      nearVAPHOS: eyeVisualAcuityTest.nearVAPHOS,
      nearVANOS: eyeVisualAcuityTest.nearVANOS,
      nearVAcmOS: eyeVisualAcuityTest.nearVAcmOS,
      isNoSpec: eyeVisualAcuityTest.isNoSpec,
      specsAge: eyeVisualAcuityTest.specsAge,
      specSphereOD: eyeVisualAcuityTest.specSphereOD,
      specCylinderOD: eyeVisualAcuityTest.specCylinderOD,
      specAxisOD: eyeVisualAcuityTest.specAxisOD,
      specVaOD: eyeVisualAcuityTest.specVaOD,
      specSphereOS: eyeVisualAcuityTest.specSphereOS,
      specCylinderOS: eyeVisualAcuityTest.specCylinderOS,
      specAxisOS: eyeVisualAcuityTest.specAxisOS,
      specVaOS: eyeVisualAcuityTest.specVaOS,
      eyeVisualAcuityTestRemark: eyeVisualAcuityTest.remark,
      isEyeVisualAcuityTest: true,
    }
  }

  getRefractionForm = current => {
    const { formData = {} } = current.corEyeRefractionForm
    const {
      Tenometry = {},
      EyeDominance = {},
      PupilSize = {},
      Tests = [],
      NearAdd = {},
    } = formData
    const visitRefractionFormTests = Tests.map(o => {
      return {
        visitFK: current.currentId,
        sphereOD: o.SphereOD,
        cylinderOD: o.CylinderOD,
        axisOD: o.AxisOD,
        vaOD: o.VaOD,
        sphereOS: o.SphereOS,
        cylinderOS: o.CylinderOS,
        axisOS: o.AxisOS,
        vaOS: o.VaOS,
        testName: o.EyeRefractionTestType,
      }
    })

    return {
      isRefractionForm: true,
      eyeRefractionFormRemarks: formData.Remarks,
      eyeRefractionFormTestRemarks: formData.TestRemarks,
      eyeRefractionFormTenometryR: Tenometry.R
        ? numeral(Tenometry.R).format('0.0')
        : undefined,
      eyeRefractionFormTenometryL: Tenometry.L
        ? numeral(Tenometry.L).format('0.0')
        : undefined,
      eyeRefractionFormDominanceL: EyeDominance.Left,
      eyeRefractionFormDominanceR: EyeDominance.Right,
      eyeRefractionFormPupilSizeL: PupilSize.L,
      eyeRefractionFormPupilSizeR: PupilSize.R,
      eyeRefractionFormVanHerick: formData.VanHerick,
      eyeRefractionFormNearAddDOD: NearAdd.NearAddDOD,
      eyeRefractionFormNearAddPHOD: NearAdd.NearAddPHOD,
      eyeRefractionFormNearAddNOD: NearAdd.NearAddNOD,
      eyeRefractionFormNearAddcmOD: NearAdd.NearAddcmOD,
      eyeRefractionFormNearAddDOS: NearAdd.NearAddDOS,
      eyeRefractionFormNearAddPHOS: NearAdd.NearAddPHOS,
      eyeRefractionFormNearAddNOS: NearAdd.NearAddNOS,
      eyeRefractionFormNearAddcmOS: NearAdd.NearAddcmOS,
      visitRefractionFormTests,
    }
  }

  getNoteContent = (note, selectNoteTypes, showType) => {
    if (selectNoteTypes.indexOf(showType) >= 0) {
      const notesType = WidgetConfig.notesTypes.find(
        type => type.value === showType,
      )
      if (!notesType) return undefined
      return note[notesType.fieldName]
    }
    return undefined
  }

  checkPrintNote = (note, selectNoteTypes) => {
    return selectNoteTypes.find(selectNote => {
      const notesType = WidgetConfig.notesTypes.find(
        type => type.value === selectNote,
      )
      return (
        note[notesType.fieldName] !== undefined &&
        note[notesType.fieldName] !== null &&
        note[notesType.fieldName].trim().length
      )
    })
  }

  getNotes = async (selectNoteTypes, current) => {
    const { doctorNotes = [], scribbleNotes = [] } = current
    let newNote = []
    const base64Prefix = 'data:image/jpeg;base64,'
    for (let indexN = 0; indexN < doctorNotes.length; indexN++) {
      const note = doctorNotes[indexN]
      const noteUserName = `${
        note.signedByUserTitle && note.signedByUserTitle.trim().length
          ? `${note.signedByUserTitle} ${note.signedByUserName || ''}`
          : `${note.signedByUserName || ''}`
      }`
      const updateDate = moment(note.signedDate).format(
        dateFormatLongWithTimeNoSec,
      )
      for (let index = 0; index < selectNoteTypes.length; index++) {
        const selectNoteType = selectNoteTypes[index]
        const notesType = WidgetConfig.notesTypes.find(
          type => type.value === selectNoteType,
        )
        let sortOrder = 0
        if (
          WidgetConfig.hasValue(note[notesType.fieldName]) &&
          note[notesType.fieldName].trim().length
        ) {
          const splites = note[notesType.fieldName].trim().split('\n')
          splites.forEach(splite => {
            newNote.push({
              id: note.id,
              visitFK: current.currentId,
              noteType: notesType.title,
              valueType: 'String',
              stringValue: splite,
              sortOrder: sortOrder,
              doctor: noteUserName,
              updateDate: updateDate,
            })
            sortOrder = sortOrder + 1
          })
        }

        const scribbleType = scribbleTypes.find(
          o => o.type === notesType.fieldName,
        )
        const filterScribbleNotes = scribbleNotes.filter(
          sn =>
            sn.scribbleNoteTypeFK === scribbleType?.typeFK &&
            sn.signedByUserFK === note.signedByUserFK,
        )

        for (let indexSN = 0; indexSN < filterScribbleNotes.length; indexSN++) {
          const scribbleNote = filterScribbleNotes[indexSN]
          let imageContent
          if (scribbleNote.fileIndexFK) {
            const result = await getFileContentByFileID(
              scribbleNote.fileIndexFK,
            )
            if (result && result.status === 200 && result.data) {
              imageContent = result.data.content
            }
          }
          newNote.push({
            id: note.id,
            visitFK: current.currentId,
            noteType: notesType.title,
            valueType: 'Image',
            imageTitle: scribbleNote.subject,
            imageValue: imageContent,
            sortOrder: sortOrder,
            doctor: noteUserName,
            updateDate: updateDate,
          })
          sortOrder = sortOrder + 1
        }
      }
    }
    return newNote
  }

  showBasicExaminationsGeneral = (basicExaminations = []) => {
    if (
      basicExaminations.find(
        row =>
          WidgetConfig.hasValue(row.temperatureC) ||
          WidgetConfig.hasValue(row.bpSysMMHG) ||
          WidgetConfig.hasValue(row.bpDiaMMHG) ||
          WidgetConfig.hasValue(row.pulseRateBPM) ||
          WidgetConfig.hasValue(row.saO2) ||
          WidgetConfig.hasValue(row.weightKG) ||
          WidgetConfig.hasValue(row.heightCM) ||
          WidgetConfig.hasValue(row.bmi),
      )
    )
      return true
    return false
  }

  showBasicExaminationsOther1 = (basicExaminations = []) => {
    if (
      basicExaminations.find(
        row =>
          WidgetConfig.hasValue(row.bodyFatPercentage) ||
          WidgetConfig.hasValue(row.degreeOfObesity) ||
          WidgetConfig.hasValue(row.headCircumference) ||
          WidgetConfig.hasValue(row.chestCircumference) ||
          WidgetConfig.hasValue(row.waistCircumference) ||
          WidgetConfig.hasValue(row.isPregnancy),
      )
    )
      return true
    return false
  }

  showBasicExaminationsOther2 = (basicExaminations = []) => {
    if (
      basicExaminations.find(
        row =>
          WidgetConfig.hasValue(row.hepetitisVaccinationA) ||
          WidgetConfig.hasValue(row.hepetitisVaccinationB) ||
          WidgetConfig.hasValue(row.isFasting) ||
          WidgetConfig.hasValue(row.isSmoking) ||
          WidgetConfig.hasValue(row.isAlcohol) ||
          WidgetConfig.hasValue(row.isMensus),
      )
    )
      return true
    return false
  }

  printHandel = async () => {
    let reportContext = []
    const result = await getReportContext(68)
    if (result) {
      reportContext = result.map(o => {
        const {
          customLetterHeadHeight = 0,
          isDisplayCustomLetterHead = false,
          standardHeaderInfoHeight = 0,
          isDisplayStandardHeader = false,
          footerInfoHeight = 0,
          isDisplayFooterInfo = false,
          footerDisclaimerHeight = 0,
          isDisplayFooterInfoDisclaimer = false,
          ...restProps
        } = o
        return {
          customLetterHeadHeight,
          isDisplayCustomLetterHead,
          standardHeaderInfoHeight,
          isDisplayStandardHeader,
          footerInfoHeight,
          isDisplayFooterInfo,
          footerDisclaimerHeight,
          isDisplayFooterInfoDisclaimer,
          ...restProps,
        }
      })
    }
    const { loadVisits, selectItems } = this.state
    const {
      codetable: { ctcomplication = [] },
      handlePreviewReport,
    } = this.props
    let visitListing = []
    let treatment = []
    let diagnosis = []
    let eyeVisualAcuityTestForms = []
    let refractionFormTests = []
    let eyeExaminations = []
    let vitalSign = []
    let orders = []
    let consultationDocument = []
    let doctorNote = []
    let corEyeExaminations = []
    let corAudiometryTest = []

    var printVisit = loadVisits.filter(visit =>
      selectItems.find(item => item === visit.currentId),
    )
    for (let index = 0; index < printVisit.length; index++) {
      const visit = printVisit[index]
      let current = {
        ...visit.patientHistoryDetail,
        visitRemarks: visit.visitRemarks,
        referralSourceFK: visit.referralSourceFK,
        referralPersonFK: visit.referralPersonFK,
        referralPatientProfileFK: visit.referralPatientProfileFK,
        referralSource: visit.referralSource,
        referralPerson: visit.referralPerson,
        referralPatientName: visit.referralPatientName,
        referralRemarks: visit.referralRemarks,
        visitPurposeFK: visit.visitPurposeFK,
        currentId: visit.currentId,
        isNurseNote: visit.isNurseNote,
        nurseNotes: visit.nurseNotes,
        visitDate: visit.visitDate,
        userName: visit.userName,
        userTitle: visit.userTitle,
        patientGender: visit.patientGender,
      }
      const { isNurseNote, nurseNotes = '', visitPurposeFK } = current
      let isShowDoctorNote = false
      const selectNoteTypes = this.getSelectNoteTypes()
      if (selectNoteTypes.length) {
        isShowDoctorNote = selectNoteTypes.find(noteType =>
          this.checkShowNoteInReport(
            noteType,
            current,
            visitPurposeFK,
            isNurseNote,
          ),
        )
      }
      const isShowReferral = this.checkShowData(
        WidgetConfig.WIDGETS_ID.REFERRAL,
        current,
        visitPurposeFK,
        current.isNurseNote,
      )
      const isShowVisitRemarks = this.checkShowData(
        WidgetConfig.WIDGETS_ID.VISITREMARKS,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowTreatment = this.checkShowData(
        WidgetConfig.WIDGETS_ID.TREATMENT,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowDiagnosis = this.checkShowData(
        WidgetConfig.WIDGETS_ID.DIAGNOSIS,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowEyeVisualAcuityTest = this.checkShowData(
        WidgetConfig.WIDGETS_ID.VISUALACUITYTEST,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowRefractionForm = this.checkShowData(
        WidgetConfig.WIDGETS_ID.REFRACTIONFORM,
        current,
        visitPurposeFK,
        current.isNurseNote,
      )
      const isShowEyeExaminations = this.checkShowData(
        WidgetConfig.WIDGETS_ID.EXAMINATIONFORM,
        current,
        visitPurposeFK,
        current.isNurseNote,
      )
      const isShowBasicExaminations = this.checkShowData(
        WidgetConfig.WIDGETS_ID.VITALSIGN,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowOrders = this.checkShowData(
        WidgetConfig.WIDGETS_ID.ORDERS,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowConsultationDocument = this.checkShowData(
        WidgetConfig.WIDGETS_ID.CONSULTATION_DOCUMENT,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowJGHEyeExaminations = this.checkShowData(
        WidgetConfig.WIDGETS_ID.EYEEXAMINATIONS,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      const isShowAudiometryTest = this.checkShowData(
        WidgetConfig.WIDGETS_ID.AUDIOMETRYTEST,
        current,
        visitPurposeFK,
        isNurseNote,
      )
      if (
        isNurseNote ||
        isShowDoctorNote ||
        isShowReferral ||
        isShowVisitRemarks ||
        isShowTreatment ||
        isShowDiagnosis ||
        isShowEyeVisualAcuityTest ||
        isShowRefractionForm ||
        isShowEyeExaminations ||
        isShowBasicExaminations ||
        isShowOrders ||
        isShowConsultationDocument ||
        isShowJGHEyeExaminations ||
        isShowAudiometryTest
      ) {
        let referral = { isShowReferral: false }
        if (isShowReferral) {
          referral = this.getReferral(current)
        }
        let refractionFormDetails = {
          isRefractionForm: false,
          eyeRefractionFormDominanceL: false,
          eyeRefractionFormDominanceR: false,
        }
        if (isShowRefractionForm) {
          refractionFormDetails = this.getRefractionForm(current)
        }

        let eyeVisualAcuityTestDetails = {
          isEyeVisualAcuityTest: false,
          isAided: false,
          isOwnSpecs: false,
          isRefractionOn: false,
          isNoSpec: false,
          specsAge: 0,
        }
        if (isShowEyeVisualAcuityTest) {
          eyeVisualAcuityTestDetails = this.getEyeVisualAcuityTest(current)
        }

        const {
          visitRefractionFormTests = [],
          ...restRefractionFormProps
        } = refractionFormDetails

        // visitListing
        visitListing.push({
          currentId: current.currentId,
          visitDate: moment(current.visitDate).format(
            dateFormatLongWithTimeNoSec,
          ),
          doctor: `${current.userTitle || ''} ${current.userName || ''}`,
          isNurseNote: isNurseNote || false,
          nurseNotes,
          visitRemarks: isShowVisitRemarks ? current.visitRemarks : '',
          ...referral,
          ...restRefractionFormProps,
          ...eyeVisualAcuityTestDetails,
          patientGender: current.patientGender || '',
          isShowBasicExaminations: isShowBasicExaminations,
          isShowBasicExaminationsGeneral: this.showBasicExaminationsGeneral(
            current.patientNoteVitalSigns,
          ),
          isShowBasicExaminationsOther1: this.showBasicExaminationsOther1(
            current.patientNoteVitalSigns,
          ),
          isShowBasicExaminationsOther2: this.showBasicExaminationsOther2(
            current.patientNoteVitalSigns,
          ),
        })

        // treatment
        if (isShowTreatment) {
          treatment = treatment.concat(
            current.orders
              .filter(o => o.type === 'Treatment')
              .map(o => {
                return {
                  visitFK: current.currentId,
                  name: o.name,
                  toothNumber: o.description,
                  legend: o.legend,
                  description: o.treatmentDescription,
                }
              }),
          )
        }

        // diagnosis
        if (isShowDiagnosis) {
          diagnosis = diagnosis.concat(
            current.diagnosis.map(o => {
              let currentComplication = o.corComplication.map(c => {
                const selectItem = ctcomplication.find(
                  cc => cc.id === c.complicationFK,
                )
                return {
                  ...c,
                  name: selectItem ? selectItem.name : undefined,
                }
              })
              return {
                visitFK: current.currentId,
                diagnosisDescription: o.diagnosisDescription,
                complication: currentComplication
                  .filter(c => c.name)
                  .map(c => c.name)
                  .join(', '),
              }
            }),
          )
        }

        // Refraction Form Test
        refractionFormTests = refractionFormTests.concat(
          visitRefractionFormTests,
        )

        // Eye Examinations
        if (isShowEyeExaminations) {
          const { formData = {} } = current.corEyeExaminationForm
          eyeExaminations = eyeExaminations.concat(
            (formData.EyeExaminations || []).map(o => {
              return {
                visitFK: current.currentId,
                rightEye: o.RightEye,
                eyeExaminationType: o.EyeExaminationType,
                leftEye: o.LeftEye,
              }
            }),
          )
        }

        // Vital Sign
        if (isShowBasicExaminations) {
          vitalSign = vitalSign.concat(
            current.patientNoteVitalSigns.map(o => {
              return {
                visitFK: current.currentId,
                temperatureC: WidgetConfig.hasValue(o.temperatureC)
                  ? `${numeral(o.temperatureC).format('0.0')} \u00b0C`
                  : '-',
                bpSysMMHG: WidgetConfig.hasValue(o.bpSysMMHG)
                  ? `${numeral(o.bpSysMMHG).format('0')} mmHg`
                  : '-',
                bpDiaMMHG: WidgetConfig.hasValue(o.bpDiaMMHG)
                  ? `${numeral(o.bpDiaMMHG).format('0')} mmHg`
                  : '-',
                pulseRateBPM: WidgetConfig.hasValue(o.pulseRateBPM)
                  ? `${numeral(o.pulseRateBPM).format('0')} bpm`
                  : '-',
                weightKG: WidgetConfig.hasValue(o.weightKG)
                  ? `${numeral(o.weightKG).format('0.0')} KG`
                  : '-',
                heightCM: WidgetConfig.hasValue(o.heightCM)
                  ? `${numeral(o.heightCM).format('0.0')} CM`
                  : '-',
                bmi: WidgetConfig.hasValue(o.bmi)
                  ? `${numeral(o.bmi).format('0.0')} kg/m\u00b2`
                  : '-',
                saO2: WidgetConfig.hasValue(o.saO2)
                  ? `${numeral(o.saO2).format('0')} %`
                  : '-',
                bodyFatPercentage: WidgetConfig.hasValue(o.bodyFatPercentage)
                  ? `${numeral(o.bodyFatPercentage).format('0.0')} %`
                  : '-',
                degreeOfObesity: WidgetConfig.hasValue(o.degreeOfObesity)
                  ? `${numeral(o.degreeOfObesity).format('0.0')} %`
                  : '-',
                headCircumference: WidgetConfig.hasValue(o.headCircumference)
                  ? `${numeral(o.headCircumference).format('0.0')} CM`
                  : '-',
                chestCircumference: WidgetConfig.hasValue(o.chestCircumference)
                  ? `${numeral(o.chestCircumference).format('0.0')} CM`
                  : '-',
                waistCircumference:
                  o.isChild || o.isPregnancy
                    ? 'Not Available'
                    : WidgetConfig.hasValue(o.waistCircumference)
                    ? `${numeral(o.waistCircumference).format('0.0')} CM`
                    : '-',
                isPregnancy: WidgetConfig.getHistoryValueForBoolean(
                  o.isPregnancy,
                ),
                hepetitisVaccinationA: WidgetConfig.getHistoryValueForBoolean(
                  o.hepetitisVaccinationA,
                ),
                hepetitisVaccinationB: WidgetConfig.getHistoryValueForBoolean(
                  o.hepetitisVaccinationB,
                ),
                isFasting: WidgetConfig.getHistoryValueForBoolean(o.isFasting),
                isSmoking: WidgetConfig.getHistoryValueForBoolean(o.isSmoking),
                isAlcohol: WidgetConfig.getHistoryValueForBoolean(o.isAlcohol),
                isMensus: WidgetConfig.getHistoryValueForBoolean(o.isMensus),
              }
            }),
          )
        }

        // JGH Eye Examinations
        if (isShowJGHEyeExaminations) {
          corEyeExaminations = corEyeExaminations.concat(
            current.corEyeExaminations.map(o => {
              return {
                visitFK: current.currentId,
                visionCorrectionMethod: o.visionCorrectionMethod || '',
                rightBareEye5: WidgetConfig.hasValue(o.rightBareEye5)
                  ? `${numeral(o.rightBareEye5).format('0.0')}`
                  : '-',
                rightCorrectedVision5: WidgetConfig.hasValue(
                  o.rightCorrectedVision5,
                )
                  ? `${numeral(o.rightCorrectedVision5).format('0.0')}`
                  : '-',
                rightBareEye50: WidgetConfig.hasValue(o.rightBareEye50)
                  ? `${numeral(o.rightBareEye50).format('0.0')}`
                  : '-',
                rightCorrectedVision50: WidgetConfig.hasValue(
                  o.rightCorrectedVision50,
                )
                  ? `${numeral(o.rightCorrectedVision50).format('0.0')}`
                  : '-',
                leftBareEye5: WidgetConfig.hasValue(o.leftBareEye5)
                  ? `${numeral(o.leftBareEye5).format('0.0')}`
                  : '-',
                leftCorrectedVision5: WidgetConfig.hasValue(
                  o.leftCorrectedVision5,
                )
                  ? `${numeral(o.leftCorrectedVision5).format('0.0')}`
                  : '-',
                leftBareEye50: WidgetConfig.hasValue(o.leftBareEye50)
                  ? `${numeral(o.leftBareEye50).format('0.0')}`
                  : '-',
                leftCorrectedVision50: WidgetConfig.hasValue(
                  o.leftCorrectedVision50,
                )
                  ? `${numeral(o.leftCorrectedVision50).format('0.0')}`
                  : '-',
                rightFirstResult: WidgetConfig.hasValue(o.rightFirstResult)
                  ? `${o.rightFirstResult}`
                  : '-',
                rightSecondResult: WidgetConfig.hasValue(o.rightSecondResult)
                  ? `${o.rightSecondResult}`
                  : '-',
                rightThirdResult: WidgetConfig.hasValue(o.rightThirdResult)
                  ? `${o.rightThirdResult}`
                  : '-',
                rightAverageResult: WidgetConfig.hasValue(o.rightAverageResult)
                  ? `${numeral(o.rightAverageResult).format('0')}`
                  : '-',
                leftFirstResult: WidgetConfig.hasValue(o.leftFirstResult)
                  ? `${o.leftFirstResult}`
                  : '-',
                leftSecondResult: WidgetConfig.hasValue(o.leftSecondResult)
                  ? `${o.leftSecondResult}`
                  : '-',
                leftThirdResult: WidgetConfig.hasValue(o.leftThirdResult)
                  ? `${o.leftThirdResult}`
                  : '-',
                leftAverageResult: WidgetConfig.hasValue(o.leftAverageResult)
                  ? `${numeral(o.leftAverageResult).format('0')}`
                  : '-',
                colorVisionTestResult: o.colorVisionTestResult || '',
                remarks:
                  WidgetConfig.hasValue(o.remarks) && o.remarks.trim().length
                    ? o.remarks
                    : '-',
              }
            }),
          )
        }

        //  Audiometry Test
        if (isShowAudiometryTest) {
          corAudiometryTest = corAudiometryTest.concat(
            current.corAudiometryTest.map(o => {
              return {
                visitFK: current.currentId,
                rightResult1000Hz: WidgetConfig.hasValue(o.rightResult1000Hz)
                  ? `${o.rightResult1000Hz} dB`
                  : '-',
                rightResult4000Hz: WidgetConfig.hasValue(o.rightResult4000Hz)
                  ? `${o.rightResult4000Hz} dB`
                  : '-',
                leftResult1000Hz: WidgetConfig.hasValue(o.leftResult1000Hz)
                  ? `${o.leftResult1000Hz} dB`
                  : '-',
                leftResult4000Hz: WidgetConfig.hasValue(o.leftResult4000Hz)
                  ? `${o.leftResult4000Hz} dB`
                  : '-',
              }
            }),
          )
        }

        // orders
        if (isShowOrders) {
          orders = orders.concat(
            current.orders.map(o => {
              return {
                visitFK: current.currentId,
                type: o.isDrugMixture ? 'Drug Mixture' : o.type,
                isDrugMixture: o.isDrugMixture,
                name: o.name,
                description: o.description,
                remarks: o.remarks,
                quantity: o.quantity,
                uom: o.dispenseUOMDisplayValue,
              }
            }),
          )
        }

        // Consultation Document
        if (isShowConsultationDocument) {
          consultationDocument = consultationDocument.concat(
            current.documents.map(o => {
              return {
                visitFK: current.currentId,
                type: o.type,
                subject: o.type === 'Others' ? o.title : o.subject,
              }
            }),
          )
        }

        //show doctor notes
        if (isShowDoctorNote) {
          const newNote = await this.getNotes(selectNoteTypes, current)
          doctorNote = doctorNote.concat(newNote)
        }
      }
    }

    // for resolve print nothing when not any data in sub table(such as consultationDocument, treatment, diagnosis...)
    if (consultationDocument.length === 0) {
      consultationDocument = [{ visitFK: '' }]
    }
    const payload = {
      PatientInfo: this.getPatientInfo(),
      VisitListing: visitListing,
      Treatment: treatment,
      Diagnosis: diagnosis,
      EyeVisualAcuityTestForms: eyeVisualAcuityTestForms,
      RefractionFormTests: refractionFormTests,
      EyeExaminations: eyeExaminations,
      VitalSign: vitalSign,
      Orders: orders,
      ConsultationDocument: consultationDocument,
      DoctorNote: doctorNote,
      COREyeExaminations: corEyeExaminations,
      CORAudiometryTest: corAudiometryTest,
      ReportContext: reportContext,
    }
    const payload1 = [
      {
        ReportId: 68,
        Copies: 1,
        ReportData: JSON.stringify({
          ...commonDataReaderTransform(payload),
        }),
      },
    ]

    handlePreviewReport(JSON.stringify(payload1))
  }

  getFilterBar = () => {
    const { values, fromModule } = this.props
    const { isAllDate } = values
    const { selectItems } = this.state
    return (
      <div>
        <div style={{ display: 'flex' }}>
          <div>
            <Field
              name='visitTypeIDs'
              render={args => (
                <VisitTypeSelect
                  label='Visit Type'
                  mode='multiple'
                  maxTagPlaceholder='Visit Types'
                  style={{
                    width: fromModule === 'MedicalCheckup' ? 170 : 200,
                    display: 'inline-Block',
                    marginBottom: -12,
                  }}
                  {...args}
                  allowClear={true}
                />
              )}
            />
            <div
              style={{
                display: 'inline-Block',
                marginLeft: 10,
                position: 'relative',
                top: fromModule === 'PatientHistory' ? '-4px' : '0px',
              }}
            >
              <Field
                name='visitDate'
                render={args => (
                  <DateRangePicker
                    style={{
                      width: fromModule === 'MedicalCheckup' ? 210 : 300,
                    }}
                    label='Visit Date From'
                    label2='To'
                    {...args}
                    disabled={isAllDate}
                  />
                )}
              />
            </div>
            <div
              style={{
                display: 'inline-Block',
                marginLeft: 10,
              }}
            >
              <Field
                name='isAllDate'
                render={args => (
                  <Checkbox
                    {...args}
                    label='All Date'
                    style={{ width: fromModule === 'PatientHistory' ? 75 : 70 }}
                  />
                )}
              />
            </div>
            <Field
              name='selectCategories'
              render={args => (
                <CodeSelect
                  valueField='value'
                  label='Categories'
                  mode='multiple'
                  maxTagCount={0}
                  style={{
                    width: fromModule === 'MedicalCheckup' ? 168 : 240,
                    display: 'inline-Block',
                    marginBottom: -12,
                    marginLeft: 10,
                  }}
                  options={this.getCategoriesOptions()}
                  {...args}
                />
              )}
            />
            <Field
              name='selectDoctors'
              render={args => (
                <DoctorProfileSelect
                  style={{
                    width: fromModule === 'MedicalCheckup' ? 180 : 240,
                    display: 'inline-Block',
                    marginLeft: 10,
                    marginBottom: -12,
                  }}
                  label='Doctors'
                  mode='multiple'
                  {...args}
                  maxTagCount={0}
                  allValue={-99}
                  allValueOption={{
                    id: -99,
                    clinicianProfile: {
                      name: 'All',
                      isActive: true,
                    },
                  }}
                  labelField='clinicianProfile.name'
                  localFilter={option => option.clinicianProfile.isActive}
                />
              )}
            />
            <div
              style={{
                display: 'inline-Block',
                marginLeft: 10,
                position: 'relative',
                top: '-5px',
              }}
            >
              <ProgressButton
                color='primary'
                size='sm'
                icon={<Search />}
                onClick={this.handelSearch}
              >
                Search
              </ProgressButton>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div
            style={{
              position: 'relative',
              bottom: -4,
            }}
          >
            <div style={{ display: 'inline-Block' }}>
              <Field
                name='isSelectAll'
                render={args => (
                  <Checkbox
                    onChange={this.selectAllOnChange}
                    {...args}
                    label='Select All'
                  />
                )}
              />
            </div>
            <div
              style={{
                display: 'inline-Block',
                fontWeight: 500,
              }}
            >
              {`(Selected: ${selectItems.length})`}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div
              style={{
                display: 'inline-Block',
              }}
            >
              <span
                style={{
                  cursor: 'pointer',
                }}
                onClick={() => {
                  this.setExpandAll(true)
                }}
              >
                <span
                  className='material-icons'
                  style={{
                    marginTop: 15,
                    fontSize: '1.2rem',
                  }}
                >
                  unfold_more
                </span>
                <span style={{ position: 'relative', top: -5 }}>
                  Expand All
                </span>
              </span>
              <span
                style={{
                  cursor: 'pointer',
                  marginLeft: 20,
                  marginRight: 10,
                }}
                onClick={() => {
                  this.setExpandAll(false)
                }}
              >
                <span
                  className='material-icons'
                  style={{
                    marginTop: 10,
                    fontSize: '1.2rem',
                  }}
                >
                  unfold_less
                </span>
                <span style={{ position: 'relative', top: -5 }}>
                  Collapse All
                </span>
              </span>
            </div>
            <Button
              color='primary'
              icon={null}
              size='sm'
              style={{
                position: 'relative',
                bottom: 8,
                marginLeft: 10,
              }}
              disabled={selectItems.length === 0}
              onClick={this.printHandel}
            >
              <Print />
              Print
            </Button>
          </div>
        </div>
      </div>
    )
  }

  getConsultationFilterBar = () => {
    const { values, isFullScreen = true } = this.props
    const { isAllDate } = values
    return (
      <div>
        <div style={{ display: 'flex', marginBottom: isFullScreen ? 10 : 0 }}>
          <div>
            <Field
              name='visitTypeIDs'
              render={args => (
                <VisitTypeSelect
                  label={formatMessage({ id: 'lab.search.visittype' })}
                  mode='multiple'
                  maxTagPlaceholder='Visit Types'
                  style={{
                    width: !isFullScreen ? 160 : 240,
                    display: 'inline-Block',
                    marginBottom: -12,
                  }}
                  {...args}
                  allowClear={true}
                />
              )}
            />
            <div
              style={{
                display: 'inline-Block',
                marginLeft: 5,
              }}
            >
              <Field
                name='visitDate'
                render={args => (
                  <DateRangePicker
                    style={{
                      width: !isFullScreen ? 210 : 300,
                    }}
                    label='Visit Date From'
                    label2='To'
                    {...args}
                    disabled={isAllDate}
                  />
                )}
              />
            </div>
            <div
              style={{
                display: 'inline-Block',
                marginLeft: 5,
              }}
            >
              <Field
                name='isAllDate'
                render={args => (
                  <Checkbox {...args} label='All Date' style={{ width: 70 }} />
                )}
              />
            </div>
            <Field
              name='selectCategories'
              render={args => (
                <CodeSelect
                  valueField='value'
                  label='Categories'
                  mode='multiple'
                  style={{
                    width: !isFullScreen ? 150 : 240,
                    display: 'inline-Block',
                    marginLeft: 5,
                    marginBottom: -12,
                  }}
                  options={this.getCategoriesOptions()}
                  {...args}
                />
              )}
            />
            <Field
              name='selectDoctors'
              render={args => (
                <DoctorProfileSelect
                  style={{
                    width: !isFullScreen ? 150 : 240,
                    display: 'inline-Block',
                    marginLeft: 5,
                    marginBottom: -12,
                  }}
                  label='Doctors'
                  mode='multiple'
                  {...args}
                  allValue={-99}
                  allValueOption={{
                    id: -99,
                    clinicianProfile: {
                      name: 'All',
                      isActive: true,
                    },
                  }}
                  labelField='clinicianProfile.name'
                  localFilter={option => option.clinicianProfile.isActive}
                />
              )}
            />
            <div
              style={{
                display: 'inline-Block',
                marginLeft: 5,
                position: 'relative',
                top: '-5px',
                lineHeight: '46px',
              }}
            >
              <ProgressButton
                color='primary'
                size='sm'
                icon={<Search />}
                onClick={this.handelSearch}
              >
                Search
              </ProgressButton>
            </div>
          </div>
          {isFullScreen && (
            <div
              style={{
                marginLeft: 'auto',
                position: 'relative',
                bottom: -10,
              }}
            >
              <div>
                <span
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    this.setExpandAll(true)
                  }}
                >
                  <span
                    className='material-icons'
                    style={{
                      marginTop: 15,
                      fontSize: '1.2rem',
                    }}
                  >
                    unfold_more
                  </span>
                  <span style={{ position: 'relative', top: -5 }}>
                    Expand All
                  </span>
                </span>
                <span
                  style={{
                    cursor: 'pointer',
                    marginLeft: 20,
                    marginRight: 10,
                  }}
                  onClick={() => {
                    this.setExpandAll(false)
                  }}
                >
                  <span
                    className='material-icons'
                    style={{
                      marginTop: 10,
                      fontSize: '1.2rem',
                    }}
                  >
                    unfold_less
                  </span>
                  <span style={{ position: 'relative', top: -5 }}>
                    Collapse All
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
        {!isFullScreen && (
          <div style={{ display: 'flex' }}>
            <div style={{ marginLeft: 'auto' }}>
              <div>
                <span
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    this.setExpandAll(true)
                  }}
                >
                  <span
                    className='material-icons'
                    style={{
                      marginTop: 15,
                      fontSize: '1.2rem',
                    }}
                  >
                    unfold_more
                  </span>
                  <span style={{ position: 'relative', top: -5 }}>
                    Expand All
                  </span>
                </span>
                <span
                  style={{
                    cursor: 'pointer',
                    marginLeft: 20,
                    marginRight: 10,
                  }}
                  onClick={() => {
                    this.setExpandAll(false)
                  }}
                >
                  <span
                    className='material-icons'
                    style={{
                      marginTop: 10,
                      fontSize: '1.2rem',
                    }}
                  >
                    unfold_less
                  </span>
                  <span style={{ position: 'relative', top: -5 }}>
                    Collapse All
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  closeHistoryDetails = () => {
    this.setState({
      showHistoryDetails: false,
      selectHistory: undefined,
    })
    this.props.dispatch({
      type: 'patientHistory/updateState',
      payload: {
        selectedSubRow: undefined,
        entity: undefined,
      },
    })
  }

  handelSearch = () => {
    const { values, dispatch, patientHistory } = this.props
    const {
      visitDate,
      isAllDate,
      selectDoctors,
      selectCategories,
      visitTypeIDs,
    } = values
    this.setState(
      {
        visitDate,
        isAllDate,
        pageIndex: 0,
        loadVisits: [],
        activeKey: [],
        selectItems: [],
        totalVisits: 0,
        selectDoctors,
        visitTypeIDs,
        selectCategories,
        isLoadingData: true,
      },
      () => {
        const currentSelectCategories = selectCategories.filter(o => o !== -99)
        const currentSelectVisitTypeIds = visitTypeIDs.filter(o => o !== -99)
        const newPreference = [
          {
            SelectCategories: currentSelectCategories || [],
            Identifier: 'SelectCategories',
          },
          {
            SelectedVisitTypeIDs: visitTypeIDs || [],
            Identifier: 'SelectedVisitTypeIDs',
          },
        ]
        if (!_.isEqual(patientHistory.preference, newPreference)) {
          dispatch({
            type: 'patientHistory/saveUserPreference',
            payload: {
              List: [
                {
                  userPreferenceDetails: JSON.stringify({
                    SelectCategories: currentSelectCategories || [],
                    Identifier: 'SelectCategories',
                  }),
                  type: 5,
                  itemIdentifier: 'SelectCategories',
                },
                {
                  userPreferenceDetails: JSON.stringify({
                    SelectedVisitTypeIDs: visitTypeIDs || [],
                    Identifier: 'SelectedVisitTypeIDs',
                  }),
                  type: 5,
                  itemIdentifier: 'SelectedVisitTypeIDs',
                },
              ],
            },
          }).then(r => {
            if (r) {
              dispatch({
                type: 'patientHistory/updateState',
                payload: { preference: newPreference },
              })
            }
          })
        }
        this.queryVisitHistory()
      },
    )
  }

  handelLoadMore = () => {
    this.queryVisitHistory()
  }

  handelPrintMedicalCheckup = medicalCheckupWorkitemFK => {
    const { dispatch, handlePreviewReport } = this.props
    dispatch({
      type: 'medicalCheckupWorklist/queryLastReportData',
      payload: {
        id: medicalCheckupWorkitemFK,
      },
    }).then(response => {
      if (response && response.status === '200') {
        const payload = getMedicalCheckupReportPayload(response.data)
        handlePreviewReport(JSON.stringify(payload))
      }
    })
  }
  render() {
    const { clinicSettings, scriblenotes, fromModule, height } = this.props
    const cfg = {}
    const {
      showHistoryDetails,
      selectHistory,
      activeKey,
      totalVisits,
      pageIndex,
      loadVisits = [],
      currentHeight,
      isLoadingData,
    } = this.state
    const { settings = {} } = clinicSettings
    const { viewVisitPageSize = 10 } = settings
    const moreData = totalVisits > pageIndex * viewVisitPageSize
    let otherHeight = 0
    if (fromModule === 'PatientDashboard') {
      otherHeight = 290
    } else if (fromModule === 'Consultation') {
      otherHeight = 415
    } else if (fromModule === 'History') {
      otherHeight = 190
    } else if (fromModule === 'PatientHistory') {
      otherHeight = 390
    }
    let visitContentHeight = currentHeight - otherHeight
    if (fromModule === 'MedicalCheckup') {
      visitContentHeight = height - 165
    }
    return (
      <div {...cfg}>
        <CardContainer hideHeader size='sm'>
          {fromModule === 'Consultation'
            ? this.getConsultationFilterBar()
            : this.getFilterBar()}
          <div
            style={{
              overflow: 'auto',
              height: visitContentHeight,
            }}
          >
            {loadVisits.length > 0 ? (
              <div>
                <Collapse
                  style={{ border: 0 }}
                  activeKey={activeKey}
                  expandIconPosition={null}
                >
                  {loadVisits.map(o => {
                    return (
                      <Collapse.Panel
                        header={this.getTitle(o)}
                        key={o.currentId}
                        style={{ border: '1px solid #d9d9d9', borderRadius: 5 }}
                        className={customtyles.customPanel}
                      >
                        {this.getDetailPanel(o)}
                      </Collapse.Panel>
                    )
                  })}
                </Collapse>
              </div>
            ) : (
              <p>{isLoadingData ? 'Loading' : 'No Visit Record Found'}</p>
            )}
            <div
              style={{
                display: 'inline-Block',
                float: 'right',
                height: 30,
                paddingTop: 8,
                marginRight: 10,
              }}
            >
              {moreData && (
                <a
                  style={{ textDecoration: 'underline', fontStyle: 'italic' }}
                  onClick={this.handelLoadMore}
                >
                  Load More
                </a>
              )}
            </div>
          </div>
        </CardContainer>
        <CommonModal
          open={scriblenotes.showViewScribbleModal}
          title='Scribble'
          fullScreen
          bodyNoPadding
          observe='ScribbleNotePage'
          onClose={this.toggleScribbleModal}
        >
          <ScribbleNote
            {...this.props}
            toggleScribbleModal={this.toggleScribbleModal}
            scribbleData={this.state.selectedData}
          />
        </CommonModal>
        <CommonModal
          open={showHistoryDetails}
          title='History'
          fullScreen
          bodyNoPadding
          keepMounted={false}
          onClose={this.closeHistoryDetails}
        >
          <HistoryDetails
            {...this.props}
            closeHistoryDetails={this.closeHistoryDetails}
            selectHistory={selectHistory}
            scribbleNoteUpdateState={this.scribbleNoteUpdateState}
            getCategoriesOptions={this.getCategoriesOptions}
          />
        </CommonModal>
        <CommonModal
          maxWidth='xl'
          title='Actualization History'
          className={customtyles.deepCommomModel}
          open={this.state.showActualizationHistory}
          onClose={this.closeActualizationHistory}
        >
          <NurseActualization
            nurseWorkitemIds={this.state.currentOrders
              .map(x => x.nurseWorkitemFK)
              .filter(x => x)
              .join(',')}
            dispatch={this.props.dispatch}
            onClose={this.closeActualizationHistory}
          />
        </CommonModal>
      </div>
    )
  }
}

export default withWebSocket()(
  withStyles(styles, { withTheme: true })(PatientHistory),
)
