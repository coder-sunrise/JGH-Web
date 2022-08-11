import React, { Component } from 'react'
import { connect } from 'dva'
// material ui
import { withStyles, Slider } from '@material-ui/core'
// styles
import basicStyle from 'mui-pro-jss/material-dashboard-pro-react/layouts/basicLayout'
// common components
import {
  GridContainer,
  GridItem,
  CardContainer,
  Button,
  Tooltip,
  Popover,
  TextField,
} from '@/components'
// sub components
import { findGetParameter } from '@/utils/utils'
import {
  List as ListIcon,
  Apps as AppsIcon,
  ZoomIn as ZoomInIcon,
} from '@material-ui/icons'
import FolderList from './FolderList/index'
import FolderContainer from './FolderContainer/index'
import { FOLDER_TYPE } from '@/utils/constants'

const styles = theme => ({
  ...basicStyle(theme),
})

@connect(({ patientAttachment, folder, coPayerAttachment }) => ({
  patientAttachment,
  folder,
  coPayerAttachment,
}))
class AttachmentDocument extends Component {
  state = {
    selectedFolderFK: -99, // all
    viewMode: 'card',
    zoom: 1,
    fileFilters: [],
  }

  componentDidMount() {
    const { dispatch, values, type } = this.props
    dispatch({
      type: 'folder/query',
      payload: {
        pagesize: 9999,
        sorting: [{ columnName: 'sortOrder', direction: 'asc' }],
        type,
      },
    }).then(this.refreshDocuments)
  }

  refreshDocuments = () => {
    const { dispatch, values, type, modelName } = this.props
    if (type === FOLDER_TYPE.PATIENT) {
      dispatch({
        type: `${modelName}/query`,
        payload: {
          pagesize: 9999,
          'PatientProfileFKNavigation.Id': values.id,
        },
      })
    } else if (type === FOLDER_TYPE.COPAYER) {
      dispatch({
        type: `${modelName}/query`,
        payload: {
          pagesize: 9999,
          'CoPayerFKNavigation.Id': values.id,
        },
      })
    }
  }

  updateAttachments = args => ({ added, deleted }) => {
    const { dispatch, modelName, type, coPayerFK } = this.props
    const { list = [] } = this.props[modelName]
    const { field } = args

    const getLargestSortOrder = (largestIndex, attachment) =>
      attachment.sortOrder > largestIndex ? attachment.sortOrder : largestIndex

    let updated = [...(field.value || [])]
    if (added) {
      const addedFiles = added.map(file => {
        const { id, ...otherValue } = file
        return {
          ...otherValue,
          fileIndexFK: id,
        }
      })
      updated = [...updated, ...addedFiles]
    }
    if (deleted)
      updated = updated.reduce((attachments, item) => {
        if (
          (item.fileIndexFK !== undefined && item.fileIndexFK === deleted) ||
          (item.fileIndexFK === undefined && item.id === deleted)
        )
          return [...attachments, { ...item, isDeleted: true }]

        return [...attachments, { ...item }]
      }, [])
    const sorted = updated.sort((a, b) => {
      if (a.id > b.id) return 1
      if (a.id < b.id) return -1
      return 0
    })
    const startOrder = list.reduce(getLargestSortOrder, 0) + 1
    Promise.all(
      sorted.map((attachment, index) => {
        let payload = {
          cfg: { message: 'Uploaded Attachment' },
          sortOrder: startOrder + index,
          fileIndexFK: attachment.fileIndexFK,
          displayValue: attachment.fileName,
          [`${modelName}_Folder`]: attachment[`${modelName}_Folder`],
        }
        if (type === FOLDER_TYPE.PATIENT) {
          payload = { ...payload, patientProfileFK: findGetParameter('pid') }
        } else {
          payload = { ...payload, coPayerFK: coPayerFK }
        }
        dispatch({
          type: `${modelName}/upsert`,
          payload,
        })
      }),
    )
      .then(this.refreshDocuments)
      .catch(error => {})
  }

  filterDocumentCount = () => {
    const { selectedFolderFK, fileFilters } = this.state
    const { modelName } = this.props
    const { list = [] } = this.props[modelName]
    const filterDocumentValue =
      (fileFilters.find(f => f.id === selectedFolderFK) || {})
        .filterDocumentValue || ''

    const filterItems = list.filter(
      f =>
        (f.fileName || '')
          .toUpperCase()
          .indexOf(filterDocumentValue.toUpperCase()) >= 0 &&
        (f.folderFKs.includes(selectedFolderFK) || selectedFolderFK === -99),
    )

    return filterItems.length
  }

  debouncedAction = _.debounce(e => {
    const { fileFilters, selectedFolderFK } = this.state
    var newFilters = [...fileFilters]
    var selectedFilter = newFilters.find(f => f.id === selectedFolderFK)
    if (selectedFilter) {
      selectedFilter.filterDocumentValue = e.target.value
    } else {
      newFilters.push({
        id: selectedFolderFK,
        filterDocumentValue: e.target.value,
      })
    }
    this.setState({ fileFilters: [...newFilters] })
  }, 100)
  render() {
    const {
      folder,
      readOnly = false,
      coPayerAttachment,
      type,
      modelName,
    } = this.props
    const { viewMode, selectedFolderFK, zoom, fileFilters } = this.state
    const { list = [] } = this.props[modelName]

    let folderList = (folder.list || []).map(l => {
      return {
        ...l,
        fileCount: list.filter(f => f.folderFKs.includes(l.id)).length,
      }
    })
    folderList = [
      { id: -99, displayValue: 'All', sortOrder: -99, fileCount: list.length },
      ...folderList,
    ]
    const filterDocumentValue = (
      fileFilters.find(f => f.id === selectedFolderFK) || {}
    ).filterDocumentValue
    return (
      <GridContainer>
        <GridItem md={3}>
          <CardContainer
            hideHeader
            style={{ height: window.innerHeight - 150, overflow: 'scroll' }}
          >
            <FolderList
              readOnly={readOnly}
              folderList={folderList}
              selectedFolderFK={selectedFolderFK}
              updateAttachments={this.updateAttachments}
              onSelectionChange={f => {
                this.setState({ selectedFolderFK: f.id })
              }}
              {...this.props}
            />
          </CardContainer>
        </GridItem>
        <GridItem md={9}>
          <CardContainer
            hideHeader
            style={{ height: window.innerHeight - 150, overflow: 'scroll' }}
          >
            <GridContainer style={{ height: 'auto' }}>
              <GridItem
                md={6}
                style={{
                  marginBottom: 10,
                  paddingRight: 130,
                  position: 'relative',
                }}
                container
              >
                <TextField
                  inputProps={{ placeholder: 'Key in to filter documents' }}
                  onChange={this.debouncedAction}
                  value={filterDocumentValue}
                />
                <div style={{ position: 'absolute', right: 0, top: 16 }}>
                  {`${this.filterDocumentCount()} items filtered`}
                </div>
              </GridItem>
              <GridItem md={6} align='Right' style={{ marginBottom: 10 }}>
                <div style={{ marginTop: 8 }}>
                  {viewMode === 'card' && (
                    <Popover
                      icon={null}
                      placement='bottom'
                      content={
                        <div style={{ width: 150 }}>
                          <Slider
                            // orientation='vertical'
                            // getAriaValueText={valuetext}
                            defaultValue={1}
                            aria-labelledby='vertical-slider'
                            valueLabelDisplay='off'
                            step={1}
                            marks
                            min={1}
                            max={5}
                            onChange={(e, v) => {
                              if (zoom !== v) {
                                this.setState({ zoom: v })
                              }
                            }}
                          />
                        </div>
                      }
                    >
                      <Tooltip title='Zoom'>
                        <Button justIcon color='primary'>
                          <ZoomInIcon />
                        </Button>
                      </Tooltip>
                    </Popover>
                  )}
                  <Tooltip title='List View'>
                    <Button
                      justIcon
                      color='primary'
                      onClick={() => {
                        this.setState({ viewMode: 'list' })
                      }}
                    >
                      <ListIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip title='Card View'>
                    <Button
                      justIcon
                      color='primary'
                      onClick={() => {
                        this.setState({ viewMode: 'card' })
                      }}
                    >
                      <AppsIcon />
                    </Button>
                  </Tooltip>
                </div>
              </GridItem>
              <GridItem md={12}>
                <FolderContainer
                  {...this.props}
                  zoom={zoom}
                  readOnly={readOnly}
                  folderList={folderList}
                  viewMode={viewMode}
                  attachmentList={list}
                  selectedFolderFK={selectedFolderFK}
                  filterDocumentValue={filterDocumentValue}
                />
              </GridItem>
            </GridContainer>
          </CardContainer>
        </GridItem>
      </GridContainer>
    )
  }
}

export default withStyles(styles, { withTheme: true })(AttachmentDocument)
