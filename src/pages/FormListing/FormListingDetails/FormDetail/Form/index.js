import React, { PureComponent } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import moment from 'moment'
import Yup from '@/utils/yup'
import { FORM_CATEGORY, FORM_FROM } from '@/utils/constants'
import {
  GridContainer,
  withFormikExtend,
  Button,
  ProgressButton,
  notification,
} from '@/components'
import CommonForm from '@/components/_medisys/Forms/CommonForm/index'
import Authorized from '@/utils/Authorized'

@connect(({ formListing }) => ({
  formListing,
}))
@withFormikExtend({
  mapPropsToValues: ({ formListing, codetable }) => {
    let values = {}
    if (formListing.entity) {
      values = {
        ...formListing.entity,
      }
    } else {
      const { visitDetail = {} } = formListing
      const {
        patientName,
        doctorName,
        patientAccountNo,
        patientGender,
        patientDOB,
        patientAge,
        patientRefNo,
        todayDate,
      } = visitDetail
      const fillData = {
        patientName,
        doctorName,
        patientGender:
          patientGender === 'F'
            ? 'Female'
            : patientGender === 'M'
            ? 'Male'
            : 'Unknown',
        patientDOB: moment(patientDOB).format('DD MMM YYYY'),
        patientAge: `${patientAge}`,
        patientRefNo,
        patientNRIC: patientAccountNo,
        patientAccNo: patientAccountNo,
        genderMale: patientGender === 'M',
        genderFemale: patientGender === 'F',
        todayDate: moment(todayDate).format('DD MMM YYYY'),
      }
      values = {
        ...formListing.defaultForm,
        formName: formListing.formName,
        formData: { content: formListing.templateContent, signatureCounter: 0 },
        fillData,
        formTemplateFK: formListing.formTemplateFK,
      }
    }
    return values
  },
  // validationSchema: ({ formCategory }) => {
  //   return Yup.object().shape({
  //     formData: Yup.object().shape({}),
  //   })
  // },
  displayName: 'Form',
})
class Form extends PureComponent {
  onSubmitButtonClicked = async (action, skipConfirm) => {
    const {
      dispatch,
      onConfirm,
      getNextSequence,
      user,
      values,
      resetForm,
      formCategory,
      validateForm,
      formListing,
      formFrom,
    } = this.props
    const { visitDetail } = formListing
    const isFormValid = await validateForm()
    if (!_.isEmpty(isFormValid)) {
      this.props.handleSubmit()
    } else {
      if (action === 'finalize') {
        if (!(values.formData.signatureCounter > 0)) {
          notification.warning({
            message: `At least one signature is required.`,
          })
          return
        }
        if (!skipConfirm) {
          this.props.dispatch({
            type: 'global/updateAppState',
            payload: {
              openConfirm: true,
              openConfirmContent:
                'Signed form is not editable after Finalized. Confirm to proceed ?',
              openConfirmText: 'Confirm',
              onConfirmSave: () => this.onSubmitButtonClicked('finalize', true),
            },
          })
          return
        }
      }

      let nextSequence
      if (formFrom === FORM_FROM.QUEUELOG) {
        nextSequence = getNextSequence()
      }
      let saveData = {
        sequence: nextSequence,
        ...values,
        formData: JSON.stringify(values.formData),
        updateByUser: user.data.clinicianProfile.name,
      }
      if (action === 'submit') {
        saveData = {
          ...saveData,
          statusFK: 3,
          submissionDate: moment(),
          submissionByUserFK: user.data.clinicianProfile.id,
        }
      } else if (action === 'finalize') {
        saveData = {
          ...saveData,
          statusFK: 2,
          finalizeDate: moment(),
          finalizeByUserFK: user.data.clinicianProfile.id,
        }
      } else {
        saveData = {
          ...saveData,
          statusFK: 1,
        }
      }
      const { currentCORId, visitID } = visitDetail
      if (formCategory === FORM_CATEGORY.VISITFORM) {
        dispatch({
          type: 'formListing/saveVisitForm',
          payload: {
            ...saveData,
            visitID,
          },
        }).then(r => {
          if (r) {
            resetForm()
            if (onConfirm) onConfirm()
            this.props.dispatch({
              type: 'formListing/getVisitForms',
              payload: {
                id: formListing.visitID,
              },
            })
          }
        })
      } else {
        dispatch({
          type: 'formListing/saveCORForm',
          payload: {
            type: formListing.type,
            ...saveData,
            visitID,
            ClinicalObjectRecordFK:
              saveData.id && saveData.id > 0
                ? saveData.ClinicalObjectRecordFK
                : currentCORId,
            action,
          },
        }).then(r => {
          if (r) {
            resetForm()
            if (onConfirm) onConfirm()
            if (formFrom === FORM_FROM.FORMMODULE) {
              this.props.dispatch({
                type: 'formListing/query',
              })
            } else if (formFrom === FORM_FROM.QUEUELOG) {
              this.props.dispatch({
                type: 'formListing/getCORForms',
                payload: {
                  id: formListing.visitID,
                },
              })
            }
          }
        })
      }
    }
  }

  cancelForm = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render() {
    const { values, formCategory } = this.props
    const { statusFK } = values
    const modifyAR = Authorized.check('queue.consultation.form.modify')
    const finalizeAR = Authorized.check('queue.consultation.form.finalize')

    const isHiddenModify = modifyAR && modifyAR.rights !== 'enable'
    const isHiddenFinalize = finalizeAR && finalizeAR.rights !== 'enable'

    return (
      <div>
        <CommonForm {...this.props} />
        <GridContainer
          style={{
            marginTop: 20,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button color='danger' icon={null} onClick={this.cancelForm}>
            Close
          </Button>
          {formCategory === FORM_CATEGORY.VISITFORM && statusFK === 1 && !isHiddenModify && (
            // <Authorized authority='queue.consultation.form.modify'>
            <ProgressButton
              color='primary'
              icon={null}
              onClick={() => {
                this.onSubmitButtonClicked('save')
              }}
            >
              Save
            </ProgressButton>
            // </Authorized>
          )}
          {/*formCategory === FORM_CATEGORY.CORFORM && */ !isHiddenFinalize &&
            statusFK === 1 && (
              // <Authorized authority='queue.consultation.form.finalize'>
              <ProgressButton
                color='success'
                icon={null}
                onClick={() => {
                  this.onSubmitButtonClicked('finalize')
                }}
              >
                Finalize
              </ProgressButton>
              // </Authorized>
            )}

          {/* {formCategory === FORM_CATEGORY.CORFORM &&
            (statusFK === 1 || statusFK === 2) && (
              <Authorized authority='forms.submit'>
                <ProgressButton
                  color='success'
                  icon={null}
                  onClick={() => {
                    this.onSubmitButtonClicked('submit')
                  }}
                >
                  submit
                </ProgressButton>
              </Authorized>
            )} */}
        </GridContainer>
      </div>
    )
  }
}
export default Form
