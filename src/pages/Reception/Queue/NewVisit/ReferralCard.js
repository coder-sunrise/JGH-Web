import React, { PureComponent } from 'react'
// formik
import { Field } from 'formik'
// custom components
import {
  CommonCard,
  DatePicker,
  TextField,
  GridContainer,
  GridItem,
} from '@/components'
import { Attachment } from '@/components/_medisys'
import FormField from './formField'

class ReferralCard extends PureComponent {
  render () {
    const { attachments, handleUpdateAttachments, isReadOnly } = this.props

    return (
      <CommonCard title='Referral'>
        <GridContainer>
          <GridItem xs md={4}>
            <Field
              name={FormField['referral.referralPersonFK']}
              render={(args) => (
                <TextField
                  {...args}
                  disabled={isReadOnly}
                  label='Referred By'
                />
              )}
            />
          </GridItem>
          <GridItem xs md={4}>
            <Field
              name={FormField['referral.referralDate']}
              render={(args) => (
                <DatePicker
                  {...args}
                  disabled={isReadOnly}
                  label='Referral Date'
                />
              )}
            />
          </GridItem>
          <GridItem xs md={4} />
          <GridItem xs md={4}>
            <Field
              name={FormField['referral.referralCompanyFK']}
              render={(args) => (
                <TextField
                  label='Institution'
                  disabled={isReadOnly}
                  {...args}
                />
              )}
            />
          </GridItem>
          <GridItem xs md={8} />
          <GridItem xs md={12}>
            <Attachment
              attachmentType='VisitReferral'
              handleUpdateAttachments={handleUpdateAttachments}
              attachments={attachments}
              isReadOnly={isReadOnly}
            />
          </GridItem>
        </GridContainer>
      </CommonCard>
    )
  }
}

export default ReferralCard
