import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { connect } from 'dva'
import { compose } from 'redux'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import { Table } from 'antd'
import {
  dateFormatLongWithTimeNoSec,
  Button,
  Tooltip,
  Popconfirm,
  CommonModal,
  dateFormatLong,
} from '@/components'
import Print from '@material-ui/icons/Print'
import Undo from '@material-ui/icons/Undo'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
import {
  MEDICALCHECKUP_REPORTSTATUS,
  MEDICALCHECKUP_WORKITEM_STATUS,
} from '@/utils/constants'
import withWebSocket from '@/components/Decorator/withWebSocket'
import { commonDataReaderTransform } from '@/utils/utils'
import { getReportContext } from '@/services/report'
import { getMedicalCheckupReportPayload } from '@/pages/MedicalCheckup/Worklist/components/Util'
import Authorized from '@/utils/Authorized'
import VerifyForm from './VerifyForm'
import customtyles from '../../Style.less'

const styles = theme => ({
  cell: {
    padding: 4,
  },
  toDo: {
    fontSize: 12,
    lineHeight: '17px',
    width: 17,
    textAlign: 'center',
  },
})

const ReportHistory = props => {
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [verifyRow, setVerifyRow] = useState(false)

  const {
    patient,
    medicalCheckupReportingDetails,
    dispatch,
    user,
    onClose,
    refreshMedicalCheckup,
    classes,
    handlePreviewReport,
  } = props
  const height = window.innerHeight
  const updateReportStatus = (row, status, verifyRemarks) => {
    dispatch({
      type: 'medicalCheckupReportingDetails/updateReportStatus',
      payload: {
        ...row,
        status,
        verifyRemarks,
      },
    }).then(r => {
      refreshMedicalCheckup()
    })
  }

  const onVerificationSave = value => {
    updateReportStatus(verifyRow, value.status, value.verifyRemarks)
    setShowVerifyForm(false)
  }

  const userProfileFK = user.data.clinicianProfile.userProfile.id

  const printReport = async row => {
    dispatch({
      type: 'medicalCheckupReportingDetails/queryReportData',
      payload: {
        id: row.id,
      },
    }).then(response => {
      if (response && response.status === '200') {
        const payload = getMedicalCheckupReportPayload(response.data)
        handlePreviewReport(JSON.stringify(payload))
      }
    })
  }

  const isVerifyEnable = () => {
    const reportingStatus = medicalCheckupReportingDetails.entity?.statusFK
    if (reportingStatus === MEDICALCHECKUP_WORKITEM_STATUS.DISCARDED)
      return false
    const verifyReportAccessRight = Authorized.check(
      'medicalcheckupworklist.verifyreport',
    ) || {
      rights: 'hidden',
    }
    if (verifyReportAccessRight.rights === 'enable') return true
    return false
  }
  return (
    <div style={{ padding: '0px 8px' }}>
      <div style={{ height: height - 270 }}>
        <Table
          size='small'
          bordered
          pagination={false}
          dataSource={
            medicalCheckupReportingDetails.entity.medicalCheckupReport
          }
          columns={[
            {
              dataIndex: 'reportType',
              width: 130,
              title: <div className={classes.cell}>Type</div>,
              render: (text, row) => {
                return <div className={classes.cell}>{row.reportType}</div>
              },
            },
            {
              dataIndex: 'versionNumber',
              width: 70,
              align: 'center',
              title: <div className={classes.cell}>Version</div>,
              render: (text, row) => {
                return <div className={classes.cell}>{row.versionNumber}</div>
              },
            },
            {
              dataIndex: 'generateDate',
              width: 130,
              title: <div className={classes.cell}>Generate Date</div>,
              render: (text, row) => {
                return (
                  <div className={classes.cell}>
                    {moment(row.generateDate).format(
                      dateFormatLongWithTimeNoSec,
                    )}
                  </div>
                )
              },
            },
            {
              dataIndex: 'generateByUser',
              width: 160,
              title: <div className={classes.cell}>Generate By</div>,
              render: (text, row) => {
                const name = row.generateByUser || ''
                return <div className={classes.cell}>{name}</div>
              },
            },
            {
              dataIndex: 'verifyDate',
              width: 130,
              title: <div className={classes.cell}>Verify Date</div>,
              render: (text, row) => {
                return (
                  <div className={classes.cell}>
                    {row.verifyDate
                      ? moment(row.verifyDate).format(
                          dateFormatLongWithTimeNoSec,
                        )
                      : ''}
                  </div>
                )
              },
            },
            {
              dataIndex: 'verifyByUser',
              width: 160,
              title: <div className={classes.cell}>Verify By</div>,
              render: (text, row) => {
                const name = row.verifyByUser || ''
                return <div className={classes.cell}>{name}</div>
              },
            },
            {
              dataIndex: 'verifyRemarks',
              title: <div className={classes.cell}>Remarks</div>,
              render: (text, row) => {
                return row.status ===
                  MEDICALCHECKUP_REPORTSTATUS.PENDINGVERIFY ? (
                  ''
                ) : (
                  <div
                    className={classes.cell}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {row.verifyRemarks || '-'}
                  </div>
                )
              },
            },
            {
              dataIndex: 'status',
              width: 130,
              align: 'center',
              title: <div className={classes.cell}>Verification Status</div>,
              render: (text, row) => {
                return (
                  <div className={classes.cell} style={{ fontStyle: 'italic' }}>
                    {row.status}
                  </div>
                )
              },
            },
            {
              dataIndex: 'action',
              width: 80,
              title: <div className={classes.cell}>Action</div>,
              render: (text, row, index) => {
                return (
                  <div className={classes.cell}>
                    {row.status !== MEDICALCHECKUP_REPORTSTATUS.REJECT && (
                      <Tooltip title='Print'>
                        <Button
                          color='primary'
                          size='sm'
                          justIcon
                          onClick={() => printReport(row)}
                        >
                          <Print />
                        </Button>
                      </Tooltip>
                    )}
                    {isVerifyEnable() &&
                      row.status ===
                        MEDICALCHECKUP_REPORTSTATUS.PENDINGVERIFY && (
                        <Tooltip title='To do'>
                          <Button
                            color='primary'
                            size='sm'
                            justIcon
                            onClick={() => {
                              setVerifyRow(row)
                              setShowVerifyForm(true)
                            }}
                          >
                            <span className={classes.toDo}>TD</span>
                          </Button>
                        </Tooltip>
                      )}
                  </div>
                )
              },
            },
          ]}
          scroll={{ y: height - 300 }}
          rowClassName={(record, index) => {
            return index % 2 === 0 ? customtyles.once : customtyles.two
          }}
          className={customtyles.table}
        ></Table>
      </div>
      <div style={{ textAlign: 'right', marginTop: 6 }}>
        <Button size='sm' color='danger' onClick={onClose}>
          Close
        </Button>
      </div>
      <CommonModal
        open={showVerifyForm}
        title='Report Verification'
        onClose={() => {
          setShowVerifyForm(false)
        }}
        maxWidth='sm'
        observe='VerifyForm'
      >
        <VerifyForm onVerificationSave={onVerificationSave} />
      </CommonModal>
    </div>
  )
}

export default withWebSocket()(
  compose(
    withStyles(styles),
    connect(({ medicalCheckupReportingDetails, user }) => ({
      medicalCheckupReportingDetails,
      user,
    })),
  )(ReportHistory),
)
