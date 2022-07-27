import React, { PureComponent, useCallback, useState } from 'react'
import { connect } from 'dva'
import moment from 'moment'
import { primaryColor } from 'mui-pro-jss'
import color from 'color'
import withStyles from '@material-ui/core/styles/withStyles'
import { Delete, Edit, Print, Add } from '@material-ui/icons'
import { formTypes, formStatus } from '@/utils/codes'
import { download } from '@/utils/request'
import { commonDataReaderTransform } from '@/utils/utils'
import Yup from '@/utils/yup'
import VoidWithPopover from './VoidWithPopover'
import Authorized from '@/utils/Authorized'
import {
  DOCUMENT_CATEGORY,
  DOCUMENTCATEGORY_DOCUMENTTYPE,
} from '@/utils/constants'

import {
  CommonTableGrid,
  Button,
  CommonModal,
  Popconfirm,
  notification,
  withFormikExtend,
  AuthorizedContext,
  TextField,
  Danger,
  Popover,
  Checkbox,
  Tooltip,
  DocumentEditor,
} from '@/components'
import AddForm from './AddForm'
import { FORM_CATEGORY } from '@/utils/constants'

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
export const printRow = async (row, props) => {
  const type = formTypes.find(
    o => o.value === row.type || o.name === row.type || o.code === row.type,
  )
  const { downloadConfig } = type
  if (!downloadConfig) {
    notification.error({ message: 'No configuration found' })
    return
  }
  // return
  if (row.id) {
    download(
      `/api/Reports/${downloadConfig.id}?ReportFormat=pdf&ReportParameters={${downloadConfig.key}:${row.id},"FormCategory":"CORForm"}`,
      {
        type: 'pdf',
      },
    )
  } else {
    download(
      `/api/Reports/${downloadConfig.id}?ReportFormat=pdf`,
      {
        type: 'pdf',
      },
      {
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        data: {
          reportContent: JSON.stringify(
            commonDataReaderTransform(downloadConfig.draft(row)),
          ),
        },
      },
    )
  }
}

export const viewReport = (row, props) => {
  const type = formTypes.find(
    o => o.value === row.type || o.name === row.type || o.code === row.type,
  )
  const { downloadConfig } = type
  if (!downloadConfig) {
    notification.error({ message: 'No configuration found' })
    return false
  }

  const { codetable, patient } = props
  const { clinicianprofile = [] } = codetable
  const { entity } = patient
  const obj =
    clinicianprofile.find(
      o =>
        o.userProfileFK ===
        (row.issuedByUserFK ? row.issuedByUserFK : row.referredByUserFK),
    ) || {}

  const reportParameters = { ...row }
  reportParameters.doctorName = (obj.title ? `${obj.title} ` : '') + obj.name
  reportParameters.doctorMCRNo = obj.doctorProfile
    ? obj.doctorProfile.doctorMCRNo
    : ''

  reportParameters.patientName = entity.name
  reportParameters.patientAccountNo = entity.patientAccountNo
  window.g_app._store.dispatch({
    type: 'report/updateState',
    payload: {
      reportTypeID: downloadConfig.id,
      reportParameters: {
        isSaved: false,
        reportContent: JSON.stringify(
          commonDataReaderTransform(downloadConfig.draft(reportParameters)),
        ),
      },
    },
  })

  return true
}

@connect(({ forms, codetable, patient, consultation, user, formListing }) => ({
  forms,
  codetable,
  patient,
  consultation,
  user,
  formListing,
}))
@withFormikExtend({
  mapPropsToValues: ({ consultation }) => {
    const _values = consultation.entity || consultation.default
    return _values
  },
  validationSchema: Yup.object().shape({}),

  handleSubmit: (values, { props }) => {
    const { onSave } = props
    if (onSave) onSave(values)
  },
  displayName: 'Forms',
})
class Forms extends PureComponent {
  componentWillMount() {}

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

  toggleModal = () => {
    const { forms } = this.props
    const { showModal } = forms
    this.props.dispatch({
      type: 'forms/updateState',
      payload: {
        showModal: !showModal,
      },
    })
  }

  editRow = row => {
    const { isEnableEditOrder = true, forms:{rows = []} } = this.props
    if (!isEnableEditOrder) return
    row = rows.find(r=>r.uid == row.uid)
    if (row.statusFK === 4) return
    this.props.dispatch({
      type: 'forms/updateState',
      payload: {
        entity: row,
        type: row.type,
      },
    })
    this.toggleModal()
  }

  handleViewReport = uid => {
    const { forms } = this.props
    const { rows } = forms
    viewReport(
      rows.find(item => item.uid === uid),
      this.props,
    )
  }

  toggleVisibleChange = async () => {
    const { dispatch, formListing } = this.props
    const { formTemplates = [] } = formListing
    if (formTemplates.length == 0) {
      await dispatch({
        type: 'formListing/initState',
        payload: { formCategory: FORM_CATEGORY.CORFORM },
      }).then(r => {
        this.setState(ps => {
          return {
            ...ps,
            openFormType: !ps.openFormType,
          }
        })
      })
    } else {
      this.setState(ps => {
        return {
          ...ps,
          openFormType: !ps.openFormType,
        }
      })
    }
  }

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

  VoidForm = ({ classes, dispatch, row, user }) => {
    const [reason, setReason] = useState(undefined)

    const handleConfirmDelete = useCallback((i, voidVisibleChange) => {
      if (reason) {
        voidVisibleChange()
        dispatch({
          type: 'forms/voidRow',
          payload: {
            id: row.uid,
            voidReason: reason,
            statusFK: 4,
            voidDate: moment(),
            voidByUserFK: user.data.clinicianProfile.id,
          },
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

  printRow = row => {
    DocumentEditor.print({
      documentName: row.formName,
      document: row.formData.content,
    })
  }

  getFormAccessRight = () => {
    const { isEnableEditOrder = true } = this.props
    let right = Authorized.check('queue.consultation.form') || {
      rights: 'hidden',
    }
    if (right.rights === 'enable' && !isEnableEditOrder) {
      right = { rights: 'disable' }
    }
    return right
  }

  render() {
    const {
      forms,
      dispatch,
      theme,
      classes,
      setFieldValue,
      user,
      formListing: { formTemplates = [] },
    } = this.props
    const { showModal } = forms
    const { rows = [] } = forms

    const modifyAR = Authorized.check('queue.consultation.form.modify')
    const voidAR = Authorized.check('queue.consultation.form.void')

    const isHiddenModify = modifyAR && modifyAR.rights !== 'enable'
    const isHiddenVoid = voidAR && voidAR.rights !== 'enable'

    let unionFormTypes = formTemplates //formTypes.concat(formTemplates)
    unionFormTypes = this.state.filterFormTemplate
      ? unionFormTypes.filter(
          x =>
            x.name
              .toUpperCase()
              .indexOf(this.state.filterFormTemplate.toUpperCase()) >= 0,
        )
      : unionFormTypes
    const formDocumentTypes =
      DOCUMENTCATEGORY_DOCUMENTTYPE.find(
        y => y.documentCategoryFK === DOCUMENT_CATEGORY.FORM,
      )?.templateTypes || []
    const orderedTemplates = _.orderBy(unionFormTypes, [
      a => formDocumentTypes.findIndex(x => x === a.documentTemplateTypeFK),
      b => b.name,
    ])
    return (
      <div>
        <Checkbox
          style={{ marginLeft: 10 }}
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
          getRowId={r => r.uid}
          size='sm'
          style={{ margin: 0 }}
          rows={
            this.state.includeVoidForms
              ? rows
              : rows.filter(o => o.statusFK !== 4)
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
                // this.handleViewReport(row.uid)
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
              align: 'left',
              columnName: 'action',
              width: 110,
              render: row => {
                return (
                  <React.Fragment>
                    <Tooltip title='Print'>
                      <Button
                        size='sm'
                        onClick={() => {
                          // printRow(row, this.props)
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
                      <AuthorizedContext.Provider
                        value={this.getFormAccessRight()}
                      >
                        <Tooltip title='Edit'>
                          <Button
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
                      </AuthorizedContext.Provider>
                    )}
                    {row.statusFK === 1 && !isHiddenModify && (
                      <AuthorizedContext.Provider
                        value={this.getFormAccessRight()}
                      >
                        <Popconfirm
                          onConfirm={() =>
                            dispatch({
                              type: 'forms/deleteRow',
                              payload: {
                                id: row.uid,
                              },
                            })
                          }
                        >
                          <Tooltip title='Delete'>
                            <Button size='sm' color='danger' justIcon>
                              <Delete />
                            </Button>
                          </Tooltip>
                        </Popconfirm>
                      </AuthorizedContext.Provider>
                    )}
                    {row.statusFK === 2 && !isHiddenVoid && (
                      <AuthorizedContext.Provider
                        value={this.getFormAccessRight()}
                      >
                        <this.VoidForm
                          classes={setFieldValue}
                          dispatch={dispatch}
                          row={row}
                          user={user}
                        />
                      </AuthorizedContext.Provider>
                    )}
                  </React.Fragment>
                )
              },
            },
          ]}
        />
        <AuthorizedContext.Provider
          value={{
            rights:
              this.getFormAccessRight()?.rights !== 'enable'
                ? 'hidden'
                : 'enable',
          }}
        >
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
                          dispatch({
                            type: 'forms/updateState',
                            payload: {
                              showModal: true,
                              type: item.value,
                              entity: undefined,
                              formCategory: FORM_CATEGORY.CORFORM,
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
        </AuthorizedContext.Provider>
        <CommonModal
          open={showModal}
          title='Add Form'
          onClose={this.toggleModal}
          onConfirm={this.toggleModal}
          observe='Form'
          maxWidth='lg'
          bodyNoPadding
        >
          <AddForm {...this.props} types={formTypes} />
        </CommonModal>
      </div>
    )
  }
}
export default withStyles(styles, { withTheme: true })(Forms)
