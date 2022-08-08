import React, { PureComponent, Fragment } from 'react'
import _ from 'lodash'
import Yup from '@/utils/yup'
import { connect } from 'dva'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  CodeSelect,
  DateRangePicker,
} from '@/components'
import { InventoryItemList } from '@/components/_medisys'
import { visitOrderTemplateItemTypes } from '@/utils/codes'
import { CALENDAR_RESOURCE } from '@/utils/constants'
import CopayerDropdownOption from '@/components/Select/optionRender/copayer'

import { DoctorLabel } from '@/components/_medisys'
@connect(({ codetable }) => ({ codetable }))
@withFormikExtend({
  mapPropsToValues: ({ settingVisitOrderTemplate, codetable }) => {
    return {
      ...(settingVisitOrderTemplate.entity ||
        settingVisitOrderTemplate.default),
      selectedResources: _.concat(
        (
          settingVisitOrderTemplate.entity?.visitOrderTemplate_Resources || []
        ).map(x => x.resourceFK),
        settingVisitOrderTemplate.entity?.visitOrderTemplate_Resources
          ?.length === codetable?.ctresource?.length
          ? [-99]
          : [],
      ),
      selectedCopayers: _.concat(
        (
          settingVisitOrderTemplate.entity?.visitOrderTemplate_Copayers || []
        ).map(x => x.copayerFK),
        settingVisitOrderTemplate.entity?.visitOrderTemplate_Copayers
          ?.length === codetable?.ctcopayer?.length
          ? [-99]
          : [],
      ),
    }
  },
  validationSchema: Yup.object().shape({
    code: Yup.string().required(),
    displayValue: Yup.string().required(),
    effectiveDates: Yup.array()
      .of(Yup.date())
      .min(2)
      .required(),
  }),
  handleSubmit: (values, { props }) => {
    if (values.rows.some(x => !x.isDeleted && x.totalAftAdj < 0)) return
    const { effectiveDates, rows, tempSelectedItem, ...restValues } = values
    const { dispatch, onConfirm } = props

    const maxSortOrderObj = _.maxBy(rows, 'sortOrder') || {}
    let maxSortOrder = maxSortOrderObj.sortOrder || 0
    const assignedSortOrderArray = rows.map(row => {
      if (!row.sortOrder) maxSortOrder += 1

      return {
        ...row,
        sortOrder: row.sortOrder || maxSortOrder,
      }
    })
    let itemTypesArray = []
    visitOrderTemplateItemTypes.forEach(type => {
      const currentTypeRows = assignedSortOrderArray.filter(
        row => row.type === type.id,
      )
      const updatedRows = currentTypeRows.map(row => {
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
      itemTypesArray = [...itemTypesArray, ...updatedRows]
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
    }).then(r => {
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
  componentWillUnmount() {
    this.props.dispatch({
      type: 'settingVisitOrderTemplate/reset',
    })
  }

  handleCopayerChanges = copayers => {
    copayers = copayers.filter(v => v !== -99)
    const { setFieldValue } = this.props
    const {
      visitOrderTemplate_Copayers: originalVisitOrderTemplate_Copayers = [],
      id: id,
    } = this.props.initialValues

    const currentCopayers = copayers.map(t => {
      return {
        visitOrderTemplateFK: id,
        copayerFK: t,
        isDeleted: false,
        ...originalVisitOrderTemplate_Copayers.find(x => x.copayerFK === t),
      }
    })

    const deletedCopayers = originalVisitOrderTemplate_Copayers
      .filter(t => !copayers.includes(t.copayerFK))
      .map(t => {
        return { ...t, isDeleted: true }
      })

    setFieldValue('visitOrderTemplate_Copayers', [
      ...currentCopayers,
      ...deletedCopayers,
    ])
  }

  handleResourceChanges = resources => {
    resources = resources.filter(v => v !== -99)
    const { setFieldValue } = this.props
    const {
      visitOrderTemplate_Resources: originalVisitOrderTemplate_Resources = [],
      id: id,
    } = this.props.initialValues

    const currentResources = resources.map(t => {
      return {
        visitOrderTemplateFK: id,
        resourceFK: t,
        isDeleted: false,
        ...originalVisitOrderTemplate_Resources.find(x => x.resourceFK === t),
      }
    })

    const deletedResources = originalVisitOrderTemplate_Resources
      .filter(t => !resources.includes(t.resourceFK))
      .map(t => {
        return { ...t, isDeleted: true }
      })

    setFieldValue('visitOrderTemplate_Resources', [
      ...currentResources,
      ...deletedResources,
    ])
  }

  render() {
    const {
      theme,
      footer,
      values,
      handleSubmit,
    } = this.props
    return (
      <Fragment>
        <div
          style={{
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            margin: theme.spacing(1),
          }}
        >
          <GridContainer>
            <GridItem md={6}>
              <FastField
                name='code'
                render={args => {
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
                render={args => {
                  return <TextField label='Display Value' {...args} />
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
                name='selectedCopayers'
                render={args => (
                  <CodeSelect
                    {...args}
                    code='ctcopayer'
                    labelField='displayValue'
                    additionalSearchField='code'
                    disableAll
                    showOptionTitle={false}
                    renderDropdown={option => {
                      return (
                        <CopayerDropdownOption
                          option={option}
                        ></CopayerDropdownOption>
                      )
                    }}
                    mode='multiple'
                    maxTagCount={0}
                    label='Co-Payers'
                    onChange={v => {
                      this.handleCopayerChanges(v)
                    }}
                    isCheckedShowOnTop
                  />
                )}
              />
            </GridItem>
            <GridItem md={6}>
              <FastField
                name='selectedResources'
                render={args => (
                  <CodeSelect
                    {...args}
                    allValue={-99}
                    label='Resources'
                    labelField='displayValue'
                    mode='multiple'
                    localFilter={option => option.isActive}
                    code='ctresource'
                    valueField='id'
                    maxTagCount={0}
                    maxTagPlaceholder='resources'
                    onChange={v => {
                      this.handleResourceChanges(v)
                    }}
                  />
                )}
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
              disabled: values.rows.some(
                x => !x.isDeleted && x.totalAftAdj < 0,
              ),
            },
          })}
      </Fragment>
    )
  }
}

export default Detail
