import React, { PureComponent } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  NumberInput,
  CodeSelect,
  TextField,
  DateRangePicker,
} from '@/components'
import ChecklistSubject from './ChecklistSubject'
import { LTChecklistCategory } from '../variables'

@withFormikExtend({
  mapPropsToValues: ({ settingChecklist }) => {
    const entity = settingChecklist.entity || settingChecklist.default
    const checklistSubject = entity.checklistSubject || []
    const checklistSubjectWithTabKey = checklistSubject.map(itemSubject => ({
      ...itemSubject,
      checklistObservation: _.sortBy(
        itemSubject.checklistObservation,
        ['sortOrder'],
        ['asc'],
      ),
      key: itemSubject.id ? itemSubject.id.toString() : itemSubject.key,
    }))

    return {
      ...entity,
      checklistSubject: checklistSubjectWithTabKey,
      dirty: false,
    }
  },
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    checklistCategoryFK: Yup.number().required(),
    sortOrder: Yup.number().required(),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
    checklistSubject: Yup.array().of(
      Yup.object().shape({
        displayValue: Yup.string().required(),
        checklistObservation: Yup.array().of(
          Yup.object().shape({
            displayValue: Yup.string().required(),
            sortOrder: Yup.number().required(),
          }),
        ),
      }),
    ),
  }),
  handleSubmit: (values, { props, resetForm }) => {
    const { effectiveDates, ...restValues } = values
    const { dispatch, onConfirm, SubjectSortOrderArray } = props
    restValues.checklistSubject.map(subjectItem =>
      SubjectSortOrderArray.forEach((element, index) =>
        element == subjectItem.key ? (subjectItem.sortOrder = index + 1) : null,
      ),
    )
    dispatch({
      type: 'settingChecklist/upsert',
      payload: {
        ...restValues,
        effectiveStartDate: effectiveDates[0],
        effectiveEndDate: effectiveDates[1],
      },
    }).then(r => {
      if (r) {
        resetForm()
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingChecklist/query',
        })
      }
    })
  },
  displayName: 'ChecklistDetail',
})
class Detail extends PureComponent {
  state = {}

  manuallyTriggerDirty = () => {
    const { setFieldValue } = this.props
    setFieldValue('dirty', true)
  }

  render() {
    const { props } = this
    const { theme, footer, settingChecklist } = props

    return (
      <React.Fragment>
        <div
          style={{
            margin: theme.spacing(1),
            maxHeight: 700,
            overflowY: 'auto',
          }}
        >
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={args => (
                  <TextField
                    label='Code'
                    autoFocus
                    {...args}
                    disabled={!!settingChecklist.entity}
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
                name='checklistCategoryFK'
                render={args => (
                  <CodeSelect
                    options={LTChecklistCategory}
                    labelField='name'
                    label='Checklist Category'
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
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
            <GridItem md={6}>
              <FastField
                name='sortOrder'
                render={args => {
                  return (
                    <NumberInput label='Sort Order' precision={0} {...args} />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
          <GridContainer>
            <GridItem md={12}>
              <ChecklistSubject
                {...props}
                manuallyTriggerDirty={this.manuallyTriggerDirty}
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
