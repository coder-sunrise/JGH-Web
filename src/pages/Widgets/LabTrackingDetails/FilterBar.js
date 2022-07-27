import React, { PureComponent, memo } from 'react'
import { formatMessage } from 'umi'
import Search from '@material-ui/icons/Search'
import { findGetParameter } from '@/utils/utils'
import moment from 'moment'

import {
  Button,
  CommonModal,
  GridContainer,
  GridItem,
  FastField,
  TextField,
  Field,
  CodeSelect,
  withFormikExtend,
  DateRangePicker,
  ClinicianSelect,
  DatePicker,
  Select,
  reversedDateFormat,
  ProgressButton,
  VisitTypeSelect,
  Tooltip,
  Checkbox,
} from '@/components'

const styles = theme => ({
  filterBar: {
    marginBottom: '20px',
  },
  filterBtn: {
    lineHeight: standardRowHeight,
    textAlign: 'left',
    '& > button': {
      marginRight: theme.spacing.unit,
    },
  },
})

const searchResult = (values, props) => {
  const { dispatch, IsOverallGrid, patientId, setState } = props
  let patientID = patientId || Number(findGetParameter('pid'))
  const {
    visitDate,
    isAllDateChecked,
    labTrackingStatusFK,
    serviceName,
    searchValue,
    visitTypeIDs,
    serviceCenterIDs,
  } = values

  const visitStartDate =
    visitDate && visitDate.length > 0
      ? moment(visitDate[0])
          .set({ hour: 0, minute: 0, second: 0 })
          .formatUTC(false)
      : undefined
  const visitEndDate =
    visitDate && visitDate.length > 1
      ? moment(visitDate[1])
          .set({ hour: 23, minute: 59, second: 59 })
          .formatUTC(false)
      : undefined
  const payload = {
    visitFKNavigation: IsOverallGrid
      ? undefined
      : patientID
      ? {
          patientProfileFK: patientID,
        }
      : undefined,
    lgteql_visitDate: isAllDateChecked
      ? undefined
      : visitStartDate || undefined,
    lsteql_visitDate: isAllDateChecked ? undefined : visitEndDate || undefined,
    labTrackingStatusFK: labTrackingStatusFK || undefined,
    apiCriteria: {
      searchValue: searchValue ? searchValue : undefined,
      serviceCenterIDs:
        serviceCenterIDs && serviceCenterIDs.length > 0
          ? serviceCenterIDs.join(',')
          : undefined,
      visitTypeIDs:
        visitTypeIDs && visitTypeIDs.length > 0
          ? visitTypeIDs.join(',')
          : undefined,
    },
    serviceName: serviceName || undefined,
  }
  dispatch({
    type: 'labTrackingDetails/query',
    payload,
  })
}

class FilterBar extends PureComponent {
  constructor(props) {
    super(props)
    const { setFieldValue } = props

    setTimeout(() => {
      setFieldValue('visitDate', [moment().toDate(), moment().toDate()])
      setFieldValue('visitTypeIDs', [-99])
    }, 1)
  }

  componentDidMount = () => {
    setTimeout(() => {
      const { values } = this.props
      searchResult(values, this.props)
    }, 100)
  }

  render() {
    const { handleSubmit, IsOverallGrid, values } = this.props
    return (
      <div>
        <GridContainer alignItems='flex-end'>
          {IsOverallGrid && (
            <FastField
              name='searchValue'
              render={args => (
                <TextField
                  {...args}
                  label='Patient Name, Acc. no, Patient Referrence No'
                  autoFocus
                  style={{ width: 300, marginLeft: 10 }}
                />
              )}
            />
          )}
          <FastField
            name='serviceName'
            render={args => (
              <TextField
                {...args}
                label='Service Name'
                style={{ width: 200, marginLeft: 10 }}
              />
            )}
          />
          <FastField
            name='serviceCenterIDs'
            render={args => {
              return (
                <CodeSelect
                  code='ctServiceCenter'
                  label='Service Center'
                  mode='multiple'
                  maxTagCount={0}
                  maxTagPlaceholder='Service Centers'
                  allowClear={true}
                  style={{
                    width: 200,

                    marginLeft: 10,
                  }}
                  {...args}
                />
              )
            }}
          />
          <FastField
            name='visitTypeIDs'
            initialValue={[-99]}
            render={args => (
              <Tooltip
                placement='right'
                title='Select "All" will retrieve active and inactive visit type'
              >
                <VisitTypeSelect
                  label='Visit Type'
                  {...args}
                  mode='multiple'
                  maxTagCount={0}
                  maxTagPlaceholder='Visit Types'
                  allowClear={true}
                  style={{
                    width: 200,
                    marginLeft: 10,
                  }}
                />
              </Tooltip>
            )}
          />
          <div
            style={{
              marginLeft: 10,
            }}
          >
            <Field
              name='visitDate'
              render={args => (
                <DateRangePicker
                  label='Visit Date'
                  label2='To'
                  {...args}
                  disabled={values.isAllDateChecked}
                  style={{
                    width: 220,
                  }}
                />
              )}
            />
          </div>
          <FastField
            name='isAllDateChecked'
            render={args => {
              return (
                <Tooltip
                  title={formatMessage({
                    id: 'form.date.placeholder.allDate',
                  })}
                  placement='bottom'
                >
                  <Checkbox
                    label={formatMessage({
                      id: 'form.date.placeholder.allDate',
                    })}
                    inputLabel=' '
                    style={{
                      width: 80,
                      marginLeft: 10,
                      position: 'relative',
                      bottom: '-6px',
                    }}
                    {...args}
                  />
                </Tooltip>
              )
            }}
          />
          <FastField
            name='labTrackingStatusFK'
            render={args => (
              <CodeSelect
                label='Status'
                {...args}
                code='ltlabtrackingstatus'
                style={{ width: 110, marginLeft: 10 }}
              />
            )}
          />
          <ProgressButton
            icon={<Search />}
            color='primary'
            style={{ position: 'relative', marginTop: '20px' }}
            size='sm'
            onClick={handleSubmit}
            style={{
              marginLeft: 20,
              position: 'relative',
              bottom: 6,
            }}
          >
            Search
          </ProgressButton>
        </GridContainer>
      </div>
    )
  }
}

export default memo(
  withFormikExtend({
    handleSubmit: (values, { props, resetForm }) => {
      searchResult(values, props)
    },
  })(FilterBar),
)
