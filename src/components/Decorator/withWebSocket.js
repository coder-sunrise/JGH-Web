import request from '@/utils/request'
import React, { useRef } from 'react'
// common component
import { notification, CommonModal, Primary } from '@/components'
import { CircularProgress } from '@material-ui/core'
import moment from 'moment'
// services
import { getPDF } from '@/services/report'
// utils
import { arrayBufferToBase64 } from '@/components/_medisys/ReportViewer/utils'
import { AESEncryptor } from '@/utils/aesEncryptor'
import { getUniqueGUID } from '@/utils/utils'
import Scanner from './scanner/index'

const defaultSocketPortsState = [7182, 7183, 7184]
const WebSocketMessageType = {
  Print: 1,
  Scan: 2,
  ScanCompleted: 3,
  RequestScanner: 4,
  Preview: 5,
  AutoUpdate: 99,
}
const WebSocketMessageStatus = {
  Success: 'Success',
  Error: 'Error',
}

const withWebSocket = () => Component => {
  class WebSocketBase extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        pendingJob: [],
        scanResults: [],
        isWsConnected: false,
        loading: false,
        loadingText: 'Scanning...',
        showScanner: false,
      }
      // this.isWsConnected = false
      this.wsConnection = null
      this.tryConnectSocket()
    }

    componentWillUnmount() {
      const { isWsConnected } = this.state

      if (this.wsConnection && isWsConnected === true) this.wsConnection.close()
    }

    prepareJobForWebSocket = async (content, autoupdate) => {
      // reset port number state to retry all attempt and set job content
      // then initialize web socket connection
      const pendingJob = [content]
      let sendSuccess = false
      this.setState({ pendingJob })

      let { isWsConnected } = this.state
      if (!isWsConnected && autoupdate) {
        isWsConnected = await this.tryConnectSocket()
        // console.log(
        //   'Web Socket did not prepared, reconnect status: ',
        //   isWsConnected,
        // )
      }
      if (
        isWsConnected === true ||
        (!autoupdate && (await this.tryConnectSocket()))
      ) {
        // console.log('try to send message', content)
        if (this.wsConnection.readyState === 1) {
          this.wsConnection.send(content)
          sendSuccess = true
        } else {
          // console.log(
          //   'Web Socket state is not 1 but: ',
          //   this.wsConnection.readyState,
          // )
        }
      } else {
        // console.log(isWsConnected)
        // console.log('Nothing happen')
      }
      if (!sendSuccess && !autoupdate) {
        notification.error({
          message: `Medicloud printing tool is not running, please start it.`,
        })
      }
      this.setState({ pendingJob: [] })
      return sendSuccess
    }

    tryConnectSocket = async () => {
      let connected = false
      const settings = JSON.parse(localStorage.getItem('clinicSettings'))
      // prevent to connect websocket before login.
      if (!settings) {
        return false
      }
      const { printToolSocketURL = '' } = settings
      const [prefix = '', ip = ''] = printToolSocketURL.split(':')
      for (let index = 0; index < defaultSocketPortsState.length; index++) {
        const port = defaultSocketPortsState[index]
        const wsUrl = `${prefix}:${ip}:${port}`
        if (wsUrl) {
          console.log(`try to connect ${wsUrl}`)
          this.wsConnection = new window.WebSocket(wsUrl)
          this.wsConnection.onopen = () => {
            console.log(`connected: ${wsUrl}`)
            this.setState({
              isWsConnected: true,
            })
          }
          this.wsConnection.onclose = () => {
            this.setState({ isWsConnected: false })
          }
          this.wsConnection.onmessage = this.onReceivedMessage
          connected = await this.connectionAsync(this.wsConnection)
          if (connected) {
            break
          }
        }
      }
      return connected
    }

    handlePrint = async content => {
      if (content) {
        const result = await this.prepareJobForWebSocket(
          AESEncryptor.encrypt(
            JSON.stringify({
              messageType: WebSocketMessageType.Print,
              message: content,
            }),
          ),
        )
        if (result)
          notification.success({
            message: `Printing job sent to the printer.`,
          })
        return result
      }
      return false
    }

    handlePreviewReport = async (content, previewEventId) => {
      if (content) {
        const result = await this.prepareJobForWebSocket(
          AESEncryptor.encrypt(
            JSON.stringify({
              messageType: WebSocketMessageType.Preview,
              message: content,
              previewEventId: previewEventId || Date.now(),
            }),
          ),
        )
        /** if (result) {
            notification.success({
           message: `Preview job sent to the printer.`,
        })
        } */

        return result
      }
      return false
    }

    onReceivedMessage = message => {
      if (message && message.data) {
        const { data } = message
        const returnMessage = JSON.parse(data)
        const { MessageType, Status, Data } = returnMessage
        console.log(returnMessage)

        if (MessageType === WebSocketMessageType.RequestScanner) {
          if (Status === 'Success') {
            this.setState({
              showScanner: true,
              loading: false,
              scanResults: [],
              scannerList: Data,
            })
          } else if (Data) {
            notification.error({
              message: Data,
            })
          }
        } else if (MessageType === WebSocketMessageType.Scan) {
          const { Image, FileExtension } = Data

          this.setState(preState => ({
            scanResults: [
              ...preState.scanResults,
              {
                uid: getUniqueGUID(),
                image: Image,
                name: moment().format('YYYYMMDD_HHmmss'),
                fileExtension: FileExtension,
              },
            ],
          }))
        } else if (MessageType === WebSocketMessageType.ScanCompleted) {
          this.setState({ loading: false })
          if (Status !== 'Success') {
            notification.error({
              message: Data,
            })
          }
        } else if (
          MessageType === WebSocketMessageType.Preview &&
          Status === WebSocketMessageStatus.Error
        ) {
          notification.error({
            message: Data,
          })
        }
      }
    }

    handleScaning = async params => {
      // console.log('handleScaning', params)
      let jsonStr = JSON.stringify({
        MessageType: WebSocketMessageType.Scan,
        Message: JSON.stringify(params),
      })
      const result = await this.prepareJobForWebSocket(
        AESEncryptor.encrypt(jsonStr),
      )
      if (result) this.setState({ loading: true })
    }

    handleDeleteItem = uid => {
      const { scanResults = [] } = this.state
      scanResults.forEach((o, index) => {
        if (o.uid === uid) scanResults.splice(index, 1)
      })

      this.setState({ scanResults })
    }

    handleUpdateName = row => {
      const { uid, name } = row
      this.setState(prevState => ({
        scanResults: prevState.scanResults.map(m => {
          if (m.uid === uid) {
            return { ...m, name }
          }
          return m
        }),
      }))
    }

    handleUploading = imgDatas => {
      // console.log(this._CompRef)
      if (this._CompRef && this._CompRef.onUploadFromScan)
        this._CompRef.onUploadFromScan(imgDatas)
      this.toggleModal()
    }

    connectionAsync = async (socket, timeout = 1000) => {
      const isOpened = () => socket.readyState === WebSocket.OPEN

      if (socket.readyState !== WebSocket.CONNECTING) {
        return isOpened()
      }

      const intrasleep = 10
      const ttl = timeout / intrasleep // time to loop
      let loop = 0
      while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
        await new Promise(resolve => setTimeout(resolve, intrasleep))
        loop += 1
      }
      return isOpened()
    }

    toggleModal = () => {
      this.setState(preState => ({
        showScanner: !preState.showScanner,
        loading: false,
        scanResults: [],
      }))
    }

    requestOpenScan = () => {
      let jsonStr = JSON.stringify({
        MessageType: WebSocketMessageType.RequestScanner,
      })
      this.prepareJobForWebSocket(AESEncryptor.encrypt(jsonStr))
    }

    versionCheck = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await request(
          `/api/files/downloadlink?key=AutoUpdatePrintingToolDownloadLinkSection`,
          {
            method: 'GET',
          },
        )
        const { data, status } = response
        if (status === '200') {
          let payload = {
            Token: token,
            BaseUrl: process.env.url,
            SigningLink: data,
          }
          const result = await this.prepareJobForWebSocket(
            AESEncryptor.encrypt(
              JSON.stringify({
                messageType: WebSocketMessageType.AutoUpdate,
                message: JSON.stringify(payload),
              }),
            ),
            true,
          )
          return result
        }
        return false
      } catch (error) {
        console.log(error)
        return false
      }
    }

    render() {
      const {
        pendingJob = [],
        scanResults = [],
        scannerList = [],
        loading,
        loadingText,
      } = this.state
      const { disableScanner } = this.props
      // console.log(disableScanner)
      return (
        <React.Fragment>
          <Component
            {...this.props}
            handlePrint={this.handlePrint}
            versionCheck={this.versionCheck}
            handleOpenScanner={this.requestOpenScan}
            handlePreviewReport={this.handlePreviewReport}
            sendingJob={pendingJob.length > 0}
            onRef={child => {
              this._CompRef = child
            }}
          />
          {disableScanner !== true && (
            <CommonModal
              open={this.state.showScanner}
              onClose={this.toggleModal}
              title='Scan'
              maxWidth='lg'
              minHeight={500}
              bodyNoPadding
              keepMounted={false}
            >
              <div
                style={{
                  position: 'relative',
                  marginTop: -10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={
                    loading
                      ? {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          zIndex: 1200,
                          '& h4': {
                            fontWeight: 500,
                          },
                        }
                      : { display: 'none' }
                  }
                >
                  <CircularProgress />
                  <Primary>
                    <h4>{loadingText}</h4>
                  </Primary>
                </div>
                <div style={loading ? { opacity: 0.4 } : {}}>
                  <Scanner
                    onScaning={this.handleScaning}
                    onDeleteItem={this.handleDeleteItem}
                    onUpdateName={this.handleUpdateName}
                    onUploading={this.handleUploading}
                    scannerList={scannerList}
                    imageDatas={scanResults}
                  />
                </div>
              </div>
            </CommonModal>
          )}
        </React.Fragment>
      )
    }
  }

  return WebSocketBase
}

export default withWebSocket
