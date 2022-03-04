import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { connect } from 'dva'
import { compose } from 'redux'
import moment from 'moment'
import { withStyles } from '@material-ui/core'
import { Table } from 'antd'
import { dateFormatLongWithTimeNoSec, Button, Tooltip } from '@/components'
import {
  CheckOutlined,
  PrinterOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons'
import { hasValue } from '@/pages/Widgets/PatientHistory/config'
import { MEDICALCHECKUP_REPORTSTATUS } from '@/utils/constants'
import customtyles from '../Style.less'

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
  const {
    loading,
    patient,
    medicalCheckupReportingDetails,
    dispatch,
    user,
    onClose,
    refreshMedicalCheckup,
    classes,
  } = props
  const height = window.innerHeight
  const verifyReport = row => {
    dispatch({
      type: 'medicalCheckupReportingDetails/verifyReport',
      payload: {
        ...row,
      },
    }).then(r => {
      refreshMedicalCheckup()
    })
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
              title: <div className={classes.cell}>Generate By User</div>,
              render: (text, row) => {
                const name = `${
                  hasValue(row.generateByUserTitle) &&
                  row.generateByUserTitle.trim().length
                    ? `${row.generateByUserTitle}.`
                    : ''
                }${row.generateByUser}`
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
              title: <div className={classes.cell}>Verify By User</div>,
              render: (text, row) => {
                const name = `${
                  hasValue(row.verifyByUserTitle) &&
                  row.verifyByUserTitle.trim().length
                    ? `${row.verifyByUserTitle}.`
                    : ''
                }${row.verifyByUser || ''}`
                return <div className={classes.cell}>{name}</div>
              },
            },
            {
              dataIndex: 'action',
              width: 105,
              title: <div className={classes.cell}>Action</div>,
              render: (text, row, index) => {
                return (
                  <div className={classes.cell}>
                    {row.status === MEDICALCHECKUP_REPORTSTATUS.VERIFIED && (
                      <Tooltip title='Verified'>
                        <Button color='success' size='sm' justIcon>
                          <CheckOutlined />
                        </Button>
                      </Tooltip>
                    )}
                    {index === 0 &&
                      row.status !== MEDICALCHECKUP_REPORTSTATUS.VERIFIED && (
                        <Tooltip title='To do'>
                          <Button
                            color='primary'
                            size='sm'
                            justIcon
                            onClick={() => {
                              verifyReport(row)
                            }}
                          >
                            <span className={classes.toDo}>TD</span>
                          </Button>
                        </Tooltip>
                      )}
                    <Tooltip title='Print'>
                      <Button color='primary' size='sm' justIcon>
                        <PrinterOutlined />
                      </Button>
                    </Tooltip>
                    <Tooltip title='Download'>
                      <Button color='primary' size='sm' justIcon>
                        <CloudDownloadOutlined />
                      </Button>
                    </Tooltip>
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
      <div style={{ textAlign: 'right' }}>
        <Button size='sm' color='danger' onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

export default compose(
  withStyles(styles),
  connect(({ medicalCheckupReportingDetails }) => ({
    medicalCheckupReportingDetails,
  })),
)(ReportHistory)
