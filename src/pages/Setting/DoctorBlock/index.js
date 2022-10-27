import React, { PureComponent } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import $ from 'jquery'
import * as Yup from 'yup'
// material ui
import { withStyles } from '@material-ui/core'
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
// common component
import { CardContainer, CommonModal, withSettingBase } from '@/components'
import DoctorBlockForm from '@/pages/Reception/Appointment/components/form/DoctorBlock'
// medisys component
import { LoadingWrapper } from '@/components/_medisys'
// sub component
import Filter from './Filter'
import Grid from './Grid'

const styles = theme => ({
  ...basicStyle(theme),
})

const DoctorFormValidation = Yup.object().shape({
  doctorBlockUserFk: Yup.string().required(),
  durationHour: Yup.string().required(),
  durationMinute: Yup.string().required(),
  eventDate: Yup.string().required(),
  eventTime: Yup.string().required(),
})

@connect(({ doctorBlock, loading, global }) => ({
  doctorBlock,
  loading: loading.effects['doctorBlock/query'],
  mainDivHeight: global.mainDivHeight,
}))
@withSettingBase({ modelName: 'doctorBlock' })
class DoctorBlock extends PureComponent {
  state = {
    showModal: false,
  }

  toggleModal = () => {
    const { showModal } = this.state
    this.setState({
      showModal: !showModal,
    })
    showModal &&
      this.props.dispatch({
        type: 'doctorBlock/updateState',
        payload: {
          currentViewDoctorBlock: {},
        },
      })
  }

  handleEdit = id => {
    this.props
      .dispatch({
        type: 'doctorBlock/queryOne',
        payload: { id },
      })
      .then(response => {
        if (response) {
          this.props.dispatch({
            type: 'doctorBlock/getClinicOperationhour',
            payload: {
              apptDate: moment(response.doctorBlocks[0].startDateTime)
                .startOf('day')
                .formatUTC(),
            },
          })
          this.toggleModal()
        }
      })
  }

  confirmDelete = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'doctorBlock/delete',
      payload: { id, includeSeries: false },
    }).then(() => {
      dispatch({
        type: 'doctorBlock/query',
      })
    })
  }

  handleDelete = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: 'Delete this doctor block?',
        onConfirmSave: () => this.confirmDelete(id),
      },
    })
  }

  handleAfterSubmit = () => {
    this.props.dispatch({
      type: 'doctorBlock/query',
    })
  }

  render() {
    const { showModal } = this.state
    const { doctorBlock, loading, dispatch, mainDivHeight = 700 } = this.props
    let height =
      mainDivHeight - 120 - ($('.filterDoctorBlockBar').height() || 0)
    if (height < 300) height = 300
    return (
      <CardContainer hideHeader>
        <div className='filterDoctorBlockBar'>
          <Filter toggleModal={this.toggleModal} dispatch={dispatch} />
        </div>
        <LoadingWrapper loading={loading} text='Refreshing list...'>
          <Grid
            onEditClick={this.handleEdit}
            onDeleteClick={this.handleDelete}
            dataSource={doctorBlock.list}
            height={height}
          />
        </LoadingWrapper>
        <CommonModal
          open={showModal}
          observe='DoctorBlockForm'
          title='Doctor Block'
          maxWidth='md'
          bodyNoPadding
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
        >
          <DoctorBlockForm
            validationSchema={DoctorFormValidation}
            handleAfterSubmit={this.handleAfterSubmit}
          />
        </CommonModal>
      </CardContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(DoctorBlock)
