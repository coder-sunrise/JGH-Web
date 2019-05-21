import {
  Button,
  CommonHeader,
  CommonModal,
  NavPills,
  PictureUpload,
  GridContainer,
  GridItem,
  Card,
  CardAvatar,
  CardBody,
  TextField,
  notification,
  Select,
  CodeSelect,
  DatePicker,
  RadioGroup,
  ProgressButton,
  CardContainer,
  confirm,
} from '@/components'
import Replay from '@material-ui/icons/Replay'
import Clear from '@material-ui/icons/Clear'

import { getUniqueGUID, getRemovedUrl, getAppendUrl } from '@/utils/utils'
console.log('util')
module.exports = {
  componentDidUpdate: (props, prevProps, cb = (f) => false) => {
    const { patient } = props
    // console.log(patient.entity, prevProps.values.id)
    if (patient.entity && (patient.entity.id !== prevProps.values.id || cb())) {
      props.resetForm(patient.entity)
    }
  },
  handleSubmit: (values, component) => {
    const { props, resetForm } = component
    // console.log(values)
    // return
    props
      .dispatch({
        type: 'patient/upsert',
        payload: values,
      })
      .then((r) => {
        // console.log(r)
        // console.debug(123)
        if (r) {
          notification.success({
            // duration:0,`
            message: r.id ? 'Created' : 'Saved',
          })

          if (r.id) {
            props.history.push(
              getRemovedUrl(
                [
                  'new',
                ],
                getAppendUrl({
                  pid: r.id,
                }),
              ),
            )
          } else {
            props
              .dispatch({
                type: 'patient/query',
                payload: {
                  id: props.patient.currentId,
                },
              })
              .then((value) => {
                console.log(value)
                resetForm(value)
              })
          }
          if (props.onConfirm) props.onConfirm()
        }
      })
  },

  getFooter: ({
    theme,
    handleSubmit,
    resetForm,
    resetable = true,
    values,
    dirty,
    touched,
    dispatch,
    history,
    extraBtn,
    disabled = Object.values(touched).length === 0 && !dirty,
  }) => (
    <div
      style={{
        position: 'relative',
        textAlign: 'center',
        marginTop: theme.spacing.unit * 2,
      }}
    >
      {values &&
      values.id &&
      resetable && (
        <Button
          // className={classes.modalCloseButton}
          key='reset'
          aria-label='Reset'
          color='danger'
          onClick={() => {
            resetForm()
          }}
          style={{ left: 0, position: 'absolute' }}
        >
          <Replay />
          Reset
        </Button>
      )}
      <Button
        // className={classes.modalCloseButton}
        key='cancel'
        aria-label='Cancel'
        color='danger'
        onClick={() => {
          const f = () => {
            dispatch({
              type: 'global/closePatientModal',
              history,
            })
          }
          if (!disabled) {
            confirm({
              title: 'Do you want to discard your changes?',
              onOk: f,
              onCancel () {},
            })
          } else {
            f()
          }
        }}
        style={{ marginRight: theme.spacing.unit }}
      >
        <Clear />
        Cancel
      </Button>
      <ProgressButton onClick={handleSubmit} disabled={disabled} />
      {extraBtn}
    </div>
  ),

  // setCurrentPatient: (props, setValues, cb) => {
  //   // eslint-disable-next-line no-undef
  //   props
  //     .dispatch({
  //       type: 'patient/query',
  //       payload: {
  //         id: props.patient.currentId,
  //       },
  //     })
  //     .then((value) => {
  //       // console.log(value)
  //       setValues(value)
  //       if (cb) cb()
  //     })
  // },
}
