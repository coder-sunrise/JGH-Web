import React, { PureComponent } from 'react'
import moment from 'moment'
import { connect } from 'dva'
import Yup from '@/utils/yup'
import { Tabs, withFormikExtend } from '@/components'
import { Button } from 'antd'
import { LoadingWrapper } from '@/components/_medisys'
import { withStyles } from '@material-ui/core'
import Authorized from '@/utils/Authorized'
import { MEDICALCHECKUP_WORKITEM_STATUS } from '@/utils/constants'
import IndividualComment from './IndividualComment'
import SummaryComment from './SummaryComment'

const styles = theme => ({
  pendingVerifyCount: {
    marginLeft: 10,
    color: 'white',
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    display: 'inline-block',
  },
})
@connect(({ medicalCheckupReportingDetails, user, loading }) => ({
  medicalCheckupReportingDetails,
  user,
  loading,
}))
@withFormikExtend({
  mapPropsToValues: ({ medicalCheckupReportingDetails }) => {
    return medicalCheckupReportingDetails.entity || {}
  },
  validationSchema: Yup.object().shape({}),
  handleSubmit: (values, { props, resetForm }) => {
    const { dispatch, onConfirm } = props
    dispatch({
      type: 'medicalCheckupReportingDetails/upsert',
      payload: { ...values },
    }).then(r => {
      if (r) {
        onConfirm()
      }
    })
  },
  enableReinitialize: true,
  displayName: 'CommentVerification',
})
class CommentVerification extends PureComponent {
  getOptions = () => {
    const { values, classes } = this.props
    const {
      medicalCheckupIndividualComment = [],
      medicalCheckupSummaryComment = [],
    } = values
    const individualPendingVerifyCount = medicalCheckupIndividualComment.filter(
      item => !item.isVerified,
    ).length
    const summaryPendingVerifyCount = medicalCheckupSummaryComment.filter(
      item => !item.isVerified,
    ).length
    return [
      {
        id: 0,
        name: (
          <div>
            <span style={{ display: 'inline-block' }}>Individual Comment</span>
            {individualPendingVerifyCount > 0 && (
              <div className={classes.pendingVerifyCount}>
                {individualPendingVerifyCount}
              </div>
            )}
          </div>
        ),
        content: (
          <IndividualComment
            {...this.props}
            isEditEnable={this.getEditCommentEnable()}
          />
        ),
      },
      {
        id: 1,
        name: (
          <div>
            <span style={{ display: 'inline-block' }}>Summary Comment</span>
            {summaryPendingVerifyCount > 0 && (
              <div className={classes.pendingVerifyCount}>
                {summaryPendingVerifyCount}
              </div>
            )}
          </div>
        ),
        content: (
          <SummaryComment
            {...this.props}
            isEditEnable={this.getEditCommentEnable()}
          />
        ),
      },
    ]
  }

  isCommentVerificationEnable = () => {
    const commentVerificationAccessRight = Authorized.check(
      'medicalcheckupworklist.commentverification',
    ) || {
      rights: 'hidden',
    }
    if (commentVerificationAccessRight.rights === 'enable') return true
    return false
  }

  getEditCommentEnable = () => {
    const { medicalCheckupReportingDetails } = this.props
    const medicalCheckupstatus = medicalCheckupReportingDetails.entity?.statusFK
    return (
      medicalCheckupstatus !==
        MEDICALCHECKUP_WORKITEM_STATUS.PENDINGVERIFICATION &&
      medicalCheckupstatus !== MEDICALCHECKUP_WORKITEM_STATUS.COMPLETED &&
      medicalCheckupstatus !== MEDICALCHECKUP_WORKITEM_STATUS.DISCARDED &&
      this.isCommentVerificationEnable()
    )
  }

  render() {
    const {
      footer,
      values,
      handleSubmit,
      calendarResourcem,
      loading,
    } = this.props
    return (
      <LoadingWrapper loading={loading.models.medicalCheckupReportingDetails}>
        <Tabs options={this.getOptions()} defaultActiveKey='0' />
        {footer &&
          footer({
            onConfirm: handleSubmit,
            confirmBtnText: 'Save',
            confirmProps: {
              disabled: !this.getEditCommentEnable(),
            },
          })}
      </LoadingWrapper>
    )
  }
}
export default withStyles(styles, { name: 'CommentVerification' })(
  CommentVerification,
)
