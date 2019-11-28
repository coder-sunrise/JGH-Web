import React, { PureComponent } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import {
  GridContainer,
  GridItem,
  FastField,
  OutlinedTextField,
  Button,
  NumberInput,
  withFormikExtend,
  CommonTableGrid,
} from '@/components'

@withFormikExtend({
  enableReinitialize: true,
  mapPropsToValues: ({ invoicePayment }) => {
    const { invoicePayerFK, transfer } = invoicePayment
    let maxTransferAmount
    if (transfer) {
      maxTransferAmount = transfer.transferAmount
    }
    const selectedRows = []
    return {
      invoicePayerFK,
      ...transfer,
      maxTransferAmount,
      selectedRows,
    }
  },

  validationSchema: Yup.object().shape({
    transferAmount: Yup.number().max(Yup.ref('maxTransferAmount')),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const {
      invoicePayerInfo,
      selectedRows,
      id,
      concurrencyToken,
      ...restValues
    } = values
    const { dispatch, onConfirm, onRefresh } = props

    const selectedPayerInfo = invoicePayerInfo.filter((o) =>
      selectedRows.find((i) => i === o.id),
    )
    dispatch({
      type: 'invoicePayment/submitTransfer',
      payload: {
        ...restValues,
        invoicePayerInfo: selectedPayerInfo,
      },
    }).then((r) => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        onRefresh()
      }
    })
  },
  displayName: 'TransferDetail',
})
class Transfer extends PureComponent {
  state = {
    selectedRows: [],
    columns: [
      { name: 'itemType', title: 'Type' },
      { name: 'itemName', title: 'Name' },
      { name: 'claimAmount', title: 'Total ($)' },
      { name: 'transferAmount', title: 'Transfer ($)' },
    ],
    columnExtensions: [
      {
        columnName: 'claimAmount',
        type: 'number',
        currency: true,
      },
      {
        columnName: 'transferAmount',
        currency: true,
        render: (row) => {
          return (
            <GridItem xs={8}>
              <FastField
                name={`invoicePayerInfo[${row.rowIndex}].transferAmount`}
                render={(args) => (
                  <NumberInput
                    currency
                    min={0}
                    onChange={(e) => this.handleTransferAmount(e, 'grid')}
                    {...args}
                  />
                )}
              />
            </GridItem>
          )
        },
      },
    ],
  }

  componentDidMount () {
    const { dispatch, values } = this.props
    dispatch({
      type: 'invoicePayment/getTransferData',
      payload: {
        id: values.invoicePayerFK,
      },
    })
  }

  handleTransferAmount = (e, from) => {
    const { values, setFieldValue, setValues } = this.props
    const { invoicePayerInfo = [] } = values
    if (from === 'grid') {
      const totalTransferAmt = _.sumBy(
        values.invoicePayerInfo,
        'transferAmount',
      )

      setFieldValue('transferAmount', totalTransferAmt)
      return
    }

    let tempTransferAmt = e.target.value
    const distributedTransferAmtArray = invoicePayerInfo.map((o) => {
      let transferAmt

      if (tempTransferAmt >= o.claimAmount) {
        transferAmt = o.claimAmount
        tempTransferAmt -= o.claimAmount
      } else {
        transferAmt = tempTransferAmt
        tempTransferAmt = 0
      }

      return {
        ...o,
        transferAmount: transferAmt,
      }
    })

    setValues({
      ...values,
      invoicePayerInfo: distributedTransferAmtArray,
    })
  }

  handleSelectionChange = (selection) => {
    const { setValues, values } = this.props
    this.setState({ selectedRows: selection })
    setValues({
      ...values,
      selectedRows: selection,
    })
  }

  render () {
    const { values, onConfirm, handleSubmit } = this.props
    const { columns, columnExtensions } = this.state
    return (
      <React.Fragment>
        <GridContainer>
          <GridItem direction='column' md={12}>
            <GridItem md={3}>
              <FastField
                name='transferAmount'
                render={(args) => (
                  <NumberInput
                    label='Total Transfer Amount'
                    min={0}
                    currency
                    precision={2}
                    onChange={this.handleTransferAmount}
                    {...args}
                    autoFocus
                  />
                )}
              />
            </GridItem>
            <GridItem>
              <FastField
                name='remarks'
                render={(args) => {
                  return (
                    <OutlinedTextField
                      rows='4'
                      multiline
                      label='Remarks'
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridItem>
        </GridContainer>

        <CommonTableGrid
          rows={values.invoicePayerInfo}
          columns={columns}
          columnExtensions={columnExtensions}
          FuncProps={{
            pager: false,
            selectable: true,
            selectConfig: {
              showSelectAll: true,
              rowSelectionEnabled: () => {
                return true
              },
            },
          }}
          selection={this.state.selectedRows}
          onSelectionChange={this.handleSelectionChange}
        />

        <GridContainer>
          <GridItem md={12} style={{ textAlign: 'right', marginTop: 10 }}>
            <Button color='danger' onClick={onConfirm}>
              Cancel
            </Button>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={values.selectedRows.length <= 0}
            >
              Save
            </Button>
          </GridItem>
        </GridContainer>
      </React.Fragment>
    )
  }
}
export default Transfer
