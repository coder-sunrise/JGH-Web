import React, { PureComponent } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import { isNumber } from 'util'
import { Link } from 'umi'
import { Tag, Checkbox } from 'antd'
import { withStyles } from '@material-ui/core'
import {
  GridContainer,
  GridItem,
  TextField,
  Select,
  NumberInput,
  withFormikExtend,
  Switch,
  RadioGroup,
  FastField,
  Field,
  Tooltip,
  FieldSet,
} from '@/components'
import { currencySymbol } from '@/utils/config'
import Authorized from '@/utils/Authorized'
import Yup from '@/utils/yup'
import { getServices } from '@/utils/codetable'
import { calculateAdjustAmount } from '@/utils/utils'
import { GetOrderItemAccessRight } from '@/pages/Widgets/Orders/utils'
import {
  VISIT_TYPE,
  CANNED_TEXT_TYPE,
  NURSE_WORKITEM_STATUS,
  SERVICE_CENTER_CATEGORY,
} from '@/utils/constants'
import CannedTextButton from './CannedTextButton'
import { Alert } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { queryList } from '@/services/common'

const { CheckableTag } = Tag

const styles = theme => ({
  editor: {
    marginTop: theme.spacing(1),
    position: 'relative',
  },
  editorBtn: {
    position: 'absolute',
    right: 0,
    top: 4,
  },
  detail: {
    margin: `${theme.spacing(1)}px 0px`,
    border: '1px solid #ccc',
    borderRadius: 3,
    padding: `${theme.spacing(1)}px 0px`,
  },
  footer: {
    textAlign: 'right',
    padding: theme.spacing(1),
    paddingBottom: 0,
  },
  subTitle: {
    width: 60,
    textAlign: 'right',
    fontSize: '0.85rem',
    fontWeight: 500,
    display: 'inline-block',
    marginRight: 4,
  },
  tag: {
    border: '1px solid rgba(0, 0, 0, 0.42)',
    fontSize: '0.85rem',
    padding: '3px 6px',
    marginBottom: 2,
    maxWidth: 100,
    minWidth: 40,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  groupPanel: {
    margin: '0px 5px',
    maxHeight: 175,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  checkServiceItem: {
    display: 'inline-block',
    border: '1px solid green',
    borderRadius: 4,
    margin: 3,
    padding: '0px 6px',
    height: 28,
  },
  checkServiceLabel: {
    maxWidth: 425,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
    marginTop: 3,
    cursor: 'pointer',
  },
  checkServiceCheckBox: {
    display: 'inline-block',
    marginLeft: 6,
    position: 'relative',
    top: '-6px',
  },
  legend: {
    width: 'fit-content',
    fontSize: '0.85rem',
    margin: `${theme.spacing(1)}px ${theme.spacing(1)}px 0px`,
    padding: `0px ${theme.spacing(1)}px`,
    fontWeight: 500,
  },
  tagsGroupPanel: {
    overflowY: 'auto',
    overflowX: 'hidden',
    maxHeight: 105,
  },
  selectedServiceLabel: {
    display: 'inline-block',
    marginRight: 10,
  },
})

const getVisitDoctorUserId = props => {
  const { doctorprofile } = props.codetable
  const { doctorProfileFK } = props.visitRegistration.entity.visit
  let visitDoctorUserId
  if (doctorprofile && doctorProfileFK) {
    visitDoctorUserId = doctorprofile.find(d => d.id === doctorProfileFK)
      .clinicianProfile.userProfileFK
  }

  return visitDoctorUserId
}

@connect(({ codetable, global, user, visitRegistration, patient }) => ({
  codetable,
  global,
  user,
  visitRegistration,
  patient,
}))
@withFormikExtend({
  mapPropsToValues: ({ orders = {}, type }) => {
    const v = {
      ...(orders.entity || orders.defaultService),
    }
    if (orders.entity) {
      if (
        (v.serviceItems?.length > 0
          ? v.serviceItems[0].adjAmount
          : v.adjAmount) <= 0
      ) {
        v.adjValue = Math.abs(
          (v.serviceItems?.length > 0
            ? v.serviceItems[0].adjValue
            : v.adjValue) || 0,
        )
        v.isMinus = true
      } else {
        v.isMinus = false
      }
      v.isExactAmount = v.adjType !== 'Percentage'
      if ((v.serviceItems || []).length) {
        v.serviceItems[0].isMinus = v.isMinus
        v.serviceItems[0].isExactAmount =
          v.serviceItems?.length > 0
            ? v.serviceItems[0].isExactAmount
            : v.isExactAmount
        v.serviceItems[0].adjValue =
          v.serviceItems?.length > 0 ? v.serviceItems[0].adjValue : v.adjValue
      }
    }
    return {
      ...v,
      type,
      isEdit: !_.isEmpty(orders.entity),
      visitPurposeFK: orders.visitPurposeFK,
    }
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    serviceCenterFK: Yup.number().when('editServiceId', {
      is: val => val,
      then: Yup.number().required(),
    }),
    quantity: Yup.number().when('editServiceId', {
      is: val => val && val !== '',
      then: Yup.number().required(),
    }),
    total: Yup.number().when('editServiceId', {
      is: val => val && val !== '',
      then: Yup.number().required(),
    }),
    totalAfterItemAdjustment: Yup.number().when('editServiceId', {
      is: val => val,
      then: Yup.number().min(0.0, 'The amount should be more than 0.00'),
    }),
  }),

  handleSubmit: (values, { props, onConfirm, setValues }) => {
    const { dispatch, orders, getNextSequence, user } = props
    let nextSequence = getNextSequence()
    const data = values.serviceItems.map(item => {
      return {
        isOrderedByDoctor:
          user.data.clinicianProfile.userProfile.role.clinicRoleFK === 1,
        sequence: nextSequence++,
        ...item,
        subject: item.serviceName,
        isDeleted: false,
        adjValue:
          item.adjAmount < 0
            ? -Math.abs(item.adjValue)
            : Math.abs(item.adjValue),
      }
    })

    if (values.isEdit) {
      dispatch({
        type: 'orders/upsertRow',
        payload: data[0],
      })
    } else {
      dispatch({
        type: 'orders/upsertRows',
        payload: data,
      })
    }
    if (onConfirm) onConfirm()
    setValues({
      ...orders.defaultService,
      type: orders.type,
      filterService: undefined,
    })
  },
  displayName: 'OrderPage',
})
class Service extends PureComponent {
  constructor(props) {
    super(props)
    const { dispatch } = props
    this.scroll = React.createRef()
    this.state = {
      services: [],
      serviceCenters: [],
      serviceCenterServices: [],
      serviceCatetorys: [
        {
          value: 'All',
          name: 'All',
          serviceTags: [],
        },
      ],
      isPreOrderItemExists: false,
      currentPage: 1,
    }

    this.setResource()
  }

  componentDidMount() {
    if (this.scroll) {
      this.scroll.addEventListener('scroll', e => {
        const { clientHeight, scrollHeight, scrollTop } = e.target
        const isBottom = scrollTop + clientHeight + 20 > scrollHeight
        if (
          isBottom &&
          this.state.currentPage * 50 < this.getFilterServices().length
        ) {
          this.setState(pre => {
            return { currentPage: pre.currentPage + 1 }
          })
        }
      })

      this.resetPage()
    }
  }

  setResource = async () => {
    const response = await queryList('/api/ctservice', {
      'serviceFKNavigation.IsActive': true,
      'serviceCenterFKNavigation.IsActive': true,
      combineCondition: 'and',
      apiCriteria: { ServiceCenterType: 'Normal' },
      sorting: [
        { columnName: 'serviceFKNavigation.displayValue', direction: 'asc' },
      ],
      pagesize: 99999,
    })
    if (response.status === '200') {
      const {
        services = [],
        serviceCenters = [],
        serviceCenterServices = [],
        serviceCatetorys = [],
        serviceTags = [],
      } = getServices(response.data.data || [])

      const newServices = services.reduce((p, c) => {
        const { value: serviceFK, name } = c

        const serviceCenterService =
          serviceCenterServices.find(
            o => o.serviceId === serviceFK && o.isDefault,
          ) || {}

        const { unitPrice = 0 } = serviceCenterService || {}

        const opt = {
          ...c,
          unitPrice,
        }
        return [...p, opt]
      }, [])

      this.setState({
        services: newServices,
        serviceCenters,
        serviceCenterServices,
        serviceCatetorys: [
          {
            value: 'All',
            name: 'All',
            serviceTags: [...serviceTags],
          },
          ...serviceCatetorys,
        ],
      })
    }
  }

  getServiceCenterService = editService => {
    const { serviceFK, serviceCenterFK } = editService
    const obj = serviceCenterService => {
      editService.isActive = serviceCenterService.isActive
      editService.serviceCenterServiceFK =
        serviceCenterService.serviceCenter_ServiceId
      editService.unitPrice = serviceCenterService.unitPrice
      editService.total = serviceCenterService.unitPrice
      editService.quantity = 1
    }

    if (serviceFK && !serviceCenterFK) {
      const serviceCenterService =
        this.state.serviceCenterServices.find(
          o => o.serviceId === serviceFK && o.isDefault,
        ) ||
        this.state.serviceCenterServices.find(o => o.serviceId === serviceFK)
      if (serviceCenterService) {
        obj(serviceCenterService)
        editService.serviceCenterFK = serviceCenterService.serviceCenterId
        editService.isMinus = true
        editService.isExactAmount = true
        editService.adjValue = 0
        this.updateTotalPrice(serviceCenterService.unitPrice, editService)
      }
      return
    }
    if (!serviceCenterFK) return

    const serviceCenterService = this.state.serviceCenterServices.find(
      o => o.serviceId === serviceFK && o.serviceCenterId === serviceCenterFK,
    )
    if (serviceCenterService) {
      obj(serviceCenterService)
      editService.isMinus = true
      editService.isExactAmount = true
      editService.adjValue = 0
      this.updateTotalPrice(serviceCenterService.unitPrice, editService)
    }
  }

  updateTotalPrice = (v, editService) => {
    if (v || v === 0) {
      const { isExactAmount, isMinus, adjValue } = editService

      let value = adjValue
      if (!isMinus) {
        value = Math.abs(adjValue)
      } else {
        value = -Math.abs(adjValue)
      }

      const finalAmount = calculateAdjustAmount(
        isExactAmount,
        v,
        value || adjValue,
      )
      editService.totalAfterItemAdjustment = finalAmount.amount
      editService.adjAmount = finalAmount.adjAmount
      editService.adjType = isExactAmount ? 'ExactAmount' : 'Percentage'
    } else {
      editService.totalAfterItemAdjustment = undefined
      editService.adjAmount = undefined
    }
  }

  handleReset = () => {
    const { setValues, orders } = this.props
    setValues({
      ...orders.defaultService,
      type: orders.type,
      isEdit: false,
    })
    this.resetPage()
  }

  onAdjustmentConditionChange = editService => {
    const { isMinus, adjValue, isExactAmount } = editService
    if (!isNumber(adjValue)) {
      this.props.setFieldValue('adjValue', 0)
    }

    let value = adjValue || 0
    if (!isExactAmount && adjValue > 100) {
      value = 100
      editService.adjValue = 100
    }

    if (!isMinus) {
      value = Math.abs(value)
    } else {
      value = -Math.abs(value)
    }

    this.getFinalAmount({ value }, editService)
  }

  getFinalAmount = ({ value } = {}, editService) => {
    const { isExactAmount, adjValue, total = 0 } = editService
    const finalAmount = calculateAdjustAmount(
      isExactAmount,
      total,
      value || adjValue,
    )

    editService.totalAfterItemAdjustment = finalAmount.amount
    editService.adjAmount = finalAmount.adjAmount
    editService.adjType = isExactAmount ? 'ExactAmount' : 'Percentage'
  }

  validateAndSubmitIfOk = async () => {
    const { handleSubmit, values } = this.props
    const { serviceItems = [] } = values
    if (!serviceItems.length) return
    if (
      serviceItems.filter(
        r =>
          r.serviceCenterFK &&
          r.quantity !== '' &&
          r.quantity >= 0 &&
          r.total !== '' &&
          r.total >= 0 &&
          r.totalAfterItemAdjustment >= 0,
      ).length !== serviceItems.length
    )
      return
    handleSubmit()
    this.resetPage()
  }

  isValidate = serviceFK => {
    const { values } = this.props
    const { serviceItems = [] } = values
    let checkedService = serviceItems.find(r => r.serviceFK === serviceFK)
    if (!checkedService) {
      return true
    }
    if (
      checkedService.serviceCenterFK &&
      checkedService.quantity !== '' &&
      checkedService.quantity >= 0 &&
      checkedService.total !== '' &&
      checkedService.total >= 0 &&
      checkedService.totalAfterItemAdjustment >= 0
    ) {
      return true
    }
    return false
  }

  setSelectService = selectService => {
    const { setFieldValue } = this.props
    setFieldValue('editServiceId', selectService.serviceFK)
    setFieldValue('serviceCenterFK', selectService.serviceCenterFK)
    setFieldValue('quantity', selectService.quantity)
    setFieldValue('isMinus', selectService.isMinus)
    setFieldValue('adjValue', selectService.adjValue)
    setFieldValue('isExactAmount', selectService.isExactAmount)
    setFieldValue('total', selectService.total)
    setFieldValue(
      'totalAfterItemAdjustment',
      selectService.totalAfterItemAdjustment,
    )

    if (selectService.isPreOrder === true)
      this.checkIsPreOrderItemExistsInListing(selectService.serviceFK, true)
    else this.setState({ isPreOrderItemExists: false })
  }

  checkIsPreOrderItemExistsInListing = (editServiceId, val) => {
    const {
      setFieldValue,
      values,
      codetable,
      visitRegistration,
      patient,
      orders = {},
    } = this.props

    if (val) {
      const servicePreOrderItem = patient?.entity?.pendingPreOrderItem.filter(
        x => x.preOrderItemType === 'Service',
      )
      if (servicePreOrderItem) {
        servicePreOrderItem.filter(item => {
          const { preOrderServiceItem = {} } = item
          const CheckIfPreOrderItemExists =
            preOrderServiceItem.serviceFK === editServiceId
          if (CheckIfPreOrderItemExists) {
            this.setState({ isPreOrderItemExists: true })
            return
          }
        })
      }
    } else {
      this.setState({ isPreOrderItemExists: false })
    }
  }

  isEditingService = value => {
    const {
      values: { editServiceId },
    } = this.props
    return editServiceId === value
  }

  getFilterServices = () => {
    const { values = {} } = this.props
    const { services = [] } = this.state

    const {
      isEdit,
      editServiceId,
      filterService = '',
      selectCategory,
      selectTag,
    } = values

    let filterServices = []
    if (isEdit) {
      filterServices = services.filter(s => s.value === editServiceId)
    } else {
      filterServices = services.filter(
        s =>
          (selectTag === 'All' ||
            s.serviceTags.find(st => st.value === selectTag)) &&
          (selectCategory === 'All' ||
            s.serviceCategoryFK === selectCategory) &&
          (s.code.toUpperCase().indexOf(filterService.toUpperCase()) >= 0 ||
            s.name.toUpperCase().indexOf(filterService.toUpperCase()) >= 0),
      )
    }
    filterServices = _.orderBy(
      filterServices,
      ['isAutoDisplayInOrderCart', item => (item.name || '').toUpperCase()],
      ['desc', 'asc'],
    )

    return filterServices
  }

  resetSelectItem = () => {
    const { setFieldValue } = this.props
    const { isPreOrderItemExists } = this.state
    setFieldValue('editServiceId', undefined)
    setFieldValue('serviceCenterFK', undefined)
    setFieldValue('quantity', undefined)
    setFieldValue('isMinus', true)
    setFieldValue('adjValue', undefined)
    setFieldValue('isExactAmount', true)
    setFieldValue('total', undefined)
    setFieldValue('totalAfterItemAdjustment', undefined)
    if (isPreOrderItemExists)
      this.setState({
        isPreOrderItemExists: false,
      })
  }

  resetPage = () => {
    this.scroll.scrollTo(0, 0)
    this.setState({ currentPage: 1 })
  }

  render() {
    const {
      theme,
      classes,
      values = {},
      footer,
      from,
      setFieldValue,
      orders,
    } = this.props
    const {
      services = [],
      serviceCenters = [],
      serviceCatetorys = [],
      isPreOrderItemExists,
      currentPage = 1,
    } = this.state
    const {
      serviceItems = [],
      isEdit,
      editServiceId,
      filterService = '',
      selectCategory,
      selectTag,
      type,
    } = values
    const totalPriceReadonly =
      Authorized.check('queue.consultation.modifyorderitemtotalprice')
        .rights !== 'enable'

    const selectService = serviceItems.map(r => r.serviceName).join(', ')
    const editService =
      serviceItems.find(r => r.serviceFK === editServiceId) || {}
    const isDisabledHasPaidPreOrder =
      editService?.actualizedPreOrderItemFK && editService?.hasPaid == true
        ? true
        : false

    const isDisabledNoPaidPreOrder = editService?.actualizedPreOrderItemFK
      ? true
      : false

    if (orders.isPreOrderItemExists === false && !values.isPreOrder)
      this.setState({ isPreOrderItemExists: false })

    const { workitem = {}, isPreOrder } = editService
    const { nurseWorkitem = {} } = workitem
    const isStartedService =
      !isPreOrder && nurseWorkitem.statusFK === NURSE_WORKITEM_STATUS.ACTUALIZED

    const debouncedFilterChangeAction = _.debounce(
      e => {
        setFieldValue('filterService', e.target.value)
        this.resetPage()
      },
      100,
      {
        leading: true,
        trailing: false,
      },
    )
    const filterServices = this.getFilterServices()
    let showItemCount = currentPage * 50
    if (showItemCount > filterServices.length) {
      showItemCount = filterServices.length
    }
    return (
      <Authorized
        authority={GetOrderItemAccessRight(
          from,
          'queue.consultation.order.service',
        )}
      >
        <div>
          <GridContainer>
            <GridItem xs={12}>
              <div
                style={{ marginTop: 10, position: 'relative', paddingLeft: 70 }}
              >
                <div
                  className={classes.subTitle}
                  style={{ position: 'absolute', left: 0, top: 2 }}
                >
                  Category:
                </div>
                <div className={classes.tagsGroupPanel}>
                  {serviceCatetorys.map(category =>
                    isEdit ? (
                      <Tag
                        className={classes.tag}
                        style={{
                          border:
                            selectCategory === category.value
                              ? '1px solid rgba(0, 0, 0, 0)'
                              : '1px solid rgba(0, 0, 0, 0.42)',
                        }}
                        color={
                          selectCategory === category.value
                            ? '#4255bd'
                            : undefined
                        }
                      >
                        <Tooltip title={category.name}>
                          <span>{category.name}</span>
                        </Tooltip>
                      </Tag>
                    ) : (
                      <CheckableTag
                        key={category.value}
                        checked={selectCategory === category.value}
                        className={classes.tag}
                        style={{
                          border:
                            selectCategory === category.value
                              ? '1px solid rgba(0, 0, 0, 0)'
                              : '1px solid rgba(0, 0, 0, 0.42)',
                        }}
                        onChange={checked => {
                          if (!isEdit && checked) {
                            setFieldValue('selectCategory', category.value)
                            setFieldValue('selectTag', 'All')
                            this.resetPage()
                          }
                        }}
                      >
                        <Tooltip title={category.name}>
                          <span>{category.name}</span>
                        </Tooltip>
                      </CheckableTag>
                    ),
                  )}
                </div>
              </div>
            </GridItem>
            <GridItem xs={12}>
              <div style={{ position: 'relative', paddingLeft: 70 }}>
                <div
                  className={classes.subTitle}
                  style={{ position: 'absolute', left: 0, top: 2 }}
                >
                  Tag:
                </div>
                <div className={classes.tagsGroupPanel}>
                  {[
                    { value: 'All', name: 'All' },
                    ...(serviceCatetorys.find(c => c.value === selectCategory)
                      ?.serviceTags || []),
                  ].map(tag =>
                    isEdit ? (
                      <Tag
                        className={classes.tag}
                        style={{
                          border:
                            selectTag === tag.value
                              ? '1px solid rgba(0, 0, 0, 0)'
                              : '1px solid rgba(0, 0, 0, 0.42)',
                        }}
                        color={selectTag === tag.value ? '#4255bd' : undefined}
                      >
                        <Tooltip title={tag.name}>
                          <span>{tag.name}</span>
                        </Tooltip>
                      </Tag>
                    ) : (
                      <CheckableTag
                        key={tag.value}
                        checked={selectTag === tag.value}
                        className={classes.tag}
                        style={{
                          border:
                            selectTag === tag.value
                              ? '1px solid rgba(0, 0, 0, 0)'
                              : '1px solid rgba(0, 0, 0, 0.42)',
                        }}
                        onChange={checked => {
                          if (!isEdit && checked) {
                            setFieldValue('selectTag', tag.value)
                            this.resetPage()
                          }
                        }}
                      >
                        <Tooltip title={tag.name}>
                          <span>{tag.name}</span>
                        </Tooltip>
                      </CheckableTag>
                    ),
                  )}
                </div>
              </div>
            </GridItem>
            <GridItem xs={12} container>
              <Field
                name='filterService'
                render={args => {
                  return (
                    <TextField
                      style={{ width: 300, display: 'inline-block' }}
                      label='Filter by service code, name'
                      onChange={debouncedFilterChangeAction}
                      disabled={isEdit}
                      {...args}
                    />
                  )
                }}
              />
              {!isEdit && (
                <div
                  style={{
                    position: 'relative',
                    top: 22,
                    display: 'inline-block',
                    marginLeft: 6,
                  }}
                >{`${showItemCount} item(s) displayed, ${filterServices.length} item(s) in total.`}</div>
              )}
            </GridItem>
            <GridItem xs={12}>
              <FieldSet
                classes={this.props.classes}
                size='sm'
                title='Service'
                style={{ fontSize: '0.85rem' }}
              >
                <div
                  className={classes.groupPanel}
                  ref={e => (this.scroll = e)}
                >
                  {filterServices.length
                    ? _.take(filterServices, showItemCount).map(r => {
                        const isCheckedBefore = !_.isEmpty(
                          serviceItems.find(ri => ri.serviceFK === r.value),
                        )
                        return (
                          <Tooltip
                            title={
                              <div>
                                <div>
                                  Service Code: <span>{r.code}</span>
                                </div>
                                <div>
                                  Service Name: <span>{r.name}</span>
                                </div>
                                <div>
                                  Unit Price:{' '}
                                  <span>{`${currencySymbol}${r.unitPrice.toFixed(
                                    2,
                                  )}`}</span>
                                </div>
                              </div>
                            }
                          >
                            <div
                              style={{
                                backgroundColor:
                                  editServiceId === r.value
                                    ? 'lightgreen'
                                    : 'white',
                                borderColor: this.isValidate(r.value)
                                  ? '#99CC99'
                                  : 'red',
                              }}
                              className={classes.checkServiceItem}
                              onClick={() => {
                                const selectService = serviceItems.find(
                                  item => item.serviceFK === r.value,
                                )
                                if (selectService) {
                                  this.setSelectService(selectService)
                                }
                              }}
                            >
                              <span className={classes.checkServiceLabel}>
                                {r.name}
                              </span>
                              <div className={classes.checkServiceCheckBox}>
                                <Checkbox
                                  disabled={isEdit}
                                  label=''
                                  inputLabel=''
                                  checked={isCheckedBefore}
                                  onClick={e => {
                                    e.stopPropagation()
                                    if (!isCheckedBefore) {
                                      let newService = {
                                        serviceFK: r.value,
                                        serviceName: r.name,
                                        serviceCode: r.code,
                                        priority: 'Normal',
                                        type,
                                        packageGlobalId: '',
                                        performingUserFK: getVisitDoctorUserId(
                                          this.props,
                                        ),
                                        isDisplayValueChangable:
                                          r.isDisplayValueChangable,
                                        isNurseActualizeRequired:
                                          r.isNurseActualizable,
                                      }
                                      if (isPreOrderItemExists)
                                        this.setState({
                                          isPreOrderItemExists: false,
                                        })

                                      this.getServiceCenterService(newService)
                                      setFieldValue('serviceItems', [
                                        ...serviceItems,
                                        newService,
                                      ])
                                      setFieldValue(
                                        'editServiceId',
                                        newService.serviceFK,
                                      )
                                      setFieldValue(
                                        'serviceCenterFK',
                                        newService.serviceCenterFK,
                                      )
                                      setFieldValue(
                                        'quantity',
                                        newService.quantity,
                                      )
                                      setFieldValue('total', newService.total)
                                      setFieldValue(
                                        'totalAfterItemAdjustment',
                                        newService.totalAfterItemAdjustment,
                                      )
                                      setFieldValue(
                                        'isMinus',
                                        newService.isMinus,
                                      )
                                      setFieldValue(
                                        'adjValue',
                                        newService.adjValue,
                                      )
                                      setFieldValue(
                                        'isExactAmount',
                                        newService.isExactAmount,
                                      )
                                    } else {
                                      setFieldValue('serviceItems', [
                                        ...serviceItems.filter(
                                          item => item.serviceFK !== r.value,
                                        ),
                                      ])
                                      this.resetSelectItem()
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </Tooltip>
                        )
                      })
                    : 'No records'}
                </div>
              </FieldSet>
            </GridItem>
            <GridItem xs={12}>
              <div
                style={{
                  marginTop: 10,
                  position: 'relative',
                  paddingLeft: 65,
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                  }}
                >
                  Selected:
                </div>
                <div>
                  {serviceItems.length ? (
                    serviceItems.map(ri => {
                      return (
                        <div className={classes.selectedServiceLabel}>
                          <div
                            style={{
                              maxWidth: 430,
                              display: 'inline-block',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                            }}
                          >
                            <Link
                              onClick={e => {
                                e.preventDefault()
                                this.setSelectService(ri)
                              }}
                            >
                              <Tooltip title={ri.serviceName}>
                                <span
                                  style={{
                                    textDecoration: 'underline',
                                    color: this.isValidate(ri.serviceFK)
                                      ? '#4255bd'
                                      : 'red',
                                    fontWeight:
                                      ri.serviceFK === editServiceId
                                        ? 'bold'
                                        : 400,
                                  }}
                                >
                                  {ri.serviceName}
                                </span>
                              </Tooltip>
                            </Link>
                          </div>

                          {!isEdit && (
                            <Tooltip title='Remove item'>
                              <div
                                style={{
                                  display: 'inline-block',
                                  position: 'relative',
                                  marginLeft: 4,
                                  top: '-6px',
                                }}
                              >
                                <CloseCircleOutlined
                                  style={{ color: 'red', cursor: 'pointer' }}
                                  onClick={() => {
                                    setFieldValue('serviceItems', [
                                      ...serviceItems.filter(
                                        item => item.serviceFK !== ri.serviceFK,
                                      ),
                                    ])
                                    if (editServiceId === ri.serviceFK) {
                                      this.resetSelectItem()
                                    }
                                  }}
                                />
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ height: 29 }}> No records</div>
                  )}
                </div>
              </div>
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={4}>
              <TextField
                disabled
                label='Service Name'
                value={editService.serviceName}
              />
            </GridItem>
            <GridItem xs={4}>
              <Field
                name='serviceCenterFK'
                render={args => {
                  return (
                    <Select
                      disabled={
                        !editServiceId ||
                        isStartedService ||
                        isDisabledNoPaidPreOrder
                      }
                      allowClear={false}
                      label='Service Center Name'
                      options={serviceCenters.filter(o =>
                        o.services.find(m => m.value === editServiceId),
                      )}
                      onChange={value => {
                        editService.serviceCenterFK = value
                        if (value) {
                          this.getServiceCenterService(editService)
                          setFieldValue('quantity', editService.quantity)
                          setFieldValue('total', editService.total)
                          setFieldValue(
                            'totalAfterItemAdjustment',
                            editService.totalAfterItemAdjustment,
                          )
                        }
                        setFieldValue('serviceItems', [...serviceItems])
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={3}>
              <Field
                name='quantity'
                render={args => {
                  return (
                    <NumberInput
                      disabled={
                        !editServiceId ||
                        isStartedService ||
                        isDisabledHasPaidPreOrder
                      }
                      label='Quantity'
                      style={{
                        marginLeft: theme.spacing(7),
                        paddingRight: theme.spacing(6),
                      }}
                      step={1}
                      min={0}
                      onChange={e => {
                        editService.quantity = e.target.value
                        if (editService.unitPrice) {
                          const total = e.target.value * editService.unitPrice
                          editService.total = total
                          this.updateTotalPrice(total, editService)
                          setFieldValue('total', editService.total)
                          setFieldValue(
                            'totalAfterItemAdjustment',
                            editService.totalAfterItemAdjustment,
                          )
                        }
                        setFieldValue('serviceItems', [...serviceItems])
                      }}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem
              xs={8}
              className={classes.editor}
              style={{ paddingRight: 35 }}
            >
              <div style={{ position: 'relative' }}>
                <TextField
                  value={editService.instruction}
                  disabled={!editServiceId || isStartedService}
                  label='Instructions'
                  onChange={e => {
                    editService.instruction = e.target.value
                    setFieldValue('serviceItems', [...serviceItems])
                  }}
                />
                <CannedTextButton
                  disabled={!editServiceId || isStartedService}
                  cannedTextTypeFK={CANNED_TEXT_TYPE.SERVICEINSTRUCTION}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: -35,
                  }}
                  handleSelectCannedText={cannedText => {
                    editService.instruction = `${
                      editService.instruction
                        ? editService.instruction + '\n'
                        : ''
                    }${cannedText.text || ''}`.substring(0, 2000)
                    setFieldValue('serviceItems', [...serviceItems])
                  }}
                />
              </div>
            </GridItem>
            <GridItem xs={3} className={classes.editor}>
              <Field
                name='total'
                render={args => {
                  return (
                    <NumberInput
                      label='Total'
                      style={{
                        marginLeft: theme.spacing(7),
                        paddingRight: theme.spacing(6),
                      }}
                      min={0}
                      currency
                      onChange={e => {
                        editService.total = e.target.value
                        this.updateTotalPrice(e.target.value, editService)
                        setFieldValue('serviceItems', [...serviceItems])
                        setFieldValue(
                          'totalAfterItemAdjustment',
                          editService.totalAfterItemAdjustment,
                        )
                      }}
                      disabled={
                        totalPriceReadonly ||
                        !editServiceId ||
                        isDisabledHasPaidPreOrder
                      }
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem xs={8} className={classes.editor}>
              <TextField
                value={editService.remark}
                disabled={!editServiceId || isStartedService}
                label='Remarks'
                onChange={e => {
                  editService.remark = e.target.value
                  setFieldValue('serviceItems', [...serviceItems])
                }}
              />
            </GridItem>
            <GridItem xs={3} className={classes.editor}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{ marginTop: theme.spacing(2), position: 'absolute' }}
                >
                  <Field
                    name='isMinus'
                    render={args => {
                      return (
                        <Switch
                          checkedChildren='-'
                          unCheckedChildren='+'
                          label=''
                          onChange={value => {
                            console.log(value)
                            editService.isMinus = value
                            this.onAdjustmentConditionChange(editService)
                            setFieldValue('serviceItems', [...serviceItems])
                            setFieldValue(
                              'totalAfterItemAdjustment',
                              editService.totalAfterItemAdjustment,
                            )
                          }}
                          disabled={
                            totalPriceReadonly ||
                            !editServiceId ||
                            isDisabledHasPaidPreOrder
                          }
                          {...args}
                        />
                      )
                    }}
                  />
                </div>

                <Field
                  name='adjValue'
                  render={args => {
                    args.min = 0
                    args.precision = 2
                    if (values.isExactAmount)
                      return (
                        <NumberInput
                          style={{
                            marginLeft: theme.spacing(7),
                            paddingRight: theme.spacing(6),
                          }}
                          min={0}
                          currency
                          noSuffix
                          label='Adjustment'
                          onChange={e => {
                            console.log(e.target.value)
                            editService.adjValue = e.target.value
                            this.onAdjustmentConditionChange(editService)
                            setFieldValue('serviceItems', [...serviceItems])
                            setFieldValue(
                              'totalAfterItemAdjustment',
                              editService.totalAfterItemAdjustment,
                            )
                          }}
                          disabled={
                            totalPriceReadonly ||
                            !editServiceId ||
                            isDisabledHasPaidPreOrder
                          }
                          {...args}
                        />
                      )
                    return (
                      <NumberInput
                        style={{
                          marginLeft: theme.spacing(7),
                          paddingRight: theme.spacing(6),
                        }}
                        percentage
                        max={100}
                        noSuffix
                        min={0}
                        label='Adjustment'
                        onChange={e => {
                          editService.adjValue = e.target.value
                          this.onAdjustmentConditionChange(editService)
                          setFieldValue('serviceItems', [...serviceItems])
                          setFieldValue(
                            'totalAfterItemAdjustment',
                            editService.totalAfterItemAdjustment,
                          )
                        }}
                        disabled={
                          totalPriceReadonly ||
                          !editServiceId ||
                          isDisabledHasPaidPreOrder
                        }
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
            <GridItem xs={1} className={classes.editor}>
              <div style={{ marginTop: theme.spacing(2) }}>
                <Field
                  name='isExactAmount'
                  render={args => {
                    return (
                      <Switch
                        checkedChildren='$'
                        unCheckedChildren='%'
                        label=''
                        onChange={value => {
                          editService.isExactAmount = value
                          this.onAdjustmentConditionChange(editService)
                          setFieldValue('serviceItems', [...serviceItems])
                          setFieldValue(
                            'totalAfterItemAdjustment',
                            editService.totalAfterItemAdjustment,
                          )
                        }}
                        disabled={
                          totalPriceReadonly ||
                          !editServiceId ||
                          isDisabledHasPaidPreOrder
                        }
                        {...args}
                      />
                    )
                  }}
                />
              </div>
            </GridItem>
          </GridContainer>
          <GridContainer>
            {editServiceId && editService.isDisplayValueChangable ? (
              <GridItem xs={8} className={classes.editor}>
                <TextField
                  value={editService.newServiceName}
                  disabled={!editServiceId || isStartedService}
                  label='New Service Display Name'
                  maxLength={40}
                  onChange={e => {
                    editService.newServiceName = e.target.value
                    setFieldValue('serviceItems', [...serviceItems])
                  }}
                />
              </GridItem>
            ) : (
              <GridItem xs={8} className={classes.editor}>
                <div>
                  <div
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        position: 'absolute',
                        bottom: '4px',
                        fontWeight: 500,
                      }}
                    >
                      Priority:{' '}
                    </span>
                    <div style={{ marginLeft: 60, marginTop: 14 }}>
                      <RadioGroup
                        disabled={!editServiceId || isStartedService}
                        value={editService.priority || 'Normal'}
                        label=''
                        onChange={e => {
                          editService.priority = e.target.value
                          setFieldValue('serviceItems', [...serviceItems])
                        }}
                        options={[
                          {
                            value: 'Normal',
                            label: 'Normal',
                          },
                          {
                            value: 'Urgent',
                            label: 'Urgent',
                          },
                        ]}
                      />
                    </div>
                  </div>
                  {values.visitPurposeFK !== VISIT_TYPE.OTC && (
                    <div style={{ display: 'inline-block', marginLeft: 20 }}>
                      <Checkbox
                        checked={editService.isPreOrder || false}
                        disabled={
                          !editServiceId ||
                          isStartedService ||
                          isDisabledNoPaidPreOrder
                        }
                        label='Pre-Order'
                        onClick={e => {
                          const newIsPreOrder = !editService.isPreOrder
                          editService.isPreOrder = newIsPreOrder
                          if (!newIsPreOrder) {
                            editService.isChargeToday = false
                          }
                          this.checkIsPreOrderItemExistsInListing(
                            editServiceId,
                            newIsPreOrder,
                          )
                          setFieldValue('serviceItems', [...serviceItems])
                        }}
                      >
                        Pre-Order
                      </Checkbox>
                      {editService.isPreOrder && (
                        <Checkbox
                          checked={editService.isChargeToday || false}
                          disabled={!editServiceId || isStartedService}
                          label='Charge Today'
                          onClick={e => {
                            editService.isChargeToday = !editService.isChargeToday
                            setFieldValue('serviceItems', [...serviceItems])
                          }}
                        >
                          Charge Today
                        </Checkbox>
                      )}
                      {isPreOrderItemExists && (
                        <Alert
                          message={
                            "Item exists in Pre-Order. Plesae check patient's Pre-Order."
                          }
                          type='warning'
                          style={{
                            position: 'absolute',
                            top: 45,
                            left: 200,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                            overflow: 'hidden',
                            lineHeight: '25px',
                            fontSize: '0.85rem',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </GridItem>
            )}
            <GridItem xs={3} className={classes.editor}>
              <Field
                name='totalAfterItemAdjustment'
                render={args => {
                  return (
                    <NumberInput
                      label='Total After Adj.'
                      style={{
                        marginLeft: theme.spacing(7),
                        paddingRight: theme.spacing(6),
                      }}
                      currency
                      disabled
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            {editServiceId && editService.isDisplayValueChangable && (
              <GridItem xs={8} className={classes.editor}>
                <div>
                  <div
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        position: 'absolute',
                        bottom: '4px',
                        fontWeight: 500,
                      }}
                    >
                      Priority:{' '}
                    </span>
                    <div style={{ marginLeft: 60, marginTop: 14 }}>
                      <RadioGroup
                        disabled={!editServiceId || isStartedService}
                        value={editService.priority || 'Normal'}
                        label=''
                        onChange={e => {
                          editService.priority = e.target.value
                          setFieldValue('serviceItems', [...serviceItems])
                        }}
                        options={[
                          {
                            value: 'Normal',
                            label: 'Normal',
                          },
                          {
                            value: 'Urgent',
                            label: 'Urgent',
                          },
                        ]}
                      />
                    </div>
                  </div>
                  {values.visitPurposeFK !== VISIT_TYPE.OTC && (
                    <div style={{ display: 'inline-block', marginLeft: 20 }}>
                      <Checkbox
                        checked={editService.isPreOrder || false}
                        disabled={
                          !editServiceId ||
                          isStartedService ||
                          isDisabledNoPaidPreOrder
                        }
                        label='Pre-Order'
                        onClick={e => {
                          const newIsPreOrder = !editService.isPreOrder
                          editService.isPreOrder = newIsPreOrder
                          if (!newIsPreOrder) {
                            editService.isChargeToday = false
                          }
                          this.checkIsPreOrderItemExistsInListing(
                            editServiceId,
                            newIsPreOrder,
                          )
                          setFieldValue('serviceItems', [...serviceItems])
                        }}
                      >
                        Pre-Order
                      </Checkbox>
                      {editService.isPreOrder && (
                        <Checkbox
                          checked={editService.isChargeToday || false}
                          disabled={!editServiceId || isStartedService}
                          label='Charge Today'
                          onClick={e => {
                            editService.isChargeToday = !editService.isChargeToday
                            setFieldValue('serviceItems', [...serviceItems])
                          }}
                        >
                          Charge Today
                        </Checkbox>
                      )}
                      {isPreOrderItemExists && (
                        <Alert
                          message={
                            "Item exists in Pre-Order. Plesae check patient's Pre-Order."
                          }
                          type='warning'
                          style={{
                            position: 'absolute',
                            top: 45,
                            left: 200,
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                            overflow: 'hidden',
                            lineHeight: '25px',
                            fontSize: '0.85rem',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </GridItem>
            )}
          </GridContainer>
          {footer({
            onSave: this.validateAndSubmitIfOk,
            onReset: this.handleReset,
          })}
        </div>
      </Authorized>
    )
  }
}
export default withStyles(styles, { withTheme: true })(Service)
