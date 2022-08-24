import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import {
  Tooltip,
  GridContainer,
  GridItem,
  notification,
  dateFormatLongWithTimeNoSec,
  CommonModal,
  Popconfirm,
  Button,
} from '@/components'
import { Delete } from '@material-ui/icons'
import { PATIENT_LAB } from '@/utils/constants'
import moment from 'moment'
import Authorized from '@/utils/Authorized'
import { Table } from 'antd'
import { useDispatch } from 'dva'
import { Link } from 'umi'
import { getFileByFileID } from '@/services/file'
import { arrayBufferToBase64 } from '@/components/_medisys/ReportViewer/utils'
import printJS from 'print-js'
import ImagePreviewer from '@/pages/Widgets/AttachmentDocument/FolderContainer/ImagePreviewer'
import customtyles from '../../Style.less'
import Detail from '@/pages/Widgets/LabTrackingDetails/Detail'
import { Attachment } from '@/components/_medisys'

const ExternalService = props => {
  const { height, medicalCheckupReportingDetails, labTrackingDetails } = props
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedFile, setSelectedFile] = useState({})
  const [dataSource, setDataSource] = useState([])
  const dispatch = useDispatch()
  useEffect(() => {
    if (medicalCheckupReportingDetails.visitID) {
      queryExternalService()
    }
  }, [medicalCheckupReportingDetails.visitID])

  const queryExternalService = () => {
    dispatch({
      type: 'medicalCheckupReportingDetails/queryExternalService',
      payload: {
        apiCriteria: {
          visitFK: medicalCheckupReportingDetails.visitID,
        },
      },
    }).then(r => {
      if (r && r.status === '200') setDataSource(r.data.data)
    })
  }

  const toggleModal = () => {
    dispatch({
      type: 'labTrackingDetails/updateState',
      payload: {
        showModal: false,
      },
    })
  }

  const toggleModalAndRefresh = () => {
    dispatch({
      type: 'labTrackingDetails/updateState',
      payload: {
        showModal: false,
      },
    })
    queryExternalService()
  }

  const onPreview = file => {
    const fileExtension = (file.fileExtension || '').toUpperCase()
    if (fileExtension === 'PDF') {
      getFileByFileID(file.fileIndexFK).then(response => {
        const { data } = response
        const base64Result = arrayBufferToBase64(data)
        printJS({ printable: base64Result, type: 'pdf', base64: true })
      })
    } else if (['JPG', 'JPEG', 'PNG', 'BMP', 'GIF'].includes(fileExtension)) {
      dispatch({
        type: 'imageViewer/updateState',
        payload: {
          attachment: file,
        },
      })
    }
  }
  return (
    <React.Fragment>
      <div>
        <Table
          size='small'
          bordered
          pagination={false}
          dataSource={dataSource}
          onRow={r => {
            return {
              onDoubleClick: () => {
                dispatch({
                  type: 'labTrackingDetails/queryOne',
                  payload: {
                    id: r.id,
                  },
                }).then(entity => {
                  if (entity) {
                    dispatch({
                      type: 'labTrackingDetails/updateState',
                      payload: {
                        showModal: true,
                        entity: entity,
                      },
                    })
                  } else {
                    notification.error({
                      message: 'Get external tracking details failed.',
                    })
                  }
                })
              },
            }
          }}
          columns={[
            {
              dataIndex: 'serviceName',
              title: <div style={{ padding: 4 }}>Service</div>,
              render: (text, row) => <div style={{ padding: 4 }}>{text}</div>,
            },
            {
              dataIndex: 'serviceCenterName',
              title: <div style={{ padding: 4 }}>Service Center</div>,
              render: (text, row) => <div style={{ padding: 4 }}>{text}</div>,
              width: 180,
            },
            {
              dataIndex: 'result',
              title: <div style={{ padding: 4 }}>Attachment</div>,
              width: 250,
              render: (text, row) => (
                <div style={{ padding: 4 }}>
                  {row.labTrackingResults && (
                    <Attachment
                      label='Attachment'
                      attachments={row.labTrackingResults}
                      isReadOnly={true}
                      hideRemarks
                      listOnly={true}
                      simple
                      hiddenDelete
                      fieldName='labTrackingResults'
                    />
                  )}
                </div>
              ),
            },
            {
              dataIndex: 'updateDate',
              title: <div style={{ padding: 4 }}>Last Updated Date</div>,
              width: 150,
              render: (text, row) => (
                <div style={{ padding: 4 }}>
                  {moment(row.updateDate).format(dateFormatLongWithTimeNoSec)}
                </div>
              ),
            },
            {
              dataIndex: 'status',
              title: <div style={{ padding: 4 }}>Status</div>,
              width: 80,
              render: (text, row) => <div style={{ padding: 4 }}>{text}</div>,
            },
            {
              dataIndex: 'action',
              title: <div style={{ padding: 4 }}>Action</div>,
              width: 60,
              align: 'center',
              render: (text, row) => (
                <Authorized authority='reception.viewexternaltracking.delete'>
                  {row.labTrackingResults &&
                  row.labTrackingResults.length > 0 ? (
                    <Button
                      justIcon
                      size='sm'
                      color='danger'
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        notification.error({
                          message: 'Record with attachment cannot be deleted.',
                        })
                      }}
                    >
                      <Delete />
                    </Button>
                  ) : (
                    <Popconfirm
                      title='Confirm to delete?'
                      onConfirm={() => {
                        dispatch({
                          type: 'labTrackingDetails/delete',
                          payload: {
                            id: row.id,
                          },
                        }).then(r => {
                          queryExternalService()
                        })
                      }}
                    >
                      <Button
                        justIcon
                        size='sm'
                        color='danger'
                        style={{ marginLeft: 8 }}
                      >
                        <Delete />
                      </Button>
                    </Popconfirm>
                  )}
                </Authorized>
              ),
            },
          ]}
          scroll={{ y: height - 80 }}
          rowClassName={(record, index) => {
            return index % 2 === 0 ? customtyles.once : customtyles.two
          }}
          className={customtyles.table}
        ></Table>
      </div>

      <CommonModal
        open={labTrackingDetails.showModal}
        observe='LabResultsDetail'
        title='View External Tracking / Results'
        maxWidth='md'
        bodyNoPadding
        onClose={toggleModal}
        onConfirm={toggleModalAndRefresh}
      >
        <Detail
          mode='integrated'
          resultType={PATIENT_LAB.MEDICAL_CHECKUP}
          labTrackingDetails={labTrackingDetails}
        />
      </CommonModal>
    </React.Fragment>
  )
}
export default ExternalService
