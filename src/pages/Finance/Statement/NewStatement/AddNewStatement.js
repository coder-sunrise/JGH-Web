import React, { PureComponent } from 'react'
import { FastField } from 'formik'
import { formatMessage, FormattedMessage } from 'umi'
import { withStyles } from '@material-ui/core'
import Search from '@material-ui/icons/Search'
import { IntegratedSummary } from '@devexpress/dx-react-grid'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import { navigateDirtyCheck } from '@/utils/utils'
import {
  Button,
  DatePicker,
  GridContainer,
  GridItem,
  NumberInput,
  TextField,
  CardContainer,
  Switch,
  DateRangePicker,
  Field,
  CommonTableGrid,
  dateFormatLong,
  CodeSelect,
  withFormikExtend,
  ProgressButton,
  LocalSearchSelect,
} from '@/components'
import { COPAYER_TYPE } from '@/utils/constants'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const styles = () => ({
  root: { padding: '10px' },
  invoicesList: {
    marginTop: '10px',
    marginBottom: '15px',
  },
  searchBtn: {
    paddingTop: '10px !important',
  },
  header: {
    fontWeight: 400,
  },
})

@connect(({ statement }) => ({
  statement,
}))
@withFormikExtend({
  enableReinitialize: true,
  mapPropsToValues: ({ statement }) => {
    const returnValue = statement.entity || statement.default
    const adminChargeValueType =
      returnValue.adminChargeValueType || 'Percentage'
    const adjustmentValueType = returnValue.adjustmentValueType || 'Percentage'
    return {
      ...returnValue,
      adminChargeValueType,
      adjustmentValueType,
      invoiceRows: returnValue.statementInvoice,
      selectedRows: returnValue.statementInvoice
        .filter(
          si =>
            !(si.statementInvoicePayment || []).find(
              o => o.invoicePayment.isCancelled === false,
            ),
        )
        .map(o => o.id),
    }
  },
  validationSchema: Yup.object().shape({
    copayerFK: Yup.number().required(),
    statementDate: Yup.date().required(),
    paymentTerm: Yup.number().required(),
    adjustmentRemarks: Yup.string().when('adjustmentValue', {
      is: adjValue => (adjValue || 0) !== 0,
      then: Yup.string()
        .trim()
        .required(),
    }),
  }),

  handleSubmit: (values, { props, resetForm }) => {
    const {
      effectiveDates,
      statementInvoice,
      invoiceRows,
      selectedRows,
      ...restValues
    } = values
    const { dispatch, history } = props

    // filter out unselected new invoice
    const selectedAndExistingInvoices = invoiceRows.filter(
      o => selectedRows.includes(o.id) || o.statementInvoicePayment,
    )

    const newStatementInvoice = selectedAndExistingInvoices.map(o => {
      const statementInvoiceObj = {
        ...o,
        invoiceFK: o.invoiceFK || o.id,
        id: o.statementInvoicePayment ? o.id : undefined,
        invoicePayerFK: o.copayerInvoicePayerId || o.invoicePayerFK,
        payableAmount: o.copayerPayableAmount || o.payableAmount,
        outstandingAmount: o.copayerOutstanding || o.outstandingAmount,
        invoiceAmt: o.invoiceAmt,
      }

      // check if the invoice is selected && is the invoice has existing payment
      if (
        selectedRows.includes(o.id) ||
        o.statementInvoicePayment.find(
          i => i.invoicePayment.isCancelled === false,
        )
      ) {
        return {
          ...statementInvoiceObj,
        }
      }
      return {
        ...statementInvoiceObj,
        isDeleted: true,
      }
    })

    dispatch({
      type: 'statement/upsert',
      payload: {
        ...restValues,
        statementInvoice: newStatementInvoice,
      },
    }).then(r => {
      if (r) {
        resetForm()
        // history.push('/finance/statement')
        history.goBack()
      }
    })
  },
  displayName: 'statementDetails',
})
class AddNewStatement extends PureComponent {
  state = {
    columns: [
      { name: 'invoiceNo', title: 'Invoice No' },
      { name: 'invoiceDate', title: 'Invoice Date' },
      { name: 'patientName', title: 'Patient Name' },
      {
        name: this.props.statement.entity
          ? 'payableAmount'
          : 'copayerPayableAmount',
        title: 'Payable Amount',
      },
      {
        name: this.props.statement.entity
          ? 'outstandingAmount'
          : 'copayerOutstanding',
        title: 'Outstanding Amount',
      },
      { name: 'remark', title: 'Remarks' },
    ],
    columnExtensions: [
      {
        columnName: 'invoiceNo',
        sortingEnabled: false,
        width: 100,
      },
      {
        columnName: 'patientName',
        sortingEnabled: false,
      },
      {
        columnName: 'remark',
        sortingEnabled: false,
      },
      {
        columnName: this.props.statement.entity
          ? 'payableAmount'
          : 'copayerPayableAmount',
        type: 'number',
        currency: true,
        sortingEnabled: false,
        width: 200,
      },
      {
        columnName: this.props.statement.entity
          ? 'outstandingAmount'
          : 'copayerOutstanding',
        type: 'number',
        currency: true,
        sortingEnabled: false,
        width: 150,
      },
      {
        columnName: 'invoiceDate',
        type: 'date',
        format: dateFormatLong,
        sortingEnabled: false,
        width: 100,
      },
    ],
    invoiceRows: [],
    selectedRows: [],
  }

  componentDidMount() {
    const { values, setValues } = this.props
    const {
      dispatch,
      match: { params },
    } = this.props
    if (params.id) {
      dispatch({
        type: 'statement/refreshStatement',
        payload: {
          id: Number(params.id),
        },
      })
    }

    this.setState({
      invoiceRows: values.statementInvoice,
    })
    let defaultIds = []
    values.statementInvoice.forEach(o => {
      if (
        (o.statementInvoicePayment.length === 0 && !o.isDeleted) ||
        o.statementInvoicePayment.find(
          i => i.invoicePayment.isCancelled === true,
        ) ||
        o.payableAmount === o.outstandingAmount
      ) {
        defaultIds.push(o.id)
      }
    })

    this.setState({
      selectedRows: defaultIds,
    })
  }

  handleSelectionChange = rows => {
    const { setValues, values } = this.props
    if (rows) {
      setValues({
        ...values,
        selectedRows: rows,
      })
    }
    this.setState({ selectedRows: rows })
  }

  getInvoiceList = e => {
    const { dispatch, values, statement, setValues } = this.props
    const { InvoiceNo, effectiveDates, copayerFK } = values

    const payload = {
      'invoicePayer.CompanyFK': e || copayerFK,
      invoiceNo: InvoiceNo,
      lgteql_invoiceDate: effectiveDates ? effectiveDates[0] : undefined,
      lsteql_invoiceDate: effectiveDates ? effectiveDates[1] : undefined,
      pagesize: 9999,
    }

    dispatch({
      type: 'statement/queryInvoiceList',
      payload,
    }).then(invoiceList => {
      if (invoiceList) {
        const { data } = invoiceList.data
        let statementInvoices = []
        if (statement.entity) {
          let newData = []
          data.forEach(p => {
            p.invoicePayer.forEach(payer => {
              if (payer.payerTypeFK == 2 || payer.payerTypeFK == 4) {
                let existsInStatement = values.statementInvoice.find(
                  t => t.invoicePayerFK === payer.id,
                )
                if (!existsInStatement && payer.companyFK === copayerFK) {
                  newData.push({
                    ...p,
                    invoiceFK: p.id,
                    id: payer.id,
                    copayerInvoicePayerId: payer.id,
                    payableAmount: payer.payerDistributedAmt,
                    outstandingAmount: payer.outStanding,
                  })
                }
              }
            })
          })

          statementInvoices = [...values.statementInvoice, ...newData]
        } else {
          let records = []
          data.forEach(p => {
            p.invoicePayer.forEach(payer => {
              if (
                (payer.payerTypeFK == 2 || payer.payerTypeFK == 4) &&
                payer.companyFK === copayerFK
              ) {
                records.push({
                  ...p,
                  invoiceFK: p.id,
                  id: payer.id,
                  copayerInvoicePayerId: payer.id,
                  copayerPayableAmount: payer.payerDistributedAmt,
                  copayerOutstanding: payer.outStanding,
                })
              }
            })
          })
          statementInvoices = records
        }

        this.setState(() => {
          return {
            invoiceRows: statementInvoices,
          }
        })

        setValues({
          ...values,
          invoiceRows: statementInvoices,
        })
      }
    })
  }

  goBackToPreviousPage = () => {
    const { history, resetForm } = this.props
    resetForm()
    history.goBack()
  }

  clearInvoiceList = (e, op) => {
    const { setFieldValue } = this.props
    const {
      adminCharge,
      adminChargeType,
      statementAdjustment,
      statementAdjustmentType,
      defaultStatementAdjustmentRemarks,
    } = op
    setFieldValue('adminChargeValue', adminCharge || 0)
    setFieldValue('adminChargeValueType', adminChargeType || 'Percentage')
    setFieldValue('adjustmentValue', statementAdjustment || 0)
    setFieldValue(
      'adjustmentValueType',
      statementAdjustmentType || 'Percentage',
    )
    if (statementAdjustment) {
      setFieldValue('adjustmentRemarks', defaultStatementAdjustmentRemarks)
    }
    this.setState(() => {
      return {
        invoiceRows: [],
        selectedRows: [],
      }
    })
  }

  render() {
    const { classes, theme, values, handleSubmit, statement } = this.props
    const { invoiceRows, columns, columnExtensions } = this.state
    const { entity } = statement
    const mode = entity && entity.id > 0 ? 'Edit' : 'Add'
    return (
      <React.Fragment>
        <CardContainer hideHeader>
          <GridContainer>
            <GridContainer>
              <GridItem md={3}>
                <FastField
                  name='copayerFK'
                  render={args => {
                    return (
                      <LocalSearchSelect
                        label='Co-Payer'
                        code='ctcopayer'
                        labelField='displayValue'
                        showOptionTitle={false}
                        renderDropdown={option => {
                          return (
                            <CopayerDropdownOption
                              option={option}
                            ></CopayerDropdownOption>
                          )
                        }}
                        additionalSearchField='code'
                        localFilter={item =>
                          [
                            COPAYER_TYPE.CORPORATE,
                            COPAYER_TYPE.INSURANCE,
                          ].indexOf(item.coPayerTypeFK) >= 0
                        }
                        disabled={statement.entity}
                        onChange={this.clearInvoiceList}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>

            <GridItem md={3}>
              <FastField
                name='statementDate'
                render={args => <DatePicker label='Statement Date' {...args} />}
              />
            </GridItem>
            <GridItem md={1} />
            <GridItem md={3}>
              <FastField
                name='paymentTerm'
                render={args => (
                  <NumberInput
                    suffix='Days'
                    qty
                    label={formatMessage({
                      id: 'finance.statement.paymentTerms',
                    })}
                    precision={0}
                    max={999}
                    min={0}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridContainer>
              <GridItem md={3}>
                <Field
                  name='adjustmentValue'
                  render={args => {
                    if (values.adjustmentValueType === 'ExactAmount') {
                      return (
                        <NumberInput
                          currency
                          label='Statement Adjustment'
                          precision={2}
                          min={0}
                          {...args}
                        />
                      )
                    }
                    return (
                      <NumberInput
                        percentage
                        label='Statement Adjustment'
                        min={0}
                        max={100}
                        precision={2}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem
                md={1}
                style={{ display: 'flex', alignItems: 'flex-end' }}
              >
                <Field
                  name='adjustmentValueType'
                  render={args => (
                    <Switch
                      checkedChildren='$'
                      unCheckedChildren='%'
                      checkedValue='ExactAmount'
                      unCheckedValue='Percentage'
                      label=''
                      {...args}
                    />
                  )}
                />
              </GridItem>
              <GridItem md={3}>
                <FastField
                  name='adjustmentRemarks'
                  render={args => {
                    return (
                      <TextField
                        label='Adjustment Remarks'
                        maxLength={50}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>

            <GridContainer>
              <GridItem md={3}>
                <Field
                  name='adminChargeValue'
                  render={args => {
                    if (values.adminChargeValueType === 'ExactAmount') {
                      return (
                        <NumberInput
                          currency
                          label='Corporate Charge'
                          precision={2}
                          min={0}
                          {...args}
                        />
                      )
                    }
                    return (
                      <NumberInput
                        percentage
                        label='Corporate Charge'
                        max={100}
                        precision={2}
                        min={0}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem
                md={3}
                style={{ display: 'flex', alignItems: 'flex-end' }}
              >
                <Field
                  name='adminChargeValueType'
                  render={args => (
                    <Switch
                      checkedChildren='$'
                      unCheckedChildren='%'
                      checkedValue='ExactAmount'
                      unCheckedValue='Percentage'
                      label=''
                      {...args}
                    />
                  )}
                />
              </GridItem>
            </GridContainer>

            <GridItem md={7}>
              <FastField
                name='remark'
                render={args => {
                  return <TextField label='Remarks' multiline {...args} />
                }}
              />
            </GridItem>
          </GridContainer>
          <div
            style={{
              marginLeft: 9,
              marginTop: 20,
            }}
          >
            <h4 className={classes.header}>
              <b>
                Select outstanding invoices to be included in this statement
              </b>
            </h4>
          </div>
          <GridContainer style={{ margin: theme.spacing(1), marginTop: 0 }}>
            <GridItem container direction='row' spacing={0}>
              <GridItem xs md={3}>
                <FastField
                  name='InvoiceNo'
                  render={args => <TextField label='Invoice No' {...args} />}
                />
              </GridItem>

              <GridItem md={3}>
                <FastField
                  name='effectiveDates'
                  render={args => {
                    return (
                      <DateRangePicker
                        label='Invoice Date From'
                        label2='Invoice Date To'
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem classes={{ grid: classes.searchBtn }} xs md={3}>
                <ProgressButton
                  color='primary'
                  disabled={!values.copayerFK}
                  onClick={() => this.getInvoiceList()}
                  icon={<Search />}
                >
                  <FormattedMessage id='form.search' />
                </ProgressButton>
              </GridItem>
            </GridItem>
          </GridContainer>
          <GridItem xs={12}>
            <CommonTableGrid
              rows={
                invoiceRows.length > 0 ? invoiceRows : values.statementInvoice
              }
              columns={columns}
              columnExtensions={columnExtensions}
              TableProps={{
                height: 'calc(100vh - 465px)',
              }}
              FuncProps={{
                pager: false,
                selectable: true,
                selectConfig: {
                  showSelectAll: true,
                  rowSelectionEnabled: row => {
                    const {
                      statementInvoicePayment = [],
                      payableAmount,
                      outstandingAmount,
                      adminCharge,
                    } = row
                    return !statementInvoicePayment.find(
                      o => o.invoicePayment.isCancelled === false,
                    )
                  },
                },
                summary: true,
                summaryConfig: {
                  state: {
                    totalItems: [
                      {
                        columnName: columnExtensions[3].columnName,
                        type: 'payableAmount',
                      },
                    ],
                  },
                  integrated: {
                    calculator: (type, rows, getValue) => {
                      if (type === 'payableAmount') {
                        if (rows && rows.length > 0) {
                          return rows.reduce((pre, cur) => {
                            if (
                              (values.selectedRows &&
                                values.selectedRows.includes(cur.id)) ||
                              (cur.statementInvoicePayment || []).find(
                                o => o.invoicePayment.isCancelled === false,
                              )
                            ) {
                              return pre + getValue(cur) || 0
                            }
                            return pre
                          }, 0)
                        }
                        return 0
                      }
                      return IntegratedSummary.defaultCalculator(
                        type,
                        rows,
                        getValue,
                      )
                    },
                  },
                  row: {
                    messages: {
                      payableAmount: 'Total',
                    },
                  },
                },
              }}
              selection={this.state.selectedRows}
              onSelectionChange={this.handleSelectionChange}
            />
          </GridItem>
          <GridItem
            container
            style={{
              marginTop: 10,
              justifyContent: 'center',
            }}
          >
            <Button
              color='danger'
              onClick={navigateDirtyCheck({
                onProceed: this.goBackToPreviousPage,
              })}
            >
              Close
            </Button>
            <ProgressButton
              color='primary'
              disabled={mode === 'Add' && this.state.selectedRows.length <= 0}
              onClick={() => {
                handleSubmit()
              }}
            >
              Save
            </ProgressButton>
          </GridItem>
        </CardContainer>
      </React.Fragment>
    )
  }
}

export default withStyles(styles, { withTheme: true })(AddNewStatement)
