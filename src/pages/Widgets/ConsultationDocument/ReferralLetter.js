import React, { Component, PureComponent } from 'react'
import { withFormik, Formik, Form, Field, FastField, FieldArray } from 'formik'

import {
  Button,
  GridContainer,
  GridItem,
  TextField,
  notification,
  Select,
  CodeSelect,
  DatePicker,
  RadioGroup,
  ProgressButton,
  CardContainer,
  confirm,
  Checkbox,
  SizeContainer,
  RichEditor,
} from '@/components'

class ReferralLetter extends PureComponent {
  render () {
    const { theme, classes, consultationDocument, rowHeight } = this.props
    console.log('ReferralLetter')
    return (
      <div>
        <GridContainer>
          <GridItem xs={6}>
            <FastField
              name='date'
              render={(args) => {
                return <DatePicker label='Date' {...args} />
              }}
            />
          </GridItem>
        </GridContainer>
        <GridContainer>
          <GridItem xs={6}>
            <FastField
              name='to'
              render={(args) => {
                return <TextField label='To' {...args} />
              }}
            />
          </GridItem>
          <GridItem xs={6}>
            <FastField
              name='from'
              render={(args) => {
                return <TextField disabled label='From' {...args} />
              }}
            />
          </GridItem>
          <GridItem xs={12}>
            <FastField
              name='address'
              render={(args) => {
                return (
                  <TextField label='Address' multiline rowsMax={3} {...args} />
                )
              }}
            />
          </GridItem>
          <GridItem xs={9}>
            <FastField
              name='subject'
              render={(args) => {
                return <TextField label='Subject' {...args} />
              }}
            />
          </GridItem>
          <GridItem
            xs={3}
            style={{ lineHeight: rowHeight, textAlign: 'right' }}
          >
            <Button color='info'>Load Template</Button>
          </GridItem>
          <GridItem xs={12} className={classes.editor}>
            <Button link className={classes.editorBtn}>
              Add Diagnosis
            </Button>
            <RichEditor />
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}
export default ReferralLetter
