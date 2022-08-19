import React, { memo, useEffect, useState, Fragment } from 'react'
import { withStyles } from '@material-ui/core'
// antd
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined'
// formik
import { Field, FastField } from 'formik'
// umi
import { formatMessage } from 'umi'
// custom components
import _ from 'lodash'
import { Alert } from 'antd'
import {
  TextField,
  NumberInput,
  GridContainer,
  CommonCard,
  GridItem,
  CodeSelect,
  Select,
  ClinicianSelect,
  Checkbox,
  Tooltip,
  Switch,
  Popover,
  IconButton,
  Icon,
  EditableTableGrid,
  Popconfirm,
  Button,
} from '@/components'
// medisys components
import {
  DoctorProfileSelect,
  Attachment,
  AttachmentWithThumbnail,
} from '@/components/_medisys'
import {
  VISIT_TYPE,
  CANNED_TEXT_TYPE,
  MEDICALCHECKUP_WORKITEM_STATUS,
} from '@/utils/constants'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { visitOrderTemplateItemTypes } from '@/utils/codes'
import { roundTo, getMappedVisitType } from '@/utils/utils'
import numeral from 'numeral'
import FormField from './formField'
import { getMCReportLanguage } from './miscUtils'
import Authorized from '@/utils/Authorized'
import CannedTextButton from '@/pages/Widgets/Orders/Detail/CannedTextButton'

const styles = theme => ({
  verticalSpacing: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  attachmentLabel: {
    fontSize: '0.9rem',
    fontWeight: 300,
  },
  attachmentItem: {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
  },
  notUploaded: {
    '& > a': {
      color: '#999',
    },
  },
  switchContainer: {
    lineHeight: '1em',
    borderRadius: 3,
    height: 24,
    margin: 0,
    color: 'currentColor',
    overflow: 'visible',
    top: -2,
    '& .ant-switch-handle': {
      width: 20,
      height: 20,
      '&::before': {
        borderRadius: 3,
        right: 2,
      },
    },
  },
  visitGroupLabel: {
    fontSize: '0.7rem',
    fontWeight: 300,
  },
})

const amountProps = {
  style: { margin: 0 },
  noUnderline: true,
  currency: true,
  disabled: true,
  normalText: true,
  showZero: true,
  fullWidth: false,
}

const VisitInfoCard = ({
  classes,
  isReadOnly = false,
  fromMedicalCheckupReporting = false,
  isVisitReadonlyAfterSigned = false,
  isDoctorConsulted = false,
  attachments,
  handleUpdateAttachments,
  existingQNo,
  visitType,
  visitOrderTemplateOptions = [],
  setFieldValue,
  ctinvoiceadjustment,
  copaymentScheme,
  patientInfo,
  clinicSettings,
  currentVisitTemplate,
  queueLog,
  visitMode,
  ctvisitpurpose,
  doctorProfiles,
  ...restProps
}) => {
  const [visitGroupMessage, setVisitGroupMessage] = useState()
  const [visitGroupPopup, setVisitGroupPopup] = useState(false)

  useEffect(() => {
    if (currentVisitTemplate) {
      let activeItemTotal = getVisitOrderTemplateTotal(
        visitType,
        currentVisitTemplate,
      )
      setFieldValue(FormField['visit.VisitOrderTemplateTotal'], activeItemTotal)
    } else {
      if (!restProps.values.visitOrderTemplateFK)
        setFieldValue(FormField['visit.VisitOrderTemplateTotal'], undefined)
    }
  }, [currentVisitTemplate, visitType])
  // console.log(fromMedicalCheckupReporting)
  const disableConsReady = Authorized.check('queue.modifyconsultationready')

  const validateQNo = value => {
    const qNo = parseFloat(value).toFixed(
      clinicSettings.settings.isQueueNoDecimal ? 1 : 0,
    )
    if (!fromMedicalCheckupReporting && existingQNo.includes(qNo))
      return 'Queue No. already existed in current queue list'
    return ''
  }

  const isPrimaryDoctorConsultated =
    restProps.values?.visitPrimaryDoctor &&
    restProps.values?.visitPrimaryDoctor?.consultationStatus !== 'Waiting'
  const getVisitOrderTemplateTotal = (vType, template) => {
    let activeItemTotal = 0
    visitOrderTemplateItemTypes.forEach(type => {
      // type.id === 3 means vaccination
      if (vType === VISIT_TYPE.OTC && type.id === 3) return
      const currentTypeItems = template.visitOrderTemplateItemDtos.filter(
        itemType => itemType.inventoryItemTypeFK === type.id,
      )
      currentTypeItems.map(item => {
        if (item[type.dtoName].isActive === true) {
          activeItemTotal += item.totalAftAdj || 0
        }
      })
    })
    return activeItemTotal
  }

  const validateTotalCharges = async value => {
    const { values, dispatch } = restProps
    let totalTempCharge = 0
    if ((values.visitOrderTemplateFK || 0) > 0) {
      if (currentVisitTemplate) {
        totalTempCharge = getVisitOrderTemplateTotal(
          visitType,
          currentVisitTemplate,
        )
      } else {
        await dispatch({
          type: 'settingVisitOrderTemplate/queryOne',
          payload: {
            id: values.visitOrderTemplateFK,
          },
        }).then(template => {
          if (template) {
            totalTempCharge = getVisitOrderTemplateTotal(visitType, template)
          }
        })
      }
    }
    if ((value || 0) > totalTempCharge) {
      return `Cannot more than default charges(${totalTempCharge}).`
    }
    return ''
  }

  const handleDoctorChange = (v, op) => {
    if (op.clinicianProfile) {
      const { roomAssignment = {} } = op.clinicianProfile
      setFieldValue(FormField['visit.roomFK'], roomAssignment.roomFK)
      if (!op.clinicianProfile.specialtyFK) {
        setFieldValue(FormField['visit.isDoctorInCharge'], true)
      }
    } else {
      setFieldValue(FormField['visit.isDoctorInCharge'], true)
    }
  }

  const handleVisitOrderTemplateChange = (vType, opts) => {
    const { dispatch, getVisitOrderTemplateDetails } = restProps
    if (opts) {
      getVisitOrderTemplateDetails(opts.id)
    } else {
      getVisitOrderTemplateDetails(undefined)
      setFieldValue(FormField['visit.VisitOrderTemplateTotal'], undefined)
    }
  }

  const handleVisitTypeChange = (v, op) => {
    const { values, dispatch, getVisitOrderTemplateDetails } = restProps
    setFieldValue(FormField['visit.visitType'], v)
    if (v !== 1) {
      setFieldValue(FormField['visit.consReady'], false)
    }
    setFieldValue(FormField['visit.isDoctorInCharge'], true)
    updateMedicalCheckup(v, values.isForInvoiceReplacement)
    setFieldValue('visitBasicExaminations[0].visitPurposeFK', v)
    if (currentVisitTemplate) {
      handleVisitOrderTemplateChange(v, currentVisitTemplate)
    }
  }

  const updateMedicalCheckup = (visitPurposeFK, isForInvoiceReplacement) => {
    if (visitPurposeFK != VISIT_TYPE.MC || isForInvoiceReplacement) {
      setFieldValue('visitDoctor', [
        ...values.visitDoctor.map(d => {
          return { ...d, isDeleted: true }
        }),
      ])
      setFieldValue('medicalCheckupWorkitem[0].reportLanguage', undefined)
      setFieldValue('medicalCheckupWorkitem[0].reportPriority', undefined)
      setFieldValue('medicalCheckupWorkitem[0].urgentReportRemarks', undefined)
    } else {
      setFieldValue('medicalCheckupWorkitem[0].reportLanguage', [
        getMCReportLanguage(patientInfo, clinicSettings.settings),
      ])
      setFieldValue('medicalCheckupWorkitem[0].reportPriority', 'Normal')
      setFieldValue(
        'medicalCheckupWorkitem[0].statusFK',
        MEDICALCHECKUP_WORKITEM_STATUS.INPROGRESS,
      )
    }
  }

  const handleIsForInvoiceReplacementChange = v => {
    const { values } = restProps
    updateMedicalCheckup(values.visitPurposeFK, v.target.value)
  }

  const handleVisitGroupChange = (v, op) => {
    setFieldValue(FormField['visit.visitGroup'], op ? op.data.visitGroup : null)
    setFieldValue(FormField['visit.consReady'], false)
    setFieldValue(
      FormField['visit.visitGroupRef'],
      op && op.data.visitGroup === op.data.order ? op.data.order : null,
    )
    setVisitGroupMessage(
      op && op.data.visitGroup === op.data.order
        ? 'New group create with ' + op.data.patientName
        : null,
    )
  }

  const handleVisitGroupFocus = (v, op) => {
    setVisitGroupPopup(true)
  }

  const handleVisitGroupBlur = (v, op) => {
    setVisitGroupPopup(false)
  }

  const { values, dispatch } = restProps
  let totalTempCharge = 0
  if ((values.visitOrderTemplateFK || 0) > 0 && currentVisitTemplate) {
    totalTempCharge = getVisitOrderTemplateTotal(
      visitType,
      currentVisitTemplate,
    )
  }
  let showNotApplyAdjustment =
    totalTempCharge !== (values.visitOrderTemplateTotal || 0)
  let showAdjusment =
    values.visitStatus === VISIT_STATUS.WAITING ||
    values.visitStatus === VISIT_STATUS.UPCOMING_APPT

  const {
    isEnablePackage = false,
    visitTypeSetting,
    isQueueNoDecimal,
  } = clinicSettings.settings
  let visitTypeSettingsObj = undefined
  let visitPurpose = undefined
  if (visitTypeSetting) {
    try {
      visitTypeSettingsObj = JSON.parse(visitTypeSetting)
    } catch {}
  }
  if ((ctvisitpurpose || []).length > 0) {
    visitPurpose = getMappedVisitType(
      ctvisitpurpose,
      visitTypeSettingsObj,
    ).filter(vstType => vstType['isEnabled'] === 'true')
  }

  const family = patientInfo?.patientFamilyGroup?.patientFamilyMember
  const familyMembers = family
    ? [...family.map(mem => mem.name), patientInfo?.patientFamilyGroup.name]
    : []
  const visitGroups = [
    ...queueLog.list
      .filter((q, i, a) => {
        return (
          patientInfo &&
          patientInfo.name !== q.patientName &&
          a.map(m => m.patientName).indexOf(q.patientName) === i
        )
      })
      .map(l => {
        return {
          visitGroup: l.visitGroup || l.id,
          displayValue: l.visitGroup || 'New Group Number',
          patientName: l.patientName,
          order: l.id,
          isFamilyMember: familyMembers?.indexOf(l.patientName) >= 0,
        }
      }),
  ]

  useEffect(() => {
    const noVisitGroup = !values.visitGroup
    if (noVisitGroup && familyMembers) {
      const groupsList = visitGroups.map(vg => vg.patientName)
      familyMembers.some(member => {
        const group = groupsList.indexOf(member) >= 0
        if (group) {
          setVisitGroupMessage(`Family member ${member} is registered in queue`)
          return true
        }
        return false
      })
    } else if (!noVisitGroup) return
    else setVisitGroupMessage(null)
  }, [values, familyMembers])

  const getAvailableOrderTemplate = () => {
    let availableVisitOrderTemplate = []
    var patientCopayers = patientInfo?.patientScheme
      ?.filter(x => !x.isExpired && x.isSchemeActive && x.isCopayerActive)
      ?.map(x => x.copayerFK)
    if (patientInfo) {
      visitOrderTemplateOptions
        .filter(x => x.isActive)
        .forEach(template => {
          if ((template.visitOrderTemplate_Copayers || []).length === 0) {
            availableVisitOrderTemplate.push({
              ...template,
              type: 'general',
              value: template.id,
              name: template.displayValue,
            })
          } else {
            if (
              _.intersection(
                template.visitOrderTemplate_Copayers.map(x => x.copayerFK),
                patientCopayers,
              ).length > 0
            ) {
              availableVisitOrderTemplate.push({
                ...template,
                type: 'copayer',
                value: template.id,
                name: template.displayValue,
              })
            }
          }
        })
    } else {
      visitOrderTemplateOptions
        .fitler(x => x.isActive)
        .forEach(template => {
          // if haven't select patient profile, then only show general package
          if ((template.visitOrderTemplate_Copayers || []).length === 0) {
            availableVisitOrderTemplate.push({
              ...template,
              value: template.id,
              name: template.displayValue,
            })
          }
        })
    }
    availableVisitOrderTemplate = _.orderBy(
      availableVisitOrderTemplate,
      [data => data?.type?.toLowerCase(), data => data?.name?.toLowerCase()],
      ['asc', 'asc'],
    )
    return availableVisitOrderTemplate
  }
  const notWaiting =
    (values.visitStatus !== VISIT_STATUS.WAITING &&
      values.visitStatus !== VISIT_STATUS.UPCOMING_APPT) ||
    visitMode === 'view'

  const hasCOR = values.clinicalObjectRecordFK
  const activeCORCreatedBy = values.activeCORCreatedBy
  const mcWorkItemInProgress =
    values?.medicalCheckupWorkitem &&
    values?.medicalCheckupWorkitem.length > 0 &&
    (values?.medicalCheckupWorkitem[0].statusFK === 1 ||
      values?.medicalCheckupWorkitem[0].statusFK === 2)
  const isSpecialtyDoctor = () => {
    var primaryDoctor = doctorProfiles.find(
      x => x.id === values?.doctorProfileFK,
    )
    if (primaryDoctor?.clinicianProfile?.specialtyFK) {
      return true
    }
    return false
  }
  return (
    <CommonCard title='Visit Information'>
      <GridContainer alignItems='center'>
        <GridContainer>
          <GridItem xs md={3}>
            <Field
              name={FormField['visit.visitType']}
              render={args => (
                <CodeSelect
                  disabled={notWaiting || isReadOnly || hasCOR}
                  label={formatMessage({
                    id: 'reception.queue.visitRegistration.visitType',
                  })}
                  onChange={(v, op = {}) => handleVisitTypeChange(v, op)}
                  options={visitPurpose || []}
                  allowClear={false}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs md={3}>
            <Field
              name={FormField['visit.doctorProfileFk']}
              render={args => (
                <DoctorProfileSelect
                  disabled={
                    fromMedicalCheckupReporting
                      ? isPrimaryDoctorConsultated || !mcWorkItemInProgress
                      : isPrimaryDoctorConsultated || isReadOnly
                  }
                  authority='none'
                  onChange={(v, op = {}) => handleDoctorChange(v, op)}
                  label={
                    visitType === VISIT_TYPE.OTC
                      ? formatMessage({
                          id:
                            'reception.queue.visitRegistration.attendantDoctor',
                        })
                      : formatMessage({
                          id: 'reception.queue.visitRegistration.doctor',
                        })
                  }
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs md={3}>
            <div
              style={{
                position: 'relative',
                paddingLeft: values?.visitPurposeFK === VISIT_TYPE.MC ? 150 : 0,
              }}
            >
              {values?.visitPurposeFK === VISIT_TYPE.MC && (
                <Field
                  name={FormField['visit.isDoctorInCharge']}
                  render={args => {
                    return (
                      <Checkbox
                        {...args}
                        disabled={!isSpecialtyDoctor()}
                        simple
                        label='Doctor In Charge'
                        style={{ position: 'absolute', top: 16, left: 0 }}
                      />
                    )
                  }}
                />
              )}
              <Field
                name={FormField['visit.queueNo']}
                validate={validateQNo}
                render={args => (
                  <NumberInput
                    {...args}
                    precision={isQueueNoDecimal ? 1 : 0}
                    disabled={
                      fromMedicalCheckupReporting
                        ? true
                        : notWaiting || isReadOnly
                    }
                    label={formatMessage({
                      id: 'reception.queue.visitRegistration.queueNo',
                    })}
                    formatter={value => {
                      const isNaN = Number.isNaN(parseFloat(value))
                      return isNaN
                        ? value
                        : parseFloat(value).toFixed(isQueueNoDecimal ? 1 : 0)
                    }}
                  />
                )}
              />
            </div>
          </GridItem>
          <GridItem xs md={3}>
            {isEnablePackage && (
              <Field
                name={FormField['visit.salesPersonUserFK']}
                render={args => (
                  <ClinicianSelect
                    label={formatMessage({
                      id: 'reception.queue.visitRegistration.salesPerson',
                    })}
                    disabled={isReadOnly}
                    authority='none'
                    {...args}
                  />
                )}
              />
            )}
            <Field
              name='isForInvoiceReplacement'
              render={args => (
                <Checkbox
                  style={{ position: 'relative', top: 16 }}
                  {...args}
                  disabled={
                    fromMedicalCheckupReporting
                      ? true
                      : notWaiting || isReadOnly
                  }
                  tooltip='This visit is created for past invoice replacement.'
                  label='For Invoice Replacement'
                  onChange={handleIsForInvoiceReplacementChange}
                />
              )}
            />
          </GridItem>
        </GridContainer>

        <GridItem xs md={3}>
          <Field
            name={FormField['visit.roomFK']}
            render={args => (
              <CodeSelect
                disabled={
                  fromMedicalCheckupReporting ? true : notWaiting || isReadOnly
                }
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.room',
                })}
                code='ctRoom'
                {...args}
              />
            )}
          />
        </GridItem>
        <GridItem xs md={3}>
          <Field
            name={FormField['visit.visitOrderTemplateFK']}
            render={args => {
              return (
                <Select
                  options={getAvailableOrderTemplate()}
                  label={formatMessage({
                    id: 'reception.queue.visitRegistration.visitOrderTemplate',
                  })}
                  {...args}
                  dropdownStyle={{ width: 500 }}
                  dropdownMatchSelectWidth={false}
                  authority='none'
                  disabled={
                    fromMedicalCheckupReporting
                      ? true
                      : notWaiting || isReadOnly
                  }
                  onChange={(e, opts) =>
                    handleVisitOrderTemplateChange(visitType, opts)
                  }
                  renderDropdown={option => {
                    const copayers = _.orderBy(
                      option.visitOrderTemplate_Copayers.map(
                        x => x.copayerName,
                      ),
                      data => data.toLowerCase(),
                      'asc',
                    ).join(', ')
                    const tooltip = (
                      <div>
                        <div>{option.name}</div>
                        {(option.visitOrderTemplate_Copayers || []).length >
                          0 && <div>Co-Payer(s): {copayers}</div>}
                        {(option.visitOrderTemplate_Copayers || []).length ===
                          0 && (
                          <div>
                            <i>General</i>
                          </div>
                        )}
                      </div>
                    )
                    return (
                      <Tooltip placement='right' title={tooltip}>
                        <div>
                          <div
                            style={{
                              fontWeight: '550',
                              width: '100%',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {option.name}
                          </div>
                          {(option.visitOrderTemplate_Copayers || []).length >
                            0 && (
                            <div
                              style={{
                                width: '100%',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span>Co-Payer(s): </span>
                              <span style={{ color: '#4255bd' }}>
                                {copayers}
                              </span>
                            </div>
                          )}
                          {(option.visitOrderTemplate_Copayers || []).length ===
                            0 && (
                            <div
                              style={{
                                width: '100%',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span style={{ color: 'green' }}>
                                <i>General</i>
                              </span>
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    )
                  }}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs md={3}>
          <Field
            name={FormField['visit.VisitOrderTemplateTotal']}
            validate={validateTotalCharges}
            render={args => {
              const { form: fm } = args
              const readOnly = (fm.values.visitOrderTemplateFK || 0) <= 0
              return (
                <NumberInput
                  {...args}
                  currency
                  authority='none'
                  suffix='$'
                  disabled={
                    fromMedicalCheckupReporting
                      ? true
                      : readOnly || notWaiting || isReadOnly
                  }
                  label={formatMessage({
                    id:
                      'reception.queue.visitRegistration.visitOrderTotalCharge',
                  })}
                />
              )
            }}
          />
        </GridItem>
        <GridItem xs md={3}>
          <Authorized authority='queue.modifyconsultationready'>
            <Field
              name={FormField['visit.consReady']}
              render={args => (
                <Switch
                  className={classes.switchContainer}
                  label={formatMessage({
                    id: 'reception.queue.visitRegistration.consReady',
                  })}
                  tooltip='Ready for Consultaton'
                  disabled={
                    fromMedicalCheckupReporting
                      ? true
                      : (disableConsReady &&
                          disableConsReady.rights === 'Disable') ||
                        isReadOnly
                  }
                  {...args}
                />
              )}
            />
          </Authorized>
        </GridItem>
        <GridItem xs md={6}>
          <div style={{ position: 'relative' }}>
            <Field
              name={FormField['visit.visitRemarks']}
              render={args => (
                <TextField
                  {...args}
                  multiline
                  rowsMax={3}
                  authority='none'
                  disabled={fromMedicalCheckupReporting ? false : isReadOnly}
                  label={formatMessage({
                    id: 'reception.queue.visitRegistration.visitRemarks',
                  })}
                />
              )}
            />
            <CannedTextButton
              disabled={fromMedicalCheckupReporting ? false : isReadOnly}
              cannedTextTypeFK={CANNED_TEXT_TYPE.APPOINTMENTREMARKS}
              style={{
                position: 'absolute',
                bottom: 0,
                right: -5,
              }}
              handleSelectCannedText={cannedText => {
                const remarks = values.visitRemarks
                const newRemaks = `${
                  remarks ? remarks + '\n' : ''
                }${cannedText.text || ''}`.substring(0, 2000)
                setFieldValue(FormField['visit.visitRemarks'], newRemaks)
              }}
            />
          </div>
        </GridItem>
        <GridItem xs md={3}>
          <Authorized authority='queue.visitgroup'>
            <React.Fragment>
              <Select
                valueField='order'
                labelField='displayValue'
                value={values.visitGroup}
                disabled={isReadOnly}
                options={_.orderBy(
                  visitGroups,
                  ['isFamilyMember', 'order'],
                  ['desc', 'desc'],
                )}
                handleFilter={(input, option) => {
                  return (
                    option.data.visitGroup
                      .toString()
                      .toLowerCase()
                      .indexOf(input.toString().toLowerCase()) >= 0 ||
                    option.data.patientName
                      .toString()
                      .toLowerCase()
                      .indexOf(input.toString().toLowerCase()) >= 0 ||
                    input === ''
                  )
                }}
                label='Visit Group Number'
                dropdownStyle={{ minWidth: '20%' }}
                onClear={handleVisitGroupChange}
                onSelect={handleVisitGroupChange}
                // onFocus={handleVisitGroupFocus}
                // onBlur={handleVisitGroupBlur}
                renderDropdown={option => {
                  return (
                    <GridContainer>
                      <GridItem sm={2} md={2}>
                        <b>
                          {option.visitGroup === option.order
                            ? ''
                            : option.visitGroup}
                        </b>
                      </GridItem>
                      <GridItem sm={9} md={9} style={{ overflow: 'hidden' }}>
                        {option.patientName}
                      </GridItem>
                      {option.isFamilyMember ? (
                        <GridItem style={{ padding: 0 }} sm={1} md={1}>
                          <Icon style={{ fontSize: 20 }} type='family' />
                        </GridItem>
                      ) : (
                        ''
                      )}
                    </GridContainer>
                  )
                }}
              />
              {visitGroupMessage && (
                <div style={{ position: 'relative' }}>
                  <Alert
                    message={visitGroupMessage}
                    type='warning'
                    showIcon={false}
                    style={{
                      position: 'absolute',
                      maxWidth: '440px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      padding: '0 3px',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          </Authorized>
        </GridItem>
        <GridItem xs md={3}>
          <Fragment>
            <Authorized authority='queue.visitgroup'>
              <Popover
                icon={null}
                visible={visitGroupPopup}
                placement='topLeft'
                content={
                  <div>
                    <p>- Search by existing group number or patient name.</p>
                    <p>- Selecting visit group will set Cons. Ready to "No".</p>
                  </div>
                }
              >
                <IconButton
                  size='small'
                  style={{ position: 'relative', top: 8 }}
                  onMouseOver={handleVisitGroupFocus}
                  onMouseOut={handleVisitGroupBlur}
                >
                  <InfoCircleOutlined />
                </IconButton>
              </Popover>
            </Authorized>
          </Fragment>
        </GridItem>
        {showAdjusment &&
        ((ctinvoiceadjustment || []).length > 0 ||
          (copaymentScheme || []).length > 0) ? (
          <GridItem xs md={12}>
            <div style={{ marginTop: '5px' }}>
              <p>
                Below invoice adjustment(s) will{' '}
                {showNotApplyAdjustment ? (
                  <span style={{ fontWeight: 500, color: 'red' }}>NOT</span>
                ) : (
                  undefined
                )}{' '}
                be applied to the total bill:
              </p>
              {(ctinvoiceadjustment || []).map(t => {
                if (t.adjType === 'ExactAmount') {
                  return (
                    <span
                      style={{
                        display: 'inline-block',
                        marginRight: '20px',
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>
                        {t.displayValue}:
                      </span>{' '}
                      <NumberInput
                        text
                        {...amountProps}
                        style={{ display: 'inline-block' }}
                        value={t.adjValue}
                      />
                      ;{' '}
                    </span>
                  )
                }

                if (t.adjValue > 0) {
                  return (
                    <span
                      style={{
                        display: 'inline-block',
                        marginRight: '20px',
                      }}
                    >
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>
                        {t.displayValue}:{' '}
                        <span style={{ color: 'darkblue' }}>
                          {numeral(t.adjValue).format('0.00')}%;
                        </span>
                      </span>
                    </span>
                  )
                }

                return (
                  <span
                    style={{
                      display: 'inline-block',
                      marginRight: '20px',
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>
                      {t.displayValue}:{' '}
                    </span>
                    <span
                      style={{
                        color: 'red',
                        display: 'inline-block',
                        fontWeight: '500',
                      }}
                    >
                      <span>
                        ({numeral(Math.abs(t.adjValue)).format('0.00')}%)
                      </span>
                    </span>
                    ;
                  </span>
                )
              })}
              {(copaymentScheme || []).filter(
                t => t.copayerInvoiceAdjustmentValue !== 0,
              ).length > 0 ? (
                <p>
                  {(copaymentScheme || [])
                    .filter(t => t.copayerInvoiceAdjustmentValue !== 0)
                    .map(t => {
                      if (t.copayerInvoiceAdjustmentType === 'ExactAmount') {
                        return (
                          <span
                            style={{
                              display: 'inline-block',
                              marginRight: '20px',
                            }}
                          >
                            <span style={{ fontWeight: '500' }}>
                              {t.coPayerName}
                            </span>
                            :{' '}
                            <NumberInput
                              text
                              {...amountProps}
                              style={{ display: 'inline-block' }}
                              value={t.copayerInvoiceAdjustmentValue}
                            />
                            ;{' '}
                          </span>
                        )
                      }

                      if (t.copayerInvoiceAdjustmentValue > 0) {
                        return (
                          <span
                            style={{
                              display: 'inline-block',
                              marginRight: '20px',
                            }}
                          >
                            <span style={{ fontWeight: '500' }}>
                              {t.coPayerName}:{' '}
                              <span style={{ color: 'darkblue' }}>
                                {numeral(
                                  t.copayerInvoiceAdjustmentValue,
                                ).format('0.00')}
                                %;
                              </span>
                            </span>
                          </span>
                        )
                      }

                      return (
                        <span
                          style={{
                            display: 'inline-block',
                            marginRight: '20px',
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>
                            {t.coPayerName}:{' '}
                          </span>
                          <span
                            style={{
                              color: 'red',
                              display: 'inline-block',
                              fontWeight: '500',
                            }}
                          >
                            <span>
                              (
                              {numeral(
                                Math.abs(t.copayerInvoiceAdjustmentValue),
                              ).format('0.00')}
                              %)
                            </span>
                          </span>
                          ;
                        </span>
                      )
                    })}
                </p>
              ) : (
                undefined
              )}
            </div>
          </GridItem>
        ) : (
          undefined
        )}
        <GridItem xs md={12}>
          <AttachmentWithThumbnail
            label='Attachment'
            attachmentType='Visit'
            handleUpdateAttachments={handleUpdateAttachments}
            attachments={attachments}
            isReadOnly={
              fromMedicalCheckupReporting ? !mcWorkItemInProgress : isReadOnly
            }
            disableScanner={
              fromMedicalCheckupReporting ? !mcWorkItemInProgress : isReadOnly
            }
            fieldName='visitAttachment'
          />
        </GridItem>
        {values.visitStatus === VISIT_STATUS.WAITING && hasCOR && (
          <GridItem xs md={12}>
            <div style={{ color: 'red', padding: '10px 0' }}>
              <strong>*Information</strong>:{' '}
              {`${activeCORCreatedBy} is
              occupying this visit, Visit Type is not able to change.`}
            </div>
          </GridItem>
        )}
      </GridContainer>
    </CommonCard>
  )
}

export default memo(
  withStyles(styles, { name: 'VisitInfoCard' })(VisitInfoCard),
)
