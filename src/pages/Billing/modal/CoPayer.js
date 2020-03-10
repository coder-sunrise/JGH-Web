import React, { Component } from 'react'
import { connect } from 'dva'
import * as Yup from 'yup'
// material ui
import { withStyles } from '@material-ui/core'
// common components
import {
  Button,
  EditableTableGrid,
  GridContainer,
  GridItem,
  CodeSelect,
} from '@/components'
// data table variable
import { CoPayerColumns, CoPayerColExtensions } from '../variables'
import { INVOICE_PAYER_TYPE } from '@/utils/constants'
import { getUniqueId } from '@/utils/utils'

const styles = (theme) => ({
  container: {
    padding: theme.spacing.unit,
  },
  dropdown: {
    marginBottom: theme.spacing.unit,
  },
  saveChangesButton: {
    textAlign: 'right',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit,
  },
})

const validationSchema = Yup.object().shape({
  payableBalance: Yup.number(),
  claimAmount: Yup.number()
    .min(0)
    .max(Yup.ref('payableBalance'), 'Claim Amount cannot exceed Total Payable'),
})

@connect(({ codetable }) => ({ codetable }))
class CoPayer extends Component {
  state = {
    editingRowIds: [],
    selectedRows: [],
    coPayer: undefined,
    invoiceItems: this.props.invoiceItems,
  }

  populateClaimAmount = (selected) => {
    const { invoiceItems } = this.state

    const selectedItems = invoiceItems.map((item) => {
      if (
        selected.includes(item.id) &&
        (item.claimAmount === 0 || item.claimAmount === undefined)
      )
        return { ...item, claimAmount: item.payableBalance }
      return { ...item }
    })

    this.setState({ invoiceItems: selectedItems })
    this.props.dispatch({
      type: 'global/incrementCommitCount',
    })
  }

  handleSelectionChange = (selection) => {
    this.populateClaimAmount(selection)
    this.setState({ selectedRows: selection })
  }

  handleCopayerChange = (value) => {
    this.setState({ coPayer: value })
  }

  onConfirmClick = () => {
    const { codetable } = this.props
    const { coPayer, selectedRows, invoiceItems } = this.state
    const invoicePayerItem = invoiceItems
      .filter((item) => selectedRows.includes(item.id))
      .map((item) => ({ ...item, id: getUniqueId(), invoiceItemFK: item.id }))
    const copayer = codetable.ctcopayer.find((item) => item.id === coPayer)

    const returnValue = {
      invoicePayerItem,
      payerDistributedAmt: invoicePayerItem.reduce(
        (total, item) => total + item.claimAmount,
        0,
      ),
      payerTypeFK: INVOICE_PAYER_TYPE.COMPANY,
      name: copayer.displayValue,
      companyFK: copayer.id,
      isModified: false,
      _isConfirmed: true,
      _isEditing: false,
      _isDeleted: false,
      schemeConfig: {},
    }
    this.props.onAddCoPayerClick(returnValue)
  }

  handleCommitChanges = ({ rows }) => {
    this.setState({
      invoiceItems: [
        ...rows,
      ],
    })
  }

  handleEditingRowIdsChange = (rows) => {
    this.setState({
      editingRowIds: rows,
    })
    return rows
  }

  shouldDisableAddCopayer = () => {
    const { coPayer, selectedRows, editingRowIds, invoiceItems } = this.state
    const subtotalAmount = invoiceItems.reduce(
      (subtotal, item) =>
        item.claimAmount === undefined ? subtotal : subtotal + item.claimAmount,
      0,
    )
    const getErrorRows = (row) => row._errors && row._errors.length > 0
    const getSelectedRows = (item) => selectedRows.includes(item.id)
    const hasError =
      invoiceItems.filter(getSelectedRows).filter(getErrorRows).length > 0

    return (
      subtotalAmount <= 0 ||
      editingRowIds.length > 0 ||
      selectedRows.length === 0 ||
      !coPayer ||
      hasError
    )
  }

  render () {
    const { classes, onClose, copayers = [] } = this.props
    const { selectedRows, invoiceItems, coPayer } = this.state
    return (
      <div className={classes.container}>
        <GridContainer>
          <GridItem md={4} className={classes.dropdown}>
            <CodeSelect
              label='Corporate Copayer'
              code='ctcopayer'
              labelField='displayValue'
              // remoteFilter={{
              //   coPayerTypeFK: 1,
              // }}
              localFilter={(item) =>
                item.coPayerTypeFK === 1 && !copayers.includes(item.id)}
              value={coPayer}
              onChange={this.handleCopayerChange}
            />
          </GridItem>
          <GridItem md={12}>
            <EditableTableGrid
              size='sm'
              rows={invoiceItems.map((item) => ({
                ...item,
                disabled: !selectedRows.includes(item.id),
              }))}
              forceRender
              columns={CoPayerColumns}
              columnExtensions={CoPayerColExtensions}
              selection={selectedRows}
              onSelectionChange={this.handleSelectionChange}
              FuncProps={{
                pager: false,
                selectable: true,
                selectConfig: {
                  showSelectAll: true,
                  rowSelectionEnabled: (row) => true,
                },
              }}
              EditingProps={{
                showAddCommand: false,
                showDeleteCommand: false,
                onCommitChanges: this.handleCommitChanges,
                onEditingRowIdsChange: this.handleEditingRowIdsChange,
              }}
              schema={validationSchema}
            />
          </GridItem>
        </GridContainer>
        <div className={classes.saveChangesButton}>
          <Button color='danger' onClick={onClose}>
            Cancel
          </Button>
          <Button
            color='primary'
            onClick={this.onConfirmClick}
            disabled={this.shouldDisableAddCopayer()}
          >
            Add Copayer
          </Button>
        </div>
      </div>
    )
  }
}

export default withStyles(styles, { name: 'CoPayer' })(CoPayer)
