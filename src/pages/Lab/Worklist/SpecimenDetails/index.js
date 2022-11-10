import React, { useState, useEffect, useRef, Fragment } from 'react'
import {
  Space,
  Collapse,
  InputNumber,
  Typography,
  Table,
  Checkbox,
  Input,
  Form,
  Button,
  Alert,
} from 'antd'
import { formatMessage } from 'umi'
import moment from 'moment'
import Banner from '@/pages/PatientDashboard/Banner'
import Authorized from '@/utils/Authorized'
import { useSelector, useDispatch } from 'dva'
import {
  Icon,
  dateFormatLongWithTimeNoSec,
  DatePicker,
  Select,
  CommonModal,
  NumberInput,
  GridContainer,
  GridItem,
  ProgressButton,
  Tooltip,
} from '@/components'
import { VisitTypeTag } from '@/components/_medisys'
import { TestPanelColumn } from '../components/TestPanelColumn'
import { RetestSpecimen } from './components/RetestSpecimen'
import { UnlockSpecimen } from './components/UnlockSpecimen'
import { SpecimenDetailsStep } from './components'
import { useCodeTable } from '@/utils/hooks'
import { LabResultTable } from './components/LabResultTable'
import { HeaderInfo } from './components/HeaderInfo'
import {
  LAB_SPECIMEN_STATUS,
  LAB_SPECIMEN_STATUS_COLORS,
} from '@/utils/constants'
import { RetestHistory } from './components/RetestHistory'
import { ReceiveSpecimen } from '../components'

const { Panel } = Collapse
const { TextArea } = Input

const ActionButtons = ({
  specimenStatusFK,
  onStart,
  onRetest,
  onVerify,
  onUnlock,
}) => {
  return (
    <React.Fragment>
      {specimenStatusFK === LAB_SPECIMEN_STATUS.NEW &&
        Authorized.check('lab.starttest')?.rights === 'enable' && (
          <ProgressButton color='success' onClick={onStart}>
            Start
          </ProgressButton>
        )}
      {(specimenStatusFK === LAB_SPECIMEN_STATUS.PENDINGFIRSTVERIFIER ||
        specimenStatusFK === LAB_SPECIMEN_STATUS.PENDINGSECONDVERIFIER) &&
        Authorized.check('lab.retest')?.rights === 'enable' && (
          <ProgressButton color='warning' onClick={onRetest}>
            Retest
          </ProgressButton>
        )}
      {(specimenStatusFK === LAB_SPECIMEN_STATUS.INPROGRESS ||
        specimenStatusFK === LAB_SPECIMEN_STATUS.FORRETEST ||
        specimenStatusFK === LAB_SPECIMEN_STATUS.PENDINGFIRSTVERIFIER ||
        specimenStatusFK === LAB_SPECIMEN_STATUS.PENDINGSECONDVERIFIER) &&
        Authorized.check('lab.verifytest')?.rights === 'enable' && (
          <ProgressButton color='success' onClick={onVerify}>
            Verify
          </ProgressButton>
        )}
      {specimenStatusFK === LAB_SPECIMEN_STATUS.COMPLETED &&
        Authorized.check('lab.unlock')?.rights === 'enable' && (
          <ProgressButton color='warning' onClick={onUnlock}>
            Unlock
          </ProgressButton>
        )}
    </React.Fragment>
  )
}

const PendingSecondVerificationNote = () => (
  <NotePara>
    Update result will require second verifier to verify the result. Status will
    remain in "Pending Second Verification".
  </NotePara>
)

const NotePara = ({ children }) => (
  <section style={{ fontStyle: 'italic' }}>{children}</section>
)

export const SpecimenDetails = ({
  open,
  id,
  onClose,
  onConfirm,
  isDisposePatientEntity = true,
  isReadonly = false,
  hideIfFromOrder = false,
  from,
}) => {
  if (!open) return ''
  const dispatch = useDispatch()
  const { entity } = useSelector(s => s.worklistSpecimenDetails)
  const [formValues, setFormValues] = useState({})
  const [showReportRemarks, setShowReportRemarks] = useState(false)
  const [retestSpecimenPara, setRetestSpecimenPara] = useState({
    open: false,
    retestSpecimen: undefined,
  })
  const [retestAndUnlockHistoryPara, setRetestAndUnlockHistoryPara] = useState({
    open: false,
    id: undefined,
  })
  const [unlockSpecimenPara, setUnlockSpecimenPara] = useState({
    open: false,
    unlockSpecimen: undefined,
  })

  const [showRawData, setShowRawData] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEditSpecimenModal, setShowEditSpecimenModal] = useState(false)
  const [editSpecimenTitle, setEditSpecimenTitle] = useState('Receive Specimen')
  const currentStatus = entity.specimenStatusFK
  const [form] = Form.useForm()

  const querySpecimenDetails = () => {
    dispatch({
      type: 'worklistSpecimenDetails/query',
      payload: { id },
    })
  }

  const cleanUp = () => {
    form.setFieldsValue({})
    form.resetFields()
    setFormValues({})
    setShowModal(false)
    setShowReportRemarks(false)
    setShowRawData(false)
    setRetestSpecimenPara({
      open: false,
      retestSpecimen: undefined,
    })
    dispatch({
      type: 'worklistSpecimenDetails/updateState',
      payload: { entity: {} },
    })
  }

  useEffect(() => {
    setShowModal(open)
    if (open && id) {
      querySpecimenDetails()
    }
  }, [id])

  useEffect(() => {
    form.resetFields() //to ensure to reset fields from previous item.
    form.setFieldsValue(entity)
    setFormValues(entity) //https://github.com/ant-design/ant-design/issues/21829

    if (entity.reportRemarks && entity.reportRemarks.trim().length > 0) {
      setShowReportRemarks(true)
    }
  }, [entity])

  const handleStart = () => {
    if (currentStatus === LAB_SPECIMEN_STATUS.NEW) {
      dispatch({
        type: 'worklistSpecimenDetails/startLabTest',
        payload: entity,
      }).then(result => {
        if (result) {
          querySpecimenDetails()
          onConfirm && onConfirm()
        }
      })
    }
  }
  let toggleEditSpecimenModal = title => {
    setShowEditSpecimenModal(!showEditSpecimenModal)
    setEditSpecimenTitle(title || 'Receive Specimen')
  }
  const handleRetest = async () => {
    const values = await form.validateFields()
    setRetestSpecimenPara({
      open: true,
      retestSpecimen: { ...entity, ...values },
    })
  }

  const closeRetestSpecimen = () => {
    setRetestSpecimenPara({
      open: false,
      retestSpecimen: undefined,
    })
  }

  const confirmRetestSpecimen = () => {
    setRetestSpecimenPara({
      open: false,
      retestSpecimen: undefined,
    })
    querySpecimenDetails()
  }

  const handleUnlock = async () => {
    const values = await form.validateFields()
    setUnlockSpecimenPara({
      open: true,
      unlockSpecimen: { ...entity, ...values },
    })
  }

  const closeUnlockSpecimen = () => {
    setUnlockSpecimenPara({
      open: false,
      unlockSpecimen: undefined,
    })
  }

  const confirmUnlockSpecimen = () => {
    setUnlockSpecimenPara({
      open: false,
      unlockSPecimen: undefined,
    })
    querySpecimenDetails()
    if (from === 'labHistory') {
      cleanUp()
      onClose && onClose()
    }
  }

  const closeRetestAndUnlockHistory = () => {
    setRetestAndUnlockHistoryPara({
      open: false,
      id: undefined,
    })
  }

  const getChangedResults = values =>
    entity.labWorkitemResults.filter(
      x =>
        values.labWorkitemResults.findIndex(
          y =>
            x.id === y.id &&
            x.finalResult?.toString() != y.finalResult?.toString(),
        ) != -1,
    )

  const handleVerify = async () => {
    try {
      if (
        currentStatus !== LAB_SPECIMEN_STATUS.NEW &&
        currentStatus !== LAB_SPECIMEN_STATUS.DISCARDED &&
        currentStatus !== LAB_SPECIMEN_STATUS.COMPLETED
      ) {
        const values = await form.validateFields()

        dispatch({
          type: 'worklistSpecimenDetails/verifyLabTest',
          payload: { ...entity, ...values },
        }).then(result => {
          if (result) {
            querySpecimenDetails()
            onConfirm && onConfirm()
          }
        })
      }
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      dispatch({
        type: 'worklistSpecimenDetails/saveLabTest',
        payload: { ...entity, ...values },
      }).then(result => {
        if (result) {
          querySpecimenDetails()
          onConfirm && onConfirm()
        }
      })
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  const renderRemarks = () => {
    if (currentStatus === LAB_SPECIMEN_STATUS.COMPLETED || isReadonly)
      return (
        <React.Fragment>
          {formValues.reportRemarks &&
            formValues.reportRemarks.trim().length > 0 && (
              <GridItem md={12} style={{ paddingTop: 8 }}>
                <Typography.Text strong>Report Remarks: </Typography.Text>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {formValues.reportRemarks}
                </p>
              </GridItem>
            )}
          {formValues.internalRemarks &&
            formValues.internalRemarks.trim().length > 0 && (
              <GridItem md={12} style={{ paddingTop: 8 }}>
                <Typography.Text strong>Internal Remarks: </Typography.Text>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {formValues.internalRemarks}
                </p>
              </GridItem>
            )}
        </React.Fragment>
      )

    return (
      <React.Fragment>
        {showReportRemarks ? (
          <GridItem md={12}>
            <Typography.Text strong>Report Remarks</Typography.Text>
            <Form.Item name='reportRemarks'>
              <TextArea rows={4} maxLength={2000} />
            </Form.Item>
          </GridItem>
        ) : (
          <GridItem md={12}>
            <Tooltip title='Report remarks will display in report printout'>
              <Typography.Link
                underline
                onClick={() => setShowReportRemarks(true)}
              >
                Add Report Remarks
              </Typography.Link>
            </Tooltip>
          </GridItem>
        )}
        <GridItem md={12}>
          <Typography.Text strong>Internal Remarks</Typography.Text>
          <Form.Item name='internalRemarks'>
            <TextArea rows={4} maxLength={2000} />
          </Form.Item>
        </GridItem>
      </React.Fragment>
    )
  }

  const resendOrder = () => {
    dispatch({
      type: 'worklistSpecimenDetails/resendOrder',
      payload: { id },
    })
  }

  return (
    <React.Fragment>
      <CommonModal
        open={showModal}
        title='Lab Test Specimen Details'
        onClose={() => {
          if (formValues !== entity) {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                openConfirm: true,
                openConfirmContent: formatMessage({
                  id: 'app.general.leave-without-save',
                }),
                onConfirmSave: () => {
                  cleanUp()
                  onClose && onClose()
                },
              },
            })
          } else {
            cleanUp()
            onClose && onClose()
          }
        }}
        footProps={{
          extraButtons: !isReadonly
            ? [
                <ActionButtons
                  specimenStatusFK={entity.specimenStatusFK}
                  onStart={handleStart}
                  onVerify={handleVerify}
                  onRetest={handleRetest}
                  onUnlock={handleUnlock}
                />,
              ]
            : [],
          onConfirm:
            entity.specimenStatusFK !== LAB_SPECIMEN_STATUS.COMPLETED &&
            entity.specimenStatusFK !== LAB_SPECIMEN_STATUS.NEW &&
            Authorized.check('lab.savedetails')?.rights === 'enable' &&
            !isReadonly
              ? () => {
                  handleSave()
                }
              : undefined,
        }}
        confirmText='Save'
        showFooter={true}
        maxWidth='lg'
      >
        <div
          style={{
            height: 750,
            overflowY: 'scroll',
          }}
        >
          <Form
            form={form}
            initialValues={{ ...entity }}
            onValuesChange={(_, values) => setFormValues(values)}
          >
            <div style={{ padding: 8, paddingTop: 0 }}>
              <Banner isDisposePatientEntity={isDisposePatientEntity} />
            </div>
            <GridContainer>
              <React.Fragment>
                <GridItem md={12} style={{ marginTop: 30 }}>
                  <SpecimenDetailsStep timeline={entity.timeline} />
                </GridItem>
                <GridItem md={12}>
                  <HeaderInfo
                    entity={entity}
                    toggleEditSpecimenModal={toggleEditSpecimenModal}
                  />
                </GridItem>
              </React.Fragment>
              {entity.specimenStatusFK !== LAB_SPECIMEN_STATUS.NEW && (
                <GridItem md={12}>
                  <GridContainer>
                    <GridItem
                      md={12}
                      style={{ paddingTop: 16, display: 'flex' }}
                    >
                      <Space>
                        <Typography.Text strong style={{ flexGrow: 1 }}>
                          Final Result
                        </Typography.Text>
                        {entity.hasAnyRetestOrUnlock && !hideIfFromOrder && (
                          <Tooltip title='Result History'>
                            <span
                              className='material-icons'
                              style={{
                                color: 'gray',
                                cursor: 'pointer',
                              }}
                              onClick={event => {
                                setRetestAndUnlockHistoryPara({
                                  open: true,
                                  dataSource:
                                    entity.labRetestAndUnlockHistories,
                                })
                              }}
                            >
                              history
                            </span>
                          </Tooltip>
                        )}
                        {!hideIfFromOrder && (
                          <Fragment>
                            <Checkbox
                              onChange={e => setShowRawData(e.target.checked)}
                            />
                            <span>Display Raw Data</span>
                          </Fragment>
                        )}
                      </Space>
                      {!hideIfFromOrder && (
                        <div style={{ flexGrow: 1, textAlign: 'right' }}>
                          {Authorized.check('lab.starttest')?.rights ===
                            'enable' && (
                            <Button type='link' onClick={resendOrder}>
                              Resend Order
                            </Button>
                          )}
                        </div>
                      )}
                    </GridItem>
                    <GridItem md={12} style={{ paddingTop: 8 }}>
                      <Form.Item name='labWorkitemResults'>
                        <LabResultTable
                          showRawData={showRawData}
                          isReadonly={
                            isReadonly ||
                            entity.specimenStatusFK ===
                              LAB_SPECIMEN_STATUS.COMPLETED
                          }
                        />
                      </Form.Item>
                    </GridItem>
                    {entity.specimenStatusFK ===
                      LAB_SPECIMEN_STATUS.PENDINGSECONDVERIFIER && (
                      <GridItem md={12} style={{ paddingBottom: 8 }}>
                        <PendingSecondVerificationNote />
                      </GridItem>
                    )}
                    {renderRemarks()}
                    {entity.acknowledgedByUser && (
                      <GridItem md={12} style={{ paddingTop: 8 }}>
                        <NotePara>
                          {`Lab result acknowledged by ${
                            entity.acknowledgedByUser
                          } on ${moment(entity.acknowledgeDate).format(
                            dateFormatLongWithTimeNoSec,
                          )}`}
                        </NotePara>
                      </GridItem>
                    )}
                  </GridContainer>
                </GridItem>
              )}
            </GridContainer>
          </Form>
        </div>
      </CommonModal>
      <RetestSpecimen
        {...retestSpecimenPara}
        onClose={() => {
          closeRetestSpecimen()
        }}
        onConfirm={() => {
          confirmRetestSpecimen()
        }}
      />
      <UnlockSpecimen
        {...unlockSpecimenPara}
        onClose={() => {
          closeUnlockSpecimen()
        }}
        onConfirm={() => {
          confirmUnlockSpecimen()
        }}
        from={from}
      />
      <RetestAndUnlockHistory
        {...retestAndUnlockHistoryPara}
        onClose={() => {
          closeRetestAndUnlockHistory()
        }}
        onConfirm={() => {
          closeRetestAndUnlockHistory()
        }}
      />
      <ReceiveSpecimen
        mode='edit'
        open={showEditSpecimenModal}
        id={id}
        onClose={toggleEditSpecimenModal}
        onConfirm={toggleEditSpecimenModal}
        title={editSpecimenTitle}
      />
    </React.Fragment>
  )
}
