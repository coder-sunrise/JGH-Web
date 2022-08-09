import React, { PureComponent, Fragment } from 'react'
import { connect } from 'dva'
import { Drawer } from 'antd'
import { withStyles } from '@material-ui/core'
import {
  ChangePassword,
  SessionTimeout,
  CustomConfirm,
  ImageViewer,
  SystemMessageDetail,
} from '@/components/_medisys'
import { CommonModal, Button } from '@/components'
import PatientDetail from '@/pages/PatientDatabase/Detail'
import VisitRegistration from '@/pages/Reception/Queue/NewVisit'
// import Consultation from '@/pages/Consultation'
// import Dispense from '@/pages/Dispense'
// import Billing from '@/pages/Dispense/Billing'
import UserProfileForm from '@/pages/Setting/UserProfile/UserProfileForm'
import Adjustment from '@/pages/Shared/Adjustment'
import ReportModal from '@/pages/Widgets/ConsultationDocument/ReportModal'
import ReportingDetails from '@/pages/MedicalCheckup/Worklist/components/ReportingDetails'

const styles = () => ({
  patientModal: {
    // zIndex: '1390 !important',
  },
})

@connect(({ global, user, report, systemMessage }) => ({
  global,
  report,
  loggedInUserID: user.data && user.data.id,
  systemMessage,
}))
class GlobalModalContainer extends PureComponent {
  // componentDidMount () {
  //   const para = qs.parse(location.search)
  //   console.log(para)
  // }

  constructor(props) {
    super(props)
    this._timer = null
  }

  componentDidUpdate(preProps) {
    if (
      !preProps.global.showSessionTimeout &&
      this.props.global.showSessionTimeout === true
    ) {
      clearTimeout(this._timer)
      this._timer = setTimeout(() => {
        this.props.dispatch({
          type: 'login/logout',
        })
      }, 60000)
    }
  }

  closeUserProfile = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateAppState',
      payload: {
        showUserProfile: false,
      },
    })
    dispatch({
      type: 'user/saveProfileDetails',
      profileDetails: undefined,
    })
    dispatch({
      type: 'settingUserProfile/updateCurrentSelected',
      userProfile: {},
    })
  }

  closeSystemMessage = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateAppState',
      payload: {
        showSystemMessage: false,
      },
    })
  }

  closeVisitRegistration = () => {
    const { dispatch, global } = this.props
    dispatch({
      type: 'visitRegistration/closeModal',
    })
    if (!global.showMedicalCheckupReportingDetails) {
      dispatch({
        type: 'patient/updateState',
        payload: { entity: null },
      })
    }
  }

  closeConfirmationPrompt = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: false,
        openConfirmTitle: null,
        openConfirmContent: null,
        onConfirmDiscard: null,
        onSecondConfirm: null,
        onConfirmSave: null,
        // onConfirm: null,
        openConfirmText: 'Confirm',
        alignContent: undefined,
        additionalInfo: undefined,
        isInformType: undefined,
        onConfirmClose: undefined,
        customWidth: undefined,
      },
    })
  }

  render() {
    const {
      global,
      report,
      dispatch,
      loggedInUserID,
      classes,
      systemMessage: { entity = {} },
    } = this.props
    const { title = '' } = entity
    return (
      <div>
        <CommonModal
          title='Change Password'
          open={global.showChangePasswordModal}
          displayCloseIcon={false}
          onClose={() => {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                showChangePasswordModal: false,
              },
            })
          }}
          onConfirm={() => {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                showChangePasswordModal: false,
              },
            })
          }}
          maxWidth='sm'
        >
          <ChangePassword userID={loggedInUserID} />
        </CommonModal>

        <CommonModal
          // zIndex={1390}
          fullScreen
          // height='100%'
          title='Patient Profile'
          // placement='top'
          headerStyle={{
            textAlign: 'center',
          }}
          onClose={() => {
            dispatch({
              type: 'patient/closePatientModal',
              payload: {
                history: this.props.history,
              },
            })
          }}
          open={global.showPatientInfoPanel}
          // visible={global.showPatientInfoPanel}
          observe='PatientDetail'
        >
          {global.showPatientInfoPanel && <PatientDetail {...this.props} />}
        </CommonModal>

        <CommonModal
          // zIndex={1390}
          fullScreen
          // height='100%'
          title='Reporting Details'
          // placement='top'
          headerStyle={{
            textAlign: 'center',
          }}
          overrideLoading
          onClose={() => {
            dispatch({
              type:
                'medicalCheckupReportingDetails/closeMedicalCheckupReportingDetailsModal',
              payload: {
                history: this.props.history,
              },
            })
          }}
          open={global.showMedicalCheckupReportingDetails}
          observe='PatientProfile'
        >
          {global.showMedicalCheckupReportingDetails && (
            <ReportingDetails {...this.props} />
          )}
        </CommonModal>

        <CommonModal
          title={global.accountModalTitle}
          // title='My Account'
          open={global.showUserProfile}
          onClose={this.closeUserProfile}
          onConfirm={this.closeUserProfile}
          observe='UserProfile'
        >
          <UserProfileForm />
        </CommonModal>

        <CommonModal
          title={title}
          open={global.showSystemMessage}
          onClose={this.closeSystemMessage}
          onConfirm={this.closeSystemMessage}
          observe='SystemMessage'
        >
          <SystemMessageDetail {...this.props} />
        </CommonModal>

        <CommonModal
          overrideLoading
          open={global.showSessionTimeout}
          title='Session Timeout'
          maxWidth='sm'
          onClose={() => {
            this.props.dispatch({
              type: 'login/logout',
            })
          }}
          onConfirm={() => {
            clearTimeout(this._timer)
            dispatch({
              type: 'global/updateAppState',
              payload: {
                showSessionTimeout: false,
              },
            })
          }}
        >
          <SessionTimeout />
        </CommonModal>

        <CommonModal
          open={global.showVisitRegistration}
          title='Visit Registration'
          overrideLoading
          onClose={this.closeVisitRegistration}
          onConfirm={this.closeVisitRegistration}
          fullScreen
          observe='VisitRegistration'
        >
          <VisitRegistration history={this.props.history} />
        </CommonModal>

        <CommonModal
          autoFocus
          open={global.openConfirm}
          title={global.openConfirmTitle}
          cancelText={global.cancelText || 'Cancel'}
          maxWidth={global.customWidth || 'sm'}
          confirmText={global.openConfirmText || 'Confirm'}
          secondConfirmText={global.secondConfirmText || 'Pause'}
          isInformType={global.isInformType}
          footProps={{
            extraButtons: global.onConfirmDiscard ? (
              <Fragment>
                {global.showSecondConfirmButton ? (
                  <Button
                    color='primary'
                    onClick={() => {
                      if (global.onSecondConfirm) {
                        global.onSecondConfirm()
                      }
                      this.closeConfirmationPrompt()
                    }}
                  >
                    {global.secondConfirmText || 'Pause'}
                  </Button>
                ) : null}
                {!global.onConfirmSave ? (
                  // Will be confusing if onConfirmSave is not null, this button should be hidden
                  <Button
                    color='primary'
                    onClick={() => {
                      if (global.onConfirmDiscard) {
                        global.onConfirmDiscard()
                      }
                      this.closeConfirmationPrompt()
                    }}
                  >
                    {global.openConfirmText || 'Confirm'}
                  </Button>
                ) : null}
              </Fragment>
            ) : null,
            onConfirm: global.onConfirmSave
              ? () => {
                  global.onConfirmSave()
                  this.closeConfirmationPrompt()
                }
              : undefined,
          }}
          onClose={() => {
            global.onConfirmClose ? global.onConfirmClose() : null
            clearTimeout(this._timer)
            this.closeConfirmationPrompt()
          }}
          showFooter
        >
          <div style={{ textAlign: global.alignContent || 'center' }}>
            {typeof global.openConfirmContent === 'function' ? (
              <global.openConfirmContent />
            ) : (
              <h3>{global.openConfirmContent || 'Confirm to proceed?'}</h3>
            )}

            {global.additionalInfo}
          </div>
        </CommonModal>
        {report.reportTypeID && <ReportModal />}
        <ImageViewer />
        <CustomConfirm />
        <CommonModal
          open={global.openAdjustment}
          title={global.openAdjustmentTitle}
          cancelText='Cancel'
          maxWidth='sm'
          onClose={() => {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                openAdjustment: false,
                openAdjustmentConfig: undefined,
                openAdjustmentValue: undefined,
              },
            })
          }}
          onConfirm={() => {
            dispatch({
              type: 'global/updateAppState',
              payload: {
                openAdjustment: false,
                openAdjustmentConfig: undefined,
              },
            })
            if (global.onAdjustmentConfirm) {
              global.onAdjustmentConfirm()
            }
          }}
        >
          <Adjustment />
        </CommonModal>
      </div>
    )
  }
}
export default withStyles(styles, { name: 'GlobalModalContainer' })(
  GlobalModalContainer,
)
