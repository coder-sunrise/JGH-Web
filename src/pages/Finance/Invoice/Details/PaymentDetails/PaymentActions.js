import React, { useState } from 'react'
// material ui
import Printer from '@material-ui/icons/Print'
import Add from '@material-ui/icons/Add'
import RepeatIcon from '@material-ui/icons/Repeat'
// common components
import { Button, Popover } from '@/components'
import { ableToViewByAuthority } from '@/utils/utils'
import { INVOICE_REPORT_TYPES } from '@/utils/constants'
import MenuItem from '@material-ui/core/MenuItem'
import MenuList from '@material-ui/core/MenuList'
// constants variables
import { PayerType } from './variables'

const PaymentActions = ({
  handleAddPayment,
  handleAddCrNote,
  handleWriteOff,
  handleTransferToDeposit,
  handlePrinterClick,
  handleTransferClick,
  type,
  invoicePayerFK,
  companyFK,
  readOnly,
  isEnableWriteOffinInvoice,
  visitOrderTemplateFK,
}) => {
  const [showPrintInvoiceMenu, setShowPrintInvoiceMenu] = useState(false)
  const ButtonProps = {
    icon: true,
    simple: true,
    color: 'primary',
    size: 'sm',
  }
  return (
    <div>
      <Button
        onClick={() => handleAddPayment(invoicePayerFK)}
        disabled={!handleAddPayment || readOnly}
        {...ButtonProps}
      >
        <Add />
        Add Payment
      </Button>
      {ableToViewByAuthority('finance.addcreditnote') &&
        type !== PayerType.GOVT_COPAYER && (
          <Button
            onClick={() => handleAddCrNote(invoicePayerFK, type)}
            disabled={!handleAddCrNote || readOnly}
            {...ButtonProps}
          >
            <Add />
            Add Cr. Note
          </Button>
        )}
      {type === PayerType.PATIENT && (
        <Button
          onClick={() => handleTransferToDeposit(invoicePayerFK)}
          disabled={!handleTransferToDeposit || readOnly}
          {...ButtonProps}
        >
          <Add />
          Transfer Deposit
        </Button>
      )}
      {isEnableWriteOffinInvoice &&
        ableToViewByAuthority('finance.createwriteoff') &&
        type === PayerType.PATIENT && (
          <Button
            onClick={() => handleWriteOff(invoicePayerFK)}
            disabled={!handleWriteOff || readOnly}
            {...ButtonProps}
          >
            <Add />
            Write Off
          </Button>
        )}
      {type === PayerType.COPAYER_REAL && (
        <Button
          onClick={() => handleTransferClick(invoicePayerFK, type)}
          disabled={!handleTransferClick || readOnly}
          {...ButtonProps}
        >
          <RepeatIcon />
          Transfer
        </Button>
      )}
      <Popover
        icon={null}
        trigger='click'
        placement='right'
        visible={showPrintInvoiceMenu}
        onVisibleChange={() => {
          if (!companyFK && !visitOrderTemplateFK) {
            handlePrinterClick(
              'TaxInvoice',
              undefined,
              companyFK,
              invoicePayerFK,
              INVOICE_REPORT_TYPES.INDIVIDUALINVOICE,
            )
          } else {
            setShowPrintInvoiceMenu(!showPrintInvoiceMenu)
          }
        }}
        content={
          <MenuList role='menu' onClick={() => setShowPrintInvoiceMenu(false)}>
            {visitOrderTemplateFK && (
              <MenuItem
                onClick={() =>
                  handlePrinterClick(
                    'TaxInvoice',
                    undefined,
                    companyFK,
                    invoicePayerFK,
                    INVOICE_REPORT_TYPES.SUMMARYINVOICE,
                  )
                }
              >
                Summary Invoice
              </MenuItem>
            )}
            {companyFK && (
              <MenuItem
                onClick={() =>
                  handlePrinterClick(
                    'TaxInvoice',
                    undefined,
                    companyFK,
                    invoicePayerFK,
                    INVOICE_REPORT_TYPES.CLAIMABLEITEMCATEGORYINVOICE,
                  )
                }
              >
                Claimable Item Category Invoice
              </MenuItem>
            )}
            {companyFK && (
              <MenuItem
                onClick={() =>
                  handlePrinterClick(
                    'TaxInvoice',
                    undefined,
                    companyFK,
                    invoicePayerFK,
                    INVOICE_REPORT_TYPES.ITEMCATEGORYINVOICE,
                  )
                }
              >
                Item Category Invoice
              </MenuItem>
            )}
            {companyFK && (
              <MenuItem
                onClick={() =>
                  handlePrinterClick(
                    'TaxInvoice',
                    undefined,
                    companyFK,
                    invoicePayerFK,
                    invoicePayerFK,
                    INVOICE_REPORT_TYPES.CLAIMABLEITEMINVOICE,
                  )
                }
              >
                Claimable Item Invoice
              </MenuItem>
            )}
            <MenuItem
              onClick={() =>
                handlePrinterClick(
                  'TaxInvoice',
                  undefined,
                  companyFK,
                  invoicePayerFK,
                  companyFK
                    ? INVOICE_REPORT_TYPES.DETAILEDINVOICE
                    : INVOICE_REPORT_TYPES.INDIVIDUALINVOICE,
                )
              }
            >
              {companyFK ? 'Detailed Invoice' : 'Individual Invoice'}
            </MenuItem>
          </MenuList>
        }
      >
        <Button disabled={!handlePrinterClick} {...ButtonProps}>
          <Printer />
          Print Invoice
        </Button>
      </Popover>
    </div>
  )
}

export default PaymentActions
