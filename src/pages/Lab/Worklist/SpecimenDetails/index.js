import React, { useState, useEffect, useRef } from 'react'
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
import { SpecimenDetailsStep } from './components'
import { useCodeTable } from '@/utils/hooks'
import { LabResultTable } from './components/LabResultTable'
import { HeaderInfo } from './components/HeaderInfo'
import {
  LAB_SPECIMEN_STATUS,
  LAB_SPECIMEN_STATUS_COLORS,
} from '@/utils/constants'
import { RetestHistory } from './components/RetestHistory'

const { Panel } = Collapse
const { TextArea } = Input

const ActionButtons = ({ specimenStatusFK, onStart, onRetest, onVerify }) => {
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
}) => {
  if (!open) return ''
  const dispatch = useDispatch()
  const { entity } = useSelector(s => s.worklistSpecimenDetails)
  const [isResultFullScreen, setIsResultFullScreen] = useState(false)
  const [formValues, setFormValues] = useState({})
  const [showReportRemarks, setShowReportRemarks] = useState(false)
  const [retestSpecimenPara, setRetestSpecimenPara] = useState({
    open: false,
    retestSpecimen: undefined,
  })
  const [retestHistoryPara, setRetestHistoryPara] = useState({
    open: false,
    id: undefined,
  })

  const [showRawData, setShowRawData] = useState(false)
  const [showModal, setShowModal] = useState(false)
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
    setIsResultFullScreen(false)
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
          cleanUp()
          onConfirm && onConfirm()
        }
      })
    }
  }

  const handleRetest = async () => {
    const values = await form.validateFields()
    console.log('handleRetest', values)
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

  const closeRetestHistory = () => {
    setRetestHistoryPara({
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
            cleanUp()
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
          cleanUp()
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
        <div>
          <Form
            form={form}
            initialValues={{ ...entity }}
            onValuesChange={(_, values) => setFormValues(values)}
          >
            <GridContainer
              style={{
                height: 700,
                alignItems: 'start',
                overflowY: 'scroll',
              }}
            >
              {!isResultFullScreen && (
                <React.Fragment>
                  <GridItem md={12}>
                    <div style={{ padding: 8 }}>
                      <Banner isDisposePatientEntity={isDisposePatientEntity} />
                    </div>
                  </GridItem>
                  <GridItem md={12}>
                    <SpecimenDetailsStep timeline={entity.timeline} />
                  </GridItem>
                  <GridItem md={12}>
                    <HeaderInfo entity={entity} />
                  </GridItem>
                </React.Fragment>
              )}
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
                        {entity.hasAnyRetest && (
                          <Tooltip title='Final Result History'>
                            <span
                              className='material-icons'
                              style={{ color: 'gray', cursor: 'pointer' }}
                              onClick={event => {
                                setRetestHistoryPara({
                                  open: true,
                                  dataSource: entity.labRetestHistories,
                                })
                              }}
                            >
                              history
                            </span>
                          </Tooltip>
                        )}

                        <Checkbox
                          onChange={e => setShowRawData(e.target.checked)}
                        />
                        <span>Display Raw Data</span>
                      </Space>
                      <div style={{ flexGrow: 1, textAlign: 'right' }}>
                        <Button type='link' onClick={resendOrder}>
                          Resend Order
                        </Button>
                        <Icon
                          type={
                            isResultFullScreen
                              ? 'fullscreen-exit'
                              : 'fullscreen'
                          }
                          style={{
                            border: '1px solid',
                            fontSize: '1rem',
                          }}
                          onClick={() =>
                            setIsResultFullScreen(!isResultFullScreen)
                          }
                        />
                      </div>
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
      <RetestHistory
        {...retestHistoryPara}
        onClose={() => {
          closeRetestHistory()
        }}
        onConfirm={() => {
          closeRetestHisotry()
        }}
      />
    </React.Fragment>
  )
}
