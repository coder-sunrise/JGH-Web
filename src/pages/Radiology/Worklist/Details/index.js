import React, { useEffect, useState, useContext } from 'react'
import { useSelector, useDispatch } from 'dva'
import { Table, Radio, Form } from 'antd'
import { formatMessage } from 'umi'
import moment from 'moment'
import {
  GridContainer,
  ProgressButton,
  Button,
  GridItem,
  CommonModal,
  dateFormatLongWithTimeNoSec12h,
  Popconfirm,
  TextField,
} from '@/components'
import Authorized from '@/utils/Authorized'
import Banner from '@/pages/PatientDashboard/Banner'
import {
  ExaminationSteps,
  OrderDetails,
  ExaminationDetails,
  CancelConfirmation,
  StartExaminationConfirmation,
} from './components'
import { SectionTitle, RightAlignGridItem } from '../../Components'
import {
  RADIOLOGY_WORKITEM_STATUS,
  RADIOLOGY_WORKITEM_BUTTON,
} from '@/utils/constants'
import WorklistContext from '../WorklistContext'
import { examinationSteps } from '@/utils/codes'
import { ReportViewer } from '@/components/_medisys'

const RadiologyDetails = () => {
  const dispatch = useDispatch()
  const { detailsId, setDetailsId, isReadOnly } = useContext(WorklistContext)

  const [form] = Form.useForm()

  const details = useSelector(state => state.radiologyDetails)
  const [showDetails, setShowDetails] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [showRequiredField, setShowRequiredField] = useState(false)
  const [workitem, setWorkItem] = useState({})

  const [combinedWorkitems, setCombinedWorkitems] = useState([])
  const [examinationDetails, setExaminationDetails] = useState({})
  const [showReport, setShowReport] = useState(false)
  const patientProfileFK = details?.entity?.patientProfileFK
  useEffect(() => {
    if (detailsId) {
      dispatch({
        type: 'radiologyDetails/query',
        payload: { id: detailsId },
      }).then(val => {
        if (val) setShowDetails(true)
      })
    } else {
      setShowDetails(false)
    }

    return () => {
      dispatch({
        type: 'radiologyDetails/updateState',
        payload: { entity: {} },
      })

      setWorkItem({})
      setCombinedWorkitems([])
      setExaminationDetails({})

      setShowDetails(false)
      setShowRequiredField(false)
      setIsDirty(false)
    }
  }, [detailsId])

  useEffect(() => {
    if (details && details.entity) {
      const { entity } = details
      setWorkItem(entity)
      setExaminationDetails({
        comment: entity.comment,
        examinationFinding: entity.examinationFinding,
        radiologyScribbleNote: entity.radiologyScribbleNote,
        assignedRadiographers: entity.assignedRadiographers,
      })
    }
  }, [details])

  useEffect(() => {
    setCombinedWorkitems(getCombinedWorkitems(workitem.visitWorkitems))
  }, [workitem, examinationDetails])

  const renderStatusButtons = () => {
    if (!details || !details.entity) return

    const buttonInfo = RADIOLOGY_WORKITEM_BUTTON.find(
      s => s.currentStatusFK === details.entity.statusFK,
    )

    if (!buttonInfo) return

    return (
      <React.Fragment>
        {buttonInfo.enableCancel &&
          Authorized.check('radiologyworklist.cancelexamination')?.rights ===
            'enable' && (
            <ProgressButton
              color='#797979'
              onClick={() => {
                setShowCancelConfirm(true)
              }}
            >
              Cancel Examination
            </ProgressButton>
          )}
        {Authorized.check(buttonInfo.authority)?.rights === 'enable' && (
          <ProgressButton
            color='success'
            onClick={() => {
              if (examinationDetails.assignedRadiographers.length === 0) {
                setShowRequiredField(true)
                return
              }

              const { visitWorkitems } = workitem

              const currentPrimaryWorkitemFK = visitWorkitems.find(
                v => v.radiologyWorkitemId === workitem.radiologyWorkitemId,
              ).primaryWorkitemFK
              if (
                workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.NEW &&
                currentPrimaryWorkitemFK &&
                visitWorkitems.filter(
                  v =>
                    v.primaryWorkitemFK &&
                    v.primaryWorkitemFK === currentPrimaryWorkitemFK,
                ).length > 1
              ) {
                setShowStartConfirm(true)
                return
              }
              handleSave({
                statusFK: buttonInfo.nextStatusFK,
              })
            }}
          >
            {buttonInfo.name}
          </ProgressButton>
        )}
      </React.Fragment>
    )
  }

  const toggleReport = () => {
    setShowReport(!showReport)
  }

  const queryRadiologyDetails = () => {
    dispatch({
      type: 'radiologyDetails/query',
      payload: { id: detailsId },
    }).then(val => {
      if (val) {
        toggleReport()
      }
    })
  }
  const saveAndPrint = () => {
    if (details?.entity?.statusFK != 4 && details?.entity?.statusFK != 5) {
      handleSave(undefined, false, queryRadiologyDetails)
    } else {
      queryRadiologyDetails()
    }
  }
  const renderPrintButton = () => {
    if (!details || !details.entity) return
    const { statusFK: currentStatusFK } = details.entity
    return (
      [
        RADIOLOGY_WORKITEM_STATUS.MODALITYCOMPLETED,
        RADIOLOGY_WORKITEM_STATUS.COMPLETED,
      ].includes(currentStatusFK) && (
        <Button color='primary' onClick={saveAndPrint}>
          Print
        </Button>
      )
    )
  }
  const handleSave = (payload = {}, closeAfterSave = true, callback = null) => {
    dispatch({
      type: 'radiologyDetails/updateRadiologyWorkitem',
      payload: {
        ...workitem,
        id: details.entity.radiologyWorkitemId,
        ...examinationDetails,
        ...payload,
      },
    }).then(value => {
      setIsDirty(false)
      if (callback) callback()
      if (closeAfterSave) {
        setDetailsId(null)
        setShowDetails(false)
      }
    })
  }

  const handleClose = () => {
    setDetailsId(null)
    setShowDetails(false)
  }

  const handleCancel = cancellationReason => {
    dispatch({
      type: 'radiologyDetails/cancelRadiologyWorkitem',
      payload: {
        ...workitem,
        id: workitem.radiologyWorkitemId,
        ...examinationDetails,
        statusFK: RADIOLOGY_WORKITEM_STATUS.CANCELLED,
        cancellationReason: cancellationReason,
      },
    }).then(() => {
      setShowDetails(false)
      setDetailsId(null)
      setShowCancelConfirm(false)
    })
  }

  const getCombinedWorkitems = (allVisitWorkItems = []) => {
    const primaryWorkitemFK = allVisitWorkItems.find(
      c => c.radiologyWorkitemId === workitem.radiologyWorkitemId,
    )?.primaryWorkitemFK
    if (!primaryWorkitemFK) {
      return []
    }

    return allVisitWorkItems
      .filter(w => w.primaryWorkitemFK === primaryWorkitemFK)
      .map(w => {
        if (w.radiologyWorkitemId !== workitem.radiologyWorkitemId) return w

        //To ensure to append current assigned radiographers for current opening workitem.
        return {
          ...w,
          assignedRadiographers: examinationDetails.assignedRadiographers,
        }
      })
  }

  const showOnlyCloseButton =
    isReadOnly ||
    workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.COMPLETED ||
    workitem.statusFK === RADIOLOGY_WORKITEM_STATUS.CANCELLED

  return (
    <React.Fragment>
      <CommonModal
        open={showDetails}
        title='Radiology Examination Details'
        showFooter={true}
        confirmText='Save'
        onClose={() => {
          if (isDirty) {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                openConfirm: true,
                openConfirmContent: formatMessage({
                  id: 'app.general.leave-without-save',
                }),
                onConfirmSave: handleClose,
              },
            })
          } else {
            setDetailsId(null)
            setShowDetails(false)
          }
        }}
        footProps={{
          extraButtons: [
            !showOnlyCloseButton ? renderStatusButtons() : undefined,
            renderPrintButton(),
          ],
          onConfirm: () => {
            handleSave()
          },
          confirmProps: {
            hidden:
              showOnlyCloseButton ||
              (
                Authorized.check('radiologyworklist.saveexamination') || {
                  rights: 'hidden',
                }
              )?.rights !== 'enable',
          },
        }}
        confirmProps={{ disable: true }}
        maxWidth='lg'
      >
        <GridContainer
          style={{
            height: !isReadOnly ? 750 : undefined,
            overflowY: 'scroll',
            alignContent: 'flex-start',
          }}
        >
          {!isReadOnly && (
            <GridItem md={12}>
              <div>
                <Banner from='Radiology' />
              </div>
            </GridItem>
          )}
          <GridItem md={12} style={{ marginTop: 20 }}>
            <ExaminationSteps item={workitem} />
          </GridItem>
          <GridItem md={12}>
            <OrderDetails
              workitem={workitem}
              onCombinedOrderChange={value => {
                setWorkItem({
                  ...workitem,
                  primaryWorkitemFK: value.find(
                    v => v.radiologyWorkitemId == workitem.radiologyWorkitemId,
                  ).primaryWorkitemFK,
                  visitWorkitems: value,
                  ...examinationDetails,
                })
                setIsDirty(true)
              }}
            />
          </GridItem>
          <GridItem md={12}>
            <ExaminationDetails
              onChange={val => {
                setExaminationDetails(val)
                setIsDirty(true)
              }}
              showRequiredField={showRequiredField}
              workitem={workitem}
            />
          </GridItem>
        </GridContainer>
        <CancelConfirmation
          open={showCancelConfirm}
          workitem={workitem}
          onCancelConfirm={cancellationReason => {
            handleCancel(cancellationReason)
          }}
          onCancelClose={() => setShowCancelConfirm(false)}
        />

        <StartExaminationConfirmation
          open={showStartConfirm}
          workitem={workitem}
          combinedWorkitems={combinedWorkitems}
          onStartConfirm={() => {
            handleSave({
              statusFK: RADIOLOGY_WORKITEM_STATUS.INPROGRESS,
              assignedRadiographers: _.uniqBy(
                combinedWorkitems.flatMap(w => w.assignedRadiographers),
                c => c.userProfileFK,
              ),
            })
            setShowStartConfirm(false)
          }}
          onStartClose={() => setShowStartConfirm(false)}
        />
      </CommonModal>
      <CommonModal
        open={showReport}
        onClose={toggleReport}
        title='Radiology Examination Finding Report'
        maxWidth='lg'
      >
        <ReportViewer
          showTopDivider={false}
          reportID={82}
          reportParameters={{
            radiologyWorkitemId: detailsId,
            patientProfileFK,
            _key: details ? details.entity?.accessionNo : '',
          }}
          defaultScale={1.5}
        />
      </CommonModal>
    </React.Fragment>
  )
}

export default RadiologyDetails
