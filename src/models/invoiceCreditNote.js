import { createFormViewModel } from 'medisys-model'
import moment from 'moment'
import * as service from '@/services/invoicePayment'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'

const InitialCreditNote = {
  invoicePayerFK: 0,
  generatedDate: moment(),
  invoiceTotal: 0,
  isStockIn: false,
  creditNoteItem: [],
  totalAftGST: 0,
  creditNoteBalance: 0,
  finalCredit: 0,
}

export default createFormViewModel({
  namespace: 'invoiceCreditNote',
  config: {},
  param: {
    service,
    state: {},
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
        if (pathname.indexOf('/finance/invoice/details') === 0) {
          dispatch({
            type: 'updateState',
            payload: {
              currentId: Number(query.id),
            },
          })
        }
      })
    },
    effects: {},
    reducers: {
      mapCreditNote (state, { payload }) {
        const {
          invoicePayerFK,
          invoiceDetail,
          invoicePaymentDetails,
          payerType,
        } = payload

        const {
          invoiceTotalAftGST,
          invoiceItem,
          gstValue,
          invoiceGSTAmt,
        } = invoiceDetail
        const sum = (a) => a.reduce((x, y) => x + y)

        const filterInvPayment = invoicePaymentDetails.find(
          (x) => x.id === invoicePayerFK,
        )
        const {
          payerTypeFK,
          payerDistributedAmt,
          outStanding,
          creditNote,
        } = filterInvPayment

        const creditNoteBalance =
          payerTypeFK === INVOICE_PAYER_TYPE.PATIENT
            ? payerDistributedAmt
            : outStanding

        const filteredCreditNote = creditNote.filter(
          (x) => x.invoicePayerFK === invoicePayerFK && !x.isCancelled,
        )
        const pastCreditNoteItems = filteredCreditNote
          .reduce((filtered, item) => {
            return [
              ...filtered,
              ...item.creditNoteItem,
            ]
          }, [])
          .reduce(
            (itemSubtotal, item) =>
              itemSubtotal[item.itemCode] !== undefined
                ? {
                    ...itemSubtotal,
                    [item.itemCode]:
                      itemSubtotal[item.itemCode] + item.quantity,
                  }
                : { ...itemSubtotal, [item.itemCode]: item.quantity },
            {},
          )

        const remainingItems = invoiceItem.map((item) => {
          // const pastItemQuantity = pastCreditNoteItems[item.itemCode]
          // if (pastItemQuantity) {
          //   const remainingQty = item.quantity - pastItemQuantity
          //   return {
          //     ...item,
          //     invoiceItemFK: item.id,
          //     itemTypeFK: item.invoiceItemTypeFK,
          //     quantity: remainingQty,
          //     originRemainingQty: remainingQty,
          //     // totalAfterItemAdjustment: remaining quantity multiply unit price
          //     totalAfterItemAdjustment:
          //       (item.quantity - pastItemQuantity) * item.unitPrice,
          //     _totalAfterGST: item.totalAfterGST,
          //   }
          // }
          return {
            ...item,
            invoiceItemFK: item.id,
            itemTypeFK: item.invoiceItemTypeFK,
            originRemainingQty: item.quantity,
            totalAfterItemAdjustment: item.quantity * item.unitPrice,
            _totalAfterGST: item.totalAfterGST,
            _unitPriceAftGst:
              item.quantity && item.quantity > 0
                ? item.totalAfterGST / item.quantity
                : item.unitPrice,
          }
        })

        let totalCreditNote
        totalCreditNote =
          filteredCreditNote.length > 0
            ? sum(filteredCreditNote.map((x) => Number(x.totalAftGST)))
            : 0

        return {
          ...InitialCreditNote,
          gstValue,
          payerType,
          invoiceGSTAmt,
          invoicePayerFK,
          invoiceTotal: invoiceTotalAftGST,
          creditNoteItem: remainingItems
            ? remainingItems.filter((x) => x.originRemainingQty > 0)
            : [],
          creditNoteBalance: creditNoteBalance - totalCreditNote,
        }
      },
    },
  },
})
