import React from 'react'
// material ui
import { withStyles } from '@material-ui/core'
// ant design
import { Divider } from 'antd'
// common components
import { Button, CardContainer, GridContainer, GridItem } from '@/components'

const styles = () => ({
  rightAlign: {
    textAlign: 'right',
  },
  invoiceButton: {
    paddingLeft: 0,
  },
  addPaymentButton: {
    paddingRight: 0,
    marginRight: 0,
  },
})

const InvoiceSummary = ({ classes }) => {
  return (
    <React.Fragment>
      <GridItem md={12}>
        <h4 style={{ textAlign: 'center' }}>Invoice Summary: IVC0000111</h4>
      </GridItem>
      <GridItem md={10}>
        <CardContainer hideHeader>
          <GridContainer justify='space-between'>
            <GridItem md={6}>
              <h5>Total</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={6}>
              <h5>GST (7%)</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={6}>
              <h5>Final Bill</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={6}>
              <h5 style={{ fontWeight: 500 }}>Total Claims</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={12}>
              <Divider
                style={{
                  width: '100%',
                  height: 1,
                  margin: '12px 0',
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <h5 style={{ fontWeight: 500 }}>Final Payable</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
          </GridContainer>
        </CardContainer>
      </GridItem>
      <GridItem md={10}>
        <CardContainer hideHeader>
          <h4 style={{ fontWeight: 500 }}>Payment</h4>
          <GridContainer justify='space-between'>
            <GridItem md={6}>
              <h5>Credit Card</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={6}>
              <h5>Cash</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={6}>
              <h5>NETS</h5>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <h5>$100.00 </h5>
            </GridItem>
            <GridItem md={12}>
              <Divider
                style={{
                  width: '100%',
                  height: 1,
                  margin: '12px 0',
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <Button
                color='primary'
                simple
                size='sm'
                className={classes.invoiceButton}
              >
                Print Invoice
              </Button>
            </GridItem>
            <GridItem md={6} className={classes.rightAlign}>
              <Button
                color='primary'
                simple
                size='sm'
                className={classes.addPaymentButton}
              >
                Add Payment
              </Button>
            </GridItem>
          </GridContainer>
        </CardContainer>
      </GridItem>
    </React.Fragment>
  )
}

export default withStyles(styles, { name: 'InvoiceSummary' })(InvoiceSummary)
