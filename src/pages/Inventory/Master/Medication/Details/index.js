import React, { useEffect, useState, useContext } from 'react'
import { connect } from 'dva'
import { FastField } from 'formik'
import { withStyles } from '@material-ui/core/styles'
import { compose } from 'redux'
import {
  Radio,
  Card,
  Anchor,
  Select,
  Menu,
  PageHeader,
  Button as AntBtn,
} from 'antd'
import { UserOutlined, DownOutlined, LinkOutlined } from '@ant-design/icons'
import {
  errMsgForOutOfRange as errMsg,
  getTranslationValue,
  navigateDirtyCheck,
  roundTo,
} from '@/utils/utils'
import { SYSTEM_LANGUAGE } from '@/utils/constants'
import {
  ProgressButton,
  Button,
  withFormikExtend,
  Tabs,
  Switch,
  CardContainer,
} from '@/components'
import Yup from '@/utils/yup'
import { headerHeight } from 'mui-pro-jss'
import { getBizSession } from '@/services/queue'
import { AuthorizationWrapper } from '@/components/_medisys'
import Authorized from '@/utils/Authorized'
const { Secured } = Authorized
import General from './General'
import Pricing from '../../Pricing'
import Stock from '../../Stock'
import Setting from './Setting'
import DetailsContext, { DetailsContextProvider } from './DetailsContext'

const styles = () => ({
  actionDiv: {
    textAlign: 'center',
    marginTop: '22px',
    position: 'sticky',
    bottom: 0,
    width: '100%',
    paddingBottom: 10,
  },
})

const currentScrollStyle = {
  color: '#40a9ff',
  backgroundColor: '#fff',
  borderColor: '#40a9ff',
}

const sections = ['General', 'Setting', 'Pricing', 'Stock']

const CardTitle = ({ children }) => (
  <div style={{ fontWeight: 500, fontSize: '1.2rem' }}> {children}</div>
)

function validateIndication(item) {
  const parent = this.parent

  if (!parent.isMultiLanguage) return true

  if (parent.isMultiLanguage)
    return (
      (parent.indication && parent.indicationSecondary) ||
      (!parent.indication && !parent.indicationSecondary)
    )
}

const Detail = ({
  classes,
  dispatch,
  medication,
  medicationDetail,
  history,
  handleSubmit,
  setFieldValue,
  values,
  theme,
  ...props
}) => {
  const detailProps = {
    medicationDetail,
    dispatch,
    setFieldValue,
    showTransfer: true,
    values,
    hasActiveSession,
    ...props,
  }

  const {
    isMultiLanguage,
    setCurrentLanguage,
    currentLanguage,
    isEditingDosageRule,
    primaryPrintoutLanguage,
    secondaryPrintoutLanguage,
  } = useContext(DetailsContext)

  useEffect(() => window.addEventListener('resize', resizeHandler), [])

  const [windowHeight, setWindowHeith] = useState(window.innerHeight)
  const [currentScrollPosition, setCurrentScrollPosition] = useState('general')
  const [placeHolderHeight, setPlaceHolderHeight] = useState(0)

  const { clinicSettings } = props

  const resizeHandler = () => {
    setWindowHeith(window.innerHeight)
    setPlaceHolderHeight(calculatePlaceHolderHeight())
  }

  const { currentTab } = medication

  const [hasActiveSession, setHasActiveSession] = useState(true)

  const stockProps = {
    medicationDetail,
    values,
    setFieldValue,
    dispatch,
    errors: props.errors,
    hasActiveSession,
    authority: 'inventorymaster.medication',
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
    setPlaceHolderHeight(calculatePlaceHolderHeight())
  }, [])

  useEffect(() => {
    if (medicationDetail.currentId) {
      checkHasActiveSession()
      let tempCode
      let tempName
      dispatch({
        type: 'medicationDetail/query',
        payload: {
          id: medicationDetail.currentId,
        },
      }).then(async med => {
        const { sddfk } = med
        if (sddfk) {
          await dispatch({
            type: 'sddDetail/queryOne',
            payload: {
              id: sddfk,
            },
          }).then(sdd => {
            const { data } = sdd
            const { code, name } = data[0]
            tempCode = code
            tempName = name
          })
        }
        dispatch({
          type: 'medicationDetail/updateState',
          payload: {
            sddCode: tempCode,
            sddDescription: tempName,
          },
        })
      })
    }
  }, [])

  const onAnchorClick = id => {
    const parentElement = document.getElementById('card-holder')
    const element = document.getElementById(id)
    try {
      if (parentElement && element) {
        const screenPosition = element.getBoundingClientRect()
        const { scrollTop } = parentElement
        const { top, left } = screenPosition

        parentElement.scrollTo({
          // scrolled top position + element top position - Nav header height
          top: scrollTop + top - 120,
          left,
          behavior: 'smooth',
        })
        setCurrentScrollPosition(id)
      }
    } catch (error) {
      console.error({ error })
    }
  }

  const calculatePlaceHolderHeight = () => {
    try {
      const parentElement = document.getElementById('card-holder')
      const stockElement = document.getElementById('stock')

      if (parentElement && stockElement) {
        const placeHolderHeight =
          parentElement.offsetHeight - stockElement.offsetHeight
        return placeHolderHeight
      }
    } catch (error) {
      console.error({ error })
    }
  }

  return (
    <React.Fragment>
      <div>
        <PageHeader
          style={{ backgroundColor: 'white' }}
          title={
            <>
              <FastField
                name='code'
                render={args => <span>{args.field.value}</span>}
              ></FastField>
              <FastField
                name='displayValue'
                render={args => (
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 400,
                      marginLeft: 5,
                    }}
                  >
                    {args.field.value}
                  </span>
                )}
              ></FastField>
            </>
          }
          ghost={false}
          extra={[
            ...sections.map(s => {
              const currentStyle =
                currentScrollPosition === s.toLocaleLowerCase()
                  ? currentScrollStyle
                  : {}
              return (
                <AntBtn
                  id={`btn-${s.toLowerCase()}`}
                  style={{ marginLeft: 3, ...currentStyle }}
                  size='sm'
                  type='link'
                  color='primary'
                  onClick={() => onAnchorClick(s.toLowerCase())}
                >
                  {s} <LinkOutlined />
                </AntBtn>
              )
            }),

            isMultiLanguage && (
              <Select
                defaultValue={currentLanguage}
                onChange={value => {
                  setCurrentLanguage(value)
                }}
                options={[
                  {
                    label: SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
                    value: SYSTEM_LANGUAGE.PRIMARYLANGUAGE,
                  },
                  {
                    label: SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
                    value: SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
                  },
                ]}
              />
            ),
          ]}
        ></PageHeader>
        <div
          id='card-holder'
          style={{
            marginTop: 10,
            height: windowHeight - 200,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'sticky',
          }}
        >
          <Card
            onMouseEnter={e => {
              setCurrentScrollPosition(e.currentTarget.id)
            }}
            title={<CardTitle>General</CardTitle>}
            id='general'
          >
            <General {...detailProps} />
          </Card>
          <Card
            onMouseEnter={e => {
              setCurrentScrollPosition(e.currentTarget.id)
            }}
            title={<CardTitle>Setting</CardTitle>}
            id='setting'
            style={{ marginTop: 16 }}
          >
            <Setting {...detailProps} />
          </Card>
          <Card
            onMouseEnter={e => {
              setCurrentScrollPosition(e.currentTarget.id)
            }}
            title={<CardTitle>Pricing</CardTitle>}
            id='pricing'
            style={{ marginTop: 16 }}
          >
            <Pricing {...detailProps} />
          </Card>
          <Card
            onMouseEnter={e => {
              setCurrentScrollPosition(e.currentTarget.id)
            }}
            title={<CardTitle>Stock</CardTitle>}
            id='stock'
            style={{ marginTop: 16 }}
          >
            <Stock {...detailProps} />
          </Card>
          <div
            onMouseEnter={e => {
              setCurrentScrollPosition('stock')
            }}
            id='scroll-placeholder'
            style={{ height: placeHolderHeight }}
          ></div>
        </div>
      </div>
      <div className={classes.actionDiv}>
        <Button
          authority='none'
          color='danger'
          onClick={navigateDirtyCheck({
            redirectUrl: '/inventory/master?t=0',
          })}
        >
          Close
        </Button>
        <ProgressButton
          submitKey='medicationDetail/submit'
          onClick={handleSubmit}
          disabled={isEditingDosageRule}
        />
      </div>
    </React.Fragment>
  )
}

const DetailsWithProvider = props => (
  <DetailsContextProvider>
    <Detail {...props}></Detail>
  </DetailsContextProvider>
)
export default compose(
  withStyles(styles, { withTheme: true }),
  connect(({ medication, medicationDetail, clinicSettings }) => ({
    medication,
    medicationDetail,
    clinicSettings: clinicSettings.settings,
  })),
  withFormikExtend({
    enableReinitialize: true,
    mapPropsToValues: ({ medicationDetail, clinicSettings }) => {
      const medicationDetails = medicationDetail.entity
        ? medicationDetail.entity
        : medicationDetail.default
      const {
        primaryPrintoutLanguage,
        secondaryPrintoutLanguage,
      } = clinicSettings
      const isMultiLanguage =
        primaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE ||
        secondaryPrintoutLanguage === SYSTEM_LANGUAGE.SECOUNDLANGUAGE
      let checkboxGroup = []
      const {
        isChasAcuteClaimable,
        isChasChronicClaimable,
        isMedisaveClaimable,
        isExclusive,
        isDisplayInLeaflet,
        orderable,
        inventoryMedication_MedicationIngredient = [],
        inventoryMedication_MedicationGroup = [],
        inventoryMedication_MedicationSideEffect = [],
        inventoryMedication_MedicationPrecaution = [],
        inventoryMedication_Medication,
        inventoryMedication_MedicationContraIndication = [],
        inventoryMedication_MedicationInteraction = [],
        inventoryMedication_DrugAllergy,
        isDispensedByPharmacy,
        isNurseActualizable,
      } = medicationDetails
      if (isChasAcuteClaimable) {
        checkboxGroup.push('isChasAcuteClaimable')
      }
      if (isChasChronicClaimable) {
        checkboxGroup.push('isChasChronicClaimable')
      }
      if (isMedisaveClaimable) {
        checkboxGroup.push('isMedisaveClaimable')
      }
      if (isExclusive) {
        checkboxGroup.push('isExclusive')
      }
      if (isDisplayInLeaflet) {
        checkboxGroup.push('isDisplayInLeaflet')
      }
      if (orderable || !medicationDetails.id) {
        checkboxGroup.push('orderable')
      }
      if (isDispensedByPharmacy || !medicationDetails.id) {
        checkboxGroup.push('isDispensedByPharmacy')
      }
      if (isNurseActualizable) {
        checkboxGroup.push('isNurseActualizable')
      }

      let indicationSecondary
      if (isMultiLanguage)
        indicationSecondary = getTranslationValue(
          medicationDetails.translationData,
          SYSTEM_LANGUAGE.SECOUNDLANGUAGE,
          'indication',
        )

      let medicationIngredients = _.orderBy(
        inventoryMedication_MedicationIngredient,
        'sequence',
        'asc',
      ).map(item => {
        return {
          id: item.medicationIngredientFK,
          freeText: item.concentration,
        }
      })
      let drugAllergies = _.orderBy(
        inventoryMedication_DrugAllergy,
        'sequence',
        'asc',
      ).map(item => item.drugAllergyFK)

      let medicationSideEffects = _.orderBy(
        inventoryMedication_MedicationSideEffect,
        'sequence',
        'asc',
      ).map(item => {
        return {
          id: item.medicationSideEffectFK,
        }
      })

      let medicationPrecautions = _.orderBy(
        inventoryMedication_MedicationPrecaution,
        'sequence',
        'asc',
      ).map(item => {
        return {
          id: item.medicationPrecautionFK,
        }
      })

      let medicationContraindications = _.orderBy(
        inventoryMedication_MedicationContraIndication,
        'sequence',
        'asc',
      ).map(item => {
        return {
          id: item.medicationContraIndicationFK,
        }
      })

      let medicationInteractions = _.orderBy(
        inventoryMedication_MedicationInteraction,
        'sequence',
        'asc',
      ).map(item => {
        return {
          id: item.medicationInteractionFK,
        }
      })

      let medicationGroups = _.orderBy(
        inventoryMedication_MedicationGroup,
        'sequence',
        'asc',
      ).map(item => {
        return {
          id: item.medicationGroupFK,
        }
      })

      return {
        ...medicationDetails,
        medicationIngredients,
        medicationGroups,
        drugAllergies,
        medicationSideEffects,
        medicationPrecautions,
        medicationContraindications,
        medicationInteractions,
        isMultiLanguage,
        indicationSecondary,
        checkboxGroup,
        sddCode: medicationDetail.sddCode,
        sddDescription: medicationDetail.sddDescription,
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
      indication: Yup.string().test(
        'oneOfRequired',
        'Please enter indication in all languages',
        validateIndication,
      ),
      indicationSecondary: Yup.string().test(
        'oneOfRequired',
        'Please enter indication in all languages',
        validateIndication,
      ),
      isMultiLanguage: Yup.boolean(),
      effectiveDates: Yup.array()
        .of(Yup.date())
        .min(2)
        .required(),
      // prescribingUOMFK: Yup.number().required(),
      prescriptionToDispenseConversion: Yup.number().when('prescribingUOMFK', {
        is: prescribingUOMFK => prescribingUOMFK != undefined,
        then: Yup.number().required(),
      }),
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
    }),

    handleSubmit: (values, { props, resetForm }) => {
      const {
        id,
        medicationStock,
        effectiveDates,
        attachment,
        medicationIngredients = [],
        medicationGroups = [],
        medicationSideEffects = [],
        medicationPrecautions = [],
        medicationInteractions = [],
        medicationContraindications = [],
        medicationInstructionRule = [],
        drugAllergies = [],
        ...restValues
      } = values
      const { dispatch, history, onConfirm, medicationDetail } = props

      let defaultMedicationStock = medicationStock
      if (medicationStock.length === 0) {
        defaultMedicationStock = [
          {
            inventoryMedicationFK: id,
            batchNo: 'Not Applicable',
            stock: 0,
            isDefault: true,
          },
        ]
      }

      let checkboxGroup = {
        isChasAcuteClaimable: false,
        isChasChronicClaimable: false,
        isMedisaveClaimable: false,
        isExclusive: false,
        isDisplayInLeaflet: false,
        orderable: false,
        isDispensedByPharmacy: false,
        isNurseActualizable: false,
      }
      values.checkboxGroup.forEach(o => {
        checkboxGroup[o] = true
      })

      const fileInfo = {}
      if (attachment) {
        const newAttach = attachment.filter(
          a => !a.isDeleted && a.fileIndexFK === undefined,
        )[0]

        fileInfo.fileIndexFK = newAttach?.id
        fileInfo.fileName = newAttach?.fileName
      }

      let medicationIngredientList = undefined
      if (medicationIngredients) {
        medicationIngredientList = medicationIngredients.map((item, index) => {
          return {
            medicationIngredientFK: item.id,
            sequence: index,
            concentration: item.freeText,
            inventoryMedicationFK: id,
          }
        })
      }

      let drugAllergyList = undefined
      if (drugAllergies) {
        drugAllergyList = drugAllergies.map(m => {
          return { drugAllergyFK: m, inventoryMedicationFK: id }
        })
      }

      let sideEffectList = undefined
      if (medicationSideEffects) {
        sideEffectList = medicationSideEffects.map((item, index) => {
          return {
            medicationSideEffectFK: item.id,
            sequence: index,
            inventoryMedicationFK: id,
          }
        })
      }

      let precautionList = undefined
      if (medicationPrecautions) {
        precautionList = medicationPrecautions.map((item, index) => {
          return {
            medicationPrecautionFK: item.id,
            sequence: index,
            inventoryMedicationFK: id,
          }
        })
      }

      let groupList = undefined
      if (medicationGroups) {
        groupList = medicationGroups.map((item, index) => {
          return {
            medicationGroupFK: item.id,
            sequence: index,
            inventoryMedicationFK: id,
          }
        })
      }

      let contraIndicationList = undefined
      if (medicationContraindications) {
        contraIndicationList = medicationContraindications.map(
          (item, index) => {
            return {
              medicationContraIndicationFK: item.id,
              sequence: index,
              inventoryMedicationFK: id,
            }
          },
        )
      }

      let interactionList = undefined
      if (medicationInteractions) {
        interactionList = medicationInteractions.map((item, index) => {
          return {
            medicationInteractionFK: item.id,
            sequence: index,
            inventoryMedicationFK: id,
          }
        })
      }

      let finalMedicationInstructionRule = [...medicationInstructionRule]
      let deletedItems = []
      if (medicationDetail.entity) {
        const originalValues = medicationDetail.entity.medicationInstructionRule

        if (originalValues) {
          if (medicationInstructionRule.length === 0)
            deletedItems = originalValues.map(item => ({
              ...item,
              isDeleted: true,
            }))
          else {
            deletedItems = originalValues
              .filter(
                orig =>
                  medicationInstructionRule.findIndex(d => d.id === orig.id) ===
                  -1,
              )
              .map(item => ({ ...item, isDeleted: true }))
          }

          if (deletedItems)
            finalMedicationInstructionRule = [
              ...finalMedicationInstructionRule,
              ...deletedItems,
            ]
        }
      }
      const payload = {
        ...restValues,
        ...checkboxGroup,
        ...fileInfo,
        id,
        orderable: checkboxGroup.orderable,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
        medicationStock: defaultMedicationStock,
        suggestSellingPrice: roundTo(restValues.suggestSellingPrice),
        inventoryMedication_MedicationIngredient: medicationIngredientList,
        inventoryMedication_MedicationGroup: groupList,
        inventoryMedication_MedicationSideEffect: sideEffectList,
        inventoryMedication_MedicationPrecaution: precautionList,
        inventoryMedication_MedicationContraIndication: contraIndicationList,
        inventoryMedication_MedicationInteraction: interactionList,
        inventoryMedication_DrugAllergy: drugAllergyList,
        medicationInstructionRule: finalMedicationInstructionRule,
      }

      dispatch({
        type: 'medicationDetail/upsert',
        payload,
      }).then(r => {
        if (r) {
          // if (onConfirm) onConfirm()
          dispatch({
            type: 'medicationDetail/reset',
          })
          resetForm()
          history.push('/inventory/master')
        }
      })
    },

    displayName: 'InventoryMedicationDetail',
  }),
)(Secured('inventorymaster.medication')(DetailsWithProvider))
