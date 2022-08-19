import React, { useEffect, useState } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'redux'
import {
  errMsgForOutOfRange as errMsg,
  navigateDirtyCheck,
  roundTo,
  ableToViewByAuthority,
} from '@/utils/utils'
import {
  ProgressButton,
  Button,
  withFormikExtend,
  Tabs,
  notification,
} from '@/components'
import Yup from '@/utils/yup'
import { getBizSession } from '@/services/queue'
import Authorized from '@/utils/Authorized'
import { VaccinationDetailOption } from './variables'

const { Secured } = Authorized

const styles = () => ({
  actionDiv: {
    float: 'center',
    textAlign: 'center',
    marginTop: '22px',
    marginRight: '10px',
  },
})
const Detail = ({
  classes,
  dispatch,
  vaccination,
  vaccinationDetail,
  history,
  handleSubmit,
  setFieldValue,
  ...props
}) => {
  const [hasActiveSession, setHasActiveSession] = useState(undefined)

  const detailProps = {
    vaccinationDetail,
    dispatch,
    setFieldValue,
    showTransfer: false,
    hasActiveSession,
    ...props,
  }

  const stockProps = {
    vaccinationDetail,
    values: props.values,
    setFieldValue,
    dispatch,
    errors: props.errors,
    hasActiveSession,
    authority: 'inventorymaster.vaccination',
  }

  const checkHasActiveSession = async () => {
    const bizSessionPayload = {
      IsClinicSessionClosed: false,
    }
    const result = await getBizSession(bizSessionPayload)
    const { data } = result.data
    setHasActiveSession(data.length > 0)
  }

  useEffect(() => {
    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'documenttemplate',
      },
    })
    checkHasActiveSession()
    if (vaccinationDetail.currentId) {
      dispatch({
        type: 'vaccinationDetail/query',
        payload: {
          id: vaccinationDetail.currentId,
        },
      }).then(vac => {
        const { sddfk } = vac
        if (sddfk) {
          dispatch({
            type: 'sddDetail/queryOne',
            payload: {
              id: sddfk,
            },
          }).then(sdd => {
            // const { data } = sdd
            // const { code, name } = data[0]
            // setFieldValue('sddCode', code)
            // setFieldValue('sddDescription', name)
          })
        }
      })
    }
  }, [])

  const handelSave = () => {
    const {
      values: { schemes = [] },
      codetable,
    } = props
    const { documenttemplate = [] } = codetable
    if (
      schemes.find(s => s === 'isAutoGenerateCertificate') &&
      !documenttemplate.find(
        dt => dt.isDefaultTemplate === true && dt.documentTemplateTypeFK === 3,
      )
    ) {
      notification.warning({
        message: 'No template found. Select a template in Document Template.',
      })
    }
    handleSubmit()
  }

  return (
    <React.Fragment>
      {hasActiveSession !== undefined && (
        <React.Fragment>
          <Tabs
            style={{ marginTop: 20 }}
            defaultActiveKey='0'
            options={VaccinationDetailOption(detailProps, stockProps)}
          />
          <div className={classes.actionDiv}>
            <Button
              color='danger'
              authority='none'
              onClick={navigateDirtyCheck({
                redirectUrl: '/inventory/master?t=2',
              })}
            >
              Close
            </Button>
            {ableToViewByAuthority('inventorymaster.vaccination') && (
              <ProgressButton
                submitKey='vaccinationDetail/submit'
                onClick={handelSave}
              />
            )}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  )
}
export default compose(
  withStyles(styles, { withTheme: true }),
  connect(({ vaccination, vaccinationDetail, codetable, clinicSettings }) => ({
    vaccination,
    vaccinationDetail,
    codetable,
    clinicSettings: clinicSettings.settings,
  })),
  withFormikExtend({
    enableReinitialize: true,
    mapPropsToValues: ({ vaccinationDetail, clinicSettings }) => {
      const returnValue = vaccinationDetail.entity
        ? vaccinationDetail.entity
        : vaccinationDetail.default

      let schemes = []
      const {
        isChasAcuteClaimable,
        isChasChronicClaimable,
        isMedisaveClaimable,
        isAutoGenerateCertificate,
        isNurseActualizable,
      } = returnValue
      if (isChasAcuteClaimable) {
        schemes.push('isChasAcuteClaimable')
      }
      if (isChasChronicClaimable) {
        schemes.push('isChasChronicClaimable')
      }
      if (isMedisaveClaimable) {
        schemes.push('isMedisaveClaimable')
      }
      if (isAutoGenerateCertificate) {
        schemes.push('isAutoGenerateCertificate')
      }
      if (isNurseActualizable || !returnValue.id) {
        schemes.push('isNurseActualizable')
      }

      return {
        ...returnValue,
        schemes,
        clinicSettings: clinicSettings.settings,
        dispensingQuantity: returnValue.dispensingQuantity || null,
      }
    },

    validationSchema: Yup.object().shape({
      code: Yup.string().when('id', {
        is: id => !!id,
        then: Yup.string()
          .trim()
          .required(),
      }),
      displayValue: Yup.string().required(),
      revenueCategoryFK: Yup.number().required(),
      effectiveDates: Yup.array()
        .of(Yup.date())
        .min(2)
        .required(),
      prescribingUOMFK: Yup.number().required(),
      prescriptionToDispenseConversion: Yup.number().required(),
      dispensingUOMFK: Yup.number().required(),
      averageCostPrice: Yup.number()
        .min(0, 'Average Cost Price must between 0 and 999,999.9999')
        .max(999999.9999, 'Average Cost Price must between 0 and 999,999.9999'),

      markupMargin: Yup.number()
        .min(0, 'Markup Margin must between 0 and 999,999.9')
        .max(999999.9, 'Markup Margin must between 0 and 999,999.9'),

      suggestSellingPrice: Yup.number()
        .min(0, 'Suggested Selling Price must between 0 and 999,999.99')
        .max(
          999999.99,
          'Suggested Selling Price must between 0 and 999,999.99',
        ),

      sellingPrice: Yup.number()
        .required()
        .min(0, errMsg('Selling Price'))
        .max(999999.99, errMsg('Selling Price')),

      maxDiscount: Yup.number()
        .min(0, 'Max Discount must between 0 and 999,999.9')
        .max(999999.9, 'Max Discount must between 0 and 999,999.9'),

      reOrderThreshold: Yup.number()
        .min(0, 'Re-Order Threshold must between 0 and 999,999.9')
        .max(999999.9, 'Re-Order Threshold must between 0 and 999,999.9'),

      criticalThreshold: Yup.number()
        .min(0, 'Critical Threshold must between 0 and 999,999.9')
        .max(999999.9, 'Critical Threshold must between 0 and 999,999.9'),

      excessThreshold: Yup.number()
        .min(0, 'Excess Threshold must between 0 and 999,999.9')
        .max(999999.9, 'Excess Threshold must between 0 and 999,999.9'),
      dispensingQuantity: Yup.number()
        .integer('Must be an integer')
        .min(1, 'Min. value is 1'),
    }),
    handleSubmit: (values, { props, resetForm }) => {
      const { dispatch, history } = props
      const { id, vaccinationStock, effectiveDates, ...restValues } = values
      let defaultVaccinationStock = vaccinationStock
      if (vaccinationStock.length === 0) {
        defaultVaccinationStock = [
          {
            inventoryVaccinationFK: id,
            batchNo: 'Not Applicable',
            stock: 0,
            isDefault: true,
          },
        ]
      }
      let schemes = {
        isChasAcuteClaimable: false,
        isChasChronicClaimable: false,
        isMedisaveClaimable: false,
        isAutoGenerateCertificate: false,
        isNurseActualizable: false,
      }
      values.schemes.forEach(o => {
        if (o === 'isChasAcuteClaimable') {
          schemes[o] = true
        } else if (o === 'isChasChronicClaimable') {
          schemes[o] = true
        } else if (o === 'isMedisaveClaimable') {
          schemes[o] = true
        } else if (o === 'isAutoGenerateCertificate') {
          schemes[o] = true
        } else if (o === 'isNurseActualizable') {
          schemes[o] = true
        }
      })
      dispatch({
        type: 'vaccinationDetail/upsert',
        payload: {
          ...restValues,
          ...schemes,
          id,
          effectiveStartDate: values.effectiveDates[0],
          effectiveEndDate: values.effectiveDates[1],
          markupMargin: parseFloat(values.markupMargin),
          vaccinationStock: defaultVaccinationStock,
          suggestSellingPrice: roundTo(restValues.suggestSellingPrice),
        },
      }).then(r => {
        if (r) {
          resetForm()
          history.push('/inventory/master?t=2')
        }
      })
    },
    displayName: 'InventoryVaccinationDetail',
  }),
)(Secured('inventorymaster.vaccination')(Detail))
