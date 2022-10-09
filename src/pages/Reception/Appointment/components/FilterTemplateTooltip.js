import React, { useState, Fragment } from 'react'
import { connect } from 'dva'
import { compose } from 'redux'
import Delete from '@material-ui/icons/Delete'
import { withStyles, Divider } from '@material-ui/core'
import GetApp from '@material-ui/icons/GetApp'
import _ from 'lodash'
import Authorized from '@/utils/Authorized'
// custom components
import {
  GridContainer,
  GridItem,
  Select,
  ProgressButton,
  TextField,
  Popconfirm,
  notification,
  SizeContainer,
  CustomInputWrapper,
  Button,
} from '@/components'
// utils

const styles = theme => ({
  container: {
    margin: theme.spacing(2),
  },
})
const Templates = ({
  dispatch,
  theme,
  classes,
  visible = false,
  appointment: { filterTemplates },
  filterByDoctor,
  filterByApptType,
  handleFilterTemplate,
  handleApplyTemplate,
  dob = null,
}) => {
  const [templateName, setTemplateName] = useState('')

  const [selectedTemplateId, setSelectedTemplateId] = useState()

  if (!visible && selectedTemplateId) setSelectedTemplateId(null)

  const saveFilterTemplate = (
    requestDelete,
    saveAsFavorite,
    saveAsFavoriteExisted = false,
  ) => {
    let newFilterTemplates = [...filterTemplates]
    let newTemplateObj
    let newId = 1

    if (saveAsFavorite === true) {
      const favTemplateExist = newFilterTemplates.find(
        template => template.isFavorite,
      )
      if (favTemplateExist) favTemplateExist.isFavorite = false
    }

    if (selectedTemplateId) {
      const selectedTemplate = filterTemplates.find(
        template => template.id === selectedTemplateId,
      )

      newTemplateObj = {
        ...selectedTemplate,
        filterByDoctor,
        filterByApptType,
        dob,
        isDeleted: !!requestDelete,
        isFavorite: !!saveAsFavorite,
      }

      const selectedTemplateindex = filterTemplates.findIndex(
        template => template.id === selectedTemplateId,
      )
      newFilterTemplates[selectedTemplateindex] = newTemplateObj
    } else {
      const latestTemplate = _.maxBy(filterTemplates, 'id')
      if (latestTemplate) newId = latestTemplate.id + 1

      newTemplateObj = {
        id: newId,
        filterByDoctor,
        filterByApptType,
        dob,
        isFavorite: !!saveAsFavorite,
        templateName,
      }

      newFilterTemplates = [...newFilterTemplates, newTemplateObj]
    }

    newFilterTemplates = newFilterTemplates.filter(
      template => !template.isDeleted,
    )

    dispatch({
      type: 'appointment/saveFilterTemplate',
      // payload: null,
      payload: _.sortBy(newFilterTemplates, 'id'),
    }).then(r => {
      if (r) {
        if (requestDelete) {
          notification.success({
            message: `Template ${newTemplateObj.templateName} deleted`,
          })
          dispatch({
            type: 'appointment/setCurrentFilterTemplate',
            payload: {
              id: false,
            },
          })
          setSelectedTemplateId(null)
        } else if (saveAsFavoriteExisted) {
          notification.success({
            message: `Favourite template ${newTemplateObj.templateName} applied`,
          })
          setTemplateName('')
        } else {
          notification.success({
            message: `Template ${newTemplateObj.templateName} saved`,
          })
          setTemplateName('')
        }
        handleFilterTemplate()
        dispatch({
          type: 'appointment/getFilterTemplate',
        })
      }
    })
  }

  const loadTemplate = async templateId => {
    await dispatch({
      type: 'appointment/setCurrentFilterTemplate',
      payload: {
        id: templateId,
      },
    })

    const selectedTemplate = filterTemplates.find(
      template => template.id === templateId,
    )

    if (selectedTemplate) {
      handleApplyTemplate(selectedTemplate)
    }
  }

  const onTemplateSelecteChanged = (v, opt) => {
    loadTemplate(v)
    setSelectedTemplateId(v)
  }

  const onDeleteTemplate = () => {
    dispatch({
      type: 'global/updateAppState',
      payload: {
        openConfirm: true,
        openConfirmContent: 'Are you sure to delete template?',
        onConfirmSave: () => {
          saveFilterTemplate(true)
        },
        openConfirmText: 'Confirm',
        onConfirmClose: () => {
          dispatch({
            type: 'global/updateAppState',
            payload: {
              openConfirm: false,
            },
          })
        },
      },
    })
    handleFilterTemplate()
  }
  return (
    <SizeContainer size='sm'>
      <div>
        <Authorized authority='appointment.viewotherappointment'>
          <GridContainer gutter={0}>
            <GridItem xs={12}>
              <h5 style={{ fontWeight: 500, lineHeight: 1.3 }}>
                Manage Filter Template
              </h5>
            </GridItem>
            <GridItem xs={8}>
              <Select
                label='My Filter Template'
                strongLabel
                value={selectedTemplateId}
                options={filterTemplates}
                valueField='id'
                labelField='templateName'
                dropdownMatchSelectWidth={false}
                onChange={onTemplateSelecteChanged}
                renderDropdown={o => {
                  return (
                    <span>
                      <font color='red'>{o.isFavorite ? ' * ' : ''}</font>
                      {o.templateName}
                    </span>
                  )
                }}
              />
            </GridItem>
          </GridContainer>
        </Authorized>

        {selectedTemplateId && (
          <GridContainer gutter={0} style={{ marginTop: 10 }}>
            <GridItem xs={12}>
              {false && (
                <ProgressButton onClick={() => saveFilterTemplate()}>
                  Replace
                </ProgressButton>
              )}

              <Button color='danger' onClick={onDeleteTemplate}>
                <Delete />
                Delete
              </Button>
              <ProgressButton
                onClick={() => {
                  saveFilterTemplate(false, true, true)
                }}
                hidden={
                  filterTemplates.find(
                    template => template.id === selectedTemplateId,
                  )?.isFavorite
                }
              >
                Save as My Favourite
              </ProgressButton>
            </GridItem>
          </GridContainer>
        )}
        {!selectedTemplateId && (
          <Fragment>
            <GridContainer
              gutter={0}
              style={{
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(1),
              }}
            >
              <GridItem xs={12}>
                <h5 style={{ fontWeight: 500, lineHeight: 1.3 }}>
                  Add New Filter Template
                </h5>
              </GridItem>
              <GridItem xs={8}>
                <TextField
                  label='Filter Template Name'
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                />
              </GridItem>
              <GridItem
                xs={4}
                alignItems='flex-end'
                justify='flex-end'
                container
              >
                <ProgressButton
                  onClick={() => saveFilterTemplate()}
                  disabled={
                    templateName.length === 0 ||
                    filterTemplates.length >= 7 ||
                    (filterByDoctor.length === 0 &&
                      filterByApptType.length === 0)
                  }
                >
                  Save
                </ProgressButton>
              </GridItem>
            </GridContainer>

            <Divider light />
            <div className={classes.fabDiv}>
              <h5
                style={{
                  fontWeight: 500,
                  lineHeight: 1.3,
                  position: 'absolute',
                }}
              >
                Manage Filter Value
              </h5>
              <CustomInputWrapper
                label=''
                style={{ paddingTop: 25 }}
                strongLabel
                labelProps={{
                  shrink: true,
                }}
              >
                <ProgressButton
                  style={{ margin: theme.spacing(1, 0) }}
                  onClick={() => {
                    saveFilterTemplate(false, true)
                  }}
                  disabled={
                    templateName.length === 0 ||
                    (filterByDoctor.length === 0 &&
                      filterByApptType.length === 0)
                  }
                >
                  Save as My Favourite
                </ProgressButton>
                <ul
                  style={{
                    listStyle: 'square',
                    paddingLeft: 16,
                    fontSize: 'smaller',
                  }}
                >
                  <li>
                    <p>
                      Save current filter value as my favourite(
                      <font color='red'>*</font>).
                    </p>
                  </li>
                  <li>
                    <p>
                      System will use favourite filter value on calendar by
                      default.
                    </p>
                  </li>
                </ul>
              </CustomInputWrapper>
            </div>
          </Fragment>
        )}
      </div>
    </SizeContainer>
  )
}

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(({ appointment }) => ({
    appointment,
  })),
)(Templates)
