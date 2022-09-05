import React from 'react'
import { Field } from 'formik'
import {
  CardContainer,
  CodeSelect,
  CommonTableGrid,
  FastField,
  GridContainer,
  GridItem,
  TextField,
} from '@/components'
import { AttachmentWithThumbnail } from '@/components/_medisys'
import Authorized from '@/utils/Authorized'

export default ({
  updateAttachments,
  isReadOnly = false,
  attachment,
  editable = true,
}) => {
  const deleteExternalTrackingAttachmentRight = Authorized.check(
    'reception.viewexternaltracking.deleteattachment',
  ) || { rights: 'hidden' }
  const labtrackingEditableRight = Authorized.check(
    'reception/labtracking',
  ) || {
    rights: 'hidden',
  }
  return (
    <CardContainer hideHeader size='sm' style={{ margin: 0, width: '100%' }}>
      <Field
        name='remarks'
        render={args => (
          <TextField
            {...args}
            multiline
            rowsMax={3}
            maxLength={1000}
            label='Remarks'
            disabled={!editable}
          />
        )}
      />
      <AttachmentWithThumbnail
        label='Attachment'
        attachmentType='labTrackingResults'
        handleUpdateAttachments={updateAttachments}
        attachments={attachment}
        isReadOnly={
          !editable ||
          isReadOnly ||
          labtrackingEditableRight.rights !== 'enable'
        }
        hiddenDelete={
          !editable || deleteExternalTrackingAttachmentRight.rights !== 'enable'
        }
        hideRemarks
        fieldName='labTrackingResults'
      />
    </CardContainer>
  )
}
