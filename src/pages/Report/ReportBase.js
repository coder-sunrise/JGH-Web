import React from 'react'
import {
  GridContainer,
  GridItem,
  Button,
  Card,
  notification,
} from '@/components'
import { getRawData, getCsv } from '@/services/report'
import { downloadFile } from '@/services/file'
import ReportLayoutWrapper from './ReportLayout'

const defaultState = {
  loaded: false,
  isLoading: false,
  isSubmitting: false,
  activePanel: -1,
  reportDatas: null,
  reportId: 0,
  fileName: '',
  isDisplayReportLayout: true,
}

export default class ReportBase extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ...defaultState,
    }
    // this.onSubmitClick = this.onSubmitClick.bind(this)
  }
  // componentDidMount () {
  //   this.setState((state) => ({
  //     ...defaultState,
  //   }))
  // }

  // componentWillUnmount () {
  //   this.setState(() => ({
  //     ...defaultState,
  //   }))
  // }

  handleActivePanelChange = (event, panel) => {
    this.setState(state => ({
      ...state,
      activePanel: state.activePanel === panel.key ? -1 : panel.key,
    }))
  }

  formatReportParams = params => {
    return params
  }

  getReportDatas = params => getRawData(this.state.reportId, { ...params })

  onExportCsvClick = async () => {
    if (this.props.validateForm) {
      const errors = await this.props.validateForm()
      if (Object.keys(errors).length > 0) {
        notification.error({ message: 'Required fields not entered.' })
        return
      }
    }
    const result = await getCsv(
      this.state.reportId,
      this.props.values,
      this.state.tableName,
    )
    if (result) {
      const fileExtensions = '.csv'
      downloadFile(result, `${this.state.fileName}${fileExtensions}`)
    }
  }

  onSubmitClick = async () => {
    if (this.props.validateForm) {
      const errors = await this.props.validateForm()
      if (Object.keys(errors).length > 0) {
        notification.error({ message: 'Required fields not entered.' })
        return
      }
    }
    this.setState(state => ({
      ...state,
      loaded: false,
      isLoading: true,
      isSubmitting: true,
      reportDatas: null,
    }))
    const params = this.formatReportParams(this.props.values)
    const reportDatas = await this.getReportDatas(params)

    if (reportDatas) {
      this.setState(state => ({
        ...state,
        activePanel: 0,
        loaded: true,
        isSubmitting: false,
        isLoading: false,
        reportDatas,
      }))
    } else {
      this.setState(state => ({
        ...state,
        loaded: false,
        isLoading: false,
        isSubmitting: false,
        reportDatas: null,
      }))
    }
  }

  renderFilterBar = (handleSubmit, isSubmitting) => {
    return (
      <GridContainer size='sm'>
        <GridItem md={3}>
          <Button
            color='primary'
            onClick={handleSubmit}
            style={{ marginTop: 6 }}
            disabled={isSubmitting}
          >
            Generate Report
          </Button>
        </GridItem>
      </GridContainer>
    )
  }

  renderContent = () => {
    return null
  }

  render() {
    const { height, values, setFieldValue } = this.props
    const formikProps = { values, setFieldValue }
    return (
      <Card style={{ padding: 6 }}>
        <GridContainer>
          <GridItem md={12}>
            <div className='divReportFilterBar'>
              {this.renderFilterBar(
                this.onSubmitClick,
                this.state.isSubmitting,
                formikProps,
                this.onExportCsvClick,
              )}
            </div>
          </GridItem>
          <GridItem md={12}>
            {this.state.isDisplayReportLayout ? (
              <ReportLayoutWrapper
                height={height}
                loading={this.state.isLoading}
                reportID={this.state.reportId}
                reportParameters={this.formatReportParams(this.props.values)}
                loaded={this.state.loaded}
                fileName={this.state.fileName}
                tableName={this.state.tableName}
              >
                {this.renderContent(this.state.reportDatas)}
              </ReportLayoutWrapper>
            ) : (
              this.renderContent(this.state.reportDatas)
            )}
          </GridItem>
        </GridContainer>
      </Card>
    )
  }
}
