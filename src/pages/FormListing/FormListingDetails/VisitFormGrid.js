import React, { PureComponent, useCallback, useState } from 'react'
import { primaryColor } from 'mui-pro-jss'
import color from 'color'
import withStyles from '@material-ui/core/styles/withStyles'
import { Tooltip } from '@material-ui/core'
import { Delete, Edit, Print, Add } from '@material-ui/icons'
import { FORM_CATEGORY } from '@/utils/constants'
import { formTypes, formStatus } from '@/utils/codes'
import VoidWithPopover from './FormDetail/VoidWithPopover'

import {
  CommonTableGrid,
  Button,
  Popconfirm,
  AuthorizedContext,
  TextField,
  Danger,
  Popover,
  Checkbox,
} from '@/components'

const styles = (theme) => ({
  item: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',

    '&:hover': {
      background: color(primaryColor).lighten(0.9).hex(),
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

  popoverContainer: {
    width: 200,
    textAlign: 'left',
  },
  listContainer: {
    maxHeight: 300,
    overflowY: 'auto',
  },
})

class VisitFormGrid extends PureComponent {
  constructor (props) {
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
    this.setState((ps) => {
      return {
        openFormType: !ps.openFormType,
      }
    })

  ListItem = ({ classes, title, onClick }) => {
    return (
      <Tooltip title={title} style={{ pidding: 0 }}>
        <div className={classes.item} onClick={onClick}>
          <span>{title}</span>
        </div>
      </Tooltip>
    )
  }

  editRow = (row) => {
    const { formListing } = this.props
    const { visitDetail = {} } = formListing
    let { isCanEditForms = false } = visitDetail
    if (row.statusFK === 3 || row.statusFK === 4 || !isCanEditForms) return
    this.props.dispatch({
      type: 'formListing/updateState',
      payload: {
        showModal: true,
        entity: row,
        type: row.type,
        formCategory: this.props.formCategory,
        formFrom: this.props.formFrom,
      },
    })
  }

  VoidForm = ({ classes, dispatch, row }) => {
    const [
      reason,
      setReason,
    ] = useState(undefined)

    const handleConfirmDelete = useCallback((i, voidVisibleChange) => {
      if (reason) {
        const { formCategory, formListing } = this.props
        let voidData = [
          {
            ...row,
            formData: JSON.stringify(row.formData),
            voidReason: reason,
            statusFK: 4,
          },
        ]
        let formType =
          formCategory === FORM_CATEGORY.VISITFORM ? 'VisitForm' : 'CORForm'
        voidVisibleChange()
        dispatch({
          type: 'formListing/saveForm',
          payload: {
            visitID: formListing.visitID,
            currentCORId: row.clinicalObjectRecordFK,
            formType,
            UpdateType: row.type,
            visitLetterOfCertification:
              formCategory === FORM_CATEGORY.VISITFORM ? voidData : [],
            CORLetterOfCertification:
              formCategory === FORM_CATEGORY.CORFORM ? voidData : [],
          },
        }).then(() => {
          this.props.queryFormListing()
        })
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
              onChange={(e) => {
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

  render () {
    const { formListing, dispatch, theme, classes, setFieldValue } = this.props
    const { list, visitDetail = {} } = formListing
    let { isCanEditForms = false } = visitDetail
    return (
      <div>
        <Checkbox
          label='Include void forms'
          value={this.state.includeVoidForms}
          onChange={() => {
            this.setState((ps) => {
              return {
                ...ps,
                includeVoidForms: !ps.includeVoidForms,
              }
            })
          }}
        />
        <CommonTableGrid
          getRowId={(r) => r.uid}
          size='sm'
          style={{ margin: 0 }}
          rows={
            this.state.includeVoidForms ? (
              list
            ) : (
              list.filter((o) => o.statusFK !== 4)
            )
          }
          onRowDoubleClick={this.editRow}
          columns={[
            { name: 'typeName', title: 'Type' },
            { name: 'updateByUser', title: 'Last Update By' },
            { name: 'statusFK', title: 'Status' },
            { name: 'action', title: 'Action' },
          ]}
          FuncProps={{ pager: false }}
          columnExtensions={[
            {
              columnName: 'typeName',
              type: 'link',
              linkField: 'href',
              onClick: (row) => {
                this.viewReport(row)
              },
            },
            {
              columnName: 'updateByUser',
            },
            {
              columnName: 'statusFK',
              type: 'select',
              options: formStatus,
            },
            {
              columnName: 'action',
              width: 110,
              render: (row) => {
                return (
                  <React.Fragment>
                    <Tooltip title='Print'>
                      <Button
                        disabled={!isCanEditForms}
                        size='sm'
                        onClick={() => {
                          this.props.printRow(row)
                        }}
                        justIcon
                        color='primary'
                        style={{ marginRight: 5 }}
                      >
                        <Print />
                      </Button>
                    </Tooltip>
                    {(row.statusFK === 1 || row.statusFK === 2) && (
                      <Tooltip title='Edit'>
                        <Button
                          disabled={!isCanEditForms}
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
                    {(row.statusFK === 1 || row.statusFK === 2) && (
                      <Popconfirm
                        onConfirm={() => {
                          const { formCategory } = this.props
                          let deleteData = [
                            {
                              ...row,
                              formData: JSON.stringify(row.formData),
                              isDeleted: true,
                            },
                          ]
                          let formType =
                            formCategory === FORM_CATEGORY.VISITFORM
                              ? 'VisitForm'
                              : 'CORForm'
                          dispatch({
                            type: 'formListing/saveForm',
                            payload: {
                              visitID: formListing.visitID,
                              currentCORId: row.clinicalObjectRecordFK,
                              formType,
                              UpdateType: row.type,
                              visitLetterOfCertification:
                                formCategory === FORM_CATEGORY.VISITFORM
                                  ? deleteData
                                  : [],
                              CORLetterOfCertification:
                                formCategory === FORM_CATEGORY.CORFORM
                                  ? deleteData
                                  : [],
                            },
                          }).then(() => {
                            this.props.queryFormListing()
                          })
                        }}
                      >
                        <Tooltip title='Delete'>
                          <Button
                            disabled={!isCanEditForms}
                            size='sm'
                            color='danger'
                            justIcon
                          >
                            <Delete />
                          </Button>
                        </Tooltip>
                      </Popconfirm>
                    )}
                    {row.statusFK === 3 && (
                      <this.VoidForm
                        classes={setFieldValue}
                        dispatch={dispatch}
                        row={row}
                      />
                    )}
                  </React.Fragment>
                )
              },
            },
          ]}
        />
        <AuthorizedContext>
          {(r) => {
            if ((r && r.rights !== 'enable') || !isCanEditForms) return null

            return (
              <Popover
                icon={null}
                trigger='click'
                placement='bottom'
                visible={this.state.openFormType}
                onVisibleChange={this.toggleVisibleChange}
                content={
                  <div className={classes.popoverContainer}>
                    <div className={classes.listContainer}>
                      {formTypes.map((item) => {
                        return (
                          <this.ListItem
                            key={item.value}
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
                  <Tooltip title='Add Form'>
                    <Button
                      color='primary'
                      style={{ margin: theme.spacing(1) }}
                    >
                      <Add />
                      Add New
                    </Button>
                  </Tooltip>
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
