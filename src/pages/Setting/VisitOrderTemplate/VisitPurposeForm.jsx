import React, { useState, useEffect } from 'react'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  Button,
  TextField,
  Select,
  CodeSelect,
  ProgressButton,
  LocalSearchSelect,
  Popper,
  CommonModal,
} from '@/components'
import { withFormik } from 'formik'
import { withStyles } from '@material-ui/core'

const styles = theme => ({
  VisitPurposeSelect: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(5),
    '& > h4': {
      fontWeight: 500,
    },
  },
})
function VisitPurposeForm(props) {
  let {
    footer,
    classes,
    dispatch,
    toggleModal,
    settingVisitOrderTemplate,
    showFromExistModalFun,
  } = props
  let [state, setState] = useState({
    visitPurposeOptions: [],
    selectedOption: null,
  })
  useEffect(() => {
    dispatch({
      type: 'settingVisitOrderTemplate/queryAll',
      payload: {
        // isActive: undefined,
      },
    }).then(r => {
      setState({
        ...state,
        visitPurposeOptions: r.data.data.map(item => {
          return { ...item, isActive: true }
        }),
      })
    })
  }, [])

  let handleClickAddNew = async () => {
    const { selectedOption, visitPurposeOptions } = state
    let currentEntity = visitPurposeOptions.find(
      item => item.id == selectedOption,
    )
    await dispatch({
      type: 'settingVisitOrderTemplate/generateExistingFormEntity',
      payload: {
        isExist: true,
        id: selectedOption,
      },
    })
    showFromExistModalFun(), toggleModal()
  }
  let onSelect = id => {
    setState({ ...state, selectedOption: id })
  }
  return (
    <div>
      <div>
        <GridContainer>
          <GridItem md={4} />
          <GridItem md={4} className={classes.VisitPurposeSelect}>
            <Select
              autoFocus
              label='Existing Visit Purpose'
              labelField='displayValue'
              valueField='id'
              value={state.selectedOption}
              options={state.visitPurposeOptions}
              onChange={onSelect}
              getPopupContainer={() =>
                document.getElementsByClassName(
                  'MuiDialog-container MuiDialog-scrollPaper',
                )[0]
              }
            />
          </GridItem>
          <GridItem md={4} />
        </GridContainer>
        {footer &&
          footer({
            confirmBtnText: 'Add New',
            onConfirm: handleClickAddNew,
            confirmProps: {
              disabled: !state.selectedOption,
            },
          })}
      </div>
    </div>
  )
}
export default withFormik({
  mapPropsToValues: props => {},
  handleSubmit: () => {},
})(withStyles(styles)(VisitPurposeForm))