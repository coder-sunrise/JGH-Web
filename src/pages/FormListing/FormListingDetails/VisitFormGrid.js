import React, { PureComponent, useCallback, useState } from 'react'
import { primaryColor } from 'mui-pro-jss'
import moment from 'moment'
import color from 'color'
import withStyles from '@material-ui/core/styles/withStyles'
import { Delete, Edit, Print, Add } from '@material-ui/icons'
import {
  FORM_CATEGORY,
  DOCUMENT_CATEGORY,
  DOCUMENTCATEGORY_DOCUMENTTYPE,
} from '@/utils/constants'
import { formTypes, formStatus } from '@/utils/codes'
import {
  CommonTableGrid,
  Button,
  Popconfirm,
  AuthorizedContext,
  TextField,
  Danger,
  Popover,
  Checkbox,
  Tooltip,
  DocumentEditor,
} from '@/components'
import VoidWithPopover from './FormDetail/VoidWithPopover'
import Authorized from '@/utils/Authorized'

const styles = theme => ({
  item: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',

    '&:hover': {
      background: color(primaryColor)
        .lighten(0.9)
        .hex(),
    },
    '& > svg': {
      marginRight: theme.spacing(1),
    },
    '& > span': {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
  },

  errorContainer: {
    textAlign: 'left',
    lineHeight: '1em',
    paddingBottom: theme.spacing(1),
    '& span': {
      fontSize: '.8rem',
    },
  },
  popoverContainer: {
    maxWidth: 400,
    minWidth: 200,
    textAlign: 'left',
    marginTop: -10,
  },
  listContainer: {
    maxHeight: 250,
    overflowY: 'auto',
  },
})

class VisitFormGrid extends PureComponent {
  constructor(props) {
    super(props)
    const { dispatch } = props
    this.state = {
      openFormType: false,
      includeVoidForms: false,
    }

    dispatch({
      type: 'codetable/fetchCodes',
      payload: {
        code: 'clinicianprofile',
      },
    })
  }

  toggleVisibleChange = () =>
    this.setState(ps => {
      return {
        openFormType: !ps.openFormType,
      }
    })

  setFilterFormTemplate = val => {
    this.setState({ filterFormTemplate: val })
  }

  debouncedFilterFormTemplateAction = _.debounce(
    e => {
      this.setFilterFormTemplate(e.target.value)
    },
    100,
    {
      leading: true,
      trailing: false,
    },
  )

  ListItem = ({ classes, title, onClick }) => {
    return (
      <Tooltip title={title}>
        <div className={classes.item} onClick={onClick}>
          <span>{title}</span>
        </div>
      </Tooltip>
    )
  }

  editRow = async row => {
    const { formListing, formCategory, formFrom, dispatch } = this.props
    const { visitDetail = {} } = formListing
    let { isCanEditForms = false } = visitDetail
    if (row.statusFK === 3 || row.statusFK === 4) return
    let response
    if (formCategory === FORM_CATEGORY.VISITFORM) {
      response = await this.props.dispatch({
        type: 'formListing/getVisitForm',
        payload: {
          type: row.type,
          id: row.id,
        },
      })
    } else {
      response = await dispatch({
        type: 'formListing/getCORForm',
        payload: {
          type: row.type,
          id: row.id,
        },
      })
    }
    if (response) {
      dispatch({
        type: 'formListing/updateState',
        payload: {
          showModal: true,
          entity: {
            ...response,
            formData: JSON.parse(response.formData),
          },
          type: row.type,
          formCategory,
          formFrom,
        },
      })
    }
  }

  printRow = row => {
    DocumentEditor.print({
      documentName: row.formName,
      document: row.formData.content,
      strWatermark: 'VOIDED',
    })
  }

  VoidForm = ({ classes, dispatch, row, user }) => {
    const [reason, setReason] = useState(undefined)

    const handleConfirmDelete = useCallback((i, voidVisibleChange) => {
      if (reason) {
        const { formCategory, formListing } = this.props
        let voidData = {
          ...row,
          formData: JSON.stringify(row.formData),
          voidReason: reason,
          statusFK: 4,
          voidDate: moment(),
          voidByUserFK: user.data.clinicianProfile.id,
          visitID: formListing.visitID,
        }
        voidVisibleChange()
        if (formCategory === FORM_CATEGORY.VISITFORM) {
          dispatch({
            type: 'formListing/saveVisitForm',
            payload: {
              ...voidData,
            },
          }).then(() => {
            this.props.queryFormListing()
          })
        } else {
          dispatch({
            type: 'formListing/saveCORForm',
            payload: {
              ...voidData,
              action: 'void',
            },
          }).then(() => {
            this.props.queryFormListing()
          })
        }
      }
    })
    return (
      <VoidWithPopover
        title='Void Form'
        contentText='Confirm to void this form?'
        tooltipText='Void Form'
        extraCmd={
          <div className={classes.errorContainer}>
            <TextField
              label='Void Reason'
              autoFocus
              value={reason}
              onChange={e => {
                setReason(e.target.value)
              }}
            />
            {!reason && (
              <Danger>
                <span>Void reason is required</span>
              </Danger>
            )}
          </div>
        }
        onCancelClick={() => {
          setReason(undefined)
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    )
  }

  render() {
    let { formListing, dispatch, theme, classes, user } = this.props
    let { list, visitDetail = {}, formTemplates = [] } = formListing
    let { isCanEditForms = true } = visitDetail

    const modifyAR = Authorized.check('queue.consultation.form.modify')
    const voidAR = Authorized.check('queue.consultation.form.void')

    const isHiddenModify = modifyAR && modifyAR.rights !== 'enable'
    const isHiddenVoid = voidAR && voidAR.rights !== 'enable'

    return (
      <div>
        <Checkbox
          label='Include voided forms'
          value={this.state.includeVoidForms}
          onChange={() => {
            this.setState(ps => {
              return {
                ...ps,
                includeVoidForms: !ps.includeVoidForms,
              }
            })
          }}
        />
        <CommonTableGrid
          getRowId={r => r.id}
          forceRender
          size='sm'
          style={{ margin: 0 }}
          rows={
            this.state.includeVoidForms
              ? list
              : list.filter(o => o.statusFK !== 4)
          }
          onRowDoubleClick={this.editRow}
          columns={[
            { name: 'formName', title: 'Form' },
            { name: 'updateByUser', title: 'Last Updated By' },
            { name: 'updateDate', title: 'Last Updated Date' },
            { name: 'statusFK', title: 'Status' },
            { name: 'action', title: 'Action' },
          ]}
          FuncProps={{ pager: false }}
          columnExtensions={[
            {
              columnName: 'formName',
              type: 'link',
              linkField: 'href',
              onClick: row => {
                // this.props.viewReport(row, this.props)
                this.editRow(row)
              },
            },
            {
              columnName: 'updateByUser',
              render: r => {
                const updatedBy = r.lastUpdatedByUser || r.updateByUser
                return (
                  <Tooltip title={updatedBy}>
                    <span>{updatedBy}</span>
                  </Tooltip>
                )
              },
            },
            {
              columnName: 'updateDate',
              render: r => {
                const updateDate = moment(
                  r.lastUpdatedDate || r.updateDate,
                ).format('DD MMM YYYY HH:mm')
                return (
                  <Tooltip title={updateDate}>
                    <span>{updateDate}</span>
                  </Tooltip>
                )
              },
            },
            {
              columnName: 'statusFK',
              render: r => {
                const status = formStatus.find(x => x.value === r.statusFK).name
                const title =
                  r.statusFK === 4
                    ? `${status}, Reason: ${r.voidReason}.`
                    : status
                return (
                  <Tooltip title={title}>
                    <span>{status}</span>
                  </Tooltip>
                )
              },
            },
            {
              columnName: 'action',
              width: 110,
              align: 'left',
              render: row => {
                return (
                  <React.Fragment>
                    <Tooltip title='Print'>
                      <Button
                        size='sm'
                        onClick={() => {
                          // const { formCategory, printRow } = this.props
                          // printRow(row, formCategory)
                          this.printRow(row)
                        }}
                        justIcon
                        color='primary'
                        style={{ marginRight: 5 }}
                      >
                        <Print />
                      </Button>
                    </Tooltip>
                    {row.statusFK === 1 && !isHiddenModify && (
                      <Tooltip title='Edit'>
                        <Button
                          disabled={!row.isCanEditForms}
                          size='sm'
                          onClick={() => {
                            this.editRow(row)
                          }}
                          justIcon
                          color='primary'
                          style={{ marginRight: 5 }}
                        >
                          <Edit />
                        </Button>
                      </Tooltip>
                    )}
                    {row.statusFK === 1 && !isHiddenModify && (
                      <Popconfirm
                        onConfirm={() => {
                          const { formCategory } = this.props
                          let deleteData = {
                            ...row,
                            formData: JSON.stringify(row.formData),
                            isDeleted: true,
                            visitID: formListing.visitID,
                          }
                          if (formCategory === FORM_CATEGORY.VISITFORM) {
                            dispatch({
                              type: 'formListing/saveVisitForm',
                              payload: {
                                ...deleteData,
                              },
                            }).then(() => {
                              this.props.queryFormListing()
                            })
                          } else {
                            dispatch({
                              type: 'formListing/saveCORForm',
                              payload: {
                                ...deleteData,
                              },
                            }).then(() => {
                              this.props.queryFormListing()
                            })
                          }
                        }}
                      >
                        <Tooltip title='Delete'>
                          <Button
                            disabled={!row.isCanEditForms}
                            size='sm'
                            color='danger'
                            justIcon
                          >
                            <Delete />
                          </Button>
                        </Tooltip>
                      </Popconfirm>
                    )}
                    {row.statusFK === 2 && !isHiddenVoid && (
                      <this.VoidForm
                        classes={classes}
                        dispatch={dispatch}
                        row={row}
                        user={user}
                      />
                    )}
                  </React.Fragment>
                )
              },
            },
          ]}
        />
        <AuthorizedContext>
          {r => {
            if (
              (r && r.rights !== 'enable') ||
              isHiddenModify ||
              !isCanEditForms
            )
              return null
            let unionFormTypes = formTemplates //formTypes.concat(formTemplates)
            unionFormTypes = this.state.filterFormTemplate
              ? unionFormTypes.filter(
                  x =>
                    x.name
                      .toUpperCase()
                      .indexOf(this.state.filterFormTemplate.toUpperCase()) >=
                    0,
                )
              : unionFormTypes
            const formDocumentTypes =
              DOCUMENTCATEGORY_DOCUMENTTYPE.find(
                y => y.documentCategoryFK === DOCUMENT_CATEGORY.FORM,
              )?.templateTypes || []
            const orderedTemplates = _.orderBy(unionFormTypes, [
              a =>
                formDocumentTypes.findIndex(
                  x => x === a.documentTemplateTypeFK,
                ),
              b => b.name,
            ])
            return (
              <Popover
                icon={null}
                trigger='click'
                placement='bottom'
                visible={this.state.openFormType}
                onVisibleChange={this.toggleVisibleChange}
                content={
                  <div className={classes.popoverContainer}>
                    <TextField
                      label='Filter Template'
                      onChange={e => {
                        this.debouncedFilterFormTemplateAction(e)
                      }}
                    />
                    <div className={classes.listContainer}>
                      {orderedTemplates.map(item => {
                        return (
                          <this.ListItem
                            key={item.formTemplateFK}
                            title={item.name}
                            classes={classes}
                            onClick={() => {
                              this.props.dispatch({
                                type: 'formListing/updateState',
                                payload: {
                                  showModal: true,
                                  type: item.value,
                                  entity: undefined,
                                  formCategory: this.props.formCategory,
                                  formName: item.name,
                                  templateContent: null,
                                  formTemplateFK: item.formTemplateFK,
                                },
                              })
                              this.toggleVisibleChange()
                            }}
                            {...item}
                          />
                        )
                      })}
                    </div>
                  </div>
                }
              >
                <Tooltip title='Add Form'>
                  <Button color='primary' style={{ margin: theme.spacing(1) }}>
                    <Add />
                    Add New
                  </Button>
                </Tooltip>
              </Popover>
            )
          }}
        </AuthorizedContext>
      </div>
    )
  }
}
export default withStyles(styles, { withTheme: true })(VisitFormGrid)
