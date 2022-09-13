import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'dva'
import moment from 'moment'
import {
  Space,
  Collapse,
  Checkbox,
  InputNumber,
  Descriptions,
  Form,
  Input,
} from 'antd'
import {
  dateFormatLongWithTimeNoSec,
  DatePicker,
  Select,
  CommonModal,
  NumberInput,
  TextField,
} from '@/components'
import { useCodeTable } from '@/utils/hooks'

export const UnlockSpecimen = ({
  open,
  unlockSpecimen = {},
  onClose,
  onConfirm,
  from,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [hasUnlockReason, setHasUnlockReason] = useState(false)
  const ctspecimentype = useCodeTable('ctspecimentype')
  const { entity: patient } = useSelector(s => s.patient)
  const dispatch = useDispatch()
  const [form] = Form.useForm()

  useEffect(() => {
    setShowModal(open)
    if (open && unlockSpecimen) {
      setHasUnlockReason(false)
      form.resetFields()
    }

    return () => {
      setHasUnlockReason(false)
      form.setFieldsValue({})
    }
  }, [unlockSpecimen])

  return (
    <CommonModal
      open={showModal}
      title='Unlock Specimen'
      footProps={{
        confirmProps: {
          disabled: !hasUnlockReason,
        },
      }}
      onClose={() => {
        setShowModal(false)
        onClose && onClose()
      }}
      onConfirm={() => {
        form.submit()
      }}
      showFooter={true}
      maxWidth='sm'
    >
      <div>
        <Descriptions
          title={
            <span style={{ fontWeight: 'normal' }}>
              Confirm to unlock the specimen below?
            </span>
          }
          labelStyle={{ width: 150 }}
          layout='horizontal'
          column={1}
          bordered
          size='small'
        >
          <Descriptions.Item label='Patient Name'>
            {patient?.name}
          </Descriptions.Item>
          <Descriptions.Item label='Patient Ref. No.'>
            {patient?.patientReferenceNo}
          </Descriptions.Item>

          <Descriptions.Item label='Accession No.'>
            {unlockSpecimen.accessionNo}
          </Descriptions.Item>
          <Descriptions.Item label='Specimen Type'>
            {
              ctspecimentype.find(
                item => item.id === unlockSpecimen.specimenTypeFK,
              )?.name
            }
          </Descriptions.Item>
        </Descriptions>
        <Form
          form={form}
          initialValues={{
            specimenUnlockReason: '',
          }}
          onFinish={({ specimenUnlockReason }) => {
            const payload = {
              ...unlockSpecimen,
              specimenUnlockReason,
              from,
            }

            dispatch({
              type: 'worklistSpecimenDetails/unlockSpecimen',
              payload,
            }).then(result => {
              if (result) {
                setShowModal(false)
                onConfirm && onConfirm()
              }
            })
          }}
        >
          <Form.Item
            name='specimenUnlockReason'
            style={{ margin: 8 }}
            rules={[{ required: true, message: 'Reason is required.' }]}
          >
            <TextField
              label='Reason'
              onChange={e =>
                setHasUnlockReason(e.target.value && e.target.value !== '')
              }
            />
          </Form.Item>
        </Form>
      </div>
    </CommonModal>
  )
}
