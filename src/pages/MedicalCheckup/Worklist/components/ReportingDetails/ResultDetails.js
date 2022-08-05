import React, { useState, useEffect } from 'react'
import { List } from 'antd'
import { useDispatch } from 'dva'
import ReactHtmlParser from 'react-html-parser'
import { withStyles } from '@material-ui/core'
import { createFromIconfontCN } from '@ant-design/icons'
import defaultSettings from '@/defaultSettings'
import ScribbleNote from '@/pages/Shared/ScribbleNote/ScribbleNote'
import { GridContainer, GridItem, CommonModal, Tooltip } from '@/components'

const styles = () => ({
  '.ant-list-header': {
    padding: '5px',
  },
})

const ResultDetails = props => {
  const { visitId, showResultDetails } = props
  const [data, setData] = useState([])
  const [loaded, setLoaded] = useState(false)
  const dispatch = useDispatch()
  let IconFont = createFromIconfontCN({
    scriptUrl: defaultSettings.iconfontUrl,
  })
  const [scribbleNoteSelectedData, setSribbleNoteSelectedData] = useState({})
  const [isShowScribbleNote, setIsShowScribbleNote] = useState(false)
  const base64Prefix = 'data:image/jpeg;base64,'
  useEffect(() => {
    if (!loaded && showResultDetails && visitId) {
      setLoaded(true)
      dispatch({
        type: 'workitem/getResultDetails',
        payload: { visitId: visitId },
      }).then(data => {
        setData(data)
      })
    }
  }, [showResultDetails])

  const scribbleLink = scribbleNotes => {
    if (!scribbleNotes) return null
    return scribbleNotes.map(o => {
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

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {data?.labResultDetails && (
        <List
          itemLayout='horizontal'
          header={
            <h4 style={{ fontWeight: 'bold', color: 'rgb(56, 158, 13)' }}>
              <IconFont
                style={{ position: 'relative', top: 1, marginRight: 6 }}
                type='icon-lab'
              />
              {`Lab Test (${data.labResultDetails.length})`}
            </h4>
          }
          className='resultDetails'
          size='small'
          dataSource={data.labResultDetails}
          renderItem={item => (
            <List.Item style={{ padding: 0 }}>
              <List.Item.Meta
                style={{ padding: '4px 8px' }}
                title={
                  <div>
                    <h5
                      style={{
                        fontWeight: 'bold',
                        color: '#4355be',
                        fontSize: '1.05em',
                      }}
                    >
                      {item.testPanel}
                    </h5>
                    <div>{`Last Verified By: ${item.verifiedBy}`}</div>
                  </div>
                }
                description={
                  <div style={{ paddingLeft: 10 }}>
                    {item.internalRemarks && (
                      <div style={{ color: 'black' }}>
                        <div
                          style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                          Internal Remarks:{' '}
                        </div>
                        <div
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {item.internalRemarks}
                        </div>
                      </div>
                    )}
                    {item.reportRemarks && (
                      <div style={{ color: 'black' }}>
                        <div
                          style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                          Report Remarks:
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {item.reportRemarks}
                        </span>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      {data?.radiologyResultDetails && (
        <List
          itemLayout='horizontal'
          header={
            <h4 style={{ fontWeight: 'bold', color: 'rgb(56, 158, 13)' }}>
              <IconFont
                style={{ position: 'relative', top: 1, marginRight: 6 }}
                type='icon-radiology'
              />
              {`Examination (${data.radiologyResultDetails.length})`}
            </h4>
          }
          className='resultDetails'
          size='small'
          dataSource={data.radiologyResultDetails}
          renderItem={item => (
            <List.Item style={{ padding: 0 }}>
              <List.Item.Meta
                style={{ padding: '4px 8px' }}
                title={
                  <div>
                    <h5
                      style={{
                        fontWeight: 'bold',
                        fontSize: '1.05em',
                        color: '#4355be',
                      }}
                    >
                      {item.serviceName}
                    </h5>
                    <div>{`Radiology Technologist: ${item.radiologyTechnologist}`}</div>
                  </div>
                }
                description={
                  <div style={{ paddingLeft: 10 }}>
                    {item.findings && (
                      <div style={{ color: 'black' }}>
                        <div
                          style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                          Findings:{' '}
                        </div>
                        <div style={{ display: 'inline-block' }}>
                          {ReactHtmlParser(item.findings)}
                          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {scribbleLink(item.scribbleNotes)}
                          </div>
                        </div>
                      </div>
                    )}
                    {item.examinationComments && (
                      <div style={{ color: 'black', marginTop: 20 }}>
                        <div
                          style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                          Examination Comments:
                        </div>
                        <span style={{ display: 'inline-block' }}>
                          {item.examinationComments}
                        </span>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
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
export default withStyles(styles, { name: 'ResultDetails' })(ResultDetails)
