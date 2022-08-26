import React, { PureComponent } from 'react'
import _ from 'lodash'
import $ from 'jquery'
import { FormattedMessage } from 'umi'
import moment from 'moment'
import Yup from '@/utils/yup'
import { Link, withStyles } from '@material-ui/core'
import Warning from '@material-ui/icons/Error'
import { Table } from '@devexpress/dx-react-grid-material-ui'
import * as config from '@/utils/config'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  NumberInput,
  EditableTableGrid,
  Tooltip,
  timeFormat24Hour,
} from '@/components'
import Filter from './Filter'

const styles = theme => ({
  subRow: {
    '& > td:first-child': {
      paddingLeft: theme.spacing(1),
    },
  },
})

const queryEntity = (calendarResource, dispatch) => {
  const { getClinic } = config
  const { systemTimeZoneInt = 0 } = getClinic() || {}
  dispatch({
    type: 'calendarResource/queryForDailyResource',
    payload: {
      id: calendarResource.editId,
      dateFrom: moment(calendarResource.selectMonth)
        .startOf('month')
        .startOf('day')
        .add(-systemTimeZoneInt, 'hours')
        .format('YYYY-MM-DDTHH:mm:ss'),
      dateTo: moment(calendarResource.selectMonth)
        .endOf('month')
        .startOf('day')
        .add(-systemTimeZoneInt, 'hours')
        .format('YYYY-MM-DDTHH:mm:ss'),
    },
  })
}

const dailyCapacitySchema = Yup.object().shape({
  maxCapacity: Yup.number()
    .required()
    .min(Yup.ref('usedSlot'), 'Maximum slot should be more than used slot.'),
})

@withFormikExtend({
  mapPropsToValues: ({ calendarResource }) => calendarResource.entity || {},
  validationSchema: Yup.object().shape({
    dailyCapacity: Yup.array()
      .compact(v => v.isDeleted)
      .of(dailyCapacitySchema),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { dispatch, onConfirm, calendarResource } = props
    dispatch({
      type: 'calendarResource/upsert',
      payload: {
        ...values,
        ctCalendarResourceCapacity: values.ctCalendarResourceCapacity.map(
          csc => {
            return {
              ...csc,
              ctCalendarResourceDailyCapacityDto: [
                ...values.dailyCapacity.filter(
                  dc => dc.calendarResourceCapacityFK === csc.id,
                ),
              ],
            }
          },
        ),
      },
    }).then(r => {
      if (r) {
        queryEntity(calendarResource, dispatch)
      }
    })
  },
  enableReinitialize: true,
  displayName: 'DailyResourceManagement',
})
class DailyResourceManagement extends PureComponent {
  commitChanges = ({ rows, changed }) => {
    const { setFieldValue } = this.props
    setFieldValue('dailyCapacity', rows)
    setFieldValue('isUpdate', true)
  }

  itemRow = p => {
    const { classes } = this.props
    const { row, children, tableRow } = p
    let newchildren = []
    const batchColumns = children.slice(1, 6)

    if (row.countNumber === 1) {
      newchildren.push(
        children
          .filter((value, index) => index < 1)
          .map(item => ({
            ...item,
            props: {
              ...item.props,
              rowSpan: row.rowSpan,
            },
          })),
      )
      newchildren.push(batchColumns)
    } else {
      newchildren.push(batchColumns)
    }

    if (row.countNumber === 1) {
      return <Table.Row {...p}>{newchildren}</Table.Row>
    }
    return (
      <Table.Row {...p} className={classes.subRow}>
        {newchildren}
      </Table.Row>
    )
  }

  queryDailyCapacity = () => {
    const { calendarResource, dispatch } = this.props
    queryEntity(calendarResource, dispatch)
  }

  render() {
    const {
      theme,
      footer,
      values,
      handleSubmit,
      height: mainDivHeight = 700,
      calendarResource,
    } = this.props
    let height =
      mainDivHeight - 180 - ($('.filterDailyResourceBar').height() || 0)
    if (height < 300) height = 300
    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <div className='filterDailyResourceBar'>
            <Filter
              {...this.props}
              queryDailyCapacity={this.queryDailyCapacity}
            />
          </div>
          <EditableTableGrid
            TableProps={{
              height,
              rowComponent: p => this.itemRow(p),
            }}
            forceRender
            style={{
              marginTop: theme.spacing(1),
              margin: theme.spacing(2),
            }}
            getRowId={r => r.uid}
            rows={values.dailyCapacity || []}
            EditingProps={{
              showAddCommand: false,
              showCommandColumn: false,
              onCommitChanges: this.commitChanges,
            }}
            schema={dailyCapacitySchema}
            columns={[
              { name: 'dailyDate', title: 'Date' },
              { name: 'timeSpace', title: 'Time From & Time To' },
              {
                name: 'maxCapacity',
                title: 'Maximum Slot',
              },
              { name: 'usedSlot', title: 'Used Slot' },
              { name: 'balanceSlot', title: 'Balance Slot' },
              { name: 'remarks', title: 'Remarks' },
            ]}
            columnExtensions={[
              {
                columnName: 'dailyDate',
                width: 105,
                render: row => {
                  return moment(row.dailyDate).format('DD MMM YYYY')
                },
                sortingEnabled: false,
                disabled: true,
              },
              {
                columnName: 'timeSpace',
                width: 160,
                render: row => {
                  const startTime = new Date(
                    `${moment().format('YYYY MM DD')} ${row.startTime}`,
                  )
                  const endTime = new Date(
                    `${moment().format('YYYY MM DD')} ${row.endTime}`,
                  )
                  return `${moment(startTime).format(
                    timeFormat24Hour,
                  )} - ${moment(endTime).format(timeFormat24Hour)}`
                },
                sortingEnabled: false,
                disabled: true,
              },
              {
                columnName: 'maxCapacity',
                type: 'number',
                width: 105,
                precision: 0,
                min: 0,
                max: 9999,
                sortingEnabled: false,
              },
              {
                columnName: 'usedSlot',
                type: 'number',
                precision: 0,
                width: 100,
                disabled: true,
                sortingEnabled: false,
              },
              {
                columnName: 'balanceSlot',
                type: 'number',
                precision: 0,
                width: 100,
                disabled: true,
                sortingEnabled: false,
                render: row => {
                  const balanceSlot = row.maxCapacity - row.usedSlot
                  return (
                    <span style={{ color: balanceSlot >= 0 ? 'black' : 'red' }}>
                      {balanceSlot}
                    </span>
                  )
                },
              },
              {
                columnName: 'remarks',
                sortingEnabled: false,
                width: 335,
                maxLength: 2000,
              },
            ]}
            FuncProps={{
              pager: false,
            }}
          />
        </div>
        {footer &&
          footer({
            onConfirm: handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: false,
            },
          })}
      </React.Fragment>
    )
  }
}
export default withStyles(styles, { withTheme: true })(DailyResourceManagement)
