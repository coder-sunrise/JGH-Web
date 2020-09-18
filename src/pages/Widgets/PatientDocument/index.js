import React, { Component } from 'react'
import { connect } from 'dva'
// material ui
import { withStyles } from '@material-ui/core'
// styles
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
// common components
import { FastField, Carousel, CommonModal } from '@/components'
import { Attachment } from '@/components/_medisys'
// sub components
import { findGetParameter } from '@/utils/utils'
import Filter from './Filter'
import Grid from './Grid'
// models
import model from './models'
import ImageItem from './ImageItem'

window.g_app.replaceModel(model)

const styles = (theme) => ({
  ...basicStyle(theme),
})

const getLargestSortOrder = (largestIndex, attachment) =>
  attachment.sortOrder > largestIndex ? attachment.sortOrder : largestIndex

@connect(({ patientAttachment }) => ({
  patientAttachment,
}))
class PatientDocument extends Component {
  state = {
    showImagePreview: false,
  }

  componentDidMount () {
    const { dispatch, values } = this.props
    dispatch({
      type: 'patientAttachment/query',
      payload: {
        'PatientProfileFKNavigation.Id': values.id,
      },
    })
  }

  updateAttachments = (args) => ({ added, deleted }) => {
    // console.log({ added, deleted }, args)
    const { dispatch, patientAttachment = [] } = this.props
    const { list = [] } = patientAttachment
    const { field } = args

    let updated = [
      ...(field.value || []),
    ]
    if (added)
      updated = [
        ...updated,
        ...added.map((file) => {
          const { 0: fileDetails, attachmentType } = file
          return {
            ...fileDetails,
            fileIndexFK: fileDetails.id,
            attachmentType,
          }
        }),
      ]

    if (deleted)
      updated = updated.reduce((attachments, item) => {
        if (
          (item.fileIndexFK !== undefined && item.fileIndexFK === deleted) ||
          (item.fileIndexFK === undefined && item.id === deleted)
        )
          return [
            ...attachments,
            { ...item, isDeleted: true },
          ]

        return [
          ...attachments,
          { ...item },
        ]
      }, [])
    const sorted = updated.sort((a, b) => {
      if (a.id > b.id) return 1
      if (a.id < b.id) return -1
      return 0
    })
    const startOrder = list.reduce(getLargestSortOrder, 0) + 1

    Promise.all(
      sorted.map((attachment, index) =>
        dispatch({
          type: 'patientAttachment/upsert',
          payload: {
            cfg: { message: 'Uploaded Attachment' },
            patientProfileFK: findGetParameter('pid'),
            sortOrder: startOrder + index,
            fileIndexFK: attachment.fileIndexFK,
          },
        }),
      ),
    )
      .then(() => {
        dispatch({
          type: 'patientAttachment/query',
        })
      })
      .catch((error) => {
        console.error({ error })
      })
  }

  onPreview = (file) => {
    this.setState({ showImagePreview: true, selectedFileId: file.fileIndexFK })
  }

  render () {
    const { patient: { entity }, patientAttachment } = this.props
    const { showImagePreview, selectedFileId } = this.state
    const patientIsActive = entity && entity.isActive

    const { list = [] } = patientAttachment
    const allFileIds = list.map((f) => {
      return f.fileIndexFK
    })

    return (
      <div>
        <Filter {...this.props} />
        <Grid {...this.props} onPreview={this.onPreview} />
        {patientIsActive && (
          <div style={{ float: 'left' }}>
            <FastField
              name='patientAttachment'
              render={(args) => {
                this.form = args.form

                return (
                  <Attachment
                    attachmentType='patientAttachment'
                    handleUpdateAttachments={this.updateAttachments(args)}
                    attachments={args.field.value}
                    label=''
                    // isReadOnly
                  />
                )
              }}
            />
          </div>
        )}
        <CommonModal
          open={showImagePreview}
          title='Patient Document Preview'
          onClose={() => this.setState({ showImagePreview: false })}
        >
          <ImageItem selectedFileId={selectedFileId} fileIds={allFileIds} />
        </CommonModal>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(PatientDocument)
