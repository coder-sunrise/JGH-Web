import { createFormViewModel } from 'medisys-model'
import { INVOICE_STATUS } from '@/utils/constants'
import { notification } from '@/components'
import service from '../services/podoPayment'

export default createFormViewModel({
  namespace: 'podoPayment',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      purchaseOrderPayment: [],
      default: {},
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, search, query = {} } = loct
        if (pathname.indexOf('/inventory/pr/pdodetails') === 0) {
          dispatch({
            type: 'updateState',
            payload: {
              type: query.type,
              id: Number(query.id),
            },
          })
          dispatch({
            type: 'getCurrentBizSession',
          })
        }
      })
    },
    effects: {
      *getCurrentBizSession(_, { put, call }) {
        const bizSessionPayload = {
          IsClinicSessionClosed: false,
        }
        const response = yield call(service.getBizSession, bizSessionPayload)

        const { data } = response
        // data = null when get session failed
        if (data && data.totalRecords === 1) {
          const { data: sessionData } = data

          yield put({
            type: 'setCurrentBizSession',
            payload: { ...sessionData[0] },
          })
          return true
        }

        yield put({
          type: 'setCurrentBizSession',
          payload: {},
        })
        return false
      },
      *queryPodoPayment({ payload }, { call, put }) {
        const newPOValue = payload.payload
        let returnValue = payload
        if (newPOValue) returnValue = newPOValue
        return yield put({
          type: 'setPodoPayment',
          payload: {
            ...returnValue,
          },
        })
      },
      *upsertPodoPayment({ payload }, { call }) {
        const r = yield call(service.updatePodoPayment, payload)
        if (r === 204) {
          notification.success({ message: 'Saved' })
          return true
        }
        return r
      },
    },
    reducers: {
      setPodoPayment(state, { payload }) {
        const { purchaseOrder } = payload
        const type = purchaseOrder || payload
        const {
          purchaseOrderPayment,
          purchaseOrderNo,
          purchaseOrderDate,
          totalAmount,
          totalAftGst = 0,
          purchaseOrderStatus,
          supplierFK,
          purchaseOrderStatusFK,
          concurrencyToken,
          invoiceStatusFK,
        } = type

        let totalPaidAmount = 0
        let newPurchaseOrderPayment
        if (purchaseOrderPayment.length >= 1) {
          let tempId = 9999 // temp id for paymentModeFK to match with the paymentMode list
          newPurchaseOrderPayment = purchaseOrderPayment
            .filter(x => x.clinicPaymentDto.isCancelled === false)
            .map(x => {
              x.cpId = x.clinicPaymentDto.id
              x.cpConcurrencyToken = x.clinicPaymentDto.concurrencyToken
              totalPaidAmount += x.clinicPaymentDto.paymentAmount
              if (x.clinicPaymentDto.creditCardTypeFK) {
                x.clinicPaymentDto.paymentModeFK =
                  tempId + x.clinicPaymentDto.creditCardTypeFK
              }

              return {
                ...x.clinicPaymentDto,
                ...x,
              }
            })
        }

        return {
          ...state,
          purchaseOrderDetails: {
            purchaseOrderNo,
            purchaseOrderDate,
            totalAmount,
            totalAftGst,
            purchaseOrderStatus,
            outstandingAmount:
              invoiceStatusFK === INVOICE_STATUS.WRITEOFF
                ? 0
                : totalAftGst - totalPaidAmount,
            supplierFK,
            purchaseOrderStatusFK,
            concurrencyToken,
          },
          purchaseOrderPayment: newPurchaseOrderPayment || [],
        }
      },
      setCurrentBizSession(state, { payload }) {
        return {
          ...state,
          currentBizSessionInfo: {
            ...payload,
          },
        }
      },
    },
  },
})
