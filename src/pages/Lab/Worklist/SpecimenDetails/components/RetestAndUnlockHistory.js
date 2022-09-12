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
  Radio,
  Table,
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
import { Description } from '@material-ui/icons'
import { dataReady } from '@syncfusion/ej2-react-schedule'
import { FlagIndicator } from '../../components'

export const RetestAndUnlockHistory = ({
  open,
  dataSource,
  onClose,
  onConfirm,
}) => {
  const [showModal, setShowModal] = useState(false)
  const cttestpanelitem = useCodeTable('cttestpanelitem')
  const [retestAndUnlockHistories, setRetestAndUnlockHistories] = useState([])
  const [isSelectedAnalyzerResult, setIsSelectedAnalyzerResult] = useState(null)
  const { entity: patient } = useSelector(s => s.patient)
  const dispatch = useDispatch()

  useEffect(() => {
    setShowModal(open)
    if (open && dataSource) {
      setRetestAndUnlockHistories(dataSource)
    }

    return () => {
      setRetestAndUnlockHistories([])
    }
  }, [dataSource])

  const columns = [
    {
      title: 'Test Panel Item',
      dataIndex: 'testPanelItemFK',
      key: 'testPanelItemFK',
      ellipsis: true,
      width: 150,
      render: (text, record) => {
        const testPanelItem = cttestpanelitem.find(
          item => item.id === record.testPanelItemFK,
        )?.displayValue
        return <span>{testPanelItem}</span>
      },
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      ellipsis: true,
      width: 150,
      render: (text, record, onSave) => {
        return record.shouldFlag ? (
          <React.Fragment>
            <span style={{ color: 'red' }}>{text}</span>
            <FlagIndicator />
          </React.Fragment>
        ) : (
          <span>{text}</span>
        )
      },
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      ellipsis: true,
      width: 100,
    },
  ]

  return (
    <CommonModal
      open={showModal}
      title='Result History'
      onClose={() => {
        setShowModal(false)
        onClose && onClose()
      }}
      footProps={{ onConfirm: undefined }}
      showFooter={true}
      maxWidth='sm'
    >
      <Space
        direction='vertical'
        size={50}
        style={{ height: 600, overflow: 'scroll', padding: 10 }}
      >
        {retestAndUnlockHistories.map(history => (
          <Space direction='vertical'>
            {!history.isUnlock && (
              <>
                <div>{`Sent to Retest by ${history.requestBy} at ${moment(
                  history.requestAt,
                ).format(dateFormatLongWithTimeNoSec)}`}</div>
                <div>{`Retest Reason: ${history.retestReason}`}</div>
              </>
            )}
            {history.isUnlock && (
              <>
                <div>{`Unlocked by ${history.requestBy} at ${moment(
                  history.requestAt,
                ).format(dateFormatLongWithTimeNoSec)}`}</div>
                <div>{`Unlock Reason: ${history.unlockReason}`}</div>
              </>
            )}
            {history.firstVerifier && (
              <div>{`First Verified by ${history.firstVerifier} at ${moment(
                history.firstVerifiedDate,
              ).format(dateFormatLongWithTimeNoSec)}`}</div>
            )}
            {history.secondVerifier && (
              <div>
                {`Second Verified by ${history.secondVerifier} at ${moment(
                  history.secondVerifiedDate,
                ).format(dateFormatLongWithTimeNoSec)}`}
              </div>
            )}
            {history.reportRemarks && (
              <div>{`Report Remarks: ${history.reportRemarks}`}</div>
            )}
            <Table
              bordered
              columns={columns}
              dataSource={history.resultsBefore}
              pagination={false}
              size='small'
            />
          </Space>
        ))}
      </Space>
    </CommonModal>
  )
}
