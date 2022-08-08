import React, { PureComponent } from 'react'
import { FastField } from 'formik'
import moment from 'moment'
import Yup from '@/utils/yup'
import { status } from '@/utils/codes'

// import Edit from '@material-ui/icons/Edit'
// import Delete from '@material-ui/icons/Delete'
import {
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
  Select,
  notification,
  withFormikExtend,
} from '@/components'

const styles = theme => ({})

@withFormikExtend({
  mapPropsToValues: ({ settingPublicHoliday }) =>
    settingPublicHoliday.entity || settingPublicHoliday.default,
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    dates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { isActive, dates, effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    dispatch({
      type: 'settingPublicHoliday/upsert',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],

        effectiveEndDate:
          effectiveDates[1] < effectiveDates[0]
            ? moment('2010-12-31')
            : effectiveDates[1],

        startDate: moment(dates[0]),

        endDate: moment(dates[1]),
      },
    }).then(r => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingPublicHoliday/query',
        })
      }
    })
  },
  displayName: 'PublicHolidayDetail',
})
class Detail extends PureComponent {
  state = {}
  // state = {
  // editingRowIds: [],
  //   rowChanges: {},
  // }

  // changeEditingRowIds = (editingRowIds) => {
  //   this.setState({ editingRowIds })
  // }

  // changeRowChanges = (rowChanges) => {
  //   this.setState({ rowChanges })
  // }

  // commitChanges = ({ rows, added, changed, deleted }) => {
  //   const { setFieldValue } = this.props
  //   setFieldValue('items', rows)
  // }

  render() {
    const { props } = this
    const { classes, theme, footer, values, settingPublicHoliday } = props

    // console.log('detail', props)
    return (
      <React.Fragment>
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
                    disabled={!!settingPublicHoliday.entity}
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
                name='dates'
                render={args => {
                  return (
                    <DateRangePicker
                      label='Start Date'
                      label2='End Date'
                      {...args}
                    />
                  )
                }}
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
            {/* <GridItem md={12}>
              {settingPublicHoliday.entity ? (
                <FastField
                  name='isActive'
                  render={args => {
                    return <Select label='Status' {...args} options={status} />
                  }}
                />
              ) : (
                []
              )}
            </GridItem> */}

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
        </div>
        {footer &&
          footer({
            onConfirm: props.handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: false,
            },
          })}
      </React.Fragment>
    )
  }
}

export default Detail
