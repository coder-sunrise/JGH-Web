import React, { useEffect, useState } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
// material ui
import { Paper, withStyles } from '@material-ui/core'
import Print from '@material-ui/icons/Print'
import Refresh from '@material-ui/icons/Refresh'
import Edit from '@material-ui/icons/Edit'
import Delete from '@material-ui/icons/Delete'
import AttachMoney from '@material-ui/icons/AttachMoney'
import AddAlert from '@material-ui/icons/AddAlert'
import { formatMessage } from 'umi/locale' // common component
import {
  Button,
  ProgressButton,
  GridItem,
  GridContainer,
  SizeContainer,
  Field,
  TextField,
  CommonModal,
} from '@/components'
import AmountSummary from '@/pages/Shared/AmountSummary'
import Authorized from '@/utils/Authorized'
import { VISIT_TYPE } from '@/utils/constants'
import { dangerColor } from '@/assets/jss'
// sub components
import TableData from './TableData'
import VaccinationGrid from './VaccinationGrid'
import DrugLabelSelection from './DrugLabelSelection'
// variables
import {
  PrescriptionColumns,
  PrescriptionColumnExtensions,
  VaccinationColumn,
  VaccinationColumnExtensions,
  OtherOrdersColumns,
  OtherOrdersColumnExtensions,
} from '../variables'

import CONSTANTS from './constants'

// const styles = (theme) => ({
//   gridRow: {
//     margin: `${theme.spacing.unit}px 0px`,
//     '& > h5': {
//       padding: theme.spacing.unit,
//     },
//   },
// })

const styles = (theme) => ({
  paper: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
  },
  actionButtons: {
    marginTop: theme.spacing(2),
  },
  gridContainer: {
    overflow: 'auto',
  },
  gridRow: {
    '&:not(:first-child)': {
      marginTop: theme.spacing(2),
    },
  },
  rightActionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    '& > button:last-child': {
      marginRight: '0px !important',
    },
  },
})

const DispenseDetails = ({
  classes,
  setFieldValue,
  setValues,
  values,
  dispatch,
  viewOnly = false,
  onPrint,
  sendingJob,
  onReloadClick,
  onSaveClick,
  onEditOrderClick,
  onFinalizeClick,
  codetable,
  dispense,
  history,
  onDrugLabelClick,
  showDrugLabelSelection,
  onDrugLabelSelectionClose,
  onDrugLabelSelected,
  onDrugLabelNoChanged,
  selectedDrugs,
}) => {
  const {
    prescription,
    vaccination,
    otherOrder,
    invoice,
    visitPurposeFK,
    visitRemarks,
  } = values || {
    invoice: { invoiceItem: [] },
  }
  const { invoiceItem = [], invoiceAdjustment = [], totalPayment } = invoice

  const { inventorymedication, inventoryvaccination } = codetable

  const handleSelectedBatch = (e, op = {}, row) => {
    // console.log({ e, op, row })
    if (op && op.length > 0) {
      const { expiryDate } = op[0]
      setFieldValue(`prescription[${row.rowIndex}]expiryDate`, expiryDate)
    } else {
      setFieldValue(`prescription[${row.rowIndex}]expiryDate`, undefined)
    }
  }

  const handleSelectVaccinationBatch = (e, op = {}, row) => {
    if (op && op.length > 0) {
      const { expiryDate } = op[0]
      setFieldValue(`vaccination[${row.rowIndex}]expiryDate`, expiryDate)
    } else {
      setFieldValue(`vaccination[${row.rowIndex}]expiryDate`, undefined)
    }
  }

  const discardCallback = (r) => {
    if (r) {
      history.push('/reception/queue')
    }
  }

  const discardAddOrderDetails = () => {
    const { id } = invoice
    dispatch({
      type: 'dispense/removeAddOrderDetails',
      payload: {
        id,
      },
    }).then(discardCallback)
  }

  const discardBillOrder = () => {
    const { id } = invoice
    dispatch({
      type: 'dispense/discardBillOrder',
      payload: { id },
    }).then(discardCallback)
  }

  const discardDispense = () => {
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: `Discard dispense?`,
        onConfirmSave:
          visitPurposeFK === VISIT_TYPE.RETAIL
            ? discardAddOrderDetails
            : discardBillOrder,
      },
    })
  }

  const updateInvoiceData = (v) => {
    const newInvoice = {
      ...values.invoice,
      invoiceTotal: v.summary.total,
      invoiceTotalAftAdj: v.summary.totalAfterAdj,
      invoiceTotalAftGST: v.summary.totalWithGST,
      outstandingBalance: v.summary.totalWithGST - values.invoice.totalPayment,
      invoiceGSTAmt: Math.round(v.summary.gst * 100) / 100,
      invoiceGSTAdjustment: v.summary.gstAdj,
      invoiceAdjustment: v.adjustments,
      isGSTInclusive: !!v.summary.isGSTInclusive,
    }
    setValues({
      ...values,
      invoice: newInvoice,
    })
    dispatch({
      type: `dispense/updateState`,
      payload: {
        totalWithGST: v.summary.totalWithGST,
        isGSTInclusive: v.summary.isGSTInclusive,
      },
    })
  }

  const { clinicalObjectRecordFK } = values || {
    clinicalObjectRecordFK: undefined,
  }

  const isRetailVisit = visitPurposeFK === VISIT_TYPE.RETAIL
  const isBillFirstVisit = visitPurposeFK === VISIT_TYPE.BILL_FIRST
  const disableRefreshOrder = isBillFirstVisit && !clinicalObjectRecordFK
  const disableDiscard = totalPayment > 0 || !!clinicalObjectRecordFK

  return (
    <React.Fragment>
      <GridContainer>
        <GridItem justify='flex-start' md={6} className={classes.actionButtons}>
          {!viewOnly &&
          !isRetailVisit && (
            <Button
              color='info'
              size='sm'
              onClick={onReloadClick}
              disabled={disableRefreshOrder}
            >
              <Refresh />
              Refresh Order
            </Button>
          )}
          <Button
            color='primary'
            size='sm'
            onClick={onDrugLabelClick}
            disabled={sendingJob}
          >
            {sendingJob ? <Refresh className='spin-custom' /> : <Print />}
            Drug Label
          </Button>
          <Button
            color='primary'
            size='sm'
            onClick={() => {
              onPrint({ type: CONSTANTS.PATIENT_LABEL })
            }}
            disabled={sendingJob}
          >
            {sendingJob ? <Refresh className='spin-custom' /> : <Print />}
            Patient Label
          </Button>
        </GridItem>
        {!viewOnly && (
          <GridItem className={classes.rightActionButtons} md={6}>
            {/* isBillFirstVisit && (
              <div
                style={{
                  marginRight: 8,
                  marginTop: 8,
                  display: 'inline-block',
                  color: dangerColor,
                }}
              >
                <SizeContainer size='lg'>
                  <AddAlert />
                </SizeContainer>
              </div>
            ) */}
            {(isRetailVisit || isBillFirstVisit) && (
              <ProgressButton
                color='danger'
                size='sm'
                icon={<Delete />}
                onClick={discardDispense}
                disabled={disableDiscard}
              >
                Discard
              </ProgressButton>
            )}
            {!isBillFirstVisit && (
              <Authorized authority='queue.dispense.savedispense'>
                <ProgressButton color='success' size='sm' onClick={onSaveClick}>
                  Save Dispense
                </ProgressButton>
              </Authorized>
            )}
            {isRetailVisit && (
              <ProgressButton
                color='primary'
                size='sm'
                icon={<Edit />}
                onClick={onEditOrderClick}
                disabled={!dispense.queryCodeTablesDone}
              >
                Add Order
              </ProgressButton>
            )}
            {!isRetailVisit && (
              <Authorized authority='queue.dispense.editorder'>
                <ProgressButton
                  color='primary'
                  size='sm'
                  icon={<Edit />}
                  onClick={onEditOrderClick}
                >
                  Edit Order
                </ProgressButton>
              </Authorized>
            )}
            <Authorized authority='queue.dispense.makepayment'>
              <ProgressButton
                color='primary'
                size='sm'
                icon={<AttachMoney />}
                onClick={onFinalizeClick}
              >
                Finalize
              </ProgressButton>
            </Authorized>
          </GridItem>
        )}
        <GridItem md={12}>
          <Paper className={classes.paper}>
            <TableData
              title='Prescription'
              idPrefix='prescription'
              columns={PrescriptionColumns}
              colExtensions={PrescriptionColumnExtensions(
                viewOnly,
                onPrint,
                inventorymedication,
                handleSelectedBatch,
              )}
              data={prescription}
            />
            <VaccinationGrid
              title='Vaccination'
              idPrefix='vaccination'
              columns={VaccinationColumn}
              colExtensions={VaccinationColumnExtensions(
                viewOnly,
                inventoryvaccination,
                handleSelectVaccinationBatch,
              )}
              data={vaccination}
              visitPurposeFK={visitPurposeFK}
            />

            <TableData
              title='Other Orders'
              idPrefix='otherOrders'
              columns={OtherOrdersColumns}
              colExtensions={OtherOrdersColumnExtensions(viewOnly, onPrint)}
              data={otherOrder}
            />
          </Paper>
        </GridItem>
        <GridItem xs={8} md={9}>
          <TextField
            value={visitRemarks}
            disabled
            multiline
            label={formatMessage({
              id: 'reception.queue.visitRegistration.visitRemarks',
            })}
          />
        </GridItem>
        {!viewOnly && (
          <GridItem xs={4} md={3}>
            <div style={{ paddingRight: 90 }}>
              <AmountSummary
                rows={invoiceItem}
                adjustments={invoiceAdjustment}
                showAddAdjustment={!isBillFirstVisit}
                config={{
                  isGSTInclusive: invoice.isGSTInclusive,
                  totalField: 'totalAfterItemAdjustment',
                  adjustedField: 'totalAfterOverallAdjustment',
                  gstField: 'totalAfterGST',
                  gstAmtField: 'gstAmount',
                  gstValue: invoice.gstValue,
                }}
                onValueChanged={updateInvoiceData}
              />
            </div>
          </GridItem>
        )}
      </GridContainer>
      <CommonModal
        title='Print Drug Labels'
        open={showDrugLabelSelection}
        observe='DispenseDetails'
        onClose={() => {
          onDrugLabelSelectionClose()
        }}
        // onConfirm={() => {
        //    onDrugLabelSelectionClose()
        //    onPrint({ type: CONSTANTS.ALL_DRUG_LABEL })
        // }}
      >
        <DrugLabelSelection
          prescription={selectedDrugs}
          codetable={codetable}
          handleDrugLabelSelected={onDrugLabelSelected}
          handleDrugLabelNoChanged={onDrugLabelNoChanged}
          handleSubmit={() => {
            onDrugLabelSelectionClose()
            onPrint({ type: CONSTANTS.ALL_DRUG_LABEL })
          }}
        />
      </CommonModal>
    </React.Fragment>
  )
}

export default compose(
  withStyles(styles, { name: 'DispenseDetailsGrid' }),
  connect(({ codetable }) => ({
    codetable,
  })),
)(DispenseDetails)
