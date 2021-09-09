import React, { memo, useEffect, useState } from 'react'
import { withStyles } from '@material-ui/core'
// antd
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined'
// formik
import { Field } from 'formik'
// umi
import { formatMessage } from 'umi'
// custom components
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
  Switch,
  Popover,
  IconButton,
  Icon,
} from '@/components'
// medisys components
import {
  DoctorLabel,
  DoctorProfileSelect,
  Attachment,
  AttachmentWithThumbnail,
} from '@/components/_medisys'
import { VISIT_TYPE } from '@/utils/constants'
import { VISIT_STATUS } from '@/pages/Reception/Queue/variables'
import { visitOrderTemplateItemTypes } from '@/utils/codes'
import { roundTo } from '@/utils/utils'
import numeral from 'numeral'
import FormField from './formField'
import Authorized from '@/utils/Authorized'

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
    height: '100%',
    color: 'currentColor',
    borderRadius: 0,
    '& .ant-switch-handle': {
      width: 20,
      height: 16,
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
  isVisitReadonlyAfterSigned = false,
  attachments,
  handleUpdateAttachments,
  existingQNo,
  visitType,
  visitOrderTemplateOptions,
  setFieldValue,
  ctinvoiceadjustment,
  copaymentScheme,
  patientInfo,
  clinicSettings,
  queueLog,
  ctvisitpurpose,
  ...restProps
}) => {
  const [visitGroupMessage, setVisitGroupMessage] = useState()
  const [visitGroupPopup, setVisitGroupPopup] = useState(false)

  const disableConsReady = Authorized.check('queue.modifyconsultationready')

  const validateQNo = value => {
    const qNo = parseFloat(value).toFixed(1)
    if (existingQNo.includes(qNo))
      return 'Queue No. already existed in current queue list'
    return ''
  }

  const getVisitOrderTemplateTotal = (vType, template) => {
    let activeItemTotal = 0
    visitOrderTemplateItemTypes.forEach(type => {
      // type.id === 3 means vaccination
      if (vType === VISIT_TYPE.RETAIL && type.id === 3) return
      const currentTypeItems = template.visitOrderTemplateItemDtos.filter(
        itemType => itemType.inventoryItemTypeFK === type.id,
      )
      currentTypeItems.map(item => {
        if (item[type.dtoName].isActive === true) {
          activeItemTotal += item.total || 0
        }
      })
    })
    return activeItemTotal
  }

  const validateTotalCharges = value => {
    const { values } = restProps
    let totalTempCharge = 0
    if ((values.visitOrderTemplateFK || 0) > 0) {
      const template = visitOrderTemplateOptions.find(
        i => i.id === values.visitOrderTemplateFK,
      )
      totalTempCharge = getVisitOrderTemplateTotal(visitType, template)
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
    }
  }

  const handleVisitOrderTemplateChange = (vType, opts) => {
    if (opts) {
      let activeItemTotal = getVisitOrderTemplateTotal(vType, opts)

      setFieldValue(FormField['visit.VisitOrderTemplateTotal'], activeItemTotal)
    } else {
      setTimeout(() => {
        setFieldValue(FormField['visit.VisitOrderTemplateTotal'], undefined)
      }, 1)
    }
  }

  const handleVisitTypeChange = (v, op) => {
    const { values } = restProps
    const template = visitOrderTemplateOptions.find(
      i => i.id === values.visitOrderTemplateFK,
    )
    setFieldValue(FormField['visit.visitType'], v)
    if (template) {
      handleVisitOrderTemplateChange(v, template)
    }
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

  const { values } = restProps
  let totalTempCharge = 0
  if ((values.visitOrderTemplateFK || 0) > 0) {
    const template = visitOrderTemplateOptions.find(
      i => i.id === values.visitOrderTemplateFK,
    )
    totalTempCharge = getVisitOrderTemplateTotal(visitType, template)
  }
  let showNotApplyAdjustment =
    totalTempCharge !== (values.visitOrderTemplateTotal || 0)
  let showAdjusment =
    values.visitStatus === VISIT_STATUS.WAITING ||
    values.visitStatus === VISIT_STATUS.UPCOMING_APPT

  const { isEnablePackage = false, visitTypeSetting } = clinicSettings.settings

  let visitTypeSettingsObj = undefined
  let visitPurpose = undefined

  if(visitTypeSetting){
    visitTypeSettingsObj = JSON.parse(visitTypeSetting)
  }    

  const mapVisitType = (visitpurpose, visitTypeSettingsObj) => {
    return visitpurpose.map((item, index) => {
      const { name, code,sortOrder, ...rest } = item
      const vstType = visitTypeSettingsObj ? visitTypeSettingsObj[index] : undefined
      return {
        ...rest,
        name: vstType?.displayValue || name,
        code: vstType?.code || code,
        isEnabled: vstType?.isEnabled || 'true',
        sortOrder: vstType?.sortOrder || 0,
        customTooltipField : `${vstType?.code || code} - ${vstType?.displayValue || name}` 
      }
    }).sort((a, b) => a.sortOrder >= b.sortOrder ? 1 : -1)
  }

  if ((ctvisitpurpose || []).length > 0) {
    visitPurpose = mapVisitType(ctvisitpurpose, visitTypeSettingsObj).filter(
      vstType => vstType['isEnabled'] === 'true',
    )
  }

  const familyMembers = patientInfo?.patientFamilyGroup?.patientFamilyMember.map(mem => mem.name)
  const visitGroups = [...queueLog.list.filter((q, i, a) => {
    return patientInfo && patientInfo.name !== q.patientName && a.map(m => m.patientName).indexOf(q.patientName) === i
  }).map(l => {
      console.log(familyMembers, familyMembers?.indexOf(l.patientName) >= 0)
      return {
        visitGroup: l.visitGroup || l.id,
        displayValue: l.visitGroup || 'New Group Number',
        patientName: l.patientName,
        order: l.id,
        isFamilyMember: familyMembers?.indexOf(l.patientName) >= 0,
      }
    })]

  useEffect(() => {
    const noVisitGroup = !values.visitGroup
    if(noVisitGroup && familyMembers)
    {
      const groupsList = visitGroups.map(vg => vg.patientName)
      familyMembers.some(member => {
        const group = groupsList.indexOf(member) >= 0
        if(group)
        {
          setVisitGroupMessage(`Family member ${member} is registered in queue`)
          return true
        }
        return false
      })
    }
    else if (!noVisitGroup)
      return
    else
      setVisitGroupMessage(null)
  },[values, familyMembers])

  return (
    <CommonCard title='Visit Information'>
      <GridContainer alignItems='center'>
        <GridItem xs md={3}>
          <Field
            name={FormField['visit.visitType']}
            render={args => (
              <CodeSelect
                // disabled={isReadOnly}
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
                // disabled={isReadOnly}
                onChange={(v, op = {}) => handleDoctorChange(v, op)}
                label={
                  visitType === VISIT_TYPE.RETAIL
                    ? formatMessage({
                        id: 'reception.queue.visitRegistration.attendantDoctor',
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
          <Field
            name={FormField['visit.queueNo']}
            validate={validateQNo}
            render={args => (
              <NumberInput
                {...args}
                format='0.0'
                // disabled={isReadOnly}
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.queueNo',
                })}
                formatter={value => {
                  const isNaN = Number.isNaN(parseFloat(value))
                  return isNaN ? value : parseFloat(value).toFixed(1)
                }}
              />
            )}
          />
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
                  disabled={isVisitReadonlyAfterSigned}
                  authority='none'
                  {...args}
                />
              )}
            />
          )}
        </GridItem>
        <GridItem xs md={3}>
          <Field
            name={FormField['visit.roomFK']}
            render={args => (
              <CodeSelect
                // disabled={isReadOnly}
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
                  // disabled={isReadOnly}
                  options={visitOrderTemplateOptions}
                  label={formatMessage({
                    id: 'reception.queue.visitRegistration.visitOrderTemplate',
                  })}
                  {...args}
                  authority='none'
                  disabled={isVisitReadonlyAfterSigned}
                  onChange={(e, opts) =>
                    handleVisitOrderTemplateChange(visitType, opts)
                  }
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
                  disabled={readOnly || isVisitReadonlyAfterSigned}
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
                    (disableConsReady &&
                      disableConsReady.rights === 'Disable') ||
                    isVisitReadonlyAfterSigned
                  }
                  {...args}
                />
              )}
            />
          </Authorized>
        </GridItem>
        <GridItem xs md={6}>
          <Field
            name={FormField['visit.visitRemarks']}
            render={args => (
              <TextField
                {...args}
                // disabled={isReadOnly}
                multiline
                rowsMax={3}
                authority='none'
                disabled={isVisitReadonlyAfterSigned}
                label={formatMessage({
                  id: 'reception.queue.visitRegistration.visitRemarks',
                })}
              />
            )}
          />
        </GridItem>
        <GridItem xs md={3}>
          <Authorized authority='queue.visitgroup'>
            <React.Fragment>
              <Select
              valueField='order'
              labelField='displayValue'
              value={values.visitGroup}
              disabled={isVisitReadonlyAfterSigned}
              options={visitGroups}
              handleFilter={(input, option) => {
                return option.data.visitGroup.toString().toLowerCase().indexOf(input.toString().toLowerCase()) >= 0 ||
                option.data.patientName.toString().toLowerCase().indexOf(input.toString().toLowerCase()) >= 0 ||     
                input === ''
              }
              }
              label='Visit Group Number'
              dropdownStyle={{ minWidth: "20%" }}
              onClear={handleVisitGroupChange}
              onSelect={handleVisitGroupChange}
              // onFocus={handleVisitGroupFocus}
              // onBlur={handleVisitGroupBlur}
              renderDropdown={(option) => {
                return <GridContainer>
                  <GridItem sm={2} md={2}>
                    <b>{option.visitGroup === option.order ? '' : option.visitGroup}</b>
                  </GridItem>
                  <GridItem sm={9} md={9} style={{ overflow: 'hidden' }}>
                    {option.patientName}
                  </GridItem>
                  {option.isFamilyMember ? <GridItem sm={1} md={1}><Icon type='family'/></GridItem> : ''}
                </GridContainer>
              }}
            />
              {visitGroupMessage && <div style={{ position: 'relative'}}>
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
              </div>}
            </React.Fragment>
          </Authorized>
        </GridItem>
        <GridItem xs md={3}>
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
                onMouseOver={handleVisitGroupFocus}
                onMouseOut={handleVisitGroupBlur}
              >
                <InfoCircleOutlined />
              </IconButton>
            </Popover>
          </Authorized>
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
                      style={{ display: 'inline-block', marginRight: '20px' }}
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
                      style={{ display: 'inline-block', marginRight: '20px' }}
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
                    style={{ display: 'inline-block', marginRight: '20px' }}
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
            isReadOnly={isReadOnly}
            disableScanner={isReadOnly}
            fieldName='visitAttachment'
          />
        </GridItem>
      </GridContainer>
    </CommonCard>
  )
}

export default memo(
  withStyles(styles, { name: 'VisitInfoCard' })(VisitInfoCard),
)
