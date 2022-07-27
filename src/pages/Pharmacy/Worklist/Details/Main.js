import React, { useState, useContext, useEffect } from 'react'
import { connect } from 'dva'
import { Typography, Alert, Select, Table as AntdTable } from 'antd'
import { compose } from 'redux'
import _ from 'lodash'
import numeral from 'numeral'
import moment from 'moment'
import { history } from 'umi'
import { withStyles, Drawer } from '@material-ui/core'
import Warning from '@material-ui/icons/Error'
import Refresh from '@material-ui/icons/Refresh'
import Yup from '@/utils/yup'
import { subscribeNotification } from '@/utils/realtime'
import { ReportViewer } from '@/components/_medisys'
import { getRawData } from '@/services/report'
import { REPORT_ID } from '@/utils/constants'
import { orderItemTypes } from '@/utils/codes'
import Print from '@material-ui/icons/Print'
import {
  GridContainer,
  GridItem,
  Button,
  CheckboxGroup,
  EditableTableGrid,
  CommonModal,
  withFormikExtend,
  NumberInput,
  Tooltip,
  FastField,
  notification,
  TextField,
  DatePicker,
  CommonTableGrid,
  CodeSelect,
} from '@/components'
import { FileCopySharp } from '@material-ui/icons'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import {
  navigateDirtyCheck,
  getTranslationValue,
  getUniqueId,
} from '@/utils/utils'
import Authorized from '@/utils/Authorized'
import { VISIT_TYPE, PHARMACY_STATUS, PHARMACY_ACTION } from '@/utils/constants'
import withWebSocket from '@/components/Decorator/withWebSocket'
import AddOrder from '@/pages/Dispense/DispenseDetails/AddOrder'
import { MenuOutlined } from '@ant-design/icons'
import { PharmacySteps, JournalHistory } from '../../Components'
import RedispenseForm from '../../Components/RedispenseForm'
import DrugLeafletSelection from '../../Components/DrugLeafletSelection'
import DrugLabelSelection from '@/pages/Dispense/DispenseDetails/DrugLabelSelection'
import customtyles from '@/pages/Dispense/DispenseDetails/Style.less'
import VisitGroupIcon from '@/pages/Radiology/Components/VisitGroupIcon'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'

const styles = theme => ({
  wrapCellTextStyle: {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
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
  subRow: {
    '& > td:first-child': {
      paddingLeft: theme.spacing(1),
    },
  },
  contentPanel: {
    maxHeight: 850,
    overflowY: 'scroll',
    marginBottom: 10,
  },
  alertStyle: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    width: '100%',
    overflow: 'hidden',
    padding: '3px 6px',
    lineHeight: '25px',
    fontSize: '0.85rem',
  },
  refreshButton: {
    position: 'absolute',
    right: -40,
    top: 3,
    width: 26,
    height: 26,
  },
  groupStyle: {
    padding: '3px 0px',
    backgroundColor: 'rgb(240, 248, 255)',
  },
})

const ContentGridItem = ({ children, title }) => {
  return (
    <GridItem md={4} style={{ paddingLeft: 140, marginBottom: 8 }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 140,
            textAlign: 'right',
            position: 'absolute',
            left: '-140px',
            fontWeight: 600,
          }}
        >
          {title}
        </div>
        <div style={{ marginLeft: 6 }}> {children}</div>
      </div>
    </GridItem>
  )
}

const Main = props => {
  const {
    pharmacyDetails,
    dispatch,
    classes,
    clinicSettings,
    patient,
    codetable,
    values,
    user,
    setEditingOrder,
  } = props

  const [orderUpdateMessage, setOrderUpdateMessage] = useState({})
  const [showJournalHistory, setShowJournalHistory] = useState(false)
  const [showLeafletSelectionPopup, setShowLeafletSelectionPopup] = useState(
    false,
  )
  const [
    showDrugLabelSelectionPopup,
    setShowDrugLabelSelectionPopup,
  ] = useState(false)
  const [showReportViwer, setShowReportViwer] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportID, setReportID] = useState(-1)
  const [reportParameters, setReportParameters] = useState({})
  const [drugLeafletData, setDrugLeafletData] = useState([])
  const [drugDrugSummaryLabelData, setDrugDrugSummaryLabelData] = useState([])
  const [currentDrugToPrint, setCurrentDrugToPrint] = useState({})
  const [batchInformation, setBatchInformation] = useState({})
  const [
    showDrugSummaryLabelSelectionPopup,
    setShowDrugSummaryLabelSelectionPopup,
  ] = useState(false)

  useEffect(() => {
    subscribeNotification('PharmacyOrderUpdate', {
      callback: response => {
        const { visitID, senderId, message } = response
        if (
          pharmacyDetails.entity?.visitFK === visitID &&
          senderId !== user.data.id
        ) {
          setOrderUpdateMessage({
            isPharmacyOrderUpdate: true,
            isPharmacyOrderDiscard: false,
            updateMessage: message,
          })
        }
      },
    })
    subscribeNotification('PharmacyOrderDiscard', {
      callback: response => {
        const { visitID, senderId, message } = response
        if (
          pharmacyDetails.entity?.visitFK === visitID &&
          senderId !== user.data.id
        ) {
          setOrderUpdateMessage({
            isPharmacyOrderUpdate: false,
            isPharmacyOrderDiscard: true,
            updateMessage: message,
          })
        }
      },
    })
  }, [values.id])

  const {
    primaryPrintoutLanguage = 'EN',
    secondaryPrintoutLanguage = '',
    labelPrinterSize,
    isQueueNoDecimal,
    visitTypeSetting,
    diagnosisDataSource = 'Snomed',
  } = clinicSettings
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)
  const [showRedispenseFormModal, setShowRedispenseFormModal] = useState(false)
  const [printlanguage, setPrintlanguage] = useState([primaryPrintoutLanguage])
  const [showLanguage, setShowLanguage] = useState(primaryPrintoutLanguage)
  const workitem = pharmacyDetails.entity || {}
  const statusHistory = [...(workitem.pharmarcyWorklistHistory || [])]
  const { corDiagnosis = [], visitPurposeFK } = workitem

  const editOrder = e => {
    if (workitem.isClinicSessionClosed) {
      notification.error({
        message: 'Can not edit order, session is end.',
      })
      return
    }
    const _addOrder = () => {
      dispatch({
        type: 'orders/updateState',
        payload: {
          type: '1',
          visitPurposeFK: visitPurposeFK,
        },
      })
      dispatch({
        type: 'dispense/query',
        payload: {
          id: workitem.visitFK,
          version: Date.now(),
        },
      }).then(r => {
        if (r) {
          setShowEditOrderModal(true)
        }
      })
    }
    const _editOrder = () => {
      if (pharmacyDetails.entity?.visitFK) {
        dispatch({
          type: `consultation/editOrder`,
          payload: {
            id: pharmacyDetails.entity?.visitFK,
            queueID: pharmacyDetails.entity?.visitFK,
            version: Date.now(),
          },
        }).then(r => {
          if (r) {
            dispatch({
              type: 'dispense/query',
              payload: {
                id: workitem.visitFK,
                version: Date.now(),
              },
            }).then(r => {
              setEditingOrder(true)
            })
          }
        })
      }
    }
    if (visitPurposeFK === VISIT_TYPE.OTC) {
      navigateDirtyCheck({
        onProceed: _addOrder,
      })(e)
    } else {
      navigateDirtyCheck({
        onProceed: _editOrder,
      })(e)
    }
  }

  const getPaload = actionType => {
    const { id, concurrencyToken } = workitem

    const getTransaction = item => {
      const {
        stockFK,
        batchNo,
        expiryDate,
        dispenseQuantity,
        uomDisplayValue,
        secondUOMDisplayValue,
      } = item
      return {
        stockFK,
        batchNo,
        expiryDate,
        transactionQty: dispenseQuantity,
        uomDisplayValue,
        secondUOMDisplayValue,
      }
    }
    let newPharmacyOrderItem = []
    if (
      actionType === PHARMACY_ACTION.PREPARE ||
      actionType === PHARMACY_ACTION.COMPLETEPARTIAL
    ) {
      const pharmacyOrderItem = pharmacyDetails.entity?.pharmacyOrderItem || []
      pharmacyOrderItem.forEach(item => {
        if (item.invoiceItemTypeFK === 1) {
          if (item.isDrugMixture) {
            let newPrescriptionDrugMixture = []
            item.prescriptionDrugMixture
              .filter(drugMixture => drugMixture.isDispensedByPharmacy)
              .forEach(drugMixture => {
                const orderItem = props.values.orderItems.filter(
                  oi =>
                    oi.dispenseQuantity > 0 &&
                    oi.drugMixtureFK === drugMixture.id,
                )
                if (orderItem.length) {
                  newPrescriptionDrugMixture.push({
                    id: drugMixture.id,
                    concurrencyToken: drugMixture.concurrencyToken,
                    inventoryMedicationFK: drugMixture.inventoryMedicationFK,
                    pharmacyOrderItemTransaction: orderItem.map(i =>
                      getTransaction(i),
                    ),
                  })
                }
              })
            newPharmacyOrderItem.push({
              id: item.id,
              isDrugMixture: item.isDrugMixture,
              concurrencyToken: item.concurrencyToken,
              invoiceItemTypeFK: item.invoiceItemTypeFK,
              inventoryFK: item.inventoryFK,
              prescriptionDrugMixture: newPrescriptionDrugMixture,
            })
          } else if (item.inventoryFK && !item.isExternalPrescription) {
            const orderItem = props.values.orderItems.filter(
              oi =>
                oi.invoiceItemTypeFK === item.invoiceItemTypeFK &&
                oi.id === item.id &&
                oi.dispenseQuantity > 0,
            )
            if (orderItem.length) {
              newPharmacyOrderItem.push({
                id: item.id,
                isDrugMixture: item.isDrugMixture,
                concurrencyToken: item.concurrencyToken,
                invoiceItemTypeFK: item.invoiceItemTypeFK,
                inventoryFK: item.inventoryFK,
                pharmacyOrderItemTransaction: orderItem.map(i =>
                  getTransaction(i),
                ),
              })
            }
          }
        } else {
          const orderItem = props.values.orderItems.filter(
            oi =>
              oi.invoiceItemTypeFK === item.invoiceItemTypeFK &&
              oi.id === item.id &&
              oi.dispenseQuantity > 0,
          )
          if (orderItem.length) {
            newPharmacyOrderItem.push({
              id: item.id,
              concurrencyToken: item.concurrencyToken,
              invoiceItemTypeFK: item.invoiceItemTypeFK,
              inventoryFK: item.inventoryFK,
              pharmacyOrderItemTransaction: orderItem.map(i =>
                getTransaction(i),
              ),
            })
          }
        }
      })
    }
    return { id, concurrencyToken, pharmacyOrderItem: newPharmacyOrderItem }
  }

  const updatePharmacy = (actionType, redispenseValues = {}) => {
    const { redispenseBy, redispenseReason } = redispenseValues
    dispatch({
      type: 'pharmacyDetails/upsert',
      payload: {
        ...getPaload(actionType),
        actionType,
        redispenseBy,
        redispenseReason,
      },
    }).then(r => {
      if (r) {
        const { onConfirm } = props
        onConfirm()
      }
    })
  }

  const reloadPharmacy = () => {
    dispatch({ type: 'pharmacyDetails/query', payload: { id: workitem.id } })
  }

  const printLeaflet = async (printData = {}) => {
    const visitinvoicedrugids = _.join(
      printData.map(x => {
        return x.id
      }),
    )
    const instructionIds = _.join(
      printData.map(x => {
        return _.join(x.instructionId, ',')
      }),
    )
    const data = await getRawData(REPORT_ID.PATIENT_INFO_LEAFLET, {
      visitinvoicedrugids,
      instructionIds,
      language: 'JP',
      visitId: pharmacyDetails.entity?.visitFK,
    })
    const payload = [
      {
        ReportId: REPORT_ID.PATIENT_INFO_LEAFLET,
        ReportData: JSON.stringify({
          ...data,
        }),
      },
    ]
    handlePrint(JSON.stringify(payload))
  }
  const getInstruction = row => {
    if (row.invoiceItemTypeFK !== 1) return ''
    return row.language.isShowFirstValue
      ? row.instruction
      : row.secondInstruction
  }

  const getDrugInteraction = row => {
    if (row.invoiceItemTypeFK !== 1) return ''
    const { medicationInteraction = [] } = row
    if (!medicationInteraction.length) return '-'
    return (
      <div>
        {medicationInteraction.map(item => {
          return (
            <p>
              {getTranslationValue(
                item.translationData,
                row.language.value,
                'displayValue',
              )}
            </p>
          )
        })}
      </div>
    )
  }

  const getDrugContraIndication = row => {
    if (row.invoiceItemTypeFK !== 1) return ''
    const { medicationContraIndication = [] } = row
    if (!medicationContraIndication.length) return '-'
    return (
      <div>
        {medicationContraIndication.map(item => {
          return (
            <p>
              {getTranslationValue(
                item.translationData,
                row.language.value,
                'displayValue',
              )}
            </p>
          )
        })}
      </div>
    )
  }

  const getDispenseUOM = row => {
    if (row.invoiceItemTypeFK === 1) {
      return (
        (row.language.value === primaryPrintoutLanguage
          ? row.uomDisplayValue
          : row.secondUOMDisplayValue) || ''
      )
    } else {
      return row.uomDisplayValue || ''
    }
  }

  const getUOM = row => {
    if (row.invoiceItemTypeFK !== 1) return row.dispenseUOM
    return row.language.isShowFirstValue
      ? row.dispenseUOM
      : row.secondDispenseUOM
  }

  const getType = row => {
    let type = 'Consumable'
    if (row.invoiceItemTypeFK === 1) {
      type = 'Medication'
      if (!row.isDrugMixture && !row.inventoryFK) {
        type = 'Open Prescription'
      } else if (row.isExternalPrescription) {
        type = 'External Prescription'
      }
    }
    return type
  }

  const showDrugLabelRemark = labelPrinterSize === '8.0cmx4.5cm_V2'

  const orderItemRow = (p, type) => {
    const { classes } = props
    const { row, children, tableRow } = p
    let newchildren = []
    const startColIndex = 6
    let endColIndex
    if (pharmacyDetails.fromModule === 'History') {
      endColIndex = type === 'PendingItems' ? 10 : 9
    } else {
      endColIndex = workitem.statusFK !== PHARMACY_STATUS.NEW ? 9 : 10
    }
    const batchColumns = children.slice(startColIndex, endColIndex)

    if (row.groupNumber === 1) {
      newchildren.push(
        children
          .filter((value, index) => index < 2)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.groupRowSpan,
            },
          })),
      )
    }
    if (row.countNumber === 1) {
      newchildren.push(
        children
          .filter((value, index) => index < startColIndex && index > 1)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.rowspan,
            },
          })),
      )
      newchildren.push(batchColumns)
      newchildren.push(
        children
          .filter((value, index) => index === endColIndex)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.rowspan,
            },
          })),
      )
    } else {
      newchildren.push(batchColumns)
    }
    if (row.groupNumber === 1) {
      newchildren.push(
        children
          .filter((value, index) => index === endColIndex + 1)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.groupRowSpan,
            },
          })),
      )
    }

    if (row.countNumber === 1) {
      newchildren.push(
        children
          .filter(
            (value, index) =>
              index < endColIndex + 4 && index > endColIndex + 1,
          )
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.rowspan,
            },
          })),
      )
    }

    if (row.groupNumber === 1) {
      newchildren.push(
        children
          .filter((value, index) => index > endColIndex + 3)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.groupRowSpan,
            },
          })),
      )
    }

    if (row.countNumber === 1) {
      return <Table.Row {...p}>{newchildren}</Table.Row>
    }
    return (
      <Table.Row {...p} className={classes.subRow}>
        {newchildren}
      </Table.Row>
    )
  }

  const onConfirmPrintLeaflet = () => {
    setShowLeafletSelectionPopup(false)
  }

  const onConfirmPrintDrugLabel = () => {
    setShowDrugLabelSelectionPopup(false)
  }

  const onConfirmRedispense = redispenseValues => {
    updatePharmacy(PHARMACY_ACTION.REDISPENSE, redispenseValues)
    setShowRedispenseFormModal(false)
  }

  const closeRedispenseForm = () => {
    setShowRedispenseFormModal(false)
  }

  const onPrepare = actionType => {
    const { orderItems = [] } = props.values || {}

    const validPharmacy = () => {
      let isValid = true
      for (let index = 0; index < orderItems.length; index++) {
        if (orderItems[index].dispenseQuantity > orderItems[index].remainQty) {
          notification.error({
            message: 'Dispense quantity cannot be more than orderd quantity.',
          })
          isValid = false
          break
        }

        if (
          !orderItems[index].isDefault &&
          orderItems[index].dispenseQuantity > orderItems[index].stock
        ) {
          notification.error({
            message: 'Dispense quantity cannot be more than stock quantity.',
          })
          isValid = false
          break
        }

        if (orderItems[index].stockFK && !orderItems[index].isDefault) {
          var items = orderItems.filter(
            oi =>
              oi.invoiceItemTypeFK === orderItems[index].invoiceItemTypeFK &&
              oi.stockFK === orderItems[index].stockFK &&
              oi.inventoryFK === orderItems[index].inventoryFK,
          )
          if (orderItems[index].stock < _.sumBy(items, 'dispenseQuantity')) {
            notification.error({
              message: 'Dispense quantity cannot be more than stock quantity',
            })
            isValid = false
            break
          }
        }
      }
      return isValid
    }

    const checkPartialDrugMixture = () => {
      let isPartialDrugMixture = false
      for (let index = 0; index < orderItems.length; index++) {
        if (
          orderItems[index].allowToDispense &&
          orderItems[index].isDrugMixture
        ) {
          const items = orderItems.filter(
            oi =>
              oi.isDrugMixture &&
              oi.drugMixtureFK === orderItems[index].drugMixtureFK &&
              oi.inventoryFK === orderItems[index].inventoryFK,
          )
          if (
            orderItems[index].remainQty > _.sumBy(items, 'dispenseQuantity')
          ) {
            isPartialDrugMixture = true
            notification.error({
              message: 'Partial dispense is not allowed for drug mixture.',
            })
            break
          }
        }
      }
      return isPartialDrugMixture
    }

    const checkOverDispense = () => {
      let isOverDispense = false
      for (let index = 0; index < orderItems.length; index++) {
        if (orderItems[index].allowToDispense) {
          let items = []
          if (orderItems[index].isDrugMixture) {
            items = orderItems.filter(
              oi =>
                oi.isDrugMixture &&
                oi.drugMixtureFK === orderItems[index].drugMixtureFK &&
                oi.inventoryFK === orderItems[index].inventoryFK,
            )
          } else {
            items = orderItems.filter(
              oi =>
                !oi.isDrugMixture &&
                oi.invoiceItemTypeFK === orderItems[index].invoiceItemTypeFK &&
                oi.id === orderItems[index].id &&
                oi.inventoryFK === orderItems[index].inventoryFK,
            )
          }
          if (
            orderItems[index].remainQty < _.sumBy(items, 'dispenseQuantity')
          ) {
            isOverDispense = true
            break
          }
        }
      }
      return isOverDispense
    }

    const checkPartialPrepare = () => {
      let isPartialPrepare = false
      for (let index = 0; index < orderItems.length; index++) {
        if (orderItems[index].allowToDispense) {
          let items = []
          if (orderItems[index].isDrugMixture) {
            items = orderItems.filter(
              oi =>
                oi.isDrugMixture &&
                oi.drugMixtureFK === orderItems[index].drugMixtureFK &&
                oi.inventoryFK === orderItems[index].inventoryFK,
            )
          } else {
            items = orderItems.filter(
              oi =>
                !oi.isDrugMixture &&
                oi.invoiceItemTypeFK === orderItems[index].invoiceItemTypeFK &&
                oi.id === orderItems[index].id &&
                oi.inventoryFK === orderItems[index].inventoryFK,
            )
          }
          if (
            orderItems[index].remainQty > _.sumBy(items, 'dispenseQuantity')
          ) {
            isPartialPrepare = true
            break
          }
        }
      }
      return isPartialPrepare
    }

    if (checkPartialDrugMixture()) {
      return
    }

    if (!validPharmacy()) {
      return
    }

    if (checkOverDispense()) {
      notification.error({
        message: 'Dispense quantity cannot be more than Ordered quantity',
      })
      return
    }
    if (checkPartialPrepare()) {
      dispatch({
        type: 'global/updateAppState',
        payload: {
          openConfirm: true,
          openConfirmContent: () => {
            return (
              <div>
                <h3>There are partially prepared item.</h3>
                <h3>Confirm to proceed?</h3>
              </div>
            )
          },
          openConfirmText: 'Confirm',
          onConfirmSave: () => updatePharmacy(actionType),
        },
      })
    } else {
      updatePharmacy(actionType)
    }
  }

  const refreshClick = () => {
    dispatch({
      type: 'pharmacyDetails/query',
      payload: { id: workitem.id },
    }).then(r => {
      if (r) {
        setOrderUpdateMessage({})
      }
    })
  }

  const isOrderUpdate =
    orderUpdateMessage.isPharmacyOrderUpdate ||
    orderUpdateMessage.isPharmacyOrderDiscard ||
    workitem.isOrderUpdate
  const updateMessage = `${
    workitem.updateByUserTitle && workitem.updateByUserTitle.trim().length
      ? `${workitem.updateByUserTitle}. ${workitem.updateByUser || ''}`
      : `${workitem.updateByUser || ''}`
  } amended prescription at ${moment(workitem.updateDate).format('HH:mm')}`

  const currentMessage =
    orderUpdateMessage.isPharmacyOrderUpdate ||
    orderUpdateMessage.isPharmacyOrderDiscard
      ? orderUpdateMessage.updateMessage
      : updateMessage

  const pharmacyOrderItemCount = (
    pharmacyDetails?.entity?.pharmacyOrderItem || []
  ).length

  const queueNo =
    !workitem.queueNo || !workitem.queueNo.trim().length
      ? '-'
      : workitem.queueNo

  let visitTypeSettingsObj = []
  if (visitTypeSetting) {
    try {
      visitTypeSettingsObj = JSON.parse(visitTypeSetting)
    } catch {}
  }
  const visitType = (visitTypeSettingsObj || []).find(
    type => type.id === workitem.visitPurposeFK,
  )
  const showButton = authority => {
    const accessRight = Authorized.check(authority) || { rights: 'hidden' }
    return accessRight.rights === 'enable'
  }

  const getBatchOptions = row => {
    let stockList = []
    if (row.invoiceItemTypeFK === 1) {
      stockList = (row.medicationStock || []).filter(
        s =>
          s.isDefault ||
          (s.stock > 0 &&
            (!s.expiryDate ||
              moment(s.expiryDate).startOf('day') >= moment().startOf('day'))),
      )
    } else {
      stockList = (row.consumableStock || []).filter(
        s =>
          s.isDefault ||
          (s.stock > 0 &&
            (!s.expiryDate ||
              moment(s.expiryDate).startOf('day') >= moment().startOf('day'))),
      )
    }
    stockList = _.orderBy(stockList, ['expiryDate'], ['asc'])
    if (row.stockFK) {
      const selectStock = stockList.find(sl => sl.id === row.stockFK)
      if (!selectStock) {
        return [
          {
            id: row.stockFK,
            batchNo: row.batchNo,
            expiryDate: row.expiryDate,
            isDefault: row.isDefault,
          },
          ...stockList,
        ]
      } else {
        return [
          { ...selectStock },
          ...stockList.filter(sl => sl.id !== row.stockFK),
        ]
      }
    }
    return stockList
  }
  const getColumns = (type = 'PendingItems', onValueChange) => {
    const isHiddenStock =
      (pharmacyDetails.fromModule === 'Main' &&
        workitem.statusFK !== PHARMACY_STATUS.NEW) ||
      type === 'CompletedItems'
    let columns = [
      {
        dataIndex: 'invoiceItemTypeFK',
        key: 'invoiceItemTypeFK',
        title: 'Type',
        width: 105,
        onCell: row => {
          const mergeCell = isHiddenStock ? 12 : 13
          if (row.isGroup)
            return {
              colSpan: mergeCell,
              style: { backgroundColor: 'rgb(218, 236, 245)' },
            }
          return {
            rowSpan: row.groupNumber === 1 ? row.groupRowSpan : 0,
          }
        },
        render: (_, row) => {
          if (row.isGroup) {
            if (row.groupName === 'NormalDispense')
              return (
                <div style={{ padding: '3px 0px' }}>
                  <span style={{ fontWeight: 600 }}>Normal Dispense Items</span>
                </div>
              )
            if (row.groupName === 'NoNeedToDispense')
              return (
                <div style={{ padding: '3px 0px' }}>
                  <span style={{ fontWeight: 600 }}>
                    No Need To Dispense Items
                  </span>
                </div>
              )
            return (
              <div style={{ padding: '3px 0px' }}>
                <span style={{ fontWeight: 600 }}>{'Drug Mixture: '}</span>
                {row.groupName}
              </div>
            )
          }
          const type = getType(row)
          const itemType = orderItemTypes.find(
            t => t.type.toUpperCase() === (type || '').toUpperCase(),
          )
          return (
            <Tooltip title={type}>
              <span>{itemType?.displayValue}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'itemName',
        key: 'itemName',
        title: 'Name',
        width: 250,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        render: (_, row) => {
          let paddingRight = 0
          if (row.isExclusive) {
            paddingRight = 24
          }
          return (
            <div style={{ position: 'relative' }}>
              <div style={{ paddingRight: paddingRight }}>
                <Tooltip
                  title={
                    <div>
                      {`Code: ${row.itemCode}`}
                      <br />
                      {`Name: ${row.itemName}`}
                    </div>
                  }
                >
                  <span>{row.itemName}</span>
                </Tooltip>
                <div
                  style={{ position: 'absolute', top: '-1px', right: '-6px' }}
                >
                  {row.isExclusive && (
                    <Tooltip title='The item has no local stock, we will purchase on behalf and charge to patient in invoice'>
                      <div
                        className={classes.rightIcon}
                        style={{
                          borderRadius: 4,
                          backgroundColor: 'green',
                          display: 'inline-block',
                        }}
                      >
                        Excl.
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        dataIndex: 'dispenseUOM',
        key: 'dispenseUOM',
        title: 'UOM',
        width: 80,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        render: (_, row) => {
          const uom = getUOM(row)
          return (
            <Tooltip title={uom}>
              <span>{uom}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'quantity',
        key: 'quantity',
        name: 'quantity',
        title: 'Ord. Qty.',
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        align: 'right',
        width: 85,
        render: (_, row) => {
          const qty = numeral(row.quantity).format('0.0')
          return (
            <Tooltip title={qty}>
              <span>{qty}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'dispenseQuantity',
        key: 'dispenseQuantity',
        title: 'Disp. Qty.',
        width: 80,
        onCell: row => ({ colSpan: row.isGroup ? 0 : 1 }),
        align: 'right',
        render: (_, row) => {
          if (
            (pharmacyDetails.fromModule === 'Main' &&
              row.statusFK !== PHARMACY_STATUS.NEW) ||
            !row.allowToDispense ||
            type === 'CompletedItems'
          ) {
            const dispenseQty = !row.stockFK
              ? '-'
              : `${numeral(row.dispenseQuantity).format('0.0')}`
            return (
              <Tooltip title={dispenseQty}>
                <span>{dispenseQty}</span>
              </Tooltip>
            )
          }
          let maxQuantity
          if (row.isDefault) {
            maxQuantity = row.remainQty
          } else {
            maxQuantity = row.remainQty > row.stock ? row.stock : row.remainQty
          }
          return (
            <div style={{ position: 'relative' }}>
              <NumberInput
                label=''
                step={1}
                format='0.0'
                //max={maxQuantity}
                min={0}
                disabled={!row.isDispensedByPharmacy}
                precision={1}
                value={row.dispenseQuantity}
                onChange={e => {
                  onValueChange(
                    row.uid,
                    'dispenseQuantity',
                    e.target.value < 0 ? 0 : e.target.value,
                  )
                }}
              />
              {row.dispenseQuantity > maxQuantity && (
                <Tooltip
                  title={`Dispense quantity cannot be more than ${numeral(
                    maxQuantity,
                  ).format('0.0')}`}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -5,
                      top: 5,
                      color: 'red',
                    }}
                  >
                    *
                  </div>
                </Tooltip>
              )}
            </div>
          )
        },
      },
      {
        dataIndex: 'stock',
        key: 'stock',
        title: 'Stock Qty.',
        width: 100,
        onCell: row => ({ colSpan: row.isGroup ? 0 : 1 }),
        align: 'right',
        render: (_, row) => {
          const stock = row.stock
            ? `${numeral(row.stock).format('0.0')} ${getDispenseUOM(row)}`
            : '-'
          return (
            <Tooltip title={stock}>
              <span>{stock}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'stockFK',
        key: 'stockFK',
        title: 'Batch No.',
        width: 130,
        onCell: row => ({ colSpan: row.isGroup ? 0 : 1 }),
        render: (_, row) => {
          const isExpire =
            ((pharmacyDetails.fromModule === 'Main' &&
              row.statusFK === PHARMACY_STATUS.NEW) ||
              type === 'PendingItems') &&
            row.expiryDate &&
            moment(row.expiryDate).startOf('day') < moment().startOf('day')
          if (
            (pharmacyDetails.fromModule === 'Main' &&
              row.statusFK !== PHARMACY_STATUS.NEW) ||
            !row.allowToDispense ||
            type === 'CompletedItems'
          ) {
            return (
              <div>
                <Tooltip title={row.batchNo}>
                  <div
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.batchNo || '-'}
                  </div>
                </Tooltip>
                {isExpire && <p style={{ color: 'red' }}>EXPIRED!</p>}
              </div>
            )
          }
          return (
            <div>
              <CodeSelect
                value={row.stockFK}
                labelField='batchNo'
                valueField='id'
                options={getBatchOptions(row)}
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ width: '200px!important' }}
                renderDropdown={option => {
                  const batchtext = option.expiryDate
                    ? `${option.batchNo}, Exp.: ${moment(
                        option.expiryDate,
                      ).format('DD MMM YYYY')}`
                    : option.batchNo
                  return (
                    <Tooltip title={batchtext}>
                      <div
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          width: 230,
                        }}
                      >
                        {batchtext}
                      </div>
                    </Tooltip>
                  )
                }}
                onChange={(v, option) => {
                  onValueChange(row.uid, 'stockFK', option)
                }}
              ></CodeSelect>
              {isExpire && <p style={{ color: 'red' }}>EXPIRED!</p>}
            </div>
          )
        },
      },
      {
        dataIndex: 'expiryDate',
        key: 'expiryDate',
        title: 'Expiry Date',
        width: 110,
        onCell: row => ({ colSpan: row.isGroup ? 0 : 1 }),
        render: (_, row) => {
          if (
            (pharmacyDetails.fromModule === 'Main' &&
              row.statusFK !== PHARMACY_STATUS.NEW) ||
            !row.isDefault ||
            type === 'CompletedItems'
          ) {
            const expiryDate = row.expiryDate
              ? moment(row.expiryDate).format('DD MMM YYYY')
              : '-'
            const isExpire =
              ((pharmacyDetails.fromModule === 'Main' &&
                row.statusFK === PHARMACY_STATUS.NEW) ||
                type === 'PendingItems') &&
              row.expiryDate &&
              moment(row.expiryDate).startOf('day') < moment().startOf('day')
            return (
              <Tooltip title={expiryDate}>
                <span style={{ color: isExpire ? 'red' : 'black' }}>
                  {expiryDate}
                </span>
              </Tooltip>
            )
          } else {
            return (
              <DatePicker
                value={row.expiryDate}
                onChange={value => {
                  onValueChange(row.uid, 'expiryDate', value)
                }}
              />
            )
          }
        },
      },
      {
        dataIndex: 'stockBalance',
        key: 'stockBalance',
        title: 'Bal. Qty.',
        width: 100,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        align: 'right',
        render: (_, row) => {
          const balStock = row.stockBalance
          const stock = balStock ? `${numeral(balStock).format('0.0')}` : '-'
          return (
            <Tooltip title={stock}>
              <span>{stock}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'instruction',
        key: 'instruction',
        title: `Instruction${
          secondaryPrintoutLanguage !== '' ? `(${showLanguage})` : ''
        }`,
        width: 180,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.groupNumber === 1 ? row.groupRowSpan : 0,
        }),
        render: (_, row) => {
          let instruction
          if (row.invoiceItemTypeFK !== 1) {
            instruction = row.instruction
          } else {
            instruction = row.language.isShowFirstValue
              ? row.instruction
              : row.secondInstruction
          }
          return (
            <Tooltip title={instruction}>
              <span>{instruction}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'drugInteraction',
        key: 'drugInteraction',
        title: `Drug Interaction${
          secondaryPrintoutLanguage !== '' ? `(${showLanguage})` : ''
        }`,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        width: 180,
        render: (_, row) => {
          const interaction = getDrugInteraction(row)
          return (
            <Tooltip title={interaction}>
              <span>{interaction}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'drugContraindication',
        key: 'drugContraindication',
        title: `Contraindication${
          secondaryPrintoutLanguage !== '' ? `(${showLanguage})` : ''
        }`,
        width: 180,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        render: (_, row) => {
          const contraIndication = getDrugContraIndication(row)
          return (
            <Tooltip title={contraIndication}>
              <span>{contraIndication}</span>
            </Tooltip>
          )
        },
      },
      {
        dataIndex: 'remarks',
        key: 'remarks',
        title: 'Remarks',
        width: 300,
        onCell: row => ({
          colSpan: row.isGroup ? 0 : 1,
          rowSpan: row.countNumber === 1 ? row.rowspan : 0,
        }),
        render: (_, row) => {
          const existsDrugLabelRemarks =
            showDrugLabelRemark &&
            row.drugLabelRemarks &&
            row.drugLabelRemarks.trim() !== ''
          return (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  paddingRight: existsDrugLabelRemarks ? 10 : 0,
                  minHeight: 20,
                }}
              >
                <Tooltip title={row.remarks || ''}>
                  <span className='oneline_textblock'>
                    {row.remarks || ' '}
                  </span>
                </Tooltip>
              </div>
              {existsDrugLabelRemarks && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: -8,
                  }}
                >
                  <Tooltip
                    title={
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          Drug Label Remarks
                        </div>
                        <div>{row.drugLabelRemarks}</div>
                      </div>
                    }
                  >
                    <FileCopySharp style={{ color: '#4255bd' }} />
                  </Tooltip>
                </div>
              )}
            </div>
          )
        },
      },
      //{ name: 'action', title: 'Action' },
    ]

    if (isHiddenStock) {
      columns = columns.filter(c => c.dataIndex !== 'stock')
    }

    return columns
  }

  const commitChanges = ({ rows, changed }) => {
    if (changed) {
      const { setFieldValue } = props
      const key = Object.keys(changed)[0]
      const editRow = rows.find(r => r.uid === key)
      let matchItems = []
      if (editRow.isDrugMixture) {
        matchItems = rows.filter(r => r.drugMixtureFK === editRow.drugMixtureFK)
      } else {
        matchItems = rows.filter(
          r => r.type === editRow.type && r.id === editRow.id,
        )
      }
      const balanceQty =
        editRow.remainQty - _.sumBy(matchItems, r => r.dispenseQuantity || 0)
      matchItems.forEach(item => (item.stockBalance = balanceQty))
      setFieldValue('orderItems', rows)
    }
  }

  const checkPartialDispense = () => {
    let isPartialDispense = false
    if (workitem.statusFK !== PHARMACY_STATUS.NEW) {
      const pharmacyOrderItem = pharmacyDetails?.entity?.pharmacyOrderItem || []
      for (let index = 0; index < pharmacyOrderItem.length; index++) {
        if (
          pharmacyOrderItem[index].invoiceItemTypeFK !== 1 ||
          (pharmacyOrderItem[index].inventoryFK &&
            !pharmacyOrderItem[index].isExternalPrescription)
        ) {
          if (
            pharmacyOrderItem[index].quantity >
            _.sumBy(
              pharmacyOrderItem[index].pharmacyOrderItemTransaction || [],
              'transactionQty',
            )
          ) {
            isPartialDispense = true
            break
          }
        } else if (
          pharmacyOrderItem[index].isDrugMixture &&
          pharmacyOrderItem[index].prescriptionDrugMixture.find(
            dm =>
              dm.isDispensedByPharmacy &&
              dm.quantity >
                _.sumBy(
                  dm.pharmacyOrderItemTransaction || [],
                  'transactionQty',
                ),
          )
        ) {
          isPartialDispense = true
          break
        }
      }
    }
    return isPartialDispense
  }

  const getFuncProps = (type = 'PendingItems') => {
    let defaultExpandedGroups
    let orderItems = []
    if (type === 'PendingItems') {
      defaultExpandedGroups = props.values.defaultExpandedGroups
      orderItems = props.values.orderItems
    } else {
      defaultExpandedGroups = props.values.completedExpandedGroups
      orderItems = props.values.completedItems
    }
    return {
      pager: false,
      grouping: true,
      groupingConfig: {
        isDisableExpandedGroups: true,
        state: {
          grouping: [{ columnName: 'dispenseGroupId' }],
          expandedGroups: defaultExpandedGroups,
        },
        row: {
          indentColumnWidth: 0,
          iconComponent: icon => <span></span>,
          contentComponent: group => {
            const { row } = group
            const groupRow =
              orderItems.find(data => data.dispenseGroupId === row.value) || {}
            if (row.value === 'NormalDispense')
              return (
                <div className={classes.groupStyle}>
                  <span style={{ fontWeight: 600 }}>Normal Dispense Items</span>
                </div>
              )
            if (row.value === 'NoNeedToDispense')
              return (
                <div className={classes.groupStyle}>
                  <span style={{ fontWeight: 600 }}>
                    No Need To Dispense Items
                  </span>
                </div>
              )
            return (
              <div className={classes.groupStyle}>
                <span style={{ fontWeight: 600 }}>{'Drug Mixture: '}</span>
                {groupRow.drugMixtureName}
              </div>
            )
          },
        },
        backgroundColor: 'rgb(240, 248, 255)',
      },
    }
  }

  const onCloseJournalHistory = () => {
    dispatch({
      type: 'pharmacyDetails/updateState',
      payload: {
        journalHistoryList: [],
      },
    })
    setShowJournalHistory(false)
  }
  const showDrugLeafletSelection = () => {
    dispatch({
      type: 'pharmacyDetails/queryLeafletDrugList',
      payload: {
        id: pharmacyDetails.entity?.visitFK,
      },
    }).then(data => {
      if (data) {
        data = _.orderBy(
          data,
          [t => t.displayInLeaflet, t => t.displayName.toLowerCase()],
          ['desc', 'asc'],
        )
        setDrugLeafletData(data)
        setShowLeafletSelectionPopup(true)
      }
    })
  }
  const showDrugLabelSelection = () => {
    let batchs = props.values.orderItems.map(x => {
      return { id: x.id, batchNo: x.batchNo, expiryDate: x.expiryDate }
    })
    setBatchInformation(batchs)
    setShowDrugLabelSelectionPopup(true)
  }
  const showDrugSummaryLabelSelection = () => {
    dispatch({
      type: 'pharmacyDetails/queryLeafletDrugList',
      payload: {
        id: pharmacyDetails.entity?.visitFK,
      },
    }).then(data => {
      if (data) {
        data = _.orderBy(
          data,
          [t => t.dispenseByPharmacy, t => t.displayName.toLowerCase()],
          ['desc', 'asc'],
        )
        setDrugDrugSummaryLabelData(data)
        setShowDrugSummaryLabelSelectionPopup(true)
      }
    })
  }

  const printReview = reportid => {
    let reprottitle = ''
    let reportparameters = {}
    if (reportid == 84) {
      reprottitle = 'Prescription'
      const { visitFK, id, patientProfileFK } = pharmacyDetails?.entity || {}
      reportparameters = { visitFK, pharmacyWorkitemId: id, patientProfileFK }
    }
    setReportID(reportid)
    setReportTitle(reprottitle)
    setReportParameters(reportparameters)
    setShowReportViwer(true)
  }

  const closeReportViewer = () => {
    setReportID(-1)
    setReportTitle('')
    setReportParameters({})
    setShowReportViwer(false)
  }

  const closeLeafletSelectionPopup = () => {
    setShowLeafletSelectionPopup(false)
  }

  const closeDrugLabelSelectionPopup = () => {
    setShowDrugLabelSelectionPopup(false)
  }

  const closeDrugSummaryLabelSelectionPopup = () => {
    setShowDrugSummaryLabelSelectionPopup(false)
  }

  const actualizeEditOrder = () => {
    if (pharmacyDetails.editingOrder === false) {
      dispatch({
        type: 'orders/updateState',
        payload: {
          type: '1',
          visitPurposeFK: visitPurposeFK,
        },
      })
      dispatch({
        type: 'dispense/updateState',
        payload: { ordersData: pharmacyDetails.ordersData },
      })
      if (visitPurposeFK === VISIT_TYPE.OTC) {
        dispatch({
          type: 'dispense/query',
          payload: {
            id: workitem.visitFK,
            version: Date.now(),
          },
        }).then(r => {
          if (r) {
            setShowEditOrderModal(true)
          }
        })
      } else {
        dispatch({
          type: `consultation/editOrder`,
          payload: {
            id: pharmacyDetails.entity?.visitFK,
            queueID: pharmacyDetails.entity?.visitFK,
            version: Date.now(),
          },
        }).then(r => {
          if (r) {
            dispatch({
              type: 'dispense/query',
              payload: {
                id: workitem.visitFK,
                version: Date.now(),
              },
            })
              .then(r => {
                setEditingOrder(true)
              })
              .then(r => {
                dispatch({
                  type: 'orders/upsertRows',
                  payload: pharmacyDetails.ordersData,
                })
              })
          }
        })
      }
    }
  }

  if (pharmacyDetails.openOrderPopUpAfterActualize) {
    actualizeEditOrder()
    pharmacyDetails.openOrderPopUpAfterActualize = false
  }

  const checkExpiredItems = () => {
    if (
      (props.values.orderItems || []).find(
        item =>
          item.expiryDate &&
          moment(item.expiryDate).startOf('day') < moment().startOf('day'),
      )
    ) {
      return true
    }
    return false
  }

  const onPendingValueChange = (uid, valueField, value) => {
    const { setFieldValue } = props
    const newItems = [...values.orderItems]
    const editRow = newItems.find(r => r.uid === uid)
    if (valueField === 'stockFK') {
      if (value) {
        editRow.stockFK = value.id
        editRow.batchNo = value.batchNo
        editRow.expiryDate = value.expiryDate
        editRow.isDefault = value.isDefault
        editRow.stock = value.stock
      } else {
        editRow.stockFK = undefined
        editRow.batchNo = undefined
        editRow.expiryDate = undefined
        editRow.isDefault = false
        editRow.stock = 0
        editRow.dispenseQuantity = 0
      }
    } else {
      editRow[valueField] = value
    }
    if (valueField === 'dispenseQuantity' || valueField === 'stockFK') {
      let matchItems = []
      if (editRow.isDrugMixture) {
        matchItems = newItems.filter(
          r => r.drugMixtureFK === editRow.drugMixtureFK,
        )
      } else {
        matchItems = newItems.filter(
          r => r.type === editRow.type && r.id === editRow.id,
        )
      }
      const balanceQty =
        editRow.quantity - _.sumBy(matchItems, r => r.dispenseQuantity || 0)
      matchItems.forEach(item => (item.stockBalance = balanceQty))
    }
    setFieldValue('orderItems', newItems)
  }

  const getGroupDispenseItem = (type = 'CompletedItems') => {
    const items =
      type === 'CompletedItems'
        ? values.completedItems || []
        : values.orderItems || []
    let newItem = []
    var groupId = _.uniqBy(items, 'dispenseGroupId')
    groupId.forEach(item => {
      newItem = newItem.concat({
        uid: item.dispenseGroupId,
        isGroup: true,
        groupName: item.isDrugMixture
          ? item.drugMixtureName
          : item.dispenseGroupId,
        groupNumber: 1,
        groupRowSpan: 1,
        countNumber: 1,
        rowspan: 1,
      })

      newItem = newItem.concat([
        ...items.filter(x => x.dispenseGroupId === item.dispenseGroupId),
      ])
    })

    return newItem
  }
  return (
    <div>
      <GridContainer>
        <GridItem md={12} style={{ marginTop: 30 }}>
          <PharmacySteps
            statusHistory={statusHistory}
            currentStatusFK={workitem.statusFK}
            isPartialDispense={checkPartialDispense()}
          />
        </GridItem>
        <GridItem md={12}>
          <Typography.Title level={5}>Order Details</Typography.Title>
        </GridItem>
        <ContentGridItem title='Queue No.:'>{queueNo}</ContentGridItem>
        <ContentGridItem title='Diagnosis:'>
          {(corDiagnosis || []).length
            ? workitem.corDiagnosis
                .map(d =>
                  diagnosisDataSource === 'Snomed'
                    ? d.diagnosisDescription
                    : d.icD10DiagnosisDescription,
                )
                .join(', ')
            : '-'}
        </ContentGridItem>
        <ContentGridItem title='Visit Type:'>
          {visitType?.displayValue || '-'}
        </ContentGridItem>
        <ContentGridItem title='Order By:'>{`${
          workitem.generateByUserTitle &&
          workitem.generateByUserTitle.trim().length
            ? `${workitem.generateByUserTitle}. `
            : ''
        }${workitem.generateByUser || ''}`}</ContentGridItem>
        <ContentGridItem title='Order Created Time:'>
          {moment(workitem.generateDate).format('DD MMM YYYY HH:mm')}
        </ContentGridItem>
        <ContentGridItem title='Visit Group No.:'>
          {hasValue(workitem.visitGroup) &&
          workitem.visitGroup.trim().length ? (
            <VisitGroupIcon
              visitGroup={workitem.visitGroup}
              visitFK={workitem.visitFK}
              isQueueNoDecimal={isQueueNoDecimal}
            />
          ) : (
            '-'
          )}
        </ContentGridItem>
        <ContentGridItem title='Family History:'>
          {workitem.familyHistory && workitem.familyHistory.trim().length
            ? workitem.familyHistory
            : '-'}
        </ContentGridItem>
        <ContentGridItem title='Social History:'>
          {workitem.socialHistory && workitem.socialHistory.trim().length
            ? workitem.socialHistory
            : '-'}
        </ContentGridItem>
        <ContentGridItem title='Medical History:'>
          {workitem.medicalHistory && workitem.medicalHistory.trim().length
            ? workitem.medicalHistory
            : '-'}
        </ContentGridItem>
        <GridItem md={6} style={{ paddingRight: 40 }}>
          {isOrderUpdate && (
            <div style={{ position: 'relative' }}>
              <Alert
                message={currentMessage}
                banner
                className={classes.alertStyle}
                icon={<Warning style={{ color: 'red' }} />}
              />
              {orderUpdateMessage.isPharmacyOrderUpdate &&
                workitem.statusFK === PHARMACY_STATUS.NEW && (
                  <Button
                    color='primary'
                    justIcon
                    className={classes.refreshButton}
                    onClick={refreshClick}
                  >
                    <Refresh />
                  </Button>
                )}
            </div>
          )}
        </GridItem>
        <GridItem
          md={6}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Typography.Text
            underline
            style={{
              cursor: 'pointer',
              color: '#1890f8',
              position: 'relative',
              top: '6px',
            }}
            onClick={() => {
              dispatch({
                type: 'pharmacyDetails/queryJournalHistory',
                payload: {
                  pharmacyWorkitemFK: workitem.id,
                  pagesize: 9999,
                },
              }).then(r => {
                if (r) {
                  setShowJournalHistory(true)
                }
              })
            }}
          >
            Journal History
          </Typography.Text>

          {secondaryPrintoutLanguage !== '' && (
            <Select
              style={{ marginLeft: 16 }}
              value={showLanguage}
              options={[
                {
                  label: primaryPrintoutLanguage,
                  value: primaryPrintoutLanguage,
                },
                {
                  label: secondaryPrintoutLanguage,
                  value: secondaryPrintoutLanguage,
                },
              ]}
              onChange={v => {
                setShowLanguage(v)
                const { setFieldValue } = props
                setFieldValue(
                  'orderItems',
                  props.values.orderItems.map(item => {
                    return {
                      ...item,
                      language: {
                        value: v,
                        isShowFirstValue: v === primaryPrintoutLanguage,
                      },
                    }
                  }),
                )

                setFieldValue(
                  'completedItems',
                  (props.values.completedItems || []).map(item => {
                    return {
                      ...item,
                      language: {
                        value: v,
                        isShowFirstValue: v === primaryPrintoutLanguage,
                      },
                    }
                  }),
                )
              }}
            />
          )}
        </GridItem>
      </GridContainer>
      {(pharmacyDetails.fromModule === 'Main' ||
        (values.orderItems || []).length > 0) && (
        <div style={{ margin: '8px 8px 0px 8px' }}>
          {pharmacyDetails.fromModule === 'History' && (
            <div style={{ fontWeight: 600, margin: '3px 0px' }}>
              Pending Items
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <AntdTable
              className={customtyles.table}
              size='small'
              bordered
              pagination={false}
              dataSource={getGroupDispenseItem('PendingItems')}
              columns={getColumns('PendingItems', onPendingValueChange)}
            />
          </div>
        </div>
      )}
      {pharmacyDetails.fromModule === 'History' && (
        <div style={{ margin: '8px 8px 0px 8px' }}>
          {(values.orderItems || []).length > 0 && (
            <div style={{ fontWeight: 600, margin: '3px 0px' }}>
              Completed Items
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <AntdTable
              className={customtyles.table}
              size='small'
              bordered
              pagination={false}
              dataSource={getGroupDispenseItem('CompletedItems')}
              columns={getColumns('CompletedItems', onPendingValueChange)}
            />
          </div>
        </div>
      )}
      <GridContainer style={{ marginTop: 10 }}>
        <GridItem md={8}>
          <div style={{ position: 'relative' }}>
            <Button
              color='primary'
              onClick={() => showDrugLabelSelection()}
              size='sm'
              disabled={isOrderUpdate}
            >
              <Print />
              Drug Label
            </Button>
            <Button
              color='primary'
              onClick={() => showDrugSummaryLabelSelection()}
              size='sm'
              disabled={isOrderUpdate}
            >
              <Print />
              Drug Summary Label
            </Button>
            <Button
              color='primary'
              onClick={() => showDrugLeafletSelection()}
              size='sm'
              disabled={isOrderUpdate}
            >
              <Print />
              Patient Info Leaflet
            </Button>
            <Button
              color='primary'
              size='sm'
              disabled={isOrderUpdate}
              onClick={() => printReview(84)}
            >
              <Print />
              Prescription
            </Button>
            {/* {secondaryPrintoutLanguage !== '' && (
              <CheckboxGroup
                value={printlanguage}
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  marginLeft: '6px',
                }}
                options={[
                  { value: 'EN', label: 'EN' },
                  { value: 'JP', label: 'JP' },
                ]}
                onChange={v => {
                  setPrintlanguage(v.target.value)
                }}
              />
            )} */}
          </div>
        </GridItem>
        <GridItem
          md={4}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            color='danger'
            size='sm'
            onClick={() => {
              if (
                workitem.statusFK !== PHARMACY_STATUS.NEW &&
                !pharmacyOrderItemCount
              ) {
                updatePharmacy(PHARMACY_ACTION.CANCEL)
              } else {
                const { onClose } = props
                onClose()
              }
            }}
          >
            {workitem.statusFK !== PHARMACY_STATUS.NEW &&
            !pharmacyOrderItemCount
              ? 'Cancel'
              : 'Close'}
          </Button>
          {pharmacyDetails.fromModule === 'Main' &&
            workitem.statusFK === PHARMACY_STATUS.NEW &&
            showButton('pharmacyworklist.editorder') && (
              <Button
                color='success'
                size='sm'
                disabled={isOrderUpdate || !pharmacyOrderItemCount}
                onClick={editOrder}
              >
                Edit Order
              </Button>
            )}
          {pharmacyDetails.fromModule === 'Main' &&
            workitem.statusFK !== PHARMACY_STATUS.NEW &&
            showButton('pharmacyworklist.redispenseorder') && (
              <Button
                color='primary'
                size='sm'
                onClick={() => {
                  setShowRedispenseFormModal(true)
                }}
                disabled={
                  !pharmacyOrderItemCount ||
                  orderUpdateMessage.isPharmacyOrderDiscard
                }
              >
                Re-dispense
              </Button>
            )}
          {pharmacyDetails.fromModule === 'Main' &&
            workitem.statusFK === PHARMACY_STATUS.NEW &&
            showButton('pharmacyworklist.prepareorder') && (
              <Button
                color='primary'
                size='sm'
                onClick={() => onPrepare(PHARMACY_ACTION.PREPARE)}
                disabled={
                  isOrderUpdate ||
                  !pharmacyOrderItemCount ||
                  checkExpiredItems()
                }
              >
                Prepare
              </Button>
            )}
          {pharmacyDetails.fromModule === 'Main' &&
            workitem.statusFK === PHARMACY_STATUS.PREPARED &&
            showButton('pharmacyworklist.verifyorder') && (
              <Button
                color='primary'
                size='sm'
                onClick={() => updatePharmacy(PHARMACY_ACTION.VERIFY)}
                disabled={isOrderUpdate || !pharmacyOrderItemCount}
              >
                Verify
              </Button>
            )}
          {pharmacyDetails.fromModule === 'Main' &&
            workitem.statusFK === PHARMACY_STATUS.VERIFIED &&
            showButton('pharmacyworklist.dispenseorder') && (
              <Button
                color='primary'
                size='sm'
                onClick={() => updatePharmacy(PHARMACY_ACTION.COMPLETE)}
                disabled={isOrderUpdate || !pharmacyOrderItemCount}
              >
                Complete
              </Button>
            )}
          {pharmacyDetails.fromModule === 'History' &&
            (values.orderItems || []).length > 0 &&
            workitem.statusFK === PHARMACY_STATUS.COMPLETED &&
            showButton('pharmacyworklisthistory.completeorder') && (
              <Button
                color='primary'
                size='sm'
                onClick={() => onPrepare(PHARMACY_ACTION.COMPLETEPARTIAL)}
                disabled={isOrderUpdate || checkExpiredItems()}
              >
                Complete
              </Button>
            )}
        </GridItem>
      </GridContainer>
      <CommonModal
        open={showEditOrderModal}
        title='Edit Order'
        showFooter={true}
        onClose={() => {
          dispatch({
            type: 'orders/reset',
          })
          setShowEditOrderModal(false)
        }}
        onConfirm={() => {
          dispatch({
            type: 'orders/reset',
          })
          setShowEditOrderModal(false)
        }}
        maxWidth='md'
        observe='OrderPage'
        showFooter={false}
      >
        <AddOrder
          visitType={visitPurposeFK}
          isFirstLoad={false}
          onReloadClick={reloadPharmacy}
          {...props}
          history={history}
        />
      </CommonModal>
      <CommonModal
        open={showRedispenseFormModal}
        title='Alert'
        onClose={closeRedispenseForm}
        maxWidth='sm'
        cancelText='Cancel'
        observe='RedispenseForm'
      >
        <RedispenseForm onConfirmRedispense={onConfirmRedispense} />
      </CommonModal>
      <Drawer
        anchor='right'
        open={showJournalHistory}
        onClose={onCloseJournalHistory}
      >
        <JournalHistory
          journalHistoryList={pharmacyDetails.journalHistoryList}
          onClose={onCloseJournalHistory}
        />
      </Drawer>
      <CommonModal
        open={showReportViwer}
        onClose={closeReportViewer}
        title={reportTitle}
        maxWidth='lg'
      >
        <ReportViewer
          showTopDivider={false}
          reportID={reportID}
          reportParameters={reportParameters}
          defaultScale={1.5}
        />
      </CommonModal>
      <CommonModal
        open={showLeafletSelectionPopup}
        title='Print Patient Info Leaflet'
        onClose={closeLeafletSelectionPopup}
        maxWidth='sm'
        cancelText='Cancel'
        observe='Confirm'
      >
        <DrugLeafletSelection
          {...props}
          rows={drugLeafletData}
          type='PIL'
          visitid={pharmacyDetails.entity?.visitFK}
          onConfirmPrintLeaflet={onConfirmPrintLeaflet}
        />
      </CommonModal>
      <CommonModal
        open={showDrugSummaryLabelSelectionPopup}
        title='Print Drug Summary Labels'
        onClose={closeDrugSummaryLabelSelectionPopup}
        maxWidth='sm'
        cancelText='Cancel'
        observe='Confirm'
      >
        <DrugLeafletSelection
          {...props}
          rows={drugDrugSummaryLabelData}
          type='drugsummarylabel'
          visitid={pharmacyDetails.entity?.visitFK}
          onConfirmPrintLeaflet={closeDrugSummaryLabelSelectionPopup}
        />
      </CommonModal>
      <CommonModal
        open={showDrugLabelSelectionPopup}
        title='Print Drug Labels'
        onClose={closeDrugLabelSelectionPopup}
        maxWidth='sm'
        cancelText='Cancel'
        observe='Confirm'
      >
        <DrugLabelSelection
          {...props}
          values={props.values}
          currentDrugToPrint={currentDrugToPrint}
          dispatch={dispatch}
          visitid={pharmacyDetails.entity?.visitFK}
          batchInformation={batchInformation}
          source='pharmacy'
          handleSubmit={() => {
            onConfirmPrintDrugLabel()
          }}
        />
      </CommonModal>
    </div>
  )
}

export default compose(
  withWebSocket(),
  withStyles(styles),
  connect(({ pharmacyDetails, clinicSettings, codetable, user }) => ({
    pharmacyDetails,
    clinicSettings: clinicSettings.settings || clinicSettings.default,
    codetable,
    user,
  })),
  withFormikExtend({
    enableReinitialize: true,
    mapPropsToValues: ({ pharmacyDetails }) => {
      if (!pharmacyDetails?.entity)
        return { orderItems: [], completedItems: [] }
      return pharmacyDetails.entity
    },
    //validationSchema: Yup.object().shape({}),
    handleSubmit: () => {},
    displayName: 'PharmarcyWorklistDetail',
  }),
)(Main)
