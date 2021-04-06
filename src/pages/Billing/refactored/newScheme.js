import React from 'react'
import * as Yup from 'yup'
import moment from 'moment'
import _ from 'lodash'
import { Add, Print } from '@material-ui/icons'
// material ui
import { Paper, withStyles } from '@material-ui/core'
// common utils
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
// common components
import {
  Button,
  GridContainer,
  GridItem,
  Select,
  CommonTableGrid,
  EditableTableGrid,
  CardContainer,
} from '@/components'
// sub components
import PaymentSummary from '@/pages/Finance/Invoice/Details/PaymentDetails/PaymentSummary'
import PaymentRow from '@/pages/Finance/Invoice/Details/PaymentDetails/PaymentRow'
import roundTo from '@/utils/utils'
import MaxCap from './MaxCap'
import BalanceLabel from './BalanceLabel'
import DeleteWithPopover from '../components/DeleteWithPopover'
import NotEditableInfo from '../components/NotEditableInfo'
import {
  SchemeInvoicePayerColumn,
  CompanyInvoicePayerColumn,
  ApplyClaimsColumnExtension,
} from '../variables'

const styles = (theme) => ({
  gridRow: {
    margin: theme.spacing(1),
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),

    '& > h5': {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  },
  dangerText: {
    fontWeight: 500,
    color: '#cf1322',
  },
  currencyText: {
    fontWeight: 500,
    color: 'darkblue',
  },
  gridActionBtn: {
    textAlign: 'right',
    marginTop: theme.spacing(1),
  },
  rightEndBtn: {
    marginRight: 0,
  },
})

const validationSchema = Yup.object().shape({
  eligibleAmount: Yup.number(),
  payableBalance: Yup.number(),
  claimAmount: Yup.number().when(
    [
      'eligibleAmount',
      'payableBalance',
    ],
    (eligibleAmount, payableBalance) => {
      const _checkAmount = eligibleAmount || payableBalance

      if (_checkAmount) {
        return Yup.number().max(
          roundTo(_checkAmount),
          `Cannot claim more than $${_checkAmount.toFixed(2)}`,
        )
      }
      return Yup.number()
    },
  ),
})

const Scheme = ({
  _key,
  classes,
  invoicePayer,
  index,
  hasOtherEditing,
  onCancelClick,
  onEditClick,
  onApplyClick,
  onDeleteClick,
  onSchemeChange,
  onCommitChanges,
  onPaymentVoidClick,
  onPrinterClick,
  onAddPaymentClick,
  fromBilling,
  patient,
  ctschemetype,
  ctcopaymentscheme,
  tempInvoicePayer,
  clinicSettings = {},
  isUpdatedAppliedInvoicePayerInfo,
  showRefreshOrder,
}) => {
  const {
    name,
    payerTypeFK,
    companyFK,
    schemeConfig = {},
    copaymentSchemeFK,
    _isConfirmed,
    _isEditing,
    _isAppliedOnce,
    claimableSchemes = [],
    invoicePayerItem,
    id,
    _hasError = false,
    hasPayments = false,
    chasClaimStatuses = [],
    payerDistributedAmt,
    payerOutstanding,
    invoicePayment = [],
    schemePayerFK,
    payerName,
  } = invoicePayer

  const handleSchemeChange = (value) => onSchemeChange(value, index)
  const handleCancelClick = () => onCancelClick(index)
  const handleEditClick = () => onEditClick(index)
  const handleApplyClick = () => onApplyClick(index)
  const handleDeleteClick = () => onDeleteClick(index)

  const shouldDisableDelete = () => {
    if (invoicePayment.find((o) => o.isCancelled === false)) {
      return true
    }

    const statuses = chasClaimStatuses.map((status) => status.toLowerCase())
    if (hasPayments || statuses.includes('approved')) return true
    return _isEditing
      ? false
      : hasOtherEditing || isUpdatedAppliedInvoicePayerInfo || showRefreshOrder
  }

  const columnExtensions = [
    ...ApplyClaimsColumnExtension,
    {
      columnName: 'claimAmount',
      align: 'right',
      type: 'currency',
      width: 150,
      currency: true,
      isDisabled: (row) => _isConfirmed || !row.isClaimable, // latter is for drug mixture
    },
  ]

  const showGrid = companyFK || !_.isEmpty(schemeConfig)
  const disableEdit =
    (payerTypeFK === INVOICE_PAYER_TYPE.SCHEME ||
      payerTypeFK === INVOICE_PAYER_TYPE.PAYERACCOUNT) &&
    id !== undefined &&
    _.isEmpty(schemeConfig)
  const titleColor = disableEdit ? 'grey' : 'darkblue'

  const ButtonProps = {
    icon: true,
    simple: true,
    color: 'primary',
    size: 'sm',
  }

  const shouldDisable = () => {
    return _isEditing || hasOtherEditing
  }

  const getPayerList = (payerScheme) => {
    // copayment scheme get scheme type fk, use it to find schemefk in schemepayer
    const scheme = ctcopaymentscheme.find(
      (a) => a.id === payerScheme.copaymentSchemeFK,
    )
    if (!scheme || scheme === undefined) return []
    const schemeType =
      ctschemetype.find((c) => c.name === scheme.schemeTypeName) || []
    const addedSchemes =
      tempInvoicePayer
        .filter((r) => r.copaymentSchemeFK !== scheme.id)
        .map((a) => {
          return a.copaymentSchemeFK
        }) || []
    if (!schemeType) return []
    return patient.schemePayer
      .filter(
        (b) =>
          b.schemeFK === schemeType.id &&
          addedSchemes.indexOf(payerScheme.copaymentSchemeFK) < 0,
      )
      .map((p) => {
        return {
          name: p.payerName,
          id: p.id,
        }
      })
  }

  let payments = []
  payments = payments.concat(
    invoicePayment.map((o) => {
      return {
        ...o,
        type: 'Payment',
        itemID: o.receiptNo,
        date: o.paymentReceivedDate,
        amount: o.totalAmtPaid,
      }
    }),
  )
  const onPaymentDeleteClick = (payment) => {
    onPaymentVoidClick(index, payment)
  }
  const { isEnableAddPaymentInBilling = false } = clinicSettings

  const isCHAS = schemeConfig && schemeConfig.copayerFK === 1
  const isMedisave = payerTypeFK === INVOICE_PAYER_TYPE.PAYERACCOUNT

  const payerList = getPayerList(invoicePayer)
  const payer = payerList.find((p) => p.id === schemePayerFK)

  return (
    <Paper key={_key} elevation={4} className={classes.gridRow}>
      <GridContainer style={{ marginBottom: 16 }} alignItems='flex-start'>
        <GridItem md={6} style={{ marginTop: 8, marginBottom: 16 }}>
          {/* Copayment Scheme [Only chas can select] */}
          <span
            style={{
              width: '100%',
              display: 'flex',
              fontWeight: 500,
              fontSize: '1rem',
              color: titleColor,
              marginRight: 20,
            }}
          >
            {disableEdit && <NotEditableInfo />}
            {payerTypeFK === INVOICE_PAYER_TYPE.SCHEME &&
            _isEditing && (
              <Select
                style={{ width: '100%' }}
                size='sm'
                allowClear={false}
                simple
                valueField='id'
                onChange={handleSchemeChange}
                value={copaymentSchemeFK}
                disabled={_isConfirmed}
                options={[
                  ...claimableSchemes.map((item) => ({
                    id: item.id,
                    name: item.coPaymentSchemeName,
                  })),
                ]}
              />
            )}
            {_isConfirmed && !payerName && !payer && <span>{name}</span>}
            {payerTypeFK === INVOICE_PAYER_TYPE.COMPANY &&
            _isEditing && <span>{name}</span>}
            {payerTypeFK === INVOICE_PAYER_TYPE.PAYERACCOUNT && (
              <span>
                {name} - {payerName || payer.name}
              </span>
            )}
          </span>
        </GridItem>
        {(isCHAS || isMedisave) && (
          <GridItem md={2} style={{ marginTop: 8, marginBottom: 8 }}>
            <BalanceLabel schemeConfig={schemeConfig} />
          </GridItem>
        )}
        {!disableEdit && (
          <GridItem md={2} style={{ marginTop: 8, marginBottom: 8 }}>
            <MaxCap
              payerTypeFK={payerTypeFK}
              claimableSchemes={[
                claimableSchemes,
              ]}
              copaymentSchemeFK={copaymentSchemeFK}
              schemeConfig={schemeConfig}
            />
          </GridItem>
        )}
        {disableEdit && <GridItem md={2} />}
        <GridItem
          md={
            (schemeConfig && schemeConfig.copayerFK === 1) || isMedisave ? 2 : 4
          }
          style={{
            textAlign: 'right',
            marginTop: 8,
            paddingRight: '0px !important',
          }}
        >
          <DeleteWithPopover
            index={index}
            disabled={shouldDisableDelete()}
            onConfirmDelete={handleDeleteClick}
          />
        </GridItem>
        {showGrid && (
          <GridItem md={12}>
            {_isEditing ? (
              <EditableTableGrid
                key={`editable-${_key}`}
                size='sm'
                FuncProps={{ pager: false }}
                EditingProps={{
                  showCommandColumn: false,
                  onCommitChanges,
                }}
                columns={
                  payerTypeFK === INVOICE_PAYER_TYPE.SCHEME ? (
                    [
                      ...SchemeInvoicePayerColumn,
                      { name: 'error', title: ' ' },
                    ]
                  ) : (
                    [
                      ...CompanyInvoicePayerColumn,
                      { name: 'error', title: ' ' },
                    ]
                  )
                }
                columnExtensions={columnExtensions}
                rows={invoicePayerItem}
                schema={validationSchema}
              />
            ) : (
              <CommonTableGrid
                key={`editable-${_key}`}
                size='sm'
                FuncProps={{ pager: false }}
                columns={
                  payerTypeFK === INVOICE_PAYER_TYPE.SCHEME ? (
                    SchemeInvoicePayerColumn
                  ) : (
                    CompanyInvoicePayerColumn
                  )
                }
                columnExtensions={[
                  ...ApplyClaimsColumnExtension,
                  {
                    columnName: 'claimAmount',
                    align: 'right',
                    type: 'currency',
                    currency: true,
                    disabled: true,
                    width: 150,
                  },
                ]}
                rows={invoicePayerItem}
              />
            )}
          </GridItem>
        )}
        <GridItem md={8} />
        <GridItem md={4} className={classes.gridActionBtn}>
          {_isEditing && (
            <React.Fragment>
              {_isAppliedOnce && (
                <Button
                  size='sm'
                  color='danger'
                  onClick={handleCancelClick}
                  disabled={
                    payerTypeFK === INVOICE_PAYER_TYPE.SCHEME &&
                    copaymentSchemeFK === undefined
                  }
                >
                  Cancel
                </Button>
              )}
              <Button
                size='sm'
                color='primary'
                className={classes.rightEndBtn}
                onClick={handleApplyClick}
                disabled={_hasError}
              >
                Apply
              </Button>
            </React.Fragment>
          )}
          {_isConfirmed && (
            <Button
              size='sm'
              color='primary'
              className={classes.rightEndBtn}
              onClick={handleEditClick}
              disabled={
                disableEdit ||
                hasOtherEditing ||
                isUpdatedAppliedInvoicePayerInfo ||
                showRefreshOrder
              }
            >
              Edit
            </Button>
          )}
        </GridItem>
        {fromBilling &&
        isEnableAddPaymentInBilling && (
          <GridContainer>
            <GridItem md={12}>
              <CardContainer hideHeader size='sm'>
                {payments
                  .sort((a, b) => moment(a.date) - moment(b.date))
                  .map((payment) => (
                    <PaymentRow
                      {...payment}
                      handleVoidClick={onPaymentDeleteClick}
                      handlePrinterClick={onPrinterClick}
                      readOnly={shouldDisable()}
                    />
                  ))}
              </CardContainer>
            </GridItem>
            <GridItem md={7}>
              <div>
                <Button
                  {...ButtonProps}
                  disabled={
                    shouldDisable() ||
                    isUpdatedAppliedInvoicePayerInfo ||
                    showRefreshOrder
                  }
                  onClick={() => onAddPaymentClick(index)}
                >
                  <Add />
                  Add Payment
                </Button>
                <Button
                  {...ButtonProps}
                  disabled={
                    shouldDisable() ||
                    isUpdatedAppliedInvoicePayerInfo ||
                    showRefreshOrder
                  }
                  onClick={() =>
                    onPrinterClick(
                      'TaxInvoice',
                      undefined,
                      companyFK,
                      id,
                      index,
                    )}
                >
                  <Print />
                  Print Invoice
                </Button>
              </div>
            </GridItem>
            <GridItem
              md={5}
              container
              direction='column'
              justify='center'
              alignItems='flex-end'
            >
              <PaymentSummary
                payerDistributedAmt={payerDistributedAmt}
                outstanding={payerOutstanding}
              />
            </GridItem>
          </GridContainer>
        )}
      </GridContainer>
    </Paper>
  )
}

export default withStyles(styles, { name: 'Scheme' })(Scheme)
