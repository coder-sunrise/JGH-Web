import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { connect } from 'dva'
import $ from 'jquery'

import { Divider, withStyles } from '@material-ui/core'
import _ from 'lodash'
import { ORDER_TYPES } from '@/utils/constants'
import {
  Button,
  ProgressButton,
  GridContainer,
  GridItem,
  notification,
  Tabs,
} from '@/components'
// utils
import { orderTypes } from '@/pages/Consultation/utils'
import Authorized from '@/utils/Authorized'
import { computeTotalForAllSavedClaim } from '@/pages/Billing/refactored/applyClaimUtils'

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
})

@connect(({ orders, clinicSettings }) => ({
  orders,
  clinicSettings,
}))
class Details extends PureComponent {
  state = {
    disableEdit: false,
    prevKey: null,
  }

  autoFocuseItem = type => {
    setTimeout(() => {
      if (type === '5') {
        $(`#autofocus_${type} input`).focus()
      } else $(`#autofocus_${type} .ant-select`).click()

      this.setState({
        prevKey: type,
      })
    }, 500)
  }

  footerBtns = ({ onSave, onReset }) => {
    const { classes, orders } = this.props
    const { entity, type } = orders
    return (
      <React.Fragment>
        <Divider />

        <div className={classnames(classes.footer)}>
          <Button
            color='danger'
            onClick={() => {
              if (entity) {
                this.props.dispatch({
                  type: 'orders/updateState',
                  payload: {
                    entity: undefined,
                  },
                })
              }
              if (onReset) {
                onReset()
              }
            }}
          >
            Discard
          </Button>
          <ProgressButton
            color='primary'
            onClick={async () => {
              const isSaveOk = await onSave(success => {})
            }}
            icon={null}
          >
            {!entity ? 'Add' : 'Save'}
          </ProgressButton>
        </div>
      </React.Fragment>
    )
  }

  _show = () => {
    if (
      !this.props.orders.entity ||
      (this.props.orders.entity.total < 0 &&
        this.props.orders.entity.totalPrice < 0)
    ) {
      notification.warn({
        message: 'Invalid total price',
      })
      return
    }
    this.props.dispatch({
      type: 'global/updateState',
      payload: {
        openAdjustment: true,
        openAdjustmentConfig: {
          callbackConfig: {
            model: 'orders',
            reducer: 'adjustAmount',
          },
          defaultValues: {
            ...this.props.orders.entity,
            initialAmout: this.props.orders.entity.totalPrice, // for item level need inital amount
          },
        },
      },
    })
  }

  showAdjustment = () => {
    this.props.dispatch({
      type: 'orders/updateState',
      payload: {
        shouldPushToState: true,
      },
    })
    setTimeout(() => {
      this._show()
    }, 1)
  }

  setDisable = value => {
    this.setState({
      disableEdit: value,
    })
  }

  getNextSequence = () => {
    const {
      orders: { rows },
    } = this.props

    const allDocs = rows.filter(s => !s.isDeleted)
    let nextSequence = 1
    if (allDocs && allDocs.length > 0) {
      const { sequence } = _.maxBy(allDocs, 'sequence')
      nextSequence = sequence + 1
    }
    return nextSequence
  }

  render() {
    const { props } = this
    const {
      classes,
      orders,
      dispatch,
      fromDispense,
      singleMode,
      from,
      clinicSettings,
    } = props
    const { type } = orders
    const cfg = {
      disableEdit: this.state.disableEdit,
      setDisable: this.setDisable,
      footer: this.footerBtns,
      currentType: orderTypes.find(o => o.value === type),
      orderTypes,
      getNextSequence: this.getNextSequence,
      ...props,
    }

    let orderTypeArray = orderTypes
    if (fromDispense) {
      orderTypeArray = orderTypes.filter(
        o =>
          o.value !== ORDER_TYPES.VACCINATION &&
          o.value !== ORDER_TYPES.ORDER_SET &&
          o.value !== ORDER_TYPES.PACKAGE &&
          o.value !== ORDER_TYPES.RADIOLOGY &&
          o.value !== ORDER_TYPES.LAB,
      )
    } else {
      const { settings = [] } = clinicSettings

      orderTypeArray = orderTypes.filter(o => {
        if (!settings.isEnablePackage && o.value === ORDER_TYPES.PACKAGE)
          return false

        if (
          !settings.isEnableRadiologyModule &&
          o.value === ORDER_TYPES.RADIOLOGY
        ) {
          return false
        }

        if (!settings.isEnableLabModule && o.value === ORDER_TYPES.LAB) {
          return false
        }

        return true
      })
    }

    if (singleMode)
      return orderTypeArray
        .find(o => o.value === '7')
        .component({
          ...cfg,
          type: '7',
        })
    const tabOptions = orderTypeArray
      .filter(o => o.value !== '7' || (o.value === '7' && from === 'EditOrder'))
      .filter(o => {
        const accessRight = Authorized.check(o.accessRight)

        if (!accessRight || (accessRight && accessRight.rights === 'hidden'))
          return false
        return true
      })

    return (
      <div>
        <div className={classes.detail}>
          <GridContainer>
            <GridItem xs={12}>
              <Tabs
                activeKey={type}
                options={tabOptions.map(o => {
                  return {
                    id: o.value,
                    name: o.name,
                    content: o.component({
                      ...cfg,
                      type: o.value,
                    }),
                  }
                })}
                tabStyle={{}}
                onChange={key => {
                  dispatch({
                    type: 'orders/updateState',
                    payload: {
                      entity: undefined,
                      type: key,
                    },
                  })
                  this.autoFocuseItem(key)
                }}
              />
            </GridItem>
          </GridContainer>
        </div>
      </div>
    )
  }
}
export default withStyles(styles, { withTheme: true })(Details)
