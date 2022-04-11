import React, { PureComponent, Fragment } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  DateRangePicker,
} from '@/components'
import { InventoryItemList } from '@/components/_medisys'
import { visitOrderTemplateItemTypes } from '@/utils/codes'

@withFormikExtend({
  mapPropsToValues: ({ settingVisitOrderTemplate }) =>
    settingVisitOrderTemplate.entity || settingVisitOrderTemplate.default,
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    effectiveDates: Yup.array().of(Yup.date()).min(2).required(),
  }),
  handleSubmit: (values, { props }) => {
    if(values.rows.some(x=>x.totalAftAdj < 0))
      return;
    const { effectiveDates, rows, tempSelectedItem, ...restValues } = values
    const { dispatch, onConfirm } = props

    const maxSortOrderObj = _.maxBy(rows, 'sortOrder') || {}
    let maxSortOrder = maxSortOrderObj.sortOrder || 0
    const assignedSortOrderArray = rows.map((row) => {
      if (!row.sortOrder) maxSortOrder += 1

      return {
        ...row,
        sortOrder: row.sortOrder || maxSortOrder,
      }
    })
    let itemTypesArray = []
    visitOrderTemplateItemTypes.forEach((type) => {
      const currentTypeRows = assignedSortOrderArray.filter(
        (row) => row.type === type.id,
      )
      const updatedRows = currentTypeRows.map((row) => {
        const total = row.quantity * row.unitPrice
        const totalAftAdj = row.totalAftAdj ? row.totalAftAdj : total
        return {
          ...row,
          inventoryItemTypeFK: type.id,
          inventoryItemCode: row.code,
          inventoryItemName: row.name,
          total: total,
          totalAftAdj: totalAftAdj,  
          adjType: row.isExactAmount ? 'ExactAmount' : 'Percentage',
          [type.dtoName]: {
            ...row[type.dtoName],
            [type.itemFKName]: row.itemFK,
            isDeleted: row.isDeleted || false,
          },
        }
      })
      itemTypesArray = [
        ...itemTypesArray,
        ...updatedRows,
      ]
    })

    const payload = {
      ...restValues,
      visitOrderTemplateItemDtos: itemTypesArray,
      effectiveStartDate: effectiveDates[0],
      effectiveEndDate: effectiveDates[1],
    }
    dispatch({
      type: 'settingVisitOrderTemplate/upsert',
      payload,
    }).then((r) => {
      if (r) {
        if (onConfirm) onConfirm()
        dispatch({
          type: 'settingVisitOrderTemplate/query',
        })
      }
    })
  },
  displayName: 'VisitOrderTemplateDetail',
})
class Detail extends PureComponent {
  componentWillUnmount () {
    this.props.dispatch({
      type: 'settingVisitOrderTemplate/reset',
    })
  }

  render () {
    const { theme, footer, values, handleSubmit } = this.props
    return (
      <Fragment>
        <div style={{ margin: theme.spacing(1) }}>
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={(args) => {
                  return (
                    <TextField
                      label='Code'
                      autoFocus
                      disabled={!!values.id}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='displayValue'
                render={(args) => {
                  return <TextField label='Display Value' {...args} />
                }}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='effectiveDates'
                render={(args) => {
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

          <InventoryItemList {...this.props} includeOrderSet />
          <p style={{ marginTop: 10 }}>
            * Inactive item(s) will not be added in the order list.
          </p>
        </div>
        {footer &&
          footer({
            onConfirm: handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: values.rows.some(x=>x.totalAftAdj < 0),
            },
          })}
      </Fragment>
    )
  }
}

export default Detail
