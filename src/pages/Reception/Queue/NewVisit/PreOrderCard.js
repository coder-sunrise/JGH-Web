import ReactDataSheet, { PureComponent } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import basicStyle from '@/assets/jss/material-dashboard-pro-react/layouts/basicLayout'
import service from '@/services/patient'
import numeral from 'numeral'
import {
  TextField,
  GridContainer,
  GridItem,
  CodeSelect,
  CommonModal,
  notification,
  Button,
  Select,
  RadioGroup,
} from '@/components'
import Authorized from '@/utils/Authorized'
import { qtyFormat } from '@/utils/config'
import CommonTableGrid from '@/components/CommonTableGrid'
import { ContactSupportOutlined } from '@material-ui/icons'
import { Delete } from '@material-ui/icons'
const { queryList, query } = service
const styles = (theme) => ({
  ...basicStyle(theme),
})
@connect(({ clinicSettings, patient }) => ({
  clinicSettings,
  patient,
}))
class PreOrderCard extends PureComponent {

  deletePreOrderItem = (actualizedPreOrderItemFK) => {
    const { values, setFieldValue } = this.props
    const { visitPreOrderItem = [] } = values
    var item = visitPreOrderItem.find(item => item.actualizedPreOrderItemFK === actualizedPreOrderItemFK)
    if (item) {
      item.isDeleted = true
      setFieldValue("visitPreOrderItem", [...visitPreOrderItem])
    }
  }


  render () {
    const {values,visitPreOrderItem=[]} = this.props

  console.log('visitPreOrderItem',visitPreOrderItem)

    return (
      <div>
        <CommonTableGrid
        forceRender
        size='sm'
        rows={visitPreOrderItem.filter(x=>!x.isDeleted)}
        FuncProps={{pager:false}}
        getRowId={(row)=> row.visitPreOrderItemFK}
        columns={[
          { name: 'preOrderItemType', title: 'Category' },
          { name: 'itemName', title: 'Name' },
          { name: 'quantity', title: 'Quantity' },
          { name: 'orderByUser', title: 'Order By' },
          { name: 'orderDate', title: 'Order Date & Time' },
          { name: 'remarks', title: 'Remarks' },
          { name: 'amount', title: 'Amount' },
          { name: 'hasPaid', title: 'Paid' },
          { name: 'action', title: 'Action' },
        ]}
        columnExtensions={[
          {
            columnName:'preOrderItemType',
            sortingEnabled:false,
            width: 120
          },
          {
            columnName:'itemName',
            sortingEnabled:false,
          },
          {
            columnName: 'quantity', sortingEnabled: false, width: 120, render: row => {
              const { quantity, dispenseUOM = '' } = row
              return `${numeral(quantity).format(
                qtyFormat,
              )} ${dispenseUOM}`
            },
          },
          {
            columnName: 'orderByUser',
            sortingEnabled: false,
          },
          {
            columnName:'orderDate',
            sortingEnabled:false,
            type:'date',
            showTime:true,
            width:180,
          },
          {
            columnName: 'remarks',
            sortingEnabled: false,
          },
          {
            columnName: 'amount',
            sortingEnabled:false,
            type: 'currency',
            width:90,
          },
          {
            columnName: 'hasPaid',
            sortingEnabled:false,
            width:50,
            render: (row)=> row.hasPaid ?'Yes' : 'No',
          },
          {
            columnName: 'action',
            width:60,
            render: (row)=> {
              return <Authorized authority='appointment.actualizepreorder'>
                <Button size='sm'
                justIcon
                color='danger'
                onClick={()=>{
                    this.deletePreOrderItem(row.actualizedPreOrderItemFK)
                }}
                >
                <Delete/>
                </Button>
              </Authorized>
            }
          },
        ]}
      />
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(PreOrderCard)