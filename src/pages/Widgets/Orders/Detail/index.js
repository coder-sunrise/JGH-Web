import React, { Component, PureComponent } from 'react'
import { connect } from 'dva'
import classnames from 'classnames'
import { Divider, CircularProgress, Paper, withStyles } from '@material-ui/core'
import Yup from '@/utils/yup'
import { orderTypes } from '@/utils/codes'
import {
  withFormikExtend,
  FastField,
  Button,
  CommonHeader,
  CommonModal,
  NavPills,
  PictureUpload,
  GridContainer,
  GridItem,
  TextField,
  notification,
  Select,
  CodeSelect,
  DatePicker,
  RadioGroup,
  ProgressButton,
  CardContainer,
  confirm,
  Checkbox,
  SizeContainer,
  RichEditor,
} from '@/components'
import { currencySymbol } from '@/utils/config'

import Medication from './Medication'
import Vaccination from './Vaccination'
import Service from './Service'
import Consumable from './Consumable'
import Adjustment from './Adjustment'
// import Others from './Others'

const styles = (theme) => ({
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

class Details extends PureComponent {
  state = {
  }

  footerBtns = ({onSave}) => {
    const { classes } = this.props
    return (
      <>
        <Divider />

        <div className={classnames(classes.footer)}>
          <Button link style={{ float: 'left' }} onClick={this.showAdjustment}>
            {currencySymbol} Adjustment
          </Button>
          <Button color='danger'>Cancel</Button>

          <Button color='primary' onClick={onSave}>Save</Button>
        </div>
      </>
    )
  }

  showAdjustment=()=>{
    this.props.dispatch({
      type: 'global/updateState',
      payload: {
        openAdjustment: true,
        openAdjustmentConfig: {
          callbackConfig:{
            model:'orders',
            reducer:'adjustAmount',
          },
          // showRemark: true,
          defaultValues: {
            ...this.props.orders.adjustment,
            initialAmout: this.props.orders.totalPrice,
          },
        },
      },
    })
  }

  render () {
    const { props, state } = this
    const { theme, classes, orders, values, rowHeight, footer,dispatch } = props
    const {editType}=orders
    // console.log(props)
    const cfg = {
      footer:this.footerBtns,
      currentType: orderTypes.find((o) => o.value === editType),
      editType,
      ...props,
    }
    return (
      <div>
        <div className={classes.detail}>
          <GridContainer>
            <GridItem xs={6}>
              <Select
                label='Type'
                options={orderTypes}
                allowClear={false}
                value={editType}
                onChange={(v) => {
                  dispatch({
                    type: 'orders/updateState',
                    payload: {
                      editType: v,
                    },
                  })
                }}
              />
            </GridItem>
          </GridContainer>
          <div>
            {editType === '1' && <Medication {...cfg} />}
            {editType === '2' && <Vaccination {...cfg} />}
            {editType === '3' && <Service {...cfg} />}
            {editType === '4' && <Consumable {...cfg} />}
            {editType === '5' && <Medication {...cfg} openPrescription />}
          </div>

        </div>
      </div>
    )
  }
}
export default withStyles(styles, { withTheme: true })(Details)
