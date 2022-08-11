import React from 'react'
// formik
import { FastField, Field, withFormik } from 'formik'
import { FormattedMessage } from 'umi'
import Search from '@material-ui/icons/Search'
// common components
import {
  Button,
  ProgressButton,
  GridContainer,
  GridItem,
  SizeContainer,
  TextField,
  Tooltip,
  CodeSelect,
  Select,
} from '@/components'
import { FilterBarDate } from '@/components/_medisys'
import { getBizSession } from '@/services/queue'
import { osBalanceStatus, sessionOptions } from '@/utils/codes'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

const getBizSessionId = async () => {
  const bizSessionPayload = {
    IsClinicSessionClosed: false,
  }
  const result = await getBizSession(bizSessionPayload)
  const { data } = result.data
  if (data.length > 0) {
    return data[0].id
  }
  return null
}

const FilterBar = ({ classes, dispatch, values, handleSubmit }) => {
  const { invoiceStartDate, invoiceEndDate } = values
  const handleReset = async () => {
    await dispatch({
      type: 'invoiceList/resetFilter',
    })
    handleSubmit()
  }
  return (
    <SizeContainer>
      <React.Fragment>
        <GridContainer>
          <GridItem xs={6} md={3}>
            <FastField
              name='invoiceNo'
              render={args => (
                <TextField
                  style={{ width: '100%' }}
                  label='Invoice No'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <div
              style={{
                width: '49%',
                marginRight: '1%',
                display: 'inline-block',
              }}
            >
              <Field
                name='invoiceStartDate'
                render={args => (
                  <FilterBarDate
                    args={args}
                    label='Invoice Date From'
                    formValues={{
                      startDate: invoiceStartDate,
                      endDate: invoiceEndDate,
                    }}
                  />
                )}
              />
            </div>
            <div
              style={{
                width: '49%',
                marginLeft: '1%',
                display: 'inline-block',
              }}
            >
              <Field
                name='invoiceEndDate'
                render={args => (
                  <FilterBarDate
                    args={args}
                    label='Invoice Date To'
                    isEndDate
                    formValues={{
                      startDate: invoiceStartDate,
                      endDate: invoiceEndDate,
                    }}
                  />
                )}
              />
            </div>
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='session'
              render={args => (
                <Select
                  style={{ width: '100%' }}
                  label='Session'
                  options={sessionOptions}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='outstandingBalanceStatus'
              render={args => {
                return (
                  <Select
                    label='O/S Balance'
                    options={osBalanceStatus}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='patientAccountNo'
              render={args => <TextField label='Patient Acc. No.' {...args} />}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <FastField
              name='patientName'
              render={args => (
                <TextField
                  style={{ width: '100%' }}
                  label='Patient Name'
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs={6} md={3}>
            <Tooltip
              placement='right'
              title='select "All" will retrieve active and inactive co-payers'
            >
              <FastField
                name='coPayerFk'
                render={args => (
                  <CodeSelect
                    code='ctCopayer'
                    labelField='displayValue'
                    additionalSearchField='code'
                    maxTagCount={0}
                    maxTagPlaceholder='Co-Payer'
                    label='Co-Payer'
                    showOptionTitle={false}
                    renderDropdown={option => {
                      return (
                        <CopayerDropdownOption
                          option={option}
                        ></CopayerDropdownOption>
                      )
                    }}
                    {...args}
                  />
                )}
              />
            </Tooltip>
          </GridItem>
          <div className={classes.searchButton}>
            <ProgressButton
              color='primary'
              icon={<Search />}
              onClick={handleSubmit}
            >
              <FormattedMessage id='form.search' />
            </ProgressButton>
            <Button onClick={handleReset}>Reset</Button>
            {/* <i>Double click on record to view invoice</i> */}
          </div>
        </GridContainer>
      </React.Fragment>
    </SizeContainer>
  )
}

export default withFormik({
  enableReinitialize: true,
  mapPropsToValues: ({ invoiceList }) => ({ ...invoiceList.filterValues }),
  handleSubmit: async (values, { props }) => {
    const { dispatch } = props
    const {
      invoiceNo,
      patientName,
      patientAccountNo,
      invoiceStartDate,
      invoiceEndDate,
      outstandingBalanceStatus,
      session,
      coPayerFk,
    } = values
    let SessionID
    let SessionType
    if (session === 'current') {
      SessionID = await getBizSessionId()
      SessionType = 'CurrentSession'
    } else if (session === 'past') {
      SessionID = await getBizSessionId()
      SessionType = 'PastSession'
    }

    const payload = {
      lgteql_invoiceDate: invoiceStartDate || undefined,
      lsteql_invoiceDate: invoiceEndDate || undefined,
      lgt_OutstandingBalance:
        outstandingBalanceStatus === 'yes' && outstandingBalanceStatus !== 'all'
          ? '0'
          : undefined,
      lsteql_OutstandingBalance:
        outstandingBalanceStatus === 'no' && outstandingBalanceStatus !== 'all'
          ? '0'
          : undefined,
      apiCriteria: {
        SessionID,
        SessionType,
        coPayerFk
      },
      group: [
        {
          invoiceNo,
          'VisitInvoice.VisitFKNavigation.PatientProfileFkNavigation.Name': patientName,
          'VisitInvoice.VisitFKNavigation.PatientProfileFkNavigation.PatientAccountNo': patientAccountNo,
          combineCondition: 'and',
        },
      ],
    }

    dispatch({
      type: 'invoiceList/query',
      payload,
    })
    dispatch({
      type: 'invoiceList/updateState',
      payload: {
        filterValues: {
          ...values,
        },
      },
    })
  },
})(FilterBar)
