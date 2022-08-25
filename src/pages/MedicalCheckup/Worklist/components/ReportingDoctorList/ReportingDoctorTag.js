import React, { useState } from 'react'
// material ui
import { Link } from 'umi'
import { withStyles } from '@material-ui/core'
import { useSelector, useDispatch } from 'dva'
import moment from 'moment'
import {
  Tooltip,
  Button,
  Popover,
  IconButton,
  MultipleTextField,
  dateFormatLongWithTimeNoSec,
} from '@/components'
import { CheckCircleOutlined } from '@ant-design/icons'
import {
  REPORTINGDOCTOR_STATUS,
  APPNOTIFICATION_SCHEMA,
} from '@/utils/constants'
import { Message } from '@material-ui/icons'
import { Tag } from 'antd'
import Authorized from '@/utils/Authorized'
import { AppNotificationPopover } from '@/components/_medisys'

const styles = theme => ({
  tag: {
    maxWidth: 120,
    margin: '1px 8px 1px 0px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '2px 6px',
    fontSize: 14,
  },
})

const ReportingDoctorTag = ({
  medicalCheckupDoctor,
  classes,
  isShowMessage = false,
  updateReportingDoctor = () => {},
  isEditEnable = true,
  medicalCheckupWorkitemId,
}) => {
  const [notifications, setNotifications] = useState([])
  const [newNotification, setNewNotification] = useState(undefined)
  const dispatch = useDispatch()
  const user = useSelector(st => st.user)
  let reportingDoctorColor = '#354497'
  if (
    medicalCheckupDoctor.status === REPORTINGDOCTOR_STATUS.COMMENTVERIFYING ||
    medicalCheckupDoctor.status === REPORTINGDOCTOR_STATUS.VERIFIED
  ) {
    reportingDoctorColor = '#008B00'
  }
  const isDoctor =
    user.data.clinicianProfile.userProfile.role?.clinicRoleFK === 1

  const getDoctorTag = () => {
    return (
      <div>
        <Tooltip title={medicalCheckupDoctor.name}>
          <Tag
            icon={
              medicalCheckupDoctor.status == REPORTINGDOCTOR_STATUS.VERIFIED ? (
                <CheckCircleOutlined />
              ) : (
                undefined
              )
            }
            className={classes.tag}
            style={{
              cursor: isShowMessage ? 'pointer' : 'default',
              color: reportingDoctorColor,
              border: `1px solid ${reportingDoctorColor}`,
            }}
          >
            {medicalCheckupDoctor.shortName || medicalCheckupDoctor.name}
          </Tag>
        </Tooltip>
      </div>
    )
  }

  const isRevertCommentEnable = () => {
    if (!isEditEnable) return false
    const revertCommentAccessRight = Authorized.check(
      'medicalcheckupworklist.revertcommenttodoctor',
    ) || {
      rights: 'hidden',
    }
    if (revertCommentAccessRight.rights !== 'enable') return false
    return (
      medicalCheckupDoctor.status &&
      medicalCheckupDoctor.status !== REPORTINGDOCTOR_STATUS.NEW
    )
  }

  const isVerifyCommentEnable = () => {
    if (!isEditEnable) return false
    const verifyCommentAccessRight = Authorized.check(
      'medicalcheckupworklist.markcommentasverified',
    ) || {
      rights: 'hidden',
    }
    if (verifyCommentAccessRight.rights !== 'enable') return false
    return true
  }

  const isMessageThreadEnable = () => {
    if (!isEditEnable) return false
    const modifyMessageThreadAccessRight = Authorized.check(
      'medicalcheckupworklist.modifymessagethread',
    ) || {
      rights: 'hidden',
    }
    if (modifyMessageThreadAccessRight.rights !== 'enable') return false
    return true
  }

  const exactControl = () => {
    return (
      <div style={{ marginTop: 6 }}>
        {isRevertCommentEnable() && (
          <Link style={{ display: 'inline-block' }}>
            <span
              style={{
                display: 'block',
                textDecoration: 'underline',
                marginRight: 10,
              }}
              onClick={e => {
                e.preventDefault()
                updateReportingDoctor(
                  medicalCheckupDoctor,
                  REPORTINGDOCTOR_STATUS.NEW,
                )
              }}
            >
              Revert Comment to Doctor
            </span>
          </Link>
        )}
        {medicalCheckupDoctor.status ===
          REPORTINGDOCTOR_STATUS.COMMENTVERIFYING &&
          isVerifyCommentEnable() && (
            <Link style={{ display: 'inline-block' }}>
              <span
                style={{
                  display: 'block',
                  textDecoration: 'underline',
                }}
                onClick={e => {
                  e.preventDefault()
                  updateReportingDoctor(
                    medicalCheckupDoctor,
                    REPORTINGDOCTOR_STATUS.VERIFIED,
                  )
                }}
              >
                Mark Comment as Verified
              </span>
            </Link>
          )}
      </div>
    )
  }
  return (
    <div
      style={{
        float: 'left',
      }}
    >
      {isShowMessage ? (
        <AppNotificationPopover
          dispatch={dispatch}
          source={APPNOTIFICATION_SCHEMA.MC.name}
          sourceRecordId={medicalCheckupWorkitemId}
          doctor={{
            userFK: medicalCheckupDoctor.userProfileFK,
            name: medicalCheckupDoctor.name,
          }}
          buttonProps={{ justIcon: true, style: { width: 24 } }}
          isMessageThreadEnable={isMessageThreadEnable()}
          exactControl={exactControl}
        >
          {getDoctorTag()}
        </AppNotificationPopover>
      ) : (
        getDoctorTag()
      )}
    </div>
  )
}
export default withStyles(styles, { name: 'ReportingDoctorTag' })(
  ReportingDoctorTag,
)
