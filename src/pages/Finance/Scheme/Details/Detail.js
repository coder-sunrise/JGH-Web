import React, { useEffect } from 'react'
import { formatMessage } from 'umi/locale'
import { withStyles } from '@material-ui/core/styles'
import { Divider } from '@material-ui/core'
import { FastField } from 'formik'
import { compose } from 'redux'

import {
  CodeSelect,
  CardContainer,
  TextField,
  GridContainer,
  GridItem,
  Select,
  DatePicker,
  Switch,
} from '@/components'

const styles = () => ({})

const Detail = ({ schemeDetail, dispatch }) => {
  useEffect(() => {
    if (schemeDetail.currentId) {
      dispatch({
        type: 'schemeDetail/query',
        payload: {
          id: schemeDetail.currentId,
        },
      })
    }
  }, [])

  return (
    <CardContainer
      hideHeader
      style={{
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      <GridContainer gutter={0}>
        <GridItem xs={12} md={5}>
          <GridContainer>
            <GridItem xs={12}>
              <FastField
                name='code'
                render={(args) => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'finance.scheme.detail.code',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='displayValue'
                render={(args) => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'finance.scheme.detail.name',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='description'
                render={(args) => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'finance.scheme.detail.description',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='remarks'
                render={(args) => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'finance.scheme.detail.remarks',
                      })}
                      multiline
                      rowsMax='5'
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
          </GridContainer>
        </GridItem>
        <GridItem xs={12} md={2} />
        <GridItem xs={12} md={5}>
          <GridContainer>
            <GridItem xs={12}>
              <FastField
                name='schemeType'
                render={(args) => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'finance.scheme.detail.type',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='schemeCategory'
                render={(args) => {
                  return (
                    <TextField
                      label={formatMessage({
                        id: 'finance.scheme.detail.category',
                      })}
                      {...args}
                    />
                  )
                }}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='coPayer'
                render={(args) => (
                  <CodeSelect
                    label={formatMessage({
                      id: 'finance.scheme.detail.coPayer',
                    })}
                    code='ctcoPayer'
                    max={10}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='effectiveStartDate'
                render={(args) => (
                  <DatePicker
                    label={formatMessage({
                      id: 'finance.scheme.detail.effectiveStartDate',
                    })}
                    {...args}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <FastField
                name='effectiveEndDate'
                render={(args) => (
                  <DatePicker
                    label={formatMessage({
                      id: 'finance.scheme.detail.effectiveEndDate',
                    })}
                    {...args}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        </GridItem>
      </GridContainer>
      <Divider style={{ margin: '40px 0 20px 0' }} />
    </CardContainer>
  )
}
export default compose(
  withStyles(styles, { withTheme: true }),
  React.memo,
  // connect(({ schemeDetail }) => ({
  //   schemeDetail,
  // })),
)(Detail)
