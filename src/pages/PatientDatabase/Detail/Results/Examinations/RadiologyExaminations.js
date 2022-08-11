import ReactHtmlParser from 'react-html-parser'
import { Descriptions, Empty } from 'antd'
import { VisitTypeTag } from '@/components/_medisys'
import _ from 'lodash'
import { Collapse } from 'antd'
import React, { useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import { RadiologyStatusTag } from '@/pages/Radiology/Components/RadiologyStatusTag'
import moment from 'moment'
import ScribbleNote from '@/pages/Shared/ScribbleNote/ScribbleNote'
import { GridContainer, GridItem, CommonModal, Tooltip } from '@/components'
const { Panel } = Collapse
const styles = theme => ({})
const RadiologyExaminations = props => {
  const { data } = props
  const [scribbleNoteSelectedData, setSribbleNoteSelectedData] = useState({})
  const [isShowScribbleNote, setIsShowScribbleNote] = useState(false)
  const base64Prefix = 'data:image/jpeg;base64,'
  const genExtra = radiology => (
    <div>
      Visit Date:{' '}
      <span
        style={{
          display: 'inline-block',
          marginLeft: 5,
          marginRight: 10,
        }}
      >
        {moment(radiology.visitDate).format('DD MMM YYYY')}
      </span>
      <VisitTypeTag type={radiology.visitTypeFK}></VisitTypeTag>
      <RadiologyStatusTag statusId={radiology.status}></RadiologyStatusTag>
    </div>
  )

  const scribbleLink = scribbleNotes => {
    if (!scribbleNotes) return null
    const scribbleNotesArr = JSON.parse(scribbleNotes)
    return scribbleNotesArr.map(o => {
      let src
      if (o.thumbnail && o.thumbnail !== '') {
        src = `${base64Prefix}${o.thumbnail}`
      }
      return (
        <div
          style={{
            marginRight: 10,
            fontSize: '0.85rem',
          }}
        >
          <Tooltip title={o.subject}>
            <span
              style={{
                width: 277,
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                overflow: 'hidden',
              }}
            >
              {o.subject}
            </span>
          </Tooltip>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #CCCCCC',
              width: 277,
              height: 152,
              cursor: 'pointer',
            }}
            onClick={() => {
              viewScribbleNote(o)
            }}
          >
            {src ? (
              <img src={src} alt={o.subject} width={275} height={150} />
            ) : (
              <span>No Image</span>
            )}
          </div>
        </div>
      )
    })
  }

  const viewScribbleNote = scribbleNote => {
    setSribbleNoteSelectedData(scribbleNote)
    setIsShowScribbleNote(true)
    window.g_app._store.dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        isReadonly: true,
        entity: scribbleNote,
      },
    })
  }
  const toggleScribbleModal = () => {
    setIsShowScribbleNote(false)
    window.g_app._store.dispatch({
      type: 'scriblenotes/updateState',
      payload: {
        isReadonly: false,
      },
    })
  }

  const hasData = data && data.length > 0
  return (
    <div>
      {hasData && (
        <Collapse
          defaultActiveKey={[_.take(data)]}
          className='noPaddingCollapse'
        >
          {data.map(radiology => {
            const { doctorName = '', doctorTitle = '' } = radiology
            const visitDoctor = `${
              doctorTitle.trim().length ? doctorTitle + '. ' : ''
            }${doctorName}`
            return (
              <Panel
                header={radiology.name}
                key={radiology.id}
                extra={genExtra(radiology)}
              >
                <Descriptions
                  bordered
                  size='small'
                  className='radiologyDescription'
                >
                  <Descriptions.Item
                    label='Technologist:'
                    labelStyle={{ width: 150, verticalAlign: 'top' }}
                    span={2}
                  >
                    {radiology.technologist ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Visit Doctor:'
                    labelStyle={{ width: 160, verticalAlign: 'top' }}
                    contentStyle={{ width: 400 }}
                  >
                    {visitDoctor}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Accession No.:'
                    contentStyle={{ width: 200 }}
                    labelStyle={{ verticalAlign: 'top' }}
                  >
                    {radiology.accesionNo ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Order Created Date:'
                    labelStyle={{ width: 180, verticalAlign: 'top' }}
                    contentStyle={{ width: 400 }}
                  >
                    {moment(radiology.orderDate).format('DD MMM YYYY HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label='Modality:'>
                    {radiology.modality ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Priority:'
                    labelStyle={{ verticalAlign: 'top' }}
                  >
                    {radiology.priority ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Doctor Instructions:'
                    labelStyle={{ verticalAlign: 'top' }}
                  >
                    {radiology.doctorInstruction ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Doctor Remarks:'
                    labelStyle={{ verticalAlign: 'top' }}
                  >
                    {radiology.doctorRemarks ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Technologist Comment:'
                    labelStyle={{ verticalAlign: 'top' }}
                    span={3}
                  >
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                      {radiology.radiographerComment ?? '-'}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label='Findings:'
                    span={3}
                    labelStyle={{ verticalAlign: 'top' }}
                  >
                    {ReactHtmlParser(radiology.findings ?? '-')}
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {scribbleLink(radiology.scribblenote)}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Panel>
            )
          })}
        </Collapse>
      )}
      {!hasData && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}

      <CommonModal
        open={isShowScribbleNote}
        title='Scribble'
        fullScreen
        bodyNoPadding
        observe='ScribbleNotePage'
        onClose={toggleScribbleModal}
      >
        <ScribbleNote
          {...props}
          toggleScribbleModal={toggleScribbleModal}
          scribbleData={scribbleNoteSelectedData}
        />
      </CommonModal>
    </div>
  )
}
export default withStyles(styles, {
  name: 'RadiologyExaminations',
  withTheme: true,
})(RadiologyExaminations)
