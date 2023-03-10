import React, { PureComponent } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import { getBizSession } from '@/services/queue'
import {
  withFormikExtend,
  FastField,
  Field,
  GridContainer,
  GridItem,
  TextField,
  CodeSelect,
  DateRangePicker,
  notification,
} from '@/components'

const styles = (theme) => ({})

@withFormikExtend({
  mapPropsToValues: ({ settingServiceCenter }) =>
    settingServiceCenter.entity || settingServiceCenter.default,
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    serviceCenterCategoryFK: Yup.string().required(),
    effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm } = props
    dispatch({
      type: 'settingServiceCenter/updateServiceCenter',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
        serviceCenterCategoryFKNavigation: null,
      },
    }).then((r) => {
      if (r) {
        resetForm()
        if (r.id) {
          notification.success({ message: 'Service center created' })
        } else {
          notification.success({ message: 'Saved' })
        }
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingServiceCenter/query',
        })

        dispatch({
          type: 'codetable/fetchCodes',
          payload: {
            code: 'ctservice',
            filter: {
              'serviceFKNavigation.IsActive': true,
              'serviceCenterFKNavigation.IsActive': true,
              combineCondition: 'and',
            },
          },
        })
      }
    })
  },
  displayName: 'ServiceCenterDetail',
})
class Detail extends PureComponent {
  state = {
    isSaveDisabled: false,
    hasActiveSession: false,
  }

  componentDidMount () {
    this.checkHasActiveSession()
  }

  componentDidUpdate () {
    this.checkSaveButtonStatus()
  }

  checkHasActiveSession = async () => {
    const bizSessionPayload = {
      IsClinicSessionClosed: false,
    }
    const result = await getBizSession(bizSessionPayload)
    const { data } = result.data
    this.setState(() => {
      return {
        hasActiveSession: data.length > 0,
      }
    })
  }

  checkSaveButtonStatus = () => {
    const { errors } = this.props

    this.setState({
      isSaveDisabled: !_.isEmpty(errors),
    })
  }

  render () {
    const { props } = this
    const { theme, footer, settingServiceCenter } = props
    const disabledDateRange = settingServiceCenter.entity
      ? this.state.hasActiveSession
      : false

    return (
      <React.Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={(args) => (
                  <TextField
                    label='Code'
                    autoFocus
                    {...args}
                    disabled={!!settingServiceCenter.entity}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='displayValue'
                render={(args) => <TextField label='Display Value' {...args} />}
              />
            </GridItem>

            <GridItem md={6}>
              <Field
                name='effectiveDates'
                render={(args) => {
                  return (
                    <DateRangePicker
                      label='Effective Start Date'
                      label2='End Date'
                      disabled={disabledDateRange}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>

            <GridItem md={6}>
              <FastField
                name='serviceCenterCategoryFK'
                render={(args) => (
                  <CodeSelect
                    label='Service Center Category'
                    code='CTServiceCenterCategory'
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem md={12}>
              <FastField
                name='description'
                render={(args) => {
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
              disabled: this.state.isSaveDisabled,
            },
          })}
      </React.Fragment>
    )
  }
}

export default Detail
