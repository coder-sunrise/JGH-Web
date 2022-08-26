import React, { PureComponent } from 'react'
import _, { values } from 'lodash'
import { FormattedMessage } from 'umi'
import moment from 'moment'
import Yup from '@/utils/yup'
import { navigateDirtyCheck } from '@/utils/utils'
import { Link } from '@material-ui/core'
import Warning from '@material-ui/icons/Error'
import { ChromePicker } from 'react-color'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  NumberInput,
  EditableTableGrid,
  SyncfusionTimePicker,
  Tooltip,
  CommonModal,
  notification,
  timeFormat24Hour,
  Popconfirm,
  Button,
} from '@/components'
import Delete from '@material-ui/icons/Delete'
import { ShoppingCartTwoTone } from '@material-ui/icons'
import DailyResourceManagement from './DailyResourceManagement'

const styles = theme => ({})

const resourceCapacitySchema = Yup.object().shape({
  capacityTime: Yup.string().when(
    ['startTime', 'endTime'],
    (startTime, endTime) => {
      if (startTime && endTime && startTime > endTime)
        return Yup.string().required('Time to should be more than time from.')
    },
  ),
  startTime: Yup.string().required(),
  endTime: Yup.string().required(),
  maxCapacity: Yup.number()
    .required()
    .min(0)
    .max(9999),
})

@withFormikExtend({
  enableReinitialize: true,
  mapPropsToValues: ({ settingResource }) =>
    settingResource.entity || settingResource.default,
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
    calendarResource: Yup.object().shape({
      ctCalendarResourceCapacity: Yup.array()
        .compact(v => v.isDeleted)
        .of(resourceCapacitySchema),
    }),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    const oldCapacity =
      values.calendarResource.oldCtCalendarResourceCapacity || []
    const deletedResourceCapacity = restValues.calendarResource.ctCalendarResourceCapacity.filter(
      csc => csc.id > 0 && csc.isDeleted,
    )
    deletedResourceCapacity.forEach(item => {
      const deleteItem = oldCapacity.find(x => x.id === item.id)
      item.startTime = deleteItem.startTime
      item.endTime = deleteItem.endTime
      item.maxCapacity = deleteItem.maxCapacity
    })
    dispatch({
      type: 'settingResource/upsert',
      payload: {
        ...restValues,
        calendarResource: {
          ...restValues.calendarResource,
          ctCalendarResourceCapacity: restValues.calendarResource.ctCalendarResourceCapacity
            .filter(csc => csc.id > 0 || !csc.isDeleted)
            .map(csc => {
              return {
                ...csc,
              }
            }),
        },
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
      },
    }).then(r => {
      if (r) {
        resetForm()
        let queryId = values.id
        if (!values.id) {
          queryId = r.id
        }
        dispatch({
          type: 'settingResource/queryOne',
          payload: {
            id: queryId,
          },
        })
      }
    })
  },
  displayName: 'ResourceDetail',
})
class Detail extends PureComponent {
  state = { showDailyManagementModal: false }

  commitChanges = ({ rows, changed }) => {
    const { setFieldValue } = this.props
    setFieldValue('_fakeField', 'fakeValue')
    rows = _.orderBy(rows, ['startTime'], ['asc'])
    const endResult = rows.reduce((result, data) => {
      try {
        if (!data.isDeleted) {
          resourceCapacitySchema.validateSync(data, {
            abortEarly: false,
          })
        }
        return [...result, { ...data, _errors: [] }]
      } catch (error) {
        return [...result, { ...data, _errors: error.inner }]
      }
    }, [])
    setFieldValue('calendarResource.ctCalendarResourceCapacity', endResult)
    return endResult
  }

  isEnableDailyManagement = () => {
    const { values } = this.props
    const newCapacity = values.calendarResource.ctCalendarResourceCapacity
    const oldCapacity =
      values.calendarResource.oldCtCalendarResourceCapacity || []
    if (!values.id) return false
    if (!newCapacity.length) return false

    const generateItem = item => {
      if (!item) return {}
      return {
        startTime: item.startTime,
        endTime: item.endTime,
        maxCapacity: item.maxCapacity,
        isDeleted: item.isDeleted,
      }
    }
    for (let index = 0; index < newCapacity.length; index++) {
      const currentRow = oldCapacity.find(r => r.id === newCapacity[index].id)
      if (
        !_.isEqual(generateItem(newCapacity[index]), generateItem(currentRow))
      ) {
        return false
      }
    }
    return true
  }

  toggleModal = () => {
    this.props.dispatch({
      type: 'calendarResource/updateState',
      payload: {
        entity: undefined,
        editId: undefined,
        selectMonth: undefined,
      },
    })
    this.setState({ showDailyManagementModal: false })
  }

  onConfirm = () => {
    const { handleSubmit, values, setFieldValue } = this.props
    if (!values.balanceTagColorHex) {
      setFieldValue('balanceTagColorHex', '#31C736')
    }
    if (this.checkConflictTime()) {
      notification.error({
        message: 'Time range conflicting with other times.',
      })
    } else {
      setTimeout(() => {
        handleSubmit()
      }, 100)
    }
  }

  checkConflictTime = () => {
    const { values } = this.props
    const resourceCapacity = (
      values.calendarResource?.ctCalendarResourceCapacity || []
    ).filter(x => !x.isDeleted)
    let containsConflictTime = false
    for (let index = 0; index < resourceCapacity.length; index++) {
      if (
        index > 0 &&
        resourceCapacity[index].startTime < resourceCapacity[index - 1].endTime
      ) {
        containsConflictTime = true
        break
      }
    }
    return containsConflictTime
  }

  isTimeChange = (from, to) => {
    if (from && to) {
      if (
        moment(from, timeFormat24Hour).format(timeFormat24Hour) ===
        moment(to, timeFormat24Hour).format(timeFormat24Hour)
      ) {
        return false
      }
      return true
    }

    if (!from && !to) {
      return false
    }
    return true
  }
  onColorChange = color => {
    const { setFieldValue } = this.props
    if (color) setFieldValue('balanceTagColorHex', color.hex)
  }
  render() {
    const { theme, footer, values, dispatch, clinicSettings = {} } = this.props
    const {
      apptTimeIntervel = 30,
      clinicOperationStartTime = '07:00',
      clinicOperationEndTime = '22:00',
    } = clinicSettings
    const operationhour = {
      startTime: moment(clinicOperationStartTime, timeFormat24Hour)
        .add(-30, 'minute')
        .format(timeFormat24Hour),
      endTime: moment(clinicOperationEndTime, timeFormat24Hour)
        .add(30, 'minute')
        .format(timeFormat24Hour),
    }
    return (
      <React.Fragment>
        <GridContainer
          style={{
            height: 700,
            alignItems: 'start',
            overflowY: 'scroll',
          }}
        >
          <div style={{ margin: theme.spacing(1) }}>
            <GridContainer>
              <GridItem md={6}>
                <FastField
                  name='code'
                  render={args => (
                    <TextField
                      label='Code'
                      autoFocus
                      {...args}
                      disabled={!!values.id}
                    />
                  )}
                />
              </GridItem>
              <GridItem md={6}>
                <FastField
                  name='displayValue'
                  render={args => <TextField label='Display Value' {...args} />}
                />
              </GridItem>
              <GridItem md={6}>
                <FastField
                  name='effectiveDates'
                  render={args => {
                    return (
                      <DateRangePicker
                        label='Effective Start Date'
                        label2='End Date'
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem md={6}>
                <FastField
                  name='sortOrder'
                  render={args => {
                    return (
                      <NumberInput
                        label='Sort Order'
                        precision={0}
                        rowsMax={4}
                        max={9999}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
              <GridItem md={12}>
                <FastField
                  name='description'
                  render={args => {
                    return (
                      <TextField
                        label='Description'
                        multiline
                        rowsMax={4}
                        {...args}
                      />
                    )
                  }}
                />
              </GridItem>
            </GridContainer>
            <GridContainer>
              <GridItem md={8}>
                <div style={{ position: 'relative' }}>
                  <h5 style={{ fontWeight: 400, margin: '8px 6px -4px 6px' }}>
                    <b>Resource Management</b>
                  </h5>
                  <EditableTableGrid
                    forceRender
                    style={{
                      marginTop: theme.spacing(1),
                    }}
                    rows={(
                      values.calendarResource?.ctCalendarResourceCapacity || []
                    ).map(item => ({ ...item, operationhour }))}
                    EditingProps={{
                      showCommandColumn: false,
                      showAddCommand: true,
                      onCommitChanges: this.commitChanges,
                    }}
                    schema={resourceCapacitySchema}
                    columns={[
                      { name: 'capacityTime', title: 'Time From & Time To' },
                      {
                        name: 'maxCapacity',
                        title: 'Default Maximum Capacity',
                      },
                      { name: 'action', title: ' ' },
                    ]}
                    columnExtensions={[
                      {
                        columnName: 'capacityTime',
                        isReactComponent: true,
                        render: e => {
                          const { row, columnConfig, cellProps } = e
                          const { control, error, validSchema } = columnConfig
                          const { operationhour = {} } = row
                          const startError = (row._errors || []).find(
                            se => se.path === 'startTime',
                          )
                          const endError = (row._errors || []).find(
                            se => se.path === 'endTime',
                          )
                          const moreThanError = (row._errors || []).find(
                            se => se.path === 'capacityTime',
                          )
                          return (
                            <GridContainer>
                              <GridItem xs md={6} style={{ paddingRight: 10 }}>
                                <div
                                  style={{
                                    position: 'relative',
                                    paddingRight: 16,
                                  }}
                                >
                                  <SyncfusionTimePicker
                                    step={apptTimeIntervel}
                                    value={row.startTime}
                                    style={{ margin: 0 }}
                                    min={operationhour.startTime}
                                    max={operationhour.endTime}
                                    onChange={e => {
                                      if (!this.isTimeChange(row.startTime, e))
                                        return
                                      const { commitChanges } = control
                                      row.startTime = e
                                      if (
                                        row.startTime &&
                                        row.endTime &&
                                        row.startTime > row.endTime
                                      ) {
                                        row.endTime = row.startTime
                                      }
                                      commitChanges({
                                        changed: {
                                          [row.id]: {
                                            startTime: row.startTime,
                                            endTime: row.endTime,
                                          },
                                        },
                                      })
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right: '-6px',
                                      top: 8,
                                    }}
                                  >
                                    {startError && (
                                      <Tooltip
                                        title={
                                          (startError || startRangeError)
                                            .message
                                        }
                                      >
                                        <Warning color='error' />
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              </GridItem>
                              <GridItem xs md={6} style={{ paddingLeft: 20 }}>
                                <div
                                  style={{
                                    position: 'relative',
                                    paddingRight: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: '-25px',
                                      top: 6,
                                    }}
                                  >
                                    To
                                  </div>
                                  <SyncfusionTimePicker
                                    step={apptTimeIntervel}
                                    style={{ margin: 0 }}
                                    value={row.endTime}
                                    min={operationhour.startTime}
                                    max={operationhour.endTime}
                                    onChange={e => {
                                      if (!this.isTimeChange(row.endTime, e))
                                        return
                                      const { commitChanges } = control
                                      row.endTime = e
                                      commitChanges({
                                        changed: {
                                          [row.id]: {
                                            endTime: row.endTime,
                                          },
                                        },
                                      })
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right: '-12px',
                                      top: 8,
                                    }}
                                  >
                                    {(endError || moreThanError) && (
                                      <Tooltip
                                        title={
                                          (
                                            endError ||
                                            endRangeError ||
                                            moreThanError
                                          ).message
                                        }
                                      >
                                        <Warning color='error' />
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              </GridItem>
                            </GridContainer>
                          )
                        },
                        sortingEnabled: false,
                      },
                      {
                        columnName: 'maxCapacity',
                        type: 'number',
                        max: 9999,
                        precision: 0,
                        min: 0,
                        sortingEnabled: false,
                        width: 200,
                      },
                      {
                        columnName: 'action',
                        width: 60,
                        isReactComponent: true,
                        sortingEnabled: false,
                        isDisabled: row => true,
                        render: e => {
                          const { row, columnConfig } = e
                          const { control } = columnConfig
                          const { commitChanges } = control
                          return (
                            <Popconfirm
                              title='Confirm to delete?'
                              onConfirm={() => {
                                commitChanges({
                                  changed: {
                                    [row.id]: {
                                      isDeleted: true,
                                    },
                                  },
                                })
                              }}
                            >
                              <Button size='sm' justIcon color='danger'>
                                <Delete />
                              </Button>
                            </Popconfirm>
                          )
                        },
                      },
                    ]}
                    FuncProps={{
                      pager: false,
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: 10, right: 14 }}>
                    {this.isEnableDailyManagement() && (
                      <Link
                        component='button'
                        style={{ textDecoration: 'underline' }}
                        onClick={e => {
                          navigateDirtyCheck({
                            onProceed: async () => {
                              await dispatch({
                                type: 'calendarResource/updateState',
                                payload: {
                                  editId: values.calendarResource.id,
                                  selectMonth: moment(),
                                },
                              })
                              this.setState({ showDailyManagementModal: true })
                            },
                          })(e)
                        }}
                      >
                        Daily Resource Management
                      </Link>
                    )}
                  </div>
                  {this.checkConflictTime() && (
                    <div style={{ color: 'red', marginLeft: 16 }}>
                      Time range conflicting with other times.
                    </div>
                  )}
                </div>
              </GridItem>
              <GridItem md={4}>
                <div>
                  <h5 style={{ fontWeight: 400, margin: '8px 6px 4px 6px' }}>
                    <b>Resource Color</b>
                  </h5>
                  <ChromePicker
                    onChangeComplete={this.onColorChange}
                    color={values?.balanceTagColorHex ?? '#31C736'}
                  />
                </div>
              </GridItem>
            </GridContainer>
          </div>
        </GridContainer>
        {footer &&
          footer({
            onConfirm: this.onConfirm,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: false,
            },
          })}
        <CommonModal
          open={this.state.showDailyManagementModal}
          observe='DailyResourceManagement'
          title={'Daily Resource Management'}
          maxWidth='md'
          bodyNoPadding
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
        >
          <DailyResourceManagement {...this.props} />
        </CommonModal>
      </React.Fragment>
    )
  }
}

export default Detail
