import React, { useState } from 'react'
import { Table } from 'antd'
import moment from 'moment'
// common components
import {
  notification,
  Checkbox,
  DocumentEditor,
  CommonModal,
} from '@/components'
import { formTypes, formStatus } from '@/utils/codes'
import tablestyles from './PatientHistoryStyle.less'
import CommonForm from '@/components/_medisys/Forms/CommonForm'
const printRow = row => {
  DocumentEditor.print({
    documentName: row.formName,
    document: JSON.parse(row.formData).content,
  })
}

export default ({ current }) => {
  let [isShowModal, setIsShowModal] = useState(false)
  let [formValue, setFormValue] = useState({})
  const { forms = [] } = current
  const [includeVoidForms, setIncludeVoidForms] = useState(false)
  return (
    <div>
      {/* <Checkbox
        label='Include voided forms'
        value={includeVoidForms}
        onChange={() => {
          setIncludeVoidForms(!includeVoidForms)
        }}
      /> */}
      <Table
        size='small'
        bordered
        pagination={false}
        columns={[
          {
            dataIndex: 'formName',
            title: 'Form',
            width: 200,
            render: (text, row) => (
              <a
                onClick={() => {
                  setIsShowModal(true)
                  setFormValue({ ...row, formData: JSON.parse(row.formData) })
                }}
              >
                {text}
              </a>
            ),
          },
          { dataIndex: 'updateByUser', title: 'Last Update By' },
          {
            dataIndex: 'lastUpdateDate',
            title: 'Last Update Time',
            render: (text, row) => (
              <span>{moment(row.lastUpdateDate).format('DD MMM YYYY')}</span>
            ),
          },
          {
            dataIndex: 'statusFK',
            title: 'Status',
            width: 200,
            render: (text, row) => {
              const status = formStatus.find(o => o.value === row.statusFK)
              return <span>{status ? status.name : ''}</span>
            },
          },
        ]}
        dataSource={
          includeVoidForms ? forms : forms.filter(o => o.statusFK !== 4)
        }
        rowClassName={(record, index) => {
          return index % 2 === 0 ? tablestyles.once : tablestyles.two
        }}
        className={tablestyles.table}
      />
      <CommonModal
        open={isShowModal}
        title='Form'
        onClose={() => {
          setIsShowModal(false)
        }}
        observe='Form'
        maxWidth='lg'
        bodyNoPadding
      >
        <CommonForm values={formValue} />
      </CommonModal>
    </div>
  )
}
