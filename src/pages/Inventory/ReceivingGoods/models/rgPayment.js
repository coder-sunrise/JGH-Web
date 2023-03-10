import { createFormViewModel } from 'medisys-model'
import { INVOICE_STATUS } from '@/utils/constants'
import { notification } from '@/components'
import service from '../services/rgPayment'

export default createFormViewModel({
  namespace: 'rgPayment',
  config: {
    queryOnLoad: false,
  },
  param: {
    service,
    state: {
      receivingGoodsPayment: [],
      default: {},
    },
    subscriptions: ({ dispatch, history }) => {
      history.listen(async (loct, method) => {
        const { pathname, query = {} } = loct
        if (pathname.indexOf('/inventory/rg/rgdetails') === 0) {
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
      *queryRGPayment({ payload }, { put }) {
        const newPOValue = payload.payload
        let returnValue = payload
        if (newPOValue) returnValue = newPOValue
        return yield put({
          type: 'setRGPayment',
          payload: {
            ...returnValue,
          },
        })
      },
      *upsertRGPayment({ payload }, { call }) {
        const r = yield call(service.updateRGPayment, payload)
        if (r === 204) {
          notification.success({ message: 'Saved' })
          return true
        }
        return r
      },
    },
    reducers: {
      setRGPayment(state, { payload }) {
        const { receivingGoods } = payload
        const type = receivingGoods || payload
        const {
          receivingGoodsPayment,
          receivingGoodsNo,
          receivingGoodsDate,
          totalAmount,
          totalAftGST = 0,
          receivingGoodsStatus,
          supplierFK,
          receivingGoodsStatusFK,
          concurrencyToken,
          invoiceStatusFK,
        } = type

        let totalPaidAmount = 0
        let newReceivingGoodsPayment
        if (receivingGoodsPayment.length >= 1) {
          let tempId = 9999 // temp id for paymentModeFK to match with the paymentMode list
          newReceivingGoodsPayment = receivingGoodsPayment.map(x => {
            x.cpId = x.clinicPaymentDto.id
            x.cpConcurrencyToken = x.clinicPaymentDto.concurrencyToken
            x.isCancelled = x.clinicPaymentDto.isCancelled
            x.cancelReason = x.clinicPaymentDto.cancelReason
            if (!x.clinicPaymentDto.isCancelled) {
              totalPaidAmount += x.clinicPaymentDto.paymentAmount
            }
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
          receivingGoodsDetails: {
            receivingGoodsNo,
            receivingGoodsDate,
            totalAmount,
            totalAftGST,
            receivingGoodsStatus,
            outstandingAmount:
              invoiceStatusFK === INVOICE_STATUS.WRITEOFF
                ? 0
                : totalAftGST - totalPaidAmount,
            supplierFK,
            receivingGoodsStatusFK,
            concurrencyToken,
          },
          receivingGoodsPayment: newReceivingGoodsPayment || [],
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
