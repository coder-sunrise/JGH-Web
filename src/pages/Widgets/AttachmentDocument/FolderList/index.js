import React, { PureComponent, Component } from 'react'
import moment from 'moment'
import _ from 'lodash'
import {
  FastField,
  GridContainer,
  GridItem,
  IconButton,
  CommonModal,
  Tooltip,
  TextField,
  notification,
  Checkbox,
} from '@/components'
import { Button, Tag } from 'antd'
import {
  EditFilled,
  SaveFilled,
  CloseCircleFilled,
  FolderAddFilled,
} from '@ant-design/icons'
import { AttachmentWithThumbnail, Notification } from '@/components/_medisys'
import { FILE_CATEGORY, FILE_STATUS } from '@/utils/constants'
import TextEditor from '../TextEditor'
import DragableList from './DragableList'
import Authorized from '@/utils/Authorized'

class FolderList extends Component {
  state = {
    showNewFolder: false,
    folderList: [],
    filterValue: '',
    isShowEmptyTags: false,
  }

  debouncedAction = _.debounce(e => {
    this.setState({ filterValue: e.target.value }, () =>
      this.checkToSelectAll(this.props),
    )
  }, 100)

  onShowEmptyTagChange = e => {
    this.setState({ isShowEmptyTags: e.target.value }, () =>
      this.checkToSelectAll(this.props),
    )
  }

  checkToSelectAll = props => {
    const { onSelectionChange, selectedFolderFK } = props
    if (selectedFolderFK === -99) return
    const {
      folderList = [],
      filterValue = '',
      isShowEmptyTags = true,
    } = this.state
    if (
      !folderList.find(
        f =>
          !f.isDeleted &&
          f.id === selectedFolderFK &&
          (f.displayValue || '')
            .toUpperCase()
            .indexOf((filterValue || '').toUpperCase()) >= 0 &&
          (isShowEmptyTags || f.fileCount > 0),
      )
    ) {
      onSelectionChange({ id: -99 })
    }
  }

  // eslint-disable-next-line react/sort-comp
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { folderList: nextFolderList = [] } = nextProps

    const nextList = _.orderBy(
      nextFolderList.filter(f => !f.isDeleted),
      'sortOrder',
    ).map(this.entityGenerator)
    const currentList = _.orderBy(
      this.state.folderList.filter(f => !f.isDeleted),
      'sortOrder',
    ).map(this.entityGenerator)

    const diff = _.differenceWith(nextList, currentList, _.isEqual)

    if (diff.length > 0) {
      this.setState(
        {
          folderList: nextList,
        },
        () => this.checkToSelectAll(nextProps),
      )
    }
  }

  mapPropsToStates = () => {
    const { folderList = [] } = this.props
    const nextList = _.orderBy(
      folderList.filter(f => !f.isDeleted),
      'sortOrder',
    ).map(this.entityGenerator)
    this.setState({
      folderList: nextList,
    })
  }

  entityGenerator = n => {
    return {
      id: n.id,
      displayValue: n.displayValue,
      sortOrder: n.sortOrder || 0,
      fileCount: n.fileCount || 0,
      isDeleted: n.isDeleted,
      isEmpty: n.isEmpty,
    }
  }

  refreshFolders = () => {
    this.props.dispatch({
      type: 'folder/query',
      payload: {
        pagesize: 999,
        sorting: [{ columnName: 'sortOrder', direction: 'asc' }],
      },
    })
  }

  closeNewFolderModal = () => {
    this.setState({ showNewFolder: false })
  }

  onSaveNewFolder = name => {
    const { folderList, dispatch } = this.props
    const maxSort = _.maxBy(
      folderList.filter(f => f.id > 0),
      'sortOrder',
    )

    dispatch({
      type: 'folder/upsert',
      payload: {
        code: name,
        displayValue: name,
        description: name,
        effectiveStartDate: moment().formatUTC(true),
        effectiveEndDate: moment('2099-12-31').formatUTC(true),
        sortOrder: maxSort ? maxSort.sortOrder + 1 : 1,
        type: this.props.type,
      },
    }).then(this.refreshFolders)

    this.closeNewFolderModal()
  }

  onItemClick = item => {
    this.props.onSelectionChange(item)
  }

  handleOnMoving = (dragIndex, hoverIndex) => {
    if (hoverIndex <= 0 || dragIndex <= 0) return

    let { folderList } = this.state
    let tmp = folderList[dragIndex]
    folderList.splice(dragIndex, 1)
    folderList.splice(hoverIndex, 0, tmp)

    folderList = folderList.map((m, i) => {
      return {
        ...m,
        sortOrder: i,
      }
    })
    this.setState({
      folderList,
    })
  }

  handleOnEndDrag = p => {
    const { folderList: origFolder = [] } = this.props
    const { folderList } = this.state
    const updated = []
    origFolder
      .filter(fo => fo.id > 0)
      .map(f => {
        const newFolder = folderList.find(o => o.id === f.id)
        if (newFolder && newFolder.sortOrder !== f.sortOrder)
          updated.push({ ...f, sortOrder: newFolder.sortOrder })
      })
    if (updated.length > 0) {
      this.props
        .dispatch({
          type: 'folder/upsertList',
          payload: updated,
        })
        .then(this.refreshFolders)
    }
  }

  onItemChanged = item => {
    if (item.isDeleted) {
      this.props
        .dispatch({
          type: 'folder/checkIfEmpty',
          payload: item.id,
        })
        .then(r => {
          if (r && r.data === true) {
            notification.warning({
              message: `Delete failed, attachment already associated to tag '${item.displayValue}'.`,
            })
            return
          }
          this.updateList(item)
        })
    } else {
      this.updateList(item)
    }
  }
  updateList = item => {
    const { folderList = [] } = this.state
    let stateItem = folderList.find(i => i.id === item.id)
    stateItem.displayValue = item.displayValue
    stateItem.isDeleted = item.isDeleted
    this.setState({ folderList })
  }

  handleOnSave = () => {
    const { folderList: origFolder = [] } = this.props
    const { folderList } = this.state
    const updated = []
    origFolder.map(f => {
      const newFolder = folderList.find(o => o.id === f.id)
      if (
        newFolder &&
        (newFolder.displayValue !== f.displayValue ||
          newFolder.isDeleted !== f.isDeleted)
      )
        updated.push({
          ...f,
          displayValue: newFolder.displayValue,
          isDeleted: newFolder.isDeleted,
        })
    })
    if (updated.length > 0) {
      this.props
        .dispatch({
          type: 'folder/upsertList',
          payload: updated,
        })
        .then(this.refreshFolders)
    }
  }

  render() {
    const {
      readOnly,
      updateAttachments,
      selectedFolderFK = -99,
      modelName,
      isEnableEditFolder = true,
      isEnableDeleteFolder = true,
      isEnableEditDocument = true,
    } = this.props
    const {
      showNewFolder,
      folderList,
      isEditMode,
      isShowEmptyTags = true,
      filterValue,
    } = this.state

    return (
      <GridContainer style={{ height: 'auto' }}>
        {!readOnly && (
          <GridItem md={12}>
            <div>
              <div style={{ display: 'flex', float: 'left' }}>
                {isEnableEditFolder && (
                  <Tooltip title='Add New Tag'>
                    <Button
                      type='primary'
                      style={{ marginRight: 8, marginTop: 8 }}
                      onClick={() => {
                        this.setState({ showNewFolder: true })
                      }}
                      size='small'
                      icon={<FolderAddFilled />}
                    ></Button>
                  </Tooltip>
                )}
                {isEnableEditDocument && (
                  <div style={{ marginRight: 8 }}>
                    <FastField
                      name={`${modelName}`}
                      render={args => {
                        this.form = args.form
                        return (
                          <AttachmentWithThumbnail
                            attachmentType={`${modelName}`}
                            handleUpdateAttachments={att => {
                              let { added = [] } = att
                              const { selectedFolderFK: folderFK } = this.props
                              if (folderFK > 0 && added.length > 0) {
                                added = added.map(ad => {
                                  const { 0: fileDetails } = ad
                                  const retVal = {
                                    ...ad,
                                    ...fileDetails,
                                    [`${modelName}_Folder`]: [{ folderFK }],
                                  }
                                  return retVal
                                })
                              }
                              updateAttachments(args)({ ...att, added })
                            }}
                            attachments={args.field.value}
                            fileCategory={
                              modelName === 'patientAttachment'
                                ? FILE_CATEGORY.PATIENT
                                : FILE_CATEGORY.COPAYER
                            }
                            fileStatus={FILE_STATUS.CONFIRMED}
                            label=''
                            thumbnailSize={{
                              height: 256,
                              width: 256,
                            }}
                          />
                        )
                      }}
                    />
                  </div>
                )}
                <div>
                  <Checkbox
                    label='Show Empty Tags'
                    checked={isShowEmptyTags}
                    onChange={this.onShowEmptyTagChange}
                  />
                </div>
              </div>
              {isEnableEditFolder && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    float: 'right',
                    marginTop: 8,
                  }}
                >
                  {isEditMode ? (
                    <React.Fragment>
                      <Tooltip title='Save'>
                        <Button
                          type='primary'
                          size='small'
                          onClick={() => {
                            this.handleOnSave()
                            this.setState({ isEditMode: false })
                          }}
                          style={{ marginRight: 8 }}
                          icon={<SaveFilled />}
                        ></Button>
                      </Tooltip>
                      <Tooltip title='Cancel'>
                        <Button
                          type='danger'
                          size='small'
                          onClick={() => {
                            this.mapPropsToStates()
                            this.setState({ isEditMode: false })
                          }}
                          icon={<CloseCircleFilled />}
                        ></Button>
                      </Tooltip>
                    </React.Fragment>
                  ) : (
                    <Button
                      type='primary'
                      size='small'
                      onClick={() => {
                        this.setState({ isEditMode: true })
                      }}
                      icon={<EditFilled />}
                    ></Button>
                  )}
                </div>
              )}
            </div>
          </GridItem>
        )}
        <GridItem md={12}>
          <div>
            <TextField
              inputProps={{ placeholder: 'Key in to filter tags' }}
              onChange={this.debouncedAction}
              value={filterValue}
            />
            <DragableList
              readOnly={readOnly}
              isEditMode={isEditMode}
              folderList={folderList.filter(
                f =>
                  !f.isDeleted &&
                  (f.id === -99 ||
                    ((f.displayValue || '')
                      .toUpperCase()
                      .indexOf((filterValue || '').toUpperCase()) >= 0 &&
                      (isShowEmptyTags || f.fileCount > 0))),
              )}
              selectedFolderFK={selectedFolderFK}
              onMoving={this.handleOnMoving}
              onItemClick={this.onItemClick}
              onEndDrag={this.handleOnEndDrag}
              onItemChanged={this.onItemChanged}
              isEnableEditFolder={isEnableEditFolder}
              isEnableDeleteFolder={isEnableDeleteFolder}
            />
          </div>
        </GridItem>

        <CommonModal
          open={showNewFolder}
          title='New Tag'
          maxWidth='sm'
          onConfirm={this.closeNewFolderModal}
          onClose={this.closeNewFolderModal}
        >
          <TextEditor
            item={{ label: 'New Tag' }}
            handleSubmit={this.onSaveNewFolder}
          />
        </CommonModal>
      </GridContainer>
    )
  }
}

export default FolderList
