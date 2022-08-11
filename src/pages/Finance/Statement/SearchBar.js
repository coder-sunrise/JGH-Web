import React, { PureComponent } from 'react'
import { FormattedMessage } from 'umi'
import { FastField, Field, withFormik } from 'formik'
import { withStyles } from '@material-ui/core'
import Search from '@material-ui/icons/Search'
import Add from '@material-ui/icons/Add'
import { connect } from 'dva'
import moment from 'moment'
import {
  GridContainer,
  GridItem,
  TextField,
  Checkbox,
  Button,
  CodeSelect,
  ProgressButton,
} from '@/components'
import { FilterBarDate } from '@/components/_medisys'
import Authorized from '@/utils/Authorized'
import { COPAYER_TYPE } from '@/utils/constants'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const styles = () => ({
  container: {
    marginBottom: '10px',
  },
  addNewBtn: {
    textAlign: 'right',
  },
  allCompaniesCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
})

@connect(({ clinicSettings }) => ({
  clinicSettings,
}))
@withFormik({
  mapPropsToValues: () => ({
    copayerFK: 'All Co-Payer',
    statementStartDate: moment()
      .subtract(1, 'months')
      .startOf('month'),
    statementEndDate: moment().endOf('month'),
    dueStartDate: moment()
      .subtract(1, 'months')
      .startOf('month'),
    dueEndDate: moment()
      .add(3, 'months')
      .endOf('month'),
  }),
  handleSubmit: (values, { props }) => {
    const {
      statementNo,
      copayerFK,
      isAllDateChecked,
      isAllDueDateChecked,
      statementStartDate,
      statementEndDate,
      dueStartDate,
      dueEndDate,
    } = values
    let statementDateFrom
    let statementDateTo
    let statementDueDateFrom
    let statementDueDateTo

    if (!isAllDateChecked && statementStartDate && statementEndDate) {
      statementDateFrom = statementStartDate
      statementDateTo = statementEndDate
    }

    if (!isAllDueDateChecked && dueStartDate && dueEndDate) {
      statementDueDateFrom = dueStartDate
      statementDueDateTo = dueEndDate
    }
    props.dispatch({
      type: 'statement/query',
      payload: {
        statementNo,
        copayerFK: typeof copayerFK === 'number' ? copayerFK : undefined,
        lgteql_statementDate: statementDateFrom,
        lsteql_statementDate: statementDateTo,
        isCancelled: false,
        apiCriteria: {
          DueDateFrom: statementDueDateFrom,
          DueDateTo: statementDueDateTo,
        },
      },
    })
  },
})
class SearchBar extends PureComponent {
  state = {
    showReport: false,
    showReportSelection: false,
  }

  componentWillUnmount() {
    this.unmount()
  }

  unmount = () =>
    this.props.dispatch({
      type: 'invoiceList/updateState',
      payload: {
        filter: {},
      },
    })

  handleOnChange = (name, checked) => event => {
    this.setState({ [name]: !checked })
    // if AllDate is checked, set datetime to max range
  }

  toggleReport = v => {
    this.setState(preState => ({ showReport: !preState.showReport }))
  }

  toggleReportSelection = () => {
    this.setState(preState => ({
      showReportSelection: !preState.showReportSelection,
    }))
  }

  batchPrintClick = () => {
    const { batchPrintStatements, dispatch, values } = this.props

    const {
      statementNo,
      copayerFK,
      isAllDateChecked,
      isAllDueDateChecked,
      statementStartDate,
      statementEndDate,
      dueStartDate,
      dueEndDate,
    } = values
    let statementDateFrom
    let statementDateTo
    let statementDueDateFrom
    let statementDueDateTo

    if (!isAllDateChecked && statementStartDate && statementEndDate) {
      statementDateFrom = statementStartDate
      statementDateTo = statementEndDate
    }

    if (!isAllDueDateChecked && dueStartDate && dueEndDate) {
      statementDueDateFrom = dueStartDate
      statementDueDateTo = dueEndDate
    }

    dispatch({
      type: 'statement/queryForBatchPrint',
      payload: {
        statementNo,
        copayerFK: typeof copayerFK === 'number' ? copayerFK : undefined,
        lgteql_statementDate: statementDateFrom,
        lsteql_statementDate: statementDateTo,
        isCancelled: false,
        apiCriteria: {
          DueDateFrom: statementDueDateFrom,
          DueDateTo: statementDueDateTo,
        },
        pagesize: 99999,
      },
    }).then(r => {
      if (r) {
        if (batchPrintStatements) {
          batchPrintStatements()
        }
      }
    })
  }

  render() {
    const {
      classes,
      history,
      dispatch,
      values,
      handleSubmit,
      showGenerateStatement,
      clinicSettings,
    } = this.props
    const { isEnableAutoGenerateStatement } = clinicSettings.settings
    const {
      statementStartDate,
      statementEndDate,
      dueStartDate,
      dueEndDate,
      isAllDateChecked,
      isAllDueDateChecked,
    } = values
    return (
      <div>
        <GridContainer className={classes.container}>
          <GridItem container xs md={12}>
            <GridItem md={3}>
              <FastField
                name='statementNo'
                render={args => <TextField label='Statement No.' {...args} />}
              />
            </GridItem>
            <GridItem md={3}>
              <Field
                name='statementStartDate'
                render={args => (
                  <FilterBarDate
                    noTodayLimit
                    args={args}
                    label='Statement From Date'
                    disabled={isAllDateChecked}
                    formValues={{
                      startDate: statementStartDate,
                      endDate: statementEndDate,
                    }}
                  />
                )}
              />
            </GridItem>
            <GridItem md={3}>
              <Field
                name='statementEndDate'
                render={args => (
                  <FilterBarDate
                    isEndDate
                    noTodayLimit
                    args={args}
                    label='Statement To Date'
                    disabled={isAllDateChecked}
                    formValues={{
                      startDate: statementStartDate,
                      endDate: statementEndDate,
                    }}
                  />
                )}
              />
            </GridItem>

            <GridItem xs sm={3} md={3} style={{ marginTop: 13 }}>
              <FastField
                name='isAllDateChecked'
                render={args => {
                  return <Checkbox label='All Date' {...args} />
                }}
              />
            </GridItem>
          </GridItem>
        </GridContainer>
        <GridContainer className={classes.container}>
          <GridItem container xs md={12}>
            <GridItem xs sm={3} md={3} style={{ position: 'relative' }}>
              <FastField
                name='copayerFK'
                render={args => {
                  return (
                    <CodeSelect
                      {...args}
                      label='Co-Payer'
                      code='ctCopayer'
                      labelField='displayValue'
                      additionalSearchField='code'
                      showOptionTitle={false}
                      renderDropdown={option => {
                        return (
                          <CopayerDropdownOption
                            option={option}
                          ></CopayerDropdownOption>
                        )
                      }}
                      localFilter={item =>
                        [
                          COPAYER_TYPE.CORPORATE,
                          COPAYER_TYPE.INSURANCE,
                        ].indexOf(item.coPayerTypeFK) >= 0
                      }
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={3}>
              <Field
                name='dueStartDate'
                render={args => (
                  <FilterBarDate
                    noTodayLimit
                    args={args}
                    label='Statement Due From Date'
                    disabled={isAllDueDateChecked}
                    formValues={{
                      startDate: dueStartDate,
                      endDate: dueEndDate,
                    }}
                  />
                )}
              />
            </GridItem>
            <GridItem md={3}>
              <Field
                name='dueEndDate'
                render={args => (
                  <FilterBarDate
                    label='Statement Due End Date'
                    isEndDate
                    noTodayLimit
                    args={args}
                    disabled={isAllDueDateChecked}
                    formValues={{
                      startDate: dueStartDate,
                      endDate: dueEndDate,
                    }}
                  />
                )}
              />
            </GridItem>

            <GridItem xs sm={3} md={3} style={{ marginTop: 13 }}>
              <FastField
                name='isAllDueDateChecked'
                render={args => {
                  return <Checkbox label='All Date' {...args} />
                }}
              />
            </GridItem>
          </GridItem>
        </GridContainer>
        <GridContainer className={classes.container}>
          <GridItem xs sm={12} md={12} lg={12}>
            <ProgressButton
              color='primary'
              icon={<Search />}
              onClick={handleSubmit}
            >
              <FormattedMessage id='form.search' />
            </ProgressButton>
            <Authorized authority='finance/statement'>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  dispatch({
                    type: 'statement/updateState',
                    payload: {
                      entity: undefined,
                    },
                  })
                  history.push('/finance/statement/newstatement')
                }}
              >
                <Add />
                New Statement
              </Button>
            </Authorized>
            <Button
              variant='contained'
              color='primary'
              onClick={this.batchPrintClick}
            >
              Batch Print
            </Button>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default withStyles(styles)(SearchBar)
