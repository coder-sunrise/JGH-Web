import React from 'react'
import { formatMessage } from 'umi/locale'
import moment from 'moment'
import {
  dateFormatLong,
  dateFormatLongWithTimeNoSec,
  Field,
  FastField,
  RadioGroup,
  GridContainer,
  GridItem,
  NumberInput,
  Switch,
  Button,
} from '@/components'
import Edit from '@material-ui/icons/Edit'

const PatientNurseNotesContent = ({ canEdit, entity, handleEdit }) => {
  const { createDate, createByUserFullName = '', notes } = entity
  const formateDate = moment(createDate).format(dateFormatLongWithTimeNoSec)

  return (
    <React.Fragment>
      <div style={{ margin: '20px 20px 10px 10px', fontWeight: 'bold' }}>
        <span>{`${formateDate} - Nurse Notes - ${createByUserFullName}`}</span>
        {!canEdit ? (
          ''
        ) : (
          <Button
            style={{ marginLeft: 10 }}
            justIcon
            color='primary'
            size='sm'
            onClick={() => {
              handleEdit(entity)
            }}
          >
            <Edit />
          </Button>
        )}
      </div>
      <div style={{ paddingLeft: 20 }}>
        <textarea
          disabled='on'
          rows={notes.split('\n').length}
          value={notes}
          style={{
            width: '100%',
            border: 0,
            resize: 'none',
            background: 'transparent',
          }}
        />
      </div>
    </React.Fragment>
  )
}
export default PatientNurseNotesContent
